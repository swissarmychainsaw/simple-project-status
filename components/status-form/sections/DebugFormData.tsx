// components/status-form/sections/DebugFormData.tsx
"use client";
import React, { useState } from "react";
import { useStatusForm } from "../context";

const KEYS = [
  "optProjectId",
  "emailTo",
  "optBannerMode",
  "bannerCid",
  "bannerWeb",
  "bannerAlt",
  "resourcesTitle",
  "resourcesHtml",
  "additionalResourcesHtml",
  "tpm",
  "engDri",
  "businessSponsor",
  "engineeringSponsor",
] as const;

const DebugFormData: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ctx = useStatusForm() as any;
  const fd = (ctx?.formData as any) ?? {};
  return (
    <section className="border rounded-lg p-3 bg-yellow-50/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs underline"
      >
        {open ? "Hide debug" : "Show debug"}
      </button>
      {open && (
        <pre className="mt-2 text-xs overflow-auto max-h-64">
{JSON.stringify(
  Object.fromEntries(KEYS.map(k => [k, k.includes("Html") ? (fd[k]?.slice?.(0, 140) + (fd[k]?.length > 140 ? "…":"")) : fd[k]])),
  null,
  2
)}
        </pre>
      )}
    </section>
  );
};

export default DebugFormData;

