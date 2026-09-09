# Maison Palettia

Website for **Maison Palettia Events L.L.C.**, Dubai — a premium creative
lifestyle brand offering hands-on art, craft and pottery workshops.

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

## Commands

```bash
npm run dev     # development server on :3000
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
npx tsc --noEmit  # type check
```

## Structure

```
app/                 routes (/, about, workshops, gallery, blog, faq, contact)
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
```

## Design tokens

**All colours, type, spacing, radii, motion and breakpoints live in
`app/globals.css`** under `@theme static`. Nothing else in the codebase should
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

1. ✅ Project setup — **done**
2. Global header + navigation design
3. Homepage hero
4. Homepage sections
5. Workshop listing
6. Workshop detail + booking
7. About
8. Gallery
9. Journal
10. FAQ + Contact
11. Responsive refinement, animation, SEO, polish

## Outstanding client assets

Search the codebase for `TODO(client)`. Currently pending: logo artwork, the
Hapsha Sophia Script font file, production domain, address / email / phone,
social profile URLs, Open Graph image, and legal page content.
