"use client";

import React, { useEffect, useMemo, useState } from "react";
import "./status-form.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

import buildHtml from "@/components/status-form/buildHtml";
import { buildEmailHtml } from "@/components/status-form/buildEmailHtml";

import {
  BANNER_LABELS,
  PROJECT_KEYS,
  normalizeBannerKey,
  type BannerKey,
  type DesignOptionsProfile,
} from "@/components/status-form/projectProfiles";

import type { FormData } from "@/types/report"; // uses your new shared types

// ---- Local types kept tiny so we don't pull in heavy client-only code yet ----
type ReportKind =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "program"
  | "project"
  | "ops"
  | "exec"
  | "incident";

type DesignOptions = DesignOptionsProfile & {
  optReportKind?: ReportKind;
};

type Props = {
  onTitleChange?: (t: string) => void;
};

// ---- Minimal, safe defaults --------------------------------------------------
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

  // audio fields from your shared type (keep them harmless if present)
  audioMp3Url: "",
  audioValidatedUrl: "",
  audioPlayer: "",
};

const defaultDesignOptions = (firstProject?: BannerKey): DesignOptions => ({
  // keep these three since the builders may rely on them
  optBannerMode: "cid",
  optBannerId: firstProject ?? ("" as any),
  optBannerUrl: "",
  // optional local extension
  optReportKind: "project",
  // provide sane defaults for other profile fields if your builders use them
  optAccent: "#0A66C2",
  optLogoMode: "mark",
  optBorders: "soft",
  optDensity: "cozy",
});

// -----------------------------------------------------------------------------

export default function StatusForm({ onTitleChange }: Props) {
  const { toast } = useToast();

  const firstProject = (PROJECT_KEYS?.[0] ?? "") as BannerKey;
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [designOptions, setDesignOptions] = useState<DesignOptions>(
    defaultDesignOptions(firstProject)
  );

  const [generatedHtml, setGeneratedHtml] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);

  // --- derived project label for the header preview ---
  const currentProjectKey = useMemo<BannerKey | undefined>(
    () => (designOptions.optBannerId as BannerKey) || undefined,
    [designOptions.optBannerId]
  );
  const currentProjectLabel = currentProjectKey
    ? BANNER_LABELS[currentProjectKey]
    : "—";

  const appTitle = useMemo(
    () => `${currentProjectLabel} Status Report`,
    [currentProjectLabel]
  );

  useEffect(() => {
    onTitleChange?.(appTitle);
  }, [appTitle, onTitleChange]);

  // --- minimal helpers --------------------------------------------------------
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

      toast({
        title: "Email sent",
        description: `Delivered to ${to}`,
      });
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

  // ----------------------------------------------------------------------------
  // RENDER — intentionally minimal. We'll add rich editors + audio, etc. next.
  // ----------------------------------------------------------------------------
  return (
    <div
      className="min-h-screen bg-gray-50 py-8 project-tint"
      data-project={normalizeBannerKey(designOptions.optBannerId as BannerKey)}
    >
      <div className="max-w-[900px] mx-auto px-4 space-y-6">
        <div aria-hidden className="tint-bar" />

        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Project</label>
              <select
                className="mt-1 block w-full border rounded-md px-3 py-2 bg-white"
                value={designOptions.optBannerId as string}
                onChange={(e) =>
                  setDesignOptions((p) => ({
                    ...p,
                    optBannerId: e.target.value as BannerKey,
                  }))
                }
              >
                {PROJECT_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {BANNER_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">
                Program / Project Title
              </label>
              <Input
                value={formData.programTitle}
                onChange={(e) => update("programTitle", e.target.value)}
                placeholder="e.g., Global Network Services"
                className="bg-white mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={formData.asOf}
                onChange={(e) => update("asOf", e.target.value)}
                className="bg-white mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Executive Summary</label>
              <Textarea
                rows={6}
                value={formData.execSummary}
                onChange={(e) => update("execSummary", e.target.value)}
                className="bg-white mt-1 resize-y"
                placeholder="Write a short summary…"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Email To</label>
              <Input
                value={formData.emailTo}
                onChange={(e) => update("emailTo", e.target.value)}
                placeholder="you@example.com"
                className="bg-white mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={generate} disabled={isGenerating}>
              {isGenerating ? "Generating…" : "Generate HTML"}
            </Button>
            <Button
              onClick={() => {
                if (!generatedHtml) {
                  toast({
                    title: "Nothing to copy",
                    description: "Click Generate HTML first.",
                  });
                  return;
                }
                navigator.clipboard
                  .writeText(generatedHtml)
                  .then(() =>
                    toast({
                      title: "Copied",
                      description: "Generated HTML copied to clipboard.",
                    })
                  )
                  .catch(() =>
                    toast({
                      title: "Copy failed",
                      description: "Couldn’t access clipboard.",
                      variant: "destructive",
                    })
                  );
              }}
              variant="outline"
            >
              Copy HTML
            </Button>
            <Button onClick={emailReport} disabled={isEmailing} variant="default">
              {isEmailing ? "Sending…" : "Email me this report"}
            </Button>
          </CardContent>
        </Card>

        {generatedHtml ? (
          <Card>
            <CardHeader>
              <CardTitle>Preview (raw HTML)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={generatedHtml}
                readOnly
                className="bg-white font-mono text-xs h-64"
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

