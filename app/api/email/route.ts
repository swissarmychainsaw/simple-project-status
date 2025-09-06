import { NextResponse } from "next/server";
import { Resend } from "resend";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    if (!to || !html) {
      return NextResponse.json({ error: "Missing 'to' or 'html'." }, { status: 400 });
    }

    // Read logo file into memory
    let attachments: any[] = [];
    try {
      const logoPath = path.join(process.cwd(), "public", "gns-logo.png");
      const logo = await fs.readFile(logoPath);

      attachments.push({
        filename: "gns-logo.png",
        content: logo.toString("base64"),
        encoding: "base64",
        contentId: "gns-logo", // reference in HTML with cid:gns-logo
      });
    } catch (err) {
      console.warn("Logo not found, skipping inline attachment", err);
    }

    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM || "Status Reports <status@yourdomain.com>",
      to,
      subject: subject || "Status Report",
      html, // make sure your <img src="cid:gns-logo" /> matches contentId above
      attachments,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Email send failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
