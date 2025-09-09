// app/api/email/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";



// app/api/email/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

// ✅ use the shared map & normalizer
import {
  BANNERS as PROFILE_BANNERS,
  normalizeBannerKey,
  type BannerKey,
} from "@/components/status-form/projectProfiles";


type Payload = { to: string; subject: string; html: string; bannerId?: string };

function required(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function inferMime(filename: string) {
  const ext = filename.toLowerCase().split(".").pop() || "";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}

async function safeFileAsAttachment(
  relPath: string,
  filename: string,
  cid: string
): Promise<{ filename: string; content: Buffer; cid: string; contentType: string } | null> {
  try {
    const abs = path.join(process.cwd(), "public", relPath);
    const content = await fs.readFile(abs);
    return { filename, content, cid, contentType: inferMime(filename) };
  } catch (err: any) {
    console.warn(`[email] Skipping missing inline asset "${relPath}" (cid:${cid}) — ${err?.code || "UNKNOWN"}`);
    return null;
  }
}

function stripUnattachedCidImages(html: string, attachedCids: Set<string>): string {
  const IMG_CID_RE = /<img[^>]*\ssrc\s*=\s*["']cid:([^"']+)["'][^>]*>/gi;
  return html.replace(IMG_CID_RE, (_m, cid) => (attachedCids.has(String(cid)) ? _m : ""));
}

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html, bannerId }: Payload = await req.json();
    if (!to || !subject || !html) {
      return NextResponse.json({ ok: false, error: "Missing 'to', 'subject', or 'html'." }, { status: 400 });
    }

    const host = process.env.RESEND_SMTP_HOST || "smtp.resend.com";
    const port = Number(process.env.RESEND_SMTP_PORT || 587);
    const secure = port === 465;
    const user = process.env.RESEND_SMTP_USER || "resend";
    const pass = required("RESEND_API_KEY");
    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

    const attachments: any[] = [];



    // ✅ Attach the requested banner (normalize legacy keys) if referenced
    if (bannerId) {
      const key = normalizeBannerKey(bannerId) as BannerKey;
      const meta = PROFILE_BANNERS[key];
      if (meta && html.includes(`cid:${meta.cid}`)) {
        const rel = meta.web.replace(/^\//, "");                   // "/banners/obn-banner.png" -> "banners/obn-banner.png"
        const filename = path.basename(rel);                       // "obn-banner.png"
        const att = await safeFileAsAttachment(rel, filename, meta.cid);
        if (att) attachments.push(att);
      }
    }

    // 🔐 Safety net: if the HTML references any other known banner CIDs, attach those too.
    for (const meta of Object.values(PROFILE_BANNERS)) {
      if (html.includes(`cid:${meta.cid}`) && !attachments.some(a => a.cid === meta.cid)) {
        const rel = meta.web.replace(/^\//, "");
        const filename = path.basename(rel);
        const att = await safeFileAsAttachment(rel, filename, meta.cid);
        if (att) attachments.push(att);
      }
    }

    // Remove any leftover cid images we didn't/couldn't attach
    const attachedCids = new Set<string>(attachments.map((a: any) => a.cid));
    const finalHtml = stripUnattachedCidImages(html, attachedCids);

    const fromAddr = process.env.MAIL_FROM || `Status Bot <status@${(process.env.SENDMAIL_DOMAIN || "example.dev")}>`;

    const info = await transporter.sendMail({ from: fromAddr, to, subject, html: finalHtml, attachments });

    return NextResponse.json(
      { ok: true, messageId: info.messageId, accepted: info.accepted, rejected: info.rejected, response: info.response },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[/api/email] ERROR:", err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}







type Payload = {
  to: string;
  subject: string;
  html: string;
  bannerId?: string; // present for CID mode
};

function required(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function inferMime(filename: string) {
  const ext = filename.toLowerCase().split(".").pop() || "";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}

async function safeFileAsAttachment(
  relPath: string,
  filename: string,
  cid: string
): Promise<{ filename: string; content: Buffer; cid: string; contentType: string } | null> {
  try {
    const abs = path.join(process.cwd(), "public", relPath);
    const content = await fs.readFile(abs);
    return { filename, content, cid, contentType: inferMime(filename) };
  } catch (err: any) {
    // Don't fail the whole email—just warn and skip the attachment.
    const code = err?.code || "UNKNOWN";
    console.warn(`[email] Skipping missing inline asset "${relPath}" (cid:${cid}) — ${code}`);
    return null;
  }
}

// Remove any <img src="cid:…"> whose CID we didn't end up attaching.
// This prevents broken image boxes and alt text from showing.
function stripUnattachedCidImages(html: string, attachedCids: Set<string>): string {
  const IMG_CID_RE = /<img[^>]*\ssrc\s*=\s*["']cid:([^"']+)["'][^>]*>/gi;
  return html.replace(IMG_CID_RE, (_m, cid) => (attachedCids.has(String(cid)) ? _m : ""));
}

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html, bannerId }: Payload = await req.json();
    if (!to || !subject || !html) {
      return NextResponse.json(
        { ok: false, error: "Missing 'to', 'subject', or 'html'." },
        { status: 400 }
      );
    }

    // Resend SMTP (works great in dev too)
    const host = process.env.RESEND_SMTP_HOST || "smtp.resend.com";
    const port = Number(process.env.RESEND_SMTP_PORT || 587);
    const secure = port === 465;
    const user = process.env.RESEND_SMTP_USER || "resend";
    const pass = required("RESEND_API_KEY");

    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

    const attachments: any[] = [];



    // Inline banner if requested + referenced
    if (bannerId) {
      const banner = BANNERS[bannerId];
      if (banner && html.includes(`cid:${banner.cid}`)) {
        const att = await safeFileAsAttachment(banner.relPath, banner.filename, banner.cid);
        if (att) attachments.push(att);
      }
    }

    // Strip any cid images we didn't attach (e.g., file missing)
    const attachedCids = new Set<string>(attachments.map((a) => a.cid));
    const finalHtml = stripUnattachedCidImages(html, attachedCids);

    const fromAddr =
      process.env.MAIL_FROM ||
      `Status Bot <status@${(process.env.SENDMAIL_DOMAIN || "example.dev")}>`;

    const info = await transporter.sendMail({
      from: fromAddr,
      to,
      subject,
      html: finalHtml,
      attachments,
    });

    return NextResponse.json(
      {
        ok: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
        // previewUrl is typically only for Ethereal; Resend SMTP won't return one.
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[/api/email] ERROR:", err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
