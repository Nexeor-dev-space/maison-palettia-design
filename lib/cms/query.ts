import type { Where } from "payload";

import { cached, TAGS, type CacheTag } from "@/lib/cms/cache";
import { isDraft } from "@/lib/cms/draft";
import { getCms } from "@/lib/cms/payload";
import type { Config } from "@/payload-types";

/**
 * ==========================================================================
 * How the site reads the CMS — one path for every getter in lib/*.ts
 * ==========================================================================
 *
 * SPEC §G.1. Every content getter is the same three steps, so they are
 * written once here and each getter only says WHAT it reads and HOW the
 * documents become the site's existing types (lib/cms/mappers.ts):
 *
 *   1. Draft mode? (`isDraft()`, lib/cms/draft.ts.) Staff previewing a
 *      change get the latest version of every document, drafts included,
 *      read with `overrideAccess` and never cached — a preview must never
 *      land in the shared cache, and draft mode already makes the route
 *      dynamic per request.
 *   2. Otherwise the read goes through `cached` (unstable_cache) under the
 *      collection's or global's tag from `TAGS`, which is exactly the string
 *      the Payload hooks purge (cms/hooks/revalidate.ts). The read itself is
 *      an anonymous one — `overrideAccess: false` with no user — so the
 *      collection's own access rules decide what the public sees
 *      (`publishedOrEditor` → published rows only; staff-only fields such as
 *      `internalNotes` and `seatsSold` are stripped by field access). Drafted
 *      collections also filter `_status = published` explicitly, so a change
 *      to an access function can never quietly publish a draft.
 *   3. The MAPPED result is what is cached, not the raw documents: it is a
 *      fraction of the size, and it is plain JSON by construction.
 *
 * NEVER FATAL. A reader returns `null` when the CMS cannot answer — no
 * database, a table a migration has not created yet (Phase 2 lands the
 * content migration last), a connection refused during a build on a machine
 * without the database. The getters then fall back to the copy that is still
 * in their own file, so the site renders exactly as it did before the CMS
 * existed. Only `null` triggers it: the seed (2B) has run, so an empty CMS
 * answer means "nothing published", never "use the old copy".
 *
 * SERVER ONLY. This imports the Payload config (through lib/cms/payload.ts),
 * which must never reach a client bundle (00-spike.md, G18). Modules that
 * client components import — lib/constants.ts, lib/brand.ts,
 * lib/privateEvents.ts, lib/vibes.ts, lib/workshopHelpers.ts,
 * lib/experienceLabels.ts — must not import it; their CMS getters live in the
 * `*.server.ts` companions instead.
 */

type Collections = Config["collections"];
type Globals = Config["globals"];

export type ContentCollection = keyof Collections;
export type ContentGlobal = keyof Globals;
export type DocOf<S extends ContentCollection> = Collections[S];
export type GlobalOf<S extends ContentGlobal> = Globals[S];

/** The tag each global is purged under (SPEC §G.1). Admin-only globals have none: the site never reads them. */
export const GLOBAL_TAGS: Partial<Record<ContentGlobal, CacheTag>> = {
  "site-settings": TAGS.site,
  navigation: TAGS.nav,
  "brand-copy": TAGS.brand,
  "booking-settings": TAGS.booking,
  "template-copy": TAGS.template,
  "seo-defaults": TAGS.seo,
  "analytics-settings": TAGS.analytics,
};

export interface FindOptions {
  /** True when the collection has `versions.drafts` — adds the `_status = published` filter for the public. */
  drafts: boolean;
  where?: Where;
  sort?: string;
  /** Relationship depth. 1 populates uploads and direct relations; sessions need 2 (session → experience → image). */
  depth?: number;
}

/**
 * Every matching document, unpaginated. The content collections are small
 * (tens of rows), and every page that lists them shows all of them.
 */
export async function findDocs<S extends ContentCollection>(
  collection: S,
  draft: boolean,
  { drafts, where, sort, depth = 1 }: FindOptions,
): Promise<DocOf<S>[]> {
  const payload = await getCms();
  const published: Where | undefined = drafts && !draft ? { _status: { equals: "published" } } : undefined;
  const filter: Where | undefined = where && published ? { and: [where, published] } : (where ?? published);
  const result = await payload.find({
    collection,
    where: filter,
    sort,
    depth,
    pagination: false,
    draft,
    overrideAccess: draft,
  });
  return result.docs as DocOf<S>[];
}

/** One global, as the public (or, in draft mode, staff) would read it. */
export async function findGlobalDoc<S extends ContentGlobal>(slug: S, draft: boolean, depth = 1): Promise<GlobalOf<S>> {
  const payload = await getCms();
  return (await payload.findGlobal({ slug, depth, draft, overrideAccess: draft })) as GlobalOf<S>;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Readers                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

const reported = new Set<string>();

/**
 * Say once per process that a reader fell back, and why. Once, because a
 * build prerenders every route in several workers and the same missing
 * table would otherwise print a line per page.
 */
function reportUnavailable(key: string, error: unknown) {
  if (reported.has(key)) return;
  reported.add(key);
  const reason = error instanceof Error ? error.message.split("\n")[0] : String(error);
  console.warn(`[cms] "${key}" could not be read from the CMS; the in-file copy is used instead. (${reason})`);
}

/**
 * Wraps a loader into a draft-aware, cached, never-throwing reader.
 *
 * `load(draft, ...args)` does the Local API read and the mapping. The
 * returned function resolves to the mapped value, or `null` when the CMS
 * could not answer (see "NEVER FATAL" above). Create readers at module
 * level: `cached` keys on `key` plus the call's arguments, so one reader
 * serves every slug a page asks for.
 */
export function contentReader<A extends unknown[], R>(
  key: string,
  tags: CacheTag[],
  load: (draft: boolean, ...args: A) => Promise<R>,
): (...args: A) => Promise<R | null> {
  const live = cached(`cms:${key}`, tags, (...args: A) => load(false, ...args));
  return async (...args: A) => {
    const draft = await isDraft();
    try {
      return draft ? await load(true, ...args) : await live(...args);
    } catch (error) {
      reportUnavailable(key, error);
      return null;
    }
  };
}

/**
 * A content global, cached under its tag. Resolves to `null` when the CMS
 * cannot answer, so callers keep their in-file defaults.
 *
 * Useful on its own for the page-label globals (`template-copy`,
 * `booking-settings`, `navigation` menu wording), whose fields components
 * read one by one — `(await getGlobal("template-copy"))?.eventDetail?.whenTerm`.
 */
const globalReaders = new Map<ContentGlobal, (depth: number) => Promise<unknown>>();

export function getGlobal<S extends ContentGlobal>(slug: S, depth = 1): Promise<GlobalOf<S> | null> {
  let reader = globalReaders.get(slug);
  if (!reader) {
    const tag = GLOBAL_TAGS[slug];
    reader = contentReader(`global:${slug}`, tag ? [tag] : [], (draft, d: number) => findGlobalDoc(slug, draft, d));
    globalReaders.set(slug, reader);
  }
  return reader(depth) as Promise<GlobalOf<S> | null>;
}

