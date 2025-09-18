import React from "react";
import type { BannerKey } from "../projectProfiles";
import { BANNER_LABELS } from "../projectProfiles";

/**
 * Color map per BannerKey.
 * - Unselected: light filled chip
 * - Selected: strong filled chip
 */
const PILL_COLOR: Record<
  BannerKey,
  {
    idle: string;      // light fill
    selected: string;  // strong fill
    border: string;    // border color to keep shape crisp
    focus: string;     // focus ring color
  }
> = {
  gns:   {
    idle: "bg-emerald-100 text-emerald-900",
    selected: "bg-emerald-600 text-white",
    border: "border-emerald-300",
    focus: "focus-visible:ring-emerald-300",
  },
  azure: {
    idle: "bg-sky-100 text-sky-900",
    selected: "bg-sky-600 text-white",
    border: "border-sky-300",
    focus: "focus-visible:ring-sky-300",
  },
  cie:   {
    idle: "bg-violet-100 text-violet-900",
    selected: "bg-violet-600 text-white",
    border: "border-violet-300",
    focus: "focus-visible:ring-violet-300",
  },
  obn:   {
    idle: "bg-indigo-100 text-indigo-900",
    selected: "bg-indigo-600 text-white",
    border: "border-indigo-300",
    focus: "focus-visible:ring-indigo-300",
  },
  azlens:{
    idle: "bg-cyan-100 text-cyan-900",
    selected: "bg-cyan-600 text-white",
    border: "border-cyan-300",
    focus: "focus-visible:ring-cyan-300",
  },
  ipv6:  {
    idle: "bg-lime-100 text-lime-900",
    selected: "bg-lime-600 text-white",
    border: "border-lime-300",
    focus: "focus-visible:ring-lime-300",
  },
};

interface ProjectPillsProps {
  selectedKey?: BannerKey | null;
  onSelect: (key: BannerKey) => void;
  className?: string;
}

/**
 * Tailwind-only lozenge (pill) selector for projects.
 * - Single select
 * - Filled color in both states (lighter when idle, strong when selected)
 */
const ProjectPills: React.FC<ProjectPillsProps> = ({ selectedKey, onSelect, className }) => {
  const keys = Object.keys(BANNER_LABELS) as BannerKey[];

  return (
    <div className={["flex flex-wrap gap-2", className || ""].join(" ").trim()}>
      {keys.map((key) => {
        const selected = selectedKey === key;
        const label = BANNER_LABELS[key] ?? key;
        const palette = PILL_COLOR[key];

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={[
              "px-3 py-1.5 rounded-full border text-sm transition whitespace-nowrap",
              selected ? palette.selected : palette.idle,
              palette.border,
              "focus:outline-none focus-visible:ring focus-visible:ring-offset-2",
              palette.focus,
            ].join(" ")}
            aria-pressed={selected}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default ProjectPills;

