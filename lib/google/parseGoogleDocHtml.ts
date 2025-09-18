// lib/google/parseGoogleDocHtml.ts

/**
 * Very lightweight HTML section parser for Google Doc exports.
 * We keep the original HTML markup (bold/italic/underline, bullets, tables).
 *
 * Heuristics:
 * - Find headings containing (case-insensitive):
 *   "Executive summary", "Highlights", "Milestones"
 * - A section is content from its heading to the next recognized heading or end.
 * - If a heading doesn't exist, the field will be empty.
 */
export function parseGoogleDocHtml(html: string): {
  executiveSummaryHtml: string;
  highlightsHtml: string;
  milestonesHtml: string;
} {
  // Normalize whitespace a bit to help regex without destroying tags
  const src = html.replace(/\r/g, "");

  // Capture heading tags (h1-h4) + content lazily until next heading or end
  const sections = sliceByHeadings(src, [
    /executive\s*summary/i,
    /highlights?/i,
    /milestones?/i,
  ]);

  const executiveSummaryHtml = sections.find((s) => /executive\s*summary/i.test(s.heading))?.html ?? "";
  const highlightsHtml = sections.find((s) => /highlights?/i.test(s.heading))?.html ?? "";
  const milestonesHtml = sections.find((s) => /milestones?/i.test(s.heading))?.html ?? "";

  return { executiveSummaryHtml, highlightsHtml, milestonesHtml };
}

function sliceByHeadings(
  html: string,
  wanted: RegExp[]
): Array<{ heading: string; html: string }> {
  // Match any H1..H4 with their innerText (strip tags later)
  const headingRegex = /<(h[1-4])[^>]*>(.*?)<\/\1>/gims;

  type Hit = { idx: number; tag: string; raw: string; inner: string };
  const hits: Hit[] = [];
  let m: RegExpExecArray | null = null;
  while ((m = headingRegex.exec(html))) {
    hits.push({
      idx: m.index,
      tag: m[1],
      raw: m[0],
      inner: stripTags(m[2]).trim(),
    });
  }
  if (hits.length === 0) return [];

  // Build ranges: each heading to next heading (or end)
  const ranges: Array<{ start: number; end: number; heading: string }> = [];
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].idx;
    const end = i + 1 < hits.length ? hits[i + 1].idx : html.length;
    ranges.push({ start, end, heading: hits[i].inner });
  }

  // Pull only ranges that match the wanted headings
  const out: Array<{ heading: string; html: string }> = [];
  for (const r of ranges) {
    const wantedMatch = wanted.some((re) => re.test(r.heading));
    if (!wantedMatch) continue;

    // Extract the slice minus the heading tag itself
    const block = html.slice(r.start, r.end);
    const withoutHeading = block.replace(/^(.*?)<\/h[1-4]>/is, "").trim();
    out.push({ heading: r.heading, html: sanitizeGoogleExport(withoutHeading) });
  }
  return out;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

/**
 * Minimal cleanup for Google export HTML:
 * - Remove meta/style blocks that occasionally slip into section slices.
 * - Keep <b>/<strong>, <i>/<em>, <u>, <ul>/<ol>/<li>, <p>, <table>/<tr>/<td>, <a>, <br>, <span>
 */
function sanitizeGoogleExport(s: string): string {
  // Drop head/meta/style fragments if included
  s = s.replace(/<!DOCTYPE[^>]*>/gi, "");
  s = s.replace(/<head[\s\S]*?<\/head>/gi, "");
  s = s.replace(/<meta[^>]*>/gi, "");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  // Remove empty paragraphs/spans commonly produced
  s = s.replace(/<p>\s*<\/p>/gi, "");
  s = s.replace(/<span>\s*<\/span>/gi, "");
  return s.trim();
}

