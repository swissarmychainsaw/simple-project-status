import { NextRequest, NextResponse } from "next/server";
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

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html, bannerId } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Missing to/subject/html" }, { status: 400 });
    }

    // Create transporter (configure your SMTP creds)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });

    const attachments: any[] = [];

    // Always include the logo if your HTML references `cid:gns-logo`
    attachments.push({
      filename: "gns-logo.png",
      path: path.join(process.cwd(), "public", "gns-logo.png"),
      cid: "gns-logo",
    });

    // Include a banner if client told us to use a CID banner
    if (bannerId && BANNERS[bannerId as keyof typeof BANNERS]) {
      const banner = BANNERS[bannerId as keyof typeof BANNERS];
      attachments.push({
        filename: banner.file,
        path: path.join(process.cwd(), "public", "banners", banner.file),
        cid: banner.cid,
      });
    }

    await transporter.sendMail({
      from: process.env.MAIL_FROM || "no-reply@example.com",
      to,
      subject,
      html,
      attachments,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Send failed" }, { status: 500 });
  }
}
