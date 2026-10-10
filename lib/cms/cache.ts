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
  site: "global:site-settings",
  nav: "global:navigation",
  brand: "global:brand-copy",
  booking: "global:booking-settings",
  template: "global:template-copy",
  seo: "global:seo-defaults",
  analytics: "global:analytics-settings",
} as const;

export type CacheTag = (typeof TAGS)[keyof typeof TAGS];

/**
 * Wraps a getter so its result is cached under `key` and the given tags.
 * `revalidate: 86400` is a safety net only — on-demand revalidation from
 * hooks is what keeps content fresh; the daily expiry just bounds how stale
 * a page can get if a hook ever fails to fire.
 */
export const cached = <A extends unknown[], R>(key: string, tags: string[], fn: (...args: A) => Promise<R>) =>
  unstable_cache(fn, [key], { tags, revalidate: 86400 });
