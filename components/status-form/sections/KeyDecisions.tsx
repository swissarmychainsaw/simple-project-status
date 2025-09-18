// components/status-form/sections/KeyDecisions.tsx
"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStatusForm } from "@/components/status-form/hooks/useStatusForm";

export default function KeyDecisions() {
  const { formData, update } = useStatusForm();
  return (
    <Card>
      <CardHeader><CardTitle>Key Decisions</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={formData.keyDecisionsTitle}
          onChange={(e) => update("keyDecisionsTitle", e.target.value)}
          placeholder="Key Decisions"
          className="bg-white"
        />
        <div>
          <Label className="text-xs text-gray-600">Section Subtitle (optional)</Label>
          <Input
            value={formData.keyDecisionsSectionTitle}
            onChange={(e) => update("keyDecisionsSectionTitle", e.target.value)}
            placeholder="Decision context, scope, etc."
            className="bg-white mt-1"
          />
        </div>
        <Textarea
          rows={8}
          value={formData.keyDecisionsHtml}
          onChange={(e) => update("keyDecisionsHtml", e.target.value)}
          className="bg-white"
          placeholder="Decisions made, owners, timelines…"
        />
      </CardContent>
    </Card>
  );
}

