// lib/status-form/applyProfileDefaults.ts
// Drop-in replacement that reads from PROJECT_PROFILES[projectKey].defaults

import { PROJECT_THEME } from "@/components/status-form/sections/labels";
import { PROJECT_PROFILES, DEFAULT_EMAIL } from "@/components/status-form/projectProfiles";

/** UI list item for the Additional resources card (fallback list) */
export type ResourceItem = {
  id: string;
  label: string;
  href?: string;
  value?: string;
  note?: string;
};

/* ---------------- helpers ---------------- */

function nonEmpty(v: any): boolean {
  return v !== undefined && v !== null && String(v).trim() !== "";
}

/** Accepts: string | {name, email} | Array<same>. Returns a display string. */
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

/** Build a simple list from banner + resources[] (used when resourcesHtml not provided) */
function buildResourcesFromProfile(base: any, profileFallback?: any): ResourceItem[] {
  const list: ResourceItem[] = [];
  const banner = base?.banner ?? profileFallback?.banner;
  if (banner?.web) {
    list.push({
      id: "banner-web",
      label: "Banner (web)",
      href: banner.web,
      note: banner.alt ? `alt: ${banner.alt}` : undefined,
    });
  }
  if (banner?.cid) {
    list.push({
      id: "banner-cid",
      label: "Banner (CID)",
      value: `cid:${banner.cid}`,
    });
  }
  const resArr = Array.isArray(base?.resources) ? base.resources : Array.isArray(profileFallback?.resources) ? profileFallback.resources : [];
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

/** Public: used by email builders to generate a plain list if needed */
export function buildResourcesHtml(list: ResourceItem[]): string {
  if (!list?.length) return "";
  const li = list
    .map((r) => {
      const right =
        r.href
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

/* --------------- main: apply defaults from projectProfiles.defaults --------------- */

export function applyProfileDefaultsByKey(
  key: string | undefined,
  prevFormData: Record<string, any> = {}
): Record<string, any> {
  if (!key) return {};
  const profile = (PROJECT_PROFILES as any)[key];
  if (!profile) return {};

  // IMPORTANT: your data lives under `defaults`
  const base = profile.defaults ?? profile;

  // PEOPLE — your exact keys (with optional base.people.* aliases)
  const tpm = normalizePerson(base.tpm ?? base.people?.tpm);
  const engDri = normalizePerson(
    base.engDri ?? base.people?.engDri ?? base.engineeringDri ?? base.people?.engineeringDri
  );
  const businessSponsor = normalizePerson(
    base.bizSponsor ?? base.people?.bizSponsor ?? base.businessSponsor ?? base.people?.businessSponsor
  );
  const engineeringSponsor = normalizePerson(
    base.engSponsor ?? base.people?.engSponsor ?? base.engineeringSponsor ?? base.people?.engineeringSponsor
  );

  // STATUS defaults (optional; can be under base.statusDefaults / base.status)
  const sd = base.statusDefaults ?? base.status ?? profile.statusDefaults ?? profile.status ?? {};
  const statusLast = (sd.last ?? sd.previous ?? prevFormData.statusLast ?? "Green") as string;
  const statusCurrent = (sd.current ?? sd.now ?? prevFormData.statusCurrent ?? "Green") as string;
  const statusTrending = (sd.trending ?? sd.trend ?? prevFormData.statusTrending ?? "Green") as string;

  // EMAIL / BANNER
  const emailTo = (prevFormData.emailTo ?? base.emailTo ?? profile.emailTo ?? DEFAULT_EMAIL) as string;

  // ADDITIONAL RESOURCES
  // Prefer HTML in defaults (your case), then top-level profile, else build from banner/resources[]
  const resourcesHtmlFromProfile =
    (base.resourcesHtml as string | undefined)?.trim() ??
    (profile.resourcesHtml as string | undefined)?.trim() ??
    "";
  const resourcesList = buildResourcesFromProfile(base, profile);
  const resourcesHtml =
    resourcesHtmlFromProfile.length > 0 ? resourcesHtmlFromProfile : buildResourcesHtml(resourcesList);

  // SECTION TITLES (optional)
  const updatesTitle = base.updatesTitle ?? prevFormData.updatesTitle;
  const milestonesTitle = base.milestonesTitle ?? prevFormData.milestonesTitle;
  const keyDecisionsTitle = base.keyDecisionsTitle ?? prevFormData.keyDecisionsTitle;
  const risksTitle = base.risksTitle ?? prevFormData.risksTitle;
  const resourcesTitle = base.resourcesTitle ?? prevFormData.resourcesTitle;

  // Final patch (writes both canonical and alias keys so UI always reads them)
  return {
    optProjectId: key,

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

    // resources
    resources: resourcesList,
    resourcesHtml,

    // optional section titles
    updatesTitle,
    milestonesTitle,
    keyDecisionsTitle,
    risksTitle,
    resourcesTitle,
  };
}

/** Tint page background + expose accent CSS var. Call on selection and on mount (client only). */
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

