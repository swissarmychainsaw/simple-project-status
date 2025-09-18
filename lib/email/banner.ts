// lib/email/banner.ts
import { BANNERS, type BannerKey } from "@/components/status-form/projectProfiles";

export const EMAIL_MAX_WIDTH = 900;

export const escapeHtml = (s: string): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

export const absoluteUrl = (p: string) => {
  try {
    return new URL(p, window.location.origin).toString();
  } catch {
    return p;
  }
};

export function getBannerHtml(
  forEmail: boolean,
  opts: {
    optBannerMode: "url" | "cid" | "none";
    optBannerId?: string;
    optBannerUrl?: string;
    optBannerCaption?: string;
  },
  maxWidth = EMAIL_MAX_WIDTH
): string {
  if (opts.optBannerMode === "none") return "";

  let src = "";
  const key = (opts.optBannerId || "") as BannerKey;
  const meta = key ? BANNERS[key] : undefined;

  if (opts.optBannerMode === "url" && opts.optBannerUrl) {
    src = absoluteUrl(opts.optBannerUrl);
  } else if (opts.optBannerMode === "cid") {
    if (forEmail && meta?.cid) {
      src = `cid:${meta.cid}`;
    } else if ((meta as any)?.web) {
      src = absoluteUrl((meta as any).web);
    } else if ((meta as any)?.url) {
      src = absoluteUrl((meta as any).url);
    }
  }
  if (!src) return "";

  const caption = opts.optBannerCaption || "Program Status";
  const alt = (meta as any)?.alt || caption;

  const img = `
    <img src="${escapeHtml(src)}"
         alt="${escapeHtml(alt)}"
         width="${maxWidth}"
         style="display:block;width:100%;max-width:${maxWidth}px;height:auto;border:0;outline:0;-ms-interpolation-mode:bicubic;" />
  `;
  if (forEmail) return img;

  return `${img}
    <div style="font-weight:600;text-align:center;margin:8px 0 4px 0;color:#111;font-size:18px;line-height:1.3;">
      ${escapeHtml(caption)}
    </div>`;
}

