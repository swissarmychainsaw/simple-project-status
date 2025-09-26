// components/status-form/StatusForm.tsx
"use client";

import React, { useEffect } from "react";
import { StatusFormProvider, useStatusForm } from "./context";

import BasicsCard from "./sections/BasicsCard";
import ControlPanel from "./sections/ControlPanel";
import StatusAndPeopleCard from "./sections/StatusAndPeopleCard";
import BannerCard from "./sections/BannerCard";
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

// If you have themed backgrounds per project, keep this import;
// otherwise you can remove these two and the useEffect below.
import { PROJECT_THEME } from "./sections/labels";
import { applyThemeForProject } from "@/lib/status-form/applyProfileDefaults";

const StatusFormBody: React.FC = () => {
  const ctx = useStatusForm() as any;
  const fd = (ctx?.formData as any) ?? {};
  const projectKey: string | undefined = fd.optProjectId;

  useEffect(() => {
    if (projectKey) applyThemeForProject(projectKey);
  }, [projectKey]);

  const bg = (projectKey && PROJECT_THEME[projectKey]?.bg) ?? "#f8fafc";

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <BasicsCard />
        <ControlPanel />
        <BannerCard />
        <Imports />

        {/* Keep this visible while iterating; hide/remove for prod if desired */}
        <DebugFormData />

        <StatusAndPeopleCard />

        <ExecSummary />
        <Highlights />
        <Milestones />
        <KeyDecisions />
        <Risks />
        <Resources />

        {/* Email preview / actions */}
        <EmlActions />
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

