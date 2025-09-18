// components/status-form/sections/ControlPanel.tsx
import React, { useMemo, useCallback, useEffect } from "react";
import { useStatusForm } from "../context";
import { BANNER_LABELS, PROJECT_PROFILES, DEFAULT_EMAIL } from "../projectProfiles";
import type { BannerKey } from "../projectProfiles";
import { applyProjectDefaults } from "../projectDefaults";

const ControlPanel: React.FC = () => {
  const ctx = useStatusForm() as any;

  // Safe reads
  const designOptions = (ctx && ctx.designOptions) || {};
  const formData = (ctx && ctx.formData) || {};

  // Writers
  const writeDesignOpt = useCallback(
    (key: string, value: unknown) => {
      if (typeof ctx?.updateDesignOptions === "function") {
        ctx.updateDesignOptions(key, value);
        return;
      }
      if (typeof ctx?.setDesignOptions === "function") {
        ctx.setDesignOptions((prev: any) => ({ ...(prev || {}), [key]: value }));
        return;
      }
      if (typeof ctx?.setState === "function") {
        ctx.setState((prev: any) => ({
          ...(prev || {}),
          designOptions: { ...(prev?.designOptions || {}), [key]: value },
        }));
        return;
      }
      // eslint-disable-next-line no-console
      console.warn("No update function for design options; change not persisted:", key);
    },
    [ctx]
  );

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

  const optProjectId = (designOptions?.optProjectId as BannerKey | undefined) ?? null;
  const projectLabel = useMemo(
    () => (optProjectId ? BANNER_LABELS[optProjectId] || optProjectId : "No project selected"),
    [optProjectId]
  );

  const bannerMode = (designOptions?.optBannerMode as "cid" | "url" | undefined) ?? "cid";
  const bannerUrl = (designOptions?.optBannerUrl as string | undefined) ?? "";
  const toEmail = (formData?.toEmail as string | undefined) ?? "";

  // Prefill Email “To” with DEFAULT_EMAIL if empty (non-destructive)
  useEffect(() => {
    if (!toEmail || String(toEmail).trim() === "") {
      writeFormData({ toEmail: DEFAULT_EMAIL });
    }
  }, [toEmail, writeFormData]);

  const examplePath =
    (optProjectId && (PROJECT_PROFILES as any)[optProjectId]?.web) ||
    (optProjectId ? `/banners/${optProjectId}-banner.png` : "/banners/example-banner.png");

  const onApplyDefaults = useCallback(() => {
    // Prefer app helper if available; fallback to our util.
    if (typeof ctx?.applyProjectProfile === "function" && optProjectId) {
      try {
        ctx.applyProjectProfile(optProjectId, "overwrite");
      } catch {
        applyProjectDefaults(ctx, optProjectId);
      }
    } else {
      applyProjectDefaults(ctx, optProjectId);
    }
  }, [ctx, optProjectId]);

  const onReset = useCallback(() => {
    if (typeof ctx?.resetAll === "function") {
      ctx.resetAll();
      return;
    }
    if (typeof ctx?.resetForm === "function") {
      ctx.resetForm();
      return;
    }
    // Manual minimal reset for fields this card controls
    writeFormData({ toEmail: DEFAULT_EMAIL });
    writeDesignOpt("optBannerMode", "cid");
    writeDesignOpt("optBannerUrl", "");
  }, [ctx, writeDesignOpt, writeFormData]);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Control panel</h2>
        <div className="text-sm text-gray-500">
          {optProjectId ? `Project: ${projectLabel}` : "No project selected"}
        </div>
      </div>

      {/* Banner mode + URL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2">
          <label htmlFor="banner-mode" className="text-sm font-medium">
            Banner mode
          </label>
          <select
            id="banner-mode"
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
            value={bannerMode}
            onChange={(e) => writeDesignOpt("optBannerMode", e.target.value as "cid" | "url")}
          >
            <option value="cid">Embed inline (CID)</option>
            <option value="url">External URL</option>
          </select>
          <p className="text-xs text-gray-500">
            External banners are served from your <code className="font-mono">/public</code> folder.
          </p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="banner-url" className="text-sm font-medium">
            Banner URL (public)
          </label>
          <input
            id="banner-url"
            type="text"
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
            placeholder={examplePath}
            value={bannerUrl}
            onChange={(e) => writeDesignOpt("optBannerUrl", e.target.value)}
            disabled={bannerMode !== "url"}
          />
          {bannerMode !== "url" ? (
            <p className="text-xs text-gray-400">Switch to “External URL” to edit.</p>
          ) : (
            <p className="text-xs text-gray-500">
              Example: <code className="font-mono">{examplePath}</code>
            </p>
          )}
        </div>
      </div>

      {/* Email To + Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="to-email" className="text-sm font-medium">
            Email “To”
          </label>
          <input
            id="to-email"
            type="email"
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
            placeholder="owner@example.com"
            value={toEmail}
            onChange={(e) => writeFormData({ toEmail: e.target.value })}
          />
        </div>

        <div className="flex gap-3 md:justify-end">
          <button
            type="button"
            onClick={onApplyDefaults}
            className="px-3 py-2 rounded-md border text-sm bg-gray-900 text-white"
            title="Pull values from the selected project’s profile (banner, etc.)"
          >
            Apply defaults
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;

