// app/api/email/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import path from "path";
import { readFileSync } from "fs";

// IMPORTANT: keep this on the Node.js runtime (do NOT set runtime="edge")
const resend = new Resend(process.env.RESEND_API_KEY);
const MAIL_FROM = process.env.MAIL_FROM || "Status Reports <onboarding@resend.dev>";

// Map banner keys → file path (under /public) and the CID you use in <img src="cid:...">
const BANNERS = {
  gns:   { file: "banners/gns-banner.png",   cid: "banner-gns" },
  azure: { file: "banners/azure-banner.png", cid: "banner-azure" },
  cie:   { file: "banners/cie-banner.png",   cid: "banner-cie" },
  netmig:{ file: "banners/OBN-mig.png",      cid: "banner-netmig" },
  azlens:{ file: "banners/azure-lens.png",   cid: "banner-azlens" },
  ipv6:  { file: "banners/ipv6.png",         cid: "banner-ipv6" },
} as const;

function publicFile(relPath: string) {
  const abs = path.join(process.cwd(), "public", relPath);
  return readFileSync(abs); // throws if missing → caught below
}

export async function POST(req: Request) {
  try {
    const { to, subject, html, bannerId } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, html" },
        { status: 400 }
      );
    }

    const attachments: Array<{ filename: string; content: Buffer; cid: string }> = [];

    // Inline logo if the HTML references it (src="cid:gns-logo")
    if ((html as string).includes("cid:gns-logo")) {
      attachments.push({
        filename: "gns-logo.png",
        content: publicFile("gns-logo.png"),
        cid: "gns-logo",
      });
    }

    // Inline banner if the client asked for a CID banner
    if (bannerId && (bannerId as keyof typeof BANNERS) in BANNERS) {
      const { file, cid } = BANNERS[bannerId as keyof typeof BANNERS];
      attachments.push({
        filename: path.basename(file),
        content: publicFile(file),
        cid,
      });
    }

    const { data, error } = await resend.emails.send({
      from: MAIL_FROM,
      to,
      subject,
      html,
      attachments: attachments.length ? attachments : undefined,
    });

    if (error) {
      return NextResponse.json(
        { error: "Email send failed", detail: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: data?.id ?? null });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Email send failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
