// lib/html/transforms.ts

/** Security policy used across the app */
export const SECURITY_CONFIG = {
  MAX_FIELD_LENGTH: 20000,
  MAX_EXEC_SUMMARY_LENGTH: 3000,
  MAX_UPDATES_LENGTH: 100000,
  MAX_CSS_LENGTH: 5000,
  ALLOWED_TAGS: new Set([
    "b","i","u","p","br","ul","ol","li","a","table","thead","tbody","tr","th","td",
    "strong","em","div","span","h1","h2","h3","img"
  ]),
  ALLOWED_ATTRIBUTES: {
    "*": ["class","style"],
    a: ["href","title","target"],
    img: ["src","alt","width","height"],
    table: ["class","style","border","cellpadding","cellspacing","data-testid","data-number-column","data-table-width","data-layout"],
    th: ["class","style","colspan","rowspan","scope"],
    td: ["class","style","colspan","rowspan"],
    tr: ["class","style"],
    thead: ["class","style"],
    tbody: ["class","style"],
    tfoot: ["class","style"],
  },
  DANGEROUS_PROTOCOLS: /^(javascript:|data:|vbscript:|file:|about:)/i,
  CSS_INJECTION_PATTERNS: /(expression|javascript|@import|behavior|binding)/i,
  HTML_INJECTION_PATTERNS: new RegExp("<(?:script|iframe|object|embed|link|meta|base)", "i"),
};

// ---------- inline/text helpers ----------
export const safeInline = (s: string) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/&lt;(\/)?(b|i|u)&gt;/g, "<$1$2>");

export const nlToParas = (text: string) => {
  const parts = String(text || "")
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.map((p) => safeInline(p).replace(/\n/g, "<br>")).join("<br><br>");
};

export function listAwareTextToHtml(text: string): string {
  const src = (text ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = src.split("\n");
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length === 0) return nlToParas(src);

  const bulletRe = /^\s*([-*•])\s+/;
  const numberRe = /^\s*\d+[.)]\s+/;

  const isAllBullets = nonEmpty.every((l) => bulletRe.test(l));
  const isAllNumbers = nonEmpty.every((l) => numberRe.test(l));

  if (isAllBullets) {
    const items = nonEmpty.map((l) => l.replace(bulletRe, "").trim());
    return `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
  }
  if (isAllNumbers) {
    const items = nonEmpty.map((l) => l.replace(numberRe, "").trim());
    return `<ol>${items.map((i) => `<li>${i}</li>`).join("")}</ol>`;
  }
  return nlToParas(src);
}

// ---------- DOM transforms / sanitization ----------
export const unwrapParagraphsInTables = (html: string): string => {
  if (!html) return "";
  const root = document.createElement("div");
  root.innerHTML = html;
  root.querySelectorAll("table td, table th").forEach((cell) => {
    const ps = Array.from(cell.querySelectorAll("p"));
    ps.forEach((p, i) => {
      const span = document.createElement("span");
      span.innerHTML = (p as HTMLElement).innerHTML;
      p.replaceWith(span);
      if (i !== ps.length - 1) span.insertAdjacentHTML("afterend", "<br>");
    });
  });
  return root.innerHTML;
};

const trimCellWhitespace = (el: HTMLElement) => {
  const TEXT_NODE = 3, ELEMENT_NODE = 1;
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

export const unwrapPsInCellsInPlace = (root: HTMLElement) => {
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
};

export const sanitizeHtml = (html: string): string => {
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
      if (!SECURITY_CONFIG.ALLOWED_TAGS.has(tag)) {
        const parent = el.parentNode;
        if (parent) {
          while (el.firstChild) parent.insertBefore(el.firstChild, el);
          parent.removeChild(el);
        }
        return;
      }
      Array.from(el.attributes).forEach((attr) => {
        const attrName = attr.name.toLowerCase();
        const attrValue = attr.value;
        const allowed =
          SECURITY_CONFIG.ALLOWED_ATTRIBUTES["*"].includes(attrName) ||
          (SECURITY_CONFIG.ALLOWED_ATTRIBUTES as any)[tag]?.includes(attrName);
        if (!allowed) {
          el.removeAttribute(attr.name);
          return;
        }
        if (attrName === "href") {
          if (SECURITY_CONFIG.DANGEROUS_PROTOCOLS.test(attrValue) || !isSafeHref(attrValue)) {
            el.removeAttribute("href");
          }
        }
      });
    });
    return wrapper.innerHTML;
  } catch {
    return html;
  }
};

export const stripInlineBackgrounds = (html: string) => {
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

// striping + width helpers used for email-safe HTML
const HEADER_BG = "#f5f5f5";
const STRIPE_ODD = "#ffffff";
const STRIPE_EVEN = "#f9f9f9";
const LEFT_COL = "30%";
const RIGHT_COL = "70%";

const stripBgDecls = (style: string) => style.replace(/background(?:-color)?:\s*[^;]+;?/gi, "").trim();
const stripDecl = (style: string, prop: string) =>
  style.replace(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*[^;]+;?`, "gi"), "").trim();

export const stripeTables = (html: string): string => {
  if (!html) return html;
  const root = document.createElement("div");
  root.innerHTML = html;

  const getChildRows = (seg: Element) =>
    Array.from(seg.children).filter((el) => el.tagName.toUpperCase() === "TR") as HTMLTableRowElement[];

  root.querySelectorAll("table").forEach((table) => {
    const segments: Element[] = [];
    if (table.tHead) segments.push(table.tHead);
    segments.push(...Array.from(table.tBodies));
    if (table.tFoot) segments.push(table.tFoot);
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

export const clampWidthsForEmail = (html: string): string => {
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

export const widenTables = (html: string): string => {
  if (!html) return html;
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

// Pipelines
export const normalizeEditorHtml = (html: string) =>
  unwrapParagraphsInTables(stripInlineBackgrounds(sanitizeHtml(html)));

export const processRichHtml = (html: string): string =>
  widenTables(stripeTables(clampWidthsForEmail(stripInlineBackgrounds(unwrapParagraphsInTables(sanitizeHtml(html))))));

export const listsToParagraphs = (html: string): string => {
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

