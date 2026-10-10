import { JOURNAL_COPY } from "@/components/journal/copy";
import { listPostSlugs, listPosts } from "@/lib/cms/journal";
import { JOURNAL_PATH } from "@/lib/cms/journalShared";
import { getSite } from "@/lib/constants.server";

/**
 * /journal/rss.xml — the Journal as a feed: the newest stories, each with
 * its title, address, date, summary and category.
 *
 * Static and refreshed hourly: it reads the same cached getter the
 * listing does, so a publish (which purges the Journal's tags) reaches it
 * on the next request after the hour. Plain RSS 2.0, absolute addresses
 * from Site details' public URL, every value escaped. A post whose SEO tab
 * asks for noindex is left out, as it is from the sitemap. The writer is
 * `<dc:creator>` (a name), since RSS's own `<author>` must be an email.
 *
 * Discovered through `<link rel="alternate" type="application/rss+xml">`
 * on /journal and every story (`alternates.types` in their metadata).
 */

export const dynamic = "force-static";
export const revalidate = 3600;

const escape = (value: string) =>
  value.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] ?? c);

export async function GET(): Promise<Response> {
  const [site, page, slugs] = await Promise.all([getSite(), listPosts({ page: 1, perPage: 48 }), listPostSlugs()]);
  const feedUrl = `${site.url}${JOURNAL_PATH}/rss.xml`;
  const hidden = new Set(slugs.filter((row) => row.noindex).map((row) => row.slug));
  const posts = page.posts.filter((post) => !hidden.has(post.slug));

  const items = posts
    .map((post) => {
      const link = `${site.url}${post.href}`;
      return [
        "    <item>",
        `      <title>${escape(post.title)}</title>`,
        `      <link>${escape(link)}</link>`,
        `      <guid isPermaLink="true">${escape(link)}</guid>`,
        `      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>`,
        `      <description>${escape(post.excerpt)}</description>`,
        `      <dc:creator>${escape(post.author.name)}</dc:creator>`,
        ...(post.category ? [`      <category>${escape(post.category.name)}</category>`] : []),
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const newest = posts[0]?.publishedAt;
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    <title>${escape(`${site.name} — Journal`)}</title>`,
    `    <link>${escape(`${site.url}${JOURNAL_PATH}`)}</link>`,
    `    <description>${escape(JOURNAL_COPY.standfirst)}</description>`,
    `    <language>${escape(site.locale.toLowerCase().replace("_", "-"))}</language>`,
    ...(newest ? [`    <lastBuildDate>${new Date(newest).toUTCString()}</lastBuildDate>`] : []),
    `    <atom:link href="${escape(feedUrl)}" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
