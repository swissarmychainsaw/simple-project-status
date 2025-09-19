// components/status-form/sections/Resources.tsx
"use client";
import React from "react";
import { useStatusForm } from "../context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Resources: React.FC = () => {
  const ctx = useStatusForm() as any;
  const fd = (ctx?.formData as any) ?? {};

  const resourcesHtml =
    (fd.resourcesHtml as string | undefined)?.trim() ||
    (fd.additionalResourcesHtml as string | undefined)?.trim() ||
    "";

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle>{fd.resourcesTitle || "Additional Resources"}</CardTitle>
        </CardHeader>

        <CardContent>
          {resourcesHtml ? (
            <div
              className="prose prose-sm max-w-none
                         [&_ul]:list-disc [&_ul]:pl-5
                         [&_ol]:list-decimal [&_ol]:pl-5
                         [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: resourcesHtml }}
            />
          ) : (
            <p className="text-sm text-gray-500">
              No resources yet. Pick a project or use Apply defaults.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Resources;

