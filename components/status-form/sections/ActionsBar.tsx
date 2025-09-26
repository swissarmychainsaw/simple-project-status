"use client";

import React, { useCallback, useState } from "react";
import { useStatusForm } from "../context";

const ActionsBar: React.FC = () => {
  const ctx = useStatusForm() as any;

  const formData = (ctx?.formData as any) ?? {};
  const designOptions = (ctx?.designOptions as any) ?? {};

  const isGenerating = !!ctx?.isGenerating;
  const isEmailing = !!ctx?.isEmailing;

  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const onPreviewHtml = useCallback(async () => {
    setMsg(null);
    try {
      await ctx?.generate?.();
      setMsg({ kind: "ok", text: "HTML preview updated." });
    } catch (e: any) {
      setMsg({ kind: "err", text: e?.message || "Failed to generate HTML." });
    }
  }, [ctx]);

  const onSendEmail = useCallback(async () => {
    setMsg(null);
    try {
      await ctx?.emailReport?.();
      setMsg({ kind: "ok", text: "Email sent." });
    } catch (e: any) {
      setMsg({ kind: "err", text: e?.message || "Email failed." });
    }
  }, [ctx]);

  const onDownloadEml = useCallback(async () => {
    setMsg(null);
    setDownloading(true);
    try {
      const res = await fetch("/api/email/build-eml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, designOptions })
      });

      // Try to read JSON on error; otherwise consume as blob.
      if (!res.ok) {
        let errText = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          errText = j?.error || errText;
        } catch {
          // ignore
        }
        throw new Error(errText);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const programTitle =
        (formData.programTitle as string) ||
        (formData.title as string) ||
        "Status Report";
      const asOf =
        (formData.asOf as string) ||
        (formData.updatedAt as string) ||
        (formData.date as string) ||
        "";
      const safeTitle = programTitle.replace(/[^\w.-]+/g, "_").slice(0, 64);
      const safeDate = String(asOf || new Date().toISOString().slice(0, 10)).replace(/[^\d-]/g, "");
      const fname = `${safeTitle}_${safeDate || "today"}.eml`;

      const a = document.createElement("a");
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setMsg({ kind: "ok", text: `Downloaded ${fname}` });
    } catch (e: any) {
      setMsg({ kind: "err", text: `EML build failed: ${e?.message || "Unknown error"}` });
    } finally {
      setDownloading(false);
    }
  }, [formData, designOptions]);

  return (
    <div className="sticky bottom-0 z-10 mt-6 rounded-xl border bg-white/95 backdrop-blur px-4 py-3 flex items-center gap-2">
      <button
        type="button"
        className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
        onClick={onPreviewHtml}
        disabled={isGenerating}
      >
        {isGenerating ? "Generating…" : "Preview HTML"}
      </button>

      <button
        type="button"
        className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
        onClick={onSendEmail}
        disabled={isEmailing}
      >
        {isEmailing ? "Sending…" : "Send Email"}
      </button>

      <div className="ml-auto" />

      <button
        type="button"
        className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
        onClick={onDownloadEml}
        disabled={downloading}
        title="Build a self-contained .eml with inline CID images"
      >
        {downloading ? "Building .eml…" : "Download .eml"}
      </button>

      {msg && (
        <span
          className={
            msg.kind === "ok"
              ? "text-green-700 text-sm ml-3"
              : "text-red-700 text-sm ml-3"
          }
        >
          {msg.text}
        </span>
      )}
    </div>
  );
};

export default ActionsBar;

