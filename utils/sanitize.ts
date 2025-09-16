// utils/sanitize.ts
export const SECURITY_CONFIG = {
  MAX_FIELD_LENGTH: 20000,
  MAX_EXEC_SUMMARY_LENGTH: 3000,
  MAX_UPDATES_LENGTH: 100000,
  MAX_CSS_LENGTH: 5000,
  ALLOWED_TAGS: new Set([
    "b","i","u","p","br","ul","ol","li","a","table","thead","tbody","tr","th","td",
    "strong","em","div","span","h1","h2","h3","img",
  ]),
  ALLOWED_ATTRIBUTES: {
    "*": ["class", "style"],
    a: ["href", "title", "target"],
    img: ["src", "alt", "width", "height"],
    table: ["class","style","border","cellpadding","cellspacing",
            "data-testid","data-number-column","data-table-width","data-layout"],
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

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") return "";
  try {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;

    const isSafeHref = (href: string) => {
      try {
        const url = new URL(href, "https://example.com");
        return ["http:", "https:", "mailto:"].includes(url.protocol);
      } catch { return false; }
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
    return String(html)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;");
  }
}

