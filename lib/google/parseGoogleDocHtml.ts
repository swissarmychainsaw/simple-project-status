// lib/google/parseGoogleDocHtml.ts
// Drop-in parser for Google Doc exported HTML.
// - Splits by <h1>…</h1> sections
// - Preserves inner HTML formatting of each section
// - Maps headings to your known form keys
//
// Returns an object with keys:
//   executiveSummaryHtml, highlightsHtml, milestonesHtml,
//   keyDecisionsHtml, risksHtml
//
// Exports BOTH named and default.

export type ParsedSections = {
  executiveSummaryHtml?: string;
  highlightsHtml?: string;
  milestonesHtml?: string;
  keyDecisionsHtml?: string;
  risksHtml?: string;
};

function textOnly(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeHeading(s: string): string {
  const t = s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t;
}

function headingToKey(h: string): keyof ParsedSections | undefined {
  const n = normalizeHeading(h);

  // Exact/straightforward matches first
  if (n === "executive summary") return "executiveSummaryHtml";
  if (n === "highlights" || n === "highlights accomplishments" || n === "top accomplishments")
    return "highlightsHtml";
  if (n === "milestones" || n === "upcoming milestones") return "milestonesHtml";
  if (n === "key decisions" || n === "decisions") return "keyDecisionsHtml";
  if (n === "risks" || n === "risks and issue mitigation plan" || n === "risk and issue mitigation plan")
    return "risksHtml";

  // Fallbacks: contains checks (kept minimal; you said no fancy handling needed)
  if (n.includes("executive") && n.includes("summary")) return "executiveSummaryHtml";
  if (n.includes("highlight") || n.includes("accomplishment")) return "highlightsHtml";
  if (n.includes("milestone")) return "milestonesHtml";
  if (n.includes("decision")) return "keyDecisionsHtml";
  if (n.includes("risk")) return "risksHtml";

  return undefined;
}

/**
 * Parse Google Doc export HTML into section HTMLs keyed by known headings.
 */
export function parseGoogleDocHtml(html: string | undefined | null): ParsedSections {
  const out: ParsedSections = {};
  if (!html) return out;

  const src = String(html);

  // Find all H1s with their positions
  const h1Re = /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi;
  const heads: { start: number; end: number; labelHtml: string; labelText: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = h1Re.exec(src))) {
    const labelHtml = m[1];
    const labelText = textOnly(labelHtml);
    heads.push({
      start: m.index,
      end: m.index + m[0].length,
      labelHtml,
      labelText,
    });
  }

  if (heads.length === 0) {
    // No H1s found — nothing to do (don’t try to be clever per your note)
    return out;
  }

  // Slice content between each H1 and the next H1 (or end of doc)
  for (let i = 0; i < heads.length; i++) {
    const cur = heads[i];
    const next = heads[i + 1];
    const contentStart = cur.end;
    const contentEnd = next ? next.start : src.length;
    const sectionHtml = src.slice(contentStart, contentEnd).trim();

    const key = headingToKey(cur.labelText);
    if (!key) continue;

    // Keep the HTML as-is; the email builder will do gentle cleanup/normalization
    if (!out[key]) {
      out[key] = sectionHtml;
    }
  }

  return out;
}

export default parseGoogleDocHtml;

