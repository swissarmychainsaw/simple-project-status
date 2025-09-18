// components/status-form/sections/AdditionalResources.tsx
"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStatusForm } from "@/components/status-form/hooks/useStatusForm";

export default function AdditionalResources() {
  const { formData, update } = useStatusForm();
  return (
    <Card>
      <CardHeader><CardTitle>Additional Resources</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={formData.resourcesTitle}
          onChange={(e) => update("resourcesTitle", e.target.value)}
          placeholder="Additional Resources"
          className="bg-white"
        />
        <div>
          <Label className="text-xs text-gray-600">Section Subtitle (optional)</Label>
          <Input
            value={formData.resourcesSectionTitle}
            onChange={(e) => update("resourcesSectionTitle", e.target.value)}
            placeholder="Links, docs, references, owners…"
            className="bg-white mt-1"
          />
        </div>
        <Textarea
          rows={8}
          value={formData.resourcesHtml}
          onChange={(e) => update("resourcesHtml", e.target.value)}
          className="bg-white"
          placeholder="Paste links or notes…"
        />
      </CardContent>
    </Card>
  );
}

