// components/status-form.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import "./status-form.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";

// Use the shared types you extracted (no local duplicates)
import type { FormData as ReportFormData, PlayerKind } from "@/types/report";

import { buildEmailHtml } from "@/components/status-form/buildEmailHtml";
import buildHtml from "@/components/status-form/buildHtml";

import {
  BANNER_LABELS,
  PROJECT_KEYS,
  normalizeBannerKey,
  getMergedProfileChanges,
  type BannerKey,
  type DesignOptionsProfile,
} from "@/components/status-form/projectProfiles";

import {
  safeInline,
  nlToParas,
  listAwareTextToHtml,
  sanitizeHtml,
  stripInlineBackgrounds,
  unwrapParagraphsInTables,
} from "@/lib/html/transforms";

//
// Local helpers
//
const EXEC_SUMMARY_PLAIN_LIMIT = 1200;

function normalizeEditorHtml(html: string) {
  return unwrapParagraphsInTables(stripInlineBackgrounds(sanitizeHtml(html)));
}

function getPlainTextLength(html: string) {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return (div.textContent || "").trim().length;
}

// Extend your shared DesignOptions with report kind (if you use it)
type ReportKind =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "program"
  | "project"
  | "ops"
  | "exec"
  | "incident";

type DesignOptions = DesignOptionsProfile & { optReportKind: ReportKind };

//
// Minimal initial state for the form
//
const defaultForm: ReportFormData = {
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
  emailTo: "",
  // content areas
  execSummaryTitle: "Executive Summary",
  execSummary: "",
  highlightsTitle: "Highlights / Accomplishments",
  highlightsHtml: "",
  updatesTitle: "Updates",
  updatesHtml: "",
  milestonesTitle: "Upcoming Milestones",
  milestonesSectionTitle: "",
  milestonesHtml: "",
  keyDecisionsTitle: "Key Decisions",
  keyDecisionsSectionTitle: "",
  keyDecisionsHtml: "",
  risksTitle: "Risks & Issue Mitigation Plan",
  risksSectionTitle: "",
  risksHtml: "",
  resourcesTitle: "Additional Resources",
  resourcesSectionTitle: "",
  resourcesHtml: "",
  // audio
  audioMp3Url: "",
  audioValidatedUrl: "",
  audioPlayer: "" as PlayerKind,
};

const defaultDesignOptions: DesignOptions = {
  // Required keys from DesignOptionsProfile + your local extension
  optBannerMode: "cid",
  optBannerId: PROJECT_KEYS[0] ?? "",
  optBannerUrl: "",
  optAccent: "#0A66C2",
  optBorders: "soft",
  optDensity: "cozy",
  optFontFamily: "Inter, Arial, Helvetica, sans-serif",
  optLogoMode: "light",
  optReportKind: "project",
};

export default function StatusForm({
  onTitleChange,
}: {
  onTitleChange?: (title: string) => void;
}) {
  const { toast } = useToast();

  const [formData, setFormData] = useState<ReportFormData>(defaultForm);
  const [designOptions, setDesignOptions] =
    useState<DesignOptions>(defaultDesignOptions);

  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);

  const [execLen, setExecLen] = useState(0);
  const execOver = execLen > EXEC_SUMMARY_PLAIN_LIMIT;

  //
  // Basic field updates with light sanitation for the rich fields
  //
  function updateFormData<K extends keyof ReportFormData>(
    field: K,
    value: ReportFormData[K]
  ) {
    const target = String(field);
    const needsHtmlNormalize =
      target === "updatesHtml" ||
      target === "milestonesHtml" ||
      target === "execSummary" ||
      target === "highlightsHtml" ||
      target === "keyDecisionsHtml" ||
      target === "risksHtml" ||
      target === "resourcesHtml";

    const v = (needsHtmlNormalize
      ? (normalizeEditorHtml(String(value)) as any)
      : value) as ReportFormData[K];

    setFormData((prev) => ({ ...prev, [field]: v }));

    if (target === "execSummary") {
      const len = getPlainTextLength(String(v));
      setExecLen(len);
    }
  }

  function updateDesignOptions<K extends keyof DesignOptions>(
    field: K,
    value: DesignOptions[K]
  ) {
    setDesignOptions((prev) => ({ ...prev, [field]: value }));
  }

  //
  // Import-from-Doc helper (kept simple)
  //
  function applyImported(d: {
    summary?: string;
    highlights?: string;
    upcoming_milestones?: string;
    key_decisions?: string;
    risks?: string;
  }) {
    const S = d.summary ?? "";
    const H = d.highlights ?? "";
    const M = d.upcoming_milestones ?? "";
    const K = d.key_decisions ?? "";
    const R = d.risks ?? "";

    updateFormData("execSummary", (/<\/?[a-z]/i.test(S) ? S : nlToParas(S)) as any);
    updateFormData(
      "highlightsHtml",
      (/<\/?[a-z]/i.test(H) ? H : listAwareTextToHtml(H)) as any
    );
    updateFormData(
      "milestonesHtml",
      (/<\/?[a-z]/i.test(M) ? M : listAwareTextToHtml(M)) as any
    );
    updateFormData(
      "keyDecisionsHtml",
      (/<\/?[a-z]/i.test(K) ? K : listAwareTextToHtml(K)) as any
    );
    updateFormData(
      "risksHtml",
      (/<\/?[a-z]/i.test(R) ? R : listAwareTextToHtml(R)) as any
    );
  }

  //
  // Profile “apply defaults” (safe minimal version)
  //
  function applyProjectProfile(bannerId: BannerKey) {
    const changes = getMergedProfileChanges(bannerId);
    // Only update what we know, keep this conservative:
    setDesignOptions((prev) => ({
      ...prev,
      optBannerId: bannerId,
      ...(changes?.designOptions ?? {}),
    }));
    if (changes?.formData) {
      setFormData((prev) => ({ ...prev, ...(changes.formData as any) }));
    }
  }

  // Derived label/title
  const currentProjectKey = useMemo<BannerKey | undefined>(
    () => (designOptions.optBannerId as BannerKey) || undefined,
    [designOptions.optBannerId]
  );
  const currentProjectLabel =
    (currentProjectKey && BANNER_LABELS[currentProjectKey]) || "—";

  const appTitle = useMemo(
    () => `${currentProjectLabel} Status Report`,
    [currentProjectLabel]
  );

  useEffect(() => {
    onTitleChange?.(appTitle);
  }, [appTitle, onTitleChange]);

  //
  // Actions
  //
  const generate = async () => {
    if (execOver) {
      toast({
        title: "Executive Summary is too long",
        description: `Limit is ${EXEC_SUMMARY_PLAIN_LIMIT} plain-text characters.`,
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    try {
      const html = buildHtml(formData, designOptions);
      setGeneratedHtml(html);
    } catch (e) {
      console.error(e);
      toast({
        title: "Generation failed",
        description: "There was an error generating the HTML.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyHtml = async () => {
    if (!generatedHtml) await generate();
    if (!generatedHtml) return;
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(generatedHtml);
      toast({
        title: "HTML copied",
        description: "Formatted report HTML is in your clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Please copy manually from the preview.",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };

  const emailReport = async () => {
    if (execOver) {
      toast({
        title: "Executive Summary is too long",
        description: `Limit is ${EXEC_SUMMARY_PLAIN_LIMIT} plain-text characters.`,
        variant: "destructive",
      });
      return;
    }

    const recipient = (formData.emailTo || "").trim();
    if (!recipient) {
      toast({
        title: "Email required",
        description: "Enter a recipient email first.",
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
          to: recipient,
          subject: formData.programTitle || "Status Report",
          html,
          bannerId: usingCidBanner ? designOptions.optBannerId : undefined,
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`API ${res.status}: ${t}`);
      }
      toast({
        title: "Email sent",
        description: `Report sent to ${recipient}`,
      });
    } catch (err: any) {
      toast({
        title: "Email failed",
        description: err?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsEmailing(false);
    }
  };

  //
  // Render (lean skeleton; add your rich sections back gradually)
  //
  return (
    <div
      className="min-h-screen bg-gray-50 py-8 project-tint"
      data-project={normalizeBannerKey(designOptions.optBannerId as BannerKey)}
    >
      <div className="max-w-[900px] mx-auto px-4 space-y-6">
        <h1 className="sr-only">Status Form</h1>

        {/* Header / Brand */}
        <div className="flex items-center gap-3">
          <Image
            src="/gns-logo.png"
            alt="Logo"
            width={120}
            height={40}
            priority
          />
          <div className="text-sm text-gray-600">{appTitle}</div>
        </div>

        {/* Design options */}
        <Card>
          <CardHeader>
            <CardTitle>Design Options</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="col-span-1">
              <Label className="text-sm">Project</Label>
              <Select
                value={designOptions.optBannerId}
                onValueChange={(v) => {
                  updateDesignOptions("optBannerId", v as any);
                  applyProjectProfile(v as BannerKey);
                }}
              >
                <SelectTrigger className="bg-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {BANNER_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Banner mode</Label>
              <Select
                value={designOptions.optBannerMode}
                onValueChange={(v) =>
                  updateDesignOptions("optBannerMode", v as any)
                }
              >
                <SelectTrigger className="bg-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cid">Embed inline (CID)</SelectItem>
                  <SelectItem value="url">Load from URL</SelectItem>
                  <SelectItem value="none">No banner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {designOptions.optBannerMode === "url" && (
              <div>
                <Label className="text-sm">Banner URL</Label>
                <Input
                  placeholder="https://cdn.example.com/banner.png"
                  value={designOptions.optBannerUrl || ""}
                  onChange={(e) =>
                    updateDesignOptions("optBannerUrl", e.target.value as any)
                  }
                  className="bg-white mt-1"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Basics */}
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Program / Project Title</Label>
              <Input
                value={formData.programTitle}
                onChange={(e) => updateFormData("programTitle", e.target.value as any)}
                className="bg-white mt-1"
                placeholder="e.g., Global Network Services"
              />
            </div>

            <div>
              <Label>Program Summary</Label>
              <Textarea
                value={formData.programSummary}
                onChange={(e) =>
                  updateFormData("programSummary", e.target.value as any)
                }
                rows={3}
                className="bg-white mt-1 resize-none"
                placeholder="One or two sentences describing the program/project."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.asOf || ""}
                  onChange={(e) => updateFormData("asOf", e.target.value as any)}
                  className="bg-white mt-1"
                />
              </div>
              {(["lastStatus", "currentStatus", "trending"] as const).map((k) => (
                <div key={k}>
                  <Label className="capitalize">
                    {k.replace(/([A-Z])/g, " $1")}
                  </Label>
                  <Select
                    value={(formData as any)[k] || "Green"}
                    onValueChange={(v) => updateFormData(k, v as any)}
                  >
                    <SelectTrigger className="bg-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Green">Green</SelectItem>
                      <SelectItem value="Yellow">Yellow</SelectItem>
                      <SelectItem value="Red">Red</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label>TPM</Label>
                <Input
                  value={formData.tpm}
                  onChange={(e) => updateFormData("tpm", e.target.value as any)}
                  className="bg-white mt-1"
                />
              </div>
              <div>
                <Label>Engineering DRI</Label>
                <Input
                  value={formData.engDri}
                  onChange={(e) =>
                    updateFormData("engDri", e.target.value as any)
                  }
                  className="bg-white mt-1"
                />
              </div>
              <div>
                <Label>Business Sponsor</Label>
                <Input
                  value={formData.bizSponsor}
                  onChange={(e) =>
                    updateFormData("bizSponsor", e.target.value as any)
                  }
                  className="bg-white mt-1"
                />
              </div>
              <div>
                <Label>Engineering Sponsor</Label>
                <Input
                  value={formData.engSponsor}
                  onChange={(e) =>
                    updateFormData("engSponsor", e.target.value as any)
                  }
                  className="bg-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Email To</Label>
              <Input
                value={formData.emailTo}
                onChange={(e) => updateFormData("emailTo", e.target.value as any)}
                placeholder="you@example.com"
                className="bg-white mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Executive Summary (single field, simplified) */}
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              value={formData.execSummaryTitle}
              onChange={(e) =>
                updateFormData("execSummaryTitle", e.target.value as any)
              }
              className="bg-white"
            />
            <Textarea
              value={formData.execSummary}
              onChange={(e) => {
                const html = normalizeEditorHtml(
                  safeInline(e.target.value).replace(/\n/g, "<br>")
                );
                updateFormData("execSummary", html as any);
              }}
              rows={6}
              className="bg-white"
              placeholder="Type or paste your executive summary here…"
            />
            <div className="text-xs text-gray-500">
              {execLen} / {EXEC_SUMMARY_PLAIN_LIMIT} plain-text chars
              {execOver && (
                <span className="text-red-600 ml-2">Too long</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Button onClick={generate} disabled={isGenerating || execOver}>
                {isGenerating ? "Generating…" : "Generate"}
              </Button>
              <Button onClick={copyHtml} variant="outline" disabled={!generatedHtml || isCopying}>
                {isCopying ? "Copying…" : "Copy HTML"}
              </Button>
              <Button onClick={emailReport} disabled={isEmailing || execOver}>
                {isEmailing ? "Sending…" : "Email me this report"}
              </Button>
            </div>
            {!!generatedHtml && (
              <Textarea
                value={generatedHtml}
                readOnly
                className="bg-white mt-4 font-mono text-xs"
                rows={16}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

