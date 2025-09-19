// components/status-form/sections/labels.ts
// Drop-in replacement: includes BANNER_LABELS, PROJECT_KEYS, pill colors, page theme, and the canonical BANNERS map.

export const BANNER_LABELS: Record<string, string> = {
  gns: "GNS",
  azure: "Azure Odyssey",
  cie: "CIE",
  obn: "One Big Network Migration",
  azlens: "Azure Lens",
  ipv6: "IPv6 Network",
};

export const PROJECT_KEYS = Object.keys(BANNER_LABELS) as string[];

/** Literal Tailwind classes so they never get purged. */
export const PILL_ACTIVE_CLASSES: Record<string, { bg: string; border: string; text: string }> = {
  gns:   { bg: "bg-emerald-600", border: "border-emerald-600", text: "text-white" },
  azure: { bg: "bg-sky-600",     border: "border-sky-600",     text: "text-white" },
  cie:   { bg: "bg-violet-600",  border: "border-violet-600",  text: "text-white" },
  obn:   { bg: "bg-amber-600",   border: "border-amber-600",   text: "text-gray-900" },
  azlens:{ bg: "bg-indigo-600",  border: "border-indigo-600",  text: "text-white" },
  ipv6:  { bg: "bg-lime-700",    border: "border-lime-700",    text: "text-white" },
};

/** Page theme (background tint + accent) */
export const PROJECT_THEME: Record<string, { accent: string; bg: string }> = {
  gns:   { accent: "#059669", bg: "#ecfdf5" }, // emerald
  azure: { accent: "#0284c7", bg: "#e0f2fe" }, // sky
  cie:   { accent: "#7c3aed", bg: "#ede9fe" }, // violet
  obn:   { accent: "#d97706", bg: "#fffbeb" }, // amber
  azlens:{ accent: "#4f46e5", bg: "#eef2ff" }, // indigo
  ipv6:  { accent: "#3f6212", bg: "#ecfccb" }, // lime
};

/** Canonical banner sources (use these, don't guess paths) */
export const BANNERS = {
  gns:   { web: "/banners/gns-banner.png",      cid: "banner-gns",   alt: "GNS — Global Network Services" },
  azure: { web: "/banners/azure-banner.png",    cid: "banner-azure", alt: "Azure Odyssey - Program Status" },
  cie:   { web: "/banners/cie-banner.png",      cid: "banner-cie",   alt: "Core Infrastructure Engineering — Program Status" },
  obn:   { web: "/banners/obn-banner.png",      cid: "banner-obn",   alt: "One Big Network Migration — Project Status" },
  azlens:{ web: "/banners/azurelens-banner.png",cid: "banner-azlens",alt: "Azure Lens — Project Status" },
  ipv6:  { web: "/banners/ipv6-banner.png",     cid: "banner-ipv6",  alt: "IPv6 Network — Project Status" },
} as const;

