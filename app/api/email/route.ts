// app/api/email/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";           // ensure Node runtime (not Edge)
export const dynamic = "force-dynamic";    // don't cache

import nodemailer from "nodemailer";
import path from "path";

const BANNERS = {
  gns:   { cid: "banner-gns",   file: "gns-banner.png" },
  azure: { cid: "banner-azure", file: "azure-banner.png" },
  cie:   { cid: "banner-cie",   file: "cie-banner.png" },
  netmig:{ cid: "banner-netmig",file: "OBN-mig.png" },
  azlens:{ cid: "banner-azlens",file: "azure-lens.png" },
  ipv6:  { cid: "banner-ipv6",  file: "ipv6.png" },
} as const;

function publicPath(...p: string[]) {
  return path.join(process.cwd(), "public", ...p);
}

async function makeTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    const port = Number(SMTP_PORT);
    const secure = port === 465; // 465 = SSL/TLS
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      logger: true, // logs to server console
    });
    await transporter.verify();
    return { transporter, usingEthereal: false as const };
  }

  // Dev fallback: Ethereal (test inbox + preview URL)
  const acct = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: acct.smtp.host,
    port: acct.smtp.port,
    secure: acct.smtp.secure,
    auth: { user: acct.user, pass: acct.pass },
    logger: true,
  });
  await transporter.verify();
  return { transporter, usingEthereal: true as const };
}

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html, bannerId } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Missing to/subject/html" }, { status: 400 });
    }

    const { transporter, usingEthereal } = await makeTransporter();

    const attachments: nodemailer.Attachment[] = [];

    // Always include the logo if HTML references cid:gns-logo
    attachments.push({
      filename: "gns-logo.png",
      path: publicPath("gns-logo.png"),
      cid: "gns-logo",
    });

    // Optional CID banner
    if (bannerId && (bannerId in BANNERS)) {
      const b = BANNERS[bannerId as keyof typeof BANNERS];
      attachments.push({
        filename: b.file,
        path: publicPath("banners", b.file),
        cid: b.cid,
      });
    }

    const fromAddr =
      process.env.MAIL_FROM ||
      process.env.SMTP_USER ||            // many providers require from === authenticated user
      "no-reply@example.com";

    const info = await transporter.sendMail({
      from: fromAddr,
      to,
      subject,
      html,
      attachments,
    });

    // Useful details to debug deliverability
    const payload: any = {
      ok: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    };

    if (usingEthereal) {
      payload.previewUrl = nodemailer.getTestMessageUrl(info); // open to view the email
    }

    console.log("[/api/email] sendMail result:", payload);
    return NextResponse.json(payload);
  } catch (err: any) {
    console.error("[/api/email] error:", err);
    return NextResponse.json({ error: err?.message || "Send failed" }, { status: 500 });
  }
}
