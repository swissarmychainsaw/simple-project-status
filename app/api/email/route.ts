// app/api/email/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import path from "path";
import { readFile } from "fs/promises";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY is not set" }, { status: 500 });
    }

    const { to, subject, html } = await req.json();

    if (!to || !html) {
      return NextResponse.json({ error: "Missing 'to' or 'html'." }, { status: 400 });
    }

    // Try to attach the logo inline (referenced in HTML as <img src="cid:gns-logo" />)
    const attachments: Array<{
      filename: string;
      content: Buffer | string;
      contentType?: string;
      contentId?: string;
    }> = [];

    try {

const logoPath = path.join(process.cwd(), "public", "gns-logo.png");
const logo = await readFile(logoPath);

const attachments = [
  {
    filename: "gns-logo.png",
    content: logo.toString("base64"),
    encoding: "base64",
    contentType: "image/png",
    contentId: "gns-logo", // must match <img src="cid:gns-logo">
  },
];


      
    } catch (err) {
      // Don’t fail the request if the logo is missing
      console.warn("Logo not found, skipping inline attachment:", err);
    }

    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM ?? "Status Reports <status@yourdomain.com>",
      to: Array.isArray(to) ? to : [to],
      subject: subject || "Status Report",
      html,
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
