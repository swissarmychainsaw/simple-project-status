// components/status-form/sections/ExecSummary.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import useStatusForm from "../hooks/useStatusForm";

export default function ExecSummary() {
  const { formData, update } = useStatusForm();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Executive Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs text-gray-600">Section Title</label>
          <Input
            value={formData.execSummaryTitle}
            onChange={(e) => update("execSummaryTitle", e.target.value)}
            placeholder="Executive Summary"
            className="bg-white mt-1"
          />
        </div>

        <Textarea
          rows={6}
          value={formData.execSummary}
          onChange={(e) => update("execSummary", e.target.value)}
          className="bg-white resize-y"
          placeholder="Write a short summary…"
        />
      </CardContent>
    </Card>
  );
}

