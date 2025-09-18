// components/status-form/buildEmailHtml.ts
// Self‑contained email HTML builder you can drop in.
// No external imports required. When you're ready, you can factor
// shared helpers out to a utils file.

export const EMAIL_MAX_WIDTH = 900; // px

// ---------- Minimal types used by this module ----------
export type DensityName = "comfortable" | "cozy" | "compact";
export type PlayerKind = "sharepoint" | "audio" | "unknown" | "";

export type DesignOptions = {
  optFont?: string;
  optAccent?: string;
  optDensity?: DensityName;
  optBorders?: "lines" | "cards" | "none";
  optCustomCss?: string;
  optLogoMode?: "none" | "url" | "cid";
  optLogoUrl?: string;
  optBannerMode: "none" | "url" | "cid";
  optBannerId?: string; // used when mode=cid
  optBannerUrl?: string; // used when mode=url
  optBannerCaption?: string;
  optReportKind?: string;
};

export type FormData = {
  programTitle: string;
  programSummary: string;
  asOf: string; // YYYY-MM-DD
  lastStatus: string;
  currentStatus: string;
  trending: string;
  tpm: string;
  engDri: string;
  bizSponsor: string;
  engSponsor: string;

  execSummaryTitle: string;
  execSummary: string; // HTML

  highlightsTitle: string;
  highlightsHtml: string; // HTML (often list-like)

  updatesTitle: string;
  sectionTitle: string; // optional H3 for updates
  updatesHtml: string; // HTML

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

  // optional/unused here
  emailTo?: string;
  audioMp3Url?: string;
  audioValidatedUrl?: string;
  audioPlayer?: PlayerKind;
};

// ---------- Small HTML helpers (email-safe) ----------
const escapeHtml = (s: string): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

const nlToParas = (text: string): string => {
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

// --- Sanitization + light normalization ---
const SECURITY = {
  ALLOWED_TAGS: new Set([
    "b","i","u","p","br","ul","ol","li","a","table","thead","tbody","tr","th","td",
    "strong","em","div","span","h1","h2","h3","img"
  ]),
  ALLOWED_ATTRS: {
    "*": ["class", "style"],
    a: ["href", "title", "target"],
    img: ["src", "alt", "width", "height"],
    table: ["class", "style", "border", "cellpadding", "cellspacing", "data-testid", "data-number-column", "data-table-width", "data-layout"],
    th: ["class", "style", "colspan", "rowspan", "scope"],
    td: ["class", "style", "colspan", "rowspan"],
    tr: ["class", "style"],
    thead: ["class", "style"],
    tbody: ["class", "style"],
    tfoot: ["class", "style"],
  } as Record<string, string[]>,
  DANGEROUS_PROTOCOLS: /^(javascript:|data:|vbscript:|file:|about:)/i,
};

// NOTE: Uses DOM APIs; call this in the browser/runtime with `document` available.
const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== "string") return "";
  try {
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
      if (!SECURITY.ALLOWED_TAGS.has(tag)) {
        const parent = el.parentNode;
        if (parent) {
          while (el.firstChild) parent.insertBefore(el.firstChild, el);
          parent.removeChild(el);
        }
        return;
      }

      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const val = attr.value;
        const allowed = SECURITY.ALLOWED_ATTRS["*"].includes(name) || (SECURITY.ALLOWED_ATTRS[tag] || []).includes(name);
        if (!allowed) {
          el.removeAttribute(attr.name);
          return;
        }
        if (name === "href") {
          if (SECURITY.DANGEROUS_PROTOCOLS.test(val) || !isSafeHref(val)) el.removeAttribute("href");
        }
      });
    });

    return wrapper.innerHTML;
  } catch {
    return escapeHtml(html);
  }
};

const unwrapParagraphsInTables = (html: string): string => {
  if (!html) return "";
  const root = document.createElement("div");
  root.innerHTML = html;
  root.querySelectorAll("table td, table th").forEach((cell) => {
    const ps = Array.from(cell.querySelectorAll("p"));
    ps.forEach((p, i) => {
      const frag = document.createDocumentFragment();
      while (p.firstChild) frag.appendChild(p.firstChild);
      if (i !== ps.length - 1) frag.appendChild(document.createElement("br"));
      (p as HTMLElement).replaceWith(frag);
    });
    trimCellWhitespace(cell as HTMLElement);
  });
  return root.innerHTML;
};

const stripInlineBackgrounds = (html: string): string => {
  if (!html) return "";
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

const STRIPE_ODD = "#ffffff";
const STRIPE_EVEN = "#f9f9f9";
const HEADER_BG = "#f5f5f5";

const stripDecl = (style: string, prop: string) =>
  style.replace(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*[^;]+;?`, "gi"), "").trim();

const stripBgDecls = (style: string) => style.replace(/background(?:-color)?:\s*[^;]+;?/gi, "").trim();

const trimCellWhitespace = (el: HTMLElement) => {
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

const stripeTables = (html: string): string => {
  if (!html) return html;
  const root = document.createElement("div");
  root.innerHTML = html;

  const getChildRows = (seg: Element) =>
    Array.from(seg.children).filter((el) => el.tagName.toUpperCase() === "TR") as HTMLTableRowElement[];

  root.querySelectorAll("table").forEach((table) => {
    const segments: Element[] = [];
    if ((table as HTMLTableElement).tHead) segments.push((table as HTMLTableElement).tHead!);
    segments.push(...Array.from((table as HTMLTableElement).tBodies));
    if ((table as HTMLTableElement).tFoot) segments.push((table as HTMLTableElement).tFoot!);
    if (segments.length === 0) segments.push(table);

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

const LEFT_COL = "30%";
const RIGHT_COL = "70%";

const widenTables = (html: string): string => {
  if (!html) return html;
  const root = document.createElement("div");
  root.innerHTML = html;

  root.querySelectorAll("table").forEach((table) => {
    const t = table as HTMLTableElement;
    t.style.width = "100%";
    t.setAttribute("width", "100%");
    t.style.tableLayout = "fixed";
    t.style.removeProperty("white-space");

    // 30/70 colgroup where appropriate
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

const listsToParagraphs = (html: string): string => {
  if (!html) return "";
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

// Banner helper (email mode only)
const getBannerHtml = (opts: DesignOptions, maxWidth = EMAIL_MAX_WIDTH): string => {
  if (opts.optBannerMode === "none") return "";
  let src = "";
  if (opts.optBannerMode === "url" && opts.optBannerUrl) src = opts.optBannerUrl;
  if (opts.optBannerMode === "cid" && opts.optBannerId) src = `cid:${opts.optBannerId}`;
  if (!src) return "";
  const caption = opts.optBannerCaption || "Program Status";
  const alt = caption;
  return `
    <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="${maxWidth}"
      style="display:block;width:100%;max-width:${maxWidth}px;height:auto;border:0;outline:0;-ms-interpolation-mode:bicubic;" />
  `;
};

// ---------- Email builder ----------
export function buildEmailHtml(data: FormData, opts: DesignOptions): string {
  const asOf = data.asOf
    ? (() => {
        const [y, m, d] = data.asOf.split("-").map(Number);
        return new Date(y, m - 1, d).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      })()
    : "";

  // Density scaling used only for the Status + Team 4-col tables
  const dens = (opts.optDensity ?? "comfortable") as DensityName;
  const scale = dens === "compact" ? 0.8 : dens === "cozy" ? 0.9 : 1;
  const px = (n: number) => `${Math.round(n * scale)}px`;

  const containerWidth = EMAIL_MAX_WIDTH;
  const outerTableStyle =
    `border-collapse:collapse;width:100%;max-width:${containerWidth}px;` +
    `margin:0 auto;mso-table-lspace:0pt;mso-table-rspace:0pt;`;
  const innerTableStyle =
    "border-collapse:collapse;width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;";

  const fontFamily = opts.optFont || "Arial, Helvetica, sans-serif";
  const baseText = `font-family:${fontFamily};color:#111;`;
  const baseFont = `${baseText}font-size:16px;line-height:1.45;`;

  const cellBase = `${baseFont}padding:16px;border:1px solid #e5e7eb;`;
  const cellLeft = `${cellBase}text-align:left;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;`;
  const headCellLeft = `${cellBase}background-color:#f5f5f5;font-weight:700;text-align:left;vertical-align:middle;`;
  const titleCell = `${cellBase}background-color:#e5e7eb;font-weight:700;font-size:20px;text-align:left;vertical-align:middle;`;

  const sFont = `${baseText}font-size:${px(14)};line-height:1.35;`;
  const sCellBase = `${sFont}padding:${px(8)} ${px(10)};border:1px solid #e5e7eb;`;
  const sCellCenter = `${sCellBase}text-align:center;vertical-align:middle;`;
  const sHeadCellC = `${sCellBase}background-color:#f5f5f5;font-weight:700;text-align:center;vertical-align:middle;font-size:${px(13)};`;

  const sectionHeaderRow = (label: string) =>
    `<tr><td style="${headCellLeft}" bgcolor="#f5f5f5" align="left">${escapeHtml(label)}</td></tr>`;

  const emailPill = (s: string) => {
    const colors = {
      green: { bg: "#27c08a", color: "#fff" },
      yellow: { bg: "#f4c542", color: "#111" },
      red: { bg: "#e5534b", color: "#fff" },
    } as const;
    const c = colors[(s || "").toLowerCase() as keyof typeof colors] || colors.green;
    return `<span style="${sFont}display:inline-block;padding:${px(4)} ${px(8)};border-radius:${px(10)};font-weight:700;background-color:${c.bg};color:${c.color};">${escapeHtml(s)}</span>`;
  };

  const fourColColgroup = `
    <colgroup>
      <col style="width:25%" width="25%">
      <col style="width:25%" width="25%">
      <col style="width:25%" width="25%">
      <col style="width:25%" width="25%">
    </colgroup>`;

  const banner = getBannerHtml(opts, containerWidth);

  // Sanitize + normalize rich sections
  const processedUpdates = processRichHtml(data.updatesHtml);
  const processedMilestones = processRichHtml(data.milestonesHtml);
  const processedKeyDecisions = processRichHtml(data.keyDecisionsHtml);
  const processedRisks = processRichHtml(data.risksHtml);
  const processedResources = processRichHtml(data.resourcesHtml);
  const processedHighlights = processRichHtml(listsToParagraphs(data.highlightsHtml));

  return `
<!-- __LISTEN_CTA__ -->
<!-- Fixed-width banner -->
<table role="presentation" align="center" width="100%" style="${outerTableStyle}" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding:0;">${banner}</td></tr>
</table>

<!-- Fixed-width outer container -->
<table role="presentation" align="center" width="100%" style="${outerTableStyle}" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:0;">
      <!-- Title + Summary -->
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="${titleCell}" bgcolor="#e5e7eb" align="left" valign="middle">
            ${escapeHtml(data.programTitle || "Your Program/Project Title here")}
          </td>
        </tr>
        <tr>
          <td style="${cellLeft}" bgcolor="#ffffff" align="left" valign="top">
            ${nlToParas(data.programSummary)}
          </td>
        </tr>
      </table>

      <!-- Status table -->
      <table role="presentation" width="100%" style="${innerTableStyle};table-layout:fixed" cellpadding="0" cellspacing="0" border="0"> ${fourColColgroup}
        <tr>
          <td style="${sHeadCellC}" bgcolor="#f5f5f5">Last Status</td>
          <td style="${sHeadCellC}" bgcolor="#f5f5f5">Current Status</td>
          <td style="${sHeadCellC}" bgcolor="#f5f5f5">Trending</td>
          <td style="${sHeadCellC}" bgcolor="#f5f5f5">Date</td>
        </tr>
        <tr>
          <td style="${sCellCenter}" align="center" valign="middle">${emailPill(data.lastStatus)}</td>
          <td style="${sCellCenter}" align="center" valign="middle">${emailPill(data.currentStatus)}</td>
          <td style="${sCellCenter}" align="center" valign="middle">${emailPill(data.trending)}</td>
          <td style="${sCellCenter}" align="center" valign="middle">${escapeHtml(asOf)}</td>
        </tr>
      </table>

      <!-- Team -->
      <table role="presentation" width="100%" style="${innerTableStyle};table-layout:fixed" cellpadding="0" cellspacing="0" border="0"> ${fourColColgroup}
        <tr>
          <td style="${sHeadCellC}" bgcolor="#f5f5f5">TPM</td>
          <td style="${sHeadCellC}" bgcolor="#f5f5f5">Engineering DRI</td>
          <td style="${sHeadCellC}" bgcolor="#f5f5f5">Business Sponsor</td>
          <td style="${sHeadCellC}" bgcolor="#f5f5f5">Engineering Sponsor</td>
        </tr>
        <tr>
          <td style="${sCellCenter}" align="center" valign="middle">${escapeHtml(data.tpm)}</td>
          <td style="${sCellCenter}" align="center" valign="middle">${escapeHtml(data.engDri)}</td>
          <td style="${sCellCenter}" align="center" valign="middle">${escapeHtml(data.bizSponsor)}</td>
          <td style="${sCellCenter}" align="center" valign="middle">${escapeHtml(data.engSponsor)}</td>
        </tr>
      </table>

      ${data.execSummary ? `
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        ${sectionHeaderRow(data.execSummaryTitle || "Executive Summary")}
        <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">
          ${unwrapParagraphsInTables(stripInlineBackgrounds(sanitizeHtml(data.execSummary)))}
        </td></tr>
      </table>` : ""}

      ${data.highlightsHtml ? `
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        ${sectionHeaderRow(data.highlightsTitle || "Highlights / Accomplishments")}
        <tr>
          <td style="${cellLeft}" bgcolor="#ffffff" align="left">
            ${processedHighlights}
          </td>
        </tr>
      </table>` : ""}

      ${data.updatesHtml ? `
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        ${sectionHeaderRow(data.updatesTitle || "Top Accomplishments")}
        ${data.sectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left"><strong>${escapeHtml(data.sectionTitle)}</strong></td></tr>` : ""}
        <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedUpdates}</td></tr>
      </table>` : ""}

      ${data.milestonesHtml ? `
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        ${sectionHeaderRow(data.milestonesTitle || "Upcoming Milestones")}
        ${data.milestonesSectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left"><strong>${escapeHtml(data.milestonesSectionTitle)}</strong></td></tr>` : ""}
        <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedMilestones}</td></tr>
      </table>` : ""}

      ${data.keyDecisionsHtml ? `
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        ${sectionHeaderRow(data.keyDecisionsTitle || "Key Decisions")}
        ${data.keyDecisionsSectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left"><strong>${escapeHtml(data.keyDecisionsSectionTitle)}</strong></td></tr>` : ""}
        <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedKeyDecisions}</td></tr>
      </table>` : ""}

      ${data.risksHtml ? `
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        ${sectionHeaderRow(data.risksTitle || "Risks & Issue Mitigation Plan")}
        ${data.risksSectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left"><strong>${escapeHtml(data.risksSectionTitle)}</strong></td></tr>` : ""}
        <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedRisks}</td></tr>
      </table>` : ""}

      ${data.resourcesHtml ? `
      <table role="presentation" width="100%" style="${innerTableStyle}" cellpadding="0" cellspacing="0" border="0">
        ${sectionHeaderRow(data.resourcesTitle || "Additional Resources")}
        ${data.resourcesSectionTitle ? `<tr><td style="${cellLeft}" bgcolor="#ffffff" align="left"><strong>${escapeHtml(data.resourcesSectionTitle)}</strong></td></tr>` : ""}
        <tr><td style="${cellLeft}" bgcolor="#ffffff" align="left">${processedResources}</td></tr>
      </table>` : ""}

    </td>
  </tr>
</table>`;
}

