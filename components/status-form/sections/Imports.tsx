// components/status-form/sections/Imports.tsx
import React, { useCallback, useState } from "react";
import { useStatusForm } from "../context";

const Imports: React.FC = () => {
  const ctx = useStatusForm() as any;

  // Safe reads
  const formData = (ctx && ctx.formData) || {};
  const googleDocUrl = (formData?.googleDocUrl as string | undefined) ?? "";
  const audioUrl = (formData?.audioUrl as string | undefined) ?? "";

  const [busy, setBusy] = useState(false);
  const [lastImportMsg, setLastImportMsg] = useState<string>("");

  // Writers (defensive across context shapes)
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
        ctx.setState((prev: any) => ({
          ...(prev || {}),
          formData: { ...(prev?.formData || {}), ...patch },
        }));
        return;
      }
      // eslint-disable-next-line no-console
      console.warn("No update function for form data; change not persisted:", patch);
    },
    [ctx]
  );

  const onImportGoogleDoc = useCallback(async () => {
    const url = (ctx?.formData?.googleDocUrl as string) || "";
    if (!url) {
      setLastImportMsg("Please paste a Google Doc link first.");
      return;
    }
    setBusy(true);
    setLastImportMsg("");
    try {
      const res = await fetch("/api/google/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Import failed (${res.status}).`);
      }

      const {
        sections: { executiveSummaryHtml, highlightsHtml, milestonesHtml },
        html: fullHtml,
        docId,
      } = data;

      // Persist imported sections into your form fields
      writeFormData({
        execSummaryHtml: executiveSummaryHtml ?? "",
        highlightsHtml: highlightsHtml ?? "",
        milestonesHtml: milestonesHtml ?? "",
        googleDocHtml: fullHtml ?? "",
        googleDocId: docId ?? "",
      });

      setLastImportMsg("Imported Google Doc content into Executive Summary, Highlights, and Milestones.");
    } catch (e: any) {
      setLastImportMsg(`Import error: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }, [ctx, writeFormData]);

  const onValidateAudio = useCallback(async () => {
    const url = (ctx?.formData?.audioUrl as string) || "";
    if (!url) return;
    if (typeof ctx?.validateAudioUrlNow === "function") {
      try {
        await ctx.validateAudioUrlNow(url);
        setLastImportMsg("Audio link validated.");
      } catch (e: any) {
        setLastImportMsg(`Audio validation error: ${e?.message || e}`);
      }
    }
  }, [ctx]);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Imports</h2>
        <div className="text-sm text-gray-500">{busy ? "Importing…" : lastImportMsg}</div>
      </div>

      {/* Google Doc Import */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="google-doc-url" className="text-sm font-medium">
            Google Doc link
          </label>
          <input
            id="google-doc-url"
            type="url"
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
            placeholder="https://docs.google.com/document/d/…"
            value={googleDocUrl}
            onChange={(e) => writeFormData({ googleDocUrl: e.target.value })}
          />
          <p className="text-xs text-gray-500">
            Tip: ensure the Doc link is accessible (or “Anyone with the link”).
          </p>
        </div>

        <div className="flex gap-3 md:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onImportGoogleDoc}
            className="px-3 py-2 rounded-md border text-sm bg-gray-900 text-white disabled:opacity-50"
            title="Import content from the Google Doc into this report"
          >
            Import from Doc
          </button>
        </div>
      </div>

      {/* SharePoint Audio Link */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="audio-url" className="text-sm font-medium">
            SharePoint audio (MP3) link
          </label>
          <input
            id="audio-url"
            type="url"
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
            placeholder="https://microsoft-my.sharepoint.com/:u:/g/personal/.../file?download=1"
            value={audioUrl}
            onChange={(e) => writeFormData({ audioUrl: e.target.value })}
          />
          {audioUrl ? (
            <p className="text-xs">
              <a
                href={audioUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Open audio link
              </a>
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Provide a direct <code className="font-mono">?download=1</code> link for best UX.
            </p>
          )}
        </div>

        <div className="flex gap-3 md:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onValidateAudio}
            className="px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Validate
          </button>
        </div>
      </div>
    </div>
  );
};

export default Imports;

