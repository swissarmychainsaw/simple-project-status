"use client";

import React, { useEffect } from "react";
import { StatusFormProvider, useStatusForm } from "./context";

import BasicsCard from "./sections/BasicsCard";
import ControlPanel from "./sections/ControlPanel";
import StatusAndPeopleCard from "./sections/StatusAndPeopleCard"; // ⬅️ NEW: consolidated Date/Statuses/People card

// (keep the rest of your existing sections)
import Imports from "./sections/Imports";
import ExecSummary from "./sections/ExecSummary";
import Highlights from "./sections/Highlights";
import Milestones from "./sections/Milestones";
import KeyDecisions from "./sections/KeyDecisions";
import Risks from "./sections/Risks";
import Resources from "./sections/Resources";
import EmlActions from "./sections/EmlActions";
import ActionsBar from "./sections/ActionsBar";
import DebugFormData from "./sections/DebugFormData";

// theme support
import { PROJECT_THEME } from "./sections/labels";
import { applyThemeForProject } from "@/lib/status-form/applyProfileDefaults";

/**
 * Main form body. We render a single consolidated "Status & Team" card
 * directly under the Control Panel; we no longer render the separate
 * Statuses or People sections to avoid duplication.
 */
const StatusFormBody: React.FC = () => {
  const ctx = useStatusForm() as any;
  const fd = (ctx?.formData as any) ?? {};
  const projectKey: string | undefined = fd.optProjectId;

  useEffect(() => {
    applyThemeForProject(projectKey);
  }, [projectKey]);

  const bg = (projectKey && PROJECT_THEME[projectKey]?.bg) ?? "#f8fafc";

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header / basics */}
        <BasicsCard />

        {/* Controls at the top */}
        <ControlPanel />

        {/* NEW: Consolidated Date + Statuses + People card */}
        <StatusAndPeopleCard />

        {/* Optional: leave this visible while iterating; remove/hide for prod */}
        <DebugFormData />

        {/* Imports / Google Doc / etc */}
        <Imports />

        {/* Content sections */}
        <ExecSummary />
        <Highlights />
        <Milestones />
        <KeyDecisions />
        <Risks />
        <Resources />

        {/* Actions (build email, copy, send, etc.) */}
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

