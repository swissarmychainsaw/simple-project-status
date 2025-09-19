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
      "engDri",
      "engineeringDri",
      "businessSponsor",
      "bizSponsor",
      "engineeringSponsor",
      "engSponsor",
    ]) delete next[k];
    if (keep) next.optProjectId = keep;
    commitFormPatch(ctx, next);
  }, [ctx, fd, key]);

  const mode: "cid" | "web" = (fd.optBannerMode as any) ?? "cid";
  const cid = (fd.bannerCid as string) ?? canonicalBanner?.cid ?? "";
  const web = (fd.bannerWeb as string) ?? canonicalBanner?.web ?? "";
  const alt = (fd.bannerAlt as string) ?? canonicalBanner?.alt ?? "Project banner";

  // show a preview image even in CID mode (use canonical web path)
  const previewUrl = mode === "web" ? web : (canonicalBanner?.web ?? "");

  return (
    <section className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Control panel</h2>
        <div className="text-sm text-gray-500">{busy ? "Working…" : null}</div>
      </header>

      {/* Email */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
            onClick={reset}
            disabled={busy}
            className="px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Reset
          </button>
        </div>
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
              <p className="text-xs text-gray-500">Attach an image with <code>Content-ID</code> matching this. Email HTML uses <code>src="cid:{cid}"</code>.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="banner-alt-cid" className="text-sm font-medium">Alt text</label>
              <input
                id="banner-alt-cid"
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

