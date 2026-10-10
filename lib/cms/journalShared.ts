import type { Metadata } from "next";

import type { Post } from "@/payload-types";
import type { ImageAsset } from "@/types";

/**
 * ==========================================================================
 * The Journal — shapes and pure helpers (client-safe)
 * ==========================================================================
 *
 * The site's Journal (/journal, /journal/{slug}, /journal/category/{slug})
 * reads `posts` and `post-categories` through the getters in
 * lib/cms/journal.ts, which are server-only (they reach the Payload config).
 * Everything a CLIENT component may need — the card and post shapes, the
 * category inks, the heading-anchor rule, the routes — lives here instead,
 * with no imports beyond types, so a filter chip or a table of contents can
 * import it without dragging the CMS into the browser bundle.
 *
 * The CMS hooks (cms/collections/content/Posts.ts) use the word-count and
 * excerpt helpers too, so the reading time printed on a card and the one
 * stored on the document are computed by the same function.
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* Shapes                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

/** The brand inks a category chip may be drawn in (`post-categories.colour`). */
export type JournalCategoryColour = "lilac" | "sage" | "terracotta" | "cream" | "lavender";

export const JOURNAL_CATEGORY_COLOURS: ReadonlyArray<{ label: string; value: JournalCategoryColour }> = [
  { label: "Deep Lilac", value: "lilac" },
  { label: "Light Sage", value: "sage" },
  { label: "Warm Terracotta", value: "terracotta" },
  { label: "White Rock (cream)", value: "cream" },
  { label: "Soft Lavender", value: "lavender" },
];

/**
 * Chip ground + ink per colour, as the site's own tokens (app/(site)/globals.css).
 * Lilac takes the near-white `on-primary` ink (5:1); terracotta takes the
 * warm near-black Ink (5.4:1 — Charcoal is 4.1:1 on it); the three light
 * grounds take Charcoal text.
 */
export const JOURNAL_CHIP_TOKENS: Record<JournalCategoryColour, { bg: string; fg: string }> = {
  lilac: { bg: "var(--color-primary)", fg: "var(--color-on-primary)" },
  sage: { bg: "var(--color-sage)", fg: "var(--color-text)" },
  terracotta: { bg: "var(--color-terracotta)", fg: "var(--color-brand-ink)" },
  cream: { bg: "var(--color-cream)", fg: "var(--color-text)" },
  lavender: { bg: "var(--color-lavender)", fg: "var(--color-text)" },
};

/** A category as a card or a post carries it. */
export interface JournalCategoryRef {
  slug: string;
  name: string;
  colour: JournalCategoryColour;
  /** `/journal/category/{slug}`. */
  href: string;
}

/** A category as the listing's filter row shows it. */
export interface JournalCategory extends JournalCategoryRef {
  description?: string;
  /** Published posts in this category (drafts too, in draft mode). Hide chips at 0. */
  postCount: number;
}

export interface JournalAuthor {
  /** Never empty: "Maison Palettia" when the editor left it blank. */
  name: string;
  role?: string;
  photo?: ImageAsset;
}

/** Everything a card on /journal (or a "latest from the Journal" strip) prints. */
export interface JournalPostCard {
  id: string;
  slug: string;
  /** `/journal/{slug}`. */
  href: string;
  title: string;
  /** Never empty: the editor's excerpt, else the opening lines of the post (`autoExcerpt`, recomputed on every save). */
  excerpt: string;
  /** Focal point carried as `position`. {@link JOURNAL_PLACEHOLDER} when the file is missing. */
  coverImage: ImageAsset;
  category?: JournalCategoryRef;
  tags: string[];
  author: JournalAuthor;
  /** ISO instant in the studio's offset (+04:00). Format with `formatJournalDate`; never set it in the script face. */
  publishedAt: string;
  /** Whole minutes, at least 1. */
  readingTime: number;
  featured: boolean;
}

export interface JournalHeading {
  /** The anchor: `headingId(text)`, de-duplicated with -2, -3… in document order. */
  id: string;
  text: string;
  level: 2 | 3 | 4;
}

/** The serialized Lexical state of a post body (render with `RichText` from @payloadcms/richtext-lexical/react). */
export type JournalBody = Post["body"];

/** A whole post, for /journal/{slug}. */
export interface JournalPost extends JournalPostCard {
  /** Rich text. Upload nodes carry the populated Media doc in `value` and an optional `fields.caption`. */
  body: JournalBody;
  /** h2–h4 in reading order, for an optional "In this piece" list. */
  headings: JournalHeading[];
  updatedAt: string;
  /** Full-bleed rendition of the cover (`hero`, 2000 px). */
  heroImage: ImageAsset;
  seo: { title: string; description: string; image?: ImageAsset; noindex: boolean };
}

/** One page of the listing. */
export interface JournalPage {
  posts: JournalPostCard[];
  page: number;
  perPage: number;
  totalDocs: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  /** The category being filtered by, when one was asked for and exists. */
  category?: JournalCategory;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Routes                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export const JOURNAL_PATH = "/journal";
export const journalPostHref = (slug: string) => `${JOURNAL_PATH}/${slug}`;
export const journalCategoryHref = (slug: string) => `${JOURNAL_PATH}/category/${slug}`;
export const JOURNAL_FEED_PATH = `${JOURNAL_PATH}/rss.xml`;

/** Adds the feed's `<link rel="alternate" type="application/rss+xml">` to a Journal page's metadata, keeping its canonical. */
export const withJournalFeed = (metadata: Metadata): Metadata => ({
  ...metadata,
  alternates: { ...metadata.alternates, types: { "application/rss+xml": JOURNAL_FEED_PATH } },
});

/** The stand-in for a cover whose file was deleted (`public/images/placeholder.svg`). */
export const JOURNAL_PLACEHOLDER: ImageAsset = { src: "/images/placeholder.svg", alt: "" };

/** The author printed when a post names none. */
export const DEFAULT_AUTHOR_NAME = "Maison Palettia";

/* ────────────────────────────────────────────────────────────────────────── */
/* Text                                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

type LexicalNode = { type?: string; text?: string; tag?: string; children?: LexicalNode[] };

const rootChildren = (value: unknown): LexicalNode[] => {
  const root = (value as { root?: { children?: unknown } } | null | undefined)?.root;
  return Array.isArray(root?.children) ? (root.children as LexicalNode[]) : [];
};

const textOf = (node: LexicalNode): string => {
  if (typeof node.text === "string") return node.text;
  if (node.type === "linebreak") return " ";
  return (node.children ?? []).map(textOf).join("");
};

/** Plain text of each top-level block (paragraph, heading, quote, list), empty ones dropped. */
export function lexicalBlocks(value: unknown): Array<{ type: string; tag?: string; text: string }> {
  return rootChildren(value)
    .map((node) => ({ type: node.type ?? "", tag: node.tag, text: textOf(node).replace(/\s+/g, " ").trim() }))
    .filter((block) => block.text.length > 0);
}

export function wordCount(value: unknown): number {
  return lexicalBlocks(value).reduce((sum, block) => sum + block.text.split(" ").filter(Boolean).length, 0);
}

/** 220 words a minute, rounded up, never under one. Each inline photograph adds ~10 s of looking. */
export function readingMinutes(value: unknown): number {
  const images = rootChildren(value).filter((node) => node.type === "upload").length;
  return Math.max(1, Math.ceil(wordCount(value) / 220 + images / 6));
}

/** The opening paragraphs, cut at a word boundary to at most `max` characters (an ellipsis when cut). */
export function openingLines(value: unknown, max = 200): string {
  const text = lexicalBlocks(value)
    .filter((block) => block.type === "paragraph")
    .map((block) => block.text)
    .join(" ");
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const atSpace = cut.lastIndexOf(" ");
  return `${(atSpace > max * 0.6 ? cut.slice(0, atSpace) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
}

/** "Planning a hen party?" → "planning-a-hen-party". The anchor rule a body heading and the contents list share. */
export function headingId(text: string): string {
  return (
    text
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "section"
  );
}

/** h2–h4 of a body, with unique anchors in document order (the renderer must walk headings in the same order). */
export function headingsOf(value: unknown): JournalHeading[] {
  const seen = new Map<string, number>();
  return lexicalBlocks(value)
    .filter((block) => block.type === "heading" && (block.tag === "h2" || block.tag === "h3" || block.tag === "h4"))
    .map((block) => {
      const base = headingId(block.text);
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      return { id: n === 1 ? base : `${base}-${n}`, text: block.text, level: Number(block.tag!.slice(1)) as 2 | 3 | 4 };
    });
}

/**
 * "12 October 2026" in the studio's zone. Dates are Montserrat, never the
 * script face (Hapsha has no 7, 8 or 9).
 */
export function formatJournalDate(iso: string, style: "long" | "short" = "long"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
  }).format(date);
}
