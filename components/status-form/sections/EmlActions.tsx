// components/status-form/sections/EmlActions.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useStatusForm } from "../context";
import { buildEmailHtml } from "../buildEmailHtml";

/** Download helper */
function download(filename: string, data: string, mime = "message/rfc822") {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Fetch a URL and return base64 + mime */
async function fetchAsBase64(url: string): Promise<{ base64: string; mime: string }> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
  const mime = res.headers.get("content-type") || "application/octet-stream";
  const buf = await res.arrayBuffer();
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return { base64: btoa(bin), mime };
}

/** Single-part HTML .eml */
function toSinglePartHtmlEml(opts: { to: string; subject: string; html: string }) {
  const headers = [
    `To: ${opts.to || "someone@example.com"}`,
    `Subject: ${opts.subject || "Status Report"}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
  ].join("\r\n");
  return `${headers}\r\n\r\n${opts.html}`;
}

/** Multipart/related .eml with one inline image (CID) */
function toMultipartRelatedEml(opts: {
  to: string;
  subject: string;
  html: string;
  image: { cid: string; mime: string; base64: string; filename?: string };
}) {
  const boundary = "----=_Part_" + Math.random().toString(36).slice(2);
  const headers = [
    `To: ${opts.to || "someone@example.com"}`,
    `Subject: ${opts.subject || "Status Report"}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/related; boundary="${boundary}"`,
  ].join("\r\n");

  const parts = [
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    opts.html,
    ``,
    `--${boundary}`,
    `Content-Type: ${opts.image.mime}`,
    `Content-Transfer-Encoding: base64`,
    `Content-ID: <${opts.image.cid}>`,
    `Content-Disposition: inline; filename="${opts.image.filename || opts.image.cid}"`,
    ``,
    opts.image.base64,
    `--${boundary}--`,
    ``,
  ];

  return `${headers}\r\n\r\n${parts.join("\r\n")}`;
}

const EmlActions: React.FC = () => {
  const { formData, designOptions, updateFormData } = useStatusForm() as any;

  const [busy, setBusy] = useState(false);
  const [pathPreview, setPathPreview] = useState<string>("~/Downloads/status_report.eml");
  const [audioInput, setAudioInput] = useState<string>("");

  // Keep audio field mirrored
  useEffect(() => {
    const current = String(formData?.audioMp3Url || formData?.audioValidatedUrl || "").trim();
    setAudioInput(current);
  }, [formData?.audioMp3Url, formData?.audioValidatedUrl]);

  const saveAudioToForm = useCallback(() => {
    const url = (audioInput || "").trim();
    if (!url) return;
    if (typeof updateFormData === "function") {
      updateFormData("audioMp3Url", url);
      updateFormData("audioValidatedUrl", url);
    }
  }, [audioInput, updateFormData]);

  const handleGenerateEml = useCallback(async () => {
    try {
      setBusy(true);
      // make sure builder sees latest audio url
      if ((audioInput || "").trim()) saveAudioToForm();

      // Build HTML using single source of truth (includes blue "Listen" button)
      let html = buildEmailHtml(formData, designOptions);

      const to = String(formData?.emailTo || "someone@example.com");
      const subject = String(formData?.programTitle || "Status Report");

      // Decide CID vs URL mode
      const mode = String((designOptions?.optBannerMode as string) || "").toLowerCase() || "cid";
      let eml: string;

      if (mode === "cid") {
        const cid = String(designOptions?.optBannerId || formData?.bannerCid || "").trim();
        if (!cid) {
          // No CID id available → fall back to single-part
          eml = toSinglePartHtmlEml({ to, subject, html });
        } else {
          // Locate banner pixels (public path) and embed
          const key = cid; // your profiles keep cid aligned to key names (e.g., "gns")
          const guess = `/banners/${key}-banner.png`;
          const srcUrl =
            String(formData?.bannerWeb || "").trim() ||
            String(designOptions?.optBannerUrl || "").trim() ||
            guess;

          const absolute =
            /^https?:\/\//i.test(srcUrl)
              ? srcUrl
              : (typeof window !== "undefined"
                  ? new URL(srcUrl || "", window.location.origin).toString()
                  : srcUrl);

          const { base64, mime } = await fetchAsBase64(absolute);
          eml = toMultipartRelatedEml({
            to,
            subject,
            html,
            image: { cid, mime, base64, filename: `${cid}.png` },
          });
        }
      } else {
        eml = toSinglePartHtmlEml({ to, subject, html });
      }

      download("status_report.eml", eml);
      setPathPreview(`~/Downloads/status_report.eml`);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Failed to generate .eml");
    } finally {
      setBusy(false);
    }
  }, [formData, designOptions, audioInput, saveAudioToForm]);

  const copyOpenOutlook = useCallback(async () => {
    try {
      await navigator.clipboard.writeText("open ~/Downloads/status_report.eml");
    } catch {}
  }, []);

  return (
    <div className="rounded-2xl border bg-white p-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleGenerateEml}
        disabled={busy}
        className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm disabled:opacity-50"
      >
        {busy ? "Generating…" : "Generate (.eml)"}
      </button>

      <button
        type="button"
        onClick={copyOpenOutlook}
        className="rounded-md border px-4 py-2 text-sm"
        title='Copies: open ~/Downloads/status_report.eml'
      >
        Open Outlook
      </button>

      <input
        className="rounded-md border bg-white px-3 py-2 text-sm w-[320px]"
        value={pathPreview}
        readOnly
      />

      {/* Audio URL (always included if present) */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-700">Audio URL</label>
        <input
          className="rounded-md border bg-white px-3 py-2 text-sm w-[300px]"
          placeholder="https://…/status-audio.mp3"
          value={audioInput}
          onChange={(e) => setAudioInput(e.target.value)}
        />
        <button
          type="button"
          onClick={saveAudioToForm}
          className="rounded-md border px-3 py-2 text-sm"
          title="Save URL to form"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default EmlActions;

