// app/api/google/import/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { loadServerEnv } from "@/lib/env/load";
import { parseGoogleDocHtml } from "@/lib/google/parseGoogleDocHtml";
import { exportGoogleDocHtmlWithServiceAccount } from "@/lib/google/driveExport";

loadServerEnv(); // ensure env is loaded

// ...rest of your file unchanged...

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const inputUrl: string | undefined = body?.url;
    const inputId: string | undefined = body?.docId;

    const docId = inputId ?? extractDocId(inputUrl ?? "");
    if (!docId) {
      return NextResponse.json({ ok: false, error: "Missing or invalid Google Doc URL/ID." }, { status: 400 });
    }

    // 1) Public export attempt
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;
    let html: string | null = null;
    let publicStatus: number | null = null;
    let publicErr: string | null = null;
    try {
      const res = await fetch(exportUrl, {
        method: "GET",
        headers: {
          "cache-control": "no-cache",
          "user-agent": UA,
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
        cache: "no-store",
      });
      publicStatus = res.status;
      if (res.ok) html = await res.text();
      else publicErr = `Public export returned ${res.status}`;
    } catch (e: any) {
      publicErr = `Public export fetch threw: ${String(e?.message || e)}`;
    }

    // 2) Service Account fallback
    if (!html) {
      const svc = await exportGoogleDocHtmlWithServiceAccount(docId);
      if (!svc.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: "Google Doc import failed",
            detail: {
              docId,
              publicAttempt: { status: publicStatus, error: publicErr },
              serviceAccountAttempt: { status: svc.status ?? null, hint: svc.hint ?? null },
              envHints: {
                hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
                hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
                impersonateSubject: !!process.env.GOOGLE_IMPERSONATE_SUBJECT,
              },
            },
          },
          { status: 401 }
        );
      }
      html = svc.html;
    }

    const sections = parseGoogleDocHtml(html);
    return NextResponse.json({ ok: true, docId, html, sections });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}

function extractDocId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (m?.[1]) return m[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url)) return url;
  return null;
}

