import { useEffect, useMemo, useState } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function AudioUrlField({ value, onChange }: Props) {
  const [status, setStatus] = useState<"idle"|"validating"|"ok"|"error">("idle");
  const [message, setMessage] = useState<string>("");

  const looksLikeUrl = useMemo(() => {
    if (!value) return false;
    try {
      const u = new URL(value);
      return u.protocol === "https:";
    } catch {
      return false;
    }
  }, [value]);

  async function validateOnServer(url: string) {
    setStatus("validating");
    setMessage("");
    try {
      const res = await fetch(`/api/validate-audio?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? "Audio URL did not validate.");
      } else {
        setStatus("ok");
        setMessage("Valid audio link.");
      }
    } catch {
      setStatus("error");
      setMessage("Validation failed.");
    }
  }

  useEffect(() => {
    if (!value) {
      setStatus("idle");
      setMessage("");
      return;
    }
    if (!looksLikeUrl) {
      setStatus("error");
      setMessage("Enter a valid https URL.");
      return;
    }
    const t = setTimeout(() => {
      validateOnServer(value);
    }, 500);
    return () => clearTimeout(t);
  }, [value, looksLikeUrl]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">MP3 link (optional)</label>
      <input
        type="url"
        placeholder="https://…/report.mp3"
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        className="w-full rounded-md border px-3 py-2 bg-white"
        inputMode="url"
        pattern="https://.*"
      />
      <div className="text-xs">
        {status === "validating" && <span>Validating…</span>}
        {status === "ok" && <span className="text-green-700">Valid audio link.</span>}
        {status === "error" && value && <span className="text-red-700">{message}</span>}
      </div>

      {value && status === "ok" ? (
        <div className="flex items-center gap-2">
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md border px-3 py-1 text-sm"
          >
            Open link in new tab
          </a>
          <audio controls className="h-8">
            <source src={value} />
          </audio>
        </div>
      ) : null}
    </div>
  );
}

