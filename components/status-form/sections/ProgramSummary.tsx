"use client";

import React, { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import useStatusForm from "@/components/status-form/hooks/useStatusForm";
import {
  getMergedProfileChanges,
  type BannerKey,
} from "@/components/status-form/projectProfiles";

/**
 * Safely pull a 'programSummary' string from whatever structure
 * your project's profile returns. We keep this resilient to avoid
 * tight coupling to the exact shape of getMergedProfileChanges().
 */
function getProfileProgramSummary(optBannerId: string | undefined): string {
  if (!optBannerId) return "";
  try {
    const merged: any = getMergedProfileChanges(optBannerId as BannerKey);
    // Try a few likely spots; fall back to empty string.
    return (
      merged?.formData?.programSummary ??
      merged?.form?.programSummary ??
      merged?.defaults?.programSummary ??
      merged?.programSummary ??
      ""
    );
  } catch {
    return "";
  }
}

export default function ProgramSummary() {
  const ctx: any = useStatusForm();
  const formData = ctx?.formData ?? {};
  const setFormData = ctx?.setFormData as
    | React.Dispatch<React.SetStateAction<any>>
    | undefined;
  const update = ctx?.update as ((k: string, v: any) => void) | undefined;
  const designOptions = ctx?.designOptions ?? {};

  const profileSummary = useMemo(
    () => getProfileProgramSummary(designOptions?.optBannerId),
    [designOptions?.optBannerId]
  );

  // Auto-fill on project change if user hasn't typed anything yet
  useEffect(() => {
    const current = (formData?.programSummary ?? "").trim();
    if (!current && profileSummary) {
      if (typeof update === "function") {
        update("programSummary", profileSummary);
      } else if (setFormData) {
        setFormData((p: any) => ({ ...p, programSummary: profileSummary }));
      }
    }
  }, [profileSummary]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (v: string) => {
    if (typeof update === "function") {
      update("programSummary", v);
    } else if (setFormData) {
      setFormData((p: any) => ({ ...p, programSummary: v }));
    }
  };

  const overwriteWithProfile = () => {
    if (!profileSummary) return;
    onChange(profileSummary);
  };

  const fillIfEmpty = () => {
    const current = (formData?.programSummary ?? "").trim();
    if (!current && profileSummary) onChange(profileSummary);
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-2">
        <CardTitle className="flex-1">Program Summary</CardTitle>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={fillIfEmpty}>
            Fill from profile (if empty)
          </Button>
          <Button type="button" variant="secondary" onClick={overwriteWithProfile}>
            Use profile summary
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          rows={5}
          value={formData?.programSummary ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white mt-1 resize-y"
          placeholder="One or two sentences describing the program/project."
        />
      </CardContent>
    </Card>
  );
}

