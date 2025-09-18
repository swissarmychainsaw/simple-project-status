// lib/google/parseGoogleDocHtml.ts
import { load } from "cheerio";

/**
 * Google Doc HTML → section HTML (rich).
 * Walks the DOM and captures everything between section headings (H1–H6)
 * and the next heading, preserving formatting (lists, tables, bold/italic, links).
 *
 * Headings matched (case-insensitive):
 *  - Executive Summary (also “Exec Summary”, “Summary”)
 *  - Highlights
 *  - Milestones
 *  - Key Decisions (also “Decisions”, “Decision Log”, “Decisions & Actions”)
 *  - Risks (also “Top Risks”, “Risks & Issue Mitigation Plan”, “Mitigation Plan”)
 *  - Resources (also “Links”, “References”)
 */
export function parseGoogleDocHtml(html: string): {
  executiveSummaryHtml: string;
  highlightsHtml: string;
  milestonesHtml: string;
  keyDecisionsHtml: string;
  risksHtml: string;
  resourcesHtml: string;
} {
  const out = blankOut();
  if (!html) return out;

  // Load full HTML; keep entities and inline styles as-is.
  const $ = load(html, { decodeEntities: false });

  // We’ll linearize the document into block nodes. Include containers that can
  // hold meaningful content (paragraphs, lists, tables, divs) and headings.
  const BLOCKS = "h1,h2,h3,h4,h5,h6,p,div,ul,ol,table";

  const blocks = $("body")
    .find(BLOCKS)
    .toArray()
    .map((el) => {
      const tag = el.tagName.toLowerCase();
      const text = normalize($(el).text());
      const htmlOuter = $.html(el); // includes wrapper tag
      return { el, tag, text, htmlOuter };
    });

  // Define sections + heading synonyms
  type Key =
    | "executiveSummaryHtml"
    | "highlightsHtml"
    | "milestonesHtml"
    | "keyDecisionsHtml"
    | "risksHtml"
    | "resourcesHtml";

  const targets: Array<{ key: Key; names: string[] }> = [
    { key: "executiveSummaryHtml", names: ["executive summary", "exec summary", "summary"] },
    { key: "highlightsHtml",       names: ["highlights", "highlight"] },
    { key: "milestonesHtml",       names: ["milestones", "milestone"] },
    { key: "keyDecisionsHtml",     names: ["key decisions", "decisions", "decision log", "decisions and actions", "decisions & actions"] },
    { key: "risksHtml",            names: ["risks", "top risks", "risks & issue mitigation plan", "risk & issue mitigation plan", "mitigation plan"] },
    { key: "resourcesHtml",        names: ["resources", "links", "references"] },
  ];

  // Find heading indices (prefer actual H1–H6; ignore P/DIV matches to avoid false positives)
  const headingIdx: Array<{ idx: number; key: Key }> = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (!/^h[1-6]$/.test(b.tag)) continue; // your doc uses H1 for section titles
    const match = targets.find((t) => matchesHeading(b.text, t.names));
    if (match) headingIdx.push({ idx: i, key: match.key });
  }
  if (headingIdx.length === 0) return out; // nothing matched

  // For each heading, capture content until next heading
  for (let i = 0; i < headingIdx.length; i++) {
    const cur = headingIdx[i];
    const next = i + 1 < headingIdx.length ? headingIdx[i + 1].idx : blocks.length;

    const parts: string[] = [];
    for (let j = cur.idx + 1; j < next; j++) {
      // Skip empty/whitespace-only nodes after sanitization
      const chunk = sanitize(blocks[j].htmlOuter);
      if (hasMeaningfulText(chunk)) parts.push(chunk);
    }

    (out as any)[cur.key] = parts.join("");
  }

  return out;
}

/* ---------------- helpers ---------------- */

function blankOut() {
  return {
    executiveSummaryHtml: "",
    highlightsHtml: "",
    milestonesHtml: "",
    keyDecisionsHtml: "",
    risksHtml: "",
    resourcesHtml: "",
  };
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\r/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, " and ")
    .replace(/[\u2013\u2014]/g, "-") // en/em dash → hyphen
    .replace(/\s+/g, " ")
    .trim();
}

function matchesHeading(textNorm: string, names: string[]): boolean {
  // Allow exact match or match with trailing punctuation (":" or "—" or "-").
  return names.some((n) => {
    const t = normalize(n);
    return (
      textNorm === t ||
      textNorm === `${t}:` ||
      textNorm === `${t}-` ||
      textNorm === `${t} —` ||
      textNorm.startsWith(`${t}: `) ||
      textNorm.startsWith(`${t} - `) ||
      textNorm.startsWith(`${t} — `)
    );
  });
}

function sanitize(s: string): string {
  // Remove head/meta/style (occasionally present in export slices), and empty wrappers.
  let out = s
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<meta[^>]*>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  // Remove fully empty paragraphs/divs/lists/tables that Google sometimes emits
  out = out.replace(/<(p|div)>\s*<\/\1>/gi, "");
  out = out.replace(/<(ul|ol)>\s*<\/\1>/gi, "");
  out = out.replace(/<table>\s*<\/table>/gi, "");
  return out.trim();
}

function hasMeaningfulText(html: string): boolean {
  const txt = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return txt.length > 0;
}

