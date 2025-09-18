// components/status-form/projectDefaults.ts
import type { BannerKey } from "./projectProfiles";
import { PROJECT_PROFILES, DEFAULT_EMAIL } from "./projectProfiles";

/**
 * Infer a banner config (mode + url) from a project profile.
 * Supported shapes in PROJECT_PROFILES[project]:
 *  - banner: { mode: "cid" | "url", url?: string }
 *  - bannerMode: "cid" | "url"
 *  - bannerUrl: string
 *  - assets.banner: string
 *  - cidBanner: boolean (implies "cid")
 *
 * Fallback if none provided: URL "/banners/<project>.png" (served from /public).
 */
export function inferBannerFromProfile(project: BannerKey | null) {
  if (!project) return { mode: "cid" as const, url: "" };

  const p: any = (PROJECT_PROFILES as any)?.[project] || {};

  const fromObj =
    p?.banner && typeof p.banner === "object"
      ? {
          mode: (p.banner.mode as "cid" | "url" | undefined) ?? undefined,
          url: (p.banner.url as string | undefined) ?? undefined,
        }
      : null;

  const mode: "cid" | "url" | undefined =
    fromObj?.mode ??
    (typeof p.bannerMode === "string" ? (p.bannerMode as "cid" | "url") : undefined) ??
    (p.cidBanner ? "cid" : undefined) ??
    (p.bannerUrl || p?.assets?.banner ? "url" : undefined);

  const url: string | undefined =
    fromObj?.url ??
    (typeof p.bannerUrl === "string" ? p.bannerUrl : undefined) ??
    (typeof p?.assets?.banner === "string" ? p.assets.banner : undefined);

  if (mode === "url") {
    return { mode: "url" as const, url: url || `/banners/${project}.png` };
  }
  if (mode === "cid") {
    return { mode: "cid" as const, url: "" };
  }
  return { mode: "url" as const, url: `/banners/${project}.png` };
}

/**
 * Apply key defaults from the selected project into context state.
 * - Always applies banner mode/url (from profile or sensible fallback)
 * - Prefills formData.toEmail with DEFAULT_EMAIL if it's empty/undefined
 */
export function applyProjectDefaults(ctx: any, project: BannerKey | null) {
  if (!ctx) return;

  const writeDesignOpt = (key: string, value: unknown) => {
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
  };

  const writeFormData = (patch: Record<string, unknown>) => {
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
  };

  // 1) Banner defaults
  const inferred = inferBannerFromProfile(project);
  writeDesignOpt("optBannerMode", inferred.mode);
  writeDesignOpt("optBannerUrl", inferred.mode === "url" ? inferred.url : "");

  // 2) Email default (only if empty/undefined)
  const currentTo =
    (ctx?.formData && (ctx.formData.toEmail as string | undefined)) ?? undefined;
  if (!currentTo || String(currentTo).trim() === "") {
    writeFormData({ toEmail: DEFAULT_EMAIL });
  }
}

