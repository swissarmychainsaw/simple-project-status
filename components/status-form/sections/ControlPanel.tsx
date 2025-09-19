// components/status-form/sections/ControlPanel.tsx
"use client";
import React, { useCallback, useMemo, useState } from "react";
import { useStatusForm } from "../context";
import { PROJECT_PROFILES, DEFAULT_EMAIL } from "../projectProfiles";
import { applyProfileDefaultsByKey, applyThemeForProject } from "@/lib/status-form/applyProfileDefaults";
import { commitFormPatch } from "@/lib/status-form/commit";

const ControlPanel: React.FC = () => {
  const ctx = useStatusForm() as any;
  const [busy, setBusy] = useState(false);
  const fd = (ctx?.formData as any) ?? {};
  const key: string | undefined = fd.optProjectId;

  const currentProfile = useMemo(
    () => (key ? (PROJECT_PROFILES as any)[key] : undefined),
    [key]
  );

  const applyDefaults = useCallback(() => {
    if (!key) return;
    setBusy(true);
    try {
      const patch = applyProfileDefaultsByKey(key, fd);
      commitFormPatch(ctx, patch);
      applyThemeForProject(key);
    } finally {
      setBusy(false);
    }
  }, [ctx, key, fd]);

  const write = (patch: Record<string, any>) => commitFormPatch(ctx, patch);

  return (
    <section className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Control panel</h2>
        <div className="text-sm text-gray-500">{busy ? "Working…" : null}</div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Email To */}
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="email-to" className="text-sm font-medium">Email to</label>
          <input
            id="email-to"
            type="email"
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
            placeholder="name@contoso.com"
            value={(fd.emailTo as string) ?? ""}
            onChange={(e) => write({ emailTo: e.target.value })}
          />
          <p className="text-xs text-gray-500">Populated from the selected project profile.</p>
        </div>

        <div className="flex gap-2 md:justify-end">
          <button
            type="button"
            onClick={applyDefaults}
            disabled={busy || !key}
            className="px-3 py-2 rounded-md border text-sm bg-gray-900 text-white disabled:opacity-50"
          >
            Apply defaults
          </button>
          <button
            type="button"
            onClick={() => {
              const keep = key;
              const next: any = { ...fd };
              for (const k of [
                "emailTo","bannerCid","bannerWeb","bannerAlt",
                "resources","resourcesHtml",
                "statusLast","statusCurrent","statusTrending",
                "tpm","engDri","engineeringDri","businessSponsor","bizSponsor","engineeringSponsor","engSponsor",
              ]) delete next[k];
              if (keep) next.optProjectId = keep;
              commitFormPatch(ctx, next);
            }}
            disabled={busy}
            className="px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
};

export default ControlPanel;

