"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bold, Italic, Underline, Copy, Download, RotateCcw, Eye, Code,
  CheckCircle, Shield, Loader2, AlertTriangle, Mail,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Optional helper used inside your page, NOT default-exported:
export function ReportHeader() {
  // If the file is in /public/gns-logo.png you can reference it by path:
  return <Image src="/gns-logo.png" alt="GNS logo" width={120} height={40} priority />
}

type ApplyMode = "fill" | "overwrite";

interface FormData {
  programTitle: string
  programSummary: string
  asOf: string
  lastStatus: string
  currentStatus: string
  trending: string
  tpm: string
  engDri: string
  bizSponsor: string
  engSponsor: string
  execSummary: string
  lowlights: string
  updatesTrack: string
  updatesTeam: string
  updatesHtml: string
  sectionTitle: string
  emailTo: string
  updatesTitle: string
  milestonesTitle: string
  milestonesSectionTitle: string
  milestonesHtml: string
  keyDecisionsTitle: string
  keyDecisionsSectionTitle: string
  keyDecisionsHtml: string

  risksTitle: string
  risksSectionTitle: string
  risksHtml: string

  resourcesTitle: string
  resourcesSectionTitle: string
  resourcesHtml: string

}

interface DesignOptions {
  optFont: string
  optAccent: string
  optDensity: string
  optBorders: string
  optCustomCss: string
  optLogoMode: "cid" | "url" | "none"   
  optLogoUrl: string                  
  optBannerMode: "url" | "cid" | "none"
  optBannerId: BannerKey
  optBannerUrl: string        // optional override when mode = "url"
  optBannerCaption: string    // e.g. "Program Status"
  optReportKind: ReportKind  
}

const statusOptions = ["Green", "Yellow", "Red"]
const fontOptions = [
  { value: "Inter, Arial, Helvetica, sans-serif", label: "Inter / System" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Segoe UI, Arial, Helvetica, sans-serif", label: "Segoe UI" },
  { value: "Helvetica, Arial, sans-serif", label: "Helvetica" },
  { value: "Georgia, serif", label: "Georgia" },
]
// Logo constants
const LOGO_WIDTH = 120;               // px
const LOGO_SRC_WEB = "/gns-logo.png"; // put the PNG in /public
const LOGO_CID = "gns-logo";          // used for inline-embedded email images

// --- Banners ---
// Put the PNGs in /public/banners/*.png (recommended size ~1400×280 for good retina; we render width=700)
const BANNERS = {
  gns:   { web: "/banners/gns-banner.png",   cid: "banner-gns",   alt: "GNS — Global Network Services" },
  azure: { web: "/banners/azure-banner.png", cid: "banner-azure", alt: "Azure — Program Status" },
  cie:   { web: "/banners/cie-banner.png",   cid: "banner-cie",   alt: "Core Infrastructure Engineering — Program Status" },
  netmig:{ web: "/banners/OBN-mig.png",  cid: "banner-netmig",alt: "One Big Network Migration — Project Status" },
  azlens:{ web: "/banners/azure-lens.png",   cid: "banner-azlens",alt: "Azure Lens — Project Status" },
  ipv6:  { web: "/banners/ipv6.png",         cid: "banner-ipv6",  alt: "IPv6 Network — Project Status" },
} as const;
type BannerKey = keyof typeof BANNERS;


const BANNER_DEFAULTS: Partial<Record<BannerKey, {
  title: string
  summary: string
  tpm?: string
  engDri?: string
  bizSponsor?: string
  engSponsor?: string
}>> = {
  gns: {
    title: "Global Network Services (GNS)",
    summary:
      "The Global Network Services (GNS) team designs, builds, and manages LinkedIn's enterprise network, ensuring secure, reliable connectivity across on-prem and cloud.",
    // Optional: prefill people if you want
    tpm: "Nick Adams",
    engDri: "Antony Alexander",
    bizSponsor: "Niha Mathur",
    engSponsor: "Suchreet Dhaliwal",
  },
};

// --- Report types you support (add/remove as you like)
type ReportKind =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "program"
  | "project"
  | "ops"
  | "exec"
  | "incident";

// What a defaults pack can set
type DefaultsPack = {
  form?: Partial<FormData>;
  design?: Partial<DesignOptions>;
};

// Per banner: base defaults + per-report-kind defaults
const PRESETS: Partial<
  Record<
    BannerKey,
    {
      base?: DefaultsPack;
      kinds?: Partial<Record<ReportKind, DefaultsPack>>;
    }
  >
> = {
  gns: {
    base: {
      form: {
        programTitle: "Global Network Services (GNS)",
        programSummary:
          "The Global Network Services (GNS) team designs, builds, and manages LinkedIn's enterprise network, ensuring secure, reliable connectivity across on-prem and cloud.",
        // Optional always-on people for GNS:
        // tpm: "Nick Adams",
        // engDri: "Antony Alexander",
        // bizSponsor: "Niha Mathur",
        // engSponsor: "Suchreet Dhaliwal",
        updatesTitle: "Top Accomplishments",
      },
      design: {
        optBannerCaption: "Global Network Services — Program Status",
      },
    },
    kinds: {
      weekly: {
        form: {
          sectionTitle: "Network Engineering",
          milestonesTitle: "Upcoming Milestones",
          milestonesSectionTitle: "This Quarter",
          // You can pre-seed rich sections too:
          // updatesHtml: `<table>...</table>`,
          // keyDecisionsHtml: `<ul><li>…</li></ul>`,
          // risksHtml: `<table>…</table>`,
          // resourcesHtml: `<ul><li><a href="https://…">Runbook</a></li></ul>`,
        },
      },
      exec: {
        form: {
          updatesTitle: "Executive Highlights",
          keyDecisionsTitle: "Key Decisions",
          risksTitle: "Risks & Issue Mitigation Plan",
        },
      },
      program: {
        form: {
          milestonesTitle: "Program Milestones",
          milestonesSectionTitle: "Quarterly Targets",
        },
      },
    },
  },

  azure: {
    base: {
      form: {
        programTitle: "Azure Program",
        programSummary: "Cross-cloud enablement and migration to Azure.",
        updatesTitle: "Azure Highlights",
      },
      design: { optBannerCaption: "Azure — Program Status" },
    },
    kinds: {
      weekly: {
        form: {
          sectionTitle: "Cloud Foundations",
          milestonesSectionTitle: "Next 30 Days",
        },
      },
    },
  },

  // Example for another banner
  ipv6: {
    base: {
      form: {
        programTitle: "Enterprise IPv6 Rollout",
        programSummary: "Dual-stack enablement across WAN/LAN and services.",
      },
      design: { optBannerCaption: "IPv6 Network — Project Status" },
    },
    kinds: {
      project: {
        form: {
          updatesTitle: "Deployment Progress",
          milestonesTitle: "Cutover Schedule",
        },
      },
    },
  },
};



const PERSIST_PREFIX = "statusReportGenerator."
const EXEC_SUMMARY_PLAIN_LIMIT = 20000

const getPlainTextLength = (html: string): number => {
  const el = document.createElement("div")
  el.innerHTML = html || ""
  return (el.textContent || el.innerText || "").trim().length
}

const SAVE_FIELDS = [
  "programTitle",
  "programSummary",
  "lastStatus",
  "currentStatus",
  "trending",
  "tpm",
  "engDri",
  "bizSponsor",
  "engSponsor",
  "execSummary",
  "sectionTitle",
  "updatesTitle",
  "emailTo",
  "asOf",
  "milestonesTitle",
  "milestonesSectionTitle",
  "milestonesHtml",
  // persist updates content too
  "updatesHtml",
    "keyDecisionsTitle",
  "keyDecisionsSectionTitle",
  "keyDecisionsHtml",
  "risksTitle",
  "risksSectionTitle",
  "risksHtml",
  "resourcesTitle",
  "resourcesSectionTitle",
  "resourcesHtml",

] as const

// const isLargeFieldKey = (k: string) => /(?:updatesHtml|milestonesHtml)/.test(k)
const isLargeFieldKey = (k: string) =>
  /(?:updatesHtml|milestonesHtml|keyDecisionsHtml|risksHtml|resourcesHtml)/.test(k)

const SECURITY_CONFIG = {
  MAX_FIELD_LENGTH: 20000,
  MAX_EXEC_SUMMARY_LENGTH: 3000,
  MAX_UPDATES_LENGTH: 100000, // large sections
  MAX_CSS_LENGTH: 5000,
  ALLOWED_TAGS: new Set([
    "b",
    "i",
    "u",
    "p",
    "br",
    "ul",
    "ol",
    "li",
    "a",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "strong",
    "em",
    "div",
    "span",
    "h1",
    "h2",
    "h3",
    "img",
  ]),
  ALLOWED_ATTRIBUTES: {
    "*": ["class", "style"],
    a: ["href", "title", "target"],
    img: ["src", "alt", "width", "height"],
    table: [
      "class",
      "style",
      "border",
      "cellpadding",
      "cellspacing",
      "data-testid",
      "data-number-column",
      "data-table-width",
      "data-layout",
    ],
    th: ["class", "style", "colspan", "rowspan", "scope"],
    td: ["class", "style", "colspan", "rowspan"],
    tr: ["class", "style"],
    thead: ["class", "style"],
    tbody: ["class", "style"],
    tfoot: ["class", "style"],
  },
  DANGEROUS_PROTOCOLS: /^(javascript:|data:|vbscript:|file:|about:)/i,
  CSS_INJECTION_PATTERNS: /(expression|javascript|@import|behavior|binding)/i,
  HTML_INJECTION_PATTERNS: /<script|<iframe|<object|<embed|<link|<meta|<base/i,
}

const initialFormData: FormData = {
  programTitle: "",
  programSummary: "",
  asOf: "",
  lastStatus: "Green",
  currentStatus: "Green",
  trending: "Green",
  tpm: "",
  engDri: "",
  bizSponsor: "",
  engSponsor: "",
  execSummary: "",
  lowlights: "",
  updatesTrack: "",
  updatesTeam: "",
  updatesHtml: "",
  sectionTitle: "",
  emailTo: "",
  updatesTitle: "Top Accomplishments",
  milestonesTitle: "Upcoming Milestones",
  milestonesSectionTitle: "",
  milestonesHtml: "",
    // NEW sections
  keyDecisionsTitle: "Key Decisions",
  keyDecisionsSectionTitle: "",
  keyDecisionsHtml: "",

  risksTitle: "Risks & Issue Mitigation Plan",
  risksSectionTitle: "",
  risksHtml: "",

  resourcesTitle: "Additional Resources",
  resourcesSectionTitle: "",
  resourcesHtml: "",

}

export default function StatusForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [designOptions, setDesignOptions] = useState<DesignOptions>({
    optFont: "Inter, Arial, Helvetica, sans-serif",
    optAccent: "#086dd7",
    optDensity: "comfortable",
    optBorders: "lines",
    optCustomCss: "",
  optLogoMode: "cid",   // ← add
  optLogoUrl: "",       // ← add

  // NEW defaults
  optBannerMode: "url",
  optBannerId: "gns",
  optBannerUrl: "",
  optBannerCaption: "Program Status",
  })

  const [generatedHtml, setGeneratedHtml] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [previewMode, setPreviewMode] = useState<"preview" | "code">("preview")
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([])
  const updatesRef = useRef<HTMLDivElement>(null)
  const milestonesRef = useRef<HTMLDivElement>(null)
  const execSummaryRef = useRef<HTMLDivElement>(null)
  const keyDecisionsRef = useRef<HTMLDivElement>(null)
  const risksRef = useRef<HTMLDivElement>(null)
  const resourcesRef = useRef<HTMLDivElement>(null)



  const { toast } = useToast()
  const [copyRenderedLoading, setIsCopyingRendered] = useState(false)
  const [copyRenderedFeedback, setCopyRenderedFeedback] = useState("")
  const [isEmailing, setIsEmailing] = useState(false)

  const [execLen, setExecLen] = useState(0)
  const [execOver, setExecOver] = useState(false)

const OPT_FIELDS = [
  "optFont",
  "optAccent",
  "optDensity",
  "optBorders",
  "optCustomCss",
  "optLogoMode",
  "optLogoUrl",
  "optBannerMode","optBannerId","optBannerUrl","optBannerCaption",
    "optReportKind", // NEW
] as const

  // --- Org profiles tied to banners (stable defaults you can extend) ---
const PROFILES: Record<
  BannerKey,
  Partial<FormData> & {
    caption?: string;   // default banner caption
    accent?: string;    // optional accent color
  }
> = {
  gns: {
    caption: "Program Status",
    accent: "#086dd7",
    programTitle: "The Global Network Services (GNS)",
    programSummary:
      "The Global Network Services (GNS) team designs, builds, and manages LinkedIn's enterprise network, ensuring secure, reliable connectivity across on-prem and cloud.",
    tpm: "Nick Adams",
    engDri: "Antony Alexander",
    bizSponsor: "Niha Mathur",
    engSponsor: "Suchreet Dhaliwal",
  },
  // Stubs you can flesh out later
  azure: { caption: "Program Status" },
  cie:   { caption: "Program Status" },
  netmig:{ caption: "Project Status" },
  azlens:{ caption: "Project Status" },
  ipv6:  { caption: "Program Status" },
};

  
  const safeLocalStorageGet = (key: string): string | null => {
    try {
      const value = localStorage.getItem(key)
      const maxLength = isLargeFieldKey(key) ? SECURITY_CONFIG.MAX_UPDATES_LENGTH : SECURITY_CONFIG.MAX_FIELD_LENGTH
      if (value && value.length > maxLength) {
        console.warn(`Stored value for ${key} exceeds maximum length, ignoring`)
        localStorage.removeItem(key)
        return null
      }
      return value
    } catch (error) {
      console.error(`Failed to read from localStorage for key ${key}:`, error)
      return null
    }
  }

  const safeLocalStorageSet = (key: string, value: string): boolean => {
    try {
      const maxLength = isLargeFieldKey(key) ? SECURITY_CONFIG.MAX_UPDATES_LENGTH : SECURITY_CONFIG.MAX_FIELD_LENGTH
      if (value.length > maxLength) {
        console.warn(`Value for ${key} exceeds maximum length, not storing`)
        return false
      }
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error(`Failed to write to localStorage for key ${key}:`, error)
      toast({
        title: "Storage warning",
        description: "Unable to save data locally. Your changes may not persist.",
        variant: "destructive",
      })
      return false
    }
  }

// Load persisted data on mount + seed example data if empty
useEffect(() => {
  SAVE_FIELDS.forEach((field) => {
    const value = safeLocalStorageGet(PERSIST_PREFIX + field)
    if (value !== null) {
      if (field === "updatesHtml" || field === "milestonesHtml" || field === "execSummary") {
        setFormData((prev) => ({ ...prev, [field]: normalizeEditorHtml(value) }))
      } else if ((field as string).startsWith("opt")) {
        setDesignOptions((prev) => ({ ...prev, [field as keyof DesignOptions]: value }))
      } else {
        setFormData((prev) => ({ ...prev, [field]: value }))
      }
    }
  })
// NEW: load design options
  OPT_FIELDS.forEach((field) => {
    const value = safeLocalStorageGet(PERSIST_PREFIX + field)
    if (value !== null) {
      setDesignOptions((prev) => ({ ...prev, [field]: value } as DesignOptions))
    }
  })

  // seed example data (unchanged)...
  const savedSummary = safeLocalStorageGet(PERSIST_PREFIX + "programSummary")
  if (!savedSummary) {
    setFormData((prev) => ({
      ...prev,
      programSummary:
        "The Global Network Services (GNS) team designs, builds, and manages LinkedIn's enterprise network, ensuring secure, reliable connectivity across on-prem and cloud.",
      tpm: "Nick Adams",
      engDri: "Antony Alexander",
      bizSponsor: "Niha Mathur",
      engSponsor: "Suchreet Dhaliwal",
    }))
  }
}, [])

  

  const validateInput = (field: string, value: string) => {
    const warnings: string[] = []
    let sanitized = value

    const maxLength =
      field === "execSummary"
        ? SECURITY_CONFIG.MAX_EXEC_SUMMARY_LENGTH
        : field === "updatesHtml" || field === "milestonesHtml"
        ? SECURITY_CONFIG.MAX_UPDATES_LENGTH
        : SECURITY_CONFIG.MAX_FIELD_LENGTH

    if (field === "execSummary") {
      // plain-text limit enforced in UI
    } else if (value.length > maxLength) {
      sanitized = value.substring(0, maxLength)
      warnings.push(`${field} was truncated to ${maxLength} characters`)
    }

    if (SECURITY_CONFIG.HTML_INJECTION_PATTERNS.test(value)) {
      warnings.push(`Potentially dangerous HTML detected in ${field}`)
    }
    if (field === "optCustomCss" && SECURITY_CONFIG.CSS_INJECTION_PATTERNS.test(value)) {
      warnings.push("Potentially dangerous CSS detected and will be sanitized")
    }

    return { isValid: warnings.length === 0, sanitized, warnings }
  }

  const sanitizeCss = (css: string): string => {
    return css
      .replace(SECURITY_CONFIG.CSS_INJECTION_PATTERNS, "")
      .replace(/@import\s+[^;]+;/gi, "")
      .replace(/expression\s*\([^)]*\)/gi, "")
      .replace(/javascript\s*:/gi, "")
      .replace(/behavior\s*:/gi, "")
      .replace(/binding\s*:/gi, "")
      .substring(0, SECURITY_CONFIG.MAX_CSS_LENGTH)
  }

  const persistField = (field: string, value: string) => {
    const validation = validateInput(field, value)
    if (validation.warnings.length > 0) {
      setSecurityWarnings((prev) => [...prev, ...validation.warnings])
    }
    safeLocalStorageSet(PERSIST_PREFIX + field, validation.sanitized)
  }

  
  const updateDesignOptions = (field: keyof DesignOptions, value: string) => {
  let processedValue = field === "optCustomCss" ? sanitizeCss(value) : value;
  const validation = validateInput(field, processedValue);

  setDesignOptions((prev) => ({ ...prev, [field]: validation.sanitized }));
  safeLocalStorageSet(PERSIST_PREFIX + field, validation.sanitized);

  // Re-apply profile defaults when banner or report kind changes
  if (field === "optBannerId" || field === "optReportKind") {
    const bannerId = (field === "optBannerId"
      ? (validation.sanitized as BannerKey)
      : designOptions.optBannerId) as BannerKey;

    const kind = (field === "optReportKind"
      ? (validation.sanitized as ReportKind)
      : designOptions.optReportKind) as ReportKind;

    applyProfile(bannerId, kind, "fill"); // use "overwrite" if you want it to hard-set
  }

  if (validation.warnings.length > 0) {
    setSecurityWarnings((prev) => [...prev, ...validation.warnings]);
  }
};


  // HTML helpers
  const escapeHtml = (s: string) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");


const applyDefaultsPack = (pack: DefaultsPack, mode: ApplyMode = "fill") => {
  if (!pack) return;
  if (pack.form) {
    for (const [k, v] of Object.entries(pack.form) as [keyof FormData, string][]) {
      if (v == null) continue;
      const current = (formData[k] ?? "") as string;
      const shouldSet = mode === "overwrite" || current.trim() === "";
      if (shouldSet) updateFormData(k, v);
    }
  }
  if (pack.design) {
    for (const [k, v] of Object.entries(pack.design) as [keyof DesignOptions, string][]) {
      if (v == null) continue;
      const current = (designOptions as any)[k] ?? "";
      const shouldSet = mode === "overwrite" || String(current).trim() === "";
      if (shouldSet) updateDesignOptions(k, v);
    }
  }
};

const applyProfile = (bannerId: BannerKey, kind?: ReportKind, mode: ApplyMode = "fill") => {
  const spec = PRESETS[bannerId];
  if (!spec) return;
  if (spec.base) applyDefaultsPack(spec.base, mode);
  if (kind && spec.kinds?.[kind]) applyDefaultsPack(spec.kinds[kind]!, mode);

  // If caption still empty, seed from banner alt
  const preset = BANNERS[bannerId];
  if (!(designOptions.optBannerCaption || "").trim() && preset?.alt) {
    updateDesignOptions("optBannerCaption", preset.alt);
  }
};

  const safeInline = (s: string) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/&lt;(\/)?(b|i|u)&gt;/g, "<$1$2>")
  
  const nlToParas = (text: string) => {
    const parts = String(text || "")
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean)
    return parts.map((p) => safeInline(p).replace(/\n/g, "<br>")).join("<br><br>")
  }

  // Replace <p> inside table cells with inline spans (+ <br> separators) before insertion
  const unwrapParagraphsInTables = (html: string): string => {
    if (!html) return ""
    const root = document.createElement("div")
    root.innerHTML = html

    root.querySelectorAll("table td, table th").forEach((cell) => {
      const ps = Array.from(cell.querySelectorAll("p"))
      ps.forEach((p, i) => {
        const span = document.createElement("span")
        span.innerHTML = (p as HTMLElement).innerHTML
        p.replaceWith(span)
        if (i !== ps.length - 1) span.insertAdjacentHTML("afterend", "<br>")
      })
    })

    return root.innerHTML
  }

  const linesToList = (text: string) => {
    const items = String(text || "")
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean)
    return items.length ? `<ul>\n${items.map((i) => `  <li>${safeInline(i)}</li>`).join("\n")}\n</ul>` : ""
  }

  const sanitizeHtml = (html: string): string => {
    if (!html || typeof html !== "string") return ""
    try {
      const wrapper = document.createElement("div")
      wrapper.innerHTML = html

      // Safer URL/protocol guard that doesn't need window.location
      const isSafeHref = (href: string) => {
        try {
          const url = new URL(href, "https://example.com")
          return ["http:", "https:", "mailto:"].includes(url.protocol)
        } catch {
          return false
        }
      }

      Array.from(wrapper.querySelectorAll<HTMLElement>("*")).forEach((el) => {
        const tag = el.tagName.toLowerCase()

        if (!SECURITY_CONFIG.ALLOWED_TAGS.has(tag)) {
          const parent = el.parentNode
          if (parent) {
            while (el.firstChild) parent.insertBefore(el.firstChild, el)
            parent.removeChild(el)
          }
          return
        }

        Array.from(el.attributes).forEach((attr) => {
          const attrName = attr.name.toLowerCase()
          const attrValue = attr.value

          const allowed =
            SECURITY_CONFIG.ALLOWED_ATTRIBUTES["*"].includes(attrName) ||
            (SECURITY_CONFIG.ALLOWED_ATTRIBUTES as any)[tag]?.includes(attrName)

          if (!allowed) {
            el.removeAttribute(attr.name)
            return
          }

          if (attrName === "href") {
            if (SECURITY_CONFIG.DANGEROUS_PROTOCOLS.test(attrValue) || !isSafeHref(attrValue)) {
              el.removeAttribute("href")
            }
          }
        })
      })

      return wrapper.innerHTML
    } catch (error) {
      console.error("HTML sanitization failed:", error)
      return escapeHtml(html)
    }
  }

const getLogoImg = (forEmail: boolean): string => {
  if (designOptions.optLogoMode === "none") return ""

  // pick the correct src
  let src: string
  if (designOptions.optLogoMode === "url") {
    // use provided URL (fallback to web path if empty)
    src = designOptions.optLogoUrl?.trim() || LOGO_SRC_WEB
  } else {
    // "cid" mode: email uses CID, preview uses web path
    src = forEmail ? `cid:${LOGO_CID}` : LOGO_SRC_WEB
  }

  // very light sanity check: only allow http/https/cid in src
  const ok = /^(cid:|https?:\/\/|\/)/i.test(src)
  const safeSrc = ok ? src : LOGO_SRC_WEB

  return `
    <img src="${escapeHtml(safeSrc)}"
         alt="GNS logo"
         width="${LOGO_WIDTH}"
         style="display:block;height:auto;border:0;outline:0;-ms-interpolation-mode:bicubic;" />
  `
}

const absoluteUrl = (p: string) => {
  try { return new URL(p, window.location.origin).toString(); }
  catch { return p; }
};

const getBannerHtml = (forEmail: boolean, opts: DesignOptions): string => {
  if (opts.optBannerMode === "none") return "";

  const preset = BANNERS[opts.optBannerId];
  const caption = opts.optBannerCaption || "Program Status";
  const alt = preset?.alt || caption;

  let src = "";
  if (opts.optBannerMode === "url") {
    const webSrc = opts.optBannerUrl?.trim() || preset?.web || "";
    src = forEmail ? absoluteUrl(webSrc) : webSrc;
  } else {
    // "cid" mode — use CID in email, web path in preview
    if (!preset) return "";
    src = forEmail ? `cid:${preset.cid}` : (preset.web || "");
  }

  const img = `
    <img src="${escapeHtml(src)}"
         alt="${escapeHtml(alt)}"
         width="700"
         style="display:block;width:100%;max-width:700px;height:auto;border:0;outline:0;-ms-interpolation-mode:bicubic;" />
  `;

  // Only show the caption in on-page preview, not in the email
  return forEmail
    ? img
    : `${img}
        <div style="font-weight:600;text-align:center;margin:8px 0 4px 0;color:#111;font-size:18px;line-height:1.3;">
          ${escapeHtml(caption)}
        </div>`;
};


  // Only show the caption in the on-page preview, not in the email
  if (forEmail) return img;

  return `${img}
    <div style="font-weight:600;text-align:center;margin:8px 0 4px 0;color:#111;font-size:18px;line-height:1.3;">
      ${escapeHtml(caption)}
    </div>`;
};






  
  // IMPORTANT: omit caption in emails so nothing renders as a line of text above the table
  const captionHtml = forEmail
    ? ""
    : `<div style="font-weight:600;text-align:center;margin:8px 0 4px 0;color:#111;font-size:18px;line-height:1.3;">
         ${escapeHtml(caption)}
       </div>`;

  return `
    <img src="${escapeHtml(src)}"
         alt="${escapeHtml(alt)}"
         width="700"
         style="display:block;width:100%;max-width:700px;height:auto;border:0;outline:0;-ms-interpolation-mode:bicubic;" />
    ${captionHtml}
  `;
};


  const STRIPE_ODD = "#ffffff"
  const STRIPE_EVEN = "#f9f9f9"

  const isWhiteish = (v = "") =>
    /^(?:white|#fff(?:fff)?|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)|rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*1\s*\)|transparent|inherit)$/i.test(
      v.trim(),
    )

  const stripBgDecls = (style: string) => style.replace(/background(?:-color)?:\s*[^;]+;?/gi, "").trim()
  const LEFT_COL = "30%"
  const RIGHT_COL = "70%"
  const stripDecl = (style: string, prop: string) =>
    style.replace(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*[^;]+;?`, "gi"), "").trim()

  // Trim leading/trailing empty nodes inside a cell
  const trimCellWhitespace = (el: HTMLElement) => {
    const TEXT_NODE = 3
    const ELEMENT_NODE = 1

    const isEmptyText = (n: Node) => n.nodeType === TEXT_NODE && !/\S/.test(n.textContent || "")
    const isEmptyBlock = (n: Node) => {
      if (n.nodeType !== ELEMENT_NODE) return false
      const tag = (n as Element).tagName.toUpperCase()
      const isBlock = /^(P|DIV|H1|H2|H3|H4|H5|H6)$/i.test(tag)
      const text = (n as Element).textContent || ""
      const onlyWhitespace = text.replace(/\u00a0|\s/g, "") === ""
      const isBr = tag === "BR"
      return isBr || (isBlock && onlyWhitespace)
    }

    while (el.firstChild && (isEmptyText(el.firstChild) || isEmptyBlock(el.firstChild))) {
      el.removeChild(el.firstChild)
    }
    while (el.lastChild && (isEmptyText(el.lastChild) || isEmptyBlock(el.lastChild))) {
      el.removeChild(el.lastChild)
    }
  }

  // Unwrap <p> inside table cells in-place and trim cell whitespace
  const unwrapPsInCellsInPlace = (root: HTMLElement) => {
    root.querySelectorAll("table td, table th").forEach((cell) => {
      const ps = Array.from(cell.querySelectorAll("p"))
      ps.forEach((p, i) => {
        const frag = document.createDocumentFragment()
        while (p.firstChild) frag.appendChild(p.firstChild)
        if (i !== ps.length - 1) frag.appendChild(document.createElement("br"))
        p.replaceWith(frag)
      })
      trimCellWhitespace(cell as HTMLElement)
    })
  }

  // add near the other color consts
const HEADER_BG = "#f5f5f5";

// replace your current stripeTables with this version
const stripeTables = (html: string): string => {
  if (!html) return html
  const root = document.createElement("div")
  root.innerHTML = html

  const getChildRows = (seg: Element) =>
    Array.from(seg.children).filter((el) => el.tagName.toUpperCase() === "TR") as HTMLTableRowElement[]

  root.querySelectorAll("table").forEach((table) => {
    const segments: Element[] = []
    if (table.tHead) segments.push(table.tHead)
    segments.push(...Array.from(table.tBodies))
    if (table.tFoot) segments.push(table.tFoot)
    if (segments.length === 0) segments.push(table)

    let rowCounter = 0 // count across the whole table (not per segment)

    segments.forEach((seg) => {
      const rows = getChildRows(seg)
      rows.forEach((tr) => {
        const isHeader = rowCounter === 0
        const rowColor = isHeader
          ? HEADER_BG
          : (rowCounter - 1) % 2 === 0
          ? STRIPE_ODD
          : STRIPE_EVEN

        ;(tr as HTMLElement).setAttribute("bgcolor", rowColor)

        Array.from(tr.children).forEach((cell) => {
          if (!/^(TD|TH)$/i.test(cell.tagName)) return
          const el = cell as HTMLElement

          trimCellWhitespace(el)

          // scrub conflicting styles, then apply ours
          let next = stripBgDecls(el.getAttribute("style") || "")
          next = stripDecl(next, "text-align")
          next = stripDecl(next, "vertical-align")

          next += (next ? "; " : "") + `background-color:${rowColor}; text-align:left; vertical-align:top`
          el.setAttribute("style", next)
          el.setAttribute("align", "left")
          el.setAttribute("valign", "top")
        })

        rowCounter++
      })
    })
  })

  return root.innerHTML
}


  const stripInlineBackgrounds = (html: string) => {
    if (!html) return ""
    const root = document.createElement("div")
    root.innerHTML = html
    root.querySelectorAll("*").forEach((el) => {
      const he = el as HTMLElement
      const style = he.getAttribute("style") || ""
      const next = style.replace(/background(?:-color)?\s*:\s*[^;]+;?/gi, "").trim()
      if (next) he.setAttribute("style", next)
      else he.removeAttribute("style")
    })
    root.querySelectorAll("mark").forEach((el) => {
      const span = document.createElement("span")
      span.innerHTML = (el as HTMLElement).innerHTML
      el.replaceWith(span)
    })
    return root.innerHTML
  }

  // WidenTables
const widenTables = (html: string): string => {
  if (!html) return html;
  const root = document.createElement("div");
  root.innerHTML = html;

  root.querySelectorAll("table").forEach((table) => {
    const t = table as HTMLTableElement;

    t.style.width = "100%";
    t.setAttribute("width", "100%");
    t.style.tableLayout = "fixed";
    t.style.removeProperty("white-space"); // strip Confluence artifact

    // Ensure 30/70 colgroup
    let cg = t.querySelector("colgroup");
    if (!cg) {
      cg = document.createElement("colgroup");
      cg.innerHTML = `<col style="width:${LEFT_COL}"><col style="width:${RIGHT_COL}">`;
      t.insertBefore(cg, t.firstChild);
    } else {
      const cols = cg.querySelectorAll("col");
      if (cols.length >= 2) {
        (cols[0] as HTMLElement).style.width = LEFT_COL;
        (cols[1] as HTMLElement).style.width = RIGHT_COL;
      }
    }

    const segments: Element[] = [];
    if (t.tHead) segments.push(t.tHead);
    segments.push(...Array.from(t.tBodies));
    if (t.tFoot) segments.push(t.tFoot);
    if (!segments.length) segments.push(t);

    segments.forEach((seg) => {
      seg.querySelectorAll("tr").forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll("th,td"));
        const hasColspan = cells.some((c) => (c as HTMLElement).hasAttribute("colspan"));
        if (cells.length === 2 && !hasColspan) {
          cells.forEach((cell, idx) => {
            const el = cell as HTMLElement;
            el.style.removeProperty("min-width");
            el.style.removeProperty("white-space");

            const w = idx === 0 ? LEFT_COL : RIGHT_COL;
            el.style.width = w;
            el.setAttribute("width", w);

            el.style.verticalAlign = "top";
            el.setAttribute("valign", "top");
            el.style.textAlign = "left";
            el.setAttribute("align", "left");
          });
        }
      });
    });
  });

  return root.innerHTML;
};


// End WidenTables

  
const normalizeEditorHtml = (html: string) =>
  unwrapParagraphsInTables(stripInlineBackgrounds(sanitizeHtml(html)));
  
function updateFormData(field: keyof FormData, value: string) {
  const needsHtmlNormalize =
    field === "updatesHtml" || field === "milestonesHtml" || field === "execSummary";
  const v = needsHtmlNormalize ? normalizeEditorHtml(value) : value;

  const validation = validateInput(field as string, v);
  setFormData((prev) => ({ ...prev, [field]: validation.sanitized }));
  if ((SAVE_FIELDS as readonly string[]).includes(field as any)) {
    persistField(field as string, validation.sanitized);
  }
  if (validation.warnings.length > 0) {
    setSecurityWarnings((prev) => [...prev, ...validation.warnings]);
  }
}


  const processRichHtml = (html: string): string =>
  widenTables(
    stripeTables(
      stripInlineBackgrounds(
        unwrapParagraphsInTables(        // <— add this
          sanitizeHtml(html)
        )
      )
    )
  )
//
// buildhtml section
//
 const buildHtml = (data: FormData) => {
  const asOf = data.asOf
    ? (() => {
        const [year, month, day] = data.asOf.split("-").map(Number)
        const date = new Date(year, month - 1, day)
        return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
      })()
    : ""

const banner = getBannerHtml(false, designOptions);    // in buildHtml(...)
  
const pill = (val: string) => {
    const v = escapeHtml(val || "").toLowerCase()
    if (v === "red")
      return `<div style="display:inline-block;background-color:#e5534b;color:#fff;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:bold;">Red</div>`
    if (v === "yellow")
      return `<div style="display:inline-block;background-color:#f4c542;color:#111;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:bold;">Yellow</div>`
    return `<div style="display:inline-block;background-color:#4CAF50;color:#fff;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:bold;">Green</div>`
  }

  const processedUpdates = processRichHtml(data.updatesHtml)
  const processedMilestones = processRichHtml(data.milestonesHtml)
  const processedKeyDecisions = processRichHtml(data.keyDecisionsHtml)
  const processedRisks = processRichHtml(data.risksHtml)
  const processedResources = processRichHtml(data.resourcesHtml)


  const evenRowStyle = "background-color:#f9f9f9;padding:20px;border:1px solid #CCCCCC;"
  const oddRowStyle  = "background-color:#ffffff;padding:20px;border:1px solid #CCCCCC;"

  const logoHtml = getLogoImg(false)
  // If the logo renders, the header table has 2 columns; otherwise, it has 1.
  const COLSPAN = logoHtml ? 2 : 1

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Status Report</title>
</head>
<body style="margin:0;padding:0;">
  ${getBannerHtml(false, designOptions)}
  <table style="width:700px;margin:0 auto;border-collapse:collapse;font-family:Arial,sans-serif;">
    <tr><td>
      <table style="width:100%;border-collapse:collapse;margin:0;padding:0;">

        <!-- Title + Summary with right-aligned logo spanning two rows -->
        <tr>
          <td style="background-color:#E8E8E8;padding:20px;text-align:left;border:1px solid #CCCCCC;">
            <h1 style="margin:0;font-size:24px;font-weight:bold;color:#333333;">
              ${data.programTitle || "Your Program/Project Title here"}
            </h1>
          </td>
          ${logoHtml ? `
          <td rowspan="2"
              style="width:${LOGO_WIDTH + 20}px;padding:20px;text-align:center;border:1px solid #CCCCCC;background-color:#FFFFFF;vertical-align:middle;">
            ${logoHtml}
          </td>` : ``}
        </tr>

        <tr>
          <td style="background-color:#ffffff;padding:20px;border:1px solid #CCCCCC;">
            <span style="margin:0;font-size:16px;line-height:1.5;color:#333333;">
              ${nlToParas(data.programSummary) || "Program summary description goes here."}
            </span>
          </td>
        </tr>

        <!-- Status row -->
        <tr>
          <td colspan="${COLSPAN}" style="${evenRowStyle}padding:0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="width:25%;padding:20px;text-align:center;border-left:1px solid #CCCCCC;border-right:1px solid #CCCCCC;border-top:0;border-bottom:0;background-color:#F5F5F5;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Last Status</h3>
                  ${pill(data.lastStatus)}
                </td>
                <td style="width:25%;padding:20px;text-align:center;border-left:1px solid #CCCCCC;border-right:1px solid #CCCCCC;border-top:0;border-bottom:0;background-color:#F5F5F5;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Current Status</h3>
                  ${pill(data.currentStatus)}
                </td>
                <td style="width:25%;padding:20px;text-align:center;border-left:1px solid #CCCCCC;border-right:1px solid #CCCCCC;border-top:0;border-bottom:0;background-color:#F5F5F5;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Trending</h3>
                  ${pill(data.trending)}
                </td>
                <td style="width:25%;padding:20px;text-align:center;border-left:1px solid #CCCCCC;border-right:1px solid #CCCCCC;border-top:0;border-bottom:0;background-color:#F5F5F5;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Date</h3>
                  <p style="margin:0;font-size:14px;color:#333333;">${escapeHtml(asOf)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Team row -->
        <tr>
          <td colspan="${COLSPAN}" style="${oddRowStyle}padding:0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="width:25%;padding:20px;text-align:center;border:1px solid #CCCCCC;background-color:#FFFFFF;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">TPM</h3>
                  <p style="margin:0;font-size:16px;color:#333333;">${escapeHtml(data.tpm) || "Name"}</p>
                </td>
                <td style="width:25%;padding:20px;text-align:center;border:1px solid #CCCCCC;background-color:#FFFFFF;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Engineering DRI</h3>
                  <p style="margin:0;font-size:16px;color:#333333;">${escapeHtml(data.engDri) || "Name"}</p>
                </td>
                <td style="width:25%;padding:20px;text-align:center;border:1px solid #CCCCCC;background-color:#FFFFFF;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Business Sponsor</h3>
                  <p style="margin:0;font-size:16px;color:#333333;">${escapeHtml(data.bizSponsor) || "Name"}</p>
                </td>
                <td style="width:25%;padding:20px;text-align:center;border:1px solid #CCCCCC;background-color:#FFFFFF;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Engineering Sponsor</h3>
                  <p style="margin:0;font-size:16px;color:#333333;">${escapeHtml(data.engSponsor) || "Name"}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${data.execSummary ? `
        <tr>
          <td colspan="${COLSPAN}" style="${oddRowStyle}">
            <h3 style="margin:0 0 10px 0;font-size:18px;font-weight:bold;color:#333333;">Executive Summary</h3>
            <div style="margin:0;font-size:16px;color:#333333;">
              ${unwrapParagraphsInTables(stripInlineBackgrounds(sanitizeHtml(data.execSummary)))}
            </div>
          </td>
        </tr>` : ""}

        ${data.lowlights ? `
        <tr>
          <td colspan="${COLSPAN}" style="${oddRowStyle}">
            <h3 style="margin:0 0 10px 0;font-size:18px;font-weight:bold;color:#333333;">Lowlights</h3>
            <div style="margin:0;font-size:16px;color:#333333;">${linesToList(data.lowlights)}</div>
          </td>
        </tr>` : ""}

      </table>

      ${data.updatesHtml ? `
      <h2 style="font-size:20px;font-weight:bold;color:#333;margin:24px 0 8px 0;">${data.updatesTitle || "Top Accomplishments"}</h2>
      ${data.sectionTitle ? `<h3 style="font-size:18px;font-weight:600;color:#555;margin:8px 0 16px 0;">${data.sectionTitle}</h3>` : ""}
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:16px;">${processedUpdates}</td></tr>
      </table>` : ""}

      ${data.milestonesHtml ? `
      <h2 style="font-size:20px;font-weight:bold;color:#333;margin:24px 0 8px 0;">${data.milestonesTitle || "Upcoming Milestones"}</h2>
      ${data.milestonesSectionTitle ? `<h3 style="font-size:18px;font-weight:600;color:#555;margin:8px 0 16px 0;">${data.milestonesSectionTitle}</h3>` : ""}
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:16px;">${processedMilestones}</td></tr>
      </table>` : ""}


  ${data.keyDecisionsHtml ? `
  <h2 style="font-size:20px;font-weight:bold;color:#333;margin:24px 0 8px 0;">${data.keyDecisionsTitle || "Key Decisions"}</h2>
  ${data.keyDecisionsSectionTitle ? `<h3 style="font-size:18px;font-weight:600;color:#555;margin:8px 0 16px 0;">${data.keyDecisionsSectionTitle}</h3>` : ""}
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:16px;">${processedKeyDecisions}</td></tr>
  </table>` : ""}

  ${data.risksHtml ? `
  <h2 style="font-size:20px;font-weight:bold;color:#333;margin:24px 0 8px 0;">${data.risksTitle || "Risks & Issue Mitigation Plan"}</h2>
  ${data.risksSectionTitle ? `<h3 style="font-size:18px;font-weight:600;color:#555;margin:8px 0 16px 0;">${data.risksSectionTitle}</h3>` : ""}
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:16px;">${processedRisks}</td></tr>
  </table>` : ""}

  ${data.resourcesHtml ? `
  <h2 style="font-size:20px;font-weight:bold;color:#333;margin:24px 0 8px 0;">${data.resourcesTitle || "Additional Resources"}</h2>
  ${data.resourcesSectionTitle ? `<h3 style="font-size:18px;font-weight:600;color:#555;margin:8px 0 16px 0;">${data.resourcesSectionTitle}</h3>` : ""}
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:16px;">${processedResources}</td></tr>
  </table>` : ""}


    </td></tr>
  </table>
</body>
</html>`
}


// buildEmailHtml Email Report email report
//
//
const buildEmailHtml = (data: FormData, opts: DesignOptions) => {
  const asOf = data.asOf
    ? (() => {
        const [y, m, d] = data.asOf.split("-").map(Number);
        return new Date(y, m - 1, d).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      })()
    : "";

  // ---- email-safe style helpers (fixed-width container)
  const containerWidth = 700;
  const outerTableStyle =
    `border-collapse:collapse;width:${containerWidth}px;max-width:${containerWidth}px;` +
    `margin:0 auto;mso-table-lspace:0pt;mso-table-rspace:0pt;`;
  const innerTableStyle =
    "border-collapse:collapse;width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;";

  const baseFont =
    `font-family:${opts.optFont || "Arial, Helvetica, sans-serif"};font-size:16px;line-height:1.45;color:#111;`;

  const cellBase   = `${baseFont}padding:16px;border:1px solid #e5e7eb;`;
  const cellLeft   = `${cellBase}text-align:left;vertical-align:top;`;
  const cellCenter = `${cellBase}text-align:center;vertical-align:middle;`;
  const headCell   = `${cellBase}background-color:#f5f5f5;font-weight:700;text-align:center;vertical-align:middle;`;
  const titleCell  = `${cellBase}background-color:#e5e7eb;font-weight:700;font-size:20px;text-align:left;vertical-align:middle;`;
  const logoCell   = `${cellBase}background-color:#ffffff;text-align:center;vertical-align:middle;`;

  const emailPill = (s: string) => {
    const colors = {
      green:  { bg: "#27c08a", color: "#fff" },
      yellow: { bg: "#f4c542", color: "#111" },
      red:    { bg: "#e5534b", color: "#fff" },
    } as const;
    const c = colors[(s || "").toLowerCase() as keyof typeof colors] || colors.green;
    return `<span style="${baseFont}display:inline-block;padding:6px 12px;border-radius:10px;font-weight:700;background-color:${c.bg};color:${c.color};">${escapeHtml(s)}</span>`;
  };

  const banner = getBannerHtml(true, opts);
  const processedUpdates         = processRichHtml(data.updatesHtml);
  const processedMilestones      = processRichHtml(data.milestonesHtml);
  const processedKeyDecisions    = processRichHtml(data.keyDecisionsHtml);
  const processedRisks           = processRichHtml(data.risksHtml);
  const processedResources       = processRichHtml(data.resourcesHtml);
  const logoEmail = getLogoImg(true);

  return `
<!-- Fixed-width banner -->
<table role="presentation" align="center" width="${containerWidth}" style="${outerTableStyle}" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding:0;">${banner}</td></tr>
</table>

<!-- Fixed-width outer container -->
<table role="presentation" align="center" width="${containerWidth}" style="${outerTableStyle}" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:0;">
      <!-- Title + Summary (+ optional logo) -->
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="${titleCell}" bgcolor="#e5e7eb" align="left" valign="middle">
            ${escapeHtml(data.programTitle || "Your Program/Project Title here")}
          </td>
          ${
            logoEmail
              ? `<td rowspan="2" style="${logoCell}" bgcolor="#ffffff" align="center" valign="middle" width="${LOGO_WIDTH + 40}">
                   ${logoEmail}
                 </td>`
              : ""
          }
        </tr>
        <tr>
          <td style="${cellLeft}" bgcolor="#ffffff" align="left" valign="top">
            ${nlToParas(data.programSummary)}
          </td>
        </tr>
      </table>

      <!-- Status -->
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="${headCell}" bgcolor="#f5f5f5">Last Status</td>
          <td style="${headCell}" bgcolor="#f5f5f5">Current Status</td>
          <td style="${headCell}" bgcolor="#f5f5f5">Trending</td>
          <td style="${headCell}" bgcolor="#f5f5f5">Date</td>
        </tr>
        <tr>
          <td style="${cellCenter}" align="center" valign="middle">${emailPill(data.lastStatus)}</td>
          <td style="${cellCenter}" align="center" valign="middle">${emailPill(data.currentStatus)}</td>
          <td style="${cellCenter}" align="center" valign="middle">${emailPill(data.trending)}</td>
          <td style="${cellCenter}" align="center" valign="middle">${escapeHtml(asOf)}</td>
        </tr>
      </table>

      <!-- Team -->
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="${headCell}" bgcolor="#f5f5f5">TPM</td>
          <td style="${headCell}" bgcolor="#f5f5f5">Engineering DRI</td>
          <td style="${headCell}" bgcolor="#f5f5f5">Business Sponsor</td>
          <td style="${headCell}" bgcolor="#f5f5f5">Engineering Sponsor</td>
        </tr>
        <tr>
          <td style="${cellCenter}" align="center" valign="middle">${escapeHtml(data.tpm)}</td>
          <td style="${cellCenter}" align="center" valign="middle">${escapeHtml(data.engDri)}</td>
          <td style="${cellCenter}" align="center" valign="middle">${escapeHtml(data.bizSponsor)}</td>
          <td style="${cellCenter}" align="center" valign="middle">${escapeHtml(data.engSponsor)}</td>
        </tr>
      </table>

      ${data.execSummary ? `
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="${headCell}" bgcolor="#f5f5f5" align="left">Executive Summary</td></tr>
        <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">
          ${unwrapParagraphsInTables(stripInlineBackgrounds(sanitizeHtml(data.execSummary)))}
        </td></tr>
      </table>` : ""}

      ${data.lowlights ? `
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="${headCell}" bgcolor="#f5f5f5" align="left">Lowlights</td></tr>
        <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">
          ${linesToList(data.lowlights)}
        </td></tr>
      </table>` : ""}

      ${data.updatesHtml ? `
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="${headCell}" bgcolor="#f5f5f5" align="left">
          ${escapeHtml(data.updatesTitle || "Top Accomplishments")}
        </td></tr>
        ${data.sectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">
          <strong>${escapeHtml(data.sectionTitle)}</strong>
        </td></tr>` : ""}
        <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedUpdates}</td></tr>
      </table>` : ""}

      ${data.milestonesHtml ? `
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="${headCell}" bgcolor="#f5f5f5" align="left">
          ${escapeHtml(data.milestonesTitle || "Upcoming Milestones")}
        </td></tr>
        ${data.milestonesSectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">
          <strong>${escapeHtml(data.milestonesSectionTitle)}</strong>
        </td></tr>` : ""}
        <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedMilestones}</td></tr>
      </table>` : ""}

      ${data.keyDecisionsHtml ? `
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="${headCell}" bgcolor="#f5f5f5" align="left">
          ${escapeHtml(data.keyDecisionsTitle || "Key Decisions")}
        </td></tr>
        ${data.keyDecisionsSectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">
          <strong>${escapeHtml(data.keyDecisionsSectionTitle)}</strong>
        </td></tr>` : ""}
        <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedKeyDecisions}</td></tr>
      </table>` : ""}

      ${data.risksHtml ? `
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="${headCell}" bgcolor="#f5f5f5" align="left">
          ${escapeHtml(data.risksTitle || "Risks & Issue Mitigation Plan")}
        </td></tr>
        ${data.risksSectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">
          <strong>${escapeHtml(data.risksSectionTitle)}</strong>
        </td></tr>` : ""}
        <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedRisks}</td></tr>
      </table>` : ""}

      ${data.resourcesHtml ? `
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="${headCell}" bgcolor="#f5f5f5" align="left">
          ${escapeHtml(data.resourcesTitle || "Additional Resources")}
        </td></tr>
        ${data.resourcesSectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">
          <strong>${escapeHtml(data.resourcesSectionTitle)}</strong>
        </td></tr>` : ""}
        <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedResources}</td></tr>
      </table>` : ""}

    </td>
  </tr>
</table>`;
};

  const emailReport = async () => {
  if (execOver) {
    toast({
      title: "Executive Summary is too long",
      description: `Limit is ${EXEC_SUMMARY_PLAIN_LIMIT} plain-text characters.`,
      variant: "destructive",
    });
    return;
  }

  const recipient = formData.emailTo.trim();
  if (!recipient) {
    toast({ title: "Email required", description: "Please enter an email address first.", variant: "destructive" });
    return;
  }

  setIsEmailing(true);
  try {
    const htmlToSend = buildEmailHtml(formData, designOptions);

    const usingCidBanner = designOptions.optBannerMode === "cid" && !!designOptions.optBannerId;

    const res = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: recipient,
        subject: formData.programTitle || "Status Report",
        html: htmlToSend,
        // only send when CID is selected – lets the server attach the right file
        bannerId: usingCidBanner ? designOptions.optBannerId : undefined,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API returned ${res.status}: ${errorText}`);
    }

    toast({ title: "Email Sent", description: `Report sent successfully to ${recipient}` });
  } catch (error: any) {
    toast({ title: "Email Failed", description: error?.message || "Unknown error", variant: "destructive" });
  } finally {
    setIsEmailing(false);
  }
};


 
  

  const generate = async () => {
    if (execOver) {
      toast({
        title: "Executive Summary is too long",
        description: `Limit is ${EXEC_SUMMARY_PLAIN_LIMIT} plain-text characters.`,
        variant: "destructive",
      })
      return ""
    }

    setIsGenerating(true)
    setSecurityWarnings([])
    try {
      const html = buildHtml(formData)
      const formatted = formatHtml(html)
      setGeneratedHtml(formatted)
      return formatted
    } catch (error) {
      console.error("HTML generation error:", error)
      toast({
        title: "Generation failed",
        description: "There was an error generating the HTML. Please check your inputs.",
        variant: "destructive",
      })
      return ""
    } finally {
      setIsGenerating(false)
    }
  }

  const formatHtml = (html: string) =>
    html.replace(/></g, ">\n<").replace(/(<\/?)(\w+)([^>]*>)/g, (m, p1, p2, p3) => {
      if (["table", "tr", "th", "td", "h1", "h2", "p", "ul", "li"].includes(p2)) return `${p1}${p2}${p3}`
      return m
    })

  const copyHtml = async () => {
    if (!generatedHtml) await generate()
    setIsCopying(true)
    try {
      await navigator.clipboard.writeText(generatedHtml)
      toast({ title: "HTML copied to clipboard!", description: "The generated HTML is ready to paste.", duration: 2000 })
    } catch {
      try {
        const textArea = document.createElement("textarea")
        textArea.value = generatedHtml
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        toast({ title: "HTML copied to clipboard!" })
      } catch {
        toast({
          title: "Copy failed",
          description: "Please manually copy the HTML from the text area below.",
          variant: "destructive",
        })
      }
    } finally {
      setIsCopying(false)
    }
  }

  const copyRenderedContent = async () => {
    setIsCopyingRendered(true)
    try {
      const emailHtml = buildEmailHtml(formData, designOptions)
      const tempDiv = document.createElement("div")
      tempDiv.innerHTML = emailHtml
      tempDiv.style.position = "absolute"
      tempDiv.style.left = "-9999px"
      document.body.appendChild(tempDiv)

      const range = document.createRange()
      range.selectNodeContents(tempDiv)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)

      const success = document.execCommand("copy")
      document.body.removeChild(tempDiv)
      selection?.removeAllRanges()

      if (success) {
        setCopyRenderedFeedback("Copied rendered content for email!")
        setTimeout(() => setCopyRenderedFeedback(""), 2000)
      } else {
        throw new Error("Copy command failed")
      }
    } catch (error) {
      console.error("Failed to copy rendered content:", error)
      setCopyRenderedFeedback("Failed to copy content")
      setTimeout(() => setCopyRenderedFeedback(""), 2000)
    } finally {
      setIsCopyingRendered(false)
    }
  }

  const downloadHtml = async () => {
    let htmlToDownload = generatedHtml
    if (!htmlToDownload) htmlToDownload = await generate()
    if (!htmlToDownload) return

    setIsDownloading(true)
    try {
      const blob = new Blob([htmlToDownload], { type: "text/html;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const filename = `status-report-${new Date().toISOString().split("T")[0]}.html`

      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = filename
      a.target = "_blank"
      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        URL.revokeObjectURL(url)
        if (document.body.contains(a)) document.body.removeChild(a)
      }, 1000)
    } catch (error) {
      try {
        const newWindow = window.open()
        if (newWindow) {
          newWindow.document.write(htmlToDownload)
          newWindow.document.close()
          toast({
            title: "HTML opened in new window",
            description: "Use Ctrl+S (Cmd+S on Mac) to save the file from the new window.",
            duration: 4000,
          })
        } else {
          throw new Error("Could not open new window")
        }
      } catch {
        toast({
          title: "Download failed",
          description: "There was an error downloading the file. Please try copying the HTML instead.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const resetSaved = () => {
    try {
      SAVE_FIELDS.forEach((field) => localStorage.removeItem(PERSIST_PREFIX + field))
      toast({ title: "Saved values cleared!" })
      window.location.reload()
    } catch {
      toast({ title: "Reset failed", description: "There was an error clearing saved data.", variant: "destructive" })
    }
  }

  const wrapSelection = (targetField: keyof FormData, tag: string) => {
    const element = document.getElementById(targetField) as HTMLTextAreaElement | HTMLDivElement
    if (!element) return

    if (element.tagName === "TEXTAREA") {
      const textarea = element as HTMLTextAreaElement
      const { selectionStart: s, selectionEnd: e, value: v } = textarea
      if (s == null || e == null || s === e) {
        textarea.setRangeText(`<${tag}></${tag}>`, e, e, "end")
      } else {
        const before = v.slice(0, s)
        const mid = v.slice(s, e)
        const after = v.slice(e)
        textarea.value = `${before}<${tag}>${mid}</${tag}>${after}`
        textarea.selectionStart = s
        textarea.selectionEnd = e + tag.length * 2 + 5
      }
      updateFormData(targetField, textarea.value)
    } else {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return
      const range = selection.getRangeAt(0)
      if (!element.contains(range.commonAncestorContainer)) return

      const commandMap: Record<string, string> = { b: "bold", i: "italic", u: "underline" }
      document.execCommand(commandMap[tag], false)

      setTimeout(() => {
        updateFormData(targetField, (element as HTMLDivElement).innerHTML)
      }, 0)
    }
  }

  // ---------------------
  // Updates handlers
  // ---------------------
  const handleUpdatesInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target && target.innerHTML !== undefined) updateFormData("updatesHtml", target.innerHTML)
  }
  const handleUpdatesBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target && target.innerHTML !== undefined) updateFormData("updatesHtml", target.innerHTML)
  }
  const handleUpdatesPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const rawHtml = e.clipboardData.getData("text/html")
    const rawText = e.clipboardData.getData("text/plain")
    let html = rawHtml || safeInline(rawText).replace(/\n/g, "<br>")
    html = unwrapParagraphsInTables(html)
    html = stripInlineBackgrounds(html)
    html = sanitizeHtml(html)

    document.execCommand("insertHTML", false, html)

    const target = e.currentTarget
    if (target) {
      // normalize live DOM after browser insert (browsers may re-wrap with <p>)
      unwrapPsInCellsInPlace(target)
      updateFormData("updatesHtml", target.innerHTML)
    }
  }

  // ---------------------
  // Milestones handlers
  // ---------------------
  const handleMilestonesInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target && target.innerHTML !== undefined) updateFormData("milestonesHtml", target.innerHTML)
  }
  const handleMilestonesBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target && target.innerHTML !== undefined) updateFormData("milestonesHtml", target.innerHTML)
  }
  const handleMilestonesPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const rawHtml = e.clipboardData.getData("text/html")
    const rawText = e.clipboardData.getData("text/plain")

    let html = rawHtml || safeInline(rawText).replace(/\n/g, "<br>")
    html = unwrapParagraphsInTables(html)
    html = stripInlineBackgrounds(html)
    html = sanitizeHtml(html)

    document.execCommand("insertHTML", false, html)
    const target = e.currentTarget
    if (target) {
      unwrapPsInCellsInPlace(target)
      updateFormData("milestonesHtml", target.innerHTML)
    }
  }
  // --- Key Decisions handlers ---
  const handleKeyDecisionsInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target && target.innerHTML !== undefined) updateFormData("keyDecisionsHtml", target.innerHTML)
  }
  const handleKeyDecisionsBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target && target.innerHTML !== undefined) updateFormData("keyDecisionsHtml", target.innerHTML)
  }
  const handleKeyDecisionsPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const rawHtml = e.clipboardData.getData("text/html")
    const rawText = e.clipboardData.getData("text/plain")
    let html = rawHtml || safeInline(rawText).replace(/\n/g, "<br>")
    html = unwrapParagraphsInTables(html)
    html = stripInlineBackgrounds(html)
    html = sanitizeHtml(html)
    document.execCommand("insertHTML", false, html)
    const target = e.currentTarget
    if (target) {
      unwrapPsInCellsInPlace(target)
      updateFormData("keyDecisionsHtml", target.innerHTML)
    }
  }

  // --- Risks handlers ---
  const handleRisksInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target && target.innerHTML !== undefined) updateFormData("risksHtml", target.innerHTML)
  }
  const handleRisksBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target && target.innerHTML !== undefined) updateFormData("risksHtml", target.innerHTML)
  }
  const handleRisksPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const rawHtml = e.clipboardData.getData("text/html")
    const rawText = e.clipboardData.getData("text/plain")
    let html = rawHtml || safeInline(rawText).replace(/\n/g, "<br>")
    html = unwrapParagraphsInTables(html)
    html = stripInlineBackgrounds(html)
    html = sanitizeHtml(html)
    document.execCommand("insertHTML", false, html)
    const target = e.currentTarget
    if (target) {
      unwrapPsInCellsInPlace(target)
      updateFormData("risksHtml", target.innerHTML)
    }
  }

  // --- Resources handlers ---
  const handleResourcesInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target && target.innerHTML !== undefined) updateFormData("resourcesHtml", target.innerHTML)
  }
  const handleResourcesBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target && target.innerHTML !== undefined) updateFormData("resourcesHtml", target.innerHTML)
  }
  const handleResourcesPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const rawHtml = e.clipboardData.getData("text/html")
    const rawText = e.clipboardData.getData("text/plain")
    let html = rawHtml || safeInline(rawText).replace(/\n/g, "<br>")
    html = unwrapParagraphsInTables(html)
    html = stripInlineBackgrounds(html)
    html = sanitizeHtml(html)
    document.execCommand("insertHTML", false, html)
    const target = e.currentTarget
    if (target) {
      unwrapPsInCellsInPlace(target)
      updateFormData("resourcesHtml", target.innerHTML)
    }
  }

  // ---------------------
  // Executive Summary handlers
  // ---------------------
  const handleExecSummaryInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget?.innerHTML ?? ""
    updateFormData("execSummary", html)
    const len = getPlainTextLength(html)
    setExecLen(len)
    setExecOver(len > EXEC_SUMMARY_PLAIN_LIMIT)
  }
  const handleExecSummaryBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const html = e.currentTarget?.innerHTML ?? ""
    updateFormData("execSummary", html)
    const len = getPlainTextLength(html)
    setExecLen(len)
    setExecOver(len > EXEC_SUMMARY_PLAIN_LIMIT)
  }
  const handleExecSummaryPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const rawHtml = e.clipboardData.getData("text/html")
    const rawText = e.clipboardData.getData("text/plain")
    let html = rawHtml || safeInline(rawText).replace(/\n/g, "<br>")

    html = unwrapParagraphsInTables(html)
    html = stripInlineBackgrounds(html)
    html = sanitizeHtml(html)

    document.execCommand("insertHTML", false, html)

    const target = e.currentTarget
    if (target) {
      unwrapPsInCellsInPlace(target)
      updateFormData("execSummary", target.innerHTML)
      const len = getPlainTextLength(target.innerHTML)
      setExecLen(len)
      setExecOver(len > EXEC_SUMMARY_PLAIN_LIMIT)
    }
  }

  // Sync editors with state
  useEffect(() => {
    if (updatesRef.current && updatesRef.current.innerHTML !== formData.updatesHtml) {
      updatesRef.current.innerHTML = formData.updatesHtml
    }
  }, [formData.updatesHtml])

  useEffect(() => {
    if (milestonesRef.current && milestonesRef.current.innerHTML !== formData.milestonesHtml) {
      milestonesRef.current.innerHTML = formData.milestonesHtml
    }
  }, [formData.milestonesHtml])

  useEffect(() => {
    if (execSummaryRef.current) {
      const html = execSummaryRef.current.innerHTML || ""
      const len = getPlainTextLength(html)
      setExecLen(len)
      setExecOver(len > EXEC_SUMMARY_PLAIN_LIMIT)
    }
  }, [])

  useEffect(() => {
    if (execSummaryRef.current && execSummaryRef.current.innerHTML !== formData.execSummary) {
      execSummaryRef.current.innerHTML = formData.execSummary
    }
  }, [formData.execSummary])

  useEffect(() => {
    if (keyDecisionsRef.current && keyDecisionsRef.current.innerHTML !== formData.keyDecisionsHtml) {
      keyDecisionsRef.current.innerHTML = formData.keyDecisionsHtml
    }
  }, [formData.keyDecisionsHtml])

  useEffect(() => {
    if (risksRef.current && risksRef.current.innerHTML !== formData.risksHtml) {
      risksRef.current.innerHTML = formData.risksHtml
    }
  }, [formData.risksHtml])

  useEffect(() => {
    if (resourcesRef.current && resourcesRef.current.innerHTML !== formData.resourcesHtml) {
      resourcesRef.current.innerHTML = formData.resourcesHtml
    }
  }, [formData.resourcesHtml])



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Status Report Generator</h1>
          <p className="text-gray-600">Create professional status reports with customizable design</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Auto-save enabled</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Content sanitized</span>
            </div>
          </div>
        </div>

        {/* Security Warnings */}
        {securityWarnings.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Security Notice</h3>
                <ul className="mt-1 text-sm text-yellow-700">
                  {securityWarnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
 {/* Design Options */}
            <Card>
              <CardHeader><CardTitle>Design Options</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Banner controls */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <Label className="text-sm font-medium">Banner mode</Label>
    <Select
      value={designOptions.optBannerMode}
      onValueChange={(v) => updateDesignOptions("optBannerMode", v)}
    >
      <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="cid">Embed inline (CID)</SelectItem>
        <SelectItem value="url">Load from URL</SelectItem>
        <SelectItem value="none">No banner</SelectItem>
      </SelectContent>
    </Select>
  </div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* existing Logo controls ... */}

  {/* Report Type */}
  <div>
    <Label className="text-sm font-medium">Report Type</Label>
    <Select
      value={designOptions.optReportKind}
      onValueChange={(v) => updateDesignOptions("optReportKind", v)}
    >
      <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="weekly">Weekly</SelectItem>
        <SelectItem value="monthly">Monthly</SelectItem>
        <SelectItem value="quarterly">Quarterly</SelectItem>
        <SelectItem value="program">Program</SelectItem>
        <SelectItem value="project">Project</SelectItem>
        <SelectItem value="ops">Ops</SelectItem>
        <SelectItem value="exec">Executive</SelectItem>
        <SelectItem value="incident">Incident</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
<Button
  variant="outline"
  size="sm"
  onClick={() => applyProfile(designOptions.optBannerId, designOptions.optReportKind, "overwrite")}
  className="mt-2"
>
  Apply profile defaults (overwrite)
</Button>


  
  {designOptions.optBannerMode === "cid" && (
    <div>
      <Label className="text-sm font-medium">Banner preset</Label>
      <Select
        value={designOptions.optBannerId}
        onValueChange={(v) => updateDesignOptions("optBannerId", v)}
      >
        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
        <SelectContent>
          {/* keep this list in sync with BANNERS keys */}
          <SelectItem value="gns">GNS</SelectItem>
          <SelectItem value="azure">Azure</SelectItem>
          <SelectItem value="cie">CIE</SelectItem>
          <SelectItem value="netmig">One Big Network Migration</SelectItem>
          <SelectItem value="azlens">Azure Lens</SelectItem>
          <SelectItem value="ipv6">IPv6 Network</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )}

  {designOptions.optBannerMode === "url" && (
    <div>
      <Label className="text-sm font-medium">Banner URL (absolute)</Label>
      <Input
        placeholder="https://cdn.example.com/banners/custom.png"
        value={designOptions.optBannerUrl}
        onChange={(e) => updateDesignOptions("optBannerUrl", e.target.value)}
        className="bg-white"
      />
    </div>
  )}

  <div className="md:col-span-2">
    <Label className="text-sm font-medium">Banner caption (optional)</Label>
    <Input
      placeholder="Program Status"
      value={designOptions.optBannerCaption}
      onChange={(e) => updateDesignOptions("optBannerCaption", e.target.value)}
      className="bg-white"
    />
  </div>
</div>

                <div>
                  <Label htmlFor="optFont" className="text-sm font-medium">Font Family</Label>
                  <Select value={designOptions.optFont} onValueChange={(v) => updateDesignOptions("optFont", v)}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <Label className="text-sm font-medium">Logo mode</Label>
    <Select
      value={designOptions.optLogoMode}
      onValueChange={(v) => updateDesignOptions("optLogoMode", v)}
    >
      <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="cid">Embed inline (CID)</SelectItem>
        <SelectItem value="url">Load from URL</SelectItem>
        <SelectItem value="none">Hide logo</SelectItem>
      </SelectContent>
    </Select>
  </div>


{/* Banner & Profile */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <Label className="text-sm font-medium">Banner mode</Label>
    <Select
      value={designOptions.optBannerMode}
      onValueChange={(v) => updateDesignOptions("optBannerMode", v)}
    >
      <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="cid">Embed inline (CID)</SelectItem>
        <SelectItem value="url">Load from URL</SelectItem>
        <SelectItem value="none">No banner</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {designOptions.optBannerMode === "url" && (
    <div>
      <Label className="text-sm font-medium">Banner URL</Label>
      <Input
        placeholder="https://…/banner.png"
        value={designOptions.optBannerUrl}
        onChange={(e) => updateDesignOptions("optBannerUrl", e.target.value)}
        className="bg-white"
      />
    </div>
  )}

  {designOptions.optBannerMode !== "none" && (
    <>
      <div>
        <Label className="text-sm font-medium">Preset banner (profile)</Label>
        <Select
  value={designOptions.optBannerId}
  onValueChange={(v) => {
    updateDesignOptions("optBannerId", v);
    applyProfile(v as BannerKey, designOptions.optReportKind, "fill"); // optional
  }}
>

          <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="gns">GNS</SelectItem>
            <SelectItem value="azure">Azure</SelectItem>
            <SelectItem value="cie">CIE</SelectItem>
            <SelectItem value="netmig">Network Migration</SelectItem>
            <SelectItem value="azlens">Azure Lens</SelectItem>
            <SelectItem value="ipv6">IPv6</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 mt-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
          onClick={() =>
            applyProfile(
              designOptions.optBannerId as BannerKey,
              designOptions.optReportKind,
              "overwrite"
  )
}

            Apply defaults (overwrite)
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Banner caption</Label>
        <Input
          placeholder="Program Status"
          value={designOptions.optBannerCaption}
          onChange={(e) => updateDesignOptions("optBannerCaption", e.target.value)}
          className="bg-white"
        />
      </div>
    </>
  )}
</div>


  

  {designOptions.optLogoMode === "url" && (
    <div>
      <Label className="text-sm font-medium">Logo URL (http/https)</Label>
      <Input
        placeholder="https://example.com/path/logo.png"
        value={designOptions.optLogoUrl}
        onChange={(e) => updateDesignOptions("optLogoUrl", e.target.value)}
        className="bg-white"
      />
    </div>
  )}
</div>

                <div>
                  <Label htmlFor="optAccent" className="text-sm font-medium">Accent Color</Label>
                  <Input id="optAccent" type="color" value={designOptions.optAccent} onChange={(e) => updateDesignOptions("optAccent", e.target.value)} className="bg-white h-10" />
                </div>

                <div>
                  <Label htmlFor="optDensity" className="text-sm font-medium">Density</Label>
                  <Select value={designOptions.optDensity} onValueChange={(v) => updateDesignOptions("optDensity", v)}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="optBorders" className="text-sm font-medium">Table Style</Label>
                  <Select value={designOptions.optBorders} onValueChange={(v) => updateDesignOptions("optBorders", v)}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lines">Lines</SelectItem>
                      <SelectItem value="shaded">Shaded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="optCustomCss" className="text-sm font-medium">Custom CSS</Label>
                  <Textarea
                    id="optCustomCss"
                    placeholder="Add custom CSS styles…"
                    value={designOptions.optCustomCss}
                    onChange={(e) => updateDesignOptions("optCustomCss", e.target.value)}
                    rows={3}
                    maxLength={SECURITY_CONFIG.MAX_CSS_LENGTH}
                    className="resize-none bg-white font-mono text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={generate} disabled={isGenerating || execOver} className="flex-1 min-w-[120px]">
                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                    Generate
                  </Button>
                  <Button onClick={copyHtml} disabled={isCopying} variant="outline" className="flex-1 min-w-[120px] bg-transparent">
                    {isCopying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
                    Copy HTML
                  </Button>
                  <Button onClick={copyRenderedContent} disabled={copyRenderedLoading} variant="outline" className="flex-1 min-w-[120px] bg-transparent">
                    {copyRenderedLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                    {copyRenderedFeedback || "Copy for Email"}
                  </Button>
                  <Button onClick={downloadHtml} disabled={isDownloading} variant="outline" className="flex-1 min-w-[120px] bg-transparent">
                    {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Download
                  </Button>
                  <Button onClick={emailReport} disabled={isEmailing || execOver} variant="default" className="flex-1 min-w-[120px]">
                    {isEmailing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                    {isEmailing ? "Sending..." : "Email me this report"}
                  </Button>
                  <Button onClick={resetSaved} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Preview</CardTitle>
                  <div className="flex gap-2">
                    <Button variant={previewMode === "preview" ? "default" : "outline"} size="sm" onClick={() => setPreviewMode("preview")}>
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button variant={previewMode === "code" ? "default" : "outline"} size="sm" onClick={() => setPreviewMode("code")}>
                      <Code className="w-4 h-4 mr-1" />
                      Code
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {previewMode === "preview" ? (
                  <div
                    className="border rounded-lg p-4 bg-white min-h-[400px] overflow-auto"
                    dangerouslySetInnerHTML={{
                      __html: generatedHtml || "<p class='text-gray-500'>Click Generate to see preview</p>",
                    }}
                  />
                ) : (
                  <Textarea
                    value={generatedHtml || "// Click Generate to see HTML code"}
                    readOnly
                    className="font-mono text-xs min-h-[400px] bg-gray-50"
                  />
                )}
              </CardContent>
            </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Program Title */}
                <div>
                  <Label htmlFor="programTitle" className="text-sm font-medium">Program Title</Label>
                  <Input
                    id="programTitle"
                    placeholder="Your Program/Project Title here"
                    value={formData.programTitle}
                    onChange={(e) => updateFormData("programTitle", e.target.value)}
                    maxLength={SECURITY_CONFIG.MAX_FIELD_LENGTH}
                    className="bg-white"
                  />
                </div>

                {/* Program Summary */}
                <div>
                  <Label htmlFor="programSummary" className="text-sm font-medium">Program Summary</Label>
                  <Textarea
                    id="programSummary"
                    placeholder="Brief description of the program or project…"
                    value={formData.programSummary}
                    onChange={(e) => updateFormData("programSummary", e.target.value)}
                    rows={3}
                    maxLength={SECURITY_CONFIG.MAX_FIELD_LENGTH}
                    className="resize-none bg-white"
                  />
                </div>

                {/* Status Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lastStatus" className="text-sm font-medium">Last Status</Label>
                    <Select value={formData.lastStatus} onValueChange={(v) => updateFormData("lastStatus", v)}>
                      <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="currentStatus" className="text-sm font-medium">Current Status</Label>
                    <Select value={formData.currentStatus} onValueChange={(v) => updateFormData("currentStatus", v)}>
                      <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="trending" className="text-sm font-medium">Trending</Label>
                    <Select value={formData.trending} onValueChange={(v) => updateFormData("trending", v)}>
                      <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="asOf" className="text-sm font-medium">As of Date</Label>
                    <Input id="asOf" type="date" value={formData.asOf} onChange={(e) => updateFormData("asOf", e.target.value)} className="bg-white" />
                  </div>
                </div>

                {/* Team Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tpm" className="text-sm font-medium">TPM</Label>
                    <Input id="tpm" placeholder="Technical Program Manager" value={formData.tpm} onChange={(e) => updateFormData("tpm", e.target.value)} maxLength={SECURITY_CONFIG.MAX_FIELD_LENGTH} className="bg-white" />
                  </div>

                  <div>
                    <Label htmlFor="engDri" className="text-sm font-medium">Engineering DRI</Label>
                    <Input id="engDri" placeholder="Engineering Lead" value={formData.engDri} onChange={(e) => updateFormData("engDri", e.target.value)} maxLength={SECURITY_CONFIG.MAX_FIELD_LENGTH} className="bg-white" />
                  </div>

                  <div>
                    <Label htmlFor="bizSponsor" className="text-sm font-medium">Business Sponsor</Label>
                    <Input id="bizSponsor" placeholder="Business Stakeholder" value={formData.bizSponsor} onChange={(e) => updateFormData("bizSponsor", e.target.value)} maxLength={SECURITY_CONFIG.MAX_FIELD_LENGTH} className="bg-white" />
                  </div>

                  <div>
                    <Label htmlFor="engSponsor" className="text-sm font-medium">Engineering Sponsor</Label>
                    <Input id="engSponsor" placeholder="Engineering Stakeholder" value={formData.engSponsor} onChange={(e) => updateFormData("engSponsor", e.target.value)} maxLength={SECURITY_CONFIG.MAX_FIELD_LENGTH} className="bg-white" />
                  </div>

                  <div>
                    <Label htmlFor="emailTo" className="text-sm font-medium">Email To</Label>
                    <Input id="emailTo" type="email" placeholder="recipient@example.com" value={formData.emailTo} onChange={(e) => updateFormData("emailTo", e.target.value)} maxLength={SECURITY_CONFIG.MAX_FIELD_LENGTH} className="bg-white" />
                  </div>
                </div>

                {/* Executive Summary */}
                <div>
                  <Label htmlFor="execSummary" className="text-sm font-medium">
                    Executive Summary
                    <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 12, color: execOver ? "#b91c1c" : "#6b7280" }}>
                      ({execLen}/{EXEC_SUMMARY_PLAIN_LIMIT})
                    </span>
                  </Label>
                  <div className="flex gap-1 mt-1.5 mb-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("execSummary", "b")} className="h-8 px-2"><Bold className="w-3 h-3" /></Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("execSummary", "i")} className="h-8 px-2"><Italic className="w-3 h-3" /></Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("execSummary", "u")} className="h-8 px-2"><Underline className="w-3 h-3" /></Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateFormData("execSummary", "")
                        if (execSummaryRef.current) execSummaryRef.current.innerHTML = ""
                        setExecLen(0)
                        setExecOver(false)
                      }}
                      className="h-8 px-3 ml-2"
                    >
                      Clear Field
                    </Button>
                  </div>
                  <div
                    ref={execSummaryRef}
                    id="execSummary"
                    contentEditable
                    className="min-h-[80px] p-3 border rounded-md bg-white text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:outline-none"
                    style={{ lineHeight: "1.5", overflowX: "auto", maxWidth: "100%", borderColor: execOver ? "#ef4444" : undefined }}
                    onInput={handleExecSummaryInput}
                    onBlur={handleExecSummaryBlur}
                    onPaste={handleExecSummaryPaste}
                    data-placeholder="Key outcomes and results…"
                    suppressContentEditableWarning
                  />
                </div>

                {/* Lowlights */}
                <div>
                  <Label htmlFor="lowlights" className="text-sm font-medium">Lowlights (one per line)</Label>
                  <Textarea
                    id="lowlights"
                    placeholder="Example: OBN paused for 3 weeks"
                    value={formData.lowlights}
                    onChange={(e) => updateFormData("lowlights", e.target.value)}
                    rows={3}
                    maxLength={SECURITY_CONFIG.MAX_FIELD_LENGTH}
                    className="resize-none bg-white"
                  />
                </div>

                {/* Updates Section */}
                <div>
                  <div className="mb-3">
                    <Input
                      type="text"
                      value={formData.updatesTitle}
                      onChange={(e) => updateFormData("updatesTitle", e.target.value)}
                      placeholder="Top Accomplishments [Title (H2)]"
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div className="mt-2 mb-3">
                    <Label className="text-xs text-gray-600">Section Title (H3, optional)</Label>
                    <Input
                      type="text"
                      value={formData.sectionTitle}
                      onChange={(e) => updateFormData("sectionTitle", e.target.value)}
                      placeholder="Security, Automation, Project Track Name, etc."
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div className="flex gap-1 mb-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("updatesHtml", "b")} className="h-8 px-2"><Bold className="w-3 h-3" /></Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("updatesHtml", "i")} className="h-8 px-2"><Italic className="w-3 h-3" /></Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("updatesHtml", "u")} className="h-8 px-2"><Underline className="w-3 h-3" /></Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateFormData("updatesHtml", "")
                        if (updatesRef.current) updatesRef.current.innerHTML = ""
                      }}
                      className="h-8 px-3 ml-2"
                    >
                      Clear Field
                    </Button>
                  </div>
                  <div
                    ref={updatesRef}
                    id="updatesHtml"
                    contentEditable
                    className="min-h-[120px] p-3 border border-input rounded-md bg-white text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:outline-none"
                    style={{ lineHeight: "1.5", overflowX: "auto", maxWidth: "100%" }}
                    onInput={handleUpdatesInput}
                    onBlur={handleUpdatesBlur}
                    onPaste={handleUpdatesPaste}
                    data-placeholder="Paste tables, add formatted text, or type updates here..."
                    suppressContentEditableWarning
                  />
                  <style jsx>{`
                    #updatesHtml table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 14px; }
                    #updatesHtml table th, #updatesHtml table td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; vertical-align: top; }
                    #updatesHtml table thead tr { background-color: #f5f5f5; font-weight: bold; }
                    #updatesHtml table tr > td:first-child, #updatesHtml table tr > th:first-child { width: 30%; }
                    #updatesHtml table tr > td:nth-child(2), #updatesHtml table tr > th:nth-child(2) { width: 70%; }
                    #updatesHtml table > tr:nth-of-type(odd) > td, #updatesHtml table > tbody > tr:nth-of-type(odd) > td { background-color: #ffffff; }
                    #updatesHtml table > tr:nth-of-type(even) > td, #updatesHtml table > tbody > tr:nth-of-type(even) > td { background-color: #f9f9f9; }
                    #updatesHtml p { margin: 0; }
                    #milestonesHtml p { margin: 0; }
                    /* First row should always be gray in the editor */
                    #updatesHtml table thead tr,
#updatesHtml table tr:first-of-type > th,
#updatesHtml table tr:first-of-type > td {
  background-color: #f5f5f5 !important;
}



#milestonesHtml table thead tr,
#milestonesHtml table tr:first-of-type > th,
#milestonesHtml table tr:first-of-type > td {
  background-color: #f5f5f5 !important;
}

                  `}</style>
                </div>
              </CardContent>
            </Card>

            {/* Milestones Section */}
            <Card>
              <CardHeader><CardTitle>Milestones</CardTitle></CardHeader>
              <CardContent>
                <div className="mb-3">
                  <Input
                    type="text"
                    value={formData.milestonesTitle}
                    onChange={(e) => updateFormData("milestonesTitle", e.target.value)}
                    placeholder="Upcoming Milestones [Title (H2)]"
                    className="mt-1 bg-white"
                  />
                </div>
                <div className="mt-2 mb-3">
                  <Label className="text-xs text-gray-600">Section Title (H3, optional)</Label>
                  <Input
                    type="text"
                    value={formData.milestonesSectionTitle}
                    onChange={(e) => updateFormData("milestonesSectionTitle", e.target.value)}
                    placeholder="Q4 targets, Launch plan, etc."
                    className="mt-1 bg-white"
                  />
                </div>
                <div className="flex gap-1 mb-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("milestonesHtml", "b")} className="h-8 px-2"><Bold className="w-3 h-3" /></Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("milestonesHtml", "i")} className="h-8 px-2"><Italic className="w-3 h-3" /></Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("milestonesHtml", "u")} className="h-8 px-2"><Underline className="w-3 h-3" /></Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 ml-2"
                    onClick={() => {
                      updateFormData("milestonesHtml", "")
                      if (milestonesRef.current) milestonesRef.current.innerHTML = ""
                    }}
                  >
                    Clear Field
                  </Button>
                </div>
                <div
                  ref={milestonesRef}
                  id="milestonesHtml"
                  contentEditable
                  className="min-h-[120px] p-3 border border-input rounded-md bg-white text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:outline-none"
                  style={{ lineHeight: "1.5", overflowX: "auto", maxWidth: "100%" }}
                  onInput={handleMilestonesInput}
                  onBlur={handleMilestonesBlur}
                  onPaste={handleMilestonesPaste}
                  data-placeholder="Paste tables, add formatted text, or type milestones here..."
                  suppressContentEditableWarning
                />
                <style jsx>{`
                  #milestonesHtml table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 14px; }
                  #milestonesHtml table th, #milestonesHtml table td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; vertical-align: top; }
                  #milestonesHtml table thead tr { background-color: #f5f5f5; font-weight: bold; }
                  #milestonesHtml table tr > td:first-child, #milestonesHtml table tr > th:first-child { width: 30%; }
                  #milestonesHtml table tr > td:nth-child(2), #milestonesHtml table tr > th:nth-child(2) { width: 70%; }
                  #milestonesHtml table > tr:nth-of-type(odd) > td, #milestonesHtml table > tbody > tr:nth-of-type(odd) > td { background-color: #ffffff; }
                  #milestonesHtml table > tr:nth-of-type(even) > td, #milestonesHtml table > tbody > tr:nth-of-type(even) > td { background-color: #f9f9f9; }
                  /* First row should always be gray in the editor */
                  #updatesHtml table thead tr,
                  #updatesHtml table tr:first-of-type > th,
                  #updatesHtml table tr:first-of-type > td {
                  background-color: #f5f5f5 !important;
                  }

                  #milestonesHtml table thead tr,
                  #milestonesHtml table tr:first-of-type > th,
#milestonesHtml table tr:first-of-type > td {
  background-color: #f5f5f5 !important;
}

                `}</style>
              </CardContent>
            </Card>
<Card>
  <CardHeader><CardTitle>Key Decisions</CardTitle></CardHeader>
  <CardContent>
    <div className="mb-3">
      <Input
        type="text"
        value={formData.keyDecisionsTitle}
        onChange={(e) => updateFormData("keyDecisionsTitle", e.target.value)}
        placeholder="Key Decisions [Title (H2)]"
        className="mt-1 bg-white"
      />
    </div>
    <div className="mt-2 mb-3">
      <Label className="text-xs text-gray-600">Section Title (H3, optional)</Label>
      <Input
        type="text"
        value={formData.keyDecisionsSectionTitle}
        onChange={(e) => updateFormData("keyDecisionsSectionTitle", e.target.value)}
        placeholder="Decision context, scope, etc."
        className="mt-1 bg-white"
      />
    </div>
    <div className="flex gap-1 mb-2">
      <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("keyDecisionsHtml", "b")} className="h-8 px-2"><Bold className="w-3 h-3" /></Button>
      <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("keyDecisionsHtml", "i")} className="h-8 px-2"><Italic className="w-3 h-3" /></Button>
      <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("keyDecisionsHtml", "u")} className="h-8 px-2"><Underline className="w-3 h-3" /></Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-3 ml-2"
        onClick={() => {
          updateFormData("keyDecisionsHtml", "")
          if (keyDecisionsRef.current) keyDecisionsRef.current.innerHTML = ""
        }}
      >
        Clear Field
      </Button>
    </div>
    <div
      ref={keyDecisionsRef}
      id="keyDecisionsHtml"
      contentEditable
      className="min-h-[120px] p-3 border border-input rounded-md bg-white text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:outline-none"
      style={{ lineHeight: "1.5", overflowX: "auto", maxWidth: "100%" }}
      onInput={handleKeyDecisionsInput}
      onBlur={handleKeyDecisionsBlur}
      onPaste={handleKeyDecisionsPaste}
      data-placeholder="Paste tables, add formatted text, or type key decisions here..."
      suppressContentEditableWarning
    />
  </CardContent>
</Card>

{/* Risks & Issue Mitigation Plan */}

<Card>
  <CardHeader>
    <CardTitle>Risks &amp; Issue Mitigation Plan</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="mb-3">
      <Input
        type="text"
        value={formData.risksTitle}
        onChange={(e) => updateFormData("risksTitle", e.target.value)}
        placeholder="Risks & Issue Mitigation Plan [Title (H2)]"
        className="mt-1 bg-white"
      />
    </div>

    <div className="mt-2 mb-3">
      <Label className="text-xs text-gray-600">Section Title (H3, optional)</Label>
      <Input
        type="text"
        value={formData.risksSectionTitle}
        onChange={(e) => updateFormData("risksSectionTitle", e.target.value)}
        placeholder="Mitigation owners, timelines, status, etc."
        className="mt-1 bg-white"
      />
    </div>

    <div className="flex gap-1 mb-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => wrapSelection("risksHtml", "b")}
        className="h-8 px-2"
      >
        <Bold className="w-3 h-3" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => wrapSelection("risksHtml", "i")}
        className="h-8 px-2"
      >
        <Italic className="w-3 h-3" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => wrapSelection("risksHtml", "u")}
        className="h-8 px-2"
      >
        <Underline className="w-3 h-3" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-3 ml-2"
        onClick={() => {
          updateFormData("risksHtml", "")
          if (risksRef.current) risksRef.current.innerHTML = ""
        }}
      >
        Clear Field
      </Button>
    </div>

    <div
      ref={risksRef}
      id="risksHtml"
      contentEditable
      className="min-h-[120px] p-3 border border-input rounded-md bg-white text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:outline-none"
      style={{ lineHeight: "1.5", overflowX: "auto", maxWidth: "100%" }}
      onInput={handleRisksInput}
      onBlur={handleRisksBlur}
      onPaste={handleRisksPaste}
      data-placeholder="Paste tables, add formatted text, or type risks & mitigations here..."
      suppressContentEditableWarning
    />

    <style jsx>{`
      #risksHtml table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 14px; }
      #risksHtml table th, #risksHtml table td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; vertical-align: top; }
      #risksHtml table thead tr { background-color: #f5f5f5; font-weight: bold; }
      #risksHtml table tr > td:first-child, #risksHtml table tr > th:first-child { width: 30%; }
      #risksHtml table tr > td:nth-child(2), #risksHtml table tr > th:nth-child(2) { width: 70%; }
      #risksHtml table > tr:nth-of-type(odd) > td, #risksHtml table > tbody > tr:nth-of-type(odd) > td { background-color: #ffffff; }
      #risksHtml table > tr:nth-of-type(even) > td, #risksHtml table > tbody > tr:nth-of-type(even) > td { background-color: #f9f9f9; }

      /* Ensure first row is always gray in-editor */
      #risksHtml table thead tr,
      #risksHtml table tr:first-of-type > th,
      #risksHtml table tr:first-of-type > td {
        background-color: #f5f5f5 !important;
      }

      #risksHtml p { margin: 0; }
    `}</style>
  </CardContent>
</Card>

<Card>
  <CardHeader>
    <CardTitle>Additional Resources</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="mb-3">
      <Input
        type="text"
        value={formData.resourcesTitle}
        onChange={(e) => updateFormData("resourcesTitle", e.target.value)}
        placeholder="Additional Resources [Title (H2)]"
        className="mt-1 bg-white"
      />
    </div>

    <div className="mt-2 mb-3">
      <Label className="text-xs text-gray-600">Section Title (H3, optional)</Label>
      <Input
        type="text"
        value={formData.resourcesSectionTitle}
        onChange={(e) => updateFormData("resourcesSectionTitle", e.target.value)}
        placeholder="Links, docs, references, owners, etc."
        className="mt-1 bg-white"
      />
    </div>

    <div className="flex gap-1 mb-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => wrapSelection("resourcesHtml", "b")}
        className="h-8 px-2"
      >
        <Bold className="w-3 h-3" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => wrapSelection("resourcesHtml", "i")}
        className="h-8 px-2"
      >
        <Italic className="w-3 h-3" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => wrapSelection("resourcesHtml", "u")}
        className="h-8 px-2"
      >
        <Underline className="w-3 h-3" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-3 ml-2"
        onClick={() => {
          updateFormData("resourcesHtml", "")
          if (resourcesRef.current) resourcesRef.current.innerHTML = ""
        }}
      >
        Clear Field
      </Button>
    </div>

    <div
      ref={resourcesRef}
      id="resourcesHtml"
      contentEditable
      className="min-h-[120px] p-3 border border-input rounded-md bg-white text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:outline-none"
      style={{ lineHeight: "1.5", overflowX: "auto", maxWidth: "100%" }}
      onInput={handleResourcesInput}
      onBlur={handleResourcesBlur}
      onPaste={handleResourcesPaste}
      data-placeholder="Paste links, tables, or add formatted notes here…"
      suppressContentEditableWarning
    />

    <style jsx>{`
      #resourcesHtml table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 14px; }
      #resourcesHtml table th, #resourcesHtml table td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; vertical-align: top; }
      #resourcesHtml table thead tr { background-color: #f5f5f5; font-weight: bold; }
      #resourcesHtml table tr > td:first-child, #resourcesHtml table tr > th:first-child { width: 30%; }
      #resourcesHtml table tr > td:nth-child(2), #resourcesHtml table tr > th:nth-child(2) { width: 70%; }
      #resourcesHtml table > tr:nth-of-type(odd) > td, #resourcesHtml table > tbody > tr:nth-of-type(odd) > td { background-color: #ffffff; }
      #resourcesHtml table > tr:nth-of-type(even) > td, #resourcesHtml table > tbody > tr:nth-of-type(even) > td { background-color: #f9f9f9; }

      /* First row always gray in-editor */
      #resourcesHtml table thead tr,
      #resourcesHtml table tr:first-of-type > th,
      #resourcesHtml table tr:first-of-type > td {
        background-color: #f5f5f5 !important;
      }

      #resourcesHtml p { margin: 0; }
    `}</style>
  </CardContent>
</Card>



           
          </div>
        </div>
      </div>
    </div>
  )
}
