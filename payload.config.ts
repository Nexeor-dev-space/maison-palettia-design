import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { analyticsCollections } from "@/cms/collections/analytics";
import { commerceCollections } from "@/cms/collections/commerce";
import { commsCollections } from "@/cms/collections/comms";
import { contentCollections } from "@/cms/collections/content";
import { inNavOrder, withoutApiTab } from "@/cms/collections/navOrder";
import { inboxCollections } from "@/cms/collections/inbox";
import { systemCollections } from "@/cms/collections/system";
import { endpoints } from "@/cms/endpoints";
import { seoFields } from "@/cms/fields/seo";
import { globals } from "@/cms/globals";
import { jobsConfig } from "@/cms/jobs";
import { runtimeEmailAdapter } from "@/cms/lib/mailer";
import { livePreviewUrl, publicUrl, routeFor } from "@/cms/lib/publicUrl";
import { seedDefaults } from "@/cms/seed/defaults";

/**
 * ==========================================================================
 * payload.config.ts — the CMS, assembled from barrels (SPEC §A.4)
 * ==========================================================================
 *
 * This file is a skeleton on purpose: every collection, global, endpoint
 * and job reaches it through a barrel (`cms/**\/index.ts`), so the phases
 * that build the CMS add files to folders, not keys to this config. The
 * keys each phase MAY touch are listed in SPEC §A.4's ownership table;
 * Phase 1 owns the skeleton. Phase 2 added `plugins` (SEO) and
 * `admin.livePreview`; Phase 3 adds `email`; Phases 3–4 add admin views
 * and dashboard components.
 *
 * THE DATABASE IS PRODUCTION, EVEN FROM A LAPTOP (docs/cms/DECISIONS.md):
 * there is no local Postgres. `push: false` is therefore not a preference
 * but the safety rail — Payload's dev mode would otherwise run drizzle-kit
 * `push` against the live schema on every `next dev`. Schema changes go
 * through `npx payload migrate:create` → commit → `npx payload migrate`,
 * and migrations are additive within a release (SPEC §A.5).
 *
 * CSRF. Without `csrf` entries Payload accepts the `payload-token` cookie
 * from ANY Origin (auth/extractJWT.js, verified). `NEXT_PUBLIC_SERVER_URL`
 * is the allowlist; in development the two local spellings of port 3200
 * are added (never 3000 — another project owns it on this machine).
 * Production refuses to start without the variable, except during
 * `next build`, which has no requests to protect.
 *
 * `serverURL` stays unset: uploads then keep relative URLs
 * (`/api/media/file/…`) and `next/image` needs no `remotePatterns` (G22).
 * GraphQL is off — nothing consumes it and it is surface area.
 */

// Used only for keys the `payload` CLI reads (`migrationDir`, `importMap`,
// `typescript.outputFile`), and the CLI runs from source where this IS the
// checkout. Anything the SERVER writes to disk (uploads, invoice PDFs) must
// go through cms/lib/paths.ts instead: under `node .next/standalone/server.js`
// the same expression resolves inside the build output (spike G12).
const dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const isBuild = process.env.NEXT_PHASE === "phase-production-build";
const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/+$/, "");

if (isProd && !isBuild && !serverUrl) {
  throw new Error("NEXT_PUBLIC_SERVER_URL is required in production (it is the CSRF allowlist for the admin cookie).");
}

/**
 * DB TLS. In production the connection is verified explicitly:
 * `rejectUnauthorized` plus the CA from `sslrootcert` when the URL carries
 * one (`?sslmode=verify-full&sslrootcert=/etc/ssl/nexeor-pg.crt`, SPEC
 * §A.5). `sslmode=disable` is honoured only for a private host — and
 * scripts/preflight-db.mjs is what enforces "private". In development the
 * URL is taken as written (today: the owner's host, no TLS, flagged by the
 * preflight as a warning — DECISIONS.md item 2).
 */
const dbUrl = new URL(process.env.DATABASE_URL || "postgres://localhost/placeholder");
const sslmode = dbUrl.searchParams.get("sslmode");
const sslrootcert = dbUrl.searchParams.get("sslrootcert");
const ssl =
  sslmode === "disable"
    ? false
    : isProd
      ? { rejectUnauthorized: true, ...(sslrootcert ? { ca: fs.readFileSync(sslrootcert, "utf8") } : {}) }
      : undefined;

/** The collections with a route of their own: SEO tab and live preview (SPEC §A.4). */
const SEO_COLLECTIONS = ["pages", "experiences", "sessions", "programmes", "policies"] as const;

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || "",
  csrf: Array.from(new Set([serverUrl, ...(isProd ? [] : ["http://localhost:3200", "http://127.0.0.1:3200"])].filter(Boolean))) as string[],
  cors: [], // no cross-origin REST consumers — the site is same-origin
  admin: {
    user: "users",
    theme: "light",
    avatar: "default",
    dateFormat: "d MMM yyyy, HH:mm",
    timezones: {
      defaultTimezone: "Asia/Dubai",
      supportedTimezones: [{ label: "Dubai (GST)", value: "Asia/Dubai" }],
    },
    // `icons` points the admin tab at the brand favicon Next already serves
    // from app/favicon.ico; without it Payload injects its own marks (SPEC §A.4).
    meta: { titleSuffix: " · Maison Palettia", icons: [{ url: "/favicon.ico" }] },
    importMap: { baseDir: dirname },
    components: {
      graphics: {
        Logo: "@/cms/components/admin/Logo#Logo",
        Icon: "@/cms/components/admin/Icon#Icon",
      },
      // Admin-wide providers wrap every admin page. MockBanner is the strip that
      // says "Payments is in MOCK mode" (SPEC §I) — mounted here rather than
      // on the dashboard so it is visible on the page where someone is about
      // to trust a test checkout. Phase 3/4 append their own providers.
      // FocusListener (P2 2D, SPEC §G.5) is the admin's end of click-to-edit:
      // it answers the live-preview iframe's "Edit" pills by scrolling to the
      // block, or by opening Brand wording at the field.
      // WarningsBar (P4 review, SPEC §I): the dashboard's RED checks as a slim
      // strip on every other admin page.
      providers: ["@/cms/components/settings/MockBanner#MockBanner", "@/cms/components/admin/WarningsBar#WarningsBar", "@/cms/components/admin/FocusListener#FocusListener"],
      // P4 4B (SPEC §I): the admin home — the setup checks first (red
      // banners, then the "finish setting up" list), then the owner's
      // dashboard (greeting, quick actions, KPIs, today's sessions, orders,
      // enquiries, drafts). Both are server components; Payload's own
      // collection cards follow them as the "everything" index.
      beforeDashboard: ["@/cms/components/admin/Warnings#Warnings", "@/cms/components/admin/Dashboard#Dashboard"],
      // P4 4B: the ⌘K command palette lives at the top of the sidebar — a
      // search box that is also the trigger; the overlay portals to <body>.
      // P3 3E (SPEC §H.7, §I): sidebar entries for the custom views ("Front
      // desk → Check-in", "Reports → Analytics"), shown only to the roles that
      // may open them — right under the search since the 4B review, so the
      // sidebar's DOM order is its visual order (no CSS reordering).
      beforeNavLinks: ["@/cms/components/admin/CommandPalette#CommandPalette", "@/cms/components/admin/NavLinks#NavLinks"],
      views: {
        // P3 3E: the door — camera scan, typed codes, attendee lists. The view
        // checks sign-in and role itself (Payload skips both for custom views).
        checkIn: { Component: "@/cms/views/checkIn#CheckInView", path: "/check-in", exact: true },
        // P4 4C (SPEC §I): the studio's numbers — period picker, sales,
        // website traffic, the booking funnel, VAT summary and CSV exports.
        // The view signs people in and checks the role itself (admins all,
        // editors traffic only, front desk none).
        analytics: {
          Component: "@/cms/views/analytics#AnalyticsView",
          path: "/analytics",
          exact: true,
          meta: { title: "Analytics", description: "Sales, website visits and VAT for any period." },
        },
      },
    },
    // Live preview (P2 2A, SPEC §G.5): the iframe loads `/preview?path=…` on
    // the public origin, which enables draft mode for staff and redirects;
    // the site's RefreshRouteOnSave re-renders on every save and autosave.
    // `pages` also opens it by default (its own `admin.livePreview`).
    livePreview: {
      url: livePreviewUrl,
      collections: [...SEO_COLLECTIONS],
      globals: ["site-settings", "navigation", "brand-copy"],
      breakpoints: [
        { label: "Phone", name: "phone", width: 390, height: 844 },
        { label: "Tablet", name: "tablet", width: 820, height: 1180 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
    },
  },
  // Sorted into the sidebar's order (Content … System) and without the API
  // tab — cms/collections/navOrder.ts says why (4B review).
  collections: inNavOrder([
    ...systemCollections,
    ...contentCollections,
    ...commerceCollections,
    ...commsCollections,
    ...inboxCollections,
    ...analyticsCollections,
  ]),
  globals: withoutApiTab(globals),
  endpoints,
  jobs: jobsConfig,
  // Phase 3C (SPEC §H.8): our own adapter, which reads Settings → Email
  // sending on every send (SMTP, Resend or log-only) — Payload's own
  // password-reset mail included — so no email setting needs a redeploy.
  email: runtimeEmailAdapter,
  editor: lexicalEditor(),
  // Plain words for Payload's own strings where they reach the owner
  // (4B review): a session opened with "Add a session" is titled
  // "[New — not saved yet]" instead of "[Untitled]" until its first save
  // names it. Merged over Payload's English; nothing else changes.
  i18n: { translations: { en: { general: { untitled: "New — not saved yet" } } } },
  plugins: [
    // The SEO tab (P2 2A, SPEC §A.4, §I) on the five collections with a page of
    // their own: meta title, description, share image, snippet preview and
    // the generate buttons, plus our `noindex` checkbox (cms/fields/seo.ts).
    // Canonical URLs come from Site details' public address, never the Host.
    seoPlugin({
      collections: [...SEO_COLLECTIONS],
      uploadsCollection: "media",
      tabbedUI: true,
      fields: seoFields,
      generateTitle: ({ doc }) => doc?.title ?? doc?.name ?? "",
      generateDescription: ({ doc }) => doc?.excerpt ?? doc?.description ?? doc?.summary ?? "",
      generateURL: async ({ doc, collectionConfig, req }) => `${await publicUrl(req)}${routeFor(collectionConfig?.slug ?? "", doc)}`,
    }),
  ],
  graphQL: { disable: true },
  defaultDepth: 1,
  maxDepth: 4,
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
      // Prerender workers only read; keep the build's footprint on the shared host small.
      max: isBuild ? 2 : 10,
      ssl,
    },
    push: false,
    migrationDir: path.resolve(dirname, "migrations"),
    // Decided before the first migration; changing it later rewrites every table.
    idType: "uuid",
  }),
  sharp,
  upload: { limits: { fileSize: 25 * 1024 * 1024 } },
  onInit: seedDefaults,
});
