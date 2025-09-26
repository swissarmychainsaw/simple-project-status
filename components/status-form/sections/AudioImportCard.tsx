// components/status-form/sections/AudioImportCard.tsx
"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useStatusForm } from "../context";

const isAudio = (f: File) => /^audio\//i.test(f.type) || /\.m(p3|4a|4|4|4v|4b|peg|wav|ogg)$/i.test(f.name);

const AudioImportCard: React.FC = () => {
  const ctx = useStatusForm() as any;
  const fd = (ctx?.formData as any) ?? {};
  const write = useCallback(
    (patch: Record<string, unknown>) => {
      if (typeof ctx?.updateFormData === "function") {
        Object.entries(patch).forEach(([k, v]) => ctx.updateFormData(k as any, v));
      } else if (typeof ctx?.setFormData === "function") {
        ctx.setFormData((prev: any) => ({ ...(prev || {}), ...patch }));
      }
    },
    [ctx]
  );

  // Controlled URL text box (persisted)
  const url = String(fd.audioMp3Url || "");
  const [tempUrl, setTempUrl] = useState(url);

  // Local object URL from a picked file (not persisted—just preview)
  const objectUrlRef = useRef<string | null>(null);
  const [localName, setLocalName] = useState<string>("");

  const effectiveSrc = useMemo(() => {
    return tempUrl?.trim()
      ? tempUrl.trim()
      : objectUrlRef.current || "";
  }, [tempUrl]);

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!isAudio(f)) {
      alert("Please choose an audio file (mp3, wav, m4a, ogg, etc.)");
      e.target.value = "";
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    objectUrlRef.current = URL.createObjectURL(f);
    setLocalName(f.name);

    // clear URL input if we’re previewing a local file
    setTempUrl("");
  };

  const onUseUrl = () => {
    const u = (tempUrl || "").trim();
    if (!/^https?:\/\//i.test(u)) {
      alert("Enter a valid http(s) URL to an audio file (.mp3, .m4a, .wav, ...)");
      return;
    }
    write({ audioMp3Url: u, audioValidatedUrl: u, audioPlayer: "html5" });
    setLocalName("");
  };

  const onClear = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setLocalName("");
    setTempUrl("");
    write({ audioMp3Url: "", audioValidatedUrl: "", audioPlayer: "" });
  };

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-wide">Audio (optional)</h2>
        {(effectiveSrc || url) && (
          <button
            type="button"
            className="text-sm text-gray-600 hover:text-gray-900 underline"
            onClick={onClear}
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {/* URL input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Audio URL (MP3 / M4A / WAV)</label>
          <div className="flex gap-2">
            <input
              type="url"
              className="w-full rounded-md border bg-white px-3 py-2 text-sm"
              placeholder="https://example.com/clip.mp3"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
            />
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm"
              onClick={onUseUrl}
            >
              Use URL
            </button>
          </div>
          {url && (
            <div className="text-xs text-gray-600">
              Saved URL: <span className="font-mono">{url}</span>
            </div>
          )}
        </div>

        {/* File picker (local preview only) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Pick local file (preview only)</label>
          <input
            type="file"
            accept="audio/*"
            onChange={onPickFile}
            className="block w-full text-sm"
          />
          {localName && (
            <div className="text-xs text-gray-600">Previewing: {localName}</div>
          )}
        </div>
      </div>

      {/* Player */}
      <div className="rounded-md border bg-gray-50 p-3">
        {effectiveSrc ? (
          <audio controls preload="none" src={effectiveSrc} className="w-full" />
        ) : (
          <div className="text-sm text-gray-500">No audio selected.</div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Tip: “Use URL” saves to the form so it persists and can be emailed/stored. Local file
        preview does not upload—use a hosted link if you want recipients to play it.
      </p>
    </div>
  );
};

export default AudioImportCard;


