import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new Response(JSON.stringify({ ok: false, error: "Missing url" }), { status: 400 });
  }
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") {
      return new Response(JSON.stringify({ ok: false, error: "URL must be https." }), { status: 400 });
    }

    let resp = await fetch(url, { method: "HEAD" });
    if (!resp.ok || !resp.headers.get("content-type")) {
      resp = await fetch(url, { method: "GET" });
    }

    const ct = resp.headers.get("content-type") || "";
    const isAudio = ct.startsWith("audio/") || u.pathname.toLowerCase().endsWith(".mp3");

    if (!resp.ok) {
      return new Response(JSON.stringify({ ok: false, error: `HTTP ${resp.status}` }), { status: 400 });
    }
    if (!isAudio) {
      return new Response(JSON.stringify({ ok: false, error: `Not an audio file (content-type: ${ct || "unknown"})` }), { status: 400 });
    }

    return new Response(JSON.stringify({ ok: true, contentType: ct }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Fetch failed" }), { status: 400 });
  }
}

