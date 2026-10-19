import { renderSiteCard } from "@/components/cms/shareCard";
import { getBrandCopy } from "@/lib/brand.server";
import { getSite } from "@/lib/constants.server";
import { getCreativeExperiences } from "@/lib/experiences";
import { DEFAULT_SHARE_IMAGE, SHARE_CARD_SIZE } from "@/lib/seo";

/**
 * ==========================================================================
 * THE DEFAULT SHARE CARD — for every page without a photograph of its own
 * ==========================================================================
 *
 * Served at /opengraph-image, 1200x630, the size every platform's large card
 * is cut from. It exists because the site had no share image at all: the
 * branded artwork lib/seo.ts asks the client for has never arrived, so 25 of
 * 29 routes went out to WhatsApp, iMessage and Slack as a bare grey link.
 *
 * WHAT IT IS. The brand card in the site's light look (components/cms/
 * shareCard.tsx draws it, and every other card, from one composition): the
 * logo in Deep Lilac, a small "Creative workshops · Dubai" eyebrow, the
 * tagline from Brand wording as the script headline over a terracotta brush
 * stroke, one plain line saying what the studio is for, and three of the
 * activities' own photographs fanned as prints on the right. The tagline and
 * the photographs are the CMS's, so the card follows the admin; the eyebrow
 * and the line are fixed here because Brand wording has no field that says
 * either in so few words.
 *
 * WHICH PHOTOGRAPHS. The first three published activities that carry no
 * "Coming soon" flag, each by its own square `image` — the same frames the
 * menu and the homepage plates use — so the card shows what a visitor can
 * do today. With fewer, it shows fewer; with none, the words take the card.
 *
 * 684x360, not 1200x630, because it now carries photographs: PNG does not
 * compress them, and WhatsApp's ceiling is 600KB — see SHARE_CARD_SIZE in
 * lib/seo.ts, which DEFAULT_SHARE_IMAGE declares the same size from.
 *
 * HOW IT REACHES EVERY PAGE — AND WHY THIS FILE ALONE WOULD NOT. Next applies
 * a root opengraph-image only to routes that do not set `openGraph`
 * themselves, and every page built with `buildMetadata` does: a child's
 * `openGraph` replaces its parent's whole object, images included. So this
 * file covers the homepage and the error pages on its own, and lib/seo.ts
 * names its URL as the default image for everything else
 * (DEFAULT_SHARE_IMAGE). Moving or renaming this file breaks that URL.
 *
 * WHERE THE FILE LIVES, AND WHY THERE ARE TWO OF IT. This is the real one, in
 * app/(site)/ beside the layout, the homepage and not-found.tsx — and it has
 * to be in THEIR directory, because that is the only way a file-convention
 * image survives their `openGraph` exports: Next merges a segment's static
 * metadata files after that segment's own export, but a child segment's
 * `openGraph` replaces a parent's images wholesale (resolve-metadata.js).
 * When this file sat at app/ and the pages moved into (site), the homepage
 * and every 404 lost their card.
 *
 * In a route group, though, Next hashes the URL: this file is served as
 * `/opengraph-image-<6 chars>`, never as `/opengraph-image`
 * (getMetadataRouteSuffix in next/dist/lib/metadata/get-metadata-route.js;
 * only `sitemap` is exempt). lib/seo.ts names `/opengraph-image` by hand for
 * every page built with `buildMetadata`, and docs/cms/SPEC.md §G keeps that
 * URL in Phase 2. So app/opengraph-image/route.ts — a plain route handler at
 * the layout-less root beside favicon.ico and robots.ts — calls this module's
 * default export and returns it, so `/opengraph-image` answers with the same
 * bytes. A handler rather than a second metadata file, because a metadata
 * file at app/ would also attach itself to the root segment, which has no
 * `metadataBase` to resolve it against (see the note there). Edit the card
 * here; never there.
 *
 * Generated, not committed as a PNG, so it follows the CMS: replace the logo
 * in Site details, the tagline in Brand wording or an activity's photograph
 * and the card changes with it on the next revalidation. Prerendered at
 * build — nothing here reads the request.
 *
 * TODO(client): this is a stand-in for real share artwork, not a substitute
 * for it. When the client supplies a 1200x630 image, drop it in as
 * app/opengraph-image.jpg, delete this file, and point DEFAULT_SHARE_IMAGE in
 * lib/seo.ts at it — the steps are in the TODO there.
 */

export const alt = DEFAULT_SHARE_IMAGE.alt;
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const [copy, site, experiences] = await Promise.all([getBrandCopy(), getSite(), getCreativeExperiences()]);
  const photos = experiences
    .flatMap(({ status, image }) => (!status && image?.src ? [{ src: image.src, position: image.position }] : []))
    .slice(0, 3);

  return renderSiteCard({
    eyebrow: "Creative workshops \u00b7 Dubai",
    headline: copy.tagline,
    line: "Paint, craft and make something of your own.",
    domain: new URL(site.url).host.replace(/^www\./, ""),
    photos,
  });
}
