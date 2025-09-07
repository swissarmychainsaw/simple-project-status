// app/api/email/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";          // IMPORTANT: Resend SDK & fs need Node runtime
export const dynamic = "force-dynamic";

import path from "node:path";
import fs from "node:fs/promises";

import nodemailer from "nodemailer";
import { Resend } from "resend";

type BannerKey = "gns" | "azure" | "cie" | "netmig" | "azlens" | "ipv6";

const LOGO = { cid: "gns-logo", file: "gns-logo.png", contentType: "image/png" };
const BANNERS: Record<BannerKey, { cid: string; file: string; contentType: string }> = {
  gns:   { cid: "banner-gns",   file: "banners/gns-banner.png",   contentType: "image/png" },
  azure: { cid: "banner-azure", file: "banners/azure-banner.png", contentType: "image/png" },
  cie:   { cid: "banner-cie",   file: "banners/cie-banner.png",   contentType: "image/png" },
  netmig:{ cid: "banner-netmig",file: "banners/OBN-mig.png",      contentType: "image/png" },
  azlens:{ cid: "banner-azlens",file: "banners/azure-lens.png",   contentType: "image/png" },
  ipv6:  { cid: "banner-ipv6",  file: "banners/ipv6.png",         contentType: "image/png" },
};

function publicPath(rel: string) {
  return path.join(process.cwd(), "public", rel.replace(/^\/+/, ""));
}

async function loadAttachment(fileRel: string) {
  const abs = publicPath(fileRel);
  const content = await fs.readFile(abs);
  return content;
}

export async function POST(req: Request) {
  try {
    const { to, subject, html, bannerId } = await req.json() as {
      to: string; subject: string; html: string; bannerId?: BannerKey;
    };

    if (!to || !subject || !html) {
      return NextResponse.json({ ok: false, error: "Missing to/subject/html" }, { status: 400 });
    }

    // Build inline attachments if your HTML references cid:gns-logo or cid:banner-*
    const attachmentsForCid: Array<
      | { filename: string; content: Buffer; contentType: string; content_id: string } // Resend shape
      | { filename: string; content: Buffer; contentType: string; cid: string }        // Nodemailer shape
    > = [];

    // Always add logo (your HTML includes cid:gns-logo if optLogoMode="cid")
    try {
      const logoBuf = await loadAttachment(LOGO.file);
      attachmentsForCid.push({
        filename: LOGO.file.split("/").pop()!,
        content: logoBuf,
        contentType: LOGO.contentType,
        // Resend uses "content_id", Nodemailer uses "cid" — we add both keys below per driver.
        // Here we temporarily store under the Resend key; we remap for Nodemailer later.
        content_id: LOGO.cid,
      } as any);
    } catch { /* logo optional */ }

    // Optional banner (only when the client sent bannerId and the HTML uses cid:<banner-cid>)
    if (bannerId && BANNERS[bannerId]) {
      try {
        const b = BANNERS[bannerId];
        const buf = await loadAttachment(b.file);
        attachmentsForCid.push({
          filename: b.file.split("/").pop()!,
          content: buf,
          contentType: b.contentType,
          content_id: b.cid,
        } as any);
      } catch { /* banner optional */ }
    }

    const hasResend = !!process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || "reports@your-verified-domain.com"; // must be a verified domain in Resend

    // Prefer Resend API whenever the key exists, regardless of NODE_ENV.
    if (hasResend) {
      const resend = new Resend(process.env.RESEND_API_KEY!);

      // Resend wants attachments like { filename, content, contentType, content_id }
      const apiAttachments = attachmentsForCid as Array<{
        filename: string; content: Buffer; contentType?: string; content_id?: string;
      }>;

      const resp = await resend.emails.send({
        from,
        to,
        subject,
        html,
        attachments: apiAttachments,
      });

      if (resp.error) {
        // Bubble up Resend’s error so you can see it in your logs/Toast
        return NextResponse.json({ ok: false, driver: "resend", error: resp.error }, { status: 500 });
      }

      return NextResponse.json({ ok: true, driver: "resend", id: resp.data?.id ?? null });
    }

    // === Fallback: Ethereal test transport ===
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });

    // Nodemailer wants attachments with "cid" (not content_id)
    const nodeAttachments = (attachmentsForCid as any[]).map(a => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
      cid: a.content_id, // remap for Nodemailer
    }));

    const info = await transporter.sendMail({
      from: `"Status Reports" <no-reply@example.test>`,
      to,
      subject,
      html,
      attachments: nodeAttachments,
    });

    return NextResponse.json({
      ok: true,
      driver: "ethereal",
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      previewUrl: nodemailer.getTestMessageUrl(info),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
