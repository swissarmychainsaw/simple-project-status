"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStatusFormCtx } from "../context";
import {
  sanitizeHtml,
  stripInlineBackgrounds,
  unwrapParagraphsInTables,
  unwrapPsInCellsInPlace,
  safeInline,
} from "@/lib/html/transforms";
import { Bold, Italic, Underline } from "lucide-react";

/**
 * If you already have a shared constant, feel free to import it.
 * Otherwise this local default keeps behavior predictable.
 */
const EXEC_SUMMARY_PLAIN_LIMIT = 800;

function plainTextLen(html: string) {
  // Lightweight: strip tags and decode a couple of common entities
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  return text.length;
}

export default function ExecSummary() {
  const { formData, update } = useStatusFormCtx();

  const editorRef = useRef<HTMLDivElement | null>(null);
  const [len, setLen] = useState(() => plainTextLen(formData.execSummary || ""));
  const over = len > EXEC_SUMMARY_PLAIN_LIMIT;

  // Keep the live editor in sync with state (when state changes externally)
  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== (formData.execSummary || "")) {
      editorRef.current.innerHTML = formData.execSummary || "";
      setLen(plainTextLen(editorRef.current.innerHTML));
    }
  }, [formData.execSummary]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML || "";
    update("execSummary", html);
    setLen(plainTextLen(html));
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML || "";
    update("execSummary", html);
    setLen(plainTextLen(html));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rawHtml = e.clipboardData.getData("text/html");
    const rawText = e.clipboardData.getData("text/plain");

    let html = rawHtml || safeInline(rawText).replace(/\n/g, "<br>");

    // normalize/sanitize
    html = unwrapParagraphsInTables(html);
    html = stripInlineBackgrounds(html);
    html = sanitizeHtml(html);

    document.execCommand("insertHTML", false, html);

    // ensure we unwind any browser-added <p> wrappers in table cells, etc.
    const target = e.currentTarget;
    if (target) {
      unwrapPsInCellsInPlace(target);
      update("execSummary", target.innerHTML);
      setLen(plainTextLen(target.innerHTML));
    }
  };

  const wrapSelection = (tag: "b" | "i" | "u") => {
    // Use native command for contentEditable region
    const commandMap: Record<typeof tag, "bold" | "italic" | "underline"> = {
      b: "bold",
      i: "italic",
      u: "underline",
    };
    document.execCommand(commandMap[tag], false);
    // Sync state after the DOM update
    setTimeout(() => {
      const html = editorRef.current?.innerHTML || "";
      update("execSummary", html);
      setLen(plainTextLen(html));
    }, 0);
  };

  const clearField = () => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = "";
    update("execSummary", "");
    setLen(0);
  };

  const counterClass = useMemo(
    () => `text-xs ${over ? "text-red-600" : "text-gray-500"}`,
    [over]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Executive Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Section Title */}
        <div className="mb-2">
          <label className="text-xs text-gray-600">Section Title</label>
          <Input
            value={formData.execSummaryTitle}
            onChange={(e) => update("execSummaryTitle", e.target.value)}
            placeholder="Executive Summary"
            className="bg-white mt-1"
          />
        </div>

        {/* Toolbar */}
        <div className="flex gap-1 mb-2">
          <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("b")} className="h-8 px-2">
            <Bold className="w-3 h-3" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("i")} className="h-8 px-2">
            <Italic className="w-3 h-3" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => wrapSelection("u")} className="h-8 px-2">
            <Underline className="w-3 h-3" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={clearField} className="h-8 px-3 ml-2">
            Clear Field
          </Button>
          <div className="ml-auto self-center">
            <span className={counterClass}>
              {len}/{EXEC_SUMMARY_PLAIN_LIMIT} chars
            </span>
          </div>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          id="execSummary"
          contentEditable
          className={`min-h-[140px] p-3 border border-input rounded-md bg-white text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:outline-none ${
            over ? "ring-2 ring-red-500" : ""
          }`}
          style={{ lineHeight: "1.5", overflowX: "auto", maxWidth: "100%" }}
          onInput={handleInput}
          onBlur={handleBlur}
          onPaste={handlePaste}
          data-placeholder="Type or paste your executive summary here…"
          suppressContentEditableWarning
        />
      </CardContent>
    </Card>
  );
}

