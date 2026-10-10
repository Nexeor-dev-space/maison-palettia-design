import type { Metadata } from "next";

import { SITE } from "@/lib/constants";
import type { PageSeo } from "@/types";

/**
 * The size of the default share card: the 1.91:1 frame Facebook, LinkedIn, X
 * and WhatsApp all cut their large card from. Shared by app/opengraph-image.tsx
 * (its `size` export) and DEFAULT_SHARE_IMAGE below, so the width and height
 * a page declares are the ones the image has.
 *
 * The per-route photograph cards are the same proportion drawn smaller, at
 * 684x360, and declare their own size: a photograph as PNG at 1200x630 is
 * over WhatsApp's 600KB limit. See app/events/[slug]/opengraph-image.tsx.
 */
export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 };

/**
 * ==========================================================================
 * THE DEFAULT SHARE IMAGE — the brand card at app/opengraph-image.tsx
 * ==========================================================================
 *
 * Every page that has not chosen its own picture is shared with this one.
 *
 * THE HISTORY, BECAUSE IT EXPLAINS THE SHAPE. This pointed at
 * "/images/brand/og-default.jpg", which never existed — public/images/brand/
 * holds a .gitkeep and nothing else — so every page advertised a share image
 * that 404'd. It was then set to null, which was honest but left 25 of 29
 * routes unfurling on WhatsApp and iMessage as a bare grey link. It is now a
 * card the site draws itself from the official logo: see
 * app/opengraph-image.tsx for what is on it and why.
 *
 * WHY A URL HERE AS WELL AS THE FILE THERE. A root opengraph-image only
 * reaches routes that do not set `openGraph` of their own, and every page
 * built below does — Next replaces a parent's `openGraph` object wholesale,
 * images and all. So the file serves the homepage and the error pages by
 * convention, and this names its URL for everything else. The path is fixed
 * by the file's location (no route groups, so no hash suffix): moving the
 * file means changing this.
 *
 * TODO(client): supply branded 1200x630 share artwork as a JPEG — well under
 * 600KB, the ceiling Meta's WhatsApp link-preview documentation sets for an
 * og:image. Save it as app/opengraph-image.jpg (its alt text in
 * app/opengraph-image.alt.txt) and delete app/opengraph-image.tsx. A static
 * file is served WITH its extension, so then set `url` here to
 * "/opengraph-image.jpg" and `type` to "image/jpeg".
 */
export const DEFAULT_SHARE_IMAGE = {
  url: "/opengraph-image",
  ...SHARE_IMAGE_SIZE,
  type: "image/png",
  alt: `${SITE.name} — ${SITE.tagline}`,
};

/**
 * Routes whose share image is drawn by an `opengraph-image` file in their own
 * folder, from that page's own photograph:
 *
 *   /events/[slug] ............ app/events/[slug]/opengraph-image.tsx
 *   /private-events/[slug] .... app/private-events/[slug]/opengraph-image.tsx
 *
 * `buildMetadata` must leave `openGraph.images` UNSET on these, and that is
 * the whole reason this list exists. Next's rule is that a segment's own
 * `openGraph.images` beats an image file in the same segment — so filling in
 * the default here would silently cover every event's photograph with the
 * brand card.
 *
 * An `image` a page passes is ignored on these routes for the same reason.
 * /private-events/[slug] used to pass one — the programme's photograph as a
 * full-size original, up to 2.4MB and in one case portrait — and no longer
 * does: the file draws that same photograph, cropped to the share frame.
 *
 * Patterns rather than slugs, because the folder is what decides it: every
 * slug under those two folders gets the file. /private-events/book is a
 * static sibling of [slug] with no file of its own, hence the exclusion.
 * Add a line here when an opengraph-image goes into another page's folder.
 */
const ROUTES_WITH_OWN_SHARE_IMAGE: readonly RegExp[] = [
  /^\/events\/[^/]+$/,
  /^\/private-events\/(?!book$)[^/]+$/,
];

/**
 * The Open Graph block every page starts from: the defaults print it as it
 * is, and `homeMetadata` repeats it with the homepage's own `url`.
 */
const SITE_OPEN_GRAPH = {
  type: "website",
  siteName: SITE.name,
  locale: SITE.locale,
  title: SITE.name,
  description: SITE.tagline,
} as const;

/**
 * Site-wide metadata defaults. Individual pages override title/description
 * and canonical URL through `buildMetadata`; the homepage through
 * `homeMetadata`.
 */
export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.name,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.tagline,
  applicationName: SITE.name,
  /*
    NO CANONICAL AND NO `openGraph.url` HERE — "/" and then "./" were both
    tried, and both were wrong somewhere.

    These defaults are inherited by every route that does not set its own,
    which is the homepage and every error page. "/" made each of them claim
    the homepage as its canonical: a 404 at /events/not-a-slug told search
    engines it was a copy of the front page.

    "./" resolves against the route's own pathname (resolveRelativeUrl in
    next/dist/lib/metadata/resolvers/resolve-url.js), and under `next dev`,
    where every request renders afresh, that looked right — /does-not-exist
    pointed at itself. Production is different: the default 404 is
    prerendered ONCE, as the static route /_not-found, and every unmatched
    URL is served that one file. Built, .next/server/app/_not-found.html
    carried `canonical` and `og:url` of "https://…/_not-found" — an internal
    path, on every 404.

    A 404 has no canonical page, so the honest tag is none, and the defaults
    now carry neither field. The homepage, the one page that relied on them,
    sets its own through `homeMetadata` below; every page built with
    `buildMetadata` already set its own and is unaffected.
  */
  openGraph: SITE_OPEN_GRAPH,
  twitter: { card: "summary_large_image" },
  /*
    NO `robots` HERE, deliberately. A page with no robots tag is indexable —
    that is the default every crawler applies — so `index, follow` said
    nothing a missing tag does not. What it did do was collide: Next adds
    `noindex` to its 404 page, and this default printed `index, follow`
    alongside it, so every 404 carried two robots tags that disagree. The
    pages that must stay out of search set `noindex` through `buildMetadata`.
  */
};

/**
 * The homepage's canonical and share URL — the two fields `defaultMetadata`
 * no longer carries (see the note there). The whole Open Graph block is
 * repeated rather than only `url`, because Next replaces a parent's
 * `openGraph` object wholesale: `{ url: "/" }` alone would drop the site
 * name, locale, title and description. `images` stays absent, which is what
 * lets app/opengraph-image.tsx keep supplying the homepage's card.
 */
export const homeMetadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...SITE_OPEN_GRAPH, url: "/" },
};

/** Build per-page metadata without repeating the shared defaults. */
export function buildMetadata({ title, description, path, image, noindex }: PageSeo): Metadata {
  /*
    WHICH PICTURE, in order:

      1. The route draws its own (ROUTES_WITH_OWN_SHARE_IMAGE) — set nothing,
         so the opengraph-image file in its folder wins. Twitter picks it up
         too: Next copies `openGraph.images` into `twitter.images` when the
         latter is absent, which is why the twitter field is omitted as well.
      2. The page named one — use it.
      3. Otherwise the brand card.

    Spreading a conditional object leaves the key ABSENT in case 1, not
    undefined — `"images" in openGraph` is the test Next uses to decide
    whether the file is allowed to supply it.
  */
  const ownsShareImage = ROUTES_WITH_OWN_SHARE_IMAGE.some((route) => route.test(path));
  const ogImage = ownsShareImage ? null : image ? { url: image } : DEFAULT_SHARE_IMAGE;

  const imageFields = ogImage ? { images: [ogImage] } : {};

  /*
    `noindex, nofollow` for the pages that are not anybody's entry point —
    /checkout, /payment-success, /booking-status and the /blog placeholder
    were all indexable, so a customer's own confirmation page could turn up
    in search. Every other page carries no robots tag, which is `index,
    follow` by default (see the note in `defaultMetadata`).
  */
  const robotsFields = noindex
    ? { robots: { index: false, follow: false } }
    : {};

  return {
    title,
    description,
    ...robotsFields,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} · ${SITE.name}`,
      description,
      url: path,
      ...imageFields,
    },
    twitter: {
      /*
        Stated, not left to Next. Next picks the card type when it resolves
        this object — `summary` if it holds no image — and only afterwards
        copies the image across from Open Graph, so a route whose picture
        comes from its opengraph-image file was being announced as a small
        `summary` card with a large image attached.
      */
      card: "summary_large_image",
      title: `${title} · ${SITE.name}`,
      description,
      ...imageFields,
    },
  };
}
