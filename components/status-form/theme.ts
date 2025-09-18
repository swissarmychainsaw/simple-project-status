// Tailwind theme map per project (BannerKey).
// Tune classes as desired (e.g., swap 50/600 shades).
export type ThemeClasses = {
  containerBg: string;    // page background
  cardBorder: string;     // card border accent
  headerBg: string;       // header background
  headerText: string;     // header text color
  accentText: string;     // small accents (badges, etc.)
};

export type BannerKey = "gns" | "azure" | "cie" | "obn" | "azlens" | "ipv6";

const THEMES: Record<BannerKey, ThemeClasses> = {
  gns: {
    containerBg: "bg-emerald-50",
    cardBorder: "border-emerald-200",
    headerBg: "bg-emerald-600",
    headerText: "text-white",
    accentText: "text-emerald-700",
  },
  azure: {
    containerBg: "bg-sky-50",
    cardBorder: "border-sky-200",
    headerBg: "bg-sky-600",
    headerText: "text-white",
    accentText: "text-sky-700",
  },
  cie: {
    containerBg: "bg-violet-50",
    cardBorder: "border-violet-200",
    headerBg: "bg-violet-600",
    headerText: "text-white",
    accentText: "text-violet-700",
  },
  obn: {
    containerBg: "bg-indigo-50",
    cardBorder: "border-indigo-200",
    headerBg: "bg-indigo-600",
    headerText: "text-white",
    accentText: "text-indigo-700",
  },
  azlens: {
    containerBg: "bg-cyan-50",
    cardBorder: "border-cyan-200",
    headerBg: "bg-cyan-600",
    headerText: "text-white",
    accentText: "text-cyan-700",
  },
  ipv6: {
    containerBg: "bg-lime-50",
    cardBorder: "border-lime-200",
    headerBg: "bg-lime-600",
    headerText: "text-white",
    accentText: "text-lime-700",
  },
};

export function themeFor(key?: BannerKey | null): ThemeClasses {
  if (!key) {
    return {
      containerBg: "bg-gray-50",
      cardBorder: "border-gray-200",
      headerBg: "bg-gray-700",
      headerText: "text-white",
      accentText: "text-gray-700",
    };
  }
  return THEMES[key] ?? THEMES.azure;
}

