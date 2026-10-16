# Maison Palettia

Website and booking/commerce platform for **Maison Palettia Events L.L.C.** (Dubai) — premium creative art & craft workshops.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Payload CMS 3.90 running in the same Next process (`/admin`) · Postgres (`@payloadcms/db-postgres`) · Tailwind CSS v4 · Framer Motion · Mamo Pay · Resend/nodemailer · pdfkit + qrcode (tickets/invoices) · Vitest + Playwright.

## Next.js 16 warning

This Next.js version has breaking changes — APIs, conventions and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code, and heed deprecation notices.

## Commands

```bash
npm run dev                 # next dev on port 3200 — never 3000 (another project owns it)
npm run lint                # ESLint
npx tsc --noEmit            # type check
npm test                    # vitest (all); test:unit / test:integration for one project
npm run test:e2e            # Playwright against the dev server (E2E_BASE_URL, default :3200)
npm run ci                  # every gate (scripts/ci.sh); flags: --no-e2e --no-build --no-integration
npx payload migrate         # apply committed migrations
npx payload migrate:create <name>   # after a schema change; commit the output
npm run generate:types      # payload-types.ts
npm run generate:importmap  # app/(payload)/admin/importMap.js
npm run seed                # idempotent CMS seed (cms/seed/index.ts)
```

## Layout

- `app/(site)/` — public site (own root layout + `globals.css`); `app/(payload)/` — admin and REST/GraphQL.
- `cms/` — Payload config pieces: `collections/` (content, commerce, comms, inbox, analytics, system), `blocks/` (page-builder blocks), `globals/`, `fields/`, `access/`, `hooks/`, `endpoints/`, `jobs/`, `email/`, `components/` (admin UI), `seed/`, `scripts/`.
- `components/` — site UI (`blocks`, `booking`, `events`, `layout`, `motion`, `sections`, `ui`, …). `lib/` — shared logic (booking, cart, passes, SEO, motion, constants, `lib/cms`).
- `migrations/` — generated, committed. `tests/` (unit/integration) and `e2e/` (Playwright). `scripts/` (deploy, backup, preflight, CI), `deploy/` (systemd, nginx), `docs/`.
- Aliases: `@/*` → repo root, `@payload-config` → `payload.config.ts`.

## Rules that bite

- **Migrations only** (`push: false`). Never hand-edit `migrations/`. Dev and prod use the same owner-supplied Postgres (no local DB) — treat data as live.
- `payload-types.ts` and `importMap.js` are generated; CI fails if they differ from a fresh generation.
- `.env` has exactly three keys: `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`. Everything else (Mamo keys, SMTP, recipients, analytics IDs) is an admin setting — don't add env vars.
- `next build` prerenders through Payload, so it needs a reachable, migrated DB. `NEXT_PUBLIC_SERVER_URL` is compiled in. Rotating `PAYLOAD_SECRET` requires `cms/scripts/reseal.ts` first.
- Migrations must be additive within a release (`docs/cms-runbook.md` §7).

## Design conventions

- All colours, type, spacing, radii and breakpoints live in `app/(site)/globals.css` under `@theme static`; no hex values elsewhere. Re-skin via `--color-brand-*`.
- Layout is full-bleed; use `<Container>` / `--spacing-gutter` rather than restating gutter numbers.
- Montserrat for UI/body; Hapsha Sophia Script (`font-display`) only for wordmark/large display moments (licensed font file not yet in repo — see `public/fonts/README.md`).
- Animate with `<Reveal>` / `<Stagger>` and variants from `lib/motion.ts`; both respect reduced motion.

## Animation and UI performance (read before touching motion, scroll or pointer code)

Issue #70 was site-wide jitter caused by many small per-frame costs adding up. Do not reintroduce them:

- **Never write a CSS custom property on `<html>`, `<body>` or any wide ancestor on every frame.** Custom properties inherit, so one write recalculates style for the whole subtree. Write the value onto the specific elements that read it, and only the ones on screen (see `components/motion/PointerField.tsx`).
- **No layout-forcing reads in `pointermove`, `scroll` or rAF handlers**: `getComputedStyle`, `getBoundingClientRect`, `elementsFromPoint`, `offsetTop`, canvas `getImageData`. Cache results, measure on resize, and throttle (see how `CursorLayer.tsx` caches colour and samples at most every 120ms on scroll).
- **Scroll-linked effects use `useScrollProgress(ref, offset)` from `components/motion/useScrollProgress.ts` (hub in `lib/scroll.ts`), not Framer `useScroll`.** The hub reads scroll once per frame and only updates elements near the viewport. Pass a non-sticky, non-transformed target. Do not add a slow spring: a spring that has not settled keeps a frame loop running after the wheel stops.
- **Infinite animations must stop off-screen** (gate them with `useInView` or an IntersectionObserver). Prefer `transform` and `opacity`, which run on the compositor; avoid animating `clip-path`, `filter`, `box-shadow` or layout properties on scroll.
- **`will-change` only where an element is actually animating continuously** (the hero frame and card image are deliberate and documented). Do not put it on cards or list items.
- **Do not add scroll or pointer listeners per component.** Use the existing hubs: `onScrollFrame` / `useScrollProgress` for scroll, `PointerField` for pointer drift.
- Respect `prefers-reduced-motion`, the WebKit path (Lenis is disabled there, see `SmoothScroll.tsx`) and coarse pointers (no brush, no drift).
- **Measure before and after.** Use a production build (`npm run build`, then serve it), never `next dev`. Compare average FPS, worst-1% FPS, frames over 50ms and style-recalculation time (Chrome DevTools Performance panel, or Playwright with CDP `Performance.getMetrics`) for scroll, mouse movement and both together, at 1x and a CPU-throttled 2x. A change that makes mouse movement or scrolling drop frames is a regression even if it looks right.

## Docs and agents

- `README.md` (setup, deploy, tokens), `docs/cms/SPEC.md` (build spec), `docs/cms/DECISIONS.md` (environment overrides), `docs/cms-runbook.md` (operations), `docs/owner-checklist.md`.
- Role subagents live in `.claude/agents/` (`next-dev`, `system-architect`, `ui-designer`).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
