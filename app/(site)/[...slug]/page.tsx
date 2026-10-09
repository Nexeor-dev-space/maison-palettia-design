import { notFound } from "next/navigation";

/**
 * ==========================================================================
 * /[...slug] — the net under the site: CMS pages later, a branded 404 today
 * ==========================================================================
 *
 * WHY A CATCH-ALL AT ALL. app/ has no root layout any more — the site's is
 * app/(site)/layout.tsx and the admin's is app/(payload)/layout.tsx
 * (docs/cms/SPEC.md §A.1) — and Next only hands an unmatched URL to a
 * not-found.tsx that sits under the layout the URL resolved into. A URL that
 * matches nothing resolves into no group, so without this file it is served
 * Next's bare default 404 with none of the site's fonts or chrome
 * (research/00-spike.md, G21). This page exists so that every such URL DOES
 * match something inside (site), and that something calls `notFound()`,
 * which renders ../not-found.tsx inside the site layout.
 *
 * WHAT IT WILL BECOME. Per SPEC §A.2 rule 4 this is also where CMS `pages`
 * are served by single-segment slug: Phase 2 adds `dynamic = "force-static"`,
 * `generateStaticParams` from the published pages (with `dynamicParams` left
 * on, so a page created after the build renders on first request), the
 * `redirects` lookup, and only then `notFound()`. None of that is wired yet;
 * today the page is the shape without the lookups.
 *
 * THE GUARD IS ALREADY HERE, and it runs before anything else ever will.
 * Every unmatched URL on the internet arrives at this page — scanners
 * probing /wp-login.php, /.env, /%2e%2e/, 300-character junk — and the first
 * thing the Phase 2 version does is ask the database for a slug. The regex
 * is what keeps that query from ever being built for a path that could not
 * be a page: one segment, lowercase letters, digits and hyphens, at most 64
 * characters, which is exactly the shape the `slug` field writes
 * (cms/fields/slug.ts). Multi-segment paths fall through for the same
 * reason — nothing in the CMS is addressed that way.
 *
 * RESERVED PATHS NEED NO SPECIAL CASE. `/admin/**` and `/api/**` belong to
 * Payload under app/(payload); a static first segment beats a catch-all at
 * the same depth, so those routes win over this one without a list to keep
 * in sync (SPEC §A.2 rule 2). Static files in public/ are served before the
 * app router sees the request. Until (payload) lands, /admin and /api
 * simply 404 here, which is correct.
 */

/** The shape the CMS `slug` field writes — anything else cannot be a page. */
const PAGE_SLUG = /^[a-z0-9-]{1,64}$/;

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;

  // Short-circuit before any lookup. Single segment, slug-shaped, or it is
  // not an address this site has ever issued.
  if (slug.length !== 1 || !PAGE_SLUG.test(slug[0])) notFound();

  // Phase 2: `pages` lookup by slug[0], then the `redirects` collection.
  notFound();
}
