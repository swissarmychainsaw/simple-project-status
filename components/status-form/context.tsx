// components/status-form/context.tsx
"use client";

import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

type FormData = Record<string, any>;
type DesignOptions = Record<string, any>;

type Ctx = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  designOptions: DesignOptions;
  setDesignOptions: React.Dispatch<React.SetStateAction<DesignOptions>>;
  generatedHtml: string;
  setGeneratedHtml: React.Dispatch<React.SetStateAction<string>>;
  isGenerating: boolean;
  isEmailing: boolean;
  updateFormData: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  generate: () => Promise<void>;
  emailReport: () => Promise<void>;
  reset: () => void;
};

const StatusFormContext = createContext<Ctx | null>(null);

const EMPTY_FORM: FormData = {
  programTitle: "",
  execSummaryTitle: "Executive Summary",
  execSummaryHtml: "",
  highlightsTitle: "Highlights / Accomplishments",
  highlightsHtml: "",
  milestonesTitle: "Upcoming Milestones",
  milestonesHtml: "",
  keyDecisionsTitle: "Key Decisions",
  keyDecisionsHtml: "",
  risksTitle: "Risks & Mitigation Plan",
  risksHtml: "",
  resourcesTitle: "Additional Resources",
  resourcesHtml: "",
  emailTo: "",
  googleDocUrl: ""
};

const EMPTY_DESIGN: DesignOptions = {
  optReportKind: "project",
  optBannerMode: "cid",
  optBannerId: "",
  optAccent: "#0A66C2"
};

export function StatusFormProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [designOptions, setDesignOptions] = useState<DesignOptions>(EMPTY_DESIGN);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);

  const updateFormData = useCallback(<K extends keyof FormData>(k: K, v: FormData[K]) => {
    setFormData((p) => ({ ...(p || {}), [k]: v }));
  }, []);

  const generate = useCallback(async () => {
    setIsGenerating(true);
    try {
      setGeneratedHtml("<!-- preview placeholder -->");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const emailReport = useCallback(async () => {
    setIsEmailing(true);
    try {
      // placeholder
    } finally {
      setIsEmailing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setFormData(EMPTY_FORM);
    setDesignOptions(EMPTY_DESIGN);
    setGeneratedHtml("");
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      formData,
      setFormData,
      designOptions,
      setDesignOptions,
      generatedHtml,
      setGeneratedHtml,
      isGenerating,
      isEmailing,
      updateFormData,
      generate,
      emailReport,
      reset
    }),
    [formData, designOptions, generatedHtml, isGenerating, isEmailing, updateFormData, generate, emailReport, reset]
  );

  return <StatusFormContext.Provider value={value}>{children}</StatusFormContext.Provider>;
}

export function useStatusForm() {
  const ctx = useContext(StatusFormContext);
  if (!ctx) throw new Error("useStatusForm must be used within a StatusFormProvider");
  return ctx;
}

export default StatusFormContext;

