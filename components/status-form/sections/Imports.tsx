"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useStatusForm } from "../context";

type Sections = {
  executiveSummaryHtml?: string;
  keyDecisionsHtml?: string;
  risksHtml?: string;
  highlightsHtml?: string;
  milestonesHtml?: string;
};

export default function Imports() {
  const ctx = useStatusForm() as any;
  const fd = (ctx && ctx.formData) || {};

  const [url, setUrl] = useState<string>((fd?.googleDocUrl as string) || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const canImport = useMemo(() => /^https?:\/\//i.test(url.trim()), [url]);

  const write = useCallback(
    (patch: Record<string, unknown>) => {
      console.debug("[IMPORT UI] write patch keys:", Object.keys(patch));
      if (typeof ctx?.setFormData === "function") {
        ctx.setFormData((prev: any) => ({ ...(prev || {}), ...patch }));
        return;
      }
      if (typeof ctx?.updateFormData === "function") {
        Object.entries(patch).forEach(([k, v]) => ctx.updateFormData(k as any, v));
        return;
      }
      if (typeof ctx?.setState === "function") {
        ctx.setState((prev: any) => ({
          ...(prev || {}),
          formData: { ...(prev?.formData || {}), ...patch },
        }));
      }
    },
    [ctx]
  );

  async function doImport() {
    setBusy(true);
    setMsg("");

    try {
      console.info("[IMPORT UI] POST /api/google/import:", { url: url.trim() });
      const res = await fetch("/api/google/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const json: any = await res.json().catch(() => ({}));
      console.debug("[IMPORT UI] raw response:", json);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      const sections: Sections = json.sections || {};
      const keys = Object.keys(sections);
      console.debug("[IMPORT UI] sections keys:", keys);

      if (keys.length === 0) {
        const previewLen =
          typeof json?.lengths === "object"
            ? JSON.stringify(json.lengths)
            : "(no lengths)";
        setMsg(`Import succeeded, but no recognized sections found. lengths=${previewLen}`);
        return;
      }

      const patch: Record<string, unknown> = { googleDocUrl: url.trim() };

      if (sections.executiveSummaryHtml) {
        patch["execSummaryHtml"] = sections.executiveSummaryHtml;
        if (!fd?.execSummaryTitle) patch["execSummaryTitle"] = "Executive Summary";
      }
      if (sections.keyDecisionsHtml) {
        patch["keyDecisionsHtml"] = sections.keyDecisionsHtml;
        if (!fd?.keyDecisionsTitle) patch["keyDecisionsTitle"] = "Key Decisions";
      }
      if (sections.risksHtml) {
        patch["risksHtml"] = sections.risksHtml;
        if (!fd?.risksTitle) patch["risksTitle"] = "Risks & Issue Mitigation Plan";
      }
      if (sections.highlightsHtml) {
        patch["highlightsHtml"] = sections.highlightsHtml;
        if (!fd?.highlightsTitle) patch["highlightsTitle"] = "Highlights";
      }
      if (sections.milestonesHtml) {
        patch["milestonesHtml"] = sections.milestonesHtml;
        if (!fd?.milestonesTitle) patch["milestonesTitle"] = "Upcoming Milestones";
      }

      write(patch);
      setMsg(`Imported ${keys.length} section(s).`);
    } catch (e: any) {
      console.error("[IMPORT UI] failed:", e?.message || String(e));
      setMsg(`Import failed: ${e?.message || "Unknown error"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md border bg-white p-4 space-y-3">
      <h2 className="text-base font-semibold tracking-wide">Google Doc Import</h2>

      <div className="flex gap-2">
        <input
          type="url"
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          placeholder="Paste your Google Doc URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="button"
          className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
          disabled={!canImport || busy}
          onClick={doImport}
        >
          {busy ? "Importing…" : "Import"}
        </button>
      </div>

      {!!msg && <p className="text-sm text-gray-600">{msg}</p>}
    </div>
  );
}

