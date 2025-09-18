// components/status-form/projectDefaults.ts
import type { BannerKey } from "./projectProfiles";
import { PROJECT_PROFILES, DEFAULT_EMAIL } from "./projectProfiles";

/**
 * Infer banner config from PROJECT_PROFILES with priority:
 *  1) profile.banner.{mode,url}
 *  2) profile.bannerMode / profile.bannerUrl
 *  3) profile.web (your canonical public path like "/banners/gns-banner.png")
 *  4) profile.assets.banner
 *  5) profile.cid (implies "cid")
 * Fallback (rare): "/banners/<project>-banner.png"
 *
 * Note: If both URL-ish data and CID exist, we prefer URL by default so the Control Panel shows a concrete path.
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

  const urlFromProfile =
    fromObj?.url ??
    (typeof p.bannerUrl === "string" ? p.bannerUrl : undefined) ??
    (typeof p.web === "string" ? p.web : undefined) ??
    (typeof p?.assets?.banner === "string" ? p.assets.banner : undefined);

  const modeFromProfile: "cid" | "url" | undefined =
    fromObj?.mode ??
    (typeof p.bannerMode === "string" ? (p.bannerMode as "cid" | "url") : undefined) ??
    (urlFromProfile ? "url" : undefined) ??
    (p.cid ? "cid" : undefined);

  if (modeFromProfile === "url") {
    return { mode: "url" as const, url: urlFromProfile || `/banners/${project}-banner.png` };
  }
  if (modeFromProfile === "cid") {
    return { mode: "cid" as const, url: "" };
  }
  // Fallback: assume conventional "<project>-banner.png"
  return { mode: "url" as const, url: `/banners/${project}-banner.png` };
}

/**
 * Apply key defaults from the selected project into context state.
 * - Always applies banner mode/url (from profile, prioritizing `web`)
 * - Prefills formData.toEmail with DEFAULT_EMAIL if empty/undefined
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

