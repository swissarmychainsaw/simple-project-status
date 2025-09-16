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
  // Always pass a string to <input value={...}> to avoid the controlled/uncontrolled warning
  const val = typeof value === "string" ? value : "";
  const [check, setCheck] = React.useState<Check>({ state: "idle" });
  const lastCheckedRef = React.useRef<string>("");

  // If the user edits the field after a successful check, clear the “ok” state
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

      // Notify parent with normalized data
      const payload: AudioValidated = {
        normalized: typeof j.normalized === "string" ? j.normalized : url,
        playableUrl: playable,
        gated: Boolean(j.gated),
        message: typeof j.message === "string" ? j.message : undefined,
        player: (j.player as PlayerKind) || "unknown",
      };
      onValidated?.(payload);
    } catch (e: any) {
      setCheck({ state: "error", msg: e?.message || "Network error" });
    }
  };

  return (
    <div className="space-y-2">
      <input
        className="w-full border rounded px-2 py-1"
        placeholder="Paste SharePoint/Drive page URL or public .mp3"
        value={val}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="flex gap-2 items-center">
        <button type="button" className="border rounded px-3 py-1" onClick={testLink}>
          Test audio
        </button>

        {check.state === "loading" && <span>Checking…</span>}
        {check.state === "ok" && (
          <span className="text-green-700">
            {check.gated ? "Looks good (sign-in required)" : "Valid audio link"}
            {check.note ? ` – ${check.note}` : ""}
          </span>
        )}
        {check.state === "error" && <span className="text-red-700">{check.msg}</span>}
      </div>

      {check.state === "ok" && !check.gated && check.playableUrl ? (
        <audio controls className="w-full">
          <source src={check.playableUrl} />
        </audio>
      ) : null}

      {/* Keep value in form submit */}
      <input type="hidden" name="audioUrl" value={val} />
    </div>
  );
}

