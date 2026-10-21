import { unstable_cache } from "next/cache";

/**
 * ==========================================================================
 * Cache tags — the vocabulary the site and the CMS hooks share
 * ==========================================================================
 *
 * The site keeps Next 16's "previous" caching model (SPEC §G.1): pages are
 * prerendered, shared getters are wrapped in `unstable_cache` with tags, and
 * Payload hooks purge by tag (`revalidateTag(tag, "max")`) plus by path.
 * `cacheComponents` is deliberately not enabled — it is untested with
 * `withPayload` and would change the rendering contract of every route for
 * no freshness we do not already have.
 *
 * One tag per collection or global, named after it, so a hook can purge
 * "everything that read sessions" without knowing which pages those are.
 * `cms/hooks/revalidate.ts` imports this object; `revalidateAllContent`
 * purges every tag in it. Phase 2+ getters MUST tag reads with these exact
 * strings — a typo here is a page that never refreshes.
 */
export const TAGS = {
  experiences: "collection:experiences",
  workshopTypes: "collection:workshop-types",
  sessions: "collection:sessions",
  venues: "collection:venues",
  programmes: "collection:programmes",
  policies: "collection:policies",
  faqs: "collection:faqs",
  passes: "collection:passes",
  pages: "collection:pages",
  vibes: "collection:vibes",
  testimonials: "collection:testimonials",
  redirects: "collection:redirects",
  posts: "collection:posts",
  postCategories: "collection:post-categories",
  musicTracks: "collection:music-tracks",
  site: "global:site-settings",
  nav: "global:navigation",
  brand: "global:brand-copy",
  booking: "global:booking-settings",
  template: "global:template-copy",
  seo: "global:seo-defaults",
  analytics: "global:analytics-settings",
  music: "global:music-settings",
} as const;

export type CacheTag = (typeof TAGS)[keyof typeof TAGS];

/*
  THE CACHE'S EPOCH — part of every key `cached` makes (below). BUMP IT WITH ANY MIGRATION
  THAT ADDS A FIELD THE SITE READS.

  The data cache outlives a deploy: it is on disk under .next/cache, and the
  build (Nixpacks keeps .next/cache between builds) prerenders from it. A
  read cached before a migration keeps the old shape — the new field simply
  is not in it — until something revalidates its tag, for up to a day. The
  media blur placeholders (migration 20261021_184845) were filled straight
  into the database, so no tag fired: staging went live with the new code
  and every CMS photograph still read as having no `blurDataURL`.

  A new epoch is a new key for every getter, so nothing cached under the old
  shape can be read again: the next build and the server after it read
  fresh from the database.
*/
const CACHE_EPOCH = "2026-10-22-media-blur";

/**
 * Wraps a getter so its result is cached under `key` and the given tags.
 * `revalidate: 86400` is a safety net only — on-demand revalidation from
 * hooks is what keeps content fresh; the daily expiry just bounds how stale
 * a page can get if a hook ever fails to fire.
 */
export const cached = <A extends unknown[], R>(key: string, tags: string[], fn: (...args: A) => Promise<R>) =>
  unstable_cache(fn, [key, CACHE_EPOCH], { tags, revalidate: 86400 });

