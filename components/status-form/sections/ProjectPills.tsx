// components/status-form/sections/ProjectPills.tsx
"use client";
import React from "react";
import { useStatusForm } from "../context";
import { applyProfileDefaultsByKey, applyThemeForProject } from "@/lib/status-form/applyProfileDefaults";
import { commitFormPatch } from "@/lib/status-form/commit";
import { BANNER_LABELS, PROJECT_KEYS, PILL_ACTIVE_CLASSES } from "./labels";

const Pill: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  colorKey: string;
}> = ({ active, onClick, children, colorKey }) => {
  const c = PILL_ACTIVE_CLASSES[colorKey] ?? PILL_ACTIVE_CLASSES.gns;
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full text-sm border transition",
        active ? `${c.bg} ${c.border} ${c.text}` : "bg-white border-gray-300 text-gray-700 hover:shadow-sm",
      ].join(" ")}
    >
      {children}
    </button>
  );
};

const ProjectPills: React.FC = () => {
  const ctx = useStatusForm() as any;
  const sel = (ctx?.formData?.optProjectId as string | undefined) ?? undefined;

  const pick = (key: string) => {
    // 1) store selection
    commitFormPatch(ctx, { optProjectId: key });
    // 2) compute defaults using current state as fallback (won't clobber existing edits)
    const patch = applyProfileDefaultsByKey(key, ctx?.formData || {});
    // 3) commit atomically
    commitFormPatch(ctx, patch);
    // 4) background tint
    applyThemeForProject(key);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {PROJECT_KEYS.map((k) => (
        <Pill key={k} active={sel === k} onClick={() => pick(k)} colorKey={k}>
          {BANNER_LABELS[k] ?? k}
        </Pill>
      ))}
    </div>
  );
};

export default ProjectPills;

