"use client";

import React from "react";

/**
 * ImportsCard
 * - Presents a clean card with a header + "Use this Google Doc Template" button
 * - Lets the user paste a Google Doc URL or Doc ID and import it
 * - Calls /api/google/import and writes the returned sections into the form context (if available)
 *
 * NOTE: This component is self-contained. If your project already has a parent `Imports.tsx`
 * that handled the fetch/update, you can either:
 *   1) Use just the header/link part and remove the form section below, or
 *   2) Replace the parent with this card directly.
 */
export default function ImportsCard() {
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  // Soft-optional: wire into your StatusForm context if present
  let applyFields: ((fields: Record<string, any>) => void) | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ctxMod = require("../context");
    if (ctxMod && typeof ctxMod.useStatusForm === "function") {
      const anyCtx = (ctxMod as any).useStatusForm();
      // try a few common mutation shapes without hard typing your context
      applyFields =
        anyCtx?.setFields ||
        anyCtx?.updateFields ||
        anyCtx?.patch ||
        (anyCtx?.setFormData
          ? (fields: Record<string, any>) =>
              anyCtx.setFormData((prev: any) => ({ ...prev, ...fields }))
          : null);
    }
  } catch {
    // no-op if context not available at import time
  }

  function extractDocIdOrUrl(raw: string): { docId?: string; url?: string } {
    const s = (raw || "").trim();
    if (!s) return {};
    // If it's a full URL, pass it as url
    if (/^https?:\/\//i.test(s)) {
      // Try to pull the doc id too (not required, just helpful)
      const m = s.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (m?.[1]) return { docId: m[1], url: s };
      return { url: s };
    }
    // Otherwise treat as an ID
    return { docId: s };
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    const { docId, url } = extractDocIdOrUrl(input);
    if (!docId && !url) {
      setErr("Paste a Google Doc link or enter a Doc ID.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/google/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docId ? { docId } : { url }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Import failed (${res.status})`);
      }

      const data = await res.json();

      // Expecting shape like:
      // { sections: { executiveSummaryHtml, highlightsHtml, milestonesHtml, keyDecisionsHtml, risksHtml }, meta?: {...} }
      const sections = (data && (data.sections || data)) as Record<string, any>;

      // Map to the names your builder reads (kept flexible)
      const fields: Record<string, any> = {
        executiveSummaryHtml:
          sections.executiveSummaryHtml ?? sections.execSummaryHtml ?? "",
        highlightsHtml:
          sections.highlightsHtml ??
          sections.updatesHtml ??
          sections.accomplishmentsHtml ??
          "",
        milestonesHtml: sections.milestonesHtml ?? "",
        keyDecisionsHtml: sections.keyDecisionsHtml ?? sections.decisionsHtml ?? "",
        risksHtml: sections.risksHtml ?? sections.riskHtml ?? "",
      };

      // Write into context if present
      if (applyFields) {
        applyFields(fields);
        setMsg("Imported sections applied to the form.");
      } else {
        setMsg("Imported sections fetched. (No form context detected to apply automatically.)");
        // If you want, expose the JSON in console for manual wiring:
        // eslint-disable-next-line no-console
        console.log("[ImportsCard] Imported sections:", fields);
      }
    } catch (e: any) {
      setErr(e?.message || "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Import Google Doc</h2>

        {/* The template button you asked for */}
        <a
          href="https://docs.google.com/document/u/2/d/11MCIp3uURs0nife0qkgnYkGOoLbf9WZIeAw6GtjNZW4/copy?tab=t.0"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          Use this Google Doc Template
        </a>
      </header>

      <form onSubmit={handleImport} className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Google Doc Link or Doc ID
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a Google Doc URL or enter the Doc ID"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"
        />

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? "Importing…" : "Import"}
          </button>

          <button
            type="button"
            onClick={() => {
              setInput("");
              setMsg(null);
              setErr(null);
            }}
            className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>

        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}
      </form>

      <p className="text-xs text-gray-500">
        Tip: Make the Doc “Anyone with the link” or configure the service account in <code>.env.local</code>.
      </p>
    </section>
  );
}

