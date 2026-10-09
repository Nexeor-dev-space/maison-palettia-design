import type { MetadataRoute } from "next";

import { SITE } from "@/lib/constants";
import { getEventSlugs } from "@/lib/eventDetail";
import { PASSES_CONFIGURED } from "@/lib/passes";
import { POLICIES } from "@/lib/policies";
import { PRIVATE_EVENT_AUDIENCES } from "@/lib/privateEvents";

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
 * `getEventSlugs`, `PRIVATE_EVENT_AUDIENCES`, `POLICIES` — so an activity
 * added to lib/experiences.ts is in this file the moment it has a page, and
 * one removed is gone from it the moment it does not.
 *
 * WHAT IS LEFT OUT, and it is exactly the set of pages that print `noindex`
 * or are blocked in app/robots.ts. Listing a page here while telling search
 * engines not to index it is a contradiction Google reports as an error.
 *
 *   /checkout, /payment-success, /booking-status, /events/{slug}/book
 *       steps in a booking, not destinations
 *   /blog       the unbuilt Journal placeholder
 *   /button-preview   a temporary design-review page
 *   /loyalty    while PASSES_CONFIGURED is false — the page's own noindex is
 *               tied to the same flag, so the two lift together
 *
 * NO lastModified, changeFrequency OR priority. There is no real edit date
 * for any of this content, and `new Date()` would tell crawlers every page
 * changed on every fetch, which teaches them to ignore the field. Google
 * ignores the other two outright. A bare list of URLs is the honest sitemap
 * for this site until a CMS can supply dates.
 *
 * URLs are absolute, as the protocol requires, and built from SITE.url.
 * TODO(client): SITE.url is still the assumed domain — see lib/constants.ts.
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
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const eventSlugs = await getEventSlugs();

  const paths: string[] = [
    ...STATIC_PATHS,
    ...(PASSES_CONFIGURED ? ["/loyalty"] : []),
    ...eventSlugs.map((slug) => `/events/${slug}`),
    ...PRIVATE_EVENT_AUDIENCES.map((audience) => `/private-events/${audience.slug}`),
    ...POLICIES.map((policy) => `/policies/${policy.slug}`),
  ];

  return paths.map((path) => ({ url: `${SITE.url}${path}` }));
}
