import { convertLexicalToHTML, defaultHTMLConverters } from "@payloadcms/richtext-lexical/html";
import { convertLexicalToPlaintext } from "@payloadcms/richtext-lexical/plaintext";

/**
 * ==========================================================================
 * Template rendering — variables in, safe HTML and plain text out (SPEC §H.8)
 * ==========================================================================
 *
 * Pure functions, no database: cms/lib/templates.ts loads the template and
 * the site details and calls these; the unit tests call them directly.
 *
 * WHERE ESCAPING HAPPENS. Variables are substituted into the Lexical
 * document *before* it is converted, as plain strings in text nodes and in
 * link URLs. Payload's own converters then do the escaping: every text node
 * goes through `escape-html`, every link URL through `sanitizeUrl` (only
 * http, https, mailto, tel and relative URLs survive; `javascript:` becomes
 * `#`) and then `escape-html`. So a customer who types
 * `<img src=x onerror=…>` as their first name reads it back as text, and
 * there is no `{{{raw}}}` form on purpose (research 03 §8.3). The subject
 * and preheader are substituted raw and escaped by the layout when they are
 * placed into HTML.
 *
 * WHY LINK URLS COME IN TWO SPELLINGS. Payload's link field runs
 * `encodeURIComponent` on any URL that does not look like one
 * (features/link/server/baseFields.js), so an editor who types
 * `{{links.tickets}}` into the link dialog saves
 * `%7B%7Blinks.tickets%7D%7D`. Both spellings are recognised.
 *
 * MISSING VALUES render as empty — never as the raw `{{name}}`, which would
 * look broken to a customer. Unknown names cannot reach here from the admin
 * (the template's `beforeValidate` refuses them, `findVariables`).
 */

/** `{{ order.reference }}` — dotted names, optional inner spaces. */
const VARIABLE_RE = /\{\{\s*([A-Za-z][\w.]*)\s*\}\}/g;
/** The same placeholder after Payload's link field URI-encoded it. */
const ENCODED_VARIABLE_RE = /%7B%7B(?:%20|\s)*([A-Za-z][\w.]*)(?:%20|\s)*%7D%7D/gi;

export type TemplateVars = Record<string, unknown>;

/* ────────────────────────────────────────────────────────────────────────── */
/* Values                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

const DUBAI_DATE = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dubai",
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "Sat 11 Oct 2026, 10:00" in Dubai time — the one date format every email uses. */
export function formatDubai(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return DUBAI_DATE.format(d).replace(/^(\w{3}),? /, "$1 ");
}

/** How a variable's value reads in an email. Objects other than dates have no text form and read as empty. */
export function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return formatDubai(value);
  if (Array.isArray(value)) return value.map(stringifyValue).filter(Boolean).join("\n");
  return "";
}

/**
 * Reads `a.b.c` from either nested objects (`{ a: { b: { c } } }`) or a flat
 * key (`{ "a.b.c": … }`), so callers can pass whichever is natural.
 */
export function lookup(vars: TemplateVars | undefined, name: string): unknown {
  if (!vars) return undefined;
  if (Object.prototype.hasOwnProperty.call(vars, name)) return vars[name];
  let cursor: unknown = vars;
  for (const segment of name.split(".")) {
    if (cursor === null || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return cursor;
}

/** Raw substitution. The caller decides about escaping (see the header). */
export function interpolate(template: string | null | undefined, vars: TemplateVars): string {
  if (!template) return "";
  return template
    .replace(VARIABLE_RE, (_match, name: string) => stringifyValue(lookup(vars, name)))
    .replace(ENCODED_VARIABLE_RE, (_match, name: string) => stringifyValue(lookup(vars, name)));
}

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** Every variable name a string uses (both spellings). */
export function findVariablesInString(text: string | null | undefined, into: Set<string> = new Set()): Set<string> {
  if (!text) return into;
  for (const match of text.matchAll(VARIABLE_RE)) into.add(match[1]);
  for (const match of text.matchAll(ENCODED_VARIABLE_RE)) into.add(match[1]);
  return into;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Lexical                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

type LexicalNode = {
  type?: string;
  text?: string;
  children?: LexicalNode[];
  fields?: { url?: string; [key: string]: unknown };
  url?: string;
  [key: string]: unknown;
};

export type LexicalState = { root: LexicalNode & { children: LexicalNode[] } };

export function isLexicalState(value: unknown): value is LexicalState {
  return Boolean(value && typeof value === "object" && Array.isArray((value as LexicalState).root?.children));
}

/** Every variable name a Lexical document uses, in text and in link URLs. */
export function findVariables(state: unknown, into: Set<string> = new Set()): Set<string> {
  if (!isLexicalState(state)) return into;
  const walk = (node: LexicalNode) => {
    if (typeof node.text === "string") findVariablesInString(node.text, into);
    if (typeof node.fields?.url === "string") findVariablesInString(node.fields.url, into);
    if (typeof node.url === "string") findVariablesInString(node.url, into);
    node.children?.forEach(walk);
  };
  walk(state.root);
  return into;
}

const isBlank = (nodes: LexicalNode[] | undefined): boolean =>
  !nodes || nodes.every((node) => node.type === "linebreak" || (node.type === "text" && !String(node.text ?? "").trim()));

/**
 * A copy of the document with every placeholder replaced by its value.
 * A value with line breaks splits its text node into text + `linebreak`
 * nodes, so "one line per item" variables keep their lines in HTML too.
 */
export function interpolateLexical(state: LexicalState, vars: TemplateVars): LexicalState {
  const mapChildren = (children: LexicalNode[] | undefined): LexicalNode[] | undefined => {
    if (!children) return children;
    const out: LexicalNode[] = [];
    for (const child of children) {
      if (child.type === "text" && typeof child.text === "string") {
        const lines = interpolate(child.text, vars).split("\n");
        lines.forEach((line, index) => {
          if (index > 0) out.push({ type: "linebreak", version: 1 });
          if (line || lines.length === 1) out.push({ ...child, text: line });
        });
        continue;
      }
      const copy: LexicalNode = { ...child };
      if (child.fields && typeof child.fields.url === "string") copy.fields = { ...child.fields, url: interpolate(child.fields.url, vars).trim() };
      if (typeof child.url === "string") copy.url = interpolate(child.url, vars).trim();
      copy.children = mapChildren(child.children);
      // A paragraph that held only optional variables ("{{note}}") and came
      // out empty is dropped, so an absent note leaves no blank gap. A
      // paragraph the editor left empty on purpose has no children and stays.
      if (child.type === "paragraph" && child.children?.length && isBlank(copy.children)) continue;
      out.push(copy);
    }
    return out;
  };
  return { ...state, root: { ...state.root, children: mapChildren(state.root.children) ?? [] } };
}

/* Inline styles: email clients ignore <style> blocks unevenly; the shell sets fonts, these set rhythm. */
const LINK_STYLE = "color:#9059a4;text-decoration:underline;";
const BUTTON_STYLE =
  "display:inline-block;background:#9059a4;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px;";

/**
 * Lexical → email HTML. Payload's default converters, then three inline
 * style passes: paragraph spacing, link colour, and "a paragraph that is
 * only a link becomes a button" — the one layout device editors get without
 * a custom block.
 */
export function lexicalToEmailHtml(state: unknown): string {
  if (!isLexicalState(state)) return "";
  const html = convertLexicalToHTML({
    data: state as never,
    disableContainer: true,
    disableIndent: true,
    converters: { ...defaultHTMLConverters },
  });
  return html
    .replace(/<p(\s[^>]*)?>\s*<a([^>]*?)href="([^"]*)"([^>]*)>((?:(?!<a[\s>])[\s\S])*?)<\/a>\s*<\/p>/g, (_m, _pAttrs, before: string, href: string, after: string, label: string) => {
      const rest = `${before}${after}`.replace(/\sstyle="[^"]*"/g, "");
      return `<p style="margin:24px 0;"><a${rest} href="${href}" style="${BUTTON_STYLE}">${label}</a></p>`;
    })
    .replace(/<p(?![^>]*style=)(\s[^>]*)?>/g, (_m, attrs: string | undefined) => `<p${attrs ?? ""} style="margin:0 0 16px;">`)
    .replace(/<a(?![^>]*style=)(\s)/g, `<a style="${LINK_STYLE}"$1`)
    .replace(/<(ul|ol)(?![^>]*style=)(\s[^>]*)?>/g, (_m, tag: string, attrs: string | undefined) => `<${tag}${attrs ?? ""} style="margin:0 0 16px;padding-left:22px;">`)
    .replace(/<h([1-6])(?![^>]*style=)(\s[^>]*)?>/g, (_m, level: string, attrs: string | undefined) => `<h${level}${attrs ?? ""} style="margin:24px 0 12px;font-size:${level === "1" ? 24 : level === "2" ? 20 : 17}px;line-height:1.3;color:#2d3748;">`);
}

/** Lexical → plain text, keeping link URLs ("Download your tickets: https://…"). */
export function lexicalToEmailText(state: unknown): string {
  if (!isLexicalState(state)) return "";
  const link = ({ node, nodesToPlaintext }: { node: LexicalNode; nodesToPlaintext: (args: { nodes: LexicalNode[] }) => string[] }) => {
    const label = nodesToPlaintext({ nodes: (node.children ?? []) as LexicalNode[] }).join("");
    const url = String(node.fields?.url ?? node.url ?? "");
    if (!url || url === label) return label || url;
    return label ? `${label}: ${url}` : url;
  };
  const text = convertLexicalToPlaintext({
    data: state as never,
    converters: {
      link: link as never,
      autolink: link as never,
      listitem: (({ node, nodesToPlaintext }: { node: LexicalNode; nodesToPlaintext: (args: { nodes: LexicalNode[] }) => string[] }) =>
        `\n• ${nodesToPlaintext({ nodes: (node.children ?? []) as LexicalNode[] }).join("")}`) as never,
    },
  });
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Redaction for the notification log (SPEC §D.5)                             */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Keys whose values are credentials in all but name: a live magic link, a
 * waitlist token, a signed PDF URL. SPEC §D.5's prefix rule, plus the same
 * words as a suffix (`retryUrl`, `bookUrl`, `statusUrl`) because that is
 * how several callers name them.
 */
export const REDACT_KEY_RE = /^(links?|token|url|magic)|(url|link|token)$/i;
/** Belt and braces: a string that carries a signature or token is redacted whatever its key is called. */
const REDACT_VALUE_RE = /([?&](sig|t|w|k|token)=)|\/my-bookings\?|\/admin\/reset\//i;
export const REDACTED = "[redacted]";

/**
 * A copy of `vars` safe to store where front-desk users can read it: every
 * key matching `REDACT_KEY_RE` — at any depth, whole subtrees included — and
 * every string that looks like a signed URL becomes "[redacted]". Dates
 * become ISO strings; functions and symbols are dropped.
 */
export function redactVariables(vars: unknown, depth = 0): unknown {
  if (depth > 8) return REDACTED;
  if (vars === null || vars === undefined) return vars ?? null;
  if (typeof vars === "string") return REDACT_VALUE_RE.test(vars) ? REDACTED : vars;
  if (typeof vars === "number" || typeof vars === "boolean") return vars;
  if (vars instanceof Date) return vars.toISOString();
  if (Array.isArray(vars)) return vars.map((item) => redactVariables(item, depth + 1));
  if (typeof vars === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(vars as Record<string, unknown>)) {
      if (typeof value === "function" || typeof value === "symbol") continue;
      // A flat key ("links.tickets") is judged by its first segment, like a nested one.
      out[key] = REDACT_KEY_RE.test(key) ? REDACTED : redactVariables(value, depth + 1);
    }
    return out;
  }
  return null;
}
