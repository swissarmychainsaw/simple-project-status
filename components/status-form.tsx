"use client"

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image"
import "./status-form.css";
import RichHtmlEditor from "@/components/status-form/RichHtmlEditor";
import {
  BANNERS,
  BANNER_LABELS,
  PROJECT_KEYS,
  normalizeBannerKey,
  getMergedProfileChanges,
  type BannerKey,
  type DesignOptionsProfile,
  type BannerMode,
  type LogoMode,
  type Density,
  type Borders,
} from "@/components/status-form/projectProfiles";

import ImportFromDoc from "@/components/ImportFromDoc";
import RichHtmlEditor from "@/components/status-form/RichHtmlEditor";










import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useToast } from "@/hooks/use-toast"

// Optional helper used inside your page, NOT default-exported:
export function ReportHeader() {
  // If the file is in /public/gns-logo.png you can reference it by path:
  return <Image src="/gns-logo.png" alt="GNS logo" width={120} height={40} priority />
}

type ApplyMode = "fill" | "overwrite";


const listsToParagraphs = (html: string): string => {
  if (!html) return "";
  const root = document.createElement("div");
  root.innerHTML = html;

  // For each UL/OL, replace with a sequence of <p>…</p>
  root.querySelectorAll("ul, ol").forEach((list) => {
    const frag = document.createDocumentFragment();
    list.querySelectorAll(":scope > li").forEach((li) => {
      const p = document.createElement("p");
      p.innerHTML = (li as HTMLElement).innerHTML;
      frag.appendChild(p);
    });
    list.replaceWith(frag);
  });

  return root.innerHTML;
};



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
  execSummaryTitle: string
  highlightsTitle: string
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
  highlightsHtml: string
  risksTitle: string
  risksSectionTitle: string
  risksHtml: string

  resourcesTitle: string
  resourcesSectionTitle: string
  resourcesHtml: string

}
import {
  AlertTriangle,
  Bold,
  CheckCircle,
  Copy,
  Download,
  Eye,
  Italic,
  Loader2,
  Mail,
  RotateCcw,
  Shield,
  Underline,
} from "lucide-react";
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

// Reuse the shared profile type and extend with the local-only field
type DesignOptions = DesignOptionsProfile & {
  optReportKind: ReportKind;
};








const statusOptions = ["Green", "Yellow", "Red"]
const fontOptions = [
  { value: "Inter, Arial, Helvetica, sans-serif", label: "Inter / System" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Segoe UI, Arial, Helvetica, sans-serif", label: "Segoe UI" },
  { value: "Helvetica, Arial, sans-serif", label: "Helvetica" },
  { value: "Georgia, serif", label: "Georgia" },
]



// Make paths absolute for email clients
const absoluteUrl = (p: string) => {
  try {
    return new URL(p, window.location.origin).toString();
  } catch {
    return p;
  }
};

// Make safe for HTML attrs/text
const escapeHtml = (s: string): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
// Global email layout width (shared by preview + email)
const EMAIL_MAX_WIDTH = 900; // px





// Renders the “Listen to this Report” button (used in preview + email)
function renderAudioCta(forEmail: boolean, rawUrl: unknown, accent?: string): string {
  if (!isValidHttpUrl(rawUrl)) return "";
  const href = String(rawUrl).trim();
  const bg = (accent || "#0078D4").trim();

  const linkStyle =
    "display:inline-block;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:6px;" +
    "font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.2;color:#ffffff;";

  return `
  <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="border-collapse:collapse;width:100%;max-width:${EMAIL_MAX_WIDTH}px;margin:0 auto;">
    <tr>
      <td align="center" valign="middle" style="padding:12px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td bgcolor="${bg}" align="center" valign="middle" style="background-color:${bg};border-radius:6px;">
              <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">
                Listen to this Report
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}







// Simple http(s) URL guard used by form + email build
function isValidHttpUrl(maybe: unknown): maybe is string {
  if (typeof maybe !== "string") return false;
  const s = maybe.trim();
  if (!s) return false;
  try {
    const u = new URL(s, typeof window !== "undefined" ? window.location.origin : "https://example.com");
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}


// Banner helper
function getBannerHtml(
  forEmail: boolean,
  opts: DesignOptions,
  maxWidth = EMAIL_MAX_WIDTH
): string {
  // Nothing to render
  if (opts.optBannerMode === "none") return "";

  // Figure out the image source
  let src = "";
  const key = (opts.optBannerId || "") as BannerKey;
  const meta = key ? BANNERS[key] : undefined;

  if (opts.optBannerMode === "url" && opts.optBannerUrl) {
    // Absolute URL for reliability in email clients
    src = absoluteUrl(opts.optBannerUrl);
  } else if (opts.optBannerMode === "cid") {
    // In email, use the CID; in on-page preview, fall back to any web path if available
    if (forEmail && meta?.cid) {
      src = `cid:${meta.cid}`;
    } else if ((meta as any)?.web) {
      src = absoluteUrl((meta as any).web);
    } else if ((meta as any)?.url) {
      src = absoluteUrl((meta as any).url);
    }
  }

  if (!src) return "";

  const caption = opts.optBannerCaption || "Program Status";
  const alt = (meta as any)?.alt || caption;

  const img = `
    <img src="${escapeHtml(src)}"
         alt="${escapeHtml(alt)}"
         width="${maxWidth}"
         style="display:block;width:100%;max-width:${maxWidth}px;height:auto;border:0;outline:0;-ms-interpolation-mode:bicubic;" />
  `;

  // Caption only in on-page preview (not email)
  if (forEmail) return img;

  return `${img}
    <div style="font-weight:600;text-align:center;margin:8px 0 4px 0;color:#111;font-size:18px;line-height:1.3;">
      ${escapeHtml(caption)}
    </div>`;
}

  




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
  "execSummaryTitle",
  "highlightsTitle",
  "highlightsHtml",  
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
    "execSummary","lowlights",

] as const

// const isLargeFieldKey = (k: string) => /(?:updatesHtml|milestonesHtml)/.test(k)
const isLargeFieldKey = (k: string) =>
  /(?:updatesHtml|milestonesHtml|keyDecisionsHtml|risksHtml|resourcesHtml|highlightsHtml)/.test(k)




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
  // safer in TSX:
  HTML_INJECTION_PATTERNS: new RegExp("<(?:script|iframe|object|embed|link|meta|base)", "i"),

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
  execSummaryTitle: "Executive Summary",
  highlightsTitle: "Highlights / Accomplishments",
  highlightsHtml: "", 
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
  execSummary: "",
  lowlights: "",
  risksTitle: "Risks & Issue Mitigation Plan",
  risksSectionTitle: "",
  risksHtml: "",

  resourcesTitle: "Additional Resources",
  resourcesSectionTitle: "",
  resourcesHtml: "",

}
// components/status-form.tsx

export default function StatusForm(
  { onTitleChange }: { onTitleChange?: (title: string) => void }
) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [designOptions, setDesignOptions] = useState<DesignOptions>({
    optFont: "Inter, Arial, Helvetica, sans-serif",
    optAccent: "#086dd7",
    //optDensity: "comfortable",
    optDensity: "compact",
    optBorders: "lines",
    optCustomCss: "",
    optLogoMode: "none",
    optLogoUrl: "",

    // NEW defaults
    optBannerMode: "url",
    optBannerId: "gns",
    optBannerUrl: "",
    optBannerCaption: "Program Status",
    optReportKind: "weekly",
  })
  const [generatedHtml, setGeneratedHtml] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  // const [previewMode, setPreviewMode] = useState<"preview" | "code">("preview")
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([])
  const updatesRef = useRef<HTMLDivElement>(null)
  const milestonesRef = useRef<HTMLDivElement>(null)
  const execSummaryRef = useRef<HTMLDivElement>(null)
  const keyDecisionsRef = useRef<HTMLDivElement>(null)
  const risksRef = useRef<HTMLDivElement>(null)
  const resourcesRef = useRef<HTMLDivElement>(null)
  const highlightsRef = useRef<HTMLDivElement>(null)
const [summary, setSummary] = useState("");
const [highlights, setHighlights] = useState("");
const [upcomingMilestones, setUpcomingMilestones] = useState("");
const [keyDecisions, setKeyDecisions] = useState("");
const [risks, setRisks] = useState("");

  
const handleHighlightsInput = (e: React.FormEvent<HTMLDivElement>) => {
  const target = e.currentTarget
  if (target && target.innerHTML !== undefined) updateFormData("highlightsHtml", target.innerHTML)
}

const handleHighlightsBlur = (e: React.FocusEvent<HTMLDivElement>) => {
  const target = e.currentTarget
  if (target && target.innerHTML !== undefined) updateFormData("highlightsHtml", target.innerHTML)
}

const handleHighlightsPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
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
    updateFormData("highlightsHtml", listsToParagraphs(target.innerHTML))
  }
}


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
  obn:{ caption: "Project Status" },
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
if (field === "updatesHtml" || field === "milestonesHtml" || field === "execSummary" || field === "highlightsHtml") {
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


 // --- Migrate legacy 'lowlights' (plain text) to rich 'highlightsHtml' once ---
 // Read from localStorage directly to avoid race with setState above.
  const savedHighlights = safeLocalStorageGet(PERSIST_PREFIX + "highlightsHtml")
  const savedLowlights  = safeLocalStorageGet(PERSIST_PREFIX + "lowlights")
  if (!savedHighlights && savedLowlights) {
    const migrated = linesToList(savedLowlights)                  // you already have this helper
    const normalized = normalizeEditorHtml(migrated)              // keeps sanitization consistent
    setFormData((prev) => ({ ...prev, highlightsHtml: normalized }))
    safeLocalStorageSet(PERSIST_PREFIX + "highlightsHtml", normalized)
  }



  
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
    : isLargeFieldKey(field)
    ? SECURITY_CONFIG.MAX_UPDATES_LENGTH
    : SECURITY_CONFIG.MAX_FIELD_LENGTH;

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


// === Apply a project profile into state (without triggering old applyProfile side-effects) ===
const applyProjectProfile = (key: BannerKey, mode: "fill" | "overwrite" = "overwrite") => {
  const { design, form } = getMergedProfileChanges(key, mode, designOptions, formData);
design.optLogoMode = "none"; // force logos off globally
  
  // Merge design options directly, then persist
  setDesignOptions((prev) => ({ ...prev, ...(design as any) }));
  Object.entries(design).forEach(([k, v]) => {
    if (typeof v === "string") safeLocalStorageSet(PERSIST_PREFIX + k, v);
  });

  // Merge form data, then persist
  setFormData((prev) => ({ ...prev, ...(form as any) }));
  Object.entries(form).forEach(([k, v]) => {
    if (typeof v === "string") persistField(k, v);
  });
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

function listAwareTextToHtml(text: string): string {
  const src = (text ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = src.split("\n");

  // If all lines are empty, fall back to paragraph formatter
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length === 0) return nlToParas(src);

  // Recognize bullets and numbers
  const bulletRe = /^\s*([-*•])\s+/;      // -, *, or • followed by space
  const numberRe = /^\s*\d+[.)]\s+/;      // 1.  or 1) followed by space

  const isAllBullets = nonEmpty.every((l) => bulletRe.test(l));
  const isAllNumbers = nonEmpty.every((l) => numberRe.test(l));

  if (isAllBullets) {
    const items = nonEmpty.map((l) => l.replace(bulletRe, "").trim());
    return `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
  }

  if (isAllNumbers) {
    const items = nonEmpty.map((l) => l.replace(numberRe, "").trim());
    return `<ol>${items.map((i) => `<li>${i}</li>`).join("")}</ol>`;
  }

  // Mixed content or not a list → fall back to paragraphs/line breaks
  return nlToParas(src);
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
const HEADER_BG = "#f5f5f5"; // White smoke








  
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
// Remove pixel/percent widths that can blow up the layout in email.
// Keep tables at 100% and make images responsive.
const clampWidthsForEmail = (html: string): string => {
  if (!html) return html;
  const root = document.createElement("div");
  root.innerHTML = html;

  // 1) Tables: force width=100%
  root.querySelectorAll("table").forEach((t) => {
    const el = t as HTMLElement;
    el.style.width = "100%";
    el.setAttribute("width", "100%");
    // remove explicit px widths on table wrapper DIVs, if any parent is the immediate wrapper
    el.removeAttribute("height");
    el.style.removeProperty("max-width");
    el.style.removeProperty("min-width");
  });

  // 2) Cells: strip fixed widths that can expand container
  root.querySelectorAll("th, td").forEach((cell) => {
    const el = cell as HTMLElement;
    el.style.removeProperty("width");
    el.removeAttribute("width");
    el.style.removeProperty("min-width");
    el.style.removeProperty("max-width");
    // keep left/top alignment to reduce reflow surprises in Outlook
    el.setAttribute("align", "left");
    el.setAttribute("valign", "top");
  });

  // 3) Generic wrappers (div/span/p): remove fixed/min/max widths
  root.querySelectorAll("div, span, p, section, article").forEach((n) => {
    const el = n as HTMLElement;
    el.style.removeProperty("width");
    el.removeAttribute("width");
    el.style.removeProperty("min-width");
    el.style.removeProperty("max-width");
    // kill floats/absolute positioning that can shift outside the 700px frame
    el.style.removeProperty("float");
    el.style.removeProperty("position");
    el.style.removeProperty("left");
    el.style.removeProperty("right");
  });

  // 4) Images inside content: make responsive
  root.querySelectorAll("img").forEach((img) => {
    const el = img as HTMLImageElement;
    // keep attribute width if small; otherwise prefer CSS (more predictable in clients)
    el.removeAttribute("height");
    el.style.maxWidth = "100%";
    el.style.height = "auto";
    const s = (el.getAttribute("style") || "").trim();
    if (!/max-width/i.test(s)) {
      el.setAttribute("style", `${s ? s + ";" : ""}max-width:100%;height:auto`);
    }
  });

  return root.innerHTML;
};

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



function looksLikeHtml(s: string) {
  return /<\/?[a-z][\s\S]*>/i.test(s);
}

function applyImported(d: {
  summary?: string;
  highlights?: string;
  upcoming_milestones?: string;
  key_decisions?: string;
  risks?: string;
}) {
  const S = d.summary ?? "";
  const H = d.highlights ?? "";
  const M = d.upcoming_milestones ?? "";
  const K = d.key_decisions ?? "";
  const R = d.risks ?? "";

  // If the server sent HTML (from HTML export), use it directly.
  // Otherwise, fall back to your existing plain-text → HTML transforms.
  updateFormData("execSummary", looksLikeHtml(S) ? S : nlToParas(S));
  updateFormData("highlightsHtml", looksLikeHtml(H) ? H : listAwareTextToHtml(H));
  updateFormData("milestonesHtml", looksLikeHtml(M) ? M : listAwareTextToHtml(M));
  updateFormData("keyDecisionsHtml", looksLikeHtml(K) ? K : listAwareTextToHtml(K));
  updateFormData("risksHtml", looksLikeHtml(R) ? R : listAwareTextToHtml(R));
}




const processRichHtml = (html: string): string =>
  widenTables(
    stripeTables(
      clampWidthsForEmail(
        stripInlineBackgrounds(
          unwrapParagraphsInTables(
            sanitizeHtml(html)
          )
        )
      )
    )
  );

//
// buildhtml section
//
 const buildHtml = (data: FormData, opts: DesignOptions) => {
  const asOf = data.asOf
    ? (() => {
        const [year, month, day] = data.asOf.split("-").map(Number)
        const date = new Date(year, month - 1, day)
        return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
      })()
    : ""

  
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

const processedHighlights = processRichHtml(listsToParagraphs(data.highlightsHtml));
const evenRowStyle = "background-color:#f9f9f9;padding:20px;border:1px solid #CCCCCC;"
  const oddRowStyle  = "background-color:#ffffff;padding:20px;border:1px solid #CCCCCC;"
  



  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Status Report</title>
</head>
<body style="margin:0;padding:0;">
  ${getBannerHtml(false, opts, EMAIL_MAX_WIDTH)}



  <table style="width:100%;max-width:${EMAIL_MAX_WIDTH}px;margin:0 auto;border-collapse:collapse;font-family:Arial,sans-serif;">

    <tr><td>
      <table style="width:100%;border-collapse:collapse;margin:0;padding:0;">

               <!-- Title + Summary -->
        <tr>
          <td style="background-color:#E8E8E8;padding:20px;text-align:left;border:1px solid #CCCCCC;">
            <h1 style="margin:0;font-size:24px;font-weight:bold;color:#333333;">
              ${data.programTitle || "Your Program/Project Title here"}
            </h1>
          </td>
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
          <td colspan="1" style="${evenRowStyle}padding:0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="width:25%;padding:10px;text-align:center;border-left:1px solid #CCCCCC;border-right:1px solid #CCCCCC;border-top:0;border-bottom:0;background-color:#F5F5F5;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Last Status</h3>
                  ${pill(data.lastStatus)}
                </td>
                <td style="width:25%;padding:10px;text-align:center;border-left:1px solid #CCCCCC;border-right:1px solid #CCCCCC;border-top:0;border-bottom:0;background-color:#F5F5F5;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Current Status</h3>
                  ${pill(data.currentStatus)}
                </td>
                <td style="width:25%;padding:10px;text-align:center;border-left:1px solid #CCCCCC;border-right:1px solid #CCCCCC;border-top:0;border-bottom:0;background-color:#F5F5F5;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Trending</h3>
                  ${pill(data.trending)}
                </td>
                <td style="width:25%;padding:10px;text-align:center;border-left:1px solid #CCCCCC;border-right:1px solid #CCCCCC;border-top:0;border-bottom:0;background-color:#F5F5F5;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Date</h3>
                  <p style="margin:0;font-size:14px;color:#333333;">${escapeHtml(asOf)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Team row -->
        <tr>
          <td colspan="1" style="${oddRowStyle}padding:0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="width:25%;padding:10px;text-align:center;border:1px solid #CCCCCC;background-color:#FFFFFF;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">TPM</h3>
                  <p style="margin:0;font-size:16px;color:#333333;">${escapeHtml(data.tpm) || "Name"}</p>
                </td>
                <td style="width:25%;padding:10px;text-align:center;border:1px solid #CCCCCC;background-color:#FFFFFF;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Engineering DRI</h3>
                  <p style="margin:0;font-size:16px;color:#333333;">${escapeHtml(data.engDri) || "Name"}</p>
                </td>
                <td style="width:25%;padding:10px;text-align:center;border:1px solid #CCCCCC;background-color:#FFFFFF;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Business Sponsor</h3>
                  <p style="margin:0;font-size:16px;color:#333333;">${escapeHtml(data.bizSponsor) || "Name"}</p>
                </td>
                <td style="width:25%;padding:10px;text-align:center;border:1px solid #CCCCCC;background-color:#FFFFFF;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Engineering Sponsor</h3>
                  <p style="margin:0;font-size:16px;color:#333333;">${escapeHtml(data.engSponsor) || "Name"}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

<!-- Executive Summary section -->
${data.execSummary ? `
<tr>
  <td colspan="1" style="${oddRowStyle}">
    <h3 style="margin:0 0 10px 0;font-size:18px;font-weight:bold;color:#333333;">
      ${escapeHtml(data.execSummaryTitle || "Executive Summary")}
    </h3>
    <div style="margin:0;font-size:16px;color:#333333;">
      ${unwrapParagraphsInTables(stripInlineBackgrounds(sanitizeHtml(data.execSummary)))}
    </div>
  </td>
</tr>` : ""}

// inside buildHtml return, alongside Exec Summary rows
<!-- Highlights / Accomplishments -->
${data.highlightsHtml ? `
<tr>
  <td colspan="1" style="${oddRowStyle}">
    <h3 style="margin:0 0 10px 0;font-size:18px;font-weight:bold;color:#333333;">
      ${escapeHtml(data.highlightsTitle || "Highlights / Accomplishments")}
    </h3>
    <div style="margin:0;font-size:16px;color:#333333;">
     ${processedHighlights}
    </div>
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
const fourColColgroup = `
  <colgroup>
    <col style="width:25%" width="25%">
    <col style="width:25%" width="25%">
    <col style="width:25%" width="25%">
    <col style="width:25%" width="25%">
  </colgroup>`;


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






// Normalize density locally to a concrete union
type DensityName = "comfortable" | "cozy" | "compact";





// compact trending and people table
// ---- email-safe helpers (fixed-width container), defined ONCE
const containerWidth = EMAIL_MAX_WIDTH;

// Don’t rely on an imported narrower type; normalize locally.
const dens = (opts.optDensity ?? "comfortable") as "comfortable" | "cozy" | "compact";
const scale = dens === "compact" ? 0.8 : dens === "cozy" ? 0.9 : 1;
const px = (n: number) => `${Math.round(n * scale)}px`;

const outerTableStyle =
  `border-collapse:collapse;width:100%;max-width:${containerWidth}px;` +
  `margin:0 auto;mso-table-lspace:0pt;mso-table-rspace:0pt;`;
const innerTableStyle =
  "border-collapse:collapse;width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;";

// ----- GLOBAL (unscaled) text for everything else -----
const fontFamily = opts.optFont || "Arial, Helvetica, sans-serif";
const baseText   = `font-family:${fontFamily};color:#111;`;
const baseFont   = `${baseText}font-size:16px;line-height:1.45;`;

const cellBase   = `${baseFont}padding:16px;border:1px solid #e5e7eb;`;
const cellLeft   = `${cellBase}text-align:left;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;`;
const cellCenter = `${cellBase}text-align:center;vertical-align:middle;`;
const headCellCenter = `${cellBase}background-color:#f5f5f5;font-weight:700;text-align:center;vertical-align:middle;`;
const headCellLeft   = `${cellBase}background-color:#f5f5f5;font-weight:700;text-align:left;vertical-align:middle;`;
const titleCell  = `${cellBase}background-color:#e5e7eb;font-weight:700;font-size:20px;text-align:left;vertical-align:middle;`;

// ----- SCALED (used ONLY in Status + Team tables) -----
const sFont       = `${baseText}font-size:${px(14)};line-height:1.35;`;
const sCellBase   = `${sFont}padding:${px(8)} ${px(10)};border:1px solid #e5e7eb;`;
const sCellLeft   = `${sCellBase}text-align:left;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;`;
const sCellCenter = `${sCellBase}text-align:center;vertical-align:middle;`;
const sHeadCellC  = `${sCellBase}background-color:#f5f5f5;font-weight:700;text-align:center;vertical-align:middle;font-size:${px(13)};`;
const sHeadCellL  = `${sCellBase}background-color:#f5f5f5;font-weight:700;text-align:left;vertical-align:middle;font-size:${px(13)};`;

// section header row (unscaled everywhere except the two special tables)
const sectionHeaderRow = (label: string) =>
  `<tr><td style="${headCellLeft}" bgcolor="#f5f5f5" align="left">${escapeHtml(label)}</td></tr>`;

// Pill (only appears in the Status row; keep scaled)
const emailPill = (s: string) => {
  const colors = {
    green:  { bg: "#27c08a", color: "#fff" },
    yellow: { bg: "#f4c542", color: "#111" },
    red:    { bg: "#e5534b", color: "#fff" },
  } as const;
  const c = colors[(s || "").toLowerCase() as keyof typeof colors] || colors.green;
  return `<span style="${sFont}display:inline-block;padding:${px(4)} ${px(8)};border-radius:${px(10)};font-weight:700;background-color:${c.bg};color:${c.color};">${escapeHtml(s)}</span>`;
};

  

  


  

  
// Larger Pill
//   const emailPill = (s: string) => {
//     const colors = {
//       green:  { bg: "#27c08a", color: "#fff" },
//       yellow: { bg: "#f4c542", color: "#111" },
//       red:    { bg: "#e5534b", color: "#fff" },
//     } as const;
//     const c = colors[(s || "").toLowerCase() as keyof typeof colors] || colors.green;
//     return `<span style="${baseFont}display:inline-block;padding:6px 12px;border-radius:10px;font-weight:700;background-color:${c.bg};color:${c.color};">${escapeHtml(s)}</span>`;
//   };


const banner = getBannerHtml(true, opts, containerWidth);
  
  const processedUpdates         = processRichHtml(data.updatesHtml);
  const processedMilestones      = processRichHtml(data.milestonesHtml);
  const processedKeyDecisions    = processRichHtml(data.keyDecisionsHtml);
  const processedRisks           = processRichHtml(data.risksHtml);
  const processedResources       = processRichHtml(data.resourcesHtml);
const processedHighlights = processRichHtml(listsToParagraphs(data.highlightsHtml))

  return `
<!-- Fixed-width banner -->
<table role="presentation" align="center" width="100%" style="${outerTableStyle}" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding:0;">${banner}</td></tr>
</table>

${renderAudioCta(true, data.audioUrl, opts?.optAccent || "#0078D4")}

<!-- Fixed-width outer container -->
<table role="presentation" align="center" width="100%" style="${outerTableStyle}" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:0;">
           <!-- Title + Summary -->
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="${titleCell}" bgcolor="#e5e7eb" align="left" valign="middle">
            ${escapeHtml(data.programTitle || "Your Program/Project Title here")}
          </td>
        </tr>
        <tr>
          <td style="${cellLeft}" bgcolor="#ffffff" align="left" valign="top">
            ${nlToParas(data.programSummary)}
          </td>
        </tr>
      </table>


      <!--  Status table (use scaled)  Team -->
<table role="presentation" width="100%" style="${innerTableStyle};table-layout:fixed" cellpadding="0" cellspacing="0" border="0"> ${fourColColgroup}
  <tr>
    <td style="${sHeadCellC}" bgcolor="#f5f5f5">Last Status</td>
    <td style="${sHeadCellC}" bgcolor="#f5f5f5">Current Status</td>
    <td style="${sHeadCellC}" bgcolor="#f5f5f5">Trending</td>
    <td style="${sHeadCellC}" bgcolor="#f5f5f5">Date</td>
  </tr>
  <tr>
    <td style="${sCellCenter}" align="center" valign="middle">${emailPill(data.lastStatus)}</td>
    <td style="${sCellCenter}" align="center" valign="middle">${emailPill(data.currentStatus)}</td>
    <td style="${sCellCenter}" align="center" valign="middle">${emailPill(data.trending)}</td>
    <td style="${sCellCenter}" align="center" valign="middle">${escapeHtml(asOf)}</td>
  </tr>
</table>

      <!-- Team -->
<table role="presentation" width="100%" style="${innerTableStyle};table-layout:fixed" cellpadding="0" cellspacing="0" border="0"> ${fourColColgroup}
  <tr>
    <td style="${sHeadCellC}" bgcolor="#f5f5f5">TPM</td>
    <td style="${sHeadCellC}" bgcolor="#f5f5f5">Engineering DRI</td>
    <td style="${sHeadCellC}" bgcolor="#f5f5f5">Business Sponsor</td>
    <td style="${sHeadCellC}" bgcolor="#f5f5f5">Engineering Sponsor</td>
  </tr>
  <tr>
    <td style="${sCellCenter}" align="center" valign="middle">${escapeHtml(data.tpm)}</td>
    <td style="${sCellCenter}" align="center" valign="middle">${escapeHtml(data.engDri)}</td>
    <td style="${sCellCenter}" align="center" valign="middle">${escapeHtml(data.bizSponsor)}</td>
    <td style="${sCellCenter}" align="center" valign="middle">${escapeHtml(data.engSponsor)}</td>
  </tr>
</table>








${data.execSummary ? `
  <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
    ${sectionHeaderRow(data.execSummaryTitle || "Executive Summary")}
    <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">
      ${unwrapParagraphsInTables(stripInlineBackgrounds(sanitizeHtml(data.execSummary)))}
    </td></tr>
  </table>` : ""}

<!-- inside buildEmailHtml return, between Exec Summary and Updates blocks -->
<!-- Highlights / Accomplishments -->
${data.highlightsHtml ? `
  <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
    ${sectionHeaderRow(data.highlightsTitle || "Highlights / Accomplishments")}
    <tr>
      <td style="${cellLeft}" bgcolor="#ffffff" align="left">
       ${processedHighlights}
      </td>
    </tr>


  </table>` : ""}


      <!-- Updates -->
${data.updatesHtml ? `
  <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
    ${sectionHeaderRow(data.updatesTitle || "Top Accomplishments")}
    ${data.sectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left"><strong>${escapeHtml(data.sectionTitle)}</strong></td></tr>` : ""}
    <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedUpdates}</td></tr>
  </table>` : ""}

<!-- Milestones -->
${data.milestonesHtml ? `
  <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
    ${sectionHeaderRow(data.milestonesTitle || "Upcoming Milestones")}
    ${data.milestonesSectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left"><strong>${escapeHtml(data.milestonesSectionTitle)}</strong></td></tr>` : ""}
    <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedMilestones}</td></tr>
  </table>` : ""}

<!--  Key Decisions -->
${data.keyDecisionsHtml ? `
  <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
    ${sectionHeaderRow(data.keyDecisionsTitle || "Key Decisions")}
    ${data.keyDecisionsSectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left"><strong>${escapeHtml(data.keyDecisionsSectionTitle)}</strong></td></tr>` : ""}
    <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedKeyDecisions}</td></tr>
  </table>` : ""}

<!--  Risks -->
${data.risksHtml ? `
  <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
    ${sectionHeaderRow(data.risksTitle || "Risks & Issue Mitigation Plan")}
    ${data.risksSectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left"><strong>${escapeHtml(data.risksSectionTitle)}</strong></td></tr>` : ""}
    <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedRisks}</td></tr>
  </table>` : ""}

<!-- Additional Resources -->
${data.resourcesHtml ? `
  <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
    ${sectionHeaderRow(data.resourcesTitle || "Additional Resources")}
    ${data.resourcesSectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left"><strong>${escapeHtml(data.resourcesSectionTitle)}</strong></td></tr>` : ""}
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
    	console.log("[debug] audioUrl:", formData.audioUrl);
	console.log("[debug] valid http(s)?", typeof isValidHttpUrl === "function" ? isValidHttpUrl(formData.audioUrl) : "no isValidHttpUrl");
	const hasCTA = /Listen to this Report/.test(htmlToSend);
	console.log("[debug] CTA present in HTML?", hasCTA);

    const usingCidBanner = designOptions.optBannerMode === "cid" && !!designOptions.optBannerId;

    const res = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: recipient,
//        subject: formData.programTitle || "Status Report",
	subject: `[Inform] ${formData.programTitle?.trim() || "Project"} | Status Update`,
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
   const html = buildHtml(formData, designOptions)
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

 const formatHtml = (html: string) => {
  const r1 = new RegExp("><", "g");
  const r2 = new RegExp("(</?)(\\w+)([^>]*>)", "g");
  return html.replace(r1, ">\n<").replace(r2, (m, p1, p2, p3) => {
    if (["table", "tr", "th", "td", "h1", "h2", "p", "ul", "li"].includes(p2)) {
      return `${p1}${p2}${p3}`;
    }
    return m;
  });
};


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
    html = listsToParagraphs(sanitizeHtml(html))

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
  if (highlightsRef.current && highlightsRef.current.innerHTML !== formData.highlightsHtml) {
    highlightsRef.current.innerHTML = formData.highlightsHtml
  }
}, [formData.highlightsHtml])

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

// --- derived project label for the header preview ---
const currentProjectKey = useMemo<BannerKey | undefined>(
  () => (designOptions.optBannerId as BannerKey) || undefined,
  [designOptions.optBannerId]
)

const currentProjectLabel = currentProjectKey ? BANNER_LABELS[currentProjectKey] : "—"

const appTitle = useMemo(
  () => `${currentProjectLabel} Status Report`,
  [currentProjectLabel]
)

useEffect(() => {
  onTitleChange?.(appTitle)
}, [appTitle, onTitleChange])








  return (
<div
  className="min-h-screen bg-gray-50 py-8 project-tint"
  data-project={normalizeBannerKey(designOptions.optBannerId as BannerKey)}
>
      {/* Sticky project header */}




      <div className="max-w-[900px] mx-auto px-4">
        {/* Header */}

<div aria-hidden className="tint-bar" />

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
{/* Current Project indicator & preview */}
<div className="mb-6">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
    </div>


  </div>








  {/* Banner preview */}
  {designOptions.optBannerMode === "url" && designOptions.optBannerUrl ? (
    <div className="mt-3 overflow-hidden rounded-lg border bg-white">
      <img
        src={designOptions.optBannerUrl}
        alt={`${currentProjectLabel} banner`}
        className="w-full h-32 object-cover"
      />
    </div>
  ) : designOptions.optBannerMode !== "none" ? (
    // Lightweight visual when using CID banners (no external URL to show)
    <div className="mt-3 rounded-lg border bg-gradient-to-r from-gray-50 to-white p-4">
      
      <div className="text-lg font-semibold leading-tight">
      {currentProjectLabel}
      </div>
      {designOptions.optBannerCaption ? (
        <div className="text-sm text-gray-600 mt-0.5">
       
        </div>
      ) : null}
    </div>
  ) : null}
</div>
<Card>
  <CardHeader>
    {/* Design Options */}
    <CardTitle>Design Options</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Project selector */}
    <div>
      <Label className="text-sm font-medium">Project</Label>
      <Select
        value={designOptions.optBannerId}
        onValueChange={(v) => {
          updateDesignOptions("optBannerId", v);
          applyProjectProfile(v as BannerKey, "overwrite");
        }}
      >
        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
        <SelectContent>
          {PROJECT_KEYS.map((k) => (
            <SelectItem key={k} value={k}>
              {BANNER_LABELS[k]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Banner mode */}
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

    {/* Banner URL (only when mode=url) */}
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

<Card>
  <CardHeader>
    <CardTitle>Import from Google Doc / YAML</CardTitle>
  </CardHeader>
  <CardContent>
    <ImportFromDoc onPrefill={applyImported} />
  </CardContent>
</Card>

{/* Audio URL */}
<div>
  <Label className="text-sm font-medium">Audio URL</Label>
  <Input
    value={formData.audioUrl || ""}
    onChange={(e) => updateFormData("audioUrl", e.target.value)}
    placeholder="https://… (SharePoint/OneDrive/MP3)"
    className="bg-white mt-1"
  />
  <p className="text-xs text-gray-500 mt-1">
    Adds a “Listen to this Report” button under the banner.
  </p>
</div>



    {/* Apply defaults + explainer */}
    <div className="flex items-start gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          applyProjectProfile(designOptions.optBannerId as BannerKey, "overwrite")
        }
      >
        Apply profile defaults (overwrite)
      </Button>
      <p className="text-xs text-gray-600 leading-5">
        When you click <em>Apply profile defaults (overwrite)</em> we look up the currently
        selected project’s profile (GNS, OBN, etc.) and overwrite your form fields (title,
        summary, people, etc.) and design options (banner mode/id/url, accent, etc.) with that
        project’s saved defaults. It’s the “reset to this project’s baseline” button.
      </p>
    </div>
  </CardContent>
</Card>

<Card>
  <CardHeader>
    <CardTitle>Basics</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Program Title */}
    <div>
      <Label className="text-sm font-medium">Program / Project Title</Label>
      <Input
        value={formData.programTitle}
        onChange={(e) => updateFormData("programTitle", e.target.value)}
        placeholder="e.g., Global Network Services"
        className="bg-white mt-1"
      />
    </div>

    {/* Program Summary */}
    <div>
      <Label className="text-sm font-medium">Program Summary</Label>
      <Textarea
        value={formData.programSummary}
        onChange={(e) => updateFormData("programSummary", e.target.value)}
        rows={3}
        maxLength={SECURITY_CONFIG.MAX_FIELD_LENGTH}
        className="bg-white mt-1 resize-none"
        placeholder="One or two sentences describing the program/project."
      />
    </div>

    {/* Header table Date + Statuses */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div>
        <Label className="text-sm font-medium">Date</Label>
        <Input
          type="date"
          value={formData.asOf}
          onChange={(e) => updateFormData("asOf", e.target.value)}
          className="bg-white mt-1"
        />
      </div>

      {["lastStatus","currentStatus","trending"].map((k) => (
        <div key={k}>
          <Label className="text-sm font-medium capitalize">{k.replace(/([A-Z])/g," $1")}</Label>
          <Select
            value={(formData as any)[k]}
            onValueChange={(v) => updateFormData(k as any, v)}
          >
            <SelectTrigger className="bg-white mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Green">Green</SelectItem>
              <SelectItem value="Yellow">Yellow</SelectItem>
              <SelectItem value="Red">Red</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>

    {/* People */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div>
        <Label className="text-sm font-medium">TPM</Label>
        <Input
          value={formData.tpm}
          onChange={(e) => updateFormData("tpm", e.target.value)}
          placeholder="Name"
          className="bg-white mt-1"
        />
      </div>
      <div>
        <Label className="text-sm font-medium">Engineering DRI</Label>
        <Input
          value={formData.engDri}
          onChange={(e) => updateFormData("engDri", e.target.value)}
          placeholder="Name"
          className="bg-white mt-1"
        />
      </div>
      <div>
        <Label className="text-sm font-medium">Business Sponsor</Label>
        <Input
          value={formData.bizSponsor}
          onChange={(e) => updateFormData("bizSponsor", e.target.value)}
          placeholder="Name"
          className="bg-white mt-1"
        />
      </div>
      <div>
        <Label className="text-sm font-medium">Engineering Sponsor</Label>
        <Input
          value={formData.engSponsor}
          onChange={(e) => updateFormData("engSponsor", e.target.value)}
          placeholder="Name"
          className="bg-white mt-1"
        />
      </div>
    </div>

    {/* Email To */}
    <div>
      <Label className="text-sm font-medium">Email To</Label>
      <Input
        value={formData.emailTo}
        onChange={(e) => updateFormData("emailTo", e.target.value)}
        placeholder="you@example.com"
        className="bg-white mt-1"
      />
    </div>
  </CardContent>
</Card>




        
          {/* Executive Summary Section */} 
 <Card>
  <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
  <CardContent>
    {/* Title input (kept here) */}
    <div className="mb-2">
      <Label className="text-xs text-gray-600">Section Title</Label>
      <Input
        value={formData.execSummaryTitle}
        onChange={(e) => updateFormData("execSummaryTitle", e.target.value)}
        placeholder="Executive Summary"
        className="bg-white mt-1"
      />
    </div>


    <div className="flex gap-1 mb-2">
      {/* existing toolbar buttons... */}
    </div>

   {/* Single editor instance */}
    <div
      ref={execSummaryRef}
      id="execSummary"
      contentEditable
      className="min-h-[120px] p-3 border border-input rounded-md bg-white text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:outline-none"
      style={{ lineHeight: "1.5", overflowX: "auto", maxWidth: "100%" }}
      onInput={handleExecSummaryInput}
      onBlur={handleExecSummaryBlur}
      onPaste={handleExecSummaryPaste}
      data-placeholder="Type or paste your executive summary here…"
      suppressContentEditableWarning
    />
  </CardContent>
</Card>



   
<Card>
  <CardHeader><CardTitle>Highlights / Accomplishments</CardTitle></CardHeader>
  <CardContent>
    <div className="mb-2">
      <Label className="text-xs text-gray-600">Section Title</Label>
      <Input
        type="text"
        value={formData.highlightsTitle}
        onChange={(e) => updateFormData("highlightsTitle", e.target.value)}
        placeholder="Highlights / Accomplishments"
        className="mt-1 bg-white"
      />
    </div>

    <div className="flex gap-1 mb-2">
      <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("highlightsHtml", "b")} className="h-8 px-2">Bold</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("highlightsHtml", "i")} className="h-8 px-2">Italic</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("highlightsHtml", "u")} className="h-8 px-2">Underline</Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-3 ml-2"
        onClick={() => {
          updateFormData("highlightsHtml", "")
          if (highlightsRef.current) highlightsRef.current.innerHTML = ""
        }}
      >
        Clear Field
      </Button>
    </div>

    <div
      ref={highlightsRef}
      id="highlightsHtml"
      contentEditable
      className="min-h-[120px] p-3 border border-input rounded-md bg-white text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:outline-none"
      style={{ lineHeight: "1.5", overflowX: "auto", maxWidth: "100%" }}
      onInput={handleHighlightsInput}
      onBlur={handleHighlightsBlur}
      onPaste={handleHighlightsPaste}
      data-placeholder="Type or paste highlights here…"
      suppressContentEditableWarning
    />
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
</div>
  );
}
