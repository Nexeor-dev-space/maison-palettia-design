import type { Block, Field, Payload } from "payload";

import { sessionSlug } from "./content";
import { PAGES } from "./pages";
import { BOOKING_SETTINGS, BOOKING_TERMS_PAID, BOOKING_TERMS_TODAY } from "./strings/booking";
import { BRAND_COPY } from "./strings/brand";
import { EXPERIENCES } from "./strings/experiences";
import { FAQS } from "./strings/faqs";
import { NAVIGATION } from "./strings/navigation";
import { PASSES } from "./strings/passes";
import { POLICIES } from "./strings/policies";
import { PRIVATE_EVENT_STEPS, PROGRAMMES } from "./strings/programmes";
import { SESSIONS } from "./strings/sessions";
import { BRAND_SHARED, SEO_DEFAULTS, SITE_SETTINGS } from "./strings/site";
import { TEMPLATE_COPY } from "./strings/templates";
import { CURRENT_VENUES } from "./strings/venues";
import { VIBES } from "./strings/vibes";

/**
 * ==========================================================================
 * Dry run — does every seeded string fit the slot it is going into?
 * ==========================================================================
 *
 * The schema caps lines and rows to what the layout can hold (an eyebrow is
 * 24 characters, a script heading line 18, an experience's one-liner 60).
 * The seed copies today's words exactly and never trims them to fit, so when
 * a cap is tighter than a string the site already prints, the fix is the
 * cap, not the copy — and whoever decides needs the whole list at once, not
 * one ValidationError per run. This walks every record the seed writes
 * against its collection, global or block config and returns each mismatch
 * with its path, e.g.
 *
 *   about › closingCtaLilac.headingLines[1].text: 19 > 18 — “Community Together.”
 *
 * Checked: text/textarea `maxLength`, array `minRows`/`maxRows`, select
 * values, and `required` fields left empty while visible. Nothing is
 * written; uploads and relationships are resolved later and not checked.
 */

type Row = Record<string, unknown>;

export interface Problem {
  /** The page slug, collection or global the problem belongs to. */
  owner: string;
  message: string;
}

/** Fields that share their parent's data level (row, collapsible, unnamed group / tab). */
function inlineFields(field: Field): Field[] {
  if (field.type === "tabs") return field.tabs.filter((tab) => !("name" in tab && tab.name)).flatMap((tab) => tab.fields);
  if ("fields" in field && Array.isArray(field.fields)) return field.fields as Field[];
  return [];
}

function walk(fields: Field[], data: Row, path: string, out: string[], blocks: Map<string, Block>): void {
  for (const field of fields) {
    if (field.type === "tabs") {
      for (const tab of field.tabs) {
        if ("name" in tab && tab.name) {
          const value = data[tab.name];
          if (value && typeof value === "object") walk(tab.fields, value as Row, `${path}.${tab.name}`, out, blocks);
        } else {
          walk(tab.fields, data, path, out, blocks);
        }
      }
      continue;
    }
    const name = "name" in field && typeof field.name === "string" ? field.name : undefined;
    if (!name) {
      walk(inlineFields(field), data, path, out, blocks);
      continue;
    }
    const value = data[name];
    const here = `${path}.${name}`;
    if (value === undefined || value === null || value === "") {
      const condition = "admin" in field ? field.admin?.condition : undefined;
      const shown = condition ? Boolean(condition(data, data, { blockData: data, operation: "create", path: [], user: null } as never)) : true;
      const required = "required" in field && field.required && !("defaultValue" in field && field.defaultValue !== undefined);
      if (required && shown && field.type !== "checkbox" && field.type !== "upload" && field.type !== "relationship") {
        out.push(`${here}: required but not seeded`);
      }
      continue;
    }
    switch (field.type) {
      case "text":
      case "textarea": {
        const max = field.maxLength;
        if (typeof value === "string" && max && value.length > max) out.push(`${here}: ${value.length} > ${max} — “${value}”`);
        break;
      }
      case "array": {
        const rows = Array.isArray(value) ? (value as Row[]) : [];
        if (field.maxRows !== undefined && rows.length > field.maxRows) out.push(`${here}: ${rows.length} rows > ${field.maxRows}`);
        if (field.minRows !== undefined && rows.length < field.minRows) out.push(`${here}: ${rows.length} rows < ${field.minRows}`);
        rows.forEach((row, i) => walk(field.fields, row, `${here}[${i}]`, out, blocks));
        break;
      }
      case "blocks": {
        const rows = Array.isArray(value) ? (value as Row[]) : [];
        const own = new Map(field.blocks.map((block) => [block.slug, block]));
        rows.forEach((row, i) => {
          const config = own.get(row.blockType as string) ?? blocks.get(row.blockType as string);
          if (!config) out.push(`${here}[${i}]: no block "${String(row.blockType)}"`);
          else walk(config.fields, row, `${here}[${i}](${config.slug})`, out, blocks);
        });
        break;
      }
      case "group":
        walk(field.fields, value as Row, here, out, blocks);
        break;
      case "select":
      case "radio": {
        const allowed = field.options.map((option) => (typeof option === "string" ? option : option.value));
        for (const v of Array.isArray(value) ? value : [value]) {
          if (!allowed.includes(v as string)) out.push(`${here}: "${String(v)}" is not one of ${allowed.join(" | ")}`);
        }
        break;
      }
      default:
        break;
    }
  }
}

export function checkSeed(payload: Payload): { problems: Problem[]; pagesWithProblems: Set<string> } {
  const shared = new Map((payload.config.blocks ?? []).map((block) => [block.slug, block]));
  const problems: Problem[] = [];
  const record = (owner: string, list: string[]) => list.forEach((message) => problems.push({ owner, message }));

  /* Pages: each block against its block config. */
  const blocksField = payload.collections.pages?.config.flattenedFields.find((field) => field.name === "blocks") as
    | { blocks?: Block[]; blockReferences?: Array<Block | string> }
    | undefined;
  const pageBlocks = new Map<string, Block>(shared);
  for (const block of [...(blocksField?.blocks ?? []), ...(blocksField?.blockReferences ?? [])]) {
    const resolved = typeof block === "string" ? shared.get(block) : block;
    if (resolved) pageBlocks.set(resolved.slug, resolved);
  }
  const pagesWithProblems = new Set<string>();
  for (const page of PAGES) {
    const out: string[] = [];
    for (const block of page.blocks) {
      const config = pageBlocks.get(block.blockType);
      if (!config) out.push(`${block.blockType}: no such block on pages`);
      else walk(config.fields, block as Row, block.blockType, out, pageBlocks);
    }
    if (out.length) pagesWithProblems.add(page.slug);
    record(`page ${page.slug}`, out);
  }

  /* Collections: each seed record against the collection's fields. */
  const collections: Array<[string, Row[]]> = [
    ["vibes", VIBES as unknown as Row[]],
    ["venues", CURRENT_VENUES as unknown as Row[]],
    ["experiences", EXPERIENCES.map((e) => ({ ...e, about: e.about.map((paragraph) => ({ paragraph })), image: undefined, gallery: undefined }))],
    ["sessions", SESSIONS.map((s) => ({ ...s, slug: sessionSlug(s.experience, s.startsAt), experience: undefined, venue: undefined, image: undefined, status: undefined }))],
    ["programmes", PROGRAMMES.map((p) => ({ ...p, image: undefined }))],
    ["policies", POLICIES as unknown as Row[]],
    ["faqs", FAQS.map((f) => ({ ...f, answer: undefined }))],
    ["passes", PASSES.map((p) => ({ ...p, benefits: p.benefits.map((line) => ({ line })), image: undefined }))],
  ];
  for (const [slug, rows] of collections) {
    const config = payload.collections[slug as keyof typeof payload.collections]?.config;
    if (!config) {
      record(slug, ["collection is not registered"]);
      continue;
    }
    rows.forEach((row, i) => {
      const out: string[] = [];
      walk(config.fields, row, `${String(row.slug ?? row.question ?? i)}`, out, shared);
      record(slug, out);
    });
  }

  /* Globals. */
  const globals: Array<[string, Row]> = [
    ["site-settings", { ...SITE_SETTINGS, logoOnDark: undefined, logoOnLight: undefined, monogram: undefined }],
    ["navigation", NAVIGATION as unknown as Row],
    [
      "brand-copy",
      {
        ...BRAND_COPY,
        ...BRAND_SHARED,
        privateEventSteps: PRIVATE_EVENT_STEPS,
      } as unknown as Row,
    ],
    ["booking-settings", { ...BOOKING_SETTINGS, bookingTerms: BOOKING_TERMS_TODAY } as unknown as Row],
    ["booking-settings (launch)", { bookingTerms: BOOKING_TERMS_PAID }],
    ["template-copy", TEMPLATE_COPY as unknown as Row],
    ["seo-defaults", SEO_DEFAULTS as unknown as Row],
  ];
  for (const [label, data] of globals) {
    const slug = label.replace(/ \(.*\)$/, "");
    const config = payload.config.globals.find((global) => global.slug === slug);
    if (!config) {
      record(label, ["global is not registered"]);
      continue;
    }
    const out: string[] = [];
    walk(config.fields, data, label, out, shared);
    // A partial save fills the rest from the stored row, so "required but not
    // seeded" on a global is not a problem the seed causes.
    record(label, out.filter((message) => !message.endsWith("required but not seeded")));
  }

  return { problems, pagesWithProblems };
}
