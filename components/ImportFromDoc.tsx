"use client";

import React, { useState } from "react";

type ImportedDoc = {
  summary?: string;
  highlights?: string;
  upcoming_milestones?: string;
  key_decisions?: string;
  risks?: string;
};

export default function ImportFromDoc(props: {
  onPrefill?: (d: ImportedDoc) => void;
  className?: string;
}) {
  const { onPrefill, className } = props;

  const [url, setUrl] = useState("");
  const [rawYaml, setRawYaml] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyErr, setBusyErr] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ImportedDoc | null>(null);

  // Import from pasted YAML (Phase 1 – no OAuth needed)
  async function importFromYaml() {
    setBusy(true);
    setBusyErr(null);
    setLastResult(null);
    try {
      const res = await fetch("/api/import-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawYaml }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Import failed with status ${res.status}`);
      }
      const data = await res.json();
      // API may return {ok,true, data:{...}} or {ok:true, msg:"..."}
      const payload = (data?.doc ?? data?.data) as ImportedDoc | undefined;
      const doc: ImportedDoc = payload ?? { summary: data?.msg };
      setLastResult(doc);
      onPrefill?.(doc);
    } catch (err: any) {
      setBusyErr(err?.message || "Import failed");
    } finally {
      setBusy(false);
    }
  }

  // Import from Google Doc URL (Phase 2 – works once OAuth is wired)
  async function importFromDoc() {
    setBusy(true);
    setBusyErr(null);
    setLastResult(null);
    try {
      const res = await fetch("/api/import-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docRef: url }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Import failed with status ${res.status}`);
      }
      const data = await res.json();
      const payload = (data?.doc ?? data?.data) as ImportedDoc | undefined;
      const doc: ImportedDoc = payload ?? { summary: data?.msg };
      setLastResult(doc);
      onPrefill?.(doc);
    } catch (err: any) {
      setBusyErr(err?.message || "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className} style={{ display: "grid", gap: 12 }}>
      {/* YAML path */}
      <label style={{ fontWeight: 600 }}>Paste YAML (for local test)</label>
      <textarea
        placeholder={`summary: |\n  Two–four sentences here.\n\nhighlights: |\n  Win A\n  Win B\n\nupcoming_milestones: |\n  Milestone A – 2025-09-20\n\nkey_decisions: |\n  Decision X\n\nrisks: |\n  Risk Y`}
        value={rawYaml}
        onChange={(e) => setRawYaml(e.target.value)}
        rows={8}
        style={{
          width: "100%",
          padding: 8,
          border: "1px solid #ccc",
          borderRadius: 6,
          fontSize: 14,
        }}
      />
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button
          onClick={importFromYaml}
          disabled={busy || !rawYaml.trim()}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #bbb",
            cursor: busy || !rawYaml.trim() ? "not-allowed" : "pointer",
            opacity: busy || !rawYaml.trim() ? 0.7 : 1,
          }}
        >
          {busy ? "Importing…" : "Import from YAML"}
        </button>
      </div>

      {/* Google Doc URL path */}
      <label style={{ fontWeight: 600 }}>Import from Google Doc (URL)</label>
      <input
        type="url"
        placeholder="https://docs.google.com/document/..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{
          padding: 8,
          border: "1px solid #ccc",
          borderRadius: 6,
          fontSize: 14,
        }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={importFromDoc}
          disabled={busy || !url}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #bbb",
            cursor: busy || !url ? "not-allowed" : "pointer",
            opacity: busy || !url ? 0.7 : 1,
          }}
        >
          {busy ? "Importing…" : "Import from Google Doc"}
        </button>
        {!!busyErr && (
          <span style={{ color: "#b00020", alignSelf: "center" }}>
            {busyErr}
          </span>
        )}
      </div>

      {lastResult && (
        <div
          style={{
            marginTop: 8,
            padding: 12,
            border: "1px solid #e5e5e5",
            borderRadius: 8,
            background: "#fafafa",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Imported:</div>
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
            }}
          >
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

