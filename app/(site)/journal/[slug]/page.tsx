import type { Metadata } from "next";

import { getAdjacentPosts } from "@/components/journal/adjacent";
import { ArticleBody } from "@/components/journal/ArticleBody";
import { ArticleHeader } from "@/components/journal/ArticleHeader";
import { AuthorCard } from "@/components/journal/AuthorCard";
import { PrevNext } from "@/components/journal/PrevNext";
import { RelatedPosts } from "@/components/journal/RelatedPosts";
import { ShareLinks } from "@/components/journal/ShareLinks";
import { JsonLd } from "@/components/seo/JsonLd";
import { groundShapes } from "@/components/motion/groundShapes";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { Container } from "@/components/ui/Container";
import { isDraft } from "@/lib/cms/draft";
import { getPostBySlug, getRelatedPosts, listPostSlugs } from "@/lib/cms/journal";
import { journalPostHref, withJournalFeed } from "@/lib/cms/journalShared";
import { redirectOr404 } from "@/lib/cms/redirects";
import { getBrandLogo, getSite } from "@/lib/constants.server";
import { getMetadata } from "@/lib/seo";

/**
 * ==========================================================================
 * /journal/[slug] — one story
 * ==========================================================================
 *
 * Prerendered for every published post (`generateStaticParams`), purged
 * on publish (cms/collections/content/revalidation.ts), and read fresh
 * in draft mode: `getPostBySlug` reads the latest version — drafts too —
 * when a staff member previews (lib/cms/query.ts), and the live-preview
 * listener in the site layout refreshes the route on every save.
 *
 * CLICK-TO-EDIT. In draft mode the title, the standfirst, the byline, the
 * cover and the body carry `data-cms-path` with their FIELD names (SPEC
 * §G.5): the admin's FocusListener scrolls to `field-title`, `field-body`
 * and so on, exactly as it does for a block's row. `data-cms-collection`
 * tells the pill which collection to open when the preview is a tab of
 * its own rather than the admin's iframe.
 *
 * THE SHARE CARD is drawn by ./opengraph-image.tsx from the cover; the
 * metadata here leaves `openGraph.images` unset so that it can
 * (lib/seo.ts, ROUTES_WITH_OWN_SHARE_IMAGE).
 */

type Params = Promise<{ slug: string }>;

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  const rows = await listPostSlugs();
  return rows.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return withJournalFeed(
    await getMetadata({
      title: post.seo.title || post.title,
      description: post.seo.description || post.excerpt,
      path: journalPostHref(post.slug),
      noindex: post.seo.noindex,
    }),
  );
}

export default async function JournalPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [post, draft] = await Promise.all([getPostBySlug(slug), isDraft()]);
  if (!post) return redirectOr404(journalPostHref(slug));

  const [related, adjacent, site, logo] = await Promise.all([getRelatedPosts(post.slug, 3), getAdjacentPosts(post.slug), getSite(), getBrandLogo()]);
  const url = `${site.url}${post.href}`;
  const absolute = (src: string) => (src.startsWith("/") ? `${site.url}${src}` : src);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: [absolute(post.coverImage.src)],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: { "@type": post.author.name === site.name ? "Organization" : "Person", name: post.author.name },
    publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: absolute(logo.src) } },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(post.category ? { articleSection: post.category.name } : {}),
    ...(post.tags.length ? { keywords: post.tags.join(", ") } : {}),
    timeRequired: `PT${Math.max(1, post.readingTime)}M`,
  };

  const bodyAttrs = draft ? { "data-cms-path": "body", "data-cms-doc": post.id, "data-cms-collection": "posts", "data-cms-type": "body" } : {};

  return (
    <article className="relative isolate overflow-x-clip bg-surface">
      <JsonLd data={jsonLd} />
      <SectionShapes plan={groundShapes("surface", { count: 4 })} />

      <ArticleHeader post={post} draft={draft} />

      <Container className="relative pb-[4rem] pt-12 md:pb-section md:pt-16">
        <div {...bodyAttrs}>
          <ArticleBody body={post.body} />
        </div>

        <div className="mx-auto w-full max-w-reading">
          <ShareLinks url={url} title={post.title} className="mt-14 border-t border-line pt-8" />
          <AuthorCard post={post} />
          <PrevNext previous={adjacent.previous} next={adjacent.next} />
        </div>
      </Container>

      <RelatedPosts posts={related.slice(0, 3)} />
    </article>
  );
}
