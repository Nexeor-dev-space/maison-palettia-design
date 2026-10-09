import Image from "@/app/(site)/opengraph-image";

/**
 * /opengraph-image — a URL kept alive, not a second card.
 *
 * The brand share card is drawn in app/(site)/opengraph-image.tsx, where it
 * has to live so the homepage and the 404 page pick it up by convention. But
 * a metadata image inside a route group is served with a hash in its URL
 * (`/opengraph-image-<6 chars>` — getMetadataRouteSuffix in next/dist/lib/
 * metadata/get-metadata-route.js), and lib/seo.ts names `/opengraph-image`
 * by hand as DEFAULT_SHARE_IMAGE for every page built with `buildMetadata`.
 * docs/cms/SPEC.md §G keeps that URL through Phase 2.
 *
 * WHY A ROUTE HANDLER AND NOT AN `opengraph-image.tsx` RE-EXPORT HERE. A
 * metadata FILE at the app/ root is also attached as static metadata to the
 * root segment, and the root has no layout now, so no `metadataBase`: Next's
 * internal /_not-found then prints `og:image="http://localhost:3000/…"` and
 * every build warns about it. A `route.ts` is a plain handler — never
 * discovered as metadata (isMetadataPage excludes app routes) — so it serves
 * the bytes and attaches to nothing. It sits at the layout-less root beside
 * favicon.ico and robots.ts; handlers need no layout.
 *
 * The default export of the card is already a function returning an
 * ImageResponse (a Response), so GET simply hands it back: same bytes, same
 * `image/png`, same immutable cache header as the hashed route. `force-static`
 * because the card reads nothing from the request — it is drawn once at build,
 * exactly as the metadata route is.
 *
 * Retire this file only together with the hardcoded URL in lib/seo.ts.
 */
export const dynamic = "force-static";

export function GET() {
  return Image();
}
