// app/api/email/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type ApiBody = {
  to: string | string[];
  subject?: string;
  html: string;
  text?: string;
  from?: string;
  bannerId?: string; // e.g. "gns", "azure", ... only sent when using CID banners
};

type Driver = "resend-smtp" | "ethereal";

// Map the CID tokens used in your HTML to files in /public
// (These match your frontend constants: LOGO_CID and BANNERS[*].cid)
const CID_TO_PUBLIC_FILE: Record<string, string> = {
  "gns-logo": "/gns-logo.png",

  "banner-gns": "/banners/gns-banner.png",
  "banner-azure": "/banners/azure-banner.png",
  "banner-cie": "/banners/cie-banner.png",
  "banner-netmig": "/banners/OBN-mig.png",
  "banner-azlens": "/banners/azure-lens.png",
  "banner-ipv6": "/banners/ipv6.png",
};

// Helper: turn a /public relative path into an absolute FS path
const publicPath = (rel: string) => path.join(process.cwd(), "public", rel.replace(/^\//, ""));

// Find any cid:* references in the HTML so we can attach them automatically
function findCidsInHtml(html: string): Set<string> {
  const out = new Set<string>();
  const re = /cid:([a-zA-Z0-9._-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.add(m[1]);
  return out;
}

async function buildCidAttachments(html: string, bannerId?: string) {
  const cids = findCidsInHtml(html);

  // If the client told us which banner is in CID mode, ensure its CID is included
  if (bannerId) cids.add(`banner-${bannerId}`);

  const attachments: Array<{
    filename: string;
    path: string;
    cid: string;
  }> = [];

  for (const cid of cids) {
    const rel = CID_TO_PUBLIC_FILE[cid];
    if (!rel) continue;
    const abs = publicPath(rel);
    try {
      await fs.access(abs);
      attachments.push({
        filename: path.basename(abs),
        path: abs,
        cid,
      });
    } catch {
      console.warn(`[email] Skipping missing CID asset: ${cid} -> ${abs}`);
    }
  }
  return attachments;
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const driverParam = url.searchParams.get("driver"); // optional override: ?driver=ethereal or ?driver=resend
    const body = (await req.json()) as ApiBody;

    if (!body?.to || !body?.html) {
      return NextResponse.json(
        { ok: false, error: "`to` and `html` are required" },
        { status: 400 },
      );
    }

    // Decide mail driver
    let driver: Driver = "ethereal";
    if (driverParam === "resend") driver = "resend-smtp";
    else if (driverParam === "ethereal") driver = "ethereal";
    else if (process.env.RESEND_API_KEY) driver = "resend-smtp";

    // Create transporter
    let transporter;
    if (driver === "resend-smtp") {
      if (!process.env.RESEND_API_KEY) {
        return NextResponse.json(
          { ok: false, error: "RESEND_API_KEY is missing but driver=resend-smtp was selected" },
          { status: 500 },
        );
      }
      transporter = nodemailer.createTransport({
        host: "smtp.resend.com",
        port: 465,
        secure: true,
        auth: {
          user: "resend",
          pass: process.env.RESEND_API_KEY,
        },
      });
    } else {
      // Ethereal fallback (only when no RESEND key or explicitly forced)
      const test = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: test.smtp.host,
        port: test.smtp.port,
        secure: test.smtp.secure,
        auth: { user: test.user, pass: test.pass },
      });
    }

    // Build attachments for any cid:* refs (logo/banner) from /public
    const cidAttachments = await buildCidAttachments(body.html, body.bannerId);

    // From: prefer body.from, then env, then a harmless default (note: Resend requires a verified domain)
    const fromAddress =
      body.from ||
      process.env.MAIL_FROM || // e.g. "reports@yourdomain.com"
      "no-reply@example.com";

    const info = await transporter.sendMail({
      from: fromAddress,
      to: body.to,
      subject: body.subject || "Status Report",
      html: body.html,
      text: body.text, // optional plain text
      attachments: cidAttachments,
    });

    const previewUrl =
      driver === "ethereal" ? nodemailer.getTestMessageUrl(info) : undefined;

    const payload = {
      ok: true,
      driver,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      ...(previewUrl ? { previewUrl } : {}),
    };

    console.log("[/api/email] sendMail result:", payload);
    return NextResponse.json(payload);
  } catch (err: any) {
    console.error("[/api/email] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 },
    );
    }
}
