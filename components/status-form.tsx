"use client"

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image"
import "./status-form.css";
import RichHtmlEditor from "@/components/status-form/RichHtmlEditor";
import AudioUrlField from "./AudioUrlField";
import PageChrome from "@/components/status-form/PageChrome";
import AudioSection, { type AudioValidated, type PlayerKind } from "@/components/status-form/AudioSection";

import type { FormData, PlayerKind, AudioValidated } from "@/types/report";

import { buildEmailHtml } from "@/components/status-form/buildEmailHtml";
import buildHtml from "@/components/status-form/buildHtml";


import {
  SECURITY_CONFIG,
  safeInline, nlToParas, listsToParagraphs, listAwareTextToHtml,
  sanitizeHtml, stripInlineBackgrounds,
  unwrapParagraphsInTables, unwrapPsInCellsInPlace,
  stripeTables, clampWidthsForEmail, widenTables,
  processRichHtml, normalizeEditorHtml,
} from "@/lib/html/transforms";


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

// components/status-form.tsx (top of file)
type PlayerKind = "sharepoint" | "audio" | "";
type AudioValidated = {
  ok: boolean;
  normalized?: string; // final URL to use for playback/CTA
  player?: PlayerKind;
  reason?: string;
  authLikely?: boolean;
};

interface FormData {
  // ...existing fields...
  audioMp3Url: string;          // what the user typed
  audioValidatedUrl: string;    // what the API tells us to use
  audioPlayer: PlayerKind;      // "sharepoint" or "audio"
}










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
const html = buildHtml(formData, designOptions);

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
const htmlToSend = buildEmailHtml(formData, designOptions);


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
               // BEGIN listen-CTA injection
       const APP_ORIGIN =
         process.env.NEXT_PUBLIC_APP_URL ||
         (typeof window !== "undefined" ? window.location.origin : "");

       const LISTEN_URL = formData.audioUrl
         ? `${APP_ORIGIN.replace(/\/$/, "")}/listen?src=${encodeURIComponent(formData.audioUrl)}`
         : "";

       const emailListenCta = (href: string) => `
 <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
   <tr>
     <td align="center" bgcolor="#0A66C2" style="border-radius:12px;">
       <!--[if mso]>
       <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}"
         style="height:48px;v-text-anchor:middle;width:320px;" arcsize="18%" stroke="f" fillcolor="#0A66C2">
         <w:anchorlock/>
         <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:18px;font-weight:bold;">
           Listen to this report
         </center>
       </v:roundrect>
       <![endif]-->
       <!--[if !mso]><!-- -->
       <a href="${href}" target="_blank"
          style="display:inline-block;background:#0A66C2;color:#ffffff;
                 font-family:Arial,sans-serif;font-size:18px;font-weight:bold;
                 line-height:18px;text-decoration:none;border-radius:12px;
                 padding:14px 28px;">
         Listen to this report
       </a>
       <!--<![endif]-->
     </td>
   </tr>
 </table>`;

       let emailHtml = buildEmailHtml(formData, designOptions);

       if (LISTEN_URL) {
         if (emailHtml.includes("<!-- __LISTEN_CTA__ -->")) {
           emailHtml = emailHtml.replace("<!-- __LISTEN_CTA__ -->", emailListenCta(LISTEN_URL));
         } else {
           // No placeholder in template: prepend CTA above the body
           emailHtml = emailListenCta(LISTEN_URL) + "\n" + emailHtml;
         }
       }
       // END listen-CTA injection

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




// ---------- RENDER ----------
return (
  <div
    className="min-h-screen bg-gray-50 py-8 project-tint"
    data-project={normalizeBannerKey(designOptions.optBannerId as BannerKey)}
  >
    <div className="max-w-[900px] mx-auto px-4">
      {/* TEMP: skeleton to verify parser health */}
      <h1 className="sr-only">Status Form</h1>
    </div>
  </div>
);
} // ← end of StatusForm component



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

<Card>
    <CardContent>
    {/* Audio (Listen to this report) */}

<Card>
  <CardHeader><CardTitle>Audio (Listen to this report)</CardTitle></CardHeader>
  <CardContent className="space-y-2">
    <p className="text-xs text-gray-500">
      Paste a SharePoint/OneDrive/Google Drive link or a direct .mp3 URL, then click <em>Test audio</em>.
    </p>

<AudioUrlField
  value={formData.audioMp3Url || ""}                // always a string
  onChange={(raw) => updateFormData("audioMp3Url", raw)}
  onValidated={(v) => {
    updateFormData("audioValidatedUrl", v.normalized || "");
    updateFormData("audioPlayer", (v.player || "unknown") as any);
  }}
/>



    {/* Inline preview so they can confirm it plays */}
    {formData.audioValidatedUrl ? (
      formData.audioPlayer === "sharepoint" ? (
        <div className="mt-2">
          <iframe
            title="SharePoint audio"
            src={formData.audioValidatedUrl}
            className="w-full h-24 border rounded"
            allow="autoplay"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            SharePoint/OneDrive preview. Viewers must be signed in to your tenant.
          </p>
        </div>
    ) : null}

    {/* (Optional) hidden inputs if you do a plain <form> submit somewhere */}
        <input type="hidden" name="audioUrlRaw" value={(formData.audioMp3Url ?? "").toString()} />
        <input type="hidden" name="audioUrl"     value={(formData.audioValidatedUrl ?? "").toString()} />
        <input type="hidden" name="audioPlayer"  value={(formData.audioPlayer ?? "unknown").toString()} />

  </CardContent>
</Card>

</CardContent>
</Card>



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
