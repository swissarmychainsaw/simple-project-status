"use client"

// Force redeploy to pick up RESEND_API_KEY environment variable

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bold,
  Italic,
  Underline,
  Copy,
  Download,
  RotateCcw,
  Eye,
  Code,
  CheckCircle,
  Shield,
  Loader2,
  AlertTriangle,
  Mail,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
}

interface DesignOptions {
  optFont: string
  optAccent: string
  optDensity: string
  optBorders: string
  optCustomCss: string
}

const statusOptions = ["Green", "Yellow", "Red"]
const fontOptions = [
  { value: "Inter, Arial, Helvetica, sans-serif", label: "Inter / System" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Segoe UI, Arial, Helvetica, sans-serif", label: "Segoe UI" },
  { value: "Helvetica, Arial, sans-serif", label: "Helvetica" },
  { value: "Georgia, serif", label: "Georgia" },
]

const PERSIST_PREFIX = "statusReportGenerator."
const SAVE_FIELDS = [
  "programTitle",
  "programSummary",
  "tpm",
  "engDri",
  "bizSponsor",
  "engSponsor",
  "optFont",
  "optAccent",
  "optDensity",
  "optBorders",
  "optCustomCss",
  "updatesHtml",
  "updatesTrack",
  "updatesTeam",
  "emailTo",
  "sectionTitle",
]

const SECURITY_CONFIG = {
  MAX_FIELD_LENGTH: 10000,
  MAX_UPDATES_LENGTH: 100000, // 100KB limit for Updates section
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

export default function StatusForm() {
  const [formData, setFormData] = useState<FormData>({
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
  })

  const [designOptions, setDesignOptions] = useState<DesignOptions>({
    optFont: "Inter, Arial, Helvetica, sans-serif",
    optAccent: "#086dd7",
    optDensity: "comfortable",
    optBorders: "lines",
    optCustomCss: "",
  })

  const [generatedHtml, setGeneratedHtml] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [previewMode, setPreviewMode] = useState<"preview" | "code">("preview")
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([])
  const updatesRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [copyEmailLoading, setCopyEmailLoading] = useState(false)
  const [copyEmailFeedback, setCopyEmailFeedback] = useState("")
  const [copyRenderedLoading, setIsCopyingRendered] = useState(false)
  const [copyRenderedFeedback, setCopyRenderedFeedback] = useState("")
  const [isEmailing, setIsEmailing] = useState(false)

  const safeLocalStorageGet = (key: string): string | null => {
    try {
      const value = localStorage.getItem(key)
      const maxLength = key.includes("updatesHtml")
        ? SECURITY_CONFIG.MAX_UPDATES_LENGTH
        : SECURITY_CONFIG.MAX_FIELD_LENGTH
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
      const maxLength = key.includes("updatesHtml")
        ? SECURITY_CONFIG.MAX_UPDATES_LENGTH
        : SECURITY_CONFIG.MAX_FIELD_LENGTH
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

  // Load persisted data on mount
  useEffect(() => {
    SAVE_FIELDS.forEach((field) => {
      const value = safeLocalStorageGet(PERSIST_PREFIX + field)
      if (value !== null) {
        if (field === "updatesHtml") {
          setFormData((prev) => ({ ...prev, [field]: sanitizeHtml(value) }))
        } else if (field.startsWith("opt")) {
          setDesignOptions((prev) => ({ ...prev, [field]: value }))
        } else {
          setFormData((prev) => ({ ...prev, [field]: value }))
        }
      }
    })

    // Seed example data if empty
    const savedSummary = safeLocalStorageGet(PERSIST_PREFIX + "programSummary")
    if (!savedSummary) {
      setFormData((prev) => ({
        ...prev,
        programSummary:
          "The Global Network Services (GNS) team designs, builds, and manages LinkedIn's enterprise network, ensuring secure, reliable connectivity across on‑prem and cloud.",
        tpm: "Nick Adams",
        engDri: "Antony Alexander",
        bizSponsor: "Niha Mathur",
        engSponsor: "Suchreet Dhaliwal",
      }))
    }
  }, [])

  const validateInput = (field: string, value: string): { isValid: boolean; sanitized: string; warnings: string[] } => {
    const warnings: string[] = []
    let sanitized = value

    const maxLength = field === "updatesHtml" ? SECURITY_CONFIG.MAX_UPDATES_LENGTH : SECURITY_CONFIG.MAX_FIELD_LENGTH

    // Length validation
    if (value.length > maxLength) {
      sanitized = value.substring(0, maxLength)
      warnings.push(`${field} was truncated to ${maxLength} characters`)
    }

    // HTML injection detection
    if (SECURITY_CONFIG.HTML_INJECTION_PATTERNS.test(value)) {
      warnings.push(`Potentially dangerous HTML detected in ${field}`)
    }

    // CSS injection detection for custom CSS field
    if (field === "optCustomCss" && SECURITY_CONFIG.CSS_INJECTION_PATTERNS.test(value)) {
      warnings.push("Potentially dangerous CSS detected and will be sanitized")
    }

    return { isValid: warnings.length === 0, sanitized, warnings }
  }

  const sanitizeCss = (css: string): string => {
    // Remove dangerous CSS patterns
    return css
      .replace(SECURITY_CONFIG.CSS_INJECTION_PATTERNS, "")
      .replace(/@import\s+[^;]+;/gi, "")
      .replace(/expression\s*$$[^)]*$$/gi, "")
      .replace(/javascript\s*:/gi, "")
      .replace(/behavior\s*:/gi, "")
      .replace(/binding\s*:/gi, "")
      .substring(0, SECURITY_CONFIG.MAX_CSS_LENGTH)
  }

  // Persist data changes
  const persistField = (field: string, value: string) => {
    const validation = validateInput(field, value)
    if (validation.warnings.length > 0) {
      setSecurityWarnings((prev) => [...prev, ...validation.warnings])
    }
    safeLocalStorageSet(PERSIST_PREFIX + field, validation.sanitized)
  }

  const updateFormData = (field: keyof FormData, value: string) => {
    const validation = validateInput(field, value)
    setFormData((prev) => ({ ...prev, [field]: validation.sanitized }))
    if (SAVE_FIELDS.includes(field)) {
      persistField(field, validation.sanitized)
    }
    if (validation.warnings.length > 0) {
      setSecurityWarnings((prev) => [...prev, ...validation.warnings])
    }
  }

  const updateDesignOptions = (field: keyof DesignOptions, value: string) => {
    let processedValue = value
    if (field === "optCustomCss") {
      processedValue = sanitizeCss(value)
    }

    const validation = validateInput(field, processedValue)
    setDesignOptions((prev) => ({ ...prev, [field]: validation.sanitized }))
    if (SAVE_FIELDS.includes(field)) {
      persistField(field, validation.sanitized)
    }
    if (validation.warnings.length > 0) {
      setSecurityWarnings((prev) => [...prev, ...validation.warnings])
    }
  }

  // HTML generation utilities
  const escapeHtml = (s: string) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")

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

  const linesToList = (text: string) => {
    const items = String(text || "")
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean)
    return items.length ? `<ul>\n${items.map((i) => `  <li>${safeInline(i)}</li>`).join("\n")}\n</ul>` : ""
  }

  const pill = (val: string) => {
    const v = escapeHtml(val || "").toLowerCase()
    if (v === "red") return '<span class="pill red">Red</span>'
    if (v === "yellow") return '<span class="pill yellow">Yellow</span>'
    return '<span class="pill green">Green</span>'
  }

  const sanitizeHtml = (html: string): string => {
    if (!html || typeof html !== "string") return ""

    try {
      const wrapper = document.createElement("div")
      wrapper.innerHTML = html

      const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_ELEMENT, null)
      const toRemove: Element[] = []

      while (walker.nextNode()) {
        const el = walker.currentNode as Element
        const tag = el.tagName.toLowerCase()

        // Remove disallowed tags
        if (!SECURITY_CONFIG.ALLOWED_TAGS.has(tag)) {
          toRemove.push(el)
          continue
        }

        // Sanitize attributes
        for (const attr of Array.from(el.attributes)) {
          const attrName = attr.name.toLowerCase()
          const attrValue = attr.value

          // Remove all attributes except allowed ones
          if (
            !SECURITY_CONFIG.ALLOWED_ATTRIBUTES["*"].includes(attrName) &&
            !(SECURITY_CONFIG.ALLOWED_ATTRIBUTES[tag] && SECURITY_CONFIG.ALLOWED_ATTRIBUTES[tag].includes(attrName))
          ) {
            el.removeAttribute(attr.name)
            continue
          }

          // Special handling for href attributes
          if (attrName === "href") {
            if (SECURITY_CONFIG.DANGEROUS_PROTOCOLS.test(attrValue)) {
              el.removeAttribute("href")
            } else {
              // Ensure external links are safe
              try {
                const url = new URL(attrValue, window.location.origin)
                if (url.protocol !== "http:" && url.protocol !== "https:" && url.protocol !== "mailto:") {
                  el.removeAttribute("href")
                }
              } catch {
                // Invalid URL, remove attribute
                el.removeAttribute("href")
              }
            }
          }
        }
      }

      // Remove dangerous elements
      toRemove.forEach((n) => n.replaceWith(...Array.from(n.childNodes)))

      return wrapper.innerHTML
    } catch (error) {
      console.error("HTML sanitization failed:", error)
      return escapeHtml(html) // Fallback to complete escaping
    }
  }

  const generatedStyles = (opts: DesignOptions) => {
    const density = opts.optDensity === "compact" ? "8px 12px" : "12px 16px"
    const shaded = opts.optBorders === "shaded"
    const sanitizedCss = sanitizeCss(opts.optCustomCss || "")

    return `<style>
:root{ --font:${escapeHtml(opts.optFont)}; --accent:${escapeHtml(opts.optAccent)}; --green:#27c08a; --yellow:#f4c542; --red:#e5534b; --border:#dcdcdc; --soft:#f7f7f7; --text:#111;}
body{font-family:var(--font);color:var(--text);line-height:1.45;max-width:800px;margin:0 auto;padding:20px}
.summary-table{width:100%;border-collapse:collapse;margin:8px 0 16px}
.summary-table th,.summary-table td{border:${shaded ? "0" : "1px solid var(--border)"};padding:${density};vertical-align:top}
.summary-table th{background:var(--soft);font-weight:700;text-align:center;white-space:nowrap}
.program-title{background:#e5e7eb;font-weight:700;text-align:center;padding:${density}}
${shaded ? ".summary-table tr:nth-child(even){background:#fbfbfb}" : ""}
.center{text-align:center}.name-cell{font-weight:700;text-align:center}
.pill{display:inline-block;padding:6px 12px;border-radius:10px;font-weight:700;color:#fff}
.pill.green{background:var(--green)}.pill.yellow{background:var(--yellow);color:#111}.pill.red{background:var(--red)}
${sanitizedCss}
</style>`
  }

  const buildEmailHtml = (data: FormData, opts: DesignOptions) => {
    const asOf = data.asOf
      ? (() => {
          const [year, month, day] = data.asOf.split("-").map(Number)
          const date = new Date(year, month - 1, day) // month is 0-indexed
          return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
        })()
      : ""

    const processUpdatesHtml = (html: string) => {
      if (!html) return html

      // Add zebra striping and alignment to table cells
      return html
        .replace(/<td([^>]*)>/g, (match, attributes) => {
          // Extract existing style if any
          const styleMatch = attributes.match(/style="([^"]*)"/)
          const existingStyle = styleMatch ? styleMatch[1] : ""

          // Add left/top alignment to all cells
          const newStyle = `text-align: left; vertical-align: top; ${existingStyle}`

          if (attributes.includes("style=")) {
            return `<td${attributes.replace(/style="[^"]*"/, `style="${newStyle}"`)}>`
          } else {
            return `<td${attributes} style="${newStyle}">`
          }
        })
        .replace(/<tr([^>]*)>/g, (match, attributes, offset, string) => {
          // Count previous tr tags to determine row number for zebra striping
          const previousTrs = string.substring(0, offset).match(/<tr/g) || []
          const rowIndex = previousTrs.length

          // Extract existing style if any
          const styleMatch = attributes.match(/style="([^"]*)"/)
          const existingStyle = styleMatch ? styleMatch[1] : ""

          const backgroundColor = rowIndex % 2 === 1 ? "#f9f9f9" : "#ffffff"
          const newStyle = `background-color: ${backgroundColor}; ${existingStyle}`

          if (attributes.includes("style=")) {
            return `<tr${attributes.replace(/style="[^"]*"/, `style="${newStyle}"`)}>`
          } else {
            return `<tr${attributes} style="${newStyle}">`
          }
        })
    }

    const updatesBlock =
      data.updatesHtml && data.updatesHtml.trim()
        ? `<h2 style="color: #333; font-family: ${opts.optFont}, sans-serif; margin: 20px 0 10px 0;">Updates</h2>${
            data.sectionTitle
              ? `<h3 style="color: #333; font-family: ${opts.optFont}, sans-serif; margin: 10px 0 8px 0; font-size: 18px;">${escapeHtml(data.sectionTitle)}</h3>`
              : ""
          }${data.updatesHtml}`
        : ""

    const tableStyle = `border-collapse: collapse; width: 100%; margin: 10px 0; font-family: ${opts.optFont}, sans-serif;`
    const cellStyle = `border: 1px solid #dcdcdc; padding: 12px; text-align: left; vertical-align: top;`
    const headerStyle = `${cellStyle} background-color: #f7f7f7; font-weight: bold; text-align: center;`
    const centerStyle = `${cellStyle} text-align: center;`
    const titleStyle = `${cellStyle} background-color: #e5e7eb; font-weight: bold; text-align: center;`
    const nameStyle = `${cellStyle} font-weight: bold; text-align: center;`
    const evenRowStyle = `${cellStyle} background-color: #f9f9f9;`
    const oddRowStyle = `${cellStyle} background-color: #ffffff;`

    const emailPill = (status: string) => {
      const colors = {
        green: { bg: "#27c08a", color: "#fff" },
        yellow: { bg: "#f4c542", color: "#111" },
        red: { bg: "#e5534b", color: "#fff" },
      }
      const color = colors[status as keyof typeof colors] || colors.green
      return `<span style="display: inline-block; padding: 6px 12px; border-radius: 10px; font-weight: bold; background-color: ${color.bg}; color: ${color.color};">${escapeHtml(status)}</span>`
    }

    return `<div style="font-family: ${opts.optFont}, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #111; line-height: 1.45;">
<table style="${tableStyle}">
<tr><td style="${titleStyle}" colspan="2">${data.programTitle || "Your Program/Project Title here"}</td></tr>
<tr><td style="${evenRowStyle}">${nlToParas(data.programSummary)}</td></tr>
</table>
<table style="${tableStyle}">
<tr><th style="${headerStyle}">Last Status</th><th style="${headerStyle}">Current Status</th><th style="${headerStyle}">Trending</th><th style="${headerStyle}">Date</th></tr>
<tr><td style="${evenRowStyle} text-align: center;">${emailPill(data.lastStatus)}</td><td style="${evenRowStyle} text-align: center;">${emailPill(data.currentStatus)}</td><td style="${evenRowStyle} text-align: center;">${emailPill(data.trending)}</td><td style="${evenRowStyle} text-align: center;">${escapeHtml(asOf)}</td></tr>
</table>
<table style="${tableStyle}">
<tr><th style="${headerStyle}">TPM</th><th style="${headerStyle}">Engineering DRI</th><th style="${headerStyle}">Business Sponsor</th><th style="${headerStyle}">Engineering Sponsor</th></tr>
<tr><td style="${evenRowStyle} font-weight: bold; text-align: center;">${escapeHtml(data.tpm)}</td><td style="${evenRowStyle} font-weight: bold; text-align: center;">${escapeHtml(data.engDri)}</td><td style="${evenRowStyle} font-weight: bold; text-align: center;">${escapeHtml(data.bizSponsor)}</td><td style="${evenRowStyle} font-weight: bold; text-align: center;">${escapeHtml(data.engSponsor)}</td></tr>
</table>
${data.execSummary ? `<h2 style="color: #333; font-family: ${opts.optFont}, sans-serif; margin: 20px 0 10px 0;">Executive Summary</h2>${nlToParas(data.execSummary)}` : ""}
${data.lowlights ? `<h2 style="color: #333; font-family: ${opts.optFont}, sans-serif; margin: 20px 0 10px 0;">Lowlights</h2>${linesToList(data.lowlights)}` : ""}
${data.updatesHtml ? `<h2 style="color: #333; font-family: ${opts.optFont}, sans-serif; margin: 20px 0 10px 0;">Updates</h2>${processUpdatesHtml(data.updatesHtml)}` : ""}
</div>`
  }

  const buildHtml = (data: FormData, opts: DesignOptions) => {
    const asOf = data.asOf
      ? (() => {
          const [year, month, day] = data.asOf.split("-").map(Number)
          const date = new Date(year, month - 1, day) // month is 0-indexed
          return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
        })()
      : ""

    const pill = (val: string) => {
      const v = escapeHtml(val || "").toLowerCase()
      if (v === "red")
        return `<div style="display: inline-block; background-color: #e5534b; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold;">Red</div>`
      if (v === "yellow")
        return `<div style="display: inline-block; background-color: #f4c542; color: #111; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold;">Yellow</div>`
      return `<div style="display: inline-block; background-color: #4CAF50; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold;">Green</div>`
    }

    const processUpdatesHtml = (html: string) => {
      if (!html) return html

      // Add zebra striping and alignment to table cells
      return html
        .replace(/<td([^>]*)>/g, (match, attributes) => {
          // Extract existing style if any
          const styleMatch = attributes.match(/style="([^"]*)"/)
          const existingStyle = styleMatch ? styleMatch[1] : ""

          // Add left/top alignment to all cells
          const newStyle = `text-align: left; vertical-align: top; ${existingStyle}`

          if (attributes.includes("style=")) {
            return `<td${attributes.replace(/style="[^"]*"/, `style="${newStyle}"`)}>`
          } else {
            return `<td${attributes} style="${newStyle}">`
          }
        })
        .replace(/<tr([^>]*)>/g, (match, attributes, offset, string) => {
          // Count previous tr tags to determine row number for zebra striping
          const previousTrs = string.substring(0, offset).match(/<tr/g) || []
          const rowIndex = previousTrs.length

          // Extract existing style if any
          const styleMatch = attributes.match(/style="([^"]*)"/)
          const existingStyle = styleMatch ? styleMatch[1] : ""

          const backgroundColor = rowIndex % 2 === 1 ? "#f9f9f9" : "#ffffff"
          const newStyle = `background-color: ${backgroundColor}; ${existingStyle}`

          if (attributes.includes("style=")) {
            return `<tr${attributes.replace(/style="[^"]*"/, `style="${newStyle}"`)}>`
          } else {
            return `<tr${attributes} style="${newStyle}">`
          }
        })
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Status Report</title>
</head>
<body>
  <table style="width: 700px; margin: 0 auto; border-collapse: collapse; font-family: Arial, sans-serif;">
    <tr>
      <td>
        <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; margin: 0; padding: 0;">
          <tr>
            <td style="background-color: #E8E8E8; padding: 20px; text-align: center; border: 1px solid #CCCCCC;">
              <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #333333;">${data.programTitle || "Your Program/Project Title here"}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; border: 1px solid #CCCCCC; background-color: #FFFFFF;">
              <span style="margin: 0; font-size: 16px; line-height: 1.5; color: #333333;">${nlToParas(data.programSummary) || "Program summary description goes here."}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 25%; padding: 20px; text-align: center; border: 1px solid #CCCCCC; background-color: #F5F5F5;">
                    <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #333333;">Last Status</h3>
                    ${pill(data.lastStatus)}
                  </td>
                  <td style="width: 25%; padding: 20px; text-align: center; border: 1px solid #CCCCCC; background-color: #F5F5F5;">
                    <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #333333;">Current Status</h3>
                    ${pill(data.currentStatus)}
                  </td>
                  <td style="width: 25%; padding: 20px; text-align: center; border: 1px solid #CCCCCC; background-color: #F5F5F5;">
                    <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #333333;">Trending</h3>
                    ${pill(data.trending)}
                  </td>
                  <td style="width: 25%; padding: 20px; text-align: center; border: 1px solid #CCCCCC; background-color: #F5F5F5;">
                    <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #333333;">Date</h3>
                    <p style="margin: 0; font-size: 14px; color: #333333;">${escapeHtml(asOf)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 25%; padding: 20px; text-align: center; border: 1px solid #CCCCCC; background-color: #FFFFFF;">
                    <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #333333;">TPM</h3>
                    <p style="margin: 0; font-size: 16px; color: #333333;">${escapeHtml(data.tpm) || "Name"}</p>
                  </td>
                  <td style="width: 25%; padding: 20px; text-align: center; border: 1px solid #CCCCCC; background-color: #FFFFFF;">
                    <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #333333;">Engineering DRI</h3>
                    <p style="margin: 0; font-size: 16px; color: #333333;">${escapeHtml(data.engDri) || "Name"}</p>
                  </td>
                  <td style="width: 25%; padding: 20px; text-align: center; border: 1px solid #CCCCCC; background-color: #FFFFFF;">
                    <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #333333;">Business Sponsor</h3>
                    <p style="margin: 0; font-size: 16px; color: #333333;">${escapeHtml(data.bizSponsor) || "Name"}</p>
                  </td>
                  <td style="width: 25%; padding: 20px; text-align: center; border: 1px solid #CCCCCC; background-color: #FFFFFF;">
                    <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #333333;">Engineering Sponsor</h3>
                    <p style="margin: 0; font-size: 16px; color: #333333;">${escapeHtml(data.engSponsor) || "Name"}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${
            data.execSummary
              ? `<tr>
            <td style="padding: 20px; border: 1px solid #CCCCCC; background-color: #FFFFFF;">
              <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #333333;">Executive Summary</h3>
              <div style="margin: 0; font-size: 16px; color: #333333;">${nlToParas(data.execSummary)}</div>
            </td>
          </tr>`
              : ""
          }
          ${
            data.lowlights
              ? `<tr>
            <td style="padding: 20px; border: 1px solid #CCCCCC; background-color: #FFFFFF;">
              <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #333333;">Lowlights</h3>
              <div style="margin: 0; font-size: 16px; color: #333333;">${linesToList(data.lowlights)}</div>
            </td>
          </tr>`
              : ""
          }
          ${
            data.updatesHtml && data.updatesHtml.trim()
              ? `<tr>
            <td style="padding: 20px; border: 1px solid #CCCCCC; background-color: #FFFFFF;">
              <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #333333;">Updates</h3>
              ${
                data.sectionTitle
                  ? `<h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #333333;">${escapeHtml(data.sectionTitle)}</h4>`
                  : ""
              }
              <div style="margin: 0; font-size: 16px; color: #333333;">${processUpdatesHtml(data.updatesHtml)}</div>
            </td>
          </tr>`
              : ""
          }
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }

  const emailReport = async () => {
    if (!formData.emailTo.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address first.",
        variant: "destructive",
      })
      return
    }

    setIsEmailing(true)
    try {
      let htmlToSend = generatedHtml
      if (!htmlToSend) {
        htmlToSend = await generate()
      }

      console.log("[v0] Sending email to:", formData.emailTo.trim())
      console.log("[v0] HTML length:", htmlToSend?.length || 0)

      const response = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: formData.emailTo.trim(),
          html: htmlToSend,
          subject: formData.programTitle || "Status Report",
        }),
      })

      console.log("[v0] API response status:", response.status)
      console.log("[v0] API response ok:", response.ok)

      if (!response.ok) {
        const errorData = await response.text()
        console.log("[v0] API error response:", errorData)
        throw new Error(`API returned ${response.status}: ${errorData}`)
      }

      const result = await response.json()
      console.log("[v0] Email sent successfully:", result)

      toast({
        title: "Email Sent",
        description: `Report sent successfully to ${formData.emailTo}`,
      })
    } catch (error) {
      console.error("[v0] Email error details:", error)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack)

      toast({
        title: "Email Failed",
        description: `Failed to send email: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsEmailing(false)
    }
  }

  const generate = async () => {
    setIsGenerating(true)
    setSecurityWarnings([])
    try {
      const html = buildHtml(formData, designOptions)
      // Format HTML for better readability in code view
      const formattedHtml = formatHtml(html)
      setGeneratedHtml(formattedHtml)
      return formattedHtml // Return the generated HTML
    } catch (error) {
      console.error("HTML generation error:", error)
      toast({
        title: "Generation failed",
        description: "There was an error generating the HTML. Please check your inputs.",
        variant: "destructive",
      })
      return "" // Return empty string on error
    } finally {
      setIsGenerating(false)
    }
  }

  const formatHtml = (html: string) => {
    // Basic HTML formatting for better readability
    return html.replace(/></g, ">\n<").replace(/(<\/?)(\w+)([^>]*>)/g, (match, p1, p2, p3) => {
      if (["table", "tr", "th", "td", "h1", "h2", "p", "ul", "li"].includes(p2)) {
        return `${p1}${p2}${p3}`
      }
      return match
    })
  }

  const copyHtml = async () => {
    if (!generatedHtml) await generate()

    setIsCopying(true)
    try {
      await navigator.clipboard.writeText(generatedHtml)
      toast({
        title: "HTML copied to clipboard!",
        description: "The generated HTML is ready to paste.",
        duration: 2000,
      })
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      try {
        const textArea = document.createElement("textarea")
        textArea.value = generatedHtml
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        toast({ title: "HTML copied to clipboard!" })
      } catch (fallbackError) {
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

  const copyForEmail = async () => {
    if (!generatedHtml) return

    setCopyEmailLoading(true)
    try {
      // Use the Clipboard API
      const blob = new Blob([generatedHtml], { type: "text/html" })
      const clipboardItem = new ClipboardItem({ "text/html": blob })
      await navigator.clipboard.write([clipboardItem])

      setCopyEmailFeedback("Copied formatted content for email!")
      setTimeout(() => setCopyEmailFeedback(""), 2000)
    } catch (error) {
      console.error("Failed to copy for email:", error)
      setCopyEmailFeedback("Failed to copy")
      setTimeout(() => setCopyEmailFeedback(""), 2000)
    } finally {
      setCopyEmailLoading(false)
    }
  }
  const copyRenderedContent = async () => {
    setIsCopyingRendered(true)
    try {
      // Use buildEmailHtml which has inline styles that work better in email clients
      const emailHtml = buildEmailHtml(formData, designOptions)

      // Create a temporary element with the email-formatted content
      const tempDiv = document.createElement("div")
      tempDiv.innerHTML = emailHtml
      tempDiv.style.position = "absolute"
      tempDiv.style.left = "-9999px"
      document.body.appendChild(tempDiv)

      // Select and copy the content
      const range = document.createRange()
      range.selectNodeContents(tempDiv)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)

      const success = document.execCommand("copy")

      // Clean up
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
    console.log("[v0] Download button clicked")
    let htmlToDownload = generatedHtml
    console.log("[v0] Current generatedHtml length:", htmlToDownload?.length || 0)

    // If no HTML is generated yet, generate it first
    if (!htmlToDownload) {
      console.log("[v0] No HTML found, generating...")
      htmlToDownload = await generate()
    }

    // If still no HTML (generation failed), don't proceed
    if (!htmlToDownload) {
      console.log("[v0] No HTML available for download")
      return
    }

    console.log("[v0] Starting download process")
    setIsDownloading(true)
    try {
      const blob = new Blob([htmlToDownload], { type: "text/html;charset=utf-8" })
      console.log("[v0] Blob created, size:", blob.size)

      const url = URL.createObjectURL(blob)
      const filename = `status-report-${new Date().toISOString().split("T")[0]}.html`

      // Try the modern approach first
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        // IE/Edge
        window.navigator.msSaveOrOpenBlob(blob, filename)
        console.log("[v0] Downloaded using IE/Edge method")
      } else {
        // Modern browsers
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = filename
        a.target = "_blank"

        document.body.appendChild(a)
        console.log("[v0] Anchor element created and added to DOM")

        // Force click with multiple methods for better compatibility
        a.click()
        console.log("[v0] Anchor clicked")

        // If programmatic download doesn't work (like in v0 environment), open in new window
        setTimeout(() => {
          // Check if download worked by seeing if the blob URL is still accessible
          fetch(url)
            .then(() => {
              // If we can still fetch it, the download might not have worked
              // Open in new window as fallback
              const newWindow = window.open()
              if (newWindow) {
                newWindow.document.write(htmlToDownload)
                newWindow.document.close()
                toast({
                  title: "HTML opened in new window",
                  description: "Use Ctrl+S (Cmd+S on Mac) to save the file from the new window.",
                  duration: 4000,
                })
              }
            })
            .catch(() => {
              // URL was revoked, download likely worked
              toast({
                title: "HTML file downloaded!",
                description: "Your status report has been saved to your downloads folder.",
                duration: 2000,
              })
            })
        }, 500)

        // Cleanup after a short delay to ensure download starts
        setTimeout(() => {
          if (document.body.contains(a)) {
            document.body.removeChild(a)
          }
          URL.revokeObjectURL(url)
          console.log("[v0] Cleanup completed")
        }, 1000)
      }

      console.log("[v0] Download completed successfully")
    } catch (error) {
      console.log("[v0] Download error:", error)
      // Fallback: open in new window
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
      } catch (fallbackError) {
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
    } catch (error) {
      toast({
        title: "Reset failed",
        description: "There was an error clearing saved data.",
        variant: "destructive",
      })
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
      // Handle contentEditable div
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)
      if (!element.contains(range.commonAncestorContainer)) return

      const selectedText = range.toString()
      if (selectedText) {
        const wrapper = document.createElement(tag)
        try {
          range.surroundContents(wrapper)
          selection.removeAllRanges()
          updateFormData(targetField, element.innerHTML)
        } catch (e) {
          // Fallback for complex selections
          const content = range.extractContents()
          wrapper.appendChild(content)
          range.insertNode(wrapper)
          selection.removeAllRanges()
          updateFormData(targetField, element.innerHTML)
        }
      }
    }
    generate()
  }

  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto"
    textarea.style.height = Math.min(textarea.scrollHeight, 300) + "px"
  }

  const handleUpdatesInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target && target.innerHTML !== undefined) {
      updateFormData("updatesHtml", target.innerHTML)
    }
  }

  const handleUpdatesBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target && target.innerHTML !== undefined) {
      updateFormData("updatesHtml", target.innerHTML)
    }
  }

  const handleUpdatesPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const paste = e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain")
    if (paste) {
      document.execCommand("insertHTML", false, paste)
      const target = e.currentTarget
      if (target) {
        updateFormData("updatesHtml", target.innerHTML)
      }
    }
  }

  useEffect(() => {
    if (updatesRef.current && updatesRef.current.innerHTML !== formData.updatesHtml) {
      updatesRef.current.innerHTML = formData.updatesHtml
    }
  }, [formData.updatesHtml])

  const sendEmailReport = emailReport

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
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
                  <Label htmlFor="programTitle" className="text-sm font-medium">
                    Program Title
                  </Label>
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
                  <Label htmlFor="programSummary" className="text-sm font-medium">
                    Program Summary
                  </Label>
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
                    <Label htmlFor="lastStatus" className="text-sm font-medium">
                      Last Status
                    </Label>
                    <Select value={formData.lastStatus} onValueChange={(value) => updateFormData("lastStatus", value)}>
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="currentStatus" className="text-sm font-medium">
                      Current Status
                    </Label>
                    <Select
                      value={formData.currentStatus}
                      onValueChange={(value) => updateFormData("currentStatus", value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="trending" className="text-sm font-medium">
                      Trending
                    </Label>
                    <Select value={formData.trending} onValueChange={(value) => updateFormData("trending", value)}>
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="asOf" className="text-sm font-medium">
                      As of Date
                    </Label>
                    <Input
                      id="asOf"
                      type="date"
                      value={formData.asOf}
                      onChange={(e) => updateFormData("asOf", e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </div>

                {/* Team Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tpm" className="text-sm font-medium">
                      TPM
                    </Label>
                    <Input
                      id="tpm"
                      placeholder="Technical Program Manager"
                      value={formData.tpm}
                      onChange={(e) => updateFormData("tpm", e.target.value)}
                      maxLength={SECURITY_CONFIG.MAX_FIELD_LENGTH}
                      className="bg-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="engDri" className="text-sm font-medium">
                      Engineering DRI
                    </Label>
                    <Input
                      id="engDri"
                      placeholder="Engineering Lead"
                      value={formData.engDri}
                      onChange={(e) => updateFormData("engDri", e.target.value)}
                      maxLength={SECURITY_CONFIG.MAX_FIELD_LENGTH}
                      className="bg-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bizSponsor" className="text-sm font-medium">
                      Business Sponsor
                    </Label>
                    <Input
                      id="bizSponsor"
                      placeholder="Business Stakeholder"
                      value={formData.bizSponsor}
                      onChange={(e) => updateFormData("bizSponsor", e.target.value)}
                      maxLength={SECURITY_CONFIG.MAX_FIELD_LENGTH}
                      className="bg-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="engSponsor" className="text-sm font-medium">
                      Engineering Sponsor
                    </Label>
                    <Input
                      id="engSponsor"
                      placeholder="Engineering Stakeholder"
                      value={formData.engSponsor}
                      onChange={(e) => updateFormData("engSponsor", e.target.value)}
                      maxLength={SECURITY_CONFIG.MAX_FIELD_LENGTH}
                      className="bg-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emailTo" className="text-sm font-medium">
                      Email To
                    </Label>
                    <Input
                      id="emailTo"
                      type="email"
                      placeholder="recipient@example.com"
                      value={formData.emailTo}
                      onChange={(e) => updateFormData("emailTo", e.target.value)}
                      maxLength={SECURITY_CONFIG.MAX_FIELD_LENGTH}
                      className="bg-white"
                    />
                  </div>
                </div>

                {/* Executive Summary */}
                <div>
                  <Label htmlFor="execSummary" className="text-sm font-medium">
                    Executive Summary
                  </Label>
                  <div className="flex gap-1 mt-1.5 mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => wrapSelection("execSummary", "b")}
                      className="h-8 px-2"
                    >
                      <Bold className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => wrapSelection("execSummary", "i")}
                      className="h-8 px-2"
                    >
                      <Italic className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => wrapSelection("execSummary", "u")}
                      className="h-8 px-2"
                    >
                      <Underline className="w-3 h-3" />
                    </Button>
                  </div>
                  <Textarea
                    id="execSummary"
                    placeholder="Key outcomes and results…"
                    value={formData.execSummary}
                    onChange={(e) => {
                      updateFormData("execSummary", e.target.value)
                      autoResize(e.target)
                    }}
                    onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                    maxLength={SECURITY_CONFIG.MAX_FIELD_LENGTH}
                    className="resize-none bg-white min-h-[80px]"
                    style={{ height: "auto" }}
                  />
                </div>

                {/* Lowlights */}
                <div>
                  <Label htmlFor="lowlights" className="text-sm font-medium">
                    Lowlights (one per line)
                  </Label>
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
                  <Label className="text-sm font-medium">Updates</Label>
                  <div className="mt-2 mb-3">
                    <Label className="text-xs text-gray-600">Section Title (optional)</Label>
                    <Input
                      type="text"
                      value={formData.sectionTitle}
                      onChange={(e) => updateFormData("sectionTitle", e.target.value)}
                      placeholder="Security, Automation, Project Track Name, etc."
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div className="flex gap-1 mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => wrapSelection("updatesHtml", "b")}
                      className="h-8 px-2"
                    >
                      <Bold className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => wrapSelection("updatesHtml", "i")}
                      className="h-8 px-2"
                    >
                      <Italic className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => wrapSelection("updatesHtml", "u")}
                      className="h-8 px-2"
                    >
                      <Underline className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateFormData("updatesHtml", "")
                        if (updatesRef.current) {
                          updatesRef.current.innerHTML = ""
                        }
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
                    style={{
                      lineHeight: "1.5",
                      overflowX: "auto",
                      maxWidth: "100%",
                    }}
                    onInput={handleUpdatesInput}
                    onBlur={handleUpdatesBlur}
                    onPaste={handleUpdatesPaste}
                    data-placeholder="Paste tables, add formatted text, or type updates here..."
                    suppressContentEditableWarning={true}
                  />
                  <style jsx>{`
                    [contenteditable]:empty:before {
                      content: attr(data-placeholder);
                      color: #6b7280;
                      pointer-events: none;
                    }

                    [contenteditable] table {
                      border-collapse: collapse;
                      width: 100%;
                      margin: 8px 0;
                      font-size: 14px;
                    }

                    [contenteditable] table th,
                    [contenteditable] table td {
                      border: 1px solid #ddd;
                      padding: 8px 12px;
                      text-align: left;
                      vertical-align: top;
                    }

                    [contenteditable] table th {
                      background-color: #f5f5f5;
                      font-weight: bold;
                    }

                    [contenteditable] table tr:nth-child(even) {
                      background-color: #f9f9f9;
                    }
                  `}</style>
                </div>
              </CardContent>
            </Card>

            {/* Design Options */}
            <Card>
              <CardHeader>
                <CardTitle>Design Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="optFont" className="text-sm font-medium">
                    Font Family
                  </Label>
                  <Select
                    value={designOptions.optFont}
                    onValueChange={(value) => updateDesignOptions("optFont", value)}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="optAccent" className="text-sm font-medium">
                    Accent Color
                  </Label>
                  <Input
                    id="optAccent"
                    type="color"
                    value={designOptions.optAccent}
                    onChange={(e) => updateDesignOptions("optAccent", e.target.value)}
                    className="bg-white h-10"
                  />
                </div>

                <div>
                  <Label htmlFor="optDensity" className="text-sm font-medium">
                    Density
                  </Label>
                  <Select
                    value={designOptions.optDensity}
                    onValueChange={(value) => updateDesignOptions("optDensity", value)}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="optBorders" className="text-sm font-medium">
                    Table Style
                  </Label>
                  <Select
                    value={designOptions.optBorders}
                    onValueChange={(value) => updateDesignOptions("optBorders", value)}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lines">Lines</SelectItem>
                      <SelectItem value="shaded">Shaded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="optCustomCss" className="text-sm font-medium">
                    Custom CSS
                  </Label>
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
                  <Button onClick={generate} disabled={isGenerating} className="flex-1 min-w-[120px]">
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    Generate
                  </Button>
                  <Button
                    onClick={copyHtml}
                    disabled={isCopying}
                    variant="outline"
                    className="flex-1 min-w-[120px] bg-transparent"
                  >
                    {isCopying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
                    Copy HTML
                  </Button>
                  <Button
                    onClick={copyRenderedContent}
                    disabled={copyRenderedLoading}
                    variant="outline"
                    className="flex-1 min-w-[120px] bg-transparent"
                  >
                    {copyRenderedLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    {copyRenderedFeedback || "Copy for Email"}
                  </Button>
                  <Button
                    onClick={downloadHtml}
                    disabled={isDownloading}
                    variant="outline"
                    className="flex-1 min-w-[120px] bg-transparent"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download
                  </Button>
                  <Button
                    onClick={emailReport}
                    disabled={isEmailing}
                    variant="default"
                    className="flex-1 min-w-[120px]"
                  >
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
                    <Button
                      variant={previewMode === "preview" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewMode("preview")}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant={previewMode === "code" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewMode("code")}
                    >
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
          </div>
        </div>
      </div>
    </div>
  )
}
