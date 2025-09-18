// components/status-form/sections/BasicsCard.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useStatusFormCtx, type DesignOptions } from "../context";
import {
  BANNER_LABELS,
  PROJECT_KEYS,
  type BannerKey,
} from "../projectProfiles";

export default function BasicsCard() {
  const {
    formData,
    update,
    designOptions,
    setDesignOptions,
  } = useStatusFormCtx();

  // Local helper to mirror the old API `updateDesign(...)`
  const updateDesign = <K extends keyof DesignOptions>(
    key: K,
    value: DesignOptions[K]
  ) => {
    setDesignOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project selector */}
        <div>
          <label className="text-sm font-medium">Project</label>
          <select
            className="mt-1 block w-full border rounded-md px-3 py-2 bg-white"
            value={(designOptions.optBannerId as string) || ""}
            onChange={(e) =>
              updateDesign("optBannerId", e.target.value as BannerKey)
            }
          >
            {PROJECT_KEYS.map((k) => (
              <option key={k} value={k}>
                {BANNER_LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        {/* Program / Project Title */}
        <div>
          <label className="text-sm font-medium">Program / Project Title</label>
          <Input
            value={formData.programTitle}
            onChange={(e) => update("programTitle", e.target.value)}
            placeholder="e.g., Global Network Services"
            className="bg-white mt-1"
          />
        </div>

        {/* Program Summary (re-added) */}
        <div>
          <label className="text-sm font-medium">Program Summary</label>
          <Textarea
            rows={3}
            value={formData.programSummary}
            onChange={(e) => update("programSummary", e.target.value)}
            className="bg-white mt-1 resize-y"
            placeholder="One or two sentences describing the program/project."
          />
        </div>

        {/* Date */}
        <div>
          <label className="text-sm font-medium">Date</label>
          <Input
            type="date"
            value={formData.asOf}
            onChange={(e) => update("asOf", e.target.value)}
            className="bg-white mt-1"
          />
        </div>

        {/* Email To */}
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
  );
}

