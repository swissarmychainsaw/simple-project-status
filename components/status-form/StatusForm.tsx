// components/status-form/StatusForm.tsx
"use client";

import React from "react";
import "../status-form.css"; // ← FIXED: was "./status-form.css"

// provider & hook
import { StatusFormProvider } from "./context";

// sections — RELATIVE imports so path resolution is guaranteed
import BasicsCard from "./sections/BasicsCard";
import ExecSummary from "./sections/ExecSummary";
import Highlights from "./sections/Highlights";
import Milestones from "./sections/Milestones";
import KeyDecisions from "./sections/KeyDecisions";
import Risks from "./sections/Risks";
import AdditionalResources from "./sections/AdditionalResources";
import ActionsBar from "./sections/ActionsBar";

type Props = { onTitleChange?: (t: string) => void };

export default function StatusForm({ onTitleChange }: Props) {
  return (
    <StatusFormProvider onTitleChange={onTitleChange}>
      <div className="min-h-screen bg-gray-50 py-8 project-tint">
        <div className="max-w-[900px] mx-auto px-4 space-y-6">
          <div aria-hidden className="tint-bar" />

          {/* Basics (project, title, summary, date, status, email, etc.) */}
          <BasicsCard />

          {/* Required sections */}
          <ExecSummary />
          <Highlights />
          <Milestones />
          <KeyDecisions />
          <Risks />
          <AdditionalResources />

          {/* Actions (Generate/Copy/Email) */}
          <ActionsBar />
        </div>
      </div>
    </StatusFormProvider>
  );
}

