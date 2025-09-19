// lib/status-form/applyProfileDefaults.ts
// Drop-in: ensures programTitle/programSummary come from projectProfiles.defaults,
// fixes resourcesHtml, banner, people, status, and theme utilities.

import { PROJECT_THEME, BANNERS } from "@/components/status-form/sections/labels";
import { PROJECT_PROFILES, DEFAULT_EMAIL } from "@/components/status-form/projectProfiles";

export type ResourceItem = {
  id: string;
  label: string;
  href?: string;
  value?: string;
  note?: string;
};

function nonEmpty(v: any): boolean {
  return v !== undefined && v !== null && String(v).trim() !== "";
}

function normalizePerson(v: any): string {
  if (!nonEmpty(v)) return "";
  if (Array.isArray(v)) return v.map(normalizePerson).filter(Boolean).join("; ");
  if (typeof v === "string") return v.trim();
  if (typeof v === "object") {
    const name = (v.name ?? v.displayName ?? v.fullName ?? "").toString().trim();
    const email = (v.email ?? v.mail ?? v.address ?? "").toString().trim();
    if (name && email) return `${name} (${email})`;
    return (name || email || "").trim();
  }
  return String(v).trim();
}

function buildResourcesFromProfile(
  base: any,
  profileFallback?: any,
  bannerSrc?: { web?: string; cid?: string; alt?: string }
): ResourceItem[] {
  const list: ResourceItem[] = [];
  const banner = base?.banner ?? profileFallback?.banner ?? bannerSrc;
  if (banner?.web) {
    list.push({
      id: "banner-web",
      label: "Banner (web)",
      href: banner.web,
      note: banner.alt ? `alt: ${banner.alt}` : undefined,
    });
  }
  if (banner?.cid) {
    list.push({ id: "banner-cid", label: "Banner (CID)", value: `cid:${banner.cid}` });
  }
  const resArr = Array.isArray(base?.resources)
    ? base.resources
    : Array.isArray(profileFallback?.resources)
    ? profileFallback.resources
    : [];
  for (const r of resArr) {
    list.push({
      id: r.id ?? `res-${list.length + 1}`,
      label: r.label ?? "Link",
      href: r.href,
      value: r.value,
      note: r.note,
    });
  }
  return list;
}

export function buildResourcesHtml(list: ResourceItem[]): string {
  if (!list?.length) return "";
  const li = list
    .map((r) => {
      const right = r.href
        ? `<a href="${r.href}" target="_blank" rel="noreferrer">${r.href}</a>`
        : r.value
        ? `<code>${r.value}</code>`
        : "";
      const note = r.note ? ` <span style="color:#6b7280">${r.note}</span>` : "";
      return `<li><strong>${r.label}:</strong> ${right}${note}</li>`;
    })
    .join("");
  return `<ul>${li}</ul>`;
}

export function applyProfileDefaultsByKey(
  key: string | undefined,
  prevFormData: Record<string, any> = {}
): Record<string, any> {
  if (!key) return {};
  const profile = (PROJECT_PROFILES as any)[key];
  if (!profile) return {};

  const base = profile.defaults ?? profile;

  // PROGRAM METADATA (🔴 NEW: explicitly map these so email header/summary always fill)
  const programTitle =
    base.programTitle ?? profile.programTitle ?? prevFormData.programTitle ?? "";
  const programSummary =
    base.programSummary ?? profile.programSummary ?? prevFormData.programSummary ?? "";

  // PEOPLE
  const tpm = normalizePerson(base.tpm ?? base.people?.tpm);
  const engDri = normalizePerson(base.engDri ?? base.people?.engDri ?? base.engineeringDri ?? base.people?.engineeringDri);
  const businessSponsor = normalizePerson(base.bizSponsor ?? base.people?.bizSponsor ?? base.businessSponsor ?? base.people?.businessSponsor);
  const engineeringSponsor = normalizePerson(base.engSponsor ?? base.people?.engSponsor ?? base.engineeringSponsor ?? base.people?.engineeringSponsor);

  // STATUS
  const sd = base.statusDefaults ?? base.status ?? profile.statusDefaults ?? profile.status ?? {};
  const statusLast = (sd.last ?? sd.previous ?? prevFormData.statusLast ?? "Green") as string;
  const statusCurrent = (sd.current ?? sd.now ?? prevFormData.statusCurrent ?? "Green") as string;
  const statusTrending = (sd.trending ?? sd.trend ?? prevFormData.statusTrending ?? "Green") as string;

  // EMAIL
  const emailTo = nonEmpty(prevFormData.emailTo)
    ? (prevFormData.emailTo as string)
    : ((base.emailTo ?? profile.emailTo ?? DEFAULT_EMAIL) as string);

  // BANNER (canonical map)
  const bannerSrc = base.banner ?? profile.banner ?? (BANNERS as any)[key] ?? {};
  const bannerCid = bannerSrc.cid ?? "";
  const bannerWeb = bannerSrc.web ?? "";
  const bannerAlt = bannerSrc.alt ?? "Project banner";

  const fromDesign = base.design ?? profile.design ?? {};
  const optBannerMode: "cid" | "web" =
    (fromDesign.optBannerMode as any) ??
    ((bannerCid && !bannerWeb) ? "cid" : (bannerWeb ? "web" : (bannerCid ? "cid" : "web")));

  // RESOURCES
  const resourcesHtmlFromProfile =
    (base.resourcesHtml as string | undefined)?.trim() ??
    (profile.resourcesHtml as string | undefined)?.trim() ??
    "";
  const resourcesList = buildResourcesFromProfile(base, profile, bannerSrc);
  const resourcesHtml =
    resourcesHtmlFromProfile.length > 0 ? resourcesHtmlFromProfile : buildResourcesHtml(resourcesList);

  // TITLES
  const updatesTitle = base.updatesTitle ?? prevFormData.updatesTitle;
  const milestonesTitle = base.milestonesTitle ?? prevFormData.milestonesTitle;
  const keyDecisionsTitle = base.keyDecisionsTitle ?? prevFormData.keyDecisionsTitle;
  const risksTitle = base.risksTitle ?? prevFormData.risksTitle;
  const resourcesTitle = base.resourcesTitle ?? prevFormData.resourcesTitle;

  return {
    optProjectId: key,

    // 🔴 program meta used by email header + on-screen header
    programTitle,
    programSummary,

    // people
    tpm: tpm || prevFormData.tpm || "",
    engDri: engDri || prevFormData.engDri || "",
    engineeringDri: engDri || prevFormData.engineeringDri || "",
    businessSponsor: businessSponsor || prevFormData.businessSponsor || "",
    bizSponsor: businessSponsor || prevFormData.bizSponsor || "",
    engineeringSponsor: engineeringSponsor || prevFormData.engineeringSponsor || "",
    engSponsor: engineeringSponsor || prevFormData.engSponsor || "",

    // status
    statusLast,
    statusCurrent,
    statusTrending,

    // email
    emailTo,

    // banner
    optBannerMode,
    bannerCid,
    bannerWeb,
    bannerAlt,

    // resources (write alias for safety)
    resources: resourcesList,
    resourcesHtml,
    additionalResourcesHtml: resourcesHtml,

    // section titles
    updatesTitle,
    milestonesTitle,
    keyDecisionsTitle,
    risksTitle,
    resourcesTitle,
  };
}

export function applyThemeForProject(key: string | undefined) {
  if (typeof window === "undefined") return;
  const theme = key ? PROJECT_THEME[key] : undefined;
  const bg = theme?.bg ?? "#f8fafc";
  document.body.style.backgroundColor = bg;
  document.documentElement.style.setProperty("--project-bg", bg);
  if (theme?.accent) {
    document.documentElement.style.setProperty("--accent-color", theme.accent);
  }
}

