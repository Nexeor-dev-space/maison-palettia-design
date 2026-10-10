import type { MetadataRoute } from "next";

import { SITE } from "@/lib/constants";

/**
 * ==========================================================================
 * /robots.txt
 * ==========================================================================
 *
 * The site had none — /robots.txt was a 404 — so crawlers had no sitemap to
 * start from and nothing telling them which URLs are steps in somebody's
 * booking rather than pages.
 *
 * EVERYTHING IS OPEN EXCEPT THE TRANSACTIONAL STEPS:
 *
 *   /checkout ........... the basket and payment form
 *   /payment-success .... a customer's receipt
 *   /booking-status ..... a lookup by booking reference
 *   /events/{slug}/book . the seat picker for one scheduled session — one
 *                         per dated workshop that still has seats, so the
 *                         set changes with the calendar (hence the wildcard)
 *   /button-preview ..... a temporary design-review page (the route itself
 *                         says to delete it once the choice is made)
 *
 * Each of these is a URL a customer is sent to, never one anybody searches
 * for, and the receipt and lookup can carry a booking reference in the query
 * string. Every one of them also prints `noindex` through buildMetadata.
 * That tag only works on a page a crawler is allowed to fetch, so for these
 * it is the second line rather than the first: it covers any URL fetched
 * before this file existed. Nothing links to them from outside a booking, so
 * a blocked-but-listed URL is not a realistic outcome here.
 *
 * WHAT IS DELIBERATELY NOT BLOCKED. /blog (the unbuilt Journal) and /loyalty
 * (passes with placeholder prices) are `noindex` and stay crawlable, because
 * that is how a crawler reads the tag — and both are meant to come back into
 * the index the day their content is real, which a Disallow line would have
 * to be remembered to undo. /private-events/book is the enquiry form a host
 * is meant to find, not a transaction, and it is indexable on purpose.
 *
 * The wildcard in the event-booking line is honoured by Google and Bing,
 * which are the crawlers this file is for.
 *
 * The Sitemap line is absolute because the standard requires it, and it is
 * built from SITE.url, so it moves with the production domain.
 * TODO(client): SITE.url is still the assumed domain — see lib/constants.ts.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/checkout",
        "/payment-success",
        "/booking-status",
        "/events/*/book",
        "/button-preview",
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
