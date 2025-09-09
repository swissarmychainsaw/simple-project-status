// projectProfiles.ts
// Central source of truth for per-project presets (design + form defaults)
// No ReportKind required. Keys are the same ones you show in the Banner picker.
export const DEFAULT_EMAIL = "swissarmychainsaw@gmail.com";

// Lightweight banner assets used for preview/email CID mapping.
// PNGs live in /public/banners/*.png
export const BANNERS = {
  gns:   { web: "/banners/gns-banner.png",   cid: "banner-gns",   alt: "GNS — Global Network Services" },
  azure: { web: "/banners/azure-banner.png", cid: "banner-azure", alt: "Azure — Program Status" },
  cie:   { web: "/banners/cie-banner.png",   cid: "banner-cie",   alt: "Core Infrastructure Engineering — Program Status" },
  obn:   { web: "/banners/obn-banner.png",      cid: "banner-obn",   alt: "One Big Network Migration — Project Status" },
  azlens:{ web: "/banners/azure-lens.png",   cid: "banner-azlens",alt: "Azure Lens — Project Status" },
  ipv6:  { web: "/banners/ipv6.png",         cid: "banner-ipv6",  alt: "IPv6 Network — Project Status" },
} as const;

export type BannerKey = keyof typeof BANNERS;

export type BannerMode = "cid" | "url" | "none";
export type LogoMode = "cid" | "url" | "none";
export type Density = "comfortable" | "compact";
export type Borders = "lines" | "shaded";

// Keep these aligned with your app's DesignOptions fields.
// Use Partial in profiles so you can specify only what changes per project.
export interface DesignOptionsProfile {
  optBannerMode: BannerMode;
  optBannerId?: BannerKey;          // when using CID banners
  optBannerUrl?: string;            // when using URL banners
  optBannerCaption?: string;

  optLogoMode: LogoMode;
  optLogoUrl?: string;

  optFont?: string;                 // e.g., "system", "inter", etc.
  optAccent?: string;               // hex
  optBorders?: Borders;
  optDensity?: Density;
  optCustomCss?: string;
}

// Keep these aligned with your app's formData fields.
// You can add/remove fields here to match your actual form model.
export interface FormDefaultsProfile {
  programTitle?: string;
  programSummary?: string;

  tpm?: string;
  engDri?: string;
  bizSponsor?: string;
  engSponsor?: string;

  emailTo?: string;

  // Optional copy defaults (use or delete as you see fit)
  updatesTitle?: string;
  sectionTitle?: string;

  milestonesTitle?: string;
  milestonesSectionTitle?: string;

  keyDecisionsTitle?: string;
  keyDecisionsSectionTitle?: string;

  risksTitle?: string;
  risksSectionTitle?: string;

  resourcesTitle?: string;
  resourcesSectionTitle?: string;
}

export interface ProjectProfile {
  label: string;                       // human-readable
  design: Partial<DesignOptionsProfile>;
  defaults: Partial<FormDefaultsProfile>;
}

// Backward-compat helper: flip legacy "netmig" -> "obn"
export function normalizeBannerKey(k: string): BannerKey {
  return (k === "netmig" ? "obn" : k) as BannerKey;
}

// Labels you can reuse in Selects, etc.
export const BANNER_LABELS: Record<BannerKey, string> = {
  gns: "GNS",
  azure: "Azure",
  cie: "CIE",
  obn: "One Big Network Migration",
  azlens: "Azure Lens",
  ipv6: "IPv6 Network",
};

export const PROJECT_KEYS: BannerKey[] = ["gns", "azure", "cie", "obn", "azlens", "ipv6"];

// ---- Profiles ---------------------------------------------------------------

export const PROJECT_PROFILES: Record<BannerKey, ProjectProfile> = {
  gns: {
    label: BANNER_LABELS.gns,
    design: {
      optBannerMode: "cid",
      optBannerId: "gns",
      optLogoMode: "cid",
      optAccent: "#0ea5e9", // sky-500-ish
      optBorders: "lines",
      optDensity: "comfortable",
    },
    defaults: {
      programTitle: "Global Network Services",
      programSummary:
        "The Global Network Services (GNS) team designs, builds, and manages LinkedIn’s enterprise network, ensuring secure, reliable connectivity across on-prem and cloud. GNS also drives procurement, deployment, operations, automation, and system integration.",
    // Optional: prefill people if you want
    tpm: "Nick Adams",
    engDri: "Antony Alexander",
    bizSponsor: "Niha Mathur",
    engSponsor: "Suchreet Dhaliwal",
      emailTo: "swissarmychainsaw@gmail.com",
      updatesTitle: "Top Accomplishments",
      milestonesTitle: "Upcoming Milestones",
      keyDecisionsTitle: "Key Decisions",
      risksTitle: "Risks & Issue Mitigation Plan",
      resourcesTitle: "Additional Resources",
    },
  },















  

  azure: {
    label: BANNER_LABELS.azure,
    design: {
      optBannerMode: "cid",
      optBannerId: "azure",
      optLogoMode: "cid",
      optAccent: "#2563eb", // blue-600-ish
      optBorders: "shaded",
      optDensity: "comfortable",
    },
    defaults: {
      programTitle: "Azure Odyssey Program Status",
      programSummary: ""Making Azure a First-Class Citizen at LinkedIn" drives developer productivity, strengthens security, and streamlines operations and scalability. The program spans multiple tracks—Ownership & Management, Infrastructure & Deployment, Observability & Troubleshooting, Cost & Quota, Advanced Azure Functionalities, and Data & Governance. For more details, see program resources at go/Azure-Odyssey.",
      tpm: "Nick Adams",
      engDri: "Mario Estevez-Cruz",
      bizSponsor: "Niha Mathur",
      engSponsor: "Suchreet Dhaliwal",
      emailTo: "swissarmychainsaw@gmail.com",
      updatesTitle: "Top Accomplishments",
      milestonesTitle: "Upcoming Milestones",
      keyDecisionsTitle: "Key Decisions",
      risksTitle: "Risks & Issue Mitigation Plan",
      resourcesTitle: "Additional Resources",
    },
  },

  cie: {
    label: BANNER_LABELS.cie,
    design: {
      optBannerMode: "cid",
      optBannerId: "cie",
      optLogoMode: "cid",
      optAccent: "#16a34a", // green-600-ish
      optBorders: "lines",
      optDensity: "compact",
    },
    defaults: {
      programTitle: "Core Infrastructure Engineering",
      programSummary:
        "Core Infrastructure Engineering (CIE) enables all engineering and business functions across the organization by providing resilient, scalable, and secure infrastructure services. Our goal is to deliver high-performing, cost-effective platforms that empower innovation and reliability.",
      tpm: "Nick Adams",
      engDri: "Igor Dragićević",
      bizSponsor: "Niha Mathur",
      engSponsor: "Suchreet Dhaliwal",
      emailTo: "swissarmychainsaw@gmail.com",
      updatesTitle: "Top Accomplishments",
      milestonesTitle: "Upcoming Milestones",
      keyDecisionsTitle: "Key Decisions",
      risksTitle: "Risks & Issue Mitigation Plan",
      resourcesTitle: "Additional Resources",
    },
  },

  obn: {
    label: BANNER_LABELS.obn,
    design: {
      optBannerMode: "cid",
      optBannerId: "obn",
      optLogoMode: "cid",
      optAccent: "#0ea5e9",
      optBorders: "lines",
      optDensity: "comfortable",
      optBannerCaption: "One Big Network Migration",
    },
    defaults: {
      programTitle: "One Big Network Migration",
      programSummary:
        "Consolidating and modernizing network infrastructure to a unified, secure backbone.",
      tpm: "Nick Adams",
      engDri: "Antony Alexander Christie ",
      bizSponsor: "Niha Mathur",
      engSponsor: "Suchreet Dhaliwal",
      emailTo: "swissarmychainsaw@gmail.com",
      updatesTitle: "Top Accomplishments",
      milestonesTitle: "Upcoming Milestones",
      keyDecisionsTitle: "Key Decisions",
      risksTitle: "Risks & Issue Mitigation Plan",
      resourcesTitle: "Additional Resources",
    },
  },

  azlens: {
    label: BANNER_LABELS.azlens,
    design: {
      optBannerMode: "cid",
      optBannerId: "azlens",
      optLogoMode: "cid",
      optAccent: "#9333ea", // purple-600-ish
      optBorders: "shaded",
      optDensity: "comfortable",
    },
    defaults: {
      programTitle: "Azure Lens",
      programSummary:
        "Azure Lens is a system designed to optimize Azure resource utilization and reduce costs for LinkedIn. It addresses challenges such as identifying underutilized resources, managing ownership details, and making actionable recommendations for cost savings. ",
      tpm: "Nick Adams",
      engDri: "Mario Estevez-Cruz",
      bizSponsor: "Niha Mathur",
      engSponsor: "Suchreet Dhaliwal",
      emailTo: "swissarmychainsaw@gmail.com",
      updatesTitle: "Top Accomplishments",
      milestonesTitle: "Upcoming Milestones",
      keyDecisionsTitle: "Key Decisions",
      risksTitle: "Risks & Issue Mitigation Plan",
      resourcesTitle: "Additional Resources",
    },
  },

  ipv6: {
    label: BANNER_LABELS.ipv6,
    design: {
      optBannerMode: "cid",
      optBannerId: "ipv6",
      optLogoMode: "cid",
      optAccent: "#ef4444", // red-500-ish
      optBorders: "lines",
      optDensity: "compact",
    },
    defaults: {
      programTitle: "IPv6 Network Enablement",
      programSummary:
        "Rolling out IPv6 dual-stack capabilities to services, endpoints, and networks.",
      tpm: "Ariana Fox",
      engDri: "Antony Alexander Christie ",
      bizSponsor: "Niha Mathur",
      engSponsor: "Suchreet Dhaliwal",
      emailTo: "swissarmychainsaw@gmail.com",
      updatesTitle: "Top Accomplishments",
      milestonesTitle: "Upcoming Milestones",
      keyDecisionsTitle: "Key Decisions",
      risksTitle: "Risks & Issue Mitigation Plan",
      resourcesTitle: "Additional Resources",
    },
  },
};

// ---- Helpers to consume profiles -------------------------------------------

/**
 * Returns the profile object for a given key.
 */
export function getProjectProfile(key: BannerKey): ProjectProfile {
  return PROJECT_PROFILES[key];
}

/**
 * Compute the partials you should merge into your state from a given profile.
 * - mode "fill": only fill empty/undefined fields
 * - mode "overwrite": replace existing values
 *
 * Usage in your component (pseudo-code):
 *   const { design, form } = getMergedProfileChanges("obn", "fill", designOptions, formData);
 *   setDesignOptions((d) => ({ ...d, ...design }));
 *   setFormData((f) => ({ ...f, ...form }));
 */
export function getMergedProfileChanges(
  key: BannerKey,
  mode: "fill" | "overwrite",
  currentDesign?: Partial<DesignOptionsProfile>,
  currentForm?: Partial<FormDefaultsProfile>
): { design: Partial<DesignOptionsProfile>; form: Partial<FormDefaultsProfile> } {
  const profile = getProjectProfile(key);

  const nextDesign: Partial<DesignOptionsProfile> = {};
  const nextForm: Partial<FormDefaultsProfile> = {};

  // merge design
  for (const [k, v] of Object.entries(profile.design)) {
    const cur = currentDesign?.[k as keyof DesignOptionsProfile];
    if (mode === "overwrite" || cur === undefined || cur === "" || cur === null) {
      (nextDesign as any)[k] = v;
    }
  }

  // force the banner id to match the selected key when using CID
  if ((profile.design.optBannerMode ?? "cid") === "cid") {
    nextDesign.optBannerId = key;
  }

  // merge defaults (form data)
  for (const [k, v] of Object.entries(profile.defaults)) {
    const cur = currentForm?.[k as keyof FormDefaultsProfile];
    if (mode === "overwrite" || cur === undefined || cur === "" || cur === null) {
      (nextForm as any)[k] = v;
    }
  }

  return { design: nextDesign, form: nextForm };
}
