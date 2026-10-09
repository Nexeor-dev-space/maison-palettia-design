import { cached, TAGS } from "@/lib/cms/cache";
import { getCms } from "@/lib/cms/payload";
import type { BrandCopy, Page } from "@/payload-types";

/**
 * ==========================================================================
 * The page builder's reads — a page by slug, and the Brand wording it borrows
 * ==========================================================================
 *
 * Server-only (it reaches the Local API). Each read in two modes:
 *
 *   PUBLISHED  — through `cached` (lib/cms/cache.ts) under the tags the
 *                Payload hooks purge: `collection:pages` for a page,
 *                `global:brand-copy` for the wording. Read as the anonymous
 *                visitor (`overrideAccess: false`), so access control —
 *                `publishedOrEditor` and every field-level `read` — decides
 *                what the public HTML can contain, not this file.
 *   DRAFT      — straight to the Local API with `draft: true`, never cached:
 *                Next's draft mode (/preview) already makes the route render
 *                per request, and a draft must never land in the shared cache.
 *
 * Depth 1 is enough for every block: uploads arrive as Media documents and
 * relationships as their documents; anything deeper (an experience's own
 * photograph) comes from the 2C getters the sections already call.
 *
 * NEVER FATAL, NEVER REMEMBERED. The same rule as the data layer's readers
 * (lib/cms/query.ts): when the CMS cannot answer — the `pages` table not
 * migrated yet, or no database at all (a `next build` whose production TLS
 * settings the development database refuses, docs/cms/DECISIONS.md item 7) —
 * a fixed page renders its launch layout (./layouts.ts) instead of failing,
 * and says so once in the server log. The failure is thrown INSIDE the cache
 * and caught outside it, so it is never stored: the next request asks again.
 */

const reported = new Set<string>();

function unavailable<T>(key: string, error: unknown, fallback: T): T {
  if (!reported.has(key)) {
    reported.add(key);
    const reason = error instanceof Error ? error.message.split("\n")[0] : String(error);
    console.warn(`[cms] "${key}" could not be read from the CMS; the launch layout is used instead. (${reason})`);
  }
  return fallback;
}

const findPublishedPage = cached("pages:published-by-slug", [TAGS.pages], async (slug: string) => {
  const payload = await getCms();
  const result = await payload.find({
    collection: "pages",
    where: { slug: { equals: slug }, _status: { equals: "published" } },
    depth: 1,
    limit: 1,
    pagination: false,
    overrideAccess: false,
  });
  return result.docs[0] ?? null;
});

/**
 * The page stored under `slug`, or null when there is none (or the CMS could
 * not be read). In draft mode it is the latest draft, whatever its status.
 */
export async function getPage(slug: string, { draft }: { draft: boolean }): Promise<Page | null> {
  try {
    if (!draft) return await findPublishedPage(slug);
    const payload = await getCms();
    const result = await payload.find({
      collection: "pages",
      where: { slug: { equals: slug } },
      depth: 1,
      limit: 1,
      pagination: false,
      draft: true,
      overrideAccess: true,
    });
    return result.docs[0] ?? null;
  } catch (error) {
    return unavailable("pages", error, null);
  }
}

const findBrandCopy = cached("global:brand-copy", [TAGS.brand], async () => {
  const payload = await getCms();
  return payload.findGlobal({ slug: "brand-copy", depth: 1, overrideAccess: false });
});

/**
 * The `brand-copy` global. `onInit` (cms/seed/defaults.ts) guarantees the row
 * exists with the site's wording as defaults, so this is never empty on a
 * migrated database; when it cannot be read it is null and every section
 * falls back to the wording it shipped with.
 */
export async function getBrandCopy({ draft }: { draft: boolean }): Promise<BrandCopy | null> {
  try {
    if (!draft) return await findBrandCopy();
    const payload = await getCms();
    return await payload.findGlobal({ slug: "brand-copy", depth: 1, draft: true, overrideAccess: true });
  } catch (error) {
    return unavailable("brand-copy", error, null);
  }
}

const findLandingPages = cached("pages:landing-slugs", [TAGS.pages], async (fixed: readonly string[]) => {
  const payload = await getCms();
  const result = await payload.find({
    collection: "pages",
    where: { _status: { equals: "published" }, slug: { not_in: [...fixed] } },
    depth: 0,
    limit: 500,
    pagination: false,
    overrideAccess: false,
    select: { slug: true, updatedAt: true },
  });
  return result.docs.map((page) => ({ slug: page.slug, updatedAt: page.updatedAt }));
});

/**
 * Published pages that are not one of the eleven fixed pages — the free
 * landing pages the catch-all serves (SPEC §A.2 rule 4). Used by its
 * `generateStaticParams` and by the sitemap.
 */
export async function getLandingPageSlugs(fixed: readonly string[]): Promise<Array<{ slug: string; updatedAt: string }>> {
  try {
    return await findLandingPages(fixed);
  } catch (error) {
    return unavailable("pages", error, []);
  }
}

/*
  The activities an editor has unticked "Offer for private events" on
  (`experiences.privateEventEligible`). The site's `CreativeExperience`
  record does not carry the flag — it is a page-builder concern, not a
  property every surface prints — so the activities grid asks for the
  exceptions directly and leaves the mapping to the data layer.
*/
const findIneligible = cached("experiences:private-ineligible", [TAGS.experiences], async () => {
  const payload = await getCms();
  const result = await payload.find({
    collection: "experiences",
    where: { privateEventEligible: { equals: false } },
    depth: 0,
    limit: 200,
    pagination: false,
    overrideAccess: false,
    select: { slug: true },
  });
  return result.docs.map((doc) => doc.slug);
});

export async function getPrivateIneligibleSlugs(): Promise<ReadonlySet<string>> {
  try {
    return new Set(await findIneligible());
  } catch (error) {
    return unavailable("experiences:private-ineligible", error, new Set<string>());
  }
}
