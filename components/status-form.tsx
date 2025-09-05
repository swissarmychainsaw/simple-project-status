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
  updatesTitle: string
  milestonesTitle: string
  milestonesSectionTitle: string
  milestonesHtml: string
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
  "updatesHtml", // ensure updates persist
  "emailTo",
  "asOf",
  "milestonesTitle",
  "milestonesSectionTitle",
  "milestonesHtml",
  // persist design options too
  "optFont",
  "optAccent",
  "optDensity",
  "optBorders",
  "optCustomCss",
] as const

const isLargeFieldKey = (k: string) => /(?:updatesHtml|milestonesHtml)/.test(k)

const SECURITY_CONFIG = {
  MAX_FIELD_LENGTH: 20000,
  MAX_EXEC_SUMMARY_LENGTH: 3000,
  MAX_UPDATES_LENGTH: 100000, // 100KB limit for Updates/Milestones sections
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
  CSS_INJECTION_PATTERNS: /(expression|javascript:|@import|behavior|binding)/i,
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
  // NEW defaults
  milestonesTitle: "Upcoming Milestones",
  milestonesSectionTitle: "",
  milestonesHtml: "",
}
