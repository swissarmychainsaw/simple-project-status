// components/status-form/context.tsx
"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

import buildHtml from "./buildHtml";
import { buildEmailHtml } from "./buildEmailHtml";

import type { FormData } from "@/types/report";
import type { DesignOptionsProfile, BannerKey } from "./projectProfiles";

// ---- Local types -------------------------------------------------------------
type ReportKind =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "program"
  | "project"
  | "ops"
  | "exec"
  | "incident";

export type DesignOptions = DesignOptionsProfile & {
  optReportKind?: ReportKind;
};

// ---- Defaults ----------------------------------------------------------------
const emptyFormData: FormData = {
  programTitle: "",
  programSummary: "",
  asOf: "",
  lastStatus: "Green",
  currentStatus: "Green",
  trending: "Green",
  tpm: "",
  engDri: "",
  bizSponsor: "",
  engSponsor: "",
  execSummaryTitle: "Executive Summary",
  highlightsTitle: "Highlights",
  execSummary: "",
  lowlights: "",
  updatesTrack: "",
  updatesTeam: "",
  updatesHtml: "",
  sectionTitle: "",
  emailTo: "",
  updatesTitle: "Updates",
  milestonesTitle: "Upcoming Milestones",
  milestonesSectionTitle: "",
  milestonesHtml: "",
  keyDecisionsTitle: "Key Decisions",
  keyDecisionsSectionTitle: "",
  keyDecisionsHtml: "",
  highlightsHtml: "",
  risksTitle: "Risks & Issue Mitigation Plan",
  risksSectionTitle: "",
  risksHtml: "",
  resourcesTitle: "Additional Resources",
  resourcesSectionTitle: "",
  resourcesHtml: "",

  // audio fields
  audioMp3Url: "",
  audioValidatedUrl: "",
  audioPlayer: "",
};

const defaultDesignOptions = (firstProject?: BannerKey): DesignOptions => ({
  optBannerMode: "cid",
  optBannerId: (firstProject ?? "") as any,
  optBannerUrl: "",
  optReportKind: "project",
  optAccent: "#0A66C2",
  optLogoMode: "mark",
  optBorders: "soft",
  optDensity: "cozy",
});

// ---- Context shape -----------------------------------------------------------
type StatusFormContextValue = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;

  designOptions: DesignOptions;
  setDesignOptions: React.Dispatch<React.SetStateAction<DesignOptions>>;

  generatedHtml: string;
  setGeneratedHtml: React.Dispatch<React.SetStateAction<string>>;

  isGenerating: boolean;
  isEmailing: boolean;

  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  generate: () => Promise<void>;
  emailReport: () => Promise<void>;
};

const StatusFormContext = createContext<StatusFormContextValue | null>(null);

// ---- Provider ----------------------------------------------------------------
export function StatusFormProvider({
  children,
  firstProject,
}: {
  children: React.ReactNode;
  firstProject?: BannerKey;
}) {
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [designOptions, setDesignOptions] = useState<DesignOptions>(
    defaultDesignOptions(firstProject)
  );

  const [generatedHtml, setGeneratedHtml] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);

  // simple setter
  const update = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setFormData((p) => ({ ...p, [k]: v }));

  const generate = async () => {
    setIsGenerating(true);
    try {
      const html = buildHtml(formData, designOptions);
      setGeneratedHtml(html);
      toast({ title: "HTML generated", description: "Preview updated." });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Generation failed",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const emailReport = async () => {
    const to = (formData.emailTo || "").trim();
    if (!to) {
      toast({
        title: "Email required",
        description: "Enter a recipient address first.",
        variant: "destructive",
      });
      return;
    }

    setIsEmailing(true);
    try {
      const html = buildEmailHtml(formData, designOptions);
      const usingCidBanner =
        designOptions.optBannerMode === "cid" && !!designOptions.optBannerId;

      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject: formData.programTitle || "Status Report",
          html,
          bannerId: usingCidBanner ? designOptions.optBannerId : undefined,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API returned ${res.status}: ${text}`);
      }

      toast({ title: "Email sent", description: `Delivered to ${to}` });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Email failed",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsEmailing(false);
    }
  };

  const value: StatusFormContextValue = useMemo(
    () => ({
      formData,
      setFormData,
      designOptions,
      setDesignOptions,
      generatedHtml,
      setGeneratedHtml,
      isGenerating,
      isEmailing,
      update,
      generate,
      emailReport,
    }),
    [
      formData,
      designOptions,
      generatedHtml,
      isGenerating,
      isEmailing,
      // functions are stable enough (capturing state) for this usage
    ]
  );

  return (
    <StatusFormContext.Provider value={value}>
      {children}
    </StatusFormContext.Provider>
  );
}

// ---- Hooks -------------------------------------------------------------------
// Primary hook
export function useStatusForm() {
  const ctx = useContext(StatusFormContext);
  if (!ctx) {
    throw new Error("useStatusForm must be used within a StatusFormProvider");
  }
  return ctx;
}

// Alias for older imports (sections importing `useStatusFormCtx`)
export const useStatusFormCtx = useStatusForm;

// Optional default export if something imports default from context (not required)
export default useStatusForm;

