"use client";

import { useEffect, useRef } from "react";

type Props = {
  html: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

export default function RichHtmlEditor({
  html,
  onChange,
  placeholder,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // keep DOM in sync with state
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (html || "")) {
      ref.current.innerHTML = html || "";
    }
  }, [html]);

  return (
    <div
      ref={ref}
      contentEditable
      className={
        className ??
        "min-h-[120px] p-3 border border-input rounded-md bg-white text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:outline-none"
      }
      style={{ lineHeight: "1.5", overflowX: "auto", maxWidth: "100%" }}
      data-placeholder={placeholder}
      suppressContentEditableWarning
      onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
      onBlur={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
      onPaste={(e) => {
        // keep it simple for now; we can wire your sanitize later
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
        if (ref.current) onChange(ref.current.innerHTML);
      }}
    />
  );
}

