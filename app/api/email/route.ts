// app/api/email/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs/promises";

// If you deploy on edge accidentally, fs won't work.
// Make sure this route runs on the Node runtime.
export const runtime = "nodejs";

// Map banner ids from the UI to their public files and cids
const BANNERS: Record<
  string,
  { cid: string; filename: string; relPath: string }
> = {
  gns:   { cid: "banner-gns",   filename: "gns-banner.png",   relPath: "banners/gns-banner.png" },
  azure: { cid: "banner-azure", filename: "azure-banner.png", relPath: "banners/azure-banner.png" },
  cie:   { cid: "banner-cie",   filename: "cie-banner.png",   relPath: "banners/cie-banner.png" },
  netmig:{ cid: "banner-netmig",filename: "OBN-mig.png",      relPath: "banners/OBN-mig.png" },
  azlens:{ cid: "banner-azlens",filename: "azure-lens.png",   relPath: "banners/azure-lens.png" },
  ipv6:  { cid: "banner-ipv6",  filename: "ipv6.png",         relPath: "banners/ipv6.png" },
};

// Shared inline logo (only attached if the HTML actually references it)
const LOGO = {
  cid: "gns-logo",
  filename: "gns-logo.png",
  relPath: "gns-logo.png", // /public/gns-logo.png
};

type Payload = {
  to: string;
  subject: string;
  html: string;
  // present only when the client is using CID banners
  bannerId?: string;
};

function env(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

async function fileAsAttachment(relPath: string, filename: string, cid: string) {
  const abs = path.join(process.cwd(), "public", relPath);
  const content = await fs.readFile(abs);
  return {
    filename,
    content,
    cid,
    contentType: inferMime(filename),
  };
}

function inferMime(filename: string) {
  const ext = filename.toLowerCase().split(".").pop() || "";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
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

    // --- Resend SMTP transporter (dev-friendly, works locally) ---
    const host = process.env.RESEND_SMTP_HOST || "smtp.resend.com";
    const port = Number(process.env.RESEND_SMTP_PORT || 587);
    const secure = port === 465; // true for 465, false for 587
    const user = process.env.RESEND_SMTP_USER || "resend";
    const pass = env("RESEND_API_KEY");

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    // --- Build attachments only if referenced in HTML ---
    const attachments: Array<any> = [];

    // Inline logo if present (cid:gns-logo)
    if (html.includes(`cid:${LOGO.cid}`)) {
      attachments.push(await fileAsAttachment(LOGO.relPath, LOGO.filename, LOGO.cid));
    }

    // Inline banner if client told us a CID banner id
    if (bannerId) {
      const banner = BANNERS[bannerId];
      if (banner && html.includes(`cid:${banner.cid}`)) {
        attachments.push(
          await fileAsAttachment(banner.relPath, banner.filename, banner.cid)
        );
      }
    }

    const fromAddr =
      process.env.MAIL_FROM ||
      `Status Bot <status@${(process.env.SENDMAIL_DOMAIN || "example.dev")}>`;

    const info = await transporter.sendMail({
      from: fromAddr,
      to,
      subject,
      html,
      attachments,
    });

    // nodemailer will return a preview url only for Ethereal;
    // for Resend-SMTP this is usually undefined, but keeping it here is harmless.
    const preview =
      // @ts-ignore - method exists on nodemailer
      (nodemailer as any).getTestMessageUrl?.(info) || undefined;

    return NextResponse.json(
      {
        ok: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
        previewUrl: preview,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[/api/email] ERROR:", err);
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
