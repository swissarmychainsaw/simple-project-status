// components/status-form/sections/buildEmailHtml.ts
// Drop-in: ensures banner is rendered at the top of the email using CID or Web URL.
// If you already have this file elsewhere in the tree, keep the path you use in imports.

import { buildResourcesHtml, ResourceItem } from "@/lib/status-form/applyProfileDefaults";
// If you already have a separate general HTML builder for the body, import it here.
// We keep the import optional to avoid breaking your setup.
// Comment this line out if you don't have buildHtml.ts.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import buildHtml from "./buildHtml";

type FormData = Record<string, any>;

function renderBanner(fd: FormData): string {
  const mode = (fd.optBannerMode as "cid" | "web") ?? (fd.bannerCid ? "cid" : "web");
  const alt = (fd.bannerAlt as string) || "Project banner";
  const style =
    "display:block;width:100%;height:auto;border:0;outline:0;text-decoration:none;";

  if (mode === "cid" && fd.bannerCid) {
    // Requires the sender to attach an image with matching Content-ID
    return `<img src="cid:${fd.bannerCid}" alt="${escapeHtml(alt)}" style="${style}" />`;
  }
  if (fd.bannerWeb) {
    return `<img src="${escapeAttr(fd.bannerWeb)}" alt="${escapeHtml(alt)}" style="${style}" />`;
  }
  return "";
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escapeAttr(s: string): string {
  return String(s).replace(/"/g, "&quot;");
}

export function buildEmailHtml(fd: FormData): string {
  const banner = renderBanner(fd);

  // If you have a dedicated body builder:
  let body = "";
  try {
    // @ts-ignore - optional import
    if (typeof buildHtml === "function") {
      body = buildHtml(fd);
    }
  } catch {
    // fall back to a minimal body showing core sections to avoid breaking
    const sections: string[] = [];
    if (fd.executiveSummaryHtml) sections.push(fd.executiveSummaryHtml);
    if (fd.highlightsHtml) sections.push(fd.highlightsHtml);
    if (fd.milestonesHtml) sections.push(fd.milestonesHtml);
    if (fd.keyDecisionsHtml) sections.push(fd.keyDecisionsHtml);
    if (fd.risksHtml) sections.push(fd.risksHtml);

    // Ensure resources are included in email even if UI renders custom HTML
    let resourcesBlock = "";
    if (fd.resourcesHtml) {
      resourcesBlock = fd.resourcesHtml;
    } else if (Array.isArray(fd.resources)) {
      resourcesBlock = buildResourcesHtml(fd.resources as ResourceItem[]);
    }
    if (resourcesBlock) sections.push(resourcesBlock);

    body = sections.filter(Boolean).join("\n\n");
  }

  // A very safe, minimal email wrapper
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charSet="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(fd.programTitle || "Status Report")}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue','Noto Sans',Arial,'Apple Color Emoji','Segoe UI Emoji';">
  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="border-collapse:collapse;">
    <tr>
      <td style="padding:0;">
        ${banner}
      </td>
    </tr>
    <tr>
      <td style="padding:16px;">
        ${body}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export default buildEmailHtml;

