import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs"; // ensure not running on the edge
export const dynamic = "force-dynamic"; // avoid static optimization caching the route

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    if (!to || !html) {
      return NextResponse.json({ error: "Missing 'to' or 'html'." }, { status: 400 });
    }

    // Normalize port/secure logic to avoid NaN pitfalls
    const port = Number(process.env.SMTP_PORT ?? 587);
    const secure = port === 465;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Optionally verify SMTP connection early (useful during setup)
    // await transporter.verify();

    // Read the logo file into memory; using content instead of path is more reliable on serverless
    let attachments = [];
    try {
      const logoPath = path.join(process.cwd(), "public", "gns-logo.png");
      const logo = await fs.readFile(logoPath);
      attachments.push({
        filename: "gns-logo.png",
        content: logo,
        cid: "gns-logo",
      });
    } catch {
      // If the file is missing in your deployment, skip inline image instead of failing the whole send
      attachments = [];
    }

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || '"Status Reports" <status@yourdomain.com>',
      to,
      subject: subject || "Status Report",
      html,
      attachments,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    // Surface a useful error back to the client
    return NextResponse.json(
      { error: "Email send failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
