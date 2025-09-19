// components/status-form/sections/Resources.tsx
"use client";
import React from "react";
import { useStatusForm } from "../context";

const Resources: React.FC = () => {
  const ctx = useStatusForm() as any;
  const fd = (ctx?.formData as any) ?? {};

  const resourcesHtml =
    (fd.resourcesHtml as string | undefined)?.trim() ||
    (fd.additionalResourcesHtml as string | undefined)?.trim() ||
    "";

  return (
    <section className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{fd.resourcesTitle || "Additional resources"}</h3>
      </header>

      {resourcesHtml ? (
        <div
          className="prose prose-sm max-w-none
                     [&_ul]:list-disc [&_ul]:pl-5
                     [&_ol]:list-decimal [&_ol]:pl-5
                     [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: resourcesHtml }}
        />
      ) : (
        <p className="text-sm text-gray-500">No resources yet. Pick a project or use Apply defaults.</p>
      )}
    </section>
  );
};

export default Resources;

