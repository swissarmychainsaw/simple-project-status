import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as YAML from "js-yaml";
import { StatusSchema } from "@/lib/status-schema";
import { ZodError } from "zod";
import { google } from "googleapis";
import * as cheerio from "cheerio";
import sanitizeHtml from "sanitize-html";

/* ---------- YAML helpers ---------- */
function extractYamlFence(text: string): string {
  const m = /```ya?ml\s*([\s\S]*?)```/i.exec(text);
  if (!m || !m[1]) throw new Error("No ```yaml fenced block found in document.");
  return m[1];
}

// optional: minimal forgiving sanitizer for YAML blocks
function sanitizeYaml(y: string): string {
  const src = y.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/^\uFEFF/, "");
  const lines = src.split("\n");
  const keyRe = /^(summary|highlights|upcoming_milestones|key_decisions|risks):\s*(\||>)?/i;

  // drop leading chatter until first known key
  while (lines.length && lines[0].trim() !== "" && !keyRe.test(lines[0])) lines.shift();

  // auto-indent block scalars if author forgot
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    out.push(line);
    const m = line.match(keyRe);
    const isBlock = !!m && /(\||>)\s*$/.test(line);
    if (isBlock) {
      i++;
      while (i < lines.length) {
        const next = lines[i];
        if (keyRe.test(next)) break;
        out.push(next.trim().length > 0 && !/^\s/.test(next) ? "  " + next : next);
        i++;
      }
      continue;
    }
    i++;
  }
  return out.join("\n");
}

const CANONICAL = ["summary", "highlights", "upcoming_milestones", "key_decisions", "risks"] as const;
type CanonicalKey = (typeof CANONICAL)[number];

const ALIASES: Record<string, CanonicalKey> = {
  executive_summary: "summary",
  exec_summary: "summary",
  accomplishments: "highlights",
  wins: "highlights",
  upcoming: "upcoming_milestones",
  upcoming_milestones: "upcoming_milestones",
  upcoming_milestone: "upcoming_milestones",
  milestones: "upcoming_milestones",
  next_milestones: "upcoming_milestones",
  key_decisions: "key_decisions",
  decisions: "key_decisions",
  key_decision: "key_decisions",
  risk: "risks",
  risks: "risks",
  risks_and_issue_mitigation_plan: "risks",
};

function normKey(k: string) { return k.trim().toLowerCase().replace(/[^\w]+/g, "_"); }
function toText(v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map(toText).join("\n");
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try { return YAML.dump(v).trim(); } catch { return String(v); }
}
function normalizeYamlObject(input: unknown): Record<CanonicalKey, string> {
  const out: Partial<Record<CanonicalKey, string>> = {};
  if (input && typeof input === "object" && !Array.isArray(input)) {
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      const nk = normKey(k);
      const canonical = (CANONICAL as readonly string[]).includes(nk)
        ? (nk as CanonicalKey)
        : ALIASES[nk as keyof typeof ALIASES];
      if (canonical) out[canonical] = toText(v);
    }
  }
  return out as Record<CanonicalKey, string>;
}

/* ---------- HTML helpers ---------- */
const SECTION_ALIASES: Record<string, CanonicalKey> = {
  "executive summary": "summary",
  "summary": "summary",
  "highlights": "highlights",
  "accomplishments": "highlights",
  "wins": "highlights",
  "upcoming milestones": "upcoming_milestones",
  "milestones": "upcoming_milestones",
  "upcoming": "upcoming_milestones",
  "key decisions": "key_decisions",
  "decisions": "key_decisions",
  "risks": "risks",
  "risk": "risks",
};

function normText(s: string) { return s.trim().toLowerCase().replace(/\s+/g, " "); }

function normalizeInlineStyles(html: string) {
  const $ = cheerio.load(`<div id="__root">${html}</div>`);
  const root = $("#__root");

  root.find("[style]").each((_, el) => {
    const $el = $(el);
    const style = String($el.attr("style") || "").toLowerCase();
    const hasBold = /font-weight\s*:\s*(bold|[6-9]00)\b/.test(style);
    const hasItalic = /font-style\s*:\s*italic\b/.test(style);
    const hasUnderline = /text-decoration\s*:\s*underline\b/.test(style);

    if (hasBold || hasItalic || hasUnderline) {
      let inner = $el.html() ?? $el.text();
      if (hasUnderline) inner = `<u>${inner}</u>`;
      if (hasItalic) inner = `<em>${inner}</em>`;
      if (hasBold) inner = `<strong>${inner}</strong>`;
      $el.replaceWith(inner);
    }
  });

  root.find("b").each((_, el) => {
    const $el = $(el);
    $el.replaceWith(`<strong>${$el.html() ?? $el.text()}</strong>`);
  });
  root.find("i").each((_, el) => {
    const $el = $(el);
    $el.replaceWith(`<em>${$el.html() ?? $el.text()}</em>`);
  });

  return root.html() || "";
}

function normalizeLists(html: string) {
  const $ = cheerio.load(`<div id="__root">${html}</div>`);
  const root = $("#__root");

  // If fragment already has real lists, keep as-is.
  if (root.find("ul,ol").length > 0) return root.html() || "";

  const bulletRe = /^\s*(?:[•◦▪\-*])\s+/;
  const numberRe = /^\s*\d+[.)]\s+/;

  const children = root.contents().toArray();
  const isElement = (n: any) => n.type === "tag";
  const tagOf = (n: any) => String(n?.tagName || "").toLowerCase();
  const textOf = (n: any) => $(n).text();

  function listKindFor(n: any): "ul" | "ol" | null {
    if (!isElement(n)) return null;
    const tag = tagOf(n);
    if (tag !== "p" && tag !== "div") return null;

    const txt = textOf(n);
    if (bulletRe.test(txt)) return "ul";
    if (numberRe.test(txt)) return "ol";

    const style = String($(n).attr("style") || "").toLowerCase();
    const cls = String($(n).attr("class") || "").toLowerCase();

    if (/list-style-type\s*:\s*(disc|circle|square)/.test(style)) return "ul";
    if (/list-style-type\s*:\s*(decimal|lower-|upper-|roman)/.test(style)) return "ol";
    if (/\blst-kix/.test(cls)) return numberRe.test(txt) ? "ol" : "ul";

    return null;
  }

  let i = 0;
  while (i < children.length) {
    const n = children[i] as any;
    const kind = listKindFor(n);
    if (!kind) { i++; continue; }

    const items: string[] = [];
    let j = i;
    while (j < children.length) {
      const m = children[j] as any;
      if (listKindFor(m) !== kind) break;

      const $m = $(m);
      const htmlInner = $m.html() ?? textOf(m);
      const stripped = htmlInner.replace(kind === "ul" ? bulletRe : numberRe, "").trim();
      items.push(`<li>${stripped}</li>`);
      j++;
    }

    if (items.length) {
      const listHtml = kind === "ul" ? `<ul>${items.join("")}</ul>` : `<ol>${items.join("")}</ol>`;
      $(children[i] as any).before(listHtml);
      for (let k = i; k < j; k++) $(children[k] as any).remove();

      const refreshed = root.contents().toArray();
      children.splice(0, children.length, ...refreshed);
      i++; // move past inserted list
      continue;
    }

    i++;
  }

  return root.html() || "";
}

function sanitizeFragment(html: string) {
  const styled = normalizeInlineStyles(html);
  const withLists = normalizeLists(styled);
  return sanitizeHtml(withLists, {
    allowedTags: [
      "p","br","ul","ol","li","strong","em","u",
      "table","thead","tbody","tr","th","td",
      "a","code","pre"
    ],
    allowedAttributes: {
      a: ["href","title","target","rel"],
      td: ["colspan","rowspan"],
      th: ["colspan","rowspan"],
    },
    transformTags: {
      b: "strong",
      i: "em",
      a: (tag, attrs) => ({
        tagName: "a",
        attribs: { ...attrs, rel: "noopener noreferrer", target: "_blank" },
      }),
    },
  });
}

function extractSectionsFromHtml(html: string): Record<CanonicalKey, string> {
  const $ = cheerio.load(html);
  const result: Record<CanonicalKey, string> = {
    summary: "", highlights: "", upcoming_milestones: "", key_decisions: "", risks: ""
  };

  function headingKeyForNode(el: cheerio.Element): CanonicalKey | null {
    const $el = $(el);
    const tag = (el.tagName || "").toLowerCase();
    const raw = $el.text();
    const text = normText(raw).replace(/\s*:\s*$/, ""); // drop trailing colon

    if (/^h[1-6]$/.test(tag)) {
      return (SECTION_ALIASES as any)[text] ?? null;
    }
    if (tag === "p") {
      const first = $el.contents().first();
      const firstTag = (first[0]?.tagName || "").toLowerCase();
      const looksBoldLead = firstTag === "strong" || firstTag === "b";
      if (looksBoldLead) {
        const boldText = normText($(first).text()).replace(/\s*:\s*$/, "");
        return (SECTION_ALIASES as any)[boldText] ?? (SECTION_ALIASES as any)[text] ?? null;
      }
      return (SECTION_ALIASES as any)[text] ?? null;
    }
    return null;
  }

  const candidates = $("h1,h2,h3,h4,h5,h6,p").toArray().filter((el) => headingKeyForNode(el));

  candidates.forEach((el, idx) => {
    const key = headingKeyForNode(el);
    if (!key) return;

    const stop = candidates[idx + 1] || null;
    const buf: string[] = [];
    let cur = $(el).next();
    while (cur.length && (!stop || cur[0] !== stop)) {
      if (headingKeyForNode(cur[0] as any)) break;
      buf.push($.html(cur));
      cur = cur.next();
    }
    if (!result[key]) {
      result[key] = sanitizeFragment(buf.join(""));
    }
  });

  return result;
}

/* ---------- misc ---------- */
function fileIdFrom(docRef: string): string {
  return docRef.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? docRef;
}

/* ---------- route ---------- */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // A) Local test: raw YAML
    if (body?.rawYaml) {
      const sanitized = sanitizeYaml(String(body.rawYaml));
      const parsed = YAML.load(sanitized);
      const normalized = normalizeYamlObject(parsed);
      try {
        const validated = StatusSchema.parse(normalized);
        return NextResponse.json({ ok: true, source: "raw", data: validated, format: "text" });
      } catch (err) {
        if (err instanceof ZodError) {
          return NextResponse.json(
            { ok: false, error: "YAML parsed but did not match the 5-field schema.",
              details: err.issues.map(i => `${i.path.join(".") || "(root)"}: ${i.message}`) },
            { status: 422 }
          );
        }
        throw err;
      }
    }

    // B) Google Doc import
    if (body?.docRef) {
      const oauth2 = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_SECRET!,
        process.env.GOOGLE_REDIRECT_URI!
      );

      // cookie first
      const jar = cookies();
      const raw = jar.get("gTokens")?.value;
      if (raw) {
        try {
          const t = JSON.parse(raw);
          oauth2.setCredentials({
            access_token: t.access_token,
            refresh_token: t.refresh_token,
            expiry_date: t.expiry_date,
          });
        } catch {}
      }
      // dev fallback
      if (body.tokens?.access_token || body.tokens?.refresh_token) {
        oauth2.setCredentials({
          access_token: body.tokens.access_token,
          refresh_token: body.tokens.refresh_token,
        });
      }

      const creds = oauth2.credentials || {};
      if (!creds.access_token && !creds.refresh_token) {
        return NextResponse.json(
          { ok: false, error: "Not authenticated with Google Drive. Visit /api/google/oauth/start to connect." },
          { status: 401 }
        );
      }

      const drive = google.drive({ version: "v3", auth: oauth2 });
      const fileId = fileIdFrom(String(body.docRef));

      // Try YAML (text/plain) first
      try {
        const resp = await drive.files.export(
          { fileId, mimeType: "text/plain" },
          { responseType: "arraybuffer" }
        );
        const text = Buffer.from(resp.data as ArrayBuffer).toString("utf8");
        const yamlStr = extractYamlFence(text); // throws if none
        const sanitized = sanitizeYaml(yamlStr);
        const parsed = YAML.load(sanitized);
        const normalized = normalizeYamlObject(parsed);
        const validated = StatusSchema.parse(normalized);
        return NextResponse.json({ ok: true, source: "gdoc:yaml", data: validated, format: "text" });
      } catch {
        // fall through to HTML
      }

      // Fallback: HTML export preserves formatting
      let html: string;
      try {
        const resp = await drive.files.export(
          { fileId, mimeType: "text/html" },
          { responseType: "arraybuffer" }
        );
        html = Buffer.from(resp.data as ArrayBuffer).toString("utf8");
      } catch (err: any) {
        const code = err?.code || err?.response?.status;
        if (code === 401 || code === 403) {
          return NextResponse.json(
            { ok: false, error: "Google says you don't have access to that Doc." },
            { status: code }
          );
        }
        if (code === 404) {
          return NextResponse.json(
            { ok: false, error: "Google Doc not found. Check the URL/File ID." },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { ok: false, error: "Failed to export the Google Doc as HTML." },
          { status: 500 }
        );
      }

      const sections = extractSectionsFromHtml(html);
      const validated = StatusSchema.parse(sections); // schema allows empty strings
      return NextResponse.json({ ok: true, source: "gdoc:html", data: validated, format: "html" });
    }

    return NextResponse.json(
      { ok: false, error: "Send either { rawYaml } or { docRef }" },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Import failed" },
      { status: 400 }
    );
  }
}
