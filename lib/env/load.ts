// lib/env/load.ts
import fs from "node:fs";
import path from "node:path";
import * as dotenv from "dotenv";

let loaded = false;

/**
 * Explicitly load server-side env from common files.
 * Uses `override: true` so values in .env.* replace empty/undefined process.env.
 */
export function loadServerEnv(): void {
  if (loaded) return;
  const cwd = process.cwd();
  const candidates = [
    ".env.local",
    ".env.development.local",
    ".env.development",
    ".env",
  ];

  for (const f of candidates) {
    const p = path.join(cwd, f);
    if (fs.existsSync(p)) {
      dotenv.config({ path: p, override: true });
    }
  }
  loaded = true;
}

/** Non-mutating helper: parse a .env file and return key/value map. */
export function parseEnvFile(filePath: string): Record<string, string> | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = dotenv.parse(raw);
    return parsed as Record<string, string>;
  } catch {
    return null;
  }
}

