// app/api/google/import/route.ts
// Import a private or public Google Doc using the Google Drive API (service account),
// then split sections via parseGoogleDocHtml and return normalized fields.

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { google } from "googleapis";
import parseDefault, { parseGoogleDocHtml as parseNamed } from "@/lib/google/parseGoogleDocHtml";

// ---------- helpers ----------

function getEnvOrThrow() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || "";
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!clientEmail || !privateKeyRaw) {
    throw new Error(
      "Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY. Check .env.local and restart dev."
    );
  }
  // Fix escaped newlines if present
  const privateKey = privateKeyRaw.includes("\\n")
    ? privateKeyRaw.replace(/\\n/g, "\n")
    : privateKeyRaw;
  return { clientEmail, privateKey };
}

function extractDocId(input: string): string | null {
  if (!input) return null;
  // Accept raw IDs
  if (/^[a-zA-Z0-9_-]{20,}$/.test(input)) return input.trim();

  try {
    const u = new URL(input);
    // https://docs.google.com/document/d/<ID>/...
    const m = u.pathname.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (m?.[1]) return m[1];
  } catch {
    /* not a URL */
  }
  return null;
}

async function exportHtmlViaDrive(fileId: string): Promise<string> {
  const { clientEmail, privateKey } = getEnvOrThrow();
  const scopes = ["https://www.googleapis.com/auth/drive.readonly"];

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes,
  });

  const drive = google.drive({ version: "v3", auth });

  // Drive v3: export (Google Docs -> HTML)
  const res = await drive.files.export(
    { fileId, mimeType: "text/html" },
    { responseType: "text" as any }
  );

  const html = (res.data as unknown as string) ?? "";
  if (!html || typeof html !== "string") {
    throw new Error("Drive export returned no HTML data");
  }
  return html;
}

// Choose whichever export is actually callable (avoid “is not a function” mismatch)
const parser =
  typeof parseNamed === "function" ? parseNamed :
  typeof parseDefault === "function" ? parseDefault :
  null;

// ---------- route ----------

export async function POST(req: Request) {
  const t0 = Date.now();
  console.info("[IMPORT API] start (Drive API only)");

  let body: any = {};
  try { body = await req.json(); } catch {}

  const url: string | undefined = typeof body?.url === "string" ? body.url.trim() : undefined;
  const htmlIn: string | undefined = typeof body?.html === "string" ? body.html : undefined;

  console.info("[IMPORT API] body keys:", Object.keys(body || {}));
  console.info("[IMPORT API] parser types -> default:", typeof parseDefault, "named:", typeof parseNamed);

  try {
    if (!parser) throw new Error("parseGoogleDocHtml export mismatch (no callable export)");

    let html = "";
    if (htmlIn && htmlIn.trim()) {
      html = htmlIn;
      console.info("[IMPORT API] using provided HTML (len:", html.length, ")");
    } else {
      const id = extractDocId(url || "");
      if (!id) {
        return NextResponse.json(
          { ok: false, error: "Provide a Google Doc URL or raw document ID." },
          { status: 400 }
        );
      }
      console.info("[IMPORT API] fetching via Drive API for fileId:", id);
      html = await exportHtmlViaDrive(id);
      console.info("[IMPORT API] fetched HTML length:", html.length);
    }

    const sections = parser(html) as Record<string, string | undefined>;
    const lengths: Record<string, number> = {};
    for (const [k, v] of Object.entries(sections)) lengths[k] = typeof v === "string" ? v.length : 0;

    console.info("[IMPORT API] parsed keys:", Object.keys(sections));
    console.debug("[IMPORT API] section lengths:", lengths);
    console.info("[IMPORT API] ok in", Date.now() - t0, "ms");

    return NextResponse.json({ ok: true, sections, lengths }, { status: 200 });
  } catch (e: any) {
    console.error("[IMPORT API] error:", e?.stack || e?.message || String(e));
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}

