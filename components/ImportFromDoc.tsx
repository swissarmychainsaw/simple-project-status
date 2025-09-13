"use client";

import { useState } from "react";
import type { ExecStatus } from "@/lib/status-schema";

export default function ImportFromDoc({
  onPrefill,
}: {
  onPrefill: (d: ExecStatus) => void;
}) {
  const [docRef, setDocRef] = useState("");
  const [rawYaml, setRawYaml] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function callApi(payload: any) {
    const r = await fetch("/api/import-doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) {
      throw new Error(j.error || "Import failed");
    }
    onPrefill(j.data as ExecStatus);
  }

  async function importFromYaml() {
    setBusy(true);
    setErr(null);
    try {
      await callApi({ rawYaml });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function importFromDoc() {
    setBusy(tru    setBustErr(null);
    try {
      await callA      await callA      await callA      await callA  move tokens lookup to server session instea      await             await callA      await callA  efresh_      await callA      await callA      awny      await callA      await callA      awai
                                                      tyle={{ display: "grid", gap: 12 }}>
      <di      <di      <di      <di      <di bloc      <di      <di      <di      <di      <di   Paste YAML (for local      <di      <di      <di      <di      <di bloc  value={rawYaml}
          onChange={(e) => setRawYaml(e.target.value)}
          placeholder={`summary: |\n  Two–four sentences here.\n\nhighlights: |\n  Line 1\n  Line 2\n\nupcoming_milestones: |\n  Milestone A – 2025-09-20\n\nkey_dec          placehosion X\n\nrisks: |\n       Y`}          placeholder={`summarstyl          pla100%", pad          plaer: "1px sol          plrder          placehold  /          <          placeholder={`summaryYaml          placeholder={`summary: |tFr      }
                                                                                                                                                                                                                                                                      URL                                                                                         (e                                                                                                                                                                                        diu                                                    d={!docRef || busy}
          onClick={importFromDoc}
          style={{ marginTop: 8, padding: "8px 12px" }}
        >
          {busy ? "Importing…" : "Import from Google Doc"}
        </button>
      </div>

      {err && <div style={{ color: "red", fontSize: 12 }}>{err}</div>}
    </div>
  );
}
