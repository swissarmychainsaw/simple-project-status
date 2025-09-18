"use client";
import React, { useEffect } from "react";
import "./status-form.css";
import { StatusFormProvider, useStatusFormCtx } from "./context";
import BasicsCard from "./sections/BasicsCard";
import ExecSummary from "./sections/ExecSummary";
import ActionsBar from "./sections/ActionsBar";
import { normalizeBannerKey, type BannerKey } from "./projectProfiles";

function Shell({ onTitleChange }: { onTitleChange?: (t: string) => void }) {
  const { appTitle, designOptions } = useStatusFormCtx();

  useEffect(() => onTitleChange?.(appTitle), [appTitle, onTitleChange]);

  return (
    <div
      className="min-h-screen bg-gray-50 py-8 project-tint"
      data-project={normalizeBannerKey(designOptions.optBannerId as BannerKey)}
    >
      <div className="max-w-[900px] mx-auto px-4 space-y-6">
        <div aria-hidden className="tint-bar" />
        <BasicsCard />
        <ExecSummary />
        <ActionsBar />
      </div>
    </div>
  );
}

export default function StatusForm({ onTitleChange }: { onTitleChange?: (t: string) => void }) {
  return (
    <StatusFormProvider>
      <Shell onTitleChange={onTitleChange} />
    </StatusFormProvider>
  );
}

