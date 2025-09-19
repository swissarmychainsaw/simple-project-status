// lib/email/bannerAttachment.ts
// Build a Nodemailer-compatible attachment for CID banners.

import fs from "fs";
import path from "path";

export function buildBannerAttachment(fd: Record<string, any>) {
  const mode = (fd.optBannerMode as "cid" | "web") ?? "cid";
  if (mode !== "cid") return [];

  const cid = (fd.bannerCid as string) || "";
  const web = (fd.bannerWeb as string) || "";
  if (!cid) return [];

  // We expect bannerWeb to be something like "/banners/gns-banner.png" in /public.
  const rel = web.startsWith("/") ? web : "";
  const abs = rel ? path.join(process.cwd(), "public", rel) : "";

  if (!abs || !fs.existsSync(abs)) {
    // If the file isn't found, we skip attaching (CID img won't show).
    return [];
  }

  const filename = path.basename(abs);
  const content = fs.readFileSync(abs); // Buffer

  return [
    {
      filename,
      content,     // Buffer
      cid,         // MUST match src="cid:…"
      contentType: guessMime(filename),
    },
  ];
}

function guessMime(filename: string): string {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf(".") + 1);
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

