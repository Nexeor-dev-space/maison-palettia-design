import { chapters, front } from "@/docs/admin-guide/content";
import type { Block, Chapter, Section } from "@/docs/admin-guide/content/types";

import { inlineAnchors, inlineText } from "./inline";

/**
 * ==========================================================================
 * The admin guide as data — lookups, checks and the search index
 * ==========================================================================
 *
 * The chapters live in docs/admin-guide/content (one typed file each). This
 * module is what the Docs tab, the print layout, the asset route and the
 * ⌘K palette read them through, so the rules about the content (unique
 * anchors, links that land somewhere) are enforced in one place.
 *
 * Server-only in practice: importing it pulls every chapter in. Client
 * components get what they need as props (the palette gets titles only).
 */

export { chapters, front };
export type { Block, Chapter, Section };

/** "Chapter 03", or the chapter's own eyebrow ("Start here"). */
export const chapterLabel = (c: Chapter): string => c.eyebrow ?? `Chapter ${String(c.number ?? 0).padStart(2, "0")}`;

/** The short form for the contents list: "03", or "★" for the checklist. */
export const chapterNum = (c: Chapter): string => (c.number == null ? "★" : String(c.number).padStart(2, "0"));

export const chapterBySlug = (slug: string): Chapter | undefined => chapters.find((c) => c.slug === slug);

export function neighbours(slug: string): { prev?: Chapter; next?: Chapter } {
  const i = chapters.findIndex((c) => c.slug === slug);
  return { prev: i > 0 ? chapters[i - 1] : undefined, next: i >= 0 && i < chapters.length - 1 ? chapters[i + 1] : undefined };
}

/** Which chapter each anchor (chapter slug or section id) lives in. */
export const anchorChapter: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const c of chapters) {
    map.set(c.slug, c.slug);
    for (const s of c.sections) map.set(s.id, c.slug);
  }
  return map;
})();

/** Every screenshot file the guide uses, in reading order. */
export function screenshotFiles(): string[] {
  const files: string[] = [];
  const walk = (blocks: Block[]) => {
    for (const b of blocks) {
      if (b.type === "screenshot") files.push(b.file);
      else if (b.type === "phones") files.push(...b.shots.map((s) => s.file));
      else if (b.type === "faq") b.items.forEach((i) => walk(i.blocks));
    }
  };
  for (const c of chapters) {
    walk(c.intro ?? []);
    c.sections.forEach((s) => walk(s.blocks));
  }
  return files;
}

// ─── checks ────────────────────────────────────────────────────────────────

/** A mock's visible words, escaped so `{{customer.firstName}}` stays literal when flattened as inline markup. */
function mockText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[\\*`[{(<]/g, "\\$&");
}

/** Every inline string in a block, for link checks and search. */
function blockStrings(b: Block): string[] {
  switch (b.type) {
    case "paragraph":
      return [b.text];
    case "heading":
      return [b.text];
    case "steps":
    case "list":
    case "legend":
      return b.items;
    case "screenshot":
      return [b.caption, ...b.callouts.map((c) => c.label)];
    case "phones":
      return b.shots.flatMap((s) => [s.caption, ...s.callouts.map((c) => c.label)]);
    case "tip":
    case "warning":
    case "never":
    case "info":
      return [...(b.title ? [b.title] : []), ...b.text];
    case "table":
      return [...b.head, ...b.rows.flat()];
    case "checklist":
      return b.steps.flatMap((s) => [s.title, ...(s.where ? [s.where] : []), ...s.items.map((i) => i.text)]);
    case "roleMatrix":
      return b.groups.flatMap((g) => [g.title, ...g.rows.map((r) => r.job)]);
    case "mock":
      return [...(b.label ? [b.label] : []), mockText(b.html)];
    case "routine":
      return b.columns.flatMap((c) => [c.title, c.when, ...c.items.flatMap((i) => [i.text, ...(i.note ? [i.note] : [])])]);
    case "timeline":
      return b.items.flatMap((i) => [i.when, i.title, i.text]);
    case "faq":
      return b.items.flatMap((i) => [i.q, ...i.blocks.flatMap(blockStrings)]);
    case "glossary":
      return b.items.flatMap((i) => [i.term, i.definition]);
  }
}

/** Problems with the content: duplicate anchors and links to nowhere. Empty when all is well. */
export function checkGuide(): string[] {
  const problems: string[] = [];
  const seen = new Map<string, string>();
  const claim = (id: string, where: string) => {
    const prior = seen.get(id);
    if (prior) problems.push(`duplicate anchor "${id}" (${prior} and ${where})`);
    else seen.set(id, where);
  };
  for (const c of chapters) {
    if (!/^[a-z0-9-]+$/.test(c.slug)) problems.push(`chapter slug "${c.slug}" must be lower case letters, digits and hyphens`);
    if (c.slug === "print") problems.push(`"print" is reserved for the print layout`);
    claim(c.slug, `chapter ${c.slug}`);
    for (const s of c.sections) claim(s.id, `section in ${c.slug}`);
  }
  const strings: Array<[string, string]> = [];
  strings.push(...front.howToRead.map((h) => ["front", h.text] as [string, string]));
  for (const c of chapters) {
    strings.push(...[c.lede, ...c.summary, ...(c.intro ?? []).flatMap(blockStrings)].map((s) => [c.slug, s] as [string, string]));
    for (const s of c.sections) strings.push(...s.blocks.flatMap(blockStrings).map((t) => [`${c.slug}#${s.id}`, t] as [string, string]));
  }
  for (const [where, s] of strings) {
    for (const a of inlineAnchors(s)) if (!anchorChapter.has(a)) problems.push(`${where}: link to #${a}, which is not a chapter or section`);
  }
  return problems;
}

let warned = false;

/** Reports content problems once per server process (the Docs view calls it; the unit test fails on them). */
export function warnGuideProblemsOnce(report: (problems: string[]) => void): void {
  if (warned) return;
  warned = true;
  const problems = checkGuide();
  if (problems.length) report(problems);
}

// ─── search ────────────────────────────────────────────────────────────────

export type SearchEntry = {
  /** Chapter slug. */
  c: string;
  /** Anchor: the section id, or the chapter slug for the chapter's own intro. */
  a: string;
  /** Chapter title and label, for the result line. */
  ct: string;
  cl: string;
  /** Section title (the chapter title for the chapter entry). */
  t: string;
  /** Extra words that should match (keywords, menu route, who). */
  k: string;
  /** The section's readable text, flattened. */
  x: string;
};

const flat = (strings: string[]) => strings.map(inlineText).join(" ").replace(/\s+/g, " ").trim();

let index: SearchEntry[] | null = null;

/** One entry per chapter intro and per section. About 120 KB of JSON for the October 2026 guide. */
export function searchIndex(): SearchEntry[] {
  if (index) return index;
  const out: SearchEntry[] = [];
  for (const c of chapters) {
    const label = chapterLabel(c);
    out.push({ c: c.slug, a: c.slug, ct: c.title, cl: label, t: c.title, k: [c.keywords ?? "", c.blurb].join(" "), x: flat([c.lede, ...c.summary, ...(c.intro ?? []).flatMap(blockStrings)]) });
    for (const s of c.sections) {
      out.push({
        c: c.slug,
        a: s.id,
        ct: c.title,
        cl: label,
        t: s.title,
        k: [s.keywords ?? "", s.path ? inlineText(`{{${s.path}}}`) : "", s.who ?? "", s.hint ?? ""].join(" ").trim(),
        x: flat(s.blocks.flatMap(blockStrings)),
      });
    }
  }
  index = out;
  return out;
}
