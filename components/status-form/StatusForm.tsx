// components/status-form/StatusForm.tsx
"use client";

import React, { useEffect } from "react";
import { StatusFormProvider, useStatusForm } from "./context";

import BasicsCard from "./sections/BasicsCard";
import ControlPanel from "./sections/ControlPanel";

import Imports from "./sections/Imports";
import AudioImportCard from "./sections/AudioImportCard";

import Statuses from "./sections/Statuses";
import People from "./sections/People";

import ExecSummary from "./sections/ExecSummary";
import Highlights from "./sections/Highlights";
import Milestones from "./sections/Milestones";
import KeyDecisions from "./sections/KeyDecisions";
import Risks from "./sections/Risks";
import Resources from "./sections/Resources";

import ActionsBar from "./sections/ActionsBar";
// (Remove DebugFormData from the UI for a clean layout)

import { PROJECT_THEME } from "./sections/labels";
import { applyThemeForProject } from "@/lib/status-form/applyProfileDefaults";

const StatusFormBody: React.FC = () => {
  const ctx = useStatusForm() as any;
  const fd = (ctx?.formData as any) ?? {};
  const key: string | undefined = fd.optProjectId;

  useEffect(() => {
    applyThemeForProject(key);
  }, [key]);

  const bg = (key && PROJECT_THEME[key]?.bg) ?? "#f8fafc";

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Project selector */}
        <BasicsCard />

        {/* Email + Banner */}
        <ControlPanel />

        {/* Move IMPORTS above Status/Team */}
        <Imports />

        {/* Audio on its own card right after Imports */}
        <AudioImportCard />

        {/* Add a label above the existing Statuses card */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Status</h2>
          <Statuses />
        </div>

        {/* Team card stays as-is */}
        <People />

        {/* Content sections */}
        <ExecSummary />
        <Highlights />
        <Milestones />
        <KeyDecisions />
        <Risks />
        <Resources />

        {/* Bottom actions */}
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

