// components/status-form/StatusForm.tsx
"use client";
import React, { useEffect } from "react";
import { StatusFormProvider, useStatusForm } from "./context";
import BasicsCard from "./sections/BasicsCard";
import ControlPanel from "./sections/ControlPanel";
import Imports from "./sections/Imports";
import ExecSummary from "./sections/ExecSummary";
import Highlights from "./sections/Highlights";
import Milestones from "./sections/Milestones";
import KeyDecisions from "./sections/KeyDecisions";
import Risks from "./sections/Risks";
import Resources from "./sections/Resources";
import ActionsBar from "./sections/ActionsBar";
import { PROJECT_THEME } from "./sections/labels";
import { applyProfileDefaultsByKey, applyThemeForProject } from "@/lib/status-form/applyProfileDefaults";
import { commitFormPatch } from "@/lib/status-form/commit";

const StatusFormBody: React.FC = () => {
  const ctx = useStatusForm() as any;
  const fd = (ctx?.formData as any) ?? {};
  const key: string | undefined = fd.optProjectId;

  // Background tint stays in sync
  useEffect(() => {
    applyThemeForProject(key);
  }, [key]);

  // Backfill ONLY emailTo if it's empty after selecting a project (non-destructive)
  useEffect(() => {
    if (!key) return;
    const cur = (fd.emailTo ?? "").toString().trim();
    if (cur.length === 0) {
      const patch = applyProfileDefaultsByKey(key, fd);
      if (patch.emailTo) {
        commitFormPatch(ctx, { emailTo: patch.emailTo });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fd.emailTo]);

  const bg = (key && PROJECT_THEME[key]?.bg) ?? "#f8fafc";
  return (
    <div className="min-h-screen" style={{ backgroundColor: bg }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <BasicsCard />
        <ControlPanel />
        <Imports />

        <ExecSummary />
        <Highlights />
        <Milestones />
        <KeyDecisions />
        <Risks />
        <Resources />

        <ActionsBar />
      </div>
    </div>
  );
};

const StatusForm: React.FC = () => (
  <StatusFormProvider>
    <StatusFormBody />
  </StatusFormProvider>
);

export default StatusForm;

