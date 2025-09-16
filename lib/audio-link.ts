// lib/audio-link.ts
export type PlayerKind = "direct" | "sharepoint" | "gdrive" | "unknown";

export interface AudioValidated {
  normalized: string;       // the canonical URL to keep
  playableUrl?: string;     // only for public/direct preview
  gated?: boolean;          // true if sign-in is required
  player?: PlayerKind;      // hint for your /listen page
  message?: string;         // optional note from the API
}



export function normalizeSharePointUrl(input: string): string {
  try {
    const u = new URL(input.trim());
    if (!u.hostname.endsWith(".sharepoint.com")) return input;

    // If it's a "stream.aspx?id=..." link, keep it (works in iframe).
    if (u.pathname.includes("/_layouts/15/stream.aspx")) return u.toString();

    // If it's a "download.aspx?sourceurl=..." -> convert to stream.aspx?id=...
    if (u.pathname.includes("/_layouts/15/download.aspx")) {
      const src = u.searchParams.get("sourceurl");
      if (src) {
        const out = new URL(u.toString());
        out.pathname = out.pathname.replace("/download.aspx", "/stream.aspx");
        out.search = ""; // reset
        out.searchParams.set("id", src);
        return out.toString();
      }
    }

    // Fallback: if path ends in .mp3, force ?download=1 (still fine for validator)
    if (u.pathname.toLowerCase().endsWith(".mp3") && !u.searchParams.has("download")) {
      u.searchParams.set("download", "1");
    }
    return u.toString();
  } catch {
    return input;
  }
}

export function buildListenUrl(baseAppUrl: string, rawUrl: string): string {
  const src = encodeURIComponent(rawUrl);
  return `${baseAppUrl.replace(/\/$/, "")}/listen?src=${src}`;
}

