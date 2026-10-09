import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StoredPage } from "@/components/blocks/CmsPage";
import { getLandingPageSlugs, getPage } from "@/components/blocks/data";
import { FIXED_PAGE_SLUGS, isFixedPageSlug } from "@/cms/collections/content/Pages";
import { isDraft } from "@/lib/cms/draft";
import { redirectOr404 } from "@/lib/cms/redirects";
import { getMetadata } from "@/lib/seo";
import type { Media, Page } from "@/payload-types";

/**
 * ==========================================================================
 * /[...slug] — the CMS's landing pages, then its redirects, then the 404
 * ==========================================================================
 *
 * WHY A CATCH-ALL AT ALL. app/ has no root layout any more — the site's is
 * app/(site)/layout.tsx and the admin's is app/(payload)/layout.tsx
 * (docs/cms/SPEC.md §A.1) — and Next only hands an unmatched URL to a
 * not-found.tsx that sits under the layout the URL resolved into. A URL that
 * matches nothing resolves into no group, so without this file it is served
 * Next's bare default 404 with none of the site's fonts or chrome
 * (research/00-spike.md, G21). Every such URL matches this page, and what it
 * cannot serve ends in `notFound()`, which renders ../not-found.tsx inside
 * the site layout.
 *
 * WHAT IT SERVES (SPEC §A.2 rule 4), in order:
 *
 *   1. THE GUARD. Every unmatched URL on the internet arrives here — scanners
 *      probing /wp-login.php, /.env, /%2e%2e/, 300-character junk — and the
 *      regex is what keeps a database query from ever being built for a path
 *      that could not be a page: one segment, lowercase letters, digits and
 *      hyphens, at most 64 characters, which is exactly the shape the `slug`
 *      field writes (cms/fields/slug.ts). Multi-segment paths skip the page
 *      lookup — nothing in `pages` is addressed that way — but still get the
 *      redirect check, because an old flyer URL can be any path.
 *   2. A PUBLISHED PAGE with that slug that is not one of the eleven fixed
 *      pages. Those have routes of their own (`/about`, `/private-events/book`
 *      …), and the same document must not answer at two addresses — so
 *      `/home` or `/private-events-book` here is a 404, not a second copy.
 *   3. THE REDIRECTS COLLECTION, through `redirectOr404` (lib/cms/redirects.ts):
 *      a renamed page's old slug, or an editor's "old flyer URL → new page".
 *   4. The branded 404.
 *
 * STATIC, WITH NEW PAGES ON FIRST REQUEST. `force-static` with the published
 * landing pages as params; `dynamicParams` stays on, so a page published after
 * the build renders on its first visit and is then cached, and the pages
 * hook's `revalidatePath` keeps it fresh. In an editor's preview (draft mode)
 * Next renders per request and the draft is read instead.
 *
 * RESERVED PATHS NEED NO SPECIAL CASE. `/admin/**` and `/api/**` belong to
 * Payload under app/(payload); a static first segment beats a catch-all at the
 * same depth, so those routes win over this one without a list to keep in
 * sync (SPEC §A.2 rule 2). Static files in public/ are served before the app
 * router sees the request.
 */

export const dynamic = "force-static";
export const dynamicParams = true;
export const revalidate = 86400;

/** The shape the CMS `slug` field writes — anything else cannot be a page. */
const PAGE_SLUG = /^[a-z0-9-]{1,64}$/;

/** A single-segment, slug-shaped, non-fixed path — the only kind `pages` can answer. */
function landingSlug(slug: string[]): string | null {
  if (slug.length !== 1 || !PAGE_SLUG.test(slug[0]) || isFixedPageSlug(slug[0])) return null;
  return slug[0];
}

export async function generateStaticParams(): Promise<Array<{ slug: string[] }>> {
  const pages = await getLandingPageSlugs(FIXED_PAGE_SLUGS);
  return pages.filter((page) => PAGE_SLUG.test(page.slug)).map((page) => ({ slug: [page.slug] }));
}

type Params = { params: Promise<{ slug: string[] }> };

type SeoMeta = { title?: string | null; description?: string | null; image?: string | Media | null; noindex?: boolean | null };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const slug = landingSlug((await params).slug);
  if (!slug) return {};
  const page = await getPage(slug, { draft: await isDraft() });
  if (!page) return {};
  const meta = ((page as Page & { meta?: SeoMeta | null }).meta ?? {}) as SeoMeta;
  const image = meta.image && typeof meta.image === "object" ? meta.image.url : undefined;
  return getMetadata({
    title: meta.title?.trim() || page.title,
    // A landing page with no SEO description is described by its title
    // rather than by an empty tag.
    description: meta.description?.trim() || page.title,
    path: `/${page.slug}`,
    ...(image ? { image } : {}),
    noindex: Boolean(meta.noindex),
  });
}

export default async function CatchAllPage({ params }: Params) {
  const { slug } = await params;
  const path = `/${slug.join("/")}`;

  // Short-circuit before any lookup: a path no slug or redirect could ever
  // name (too long, or carrying characters neither field accepts).
  if (path.length > 201 || !/^\/[a-z0-9\-/]*$/i.test(path)) notFound();

  const pageSlug = landingSlug(slug);
  if (pageSlug) {
    const draft = await isDraft();
    const page = await getPage(pageSlug, { draft });
    if (page) return <StoredPage page={page} draft={draft} />;
  }

  return redirectOr404(path);
}
