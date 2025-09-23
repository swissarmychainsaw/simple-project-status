import { describe, it, expect } from "vitest";
import parseGoogleDocHtml from "@/lib/google/parseGoogleDocHtml";

const html = `
<h2>Executive Summary</h2><p>exec stuff</p>
<h2>Key Decisions</h2><ul><li>Decided A</li></ul>
<h2>Risks & Mitigation Plan</h2><p>Risky</p>
`;

describe("parseGoogleDocHtml", () => {
  it("buckets headings exactly", () => {
    const out = parseGoogleDocHtml(html);
    expect(out.executiveSummaryHtml).toContain("exec");
    expect(out.keyDecisionsHtml).toContain("Decided");
    expect(out.risksHtml).toContain("Risky");
    expect(out.highlightsHtml).toBeUndefined();
  });
});

