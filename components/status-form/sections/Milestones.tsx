// components/status-form/sections/Milestones.tsx
"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStatusForm } from "@/components/status-form/hooks/useStatusForm";

export default function Milestones() {
  const { formData, update } = useStatusForm();
  return (
    <Card>
      <CardHeader><CardTitle>Upcoming Milestones</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={formData.milestonesTitle}
          onChange={(e) => update("milestonesTitle", e.target.value)}
          placeholder="Upcoming Milestones"
          className="bg-white"
        />
        <div>
          <Label className="text-xs text-gray-600">Section Subtitle (optional)</Label>
          <Input
            value={formData.milestonesSectionTitle}
            onChange={(e) => update("milestonesSectionTitle", e.target.value)}
            placeholder="Q4 targets, launch plan, etc."
            className="bg-white mt-1"
          />
        </div>
        <Textarea
          rows={8}
          value={formData.milestonesHtml}
          onChange={(e) => update("milestonesHtml", e.target.value)}
          className="bg-white"
          placeholder="Tables or bullets of milestones…"
        />
      </CardContent>
    </Card>
  );
}

