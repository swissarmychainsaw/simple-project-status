// lib/email/builders.ts
import { EMAIL_MAX_WIDTH, escapeHtml, getBannerHtml } from "@/lib/email/banner";
import {
  nlToParas,
  listsToParagraphs,
  processRichHtml,
  sanitizeHtml,
  stripInlineBackgrounds,
  unwrapParagraphsInTables,
} from "@/lib/html/transforms";

// Minimal shapes (avoid circular imports)
type DensityName = "comfortable" | "cozy" | "compact";
type DesignLike = {
  optFont?: string;
  optDensity?: DensityName | string;
  optBannerMode: "url" | "cid" | "none";
  optBannerId?: string;
  optBannerUrl?: string;
  optBannerCaption?: string;
};

export const buildHtml = (data: any, opts: DesignLike) => {
  const asOf = data.asOf
    ? (() => {
        const [year, month, day] = data.asOf.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
      })()
    : "";

  const pill = (val: string) => {
    const v = String(val || "").toLowerCase();
    if (v === "red")
      return `<div style="display:inline-block;background-color:#e5534b;color:#fff;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:bold;">Red</div>`;
    if (v === "yellow")
      return `<div style="display:inline-block;background-color:#f4c542;color:#111;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:bold;">Yellow</div>`;
    return `<div style="display:inline-block;background-color:#4CAF50;color:#fff;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:bold;">Green</div>`;
  };

  const processedUpdates      = processRichHtml(data.updatesHtml);
  const processedMilestones   = processRichHtml(data.milestonesHtml);
  const processedKeyDecisions = processRichHtml(data.keyDecisionsHtml);
  const processedRisks        = processRichHtml(data.risksHtml);
  const processedResources    = processRichHtml(data.resourcesHtml);
  const processedHighlights   = processRichHtml(listsToParagraphs(data.highlightsHtml));
  const evenRowStyle = "background-color:#f9f9f9;padding:20px;border:1px solid #CCCCCC;";
  const oddRowStyle  = "background-color:#ffffff;padding:20px;border:1px solid #CCCCCC;";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Status Report</title>
</head>
<body style="margin:0;padding:0;">
  ${getBannerHtml(false, opts, EMAIL_MAX_WIDTH)}
  <table style="width:100%;max-width:${EMAIL_MAX_WIDTH}px;margin:0 auto;border-collapse:collapse;font-family:Arial,sans-serif;">
    <tr><td>
      <table style="width:100%;border-collapse:collapse;margin:0;padding:0;">
        <tr>
          <td style="background-color:#E8E8E8;padding:20px;text-align:left;border:1px solid #CCCCCC;">
            <h1 style="margin:0;font-size:24px;font-weight:bold;color:#333333;">
              ${data.programTitle || "Your Program/Project Title here"}
            </h1>
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff;padding:20px;border:1px solid #CCCCCC;">
            <span style="margin:0;font-size:16px;line-height:1.5;color:#333333;">
              ${nlToParas(data.programSummary) || "Program summary description goes here."}
            </span>
          </td>
        </tr>
        <tr>
          <td colspan="1" style="${evenRowStyle}padding:0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="width:25%;padding:10px;text-align:center;border-left:1px solid #CCCCCC;border-right:1px solid #CCCCCC;border-top:0;border-bottom:0;background-color:#F5F5F5;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Last Status</h3>
                  ${pill(data.lastStatus)}
                </td>
                <td style="width:25%;padding:10px;text-align:center;border-left:1px solid #CCCCCC;border-right:1px solid #CCCCCC;border-top:0;border-bottom:0;background-color:#F5F5F5;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Current Status</h3>
                  ${pill(data.currentStatus)}
                </td>
                <td style="width:25%;padding:10px;text-align:center;border-left:1px solid #CCCCCC;border-right:1px solid #CCCCCC;border-top:0;border-bottom:0;background-color:#F5F5F5;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Trending</h3>
                  ${pill(data.trending)}
                </td>
                <td style="width:25%;padding:10px;text-align:center;border-left:1px solid #CCCCCC;border-right:1px solid #CCCCCC;border-top:0;border-bottom:0;background-color:#F5F5F5;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Date</h3>
                  <p style="margin:0;font-size:14px;color:#333333;">${escapeHtml(asOf)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${data.execSummary ? `
<tr>
  <td colspan="1" style="${oddRowStyle}">
    <h3 style="margin:0 0 10px 0;font-size:18px;font-weight:bold;color:#333333;">
      ${escapeHtml(data.execSummaryTitle || "Executive Summary")}
    </h3>
    <div style="margin:0;font-size:16px;color:#333333;">
      ${unwrapParagraphsInTables(stripInlineBackgrounds(sanitizeHtml(data.execSummary)))}
    </div>
  </td>
</tr>` : ""}

${data.highlightsHtml ? `
<tr>
  <td colspan="1" style="${oddRowStyle}">
    <h3 style="margin:0 0 10px 0;font-size:18px;font-weight:bold;color:#333333;">
      ${escapeHtml(data.highlightsTitle || "Highlights / Accomplishments")}
    </h3>
    <div style="margin:0;font-size:16px;color:#333333;">
      ${processedHighlights}
    </div>
  </td>
</tr>` : ""}

      </table>

      ${data.updatesHtml ? `
      <h2 style="font-size:20px;font-weight:bold;color:#333;margin:24px 0 8px 0;">${data.updatesTitle || "Top Accomplishments"}</h2>
      ${data.sectionTitle ? `<h3 style="font-size:18px;font-weight:600;color:#555;margin:8px 0 16px 0;">${data.sectionTitle}</h3>` : ""}
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:16px;">${processedUpdates}</td></tr>
      </table>` : ""}

      ${data.milestonesHtml ? `
      <h2 style="font-size:20px;font-weight:bold;color:#333;margin:24px 0 8px 0;">${data.milestonesTitle || "Upcoming Milestones"}</h2>
      ${data.milestonesSectionTitle ? `<h3 style="font-size:18px;font-weight:600;color:#555;margin:8px 0 16px 0;">${data.milestonesSectionTitle}</h3>` : ""}
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:16px;">${processedMilestones}</td></tr>
      </table>` : ""}

      ${data.keyDecisionsHtml ? `
      <h2 style="font-size:20px;font-weight:bold;color:#333;margin:24px 0 8px 0;">${data.keyDecisionsTitle || "Key Decisions"}</h2>
      ${data.keyDecisionsSectionTitle ? `<h3 style="font-size:18px;font-weight:600;color:#555;margin:8px 0 16px 0;">${data.keyDecisionsSectionTitle}</h3>` : ""}
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:16px;">${processedKeyDecisions}</td></tr>
      </table>` : ""}

      ${data.risksHtml ? `
      <h2 style="font-size:20px;font-weight:bold;color:#333;margin:24px 0 8px 0;">${data.risksTitle || "Risks & Issue Mitigation Plan"}</h2>
      ${data.risksSectionTitle ? `<h3 style="font-size:18px;font-weight:600;color:#555;margin:8px 0 16px 0;">${data.risksSectionTitle}</h3>` : ""}
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:16px;">${processedRisks}</td></tr>
      </table>` : ""}

      ${data.resourcesHtml ? `
      <h2 style="font-size:20px;font-weight:bold;color:#333;margin:24px 0 8px 0;">${data.resourcesTitle || "Additional Resources"}</h2>
      ${data.resourcesSectionTitle ? `<h3 style="font-size:18px;font-weight:600;color:#555;margin:8px 0 16px 0;">${data.resourcesSectionTitle}</h3>` : ""}
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:16px;">${processedResources}</td></tr>
      </table>` : ""}

    </td></tr>
  </table>
</body>
</html>`;
};

export const buildEmailHtml = (data: any, opts: DesignLike) => {
  const asOf = data.asOf
    ? (() => {
        const [y, m, d] = data.asOf.split("-").map(Number);
        return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
      })()
    : "";

  const containerWidth = EMAIL_MAX_WIDTH;
  const dens = (opts.optDensity ?? "comfortable") as DensityName;
  const scale = dens === "compact" ? 0.8 : dens === "cozy" ? 0.9 : 1;
  const px = (n: number) => `${Math.round(n * scale)}px`;

  const fontFamily = opts.optFont || "Arial, Helvetica, sans-serif";
  const baseText   = `font-family:${fontFamily};color:#111;`;
  const baseFont   = `${baseText}font-size:16px;line-height:1.45;`;

  const outerTableStyle = `border-collapse:collapse;width:100%;max-width:${containerWidth}px;margin:0 auto;mso-table-lspace:0pt;mso-table-rspace:0pt;`;
  const innerTableStyle = "border-collapse:collapse;width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;";
  const cellBase   = `${baseFont}padding:16px;border:1px solid #e5e7eb;`;
  const cellLeft   = `${cellBase}text-align:left;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;`;
  const cellCenter = `${cellBase}text-align:center;vertical-align:middle;`;
  const headCellLeft = `${cellBase}background-color:#f5f5f5;font-weight:700;text-align:left;vertical-align:middle;`;
  const headCellC    = `${cellBase}background-color:#f5f5f5;font-weight:700;text-align:center;vertical-align:middle;`;
  const titleCell  = `${cellBase}background-color:#e5e7eb;font-weight:700;font-size:20px;text-align:left;vertical-align:middle;`;

  const sFont       = `${baseText}font-size:${px(14)};line-height:1.35;`;
  const sCellBase   = `${sFont}padding:${px(8)} ${px(10)};border:1px solid #e5e7eb;`;
  const sCellCenter = `${sCellBase}text-align:center;vertical-align:middle;`;
  const sHeadCellC  = `${sCellBase}background-color:#f5f5f5;font-weight:700;text-align:center;vertical-align:middle;font-size:${px(13)};`;

  const sectionHeaderRow = (label: string) =>
    `<tr><td style="${headCellLeft}" bgcolor="#f5f5f5" align="left">${escapeHtml(label)}</td></tr>`;

  const emailPill = (s: string) => {
    const colors = {
      green:  { bg: "#27c08a", color: "#fff" },
      yellow: { bg: "#f4c542", color: "#111" },
      red:    { bg: "#e5534b", color: "#fff" },
    } as const;
    const c = colors[(s || "").toLowerCase() as keyof typeof colors] || colors.green;
    return `<span style="${sFont}display:inline-block;padding:${px(4)} ${px(8)};border-radius:${px(10)};font-weight:700;background-color:${c.bg};color:${c.color};">${escapeHtml(s)}</span>`;
  };

  const fourColColgroup = `
    <colgroup>
      <col style="width:25%" width="25%">
      <col style="width:25%" width="25%">
      <col style="width:25%" width="25%">
      <col style="width:25%" width="25%">
    </colgroup>`;

  const banner = getBannerHtml(true, opts, containerWidth);

  const processedUpdates      = processRichHtml(data.updatesHtml);
  const processedMilestones   = processRichHtml(data.milestonesHtml);
  const processedKeyDecisions = processRichHtml(data.keyDecisionsHtml);
  const processedRisks        = processRichHtml(data.risksHtml);
  const processedResources    = processRichHtml(data.resourcesHtml);
  const processedHighlights   = processRichHtml(listsToParagraphs(data.highlightsHtml));

  return `
<table role="presentation" align="center" width="100%" style="${outerTableStyle}" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding:0;">${banner}</td></tr>
</table>

<table role="presentation" align="center" width="100%" style="${outerTableStyle}" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding:0;">
    <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="${titleCell}" bgcolor="#e5e7eb" align="left" valign="middle">
          ${escapeHtml(data.programTitle || "Your Program/Project Title here")}
        </td>
      </tr>
      <tr>
        <td style="${cellLeft}" bgcolor="#ffffff" align="left" valign="top">
          ${nlToParas(data.programSummary)}
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" style="${innerTableStyle};table-layout:fixed" cellpadding="0" cellspacing="0" border="0">
      ${fourColColgroup}
      <tr>
        <td style="${sHeadCellC}" bgcolor="#f5f5f5">Last Status</td>
        <td style="${sHeadCellC}" bgcolor="#f5f5f5">Current Status</td>
        <td style="${sHeadCellC}" bgcolor="#f5f5f5">Trending</td>
        <td style="${sHeadCellC}" bgcolor="#f5f5f5">Date</td>
      </tr>
      <tr>
        <td style="${sCellCenter}" align="center" valign="middle">${emailPill(data.lastStatus)}</td>
        <td style="${sCellCenter}" align="center" valign="middle">${emailPill(data.currentStatus)}</td>
        <td style="${sCellCenter}" align="center" valign="middle">${emailPill(data.trending)}</td>
        <td style="${sCellCenter}" align="center" valign="middle">${escapeHtml(asOf)}</td>
      </tr>
    </table>

    ${data.execSummary ? `
    <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
      ${sectionHeaderRow(data.execSummaryTitle || "Executive Summary")}
      <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">
        ${unwrapParagraphsInTables(stripInlineBackgrounds(sanitizeHtml(data.execSummary)))}
      </td></tr>
    </table>` : ""}

    ${data.highlightsHtml ? `
    <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
      ${sectionHeaderRow(data.highlightsTitle || "Highlights / Accomplishments")}
      <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">
        ${processedHighlights}
      </td></tr>
    </table>` : ""}

    ${data.updatesHtml ? `
    <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
      ${sectionHeaderRow(data.updatesTitle || "Top Accomplishments")}
      ${data.sectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left"><strong>${escapeHtml(data.sectionTitle)}</strong></td></tr>` : ""}
      <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedUpdates}</td></tr>
    </table>` : ""}

    ${data.milestonesHtml ? `
    <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
      ${sectionHeaderRow(data.milestonesTitle || "Upcoming Milestones")}
      ${data.milestonesSectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left"><strong>${escapeHtml(data.milestonesSectionTitle)}</strong></td></tr>` : ""}
      <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedMilestones}</td></tr>
    </table>` : ""}

    ${data.keyDecisionsHtml ? `
    <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
      ${sectionHeaderRow(data.keyDecisionsTitle || "Key Decisions")}
      ${data.keyDecisionsSectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left"><strong>${escapeHtml(data.keyDecisionsSectionTitle)}</strong></td></tr>` : ""}
      <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedKeyDecisions}</td></tr>
    </table>` : ""}

    ${data.risksHtml ? `
    <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
      ${sectionHeaderRow(data.risksTitle || "Risks & Issue Mitigation Plan")}
      ${data.risksSectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left"><strong>${escapeHtml(data.risksSectionTitle)}</strong></td></tr>` : ""}
      <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedRisks}</td></tr>
    </table>` : ""}

    ${data.resourcesHtml ? `
    <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
      ${sectionHeaderRow(data.resourcesTitle || "Additional Resources")}
      ${data.resourcesSectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left"><strong>${escapeHtml(data.resourcesSectionTitle)}</strong></td></tr>` : ""}
      <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedResources}</td></tr>
    </table>` : ""}

  </td></tr>
</table>`;
};

