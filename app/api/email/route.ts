import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";

export const runtime = "nodejs"; // Nodemailer needs Node runtime

export async function POST(req: Request) {
  const { to, subject, html } = await req.json();

  if (!to || !html) {
    return NextResponse.json({ error: "Missing 'to' or 'html'." }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false otherwise
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || '"Status Reports" <status@yourdomain.com>',
    to,
    subject: subject || "Status Report",
    html, // contains <img src="cid:gns-logo" ...>
    attachments: [
      {
        filename: "gns-logo.png",
        path: path.join(process.cwd(),
