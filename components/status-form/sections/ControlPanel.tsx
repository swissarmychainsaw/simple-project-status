// components/status-form/sections/ControlPanel.tsx
"use client";
import React, { useCallback, useMemo, useState } from "react";
import { useStatusForm } from "../context";
import { PROJECT_PROFILES } from "../projectProfiles";
import { BANNERS } from "./labels";
import { applyProfileDefaultsByKey, applyThemeForProject } from "@/lib/status-form/applyProfileDefaults";
import { commitFormPatch } from "@/lib/status-form/commit";

const BannerModePill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "px-3 py-1.5 rounded-full text-sm border transition",
      active ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-300 text-gray-700 hover:shadow-sm",
    ].join(" ")}
  >
    {label}
  </button>
);

const ControlPanel: React.FC = () => {
  const ctx = useStatusForm() as any;
  const [busy, setBusy] = useState(false);
  const fd = (ctx?.formData as any) ?? {};
  const key: string | undefined = fd.optProjectId;

  const currentProfile = useMemo(() => (key ? (PROJECT_PROFILES as any)[key] : undefined), [key]);
  const canonicalBanner = key ? (BANNERS as any)[key] : undefined;

  const write = (patch: Record<string, any>) => commitFormPatch(ctx, patch);

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

  const reset = useCallback(() => {
    const keep = key;
    const next: any = { ...fd };
    for (const k of [
      "emailTo",
      "optBannerMode",
      "bannerCid",
      "bannerWeb",
      "bannerAlt",
      "resources",
      "resourcesHtml",
      "additionalResourcesHtml",
      "statusLast",
      "statusCurrent",
      "statusTrending",
      "tpm",
      "engineeringDri",
      "engDri",
      "businessSponsor",
      "bizSponsor",
      "engineeringSponsor",
      "engSponsor",
      "programSummary",
      "execSummary",
      "executiveSummary",
      "milestones",
      "keyDecisions",
      "risks",
    ]) {
      delete next[k];
    }
    if (keep) next.optProjectId = keep;
    commitFormPatch(ctx, next);
  }, [ctx, fd]);

  const mode: "cid" | "web" = (fd.optBannerMode as any) ?? (fd.bannerCid ? "cid" : "web");
  const cid = (fd.bannerCid as string) || "";
  const web = (fd.bannerWeb as string) || currentProfile?.bannerWeb || "";
  const alt = (fd.bannerAlt as string) || currentProfile?.bannerAlt || "";
  const email = (fd.emailTo as string) || currentProfile?.emailTo || "";

  // Preview: if CID mode, show canonical web image for this project; otherwise show provided web URL
  const previewUrl = mode === "web" ? web : (canonicalBanner?.web ?? "");

  return (
    <section className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      {/* Header with actions on the right */}
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Control panel</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={applyDefaults}
            disabled={busy || !key}
            className="px-3 py-2 rounded-md border text-sm bg-gray-900 text-white disabled:opacity-50"
            title={key ? "Apply defaults from selected project profile" : "Select a project first"}
          >
            Apply defaults
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
            title="Clear most fields (keeps selected project)"
          >
            Reset
          </button>
          {busy ? <span className="text-sm text-gray-500">Working…</span> : null}
        </div>
      </header>

      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email-to" className="text-sm font-medium">Email to</label>
        <input
          id="email-to"
          type="email"
          className="w-full rounded-md border bg-white px-3 py-2 text-sm"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => write({ emailTo: e.target.value })}
        />
        <p className="text-xs text-gray-500">Populated from the selected project profile.</p>
      </div>

      {/* Banner */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Banner</h3>
          <div className="flex gap-2">
            <BannerModePill label="Use CID" active={mode === "cid"} onClick={() => write({ optBannerMode: "cid" })} />
            <BannerModePill label="Use External URL" active={mode === "web"} onClick={() => write({ optBannerMode: "web" })} />
          </div>
        </div>

        {mode === "cid" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="banner-cid" className="text-sm font-medium">Content-ID (CID)</label>
              <input
                id="banner-cid"
                type="text"
                className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                placeholder="banner-gns"
                value={cid}
                onChange={(e) => write({ bannerCid: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Attach an image with <code className="font-mono">Content-ID</code> matching this. Email HTML uses <code className="font-mono">src="cid:banner-gns"</code>.
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="banner-alt" className="text-sm font-medium">Alt text</label>
              <input
                id="banner-alt"
                type="text"
                className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                placeholder="Project banner"
                value={alt}
                onChange={(e) => write({ bannerAlt: e.target.value })}
              />
            </div>
            {previewUrl ? (
              <div className="md:col-span-3">
                <div className="rounded-lg border bg-gray-50 p-3">
                  <div className="text-xs text-gray-600 mb-2">Preview (uses canonical web image)</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt={alt || "Banner preview"} className="w-full h-auto rounded" />
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="banner-web" className="text-sm font-medium">Image URL</label>
              <input
                id="banner-web"
                type="text"
                className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                placeholder="/banners/gns-banner.png"
                value={web}
                onChange={(e) => write({ bannerWeb: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="banner-alt-web" className="text-sm font-medium">Alt text</label>
              <input
                id="banner-alt-web"
                type="text"
                className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                placeholder="Project banner"
                value={alt}
                onChange={(e) => write({ bannerAlt: e.target.value })}
              />
            </div>
            {web ? (
              <div className="md:col-span-3">
                <div className="rounded-lg border bg-gray-50 p-3">
                  <div className="text-xs text-gray-600 mb-2">Preview</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={web} alt={alt || "Banner preview"} className="w-full h-auto rounded" />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
};

export default ControlPanel;

