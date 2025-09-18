// components/status-form/sections/Risks.tsx
"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStatusForm } from "@/components/status-form/hooks/useStatusForm";

export default function Risks() {
  const { formData, update } = useStatusForm();
  return (
    <Card>
      <CardHeader><CardTitle>Risks &amp; Issue Mitigation Plan</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={formData.risksTitle}
          onChange={(e) => update("risksTitle", e.target.value)}
          placeholder="Risks & Issue Mitigation Plan"
          className="bg-white"
        />
        <div>
          <Label className="text-xs text-gray-600">Section Subtitle (optional)</Label>
          <Input
            value={formData.risksSectionTitle}
            onChange={(e) => update("risksSectionTitle", e.target.value)}
            placeholder="Mitigation owners, timelines, status…"
            className="bg-white mt-1"
          />
        </div>
        <Textarea
          rows={8}
          value={formData.risksHtml}
          onChange={(e) => update("risksHtml", e.target.value)}
          className="bg-white"
          placeholder="Risks, impact, likelihood, mitigations…"
        />
      </CardContent>
    </Card>
  );
}

