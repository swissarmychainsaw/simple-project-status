import React from "react";
import ProjectPills from "./ProjectPills";
import type { BannerKey } from "../projectProfiles";
import { useStatusForm } from "../context"; // accessor from context

/**
 * BasicsCard
 * - Project pill selector (single select)
 * - Persists to designOptions.optProjectId
 * - No helper text beneath the pills (per request)
 */
const BasicsCard: React.FC = () => {
  const ctx = useStatusForm() as any;

  // Defensive reads so we don't crash if shape changes
  const designOptions = (ctx && ctx.designOptions) || {};
  const setDesignOptions = ctx && ctx.setDesignOptions;
  const updateDesignOptions = ctx && ctx.updateDesignOptions;
  const setState = ctx && ctx.setState; // last-resort generic setter some apps use

  const safeUpdateDesignOption = (key: string, value: unknown) => {
    if (typeof updateDesignOptions === "function") {
      updateDesignOptions(key, value);
      return;
    }
    if (typeof setDesignOptions === "function") {
      setDesignOptions((prev: any) => ({ ...(prev || {}), [key]: value }));
      return;
    }
    if (typeof setState === "function") {
      setState((prev: any) => ({
        ...(prev || {}),
        designOptions: { ...(prev?.designOptions || {}), [key]: value },
      }));
      return;
    }
    console.warn("No update function for design options; selection not persisted.");
  };

  const handleSelectProject = (key: BannerKey) => {
    safeUpdateDesignOption("optProjectId", key);
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <header>
        <h2 className="text-lg font-semibold">Basics</h2>
      </header>

      {/* Project (pills) */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Project</label>
        <ProjectPills
          selectedKey={(designOptions?.optProjectId as BannerKey | undefined) ?? null}
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

