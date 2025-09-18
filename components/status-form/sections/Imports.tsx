// components/status-form/sections/Imports.tsx
import React, { useCallback } from "react";
import { useStatusForm } from "../context";

const Imports: React.FC = () => {
  const ctx = useStatusForm() as any;

  // Safe reads
  const formData = (ctx && ctx.formData) || {};
  const googleDocUrl = (formData?.googleDocUrl as string | undefined) ?? "";
  const audioUrl = (formData?.audioUrl as string | undefined) ?? "";

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
      // eslint-disable-next-line no-console
      console.warn("No Google Doc URL provided.");
      return;
    }
    // Prefer an app-supplied importer if available
    if (typeof ctx?.importFromGoogleDoc === "function") {
      try {
        await ctx.importFromGoogleDoc(url);
        return;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("importFromGoogleDoc threw; URL saved only.", e);
      }
    }
    // Fallback: we’ve already persisted googleDocUrl; downstream can act on it.
  }, [ctx]);

  const onValidateAudio = useCallback(async () => {
    const url = (ctx?.formData?.audioUrl as string) || "";
    if (!url) return;
    // If you have a validator in context, use it; otherwise noop
    if (typeof ctx?.validateAudioUrlNow === "function") {
      try {
        await ctx.validateAudioUrlNow(url);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("validateAudioUrlNow threw:", e);
      }
    }
  }, [ctx]);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Imports</h2>
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
            Paste a public or authorized Doc link to import content into this report.
          </p>
        </div>

        <div className="flex gap-3 md:justify-end">
          <button
            type="button"
            onClick={onImportGoogleDoc}
            className="px-3 py-2 rounded-md border text-sm bg-gray-900 text-white"
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
            onClick={onValidateAudio}
            className="px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50"
          >
            Validate
          </button>
        </div>
      </div>
    </div>
  );
};

export default Imports;

