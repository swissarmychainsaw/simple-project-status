// components/status-form/sections/Highlights.tsx
"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStatusForm } from "@/components/status-form/hooks/useStatusForm";

export default function Highlights() {
  const { formData, update } = useStatusForm();
  return (
    <Card>
      <CardHeader><CardTitle>Highlights / Accomplishments</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs text-gray-600">Section Title</Label>
          <Input
            value={formData.highlightsTitle}
            onChange={(e) => update("highlightsTitle", e.target.value)}
            placeholder="Highlights / Accomplishments"
            className="bg-white mt-1"
          />
        </div>
        <Textarea
          rows={8}
          value={formData.highlightsHtml}
          onChange={(e) => update("highlightsHtml", e.target.value)}
          className="bg-white"
          placeholder="Bullets or paragraphs of highlights…"
        />
      </CardContent>
    </Card>
  );
}

