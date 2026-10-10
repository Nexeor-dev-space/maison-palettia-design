# Maison Palettia

Website for **Maison Palettia Events L.L.C.**, Dubai — a premium creative
lifestyle brand offering hands-on art and craft workshops.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| UI | React 19 |
| Styling | Tailwind CSS v4 (CSS-first tokens) |
| Icons | lucide-react |
| Animation | Framer Motion |
| Linting | ESLint (`eslint-config-next`) |
| CMS | Payload 3.90 in the same Next process (`/admin`), Postgres 16, migrations only |
| Payments | Mamo Pay (hosted payment page) |
| Hosting | self-hosted Node 22 behind nginx (systemd, or Docker as runtime only) |

## Development setup

The site and its CMS (Payload, in-process — see `docs/cms/SPEC.md`) run as one
Next.js app against one Postgres database. There is **no Docker** and no local
database: development and production both use the owner-supplied Postgres
named in `.env` (`docs/cms/DECISIONS.md`). That is safe only because the
schema is never pushed from a laptop — `push: false`, migrations only.

```bash
# 1. Node 22 LTS, then dependencies
npm install

# 2. Environment — `.env` is the ONLY env file (gitignored). Exactly three keys:
#    DATABASE_URL, PAYLOAD_SECRET (openssl rand -hex 32), NEXT_PUBLIC_SERVER_URL.
#    Everything else is configured in the admin panel, never in env.
cp .env.example .env    # then fill in the values

# 3. Bring the database up to date (committed migrations in migrations/)
npx payload migrate

# 4. Run on port 3200 — never 3000, another project on this machine owns it.
#    .claude/launch.json encodes the same port for the editor preview.
npx next dev -p 3200
```

The site is at `http://localhost:3200`, the admin at `/admin` (first visit
creates the first user). `next build` prerenders pages through Payload's Local
API, so it needs the same reachable, migrated database.

Changing the schema: edit the collection/global, then
`npx payload migrate:create <name>` and commit the generated files under
`migrations/`. Never run `migrate:create` against a database you have not
pulled the latest migrations for. `scripts/preflight-db.mjs` checks the
connection's role and TLS; it only warns in development and is a hard gate
when `NODE_ENV=production`.

## Commands

```bash
npx next dev -p 3200   # development server (the port matters — see above)
npm run build          # production build (needs the database)
npm run lint           # ESLint
npx tsc --noEmit       # type check
npx vitest run         # unit tests
npx payload migrate    # apply committed migrations
npx payload migrate:create <name>   # write a new migration after a schema change
npm run seed           # load today's site into the CMS (idempotent; see cms/seed/index.ts)
npm run preflight:db   # check the DB connection against the production gate
```

## Production

Self-hosted: one Node process behind nginx, on the owner's server, against
the shared Nexeor Postgres. Everything an operator needs is in
**[`docs/cms-runbook.md`](docs/cms-runbook.md)**; what the owner does in the
admin after go-live is **[`docs/owner-checklist.md`](docs/owner-checklist.md)**.

```bash
scripts/deploy.sh --seed   # FIRST deploy only (refused once the DB has content)
scripts/deploy.sh          # every deploy after: preflight → npm ci → migrate → build → restart → purge
scripts/deploy.sh --rollback   # previous release, seconds, database untouched
scripts/backup.sh          # pg_dump + media/ + private/, rotated (nightly from cron)
```

| File | What it is |
|---|---|
| `scripts/deploy.sh` | the deploy (release directories, health check, automatic rollback, signed purge) |
| `scripts/preflight-db.mjs` | the database gate — dedicated role, TLS or private network (hard gate in production) |
| `scripts/revalidate.mjs` | the signed post-deploy cache purge |
| `scripts/backup.sh` | nightly backup with rotation |
| `deploy/maison-palettia.service` | systemd unit |
| `deploy/nginx.conf.example` | TLS, `X-Forwarded-For`, login rate limits, upload size |
| `Dockerfile`, `docker-compose.yml`, `.dockerignore` | the Docker alternative — runtime only; the host builds |

Rules that bite: migrations are **additive within a release** (runbook §7);
`NEXT_PUBLIC_SERVER_URL` is compiled in, so changing it needs a deploy;
rotating `PAYLOAD_SECRET` needs the reseal script first (runbook §9).

## Structure

```
app/
  favicon.ico robots.ts   root-only metadata routes — Next anchors both here
  opengraph-image/route.ts   serves (site)/opengraph-image.tsx's card at the un-hashed
                          `/opengraph-image` URL that lib/seo.ts hardcodes
  (site)/            the public site: its own root layout + globals.css, every page,
                     sitemap.ts, opengraph-image.tsx (the real card), icon.png,
                     apple-icon.png, not-found.tsx (branded 404),
                     [...slug]/ (catch-all: CMS pages later, 404 today)
  (payload)/         Payload admin (/admin) and REST (/api) — its own root layout
cms/                 Payload collections, globals, fields, hooks, endpoints, jobs
migrations/          generated by `payload migrate:create`; committed, never hand-edited
components/
  layout/            Header, Footer, PagePlaceholder (temporary)
  motion/            Reveal, Stagger — the shared animation system
  sections/          reusable page sections (added phase by phase)
  ui/                Button, Container, Wordmark
  workshops/         workshop presentation, shared by homepage and listing
lib/
  constants.ts       site identity, navigation, contact, social
  disciplines.ts     the creative strands (the CMS seam)
  fonts.ts           Montserrat + the Hapsha Sophia Script hook-up
  motion.ts          shared motion variants and easing
  seo.ts             metadata defaults + buildMetadata() helper
  utils.ts           cn, formatDate, slugify
  workshops.ts       workshop content + formatting (the CMS seam)
types/               shared TypeScript types
public/images/       brand · hero · workshops · creative · experience · gallery · blog
scripts/             deploy.sh · backup.sh · preflight-db.mjs · revalidate.mjs
deploy/              systemd unit and nginx example
docs/                cms-runbook.md (operations) · owner-checklist.md (go-live, for the owner)
                     cms/SPEC.md (the build spec) · cms/DECISIONS.md (environment overrides)
```

## Design tokens

**All colours, type, spacing, radii, motion and breakpoints live in
`app/(site)/globals.css`** under `@theme static`. Nothing else in the codebase should
contain a hex value.

Raw brand palette → semantic tokens:

| Token | Value | Brand name |
|---|---|---|
| `--color-primary` | `#9059A4` | Deep Lilac |
| `--color-sage` | `#D1E7BE` | Light Sage |
| `--color-cream` | `#EFE2CA` | White Rock |
| `--color-terracotta` | `#D97757` | Warm Terracotta |
| `--color-lavender` | `#C4B5FD` | Soft Lavender |
| `--color-text` | `#2D3748` | Charcoal Slate |

To re-skin the site, change the `--color-brand-*` values only — the semantic
tokens point at them, and every Tailwind utility follows.

Layout: the page runs **full-bleed** and is held off the screen edge only by
`--spacing-gutter`, which is `max(1.25rem, 2vw)` — 20px on a phone, 29px at
1440, 38px at 1920. There is no centred ceiling, so the measure keeps growing
with the display instead of parking at 1440 and letting the margins swell.

That token is the single source of truth for the gutter. `<Container>` applies
it as `px-gutter`; anything that has to line up with it — a photograph bleeding
to the edge, a strip that rebuilds the inset for itself — uses the same token
(`-mx-gutter`, `pl-gutter`) rather than restating the numbers, so the two can
never drift.

`--container-site` (90rem) is no longer applied by default; it is kept as the
one line to put back on `<Container>` if wide displays ever need a stop.
`--container-reading` (42rem) via `max-w-reading` keeps long-form copy legible.

## Typography

- **Montserrat** — all UI, navigation, headings and body copy. Loaded via
  `next/font/google`.
- **Hapsha Sophia Script** — wordmark and large display moments only, applied
  with the `font-display` utility. **The licensed font file is not yet in the
  repo.** See `public/fonts/README.md` to wire it up; until then a generic
  script face stands in and must not ship to production.

## Animation

Use `<Reveal>` for a single element and wrap groups in `<Stagger>` so children
run in sequence from one trigger. Variants: `fadeUp`, `fadeIn`, `subtleReveal`,
`imageReveal`, `stagger` (defined in `lib/motion.ts`).

Both components return plain, un-animated markup when the visitor prefers
reduced motion, and a `<noscript>` rule in the root layout keeps content
visible when JavaScript is unavailable.

## Build phases

The design-phase site (header, homepage, workshops, about, gallery, FAQ,
contact, SEO) is done. The CMS was built in the phases of
`docs/cms/SPEC.md` §L:

1. ✅ Foundation — Payload in-app, staff roles, media, encrypted settings
2. ✅ Content model, seed, CMS-driven site, page builder, live preview
3. ✅ Commerce — checkout, Mamo Pay, orders, tickets, invoices, email, jobs, inbox
4. ✅ Admin experience and analytics
5. Hardening, tests, deploy and docs — then the first production deploy

## Outstanding client assets

Search the codebase for `TODO(client)`. Currently pending: logo artwork, the
Hapsha Sophia Script font file, production domain, address / email / phone,
social profile URLs, Open Graph image, and legal page content.
