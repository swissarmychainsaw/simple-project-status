// app/api/google/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parseGoogleDocHtml } from "@/lib/google/parseGoogleDocHtml";

/**
 * POST /api/google/import
 * Body: { url?: string, docId?: string }
 * Returns: { ok: true, docId, html, sections: { executiveSummaryHtml, highlightsHtml, milestonesHtml } }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const inputUrl: string | undefined = body?.url;
    const inputId: string | undefined = body?.docId;

    const docId = inputId ?? extractDocId(inputUrl ?? "");
    if (!docId) {
      return NextResponse.json({ ok: false, error: "Missing or invalid Google Doc URL/ID." }, { status: 400 });
    }

    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;
    const res = await fetch(exportUrl, { method: "GET", headers: { "cache-control": "no-cache" } });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `Fetch failed (${res.status}) for export HTML.` }, { status: res.status });
    }
    const html = await res.text();

    const sections = parseGoogleDocHtml(html);

    return NextResponse.json({
      ok: true,
      docId,
      html,
      sections,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}

/** Try to pull doc id from common Google Docs URL shapes */
function extractDocId(url: string): string | null {
  if (!url) return null;
  // https://docs.google.com/document/d/<ID>/edit...
  const m = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (m?.[1]) return m[1];
  // Accept raw ID if user pasted just the id
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url)) return url;
  return null;
}

