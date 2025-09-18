// lib/google/parseGoogleDocHtml.ts
export function parseGoogleDocHtml(html: string): {
  executiveSummaryHtml: string;
  highlightsHtml: string;
  milestonesHtml: string;
  keyDecisionsHtml: string;
  risksHtml: string;
  resourcesHtml: string;
} {
  const src = (html || "").replace(/\r/g, "");

  const wanted = [
    { key: "executiveSummaryHtml", re: /\b(executive\s*summary|summary)\b/i },
    { key: "highlightsHtml",       re: /\bhighlights?\b/i },
    { key: "milestonesHtml",       re: /\bmilestones?\b/i },
    // Expanded: catch "Key Decisions", "Decisions", "Decision Log", "Decisions & Actions"
    { key: "keyDecisionsHtml",     re: /\b(key\s*decisions?|decisions?\s*(?:&\s*actions?)?|decision\s*log)\b/i },
    { key: "risksHtml",            re: /\b(risks?|top\s*risks?)\b/i },
    { key: "resourcesHtml",        re: /\b(resources?|links?|references?)\b/i },
  ] as const;

  const blocks = extractBlocks(src);
  const headings = blocks
    .map((b, i) => {
      const match = wanted.find((w) => w.re.test(b.text));
      return match ? { idx: i, start: b.start, end: b.end, key: match.key } : null;
    })
    .filter(Boolean) as Array<{ idx: number; start: number; end: number; key: string }>;

  const out: Record<string, string> = {
    executiveSummaryHtml: "",
    highlightsHtml: "",
    milestonesHtml: "",
    keyDecisionsHtml: "",
    risksHtml: "",
    resourcesHtml: "",
  };

  if (headings.length === 0) return out as any;

  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    const nextStart = i + 1 < headings.length ? headings[i + 1].start : src.length;
    const slice = src.slice(h.end, nextStart).trim();
    out[h.key] = sanitizeGoogleExport(slice);
  }

  return out as any;
}

function extractBlocks(html: string): Array<{ start: number; end: number; tag: string; html: string; text: string }> {
  const re = /<(h[1-6]|p|div)\b[^>]*>([\s\S]*?)<\/\1>/gim;
  const blocks: Array<{ start: number; end: number; tag: string; html: string; text: string }> = [];
  let m: RegExpExecArray | null = null;
  while ((m = re.exec(html))) {
    const start = m.index;
    const raw = m[0];
    const end = start + raw.length;
    const inner = m[2];
    const text = stripTags(inner).replace(/\s+/g, " ").trim();
    blocks.push({ start, end, tag: m[1].toLowerCase(), html: raw, text });
  }
  return blocks;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

function sanitizeGoogleExport(s: string): string {
  s = s.replace(/<!DOCTYPE[^>]*>/gi, "");
  s = s.replace(/<head[\s\S]*?<\/head>/gi, "");
  s = s.replace(/<meta[^>]*>/gi, "");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<(p|span|div)>\s*<\/\1>/gi, "");
  return s.trim();
}

