"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import useStatusForm from "@/components/status-form/hooks/useStatusForm";

/**
 * Generic, lightweight “rich” section editor:
 * - Optional Title (H2) and Sub-Title (H3) inputs
 * - A big textarea that stores HTML (or plain text if you prefer)
 * - Clear button
 *
 * We keep it simple to avoid bloat; your buildHtml/buildEmailHtml can
 * sanitize/transform as needed.
 */
type Props = {
  label: string;
  titleKey?: keyof any;       // e.g., "highlightsTitle"
  subtitleKey?: keyof any;    // e.g., "milestonesSectionTitle"
  htmlKey: keyof any;         // e.g., "highlightsHtml"
  titlePlaceholder?: string;
  subtitlePlaceholder?: string;
  htmlPlaceholder?: string;
};

export default function RichSection({
  label,
  titleKey,
  subtitleKey,
  htmlKey,
  titlePlaceholder,
  subtitlePlaceholder,
  htmlPlaceholder,
}: Props) {
  const ctx: any = useStatusForm();
  const formData = ctx?.formData ?? {};
  const update = ctx?.update as ((k: string, v: any) => void) | undefined;
  const setFormData = ctx?.setFormData as
    | React.Dispatch<React.SetStateAction<any>>
    | undefined;

  const write = (key: string, val: any) => {
    if (typeof update === "function") update(key, val);
    else if (setFormData) setFormData((p: any) => ({ ...p, [key]: val }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {titleKey ? (
          <div>
            <label className="text-xs text-gray-600">Section Title (H2)</label>
            <Input
              value={formData?.[titleKey] ?? ""}
              onChange={(e) => write(titleKey as string, e.target.value)}
              className="bg-white mt-1"
              placeholder={titlePlaceholder}
            />
          </div>
        ) : null}

        {subtitleKey ? (
          <div>
            <label className="text-xs text-gray-600">Section Subheading (H3, optional)</label>
            <Input
              value={formData?.[subtitleKey] ?? ""}
              onChange={(e) => write(subtitleKey as string, e.target.value)}
              className="bg-white mt-1"
              placeholder={subtitlePlaceholder}
            />
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Content (HTML allowed)</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => write(htmlKey as string, "")}
          >
            Clear
          </Button>
        </div>

        <Textarea
          rows={8}
          value={formData?.[htmlKey] ?? ""}
          onChange={(e) => write(htmlKey as string, e.target.value)}
          className="bg-white font-mono text-xs"
          placeholder={htmlPlaceholder || "Paste formatted text or HTML…"}
        />
      </CardContent>
    </Card>
  );
}

