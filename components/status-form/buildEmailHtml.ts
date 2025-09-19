// components/status-form/buildEmailHtml.ts
// Fully formatted email HTML with centered tables, ordered columns, and font normalization.
// Exports BOTH a named and default buildEmailHtml.

import { buildResourcesHtml, ResourceItem } from "@/lib/status-form/applyProfileDefaults";

type FormData = Record<string, any>;

const BASE_FONT =
  "system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue','Noto Sans',Arial,'Apple Color Emoji','Segoe UI Emoji'";

/* ----------------- utils ----------------- */
function escapeHtml(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s: string): string {
  return String(s).replace(/"/g, "&quot;");
}
function cleanImportedHtml(html?: string): string {
  if (!html) return "";
  // strip noisy Google Docs inline fonts/sizes/line-heights but keep b/i/u/lists/links
  return String(html)
    .replace(/font-family:[^;"]+;?/gi, "")
    .replace(/font-size:[^;"]+;?/gi, "")
    .replace(/line-height:[^;"]+;?/gi, "");
}

function formatDateMaybe(v: any): string {
  if (!v) return "";
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
    return `${m} ${d.getDate()}, ${d.getFullYear()}`;
  } catch {
    return String(v);
  }
}

function renderBanner(fd: FormData): string {
  const mode = (fd.optBannerMode as "cid" | "web") ?? (fd.bannerCid ? "cid" : "web");
  const alt = (fd.bannerAlt as string) || "Project banner";
  const style = "display:block;width:100%;height:auto;border:0;outline:0;text-decoration:none;";
  if (mode === "cid" && fd.bannerCid) {
    // remember to attach the image with contentId === bannerCid
    return `<img src="cid:${fd.bannerCid}" alt="${escapeHtml(alt)}" style="${style}" />`;
  }
  if (fd.bannerWeb) {
    return `<img src="${escapeAttr(fd.bannerWeb)}" alt="${escapeHtml(alt)}" style="${style}" />`;
  }
  return "";
}

function statusColors(statusRaw: string | undefined) {
  const s = String(statusRaw || "").trim().toLowerCase();
  let bg = "#e5e7eb", color = "#111827", label = statusRaw || "—";
  if (s.startsWith("g")) { bg = "#22c55e"; color = "#ffffff"; label = "Green"; }
  else if (s.startsWith("y") || s.includes("amber")) { bg = "#f59e0b"; color = "#111827"; label = "Yellow"; }
  else if (s.startsWith("r")) { bg = "#ef4444"; color = "#ffffff"; label = "Red"; }
  return { bg, color, label };
}
function chip(label: string, bg: string, color: string) {
  const st =
    "display:inline-block;padding:8px 14px;border-radius:9999px;font-weight:700;font-size:14px;";
  return `<span style="${st}background:${bg};color:${color}">${escapeHtml(label)}</span>`;
}

/* ----------------- blocks ----------------- */
function headerBar(title: string) {
  return `
  <tr>
    <td style="background:#e5e7eb;padding:18px 20px;border-radius:12px">
      <h1 style="margin:0;font-size:28px;line-height:34px;font-weight:800;color:#0f172a;font-family:${BASE_FONT}">${escapeHtml(
        title || "Your Program/Project Title"
      )}</h1>
    </td>
  </tr>
  <tr><td style="height:12px"></td></tr>`;
}

function statusAndPeople(fd: FormData) {
  const { bg: lastBg, color: lastColor, label: lastLabel } = statusColors(fd.statusLast);
  const { bg: curBg, color: curColor, label: curLabel } = statusColors(fd.statusCurrent);
  const { bg: trBg, color: trColor, label: trLabel } = statusColors(fd.statusTrending);
  const dateVal = formatDateMaybe(fd.date || fd.reportDate || fd.programDate);

  // table with two header rows: statuses then people — centered cells
  return `
  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <tr style="background:#f3f4f6">
      <th align="center" style="padding:12px 8px;font:700 16px/22px ${BASE_FONT};color:#111827;border-right:1px solid #e5e7eb">Last Status</th>
      <th align="center" style="padding:12px 8px;font:700 16px/22px ${BASE_FONT};color:#111827;border-right:1px solid #e5e7eb">Current Status</th>
      <th align="center" style="padding:12px 8px;font:700 16px/22px ${BASE_FONT};color:#111827;border-right:1px solid #e5e7eb">Trending</th>
      <th align="center" style="padding:12px 8px;font:700 16px/22px ${BASE_FONT};color:#111827">Date</th>
    </tr>
    <tr>
      <td align="center" style="padding:16px 8px;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb">${chip(lastLabel, lastBg, lastColor)}</td>
      <td align="center" style="padding:16px 8px;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb">${chip(curLabel, curBg, curColor)}</td>
      <td align="center" style="padding:16px 8px;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb">${chip(trLabel, trBg, trColor)}</td>
      <td align="center" style="padding:16px 8px;border-top:1px solid #e5e7eb"><span style="font:500 14px/20px ${BASE_FONT};color:#111827">${escapeHtml(
        dateVal || ""
      )}</span></td>
    </tr>

    <tr style="background:#f3f4f6">
      <th align="center" style="padding:12px 8px;font:700 16px/22px ${BASE_FONT};color:#111827;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb">TPM</th>
      <th align="center" style="padding:12px 8px;font:700 16px/22px ${BASE_FONT};color:#111827;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb">Engineering DRI</th>
      <th align="center" style="padding:12px 8px;font:700 16px/22px ${BASE_FONT};color:#111827;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb">Business Sponsor</th>
      <th align="center" style="padding:12px 8px;font:700 16px/22px ${BASE_FONT};color:#111827;border-top:1px solid #e5e7eb">Engineering Sponsor</th>
    </tr>
    <tr>
      <td align="center" style="padding:16px 8px;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
        <span style="font:500 16px/22px ${BASE_FONT};color:#111827">${escapeHtml(fd.tpm || "")}</span>
      </td>
      <td align="center" style="padding:16px 8px;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
        <span style="font:500 16px/22px ${BASE_FONT};color:#111827">${escapeHtml(fd.engDri || fd.engineeringDri || "")}</span>
      </td>
      <td align="center" style="padding:16px 8px;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
        <span style="font:500 16px/22px ${BASE_FONT};color:#111827">${escapeHtml(fd.businessSponsor || fd.bizSponsor || "")}</span>
      </td>
      <td align="center" style="padding:16px 8px;border-top:1px solid #e5e7eb">
        <span style="font:500 16px/22px ${BASE_FONT};color:#111827">${escapeHtml(fd.engineeringSponsor || fd.engSponsor || "")}</span>
      </td>
    </tr>
  </table>
  <div style="height:16px"></div>`;
}

function sectionBlock(title: string, html?: string) {
  const cleaned = cleanImportedHtml(html);
  if (!cleaned.trim()) return "";
  return `
  <tr>
    <td style="padding:16px 20px;border:1px solid #e5e7eb;border-radius:12px">
      <h3 style="margin:0 0 8px 0;font:800 18px/24px ${BASE_FONT};color:#111827">${escapeHtml(title)}</h3>
      <div style="font:400 15px/22px ${BASE_FONT};color:#111827">
        ${cleaned}
      </div>
    </td>
  </tr>
  <tr><td style="height:12px"></td></tr>`;
}

function resourcesBlock(fd: FormData): string {
  const resHtml =
    (fd.resourcesHtml as string | undefined)?.trim() ||
    (fd.additionalResourcesHtml as string | undefined)?.trim() ||
    "";
  let html = cleanImportedHtml(resHtml);
  if (!html && Array.isArray(fd.resources)) {
    html = buildResourcesHtml(fd.resources as ResourceItem[]);
  }
  if (!html) return "";
  return sectionBlock(fd.resourcesTitle || "Additional Resources", html);
}

/* ----------------- main ----------------- */
export function buildEmailHtml(fd: FormData): string {
  const banner = renderBanner(fd);
  const title = String(fd.programTitle || "Your Program/Project Title here");
  const summary = cleanImportedHtml(String(fd.programSummary || ""));

  const baseCss = `
  body{margin:0;padding:0;background:#ffffff}
  a{color:#0369a1}
  ul,ol{margin:0 0 0 20px;padding:0}
  `;

  const parts: string[] = [];
  parts.push(headerBar(title));
  if (banner) parts.unshift(`<tr><td style="padding:0">${banner}</td></tr><tr><td style="height:12px"></td></tr>`);
  if (summary.trim()) {
    parts.push(`
    <tr>
      <td style="padding:16px 20px;border:1px solid #e5e7eb;border-radius:12px">
        <div style="font:400 15px/22px ${BASE_FONT};color:#111827">${summary}</div>
      </td>
    </tr>
    <tr><td style="height:12px"></td></tr>`);
  }
  parts.push(`<tr><td>${statusAndPeople(fd)}</td></tr>`);

  // Rich sections
  parts.push(sectionBlock(fd.execSummaryTitle || "Executive Summary", fd.executiveSummaryHtml));
  parts.push(sectionBlock(fd.updatesTitle || "Highlights", fd.highlightsHtml));
  parts.push(sectionBlock(fd.milestonesTitle || "Milestones", fd.milestonesHtml));
  parts.push(sectionBlock(fd.keyDecisionsTitle || "Key Decisions", fd.keyDecisionsHtml));
  parts.push(sectionBlock(fd.risksTitle || "Risks & Issue Mitigation Plan", fd.risksHtml));
  parts.push(resourcesBlock(fd));

  const body = parts.filter(Boolean).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charSet="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(title)}</title>
<style>${baseCss}</style>
</head>
<body style="font-family:${BASE_FONT}">
  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="border-collapse:collapse">
    <tr>
      <td align="center" style="padding:0">
        <table role="presentation" width="980" cellPadding="0" cellSpacing="0" style="border-collapse:collapse;width:980px;max-width:100%">
          ${body}
          <tr><td style="height:24px"></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export default buildEmailHtml;

