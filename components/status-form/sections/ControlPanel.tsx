// components/status-form/sections/ControlPanel.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useStatusForm } from "../context";
import { PROJECT_PROFILES } from "../projectProfiles";
import { BANNERS } from "./labels";
import {
  applyProfileDefaultsByKey,
  applyThemeForProject,
} from "@/lib/status-form/applyProfileDefaults";
import { commitFormPatch } from "@/lib/status-form/commit";

const EXTERNAL_BANNER_EXAMPLE = "https://example.com/banners/gns-banner.png";

const Pill: React.FC<{
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}> = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "px-3 py-1.5 rounded-full text-sm border transition",
      active
        ? "bg-gray-900 border-gray-900 text-white"
        : "bg-white border-gray-300 text-gray-700 hover:shadow-sm",
    ].join(" ")}
  >
    {children}
  </button>
);

const ControlPanel: React.FC = () => {
  const ctx: any = useStatusForm();
  const fd = (ctx?.formData as any) ?? {};
  const [busy, setBusy] = useState(false);

  const key: string | undefined = fd.optProjectId;
  const profile = useMemo(() => (key ? (PROJECT_PROFILES as any)[key] : undefined), [key]);
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
  }, [key, fd, ctx]);

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
    ]) delete next[k];
    if (keep) next.optProjectId = keep;
    commitFormPatch(ctx, next);
  }, [fd, ctx, key]);

  // Derived fields
  const mode: "cid" | "web" = (fd.optBannerMode as any) ?? (fd.bannerCid ? "cid" : "web");
  const email = (fd.emailTo as string) || profile?.emailTo || "";
  const cid = (fd.bannerCid as string) || "";
  const web = (fd.bannerWeb as string) || "";
  const alt = (fd.bannerAlt as string) || profile?.bannerAlt || "";

  const previewUrl = mode === "web" ? web : (canonicalBanner?.web ?? "");

  return (
    <section className="rounded-xl border bg-white p-5 md:p-6 shadow-sm space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
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
          >
            Reset
          </button>
        </div>
      </header>

      {/* Email group */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">Email</h3>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-8">
            <label htmlFor="email-to" className="text-xs font-medium text-gray-700">
              Email to
            </label>
            <input
              id="email-to"
              type="email"
              className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => write({ emailTo: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-500">
              Populated from the selected project profile.
            </p>
          </div>
        </div>
      </div>

      {/* Banner group */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Banner</h3>
          <div className="flex gap-2">
            <Pill active={mode === "cid"} onClick={() => write({ optBannerMode: "cid" })}>
              Use CID
            </Pill>
            <Pill active={mode === "web"} onClick={() => write({ optBannerMode: "web" })}>
              Use External URL
            </Pill>
          </div>
        </div>

        {/* Fields */}
        {mode === "web" ? (
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-8">
              <label htmlFor="banner-web" className="text-xs font-medium text-gray-700">
                Image URL
              </label>
              <input
                id="banner-web"
                type="text"
                className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm"
                placeholder={EXTERNAL_BANNER_EXAMPLE}
                value={web}
                onChange={(e) => write({ bannerWeb: e.target.value })}
              />
            </div>
            <div className="col-span-12 md:col-span-4">
              <label htmlFor="banner-alt-web" className="text-xs font-medium text-gray-700">
                Alt text
              </label>
              <input
                id="banner-alt-web"
                type="text"
                className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm"
                placeholder="Project banner"
                value={alt}
                onChange={(e) => write({ bannerAlt: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-6">
              <label htmlFor="banner-cid" className="text-xs font-medium text-gray-700">
                Content-ID (CID)
              </label>
              <input
                id="banner-cid"
                type="text"
                className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm"
                placeholder="banner-gns"
                value={cid}
                onChange={(e) => write({ bannerCid: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-500">
                Attach an image with this <span className="font-mono">Content-ID</span>. Email HTML uses{" "}
                <span className="font-mono">src="cid:…" </span>.
              </p>
            </div>
            <div className="col-span-12 md:col-span-6">
              <label htmlFor="banner-alt" className="text-xs font-medium text-gray-700">
                Alt text
              </label>
              <input
                id="banner-alt"
                type="text"
                className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm"
                placeholder="Project banner"
                value={alt}
                onChange={(e) => write({ bannerAlt: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="rounded-lg border bg-gray-50 p-3">
          <div className="text-xs text-gray-600 mb-2">Preview</div>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={alt || "Banner preview"}
              className="w-full h-auto rounded"
            />
          ) : (
            <div className="text-xs text-gray-500">No preview available.</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ControlPanel;

