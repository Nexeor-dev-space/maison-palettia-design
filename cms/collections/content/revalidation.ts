import type { CollectionAfterChangeHook, CollectionConfig } from "payload";

import { captureLiveState, revalidateCollection, revalidateCollectionDelete, safeRevalidate, type PathsFor } from "@/cms/hooks/revalidate";
import { TAGS } from "@/lib/cms/cache";

/**
 * ==========================================================================
 * Which routes a content change touches — the SPEC §G.4 mapping, in one place
 * ==========================================================================
 *
 * cms/hooks/revalidate.ts knows HOW to purge (after the response, tag +
 * path, drafts skipped, a signed loopback when there is no request). This
 * file knows WHAT: for each content collection, the tag its getters are
 * cached under and the concrete routes that print it. Each collection file
 * spreads `revalidationHooks("<slug>")` into its `hooks`, so a reviewer can
 * read this table against §G.4 line by line.
 *
 * TAGS DO THE FAN-OUT. Next marks every prerendered route that read a tag
 * stale when the tag is revalidated, so "every session page at this
 * venue", "/private-events/* (programme pages list activities)" and "the
 * experience page that lists this session" are covered by the collection's
 * tag; the paths below are the routes we can name without a query, purged
 * explicitly as belt and braces. (Dynamic-segment patterns such as
 * `/private-events/[slug]` are deliberately not used: the signed fallback
 * only accepts concrete paths.) `/sitemap.xml` is purged by every call.
 *
 * Renames: `prev` is the latest version before the save; the address that
 * was LIVE before a rename is purged by the redirects collection's hook
 * when `slugRedirect` writes the row (cms/hooks/slugRedirect.ts).
 */

type Doc = Parameters<PathsFor>[0];

const slugOf = (doc: Doc | undefined): string | undefined => (typeof doc?.slug === "string" && doc.slug ? doc.slug : undefined);

/** Both the new and the previous slug, deduplicated by the caller. */
const both = (doc: Doc, prev: Doc | undefined) => [slugOf(doc), slugOf(prev)].filter((slug): slug is string => Boolean(slug));

const pagePath = (slug: string) => (slug === "home" ? "/" : `/${slug}`);

const eventPaths = (slug: string) => [`/events/${slug}`, `/events/${slug}/book`, `/events/${slug}/opengraph-image`];

/** The experience a session belongs to, when the hook received it populated. */
const experienceSlugOf = (doc: Doc | undefined): string | undefined => {
  const experience = doc?.experience;
  return experience && typeof experience === "object" ? slugOf(experience as Doc) : undefined;
};

type Mapping = { tags: string[]; paths: PathsFor; layout?: boolean };

export const CONTENT_REVALIDATION = {
  pages: {
    tags: [TAGS.pages],
    paths: (doc, prev) => both(doc, prev).map(pagePath),
  },
  experiences: {
    tags: [TAGS.experiences],
    paths: (doc, prev) => ["/", "/events", "/gallery", "/private-events", ...both(doc, prev).map((slug) => `/events/${slug}`)],
  },
  sessions: {
    tags: [TAGS.sessions],
    paths: (doc, prev) => {
      const experience = experienceSlugOf(doc) ?? experienceSlugOf(prev);
      return ["/", "/events", ...both(doc, prev).flatMap(eventPaths), ...(experience ? [`/events/${experience}`] : [])];
    },
  },
  venues: {
    tags: [TAGS.venues],
    paths: () => ["/", "/locations", "/events", "/private-events"],
  },
  programmes: {
    tags: [TAGS.programmes],
    paths: (doc, prev) => ["/", "/private-events", "/private-events/book", ...both(doc, prev).map((slug) => `/private-events/${slug}`)],
  },
  policies: {
    tags: [TAGS.policies],
    paths: (doc, prev) => ["/policies", "/faq", "/checkout", ...both(doc, prev).map((slug) => `/policies/${slug}`)],
    layout: true, // the footer's legal row lists policies
  },
  faqs: { tags: [TAGS.faqs], paths: () => ["/faq", "/"] },
  passes: { tags: [TAGS.passes], paths: () => ["/loyalty", "/checkout"] },
  testimonials: { tags: [TAGS.testimonials], paths: () => ["/", "/events"] },
  vibes: { tags: [TAGS.vibes], paths: () => ["/events", "/"] },
  redirects: {
    tags: [TAGS.redirects],
    // The address a redirect leaves from: it was a cached 404 (or a cached redirect to somewhere else).
    paths: (doc, prev) =>
      [doc?.from, prev?.from].filter((path): path is string => typeof path === "string" && path.startsWith("/")),
  },
} satisfies Record<string, Mapping>;

export type RevalidatedCollection = keyof typeof CONTENT_REVALIDATION;

/**
 * `beforeChange` + `afterChange` + `afterDelete` for a collection, per the
 * table above. The `beforeChange` half reads whether the document is live
 * before the save (cms/hooks/revalidate.ts, "DRAFTS"); a collection that
 * lists its own hooks must spread all three. `session-inventory` is absent
 * on purpose: counters change on every checkout and the site reads live
 * seats from `/api/site/availability`, so inventory writes never purge
 * pages (§G.3).
 */
export function revalidationHooks(
  slug: RevalidatedCollection,
): Required<Pick<NonNullable<CollectionConfig["hooks"]>, "beforeChange" | "afterChange" | "afterDelete">> {
  const mapping: Mapping = CONTENT_REVALIDATION[slug];
  const opts = { layout: mapping.layout };
  return {
    beforeChange: [captureLiveState],
    afterChange: [revalidateCollection(mapping.paths, mapping.tags, opts)],
    afterDelete: [revalidateCollectionDelete(mapping.paths, mapping.tags, opts)],
  };
}

/**
 * `pages` only: §G.4 adds the layout "when the page is new" — the first
 * publish of a page (navigation and footer may link it). Detected by the
 * `publishedAt` stamp, which Pages sets on the first publish and every
 * later version carries; an ordinary republish purges only its own route.
 */
export const revalidateLayoutOnFirstPublish: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  if (req.context?.skipRevalidate === true || req.context?.disableRevalidate === true) return doc;
  if (doc?._status === "published" && doc?.publishedAt && !previousDoc?.publishedAt) {
    safeRevalidate(req, [TAGS.pages], [], true);
  }
  return doc;
};
