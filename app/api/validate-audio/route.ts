// app/api/validate-audio/route.ts
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type Kind = "direct" | "sharepoint" | "googledrive" | "onedrive" | "unknown";

function isHttp(url: URL) {
  return url.protocol === "http:" || url.protocol === "https:";
}

function looksLikeMp3Path(u: URL) {
  return u.pathname.toLowerCase().endsWith(".mp3");
}

function isSharePoint(u: URL) {
  return u.hostname.endsWith(".sharepoint.com");
}
function isGoogleDrive(u: URL) {
  return u.hostname === "drive.google.com";
}
function isOneDrive(u: URL) {
  return u.hostname === "onedrive.live.com" || u.hostname.endsWith(".1drv.ms");
}

function normalize(u: URL): { src: string; kind: Kind; normalized: boolean } {
  // SharePoint "stream.aspx?id=..."  →  ".../download.aspx?sourceurl=<id>"
  if (isSharePoint(u) && u.pathname.includes("/_layouts/15/stream.aspx")) {
    const id = u.searchParams.get("id");
    if (id) {
      const v = new URL(u.toString());
      v.pathname = v.pathname.replace("stream.aspx", "download.aspx");
      v.search = ""; // reset
      v.searchParams.set("sourceurl", id);
      return { src: v.toString(), kind: "sharepoint", normalized: true };
    }
    return { src: u.toString(), kind: "sharepoint", normalized: false };
  }

  // SharePoint already-download.aspx?sourceurl=...
  if (isSharePoint(u) && u.pathname.includes("/_layouts/15/download.aspx")) {
    return { src: u.toString(), kind: "sharepoint", normalized: false };
  }

  // Google Drive: /file/d/<id>/view  →  /uc?export=download&id=<id>
  if (isGoogleDrive(u)) {
    const m = u.pathname.match(/\/file\/d\/([^/]+)\//);
    if (m && m[1]) {
      const id = m[1];
      const v = new URL("https://drive.google.com/uc");
      v.searchParams.set("export", "download");
      v.searchParams.set("id", id);
      return { src: v.toString(), kind: "googledrive", normalized: true };
    }
    return { src: u.toString(), kind: "googledrive", normalized: false };
  }

  if (isOneDrive(u)) {
    return { src: u.toString(), kind: "onedrive", normalized: false };
  }

  // Plain direct .mp3 or unknown
  if (looksLikeMp3Path(u)) return { src: u.toString(), kind: "direct", normalized: false };
  return { src: u.toString(), kind: "unknown", normalized: false };
}

function json(data: unknown, init?: number | ResponseInit) {
  return new Response(JSON.stringify(data), {
    status: typeof init === "number" ? init : init?.status ?? 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return json({ ok: false, error: "Missing url" }, 400);

  let input: URL;
  try {
    input = new URL(raw);
  } catch {
    // allow relative-to-origin if someone passed /foo.mp3
    try {
      input = new URL(raw, req.nextUrl.origin);
    } catch {
      return json({ ok: false, error: "Bad URL" }, 400);
    }
  }
  if (!isHttp(input)) return json({ ok: false, error: "URL must be http(s)" }, 400);

  const { src, kind, normalized } = normalize(input);

  // Try a lightweight HEAD only for public links.
  // Private SP/Drive will 401/403 from the server; we treat that as "authRequired: true".
  let status: number | undefined;
  let contentType: string | undefined;
  try {
    const head = await fetch(src, { method: "HEAD", redirect: "follow" });
    status = head.status;
    contentType = head.headers.get("content-type") ?? undefined;

    if (head.ok) {
      const isAudio =
        (contentType && contentType.toLowerCase().startsWith("audio/")) ||
        src.toLowerCase().endsWith(".mp3");
      if (!isAudio) {
        return json({
          ok: false,
          error: `Not an audio file (content-type: ${contentType ?? "unknown"})`,
          src,
          normalized,
          kind,
          status,
        });
      }
      return json({
        ok: true,
        src,
        normalized,
        kind,
        status,
        contentType,
        authRequired: false,
        note: "Publicly fetchable; content-type indicates audio.",
      });
    }

    // Authentication required? Treat as OK for known hosts.
    if ((status === 401 || status === 403) && (kind === "sharepoint" || kind === "googledrive" || kind === "onedrive")) {
      return json({
        ok: true,
        src,
        normalized,
        kind,
        status,
        contentType,
        authRequired: true,
        note:
          "Remote host requires authentication. This is expected for private SharePoint/Drive links. " +
          "Open in a normal tab while signed in to play.",
      });
    }

    // Other failure
    return json({
      ok: false,
      error: `HTTP ${status ?? "error"}`,
      src,
      normalized,
      kind,
      status,
      contentType,
    });
  } catch (err: any) {
    // Network error or blocked HEAD; treat private hosts as OK-if-pattern.
    if (kind === "sharepoint" || kind === "googledrive" || kind === "onedrive") {
      return json({
        ok: true,
        src,
        normalized,
        kind,
        authRequired: true,
        note:
          "Could not probe headers from the server (network/auth). Assuming private link; test in browser while signed in.",
      });
    }
    return json({ ok: false, error: "Fetch error", src, normalized, kind });
  }
}

