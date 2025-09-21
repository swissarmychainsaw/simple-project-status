// lib/email/buildEml.ts
import buildEmailHtml from "@/components/status-form/buildEmailHtml";
import fs from "fs/promises";
import path from "path";

type FormData = Record<string, any>;

function crlf(s: string) {
  return s.replace(/\r?\n/g, "\r\n");
}
function formatDateRFC2822(d = new Date()) {
  return d.toUTCString().replace("GMT", "+0000");
}
function stripHtmlToText(html: string) {
  const noScripts = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  const noStyles = noScripts.replace(/<style[\s\S]*?<\/style>/gi, "");
  const withBreaks = noStyles
    .replace(/<\/(p|div|li|h\d|tr|br)>/gi, "\n")
    .replace(/<li>/gi, "• ");
  const text = withBreaks.replace(/<[^>]+>/g, "");
  return text.replace(/\n{3,}/g, "\n\n").trim();
}
function wrapBase64(b64: string, width = 76) {
  const out: string[] = [];
  for (let i = 0; i < b64.length; i += width) out.push(b64.slice(i, i + width));
  return out.join("\r\n");
}
function detectMimeFromExt(ext: string) {
  const e = ext.toLowerCase();
  if (e === ".png") return "image/png";
  if (e === ".jpg" || e === ".jpeg") return "image/jpeg";
  if (e === ".gif") return "image/gif";
  if (e === ".webp") return "image/webp";
  if (e === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}
function detectExtFromMime(mime?: string) {
  if (!mime) return "bin";
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("svg")) return "svg";
  return "bin";
}

/** Try to get banner bytes from data URI, base64, http(s), or /public (for relative paths). */
async function getBannerBytesAndMime(fd: FormData): Promise<{ b64: string; mime: string; filename: string } | null> {
  // 1) data URI
  const dataUri = fd.bannerDataUri as string | undefined;
  if (dataUri && /^data:/i.test(dataUri)) {
    const [, meta, raw] = dataUri.match(/^data:([^;]+);base64,(.*)$/i) || [];
    if (raw) {
      const mime = meta || "image/png";
      const filename = `banner.${detectExtFromMime(mime)}`;
      return { b64: raw, mime, filename };
    }
  }

  // 2) raw base64
  const base64 = fd.bannerBase64 as string | undefined;
  const base64Mime = (fd.bannerMime as string | undefined) || "image/png";
  if (base64 && /^[A-Za-z0-9+/=]+$/.test(base64)) {
    const filename = `banner.${detectExtFromMime(base64Mime)}`;
    return { b64: base64, mime: base64Mime, filename };
  }

  // 3) absolute http(s)
  const web = fd.bannerWeb as string | undefined;
  if (web && /^https?:\/\//i.test(web)) {
    try {
      const res = await fetch(web);
      if (!res.ok) throw new Error(String(res.status));
      const mime = res.headers.get("content-type") || "image/png";
      const buf = await res.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      const filename = `banner.${detectExtFromMime(mime)}`;
      return { b64, mime, filename };
    } catch {
      // ignore; fall through
    }
  }

  // 4) relative path under /public (e.g., "/banners/gns-banner.png")
  if (web && web.startsWith("/")) {
    try {
      const publicPath = path.join(process.cwd(), "public", web);
      const buf = await fs.readFile(publicPath);
      const ext = path.extname(publicPath) || ".png";
      const mime = detectMimeFromExt(ext);
      const b64 = Buffer.from(buf).toString("base64");
      const filename = `banner${ext}`;
      return { b64, mime, filename };
    } catch {
      // ignore; no banner
    }
  }

  return null;
}

export async function buildEmlFromForm(fd: FormData) {
  // Build existing HTML exactly as-is
  let html = buildEmailHtml(fd);
  const text = stripHtmlToText(html);

  // Inline attachments (banner via CID if present)
  const inlineParts: string[] = [];
  const bannerCid = (fd.bannerCid as string | undefined)?.trim();
  if (bannerCid && /src="cid:/i.test(html)) {
    const banner = await getBannerBytesAndMime(fd);
    if (banner) {
      // Ensure HTML references the same CID
      const cidRx = new RegExp(`src="cid:${bannerCid.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}"`, "i");
      if (!cidRx.test(html)) {
        html = html.replace(/<img([^>]*?)src="[^"]+"([^>]*?)>/i, `<img$1src="cid:${bannerCid}"$2>`);
      }
      inlineParts.push(
        [
          `Content-Type: ${banner.mime}; name="${banner.filename}"`,
          "Content-Transfer-Encoding: base64",
          `Content-ID: <${bannerCid}>`,
          `Content-Disposition: inline; filename="${banner.filename}"`,
          "",
          wrapBase64(banner.b64),
          "",
        ].join("\r\n")
      );
    }
  }

  // multipart/related (outer) → multipart/alternative (inner) → text/plain + text/html
  const b1 = "b1_" + Math.random().toString(36).slice(2); // related
  const b2 = "b2_" + Math.random().toString(36).slice(2); // alternative

  const date = formatDateRFC2822();
  const subject = (fd?.emailSubject as string) || `Status Report — ${fd?.programTitle || "Project"}`;
  const from = (fd?.emailFrom as string) || "status-report@local";
  const to = (fd?.emailTo as string) || "me@local";

const eml =
`From: ${from}
To: ${to}
Subject: ${subject}
X-Unsent: 1
MIME-Version: 1.0
Content-Type: multipart/related; boundary="${b1}"

--${b1}
Content-Type: multipart/alternative; boundary="${b2}"

--${b2}
Content-Type: text/plain; charset=UTF-8

${text}

--${b2}
Content-Type: text/html; charset=UTF-8

${html}

--${b2}--
${inlineParts.length ? "\r\n" + inlineParts.map(p => `--${b1}\r\n${p}`).join("\r\n") + "\r\n" : ""}--${b1}--
`;

  return crlf(eml);
}

export function makeEmlFilename(fd: FormData, when = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = when.getFullYear();
  const mm = pad(when.getMonth() + 1);
  const dd = pad(when.getDate());
  const hh = pad(when.getHours());
  const mi = pad(when.getMinutes());
  return `status_report_${yyyy}_${mm}_${dd}_${hh}${mi}.eml`;
}

