import { NextRequest, NextResponse } from "next/server";
import * as YAML from "js-yaml";
import { StatusSchema } from "@/lib/status-schema";
import { google } from "googleapis";

function extractYamlFence(text: string): string {
  const m = /```ya?ml\s*([\s\S]*?)```/i.exec(text);
  if (!m || !m[1]) throw new Error("No ```yaml fenced block found in document.");
  return m[1];
}

function fileIdFrom(docRef: string): string {
  return docRef.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? docRef;
}

export async function POST(req: NextRequest) {
  try {
    // Accept either raw YAML or a Google Doc reference
    const body = await req.json();

    if (body.rawYaml) {
      // Phase 1: direct YAML import
      const parsed = YAML.load(body.rawYaml);
      const validated = StatusSchema.parse(parsed);
      return NextResponse.json({ ok: true, source: "raw", data: validated });
    }

    if (body.docRef) {
      // Phase 2: Google Docs import (requires OAuth tokens set       // Phase 2: Google Docs import (reog      // Phase 2: Google Docs import (requires OAuth t
                                 _S                                 _S                                                  _                                     _S           en:                                  _S              : body.tokens.refresh_token,
        });
      }

      const drive = google.drive({       const d, auth: oauth2 });
      const fileId = fileIdFrom(      const fileId = fileIdFrom(      const fileId = fileIdFrom(      c      { fileId, mimeType: "text/plain" },
        { response        { response        { response        { responsefe        { response        { resp.toS        { response   con        { response        { respons;
        { response        { response                  { response        { response                        { response        { response                  { response        { re     
                       .js                       .js                       .js                       .js                       .js                       .js                       .js   { ok: false, error: e.message || "Import failed" },
      { status: 400 }
    );
  }
}
