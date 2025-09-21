"use client";
import React from "react";
import { useStatusForm } from "../context";

const osIsMac = () => typeof navigator !== "undefined" && /Macintosh|Mac OS X/i.test(navigator.userAgent);
const osIsWindows = () => typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent);

const EmlActions: React.FC = () => {
  const ctx = useStatusForm() as any;
  const fd = (ctx?.formData as any) ?? {};
  const [lastFilename, setLastFilename] = React.useState<string | null>(null);

  const projectSelected = !!fd?.optProjectId; // you said greying-out is optional; we’ll use it

  const generate = async () => {
    const r = await fetch("/api/eml", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(fd),
    });
    if (!r.ok) {
      alert("Could not generate .eml");
      return;
    }
    // capture filename from Content-Disposition
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
  };

  const copyOpenCommand = async () => {
    // default to ~/Downloads (where browsers usually save)
    const f = lastFilename || "status_report.eml";
    const cmd = osIsMac()
      ? `open -a "Microsoft Outlook" "$HOME/Downloads/${f}"`
      : osIsWindows()
      ? `start "" "%HOMEPATH%\\Downloads\\${f}"`
      : `xdg-open "$HOME/Downloads/${f}"`;
    await navigator.clipboard.writeText(cmd);
    alert(`Copied to clipboard:\n${cmd}\n\nPaste into your terminal to open the draft in Outlook (or your default mail app).`);
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={generate}
          disabled={!projectSelected}
          className="px-3 py-2 rounded-md border text-sm bg-gray-900 text-white disabled:opacity-50"
          title={projectSelected ? "Build and download an .eml draft" : "Select a project to enable"}
        >
          Generate (.eml)
        </button>

        <button
          type="button"
          onClick={copyOpenCommand}
          disabled={!lastFilename}
          className="px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
          title={lastFilename ? "Copy a one-line command to open in Outlook" : "Generate an .eml first"}
        >
          Open Outlook
        </button>

        {lastFilename && (
          <code className="text-xs bg-gray-50 rounded px-2 py-1">
            ~/Downloads/{lastFilename}
          </code>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        “Open Outlook” copies a terminal command. Browsers can’t run local apps directly for security.
      </p>
    </section>
  );
};

export default EmlActions;

