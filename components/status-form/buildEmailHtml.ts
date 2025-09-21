// components/status-form/buildEmailHtml.ts
// One-wrapper email HTML (900px). Bullets enforced inline across clients.

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

/** Merge/append style rules to any existing style="..." attribute. */
function mergeStyle(tagOpen: string, rules: string) {
  if (/style="/i.test(tagOpen)) {
    return tagOpen.replace(/style="([^"]*)"/i, (_m, css) => {
      const sep = css.trim().endsWith(";") || css.trim() === "" ? "" : ";";
      return `style="${css}${sep}${rules}"`;
    });
  }
  // inject style before closing ">"
  return tagOpen.replace(/>$/, ` style="${rules}">`);
}

/** Force sane list spacing/indent inline so Outlook/OWA/Gmail render consistently. */
function applyListStyles(html: string): string {
  // <ul ...>
  html = html.replace(/<ul\b[^>]*>/gi, (m) =>
    mergeStyle(m, "margin:8px 0 0 24px;padding:0;list-style-position:outside")
  );
  // <ol ...>
  html = html.replace(/<ol\b[^>]*>/gi, (m) =>
    mergeStyle(m, "margin:8px 0 0 24px;padding:0;list-style-position:outside")
  );
  // <li ...>
  html = html.replace(/<li\b[^>]*>/gi, (m) =>
    mergeStyle(m, "margin:6px 0 0 0;padding:0")
  );
  return html;
}

/** Prefer HTML fields; if only plain text exists, wrap it in <p> */
function pickSectionHtml(fd: FormData, keysHtml: string[], keysPlain: string[] = []): string {
  for (const k of keysHtml) {
    const v = (fd as any)[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  for (const k of keysPlain) {
    const v = (fd as any)[k];
    if (typeof v === "string" && v.trim()) {
      if (/[<][a-zA-Z!]/.test(v)) return v;
      return `<p>${escapeHtml(v)}</p>`;
    }
  }
  return "";
}

/** Clean Google Docs HTML while preserving emphasis and links/lists. */
function cleanImportedHtml(html?: string): string {
  if (!html) return "";
  let out = String(html);

  // Normalize <span style="font-weight:bold|700"> → <strong>
  out = out.replace(
    /<span([^>]*?)style="([^"]*?)font-weight\s*:\s*(700|bold)[^"]*?"([^>]*)>(.*?)<\/span>/gis,
    (_, a1, _s, _w, a2, inner) => `<strong${a1}${a2}>${inner}</strong>`
  );
  // Italic spans → <em>
  out = out.replace(
    /<span([^>]*?)style="([^"]*?)font-style\s*:\s*italic[^"]*?"([^>]*)>(.*?)<\/span>/gis,
    (_, a1, _s, a2, inner) => `<em${a1}${a2}>${inner}</em>`
  );
  // Underline spans → <u>
  out = out.replace(
    /<span([^>]*?)style="([^"]*?)text-decoration[^"]*underline[^"]*?"([^>]*)>(.*?)<\/span>/gis,
    (_, a1, _s, a2, inner) => `<u${a1}${a2}>${inner}</u>`
  );

  // Remove noisy font rules but keep other styles
  out = out.replace(/\sstyle="[^"]*?(font-family|font-size|line-height)[^"]*?"/gi, (m) => {
    const styles = m.slice(7, -1).split(";").map(s => s.trim()).filter(Boolean);
    const keep = styles.filter(s => !/(^|\s)(font-family|font-size|line-height)\s*:/i.test(s));
    return keep.length ? ` style="${keep.join("; ")}"` : "";
  });

  // Drop empty spans
  out = out.replace(/<span(?:\s[^>]*)?>\s*<\/span>/gi, "");

  // Finally, ensure lists look right inline
  out = applyListStyles(out);
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

function renderBanner(fd: FormData): string {
  const mode = (fd.optBannerMode as "cid" | "web") ?? (fd.bannerCid ? "cid" : "web");
  const alt = (fd.bannerAlt as string) || "Project banner";
  const style = "display:block;width:100%;height:auto;border:0;outline:0;text-decoration:none;";
  if (mode === "cid" && fd.bannerCid) return `<img src="cid:${fd.bannerCid}" alt="${escapeHtml(alt)}" style="${style}" />`;
  if (fd.bannerWeb) return `<img src="${escapeAttr(fd.bannerWeb)}" alt="${escapeHtml(alt)}" style="${style}" />`;
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
  const st = "display:inline-block;padding:8px 14px;border-radius:9999px;font-weight:700;font-size:14px;";
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
      <th align="center" style="padding:12px 8px;font:700 16px/22px ${BASE_FONT};color:#111827">Engineering Sponsor</th>
    </tr>
    <tr>
      <td align="center" style="padding:16px 8px;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb"><span style="font:500 16px/22px ${BASE_FONT};color:#111827">${escapeHtml(fd.tpm || "")}</span></td>
      <td align="center" style="padding:16px 8px;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb"><span style="font:500 16px/22px ${BASE_FONT};color:#111827">${escapeHtml(fd.engDri || fd.engineeringDri || "")}</span></td>
      <td align="center" style="padding:16px 8px;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb"><span style="font:500 16px/22px ${BASE_FONT};color:#111827">${escapeHtml(fd.businessSponsor || fd.bizSponsor || "")}</span></td>
      <td align="center" style="padding:16px 8px;border-top:1px solid #e5e7eb"><span style="font:500 16px/22px ${BASE_FONT};color:#111827">${escapeHtml(fd.engineeringSponsor || fd.engSponsor || "")}</span></td>
    </tr>
  </table>
  <div style="height:16px"></div>`;
}

function sectionBlock(title: string, rawHtml?: string) {
  const cleaned = cleanImportedHtml(rawHtml);
  if (!cleaned.trim()) return "";
  const styled = applyListStyles(cleaned); // enforce inline bullets
  return `
  <tr>
    <td style="padding:16px 20px;border:1px solid #e5e7eb;border-radius:12px">
      <h3 style="margin:0 0 8px 0;font:800 18px/24px ${BASE_FONT};color:#111827">${escapeHtml(title)}</h3>
      <div style="color:#111827;font-family:${BASE_FONT};font-size:15px;line-height:22px">
        ${styled}
      </div>
    </td>
  </tr>
  <tr><td style="height:12px"></td></tr>`;
}

/** Normalize any resources markup (links, tables, line breaks) into a clean <ul> list with consistent bullets. */
function normalizeResourcesHtml(raw: string): string {
  let html = cleanImportedHtml(raw).trim();
  if (!html) return "";

  // If there are anchor tags, turn them into bullets with visible text
  const links = Array.from(html.matchAll(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gis));
  if (links.length) {
    const items = links.map((m) => {
      const href = m[1];
      const text = m[2].replace(/<[^>]+>/g, "").trim() || href;
      return `<li style="margin:6px 0 0 0;padding:0"><a href="${escapeAttr(href)}" target="_blank" rel="noreferrer">${escapeHtml(text)}</a></li>`;
    });
    return `<ul style="margin:8px 0 0 24px;padding:0;list-style-position:outside">${items.join("")}</ul>`;
  }

  // Handle tables → extract cell text as bullets
  if (/<table\b/i.test(html)) {
    const cells = Array.from(html.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi))
      .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
      .filter(Boolean);
    if (cells.length) {
      return `<ul style="margin:8px 0 0 24px;padding:0;list-style-position:outside">${cells.map((c) => `<li style="margin:6px 0 0 0;padding:0">${escapeHtml(c)}</li>`).join("")}</ul>`;
    }
    html = html.replace(/<\/?(table|thead|tbody|tr|t[hd])[^>]*>/gi, "");
  }

  // Convert line breaks to bullets if no <li> already
  const textish = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<div[^>]*>/gi, "")
    .replace(/<\/div>/gi, "\n")
    .trim();

  const lines = textish.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (lines.length > 1 && !/<li\b/i.test(html)) {
    return `<ul style="margin:8px 0 0 24px;padding:0;list-style-position:outside">${lines.map((l) => `<li style="margin:6px 0 0 0;padding:0">${escapeHtml(l)}</li>`).join("")}</ul>`;
  }

  // Ensure any existing list tags get inline bullet styles (even if they already had style)
  html = applyListStyles(html);
  return html;
}

/* ----------------- main ----------------- */
export function buildEmailHtml(fd: FormData): string {
  const banner = renderBanner(fd);
  const title = String(fd.programTitle || "Your Program/Project Title here");
  const summary = cleanImportedHtml(String(fd.programSummary || ""));

  // Titles
  const execTitle = (fd.execSummaryTitle as string) || (fd.executiveSummaryTitle as string) || "Executive Summary";
  let updatesTitle = (fd.updatesTitle as string) || "Highlights / Accomplishments";
  if (/^\s*Top Accomplishments\s*$/i.test(updatesTitle)) updatesTitle = "Highlights / Accomplishments";

  // Sections (HTML first, then plain)
  const execHtml       = pickSectionHtml(fd, ["executiveSummaryHtml","execSummaryHtml","summaryHtml"], ["executiveSummary","execSummary","summary"]);
  const highlightsHtml = pickSectionHtml(fd, ["highlightsHtml","updatesHtml","accomplishmentsHtml"], ["highlights","updates","accomplishments"]);
  const milestonesHtml = pickSectionHtml(fd, ["milestonesHtml"], ["milestones"]);
  const decisionsHtml  = pickSectionHtml(fd, ["keyDecisionsHtml","decisionsHtml"], ["keyDecisions","decisions"]);
  const risksHtml      = pickSectionHtml(fd, ["risksHtml","riskHtml"], ["risks","risk"]);

  // Resources
  const resourcesRaw   = pickSectionHtml(fd, ["resourcesHtml","additionalResourcesHtml"], ["resources","additionalResources"]);
  let normalizedResources = normalizeResourcesHtml(resourcesRaw);
  if (!normalizedResources && Array.isArray(fd.resources)) {
    normalizedResources = normalizeResourcesHtml(buildResourcesHtml(fd.resources as ResourceItem[]));
  }

  const parts: string[] = [];
  parts.push(headerBar(title));
  if (banner) parts.unshift(`<tr><td style="padding:0">${banner}</td></tr><tr><td style="height:12px"></td></tr>`);
  if (summary.trim()) {
    parts.push(`
    <tr>
      <td style="padding:16px 20px;border:1px solid #e5e7eb;border-radius:12px">
        <div style="color:#111827;font-family:${BASE_FONT};font-size:15px;line-height:22px">
          ${applyListStyles(summary)}
        </div>
      </td>
    </tr>
    <tr><td style="height:12px"></td></tr>`);
  }
  parts.push(`<tr><td>${statusAndPeople(fd)}</td></tr>`);

  // Ordered sections
  parts.push(sectionBlock(execTitle,        execHtml));
  parts.push(sectionBlock(updatesTitle,     highlightsHtml));
  parts.push(sectionBlock(fd.milestonesTitle   || "Milestones",                    milestonesHtml));
  parts.push(sectionBlock(fd.keyDecisionsTitle || "Key Decisions",                 decisionsHtml));
  parts.push(sectionBlock(fd.risksTitle        || "Risks & Issue Mitigation Plan", risksHtml));
  if (normalizedResources) {
    parts.push(sectionBlock(fd.resourcesTitle || "Additional Resources", normalizedResources));
  }

  const body = parts.filter(Boolean).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charSet="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(title)}</title>
<!-- buildEmailHtml: bullets-inline-v3 -->
</head>
<body style="font-family:${BASE_FONT}">
  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="border-collapse:collapse">
    <tr>
      <td align="center" style="padding:0">
        <table role="presentation" width="900" cellPadding="0" cellSpacing="0" style="border-collapse:collapse;width:900px;max-width:100%">
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

