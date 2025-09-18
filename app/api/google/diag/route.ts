// app/api/google/diag/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadServerEnv, parseEnvFile } from "@/lib/env/load";

loadServerEnv(); // force-load .env.* before checks

export async function GET() {
  const ce = process.env.GOOGLE_CLIENT_EMAIL || "";
  const pk = process.env.GOOGLE_PRIVATE_KEY || "";
  const subj = process.env.GOOGLE_IMPERSONATE_SUBJECT || "";

  const root = process.cwd();
  const files = [".env.local", ".env.development.local", ".env.development", ".env"].map((f) => {
    const p = path.join(root, f);
    const exists = fs.existsSync(p);
    let size = 0;
    if (exists) {
      try {
        const s = fs.statSync(p);
        size = s.size;
      } catch {}
    }
    return { file: f, path: p, exists, size };
  });

  // Inspect .env.local contents (no secret values returned)
  const primary = files[0];
  const parsed = primary.exists ? parseEnvFile(primary.path) : null;
  const parsedKeys = parsed
    ? Object.fromEntries(
        ["GOOGLE_CLIENT_EMAIL", "GOOGLE_PRIVATE_KEY", "GOOGLE_IMPERSONATE_SUBJECT"].map((k) => {
          const v = parsed[k];
          return [
            k,
            v
              ? {
                  presentInFile: true,
                  valueLength: v.length,
                  startsWith: v.slice(0, 8),
                }
              : { presentInFile: false },
          ];
        })
      )
    : null;

  const pkPreview = pk ? `${pk.slice(0, 30)}...` : "";
  const pkHash = pk ? crypto.createHash("sha256").update(pk).digest("hex").slice(0, 16) : "";

  return NextResponse.json({
    runtime: "node",
    cwd: root,
    envSeen: {
      hasClientEmail: !!ce,
      clientEmailPreview: ce ? ce.replace(/(.{3}).+(@.*)/, "$1***$2") : "",
      hasPrivateKey: !!pk,
      privateKeyPreview: pkPreview,
      privateKeyHash16: pkHash,
      hasImpersonateSubject: !!subj,
    },
    envFilesAtCwd: files,
    parsedFromEnvLocal: parsedKeys,
    note:
      "If parsedFromEnvLocal shows keys present but envSeen.* are false, restart the dev server. We load with override:true.",
  });
}

