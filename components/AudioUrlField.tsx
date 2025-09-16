// components/AudioUrlField.tsx
"use client";

import * as React from "react";
import type { AudioValidated, PlayerKind } from "@/lib/audio-link";

type Props = {
  value: string | undefined;
  onChange: (v: string) => void;
  onValidated?: (v: AudioValidated) => void;
};

type Check =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ok"; gated: boolean; playableUrl?: string; note?: string }
  | { state: "error"; msg: string };

export default function AudioUrlField({ value, onChange, onValidated }: Props) {
  // always a string so the input is controlled
  const val = value ?? "";
  const [check, setCheck] = React.useState<Check>({ state: "idle" });
  const loading = check.state === "loading";
  const lastCheckedRef = React.useRef<string>("");

  // if user edits after a success, clear the success badge
  React.useEffect(() => {
    if (check.state === "ok" && val !== lastCheckedRef.current) {
      setCheck({ state: "idle" });
    }
  }, [val, check.state]);

  const testLink = async () => {
    const url = val.trim();
    if (!url) {
      setCheck({ state: "error", msg: "Enter a URL first." });
      return;
    }
    setCheck({ state: "loading" });

    try {
      const res = await fetch(`/api/validate-audio?url=${encodeURIComponent(url)}`);
      const j = await res.json();

      if (!res.ok || !j?.ok) {
        setCheck({ state: "error", msg: j?.error || `HTTP ${res.status}` });
        return;
      }

      const playable = typeof j.playableUrl === "string" ? j.playableUrl : undefined;

      setCheck({
        state: "ok",
        gated: Boolean(j.gated),
        playableUrl: playable,
        note: typeof j.message === "string" ? j.message : undefined,
      });
      lastCheckedRef.current = url;

      onValidated?.({
        normalized: typeof j.normalized === "string" ? j.normalized : url,
        playableUrl: playable,
        gated: Boolean(j.gated),
        message: typeof j.message === "string" ? j.message : undefined,
        player: ((j.player as PlayerKind) ?? "unknown"),
      });
    } catch (e: any) {
      setCheck({ state: "error", msg: e?.message || "Network error" });
    }
  };

  return (
    <div className="space-y-2">
      <input
        className="w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
        placeholder="Paste SharePoint/Drive page URL or public .mp3"
        value={val}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="flex gap-3 items-center">
        <button
          type="button"
          onClick={testLink}
          disabled={loading}
          className="inline-flex items-center rounded-md bg-blue-600 text-white px-4 py-2 font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Testing…" : "Test audio"}
        </button>

        {check.state === "loading" && <span>Checking…</span>}
        {check.state === "ok" && (
          <span className={`text-sm ${check.gated ? "text-amber-700" : "text-green-700"}`}>
            {check.gated ? "Looks good (sign-in required)" : "Valid audio link"}
            {check.note ? ` – ${check.note}` : ""}
          </span>
        )}
        {check.state === "error" && <span className="text-red-700 text-sm">{check.msg}</span>}
      </div>

      {check.state === "ok" && !check.gated && check.playableUrl ? (
        <audio controls className="w-full">
          <source src={check.playableUrl} type="audio/mpeg" />
        </audio>
      ) : null}

      {/* keep the value in form submissions */}
      <input type="hidden" name="audioUrl" value={val} />
    </div>
  );
}

