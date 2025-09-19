// components/status-form/buildEmailHtml.ts
// Version: combined-risks-resources-v1
// - One outer wrapper table (900px).
// - "Additional Resources" is *merged into the Risks card* (no separate card).
// - People (TPM/DRIs) table preserved.
// - Robust against Google Docs HTML (basic cleanup).

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
function pickSectionHtml(fd: FormData, keysHtml: string[], keysPlain: string[] = []): string {
  for (const k of keysHtml) {
    const v = (fd as any)[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  for (const k of keysPlain) {
    const v = (fd as any)[k];
    if (typeof v === "string" && v.trim()) {
      if (/[<][a-zA-Z!]/.test(v)) return v; // looks like HTML already
      return `<p>${escapeHtml(v)}</p>`;
    }
  }
  return "";
}
/** Clean Google Docs HTML while preserving emphasis and links/lists. */
function cleanImportedHtml(html?: string): string {
  if (!html) return "";
  let out = String(html);

  // spans -> semantic tags
  out = out.replace(
    /<span([^>]*?)style="([^"]*?)font-weight\s*:\s*(700|bold)[^"]*?"([^>]*)>(.*?)<\/span>/gis,
    (_, a1, _s, _w, a2, inner) => `<strong${a1}${a2}>${inner}</strong>`
  );
  out = out.replace(
    /<span([^>]*?)style="([^"]*?)font-style\s*:\s*italic[^"]*?"([^>]*)>(.*?)<\/span>/gis,
    (_, a1, _s, a2, inner) => `<em${a1}${a2}>${inner}</em>`
  );
  out = out.replace(
    /<span([^>]*?)style="([^"]*?)text-decoration[^"]*underline[^"]*?"([^>]*)>(.*?)<\/span>/gis,
    (_, a1, _s, a2, inner) => `<u${a1}${a2}>${inner}</u>`
  );

  // strip font-family/size/line-height rules but keep others
  out = out.replace(/\sstyle="[^"]*?(font-family|font-size|line-height)[^"]*?"/gi, (m) => {
    const styles = m.slice(7, -1).split(";").map(s => s.trim()).filter(Boolean);
    const keep = styles.filter(s => !/(^|\s)(font-family|font-size|line-height)\s*:/i.test(s));
    return keep.length ? ` style="${keep.join("; ")}"` : "";
  });

  // drop empty spans
  out = out.replace(/<span(?:\s[^>]*)?>\s*<\/span>/gi, "");
  return out;
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

/* ----------------- helpers ----------------- */
function statusColors(statusRaw: string | undefined) {
  const s = String(statusRaw || "").trim().toLowerCase();
  let bg = "#e5e7eb", color = "#111827", label = statusRaw || "—";
  if (s.startsWith("g")) { bg = "#22c55e"; color = "#ffffff"; label = "Green"; }
  else if (s.startsWith("y") || s.includes("amber")) { bg = "#f59e0b"; color = "#111827"; label = "Yellow"; }
  else if (s.startsWith("r")) { bg = "#ef4444"; color = "#ffffff"; label = "Red"; }
  return { bg, color, label };
}
function chip(label: string, bg: string, color: string) {
  const st = "display:inline-block;padding:8px 14px;border-radius:9999px;font-weight:700;font-size:14px;";
  return `<span style="${st}background:${bg};color:${color}">${escapeHtml(label)}</span>`;
}
function rowHeader(title: string) {
  return `
  <tr>
    <td style="background:#e5e7eb;padding:18px 20px;border:1px solid #e5e7eb;border-radius:12px">
      <h1 style="margin:0;font-size:28px;line-height:34px;font-weight:800;color:#0f172a;font-family:${BASE_FONT}">
        ${escapeHtml(title || "Your Program/Project Title")}
      </h1>
    </td>
  </tr>
  <tr><td style="height:12px"></td></tr>`;
}
function rowSummary(html: string) {
  const cleaned = cleanImportedHtml(html);
  if (!cleaned.trim()) return "";
  return `
  <tr>
    <td style="padding:16px 20px;border:1px solid #e5e7eb;border-radius:12px">
      <div style="color:#111827;font-family:${BASE_FONT};font-size:15px;line-height:22px">${cleaned}</div>
    </td>
  </tr>
  <tr><td style="height:12px"></td></tr>`;
}
/** People + status grid (email-safe nested table) */
function rowStatusAndPeople(fd: FormData) {
  const { bg: lastBg, color: lastColor, label: lastLabel } = statusColors(fd.statusLast);
  const { bg: curBg, color: curColor, label: curLabel } = statusColors(fd.statusCurrent);
  const { bg: trBg, color: trColor, label: trLabel } = statusColors(fd.statusTrending);
  const dateVal = formatDateMaybe(fd.date || fd.reportDate || fd.programDate);

  return `
  <tr>
    <td style="padding:0;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="border-collapse:collapse">
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
          <td align="center" style="padding:16px 8px;border-top:1px solid #e5e7eb">
            <span style="font:500 14px/20px ${BASE_FONT};color:#111827">${escapeHtml(dateVal || "")}</span>
          </td>
        </tr>

        <tr style="background:#f3f4f6">
          <th align="center" style="padding:12px 8px;font:700 16px/22px ${BASE_FONT};color:#111827;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb">TPM</th>
          <th align="center" style="padding:12px 8px;font:700 16px/22px ${BASE_FONT};color:#111827;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb">Engineering DRI</th>
          <th align="center" style="padding:12px 8px;font:700 16px/22px ${BASE_FONT};color:#111827;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb">Business Sponsor</th>
          <th align="center" style="padding:12px 8px;font:700 16px/22px ${BASE_FONT};color:#111827">Engineering Sponsor</th>
        </tr>
        <tr>
          <td align="center" style="padding:16px 8px;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb"><span style="font:500 16px/22px ${BASE_FONT};color:#111827">${escapeHtml(fd.tpm || "")}</span></td>
          <td align="center" style="padding:16px 8px;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb"><span style="font:500 16px/22px ${BASE_FONT};color:${"#111827"}">${escapeHtml(fd.engDri || fd.engineeringDri || "")}</span></td>
          <td align="center" style="padding:16px 8px;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb"><span style="font:500 16px/22px ${BASE_FONT};color:#111827">${escapeHtml(fd.businessSponsor || fd.bizSponsor || "")}</span></td>
          <td align="center" style="padding:16px 8px;border-top:1px solid #e5e7eb"><span style="font:500 16px/22px ${BASE_FONT};color:#111827">${escapeHtml(fd.engineeringSponsor || fd.engSponsor || "")}</span></td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td style="height:12px"></td></tr>`;
}
function rowCard(title: string, html?: string) {
  const cleaned = cleanImportedHtml(html);
  if (!cleaned.trim()) return "";
  return `
  <tr>
    <td style="padding:16px 20px;border:1px solid #e5e7eb;border-radius:12px">
      <h3 style="margin:0 0 8px 0;font:800 18px/24px ${BASE_FONT};color:#111827">${escapeHtml(title)}</h3>
      <div style="color:#111827;font-family:${BASE_FONT};font-size:15px;line-height:22px">
        ${cleaned}
      </div>
    </td>
  </tr>
  <tr><td style="height:12px"></td></tr>`;
}

/** Render resources as simple rows (no <ul>) so they blend into Risks cleanly */
function resourcesRowsFromHtml(raw: string): string {
  let html = cleanImportedHtml(raw).trim();
  if (!html) return "";

  const rows: string[] = [];

  // Anchors → rows
  for (const m of html.matchAll(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gis)) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, "").trim() || href;
    rows.push(
      `<div style="margin:0 0 8px 0"><a href="${escapeAttr(href)}" target="_blank" rel="noreferrer">${escapeHtml(text)}</a></div>`
    );
  }
  if (rows.length) return rows.join("");

  // Tables → cells → rows
  if (/<table\b/i.test(html)) {
    const cells = Array.from(html.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi))
      .map(m => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
      .filter(Boolean);
    if (cells.length) return cells.map(c => `<div style="margin:0 0 8px 0">${escapeHtml(c)}</div>`).join("");
    html = html.replace(/<\/?(table|thead|tbody|tr|t[hd])[^>]*>/gi, "");
  }

  // Lines → rows
  const textish = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<div[^>]*>/gi, "")
    .replace(/<\/div>/gi, "\n")
    .trim();

  const lines = textish.split(/\n+/).map(s => s.trim()).filter(Boolean);
  return lines.map(l => `<div style="margin:0 0 8px 0">${escapeHtml(l)}</div>`).join("");
}

/* ----------------- main ----------------- */
export function buildEmailHtml(fd: FormData, _opts?: any): string {
  const title       = String(fd.programTitle || "Your Program/Project Title here");
  const bannerHtml  = (() => {
    const mode = (fd.optBannerMode as "cid" | "web") ?? (fd.bannerCid ? "cid" : "web");
    const alt = (fd.bannerAlt as string) || "Project banner";
    const style = "display:block;width:100%;height:auto;border:0;outline:0;text-decoration:none;";
    if (mode === "cid" && fd.bannerCid) return `<img src="cid:${fd.bannerCid}" alt="${escapeHtml(alt)}" style="${style}" />`;
    if (fd.bannerWeb) return `<img src="${escapeAttr(fd.bannerWeb)}" alt="${escapeHtml(alt)}" style="${style}" />`;
    return "";
  })();

  // HTML-first, then plain
  const summaryHtml    = cleanImportedHtml(String(fd.programSummary || ""));
  const execTitle      = (fd.execSummaryTitle as string) || (fd.executiveSummaryTitle as string) || "Executive Summary";
  const execHtml       = pickSectionHtml(fd, ["executiveSummaryHtml","execSummaryHtml","summaryHtml"], ["executiveSummary","execSummary","summary"]);
  let updatesTitle     = (fd.updatesTitle as string) || "Highlights / Accomplishments";
  if (/^\s*Top Accomplishments\s*$/i.test(updatesTitle)) updatesTitle = "Highlights / Accomplishments";
  const highlightsHtml = pickSectionHtml(fd, ["highlightsHtml","updatesHtml","accomplishmentsHtml"], ["highlights","updates","accomplishments"]);
  const milestonesHtml = pickSectionHtml(fd, ["milestonesHtml"], ["milestones"]);
  const decisionsHtml  = pickSectionHtml(fd, ["keyDecisionsHtml","decisionsHtml"], ["keyDecisions","decisions"]);
  const risksHtml      = pickSectionHtml(fd, ["risksHtml","riskHtml"], ["risks","risk"]);

  // Resources → rows, then MERGE into Risks body
  const resourcesRaw   = pickSectionHtml(fd, ["resourcesHtml","additionalResourcesHtml"], ["resources","additionalResources"]);
  let resourcesRows    = resourcesRowsFromHtml(resourcesRaw);
  if (!resourcesRows && Array.isArray(fd.resources)) {
    resourcesRows = resourcesRowsFromHtml(buildResourcesHtml(fd.resources as ResourceItem[]));
  }

  // Build risks body, optionally with resources appended
  let risksBody = cleanImportedHtml(risksHtml);
  if (resourcesRows) {
    const subhead = `<h4 style="margin:12px 0 6px 0;font:800 16px/22px ${BASE_FONT};color:#111827">Additional Resources</h4>`;
    risksBody = `${risksBody}<div style="height:8px"></div>${subhead}${resourcesRows}`;
  }

  // Build all rows in ONE outer table
  const rows: string[] = [];

  if (bannerHtml) {
    rows.push(`<tr><td style="padding:0">${bannerHtml}</td></tr>`);
    rows.push(`<tr><td style="height:12px"></td></tr>`);
  }

  rows.push(rowHeader(title));
  rows.push(rowSummary(summaryHtml));
  rows.push(rowStatusAndPeople(fd));
  rows.push(rowCard(execTitle,        execHtml));
  rows.push(rowCard(updatesTitle,     highlightsHtml));
  rows.push(rowCard(fd.milestonesTitle   || "Upcoming Milestones", milestonesHtml));
  rows.push(rowCard(fd.keyDecisionsTitle || "Key Decisions",       decisionsHtml));
  rows.push(rowCard(fd.risksTitle        || "Risks & Issue Mitigation Plan", risksBody)); // ← Resources merged here

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charSet="utf-8"/>
<meta http-equiv="x-ua-compatible" content="ie=edge"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Status Report</title>
</head>
<body style="margin:0;padding:0;">
  <!-- buildEmailHtml: components/status-form/buildEmailHtml.ts :: combined-risks-resources-v1 -->
  <table role="presentation" width="900" cellPadding="0" cellSpacing="0"
         style="border-collapse:collapse;width:900px;max-width:100%;margin:0 auto;font-family:${BASE_FONT}">
    ${rows.join("\n")}
  </table>
</body>
</html>`;

  return html;
}

export default buildEmailHtml;

