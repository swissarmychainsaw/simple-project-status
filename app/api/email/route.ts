// app/api/email/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import path from "path";
import { readFile } from "fs/promises";

export const runtime = "nodejs";
const resend = new Resend(process.env.RESEND_API_KEY);

// Whitelist of CID-embeddable banners in /public/banners/*
const BANNERS: Record<string, { filename: string; relPath: string; contentId: string; contentType: string }> = {
  gns:   { filename: "gns-banner.png",   relPath: "public/banners/gns-banner.png",   contentId: "banner-gns",   contentType: "image/png" },
  azure: { filename: "azure-banner.png", relPath: "public/banners/azure-banner.png", contentId: "banner-azure", contentType: "image/png" },
  cie:   { filename: "cie-banner.png",   relPath: "public/banners/cie-banner.png",   contentId: "banner-cie",   contentType: "image/png" },
  netmig:{ filename: "network-mig.png",  relPath: "public/banners/network-mig.png",  contentId: "banner-netmig",contentType: "image/png" },
  azlens:{ filename: "azure-lens.png",   relPath: "public/banners/azure-lens.png",   contentId: "banner-azlens",contentType: "image/png" },
  ipv6:  { filename: "ipv6.png",         relPath: "public/banners/ipv6.png",         contentId: "banner-ipv6", contentType: "image/png" },
};

// Inline logo used in HTML as <img src="cid:gns-logo" .../>
const LOGO = { filename: "gns-logo.png", relPath: "public/gns-logo.png", contentId: "gns-logo", contentType: "image/png" };

export async function POST(req: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY is not set" }, { status: 500 });
    }

    const body = await req.json();
    const { to, subject, html, bannerId, embedLogo = true } = body as {
      to: string | string[];
      subject?: string;
      html: string;
      bannerId?: string;     // one of BANNERS keys if using CID banner
      embedLogo?: boolean;   // default true; keeps your inline logo working
    };

    if (!to || !html) {
      return NextResponse.json({ error: "Missing 'to' or 'html'." }, { status: 400 });
    }

    const attachments: Array<{ filename: string; content: Buffer; contentType?: string; contentId?: string }> = [];

    // Attach logo for cid:gns-logo
    if (embedLogo) {
      try {
        const logoBuf = await readFile(path.join(process.cwd(), LOGO.relPath));
        attachments.push({
          filename: LOGO.filename,
          content: logoBuf,
          contentType: LOGO.contentType,
          contentId: LOGO.contentId,
        });
      } catch (e) {
        console.warn("Logo not found; skipping inline logo:", e);
      }
    }

    // Attach banner for cid:banner-*
    if (bannerId && BANNERS[bannerId]) {
      try {
        const b = BANNERS[bannerId];
        const buf = await readFile(path.join(process.cwd(), b.relPath));
        attachments.push({
          filename: b.filename,
          content: buf,
          contentType: b.contentType,
          contentId: b.contentId,
        });
      } catch (e) {
        console.warn(`Banner '${bannerId}' not found; skipping inline banner:`, e);
      }
    }

    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM ?? "Status Reports <status@yourdomain.com>",
      to: Array.isArray(to) ? to : [to],
      subject: subject || "Status Report",
      html,
      attachments,
    });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Email send failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
