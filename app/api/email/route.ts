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

    // normalize recipients (supports string, array, or comma/space separated)
    const toList: string[] = Array.isArray(to)
      ? to
      : String(to)
          .split(/[,\s;]+/)
          .map(s => s.trim())
          .filter(Boolean);

    const attachments: Array<{
      filename: string;
      content: string;
      encoding: "base64";
      contentType?: string;
      contentId?: string;
    }> = [];

    try {
      const logoPath = path.join(process.cwd(), "public", "gns-logo.png");
      const logoB64 = await readFile(logoPath, { encoding: "base64" });
      attachments.push({
        filename: "gns-logo.png",
        content: logoB64,
        encoding: "base64",
        contentType: "image/png",
        contentId: "gns-logo", // matches <img src="cid:gns-logo" />
      });
    } catch (err) {
      console.warn("Logo not found, skipping inline attachment:", err);
    }

    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM ?? "Status Reports <status@yourdomain.com>",
      to: toList,
      subject: subject || "Status Report",
      html,           // must contain <img src="cid:gns-logo" />
      attachments,    // inline cid attachment
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
