// components/ProfilePills.tsx
import { useState } from "react";
import {
  PROJECT_KEYS,
  BANNER_LABELS,
  getMergedProfileChanges,
  type BannerKey,
} from "@/components/status-form/projectProfiles";


function textColorFor(bgHex?: string) {
  // Fallback to neutral if no accent provided
  const hex = (bgHex ?? "#64748b").replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // Per W3C relative luminance
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.58 ? "#111827" /* slate-900 */ : "#ffffff";
}

type Props = {
  name?: string;                // form field name to submit
  label?: string;               // a11y label
  defaultValue?: BannerKey;     // initial selection
  value?: BannerKey;            // (optional) controlled value
  onChange?: (k: BannerKey) => void;
};

export default function ProfilePills({
  name = "project",
  label = "Project",
  defaultValue = PROJECT_KEYS[0],
  value,
  onChange,
}: Props) {
  const [internal, setInternal] = useState<BannerKey>(defaultValue);
  const selected = value ?? internal;

  const set = (k: BannerKey) => {
    setInternal(k);
    onChange?.(k);
  };

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium">{label}</span>

      {/* Ensure value is included on normal form submit */}
      <input type="hidden" name={name} value={selected} />

      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-3">
        {PROJECT_KEYS.map((key) => {
          const profile = getMergedProfileChanges(key);
          const accent = profile.design?.optAccent; // hex like "#2563eb"
          const isSelected = selected === key;

          const bg = isSelected ? accent ?? "#334155" : `${accent ?? "#cbd5e1"}22`; // faint bg when unselected
          const fg = isSelected ? textColorFor(accent) : "#0f172a"; // slate-900

          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => set(key)}
              className={[
                "rounded-2xl px-4 py-2 text-sm font-medium transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                "border",
                isSelected ? "shadow-sm" : "hover:shadow-sm",
              ].join(" ")}
              style={{
                backgroundColor: bg,
                color: fg,
                borderColor: isSelected ? "#0000001a" : "#0000000d",
              }}
            >
              {BANNER_LABELS[key]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

