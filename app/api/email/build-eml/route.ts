// app/api/email/build-eml/route.ts
// Builds a downloadable .eml (multipart/related) with CID-embedded banner.
// IMPORTANT: This route no longer injects any extra <img> banner markup.
// The ONLY HTML comes from buildEmailHtml(), which already renders the banner
// inside the 900px card via <img src="cid:banner-...">.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

import buildEmailHtml from "@/components/status-form/buildEmailHtml";
import {
  BANNERS as PROFILE_BANNERS,
  normalizeBannerKey,
  type BannerKey,
} from "@/components/status-form/projectProfiles";

type AnyRec = Record<string, any>;

type Payload = {
  formData?: AnyRec;
  designOptions?: AnyRec;
  // Optional: override subject/from for testing
  subject?: string;
  from?: string;
};

export const runtime = "nodejs";

function inferMime(filename: string) {
  const ext = filename.toLowerCase().split(".").pop() || "";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}

async function readPublicFile(rel: string): Promise<Buffer | null> {
  try {
    const abs = path.join(process.cwd(), "public", rel.replace(/^\//, ""));
    return await fs.readFile(abs);
  } catch {
    return null;
  }
}

function findReferencedCids(html: string): Set<string> {
  const cids = new Set<string>();
  const re = /<img[^>]*\ssrc\s*=\s*["']cid:([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) cids.add(m[1]);
  return cids;
}

function formatDateRFC2822(d = new Date()) {
  // Example: Thu, 25 Sep 2025 23:30:04 GMT
  return d.toUTCString();
}

function boundary(prefix = "rel") {
  // Simple, collision-resistant enough for our local use
  const rand = Math.random().toString(36).slice(2, 12);
  return `=_${prefix}_${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const { formData = {}, designOptions = {}, subject, from }: Payload = await req.json();

    // Build the single source-of-truth HTML (contains the 900px card + banner tag)
    const html = buildEmailHtml(formData, designOptions);

    // Collect any CID references from the HTML
    const referenced = findReferencedCids(html);

    // Map known banners (from projectProfiles) by cid -> file path
    const cidToFile: Record<string, { rel: string; filename: string; contentType: string }> = {};
    for (const meta of Object.values(PROFILE_BANNERS)) {
      const rel = meta.web.replace(/^\//, ""); // "/banners/x.png" -> "banners/x.png"
      const filename = path.basename(rel);
      cidToFile[meta.cid] = { rel, filename, contentType: inferMime(filename) };
    }

    // Load attachments for any referenced cids we know about
    const attachments: Array<{ cid: string; content: Buffer; filename: string; contentType: string }> = [];
    for (const cid of referenced) {
      const m = cidToFile[cid];
      if (!m) continue;
      const buf = await readPublicFile(m.rel);
      if (!buf) continue;
      attachments.push({ cid, content: buf, filename: m.filename, contentType: m.contentType });
    }

    // If a banner key is selected but HTML uses a different CID (legacy),
    // we still rely entirely on the HTML’s own <img src="cid:..."> tags.
    // No extra banner is injected here.

    // Build multipart/related .eml
    const relBoundary = boundary("rel");

    const lines: string[] = [];
    lines.push(`From: ${from || "Status Robot <no-reply@example.com>"}`);
    lines.push(`To: ${formData.emailTo || "you@example.com"}`);
    lines.push(`Subject: ${subject || formData.programTitle || "Status Report"}`);
    lines.push(`Date: ${formatDateRFC2822()}`);
    lines.push(`MIME-Version: 1.0`);
    lines.push(`Content-Type: multipart/related; boundary="${relBoundary}"; type="text/html"`);
    lines.push(""); // header/body break

    // Part 1: HTML
    lines.push(`--${relBoundary}`);
    lines.push(`Content-Type: text/html; charset="UTF-8"`);
    lines.push(`Content-Transfer-Encoding: 7bit`);
    lines.push("");
    // DO NOT inject any extra banner markup here. Use HTML from buildEmailHtml only.
    lines.push(html);
    lines.push("");

    // Parts 2..N: inline images
    for (const att of attachments) {
      lines.push(`--${relBoundary}`);
      lines.push(`Content-Type: ${att.contentType}`);
      lines.push(`Content-Transfer-Encoding: base64`);
      lines.push(`Content-ID: <${att.cid}>`);
      lines.push(`Content-Disposition: inline; filename="${att.filename}"`);
      lines.push("");
      lines.push(att.content.toString("base64").replace(/(.{76})/g, "$1\n"));
      lines.push("");
    }

    // Closing boundary
    lines.push(`--${relBoundary}--`);
    lines.push("");

    const eml = lines.join("\r\n");

    return new NextResponse(eml, {
      status: 200,
      headers: {
        // So curl > status.eml saves a ready-to-open EML
        "Content-Type": "message/rfc822; charset=utf-8",
        "Content-Disposition": `attachment; filename="status.eml"`,
      },
    });
  } catch (err: any) {
    console.error("[/api/email/build-eml] ERROR:", err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
