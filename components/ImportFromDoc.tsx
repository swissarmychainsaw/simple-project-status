// components/ImportFromDoc.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Props = {
  // Called with parsed fields from the Google Doc (you already wire this in status-form.tsx)
  onPrefill?: (data: any) => void;
};

export default function ImportFromDoc({ onPrefill }: Props) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function importFromDoc() {
    if (!url) return;
    setBusy(true);
    setErr(null);
    try {
      // Adjust this endpoint to match your existing API route if different.
      const res = await fetch("/api/google/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error(`Import failed (HTTP ${res.status})`);
      const payload = await res.json();
      onPrefill?.(payload);
    } catch (e: any) {
      setErr(e.message || "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">Import from Google Doc (URL)</Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://docs.google.com/document/d/..."
          className="bg-white mt-1"
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" disabled={!url || busy} onClick={importFromDoc}>
          {busy ? "Importing…" : "Import"}
        </Button>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}

