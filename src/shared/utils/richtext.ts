const ALLOWED = new Set([
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "strike",
  "h1",
  "h2",
  "h3",
  "p",
  "div",
  "br",
  "ul",
  "ol",
  "li",
  "span",
  "figure",
  "figcaption",
  "img",
]);

const COLOR =
  /^(?:#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[\d.]+\s*)?\)|transparent|[a-z]{3,20})$/i;

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function cleanStyle(raw: string): string {
  const out: string[] = [];
  for (const part of raw.split(";")) {
    const i = part.indexOf(":");
    if (i < 0) continue;
    const prop = part.slice(0, i).trim().toLowerCase();
    const val = part.slice(i + 1).trim();
    if ((prop === "color" || prop === "background-color") && COLOR.test(val))
      out.push(`${prop}: ${val}`);
    else if (prop === "font-weight" && /^(bold|normal|[1-9]00)$/.test(val))
      out.push(`${prop}: ${val}`);
    else if (prop === "font-style" && /^(italic|normal)$/.test(val))
      out.push(`${prop}: ${val}`);
    else if (
      prop === "text-decoration" &&
      /^(underline|line-through|none|underline line-through)$/.test(val)
    )
      out.push(`${prop}: ${val}`);
  }
  return out.join("; ");
}

// Пропускаем только свои теги и безопасные стили. Всё остальное превращается в обычный текст.
export function sanitizeHtml(html: string): string {
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed)\b[\s\S]*?<\/\1\s*>/gi, "");
  return stripped
    .split(/(<[^<>]*>)/)
    .map((tok) => {
      if (!(tok.startsWith("<") && tok.endsWith(">")))
        return tok.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const m = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>$/.exec(tok);
      if (!m) return tok.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const tag = m[2].toLowerCase();
      if (!ALLOWED.has(tag)) return "";
      if (m[1]) return `</${tag}>`;
      if (tag === "img") {
        const src = /\ssrc\s*=\s*["']([^"']+)["']/i.exec(m[3])?.[1] ?? "";
        if (!/^(?:https?:|file:|content:|data:image\/)/i.test(src)) {
          return "";
        }
        return src ? `<img src="${src.replace(/"/g, "&quot;")}">` : "";
      }
      if (tag === "br") return "<br>";
      const sm =
        /\sstyle\s*=\s*"([^"]*)"/i.exec(m[3]) ??
        /\sstyle\s*=\s*'([^']*)'/i.exec(m[3]);
      const style = sm ? cleanStyle(sm[1]) : "";
      return style ? `<${tag} style="${style}">` : `<${tag}>`;
    })
    .join("");
}

export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|li)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const textToHtml = (text: string) =>
  escapeHtml(text).replace(/\n/g, "<br>");
export const promptHtml = (prompt: string) =>
  `<h2>${escapeHtml(prompt)}</h2><div><br></div>`;
