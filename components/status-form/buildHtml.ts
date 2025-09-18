// components/status-form/buildHtml.ts
// Standalone, drop-in builder for the on-page HTML preview (non-email version).
// It mirrors the layout you had inline in StatusForm, but isolates all helpers here.

import {
  BANNERS,
  type BannerKey,
  type DesignOptionsProfile,
} from "@/components/status-form/projectProfiles";

// ---- Types this module accepts ------------------------------------------------
export interface BuildHtmlFormData {
  programTitle: string;
  programSummary: string;
  asOf: string;
  lastStatus: string;
  currentStatus: string;
  trending: string;
  tpm: string;
  engDri: string;
  bizSponsor: string;
  engSponsor: string;
  execSummaryTitle: string;
  execSummary: string;
  highlightsTitle: string;
  highlightsHtml: string;
  updatesTrack?: string; // not rendered specially here, but allowed
  updatesTeam?: string;  // "
  updatesTitle: string;
  updatesHtml: string;
  sectionTitle: string;
  milestonesTitle: string;
  milestonesSectionTitle: string;
  milestonesHtml: string;
  keyDecisionsTitle: string;
  keyDecisionsSectionTitle: string;
  keyDecisionsHtml: string;
  risksTitle: string;
  risksSectionTitle: string;
  risksHtml: string;
  resourcesTitle: string;
  resourcesSectionTitle: string;
  resourcesHtml: string;
}

export type ReportKind =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "program"
  | "project"
  | "ops"
  | "exec"
  | "incident";

export type DesignOptions = DesignOptionsProfile & {
  optReportKind?: ReportKind;
};

// ---- Constants ----------------------------------------------------------------
export const EMAIL_MAX_WIDTH = 900; // used for preview max width too
const STRIPE_ODD = "#ffffff";
const STRIPE_EVEN = "#f9f9f9";
const HEADER_BG = "#f5f5f5";
const LEFT_COL = "30%";
const RIGHT_COL = "70%";

// ---- Small utils ---------------------------------------------------------------
const escapeHtml = (s: string): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

const nlToParas = (text: string) => {
  const parts = String(text || "")
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts
    .map((p) =>
      escapeHtml(p)
        .replace(/\n/g, "<br>")
    )
    .join("<br><br>");
};

// Replace <ul>/<ol> with paragraphs (used for Highlights rendering parity)
const listsToParagraphs = (html: string): string => {
  if (!html) return "";
  if (typeof document === "undefined") return html; // SSR fallback
  const root = document.createElement("div");
  root.innerHTML = html;
  root.querySelectorAll("ul, ol").forEach((list) => {
    const frag = document.createDocumentFragment();
    list.querySelectorAll(":scope > li").forEach((li) => {
      const p = document.createElement("p");
      p.innerHTML = (li as HTMLElement).innerHTML;
      frag.appendChild(p);
    });
    list.replaceWith(frag);
  });
  return root.innerHTML;
};

// Absolute URL helper (safe in both client & SSR)
const absoluteUrl = (p: string) => {
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "https://example.com";
    return new URL(p, base).toString();
  } catch {
    return p;
  }
};

// ---- Sanitization + table normalization (DOM-based, no-op on SSR) -------------
const SECURITY_CONFIG = {
  ALLOWED_TAGS: new Set([
    "b","i","u","p","br","ul","ol","li","a","table","thead","tbody","tr","th","td","strong","em","div","span","h1","h2","h3","img",
  ]),
  ALLOWED_ATTRIBUTES: {
    "*": ["class", "style"],
    a: ["href", "title", "target"],
    img: ["src", "alt", "width", "height"],
    table: ["class","style","border","cellpadding","cellspacing","data-testid","data-number-column","data-table-width","data-layout"],
    th: ["class","style","colspan","rowspan","scope"],
    td: ["class","style","colspan","rowspan"],
    tr: ["class","style"],
    thead: ["class","style"],
    tbody: ["class","style"],
    tfoot: ["class","style"],
  } as Record<string, string[]>,
  DANGEROUS_PROTOCOLS: /^(javascript:|data:|vbscript:|file:|about:)/i,
} as const;

const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== "string") return "";
  if (typeof document === "undefined") return html; // SSR: skip DOM transform
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;

  const isSafeHref = (href: string) => {
    try {
      const url = new URL(href, "https://example.com");
      return ["http:", "https:", "mailto:"].includes(url.protocol);
    } catch {
      return false;
    }
  };

  Array.from(wrapper.querySelectorAll<HTMLElement>("*")).forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (!SECURITY_CONFIG.ALLOWED_TAGS.has(tag)) {
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      }
      return;
    }
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const allowed =
        SECURITY_CONFIG.ALLOWED_ATTRIBUTES["*"].includes(name) ||
        SECURITY_CONFIG.ALLOWED_ATTRIBUTES[tag]?.includes(name);
      if (!allowed) {
        el.removeAttribute(attr.name);
        return;
      }
      if (name === "href") {
        if (SECURITY_CONFIG.DANGEROUS_PROTOCOLS.test(attr.value) || !isSafeHref(attr.value)) {
          el.removeAttribute("href");
        }
      }
    });
  });

  return wrapper.innerHTML;
};

const stripInlineBackgrounds = (html: string) => {
  if (!html) return "";
  if (typeof document === "undefined") return html;
  const root = document.createElement("div");
  root.innerHTML = html;
  root.querySelectorAll("*").forEach((el) => {
    const he = el as HTMLElement;
    const style = he.getAttribute("style") || "";
    const next = style.replace(/background(?:-color)?\s*:\s*[^;]+;?/gi, "").trim();
    if (next) he.setAttribute("style", next);
    else he.removeAttribute("style");
  });
  root.querySelectorAll("mark").forEach((el) => {
    const span = document.createElement("span");
    span.innerHTML = (el as HTMLElement).innerHTML;
    el.replaceWith(span);
  });
  return root.innerHTML;
};

const clampWidthsForEmail = (html: string): string => {
  if (!html) return html;
  if (typeof document === "undefined") return html;
  const root = document.createElement("div");
  root.innerHTML = html;

  root.querySelectorAll("table").forEach((t) => {
    const el = t as HTMLElement;
    el.style.width = "100%";
    el.setAttribute("width", "100%");
    el.removeAttribute("height");
    el.style.removeProperty("max-width");
    el.style.removeProperty("min-width");
  });

  root.querySelectorAll("th, td").forEach((cell) => {
    const el = cell as HTMLElement;
    el.style.removeProperty("width");
    el.removeAttribute("width");
    el.style.removeProperty("min-width");
    el.style.removeProperty("max-width");
    el.setAttribute("align", "left");
    el.setAttribute("valign", "top");
  });

  root.querySelectorAll("div, span, p, section, article").forEach((n) => {
    const el = n as HTMLElement;
    el.style.removeProperty("width");
    el.removeAttribute("width");
    el.style.removeProperty("min-width");
    el.style.removeProperty("max-width");
    el.style.removeProperty("float");
    el.style.removeProperty("position");
    el.style.removeProperty("left");
    el.style.removeProperty("right");
  });

  root.querySelectorAll("img").forEach((img) => {
    const el = img as HTMLImageElement;
    el.removeAttribute("height");
    el.style.maxWidth = "100%";
    el.style.height = "auto";
    const s = (el.getAttribute("style") || "").trim();
    if (!/max-width/i.test(s)) {
      el.setAttribute("style", `${s ? s + ";" : ""}max-width:100%;height:auto`);
    }
  });

  return root.innerHTML;
};

// helpers for stripe/widen
const stripBgDecls = (style: string) => style.replace(/background(?:-color)?:\s*[^;]+;?/gi, "").trim();
const stripDecl = (style: string, prop: string) =>
  style.replace(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*[^;]+;?`, "gi"), "").trim();

const trimCellWhitespace = (el: HTMLElement) => {
  if (typeof document === "undefined") return;
  const TEXT_NODE = 3;
  const ELEMENT_NODE = 1;
  const isEmptyText = (n: Node) => n.nodeType === TEXT_NODE && !/\S/.test(n.textContent || "");
  const isEmptyBlock = (n: Node) => {
    if (n.nodeType !== ELEMENT_NODE) return false;
    const tag = (n as Element).tagName.toUpperCase();
    const isBlock = /^(P|DIV|H1|H2|H3|H4|H5|H6)$/i.test(tag);
    const text = (n as Element).textContent || "";
    const onlyWhitespace = text.replace(/\u00a0|\s/g, "") === "";
    const isBr = tag === "BR";
    return isBr || (isBlock && onlyWhitespace);
  };
  while (el.firstChild && (isEmptyText(el.firstChild) || isEmptyBlock(el.firstChild))) el.removeChild(el.firstChild);
  while (el.lastChild && (isEmptyText(el.lastChild) || isEmptyBlock(el.lastChild))) el.removeChild(el.lastChild);
};

const unwrapParagraphsInTables = (html: string): string => {
  if (!html) return "";
  if (typeof document === "undefined") return html;
  const root = document.createElement("div");
  root.innerHTML = html;
  root.querySelectorAll("table td, table th").forEach((cell) => {
    const ps = Array.from(cell.querySelectorAll("p"));
    ps.forEach((p, i) => {
      const frag = document.createDocumentFragment();
      while (p.firstChild) frag.appendChild(p.firstChild);
      if (i !== ps.length - 1) frag.appendChild(document.createElement("br"));
      p.replaceWith(frag);
    });
    trimCellWhitespace(cell as HTMLElement);
  });
  return root.innerHTML;
};

const stripeTables = (html: string): string => {
  if (!html) return html;
  if (typeof document === "undefined") return html;
  const root = document.createElement("div");
  root.innerHTML = html;

  const getChildRows = (seg: Element) =>
    Array.from(seg.children).filter((el) => el.tagName.toUpperCase() === "TR") as HTMLTableRowElement[];

  root.querySelectorAll("table").forEach((table) => {
    const segments: Element[] = [];
    if ((table as HTMLTableElement).tHead) segments.push((table as HTMLTableElement).tHead!);
    segments.push(...Array.from((table as HTMLTableElement).tBodies));
    if ((table as HTMLTableElement).tFoot) segments.push((table as HTMLTableElement).tFoot!);
    if (!segments.length) segments.push(table);

    let rowCounter = 0;

    segments.forEach((seg) => {
      const rows = getChildRows(seg);
      rows.forEach((tr) => {
        const isHeader = rowCounter === 0;
        const rowColor = isHeader ? HEADER_BG : (rowCounter - 1) % 2 === 0 ? STRIPE_ODD : STRIPE_EVEN;
        (tr as HTMLElement).setAttribute("bgcolor", rowColor);
        Array.from(tr.children).forEach((cell) => {
          if (!/^(TD|TH)$/i.test(cell.tagName)) return;
          const el = cell as HTMLElement;
          trimCellWhitespace(el);
          let next = stripBgDecls(el.getAttribute("style") || "");
          next = stripDecl(next, "text-align");
          next = stripDecl(next, "vertical-align");
          next += (next ? "; " : "") + `background-color:${rowColor}; text-align:left; vertical-align:top`;
          el.setAttribute("style", next);
          el.setAttribute("align", "left");
          el.setAttribute("valign", "top");
        });
        rowCounter++;
      });
    });
  });

  return root.innerHTML;
};

const widenTables = (html: string): string => {
  if (!html) return html;
  if (typeof document === "undefined") return html;
  const root = document.createElement("div");
  root.innerHTML = html;

  root.querySelectorAll("table").forEach((table) => {
    const t = table as HTMLTableElement;
    t.style.width = "100%";
    t.setAttribute("width", "100%");
    t.style.tableLayout = "fixed";
    t.style.removeProperty("white-space");

    let cg = t.querySelector("colgroup");
    if (!cg) {
      cg = document.createElement("colgroup");
      cg.innerHTML = `<col style="width:${LEFT_COL}"><col style="width:${RIGHT_COL}">`;
      t.insertBefore(cg, t.firstChild);
    } else {
      const cols = cg.querySelectorAll("col");
      if (cols.length >= 2) {
        (cols[0] as HTMLElement).style.width = LEFT_COL;
        (cols[1] as HTMLElement).style.width = RIGHT_COL;
      }
    }

    const segments: Element[] = [];
    if (t.tHead) segments.push(t.tHead);
    segments.push(...Array.from(t.tBodies));
    if (t.tFoot) segments.push(t.tFoot);
    if (!segments.length) segments.push(t);

    segments.forEach((seg) => {
      seg.querySelectorAll("tr").forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll("th,td"));
        const hasColspan = cells.some((c) => (c as HTMLElement).hasAttribute("colspan"));
        if (cells.length === 2 && !hasColspan) {
          cells.forEach((cell, idx) => {
            const el = cell as HTMLElement;
            el.style.removeProperty("min-width");
            el.style.removeProperty("white-space");
            const w = idx === 0 ? LEFT_COL : RIGHT_COL;
            el.style.width = w;
            el.setAttribute("width", w);
            el.style.verticalAlign = "top";
            el.setAttribute("valign", "top");
            el.style.textAlign = "left";
            el.setAttribute("align", "left");
          });
        }
      });
    });
  });

  return root.innerHTML;
};

const processRichHtml = (html: string): string =>
  widenTables(
    stripeTables(
      clampWidthsForEmail(
        stripInlineBackgrounds(
          unwrapParagraphsInTables(
            sanitizeHtml(html)
          )
        )
      )
    )
  );

// ---- Banner helper -------------------------------------------------------------
function getBannerHtml(
  forEmail: boolean, // kept for parity; here we always pass false
  opts: DesignOptions,
  maxWidth = EMAIL_MAX_WIDTH
): string {
  if (opts.optBannerMode === "none") return "";
  let src = "";
  const key = (opts.optBannerId || "") as BannerKey;
  const meta = key ? BANNERS[key] : undefined;

  if (opts.optBannerMode === "url" && opts.optBannerUrl) {
    src = absoluteUrl(opts.optBannerUrl);
  } else if (opts.optBannerMode === "cid") {
    if (forEmail && (meta as any)?.cid) {
      src = `cid:${(meta as any).cid}`;
    } else if ((meta as any)?.web) {
      src = absoluteUrl((meta as any).web);
    } else if ((meta as any)?.url) {
      src = absoluteUrl((meta as any).url);
    }
  }
  if (!src) return "";

  const caption = opts.optBannerCaption || "Program Status";
  const alt = (meta as any)?.alt || caption;
  const img = `
    <img src="${escapeHtml(src)}"
         alt="${escapeHtml(alt)}"
         width="${maxWidth}"
         style="display:block;width:100%;max-width:${maxWidth}px;height:auto;border:0;outline:0;-ms-interpolation-mode:bicubic;" />
  `;
  if (forEmail) return img; // emails avoid captions
  return `${img}
    <div style="font-weight:600;text-align:center;margin:8px 0 4px 0;color:#111;font-size:18px;line-height:1.3;">
      ${escapeHtml(caption)}
    </div>`;
}

// ---- Public API ----------------------------------------------------------------
export function buildHtml(data: BuildHtmlFormData, opts: DesignOptions): string {
  const asOf = data.asOf
    ? (() => {
        const [year, month, day] = data.asOf.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
      })()
    : "";

  const pill = (val: string) => {
    const v = String(val || "").toLowerCase();
    if (v === "red")
      return `<div style="display:inline-block;background-color:#e5534b;color:#fff;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:bold;">Red</div>`;
    if (v === "yellow")
      return `<div style="display:inline-block;background-color:#f4c542;color:#111;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:bold;">Yellow</div>`;
    return `<div style="display:inline-block;background-color:#4CAF50;color:#fff;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:bold;">Green</div>`;
  };

  const processedUpdates = processRichHtml(data.updatesHtml);
  const processedMilestones = processRichHtml(data.milestonesHtml);
  const processedKeyDecisions = processRichHtml(data.keyDecisionsHtml);
  const processedRisks = processRichHtml(data.risksHtml);
  const processedResources = processRichHtml(data.resourcesHtml);
  const processedHighlights = processRichHtml(listsToParagraphs(data.highlightsHtml));

  const evenRowStyle = "background-color:#f9f9f9;padding:20px;border:1px solid #CCCCCC;";
  const oddRowStyle = "background-color:#ffffff;padding:20px;border:1px solid #CCCCCC;";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Status Report</title>
</head>
<body style="margin:0;padding:0;">
  ${getBannerHtml(false, opts, EMAIL_MAX_WIDTH)}

  <table style="width:100%;max-width:${EMAIL_MAX_WIDTH}px;margin:0 auto;border-collapse:collapse;font-family:Arial,sans-serif;">
    <tr><td>
      <table style="width:100%;border-collapse:collapse;margin:0;padding:0;">
        <!-- Title + Summary -->
        <tr>
          <td style="background-color:#E8E8E8;padding:20px;text-align:left;border:1px solid #CCCCCC;">
            <h1 style="margin:0;font-size:24px;font-weight:bold;color:#333333;">
              ${escapeHtml(data.programTitle || "Your Program/Project Title here")}
            </h1>
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff;padding:20px;border:1px solid #CCCCCC;">
            <span style="margin:0;font-size:16px;line-height:1.5;color:#333333;">
              ${nlToParas(data.programSummary) || "Program summary description goes here."}
            </span>
          </td>
        </tr>

        <!-- Status row -->
        <tr>
          <td colspan="1" style="${evenRowStyle}padding:0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="width:25%;padding:10px;text-align:center;border-left:1px solid #CCCCCC;border-right:1px solid #CCCCCC;border-top:0;border-bottom:0;background-color:#F5F5F5;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Last Status</h3>
                  ${pill(data.lastStatus)}
                </td>
                <td style="width:25%;padding:10px;text-align:center;border-left:1px solid #CCCCCC;border-right:1px solid #CCCCCC;border-top:0;border-bottom:0;background-color:#F5F5F5;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Current Status</h3>
                  ${pill(data.currentStatus)}
                </td>
                <td style="width:25%;padding:10px;text-align:center;border-left:1px solid #CCCCCC;border-right:1px solid #CCCCCC;border-top:0;border-bottom:0;background-color:#F5F5F5;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Trending</h3>
                  ${pill(data.trending)}
                </td>
                <td style="width:25%;padding:10px;text-align:center;border-left:1px solid #CCCCCC;border-right:1px solid #CCCCCC;border-top:0;border-bottom:0;background-color:#F5F5F5;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Date</h3>
                  <p style="margin:0;font-size:14px;color:#333333;">${escapeHtml(asOf)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Team row -->
        <tr>
          <td colspan="1" style="${oddRowStyle}padding:0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="width:25%;padding:10px;text-align:center;border:1px solid #CCCCCC;background-color:#FFFFFF;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">TPM</h3>
                  <p style="margin:0;font-size:16px;color:#333333;">${escapeHtml(data.tpm) || "Name"}</p>
                </td>
                <td style="width:25%;padding:10px;text-align:center;border:1px solid #CCCCCC;background-color:#FFFFFF;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Engineering DRI</h3>
                  <p style="margin:0;font-size:16px;color:#333333;">${escapeHtml(data.engDri) || "Name"}</p>
                </td>
                <td style="width:25%;padding:10px;text-align:center;border:1px solid #CCCCCC;background-color:#FFFFFF;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Business Sponsor</h3>
                  <p style="margin:0;font-size:16px;color:#333333;">${escapeHtml(data.bizSponsor) || "Name"}</p>
                </td>
                <td style="width:25%;padding:10px;text-align:center;border:1px solid #CCCCCC;background-color:#FFFFFF;">
                  <h3 style="margin:0 0 15px 0;font-size:18px;font-weight:bold;color:#333333;">Engineering Sponsor</h3>
                  <p style="margin:0;font-size:16px;color:#333333;">${escapeHtml(data.engSponsor) || "Name"}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${data.execSummary ? `
        <tr>
          <td colspan="1" style="${oddRowStyle}">
            <h3 style="margin:0 0 10px 0;font-size:18px;font-weight:bold;color:#333333;">
              ${escapeHtml(data.execSummaryTitle || "Executive Summary")}
            </h3>
            <div style="margin:0;font-size:16px;color:#333333;">
              ${unwrapParagraphsInTables(stripInlineBackgrounds(sanitizeHtml(data.execSummary)))}
            </div>
          </td>
        </tr>` : ""}

        ${data.highlightsHtml ? `
        <tr>
          <td colspan="1" style="${oddRowStyle}">
            <h3 style="margin:0 0 10px 0;font-size:18px;font-weight:bold;color:#333333;">
              ${escapeHtml(data.highlightsTitle || "Highlights / Accomplishments")}
            </h3>
            <div style="margin:0;font-size:16px;color:#333333;">
              ${processedHighlights}
            </div>
          </td>
        </tr>` : ""}
      </table>

      ${data.updatesHtml ? `
      <h2 style="font-size:20px;font-weight:bold;color:#333;margin:24px 0 8px 0;">${escapeHtml(data.updatesTitle || "Top Accomplishments")}</h2>
      ${data.sectionTitle ? `<h3 style=\"font-size:18px;font-weight:600;color:#555;margin:8px 0 16px 0;\">${escapeHtml(data.sectionTitle)}</h3>` : ""}
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:16px;">${processedUpdates}</td></tr>
      </table>` : ""}

      ${data.milestonesHtml ? `
      <h2 style="font-size:20px;font-weight:bold;color:#333;margin:24px 0 8px 0;">${escapeHtml(data.milestonesTitle || "Upcoming Milestones")}</h2>
      ${data.milestonesSectionTitle ? `<h3 style=\"font-size:18px;font-weight:600;color:#555;margin:8px 0 16px 0;\">${escapeHtml(data.milestonesSectionTitle)}</h3>` : ""}
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:16px;">${processedMilestones}</td></tr>
      </table>` : ""}

      ${data.keyDecisionsHtml ? `
      <h2 style="font-size:20px;font-weight:bold;color:#333;margin:24px 0 8px 0;">${escapeHtml(data.keyDecisionsTitle || "Key Decisions")}</h2>
      ${data.keyDecisionsSectionTitle ? `<h3 style=\"font-size:18px;font-weight:600;color:#555;margin:8px 0 16px 0;\">${escapeHtml(data.keyDecisionsSectionTitle)}</h3>` : ""}
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:16px;">${processedKeyDecisions}</td></tr>
      </table>` : ""}

      ${data.risksHtml ? `
      <h2 style="font-size:20px;font-weight:bold;color:#333;margin:24px 0 8px 0;">${escapeHtml(data.risksTitle || "Risks & Issue Mitigation Plan")}</h2>
      ${data.risksSectionTitle ? `<h3 style=\"font-size:18px;font-weight:600;color:#555;margin:8px 0 16px 0;\">${escapeHtml(data.risksSectionTitle)}</h3>` : ""}
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:16px;">${processedRisks}</td></tr>
      </table>` : ""}

      ${data.resourcesHtml ? `
      <h2 style="font-size:20px;font-weight:bold;color:#333;margin:24px 0 8px 0;">${escapeHtml(data.resourcesTitle || "Additional Resources")}</h2>
      ${data.resourcesSectionTitle ? `<h3 style=\"font-size:18px;font-weight:600;color:#555;margin:8px 0 16px 0;\">${escapeHtml(data.resourcesSectionTitle)}</h3>` : ""}
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:16px;">${processedResources}</td></tr>
      </table>` : ""}

    </td></tr>
  </table>
</body>
</html>`;
}

export default buildHtml;

