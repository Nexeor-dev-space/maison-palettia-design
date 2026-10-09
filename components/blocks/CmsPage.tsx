import type { Metadata } from "next";

import type { FixedPageSlug } from "@/cms/collections/content/Pages";
import { isDraft } from "@/lib/cms/draft";
import { getMetadata } from "@/lib/seo";
import type { Media, Page } from "@/payload-types";
import type { PageSeo } from "@/types";

import { BlockRenderer } from "./BlockRenderer";
import { getBrandCopy, getPage } from "./data";
import { imageOf } from "./helpers";
import { launchLayout } from "./layouts";

/**
 * ==========================================================================
 * A page of the site, drawn from its `pages` document (SPEC §E, §G.2)
 * ==========================================================================
 *
 * Every fixed route (`/`, `/about`, … `/private-events/book`) is now this
 * one line over its slug: read the page — the latest draft in preview, the
 * published version otherwise — and the Brand wording its sections may
 * borrow, then hand the blocks to <BlockRenderer>. With no stored document
 * the route renders its launch layout (./layouts.ts) rather than 404, which
 * is what keeps the site whole between deploy and seed.
 */

/** The fixed page whose route this is. */
export async function FixedPage({ slug }: { slug: FixedPageSlug }) {
  const draft = await isDraft();
  const [page, brand] = await Promise.all([getPage(slug, { draft }), getBrandCopy({ draft })]);
  const blocks = page ? (page.blocks ?? []) : launchLayout(slug);
  return <BlockRenderer blocks={blocks} ctx={{ page: slug, draft, brand, blocks }} docId={page?.id} />;
}

/** A stored page already read by the caller — the catch-all's landing pages. */
export async function StoredPage({ page, draft }: { page: Page; draft: boolean }) {
  const brand = await getBrandCopy({ draft });
  const blocks = page.blocks ?? [];
  return <BlockRenderer blocks={blocks} ctx={{ page: page.slug, draft, brand, blocks }} docId={page.id} />;
}

/**
 * What @payloadcms/plugin-seo adds to a page (`meta`) plus the site's own
 * `noindex` (cms/fields/seo.ts). Typed loosely here because the plugin is
 * wired by 2A-1 and its fields reach payload-types.ts with that phase's
 * regeneration; until then every read below is simply undefined.
 */
type SeoMeta = { title?: string | null; description?: string | null; image?: string | Media | null; noindex?: boolean | null };

function metaOf(page: Page | null): SeoMeta {
  const meta = (page as (Page & { meta?: SeoMeta | null }) | null)?.meta;
  return meta ?? {};
}

/**
 * The page's metadata: the editor's SEO tab where it is filled in, the
 * route's own long-standing title and description where it is not. `path`
 * stays the route's — a canonical is an address, not copy. The site name,
 * title template and default share image are Search & sharing's
 * (`getMetadata`, lib/seo.ts).
 */
export async function pageMetadata(slug: string, fallback: PageSeo): Promise<Metadata> {
  const page = await getPage(slug, { draft: false });
  const meta = metaOf(page);
  const image = imageOf(meta.image);
  return getMetadata({
    ...fallback,
    title: meta.title?.trim() || fallback.title,
    description: meta.description?.trim() || fallback.description,
    ...(image ? { image: image.src } : {}),
    noindex: Boolean(meta.noindex) || fallback.noindex,
  });
}
