import type { Endpoint, Field, PayloadRequest, SanitizedCollectionConfig, SanitizedGlobalConfig } from "payload";
import { z } from "zod";

import { roleOf } from "@/cms/access/roles";

import { json, parseBody, requireRole } from "./requireRole";

/**
 * ==========================================================================
 * Find text — "where does this sentence live?" (SPEC §G.5, §I; 4B)
 * ==========================================================================
 *
 *   POST /actions/find-text  { q }   admin, editor
 *     → { hits: [{ href, title, where, snippet, kind }] }
 *
 * The owner reads a sentence on the site and wants to change it. Nothing in
 * a CMS answers that question on its own — the sentence might be a block
 * field on a page, a paragraph on an experience, a line of Brand wording or
 * a status message in Booking settings. This walks every content document
 * (latest draft, as the signed-in user, so access rules apply) and every
 * content global, compares each string against the phrase, and for every
 * hit returns the admin URL WITH the field's path in the hash:
 * `/admin/collections/pages/<id>#field-blocks__3__lead`. The FocusListener
 * (cms/components/admin/FocusListener.tsx) turns that hash into "open the
 * tab, scroll to the field, highlight it".
 *
 * `where` is a readable breadcrumb built from the field labels in the
 * collection's own config ("Sections › 4. Opening statement › Lead"), so
 * the owner sees the same words the edit page shows. Lexical rich text is
 * walked for its text nodes and reported at the rich-text field itself.
 *
 * Matching is case- and whitespace-insensitive on the exact run of words;
 * the phrase must be at least three characters. At most 40 hits, so the
 * palette stays a list and not a report.
 */

const body = z.object({ q: z.string().trim().min(3, "Type at least three characters.").max(200) });

const COLLECTIONS: Array<{ slug: string; title: (doc: Record<string, unknown>) => string; kind: string }> = [
  { slug: "pages", title: (d) => String(d.title ?? d.slug ?? ""), kind: "Page" },
  { slug: "experiences", title: (d) => String(d.name ?? ""), kind: "Experience" },
  { slug: "sessions", title: (d) => String(d.title ?? d.slug ?? ""), kind: "Session" },
  { slug: "programmes", title: (d) => String(d.name ?? d.title ?? ""), kind: "Programme" },
  { slug: "policies", title: (d) => String(d.title ?? ""), kind: "Policy" },
  { slug: "posts", title: (d) => String(d.title ?? d.slug ?? ""), kind: "Journal post" },
  { slug: "post-categories", title: (d) => String(d.name ?? ""), kind: "Journal category" },
  { slug: "faqs", title: (d) => String(d.question ?? d.title ?? ""), kind: "FAQ" },
  { slug: "passes", title: (d) => String(d.name ?? d.title ?? ""), kind: "Pass" },
  { slug: "testimonials", title: (d) => String(d.name ?? d.author ?? d.quote ?? ""), kind: "Testimonial" },
  { slug: "vibes", title: (d) => String(d.name ?? d.title ?? ""), kind: "Vibe" },
  { slug: "venues", title: (d) => String(d.name ?? ""), kind: "Venue" },
  { slug: "email-templates", title: (d) => String(d.label ?? d.key ?? ""), kind: "Email template" },
];

const GLOBALS = ["site-settings", "navigation", "brand-copy", "booking-settings", "template-copy", "seo-defaults"];

const MAX_HITS = 40;

export type TextHit = { href: string; title: string; where: string; snippet: string; kind: string };

const normalise = (s: string) => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();

/** `…words around the match…`, trimmed to about 90 characters. */
function snippetOf(text: string, needle: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const at = normalise(flat).indexOf(needle);
  if (at < 0) return flat.slice(0, 90);
  const start = Math.max(0, at - 30);
  const end = Math.min(flat.length, at + needle.length + 45);
  return `${start > 0 ? "…" : ""}${flat.slice(start, end)}${end < flat.length ? "…" : ""}`;
}

const labelOf = (field: { label?: unknown; name?: string }): string => {
  const label = field.label;
  if (typeof label === "string") return label;
  if (label && typeof label === "object" && "en" in (label as object)) return String((label as { en: unknown }).en);
  return field.name ? field.name.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase()) : "";
};

/** Is this Lexical rich text (`{ root: { children } }`)? */
const isRichText = (value: unknown): value is { root: { children: unknown[] } } =>
  Boolean(value && typeof value === "object" && "root" in (value as object) && (value as { root?: { children?: unknown } }).root?.children);

function richTextToString(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { text?: unknown; children?: unknown[]; root?: unknown };
  if (n.root) return richTextToString(n.root);
  const own = typeof n.text === "string" ? n.text : "";
  const kids = Array.isArray(n.children) ? n.children.map(richTextToString).join(" ") : "";
  return [own, kids].filter(Boolean).join(" ");
}

type Hit = { path: string[]; where: string[]; text: string };

/**
 * Walks `data` alongside the field config so every hit carries both the
 * form path (for the hash) and the labels (for the breadcrumb). Unnamed
 * tabs, rows and collapsibles contribute no path segment; named tabs and
 * groups do; arrays and blocks add the row index and, for blocks, the block
 * label. Fields with no matching config (system stamps) are still searched
 * under their raw name, so nothing is missed.
 */
function walk(fields: Field[] | undefined, data: unknown, needle: string, path: string[], where: string[], out: Hit[], depth = 0): void {
  if (!data || typeof data !== "object" || depth > 12 || out.length >= MAX_HITS) return;
  const record = data as Record<string, unknown>;
  const seen = new Set<string>();

  for (const field of fields ?? []) {
    if (out.length >= MAX_HITS) return;
    switch (field.type) {
      case "row":
      case "collapsible":
        walk(field.fields, record, needle, path, where, out, depth + 1);
        break;
      case "tabs":
        for (const tab of field.tabs) {
          if ("name" in tab && tab.name) {
            seen.add(tab.name);
            walk(tab.fields, record[tab.name], needle, [...path, tab.name], [...where, labelOf(tab)], out, depth + 1);
          } else {
            walk(tab.fields, record, needle, path, where, out, depth + 1);
          }
        }
        break;
      case "group": {
        if (!("name" in field) || !field.name) {
          walk(field.fields, record, needle, path, where, out, depth + 1);
          break;
        }
        seen.add(field.name);
        walk(field.fields, record[field.name], needle, [...path, field.name], [...where, labelOf(field)], out, depth + 1);
        break;
      }
      case "array": {
        seen.add(field.name);
        const rows = record[field.name];
        if (!Array.isArray(rows)) break;
        rows.forEach((row, i) => walk(field.fields, row, needle, [...path, field.name, String(i)], [...where, `${labelOf(field)} ${i + 1}`], out, depth + 1));
        break;
      }
      case "blocks": {
        seen.add(field.name);
        const rows = record[field.name];
        if (!Array.isArray(rows)) break;
        rows.forEach((row, i) => {
          const type = (row as { blockType?: string })?.blockType;
          const block = field.blocks.find((b) => b.slug === type);
          const blockLabel = block ? labelOf({ label: block.labels?.singular, name: block.slug }) : type ?? "Section";
          walk(block?.fields, row, needle, [...path, field.name, String(i)], [...where, `${i + 1}. ${blockLabel}`], out, depth + 1);
        });
        break;
      }
      case "text":
      case "textarea":
      case "email":
      case "richText":
      case "code": {
        seen.add(field.name);
        const value = record[field.name];
        const text = field.type === "richText" ? (isRichText(value) ? richTextToString(value) : "") : typeof value === "string" ? value : "";
        if (text && normalise(text).includes(needle)) out.push({ path: [...path, field.name], where: [...where, labelOf(field)], text });
        break;
      }
      default:
        if ("name" in field && field.name) seen.add(field.name);
    }
  }

  // Strings the config did not describe (unlikely, but a hit is a hit).
  for (const [key, value] of Object.entries(record)) {
    if (seen.has(key) || key === "id" || key.startsWith("_") || key.endsWith("At") || key.endsWith("_tz")) continue;
    if (typeof value === "string" && value.length > 2 && !/^[0-9a-f-]{36}$/i.test(value) && normalise(value).includes(needle)) {
      out.push({ path: [...path, key], where: [...where, labelOf({ name: key })], text: value });
    } else if (isRichText(value)) {
      const text = richTextToString(value);
      if (normalise(text).includes(needle)) out.push({ path: [...path, key], where: [...where, labelOf({ name: key })], text });
    }
  }
}

const hashFor = (path: string[]) => `#field-${path.join("__")}`;

/** Unnamed tabs, rows and collapsibles walk the same record again; keep the first (config-labelled) hit per field. */
function dedupe(hits: Hit[]): Hit[] {
  const seen = new Set<string>();
  return hits.filter((hit) => {
    const key = hit.path.join(".");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function findText(req: PayloadRequest, q: string): Promise<TextHit[]> {
  const needle = normalise(q);
  const hits: TextHit[] = [];
  const admin = req.payload.config.routes.admin;
  const role = roleOf(req);

  for (const entry of COLLECTIONS) {
    if (hits.length >= MAX_HITS) break;
    const collection = req.payload.collections[entry.slug as keyof typeof req.payload.collections]?.config as SanitizedCollectionConfig | undefined;
    if (!collection) continue;
    let docs: Array<Record<string, unknown>> = [];
    try {
      const res = await req.payload.find({ collection: entry.slug as never, limit: 300, depth: 0, draft: true, pagination: false, req, user: req.user, overrideAccess: false });
      docs = res.docs as Array<Record<string, unknown>>;
    } catch {
      continue; // a collection this role cannot read, or one not migrated yet
    }
    for (const doc of docs) {
      const found: Hit[] = [];
      walk(collection.fields, doc, needle, [], [], found);
      for (const hit of dedupe(found)) {
        if (hits.length >= MAX_HITS) break;
        hits.push({
          href: `${admin}/collections/${entry.slug}/${String(doc.id)}${hashFor(hit.path)}`,
          title: entry.title(doc) || "Untitled",
          where: hit.where.join(" › "),
          snippet: snippetOf(hit.text, needle),
          kind: entry.kind,
        });
      }
    }
  }

  for (const slug of GLOBALS) {
    if (hits.length >= MAX_HITS) break;
    const global = req.payload.globals.config.find((g) => g.slug === slug) as SanitizedGlobalConfig | undefined;
    if (!global) continue;
    let doc: Record<string, unknown> | null = null;
    try {
      doc = (await req.payload.findGlobal({ slug: slug as never, depth: 0, req, user: req.user, overrideAccess: false })) as Record<string, unknown>;
    } catch {
      continue;
    }
    const found: Hit[] = [];
    walk(global.fields, doc, needle, [], [], found);
    const title = labelOf({ label: global.label, name: slug });
    for (const hit of dedupe(found)) {
      if (hits.length >= MAX_HITS) break;
      hits.push({ href: `${admin}/globals/${slug}${hashFor(hit.path)}`, title, where: hit.where.join(" › "), snippet: snippetOf(hit.text, needle), kind: "Settings" });
    }
  }

  // Editors may read orders? No (§J) — but the loop above already respected
  // access; the role is only used to keep the return shape stable.
  return role ? hits : [];
}

export const findTextEndpoints: Endpoint[] = [
  {
    path: "/actions/find-text",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin", "editor"]);
      const { q } = await parseBody(req, body);
      return json({ hits: await findText(req, q) });
    },
  },
];
