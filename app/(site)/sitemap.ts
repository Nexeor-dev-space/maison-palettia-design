import type { MetadataRoute } from "next";

import { getLandingPageSlugs } from "@/components/blocks/data";
import { FIXED_PAGE_SLUGS } from "@/cms/collections/content/Pages";
import { listCategories, listPostSlugs } from "@/lib/cms/journal";
import { getSite } from "@/lib/constants.server";
import { getEventSlugs } from "@/lib/eventDetail";
import { PASSES_CONFIGURED } from "@/lib/passes";
import { getPolicies } from "@/lib/policies";
import { getPrivateEventAudiences } from "@/lib/privateEvents.server";

/**
 * ==========================================================================
 * /sitemap.xml — every page somebody should be able to find, and no other
 * ==========================================================================
 *
 * The site had none, so the nineteen pages behind a slug — seven events, four
 * private-event programmes, eight policies — could only be discovered by a
 * crawler following links, and the walk-in activities are linked from very
 * few places.
 *
 * THE DYNAMIC PAGES COME FROM THE SAME GETTERS THEIR ROUTES PRERENDER FROM —
 * `getEventSlugs`, `getPrivateEventAudiences`, `getPolicies`, and the CMS
 * landing pages the catch-all serves — so a document published in the admin
 * is in this file the moment it has a page, and one unpublished is gone from
 * it the moment it does not. Every content hook revalidates
 * `/sitemap.xml` (cms/hooks/revalidate.ts, SPEC §G.4).
 *
 * WHAT IS LEFT OUT, and it is exactly the set of pages that print `noindex`
 * or are blocked in app/robots.ts. Listing a page here while telling search
 * engines not to index it is a contradiction Google reports as an error.
 *
 *   /checkout, /payment-success, /booking-status, /events/{slug}/book
 *       steps in a booking, not destinations
 *   /loyalty    while PASSES_CONFIGURED is false — the page's own noindex is
 *               tied to the same flag, so the two lift together
 *   /journal/{slug} whose SEO tab ticks "noindex" (the post page prints it)
 *
 * NO changeFrequency OR priority — Google ignores both outright. A landing
 * page carries `lastModified`, its real `updatedAt`; nothing else does yet,
 * because `new Date()` would tell crawlers every page changed on every fetch,
 * which teaches them to ignore the field.
 *
 * URLs are absolute, as the protocol requires, and built from Site details'
 * public address once an admin has confirmed it (`getSite`, which until
 * then uses an https NEXT_PUBLIC_SERVER_URL, else lib/constants.ts) — so a
 * domain change in the admin moves them.
 */

/** Indexable pages with no parameters. "" is the homepage. */
const STATIC_PATHS = [
  "",
  "/events",
  "/private-events",
  "/private-events/book",
  "/about",
  "/locations",
  "/gallery",
  "/contact",
  "/faq",
  "/policies",
  "/journal",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, eventSlugs, audiences, policies, landing, posts, categories] = await Promise.all([
    getSite(),
    getEventSlugs(),
    getPrivateEventAudiences(),
    getPolicies(),
    getLandingPageSlugs(FIXED_PAGE_SLUGS),
    listPostSlugs(),
    listCategories(),
  ]);

  const paths: string[] = [
    ...STATIC_PATHS,
    ...(PASSES_CONFIGURED ? ["/loyalty"] : []),
    ...eventSlugs.map((slug) => `/events/${slug}`),
    ...audiences.map((audience) => `/private-events/${audience.slug}`),
    ...policies.map((policy) => `/policies/${policy.slug}`),
    // A category page exists once a story is filed under it (the listing hides empty chips).
    ...categories.filter((category) => category.postCount > 0).map((category) => category.href),
  ];

  return [
    ...paths.map((path) => ({ url: `${site.url}${path}` })),
    ...landing.map((page) => ({ url: `${site.url}/${page.slug}`, lastModified: page.updatedAt })),
    // Every published, indexable story, with its real last change (SPEC §G.2: the Journal's getters, purged on publish).
    ...posts.filter((post) => !post.noindex).map((post) => ({ url: `${site.url}/journal/${post.slug}`, lastModified: post.updatedAt })),
  ];
}
