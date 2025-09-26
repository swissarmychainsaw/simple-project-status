// app/api/eml/route.ts
// Build an .eml using client HTML if provided; otherwise fall back to server builder.
// This prevents 400s while we diagnose the client payloads.

import { NextResponse } from "next/server";
export const runtime = "nodejs";

// Optional: your project’s builder, used only as a fallback.
import buildEmailHtml from "@/components/status-form/buildEmailHtml";

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const postedHtml =
      typeof body?.html === "string" && body.html.trim() ? body.html : "";
    const subject =
      (typeof body?.subject === "string" && body.subject.trim()) ||
      "Status Report";
    const from =
      (typeof body?.from === "string" && body.from.trim()) ||
      "no-reply@example.com";
    const to =
      (typeof body?.to === "string" && body.to.trim()) ||
      "someone@example.com";

    console.info("[/api/eml] keys:", Object.keys(body || {}));
    console.info("[/api/eml] postedHtml? ", !!postedHtml, "len:", postedHtml.length);

    let html = postedHtml;
    if (!html) {
      try {
        html = buildEmailHtml ? buildEmailHtml(body?.formData || {}) : "";
        console.info("[/api/eml] fallback builder used, len:", html?.length || 0);
      } catch (e: any) {
        console.warn("[/api/eml] fallback builder failed:", e?.message || e);
        html = "";
      }
    }

    if (!html) {
      return NextResponse.json(
        { ok: false, error: "No HTML provided and fallback builder returned empty." },
        { status: 422 }
      );
    }

    const boundary = "mixed_" + Math.random().toString(36).slice(2);
    const eml = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      html,
      ``,
      `--${boundary}--`,
      ``,
    ].join("\r\n");

    const filename =
      (typeof body?.filename === "string" && body.filename.trim()) ||
      "status_report.eml";

    return new NextResponse(eml, {
      status: 200,
      headers: {
        "Content-Type": "message/rfc822",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to build EML" },
      { status: 500 }
    );
  }
}

