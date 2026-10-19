/**
 * ==========================================================================
 * The guide's inline markup — parse once, render or flatten anywhere
 * ==========================================================================
 *
 * Chapter files (docs/admin-guide/content) keep sentences as plain strings
 * with a little markup, so they read naturally in the source:
 *
 *   **bold**  *italic*  `code`  [[Button]]  {{Menu > Item}}  ((3))  <<⌘>>
 *   [words](#section-id)  [words](https://…)
 *
 * `parseInline` turns a string into a small tree; the Docs tab renders it
 * (cms/components/docs/Inline.tsx) and the search index flattens it with
 * `inlineText`. Pure functions, no React, safe on server and client.
 *
 * Unclosed markers are kept as literal text rather than swallowing the
 * rest of the sentence, and a backslash escapes the next character.
 */

export type InlineNode =
  | { t: "text"; v: string }
  | { t: "b"; c: InlineNode[] }
  | { t: "i"; c: InlineNode[] }
  | { t: "code"; v: string }
  | { t: "ui"; v: string }
  | { t: "path"; parts: string[] }
  | { t: "callout"; n: number }
  | { t: "kbd"; v: string }
  | { t: "link"; href: string; c: InlineNode[] };

/** Index of `close` at or after `from`, skipping backslash-escaped characters; -1 if absent. */
function findClose(src: string, close: string, from: number): number {
  for (let i = from; i <= src.length - close.length; i++) {
    if (src[i] === "\\") {
      i++;
      continue;
    }
    if (src.startsWith(close, i)) return i;
  }
  return -1;
}

const unescape = (s: string) => s.replace(/\\(.)/g, "$1");

const cache = new Map<string, InlineNode[]>();

export function parseInline(src: string): InlineNode[] {
  const hit = cache.get(src);
  if (hit) return hit;
  const nodes = parse(src);
  if (cache.size > 5000) cache.clear();
  cache.set(src, nodes);
  return nodes;
}

function parse(src: string): InlineNode[] {
  const out: InlineNode[] = [];
  let text = "";
  const flush = () => {
    if (text) out.push({ t: "text", v: text });
    text = "";
  };
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\\" && i + 1 < src.length) {
      text += src[i + 1];
      i += 2;
      continue;
    }
    const pair = (open: string, close: string): [string, number] | null => {
      if (!src.startsWith(open, i)) return null;
      const end = findClose(src, close, i + open.length);
      if (end < 0) return null;
      return [src.slice(i + open.length, end), end + close.length];
    };
    let m: [string, number] | null;
    if ((m = pair("**", "**"))) {
      flush();
      out.push({ t: "b", c: parse(m[0]) });
      i = m[1];
      continue;
    }
    if ((m = pair("[[", "]]"))) {
      flush();
      out.push({ t: "ui", v: unescape(m[0]) });
      i = m[1];
      continue;
    }
    if ((m = pair("{{", "}}"))) {
      flush();
      out.push({ t: "path", parts: unescape(m[0]).split(" > ").map((s) => s.trim()) });
      i = m[1];
      continue;
    }
    if (src.startsWith("((", i)) {
      const cm = /^\(\((\d{1,2})\)\)/.exec(src.slice(i));
      if (cm) {
        flush();
        out.push({ t: "callout", n: Number(cm[1]) });
        i += cm[0].length;
        continue;
      }
    }
    if ((m = pair("<<", ">>"))) {
      flush();
      out.push({ t: "kbd", v: unescape(m[0]) });
      i = m[1];
      continue;
    }
    if (ch === "`") {
      const end = findClose(src, "`", i + 1);
      if (end > i) {
        flush();
        out.push({ t: "code", v: unescape(src.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }
    if (ch === "*" && src[i + 1] !== "*") {
      const end = findClose(src, "*", i + 1);
      if (end > i + 1) {
        flush();
        out.push({ t: "i", c: parse(src.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }
    if (ch === "[") {
      const mid = findClose(src, "](", i + 1);
      if (mid > i) {
        const end = findClose(src, ")", mid + 2);
        if (end > mid) {
          flush();
          out.push({ t: "link", href: src.slice(mid + 2, end).trim(), c: parse(src.slice(i + 1, mid)) });
          i = end + 1;
          continue;
        }
      }
    }
    text += ch;
    i++;
  }
  flush();
  return out;
}

/** The words a reader sees, for search and for alt text. Callout numbers are left out. */
export function nodesText(nodes: InlineNode[]): string {
  let s = "";
  for (const n of nodes) {
    switch (n.t) {
      case "text":
      case "code":
      case "ui":
      case "kbd":
        s += n.v;
        break;
      case "path":
        s += n.parts.join(" › ");
        break;
      case "callout":
        break;
      case "b":
      case "i":
      case "link":
        s += nodesText(n.c);
        break;
    }
  }
  return s;
}

export const inlineText = (src: string): string =>
  nodesText(parseInline(src))
    .replace(/\s+/g, " ")
    .replace(/ ([.,;:!?)])/g, "$1") // a dropped callout must not leave "seats ." behind
    .trim();

/** Every `#anchor` a string links to — used to check that links point at real sections. */
export function inlineAnchors(src: string): string[] {
  const found: string[] = [];
  const walk = (nodes: InlineNode[]) => {
    for (const n of nodes) {
      if (n.t === "link" && n.href.startsWith("#")) found.push(n.href.slice(1));
      if (n.t === "b" || n.t === "i" || n.t === "link") walk(n.c);
    }
  };
  walk(parseInline(src));
  return found;
}
