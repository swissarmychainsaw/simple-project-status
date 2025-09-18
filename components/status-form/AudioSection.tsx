// components/status-form/AudioSection.tsx
"use client";

import React from "react";
import AudioUrlField from "@/components/AudioUrlField";

export type PlayerKind = "html5" | "sharepoint" | "gdrive" | "unknown";

export interface AudioValidated {
  ok: boolean;
  player: PlayerKind;
  gated?: boolean;
  playableUrl?: string | null;
  normalized?: string | null;
  pageUrl?: string | null;
  message?: string | null;
}

export interface AudioSectionProps {
  value: string; // formData.audioMp3Url
  validatedUrl: string; // formData.audioValidatedUrl
  player: PlayerKind; // formData.audioPlayer
  onChange: (raw: string) => void; // updateFormData("audioMp3Url", v)
  onValidated: (v: AudioValidated) => void; // update validated fields
}

export default function AudioSection({
  value,
  validatedUrl,
  player,
  onChange,
  onValidated,
}: AudioSectionProps) {
  // Decide whether to render the inline <audio> player:
  // only for html5 + not gated + with a playable URL.
  const showInlinePlayer =
    !!validatedUrl && player === "html5" && typeof validatedUrl === "string";

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Audio (Listen to this report)</h3>

      <AudioUrlField value={value ?? ""} onChange={onChange} onValidated={onValidated} />

      {/* Inline preview (only when html5 direct mp3) */}
      {showInlinePlayer && (
        <audio controls className="mt-2 w-full">
          <source src={(validatedUrl ?? "").toString()} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
}

