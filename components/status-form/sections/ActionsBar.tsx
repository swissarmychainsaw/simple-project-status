"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useStatusFormCtx } from "../context";

export default function ActionsBar() {
  const { toast } = useToast();
  // NOTE: we keep your existing controls intact:
  // generate (HTML preview), generatedHtml, emailReport, isGenerating, isEmailing
  const { generate, emailReport, generatedHtml, isGenerating, isEmailing, formData } = useStatusFormCtx() as any;

  const [lastFilename, setLastFilename] = React.useState<string | null>(null);
  const projectSelected = !!formData?.optProjectId; // optional gating

  // NEW: Generate EML
  const generateEml = async () => {
    try {
      const r = await fetch("/api/eml", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(formData || {}),
      });
      if (!r.ok) {
        const msg = await r.text();
        throw new Error(msg || `HTTP ${r.status}`);
      }
      const disp = r.headers.get("Content-Disposition") || "";
      const m = /filename="([^"]+)"/.exec(disp);
      const filename = m?.[1] || "status_report.eml";
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href: url, download: filename });
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setLastFilename(filename);

      toast({ title: "EML generated", description: `Saved as ${filename}` });
    } catch (e: any) {
      toast({ title: "EML failed", description: e?.message || "Unknown error", variant: "destructive" });
    }
  };

  // NEW: Copy OS-specific "open Outlook" command to clipboard
  const copyOpenOutlookCmd = async () => {
    if (!lastFilename) {
      toast({ title: "Generate first", description: "Create the .eml so we know the filename." });
      return;
    }
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isMac = /Macintosh|Mac OS X/i.test(ua);
    const isWin = /Windows/i.test(ua);

    // We assume browser saves to ~/Downloads by default; user can adjust path if needed.
    const cmd = isMac
      ? `open -a "Microsoft Outlook" "$HOME/Downloads/${lastFilename}"`
      : isWin
      ? `start "" "%HOMEPATH%\\Downloads\\${lastFilename}"`
      : `xdg-open "$HOME/Downloads/${lastFilename}"`;

    await navigator.clipboard.writeText(cmd);
    toast({ title: "Command copied", description: cmd });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {/* Keep your existing HTML generator (preview) */}
          <Button
            onClick={async () => {
              await generate();
              toast({ title: "HTML generated", description: "Preview updated." });
            }}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating…" : "Generate HTML"}
          </Button>

          {/* NEW: Generate EML (disabled until a project is selected, per your request) */}
          <Button onClick={generateEml} disabled={!projectSelected} variant="secondary" title={projectSelected ? "" : "Select a project first"}>
            Generate (.eml)
          </Button>

          {/* Keep your existing Copy HTML */}
          <Button
            onClick={() => {
              if (!generatedHtml) {
                toast({ title: "Nothing to copy", description: "Generate HTML first." });
                return;
              }
              navigator.clipboard
                .writeText(generatedHtml)
                .then(() => toast({ title: "Copied", description: "HTML copied to clipboard." }))
                .catch(() =>
                  toast({ title: "Copy failed", description: "Couldn’t access clipboard.", variant: "destructive" })
                );
            }}
            variant="outline"
          >
            Copy HTML
          </Button>

          {/* Keep your existing Email action */}
          <Button
            onClick={async () => {
              try {
                await emailReport();
                toast({ title: "Email sent" });
              } catch (e: any) {
                toast({ title: "Email failed", description: e?.message || "Unknown error", variant: "destructive" });
              }
            }}
            disabled={isEmailing}
            variant="default"
          >
            {isEmailing ? "Sending…" : "Email me this report"}
          </Button>

          {/* NEW: Open Outlook helper (copies the command) */}
          <Button onClick={copyOpenOutlookCmd} disabled={!lastFilename} variant="outline">
            Open Outlook
          </Button>
        </div>

        {generatedHtml ? <Textarea value={generatedHtml} readOnly className="bg-white font-mono text-xs h-64" /> : null}
      </CardContent>
    </Card>
  );
}

