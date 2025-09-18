// components/status-form/sections/BasicsCard.tsx
import React, { useCallback } from "react";
import ProjectPills from "./ProjectPills";
import { useStatusForm } from "../context";
import type { BannerKey } from "../projectProfiles";
import { applyProjectDefaults } from "../projectDefaults";

/**
 * BasicsCard
 * - Project pill selector (single select)
 * - Persists to designOptions.optProjectId
 * - Immediately applies project defaults (e.g., banner) on selection
 */
const BasicsCard: React.FC = () => {
  const ctx = useStatusForm() as any;

  const designOptions = (ctx && ctx.designOptions) || {};
  const selected = (designOptions?.optProjectId as BannerKey | undefined) ?? null;

  const safeUpdateDesignOption = useCallback(
    (key: string, value: unknown) => {
      if (typeof ctx?.updateDesignOptions === "function") {
        ctx.updateDesignOptions(key, value);
        return;
      }
      if (typeof ctx?.setDesignOptions === "function") {
        ctx.setDesignOptions((prev: any) => ({ ...(prev || {}), [key]: value }));
        return;
      }
      if (typeof ctx?.setState === "function") {
        ctx.setState((prev: any) => ({
          ...(prev || {}),
          designOptions: { ...(prev?.designOptions || {}), [key]: value },
        }));
        return;
      }
      // eslint-disable-next-line no-console
      console.warn("No update function for design options; selection not persisted.");
    },
    [ctx]
  );

  const handleSelectProject = useCallback(
    (key: BannerKey) => {
      // 1) Save selection
      safeUpdateDesignOption("optProjectId", key);

      // 2) Apply project-driven defaults immediately (banner, etc.)
      // Try an app-provided helper first if present, otherwise our local util.
      if (typeof ctx?.applyProjectProfile === "function") {
        try {
          ctx.applyProjectProfile(key, "overwrite");
        } catch {
          // Fall back to minimal defaults
          applyProjectDefaults(ctx, key);
        }
      } else {
        applyProjectDefaults(ctx, key);
      }
    },
    [ctx, safeUpdateDesignOption]
  );

  return (
    <section className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <header>
        <h2 className="text-lg font-semibold">Basics</h2>
      </header>

      {/* Project (pills) */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Project</label>
        <ProjectPills
          selectedKey={selected}
          onSelect={handleSelectProject}
        />
      </div>

      {/* ------- Keep/restore your existing fields below as needed ------- */}
      {/* Title */}
      {/* <YourTitleField /> */}

      {/* Program Summary */}
      {/* <YourProgramSummaryField /> */}

      {/* Date / People / Email */}
      {/* <YourDatePeopleEmailFields /> */}
    </section>
  );
};

export default BasicsCard;

