"use client";

import React, { useMemo, useState } from "react";

export type PlayerKind = "native" | "sharepoint" | "google" | "onedrive" | "unknown";

export type AudioValidated = {
  ok: boolean;
  normalized?: string;
  pageUrl?: string;
  playableUrl?: string;
  gated?: boolean;
  player?: PlayerKind;
  message?: string;
};

type Props = {
  /** Raw value bound by the parent */
  value: string;
  onChange: (v: string) => void;
  /** Optional callback so the parent can store normalized URL + player kind */
  onValidated?: (v: AudioValidated) => void;
};

function isDirectMp3(u?: string) {
  if (!u) return false;
  const s = u.toLowerCase();
  // Never inline-play SharePoint/Stream pages
  if (s.includes("sharepoint.com") || s.includes("/_layouts/15/stream.aspx")) return false;
  return /\.mp3($|\?)/.test(s);
}

export default function AudioUrlField({ value = "", onChange, onValidated }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AudioValidated | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const looksLikeSharePoint = (u?: string) =>
    !!u && (/sharepoint\.com/i.test(u) || /\/_layouts\/15\/stream\.aspx/i.test(u));

const playerPageUrl = useMemo(() => {
  const v = typeof value === "string" ? value : "";
  const chosen = (result?.pageUrl ?? result?.normalized ?? v ?? "");
  return typeof chosen === "string" ? chosen.trim() : "";
}, [result?.pageUrl, result?.normalized, value]);

  const showInlinePlayer = useMemo(() => {
    // Only show player for truly public .mp3 URLs
    return !!(result?.ok && !result?.gated && isDirectMp3(result?.playableUrl));
  }, [result]);

  async function handleTest() {
    setLoading(true);
    setError(null);
    try {
        const raw = (typeof value === "string" ? value : "").trim();  // ← change
      if (!raw) {
        setResult(undefined);
        setError("Paste a link first.");
        return;
      }

      const res = await fetch(`/api/validate-audio?url=${encodeURIComponent(raw)}`);
      const json = await res.json();

      if (!res.ok || !json?.ok) {
        const msg = json?.error || `Validation failed (HTTP ${res.status})`;
        setResult({ ok: false, message: msg });
        setError(msg);
        onValidated?.({ ok: false, message: msg });
        return;
      }

      // Trust server, but coerce SharePoint/Stream to "gated" client-side too.
      const coerced: AudioValidated = {
        ok: true,
        normalized: json.normalized ?? json.url ?? raw,
        pageUrl: json.pageUrl,
        playableUrl: json.playableUrl,
        gated: json.gated,
        player: json.player as PlayerKind,
        message: json.message,
      };

      if (looksLikeSharePoint(coerced.normalized) || looksLikeSharePoint(coerced.pageUrl)) {
        coerced.gated = true;
        coerced.player = "sharepoint";
        // Don’t render inline player for SharePoint pages
        coerced.playableUrl = undefined;
      } else if (isDirectMp3(coerced.playableUrl)) {
        coerced.player = "native";
      } else if (!coerced.player) {
        coerced.player = "unknown";
      }

      setResult(coerced);
      onValidated?.(coerced);
    } catch (e: any) {
      const msg = e?.message || "Network error while testing audio link.";
      setResult({ ok: false, message: msg });
      setError(msg);
      onValidated?.({ ok: false, message: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-lg font-semibold">Audio (Listen to this report)</label>
      <p className="text-sm text-slate-500">
        Paste a SharePoint/OneDrive/Google Drive link or a direct .mp3 URL, then click{" "}
        <em>Test audio</em>.
      </p>

      {/* White input */}
      <input
        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-[15px] outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Paste SharePoint/Drive page URL or public .mp3"
        // value={value ?? ""} // keep controlled
         value={typeof value === "string" ? value : ""}   
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        inputMode="url"
      />

      <div className="flex items-center gap-3">
        {/* Blue button */}
        <button
          type="button"
          onClick={handleTest}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Testing…" : "Test audio"}
        </button>

        {/* Open player: only useful when we have somewhere to go */}
        <a
          href={playerPageUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded px-4 py-2 text-white transition-colors ${
            playerPageUrl
              ? "bg-blue-600 hover:bg-blue-700"
              : "pointer-events-none bg-blue-600/60"
          }`}
          aria-disabled={!playerPageUrl}
        >
          Open player
        </a>

        {/* Status message */}
        {result?.ok && (
          <span
            className={`text-sm ${
              result.gated ? "text-amber-700" : "text-green-700"
            }`}
          >
            {result.gated ? "Sign-in required (opens Stream/Drive)" : "Valid audio link"}
          </span>
        )}
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>

      {/* Inline player only for public .mp3 */}
      {showInlinePlayer && result?.playableUrl && (
        <div className="mt-1 rounded border border-slate-200 p-2">
          <audio controls className="w-full" src={result.playableUrl} />
        </div>
      )}
    </div>
  );
}

