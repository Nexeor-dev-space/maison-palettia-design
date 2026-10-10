# Maison Palettia CMS — Build Specification (SPEC.md)

**Status:** final, buildable — **revision 2** (resolves the review of revision 1; §Q lists every change, §P the critiques that were varied or rejected and why). This is the single document Phases 1–5 execute. It consolidates `00-spike.md`, `01-content-inventory.md`, `02-mamo-pay-api.md` and `03-commerce-notifications-design.md`; where those disagree, §N says which one wins and why. Anything marked **UNVERIFIED** in the research stays so here and the design never depends on it. Where this document and a research document disagree, **this document wins**.

**Repo:** `/Users/rohitkvinod/Desktop/Nexeor/Projects/maison-palettia/maison-palettia-design` (Next 16.3.4, React 19.2.8, Tailwind v4, framer-motion). Phase 1 starts on the tree as it is when the concurrent UI-fix workflow has merged; every path below is relative to the repo root and is written in full (no `home/…` shorthand).

**Owner constraints (binding):** Payload CMS 3.90.2 in-app · Postgres (`DATABASE_URL` in `.env`) · RBAC for staff · enquiries in the CMS · Mamo Pay (UAE) · confirmation email with invoice PDF + QR tickets · analytics panel in the admin · **no `.env` beyond `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`** — every other setting/secret is edited in the admin at runtime, encrypted where secret, with no redeploy · content edits go live without a rebuild · self-hosted Node on the owner's server (persistent disk), with the Vercel delta noted.

**Reading guide.** §A architecture · §B packages · §C env + settings globals · §D collections · §E page builder · §F seed · §G site wiring/caching · §H commerce flows · §I admin ease-of-use · §J RBAC · §K tests · §L phase plan · §M owner runbook · §N research contradictions · §O cross-agent contracts (`cms/lib/contracts.ts`) · §P varied/rejected critique · §Q change log of this revision.

---

## A. Architecture and repository layout

### A.1 One process, two route groups

Payload 3.90.2 runs **inside** the Next 16.3.4 process (`@payloadcms/next` peer range `>=16.3.3 <17`, verified). The admin and REST live under `app/(payload)`; the site lives under `app/(site)`. Each group has its own root layout, so the site's CSS graph (Tailwind v4, Lenis, fonts, intro script) and Payload's SCSS never meet (spike-verified). Postgres via `@payloadcms/db-postgres` with `push: false` and migrations only. Background work runs in-process through the Payload Jobs Queue, started at boot from `instrumentation.ts`.

```
Browser ──► reverse proxy (TLS, rate limits on /api/users/*, appends X-Forwarded-For)
             │
             ▼
           Next 16 (one Node process, `next start` / standalone)
             ├─ app/(site)/**            marketing + booking site (static pages, Local API reads, on-demand revalidation)
             ├─ app/(site)/api/site/**   site route handlers (checkout, webhook, waitlist, analytics beacon, availability …)
             ├─ app/(payload)/admin      Payload admin UI (+ /admin/check-in, /admin/analytics custom views)
             ├─ app/(payload)/api        Payload REST + custom root endpoints under /api/actions/** (role-checked per handler)
             ├─ instrumentation.ts       getPayload({ cron: true }) → jobs autoRun (email q every 20 s, default q every minute)
             └─ Local API everywhere else (payload.find / payload.db.execute inside hooks, jobs, pages)
                       │  TLS (sslmode=verify-full) or private Docker network, dedicated non-superuser role
                       ▼
           Postgres 16 (shared Nexeor host, DB maison_palettia_prod) · disk: media/ (uploads) · private/invoices/ (PDFs)
           Outbound: Mamo Pay REST (sandbox|live) · SMTP or Resend · optional GA4/Plausible/Umami/Meta tags on the site (consent-gated)
```

### A.2 Routing rules (hard)

1. `app/favicon.ico` and `app/robots.ts` stay at the `app/` root (Next anchors them there; moving `robots.ts` silently 404s `/robots.txt`). `sitemap.ts`, `icon.png`, `apple-icon.png`, `opengraph-image.tsx` move into `(site)`. The favicon/app-icon files are **static and developer-owned** (there are no favicon upload fields in the admin — see §C.3 `site-settings`).
2. `/admin/*` and `/api/*` belong to Payload. **Every site route handler lives under `/api/site/**`** (`app/(site)/api/site/...`). A static Next segment beats Payload's `api/[...slug]` catch-all (spike-verified), and `site` is never a collection slug, so nothing shadows Payload REST. Admin-only actions are Payload root `endpoints` under `/api/actions/**`. Payload root endpoints have **no built-in auth or access control** (verified: `Endpoint` is just `{ path, method, handler }`), so every handler's first statement is `requireRole(req, [...])` from `cms/endpoints/index.ts` (§J lists the role per endpoint) and every handler rejects requests whose `Sec-Fetch-Site` header is `cross-site` (403).
3. No page under `(site)/admin`; no site route named after a collection slug (`/api/orders`, `/api/enquiries`… are Payload's).
4. There is no `app/layout.tsx`. Branded 404: `app/(site)/not-found.tsx` + `app/(site)/[...slug]/page.tsx`, which serves CMS `pages` by **single-segment** slug. Before any DB call the catch-all short-circuits: `if (params.slug.length !== 1 || !/^[a-z0-9-]{1,64}$/.test(params.slug[0])) notFound()`. It exports `dynamic = "force-static"` with `generateStaticParams` from published `pages` (`dynamicParams: true` so a page created later renders on first request); 404s are excluded from the analytics beacon. Then it consults the `redirects` collection (§D.2) and finally `notFound()`.
5. No `proxy.ts` in v1. If one is ever added its matcher excludes `/admin/:path*`, `/api/:path*`, `/_next/:path*`.
6. GraphQL is disabled (`graphQL: { disable: true }`); the two `api/graphql*` route files are not created. `graphql@^16` stays installed because it is a hard peer dep.
7. `/.well-known/apple-developer-merchantid-domain-association` is served by a `rewrites()` entry in `next.config.ts` → `/api/site/apple-domain-association` (no dot-prefixed app segment).

### A.3 Folder layout (authoritative — Phase ownership globs in §L refer to these paths)

```
app/
  favicon.ico  robots.ts                                   root-only metadata files
  (site)/
    layout.tsx  globals.css  page.tsx  not-found.tsx  sitemap.ts  opengraph-image.tsx  icon.png  apple-icon.png
    [...slug]/page.tsx                                    CMS `pages` catch-all (single segment) → redirects lookup → branded 404
    about/ locations/ gallery/ faq/ contact/ policies/ loyalty/ events/ private-events/   (existing, now CMS-fed)
    checkout/ payment-success/ booking-status/ my-bookings/                                (booking surfaces)
    preview/route.ts  exit-preview/route.ts               Next draftMode on/off (staff only; `path` validated)
    dev/mamo-mock/pay/[id]/page.tsx                       mock Mamo hosted page (never in production)
    api/site/
      checkout/start/route.ts  checkout/quote/route.ts
      orders/[ref]/status/route.ts  orders/lookup/route.ts
      availability/[slug]/route.ts                        live seats, no-store
      webhooks/mamo/route.ts                              Mamo webhook receiver (rate-limited, redacting)
      enquiries/route.ts  waitlist/route.ts
      my-bookings/request/route.ts  my-bookings/consume/route.ts
      analytics/collect/route.ts                          cookieless beacon
      tickets/[code]/pdf/route.ts  invoices/[id]/pdf/route.ts   signed customer downloads (the ONLY customer download path)
      apple-domain-association/route.ts                   text/plain from payment-settings (via rewrite)
      revalidate/route.ts                                 HMAC-signed fallback for job context (timestamp + body hash + nonce)
  (payload)/
    layout.tsx  custom.scss  admin/importMap.js  admin/[[...segments]]/page.tsx  admin/[[...segments]]/not-found.tsx
    api/[...slug]/route.ts
cms/
  access/roles.ts                                         isAdmin · isEditor · isStaff · isAdminField · isEditorField · isStaffField · self · systemOnly · publishedOrEditor
  fields/  encryptedText.ts  money.ts  slug.ts  seo.ts  link.ts  headingLines.ts  cta.ts  brandCopyLink.ts
  collections/
    system/   Users.ts  Media.ts  SettingsAudit.ts  index.ts
    content/  Pages.ts Experiences.ts Sessions.ts SessionInventory.ts Venues.ts Programmes.ts Policies.ts Faqs.ts Passes.ts
              Testimonials.ts Vibes.ts Redirects.ts index.ts
    commerce/ Customers.ts Orders.ts SeatHolds.ts Payments.ts PaymentEvents.ts Refunds.ts Invoices.ts InvoiceFiles.ts
              InvoiceCounters.ts Tickets.ts PassPurchases.ts PromoCodes.ts Waitlist.ts index.ts
    comms/    EmailTemplates.ts NotificationLog.ts index.ts
    inbox/    Enquiries.ts index.ts
    analytics/ AnalyticsEvents.ts AnalyticsDaily.ts index.ts
  globals/  SiteSettings.ts Navigation.ts BrandCopy.ts BookingSettings.ts TemplateCopy.ts SeoDefaults.ts
            PaymentSettings.ts EmailSettings.ts InvoiceSettings.ts NotificationSettings.ts AnalyticsSettings.ts SystemState.ts index.ts
  blocks/   index.ts + one file per block (§E)
  hooks/    revalidate.ts  formatSlug.ts  sessionSlug.ts  slugRedirect.ts  publishGate.ts  mediaGuards.ts
  endpoints/ index.ts (barrel + requireRole)  checkout.ts  payments.ts  email.ts  tickets.ts  enquiries.ts  settings-payments.ts
             settings-email.ts  admin-orders.ts  admin-sessions.ts  users.ts  exports.ts  find-text.ts  revalidate.ts
             (each exports `…Endpoints: Endpoint[]`; Phase 1 creates empty stubs)
  jobs/     index.ts  tasks/*.ts  workflows/finalizeOrder.ts  collectionOverrides.ts
  lib/      contracts.ts (§O) publicUrl.ts crypto.ts signing.ts rateLimit.ts money.ts reference.ts mediaReferences.ts redirects.ts
            mamo/{types,client,mock,index}.ts  orders.ts orderState.ts inventory.ts pricing.ts invoiceNumber.ts waitlist.ts
            tickets.ts mailer.ts templates.ts notifyStaff.ts analytics.ts analyticsQueries.ts exports.ts
            pdf/{invoice,ticket,fonts}.ts
  email/layout.ts                                         HTML shell for every email
  pdf/fonts/Inter-Regular.ttf Inter-Bold.ttf              bundled fallback only; brand fonts come from invoice-settings.pdfFonts (media)
  components/ SecretField.tsx VerifyButton.tsx
              fields/{BrandCopyLink,ModeField,CoordinatesField}.tsx
              settings/{PaymentActions,EmailActions,MockBanner,TicketPreview}.tsx
              sessions/{SessionQuickStats,SessionActions,AttendeeList,RepeatDialog}.tsx
              orders/{OrderActions,RefundDialog,CreateBookingDialog,MoveOrderDialog}.tsx
              users/SendLoginLink.tsx  notifications/ResendButton.tsx  jobs/RetryButton.tsx  inbox/ReplyByEmail.tsx
              checkin/{Scanner,Verdict}.tsx  analytics/{Charts,KpiTiles,ExportCsv}.tsx
              admin/{Logo,Icon,Dashboard,Warnings,CommandPalette,NavLinks,FocusListener}.tsx
              email/{SendTestEmail,TemplatePreview,TemplateVariables}.tsx
  views/    checkIn.tsx  analytics.tsx
  seed/     index.ts defaults.ts media.ts content.ts pages.ts globals.ts emailTemplates.ts strings/*.ts
  scripts/  reseal.ts  reset-password.ts
lib/
  cms/      payload.ts (getPayload singleton)  cache.ts (unstable_cache wrappers + tags)  mappers.ts (Payload doc → site types)  draft.ts  redirects.ts
  *.ts      existing modules keep their exported names and types; bodies call lib/cms (§G)
components/
  blocks/   BlockRenderer.tsx + one renderer adapter per block (§E)
  booking/  existing booking components + WaitlistForm.tsx
  cms/      LivePreviewListener.tsx  ClickToEdit.tsx  SeatsLive.tsx  AnalyticsBeacon.tsx  ExternalAnalytics.tsx  ConsentBanner.tsx
migrations/                                                 payload migrate:create output, committed
media/  private/                                            gitignored, on the persistent disk, backed up
payload.config.ts  instrumentation.ts  payload-types.ts (generated, committed)
tests/  e2e/  vitest.config.ts  playwright.config.ts
docker-compose.dev.yml  Dockerfile (runtime-only)  docker-compose.yml  scripts/{deploy.sh,preflight-db.mjs,ci.sh}
docs/cms-runbook.md  docs/owner-checklist.md
```

### A.4 Core config — **Phase 5 end state** (not a Phase 1 target; see the key-ownership table below)

`package.json` delta: `"type": "module"` (required, or the Payload CLI dies with `ERR_REQUIRE_ASYNC_MODULE`); scripts `generate:types`, `generate:importmap`, `payload`, `migrate`, `seed`, `test`, `test:e2e`, `preflight:db`.

`tsconfig.json` delta: `"paths": { "@/*": ["./*"], "@payload-config": ["./payload.config.ts"] }`.

`next.config.ts`:

```ts
import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const NO_REFERRER_ROUTES = ["/checkout", "/payment-success", "/my-bookings", "/booking-status"];

const nextConfig: NextConfig = {
  output: "standalone",                       // self-hosted; harmless on Vercel
  poweredByHeader: false,
  serverExternalPackages: ["pdfkit"],         // pdfkit reads font files from disk
  async redirects() {
    return [                                  // legacy only; editorial redirects live in the `redirects` collection (§D.2)
      { source: "/workshops", destination: "/events", permanent: true },
      { source: "/workshops/:slug", destination: "/events/:slug", permanent: true },
      { source: "/workshops/:slug/book", destination: "/events/:slug/book", permanent: true },
    ];
  },
  async rewrites() {
    return [{ source: "/.well-known/apple-developer-merchantid-domain-association", destination: "/api/site/apple-domain-association" }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: [{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }] },
      ...NO_REFERRER_ROUTES.map((source) => ({ source, headers: [{ key: "Referrer-Policy", value: "no-referrer" }] })),
    ];
  },
};
export default withPayload(nextConfig);
```

`payload.config.ts` — **end state after Phase 5.** Each key is introduced by exactly the agent named in the ownership table that follows; an agent never edits a key it does not own.

```ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { seoPlugin } from "@payloadcms/plugin-seo";
import sharp from "sharp";

import { systemCollections } from "@/cms/collections/system";
import { contentCollections } from "@/cms/collections/content";
import { commerceCollections } from "@/cms/collections/commerce";
import { commsCollections } from "@/cms/collections/comms";
import { inboxCollections } from "@/cms/collections/inbox";
import { analyticsCollections } from "@/cms/collections/analytics";
import { globals } from "@/cms/globals";
import { endpoints } from "@/cms/endpoints";
import { jobsConfig } from "@/cms/jobs";
import { runtimeEmailAdapter } from "@/cms/lib/mailer";                 // P3 3C
import { livePreviewUrl, publicUrl, routeFor } from "@/cms/lib/publicUrl";
import { seedDefaults } from "@/cms/seed/defaults";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const isBuild = process.env.NEXT_PHASE === "phase-production-build";
const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
if (isProd && !isBuild && !serverUrl) throw new Error("NEXT_PUBLIC_SERVER_URL is required in production (CSRF allowlist)");

// DB TLS: explicit in production. `sslmode=disable` is honoured only for private hosts (scripts/preflight-db.mjs enforces).
const dbUrl = new URL(process.env.DATABASE_URL || "postgres://localhost/placeholder");
const sslmode = dbUrl.searchParams.get("sslmode");
const sslrootcert = dbUrl.searchParams.get("sslrootcert");
const ssl = sslmode === "disable" ? false
  : isProd ? { rejectUnauthorized: true, ...(sslrootcert ? { ca: fs.readFileSync(sslrootcert, "utf8") } : {}) }
  : undefined;                                                            // dev: whatever the URL says (local Docker, no TLS)

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || "",
  // serverURL intentionally unset: same-origin uploads stay relative (no remotePatterns needed).
  csrf: [serverUrl, ...(isProd ? [] : ["http://localhost:3000", "http://127.0.0.1:3000"])].filter(Boolean) as string[],
  cors: [],                                                                // no cross-origin REST consumers
  admin: {
    user: "users",
    theme: "light",
    avatar: "default",
    dateFormat: "d MMM yyyy, HH:mm",
    timezones: { defaultTimezone: "Asia/Dubai", supportedTimezones: [{ label: "Dubai (GST)", value: "Asia/Dubai" }] },
    meta: { titleSuffix: " · Maison Palettia", icons: [{ url: "/favicon.ico" }] },
    importMap: { baseDir: dirname },
    components: {
      graphics: { Logo: "@/cms/components/admin/Logo#Logo", Icon: "@/cms/components/admin/Icon#Icon" },        // P1 1A
      providers: ["@/cms/components/settings/MockBanner#MockBanner",                                              // P1 1A (after 1C)
                  "@/cms/components/admin/FocusListener#FocusListener"],                                           // P2 2D
      afterNavLinks: ["@/cms/components/admin/NavLinks#NavLinks"],                                                // P3 3E
      beforeDashboard: ["@/cms/components/admin/Warnings#Warnings", "@/cms/components/admin/Dashboard#Dashboard"],// P4 4B
      beforeNavLinks: ["@/cms/components/admin/CommandPalette#CommandPalette"],                                   // P4 4B
      views: {
        checkIn: { Component: "@/cms/views/checkIn#CheckInView", path: "/check-in", exact: true },                // P3 3E
        analytics: { Component: "@/cms/views/analytics#AnalyticsView", path: "/analytics", exact: true },         // P4 4C
      },
    },
    livePreview: {                                                                                                // P2 2A
      url: livePreviewUrl,
      collections: ["pages", "experiences", "sessions", "programmes", "policies"],
      globals: ["site-settings", "navigation", "brand-copy"],
      breakpoints: [
        { label: "Phone", name: "phone", width: 390, height: 844 },
        { label: "Tablet", name: "tablet", width: 820, height: 1180 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
    },
  },
  collections: [...systemCollections, ...contentCollections, ...commerceCollections, ...commsCollections, ...inboxCollections, ...analyticsCollections],
  globals,
  endpoints,
  jobs: jobsConfig,
  email: runtimeEmailAdapter,                                                                                     // P3 3C
  editor: lexicalEditor(),
  plugins: [                                                                                                      // P2 2A
    seoPlugin({
      collections: ["pages", "experiences", "sessions", "programmes", "policies"],
      uploadsCollection: "media",
      tabbedUI: true,
      generateTitle: ({ doc }) => doc?.title ?? doc?.name ?? "",
      generateDescription: ({ doc }) => doc?.excerpt ?? doc?.description ?? doc?.summary ?? "",
      generateURL: async ({ doc, collectionSlug, req }) => `${await publicUrl(req)}${routeFor(collectionSlug, doc)}`,
    }),
  ],
  graphQL: { disable: true },
  defaultDepth: 1,
  maxDepth: 4,
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || "", max: isBuild ? 2 : 10, ssl },
    push: false,                                       // the only remote DB is production; schema changes go through migrations
    migrationDir: path.resolve(dirname, "migrations"),
    idType: "uuid",
  }),
  sharp,
  upload: { limits: { fileSize: 25 * 1024 * 1024 } },
  onInit: seedDefaults,                                // idempotent, build-guarded, advisory-locked (§F.0)
});
```

**`payload.config.ts` key ownership by phase** (the only agents allowed to touch the file, and which keys):

| Phase · agent | Keys it adds/edits | Notes |
|---|---|---|
| P1 · 1A `cms-core` | the whole file as a skeleton: `secret`, `csrf`, `cors`, `admin.{user,theme,avatar,dateFormat,timezones,meta,importMap}`, `admin.components.graphics`, `collections` (barrels), `globals` (barrel), `endpoints` (stub barrel), `jobs` (stub: `autoRun`, `shouldAutoRun`, `enableConcurrencyControl: true`, `access`, no tasks), `editor`, `graphQL`, `defaultDepth`, `maxDepth`, `typescript`, `db` (incl. `ssl`, `pool.max`), `sharp`, `upload`, `onInit` | `admin.components.providers: [MockBanner]` is added in 1A's **final step, after 1C's PR has merged** (the file must exist before `generate:importmap`). No `email`, no `plugins`, no `livePreview`, no views in Phase 1. |
| P2 · 2A `content-collections` | `plugins` (seoPlugin), `admin.livePreview` | `routeFor` and `publicUrl` already exist from 1A (`cms/lib/publicUrl.ts`). |
| P2 · 2D `page-builder-and-routes` | appends `FocusListener` to `admin.components.providers` | one-line edit |
| P3 · 3C `email-and-pdf` | `email: runtimeEmailAdapter` | |
| P3 · 3E `tickets-and-checkin` | `admin.components.views.checkIn`, `admin.components.afterNavLinks` | |
| P3 · 3A, 3B, 3D, 3F, 3G | **none** | collections/endpoints/jobs reach the config through their barrels |
| P4 · 4B `admin-ux` | `admin.components.beforeDashboard`, `admin.components.beforeNavLinks` | |
| P4 · 4C `analytics-view` | `admin.components.views.analytics` | |
| P5 · all | none | 5B may only read it to write docs |

`cms/lib/publicUrl.ts` (1A) exports: `publicUrl(req?)` (async: `site-settings.publicUrl` → `NEXT_PUBLIC_SERVER_URL` → `""`), `publicUrlSync(req)` (uses the cached last-read value; for hook code paths), `livePreviewUrl`, `previewUrl`, `isPlaceholderPublicUrl(req)` (true until an admin has saved Site details at least once — `system-state.publicUrlConfirmedAt`, stamped by the `site-settings` `afterChange` when `req.user` is set), and `routeFor(collectionSlug, doc)`:

```ts
export function routeFor(collectionSlug: string, doc: { slug?: string } | null | undefined): string {
  const slug = doc?.slug ?? "";
  switch (collectionSlug) {
    case "pages":       return slug === "home" ? "/" : `/${slug}`;
    case "experiences":
    case "sessions":    return `/events/${slug}`;
    case "programmes":  return `/private-events/${slug}`;
    case "policies":    return `/policies/${slug}`;
    default:            return "/";
  }
}
```

`instrumentation.ts` (root):

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;   // never start crons during `next build`
  const { getPayload } = await import("payload");
  const { default: config } = await import("@payload-config");
  await getPayload({ config, cron: true });
}
```

`app/(payload)/layout.tsx`, `admin/[[...segments]]/{page,not-found}.tsx`, `api/[...slug]/route.ts`: byte-for-byte the create-payload-app 3.90.2 template (copies in the spike tree), double quotes to match repo style.

### A.5 Deployment target, the database gate, and the Vercel delta

**Self-hosted (target):** one `next start`/standalone process (systemd unit or pm2) behind the owner's reverse proxy. The proxy terminates TLS, **appends** `X-Forwarded-For` (the app reads the **last** hop it appended — `cms/lib/rateLimit.ts::clientIp()` — never the first), and rate-limits `/api/users/login`, `/api/users/forgot-password`, `/api/users/first-register` at 10 req/min/IP (Payload 3 has no `rateLimit` config — verified absent from `config/types.d.ts`; `maxLoginAttempts` is per account and would otherwise be a lockout-DoS lever). cwd = repo root (so `media/`, `private/`, `migrations/` resolve). Volumes: `media/`, `private/`, `.env`. Backups: nightly `pg_dump` + `media/` + `private/`. Node 22 LTS. One process ⇒ Next's default revalidation cache is correct; scaling to several processes needs `cacheHandlers` (Next self-hosting guide) and `shouldAutoRun` pinned to one worker.

**Database gate (hard precondition of the first production migration and of every `scripts/deploy.sh` run).** The spike proved the production DB is reached in plaintext (`pg_stat_ssl.ssl = false`) as the `postgres` superuser. Before Phase 5's first write:

1. Nexeor creates role `maison_palettia_app` (`LOGIN`, owner of `maison_palettia_prod`, **no** `SUPERUSER`/`CREATEDB`/`CREATEROLE`) and either (a) enables TLS on the Postgres container with a server certificate whose CA is copied to `/etc/ssl/nexeor-pg.crt` on the app host, or (b) puts app and DB on the same private Docker network and firewalls port 5433 from the internet.
2. `DATABASE_URL` is `postgres://maison_palettia_app:…@host:5433/maison_palettia_prod?sslmode=verify-full&sslrootcert=/etc/ssl/nexeor-pg.crt` for (a), or `…?sslmode=disable` for (b) **only** when the host is a private address (RFC 1918 / Docker service name). Verified: `pg-connection-string` 2.14.1 loads `sslrootcert` into `ssl.ca`; `sslmode=require` is treated as an alias of `verify-full` with a deprecation warning, so `verify-full` is written explicitly. `payload.config.ts` sets `pool.ssl` explicitly in production (§A.4).
3. `scripts/preflight-db.mjs` (run by `scripts/deploy.sh` before `payload migrate`, and by `npm run preflight:db`) connects with `DATABASE_URL` and aborts the deploy when any of these fail: `select ssl from pg_stat_ssl where pid = pg_backend_pid()` is `false` while the host is not private; `select rolsuper, rolcreatedb from pg_roles where rolname = current_user` has either `true`; `select current_database()` ≠ `maison_palettia_prod` in production; `select count(*) from pg_extension where extname = 'postgis'` is irrelevant because **the schema never requires PostGIS** (§D.2 `venues.coordinates` is a `group`, never `type: "point"` — in `@payloadcms/drizzle` 3.90.2 a `point` field flags `extensions.postgis` and runs `CREATE EXTENSION IF NOT EXISTS "postgis"` on every connect, which the `postgres:16-alpine` host cannot satisfy and a non-superuser role cannot run).
4. Recorded in §L Phase 1 preconditions (so Nexeor's work is scheduled early), §M.7 and `docs/owner-checklist.md`.

**Build and deploy choreography.** `next build` prerenders with the Local API, so it needs a reachable, already-migrated database — the production one, on the host. Deploy order **every time**: `npm ci` → `node scripts/preflight-db.mjs` → `npx payload migrate` → `next build` → restart → `scripts/deploy.sh` POSTs the signed `/api/site/revalidate` with `{ paths: ["/"], layout: true }` (so no prerendered page can outlive the deploy). Because the old process keeps serving while the new schema is applied, **migrations must be additive and backward-compatible within one release** (add columns/tables/indexes; drop in the following release) — a rule in `docs/cms-runbook.md` and a Phase 5 reviewer check. During `next build`: `pool.max` is 2, `instrumentation.ts` does not start crons, `seedDefaults` returns early (§F.0), and prerender workers only read. The `Dockerfile` is **runtime-only** (COPY of the host-built `.next/standalone` + `public` + `.next/static`); there is no `next build` inside `docker build` (it would need `DATABASE_URL` and network access to the shared DB from the build context).

**If moved to Vercel:** `media/`/`private/` → `@payloadcms/storage-s3@3.90.2`; build command `payload migrate && next build`; `pool.max: 2`; **`autoRun` crons must go** — Vercel Cron hits `GET /api/payload-jobs/run?queue=…` and that needs one extra env var `CRON_SECRET` (the only place the env rule bends, and only on Vercel); analytics buffer becomes direct inserts; revalidation propagates through Vercel's shared cache; `output: standalone` is harmless; the DB gate still applies (Vercel → Nexeor Postgres is over the internet, so TLS `verify-full` is mandatory there).

---
## B. Packages (exact versions, verified 2026-10-09)

| Package | Version | Role |
|---|---|---|
| `next` | **16.3.4** (pinned) | peer `>=16.3.3 <17` |
| `react`, `react-dom` | 19.2.8 | unchanged |
| `payload` | 3.90.2 | CMS, auth, jobs |
| `@payloadcms/next` | 3.90.2 | in-app admin/REST (brings `@payloadcms/ui`, `sass 1.77.4`) |
| `@payloadcms/db-postgres` | 3.90.2 | pg 8.20, drizzle-orm 0.45.2, pg-connection-string 2.14.1 |
| `@payloadcms/richtext-lexical` | 3.90.2 | editor |
| `@payloadcms/plugin-seo` | 3.90.2 | SEO tab (`meta.title/description/image`) |
| `@payloadcms/live-preview-react` | 3.90.2 | `RefreshRouteOnSave` |
| `graphql` | ^16.14.2 (**not 17**) | hard peer dep |
| `sharp` | ^0.35.5 | image sizes |
| `pdfkit` | 0.20.2 | invoice + ticket PDFs (`serverExternalPackages`) |
| `qrcode` | 1.5.4 | QR PNG |
| `nodemailer` | 10.0.16 | SMTP transport (used directly; `@payloadcms/email-nodemailer` is config-time only, not used) |
| `resend` | 6.32.1 | optional provider |
| `bowser` | 2.14.1 | device/browser classification (MIT; `ua-parser-js` 2.x is AGPL — not used) |
| `@yudiel/react-qr-scanner` | 2.6.0 | camera scanning in `/admin/check-in` |
| `zod` | ^4.6.5 | endpoint payload validation |
| dev: `vitest` 5.0.3, `@playwright/test` 1.64.0, `@types/pdfkit`, `@types/qrcode`, `@types/nodemailer` (latest) | | tests |

Install: `npm install payload@3.90.2 @payloadcms/next@3.90.2 @payloadcms/db-postgres@3.90.2 @payloadcms/richtext-lexical@3.90.2 @payloadcms/plugin-seo@3.90.2 @payloadcms/live-preview-react@3.90.2 graphql@^16.14.2 sharp@^0.35.5 pdfkit@0.20.2 qrcode@1.5.4 nodemailer@10.0.16 resend@6.32.1 bowser@2.14.1 @yudiel/react-qr-scanner@2.6.0 zod@^4.6.5` and the dev deps. **Never** install `@payloadcms/db-sqlite` in the repo (spike only).

Not chosen: `@react-pdf/renderer` (second React renderer), `html5-qrcode` (unmaintained), `ua-parser-js` (AGPL), `@payloadcms/plugin-search` (our ⌘K palette queries REST directly), `@payloadcms/plugin-redirects` (replaced by our own small `redirects` collection + `lib/cms/redirects.ts`, §D.2 — the plugin assumes a `proxy.ts`/middleware lookup we do not want in v1), `@payloadcms/plugin-import-export` (still marked beta, adds an `exports` collection and a job; our CSV needs are a date range + VAT columns, served by one streaming endpoint, §H.12).

---

## C. Environment policy and admin-configurable settings

### C.1 `.env` — exactly three keys

| Key | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | server `.env`; laptops `.env.local` → local Docker Postgres | Postgres connection, **with `?sslmode=verify-full&sslrootcert=…`** in production (§A.5 gate) |
| `PAYLOAD_SECRET` | server `.env` (`openssl rand -hex 32`); laptops `.env.local` (any dev value) | Payload auth + HKDF root for derived keys (secrets at rest, magic links, session cookie, return/PDF signatures, analytics salt, revalidate token). **Not** used for ticket QR verification (§H.7 — tickets are verified by DB lookup, so a rotation never invalidates printed tickets). |
| `NEXT_PUBLIC_SERVER_URL` | server `.env` — **required in production**, optional in dev | (1) the CSRF allowlist (`csrf: [NEXT_PUBLIC_SERVER_URL]`, §A.4) — without it Payload accepts the `payload-token` cookie from any `Origin` (verified `auth/extractJWT.js`: when `config.csrf.length === 0` the cookie is always accepted); (2) fallback for `metadataBase`, live-preview URL, `generateURL` and the forgot-password link **before** `site-settings.publicUrl` has been saved; (3) the CLI (no DB in scope). At runtime `site-settings.publicUrl` wins whenever set. |

Rules: `NODE_ENV` is set by the process manager, `PAYLOAD_MIGRATING`/`NEXT_RUNTIME`/`NEXT_PHASE` by the tools. `NEXT_PUBLIC_WHATSAPP_NUMBER` is **removed** (→ `site-settings.contact.whatsappNumber`, no rebuild). `.env.example` lists only the three keys. Developers put the local DB in `.env.local` (gitignored by `.env*`; both Next and the Payload CLI load it via `@next/env`) and **never point a laptop at production** — `push: false` makes that safe even if they do. `docker-compose.dev.yml` provides `postgres:16-alpine` on `localhost:5434` (no PostGIS needed, ever).

**`process.env` allowlist** (the §K grep gate): `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `NODE_ENV`, `NEXT_RUNTIME`, `NEXT_PHASE`, `PAYLOAD_MIGRATING`, `PORT` and `HOSTNAME` (set by Next/the process manager; read only by the signed loopback revalidate call, §G.4), `OLD_PAYLOAD_SECRET` (only inside `cms/scripts/reseal.ts`), `CRON_SECRET` (only inside a file guarded by a Vercel check — not present in v1).

**Rotating `PAYLOAD_SECRET`.** Run `OLD_PAYLOAD_SECRET=<old> npx payload run cms/scripts/reseal.ts` **before** restarting with the new secret; the script re-encrypts every `encryptedText` value in place, reads the old secret only from `OLD_PAYLOAD_SECRET` or an interactive stdin prompt and **refuses an argv secret** (shell history, `ps`). If the secret is rotated without resealing, the boot canary (§C.3 `system-state`) fails to decrypt and the admin shows a red banner on every page — "Encrypted settings cannot be read — the server secret changed. Ask Nexeor to run the reseal script, or re-enter the keys below (Replace)" — and admins can simply re-enter each key. Consequences of a rotation (documented in `docs/cms-runbook.md`): encrypted settings (reseal or re-enter), outstanding `k` return-page links and `sig` PDF links (≤ 24 h / ≤ 30 d; customers use "my bookings"), magic links (30 min), staff sessions (re-login), `mp_session` cookies. Ticket QR codes are unaffected.

### C.2 Secret storage — `encryptedText()` (cms/fields/encryptedText.ts)

AES-256-GCM; key = `hkdfSync("sha256", PAYLOAD_SECRET, "maison-palettia", "secrets-v1", 32)`; 12-byte random IV; stored `enc:v1:<base64url(iv‖tag‖ct)>`. Exported constant `MASK = "••••••••"` (exact; the "set on <date>" text comes from the sibling `…SetAt` date field, never from the value). Payload's built-in `payload.encrypt` (AES-CTR, unauthenticated) is not used.

**Stored value and displayed value are kept separate** — the hooks are:

```ts
// field afterRead
({ value, req }) => !value ? null
  : (req?.context?.revealSecrets === true || req?.context?.internalRead === true) ? open(value) : MASK;

// field beforeChange — `previousValue` MUST NOT be used (see below)
async ({ value, req, path, global, collection, originalDoc, siblingData }) => {
  const setAt = `${String(path.at(-1))}SetAt`;
  if (value === null) { siblingData[setAt] = null; return null; }                       // SecretField "Clear" sends null
  if (value === "" || value === MASK) return await readStoredRaw(req, { global, collection, originalDoc, path }); // untouched
  if (typeof value === "string" && value.startsWith("enc:v1:")) return value;        // already sealed (reseal/import)
  siblingData[setAt] = new Date().toISOString();
  return seal(String(value));
};
```

`readStoredRaw` reads the **database adapter layer**, which returns the ciphertext untouched: for globals `const raw = await req.payload.db.findGlobal({ slug: global.slug, req })`, for collections `req.payload.db.findOne({ collection: collection.slug, where: { id: { equals: originalDoc.id } }, req })`, then `getByPath(raw, path)`. Reason (verified in 3.90.2): `globals/operations/update.js:117` runs `afterRead` on the stored document with the request's own context **before** field `beforeChange` hooks, and `fields/hooks/beforeChange/promise.js:73` sets `previousValue` from that output — so with `revealSecrets` unset, `previousValue` is the mask and the naive "keep previousValue" rule would overwrite the Mamo key with `••••••••` on the next unrelated save of the global (e.g. toggling `checkout.enableTabby`). Collections pass raw `docWithLocales` as `originalDoc`, so the bug is global-specific, which is exactly where every secret lives.

Field-level `access: { read, create, update: isAdminField }`. Custom UI `SecretField` (masked, **Replace** → text input, **Clear** → sends `null`, optional **Verify**); it never receives clear text. Server call sites that reveal (`context: { internalRead: true }` via `payload.findGlobal({ overrideAccess: true, … })`): `cms/lib/mamo/index.ts`, `cms/lib/mailer.ts`, the two verify endpoints, `cms/scripts/reseal.ts`, the boot canary — nothing else. Unit tests cover the four `beforeChange` branches; an integration test saves `payment-settings` as admin with `test.apiKey` untouched and asserts the stored ciphertext is **byte-identical** and "Test connection" still succeeds (§K).

### C.3 Settings globals — every field

**Admin grouping and labels (plain names, deliberate order, one-line `admin.description` each):**

| Group | Order · global slug | Label | Description shown in the admin |
|---|---|---|---|
| **Settings** (editor + admin) | 1 `site-settings` | Site details | Name, logos, contact details, social links, newsletter. Advanced section is admin-only. |
| | 2 `navigation` | Menus & footer | One list feeds the desktop bar, mobile bar, mobile sheet and footer. |
| | 3 `brand-copy` | Brand wording | Sentences reused across pages (tagline, story, find-us line). Edit once, changes everywhere. |
| | 4 `booking-settings` | Booking & checkout wording | What a booking says, status wording, checkout/basket labels, ticket PDF text. Bookings open/closed switch is admin-only. |
| | 5 `template-copy` | Page labels (events, policies, 404) | Fixed labels on event, programme and policy pages and the 404 page. |
| | 6 `seo-defaults` | Search & sharing defaults | Title template, default share image, robots rules. |
| **Settings (admin)** (admin only) | 7 `payment-settings` | Payments (Mamo Pay) | Test/Live keys, webhook, checkout options. |
| | 8 `email-settings` | Email sending | How emails leave the server (SMTP or Resend). The message texts live under **Emails → Templates**. |
| | 9 `invoice-settings` | Invoices & VAT | Legal name, TRN, VAT rate, numbering, PDF logo and fonts. |
| | 10 `notification-settings` | Who gets notified | Which staff email receives which alert. |
| | 11 `analytics-settings` | Analytics & tracking | First-party panel, optional GA4/Plausible/Umami/Meta, cookie consent. |
| hidden | `system-state` | — | canary, install/seed stamps, digest stamp (`admin.hidden: true`; read/update `systemOnly`) |

Access: the six content globals `read: anyone, update: isEditor` **with field-level `access.update: isAdminField` on the fields marked 🔒 below**; the five admin globals `read/update: isAdmin`. `★` = `encryptedText`. Each global's `afterChange` runs the revalidation listed in §G.4; the admin globals additionally drop cached transports/clients; the watched fields marked 📝 append a `settings-audit` row (§D.1) and the ones marked 📣 also `notifyStaff("settings_changed")` to admins.

**`site-settings`** — §01 §3.1 verbatim (`name`, `legalName`, `tagline`, `logoOnDark` + auto `ink` bbox via sharp `afterChange`, `logoOnLight`, `monogram`, `contact.{addressLines[], email, phone, whatsappNumber, whatsappGreeting, hours[]}`, `socials[]`, `newsletter.{enabled,actionUrl,fieldName,heading,description,cta}`), **minus** `favicon/appleIcon/icon512` (removed: `/favicon.ico`, `/icon.png`, `/apple-icon.png` are static files in `app/`; an upload field would do nothing — the admin description of the logo group says "Browser-tab icons are set by Nexeor"), **plus** a collapsible group **Advanced (admin only)** (`admin.condition: ({}, _, { user }) => user?.role === "admin"`, every field 🔒):

| Field | Type | Help text / validation |
|---|---|---|
| `publicUrl` 🔒📝📣 | text required | "The site's address, e.g. https://www.maisonpalettia.com. Changing it changes every canonical, sitemap URL, email link and Mamo Pay return URL, and the webhook must be re-registered." validate `^https://[a-z0-9.-]+(:\d+)?$` (no path, no trailing slash). **Outside production only**, `http://localhost|127.0.0.1[:port]` is also accepted — the same `isAcceptablePublicUrl` rule gates `isPlaceholderPublicUrl()`, so the §K E2E run can open bookings against the mock gateway on the dev origin; Mode → Live keeps the https-only rule (decided in the Phase 1 review). |
| `locale` 🔒 | select `en-AE` | |
| `heroTheme.{darkRoutes[],lightRoutes[]}` 🔒 | arrays | header colour per route |
| `enquiriesEnabled` 🔒📝 | checkbox default true | "Off hides the contact and private-event forms. Enquiries already received stay in the Inbox." |
| `jobsEnabled` 🔒📝📣 | checkbox default true | "Background tasks: confirmation emails, seat-hold expiry, payment checks, reminders. Turn off only when Nexeor asks you to." (`shouldAutoRun` reads it; dashboard warning when false) |
| `allowAiImagery` 🔒📝 | checkbox default false | "Allow pictures marked AI-generated or Unknown origin in hero and card slots." (publish gate, §D.2) |

**`navigation`**, **`brand-copy`**, **`seo-defaults`**: fields exactly as `01-content-inventory.md` §3.2, §3.3, §3.9 (`seo-defaults.shareImage` is the default `meta.image` for plugin-seo).

**`booking-settings`** — §01 §3.4 with these changes (everything else verbatim: `passCodeCopy.*`, `statusCopy[*]`, `purchaseConfirmedNote`, `checkout.*`, `bookStep.*`, `confirmation.*`, `status.*`, `cart.*`, `basketLinkLabel`, `eventPage.*`, `labels.*`, `utilityBars`):

| Field | Type | Notes |
|---|---|---|
| `bookingsOpen` 🔒📝📣 | checkbox default **false** | **replaces `mode`** (the `request`/`recorded` modes are dropped — §N). "On: Book buttons go to checkout and Mamo Pay. Off: Book buttons show the message below and link to the contact page; staff can still create bookings at the desk." **Validation when switching on** (server-side, in order; the first failure is the message): (1) `email-settings.provider !== "log-only"` and `email-settings.lastVerify.ok === true` → else "Set up Email first so customers receive their tickets (Settings → Email sending → Verify)"; (2) `payment-settings` has a key for the active mode and `lastConnectionCheck.ok === true` (mock counts outside production) → else "Set up Payments first (Settings → Payments → Test connection)"; (3) `site-settings.publicUrl` is https and not the seed placeholder → else "Set the site address first (Settings → Site details → Advanced)"; (4) the active mode's webhook is registered and `webhookUrl` starts with the current `publicUrl` → else "Register the Mamo webhook first (Settings → Payments)". |
| `closedMessage` | text ≤120, default "Online bookings open soon." | shown on every Book button/bar while closed |
| `closedCtaLabel` · `closedCtaLink` | text ≤30 default "Enquire" · `link()` default `/contact` | |
| `bookingTerms` | textarea ≤240 | **replaces `terms.request/recorded/paid`** — the single "What a booking is" sentence (printed under Confirm, on the confirmation page, and as the FAQ answer where `faqs.answerSource = bookingTerms`). Seed: the current `BOOKING_TERMS.paid` text. |
| `referencePrefix` 🔒 | text validate `^[A-Z]{2,4}-?$`, default `MP-` | |
| `lowSeatThreshold` | number 1–20 default 4 | the **only** "few seats left" threshold: site labels **and** the `low_seats` staff alert read it |
| `ticket.heading` text ≤60 ("Show this at the table.") · `ticket.instructions` textarea ≤300 | | printed on the ticket PDF (**moved here from `email-settings`**); `ui` field **Preview ticket PDF** (`TicketPreview`, renders a sample ticket with the unsaved values via `POST /api/actions/tickets/preview`) |
| `passCodeCopy.label` | text default **"Pass or promo code"** | (was "Pass code") |

**`template-copy`** (new; the fixed-template routes' static labels, grouped): `eventDetail.*` (breadcrumb root, fact terms When/Where/Price/per person/How it runs/Status, `aboutHeading`, `locationHeadingScheduled`, `locationHeadingDiy`, `directionsNote`, `moreEventsHeading`, `soloEyebrow`, `soloCta`, `upcomingDatesHeading`, `waitlistHeading`, `waitlistBody`, `waitlistCta`, `waitlistSuccess`), `programmeDetail.*` (eyebrow, activities heading/lead, steps eyebrow, cta labels), `policyDetail.*` (eyebrow "Policy", back label, close heading/body/cta), `notFound.{heading, body, cta}`, `eventsBrowser.*` (filter labels, empty states, "Clear all filters", door mode labels — see §E `eventsBrowser`).

**`payment-settings`** — label "Payments (Mamo Pay)"; `admin.components.elements.beforeDocumentControls: ["@/cms/components/settings/PaymentActions#PaymentActions"]` (globals use `elements.*`, verified `globals/config/types.d.ts:127-131`; collections use `edit.*`). Actions: **Test connection** · **Register/Update webhook** · **Rotate webhook secret** · **List Mamo webhooks** · **Send AED 2 test order** (sandbox only). All test the **unsaved** form values (`useAllFormFields`); a masked secret means "use the stored one".

| Field | Type | Label / help / validation |
|---|---|---|
| **Group "Mode"** (first on the page) | | |
| `mode` 🔒📝📣 | radio `test \| live` (+ `mock` only when `admin.condition: () => process.env.NODE_ENV !== "production"`), default `test`, required; custom `ModeField` | "**Test**: Mamo sandbox, no real charges. **Live**: real payments." Switching to **Live** opens a confirm dialog listing the checks it runs: live key saved and verified (`live.lastConnectionCheck.ok`), live webhook registered to the current `publicUrl`, `publicUrl` is https — any failure blocks the switch with the failing line. `mock` rejected when `NODE_ENV=production` (validate). |
| `provider` | select `[mamo]` readOnly | |
| **Group "Sandbox credentials"** | | |
| `test.apiKey` ★ · `test.apiKeySetAt` date RO | | Sandbox API key (Dashboard → Developer → Keys) |
| `test.webhookAuthHeader` ★ RO · `test.previousWebhookAuthHeader` ★ hidden · `test.previousValidUntil` date hidden | | generated by Register/Rotate; 10-min grace for the previous one |
| **Group "Live credentials"** | `live.*` same fields | |
| **Group "Checkout options"** | | |
| `checkout.linkType` select `standalone \| inline` default `standalone` · `checkout.paymentMethods` select hasMany `card, wallet` default both · `checkout.enableTabby` checkbox false · `checkout.sendMamoReceipt` checkbox false · `checkout.requireTerms` checkbox true · `checkout.holdMinutes` number 5–60 default **15** · `checkout.titlePrefix` text ≤30 default "Maison Palettia" · `checkout.captureNote` text ≤200 | | as revision 1 |
| **Group "Automatic checks"** | | |
| `reconciliation.enabled` checkbox true · `reconciliation.everyMinutes` number 1–60 default 5 · `reconciliation.lastRunAt` date RO · `reconciliation.lastRunSummary` json RO | | the poller runs every minute and acts when `now − lastRunAt ≥ everyMinutes` (crons are fixed at build time — §H.9) |
| **Group "Apple Pay domain file"** | | |
| `appleDomainAssociation` | textarea ≤4 KB, admin only | served as `text/plain` at `/.well-known/apple-developer-merchantid-domain-association` via `/api/site/apple-domain-association` (only if Mamo says standalone links need it — **UNVERIFIED**; leave empty otherwise) |
| **Collapsible "Connection details (read-only)"** (`admin.initCollapsed: true`) | | |
| `test.webhookId` · `test.webhookUrl` · `test.webhookRegisteredAt` · `test.lastConnectionCheck` json · `test.observedAuthHeaderName` · `live.*` equivalents | all RO | `webhookUrl` is shown as "Webhook: {url} — registered {date}"; `observedAuthHeaderName` records which request header Mamo actually used on the first verified delivery (**UNVERIFIED** in docs). The dashboard shows a red flag when `webhookUrl` does not start with the current `site-settings.publicUrl` ("Webhook points at an old address — re-register", one-click). |

**Register/Update webhook** (`POST /api/actions/payments/register-webhook`, admin): **refuses** when `site-settings.publicUrl` is unset, not acceptable (https; local http only outside production), or equals the seed placeholder (`isPlaceholderPublicUrl()` — true until an **admin** has saved Site details with `publicUrl` at least once, `system-state.publicUrlConfirmedAt`; an editor's save of wording never stamps it), with the message "Set the real site address in Settings → Site details → Advanced first"; the dialog shows the exact URL that will be registered (`{publicUrl}/api/site/webhooks/mamo`) before confirming; after success the read-only fields show the registered URL and date.

**`email-settings`** — label "Email sending"; `admin.description`: "How messages leave the server. The wording of each message is under Emails → Templates; the text printed on tickets is under Booking & checkout wording." `admin.components.elements.beforeDocumentControls: ["@/cms/components/settings/EmailActions#EmailActions"]` (Verify connection · Send test to…).

| Field | Type | Notes |
|---|---|---|
| `provider` 🔒📝 | select `log-only \| smtp \| resend`, default `log-only` | log-only = nothing leaves the server; every send still logs. **Dashboard banner while log-only**: "Email is not set up — customers will not receive confirmations, tickets or invoices, and staff cannot reset passwords." |
| `fromName` text ≤60 · `fromAddress` email · `replyTo` email · `bcc` email (optional archive) | required when provider ≠ log-only | Sender |
| `smtp.host` text · `smtp.port` number (587) · `smtp.secure` checkbox · `smtp.user` text · `smtp.password` ★ (+`SetAt`) | required when smtp | SMTP |
| `resendApiKey` ★ (+`SetAt`) | required when resend | Resend |
| `lastVerify` json RO `{ ok, at, provider, message }` | | result of Verify; `bookingsOpen` validation reads `ok` |

**`invoice-settings`** — label "Invoices & VAT".

| Field | Type | Notes |
|---|---|---|
| `legalName` text ≤80 | default from `site-settings.legalName` on first save | |
| `tradeLicenceNumber` text · `trn` text validate `/^\d{15}$/` (optional until registered) | | TRN appears on the invoice only when set; without it the PDF is titled "Receipt", with it "Tax Invoice" |
| `vatRateBps` number default 500 · `pricesIncludeVat` checkbox true | | 5 % UAE VAT, inclusive pricing |
| `addressLines` array{line} ≤6 · `issuerEmail` email · `issuerPhone` text | | seller block |
| `invoicePrefix` text default `MP-INV` · `creditNotePrefix` text default `MP-CN` | 🔒 | numbering (gapless per year; §H.7) |
| `footerNote` richText | | refund summary, thanks |
| `logo` upload | defaults to `site-settings.logoOnLight` | |
| `pdfFonts.regular` · `pdfFonts.bold` | upload (media, `font/ttf`/`font/otf`) | brand fonts for invoice and ticket PDFs, loaded by pdfkit from the media path at render time, cached by file hash; **Inter** (bundled in `cms/pdf/fonts/`) is the fallback. No redeploy to change fonts. |

**`notification-settings`** — label "Who gets notified".

| Field | Type |
|---|---|
| `recipients[]` array { `name` text, `email` email, `events` select hasMany `new_order, failed_payment, refund_requested, refund, dispute, new_enquiry, waitlist_joined, job_failed, low_seats, settings_changed, webhook_unverified_spike, daily_digest` } |
| `lowSeatsOverride` number optional — help "Leave blank to use the site threshold (Booking & checkout wording → Few seats left threshold)." |
| `dailyDigest` checkbox · `dailyDigestHour` number 0–23 default 8 (Dubai) |
| `enquiryAutoReply` checkbox (sends `enquiry_received`) |

Dashboard warning when no recipient subscribes to `new_enquiry` ("Nobody is emailed about new enquiries — they still arrive in the Inbox") and when none subscribes to `failed_payment`/`job_failed`.

**`analytics-settings`** — label "Analytics & tracking". Every `external.*` field is `isAdminField`.

| Field | Type / validation |
|---|---|
| `enabled` checkbox true · `respectDoNotTrack` checkbox true · `rawRetentionDays` number default 90 · `excludePaths[]` array{path} — seeded with `/checkout`, `/payment-success`, `/my-bookings`, `/booking-status`, `/dev` (the first-party beacon still skips query/hash everywhere, §D.6) |
| `external.provider` select `none \| ga4 \| plausible \| umami` · `external.measurementId` text validate `^G-[A-Z0-9]{4,16}$` · `external.plausibleDomain` text validate hostname · `external.umamiScriptUrl` text validate https URL whose host ∈ {`analytics.umami.is`, `cloud.umami.is`, host of `site-settings.publicUrl`} · `external.umamiWebsiteId` text validate uuid · `external.metaPixelId` text validate `^\d{5,20}$` (all public ids, not secrets; rendered into inline scripts via `JSON.stringify`, never string-concatenated) |
| `consent.required` checkbox default **true** · `consent.bannerText` textarea ≤300 · `consent.acceptLabel` text ≤20 ("Accept") · `consent.declineLabel` text ≤20 ("Decline") · `consent.policyLink` `link()` (defaults to the privacy policy) — `ExternalAnalytics.tsx` loads third-party scripts only after consent when `required` is on (`ConsentBanner.tsx`, choice stored in `localStorage` `mp_consent`); the first-party cookieless beacon stays unconditional |
| `dashboard.defaultRange` select `7 \| 30 \| 90` |

**`system-state`** (hidden; `access.read/update: systemOnly`): `canary` ★ (sealed `"ok"` minted once at first boot), `installedAt`, `seedVersion`, `publicUrlConfirmedAt` (first human save of Site details; `isPlaceholderPublicUrl` reads it), `lastDigestDay` (YYYY-MM-DD Dubai), `lastInventoryReconcileAt`. `onInit` opens `canary`; on failure it sets an in-memory flag that `Warnings.tsx` renders as the red "server secret changed" banner (§C.1).

---
## D. Collections — fields, access, hooks, admin grouping

Conventions: `idType: uuid`. Money is **integer fils** (`priceFils`, `…Fils`) with an `afterRead` virtual `price: { amount, currency: "AED" }` for the site's `Price` type; the admin edits AED via the `money()` field component (shows/accepts `240.00`, stores `24000`). Dates are `date` fields; `sessions.startsAt` has `timezone: true` (Asia/Dubai). Slugs use `slug()` (text, unique, `formatSlug` hook, admin-only edit after publish). Rich text is Lexical. Every content collection gets `versions: { drafts: { autosave: { interval: 1500 }, schedulePublish: true }, maxPerDoc: 25 }` where marked **drafts**. `listSearchableFields` is set on every collection so the admin list search works. Public REST never needs staff-only fields: those carry **field-level `access.read`** (verified: Payload's `validateSearchParam` rejects `where` on unreadable fields, so no filter oracle remains). Access helpers come from `cms/access/roles.ts`:

```ts
export const isAdmin: Access = ({ req }) => req.user?.role === "admin";
export const isEditor: Access = ({ req }) => ["admin", "editor"].includes(req.user?.role ?? "");
export const isStaff:  Access = ({ req }) => ["admin", "front-desk"].includes(req.user?.role ?? "");
export const anyone: Access = () => true;
export const publishedOrEditor: Access = ({ req }) => isEditor({ req }) ? true : { _status: { equals: "published" } };
export const isAdminField:  FieldAccess = ({ req }) => req.user?.role === "admin";
export const isEditorField: FieldAccess = ({ req }) => ["admin", "editor"].includes(req.user?.role ?? "");
export const isStaffField:  FieldAccess = ({ req }) => ["admin", "front-desk"].includes(req.user?.role ?? "");
export const systemOnly: Access = ({ req }) => req.context?.system === true;      // server code sets context.system
export const never: Access = () => false;
```

### D.1 System (group "System")

**`users`** — `auth: { maxLoginAttempts: 5, lockTime: 10 * 60 * 1000, tokenExpiration: 8 * 3600, verify: false, cookies: { secure: process.env.NODE_ENV === "production", sameSite: "Lax" }, forgotPassword: { expiration: 60 * 60 * 1000, generateEmailSubject: () => "Your Maison Palettia admin login link", generateEmailHTML } }`, where `generateEmailHTML = async ({ req, token, user }) => renderTemplateHtml("staff_login_link", { name: user.name, link: `${await publicUrl(req)}/admin/reset/${token}`, expiresIn: "1 hour" })` — Payload's own link builder uses `getRequestOrigin()`, which returns `""` when `serverURL` is unset and the Host is not in `cors`/`csrf` (verified `auth/operations/forgotPassword.js`), so we build the absolute URL ourselves from `site-settings.publicUrl` (fallback `NEXT_PUBLIC_SERVER_URL`). Fields: `name` text required, `role` select `admin | editor | front-desk` (default `front-desk`, `access.update: isAdminField`), `active` checkbox default true (login hook refuses inactive), `lastLoginAt` date RO (`access.read: isAdminField`), `email` (`access.read: ({ req, doc }) => req.user?.role === "admin" || doc?.id === req.user?.id`). Access: `create/update/delete: isAdmin` (create also allowed when `count(users) === 0`), `read: ({ req }) => req.user?.role === "admin" ? true : req.user ? { active: { equals: true } } : false` (editors/front-desk see active colleagues' names so the `enquiries.assignedTo` picker works). Hooks: `beforeChange` first user → `role = "admin"`; `afterLogin` stamps `lastLoginAt`. `admin.useAsTitle: "name"`, `admin.hidden: ({ user }) => user.role !== "admin"`. **Invite flow** (no passwords over WhatsApp): list-view button **Invite staff** (`admin.components.beforeListTable: InviteStaff`) → `POST /api/actions/users/invite { name, email, role }` (admin) creates the user with a random 32-byte password and calls `payload.forgotPassword({ collection: "users", data: { email }, req })` so they set their own via the emailed link; document button **Send login link** (`SendLoginLink`, `POST /api/actions/users/{id}/send-login-link`) does the same for an existing user (rotating the password to random when they have never logged in). Both **refuse with a clear message when `email-settings.provider === "log-only"`** ("Set up Email sending first, then invite staff"). Developer fallback for a forgotten owner password: `npx payload run cms/scripts/reset-password.ts <email>` (new password read from stdin; documented in `docs/cms-runbook.md`).

**`settings-audit`** — append-only log of 📝 fields (§C.3): `global` text, `field` text, `from` text, `to` text (secrets never logged: `[set]`/`[cleared]`), `user` rel users, `at` date, `ipHash`. Access: `read: isAdmin`, `create: systemOnly`, `update/delete: never`. Written by the globals' `afterChange`.

**`media`** — `upload: { staticDir: path.resolve(dirname, "media"), mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/svg+xml", "video/mp4", "font/ttf", "font/otf", "application/x-font-ttf", "application/font-sfnt"], allowRestrictedFileTypes: false, focalPoint: true, imageSizes: thumb 96², menu 192², card 640, plate 1200, hero 2000, og 1200×630 (position attention), formatOptions webp for all but og }` (no `image/*`, no `text/plain`; verified that 3.90.2 already rejects scripted SVGs and serves XML types with `Content-Security-Policy: script-src 'none'`). Fields: `alt` textarea ≤300 (required unless `decorative`), `decorative` checkbox, `caption` text ≤80, `credit` text (`access.read: isEditorField`), `provenance` select `studio | client-supplied | stock | ai-generated | unknown` **default `studio`** (`access.read: isEditorField`), `licence` text ≤200 (`admin.condition: provenance === "stock"`; `access.read: isEditorField`), `consent` checkbox "Model/parent consent on file" (`access.read: isEditorField`), `tags` select hasMany `experience-hero, experience-gallery, programme, venue, gallery-make, gallery-making, gallery-keep, logo, og, hero, seasonal, kids, film, font`, `sizeNotice` ui (afterRead: "Under 1000 px wide — may look soft in hero slots" when `width < 1000`). Access: `read: anyone`, `create/update: isEditor`, `delete: isAdmin`. `admin.group: "Content"`, `defaultColumns: filename, alt, provenance, tags`, `folders: true`. Hooks (`cms/hooks/mediaGuards.ts`):

- `beforeValidate`: `alt`-or-`decorative` rule. (The provenance gate is **not** here — a media hook cannot know which document references it; it lives in `publishGate` on the content collections, §D.2.)
- `beforeDelete`: `const refs = await findMediaReferences(req, id)` (`cms/lib/mediaReferences.ts`: relationship `where` queries on `experiences.image|gallery`, `sessions.image|gallery`, `programmes.image`, `venues.logo|image`, `passes.image`, `meta.image` on the five SEO collections, globals `site-settings.{logoOnDark,logoOnLight,monogram}`, `seo-defaults.shareImage`, `invoice-settings.{logo,pdfFonts.regular,pdfFonts.bold}`, plus a recursive walk of every `pages.blocks` tree for the id). If any → `throw new APIError("This file is still used — remove it from: Home page → Hero (desktop image); Candle Making → Hero image …", 409)`.
- `afterChange` (update only, never create): when `filename`, `url`, `sizes`, `alt`, `decorative` or `focalPoint` differ from `previousDoc` → `revalidateAllContent(req)` = every tag in `TAGS` + `revalidatePath("/", "layout")` (one cheap call; pages reference media URLs and Payload deletes the old file when a replacement changes the filename). `afterDelete` → the same.
- Mappers tolerate a missing/null upload as a second line of defence: `imageOf(doc.image) ?? imageOf(experience.image) ?? PLACEHOLDER_IMAGE` (`/images/placeholder.svg`).

### D.2 Content (group "Content") — fields per `01-content-inventory.md` §4 with the resolutions below

`FIXED_PAGE_SLUGS = ["home","about","locations","gallery","faq","contact","policies","loyalty","events","private-events","private-events-book"] as const` is exported from `cms/collections/content/Pages.ts` and is the single list used by the delete-refusal hook, the seed (§F.7), the `[...slug]` catch-all exclusions and the `FixedPageBadge` (lock icon + "This page is part of the site structure and cannot be deleted or renamed").

| Collection | Key fields (beyond §01) | Drafts / live preview | Access | Hooks |
|---|---|---|---|---|
| `pages` | `title`, `slug` (11 fixed slugs + free), `blocks` (§E), `templateCopy` group (only for `events`), SEO tab, `publishedAt` | drafts + LP | read `publishedOrEditor`, write `isEditor`, delete `isAdmin` and refused for `FIXED_PAGE_SLUGS`; slug change refused for fixed slugs (any role) | `revalidate(pathsForPage)`, `slugRedirect` |
| `experiences` | `name`, `slug`, `kind diy\|scheduled`, `description` ≤60, `about[]`, `image`, `gallery` (hasMany media ≤3), `status` text, `vibes`, `ageGuidance`, `privateEventEligible`, `order`, SEO | drafts + LP | as above | `revalidate(/, /events, /events/{slug}, /gallery, /private-events, sitemap)`; `publishGate`; `slugRedirect` |
| `sessions` | `experience` (rel, must be `kind=scheduled`), `slug` auto **`{experience}-{yyyy-mm-dd}-{HHmm}`** (editable before publish; validation message "A session for this experience already exists on this date and time"), `title` default experience name, `category`, `startsAt` (tz), `durationMinutes` 15–480 step 15, `venue` rel, `priceFils` money, `seatsTotal` (min 1), `inventory` **join** (→ `session-inventory.session`), virtual `seatsAvailable` + `isFullyBooked` (public) and `seatsSold`/`seatsHeld` (`access.read: isStaffField`, computed from the joined inventory row), `bookingStatus open\|waitlist\|closed`, `salesCloseAt`, `checkInWindow {beforeMinutes 60, afterMinutes 30}`, `excerpt`, `image`, `gallery` ≤6, `about[]` override, `includes`, `minAge`, `instructor` (`access.read: isEditorField`), `internalNotes` (`access.read: isEditorField`), `reminderSentAt` (system), `cancelledAt`/`cancelReason` (system), SEO | drafts + LP | read `publishedOrEditor`; write `isEditor`; delete refused while `seatsSold > 0` | `sessionSlug`; `publishGate`; `slugRedirect`; `beforeValidate` refuses `seatsTotal < inventory.seatsSold + inventory.seatsHeld` ("12 seats are already sold or held; capacity cannot go below 12"); `beforeChange` refuses a direct `startsAt`/`venue` change while `seatsSold > 0` unless `context.reschedule` ("8 people hold tickets for this session — use **Reschedule** so they are told"); `afterChange` ensures the `session-inventory` row exists (`create` with `context.system`); `afterDelete` removes it; `revalidate(...)` skipped on `context.skipRevalidate` |
| `session-inventory` | `session` rel (unique index), `seatsSold` number default 0, `seatsHeld` number default 0 | **no drafts, no versions** | `read: isStaff`, `create: systemOnly`, **`update: never`**, `delete: systemOnly`; `admin.hidden: ({ user }) => user.role !== "admin"`, group "Bookings" | none — the **only** writer of `seats_sold`/`seats_held` is the SQL in `cms/lib/inventory.ts` (§H.3). Rationale: Payload writes the **full row** on every update (`@payloadcms/drizzle/upsertRow`) and publishing copies the version snapshot into the main table, so counters on the `sessions` document would be clobbered by any editor save (TOCTOU). Separating them makes editor saves and inventory SQL touch different rows. |
| `redirects` | `from` text unique validate `^/[a-z0-9\-/]{1,200}$`, `to` text validate `^/[a-z0-9\-/?=&%.]{1,300}$` or https URL, `permanent` checkbox default true, `source auto\|manual`, `hits` number (system) | — | read anyone, CRUD `isEditor` | `beforeValidate` refuses `to === from`; consumed by `lib/cms/redirects.ts::redirectOr404(pathname)` (cached, tag `collection:redirects`), which every dynamic route (`[...slug]`, `events/[slug]`, `private-events/[slug]`, `policies/[slug]`) calls **before** `notFound()` (`permanentRedirect`/`redirect`; one hop, never re-resolved). `cms/hooks/slugRedirect.ts` (`afterChange` on `pages`, `experiences`, `sessions`, `programmes`, `policies`) upserts `{ from: routeFor(slug, previousDoc), to: routeFor(slug, doc), permanent: true, source: "auto" }` whenever a **published** document's slug changes, and revalidates the old path. The three legacy `/workshops*` redirects stay in `next.config.ts`. |
| `venues` | §01 §4.3 (`name`, `slug`, `locality`, `status current\|past\|upcoming`, `descriptor`, `eventDescriptor`, `locationHref`, `mapQuery`, **`coordinates` group `{ lat: number −90..90, lng: number −180..180 }`** with `CoordinatesField` UI — **never `type: "point"`** (PostGIS, §A.5), `logo`, `image`, `address[]`, `hours[]`, `order`) | — | read anyone, write `isEditor` | revalidate `/`, `/locations`, `/events`, `/private-events`, every session page at this venue |
| `programmes` | §01 §4.5 (`name`, `slug`, `description`, `lead`, `image`, `mark {name,color}`, `inPrivateEventsMenu`, `tone` select, `order`, SEO) | drafts + LP | | revalidate `/`, `/private-events`, `/private-events/{slug}`, `/private-events/book`, sitemap; `publishGate`; `slugRedirect` |
| `policies` | §01 §4.6 (`title`, `slug`, `navLabel`, `summary`, `sections[] {heading, blocks: text\|list\|ages\|callout}`, `effectiveDate`, `showInLegalRow`, `requiresCheckoutConsent`, `version` number auto-increment on publish, `order`) | drafts + LP | | revalidate `/policies`, `/policies/{slug}`, `/faq`, `/checkout`, layout (footer legal row); `slugRedirect` |
| `faqs` | `question`, `answer` richText, `answerSource text\|bookingTerms` (`bookingTerms` renders `booking-settings.bookingTerms`), `group`, `order`, `showOnHomepage` | drafts | | revalidate `/faq`, `/` |
| `passes` | `name`, `slug`, `description`, `priceFils` (optional → "not on sale"), `sessions`, `validityDays`, `validityLabel`, `benefits[]` ≤4, `image`, `sellable`, `order` | drafts | | revalidate `/loyalty`, `/checkout` |
| `testimonials` | `quote`, `attribution`, `experience` rel, `permissionOnFile` (publish gate) | drafts | | revalidate `/` |
| `vibes` | `label`, `slug`, `blurb`, `order` | — | | revalidate `/events`, `/` |

`cms/hooks/publishGate.ts` (`beforeValidate` on `experiences`, `programmes`, `sessions` when `_status === "published"`): loads the referenced `image`/`gallery` media and refuses when any has `provenance ∈ {ai-generated, unknown}` unless `site-settings.allowAiImagery` — message: "The hero image "{filename}" is marked {provenance}. Replace it, change its origin in Media, or allow AI imagery in Settings → Site details → Advanced." `stock` imagery passes (its `licence` field is optional).

Admin: `pages.useAsTitle: title`; `sessions.useAsTitle: title` with `defaultColumns: title, startsAt, venue, seatsAvailable, bookingStatus, _status`; `sessions.admin.components.edit.beforeDocumentControls: [SessionQuickStats, SessionActions]` — `SessionQuickStats` shows sold/held/available from the join; `SessionActions` offers **Repeat…**, **Reschedule…**, **Cancel session & refund all**, **Attendee list** (§H.7, §I). Payload's built-in Duplicate stays enabled; `beforeDuplicate` field hooks blank `slug`, `reminderSentAt`, `cancelledAt` (counters are not on the document, so nothing to zero). "Restore version" needs no special handling: counters live elsewhere and a restored `seatsTotal` passes through the `beforeValidate` guard. All content collections: `admin.group: "Content"`, `preview: ({ slug }, { req }) => previewUrl(...)` (§G.5).

### D.3 Commerce (group "Bookings"; hidden from editors)

Fields are those of `03-commerce-notifications-design.md` §2.2 with these binding adjustments: the bookable collection is **`sessions`** (not `events`), programmes are `programmes`, venues are `venues`; `payment-events` from `02` is kept as the append-only webhook log.

| Collection | Purpose / key fields | Access (admin / front-desk) |
|---|---|---|
| `customers` | `email` unique lowercased, `firstName`, `lastName`, `phone`, `marketingOptIn`, `notes`, `lastOrderAt`, `stats {ordersCount, ticketsCount, lifetimeFils}`, `lastMagicLinkIssuedAt`, **`sessionVersion`** int default 1 (bumped by **Sign out everywhere**, §H.10) | R U D / R U:`phone,notes`; create `systemOnly` |
| `orders` | `reference` unique (`MP-` + 6 of `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`), `status` (§H.1 machine), `mode test\|live\|mock`, **`channel online\|desk`** (default `online`), **`basketId`** uuid (index; same `basketId`+email reuses an open order instead of creating another), `customer` rel, `contact` snapshot, `notes`, `lines[] {kind session\|pass, session rel, pass rel, title, category, startsAt, durationMinutes, venueName, qty, unitFils, lineFils, passCredits}`, `codes[]`, **`promo { promoCode rel, code, discountFils }`**, **`passRedemptions[] { passPurchase rel, n }`**, `totals {subtotalFils, discountFils, grossFils, netFils, vatFils, vatRateBps, currency}`, **`deskPayment { method cash\|card_terminal\|complimentary\|bank_transfer, amountFils, note, takenBy rel users }`** (desk channel only), `payment` rel (current attempt), `invoice` rel, `tickets` join, `hold {expiresAt, seatsBySession json}`, `source {ipHash, userAgent, referrer}`, `timeline[]` append-only, `internalNotes`, `remindersSentAt`, `confirmedAt/cancelledAt/expiredAt`, `needsReview` checkbox + `reviewReason amount_mismatch\|no_order\|post_expiry\|mode_or_link_mismatch\|dispute\|voided_after_capture`, **`disputed`** checkbox + `disputeStatus` text, `consentedPolicyVersions` json | R U:`internalNotes,contact.*` + actions / R U:`internalNotes, contact.email, contact.phone` (field-level; `afterChange` appends a timeline entry "Contact changed by {user}" and updates the `customers` row) + resend/move/create-desk; create `systemOnly`; delete nobody |
| `seat-holds` | `order`, `session`, `qty`, `expiresAt` (index), `status held\|released\|consumed` | R / — |
| `payments` | `order`, **`provider mamo\|desk`**, `mode`, `providerLinkId`, `providerLinkUrl` 🔐, `providerPaymentId` unique sparse, `status` (§H.2), `amountFils`, `currency`, `method {type (card, wallet, cash, card_terminal, complimentary, bank_transfer), cardLast4, cardOrigin}`, `raw` json 🔐, `failureCode`, `failureMessage`, `capturedAt`, `failedAt`, `webhookSeenAt`, `verifiedAt`, `linkDeactivatedAt`, `settlement*` 🔐 — 🔐 = `access.read: isAdminField` | R / R (sees `status, amountFils, method.type, method.cardLast4, capturedAt`) |
| `payment-events` | `provider`, `eventType`, `providerPaymentId`, `providerLinkId`, `order` rel, `dedupeKey` unique (`{paymentId}:{eventType}:{status}:{refund_amount}`; disputes: `{disputeId}:{eventType}`), `mode`, `verified`, **`headerNames`** text[] (always), **`headers`** json (verified only, every secret-matching header plus `authorization`, `cookie`, `x-auth-header` → `"[redacted]"`), `payload` json (verified only) / **`bodyExcerpt`** text ≤1 KB (unverified only), **`ipHash`**, `receivedAt`, **`processingStartedAt`**, `processedAt`, `error`, `needsReview` | R / — |
| `refunds` | `order`, `payment`, `amountFils`, `reason` select (`customer_request, session_cancelled, post_expiry_payment, duplicate, goodwill, other`), `note`, `status requested\|approved\|processing\|succeeded\|failed`, `requestedBy`, `approvedBy`, `idempotencyKey` unique, **`providerRequestAt`**, **`providerRefundId`**, `providerResponse` 🔐, `creditNote` rel, `ticketsVoided` hasMany, `releaseSeats` default true | C R U (approve) / C R (request); `status` changes only via `context.system` (field access `update: never`; actions use the Local API) |
| `invoices` | `number` unique, `kind invoice\|credit_note`, `year`, `sequence`, `order`, `refund`, `issuedAt`, `seller` snapshot, `buyer` snapshot, `lines[]`, `totals`, `currency`, **`paymentLabel`** ("Mamo Pay · card ****1157" / "Paid at venue (cash)" / "Complimentary"), `file` rel invoice-files, `generatedAt`, `emailedAt`; immutable after `issuedAt` except `file/generatedAt/emailedAt` | R (+ regenerate PDF) / R* (no `buyer.phone`) |
| `invoice-files` | upload, `staticDir: private/invoices`, `mimeTypes: ["application/pdf"]`, `access.read: isStaff` — **customers never download through `/api/invoice-files/file/*`** (verified: `checkFileAccess` runs before any `upload.handlers`, so a signed-URL handler there could never work); the only customer path is `app/(site)/api/site/invoices/[id]/pdf/route.ts` (§H.7) | R / R |
| `invoice-counters` | `kind`, `year`, `last`; `indexes: [{ fields: ["kind", "year"], unique: true }]` (Payload `CompoundIndex`, so `migrate:create` emits it); touched only by raw SQL | R / — |
| `tickets` | `code` unique (`MPT-` + 8), `order`, `lineIndex`, `seatNo`, `session` rel (index), `holderName`, `status valid\|checked_in\|void\|refunded`, **`qrSig`** (stored at issue; verified by lookup, §H.7), `checkedInAt`, `checkedInBy`, `checkInDevice camera\|manual\|…`, **`checkInForced`** checkbox, `reminderSentAt`, `qr` system | R U:`holderName` / R U:`holderName` + check-in endpoint |
| `pass-purchases` | `code` unique (`MPP-` + 8), `customer`, `order`, `pass`, `sessionsTotal`, `sessionsRemaining`, `expiresAt`, `status`, `redemptions[] {order, n, at, restored}` | R U / R |
| **`promo-codes`** | `code` text unique uppercase (`beforeValidate` uppercases/trims), `label`, `type percent\|fixed`, `value` (percent 1–100 / fils), `appliesTo all\|experiences\|sessions`, `experiences` hasMany, `sessions` hasMany, `startsAt`, `endsAt`, `maxUses` (optional), `uses` number (system; incremented atomically in the checkout transaction, restored on expiry/failure), `minSpendFils`, `active` checkbox, `notes` | CRUD / R |
| `waitlist` | `session`, `name`, `email`, `phone`, `qty`, `status waiting\|notified\|converted\|expired\|cancelled`, `position` (system), `notifiedAt`, **`token`** (random 22 chars, index) + **`tokenExpiresAt`**, `convertedOrder`, `meta {ipHash, userAgent}` | CRUD / **C** R U:`status` (front-desk can add a caller); public create only via `context.viaWaitlistEndpoint` |

### D.4 Inbox (group "Inbox")

**`enquiries`** — `source contact|private-event`, `name`, `email`, `phone`, `topic` select (the five `lib/enquiry.ts` values), `message`, `details[] {label, value}`, `status new|in_progress|closed` (default new), `assignedTo` rel users, `internalNotes`, `repliedAt`, `meta {ipHash, userAgent, referer, honeypotTripped}`. `access.create: ({ req }) => req.context?.viaEnquiryEndpoint === true` (only our endpoint creates), `read/update: isEditor or isStaff`, `delete: isAdmin`. Admin list grouped by status, `ui` field **Reply by email** (`mailto:` with reference in subject; stamps `repliedAt` on click via endpoint). `afterChange` (create) → `notifyStaff("new_enquiry")` (+ optional auto-reply). The public forms are gated on `site-settings.enquiriesEnabled` **only**; every enquiry is stored even when nobody is emailed (dashboard warning, §C.3).

### D.5 Comms (group "Emails")

**`email-templates`** — `key` select unique (code-owned list, §H.8), `label`, `subject` text with `{{vars}}`, `preheader`, `body` richText, `attachInvoice`, `attachTickets`, `enabled`; `ui` fields **Variables** (from the code map) and **Preview / Send me this**. Access: admin CRUD; **editor R + U on `subject`, `preheader`, `body` only** (`key`, `enabled`, `attachInvoice`, `attachTickets` are `isAdminField` — transactional emails are security-relevant, not content). Seeded by `onInit` with house copy.

**`notification-log`** — `channel`, `to`, `templateKey`, `subject`, `status queued|sent|failed|skipped`, `provider`, `providerMessageId`, `error`, `attempts`, `sentAt`, refs `order/enquiry/ticket/refund/session`, `variables` json — **persisted with any key matching `/^(links?|token|url|magic)/i` replaced by `"[redacted]"`** (so a front-desk user can never copy a live magic link), purged after 30 days by `purge-retention`. Admin R (+ **Resend**), front-desk R.

### D.6 Analytics (group "System", admin only)

`analytics-events` (`ts`, `day`, `kind pv|checkout_started|payment_redirect|order_paid`, `path`, `referrerHost`, `device`, `browser`, `visitor`) and `analytics-daily` (`day`, `dimension page|referrer|device|browser|total|funnel|channel`, `key`, `views`, `visitors`). Hidden from non-admins; never read by the site. The beacon strips query and hash **before** sending; the collector validates `path` against `^/[a-z0-9\-/]{0,160}$` **and** maps it to a known route (static routes + published slugs of `pages`, `experiences`, `sessions`, `programmes`, `policies`, cached) else `/other`; `referrerHost` must parse as a hostname; body ≤ 1 KB; 120/min per `ipHash` (§H.11).

### D.7 Hook summary (all hooks, where they live)

| Where | Hook | Does |
|---|---|---|
| content collections + content globals | `afterChange`, `afterDelete` | `revalidate*` (§G.4): skipped on `context.skipRevalidate`/`disableRevalidate` **and** when neither `doc._status` nor `previousDoc._status` is `published` (no storm during autosave) |
| `pages`, `experiences`, `sessions`, `programmes`, `policies` | `beforeChange` / `afterChange` | `formatSlug`; `sessionSlug` for sessions; refuse slug change on published docs for non-admins and on fixed pages for everyone; `slugRedirect` upserts a `redirects` row on a published slug change |
| `experiences`, `programmes`, `sessions` | `beforeValidate` | `publishGate` (imagery provenance, testimonials permission) |
| `sessions` | `beforeValidate`, `beforeChange`, `afterChange`, `afterDelete`, `afterRead` | capacity ≥ sold+held; block direct `startsAt`/`venue` change with sold seats (use Reschedule); ensure/delete `session-inventory` row; virtual `seatsAvailable`/`isFullyBooked`/`seatsSold`/`seatsHeld` from the join |
| `media` | `beforeValidate`, `beforeDelete`, `afterChange`, `afterDelete` | alt/decorative; reference check with readable refusal; revalidate everything on file/alt/focal change or delete |
| `site-settings` | `afterChange` | logo ink-bbox via sharp; `revalidatePath("/", "layout")`; `settings-audit` + `notifyStaff("settings_changed")` for 📝/📣 fields |
| `booking-settings`, `payment-settings`, `email-settings`, `analytics-settings` | `beforeValidate`, `afterChange` | `bookingsOpen` / `mode` preconditions (§C.3); audit; drop cached clients/transports (nothing re-plans crons — §H.9) |
| `orders` | `beforeValidate`, `beforeChange`, `afterChange` | mint reference; enforce `transition()`; contact-change timeline + customer sync; customer stats; low-seat check |
| `customers` | `beforeValidate` | lowercase/trim email |
| `tickets` | `beforeValidate` | mint code + QR + `qrSig` |
| `invoices` | `beforeChange` | immutability |
| `refunds` | `beforeChange`, `afterChange` | edge + role checks; `requested` → `notifyStaff("refund_requested")`; `approved` → queue `process-refund` |
| `enquiries`, `waitlist` | `afterChange` (create) | `notifyStaff` |
| `users` | `beforeChange`, `afterLogin` | first user → admin; `lastLoginAt` |
| every `encryptedText` | field `beforeChange`/`afterRead` | seal / mask / clear (§C.2, raw read for untouched values) |
| `onInit` (`cms/seed/defaults.ts`) | — | early-return during `next build`; advisory lock; seed email templates; ensure globals exist with defaults; mint `system-state.canary`; open canary and set the "secret changed" flag on failure; assert `payload.db.tables.sessions` and `payload.db.tables.session_inventory` with the expected columns (`seats_total, booking_status, sales_close_at, starts_at, _status` / `session_id, seats_sold, seats_held`). **No webhook-secret minting here** (Register does it). |

---
## E. Page builder — blocks mapped to existing components

Rule carried from the codebase: **components stay the renderers; blocks only supply data.** `components/blocks/BlockRenderer.tsx` switches on `blockType` and passes props into the existing component (adapter files in `components/blocks/*`). Decorative doodles/inks/tone maps stay in the renderers; the editor only picks a `tone` where a component already has variants. Shared sub-fields — **one spelling everywhere, in `cms/blocks/*`, `components/blocks/*` and `cms/seed/pages.ts`**: `headingLines[] {text}` (`headingLines()` field with ≤2 rows ≤18 chars, 3 rows on `/private-events`, ≤16 chars for the home hero), `cta {label, link}` where `link = {type internal|external, page rel, url, anchor}` (`link()` field), `eyebrow` text ≤24, `lead/standfirst` textarea. Paths below are full repo paths.

**"Use Brand Copy" fields.** Blocks that can take their text from a global (`hero.useTagline`, `openingStatement.useBrandCopy`, `whereWeCreate.useFindUsLine`, `whereWeSetUp.useFindUsLine`, `pageHeader.standfirstSource`, `steps.source`, `missionVision`, `closingInvitation`) render their override fields **disabled** while that mode is on (`admin.condition`) and show a `brandCopyLink()` ui field (`cms/fields/brandCopyLink.ts` → `cms/components/fields/BrandCopyLink.tsx`): "This text comes from **Brand wording → {field}**. Edit it there →" (deep link to `/admin/globals/brand-copy#field-{path}`), or "Turn off 'Use Brand wording' to write your own". Click-to-edit (§G.5) posts `{ global: "brand-copy", path }` for such sections, so the admin lands on the global, not on an inert block override.

### E.1 Blocks in use at launch (seeded onto the 11 `FIXED_PAGE_SLUGS` pages)

| Block slug | Renderer | Page(s) | Fields |
|---|---|---|---|
| `hero` | `components/sections/Hero.tsx` | home | `useTagline` checkbox (default true → lines from Brand Copy `tagline`), `headingLines[]` ×3 ≤16 chars, `accentLineIndex`, `sub`, `lead`, `primaryCta`, `secondaryCta`, `imageDesktop`, `imageMobile`, `scrollCueLabel`, `scrollCueTarget` |
| `openingStatement` | `components/sections/home/OpeningStatement.tsx` → `components/sections/BrandStory.tsx` | home | `eyebrow`, `useBrandCopy` (default true) or `heading/body/closer/panel{heading,body,signOff}` overrides, `panelImage` |
| `experienceCarousel` | `components/sections/home/ExperienceDiscovery.tsx` + `components/sections/home/ExperienceCarousel.tsx` + `components/events/ExperienceCard.tsx` | home | `eyebrow`, `headingLines`, `standfirst`, `source all\|diy\|scheduled\|manual`, `experiences` hasMany, `cardCta` |
| `waysToTakePart` | `components/sections/home/WaysToExperience.tsx` + `components/sections/home/WaysTrail.tsx` | home | `eyebrow`, `headingLines`, `lead`, `groups[]` ×4 {`name`, `lede`, `photo`, `tint`, `doors[] {label, noteSource text\|diyCount\|scheduledCount\|programmeDescription, note, link, programme rel}`} |
| `twoWays` | `components/sections/home/TwoWaysToCreate.tsx` | home | `eyebrow`, `heading`, `lead`, `roads[]` ×2 {`eyebrow`, `title`, `line`, `facts[]`, `cta`, `ground terracotta\|lilac`}; venue + next date derived |
| `whereWeCreate` | `components/sections/home/WhereWeCreate.tsx` | home | `eyebrow`, `headingLines`, `useFindUsLine`, `lead`, `findUsNowLabel`, `venue` rel (default current) |
| `closingInvitation` | `components/sections/home/ClosingStatement.tsx` | home | `primaryCta`, `secondaryCta`; copy from Brand Copy `closing` (brandCopyLink) |
| `aboutWelcome` | `app/(site)/about/page.tsx` `Welcome()` → extracted to `components/sections/about/Welcome.tsx` | about | `eyebrow`, `image` (+ H1 = tagline, paragraphs = Brand Copy `brandStory`; brandCopyLink) |
| `missionVision` | `app/(site)/about/page.tsx` `Purpose()` → `components/sections/about/Purpose.tsx` | about | no own fields; shows brandCopyLink to Brand Copy `purposeLabels`/`mission`/`vision` |
| `communityJourney` | `app/(site)/about/page.tsx` `Community()` → `components/sections/about/Community.tsx` | about | `eyebrow` |
| `whatSetsUsApart` | `app/(site)/about/page.tsx` `Apart()` → `components/sections/about/Apart.tsx` | about | `eyebrow`, `headingLines` (cards from Brand Copy `whatSetsUsApart[]`; brandCopyLink) |
| `closingCtaLilac` | `app/(site)/about/page.tsx` `Close()` + the five siblings → `components/sections/ClosingCta.tsx` | about, gallery, faq, policies, private-events, contact | `eyebrow`, `headingLines`, `body`, `primaryCta`, `secondaryCta` |
| `pageHeader` | `DisplayHeading` + `Eyebrow` pattern → `components/sections/PageHeader.tsx` | faq, gallery, locations, policies, booking-status, events, private-events-book | `eyebrow`, `headingLines`, `standfirstSource text\|openingStatementBody\|findUsLine`, `standfirst`, `sideImage`, `sideImageSecondary` |
| `faqList` | `components/faq/FaqList.tsx` | faq | `groups[] {key coming\|booking\|groups, title}` (items from `faqs`) |
| `galleryCollections` | `components/gallery/GalleryExperience.tsx` | gallery | `collections[]` ×3 {`folio`, `heading`, `lede`, `ground`, `source experiences\|mediaTag\|manual`, `mediaTag`, `images` hasMany} |
| `locationsHero` | `app/(site)/locations/page.tsx` body → `components/sections/LocationsBody.tsx` | locations | `findUsNowLabel`, `emptyNote`, `venues` hasMany (default all current), `showPastDestinations` |
| `contactIntro` | `app/(site)/contact/page.tsx` `Invitation/Details/Portrait` → `components/sections/contact/{Invitation,Details,Portrait}.tsx`; **the form component stays at `components/contact/ContactForm.tsx`** (3F owns it in Phase 3) | contact | `eyebrow`, `headingLines`, `lead`, `findUsHeading`, `whereTerm/emailTerm/phoneTerm/followTerm`, `venuesLinkLabel`, `formHeading`, `formLead`, `portrait` (details from Site Settings; form posts to `/api/site/enquiries`) |
| `privateEventsIntro` | `app/(site)/private-events/page.tsx` `Introduction()` → `components/sections/private-events/Introduction.tsx` | private-events | `eyebrow`, `headingLines` ≤3, `lead`, `image` |
| `programmesGrid` | `app/(site)/private-events/page.tsx` `WhoItIsFor()` → `components/sections/private-events/WhoItIsFor.tsx` | private-events | `eyebrow`, `headingLines`, `lead`, `cardCta` (items = `programmes`) |
| `activitiesGrid` | `components/private-events/ActivityPlate.tsx` | private-events (+ programme template) | `eyebrow`, `headingLines`, `lead`, `linkTo experiencePage\|enquiry` (items = `experiences[privateEventEligible]`) |
| `venueSpotlight` | `app/(site)/private-events/page.tsx` `CreateWithUs()` → `components/sections/private-events/CreateWithUs.tsx` | private-events | `eyebrow`, `headingLines`, `lead`, `cardLabel`, `venue` rel |
| `steps` | `app/(site)/private-events/page.tsx` `HowItWorks()` / `app/(site)/loyalty/page.tsx` `HowItWorks()` → `components/sections/Steps.tsx` | private-events, private-events-book, loyalty (+ programme template) | `eyebrow`, `headingLines`, `source brandCopyPrivateEventSteps\|custom`, `steps[] {title, detail}`, `variant cards\|list` |
| `enquiryForm` | `components/private-events/PrivateEventEnquiry.tsx` + `components/private-events/EnquiryStub.tsx` (both stay in place; 3F) | private-events-book | `legendAboutYou`, `legendAboutEvent`, `note`, `submitLabel`, `successHeading`, `successBody`, `sidebarSteps` (reuses `steps` fields) |
| `passesList` | `components/loyalty/PassOffer.tsx` (stays in place; 3F) | loyalty | §01 §5.1 `passesList` fields (eyebrow, heading, lead, listHeading, previewDisclaimer, terms, labels, empty state, footerSentence) |
| `policiesIndex` | `app/(site)/policies/page.tsx` list → `components/sections/PoliciesIndex.tsx` | policies | none (items = `policies` ordered) |
| `eventsBrowser` | `components/events/EventsBrowser.tsx` + `components/events/EventFilters.tsx` + `app/(site)/events/page.tsx` doors/group heads → `components/sections/EventsBody.tsx` | events | `doors[]` ×2 {`title`, `noteSource journey0\|journey1\|custom`, `note`, `modeLabel`}, `groupLeads {diy, scheduled}`, `viewLocationLabel`, `emptyTitle`, `emptyBody`, filter/empty copy via `template-copy.eventsBrowser` |
| `whereWeSetUp` | `components/events/WhereWeSetUp.tsx` | events | `eyebrow`, `heading`, `useFindUsLine`, `lead`, `nextLabelTemplate`, `cta` |
| `utilityBar` | `components/layout/PageUtilityBar.tsx` | (template routes: event detail, checkout — configured in `booking-settings.utilityBars`) | `note`, `links[]` |
| `richText` | new `components/blocks/RichText.tsx` (prose styles from globals.css) | any | `body` richText, `width narrow\|wide` |

### E.2 Dormant blocks — registered, not seeded (editors may add them)

`seasonal` (`components/sections/home/SeasonalExperiences.tsx`: `eyebrow`, `heading`, `intro`, `moments[]` from Brand Copy or manual), `workshopJourney` (`components/sections/home/WorkshopJourney.tsx`), `privateEventsTeaser` (`components/sections/home/PrivateEventsTeaser.tsx`), `imagePair` (`components/sections/home/StudioInterlude.tsx`), `fullBleedStatement` (`components/sections/home/CommunityMoment.tsx`), `film` (`components/sections/StudioFilm.tsx` + `FilmStage`: `video` media, `poster`, `label`, `duration`), `upcomingSessions` (`components/events/SessionShowcase.tsx`: `heading`, `limit`, `experience` filter), `testimonials` (new small renderer; only `permissionOnFile` docs), `collaborateTeaser` (`components/sections/home/CollaborateTeaser.tsx`).

**Deleted in Phase 5 cleanup** (no block; full paths — 5C verifies each is unimported with `tsc` + `next build` after every deletion batch): `components/sections/BrandIntro.tsx`, `components/sections/Experience.tsx` (editorial), `components/sections/MaisonPhilosophy.tsx`, `components/sections/SessionCarousel.tsx`, `components/sections/MallMap.tsx`, `components/sections/home/WhyMaison.tsx` (renders arrays wrongly), `components/gallery/GalleryWall*.tsx`, `components/events/ExperiencePlate*.tsx`, `components/layout/MenuSplash.tsx`, `components/layout/MobileNav.tsx`, `components/workshops/{WorkshopFeature,EventHeadline,WorkshopsSkeleton}.tsx` (keep only what `/events` still imports), **`app/(site)/blog/page.tsx`** (not in navigation, not in the content inventory; a future blog is a `richText` page in `pages`), `app/(site)/button-preview/**`, orphan constants in `lib/constants.ts` (`HERO_IMAGE`, `EDITORIAL_PANELS`, `HOW_IT_WORKS` → seeded as a `steps` instance first, `ABOUT_TEASER`, `PLAN_YOUR_VISIT`, `TESTIMONIALS_GROUND`, `GALLERY_TILES`, `HOMEPAGE_FAQ`), `lib/recent.ts`. `components/sections/LittleCreators.tsx` (AI plates; client decision pending) → keep file, no block.

### E.3 Fixed-template routes (not block pages)

`/events/[slug]` (session **or** DIY/scheduled experience page), `/events/[slug]/book`, `/private-events/[slug]`, `/policies/[slug]`, `/checkout`, `/payment-success`, `/booking-status`, `/my-bookings`. Their copy comes from `booking-settings` (§01 §3.4 as amended in §C.3) and `template-copy` (§C.3). `/events/[slug]` resolution order: session by slug → experience by slug → `redirectOr404(pathname)`. A scheduled experience page lists its upcoming sessions with the `upcomingSessions` renderer; a DIY page renders as today. The session page's booking bar renders, in order of precedence: "Session passed" · `bookingsOpen === false` → `closedMessage` + `closedCta` · `bookingStatus === "closed"` → closed fact · `bookingStatus === "waitlist"` or `seatsAvailable === 0` → `WaitlistForm` (`components/booking/WaitlistForm.tsx`, posts to `/api/site/waitlist`) · else Book.

---

## F. Seed plan (from `lib/*.ts` → CMS), `npx payload run cms/seed/index.ts`

### F.0 `onInit: seedDefaults` (`cms/seed/defaults.ts`, 1A)

Runs on every `getPayload()` — including each `next build` prerender worker — so it is guarded: `if (process.env.NEXT_PHASE === "phase-production-build") return;` (the CLI `migrate` already passes `disableOnInit: true`, verified `bin/migrate.js:41`). The remaining writes run inside **one transaction** opened with `SELECT pg_advisory_xact_lock(hashtext('maison-seed-defaults'))`, so concurrent inits are serialised and idempotent: upsert `email-templates` by `key` (never overwrite an edited body — only create missing keys), ensure every global exists with defaults, mint `system-state.canary` once, stamp `system-state.installedAt`, then open the canary and set the in-memory "secret changed" flag on failure, and run the schema assertions (§D.7). It mints **no** webhook secret (Register does).

### F.1–F.8 Full seed (`cms/seed/index.ts`, 2B)

Idempotent upserts keyed by `slug`/`key`/`filename`; `context: { disableRevalidate: true, system: true, skipRevalidate: true }`; runs against whatever `DATABASE_URL` the environment gives (local Docker in dev/CI; production once, at first deploy, from `scripts/deploy.sh --seed`). Order:

1. **Media** (`cms/seed/media.ts`): import the **76 referenced** files from `public/images` listed in `01` §9.1 (not the 54 unreferenced), with `alt` from the code's `alt:` strings, `focalPoint` from `position` strings, `provenance` from the scan (`ai-generated` for the 8 confirmed + `unknown` for the flagged squares/PNGs, `studio` for `images/events/*` and film frames, `client-supplied` for `who-is-it-for/*`), `consent: false` on the two child photos, `tags` by folder. Skip the missing `pigment-on-paper.jpg` (defect #1 — the gallery seed uses the five existing stills). Logos and `p-mark.svg` imported with tag `logo` (favicons are not imported — they stay static). `maison-film.mp4` + poster imported (tag `film`). `public/images/placeholder.svg` is a committed static asset, not media.
2. **Vibes** ← `lib/vibes.ts VIBES`. **Venues** ← `lib/partners.ts` (Times Square Center, `current`, `coordinates: { lat, lng }` from the map query where known) + `lib/brand.ts PAST_DESTINATIONS` (10 × `past`).
3. **Experiences** ← `lib/experiences.ts` (7; `about[]`, `gallery` from the `experience/*` files, `status: "Coming soon"` on Glass Painting, `ageGuidance` joined from `lib/policies.ts DIY_AGE_GUIDANCE/WORKSHOP_AGE_GUIDANCE`).
4. **Sessions** ← `lib/workshops.ts` (2 placeholders, slugs `candle-making-2026-10-11-1000`, `crocheting-2026-10-24-1400` (HHmm from the data), `priceFils = amount*100`, `seatsTotal`, `bookingStatus` from status, saved as **drafts** with `internalNotes: "Placeholder dates from the design phase — confirm before publishing"`); their `session-inventory` rows are created with `seatsSold: 0, seatsHeld: 0` (the demo "seats sold" figures are not carried over — there are no tickets behind them and `reconcile-inventory` would flag drift).
5. **Programmes** ← `lib/privateEvents.ts PRIVATE_EVENT_AUDIENCES` (4; `tone` from `AUDIENCE_TONES`). **Policies** ← `lib/policies.ts POLICIES` (8; sections/blocks 1:1; `ages` blocks with `source diy|workshop`). **FAQs** ← `lib/constants.ts FAQ_GROUPS` (10; "Am I charged…" → `answerSource: bookingTerms`). **Passes** ← `lib/passes.ts` (3, as drafts, fix the "paint, shape or craft" leftover to "paint, craft or create"). **Testimonials**: none (file says MUST NOT SHIP). **Promo codes**, **redirects**: none.
6. **Globals** (`cms/seed/globals.ts`): `site-settings` ← `SITE`, `BRAND_LOGO`, `CONTACT`, `SOCIAL_LINKS`, `NEWSLETTER`, hero route lists; `publicUrl` ← `NEXT_PUBLIC_SERVER_URL ?? SITE.url` — it counts as a **placeholder** until an admin has saved Site details once (`system-state.publicUrlConfirmedAt`, stamped by the `site-settings` `afterChange` when `req.user` is set; `isPlaceholderPublicUrl()` reads it); `navigation` ← `MAIN_NAV`, `PRIMARY_CTA`, `FOOTER_NAV`, `LEGAL_NAV`, menu/footer/search strings (`cms/seed/strings/navigation.ts` copies the component-local literals verbatim with their `file:line` in a comment); `brand-copy` ← `lib/brand.ts`; `booking-settings` ← **`bookingsOpen: false`**, `closedMessage`/`closedCta*` defaults, `bookingTerms` ← `BOOKING_TERMS.paid`, `LOW_SEAT_THRESHOLD`, prefix `MP-`, status copy, checkout/book/confirmation/status/cart strings (`cms/seed/strings/booking.ts`), `passCodeCopy.label: "Pass or promo code"`, `ticket.*` defaults; `template-copy` ← event/programme/policy page literals; `seo-defaults` ← `lib/seo.ts` + `app/robots.ts` disallow list; the five admin globals: defaults only (`payment-settings.mode: test`, `email-settings.provider: log-only`, `invoice-settings` from `SITE.legalName`, `notification-settings` empty, `analytics-settings.enabled: true`, `excludePaths` seeded, `consent.required: true`).
7. **Pages** (`cms/seed/pages.ts`): the **11** `FIXED_PAGE_SLUGS` docs, each with the block instances of §E.1 carrying the exact current strings (copied from the page files with `file:line` comments) and media references by filename; published.
8. **Email templates** (`cms/seed/emailTemplates.ts`, also run by `onInit`): every key in §H.8 with house copy.

Not seeded: users (first admin is created at `/admin`), orders/customers, analytics. A `--reset` flag is refused when `NODE_ENV=production`.

---

## G. Site wiring — Local API, caching, revalidation, draft and live preview

### G.1 Caching model (decision)

**No `cacheComponents`.** The site keeps Next 16's documented previous model: pages are statically prerendered (`generateStaticParams` + Local API reads), shared getters are wrapped in `unstable_cache(fn, key, { tags })`, and Payload hooks call `revalidatePath(path)` for the concrete routes plus `revalidateTag(tag, "max")` for the shared data (verified Next 16.3.4 signature; stale-while-revalidate). This is exactly what the spike proved end-to-end in production mode (`MISS` → fresh render, no rebuild). Reasons not to flip `cacheComponents` now: untested with `withPayload` (G23), it changes the rendering contract of 24 existing routes, and the legacy model already gives on-demand freshness. Each page exports `export const revalidate = 86400` as a safety net only. **`updateTag` is Server-Action-only** (verified: it throws from route handlers) and must never be used in hooks.

```ts
// lib/cms/payload.ts
import { getPayload } from "payload"; import config from "@payload-config";
export const getCms = () => getPayload({ config });            // payload caches the instance

// lib/cms/cache.ts
import { unstable_cache } from "next/cache";
export const TAGS = { experiences: "collection:experiences", sessions: "collection:sessions", venues: "collection:venues",
  programmes: "collection:programmes", policies: "collection:policies", faqs: "collection:faqs", passes: "collection:passes",
  pages: "collection:pages", vibes: "collection:vibes", testimonials: "collection:testimonials", redirects: "collection:redirects",
  site: "global:site-settings", nav: "global:navigation", brand: "global:brand-copy", booking: "global:booking-settings",
  template: "global:template-copy", seo: "global:seo-defaults", analytics: "global:analytics-settings" } as const;
export const cached = <A extends unknown[], R>(key: string, tags: string[], fn: (...a: A) => Promise<R>) =>
  unstable_cache(fn, [key], { tags, revalidate: 86400 });
```

`lib/cms/draft.ts`: `isDraft()` → `(await draftMode()).isEnabled`; getters take `{ draft }` and bypass `cached` when true (`payload.find({ draft: true, overrideAccess: true })`). `lib/cms/mappers.ts` converts Payload docs to the site's existing types (`CreativeExperience`, `Workshop`, `PartnerRecord`, `Policy`, `Pass`, `FaqGroup`, `NavItem`, `ImageAsset {src: media.sizes.plate.url ?? media.url, alt, position from focalPoint}`) so **no component signature changes**; every image mapper tolerates a null upload (§D.1). `lib/cms/redirects.ts::redirectOr404(pathname)` (§D.2).

### G.2 Per-route wiring

| Route | Data (getter → Local API) | Cache tags | Revalidated by | Draft preview | Live preview |
|---|---|---|---|---|---|
| `(site)/layout.tsx` | `navigation`, `site-settings`, `booking-settings` (BottomNav options via `getBookingOptions` → experiences+sessions), `analytics-settings` (beacon + consent + external tags; `ExternalAnalytics` **not mounted** on `/checkout`, `/payment-success`, `/my-bookings`, `/booking-status`, `/dev/**`) | nav, site, booking, experiences, sessions, analytics | globals' `afterChange` → `revalidatePath("/", "layout")` | — | `RefreshRouteOnSave` mounted only when draft mode is on |
| `/` | `pages[home]` blocks + block data (experiences, sessions, venues, programmes, brand-copy) | pages, experiences, sessions, venues, programmes, brand | any of those | ✓ | ✓ |
| `/events` | `pages[events]` + `getCreativeExperiences` + `getAllWorkshops` (sessions) + venues + vibes | pages, experiences, sessions, venues, vibes | same | ✓ | ✓ |
| `/events/[slug]` | `getEventDetail(slug)` (session → experience → `redirectOr404`), related sessions, venue | sessions, experiences, venues, template, booking, redirects | session/experience/venue hooks (`/events/{slug}`, prev slug on rename) | ✓ | ✓ |
| `/events/[slug]/book` | session + booking-settings (+ `?w=` waitlist token passthrough) | sessions, booking | same; `noindex` | — | — |
| `/events/[slug]/opengraph-image` | session/experience image (media file read via Local API, not `public/`) | sessions, experiences | same | — | — |
| `/private-events`, `/private-events/[slug]`, `/private-events/book` | `pages[private-events|private-events-book]`, `programmes`, `experiences[privateEventEligible]`, `venues`, brand-copy steps | pages, programmes, experiences, venues, brand, redirects | programme/experience hooks | ✓ | ✓ |
| `/about`, `/locations`, `/gallery`, `/faq`, `/contact`, `/policies`, `/loyalty` | `pages[slug]` + referenced collections | pages + referenced | hooks | ✓ | ✓ |
| `/policies/[slug]` | `getPolicy(slug)` + template-copy → `redirectOr404` | policies, template, experiences (age tables), redirects | policy hook → `/policies`, `/policies/{slug}`, `/faq`, `/checkout` | ✓ | ✓ |
| `/[...slug]` | single-segment slug regex → `pages` by slug → `redirectOr404` → 404; `dynamic = "force-static"`, `generateStaticParams` from published non-fixed pages, `dynamicParams: true` | pages, redirects | pages hook (incl. `revalidatePath` on create/publish) | ✓ | ✓ |
| `/checkout`, `/payment-success`, `/booking-status`, `/my-bookings` | dynamic (`no-store`): orders via `/api/site/...`; copy from booking-settings | booking | — | — | — |
| `/sitemap.xml` | pages + experiences + sessions (published, future) + programmes + policies (+ `/loyalty` when `passesLive`) | all content | any content hook → `revalidatePath("/sitemap.xml")` | — | — |
| `/robots.txt` | `seo-defaults.robotsDisallow` + `site-settings.publicUrl` | seo, site | `revalidatePath("/robots.txt")` | — | — |
| `/opengraph-image` (default) | site-settings logo (or `seo-defaults.shareImage` when set) | site, seo | layout revalidate | — | — |

Metadata: `buildMetadata` reads `seo-defaults` + `site-settings.publicUrl` (`metadataBase`) through `cached`; per-doc `meta.*` from plugin-seo; `noindex` flag per page.

### G.3 Live seat availability

`components/cms/SeatsLive.tsx` (client) fetches `GET /api/site/availability/{slug}` (`cache: "no-store"`, 60/min per `ipHash`) on mount and `visibilitychange`; response `{ available, bookingStatus, salesCloseAt, holdMinutes, bookingsOpen }`. The static page renders the server verdict; the booking bar caps quantity to the live value and swaps to `WaitlistForm` when `available === 0`. Inventory updates set `context.skipRevalidate`, so **jobs never need to revalidate pages**.

### G.4 Revalidation hook (`cms/hooks/revalidate.ts`)

```ts
import { after } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export const revalidateCollection = (paths: (doc: any, prev?: any) => string[], tags: string[]): CollectionAfterChangeHook =>
  ({ doc, previousDoc, req }) => {
    if (req.context?.skipRevalidate || req.context?.disableRevalidate) return doc;
    if (doc._status !== undefined && doc._status !== "published" && previousDoc?._status !== "published") return doc; // draft autosave
    safeRevalidate(req, tags, paths(doc, previousDoc));
    return doc;
  };

export function safeRevalidate(req: PayloadRequest, tags: string[], paths: string[], layout = false) {
  const run = () => {
    tags.forEach((t) => revalidateTag(t, "max"));
    paths.forEach((p) => revalidatePath(p));
    if (layout) revalidatePath("/", "layout");
    revalidatePath("/sitemap.xml");
  };
  try { after(run); }                                  // request scope (REST, admin server functions): runs after the response → after commit
  catch { void postSignedRevalidate(req, { tags, paths, layout }); }   // no request scope (jobs, CLI): signed loopback call
}
```

**Why `after()`.** Verified in 3.90.2 that both `afterChange` and `afterOperation` run **before** `commitTransaction` (`collections/operations/updateByID.js:215` vs `:226`), so an immediate `revalidatePath` can let a request that lands between purge and commit re-render **old** data and cache it ("I published but the site did not change"). Next 16's `after()` defers the work until the response has been sent, and Payload commits before returning the response. `revalidateTag(…, "max")` additionally gives stale-while-revalidate so any residual stale render is refreshed on the following request. Drafts: the `_status` guard means autosave ticks never purge anything; unpublishing still revalidates.

**Signed fallback** `POST /api/site/revalidate`: called at `http://127.0.0.1:${PORT}` with the public `Host` header (so the request never leaves the box; `PORT`/`HOSTNAME` are set by Next/the process manager, not configuration). `Authorization: Bearer <unix>.<sha256(body)>.<hmac>` with `hmac = sign("revalidate-v1", `${unix}.${sha256(body)}`)`, accepted within ±60 s and rejected if the `(unix, sha256)` pair was already seen (in-memory nonce set, 5-min window). Body `{ tags?: string[], paths?: string[], layout?: boolean }` validated: `paths` match `^/[a-z0-9\-/.]{0,200}$`, `tags ∈ Object.values(TAGS)`. The handler runs `run()` inside a request scope. `scripts/deploy.sh` uses the same endpoint after restart (`{ layout: true }`).

Mapping (collection → paths): `pages` → `/{slug}` (`home` → `/`), plus `/` layout when the page is new; `experiences` → `/`, `/events`, `/events/{slug}`, `/gallery`, `/private-events`, `/private-events/*` (programme pages list activities); `sessions` → `/`, `/events`, `/events/{slug}`, `/events/{slug}/book`, `/events/{slug}/opengraph-image`, `/events/{experience.slug}`, prev slug; `venues` → `/`, `/locations`, `/events`, `/private-events`, each session page at the venue; `programmes` → `/`, `/private-events`, `/private-events/{slug}`, `/private-events/book`; `policies` → `/policies`, `/policies/{slug}`, `/faq`, `/checkout`, `/`(layout: footer legal row); `faqs` → `/faq`, `/`; `passes` → `/loyalty`, `/checkout`; `testimonials`/`vibes` → `/`, `/events`; **`media` → every tag in `TAGS` + layout** (update with file/alt/focal change, or delete — §D.1); **`redirects` → tag `collection:redirects` + `revalidatePath(from)`**; `session-inventory`, `promo-codes`, commerce collections → nothing; globals `site-settings`, `navigation`, `brand-copy`, `booking-settings`, `template-copy`, `seo-defaults`, `analytics-settings` → `revalidatePath("/", "layout")`; the five admin globals → nothing public. Deletes use the same mapping with `previousDoc`.

### G.5 Draft preview and live preview (in-app makes both simple)

- `admin.preview` on the five collections and `admin.livePreview.url` both point to `${publicUrl}/preview?path=<route>&collection=<slug>&id=<id>`.
- `app/(site)/preview/route.ts`: `const { user } = await payload.auth({ headers: await headers() })` (the admin's `payload-token` cookie is same-origin because Payload is in-app) → if `user` is staff, `(await draftMode()).enable()` and `redirect(path)`; else 401. **`path` is validated** (`^/(?!/)[A-Za-z0-9\-_/.?=&%]*$`, and rejected when it contains `//`, `\\` or a scheme) — it is attacker-controlled and would otherwise be an open redirect usable in phishing against staff. `exit-preview/route.ts` disables draft mode and applies the same validation. Unit test for both.
- Pages call getters with `draft: isDraft()`; draft mode makes the route dynamic per request automatically.
- `components/cms/LivePreviewListener.tsx` = `RefreshRouteOnSave` from `@payloadcms/live-preview-react` (`router.refresh()` on every save/autosave); mounted in `(site)/layout.tsx` only when draft mode is enabled.
- **Click-to-edit** (our own protocol; `@payloadcms/live-preview` 3.90.2 ships none): `BlockRenderer` wraps each block in `<section data-cms-block={block.id} data-cms-path={`blocks.${i}`} data-cms-global={…}>`; `ClickToEdit.tsx` (client, only in draft mode inside an iframe) shows an "Edit" pill on hover and on click posts `window.parent.postMessage({ type: "maison:focus", path, global?: "brand-copy" | "booking-settings" | … }, publicUrl)` — `global` is set when the section's text is in "use Brand wording" mode (§E); `cms/components/admin/FocusListener.tsx` (admin `providers`) listens: with `global` it navigates to `/admin/globals/{global}#field-{path}`; otherwise it does `document.getElementById("field-" + path.replace(/\./g, "__"))?.scrollIntoView({ block: "center" })` + a 1.2 s highlight class. Both ends are ours; if Payload's field ids ever change the pill degrades to opening the document in a new tab.
- **Find text…** (⌘K command, §I): `GET /api/actions/find-text?q=` (editor+) scans the six content globals and every published/draft `pages` blocks tree plus `title/name/description/excerpt` of the content collections for a case-insensitive phrase and returns `{ where: "Brand wording → tagline", href: "/admin/globals/brand-copy#field-tagline" }[]`, so "where does this sentence live?" has an answer inside the admin.

---
## H. Commerce flows

Money: integer fils; Mamo boundary `amount = fils / 100` (2 dp), `Math.round(amount * 100)` back. Minimum Mamo link AED 2 (200 fils), minimum refund AED 1. AED only. All public writes go through our endpoints; generic REST can never create an order (`access.create: systemOnly`). Every `/api/site/**` route is rate-limited per route through `cms/lib/rateLimit.ts` (in-memory token buckets keyed by `ipHash`, client IP = **last** `X-Forwarded-For` hop appended by our proxy): `checkout/start` 10/min, `checkout/quote` 30/min, `orders/lookup` 10/h per `ipHash+email`, `availability/*` 60/min, `analytics/collect` 120/min + body ≤ 1 KB, `enquiries` 5/h, `waitlist` 5/h, `my-bookings/request` 3/15 min per `ipHash` **and** per lowercased email, `my-bookings/consume` 10/min, `webhooks/mamo` 60/min, `revalidate` 30/min.

### H.1 Order state machine (`cms/lib/orderState.ts::transition(req, order, to, detail)`)

`pending_payment → awaiting_payment` (link created) → `confirming` (captured, verified — or desk/pass-only orders directly) → `confirmed` → `completed` (nightly, after last session ends). Side exits: `pending_payment|awaiting_payment → failed` (link error / `payment.failed` / `payment.voided`; hold kept until expiry so the customer can retry), `awaiting_payment|failed → expired` (hold timer, no capture, Mamo link deactivated, pass credits and promo use restored), `confirmed → cancelled` (staff action or session cancellation, with refund), `confirmed → refunded` (full refund) / stays `confirmed` with timeline note on partial, `expired → confirmed` if a late capture can re-acquire seats, else stays `expired` + refund `post_expiry_payment` + `needsReview`. **Move to another session** keeps `confirmed` and appends a `moved` timeline entry. Only `transition()` may change `status` (a `beforeChange` rejects writes without `context.orderTransition`); every edge appends to `timeline` and stamps `*At`.

### H.2 Payment attempt states

`created → link_ready → captured → refund_pending → refunded | partially_refunded`; `link_ready → failed | expired | voided`; Mamo `processing|confirmation_required → processing`. One `payments` row per attempt; `orders.payment` points at the current one; a retry after `failed` creates a new row and deactivates the old link. Desk orders get one `provider: "desk"` row created directly as `captured` with `method.type ∈ {cash, card_terminal, complimentary, bank_transfer}`.

### H.3 Checkout (`POST /api/site/checkout/start`, `app/(site)/api/site/checkout/start/route.ts` → `cms/lib/orders.ts::startCheckout`)

1. zod-validate `{ basketId: uuid, lines[], details, codes[] (≤3), consents[], waitlistToken? }`; rate-limit; refuse when `booking-settings.bookingsOpen !== true` (503 `{ reason: "bookings_closed" }` — the UI never shows a Pay button while closed, so this is only a guard) or the gateway is disabled (503 `{ reason: "gateway_disabled" }`). **Basket reuse**: an existing `pending_payment|awaiting_payment` order with the same `basketId` **and** lowercased email whose hold has not expired is re-used — its old link is deactivated and a new one issued — instead of creating a second order holding seats twice (self-inflicted sell-outs on double-submit).
2. `payload.db.beginTransaction()`; upsert `customers`; **re-price every line from the DB** (`cms/lib/pricing.ts::quote`): `priceFils` from the session/pass; then **at most one promo code** + any pass credits, both reserved **atomically inside this transaction** (treat credits like seats):
   - promo: `UPDATE promo_codes SET uses = uses + 1 WHERE id = $1 AND active AND (max_uses IS NULL OR uses < max_uses) AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()) RETURNING uses` after checking `appliesTo` and `minSpendFils` in code; no row → the code is reported as `exhausted|expired` in `rejectedCodes` and pricing continues without it;
   - pass credits: per `pass-purchases` row for that email, `UPDATE pass_purchases SET sessions_remaining = sessions_remaining - $n WHERE id = $1 AND status = 'active' AND (expires_at IS NULL OR expires_at > now()) AND sessions_remaining >= $n RETURNING sessions_remaining`; successes are recorded on `orders.passRedemptions[] { passPurchase, n }`, `lines[].passCredits` and `pass_purchases.redemptions[] { order, n, at }`;
   - then VAT split per line (`netFils = round(gross × 10000 / (10000 + vatRateBps))`, `vatFils = gross − net`).
3. Create order (`pending_payment`, `channel: "online"`), then per session line `acquireSeats(req, sessionId, qty, { allowWaitlist: validWaitlistTokenFor(sessionId, email) })` and a `seat-holds` row (`expiresAt = now + holdMinutes`); commit. `SoldOut` → 409 with the live count (the transaction rollback also returns the promo use and pass credits).
4. `grossFils === 0` (fully covered by pass credits or a 100 % promo) → `transition(confirming)` → `payload.jobs.queue({ workflow: "finalize-order", input: { orderId }, req })`; respond `{ reference, paid: true, k }`.
5. Else `gateway.createLink({...})` (body: §02 B5 with `return_url = {publicUrl}/payment-success?ref={ref}&k={k}`, `failure_return_url = {publicUrl}/checkout?ref={ref}&payment=failed`, `external_id = reference`, `custom_data = { orderId, orderRef, mode }`, `capacity: 1`, prefill, `payment_methods`, `enable_tabby`, `send_customer_receipt`, `terms_and_conditions_url`), where **`k = <exp>.<b64url(hmac("return-v1", `${ref}|${exp}`))>` with `exp = now + 24 h`** (verified with expiry; nothing is valid forever); `payments` row `link_ready`; `transition(awaiting_payment)`; respond `{ reference, paymentUrl, holdExpiresAt }`. On link failure: `transition(failed)`, keep hold, 502 with retry.
6. Browser `location.assign(paymentUrl)`. Funnel events `checkout_started`, `payment_redirect` beaconed (no query strings).

**Inventory** (`cms/lib/inventory.ts`, table `session_inventory` joined to `sessions`) — single guarded statement inside the transaction, via `req.payload.db.execute({ db: txDb(req), sql })`:

```sql
UPDATE session_inventory i
   SET seats_held = i.seats_held + $qty, updated_at = now()
  FROM sessions s
 WHERE i.session_id = s.id AND s.id = $sessionId
   AND s._status = 'published'
   AND (s.booking_status = 'open' OR (s.booking_status = 'waitlist' AND $allowWaitlist))
   AND coalesce(s.sales_close_at, s.starts_at) > now()
   AND s.seats_total - i.seats_sold - i.seats_held >= $qty
RETURNING s.seats_total - i.seats_sold - i.seats_held AS remaining;
```

`releaseSeats` (`seats_held = greatest(0, seats_held − qty)`), `consumeSeats` (`seats_held = greatest(0, seats_held − qty), seats_sold = seats_sold + qty`), `refundSeats` (`seats_sold = greatest(0, seats_sold − qty)`) likewise, each `WHERE session_id = $id`. Row-level locking serialises concurrent updates on the same inventory row; the second re-evaluates `WHERE` after the first commits. Draft, unpublished or never-published sessions can never be booked (`_status`), and editor saves never touch this table (§D.2). After `releaseSeats`/`refundSeats` on a session that is `waitlist` or had `seatsAvailable === 0`, queue `waitlist-notify { sessionId, freedSeats }`. The boot assertion (§D.7) checks both tables' column names.

**Desk bookings** (`POST /api/actions/orders/manual`, admin + front-desk; `CreateBookingDialog` on the Orders list and on a session): `{ sessionId, qty, customer { firstName, lastName, email?, phone? }, method: cash | card_terminal | complimentary | bank_transfer, amountFils?, note?, codes[] }` → the same `startCheckout` with `channel: "desk"` (pricing, promo/pass reservation, `acquireSeats` with `allowWaitlist: true` for staff, no hold) → `payments` row `{ provider: "desk", status: "captured", method.type, amountFils }` → `transition(confirming)` → `finalize-order` (tickets, invoice with `paymentLabel` "Paid at venue (cash)" / "Card terminal" / "Bank transfer" / "Complimentary", confirmation email when an email was given). `complimentary` prices every line at 0 (a 100 % discount line "Complimentary"); for the other methods `amountFils` defaults to the quote and may be overridden by **admin only** (recorded as a "Desk adjustment" discount line). Analytics and the dashboard show the online/desk channel split.

### H.4 Mamo Pay gateway (`cms/lib/mamo/*`)

`getPaymentGateway(req, { forceMode? })` reads `payment-settings` with `context.internalRead`; `mode === "mock"` or no key → `MockMamoClient` only when `NODE_ENV !== "production"`, otherwise `disabledGateway(reason)` (checkout 503, admin banner). `MamoClient` is the fetch-based client of `02` B3 (Bearer auth, 15 s timeout, GET retries with capped backoff, `MamoApiError` envelope — **`MamoApiError` carries `status`, `errorCode`, `messages`, `errors` only, never request headers or bodies**). The `/webhooks` responses are mapped through `redactWebhook(w) => ({ ...w, auth_header: w.auth_header ? "[set]" : null })` before storage (`lastConnectionCheck`) or display (**List Mamo webhooks**), because Mamo returns `auth_header` in clear. Base URLs: sandbox `https://sandbox.dev.business.mamopay.com/manage_api/v1`, live `https://business.mamopay.com/manage_api/v1`. Mock: in-memory + `payment-events` mirror; hosted page `app/(site)/dev/mamo-mock/pay/[id]` with Pay/Fail/Abandon that POSTs a Mamo-shaped payment object to our real webhook route with the mock auth header and redirects with `createdAt&paymentLinkId&status&transactionId` appended exactly as Mamo does.

### H.5 Webhook (`POST /api/site/webhooks/mamo`) and verification

0. Rate limit 60/min per `ipHash` → 401 with an empty body on excess. Read the raw body up to 256 KB (abort beyond). **No JSON parsing before the auth check** beyond this read.
1. Identify the mode by matching the presented header (`Authorization` with optional `Bearer `, else `X-Auth-Header`, else any header whose value equals a secret — then record `observedAuthHeaderName` on the first verified delivery) against `test|live.webhookAuthHeader` and the `previous…` within grace, constant-time.
2. **No match** → store a **minimal** `payment-events` row: `verified: false`, `receivedAt`, `ipHash`, `headerNames` (names only), `eventType`/`providerPaymentId` parsed defensively from the first 1 KB, `bodyExcerpt` (first 1 KB) — capped at **500 unverified rows per day** (beyond that only an in-memory counter) — and return 401. When unverified deliveries exceed **50/h**, `notifyStaff("webhook_unverified_spike")` once per hour: that is both an abuse signal and the signal that Mamo's header name differs from what we expect.
3. Verified → `JSON.parse`; require `id` and `event_type` (`payment.*` or `dispute.*`); anything else → 200 "ignored", no row.
4. **Claim** (idempotency that survives our own failures): one statement — `INSERT INTO payment_events (…) VALUES (…) ON CONFLICT (dedupe_key) DO UPDATE SET processing_started_at = now() WHERE payment_events.processed_at IS NULL AND (payment_events.processing_started_at IS NULL OR payment_events.processing_started_at < now() - interval '2 minutes') RETURNING id`. No row returned ⇒ 200 "duplicate" (already done, or being processed right now). Row returned ⇒ process it. `headers` are stored only here, with the value of **every header that matched a secret** (current or previous, any mode) plus `authorization`, `cookie`, `x-auth-header` replaced by `"[redacted]"`.
5. `dispute.*` events: store, resolve the order by `payment_id`/`external_id` if present (shape **UNVERIFIED** — stored raw), set `orders.disputed = true`, `needsReview('dispute')`, `disputeStatus = event_type`, `notifyStaff("dispute")`, badge "Disputed" on the order; `processedAt`; 200.
6. **Verify-by-fetch**: `gateway(mode).getPayment(body.id)`; act only on the fetched object. Resolve order by `external_id` (reference) → `custom_data.orderId` → `payment_link_id`; none → `needsReview('no_order')`, `processedAt`, 200.
7. `applyPaymentSnapshot(req, order, payment, { source: "webhook", mode, eventId })` inside a transaction with the order row locked. **First line:** `if (order.mode !== mode || payment.payment_link_id !== currentPayment.providerLinkId) → needsReview('mode_or_link_mismatch'), return` (a sandbox event can never touch a live order after a mode switch, or vice versa). Then: `captured` → assert `amount_currency === "AED"` + `mamoAmountToFils(amount) === totals.grossFils` (mismatch → payment `failed(amount_mismatch)`, `needsReview`, staff alert) → `consumeSeats`, payment `captured`, `transition(confirming)`, `payload.jobs.queue({ workflow: "finalize-order", input: { orderId: order.id }, req })`; `failed` → payment + order `failed`, keep hold until expiry, email `payment_failed` with retry link; **`voided`** → handled like `failed` (payment `voided`), no email unless a capture had been recorded, in which case `needsReview('voided_after_capture')`; `refund_initiated|refunded|refund_failed` → `syncRefunds`; `processing|confirmation_required` → leave, poller revisits. Copy card/settlement fields.
8. Set `processedAt` and return 200. **Our own failure** (Mamo timeout, DB error) → set `error`, leave `processedAt` null, return 5xx: Mamo's retry re-claims the row after 2 minutes (step 4), and `reconcile-payments` also revisits rows with `processed_at IS NULL AND received_at < now() − 5 min` (§H.6), so a lost retry is never a lost sale or a missed refund.

Registration from the admin (`POST /api/actions/payments/register-webhook`, admin; preconditions in §C.3): mint a 40-char URL-safe secret, store encrypted under `<mode>.webhookAuthHeader`, `POST|PATCH /webhooks { url: {publicUrl}/api/site/webhooks/mamo, enabled_events: [payment.succeeded, payment.failed, payment.refund_initiated, payment.refunded, payment.refund_failed, payment.voided, dispute.received, dispute.evidence_submitted, dispute.expired, dispute.closed, dispute.won, dispute.lost], auth_header }`, store id/url/time (through `redactWebhook`). Rotate = new secret + PATCH + 10-min grace for the old one. The dashboard flags a registered URL that no longer starts with `site-settings.publicUrl`.

Return page `/payment-success?ref&k`: `k` (with its `exp`) is required for line details; if the order is not yet `confirmed` and Mamo appended `transactionId`, call `GET /payments/{transactionId}` and apply the same snapshot immediately (02's path); otherwise poll `GET /api/site/orders/{ref}/status` every 3 s up to 3 min — **without `k` the endpoint returns only `{ status, holdExpiresAt }`; with a valid `k` it adds `lines`, `tickets`, `invoiceAvailable`**. Renders Confirmed (tickets, "invoice emailed"), Processing, or Not paid (back to checkout; basket kept client-side). `/checkout?ref&payment=failed` shows Mamo's customer-facing decline text and retries on the **same order** with a new link. `ExternalAnalytics` is not mounted on this route and it carries `Referrer-Policy: no-referrer` (§A.4), so `k` never reaches a third party.

### H.6 Reconciliation and expiry jobs

`expire-holds` (every minute, exclusive): released expired `seat-holds` → `releaseSeats`; order `awaiting_payment|failed` past `hold.expiresAt` → `expired`, `PATCH /links/{id} { active: false }`, **restore pass credits (`sessions_remaining + n`, `redemptions[].restored = true`) and promo `uses − 1`**; `waitlist` rows `notified` past `tokenExpiresAt` → `expired` and `waitlist-notify` re-queued when seats remain. `reconcile-payments` is **scheduled every minute** (`* * * * *`; cron expressions are fixed at `buildConfig` time — verified `_initializeCrons` instantiates `croner` jobs once per process — so the interval cannot be re-planned from a hook) and **returns early unless `payment-settings.reconciliation.enabled` and `now − lastRunAt ≥ everyMinutes`**; when it runs (active mode only, exclusive): `awaiting_payment` orders older than 90 s → `GET /links/{linkId}` → every `charges[]` entry through `applyPaymentSnapshot` (lost webhook = a few minutes' delay, never a lost sale); `payment-events` with `processed_at IS NULL AND received_at < now() − 5 min` → re-run steps 6–8; `confirming` older than 10 min → re-run finalize; open refunds (`processing`) → `GET /payments/{id}` → `syncRefunds`; `confirmed` in last 48 h with stale settlement → refresh (cap 20); write `lastRunAt/Summary`; alert on any `captured` charge that could not be applied. Payment after expiry: try `acquireSeats` again → all succeed → confirm; else refund in full (`post_expiry_payment`) + customer email + staff alert.

### H.7 Invoices, tickets, refunds, check-in, session operations

- **Invoice numbering** gapless per Dubai calendar year: `INSERT INTO invoice_counters … ON CONFLICT (kind, year) DO UPDATE SET last = last + 1 RETURNING last` in the invoice's own transaction (`cms/lib/invoiceNumber.ts`; the unique composite index is declared on the collection, §D.3). Number `MP-INV-2026-000123`; credit notes `MP-CN-…` on refunds. Content: "Tax Invoice" when TRN set (else "Receipt"), seller block from `invoice-settings` snapshot, buyer, lines (net, VAT 5 %, gross), discount lines (promo / pass credits / desk adjustment / complimentary), totals, order reference, `paymentLabel` (+ Mamo payment id when online), "Prices include 5% VAT". PDF with pdfkit (`cms/lib/pdf/invoice.ts`; fonts from `invoice-settings.pdfFonts` cached by file hash, Inter fallback; logo PNG from media), stored as `invoice-files`; customers download **only** via `app/(site)/api/site/invoices/[id]/pdf/route.ts` (`?sig&exp`, `exp ≤ 30 d`, constant-time check, reads `private/invoices` directly, `Content-Disposition: attachment`).
- **Tickets**: one row per seat; `code = "MPT-" + base32(randomBytes(5))`; at issue `qrSig = b64url(hmac256(hkdf(PAYLOAD_SECRET, "maison-palettia", "tickets-v1"), code)).slice(0, 22)` is computed **once and stored**; `qr = mp1.<code>.<qrSig>`. **Verification is by lookup**: indexed find by `code`, then `timingSafeEqual(stored qrSig, presented)` — the database is the authority, so rotating `PAYLOAD_SECRET` (or rebuilding the server) never invalidates printed or emailed tickets; the signature only stops random-code enumeration. PDF on demand (`cms/lib/pdf/ticket.ts`: session, time in Dubai, venue, holder, code, QR PNG via `qrcode`, logo, `booking-settings.ticket.*` lines), attached to the confirmation and downloadable at `/api/site/tickets/{code}/pdf?sig&exp`.
- **Refunds**: **Refund** action on an order (`OrderActions` → `POST /api/actions/orders/{id}/refund`, admin + front-desk): amount ≤ live `max_refund_amount` from `GET /payments/{id}`, ≥ AED 1; `refunds` row `requested` with `idempotencyKey` **before** anything else (double-click guard 60 s); `refunds.afterChange (create, requested)` → `notifyStaff("refund_requested")` and the dashboard tile "Refunds awaiting approval"; only admin approves (`POST …/refunds/{id}/approve`) → `process-refund` job. **`process-refund` (3D)**: `retries: 0`, `concurrency: ({ input }) => `payment:${input.paymentId}`` (exclusive per payment; `enableConcurrencyControl` is on from Phase 1), and in order: (a) in its own transaction move the row `approved → processing` with `providerRequestAt = now()` — if the row is not `approved` the task exits (a stuck `processing` row is resolved **only** by `syncRefunds`, never by re-posting); (b) `GET /payments/{id}` and, if `refunds[]` already contains an entry created at/after `providerRequestAt − 2 min` with the same amount, mark `succeeded` with that id **without posting** (Mamo has no `Idempotency-Key`, 02 §A10); (c) else `POST /payments/{id}/refunds { amount }`; (d) webhooks/poller reconcile `refunds[]`; on success: credit note, void tickets, `refundSeats` if `releaseSeats`, `order_refunded` email, staff alert `refund`. Desk-channel refunds: the row is created `requested` with `providerRefundId: "desk"`; after repaying at the desk an admin clicks **Mark repaid** (→ `succeeded`, credit note, tickets voided).
- **Move to another session** (`POST /api/actions/orders/{id}/move { targetSessionId, priceDifference: no_charge | collect_at_venue | refund_difference, note? }`, admin + front-desk; `MoveOrderDialog`): target must be a published session of the **same experience** with enough seats; in one transaction `acquireSeats(target, qty)` + `consumeSeats(target, qty)` and `refundSeats(source, qty)`; old tickets `void`, new tickets issued (new codes); `lines[]` updated (session, startsAt, venueName); `order_moved` email with the new tickets; timeline note; `refund_difference` creates a `refunds` row `requested` for the difference; `collect_at_venue` writes the amount into `internalNotes` and the timeline.
- **Cancel session & refund all** (`POST /api/actions/sessions/{id}/cancel { reason, message? }`, admin; `SessionActions`): `bookingStatus: closed`, `cancelledAt`, `cancelReason`; for every `confirmed` order with lines on it: a `refunds` row **`approved`** (reason `session_cancelled`, amount = those lines' gross) → `process-refund` (desk orders → `requested` for manual repayment); tickets `void`; `refundSeats`; `waitlist` rows → `cancelled`; `session_cancelled` email to each customer (with `message`); timeline entry on each order; the session page revalidates to the closed state.
- **Reschedule** (`POST /api/actions/sessions/{id}/reschedule { startsAt, venueId?, message? }`, admin): updates the session with `context.reschedule` (the only way past the §D.2 guard), regenerates the slug (the old URL is redirected automatically by `slugRedirect`), resets `reminderSentAt` on the session and its tickets, emails `session_rescheduled` to every ticket holder (one per order, with `message`), appends a timeline entry to each order, revalidates.
- **Repeat…** (`POST /api/actions/sessions/{id}/repeat { every: "weekly", until, weekdays[] }`, editor+; `RepeatDialog`): creates up to 26 **drafts** with `startsAt` shifted to each matching date/time, slugs regenerated, `reminderSentAt`/`cancelledAt` null, inventory rows created at 0; returns the list for review before publishing.
- **Check-in**: `POST /api/actions/tickets/check-in { qr | code, device, force? }` (admin + front-desk): lookup by `code` first, then constant-time `qrSig` compare; verdicts `ok | already_checked_in | void | refunded | wrong_day | not_found` (never throws); **`force` overrides only `wrong_day` and `already_checked_in`** — `void`, `refunded`, `not_found` are never forceable; a forced check-in stores `checkInForced: true` and `checkedInBy`, and forced check-ins are listed in the ops section of `/admin/analytics`. Response includes holder, session, seat n of qty, remaining tickets on the order. `/admin/check-in` view (`cms/views/checkIn.tsx`, `DefaultTemplate`, roles admin + front-desk) lists today's sessions with checked/sold and mounts `Scanner` (`@yudiel/react-qr-scanner`, `formats={["qr_code"]}`, manual code input fallback, audible/vibration feedback, last-10 list). Requires HTTPS for the camera. **Attendee list** (`cms/components/sessions/AttendeeList.tsx`, on the session and from the check-in view): holder name, order reference, seat n/qty, phone/email (staff), order notes, checked-in state; print CSS; CSV via `GET /api/actions/sessions/{id}/attendees.csv`; per-ticket **Mark as arrived** toggle → the check-in endpoint with `{ code, device: "manual" }` (undo: admin only, with a note).

### H.8 Email

Runtime `EmailAdapter` (`cms/lib/mailer.ts`) returns **`defaultFromAddress: "no-reply@localhost"`, `defaultFromName: "Maison Palettia"`** as placeholders (Payload's auth emails read them) and its `sendEmail` **always replaces `from`/`replyTo`/`bcc`** with the current `email-settings` values before transport (nodemailer transport cached by settings hash; Resend client; `log-only` skips). Pipeline `sendTemplated({ key, to, vars, refs, attachments?, req })` → render **now** (Lexical → HTML via `convertLexicalToHTML`, HTML-escaping `{{var}}` interpolation, plain-text alternative, shell `cms/email/layout.ts` with logo/contact from site-settings) → `notification-log` row `queued` carrying the rendered `html`/`text` (`access.read: isAdminField`) and **redacted** `variables` (§D.5) → job `send-email { logId }` (queue `email`, 5 retries exponential from 30 s; final failure → `notifyStaff("job_failed")` unless the failing send *is* a staff notification, which only logs). Job inputs carry ids only. **Resend** on a log row re-sends the stored HTML; after the 30-day purge the button is disabled ("Expired — use the order's Resend action", which renders afresh).

Template keys (`email-templates.key`, seeded): customer — `order_confirmation` (+invoice, +tickets), `payment_failed`, `ticket_reminder_24h` (15-min sweep over sessions starting in 23–25 h, stamped idempotent), `order_refunded`, `order_cancelled`, `order_moved` (+tickets), `session_rescheduled`, `session_cancelled`, `post_expiry_payment`, `magic_link`, `enquiry_received`, `waitlist_joined`, `waitlist_seat_available`; staff — `staff_login_link` (invite + password reset), `admin_new_order`, `admin_failed_payment`, `admin_refund_requested`, `admin_refund`, `admin_dispute`, `admin_new_enquiry`, `admin_waitlist_joined`, `admin_job_failed`, `admin_low_seats`, `admin_settings_changed`, `admin_webhook_unverified_spike`, `admin_daily_digest`; `test`. Staff notifications filter `notification-settings.recipients` by subscribed event; `low_seats` uses `booking-settings.lowSeatThreshold` unless `notification-settings.lowSeatsOverride` is set.

### H.9 Jobs config (`cms/jobs/index.ts`)

`autoRun: [{ cron: "*/20 * * * * *", queue: "email", limit: 20 }, { cron: "* * * * *", queue: "default", limit: 25 }]`, `shouldAutoRun` reads `site-settings.jobsEnabled`, **`enableConcurrencyControl: true` from Phase 1** (it adds an indexed `concurrencyKey` column, so it belongs in the initial migration), `deleteJobOnComplete: false` (purged after 14 d), **`access: { run: isAdmin, queue: isAdmin, cancel: isAdmin }`** (defaults would let any logged-in editor queue/cancel; public endpoints queue through the Local API with `overrideAccess: true`), `jobsCollectionOverrides` adds a **Retry** button (`cms/components/jobs/RetryButton.tsx`, 3D) and shows `payload-jobs` under "System". `runJobs` executes a picked batch with `Promise.all` and overlapping `autoRun` ticks can pick new jobs, so **exclusivity comes only from concurrency keys**: `concurrency: () => "<task-slug>"` on `expire-holds`, `reconcile-payments`, `send-reminders`, `rollup-analytics`, `reconcile-inventory`, `complete-orders`, `purge-retention`, `send-daily-digest`; `concurrency: ({ input }) => `order:${input.orderId}`` on `finalize-order`, `issue-tickets`, `issue-invoice`, `generate-invoice-pdf`; `payment:${paymentId}` on `process-refund`; `session:${sessionId}` on `waitlist-notify`.

| Task / workflow | Trigger | Queue | Retries | Notes |
|---|---|---|---|---|
| `expire-holds` | `* * * * *` | default | 0 | holds, expiry, credit/promo restore, waitlist token expiry (§H.6) |
| `finalize-order` (workflow, `input: { orderId }`) | capture / desk / pass-only | default | workflow 3 | `issue-tickets` → `issue-invoice` → `generate-invoice-pdf` → send `order_confirmation` → `notify-staff(new_order)` → pass/waitlist bookkeeping (mark `converted`); each step idempotent |
| `send-email` (`{ logId }`) | `sendTemplated` | email | 5, exp. from 30 s | |
| `send-reminders` | `0 */15 * * * *` | default | 0 | idempotent by stamp |
| `reconcile-payments` | `* * * * *` (gated by `everyMinutes`/`enabled`) | default | 0 | §H.6 |
| `process-refund` (`{ refundId, paymentId, orderId }`) | refund `approved` | default | **0** | §H.7 idempotency protocol |
| `waitlist-notify` (`{ sessionId, freedSeats }`) | seats released | default | 2 | FIFO, 24-h token (§H.11) |
| `issue-tickets`, `issue-invoice`, `generate-invoice-pdf`, `notify-staff` | workflow / actions | default | 3 | |
| `complete-orders` | `0 0 1 * * *` | default | 0 | |
| `reconcile-inventory` | `0 15 1 * * *` | default | 0 | recompute `session_inventory` from tickets/holds; alert on drift |
| `send-daily-digest` | **`0 0 * * * *` (hourly)**, runs only when the Dubai hour equals `dailyDigestHour` and `system-state.lastDigestDay !== today` | email | 1 | |
| `rollup-analytics` (4A) | `0 7 * * * *` | default | 1 | |
| `purge-retention` (4A; was `purge-analytics`) | `0 30 2 * * *` | default | 0 | raw analytics > `rawRetentionDays`; `notification-log.variables/html/text` > 30 d; completed `payload-jobs` > 14 d; unverified `payment-events` > 30 d |

3D registers only the Phase 3 tasks; 4A adds `rollup-analytics` and `purge-retention` in Phase 4.

### H.10 Guest access, status page

No customer accounts. `/booking-status` requires reference **and** email (`POST /api/site/orders/lookup`, 10/h per `ipHash+email`). `POST /api/site/my-bookings/request { email }` (3/15 min per `ipHash` **and** per lowercased email) always 200; sends `magic_link` with `${publicUrl}/my-bookings?t=<token>` (`token = b64url(customerId.exp).hmac`, HKDF info `magic-link-v1`, 30 min). **Consumption is a POST** (mail scanners such as Outlook SafeLinks prefetch GETs and would burn a single-use token): `GET /my-bookings?t=` renders a minimal page with a "Continue to my bookings" button — an auto-submitting form that POSTs `t` to `/api/site/my-bookings/consume`; only the POST checks `lastMagicLinkIssuedAt` (single use), sets the cookie and `303`s to `/my-bookings`, so the token never stays in the address bar or browser history. Cookie: **`__Host-mp_session=<customerId>.<exp>.<sessionVersion>.<hmac>; Secure; HttpOnly; SameSite=Lax; Path=/`** (30 d; HKDF info `session-v1`; plain `mp_session` without `Secure` only when `NODE_ENV !== "production"`); every read checks `sessionVersion === customers.sessionVersion`, and the admin action **Sign out everywhere** on a customer bumps it. The page (dynamic, `no-store`) lists orders → status, tickets (signed PDF links), invoices (signed), cancellation hints from policy, and a "request a change" mailto/WhatsApp. `ExternalAnalytics` is never mounted here and the route sends `Referrer-Policy: no-referrer`.

### H.11 Enquiries and waitlist (public endpoints)

- `POST /api/site/enquiries` (zod, honeypot `website` → silent 200 + `meta.honeypotTripped`, 5/h per `ipHash`, `context.viaEnquiryEndpoint`, refused with 503 when `site-settings.enquiriesEnabled` is off); the forms' existing success branch is used. `ENQUIRY_CONFIGURED` becomes **`site-settings.enquiriesEnabled` only** — enquiries are always stored; the dashboard warns when nobody is subscribed to `new_enquiry`.
- `POST /api/site/waitlist { sessionSlug, name, email, phone?, qty }` (`app/(site)/api/site/waitlist/route.ts`; zod, honeypot, 5/h per `ipHash`, `context.viaWaitlistEndpoint`): one row per session+email (a repeat updates `qty`), `position` = count of earlier `waiting` rows + 1, customer ack `waitlist_joined` (if enabled), `notifyStaff("waitlist_joined")`; shown by the booking bar as `WaitlistForm` when `bookingStatus === "waitlist"` or `seatsAvailable === 0` (and `bookingsOpen`). Front-desk can add a caller directly in the admin.
- **`waitlist-notify`** (`{ sessionId, freedSeats }`): walks `waiting` rows FIFO while `qty ≤ remaining freed seats`; for each sets `notified`, `notifiedAt`, `token`, `tokenExpiresAt = now + 24 h` and emails `waitlist_seat_available` with `/events/{slug}/book?w={token}` — **seats are not reserved** (first come, first served, stated in the email); the token lets `startCheckout` call `acquireSeats` with `allowWaitlist` while the session is still `waitlist`. `expire-holds` marks `notified` rows past `tokenExpiresAt` as `expired` and re-queues `waitlist-notify` when seats remain; `finalize-order` marks the row `converted` (+ `convertedOrder`) when an order for that session+email confirms.

### H.12 Exports (admin)

`GET /api/actions/exports/{orders|invoices|customers|tickets|enquiries}.csv?from=YYYY-MM-DD&to=YYYY-MM-DD` (admin only; UTF-8 with BOM; Dubai-local dates; fils rendered as AED with 2 dp; orders/invoices include `net`, `vat`, `gross`, `discount`, `channel`, `paymentMethod`, `promoCode`, `passCredits`, `status`, `reference`, `invoiceNumber`), streamed with cursor pagination (500 rows per page) via `cms/lib/exports.ts`. The analytics view hosts `ExportCsv` (from/to pickers + kind) and a **"VAT summary for period"** tile (`analyticsQueries.vatSummary(from, to)`: gross, net, VAT, credit notes, invoice count) for the accountant and the FTA return.

---
## I. Admin ease-of-use

| Feature | Implementation |
|---|---|
| **Branding** | `custom.scss` maps Payload `--theme-*` to Deep Lilac/charcoal/cream; `Logo`/`Icon` components read `site-settings` logos (fallback `/images/logo.png`); `admin.meta.titleSuffix`; `theme: "light"`. |
| **Settings menu** | Two groups with plain labels and one-line descriptions in the order of §C.3 ("Site details", "Menus & footer", "Brand wording", "Booking & checkout wording", "Page labels", "Search & sharing defaults" · admin: "Payments (Mamo Pay)", "Email sending", "Invoices & VAT", "Who gets notified", "Analytics & tracking"). |
| **Dashboard warnings** (`beforeDashboard: Warnings`, also rendered as a slim bar on every admin page via `providers`) | Red: "Encrypted settings cannot be read — the server secret changed…" (canary); "Background tasks are paused — emails and payments will not be processed" (`jobsEnabled` false); "Webhook points at an old address — re-register" (registered URL ≠ `publicUrl`); open disputes; unverified-webhook spike. Amber: "Email is not set up — customers will not receive confirmations, tickets or invoices, and staff cannot reset passwords" (log-only / unverified); "Site address not confirmed yet" (`isPlaceholderPublicUrl`); "Nobody is emailed about new enquiries / failed payments"; `needsReview` orders; failed jobs/notifications. Info: "Online bookings are closed — Book buttons show '{closedMessage}'" (`bookingsOpen` false); payments mode badge TEST/LIVE/MOCK (MOCK also as a site-wide banner). |
| **Dashboard** (`beforeDashboard: Dashboard`) | KPI tiles: today's orders & revenue (online/desk split), next 7 days' sessions with seats left/sold, new enquiries, **refunds awaiting approval**, failed notifications/jobs (admin only); quick links: New session, Create desk booking, Check-in, Analytics, Settings → Payments/Email. |
| **Analytics view** `/admin/analytics` | §D.6 data; period 7/30/90 **or custom from/to**; traffic (views/visitors per day, top pages, referrers, device/browser), funnel (event views → checkout started → redirect → paid), sales (admin only: orders, gross/net/VAT, tickets, AOV, refunds, promo redemptions, channel split, fill rate per session, top experiences), **VAT summary for period** + **Export CSV** (§H.12), ops (notification failures, failed jobs, holds expired vs converted, forced check-ins, disputes). Inline SVG charts, no chart lib. Editors see traffic only; front-desk none. |
| **Command palette** (`beforeNavLinks: CommandPalette`, ⌘K / Ctrl-K) | Client component: searches `sessions`, `experiences`, `pages`, `orders` (by reference/email), `customers`, `enquiries`, `promo-codes` via REST `?where[...][like]=` (respects access), plus static commands (Create session, Create desk booking, Open check-in, Analytics, Settings…) and **"Find text…"** (§G.5 `find-text` endpoint — "where does this sentence live?"). `listSearchableFields` set on every collection for the built-in list search. |
| **Live preview + click-to-edit** | §G.5; `openByDefault: true` for `pages`; breakpoints Phone/Tablet/Desktop; sections in "use Brand wording" mode deep-link to the global instead of an inert block field. |
| **Media rules** | required `alt` or `decorative`; `provenance` defaults to Studio; only AI-generated/Unknown imagery is blocked from hero/card slots (unless `allowAiImagery`), stock passes with an optional licence note; **a photo still in use cannot be deleted** (readable "Used by: …" message); **replacing a file or editing alt/focal point updates the live site within one request**; sizes generated; focal point UI; folders; upload limit 25 MB; "under 1000 px" notice on small images. |
| **SEO panel** | `@payloadcms/plugin-seo` tab (title, description, image, preview snippet, generate buttons — URLs from `site-settings.publicUrl`) + our `noindex` checkbox; `seo-defaults` global for template/share image/robots. |
| **Redirects** | Renaming a published slug creates a redirect automatically; editors can add manual ones ("old flyer URL → new page") under Content → Redirects. |
| **Sessions UX** | `timezone: true` on `startsAt` shows Dubai time; `SessionQuickStats` (sold/held/available from the inventory join); `SessionActions`: **Repeat…** (weekly series as drafts), **Reschedule…** (emails ticket holders; direct date edits are blocked once seats are sold, with a message pointing here), **Cancel session & refund all**, **Attendee list** (print + CSV + Mark as arrived); Payload Duplicate for one-offs; `bookingStatus` select with help text (`waitlist` shows the join-the-waitlist form on the site); `internalNotes` (staff only). Slug collisions are impossible (`-HHmm`). Capacity cannot go below sold+held. |
| **Settings actions** | Payments: Test connection, Register/Update webhook (refuses on unset/placeholder/non-https `publicUrl`, shows the exact URL first), Rotate secret, List webhooks (auth header shown as `[set]`), Send AED 2 test order (sandbox). Mode switch to Live runs its checklist in a confirm dialog; `mock` is invisible in production. Email: Verify connection, Send test. Booking: Preview ticket PDF. Both payment/email actions test the **unsaved** form values (`useAllFormFields`); masked secret = "use stored". |
| **Orders UX** | `OrderActions` (Refund / approve, Cancel with refund, **Move to another session**, Resend confirmation, Resend tickets, Regenerate invoice PDF, Mark needs-review resolved, Mark repaid for desk refunds) with role gating; **Create booking** (desk) on the Orders list and on a session; timeline rendered as a list; related tickets/payments/invoices via `join`/relationships; "Disputed" badge; `channel` column. Front-desk can correct `contact.email`/`contact.phone` (logged in the timeline) and resend. |
| **Customers** | **Sign out everywhere** (bumps `sessionVersion`); stats; orders join. |
| **Users** | **Invite staff** (list) and **Send login link** (document) — no passwords exchanged; both refuse until Email is verified and say so. |
| **Promo codes** | Bookings → Promo codes: code, % or AED, applies to all/experiences/sessions, dates, max uses, min spend, active; redemptions in analytics. |
| **Notifications** | `ResendButton` on `notification-log` (disabled after the 30-day purge); template **Preview** and **Send me this** on `email-templates`; `TemplateVariables` read-only list. |
| **Jobs** | `payload-jobs` visible to admin with Retry; final failures email staff. |
| **Enquiries** | status board columns via list filter presets, assignee (active staff visible to all roles), Reply-by-email. |
| **Exports** | CSV for orders, invoices, customers, tickets, enquiries with a date range (admin). |

---

## J. RBAC matrix

Roles: `admin` (Nexeor + owner), `editor` (studio content staff), `front-desk` (bookings/check-in). C/R/U/D; `R*` = read without PII/raw/financial fields; `U:f` = update only listed fields; `—` none. Field-level rules are enforced with `isAdminField`/`isEditorField`/`isStaffField` so REST and Local API agree.

| Resource | admin | editor | front-desk | public |
|---|---|---|---|---|
| `pages`, `experiences`, `sessions` (content fields), `venues`, `programmes`, `policies`, `faqs`, `passes`, `testimonials`, `vibes`, `media`, `redirects` | CRUD (fixed pages: no delete/rename; media in use: no delete) | CRUD (delete: media/pages fixed slugs no; sessions with sold seats no) | R | R published (without `internalNotes`, `instructor`, `media.consent/provenance/credit/licence`) |
| `sessions` virtual `seatsAvailable`/`isFullyBooked` | R | R | R | R |
| `session-inventory` (`seatsSold`, `seatsHeld`) | R (update: nobody — SQL only) | — | R | — |
| `users` | CRUD + invite/login-link | R active colleagues (name, role), U self (name/password) | same | — |
| `settings-audit` | R | — | — | — |
| content globals (`site-settings`, `navigation`, `brand-copy`, `booking-settings`, `template-copy`, `seo-defaults`) | R U | R U **except 🔒 fields** (`site-settings.publicUrl`, `locale`, `heroTheme.*`, `enquiriesEnabled`, `jobsEnabled`, `allowAiImagery`; `booking-settings.bookingsOpen`, `referencePrefix`) | R | R (via Local API) |
| admin globals (`payment-settings`, `email-settings`, `invoice-settings`, `notification-settings`, `analytics-settings`) | R U | — | — | — |
| `system-state` | — (system only) | — | — | — |
| `customers` | CRUD + sign-out-everywhere | — | R U:phone,notes | — |
| `orders` | R U:internalNotes,contact.* + all actions | — | R U:internalNotes,contact.email,contact.phone + resend, move, create desk booking, request refund | own order via `k` (24 h) / magic link |
| `payments` | R | — | R* (status, amount, method type/last4, capturedAt) | — |
| `payment-events`, `seat-holds`, `invoice-counters`, `analytics-*`, `payload-jobs` | R (+ retry) | — | — | — |
| `refunds` | CRUD + approve (status via system) | — | C R (request; no `providerResponse`) | — |
| `invoices`, `invoice-files` | R (+ regenerate) | — | R* (no buyer phone) | own via signed URL (`/api/site/invoices/{id}/pdf`) |
| `tickets` | R U | — | R U:holderName + check-in (+ manual mark) | own PDF via signed URL |
| `pass-purchases` | R U | — | R | — |
| `promo-codes` | CRUD | — | R | — |
| `waitlist` | CRUD | — | C R U:status | create via endpoint |
| `enquiries` | CRUD | R U:status,assignedTo,internalNotes,repliedAt | R U:status,assignedTo,repliedAt | create via endpoint |
| `email-templates` | CRUD | R U:subject,preheader,body | — | — |
| `notification-log` | R + resend (html/text admin only) | — | R (redacted variables) | — |
| `/admin/check-in` | ✓ | — | ✓ | — |
| `/admin/analytics` | ✓ all | ✓ traffic only | — | — |
| `/preview` (draft mode) | ✓ | ✓ | ✓ | — |

**`/api/actions/**` endpoints — role per handler** (every handler: `requireRole(req, roles)` first, `Sec-Fetch-Site: cross-site` → 403, zod body):

| Endpoint | Roles |
|---|---|
| `payments/test-connection`, `payments/register-webhook`, `payments/rotate-webhook-secret`, `payments/list-webhooks`, `payments/test-order` | admin |
| `email/verify`, `email/test` | admin |
| `tickets/preview` | admin, editor |
| `orders/manual`, `orders/{id}/move`, `orders/{id}/refund` (request), `orders/{id}/resend-confirmation`, `orders/{id}/resend-tickets` | admin, front-desk |
| `orders/{id}/refunds/{refundId}/approve`, `orders/{id}/refunds/{refundId}/mark-repaid`, `orders/{id}/cancel`, `orders/{id}/regenerate-invoice`, `orders/{id}/resolve-review`, `customers/{id}/sign-out-everywhere` | admin |
| `sessions/{id}/repeat` | admin, editor |
| `sessions/{id}/reschedule`, `sessions/{id}/cancel` | admin |
| `sessions/{id}/attendees.csv` | admin, front-desk |
| `tickets/check-in` | admin, front-desk |
| `users/invite`, `users/{id}/send-login-link` | admin |
| `exports/*.csv` | admin |
| `find-text` | admin, editor |
| `notifications/{id}/resend` | admin |
| `jobs/{id}/retry` | admin |
| `enquiries/{id}/replied` | admin, editor, front-desk |

Field-level: every `encryptedText`, `payments.{raw,providerLinkUrl,settlement*}`, `refunds.providerResponse`, `notification-log.{html,text}`, `analytics-settings.external.*`, `email-templates.{key,enabled,attachInvoice,attachTickets}` → `isAdminField`; `users.role` → `isAdminField`; `sessions.{internalNotes,instructor}`, `media.{consent,provenance,credit,licence}` → `isEditorField` (read); `session-inventory.*` and the virtual `seatsSold/seatsHeld` → `isStaffField` (read). First user forced `admin`. Public endpoints set `req.context` flags that `access.create` checks, so REST can never create orders/enquiries/waitlist rows directly. `jobs.access.{run,queue,cancel}: isAdmin`.

---

## K. Test plan

Infrastructure: `docker-compose.dev.yml` (Postgres 16 on 5434); `vitest.config.ts` with a `tests/setup.ts` that creates a fresh schema per run (`CREATE DATABASE maison_test_<rand>`, `payload migrate` against it, drop after). Payload Local API tests use `getPayload({ config })` with `DATABASE_URL` pointed at that DB. Playwright e2e against `next start` with mock gateway and `log-only` email.

| Layer | What | Where |
|---|---|---|
| Unit | `crypto` seal/open/mask + tamper fails; **`encryptedText` `beforeChange` four branches (null → clear, `''`/MASK → stored raw, sealed → keep, plain → seal + SetAt)**; `money` conversions; `pricing.quote` (VAT split per line, pass credits, one promo max, `appliesTo`/`minSpend`/window, rejected codes, min-amount refusal); `orderState.transition` edges (every invalid edge throws); ticket `qrSig` constant-time compare; `signing` tokens (`return-v1` with expiry, `magic-link-v1`, `session-v1` with `sessionVersion`, `revalidate-v1` timestamp+hash+nonce, invoice/ticket `sig`); `templates` interpolation escaping; `analytics` visitor hash rotates daily, `path` normalisation to known routes; `mappers` doc → site types incl. null image fallback; `redactWebhook`; **a serialised `payment-events` row contains no secret substring**; preview `path` validation; `routeFor`; `sessionSlug` `-HHmm`; `clientIp()` takes the last XFF hop | `tests/unit/**` |
| Integration (Postgres) | `acquireSeats` race: 20 parallel ×9 on a 12-seat session → exactly one succeeds; **a draft/unpublished session can never be acquired**; **an editor save of a session during an active hold does not change `session_inventory`**; `seatsTotal` below sold+held refused; `nextInvoiceNumber` 20 parallel + 1 rollback → contiguous; **20 parallel checkouts against a 3-credit pass → exactly 3 credits consumed; promo `maxUses` honoured under concurrency; expiry restores both**; **`payment-settings` saved as admin with untouched `test.apiKey` → ciphertext byte-identical, Test connection still succeeds**; editor → 403 on admin globals and on 🔒 fields of content globals; **anonymous `GET /api/sessions`, `/api/media` responses contain none of the staff-only keys**; webhook route: rate limit, unverified → minimal row + 401, duplicate claim → 200, **first attempt fails at verify-by-fetch (mocked 5xx) → row stays unprocessed → retry 2 min later succeeds**, verified+mock capture → order confirmed, tickets issued, invoice numbered, notification-log row; mode mismatch → `needsReview`; `voided`; dispute → `disputed`; expiry job releases holds and deactivates mock link; post-expiry payment → re-acquire or refund; refund flow with max_refund guard, **`process-refund` finds an existing refund via GET and does not POST again**; **forgot-password mail contains an absolute https reset URL**; **cross-origin POST with a valid `payload-token` cookie → 401/403**; enquiry endpoint honeypot + rate limit; waitlist join → notify → token checkout while `waitlist`; manual (desk) order → confirmed with desk invoice label; move order (seats, tickets, email); cancel session → refunds queued, tickets void, emails; reschedule → emails + redirect from old slug; **media delete refused with "Used by" while referenced, allowed after**; **media replace → revalidation spy sees every tag + layout**; revalidation hook paths map (spy on `revalidatePath`/`revalidateTag`; draft autosave triggers nothing); redirects row created on published slug rename; magic-link POST-consume single-use, GET never consumes; **every `/api/actions/**` returns 401 anonymous and 403 as editor where the §J table says admin/front-desk** | `tests/integration/**` |
| Contract | zod schemas for all `/api/site/*` bodies; `MamoClient` against a local `undici` MockAgent replaying the documented envelopes (403/404/422/500) + backoff; `MamoApiError` carries no headers | `tests/contract/**` |
| Seed | `payload run cms/seed` twice → idempotent (counts unchanged); every seeded media file exists; every page block references resolvable docs; `onInit` under 4 concurrent `getPayload` calls creates each template once | `tests/seed.test.ts` |
| Build gates (`scripts/ci.sh`) | `tsc --noEmit`, `eslint .`, `payload generate:types` produces no diff, `next build` succeeds, `/robots.txt` and `/sitemap.xml` present, **`process.env.*` reads match the §C.1 allowlist only (grep gate)**, `grep -rn 'type: "point"' cms/` empty, `grep -rln postgis migrations/` empty, no `NEXT_PUBLIC_WHATSAPP_NUMBER`, no `upload.handlers` on `invoice-files`, no `updateTag(` anywhere | CI |
| E2E (Playwright) | admin: create first user → forced admin; **save Site details as that admin with `publicUrl = http://localhost:3200` (accepted outside production, §C.3) so `isPlaceholderPublicUrl()` clears and Bookings open can be switched on against the mock gateway**; invite staff refused while email log-only; create session as editor → publish → `/events` shows it within one request (no rebuild); edit `brand-copy.tagline` → `/about` updated; draft session invisible publicly, visible in preview; live preview iframe refresh; click-to-edit focuses field / jumps to Brand wording; **swap the home hero photo → `/` shows the new file**; delete a used photo → refused. Commerce (mock): Book button shows closed message while `bookingsOpen` is off → switch on (validations) → book 2 seats → Mamo mock Pay → `/payment-success` Confirmed → tickets/invoice in admin → check-in scan verdicts (ok, duplicate, forced wrong-day, refunded not forceable) → refund request → approve → credit note → seats restored; desk booking; move booking; cancel session. Enquiry form → admin inbox → status. Waitlist form on a full session. Analytics beacon → rollup → dashboard; consent banner gates GA4. RBAC: front-desk cannot open Settings; editor cannot read orders; editor cannot change `publicUrl` | `e2e/**` |
| Visual parity | Phase 2 reviewer compares screenshots of all 24 routes before/after CMS wiring at 390/1024/1440 (Playwright `toHaveScreenshot`, 0.5 % threshold) — **the gate before any 2D route merges** | `e2e/parity/**` |
| Deploy rehearsal | `scripts/deploy.sh --seed` against a throwaway Docker Postgres; `scripts/preflight-db.mjs` aborts on a superuser role and on plaintext to a public host | manual, Phase 5 |
| Manual (owner runbook) | Mamo sandbox: register webhook → pay with `4242…`/`4659…`/fail cards → confirm `verified: true` and `observedAuthHeaderName`; live: AED 2 payment + refund | `docs/cms-runbook.md` |

---
## L. Phase plan — agents, disjoint file ownership, reviewers, order

**General rules for every phase.** An agent edits **only** its globs (globs are per phase; a file may change owner between phases). Barrels (`index.ts`) are owned by exactly one agent per phase. `payload-types.ts`, `app/(payload)/admin/importMap.js` and `migrations/**` are regenerated/created **only** by the phase's designated **schema owner** as its last step (`npm run generate:types && npm run generate:importmap && npx payload migrate:create <phase>`). **Interfaces between agents are the signatures in `cms/lib/contracts.ts` (§O)**, landed before the parallel agents start. `payload.config.ts` keys are owned per the §A.4 table. `tsc`, `eslint`, `next build` and `scripts/ci.sh` must pass at the end of each phase; no agent edits the owner's `.env`. Dev/CI DB = local Docker; the production DB is touched only by `scripts/deploy.sh` in Phase 5. Reviewers are read-only and sign off before the next phase starts.

### Phase 1 — Foundation

**Order:** 1B (alone) → 1A ∥ 1C → **1A finalises after 1C's PR has merged** (barrel fill, `providers: [MockBanner]`, `generate:importmap`, `generate:types`, `migrate:create initial`).

**Preconditions (recorded here so they are scheduled now):** every developer has Docker Postgres (`docker compose -f docker-compose.dev.yml up -d`, `cp .env.example .env.local`, `npx payload migrate`) before `next dev` (`push: false`); Nexeor is asked **now** for the §A.5 database gate (role `maison_palettia_app`, TLS cert or private network) and for the Mamo sandbox account, so both are ready before Phase 3/5 need them; the concurrent UI-fix workflow has merged.

| Agent | Owns (globs) | Delivers |
|---|---|---|
| **1B `route-group-move`** (runs first, alone) | `app/**` (git mv everything except `favicon.ico`, `robots.ts` into `app/(site)/`), `app/(site)/not-found.tsx`, `app/(site)/[...slug]/page.tsx` (slug regex + 404 only for now), `.gitignore` (+`/media/`, `/private/`), `eslint.config.mjs` (+`migrations/**`), `docker-compose.dev.yml`, `.env.example` (three keys), `README.md` (dev setup incl. the local DB bootstrap above) | site unchanged, builds green |
| **1A `cms-core`** (schema owner) | `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `payload.config.ts` (P1 keys of the §A.4 table), `instrumentation.ts`, `app/(payload)/**`, `cms/access/**`, `cms/fields/**` (`encryptedText`, `money`, `slug`, `seo`, `link`, `headingLines`, `cta`), `cms/collections/system/**` (`Users`, `Media`, `SettingsAudit`, barrel), empty barrels `cms/collections/{content,commerce,comms,inbox,analytics}/index.ts`, `cms/globals/index.ts` (re-exports 1C's list), `cms/blocks/index.ts`, `cms/endpoints/**` (stubs + `requireRole` + `Sec-Fetch-Site` guard), `cms/jobs/index.ts` (stub: `autoRun`, `shouldAutoRun`, `enableConcurrencyControl: true`, `access`, no tasks), `cms/lib/{contracts,publicUrl,crypto,signing,rateLimit,money,reference,mediaReferences}.ts` (contracts: the "shared (1A)" section of §O only), `cms/hooks/{revalidate,mediaGuards}.ts`, `cms/components/{SecretField,VerifyButton}.tsx`, `cms/components/admin/{Logo,Icon}.tsx`, `cms/scripts/{reseal,reset-password}.ts`, `cms/seed/defaults.ts` (§F.0), `lib/cms/{payload,cache,draft}.ts`, `scripts/preflight-db.mjs`, `payload-types.ts`, `migrations/**` | admin at `/admin` (first user), Users+Media+SettingsAudit, encryptedText with raw-read semantics, csrf/cookies, barrels, DB TLS config, initial migration (incl. `concurrencyKey`) |
| **1C `settings-globals`** | **`cms/globals/!(index).ts`** (all twelve incl. `SystemState`; schema, labels, help, validation, 🔒 field access, audit hooks; action-button components are wired in Phase 3), `cms/components/settings/MockBanner.tsx`, `cms/components/fields/ModeField.tsx` | every §C.3 field |
| **Reviewer `review-foundation`** | read-only | §A rules; G1–G25 gotchas; `push:false`; editor → 403 on admin globals and 🔒 fields; `csrf` populated and `payload-token` cookie `Secure` in production build; `grep -rn 'type: "point"' cms/` empty and no `postgis` in `migrations/**`; `concurrencyKey` column in the initial migration; encryptedText unit + byte-identical integration tests; `scripts/preflight-db.mjs` aborts against a deliberately misconfigured local DB (superuser / plaintext to a public host) and passes against the compliant one; build + standalone smoke; migration applies on a fresh local DB |

**Risk: LOW–MEDIUM.** Residual: the `"type": "module"` flip, every developer needing Docker Postgres + `payload migrate` before `next dev`, and the config skeleton — mitigated by the key-ownership table, the 1C glob excluding `index.ts`, 1A's final step waiting for 1C, and the README bootstrap.

### Phase 2 — Content model, seed, site wiring, page builder

**Order:** **2A-0 (alone, ~½ day)** → 2A-1 ∥ 2B ∥ 2C ∥ 2D → 2A-1 creates the migration last.

| Agent | Owns (globs) | Delivers |
|---|---|---|
| **2A-0 `content-schema`** (alone) | `cms/collections/content/**` (**field and block definitions only**, incl. `SessionInventory.ts`, `Redirects.ts`, `FIXED_PAGE_SLUGS`), `cms/blocks/**` (incl. the barrel), `cms/fields/brandCopyLink.ts`, `payload-types.ts` | typed schema for everyone: runs `generate:types`, commits `payload-types.ts` + barrels; one spelling of every block field (`headingLines`) |
| **2A-1 `content-collections`** (schema owner) | `cms/collections/content/**` (access, hooks wiring, admin UI on top of 2A-0), `cms/hooks/{formatSlug,sessionSlug,slugRedirect,publishGate}.ts`, `cms/components/sessions/SessionQuickStats.tsx`, `cms/components/fields/{BrandCopyLink,CoordinatesField}.tsx`, `payload.config.ts` keys `plugins` + `admin.livePreview` **only**, `payload-types.ts`, `migrations/**` | §D.2 collections, §E block definitions, drafts/live-preview config, inventory row lifecycle, redirects on rename |
| **2B `seed`** | `cms/seed/**` except `defaults.ts` and `emailTemplates.ts`, `package.json` script `seed`, `public/images/placeholder.svg` | §F.1–F.7 seed, idempotent, with `strings/*` carrying `file:line` provenance |
| **2C `site-data-layer`** | `lib/**` except `lib/{booking,cart,bookingFlags,enquiry}.ts` and `lib/cms/payload.ts`; i.e. `lib/{experiences,workshops,partners,privateEvents,policies,passes,constants,brand,vibes,testimonials,seo,bookingOptions,eventDetail,search,recent}.ts` + `lib/cms/{cache,mappers,draft,redirects}.ts` | getters keep signatures, read Local API through `cached`, draft-aware, null-image tolerant; `redirectOr404`; `SITE`, `CONTACT`, `MAIN_NAV`… become async getters where consumers are server components (client consumers receive props) |
| **2D `page-builder-and-routes`** | `app/(site)/**` except `checkout/`, `payment-success/`, `booking-status/`, `events/[slug]/book/`, `my-bookings/`, `api/site/**`, `dev/**`; `components/blocks/**`, `components/cms/{LivePreviewListener,ClickToEdit,SeatsLive}.tsx`, `components/sections/**` (**layout sections only** — `components/contact/ContactForm.tsx`, `components/private-events/{PrivateEventEnquiry,EnquiryStub}.tsx`, `components/loyalty/PassOffer.tsx` stay where they are for 3F), `cms/components/admin/FocusListener.tsx`, `payload.config.ts` key `admin.components.providers` (append `FocusListener` only), `app/(site)/preview/**`, `app/(site)/exit-preview/**` | 11 fixed pages render from `pages` blocks, fixed templates from collections, sitemap/robots/OG from CMS, catch-all with redirects + 404, preview routes (validated `path`), live preview, click-to-edit incl. Brand-wording deep links |
| **Reviewers** | read-only | `review-content-parity`: screenshots of all 24 routes at 390/1024/1440 before/after — **the gate before any 2D route merges**; a11y; broken-image audit incl. defect #1; swap-a-photo check. `review-cms-model`: labels/help readable by a non-developer; access incl. anonymous `GET /api/sessions` / `/api/media` showing no staff-only fields; revalidation exercised via `next start` (publish changes the page; draft autosave purges nothing); `grep point/postgis` gates; `FIXED_PAGE_SLUGS` is the only list; renaming a published slug creates a redirect; `headingLines` spelled identically in `cms/blocks/*`, `components/blocks/*`, `cms/seed/pages.ts` |

**Gate:** `npm run seed` on a fresh DB, `next build`, all routes 200, editing a session in the admin changes `/events` without rebuild, parity suite green.

**Risk: HIGH.** Largest surface (24 routes, ~40 blocks, every `lib/*.ts` getter rewritten, visual parity at three widths) and the first `generateStaticParams`-over-Local-API build — mitigated by 2A-0 landing types first, `point` banned, the parity suite as the merge gate, and `session-inventory` keeping counters off the editor-saved row.

### Phase 3 — Commerce, payments, email, jobs, tickets, enquiries

**Preconditions:** the §M.8 Mamo onboarding answers are in hand (at least: webhook header name, retry behaviour, Apple Pay domain file) and a sandbox key exists; Phase 2 gate passed.

**Order:** **3A-0 (alone)** → 3A-1 ∥ 3B ∥ 3C ∥ 3D ∥ 3E ∥ 3F ∥ 3G → 3A-1 creates the migration last.

| Agent | Owns (globs) | Delivers |
|---|---|---|
| **3A-0 `commerce-contracts`** (alone) | `cms/lib/contracts.ts` (**the full §O**, bodies `throw new NotImplemented()`), **field definitions** of `cms/collections/commerce/**`, `cms/collections/comms/**`, `cms/collections/inbox/**` (+ barrels), `payload-types.ts` | every cross-agent signature and type exists and compiles; `generate:types` committed; the six other agents import from `@/cms/lib/contracts` and from `payload-types` |
| **3A-1 `commerce-model`** (schema owner) | `cms/collections/commerce/**` (access, hooks, admin on top of 3A-0), `cms/lib/{orderState,inventory,pricing,invoiceNumber,orders,waitlist}.ts` (`startCheckout`, `applyPaymentSnapshot`, `syncRefunds`, `expireOrder`, `moveOrder`, `cancelSession`, `rescheduleSession`, `repeatSession`), **`cms/endpoints/index.ts`** (barrel), `cms/endpoints/{admin-orders,admin-sessions}.ts`, the two-line `admin.components.elements.beforeDocumentControls` additions in `cms/globals/{PaymentSettings,EmailSettings}.ts`, the `emailTemplates` import line in `cms/seed/defaults.ts`, `payload-types.ts`, `migrations/**` | §D.3, §H.1–H.3, inventory SQL, promo/pass atomic reservation, boot assertion, order/session action endpoints |
| **3B `mamo-gateway`** | `cms/lib/mamo/**`, `cms/endpoints/{payments,settings-payments,checkout}.ts`, `cms/components/settings/PaymentActions.tsx`, `app/(site)/api/site/{checkout,orders,availability,webhooks,revalidate,apple-domain-association}/**`, `app/(site)/dev/mamo-mock/**` | §H.4–H.6 endpoints, webhook (rate limit, redaction, claim), registration preconditions, mock, admin payment actions |
| **3C `email-and-pdf`** | `cms/lib/{mailer,templates,notifyStaff}.ts`, `cms/email/**`, `cms/collections/comms/**` (hooks/UI on top of 3A-0), `cms/components/email/**`, `cms/components/settings/{EmailActions,TicketPreview}.tsx`, `cms/components/notifications/ResendButton.tsx`, `cms/endpoints/{email,settings-email}.ts`, `cms/lib/pdf/**`, `cms/pdf/fonts/**`, `cms/seed/emailTemplates.ts`, `app/(site)/api/site/{invoices,tickets}/**` (signed PDF routes), `payload.config.ts` key `email` | §H.7 PDFs (media fonts), §H.8 mailer/templates, admin email actions, redacted notification log |
| **3D `jobs`** | `cms/jobs/**`, `cms/components/jobs/RetryButton.tsx` | §H.9 Phase-3 tasks/workflow/overrides with concurrency keys; wires 3A/3B/3C/3E functions through `contracts` |
| **3E `tickets-and-checkin`** | `cms/lib/tickets.ts`, `cms/endpoints/tickets.ts`, `cms/views/checkIn.tsx`, `cms/components/checkin/**`, `cms/components/sessions/AttendeeList.tsx`, `cms/components/admin/NavLinks.tsx`, `payload.config.ts` keys `admin.components.views.checkIn` + `admin.components.afterNavLinks` | QR codes (verify by lookup), check-in endpoint + view, attendee list, manual arrival |
| **3F `site-booking-wiring`** | `lib/{booking,cart,bookingFlags,enquiry}.ts`, `components/booking/**` (+ `WaitlistForm.tsx`), `components/contact/**`, **`components/sections/contact/**`** (form wiring inside the extracted sections), `components/private-events/{PrivateEventEnquiry,EnquiryStub}.tsx`, `components/loyalty/**`, `components/layout/{BasketLink,BookAction}.tsx`, `app/(site)/{checkout,payment-success,booking-status,my-bookings}/**`, `app/(site)/events/[slug]/book/**`, `app/(site)/api/site/{enquiries,waitlist,my-bookings}/**` | real checkout handoff (`basketId`), closed-bookings state, waitlist form, success/failed pages, status lookup, my-bookings (POST consume), enquiry forms posting to CMS, demo localStorage store removed |
| **3G `inbox`** | `cms/collections/inbox/**` (hooks/UI on top of 3A-0), `cms/endpoints/enquiries.ts`, `cms/components/inbox/**` | §D.4 enquiries admin, Reply-by-email |
| **Reviewers** | read-only | `review-commerce-security`: webhook verification/redaction/claim statement, access matrix incl. field-level reads, SQL via drizzle `sql` tag only, secrets never in logs/REST/`payment-events`, rate limits on every `/api/site/**` route, signed URLs with expiry, csrf/`Sec-Fetch-Site`, `requireRole` on every `/api/actions/**` handler, magic-link POST-consume, cookie attributes. `review-commerce-flows`: runs the mock end-to-end + the §K integration suite (incl. race tests, pass-credit race, webhook fail-then-retry, refund no-double-post), checks every email template renders, desk booking / move / cancel / reschedule / repeat flows |

**Risk: HIGHEST.** Seven parallel agents, money and secrets, inventory SQL, a webhook header still UNVERIFIED with Mamo, and the fixed-cron constraint — mitigated by 3A-0 contracts (no invented shapes; `tsc` meaningful from day one), the encryptedText raw-read rule, every ownership gap closed above (barrel, globals' button lines, `defaults.ts` import, `RetryButton`, Phase-3-only tasks), `reconcile-payments` gated instead of re-planned, and the §M.8 answers obtained **before** this phase starts.

### Phase 4 — Admin UX and analytics

**Order:** 4A ∥ 4B → **4C after 4A has merged**.

| Agent | Owns (globs) | Delivers |
|---|---|---|
| **4A `analytics`** (schema owner) | `cms/collections/analytics/**`, `cms/globals/AnalyticsSettings.ts` (consent + id validation), `cms/lib/{analytics,analyticsQueries,exports}.ts`, `cms/endpoints/exports.ts`, `app/(site)/api/site/analytics/**`, `components/cms/{AnalyticsBeacon,ExternalAnalytics,ConsentBanner}.tsx`, the layout mount lines in `app/(site)/layout.tsx` (only those; excludes the four sensitive routes), `cms/jobs/tasks/{rollupAnalytics,purgeRetention}.ts` + their registration lines in `cms/jobs/index.ts`, `payload-types.ts`, `migrations/**` | §D.6, beacon (path normalisation), rollups, retention purge, external tags behind consent, CSV exports + VAT summary queries |
| **4B `admin-ux`** | `cms/components/admin/{Dashboard,Warnings,CommandPalette}.tsx`, `cms/components/orders/**`, `cms/components/sessions/{SessionActions,RepeatDialog}.tsx`, `cms/components/users/**`, `cms/endpoints/{users,find-text}.ts`, `app/(payload)/custom.scss`, `payload.config.ts` keys `admin.components.beforeDashboard` + `admin.components.beforeNavLinks` **only**, presentation keys (`admin.*`, `listSearchableFields`, `defaultColumns`, `components.edit.beforeDocumentControls`, `beforeListTable`) across `cms/collections/**` **excluding `cms/collections/analytics/**`** | §I dashboard + warnings, palette (+ Find text), order/session/user actions UI, branding |
| **4C `analytics-view`** (after 4A) | `cms/views/analytics.tsx`, `cms/components/analytics/**`, `payload.config.ts` key `admin.components.views.analytics` | §I analytics view (consumes `analyticsQueries`; custom range, export, VAT tile) |
| **Reviewer `review-admin-ux`** | read-only | walks the admin as the client: create a session, repeat it weekly, change a price, **swap a hero photo and confirm the live page shows the new file within one request (explicit pass/fail)**, try to delete a used photo (refused, readable), invite a staff member, create a desk booking, move a booking, cancel a session, export last month's invoices, read analytics; a11y of custom components; beacon payload size/privacy; every dashboard warning appears under its condition |

**Risk: MEDIUM.** Mostly additive admin UI and analytics; the structural risks (4B/4C on `views.analytics`, 4A/4B same files under `cms/collections/analytics/**`) are removed by the ownership above.

### Phase 5 — Hardening, tests, deploy, cleanup

**Order:** 5A ∥ 5B ∥ 5C → `review-release` → first deploy.

| Agent | Owns (globs) | Delivers |
|---|---|---|
| **5A `tests`** | `tests/**`, `e2e/**`, `vitest.config.ts`, `playwright.config.ts`, `scripts/ci.sh`, `package.json` test scripts | §K suites green |
| **5B `deploy-and-docs`** | `Dockerfile` (runtime-only), `docker-compose.yml`, `deploy/maison-palettia.service` (systemd example), `scripts/deploy.sh` (`preflight-db → npm ci → payload migrate → next build → restart → signed layout revalidate`, `--seed` once), `.dockerignore`, `docs/cms-runbook.md` (incl. additive-migration rule, reseal, reset-password, proxy rate limits, rotation consequences), `docs/owner-checklist.md`, `README.md` | repeatable deploy, backups, rotation, Vercel delta; **rehearsal of `scripts/deploy.sh --seed` against a throwaway Docker Postgres before touching `maison_palettia_prod`** |
| **5C `cleanup`** | deletions only, per the §E.2 "Deleted" list (full paths), the 54 unreferenced files + 3 videos in `public/images|videos` (archive list in the PR), `public/images/experience/pigment-on-paper` references; **`tsc` + `next build` after each deletion batch** | smaller tree; build + parity screenshots unchanged |
| **Reviewer `review-release`** | read-only | `engineering:deploy-checklist` + `security-review` on the branch; env grep allowlist; migrations additive; `preflight-db` wired into `deploy.sh`; DB gate satisfied (role, TLS or private network) before the first production write |

**Gates:** each phase ends with `scripts/ci.sh` green and a reviewer sign-off; Phase 3 additionally with the mock end-to-end; Phase 5 with the deploy rehearsal, then the first deploy (`scripts/deploy.sh --seed`) which performs the **first and only** write to the production DB, after which the owner creates the first admin user.

**Risk: MEDIUM.** First production write and build-needs-DB choreography — mitigated by the preflight gate, the additive-migration rule, the post-deploy layout revalidate and the rehearsal.

---

## M. What the owner must do (all in the admin, no redeploy)

1. After the first deploy: open `/admin`, create the first user (becomes admin).
2. Settings → **Site details**: the real `publicUrl` (Advanced), contact email/phone/WhatsApp, socials, address. Decide the imagery question (replace or keep the 8 AI-flagged files; tick `allowAiImagery` only if keeping).
3. Settings → **Email sending**: SMTP or Resend credentials → **Verify** → **Send test**. (Everything that follows depends on it: staff invites, confirmations, tickets, invoices.)
4. Users → **Invite staff** (role editor / front-desk); they set their own passwords from the emailed link.
5. Settings → **Invoices & VAT**: legal name, address, trade licence, **TRN**, logo, PDF fonts (optional).
6. Settings → **Who gets notified**: recipients and events (at least `new_order`, `failed_payment`, `refund_requested`, `new_enquiry`, `job_failed`).
7. Settings → **Payments (Mamo Pay)**: paste the **sandbox** key → Test connection → Register webhook (the dialog shows the URL) → place sandbox orders (cards `4659 1055 6905 1157` success no-3DS, `4242 4242 4242 4242` success 3DS `Checkout1!`, `4567 3613 2598 1788` fail; CVV 123, exp 01/28) → check Payment events show `verified: true` and the observed header name. Then paste the **live** key → Test connection → Register webhook → switch Mode to **Live** (the dialog runs its checks) → AED 2 live payment + immediate refund from the order.
8. Content: real session dates/prices/seats (the two seeded sessions are drafts; use **Repeat…** for weekly series), passes (drafts) or leave `/loyalty` unlisted, testimonials with permission, Privacy/Terms policies (`showInLegalRow`), the "everything provided" sentence vs the DIY upgrade clause, consent for the two child photos, promo codes if any.
9. Settings → **Booking & checkout wording** → tick **Bookings open** (it refuses with a plain message until steps 2, 3 and 7 are done). Until then every Book button shows your `closedMessage` and links to Contact; staff can already take **desk bookings**.
10. Server (one-off, by Nexeor, **before the first deploy**): `DATABASE_URL` (with `sslmode=verify-full&sslrootcert=…` or private network), `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL` in the host's `.env`; dedicated Postgres role instead of `postgres` superuser (§A.5 gate — the deploy script refuses otherwise); HTTPS in front of the app (Mamo webhooks and the check-in camera need it) with `X-Forwarded-For` appended and the `/api/users/*` rate limit; nightly backups of DB + `media/` + `private/`.
11. Ask Mamo during sandbox onboarding (**before Phase 3 starts**): webhook header name/retries, rate limits, Apple Pay domain file for standalone links, link expiry, `created_date` timezone, refund vocabulary, idempotency, dispute webhook payload (§02 Part D).

---

## N. Contradictions between the research documents — resolutions

| Topic | 01 says | 02 says | 03 says | **Decision** | Why |
|---|---|---|---|---|---|
| Bookable collection name | `sessions` (+ `experiences`) | `workshops` | `events` | **`sessions`** + `experiences`; routes stay `/events/*` | matches the site's own vocabulary ("session"), avoids the `events` ambiguity with the `/events` route and `payment-events` |
| Programmes / venues | `programmes`, `venues` | — | `private-events`, `partners` | **`programmes`, `venues`** | 01 is the content authority |
| Money | `price.amount` AED integer | fils | fils | **fils + virtual `price`** | no float drift; site types unchanged via `afterRead` |
| Orders model | `bookings` single collection | `orders` + `payment-events` + `refunds` | `orders`+`payments`+`seat-holds`+… | **03's set + 02's `payment-events`** (+ `promo-codes`, `session-inventory`) | audit trail per attempt and per webhook |
| Seat counters | on the session doc | — | on the event row (`UPDATE events …`) | **separate `session-inventory` row, SQL-only writes** | Payload full-row writes and version publishes would clobber counters on the editor-saved document (TOCTOU) |
| Order states | 5 | 7 | 9 (richer) | **03's machine** (`pending_payment … completed`) + `moved` timeline | needed for holds and late captures |
| Hold window | — | 30 min | 10 min | **15 min**, admin 5–60 | 3DS + wallets finish in minutes; 30 blocks seats too long |
| Return URL trust | — | use Mamo's `transactionId` → re-fetch | HMAC `k` only | **both**: `k` (24 h expiry) guards the page, `transactionId` accelerates verification | belt and braces; neither trusts the redirect |
| Webhook events | — | 5 | 6 (+`payment.voided`) | **6 + the six `dispute.*`** | voided is a real terminal state; chargebacks must reach the order |
| Webhook idempotency | — | insert-if-new before processing | — | **claim statement keyed on `processed_at`** | a row inserted before a failed attempt must not block the retry |
| Webhook secret | `test/live.webhookSecret` | per mode + previous | single | **per mode + previous with 10-min grace** | sandbox and live are separate accounts |
| Secret format | `secret` type | `enc:v1:iv:tag:ct` | `enc:v1:<blob>` | **03's single base64url blob**, info `secrets-v1`; untouched values re-read raw from the DB layer | one parser; globals' `previousValue` is the mask |
| Ticket QR | — | — | HMAC recomputed from `PAYLOAD_SECRET` | **stored `qrSig`, verified by lookup** | a secret rotation must never void printed tickets |
| Roles | admin/editor/viewer | — | admin/editor/front-desk | **admin / editor / front-desk** (a `viewer` is a one-line select addition later) | front-desk is the role the studio actually needs |
| Email templates | fields inside `email` global | — | `email-templates` collection | **collection** (seeded; editor edits wording only) | per-template preview/enable; `enabled`/attachments are security-relevant |
| Analytics providers | plausible/umami/ga4/meta pixel | — | ga4/plausible | **none/ga4/plausible/umami + metaPixelId**, validated ids, **consent-gated**; first-party panel primary | ids are public, cheap to support; UAE PDPL |
| Invoice legal name | reads site-settings | — | own field | **own field defaulting from site-settings** | invoices must snapshot a stable legal name |
| Checkout endpoints | — | Next routes `/api/checkout/*` | Payload endpoints `/api/checkout` | **Next routes under `/api/site/**`**; admin actions as Payload endpoints `/api/actions/**` with `requireRole` | never shadow a collection slug; root endpoints have no built-in auth |
| Booking modes | request/recorded/paid | — | — | **`bookingsOpen` switch** (+ desk bookings for staff) | with a CMS every booking is recorded; a "request" mode would need its own order state, emails and screens for a few weeks of use — the closed state + desk bookings cover the pre-Mamo period |
| Reconciliation interval | — | every 5 min | admin-set, re-planned | **runs every minute, gated by `everyMinutes`** | crons are fixed at `buildConfig`; no re-planning API |
| Caching | `unstable_cache`/`cacheTag` | — | `revalidate = 3600` net + hooks | **legacy model, no `cacheComponents`**: static + `unstable_cache` tags + `revalidatePath`/`revalidateTag(…,'max')` deferred with `after()`, net 86400 | spike-proven; hooks run before commit |
| Env | 2 keys (+WhatsApp until moved) | 2 | 2 | **3**: `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL` (**required in production** for the CSRF allowlist) | task statement; `site-settings.publicUrl` still wins at runtime |
| Customer PDF download | — | — | `upload.handlers` honouring `sig` | **signed `/api/site/**` routes only** | Payload's file route applies `access.read` before any handler |
| GraphQL | — | — | — | **disabled** | smaller surface; nothing uses it |
| Click-to-edit | — | — | — | **own postMessage protocol** (§G.5) | `@payloadcms/live-preview` 3.90.2 has none |

---

## O. Cross-agent contracts — `cms/lib/contracts.ts` (3A-0 lands it verbatim; the "shared (1A)" section exists from Phase 1)

```ts
// cms/lib/contracts.ts — exported types + function signatures for every cross-agent call.
// Until the owning agent lands a body, each function `throw new NotImplemented(name)`.
import type { EmailAdapter, Endpoint, PayloadRequest, CollectionAfterChangeHook, Field } from "payload";
import type { Order, Session, Ticket, Refund, Invoice, Customer, PromoCode, PassPurchase } from "@/payload-types";

export class NotImplemented extends Error { constructor(name: string) { super(`${name} not implemented yet`); } }
export type Mode = "test" | "live" | "mock";
export type Role = "admin" | "editor" | "front-desk";
export type Fils = number;                              // integer AED fils
export type Channel = "online" | "desk";
export type DeskMethod = "cash" | "card_terminal" | "complimentary" | "bank_transfer";

// ───────── shared (1A) ─────────
export declare function publicUrl(req?: PayloadRequest): Promise<string>;        // site-settings.publicUrl → NEXT_PUBLIC_SERVER_URL → ""
export declare function publicUrlSync(req?: PayloadRequest): string;             // last resolved value (hooks)
export declare function isPlaceholderPublicUrl(req?: PayloadRequest): Promise<boolean>;
export declare function routeFor(collectionSlug: string, doc: { slug?: string } | null | undefined): string;
export declare const MASK: "••••••••";
export declare function seal(plain: string): string;                             // "enc:v1:<b64url(iv‖tag‖ct)>"
export declare function open(sealed: string): string;
export declare function encryptedText(name: string, admin?: { label?: string; description?: string; verify?: "mamo" | "smtp" | "resend" }): Field[]; // field + `${name}SetAt`
export type SigningInfo = "return-v1" | "magic-link-v1" | "session-v1" | "revalidate-v1" | "pdf-v1" | "waitlist-v1";
export declare function sign(info: SigningInfo, payload: string): string;        // b64url(hmac256(hkdf(PAYLOAD_SECRET, info), payload))
export declare function verifySig(info: SigningInfo, payload: string, sig: string): boolean;   // timingSafeEqual
export declare function rateLimit(bucket: string, key: string, opts: { limit: number; windowMs: number }): boolean; // true = allowed
export declare function clientIp(headers: Headers): string;                      // LAST X-Forwarded-For hop
export declare function ipHash(ip: string): string;                              // daily-salted
export declare function requireRole(req: PayloadRequest, roles: Role[]): asserts req is PayloadRequest & { user: { role: Role } }; // throws 401/403; rejects Sec-Fetch-Site: cross-site
export declare function revalidateCollection(paths: (doc: any, prev?: any) => string[], tags: string[]): CollectionAfterChangeHook;
export declare function safeRevalidate(req: PayloadRequest, tags: string[], paths: string[], layout?: boolean): void;
export declare function revalidateAllContent(req: PayloadRequest): void;
export declare function findMediaReferences(req: PayloadRequest, mediaId: string): Promise<Array<{ collection: string; id: string; where: string }>>;

// ───────── inventory (3A) ─────────
export class SoldOut extends Error { constructor(public sessionId: string, public wanted: number, public available: number) { super("sold_out"); } }
export declare function acquireSeats(req: PayloadRequest, sessionId: string, qty: number, opts?: { allowWaitlist?: boolean }): Promise<{ remaining: number }>;
export declare function releaseSeats(req: PayloadRequest, sessionId: string, qty: number): Promise<void>;
export declare function consumeSeats(req: PayloadRequest, sessionId: string, qty: number): Promise<void>;
export declare function refundSeats(req: PayloadRequest, sessionId: string, qty: number): Promise<void>;

// ───────── pricing (3A) ─────────
export interface QuoteLineInput { kind: "session" | "pass"; id: string; qty: number }
export interface QuoteInput { lines: QuoteLineInput[]; email?: string; codes: string[]; channel: Channel; desk?: { method: DeskMethod; amountFils?: Fils } }
export interface OrderLine { kind: "session" | "pass"; session?: string; pass?: string; title: string; category?: string; startsAt?: string; durationMinutes?: number; venueName?: string; qty: number; unitFils: Fils; lineFils: Fils; passCredits: number }
export interface Totals { subtotalFils: Fils; discountFils: Fils; grossFils: Fils; netFils: Fils; vatFils: Fils; vatRateBps: number; currency: "AED" }
export interface Quote { lines: OrderLine[]; totals: Totals; passRedemptions: Array<{ passPurchase: string; n: number }>; promo?: { promoCode: string; code: string; discountFils: Fils }; rejectedCodes: Array<{ code: string; reason: "invalid" | "expired" | "exhausted" | "min_spend" | "not_applicable" | "one_promo_only" }> }
export declare function quote(req: PayloadRequest, input: QuoteInput, opts?: { reserve: boolean }): Promise<Quote>;   // reserve=true runs the atomic UPDATEs

// ───────── orders (3A) ─────────
export type OrderStatus = "pending_payment" | "awaiting_payment" | "confirming" | "confirmed" | "completed" | "failed" | "expired" | "cancelled" | "refunded";
export interface Contact { firstName: string; lastName: string; email?: string; phone?: string; marketingOptIn?: boolean }
export interface StartCheckoutInput { basketId: string; channel: Channel; details: Contact; lines: QuoteLineInput[]; codes: string[]; consents: Array<{ policy: string; version: number }>; waitlistToken?: string; desk?: { method: DeskMethod; amountFils?: Fils; note?: string }; source: { ipHash: string; userAgent: string; referrer?: string } }
export type StartCheckoutResult = { reference: string; paid: true; k: string } | { reference: string; paymentUrl: string; holdExpiresAt: string } | { reference: string; reused: true; paymentUrl: string; holdExpiresAt: string };
export declare function startCheckout(req: PayloadRequest, input: StartCheckoutInput): Promise<StartCheckoutResult>;
export declare function transition(req: PayloadRequest, order: Order, to: OrderStatus, detail?: { note?: string; by?: string; refs?: Record<string, string> }): Promise<Order>;
export declare function applyPaymentSnapshot(req: PayloadRequest, order: Order, payment: MamoPayment, ctx: { source: "webhook" | "poller" | "return"; mode: Mode; eventId?: string }): Promise<{ applied: boolean; reason?: string }>;
export declare function syncRefunds(req: PayloadRequest, order: Order, payment: MamoPayment): Promise<void>;
export declare function expireOrder(req: PayloadRequest, orderId: string): Promise<void>;
export declare function moveOrder(req: PayloadRequest, orderId: string, input: { targetSessionId: string; priceDifference: "no_charge" | "collect_at_venue" | "refund_difference"; note?: string }): Promise<Order>;
export declare function cancelSession(req: PayloadRequest, sessionId: string, input: { reason: string; message?: string }): Promise<{ orders: number; refundsQueued: number }>;
export declare function rescheduleSession(req: PayloadRequest, sessionId: string, input: { startsAt: string; venueId?: string; message?: string }): Promise<{ notified: number; newSlug: string }>;
export declare function repeatSession(req: PayloadRequest, sessionId: string, input: { every: "weekly"; until: string; weekdays: number[] }): Promise<{ created: Array<{ id: string; startsAt: string; slug: string }> }>;
export declare function nextInvoiceNumber(req: PayloadRequest, kind: "invoice" | "credit_note", year: number): Promise<{ seq: number; number: string }>;
export declare function issueInvoice(req: PayloadRequest, orderId: string): Promise<{ invoiceId: string; number: string }>;            // idempotent
export declare function issueCreditNote(req: PayloadRequest, refundId: string): Promise<{ invoiceId: string; number: string }>;       // idempotent

// ───────── gateway (3B) ─────────
export interface MamoPayment { id: string; status: "captured" | "failed" | "processing" | "confirmation_required" | "refund_initiated" | "refunded" | "voided" | string; amount: number | string; amount_currency: string; refund_amount?: number; refunds?: Array<{ id: string; amount: number; created_date?: string }>; max_refund_amount?: number; custom_data?: Record<string, unknown>; created_date?: string; payment_method?: { type?: string; card_last4?: string; origin?: string }; settlement_amount?: string; settlement_fee?: string; settlement_vat?: string; settlement_date?: string; payment_link_id?: string; external_id?: string | null; error_code?: string | null; error_message?: string | null; event_type?: string }
export interface MamoLink { id: string; payment_url: string; active: boolean; external_id?: string; amount: number }
export interface CreateLinkInput { title: string; amount: number; amount_currency: "AED"; return_url: string; failure_return_url: string; external_id: string; custom_data: Record<string, unknown>; capacity: 1; first_name?: string; last_name?: string; email?: string; payment_methods?: string[]; enable_tabby?: boolean; send_customer_receipt?: boolean; terms_and_conditions_url?: string; link_type: "standalone" | "inline" }
export interface RedactedWebhook { id: string; url: string; enabled_events: string[]; auth_header: "[set]" | null }
export class MamoApiError extends Error { constructor(public status: number, public errorCode: string | undefined, public messages: string[], public errors?: Record<string, string[]>) { super(messages.join("; ") || `Mamo API ${status}`); } } // never carries request headers/bodies
export interface PaymentGateway { readonly mode: Mode; readonly isConfigured: true; me(): Promise<{ business_name: string }>; createLink(input: CreateLinkInput): Promise<MamoLink>; getLink(id: string): Promise<MamoLink & { charges: MamoPayment[] }>; deactivateLink(id: string): Promise<MamoLink>; getPayment(id: string): Promise<MamoPayment>; refund(paymentId: string, amountAed: number): Promise<{ refund_amount: number; refund_status: string }>; listWebhooks(): Promise<RedactedWebhook[]>; createWebhook(url: string, events: string[], authHeader: string): Promise<RedactedWebhook>; updateWebhook(id: string, patch: Partial<{ url: string; enabled_events: string[]; auth_header: string }>): Promise<RedactedWebhook>; deleteWebhook(id: string): Promise<{ success: boolean }> }
export interface DisabledGateway { readonly isConfigured: false; readonly reason: string }
export declare function getPaymentGateway(req: PayloadRequest, opts?: { forceMode?: "test" | "live" }): Promise<PaymentGateway | DisabledGateway>;
export declare function webhookSecrets(req: PayloadRequest): Promise<Array<{ mode: "test" | "live"; value: string; previous: boolean }>>;

// ───────── email + pdf (3C) ─────────
export type TemplateKey = "order_confirmation" | "payment_failed" | "ticket_reminder_24h" | "order_refunded" | "order_cancelled" | "order_moved" | "session_rescheduled" | "session_cancelled" | "post_expiry_payment" | "magic_link" | "enquiry_received" | "waitlist_joined" | "waitlist_seat_available" | "staff_login_link" | "admin_new_order" | "admin_failed_payment" | "admin_refund_requested" | "admin_refund" | "admin_dispute" | "admin_new_enquiry" | "admin_waitlist_joined" | "admin_job_failed" | "admin_low_seats" | "admin_settings_changed" | "admin_webhook_unverified_spike" | "admin_daily_digest" | "test";
export type StaffEvent = "new_order" | "failed_payment" | "refund_requested" | "refund" | "dispute" | "new_enquiry" | "waitlist_joined" | "job_failed" | "low_seats" | "settings_changed" | "webhook_unverified_spike" | "daily_digest";
export interface Attachment { filename: string; content: Buffer; contentType: string }
export declare function sendTemplated(req: PayloadRequest, input: { key: TemplateKey; to: string | string[]; vars: Record<string, unknown>; refs?: { order?: string; enquiry?: string; ticket?: string; refund?: string; session?: string }; attachments?: Attachment[] }): Promise<{ logId: string; status: "queued" | "skipped" }>;
export declare function renderTemplateHtml(key: TemplateKey, vars: Record<string, unknown>, req?: PayloadRequest): Promise<{ subject: string; html: string; text: string }>;
export declare function notifyStaff(req: PayloadRequest, event: StaffEvent, vars: Record<string, unknown>, refs?: Record<string, string>): Promise<{ logIds: string[] }>;
export declare function renderInvoicePdf(req: PayloadRequest, invoiceId: string): Promise<Buffer>;
export declare function renderTicketPdf(req: PayloadRequest, ticketId: string): Promise<Buffer>;
export declare function renderSampleTicketPdf(req: PayloadRequest, ticketCopy: { heading: string; instructions: string }): Promise<Buffer>;
export declare const runtimeEmailAdapter: EmailAdapter;

// ───────── tickets + check-in (3E) ─────────
export declare function issueTickets(req: PayloadRequest, orderId: string): Promise<{ created: number }>;   // idempotent
export declare function mintTicket(): { code: string; qr: string; qrSig: string };
export declare function findTicketByQr(req: PayloadRequest, input: { qr?: string; code?: string }): Promise<Ticket | null>;  // lookup then constant-time compare
export type CheckInVerdict = "ok" | "already_checked_in" | "void" | "refunded" | "wrong_day" | "not_found";
export declare function checkIn(req: PayloadRequest, input: { qr?: string; code?: string; device: string; force?: boolean }): Promise<{ verdict: CheckInVerdict; ticket?: Ticket; sessionTitle?: string; holder?: string; seatNo?: number; qty?: number; remainingOnOrder?: number }>;

// ───────── waitlist (3A) ─────────
export declare function joinWaitlist(req: PayloadRequest, input: { sessionId: string; name: string; email: string; phone?: string; qty: number; meta: { ipHash: string; userAgent: string } }): Promise<{ position: number }>;
export declare function notifyWaitlist(req: PayloadRequest, sessionId: string, freedSeats: number): Promise<{ notified: number }>;
export declare function validWaitlistTokenFor(req: PayloadRequest, sessionId: string, email: string, token?: string): Promise<boolean>;

// ───────── jobs (3D) — input shapes; every task declares `concurrency` per §H.9 ─────────
export interface JobInputs {
  "finalize-order": { orderId: string }; "issue-tickets": { orderId: string }; "issue-invoice": { orderId: string }; "generate-invoice-pdf": { invoiceId: string };
  "send-email": { logId: string }; "notify-staff": { event: StaffEvent; vars: Record<string, unknown>; refs?: Record<string, string> };
  "process-refund": { refundId: string; paymentId: string; orderId: string }; "waitlist-notify": { sessionId: string; freedSeats: number };
  "expire-holds": Record<string, never>; "reconcile-payments": Record<string, never>; "send-reminders": Record<string, never>; "complete-orders": Record<string, never>; "reconcile-inventory": Record<string, never>; "send-daily-digest": Record<string, never>;
}
```

---

## P. Varied or rejected critique (with reasons)

| Critique | Outcome | Reason |
|---|---|---|
| "Perform revalidation in an `afterOperation` hook, which runs after commit" (§G.4 alternative) | **Rejected** | Verified in 3.90.2 `collections/operations/updateByID.js`: `buildAfterOperation` (line 215) runs **before** `commitTransaction` (line 226), same as `afterChange`. The post-commit requirement is met with Next 16 `after()` (deferred to after the response, which Payload returns only after committing) plus `revalidateTag(…, "max")`; job/CLI contexts use the signed loopback call. |
| "Raise `lockTime` only for the attacked IP, not the account" (users login) | **Rejected** | Payload's lockout is per account; there is no per-IP lock in 3.90.2. The proxy rate limit on `/api/users/*` (§A.5) is the per-IP control; `maxLoginAttempts: 5` / `lockTime` 10 min stay as the per-account control. |
| "Hide 'Restore version' for `sessions` or recompute counters on restore" | **Superseded** | Counters no longer live on the session document (`session-inventory`), so a restore cannot clobber them; the only restorable capacity field (`seatsTotal`) passes through the `beforeValidate` guard. `reconcile-inventory` stays nightly. |
| "`node-postgres` `require` alone does not verify the cert" | **Corrected, same conclusion** | In `pg-connection-string` 2.14.1 (what `pg` 8.20 uses), `sslmode=require`/`prefer`/`verify-ca` are aliases of `verify-full` with a deprecation warning (unless `uselibpqcompat=true`). `verify-full` is still written explicitly so behaviour is unambiguous and warning-free. |
| Request mode option (a) — define `requested` orders with Confirm/Decline | **Variant (b) chosen** | A `bookingsOpen` switch with a closed message, plus staff desk bookings, covers the pre-Mamo weeks without a second order lifecycle, extra templates and admin screens that would be dead once payments go live. |
| `@payloadcms/plugin-import-export` for CSV | **Variant chosen** | Still beta, adds a collection and a job; the need is a date-ranged CSV with VAT columns, served by one streaming endpoint (§H.12). The critique offered this alternative. |
| Ticket signing option (b) — dedicated `ticketSigningKey` with `kid` | **Variant (a) chosen** | Verify-by-lookup with a stored `qrSig` makes the DB the authority and is immune to any secret rotation or reseal failure; a dedicated key would still be lost if `PAYLOAD_SECRET` rotated without a reseal. |
| Favicon fields → route handlers streaming media | **Variant chosen (remove the fields)** | Three upload fields that are changed once in the site's life do not justify three dynamic icon routes; the static files stay developer-owned and the admin says so. |
| Build against a throwaway migrated DB | **Variant chosen (host build + additive migrations)** | `next build` prerenders real content; against an empty throwaway DB it would publish empty pages until revalidation. Building on the host against the migrated production DB, with the additive-migration rule and a post-deploy layout revalidate, keeps the old process serving safely during the window. |
| `media.afterChange` computing referrers for targeted revalidation | **Variant chosen (revalidate everything)** | One `revalidateTag` per tag + one layout purge is cheaper and simpler than a reverse lookup, and media edits are rare; the reverse lookup exists anyway for the delete guard. |
| `onInit` "keep it to template upserts + salt generation" | **Clarified** | The analytics salt is derived per day with HKDF (`analytics-${day}`) and never stored, so there is nothing to generate; `onInit` seeds templates, defaults and the canary only. |
| Delete `notification-settings.lowSeatsThreshold` | **Variant chosen** | Kept as an optional `lowSeatsOverride` with the suggested "leave blank" help text (the critique allowed either). |

---

## Q. Change log of this revision (what changed and where)

- **Booking mode** → `booking-settings.bookingsOpen` + `closedMessage`/`closedCta*` + single `bookingTerms`; validation chain (Email verified → Payments verified → publicUrl confirmed → webhook registered); closed-state booking bar; seed `bookingsOpen: false`; FAQ `answerSource`; dashboard info; §C.3, §E.3, §F.6, §H.3, §I, §M, §N.
- **Media**: explicit mime allowlist; `provenance` default `studio`, only AI/Unknown gated, `licence`; `allowAiImagery`; `beforeDelete` reference guard with readable message (`findMediaReferences`); `afterChange`/`afterDelete` revalidate-all; null-tolerant mappers; gate moved to `publishGate` on content collections; §D.1, §D.2, §G.4, §I, §K, Phase 4 reviewer.
- **Inventory**: `session-inventory` collection (no drafts, SQL-only writes), new guarded UPDATE with `_status = 'published'` and waitlist token, `seatsTotal ≥ sold+held`, join-based virtuals, seed rows at 0; §D.2, §H.3, §K, §N.
- **DB gate**: TLS `verify-full`/private network, dedicated role, `scripts/preflight-db.mjs` in `deploy.sh`, explicit `pool.ssl`, no PostGIS (`coordinates` group); §A.4, §A.5, §D.2, §L Phase 1 preconditions, §M.10.
- **`payload.config.ts`** re-labelled Phase 5 end state with a per-phase key-ownership table; `routeFor`/`publicUrl` defined in 1A; `csrf` allowlist, `cors: []`, `cookies.secure`, `pool.max` by phase, `generateURL` async via `publicUrl(req)`; §A.4, §C.1 (`NEXT_PUBLIC_SERVER_URL` required in production).
- **Security**: `requireRole` + `Sec-Fetch-Site` on `/api/actions/**` with a role table; forgot-password absolute URL + invite flow + `reset-password.ts`; webhook rate limit, minimal unverified storage, spike alert, full header redaction, `MamoApiError` without headers, `redactWebhook`, claim statement for idempotency, mode/link assertion, `voided`, `dispute.*`; refund job idempotency protocol; atomic pass-credit and promo reservation; field-level reads for staff-only fields; `k` with 24 h expiry and minimal status endpoint; magic-link POST consume, `__Host-mp_session` with `sessionVersion`, rate limits per route (last XFF hop); `Referrer-Policy` headers and no third-party tags on sensitive routes; signed revalidate with timestamp+hash+nonce and validated body; preview `path` validation; catch-all short-circuit + `force-static`; analytics id validation + consent; reseal reads env/stdin; canary boot check; §A.2, §A.4, §C, §D, §G, §H, §J, §K.
- **encryptedText**: MASK constant, `null` = Clear, untouched → raw DB read (globals `previousValue` bug), `internalRead` context; §C.2, §K.
- **Admin-only fields** on content globals (`publicUrl` regex, `jobsEnabled`, `enquiriesEnabled`, `allowAiImagery`, `heroTheme`, `locale`, `bookingsOpen`, `referencePrefix`) in a collapsible Advanced group; `settings-audit` + `settings_changed` alerts; §C.3, §D.1, §J.
- **Payments UX**: Mode group first with help, `mock` hidden in production, Live confirm checklist, diagnostics collapsed, register-webhook preconditions and URL preview, mismatch flag; `appleDomainAssociation` textarea via rewrite; §C.3, §A.2, §H.5.
- **Owner operations**: desk bookings (`channel`, desk payments), move order, cancel session & refund all, reschedule with guard, repeat series, attendee list + manual arrival, bounded `force`, promo codes, redirects collection + auto-redirect on slug rename, CSV exports + VAT summary, waitlist endpoint/form/job semantics, invite staff, refund-requested alerts, front-desk contact correction, enquiries gated on `enquiriesEnabled` only, PDF fonts from media, ticket copy moved to Booking settings with preview, one low-seat threshold, Settings group labels, Brand-wording deep links + Find text, `FIXED_PAGE_SLUGS`, session slug `-HHmm`; §C.3, §D, §E, §G.5, §H.3, §H.7, §H.11, §H.12, §I, §J.
- **Jobs**: concurrency keys, `access.{run,queue,cancel}`, `concurrencyKey` in the Phase 1 migration, `reconcile-payments` every minute gated, digest hourly gated, `purge-retention`, ids-only inputs, `jobs.queue` with `input`; §H.6, §H.9.
- **Email**: adapter defaults + `from` override, rendered html/text stored admin-only, redacted variables, extended template keys; §H.8, §D.5.
- **Revalidation**: `after()`-deferred (verified `afterOperation` is pre-commit), draft-autosave guard, `updateTag` ban, media/redirects mapping; §G.1, §G.4.
- **Phase plan**: 1C glob `cms/globals/!(index).ts`, 1A final step after 1C; 2A-0 types-first; 3A-0 contracts (§O) + ownership gaps closed (endpoints barrel, globals' button lines, `defaults.ts` import, `RetryButton` → 3D, Phase-3-only tasks); 3F owns `components/sections/contact/**`, 2D leaves form components in place; 4C owns `views.analytics`, 4B excludes `cms/collections/analytics/**`; 5B host build + additive migrations + rehearsal; 5C builds after each batch; risk lines per phase; full repo paths, `blog/` decided; §L, §E.2, §A.3.
- **Misc**: compound index declared via `indexes`; `elements.beforeDocumentControls` path for globals; `upload.handlers` claim removed; `users.read` for the assignee picker; env allowlist for the grep gate; `onInit` build guard + advisory lock, no webhook minting; EmailAdapter defaults; §D.3, §C.3, §F.0, §K.
