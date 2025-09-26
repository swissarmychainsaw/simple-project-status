// lib/google/parseGoogleDocHtml.ts
// Robust Google Doc HTML splitter that recognizes:
// - Real <h1>..<h6> headings
// - "Heading-like" <p> blocks where the visible text is bold-only and short
// - Exact labels you care about (Executive Summary, Key Decisions, Risks & Mitigation Plan, etc.)
//
// Exports BOTH default and named (parseGoogleDocHtml) to avoid import mismatch.

export type SectionMap = {
  executiveSummaryHtml?: string;
  highlightsHtml?: string;
  milestonesHtml?: string;
  keyDecisionsHtml?: string;
  risksHtml?: string;
};

type CanonicalKey = keyof SectionMap;

function stripTags(s: string): string {
  return String(s ?? "").replace(/<[^>]*>/g, "");
}

function decodeEntities(s: string): string {
  return String(s ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;|&#38;|&#x26;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function visibleText(s: string): string {
  // remove tags, decode entities, normalize whitespace and punctuation
  return decodeEntities(stripTags(s))
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normText(s: string): string {
  return visibleText(s).toLowerCase();
}

function isLikelyBoldOnlyParagraph(html: string): boolean {
  // Quick & permissive check: contains <p>...</p> and at least one 'bold' style or <b>/<strong>
  const hasP = /<p\b[^>]*>[\s\S]*<\/p>/i.test(html);
  if (!hasP) return false;

  // common bold indicators in export: <b>, <strong>, style="font-weight:700|bold"
  const boldish =
    /<(b|strong)\b/i.test(html) ||
    /font-weight\s*:\s*(700|bold)/i.test(html);

  return !!boldish;
}

function headingToKey(label: string): CanonicalKey | null {
  const n = normText(label);

  // Exact labels you care about
  if (n === "executive summary") return "executiveSummaryHtml";
  if (n === "key decisions") return "keyDecisionsHtml";
  if (n === "risks & mitigation plan" || n === "risks and mitigation plan") return "risksHtml";

  // Optional alternates
  if (n === "highlights / accomplishments" || n === "highlights") return "highlightsHtml";
  if (n === "upcoming milestones" || n === "milestones") return "milestonesHtml";

  return null;
}

type FoundHead = { start: number; end: number; label: string };

/**
 * Collect heading candidates:
 *  1) Real H1..H6 tags
 *  2) Bold-only <p> blocks where the *visible text* exactly matches a known heading
 */
function collectHeadings(html: string): FoundHead[] {
  const out: FoundHead[] = [];

  // 1) H1..H6
  const H_RE = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = H_RE.exec(html)) !== null) {
    const full = String(m[0] ?? "");
    const inner = String(m[2] ?? "");
    const label = visibleText(inner);
    if (headingToKey(label)) {
      out.push({ start: m.index, end: m.index + full.length, label });
    }
  }

  // 2) Bold-only paragraph headings (Google Docs often does this)
  //    We match <p...>...</p> and look at the *visible text*; if it equals one of our known labels
  //    AND the paragraph looks "boldish", treat it as a heading.
  const P_RE = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  while ((m = P_RE.exec(html)) !== null) {
    const full = String(m[0] ?? "");
    const inner = String(m[1] ?? "");
    const label = visibleText(inner);

    // Skip long paragraphs; headings are typically short
    if (label.length === 0 || label.length > 120) continue;

    if (headingToKey(label) && isLikelyBoldOnlyParagraph(full)) {
      out.push({ start: m.index, end: m.index + full.length, label });
    }
  }

  // Sort by position and dedupe by start
  out.sort((a, b) => a.start - b.start);
  const dedup: FoundHead[] = [];
  let lastStart = -1;
  for (const h of out) {
    if (h.start !== lastStart) {
      dedup.push(h);
      lastStart = h.start;
    }
  }
  return dedup;
}

/**
 * Split exported Google Doc HTML into sections keyed by canonical headings.
 */
function _parseGoogleDocHtml(html: string): SectionMap {
  const out: SectionMap = {};
  if (typeof html !== "string" || html.trim() === "") {
    console.warn("[parseGoogleDocHtml] empty html input");
    return out;
  }

  const heads = collectHeadings(html);
  if (heads.length === 0) {
    console.warn("[parseGoogleDocHtml] no headings detected; treating entire doc as Executive Summary");
    out.executiveSummaryHtml = html.trim();
    return out;
  }

  for (let i = 0; i < heads.length; i++) {
    const cur = heads[i]!;
    const nextStart = i + 1 < heads.length ? heads[i + 1]!.start : html.length;
    const body = html.slice(cur.end, nextStart).trim();
    if (!body) continue;

    const key = headingToKey(cur.label);
    if (!key) continue;

    out[key] = out[key]
      ? out[key]! + (out[key]!.endsWith("</p>") ? "" : "<br/>") + body
      : body;

    console.debug(
      "[parseGoogleDocHtml] mapped:",
      key,
      "len:",
      body.length,
      "label:",
      visibleText(cur.label).slice(0, 80)
    );
  }

  console.info("[parseGoogleDocHtml] done. keys:", Object.keys(out));
  return out;
}

export const parseGoogleDocHtml = _parseGoogleDocHtml;
export default _parseGoogleDocHtml;

