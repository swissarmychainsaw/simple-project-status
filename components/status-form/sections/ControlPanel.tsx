import React, { useMemo } from "react";
import type { BannerKey } from "../projectProfiles";
import { BANNER_LABELS } from "../projectProfiles";
import { useStatusForm } from "../context";

/**
 * A defensive util that writes into designOptions regardless of which setter your
 * context actually exposes (updateDesignOptions, setDesignOptions, or setState).
 */
function useDesignOptionsWriter(ctx: any) {
  return (key: string, value: unknown) => {
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
    console.warn("No update function for design options; change not persisted:", key);
  };
}

/**
 * Same idea for formData (email to, etc.)
 */
function useFormDataWriter(ctx: any) {
  return (patch: Record<string, unknown>) => {
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
    console.warn("No update function for form data; change not persisted:", patch);
  };
}

const ControlPanel: React.FC = () => {
  const ctx = useStatusForm() as any;

  const designOptions = ctx?.designOptions || {};
  const formData = ctx?.formData || {};
  const writeDesignOpt = useDesignOptionsWriter(ctx);
  const writeFormData = useFormDataWriter(ctx);

  const optProjectId = (designOptions?.optProjectId as BannerKey | undefined) ?? null;

  // Friendly label for current project
  const projectLabel = useMemo(() => {
    if (!optProjectId) return "No project selected";
    return BANNER_LABELS[optProjectId] || optProjectId;
  }, [optProjectId]);

  const bannerMode = (designOptions?.optBannerMode as "cid" | "url" | undefined) ?? "cid";
  const bannerUrl = (designOptions?.optBannerUrl as string | undefined) ?? "";

  // Click handlers
  const onApplyDefaults = () => {
    // If your context exposes an exact helper, use it.
    // We try several possible names to avoid compile/runtime churn.
    if (typeof ctx?.applyProjectProfile === "function" && optProjectId) {
      // “overwrite” is a common option you’ve used previously
      try {
        ctx.applyProjectProfile(optProjectId, "overwrite");
        return;
      } catch (e) {
        console.warn("applyProjectProfile threw; falling back.", e);
      }
    }
    if (typeof ctx?.applyDefaults === "function") {
      try {
        ctx.applyDefaults();
        return;
      } catch (e) {
        console.warn("applyDefaults threw; ignoring.", e);
      }
    }
    // Last resort: no-op with toast/log; we don’t have structure for profiles here.
    console.warn("No defaults function available in context; nothing applied.");
  };

  const onReset = () => {
    if (typeof ctx?.resetAll === "function") {
      ctx.resetAll();
      return;
    }
    if (typeof ctx?.resetForm === "function") {
      ctx.resetForm();
      return;
    }
    // Manual, conservative reset of the fields we control
    writeFormData({ toEmail: "" });
    writeDesignOpt("optBannerMode", "cid");
    writeDesignOpt("optBannerUrl", "");
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Control panel</h2>
        <div className="text-sm text-gray-500">
          {optProjectId ? `Project: ${projectLabel}` : "No project selected"}
        </div>
      </header>

      {/* Banner mode + Apply defaults row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Banner mode select */}
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
            Banners load from your public folder when using an external URL.
          </p>
        </div>

        {/* Banner URL (only when mode=url) */}
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="banner-url" className="text-sm font-medium">

