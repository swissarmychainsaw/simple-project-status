"use client";
import { useEffect, useMemo, useState } from "react";
import buildHtml from "@/components/status-form/buildHtml";
import { buildEmailHtml } from "@/components/status-form/buildEmailHtml";
import {
  PROJECT_KEYS,
  BANNER_LABELS,
  getMergedProfileChanges,
  type BannerKey,
  type DesignOptionsProfile,
} from "@/components/status-form/projectProfiles";
import type { FormData } from "@/types/report";

type ReportKind = "weekly" | "monthly" | "quarterly" | "program" | "project" | "ops" | "exec" | "incident";
type DesignOptions = DesignOptionsProfile & { optReportKind?: ReportKind };

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
  audioMp3Url: "",
  audioValidatedUrl: "",
  audioPlayer: "",
};

const defaultDesignOptions = (firstProject?: BannerKey): DesignOptions => ({
  optBannerMode: "cid",
  optBannerId: (firstProject ?? (PROJECT_KEYS[0] as BannerKey)) as BannerKey,
  optBannerUrl: "",
  optReportKind: "project",
  optAccent: "#0A66C2",
  optLogoMode: "mark",
  optBorders: "soft",
  optDensity: "cozy",
});

export function useStatusForm(initialProject?: BannerKey) {
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [designOptions, setDesignOptions] = useState<DesignOptions>(
    defaultDesignOptions(initialProject)
  );
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);

  const currentProjectKey = useMemo<BannerKey | undefined>(
    () => (designOptions.optBannerId as BannerKey) || undefined,
    [designOptions.optBannerId]
  );

  const currentProjectLabel = currentProjectKey ? BANNER_LABELS[currentProjectKey] : "—";
  const appTitle = useMemo(() => `${currentProjectLabel} Status Report`, [currentProjectLabel]);

  // Prefill title & summary whenever project changes
  useEffect(() => {
    const key = designOptions.optBannerId as BannerKey;
    if (!key) return;
    // getMergedProfileChanges may return { form: {...}, design: {...} }
    // Read defensively and fall back.
    // @ts-expect-error loose helper typing
    const merged = getMergedProfileChanges?.(key, formData, designOptions) ?? {};
    const from = (merged?.form ?? merged ?? {}) as any;

    setFormData(prev => ({
      ...prev,
      programTitle: String(
        from.programTitle ?? from.title ?? BANNER_LABELS[key] ?? prev.programTitle ?? ""
      ),
      programSummary: String(from.programSummary ?? from.summary ?? prev.programSummary ?? ""),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designOptions.optBannerId]);

  const update = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setFormData(prev => ({ ...prev, [k]: v }));

  const updateDesign = <K extends keyof DesignOptions>(k: K, v: DesignOptions[K]) =>
    setDesignOptions(prev => ({ ...prev, [k]: v }));

  async function generate() {
    setIsGenerating(true);
    try {
      const html = buildHtml(formData, designOptions);
      setGeneratedHtml(html);
      return html;
    } finally {
      setIsGenerating(false);
    }
  }

  async function emailReport() {
    const to = (formData.emailTo || "").trim();
    if (!to) throw new Error("Recipient email required.");
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
        throw new Error(`Email API ${res.status}: ${text}`);
      }
    } finally {
      setIsEmailing(false);
    }
  }

  return {
    // state
    formData,
    designOptions,
    generatedHtml,
    isGenerating,
    isEmailing,
    appTitle,
    currentProjectKey,
    currentProjectLabel,
    // actions
    update,
    updateDesign,
    generate,
    emailReport,
  };
}

