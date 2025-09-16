// components/status-form/utils/tables.ts
import { sanitizeHtml } from "./sanitize";

// Shared layout constants
export const STRIPE_ODD = "#ffffff";
export const STRIPE_EVEN = "#f9f9f9";
export const HEADER_BG  = "#f5f5f5";
export const LEFT_COL   = "30%";
export const RIGHT_COL  = "70%";

export const stripDecl = (style: string, prop: string) =>
  style.replace(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*[^;]+;?`, "gi"), "").trim();

export const stripBgDecls = (style: string) =>
  style.replace(/background(?:-color)?:\s*[^;]+;?/gi, "").trim();

// Trim leading/trailing empty nodes inside a cell
const trimCellWhitespace = (el: HTMLElement) => {
  const TEXT_NODE = 3, ELEMENT_NODE = 1;

  const isEmptyText = (n: Node) => n.nodeType === TEXT_NODE && !/\S/.test(n.textContent || "");
  const isEmptyBlock = (n: Node) => {
    if (n.nodeType !== ELEMENT_NODE) return false;
    const tag = (n as Element).tagName.toUpperCase();
    const isBlock = /^(P|DIV|H1|H2|H3|H4|H5|H6)$/i.test(tag);
    const text = (n as Element).textContent || "";
    const onlyWs = text.replace(/\u00a0|\s/g, "") === "";
    const isBr = tag === "BR";
    return isBr || (isBlock && onlyWs);
  };

  while (el.firstChild && (isEmptyText(el.firstChild) || isEmptyBlock(el.firstChild))) el.removeChild(el.firstChild);
  while (el.lastChild && (isEmptyText(el.lastChild) || isEmptyBlock(el.lastChild))) el.removeChild(el.lastChild);
};

// Unwrap <p> in table cells in-place and trim cell whitespace
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

// Replace <p> inside table cells with inline spans (+ <br>) before insertion
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

// Remove inline backgrounds/marks that break email rendering
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

// Keep tables to 100%, strip fixed widths that blow up email layouts
export const clampWidthsForEmail = (html: string): string => {
  if (!html) return html;
  const root = document.createElement("div");
  root.innerHTML = html;

  // 1) Tables: force width=100%
  root.querySelectorAll("table").forEach((t) => {
    const el = t as HTMLElement;
    el.style.width = "100%";
    el.setAttribute("width", "100%");
    el.removeAttribute("height");
    el.style.removeProperty("max-width");
    el.style.removeProperty("min-width");
  });

  // 2) Cells: strip fixed widths
  root.querySelectorAll("th, td").forEach((cell) => {
    const el = cell as HTMLElement;
    el.style.removeProperty("width");
    el.removeAttribute("width");
    el.style.removeProperty("min-width");
    el.style.removeProperty("max-width");
    el.setAttribute("align", "left");
    el.setAttribute("valign", "top");
  });

  // 3) Wrappers: remove width/positioning
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

  // 4) Images: make responsive
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

// Force 30/70 colgroup, fixed table layout, and cleanup
export const widenTables = (html: string): string => {
  if (!html) return html;
  const root = document.createElement("div");
  root.innerHTML = html;

  root.querySelectorAll("table").forEach((table) => {
    const t = table as HTMLTableElement;

    t.style.width = "100%";
    t.setAttribute("width", "100%");
    t.style.tableLayout = "fixed";
    t.style.removeProperty("white-space"); // strip Confluence artifact

    // Ensure 30/70 colgroup
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

// Zebra stripes with a header row
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

    let rowCounter = 0; // count across the whole table (not per segment)
    segments.forEach((seg) => {
      const rows = getChildRows(seg);
      rows.forEach((tr) => {
        const isHeader = rowCounter === 0;
        const rowColor = isHeader ? HEADER_BG : (rowCounter - 1) % 2 === 0 ? STRIPE_ODD : STRIPE_EVEN;

        (tr as HTMLElement).setAttribute("bgcolor", rowColor);

        Array.from(tr.children).forEach((cell) => {
          if (!/^(TD|TH)$/i.test(cell.tagName)) return;
          const el = cell as HTMLElement;

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

// The standard HTML-processing pipeline we use everywhere
export const processRichHtml = (html: string): string =>
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

