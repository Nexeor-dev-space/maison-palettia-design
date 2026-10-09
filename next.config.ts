import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

/**
 * ==========================================================================
 * next.config.ts — one Next process, the site and the Payload admin inside it
 * ==========================================================================
 *
 * `withPayload` (last line) is what lets `app/(payload)` compile: it turns
 * off `turbopackServerFastRefresh` for the admin's HMR, silences the sass
 * `@import` deprecation that Payload's own SCSS still trips, externalises
 * `graphql`/`sharp`/drizzle so one copy loads at runtime, and adds the
 * `Sec-CH-Prefers-Color-Scheme` client-hint headers the admin theme reads.
 * It also attaches a `webpack()` function; on 16.3.4 that only flips an
 * internal flag and the Turbopack build still passes, so `next build` stays
 * as it is — do NOT add `--webpack` (docs/cms/research/00-spike.md, G7).
 *
 * `poweredByHeader: false` because `withPayload` would otherwise advertise
 * "Next.js, Payload" on every response; nobody needs the hint.
 */

/**
 * Routes that carry a booking reference or a signed key in the URL. They get
 * `Referrer-Policy: no-referrer` so the reference never leaks to a third
 * party through an outbound link (the site-wide default below still sends
 * the origin). The list is repeated in `analytics-settings.excludePaths`
 * (seeded) and in the layout's decision not to mount third-party tags on
 * them — three places, same four routes (SPEC §A.4, §G.2).
 */
const NO_REFERRER_ROUTES = ["/checkout", "/payment-success", "/my-bookings", "/booking-status"];

const nextConfig: NextConfig = {
  /**
   * Self-hosted on the owner's server as `node .next/standalone/server.js`
   * with cwd = repo root (so `media/`, `private/` and `migrations/` resolve,
   * G12). Harmless if the deployment ever moves to Vercel.
   */
  output: "standalone",
  poweredByHeader: false,

  /**
   * pdfkit (Phase 3 invoices and tickets) opens its AFM font files from disk
   * at runtime; bundling it inlines paths that do not exist in the output
   * directory. Keeping it external makes Node load it from node_modules.
   */
  serverExternalPackages: ["pdfkit"],

  /**
   * The programme moved from /workshops to /events.
   *
   * Redirects rather than a clean break: /workshops has been the destination
   * of every booking action on the site, it is in the footer, and it is what
   * anyone who has already shared a link is holding. A 404 would be the site
   * breaking its own promises to make a rename tidy.
   *
   * Permanent, because the move is. That does mean browsers and search engines
   * will cache it — which is the right outcome here and worth knowing before
   * anyone reverses the rename.
   *
   * These three are the only redirects that live in code. Editorial ones
   * ("old flyer URL → new page", a renamed slug) belong to the `redirects`
   * collection in the CMS (SPEC §D.2), where staff can add them without a
   * deploy.
   */
  async redirects() {
    return [
      { source: "/workshops", destination: "/events", permanent: true },
      { source: "/workshops/:slug", destination: "/events/:slug", permanent: true },
      { source: "/workshops/:slug/book", destination: "/events/:slug/book", permanent: true },
    ];
  },

  /**
   * Apple Pay's domain-verification file has to be served from a dot-prefixed
   * path, and the app router cannot have a `.well-known` segment. The rewrite
   * hands it to a plain route handler that prints the text an admin pasted
   * into Settings → Payments (SPEC §A.2 rule 7). The handler lands in Phase 3;
   * until then the path simply 404s, which is what it did before.
   */
  async rewrites() {
    return [
      {
        source: "/.well-known/apple-developer-merchantid-domain-association",
        destination: "/api/site/apple-domain-association",
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }],
      },
      ...NO_REFERRER_ROUTES.map((source) => ({
        source,
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      })),
    ];
  },
};

export default withPayload(nextConfig);
