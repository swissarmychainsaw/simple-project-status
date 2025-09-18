// components/status-form/projectDefaults.ts
import type { BannerKey } from "./projectProfiles";
import { PROJECT_PROFILES } from "./projectProfiles";

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
 * Currently applies: banner mode/url.
 * Extend here to copy more profile-driven fields later.
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
    // no-op if nothing available
  };

  const inferred = inferBannerFromProfile(project);
  writeDesignOpt("optBannerMode", inferred.mode);
  writeDesignOpt("optBannerUrl", inferred.mode === "url" ? inferred.url : "");
}

