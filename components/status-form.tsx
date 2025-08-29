"use client"

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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FormData {
  programSummary: string
  lastStatus: string
  currentStatus: string
  trending: string
  asOf: string
  tpm: string
  engDri: string
  bizSponsor: string
  engSponsor: string
  execSummary: string
  lowlights: string
  updatesTrack: string
  updatesTeam: string
  updatesHtml: string
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
    programSummary: "",
    lastStatus: "Green",
    currentStatus: "Green",
    trending: "Green",
    asOf: "",
    tpm: "",
    engDri: "",
    bizSponsor: "",
    engSponsor: "",
    execSummary: "",
    lowlights: "",
    updatesTrack: "",
    updatesTeam: "",
    updatesHtml: "",
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
    return parts.map((p) => `<p>${safeInline(p).replace(/\n/g, "<br>")}</p>`).join("\n")
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
    const density = opts.optDensity === "compact" ? "8px 10px" : "12px 14px"
    const shaded = opts.optBorders === "shaded"
    const sanitizedCss = sanitizeCss(opts.optCustomCss || "")

    return `<style>
:root{ --font:${escapeHtml(opts.optFont)}; --accent:${escapeHtml(opts.optAccent)}; --green:#27c08a; --yellow:#f4c542; --red:#e5534b; --border:#dcdcdc; --soft:#f7f7f7; --text:#111;}
body{font-family:var(--font);color:var(--text);line-height:1.45}
.summary-table{width:100%;border-collapse:collapse;margin:8px 0 16px}
.summary-table th,.summary-table td{border:${shaded ? "0" : "1px solid var(--border)"};padding:${density};vertical-align:top}
.summary-table th{background:var(--soft);font-weight:700;text-align:center;white-space:nowrap}
${shaded ? ".summary-table tr:nth-child(even){background:#fbfbfb}" : ""}
.center{text-align:center}.name-cell{font-weight:700;text-align:center}
.pill{display:inline-block;padding:6px 12px;border-radius:10px;font-weight:700;color:#fff}
.pill.green{background:var(--green)}.pill.yellow{background:var(--yellow);color:#111}.pill.red{background:var(--red)}
${sanitizedCss}
</style>`
  }

  const buildHtml = (data: FormData, opts: DesignOptions) => {
    const asOf = data.asOf
      ? new Date(data.asOf).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
      : ""

    const updatesBlock = data.updatesHtml && data.updatesHtml.trim() ? `<h2>Updates</h2>${data.updatesHtml}` : ""

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>${generatedStyles(opts)}<title>Status Report</title></head><body>
<table class="summary-table"><tr><th>Program Summary</th><td>${nlToParas(data.programSummary)}</td></tr></table>
<table class="summary-table"><tr><th>Last Status</th><th>Current Status</th><th>Trending</th><th>Date</th></tr>
<tr><td class="center">${pill(data.lastStatus)}</td><td class="center">${pill(data.currentStatus)}</td><td class="center">${pill(data.trending)}</td><td class="center">${escapeHtml(asOf)}</td></tr></table>
<table class="summary-table"><tr><th>TPM</th><th>Engineering DRI</th><th>Business Sponsor</th><th>Engineering Sponsor</th></tr>
<tr><td class="name-cell">${escapeHtml(data.tpm)}</td><td class="name-cell">${escapeHtml(data.engDri)}</td><td class="name-cell">${escapeHtml(data.bizSponsor)}</td><td class="name-cell">${escapeHtml(data.engSponsor)}</td></tr></table>
${data.execSummary ? `<h2>Executive Summary</h2>${nlToParas(data.execSummary)}` : ""}
${data.lowlights ? `<h2>Lowlights</h2>${linesToList(data.lowlights)}` : ""}
${updatesBlock}
</body></html>`
  }

  const generate = async () => {
    setIsGenerating(true)
    setSecurityWarnings([])
    try {
      const html = buildHtml(formData, designOptions)
      // Format HTML for better readability in code view
      const formattedHtml = formatHtml(html)
      setGeneratedHtml(formattedHtml)
    } catch (error) {
      console.error("HTML generation error:", error)
      toast({
        title: "Generation failed",
        description: "There was an error generating the HTML. Please check your inputs.",
        variant: "destructive",
      })
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

  const downloadHtml = async () => {
    if (!generatedHtml) await generate()

    setIsDownloading(true)
    try {
      const blob = new Blob([generatedHtml], { type: "text/html;charset=utf-8" })
      const a = document.createElement("a")
      const url = URL.createObjectURL(blob)
      a.href = url
      a.download = `status-report-${new Date().toISOString().split("T")[0]}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "HTML file downloaded!",
        description: "Your status report has been saved to your downloads folder.",
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading the file. Please try again.",
        variant: "destructive",
      })
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
    const textarea = document.getElementById(targetField) as HTMLTextAreaElement
    if (!textarea) return

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
    generate()
  }

  const pastePlainText = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const escaped = escapeHtml(text).replace(/\n/g, "<br>")
      updateFormData("updatesHtml", `<p>${escaped}</p>`)
      generate()
    } catch (err) {
      toast({ title: "Failed to paste text", variant: "destructive" })
    }
  }

  const clearUpdates = () => {
    updateFormData("updatesTrack", "")
    updateFormData("updatesTeam", "")
    updateFormData("updatesHtml", "")
    try {
      localStorage.removeItem(PERSIST_PREFIX + "updatesTrack")
      localStorage.removeItem(PERSIST_PREFIX + "updatesTeam")
      localStorage.removeItem(PERSIST_PREFIX + "updatesHtml")
    } catch (error) {
      console.error("Failed to clear updates from localStorage:", error)
    }
    generate()
  }

  const clearSecurityWarnings = () => {
    setSecurityWarnings([])
  }

  useEffect(() => {
    if (updatesRef.current) {
      console.log("[v0] useEffect - Current innerHTML length:", updatesRef.current.innerHTML.length)
      console.log("[v0] useEffect - FormData length:", formData.updatesHtml.length)
      console.log("[v0] useEffect - Setting innerHTML to:", formData.updatesHtml.substring(0, 100) + "...")
      updatesRef.current.innerHTML = formData.updatesHtml
    }
  }, [formData.updatesHtml])

  const handleUpdatesInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (!e.currentTarget) return
    const content = e.currentTarget.innerHTML
    console.log("[v0] Updates content changed:", content.substring(0, 200) + "...")
    updateFormData("updatesHtml", content)
  }

  const handleUpdatesBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget) return
    const content = e.currentTarget.innerHTML
    console.log("[v0] Updates blur event:", content.substring(0, 200) + "...")
    updateFormData("updatesHtml", content)
  }

  const handleUpdatesPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    console.log("[v0] Paste event triggered")
    requestAnimationFrame(() => {
      if (e.currentTarget) {
        const content = e.currentTarget.innerHTML
        console.log("[v0] Updates paste processed:", content.substring(0, 200) + "...")
        console.log("[v0] Full paste content length:", content.length)
        updateFormData("updatesHtml", content)
        generate()
      }
    })
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generate()
    }, 300) // Debounce to avoid excessive generation

    return () => clearTimeout(timeoutId)
  }, [formData, designOptions])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {isGenerating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : generatedHtml ? (
              <CheckCircle className="w-3 h-3 text-green-500" />
            ) : (
              <div className="w-3 h-3 border border-muted-foreground/30 rounded-full" />
            )}
            <span>{isGenerating ? "Generating..." : generatedHtml ? "Report ready" : "Fill form to generate"}</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs">
          <span>{Object.values(formData).filter((v) => v.trim()).length}/13 fields completed</span>
          <span>•</span>
          <span>Last saved: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[440px_1fr] gap-6">
        {/* Left: Form */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Content & Design</CardTitle>
              {securityWarnings.length > 0 && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
            </div>
            {securityWarnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">Security Notice</h4>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {securityWarnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSecurityWarnings}
                      className="mt-2 h-6 text-xs text-yellow-800 hover:text-yellow-900"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground border-b border-border pb-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Program Information
              </div>

              <div>
                <Label htmlFor="programSummary" className="text-sm font-medium">
                  Program Summary
                </Label>
                <Textarea
                  id="programSummary"
                  placeholder="Describe what your program/project is responsible for…"
                  value={formData.programSummary}
                  onChange={(e) => updateFormData("programSummary", e.target.value)}
                  rows={4}
                  maxLength={SECURITY_CONFIG.MAX_FIELD_LENGTH}
                  className="mt-1.5 resize-none"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formData.programSummary.length}/{SECURITY_CONFIG.MAX_FIELD_LENGTH}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground border-b border-border pb-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Status Indicators
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="lastStatus" className="text-sm font-medium">
                    Last Status
                  </Label>
                  <Select value={formData.lastStatus} onValueChange={(value) => updateFormData("lastStatus", value)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                status === "Green"
                                  ? "bg-green-500"
                                  : status === "Yellow"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                            />
                            {status}
                          </div>
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
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                status === "Green"
                                  ? "bg-green-500"
                                  : status === "Yellow"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                            />
                            {status}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="trending" className="text-sm font-medium">
                    Trending
                  </Label>
                  <Select value={formData.trending} onValueChange={(value) => updateFormData("trending", value)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                status === "Green"
                                  ? "bg-green-500"
                                  : status === "Yellow"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                            />
                            {status}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="asOf" className="text-sm font-medium">
                    As of (date)
                  </Label>
                  <Input
                    id="asOf"
                    type="date"
                    value={formData.asOf}
                    onChange={(e) => updateFormData("asOf", e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground border-b border-border pb-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Team & Ownership
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="tpm" className="text-sm font-medium">
                    TPM
                  </Label>
                  <Input
                    id="tpm"
                    placeholder="Nick Adams"
                    value={formData.tpm}
                    onChange={(e) => updateFormData("tpm", e.target.value)}
                    maxLength={200}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="engDri" className="text-sm font-medium">
                    Engineering DRI
                  </Label>
                  <Input
                    id="engDri"
                    placeholder="Antony Alexander"
                    value={formData.engDri}
                    onChange={(e) => updateFormData("engDri", e.target.value)}
                    maxLength={200}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bizSponsor" className="text-sm font-medium">
                    Business Sponsor
                  </Label>
                  <Input
                    id="bizSponsor"
                    placeholder="Niha Mathur"
                    value={formData.bizSponsor}
                    onChange={(e) => updateFormData("bizSponsor", e.target.value)}
                    maxLength={200}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="engSponsor" className="text-sm font-medium">
                    Engineering Sponsor
                  </Label>
                  <Input
                    id="engSponsor"
                    placeholder="Suchreet Dhaliwal"
                    value={formData.engSponsor}
                    onChange={(e) => updateFormData("engSponsor", e.target.value)}
                    maxLength={200}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground border-b border-border pb-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Content Details
              </div>

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
                  onChange={(e) => updateFormData("execSummary", e.target.value)}
                  rows={3}
                  maxLength={SECURITY_CONFIG.MAX_FIELD_LENGTH}
                  className="resize-none"
                />
              </div>

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
                  className="mt-1.5 resize-none"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Updates</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5 mb-2">
                  <div>
                    <Label htmlFor="updatesTrack" className="text-xs text-muted-foreground">
                      Track Name
                    </Label>
                    <Input
                      id="updatesTrack"
                      placeholder="Example: Network Security"
                      value={formData.updatesTrack}
                      onChange={(e) => updateFormData("updatesTrack", e.target.value)}
                      maxLength={200}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="updatesTeam" className="text-xs text-muted-foreground">
                      Team Members
                    </Label>
                    <Input
                      id="updatesTeam"
                      placeholder="Example: Ramakant, Cyrus"
                      value={formData.updatesTeam}
                      onChange={(e) => updateFormData("updatesTeam", e.target.value)}
                      maxLength={500}
                      className="mt-1"
                    />
                  </div>
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
                </div>
                <div
                  ref={updatesRef}
                  contentEditable
                  className="min-h-[120px] p-3 border border-input rounded-md bg-background text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:outline-none"
                  style={{
                    lineHeight: "1.5",
                    overflowX: "auto", // Keep overflow for wide tables
                    maxWidth: "100%", // Ensure container doesn't exceed bounds
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
                  
                  /* Enhanced table styling for better display */
                  [contenteditable] table {
                    border-collapse: collapse;
                    width: 100%;
                    max-width: 100%;
                    margin: 8px 0;
                    font-size: inherit;
                    table-layout: auto;
                    overflow-x: auto;
                    display: table;
                  }
                  
                  [contenteditable] table th,
                  [contenteditable] table td {
                    border: 1px solid #ddd;
                    padding: 8px 12px;
                    text-align: left;
                    vertical-align: top;
                    word-wrap: break-word;
                    max-width: 200px;
                  }

                  [contenteditable] table th {
                    background-color: #f5f5f5;
                    font-weight: 600;
                  }
                  
                  [contenteditable] table tr:nth-child(even) {
                    background-color: #fafafa;
                  }
                  
                  [contenteditable] h1,
                  [contenteditable] h2,
                  [contenteditable] h3,
                  [contenteditable] h4,
                  [contenteditable] h5,
                  [contenteditable] h6 {
                    margin: 16px 0 8px 0;
                    font-weight: 600;
                  }
                  
                  [contenteditable] p {
                    margin: 8px 0;
                  }
                  
                  [contenteditable] ul,
                  [contenteditable] ol {
                    margin: 8px 0;
                    padding-left: 20px;
                  }
                `}</style>
              </div>
            </div>

            {/* Design Panel */}
            <Card className="bg-muted/30 border-muted">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Design Customization
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="optFont" className="text-sm font-medium">
                      Font Family
                    </Label>
                    <Select
                      value={designOptions.optFont}
                      onValueChange={(value) => updateDesignOptions("optFont", value)}
                    >
                      <SelectTrigger className="mt-1.5">
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
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        id="optAccent"
                        type="color"
                        value={designOptions.optAccent}
                        onChange={(e) => updateDesignOptions("optAccent", e.target.value)}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={designOptions.optAccent}
                        onChange={(e) => updateDesignOptions("optAccent", e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#086dd7"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="optDensity" className="text-sm font-medium">
                      Table Density
                    </Label>
                    <Select
                      value={designOptions.optDensity}
                      onValueChange={(value) => updateDesignOptions("optDensity", value)}
                    >
                      <SelectTrigger className="mt-1.5">
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
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lines">Bordered</SelectItem>
                        <SelectItem value="shaded">Shaded rows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="optCustomCss" className="text-sm font-medium">
                    Custom CSS
                  </Label>
                  <Textarea
                    id="optCustomCss"
                    placeholder=":root{ --green:#19b77d; } /* your custom styles */"
                    value={designOptions.optCustomCss}
                    onChange={(e) => updateDesignOptions("optCustomCss", e.target.value)}
                    rows={3}
                    maxLength={SECURITY_CONFIG.MAX_CSS_LENGTH}
                    className="mt-1.5 font-mono text-xs resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Dangerous patterns are automatically removed for security
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button onClick={generate} disabled={isGenerating} className="flex-1 sm:flex-none">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Report"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={copyHtml}
                disabled={isCopying || !generatedHtml}
                className="flex-1 sm:flex-none bg-transparent"
              >
                {isCopying ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy HTML
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={downloadHtml}
                disabled={isDownloading || !generatedHtml}
                className="flex-1 sm:flex-none bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? "Downloading..." : "Download"}
              </Button>
              <Button variant="ghost" onClick={resetSaved} className="flex-1 sm:flex-none">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
              <p className="font-medium mb-1">Auto-save enabled</p>
              <p>
                Your content and design preferences are automatically saved locally. All data remains private and secure
                on your device.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right: Output */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Preview & Export</CardTitle>
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={previewMode === "preview" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("preview")}
                  className="h-7 px-3 text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Preview
                </Button>
                <Button
                  variant={previewMode === "code" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("code")}
                  className="h-7 px-3 text-xs"
                >
                  <Code className="w-3 h-3 mr-1" />
                  Code
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewMode === "preview" ? (
              <div className="border border-dashed rounded-lg bg-white min-h-[500px] max-h-[700px] overflow-auto shadow-inner">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                    <div>Generating preview...</div>
                  </div>
                ) : generatedHtml ? (
                  <div
                    className="p-6"
                    dangerouslySetInnerHTML={{ __html: generatedHtml }}
                    style={{
                      fontFamily: designOptions.optFont,
                      fontSize: "14px",
                      lineHeight: "1.45",
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <div className="text-center">
                      <div className="text-lg mb-2">👋</div>
                      <div className="font-medium mb-1">Ready to create your status report?</div>
                      <div className="text-sm">Fill out the form to see your preview here</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label htmlFor="output" className="text-sm font-medium">
                    Generated HTML Code
                  </Label>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{generatedHtml.length.toLocaleString()} characters</span>
                    {generatedHtml && (
                      <>
                        <span>•</span>
                        <span className="text-green-600">Valid HTML</span>
                      </>
                    )}
                  </div>
                </div>
                <Textarea
                  id="output"
                  value={generatedHtml}
                  readOnly
                  rows={18}
                  className="font-mono text-xs resize-none bg-muted/30"
                  placeholder="Generated HTML will appear here..."
                />
              </div>
            )}

            {generatedHtml && (
              <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-4 border border-muted">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Export Ready
                </h4>
                <div className="text-xs text-muted-foreground space-y-2">
                  <div className="flex items-start gap-2">
                    <Copy className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Copy HTML</div>
                      <div>Copy the generated HTML to paste into emails, documents, or web pages</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Download className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Download File</div>
                      <div>Save as a self-contained HTML file that opens in any web browser</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Security & Privacy</div>
                      <div>All content is sanitized and safe to share. No external dependencies.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
