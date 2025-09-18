"use client"

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image"
import "./status-form.css";
import RichHtmlEditor from "@/components/status-form/RichHtmlEditor";
import AudioUrlField from "./AudioUrlField";
import PageChrome from "@/components/status-form/PageChrome";
import AudioSection from "@/components/status-form/AudioSection";


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




