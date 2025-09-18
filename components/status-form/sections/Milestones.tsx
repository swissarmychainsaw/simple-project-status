// components/status-form/sections/Milestones.tsx
import React, { useState, useCallback } from "react";
import { useStatusForm } from "../context";

const Milestones: React.FC = () => {
  const ctx = useStatusForm() as any;
  const formData = (ctx && ctx.formData) || {};
  const valueHtml = (formData?.milestonesHtml as string | undefined) ?? "";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(valueHtml);

  const writeFormData = useCallback(
    (patch: Record<string, unknown>) => {
      if (typeof ctx?.updateFormData === "function") {
        Object.entries(patch).forEach(([k, v]) => ctx.updateFormData(k, v));
        return;
      }
      if (typeof ctx?.setFormData === "function") {
        ctx.setFormData((prev: any) => ({ ...(prev || {}), ...patch }));
        return;
      }
      if (typeof ctx?.setState === "function") {
        ctx.setState((prev: any) => ({ ...(prev || {}), formData: { ...(prev?.formData || {}), ...patch } }));
      }
    },
    [ctx]
  );

  const save = useCallback(() => {
    writeFormData({ milestonesHtml: draft });
    setEditing(false);
  }, [draft, writeFormData]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Milestones</h3>
        <button
          type="button"
          onClick={() => (editing ? save() : (setDraft(valueHtml), setEditing(true)))}
          className="text-sm text-gray-600 hover:text-gray-900 underline"
        >
          {editing ? "Save" : "Edit HTML"}
        </button>
      </div>

      {!editing ? (
        <div
          className="rounded-md border bg-white p-4 text-sm leading-6 prose max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:table-auto [&_th]:font-semibold [&_th]:text-left [&_td]:align-top"
          dangerouslySetInnerHTML={{ __html: valueHtml || "<p class='text-gray-500'>No content.</p>" }}
        />
      ) : (
        <textarea
          className="w-full rounded-md border bg-white p-3 text-sm font-mono"
          rows={10}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
        />
      )}
    </div>
  );
};

export default Milestones;

