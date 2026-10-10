# 01 — Content inventory: Maison Palettia → Payload CMS

**Source tree audited:** `/Users/rohitkvinod/Desktop/Nexeor/Projects/maison-palettia/maison-palettia-design`, branch `feat/client-content-pdf-fixes`, working tree as of 2026-10-09 (uncommitted UI changes included). Line numbers refer to that tree. Repo was read-only for this phase; nothing was edited.

**Method.** Every `lib/*.ts`, every `app/**/page.tsx|ts|opengraph-image.tsx`, and every `components/**/*.tsx` was read with comments stripped; string literals, JSX text, `alt`/`href`/`src`/`aria-label` props were extracted with line numbers; every file under `public/` and `assets/` was measured with `sips` and scanned for C2PA / SynthID / camera / editor markers; every exported content constant was cross-referenced for consumers; every image path in source was checked against disk.

**Target shape (settled by the owner):** Payload CMS 3.x in-app (`@payloadcms/next`), Postgres, RBAC, on-demand revalidation. This document only proposes *what* becomes a field; `02-…`/`03-…` specs own the schema code, Mamo Pay, email and analytics wiring. Where a field is *new* (no current value in code) it is marked **NEW**.

---

## 0. How to read the tables

| Column | Meaning |
|---|---|
| **Field** | Proposed Payload field name (camelCase). Nested as `group.field`. |
| **Type** | Payload field type: `text`, `textarea`, `richText` (Lexical), `number`, `checkbox`, `select`, `date`, `upload` (→ `media`), `relationship`, `array`, `blocks`, `group`, `json`, `email`, `slug` (text + `formatSlug` hook), `secret` (= `text` + beforeChange AES-GCM encrypt + afterRead mask; see 02 spec). |
| **Current value** | `file:line` of the hard-coded value today. |
| **Rendered by** | Component(s)/route(s) that print it. |
| **Label / help** | Admin label and the help text the editor sees. |
| **Req.** | Required in the admin. |
| **Validation** | Server-side rule the field should carry. Length limits come from the layout the string sits in. |
| **Client?** | ✅ editor may change freely · ⚠️ editor may change, but layout/legal consequences (help text warns) · 🔒 developer/admin role only (keys, slugs, flags that gate code paths) · ⛔ derived, never stored |

Roles assumed (from the RBAC decision): `admin` (Nexeor + owner), `editor` (studio staff: content, sessions, enquiries, bookings), `viewer` (read-only analytics). "Client?" above describes `editor`.

---

## 1. Summary

| Area | Count today | Proposed home |
|---|---|---|
| Site identity / contact / socials / legal | 1 object + 3 objects, mostly `null` placeholders | Global **Site Settings** |
| Navigation (header, 3 mega menus, mobile bar, mobile sheet, footer 3 groups, legal row, primary CTA) | 6 arrays + 3 component-local arrays | Global **Navigation** |
| Brand copy (deck-derived) | 16 exported constants in `lib/brand.ts`, 10 rendered | Global **Brand Copy** (shared snippets) + page blocks |
| Homepage | 7 sections, 3 of them pure data-driven | Page `home` (blocks) |
| About | 5 sections | Page `about` (blocks) |
| Experiences (activities) | 7 (5 DIY + 2 scheduled), 1 flagged "Coming soon" | Collection **experiences** |
| Sessions (dated, bookable) | 2 placeholders, both invented dates/prices/seats | Collection **sessions** |
| Private-event programmes | 4 | Collection **programmes** |
| Venues / mall partners | 1 confirmed (Times Square Center) + 10 past destinations (names only, unrendered) | Collection **venues** |
| Locations page | 1 route | Page `locations` (blocks) |
| Gallery | 3 collections on `/gallery` (7 + 6 + 3 images); homepage mosaic constant is dead code | Page `gallery` + `media` tags |
| FAQ | 10 Q&As in 3 groups | Collection **faqs** (+ group select) |
| Policies | 8 policies, 36 sections, 4 block types; 2 age tables | Collection **policies** |
| Passes / loyalty | 3 placeholders, page is `noindex` | Collection **passes** + Booking Settings flag |
| Testimonials | 2 invented quotes, **no renderer** | Collection **testimonials** (empty at launch) |
| Contact | 1 route, 1 form (5 fields, 5 topics) | Page `contact` + Collection **enquiries** |
| Private-event enquiry | 1 form (9 fields) | Collection **enquiries** |
| Booking flow copy | ~70 strings across 12 components | Global **Booking Settings** (terms, statuses, prefix) — field labels stay in code |
| SEO | 24 routes, 1 default share card, 2 per-route OG generators | per-document `seo` group + Global **SEO Defaults** |
| Images referenced in source | 76 paths (2 of them **missing on disk**) | Collection **media** |
| Images on disk | 134 files in `public/images`, 54 unreferenced; 8 confirmed AI-generated (C2PA), 4 Unsplash stock | media import list + delete list (§10) |
| Settings the brief requires in-admin | 0 exist today (only `NEXT_PUBLIC_WHATSAPP_NUMBER` + `DATABASE_URL` in `.env.example`) | Globals **Payments (Mamo Pay)**, **Email**, **Notifications**, **Invoice details**, **Analytics** — all **NEW** |

Two live defects found while crawling (not content decisions, but the CMS migration should not carry them over):

1. `/gallery` → "The making" collection references `/images/experience/pigment-on-paper.jpg` (`app/gallery/page.tsx:264`) which **does not exist** in `public/`. Same path in `lib/constants.ts:600` (`EXPERIENCE_IMAGES.pigment`, unused). Broken `<img>` on a live page.
2. `lib/constants.ts:486` — `WHATSAPP.number` falls back to the placeholder `"971500000000"` when the env var is blank. Nothing renders it today (client removed WhatsApp), but it is a fake phone number sitting in a constant; drop it with the env var when the field moves to Site Settings.

---

## 2. Proposed CMS shape (overview)

```
Globals                         Collections                      Page builder
──────────────────────          ─────────────────────────         ─────────────────────────
site-settings                   media                             pages (slug, blocks[], seo)
navigation                      experiences          (7)            home · about · locations
brand-copy                      sessions             (2 → real)     gallery · faq · contact
booking-settings                venues               (1 + past)     policies-index · loyalty
payments  (Mamo Pay)   NEW      programmes           (4)          Fixed-template routes read
email     (SMTP/API)   NEW      policies             (8)          collections directly:
notifications          NEW      faqs                 (10)           /events, /events/[slug],
invoice-details        NEW      passes               (3)            /events/[slug]/book,
seo-defaults                    testimonials         (0 live)       /private-events/[slug],
analytics              NEW      vibes                (3)            /policies/[slug], checkout,
                                enquiries            (submissions)  booking-status, payment-success
                                bookings / orders    (Mamo Pay)
                                users (RBAC)
```

Design rule carried over from the codebase: **components stay the renderers; the CMS only supplies data.** Every `lib/*.ts` module already exposes an async getter (`getCreativeExperiences`, `getAllWorkshops`, `getMallPartners`, `getPasses`, `getPolicy`, …). Phase 2 replaces those function bodies with Payload Local API calls (`payload.find`) wrapped in `unstable_cache`/`cacheTag`, and pages gain `revalidateTag` hooks. No component signature changes are required for collections; page-builder pages need one `BlockRenderer` switch.

---

## 3. Globals

### 3.1 Global: `site-settings`

| Field | Type | Current value | Rendered by | Label / help | Req. | Validation | Client? |
|---|---|---|---|---|---|---|---|
| `name` | text | `lib/constants.ts:16` `"Maison Palettia"` | `<title>` template, OG siteName, `Wordmark` aria, footer, 20+ files | **Brand name** — Appears in page titles, share cards and screen-reader labels. | ✔ | 2–40 chars | ⚠️ |
| `legalName` | text | `constants.ts:17` `"Maison Palettia Events L.L.C."` | Footer © line (`Footer.tsx:1021`) | **Legal entity name** — Printed after © in the footer and on invoices. | ✔ | ≤ 80 | ✅ |
| `tagline` | text | `constants.ts:24` `"Creative workshops and events in Dubai"` | `defaultMetadata.description`, OG description, share-image alt (`lib/seo.ts:52,93,116`), `StudioFilm.tsx:144` (unused component) | **Search tagline** — One plain sentence used as the default meta description. Not the script tagline (that is Brand Copy → Tagline). | ✔ | 40–160 chars | ✅ |
| `url` | text | `constants.ts:27` `"https://www.maisonpalettia.com"` (TODO placeholder) | `metadataBase`, sitemap, robots, canonical | **Public site URL** — The live domain, with https. Changing it changes every canonical and sitemap URL. | ✔ | valid absolute URL, no trailing slash | 🔒 |
| `locale` | text | `constants.ts:25` `"en_AE"` | OG locale | **Open Graph locale** | ✔ | `xx_YY` | 🔒 |
| `logoOnDark` | upload | `constants.ts:63-74` `/images/logo.png` 1015×438 (sage cut) | Header over dark hero, hero intro flight, all 3 OG generators | **Logo — light cut (for dark backgrounds)** — Transparent PNG, Light Sage script. | ✔ | png/svg, transparent, min 1000px wide | ⚠️ |
| `logoOnDark.ink` | group{left,top,width,height} number | `constants.ts:74` ratios | `HeroIntro` logo flight | **Ink box (advanced)** — Where the lettering sits inside the file; recomputed when the file changes. | — | 0–1 | 🔒 (auto via sharp alpha bbox hook) |
| `logoOnLight` | upload | `constants.ts:89-95` `/images/scroll-logo.png` 1120×466 (lilac cut) | Header when white, footer (`Footer.tsx:336`) | **Logo — dark cut (for light backgrounds)** | ✔ | as above | ⚠️ |
| `monogram` | upload | `public/brand/p-mark.svg` (2 KB) | Footer © line (`Footer.tsx:1014`) | **P-mark monogram** — Tiny square mark next to the copyright. | — | svg/png square | ⚠️ |
| `favicon`, `appleIcon`, `icon512` | upload ×3 | `app/favicon.ico` 48², `app/apple-icon.png` 180², `app/icon.png` 512² | browser tab / iOS | **Favicons** | — | exact sizes | 🔒 |
| `contact.addressLines` | array{line:text} | `constants.ts:412` `["Dubai","United Arab Emirates"]` | Contact "Find us" block (`app/contact/page.tsx:415-423`), footer "The studio" (`Footer.tsx:654-660`) | **Postal address lines** — One line per row. No street address exists yet. | — | ≤ 6 rows, ≤ 60 chars | ✅ |
| `contact.email` | email | `constants.ts:413` `null` | Contact page `mailto:`, footer, (future) enquiry recipient | **Public email** — Shown on the contact page and footer when set. | — | valid email | ✅ |
| `contact.phone` | text | `constants.ts:414` `null` | Contact page `tel:`, footer | **Public phone** — Printed as typed; link strips spaces. | — | E.164-ish `^\+?[\d\s]{7,20}$` | ✅ |
| `contact.whatsappNumber` | text | `constants.ts:486` env `NEXT_PUBLIC_WHATSAPP_NUMBER` → fallback `"971500000000"` (placeholder) | **Nothing** today (client removed the WhatsApp widget 2026-10; `ContactWidget` now links `/contact`) | **WhatsApp business number** — Digits only, country code first. Leave blank to keep WhatsApp off the site. | — | `^\d{10,15}$` | ✅ (replaces the env var — satisfies the no-.env constraint) |
| `contact.whatsappGreeting` | text | `constants.ts:487` `"Hello! I would like to ask about an upcoming event."` | nothing today | **WhatsApp pre-filled message** | — | ≤ 200 | ✅ |
| `contact.hours` | array{days:text, hours:text} | **none anywhere in code** | — | **Opening hours** — Not rendered yet; reserved for the venue plate / footer. | — | — | ✅ **NEW** |
| `socials` | array{platform:select[instagram,facebook,tiktok,youtube,x,linkedin], url:text} | `constants.ts:535-538` Instagram/Facebook both `href:null` | Contact "Follow" (`contact/page.tsx:476-496`, has Instagram+Facebook SVG glyphs), footer "Follow" (`Footer.tsx:701-714`) — both hide when all null | **Social profiles** — Only rows with a URL are shown. Instagram and Facebook have icons; others render as text. | — | https URL | ✅ |
| `newsletter.enabled` / `actionUrl` / `fieldName` / `heading` / `description` / `cta` | checkbox, text, text, text, textarea, text | `constants.ts:518-532` (`actionUrl:null`, "Newsletter", "New dates and new experiences, straight to your inbox.", "Subscribe") | **Not rendered** (`Footer.tsx:117` comment: no endpoint) | **Newsletter sign-up** — Appears in the footer only when enabled and a provider URL is set. | — | URL when enabled | ✅ (keep as dormant feature) |
| `heroTheme.darkRoutes` / `lightRoutes` | array{path} | `constants.ts:231,242` `[]`, `["/"]` | `HeaderBar`, `Hero` (header ink colour over hero) | **(advanced) Header colour per route** | — | leading `/` | 🔒 |

### 3.2 Global: `navigation`

Today one list (`MAIN_NAV`) feeds three surfaces via flags; keep that model (one array, per-item surface flags) so the desktop bar, mobile bottom bar, mobile sheet and footer cannot drift.

| Field | Type | Current value | Rendered by | Label / help | Req. | Validation | Client? |
|---|---|---|---|---|---|---|---|
| `primary[]` | array | `constants.ts:113-199` (6 items) | `HeaderBar.tsx:632-686` (desktop), `BottomNav.tsx:216-232` (mobile bar/sheet), `AboutSheet.tsx`, `MobileNav.tsx:306-335` (slide-out, currently unused) | **Main navigation** — Order here is order everywhere. | ✔ | 3–7 items | ⚠️ |
| `primary[].label` | text | "Experiences", "Private events", "About", "Locations", "Gallery", "Contact" (`:146,147,195-198`) | all surfaces | **Label** | ✔ | ≤ 16 chars (desktop bar), ≤ 10 for `mobileSurface=bar` items | ✅ |
| `primary[].link` | group{type: internal/external, page: relationship(pages), url: text, anchor: text} | hrefs `/events`, `/private-events`, `/about`, `/locations`, `/gallery`, `/contact` | — | **Destination** | ✔ | — | ⚠️ |
| `primary[].menu` | select[none, experiences, private-events, about] | `:146` experiences, `:147` private-events, `:195` about | `HeaderBar` picks `WorkshopsMenu`/`PrivateEventsMenu`/`AboutMenu` | **Opens a mega menu** — Which panel drops under this item on desktop. The panels' *contents* come from Experiences / Programmes / the About doors below. | — | at most one item per menu value | 🔒 |
| `primary[].mobileSurface` | select[bar, sheet, none] | `:146-147` bar, `:195-198` sheet | `BottomNav` | **On phones, show in** — "Bar" = always-visible bottom tab (max 3 incl. Contact); "Sheet" = behind the About tab. | ✔ | ≤ 3 `bar` items | ⚠️ |
| `primary[].mobileShortLabel` | text | `BottomNav.tsx:212-214` `{"/private-events":"Private"}` | bottom bar | **Short label for the bottom bar** — Falls back to Label. | — | ≤ 8 chars | ✅ |
| `primary[].secondary` | checkbox | `:196-198` true for Locations/Gallery/Contact | desktop bar omits; footer/mobile include | **Hide from desktop bar** (still in footer & mobile) | — | — | ⚠️ |
| `primary[].utility` | checkbox | (field exists on type `types/index.ts:65`; unset today) | `HeaderBar.tsx:775-797` right-hand cluster | **Show on the right beside search** | — | — | 🔒 |
| `bottomBarContactLabel` | text | `BottomNav.tsx:161` "Contact"; `BottomNav.tsx:460` "About" tab label; `:784` "Book" | `BottomNav` | **Bottom bar fixed tabs** — The Contact, About and Book tab labels. | ✔ | ≤ 8 | ✅ |
| `primaryCta.label` / `href` | text, link | `constants.ts:252-260` "Book a session" → `/events#scheduled`; `BottomNav.tsx:234` "Book a Session" (mobile sheet title/aria) | `BookAction.tsx:67` (header + slide-out), `BottomNav` Book button, `ContactWidget` | **Primary action button** — The one booking button in the header and the mobile Book tab. | ✔ | ≤ 18 chars | ✅ |
| `bookSheet.heading` / `lead` / `anytimeNote` / `anytimeLinkLabel` | text ×4 | `BookingSheet.tsx:250` "What would you like to create?", `:253` "Choose a scheduled experience to start your booking.", `:367` "Prefer to come anytime?", `:373` "Browse all experiences" | mobile Book sheet | **Book sheet copy** — Options list itself is derived from scheduled Experiences + open Sessions (`lib/bookingOptions.ts`). | ✔ | ≤ 60 / 120 / 40 / 30 | ✅ |
| `experiencesMenu.groups[]` | array{kind:select[diy,scheduled], title, note} | `WorkshopsMenu.tsx:62-73` "Create Anytime" / "No booking needed. Create at your own pace." ; "Create Together" / "Scheduled workshops, booked online." | desktop Experiences mega menu rail | **Experiences menu — group headings** — Rows under each come from Experiences by kind. | ✔ | title ≤ 20, note ≤ 60 | ✅ |
| `experiencesMenu.door` | group{title, sub, href} | `WorkshopsMenu.tsx:282-285` "Upcoming dates" / "Guided sessions you can book." → `/events#scheduled` | mega menu accent door | **Experiences menu — accent door** | ✔ | ≤ 20 / ≤ 40 | ✅ |
| `experiencesMenu.previewActionDiy` / `previewActionScheduled` | text | `WorkshopsMenu.tsx:330` "See the activity" / "See the session" | menu preview card | **Preview button labels** | ✔ | ≤ 20 | ✅ |
| `privateEventsMenu.railTitle` / `railNote` | text, text | `PrivateEventsMenu.tsx:130-131` "Made for Your Kind of Crowd" / "Don’t see yours? That’s probably a conversation worth having." | desktop Private events mega menu | **Private events menu — rail heading** — Rows = Programmes with "Show in menu" ticked. | ✔ | ≤ 32 / ≤ 90 | ✅ |
| `privateEventsMenu.previewEyebrow` / `previewAction` | text | `:167` "Private events", `:171` "See this programme" | preview card | — | ✔ | ≤ 20 | ✅ |
| `privateEventsMenu.doors[]` | array{title, sub, href, accent:checkbox} | `:196` "All private events" / "Every programme, in one place." → `/private-events`; `:201-206` "Plan a private event" / "Have something in mind?" → `/private-events/book` (accent) | two doors | **Private events menu — doors** | ✔ | 2 rows; ≤ 24 / ≤ 40 | ✅ |
| `aboutMenu.doors[]` | array{name, sub, link, mark:select(doodle)} | `AboutMenu.tsx:58-88` About the Maison/"Why we do it." · Locations/"Where to find us." · Gallery/"What gets made." · Contact/"Write to us." | desktop About mega menu (4 cut-out doors, no photos since 2f11e55) | **About menu — four doors** | ✔ | 4 rows; name ≤ 20, sub ≤ 24 | ✅ |
| `mobile.privateEventsCta` | text | `MobileNav.tsx:551` "Book a private event" | slide-out (component currently unmounted) | — | — | ≤ 24 | ✅ |
| `footer.groups[]` | array{title, items[]{label, link}} | `constants.ts:275-306` **Create**(All experiences `/events`, Private events, Gallery) · **The Maison**(About, Locations) · **Help**(Contact, FAQ `/faq`, Check a booking `/booking-status`) | `Footer.tsx:439-527` | **Footer link columns** — Three columns look best; the grid takes 1–4. | ✔ | 1–4 groups, ≤ 6 items each, title ≤ 14, label ≤ 24 | ✅ |
| `footer.findUsHeading` / `studioHeading` / `whyHeading` / `followHeading` / `policiesHeading` | text ×5 | `Footer.tsx:580` "Find us", `:652` "The studio", `:696` "Why we do it", `:703` "Follow", `:876` "Policies" | footer | **Footer small headings** | ✔ | ≤ 16 | ✅ |
| `footer.directionsLabel` | text | `Footer.tsx:630` "Get directions" | footer partner block | — | ✔ | ≤ 20 | ✅ |
| `footer.policiesBlurb` | textarea | `Footer.tsx:882-883` "How sessions run, what we ask of visitors, and what happens if plans change." | footer policies nav | **Policies blurb** | ✔ | ≤ 120 | ✅ |
| `footer.whyBody` | ⛔ derived | prints Brand Copy → `mission` (`Footer.tsx:698`) | footer | — | — | — | ⛔ |
| `footer.backToTop` | text | `BackToTop.tsx:64` "Back to top" | footer | — | ✔ | ≤ 16 | ✅ |
| `legal[]` | array{label, link} | `constants.ts:327-345` **empty** (Privacy/Terms never drafted) | `Footer.tsx:1024-1034`, `contact/page.tsx:469` comment | **Legal links (footer bottom row)** — Add Privacy / Terms here once those policies exist; usually a relationship to a Policy with `showInLegalRow`. | — | ≤ 4 | ✅ |
| `utilityBar.heading` | text | `PageUtilityBar.tsx:138` "More from Maison Palettia" | event page & checkout foot | **"More from…" heading** | ✔ | ≤ 32 | ✅ |
| `skipLink` | text | `app/layout.tsx:77` "Skip to content" | a11y | — | ✔ | ≤ 24 | 🔒 |
| `search.placeholderWide` / `placeholderNarrow` / `heading` / `popularHeading` / `noResultsTitle` / `noResultsBody` / `viewAllLabel` / `sessionsHeading` / `activitiesHeading` / `triggerLabel` | text ×10 | `SearchPanel.tsx:123-124` "Search events by name, type or location" / "Search by name, type or place"; `:425` "Search Maison Palettia"; `:516` "Popular searches"; `:540-542` "No events found" / "Try searching for another event, location, or activity."; `:550` "View all events"; `:569` "Sessions with dates"; `:602` "Activities"; `SearchTrigger.tsx:205` "Search experiences" | search panel | **Search panel copy** — Popular-search chips are derived (categories, "Create Anytime", "Weekend", localities — `lib/search.ts:169-205`). | ✔ | ≤ 48 each | ✅ |

### 3.3 Global: `brand-copy` (shared snippets lifted from the brand deck)

Keep as one global because several strings are printed on **multiple** pages and must not fork (see §7). Page-specific prose lives in the page's blocks instead.

| Field | Type | Current value | Rendered by | Label / help | Req. | Validation | Client? |
|---|---|---|---|---|---|---|---|
| `tagline` | text | `lib/brand.ts:39` "A Palette of Creativity for Everyone" | `/about` H1 (`about/page.tsx:201`), footer script line (`Footer.tsx:386`), homepage closing eyebrow (`ClosingStatement.tsx:69`), hero H1 split in 3 (`Hero.tsx:301-307` hard-coded copy of the same words) | **Script tagline** — Set in the script face; keep it to one short line. Changing it changes the About title, footer and homepage closing eyebrow together. | ✔ | ≤ 40 chars | ⚠️ |
| `brandStory` | array{paragraph:textarea} | `brand.ts:50-53` 2 paragraphs | `/about` lead (`about/page.tsx:218-222`), `WhyMaison.tsx:87` (unused) | **Brand story** — One row per paragraph. Also the source of the About page meta description (first sentence). | ✔ | 1–3 rows, ≤ 400 chars each | ✅ |
| `openingStatement.heading` / `body` / `closer` | text, textarea, text | `brand.ts:105-107` "A Little Space for Big Creativity." / "Maison Palettia is a place to make, experiment and unwind…" / "Come curious. Leave creative." | homepage §02 (`BrandStory.tsx:90-113`), `/gallery` H1+lede (`gallery/page.tsx:137-141` — H1 is a hard-coded duplicate of the heading), gallery divider card (`GalleryExperience.tsx:406`) | **"What this is" statement** — Heading is script; keep ≤ 32 chars. | ✔ | heading ≤ 32, body ≤ 300, closer ≤ 40 | ⚠️ |
| `openingStatement.panel.heading` / `body` / `signOff` | text, textarea, text | `brand.ts:109-111` "Create your Way." / "Pick an activity, bring your people or come on your own…" / "Welcome to Maison Palettia." | homepage lilac panel (`BrandStory.tsx:174-186`) | **Statement panel (lilac card)** | ✔ | ≤ 24 / ≤ 240 / ≤ 32 | ✅ |
| `mission` | textarea | `brand.ts:116` "To bring people together, one creative moment at a time." | `/about` Purpose card (`about/page.tsx:392-397`), footer "Why we do it" (`Footer.tsx:698`), `WhyMaison` (unused) | **Mission** — Deck p.3 labels Mission/Vision the other way round (TODO in code); the brief's assignment is used. | ✔ | ≤ 160 | ✅ |
| `vision` | textarea | `brand.ts:119-120` "We curate inspiring experiences where imagination, craftsmanship, and community come to life." | `/about` Purpose card (`:398`) | **Vision** | ✔ | ≤ 200 | ✅ |
| `purposeLabels.mission` / `vision` | text | `about/page.tsx:394,398` "Our Mission" / "Our Vision" | about Purpose cards | **Card labels** | ✔ | ≤ 16 | ✅ |
| `community.heading` / `body` / `closer` | text, textarea, text | `brand.ts:127-129` "Creating Community Through Creativity" / "…bring people together to explore creativity…" / "More than something to do, it’s a reason to pause, connect and come back for something new." | `/about` Community (`about/page.tsx:538-553`), gallery divider card (`GalleryExperience.tsx:413` prints `closer`) | **Community statement** | ✔ | ≤ 40 / ≤ 400 / ≤ 120 | ✅ |
| `journey[]` | array{slug 🔒, name, description} | `brand.ts:150-186` Create · Together · Connect · Refresh · Unplug (5) | `/about` list (`about/page.tsx:584-625`); **first two also** feed the `/events` "doors" (`events/page.tsx:110,175,184` print `description` of items 0 and 1 under "Create Anytime"/"Create Together") | **How people experience the Maison (5 steps)** — Keep the first two as walk-in and scheduled: the Experiences page quotes their descriptions. | ✔ | 3–6 rows; name ≤ 14, description ≤ 200 | ⚠️ |
| `whatSetsUsApart[]` | array{slug 🔒, name, description} | `brand.ts:289-314` For Everyone · Make & Connect · Create Responsibly · Always Something New | `/about` Apart cards (`about/page.tsx:772-832`) | **What sets us apart (4 cards)** — Card titles are set in caps; keep ≤ 22 chars. | ✔ | 4 rows (2×2 layout); name ≤ 22, description ≤ 160 | ⚠️ |
| `closing.heading` / `body` | text, textarea | `brand.ts:366-367` "Let’s Craft a Community Together." / "Maison Palettia is ready to bring art, creativity, and meaningful engagement." | homepage §07 (`ClosingStatement.tsx:84-90`), `/about` Close (`about/page.tsx:960-966`) | **Closing invitation** — Printed at the foot of the homepage and About. | ✔ | ≤ 36 / ≤ 160 | ✅ |
| `seasonalIntro` | textarea | `brand.ts:211-212` | `SeasonalExperiences` (unused component) | **Seasonal intro** | — | ≤ 300 | ✅ (dormant) |
| `seasonalMoments[]` | array{occasion, experience, image:upload} | `brand.ts:228-241` Valentine’s Day · Ramadan · Mother’s Day · Christmas (+ images hard-coded in `SeasonalExperiences.tsx:75-111`) | unused component | **Seasonal examples** — Examples of past seasons, not a calendar. | — | ≤ 6 | ✅ (dormant block) |
| `littleCreators[]` | array{name, image} | `brand.ts:200-204` Tissue art · Coffee painting · Wooden painting (+ images `LittleCreators.tsx:52-74`) | unused component | **Kids activities** | — | — | ✅ (dormant block) |
| `collaborations[]` | array{name, description} | `brand.ts:261-277` 3 models | `CollaborateTeaser` (unused) | **Collaboration models** | — | — | ✅ (dormant) |
| `experienceStatement` | textarea | `brand.ts:325-326` "Over the past year, we have delivered…" | **unused** (only in comments) | **Track-record statement** | — | — | ✅ (dormant) |
| `pastDestinations[]` | array{name} | `brand.ts:344-355` Reem Mall … Ithra (10) | **unused** (only in comments) | **Past destinations** — Places the studio *has* worked; never label them "find us". | — | — | ✅ (dormant; becomes `venues` with `status=past`, see §4.3) |
| `ourApproach[]` | array{line} | `brand.ts:358-362` (3) | unused | — | — | — | ✅ (dormant) |
| `eventPlates[]` | array{image, alt, width, height} | `brand.ts:390-409` 3 studio photos (768×1024, 480×640, 686×572) | `/gallery` "Made to keep" (`gallery/page.tsx:79-83`) | → becomes `media` tagged `made-to-keep`; see §5 gallery block | ✔ | — | ✅ |
| `brandStorySet` | ⛔ | `brand.ts:72-78` deck's original one-sentence story | nothing (kept for record) | — | — | — | drop (archive in a `notes` field) |

### 3.4 Global: `booking-settings`

Everything a booking *says*, plus the switches that gate the flow. The booking-form **field labels and validation messages** (First name, "Please check this email address.", etc.) stay in code — they are UI chrome, not editorial content — unless the client asks for Arabic later.

| Field | Type | Current value | Rendered by | Label / help | Req. | Validation | Client? |
|---|---|---|---|---|---|---|---|
| `mode` | select[request, recorded, paid] | derived today from `lib/bookingFlags.ts:37,50` (`PAYMENT_CONFIGURED=false`, `BOOKING_CONFIGURED=false` → `request`) | `bookingTerms()` → checkout foot (`Checkout.tsx:408`), confirmation (`Confirmation.tsx:83`), FAQ "Am I Charged When I Book?" (`constants.ts:1138`) | **Booking mode** — Request = saved to browser only; Recorded = sent to the studio, no payment; Paid = Mamo Pay checkout. Switching to Paid requires Payments to be configured (validated server-side). | ✔ | `paid` only if `payments.live|test` keys present | 🔒 |
| `terms.request` / `recorded` / `paid` | textarea ×3 | `constants.ts:1034-1038` | as above | **"What a booking is" sentence (per mode)** — Printed under the Confirm button, on the confirmation and in the FAQ. One sentence each. | ✔ | ≤ 240 | ⚠️ |
| `passCodesEnabled` | checkbox | `bookingFlags.ts:70` `PASS_CODES_CONFIGURED=false` | `PassCodeField` | **Pass / promo codes live** — Leave off until a code ledger exists. | — | — | 🔒 |
| `passCodeCopy.label` / `placeholder` / `apply` / `messages{empty,unavailable,invalid,applied}` | text ×7 | `PassCodeField.tsx:77,94,123,156-162` | checkout | **Pass code box copy** | ✔ | ≤ 40 / 20 / 12 / 160 | ✅ |
| `referencePrefix` | text | `lib/booking.ts:158` `"MP-D"` (D = demo) | every reference, lookup hint (`BookingStatusLookup.tsx:92,99` "MP-D4K7XY", "looks like MP-D followed by six characters") | **Booking reference prefix** — Becomes `MP-` for real bookings; the hint text is derived from it. | ✔ | `^[A-Z]{2,4}-?$` | 🔒 |
| `lowSeatThreshold` | number | `lib/workshops.ts:18` `LOW_SEAT_THRESHOLD = 4` | `availabilityLabel`, `spotsLabel`, `isScarce` | **"Few seats left" threshold** — At or below this many seats the session is flagged. | ✔ | 1–20 | ✅ |
| `statusCopy[confirmed|pending|completed|cancelled].label` / `note` | text, textarea ×4 | `BookingSummaryCard.tsx:47-71` e.g. "Your place is held. Come to the venue at the time below." | confirmation, status lookup, (future) emails | **Booking status wording** | ✔ | ≤ 16 / ≤ 160 | ✅ |
| `purchaseConfirmedNote` | text | `BookingSummaryCard.tsx:120` "Your purchase is confirmed." | pass-only orders | — | ✔ | ≤ 80 | ✅ |
| `checkout.heading` / `backLabel` / `detailsHeading` / `detailsLead` / `carriedOverNote` / `confirmLabel` / `confirmingLabel` / `emptyTitle` / `emptyBody` / `emptyCta` / `errorGeneric` / `errorEmpty` / `errorPassed` / `errorFields` | text/textarea ×14 | `app/checkout/page.tsx:61,52`; `Checkout.tsx:247,251-252,257,375,440,443-444,447,186,167,32,352` | checkout | **Checkout copy** | ✔ | sensible ≤ 200 | ✅ |
| `bookStep.heading` / `lead` / `backLabel` / `steps[]` / `continueLabel` / `openingLabel` / `summaryError` / `notesLabel` / `passedTitle` / `passedBody` / `passedCta` | text ×11 | `events/[slug]/book/page.tsx:166-169,122,193-202`; `Steps.tsx:18` ["Your details","Confirm"]; `BookingForm.tsx:524,70,432` | book step | **Booking step copy** — `passedBody` supports `{title}` and `{date}` tokens. | ✔ | — | ✅ |
| `confirmation.heading` / `viewEventsLabel` / `checkStatusLabel` / `notFoundHeading` / `notFoundTitle` / `notFoundBodyWithRef` / `notFoundBodyNoRef` | text ×7 | `Confirmation.tsx:61,88,96,164,168,173-175,178` | `/payment-success` | **Confirmation page copy** — `{reference}` token. | ✔ | — | ✅ |
| `status.heading` / `lead` / `fieldLabel` / `placeholder` / `hint` / `cta` / `noneTitle` / `noneBody` / `noneCta` | text ×9 | `app/booking-status/page.tsx:68,73-74`; `BookingStatusLookup.tsx:85,92,99,113,133,136-139,146` | `/booking-status` | **Booking status page copy** | ✔ | — | ✅ |
| `cart.heading` / `addAnother` / `removeLabel` / `passedLine` / `subtotalLabel` / `totalLabel` | text ×6 | `CartSummary.tsx:67,117,326,258,87,97` | checkout aside | **Basket copy** | ✔ | — | ✅ |
| `basketLinkLabel` | text | `BasketLink.tsx:30` "Booking" | header | — | ✔ | ≤ 12 | ✅ |
| `eventPage.bookLabel` / `closedFullFact` / `closedPassedFact` / `noneOpenSuffix` / `othersOpenSuffix` / `seeOpenLabel` / `diyTitle` / `diyBody` / `diyCta` / `comingSoonNote` / `readyHeading` / `readyBody` / `utilityNote` / `passedLabel` / `perPersonLabel` | text ×15 | `events/[slug]/page.tsx:786,931,936,949,955,869,872,878,810,1749,1762-1763,289,641,607` | event page | **Event page action copy** — `readyBody` ("Everything is laid out before you arrive. You bring nothing but yourself.") and `utilityNote` ("Everything you need is waiting for you…") are the "everything provided" promise flagged in `docs/policy-content-audit.md §1.1`; the policy says premium materials may cost extra. | ✔ | — | ⚠️ |
| `labels.scheduledSession` / `createAnytime` / `createTogether` / `noBooking` / `bookedOnline` / `anyTime` / `scheduled` | text ×7 | `EventCard.tsx:154` "Scheduled session"; `events/page.tsx:395` "No booking"/"Booked online"; `WalkInFacts` `:680-681` "Create Anytime"/"No booking needed"; `lib/experiences.ts:412-415` `EXPERIENCE_KIND_LABEL` "Any time"/"Scheduled" | cards, menus, filters | **Mode labels** — The two product names ("Create Anytime", "Create Together") appear in ~20 places; change them here once. | ✔ | ≤ 20 | ⚠️ |

### 3.5 Global: `payments` — **NEW** (Mamo Pay)

Nothing exists today beyond `PAYMENT_CONFIGURED=false`. Fields the brief requires in-admin; secrets stored encrypted.

| Field | Type | Label / help | Req. | Validation | Client? |
|---|---|---|---|---|---|
| `provider` | select[none, mamo] | **Payment provider** | ✔ | — | 🔒 |
| `environment` | select[test, live] | **Mode** — Test uses sandbox keys and never charges a card. | ✔ | `live` requires live keys | 🔒 |
| `test.apiKey` / `test.webhookSecret` / `test.businessId` | secret ×3 | **Mamo Pay — sandbox** | when env=test | masked after save | 🔒 |
| `live.apiKey` / `live.webhookSecret` / `live.businessId` | secret ×3 | **Mamo Pay — live** | when env=live | masked | 🔒 |
| `currency` | select[AED] | **Currency** (prices today are `{amount, currency:"AED"}` numbers, `types/index.ts:157-161`) | ✔ | — | 🔒 |
| `successPath` / `failurePath` | text | defaults `/payment-success`, `/checkout?failed=1` | ✔ | leading `/` | 🔒 |
| `captureNote` | textarea | **Line under the Pay button** (e.g. "You will be taken to Mamo Pay to complete payment securely.") | ✔ | ≤ 200 | ✅ |
| `lastWebhookAt` / `lastWebhookStatus` | date, text (read-only) | **Diagnostics** | — | — | ⛔ |

### 3.6 Global: `email` — **NEW**

| Field | Type | Label / help | Req. | Client? |
|---|---|---|---|---|
| `transport` | select[none, smtp, resend, sendgrid, mailgun] | **Email provider** | ✔ | 🔒 |
| `smtp.host` / `port` / `secure` / `user` / `password`(secret) | text, number, checkbox, text, secret | **SMTP** | when smtp | 🔒 |
| `apiKey` (secret) | secret | **Provider API key** | when api transport | 🔒 |
| `fromName` / `fromEmail` / `replyTo` | text, email, email | **Sender** — e.g. "Maison Palettia" <bookings@…> | ✔ | ✅ |
| `templates.bookingConfirmation.subject` / `intro` / `outro` | text, richText, richText | **Customer confirmation email** — Tokens: `{firstName}`, `{reference}`, `{eventTitle}`, `{date}`, `{time}`, `{venue}`, `{total}`. Attaches invoice PDF + QR tickets. | ✔ | ✅ |
| `templates.enquiryReceipt.subject` / `body` | text, richText | **Auto-reply to an enquiry** (today the UI says "A copy has not been emailed to you" — `PrivateEventEnquiry.tsx:284-285`; flip that copy when enabled) | — | ✅ |
| `templates.studioNotification.subject` | text | **Internal notification subject** | ✔ | ✅ |
| `ticket.heading` / `instructions` | text, textarea | **Printed on the QR ticket** (e.g. "Show this at the table."; arrival rule "arrive 10 minutes before" from `lib/policies.ts:400`) | ✔ | ✅ |
| `testRecipient` + "Send test" admin action | email | **Send a test email** | — | ✅ |

### 3.7 Global: `notifications` — **NEW**

| Field | Type | Label / help | Client? |
|---|---|---|---|
| `bookingRecipients[]` | array{email} | **Who is emailed on a new booking** | ✅ |
| `enquiryRecipients[]` | array{email} | **Who is emailed on a new enquiry** (contact + private-event) | ✅ |
| `lowSeatAlert` | checkbox + number | **Alert when a session drops to N seats** | ✅ |
| `dailyDigest` | checkbox + select(time) | **Daily summary of bookings/enquiries** | ✅ |

### 3.8 Global: `invoice-details` — **NEW**

Nothing exists today; `legalName` is the only legal string in code.

| Field | Type | Label / help | Req. | Client? |
|---|---|---|---|---|
| `legalName` | ⛔ reads Site Settings | — | — | — |
| `tradeLicenceNumber` | text | **Trade licence no.** | ✔ | ✅ |
| `trn` | text | **TRN (VAT registration)** — 15 digits | — | `^\d{15}$` ✅ |
| `vatRate` | number | **VAT %** (UAE 5) — prices today are integers with no tax split; decide inclusive/exclusive in 03 spec | ✔ | 0–100 ✅ |
| `pricesIncludeVat` | checkbox | **Prices shown include VAT** | ✔ | ✅ |
| `registeredAddress` | array{line} | **Registered address** | ✔ | ✅ |
| `invoicePrefix` / `nextInvoiceNumber` | text, number | **Invoice numbering** | ✔ | 🔒 |
| `footerNote` | richText | **Invoice footer** (refund policy summary, bank details, thanks) | — | ✅ |
| `logo` | ⛔ reads Site Settings `logoOnLight` | — | — | — |

### 3.9 Global: `seo-defaults`

| Field | Type | Current value | Label / help | Req. | Client? |
|---|---|---|---|---|---|
| `titleTemplate` | text | `lib/seo.ts:91` `"%s · Maison Palettia"` | **Title template** — `%s` = page title. | ✔ | 🔒 |
| `defaultDescription` | ⛔ Site Settings `tagline` | `seo.ts:93` | — | — | — |
| `shareImage` | upload | today drawn at runtime by `app/opengraph-image.tsx` (logo on Charcoal `#2D3748`, 1200×630 PNG); `seo.ts:48-53` | **Default share image** — 1200×630 JPEG under 600 KB (WhatsApp drops larger). Leave empty to keep the generated logo card. | — | 1200×630, ≤ 600 KB ✅ |
| `twitterCard` | select | `seo.ts:118` `summary_large_image` | — | ✔ | 🔒 |
| `robotsDisallow[]` | array{path} | `app/robots.ts:50-56` `/checkout`, `/payment-success`, `/booking-status`, `/events/*/book`, `/button-preview` | **Paths hidden from search engines** | ✔ | 🔒 |
| `sitemapStatic[]` | ⛔ derived from `pages` + collections (`app/sitemap.ts:46-68`) | — | — | — | ⛔ |

### 3.10 Global: `analytics` — **NEW**

| Field | Type | Label / help | Client? |
|---|---|---|---|
| `provider` | select[none, plausible, umami, ga4] | **Web analytics** | 🔒 |
| `siteId` / `scriptUrl` / `measurementId` | text | **Provider IDs** (public — these are not secrets) | 🔒 |
| `respectDnt` | checkbox | **Honour Do-Not-Track** | ✅ |
| `adminPanel.enabled` / `rangeDefault` | checkbox, select | **Show the analytics dashboard in the admin** (bookings, revenue, enquiries, top experiences) | ✅ |
| `metaPixelId` | text | **Meta Pixel** (optional) | 🔒 |

---

## 4. Collections

### 4.1 Collection: `media`

One collection, `upload: true`, sharp-generated sizes (`thumb 96`, `menu 192`, `card 640`, `plate 1200`, `hero 2000`, `og 1200×630`), `focalPoint: true` (replaces the hand-written `position: "50% 45%"` strings).

| Field | Type | Current equivalent | Label / help | Req. | Validation | Client? |
|---|---|---|---|---|---|---|
| `alt` | textarea | the `alt:` strings beside every `src` (≈ 70 unique, all descriptive, several deliberately say "beads" when copy says "gems" — `lib/experiences.ts:233-240`) | **Alt text** — Describe what is *in* the frame; never assert an occasion the photo does not show. | ✔ (empty allowed only with `decorative=true`) | ≤ 300 | ✅ |
| `decorative` | checkbox | `alt: ""` cases (`TESTIMONIALS_GROUND`, menu thumbs, hero bg) | **Decorative only** | — | — | ✅ |
| `focalPoint` | built-in | `position: "50% 42%"` etc. (≈ 25 hand-tuned values; e.g. `privateEvents.ts:210,230,248,283`, `constants.ts:376,927`) | **Focal point** — Click the subject; crops keep it in frame. | — | — | ✅ |
| `caption` | text | `constants.ts:591,597,603` "Late lilies, studio wall" etc.; `BrandIntro.tsx:159` "Brush to canvas" | **Caption** | — | ≤ 80 | ✅ |
| `credit` | text | none | **Photographer / source credit** | — | — | ✅ |
| `provenance` | select[studio, client-supplied, stock, ai-generated, unknown] | derived from §9 scan | **Provenance** — AI and stock images must not ship on commercial surfaces without a decision. | ✔ | — | ✅ |
| `consent` | checkbox | the rule in `brand.ts:374-389` (no identifiable children without written consent) | **Model/parent consent on file** | — | — | ✅ |
| `tags` | select hasMany [experience-hero, experience-gallery, programme, venue, gallery-make, gallery-making, gallery-keep, logo, og, hero, seasonal, kids] | folder structure today | **Where it may be used** | — | — | ✅ |
| `width`/`height`/`filesize`/`mimeType` | built-in | `brand.ts:394-407` widths/heights hand-typed | — | — | — | ⛔ |

### 4.2 Collection: `experiences` (the 7 activities; `lib/experiences.ts`)

Getter: `getCreativeExperiences()` (`experiences.ts:423`). Consumers: `/events` (both groups), `/events/[slug]` (DIY pages + About section of scheduled pages), `/private-events` + `/private-events/[slug]` activity grid, `/private-events/book` activity options, `/gallery` "What you can make", homepage carousel, Experiences mega menu, mobile menu, Book sheet, search.

| Field | Type | Current value (per entry) | Rendered by | Label / help | Req. | Validation | Client? |
|---|---|---|---|---|---|---|---|
| `name` | text | `experiences.ts:139,185,228,269,305,345,378` Tote Bag Painting · Ceramic Painting · Bedazzling · Mandala Painting · Glass Painting · Candle Making · Crocheting | everywhere; H1 on `/events/[slug]` (script face) | **Name** | ✔ | ≤ 24 chars (menu rail truncates; script H1 wraps at ~2 words/line) | ✅ |
| `slug` | slug | `:138,184,…` kebab | URL `/events/{slug}`; join key to `sessions` and `DIY_AGE_GUIDANCE` | **URL slug** — Changing it breaks links and the join to sessions. | ✔ | unique, `^[a-z0-9-]+$` | 🔒 |
| `kind` | select[diy, scheduled] | `:175,224,259,292,333,368,401` (5 diy, 2 scheduled) | groups on `/events`, menu groups, carousel label, Book sheet (only `scheduled`), search haystack | **How it is sold** — Create Anytime (walk in) or Create Together (booked for a date). | ✔ | — | ⚠️ |
| `description` | text | `:174,217,258,270,306,367,400` e.g. "A plain tote, waiting for your personality." | one-liner under name (menu preview, event page lead, private-events plate, Book sheet, search) | **One-line description** | ✔ | ≤ 60 chars | ✅ |
| `about[]` | array{paragraph:textarea} | `:140-143,186-192,229-232,271-274,307-310,346-349,379-382` 2 paragraphs each | `/events/[slug]` "About This Experience" (`events/[slug]/page.tsx:1211-1222`) | **About (long)** — One row per paragraph; two is the house length. Craft only: no price, age, duration or group size here (those are facts on the session / policy). | — | 1–4 rows, ≤ 320 chars each | ✅ |
| `image` | upload | `:177,220,261,294,337,370,403` `/images/experiences/<NAME>.jpg` 1024×1024 (all 7; see §9 provenance) + `position` | card/hero everywhere | **Main photograph** — Square works best (menu thumbs are 48 px squares; cards near-square). | — (card shows name on plain ground without it) | min 1000 px | ✅ |
| `gallery[]` | array{image:upload} (or relationship hasMany media) | `:144-173,193-216,241-257,275-291,311-332,350-366,383-399` 3 each (`/images/experience/*-1..3.jpg`, plus crochet reusing `studio/yarn-board.jpg`, `1-2.jpg`, `hero-carousel/crocheting.jpg`) | `/events/[slug]` fanned frames beside About (max 3, `eventDetail.ts:166`) | **Gallery (up to 3)** — Must not repeat the main photograph. | — | ≤ 3 | ✅ |
| `status` | text | `:335` "Coming soon" (Glass Painting only) | replaces kind label on cards/menus; event page "Status" fact + "Not running yet…" (`events/[slug]/page.tsx:685-693,810`); appended to private-enquiry options "(Coming soon)" (`private-events/book/page.tsx:68`) | **Status flag** — Shown verbatim instead of "Any time"/"Scheduled". Leave blank when live. | — | ≤ 20 | ✅ |
| `vibes` | relationship hasMany → `vibes` | `:103` **unset on all 7** (deliberate; see `lib/vibes.ts`) | "Find your vibe" filter on `/events` and mobile menu — hidden until ≥ 1 tag exists (`hasVibeTags`) | **Vibes** — Tag the mood; the filter appears automatically once anything is tagged. | — | — | ✅ |
| `ageGuidance` | text | `lib/policies.ts:133-137,148-149` keyed by activity name | policy pages only (`ages` blocks); audit §5.3 recommends surfacing on activity pages | **Age guidance** — e.g. "Age 12 and over." Printed on the policy pages' age tables. | — | ≤ 120 | ⚠️ |
| `order` | number | array order (`:26-27` "client's own stated priority: DIY first") | every list | **Display order** (drag in admin) | ✔ | — | ✅ |
| `published` | checkbox / drafts | n/a | — | **Published** | ✔ | — | ✅ |
| `seo` | group{title, description, image} | `events/[slug]/page.tsx:98-104` title = name, description = `description` ?? fallback "A Maison Palettia creative experience: art, craft and community in Dubai." | metadata; OG image drawn from `image` by `events/[slug]/opengraph-image.tsx` (684×360) | **Search snippet** — Leave blank to use name + one-liner. | — | title ≤ 60, desc ≤ 160 | ✅ |
| `privateEventEligible` | checkbox | all 7 listed on programme pages today (`private-events/[slug]/page.tsx:615-633`) | programme activity grid | **Offer for private events** — Untick 14+ workshops for kids' programmes if the client decides so (audit §1.5). | ✔ default true | — | ✅ |

### 4.3 Collection: `venues` (mall partners + past destinations; `lib/partners.ts`, `types/index.ts:460-498`)

| Field | Type | Current value | Rendered by | Label / help | Req. | Validation | Client? |
|---|---|---|---|---|---|---|---|
| `name` | text | `partners.ts:71` "Times Square Center" | `/locations` plate+map, `/events` group head (`events/page.tsx:236-246`), `/events/[slug]` location section, `/private-events` "Our home" card (`:1089-1096`), homepage `WhereWeCreate` map card (`:347`), footer "Find us" (`Footer.tsx:584`), `WhereWeSetUp` (per-session venue) | **Venue name** as signposted | ✔ | ≤ 40 | ✅ |
| `slug` | slug | `:70` | key | — | ✔ | unique | 🔒 |
| `locality` | text | `:72` "Dubai" | under name everywhere; search "Popular" chips (`lib/search.ts:174`) | **City / district** | ✔ | ≤ 32 | ✅ |
| `status` | select[current, past, upcoming] | current = the 1 partner; past = `brand.ts:344-355` 10 names (unrendered) | `/locations` shows `current` (falls back to "The next destination is being confirmed." `locations/page.tsx:263`); a future "Where we've been" block lists `past` | **Partnership status** — Only *Current* venues are called "Find us". Past venues are never shown as somewhere to go. | ✔ | — | ⚠️ |
| `descriptor` | textarea | `:94-95` "Find us at Times Square Center, where the Maison comes to life…" (client PDF p35) | `/locations` plate, `/private-events` card | **Description (venue pages)** | ✔ | ≤ 240 | ✅ |
| `eventDescriptor` | textarea | `:96-97` "Find us at Times Square Center, where creativity, community and a little time away…" (PDF p19) | `/events` group head + `/events/[slug]` plate (falls back to `descriptor`) | **Description (event pages)** — Written separately so one edit cannot rewrite the other surface (see note `partners.ts:74-92`). | — | ≤ 240 | ✅ |
| `locationHref` | text | `:98-99` Google Maps search URL | "View location" / "Get directions" buttons | **Directions link** — Centre's own page or a Maps link. | — | https URL | ✅ |
| `mapQuery` | text | type field, unset | `embedSrc()` (`LocationMap.tsx:25,40-41`) falls back to "name, locality" | **Map search override** | — | ≤ 120 | ✅ |
| `coordinates` | point | **none** (code explicitly refuses to guess, `LocationMap.tsx:21`) | future pinned embed | **Pin (lat/lng)** | — | — | ✅ **NEW** |
| `logo` / `image` | upload ×2 | type fields, unset; `public/images/brand/` holds only `.gitkeep` | **no renderer prints them yet** | **Centre logo / photograph** — Only the centre's own approved asset. | — | — | ✅ |
| `address` | array{line} | none | future | **Street address / floor / unit** | — | — | ✅ **NEW** |
| `hours` | array{days, hours} | none | future | **Opening hours at this venue** | — | — | ✅ **NEW** |
| `order` | number | editorial (`:104-111`) | — | — | ✔ | — | ✅ |

### 4.4 Collection: `sessions` (dated bookable workshops; `lib/workshops.ts`, type `Workshop` `types/index.ts:200-250`)

Both current entries are **placeholders** (invented date/time/price/seats; names/photos real). Getters: `getUpcomingWorkshops(limit)`, `getAllWorkshops()`, `getWorkshopBySlug()`, `getRelatedWorkshops()`. Consumers: `/events` schedule + filters, `/events/[slug]`, `/events/[slug]/book`, homepage `TwoWaysToCreate` "next date", `WhereWeSetUp`, search, Experiences mega-menu preview meta, Book sheet, cart lines.

| Field | Type | Current value | Rendered by | Label / help | Req. | Validation | Client? |
|---|---|---|---|---|---|---|---|
| `experience` | relationship → experiences | implied by shared `slug` (`workshops.ts:74,97` = `experiences.ts` slugs) | `eventDetail.ts:97-110` merges the two by slug | **Activity** — The session inherits name, photo and About from it unless overridden below. | ✔ | must be `kind=scheduled` | ✅ |
| `slug` | slug | `:74,97` `candle-making`, `crocheting` — **one session per activity today**; with real schedules there will be many dates per activity → slug must become `{experience}-{yyyy-mm-dd}` and `/events/[slug]` must list dates per activity (phase-2 routing note) | URL | **URL slug** (auto from activity + date) | ✔ | unique | 🔒 |
| `title` | text | `:75,98` "Candle Making", "Crocheting" | cards, H1, cart, confirmation, emails | **Title** — Defaults to the activity name. | ✔ | ≤ 40 | ✅ |
| `category` | text | `:76,99` "Craft" | breadcrumb, eyebrow, filter facet "Experience", search chips, cart category | **Category** — Free text; becomes a filter option. | ✔ | ≤ 20 | ✅ |
| `startsAt` | date (with time, tz Asia/Dubai) | `:77` `2026-10-11T15:30+04:00`, `:100` `2026-10-24T11:00+04:00` | every date/time string (`sessionDateParts`, `sessionTimeRange`, filters by month) | **Starts** — Studio time (Gulf Standard). Booking closes at the start time. | ✔ | future at creation | ✅ |
| `durationMinutes` | number | `:79` 120, `:102` 150 | "2 hours", end time, ISO duration | **Duration (minutes)** | ✔ | 15–480, step 15 | ✅ |
| `venue` | relationship → venues | `:78,101` `{name:"Times Square Center", locality:"Dubai"}` | "Where" fact, filter facet "Venue", cart, confirmation | **Venue** | — (omitted cleanly) | — | ✅ |
| `price.amount` / `currency` | number, select | `:80` 240 AED, `:103` 280 AED | `formatPrice` → "AED 240" everywhere; cart math | **Price per person (AED)** | ✔ | integer ≥ 0 | ✅ |
| `seatsTotal` / `seatsAvailable` | number ×2 | `:81-82` 12/9, `:104-105` 8/0 | spots label, scarcity, quantity cap in cart (`lib/cart.ts:210`) | **Seats** — Available is decremented by paid bookings (phase 2); edit by hand only to block seats. | ✔ | 0 ≤ available ≤ total | ⚠️ |
| `status` | select[open, waitlist, fully-booked, cancelled] | `:83` open, `:106` fully-booked | `isFullyBooked`, "Waitlist only" label, book page 404s when full | **Booking status** | ✔ | — | ✅ |
| `excerpt` | textarea | `:85` "Choose your scent, pour your candle and create something that's uniquely yours.", `:109` "A hook, a ball of yarn and one stitch to start from, worked into something you take with you." | event page lead (`eventIntro`), cards, search, meta description | **Short description** — One or two sentences. | ✔ | ≤ 160 | ✅ |
| `image` | upload | `:91,111` same files as the activity's main photo | card/hero/cart thumbnail | **Photograph override** — Leave empty to use the activity's. | — | — | ✅ |
| `gallery[]` | array | type field, empty (`types/index.ts:249`) | event page section renders only when non-empty | **Extra photos of this date** | — | ≤ 6 | ✅ |
| `about[]` | array{paragraph} | falls back to `experience.about` (`eventDetail.ts:153-163`) | About section | **About override** | — | — | ✅ |
| `kind` | ⛔ | type allows `diy`; `/events` filters `w.kind !== "diy"` | — | drop; sessions are always scheduled | — | — | ⛔ |
| `whatToBring` / `includes` | textarea | none (policy says "materials included are stated in the workshop description" `policies.ts:429`) | event page facts, ticket | **What's included / what to bring** | — | ≤ 300 | ✅ **NEW** |
| `minAge` | number | none (policy: 14+ for both) | facts, booking validation | **Minimum age** | — | 0–99 | ✅ **NEW** |
| `instructor` | text | none | facts | **Host / instructor** | — | ≤ 60 | ✅ **NEW** |

### 4.5 Collection: `programmes` (private-event audiences; `lib/privateEvents.ts:157-292`)

| Field | Type | Current value | Rendered by | Label / help | Req. | Validation | Client? |
|---|---|---|---|---|---|---|---|
| `name` | text | `:177,217,237,255` Birthday Parties · Corporate Events · School Programmes · Mall & Community Activations | `/private-events` cards, `/private-events/[slug]` H1, mega menu rail/preview, mobile menu, homepage `WaysToExperience` door labels (`:248,266,271,284`), private-enquiry "Event type" options (`PrivateEventEnquiry.tsx:428`), OG image title | **Programme name** | ✔ | ≤ 32 (script H1; OG shrinks font over 16 chars) | ✅ |
| `slug` | slug | `:176,216,236,254` (note `school-programs`, US spelling, is a URL — do not "fix") | `/private-events/{slug}`, homepage hrefs hard-coded (`WaysToExperience.tsx:250,268,273,286`) | **URL slug** | ✔ | unique | 🔒 |
| `description` | textarea | `:178-179,218-219,238-239,256-257` | card line, menu preview, homepage door note, `PrivateEventsTeaser` (unused) | **Short line (cards)** — Read beside three neighbours; keep parallel. | ✔ | ≤ 140 | ✅ |
| `lead` | textarea | `:180-181,220-221,240-241,258-259` | programme page standfirst (falls back to `description`), meta description | **Longer line (programme page)** | — | ≤ 220 | ✅ |
| `image` | upload | `:197,226,243,273` `/images/who-is-it-for/*.jpg` 2000×1333 ×2, 2000×1429, 4000×6000 + focal positions | card (4:3), masthead blob (3:2), menu thumb, OG card | **Photograph** — 3:2 crops well everywhere. | — (falls back to `mark`) | — | ✅ |
| `mark` | group{name:select(doodle), color:select(ink)} | `:212,232,250,285` splash/lavender · starburst/lilac · starleaf/terracotta · coral/cream | fallback when no image | **Brand cut-out (fallback)** | — | — | ✅ |
| `inPrivateEventsMenu` | checkbox | `:213,233,251,290` all true | mega menu + mobile menu | **Show in Private events menu** | ✔ | — | ✅ |
| `tone` | select | `app/private-events/page.tsx:59-97` `AUDIENCE_TONES` per slug (cream/lavender, charcoal, cream/sage, lilac) | card colours | **Card colour** — presentation; keep in code keyed by slug, or expose as a select | — | — | 🔒 |
| `order` | number | array order | — | — | ✔ | — | ✅ |
| `seo` | group | `private-events/[slug]/page.tsx:220-231` title = name, description = lead ?? description | metadata | — | — | — | ✅ |
| `enquiryHref` | ⛔ | `:155` `/private-events/book` (single enquiry flow) | all CTAs | — | — | — | ⛔ (Navigation setting `privateEventsEnquiryPage`) |

Shared private-events copy (page-level, see §5 blocks): `PRIVATE_EVENT_STEPS` (`:325-341` "01 Tell Us About Your Event / Share your occasion, group size and preferred date." · "02 Choose Your Experience / We will help shape the right creative activity for your group." · "03 Create Together / Everyone makes something, and everyone leaves holding it.") is printed on **three** routes (`/private-events`, `/private-events/[slug]`, `/private-events/book` sidebar) → Brand Copy `privateEventSteps[]` or a reusable block.

### 4.6 Collection: `policies` (`lib/policies.ts`; 8 docs)

| Field | Type | Current value | Rendered by | Label / help | Req. | Validation | Client? |
|---|---|---|---|---|---|---|---|
| `title` | text | `:164,279,357,475,523,549,609,657` General Customer Policy · DIY Experience Policy · Scheduled Workshop Policy · Cancellation & Rescheduling · Refund & Exchange · Safety & Children · Your Finished Projects · Photography & Media | `/policies` list, `/policies/[slug]` H1 (split on " & " or last word — `titleLines()`), footer nav | **Title** | ✔ | ≤ 40 | ✅ |
| `slug` | slug | `:163,…` | URL | — | ✔ | unique | 🔒 |
| `navLabel` | text | `:165,…` sentence-case variants | footer policies nav (`Footer.tsx:996`) | **Short label (footer)** | ✔ | ≤ 32 | ✅ |
| `summary` | textarea | `:166,281,359,477,525,551,611,659` | `/policies` list line, policy page standfirst, meta description | **Summary** | ✔ | ≤ 120 | ✅ |
| `sections[]` | array{heading:text, blocks: blocks[text, list, ages, callout]} | 36 sections; block types `PolicyBlock` `:93-103` → `text{body}`, `list{items[]}`, `ages{rows[]{activity,guidance}}`, `callout{title, body}` | `PolicyBody.tsx:33-179` | **Sections** — Each has a heading and one or more blocks. Policy prose is reproduced as written from the client's document (`docs/policy-content-audit.md`); do not paraphrase. | ✔ | heading ≤ 48 | ⚠️ (legal) |
| `sections[].blocks[ages].source` | select[diy, workshop, custom] | `DIY_AGE_GUIDANCE` (`:132-138`, 5 rows) reused 2×; `WORKSHOP_AGE_GUIDANCE` (`:147-150`, 2 rows) reused 2× | three policies print the same tables | **Age table** — "DIY" and "Workshop" pull the shared tables (edited once in Experiences → `ageGuidance`); "Custom" lets you type rows. | ✔ | — | ✅ |
| `effectiveDate` | date | none (audit §4: document carries none; policy §1 makes the date operative) | future "Effective from" line | **Effective date** | — | — | ✅ **NEW** |
| `showInLegalRow` | checkbox | n/a (`LEGAL_NAV` empty) | footer bottom row | **Show in footer legal row** (for Privacy / Terms when written) | — | — | ✅ |
| `requiresCheckoutConsent` | checkbox | none (audit §4 recommends "☐ I have read and agree…" checkbox) | checkout | **Require agreement at checkout** | — | — | ⚠️ |
| `order` | number | array order | list + footer | — | ✔ | — | ✅ |

Policies-index page copy (`app/policies/page.tsx:76-90,170-182`): eyebrow "Policies", H1 "How the / Maison Works.", standfirst "What applies when you come to make something with us.", close "Something / Unclear?" + "Ask before you book. We would rather answer a question twice than have you find out on the day." + CTA "Ask the Maison" → page block (§5). Policy detail close (`[slug]/page.tsx:158-181`): "Still / Wondering?", "If anything here does not cover what you need, ask us before you book.", "Ask the Maison", "All policies"; back link "All policies"; eyebrow "Policy".

### 4.7 Collection: `faqs` (`lib/constants.ts:964-1161`; 10 items in 3 groups)

| Field | Type | Current value | Rendered by | Label / help | Req. | Validation | Client? |
|---|---|---|---|---|---|---|---|
| `question` | text | `:966,976,981,991,1112,1121,1127,1141,1150,1155` | `/faq` accordion (`FaqList.tsx`) | **Question** | ✔ | ≤ 90 | ✅ |
| `answer` | richText (plain paragraphs) | `:973,978,988,993,1113,1123,1138(derived),1142,1152,1157` | accordion body | **Answer** — "Am I Charged When I Book?" today prints Booking Settings → terms for the current mode; model that as `answerSource = bookingTerms`. | ✔ | ≤ 600 | ✅ |
| `answerSource` | select[text, bookingTerms] | `:1138` `bookingTerms()` | — | **Answer comes from** | ✔ | — | 🔒 |
| `group` | select[coming, booking, groups] (labels editable in page block) | `:1106` "Coming to an event", `:1118` "Booking a place", `:1147` "Groups and passes" | group headings | **Section** | ✔ | — | ✅ |
| `order` | number | array order | — | — | ✔ | — | ✅ |
| `showOnHomepage` | checkbox | `HOMEPAGE_FAQ` (first 4) — **no homepage FAQ renderer exists today** | dormant | **Also show on homepage FAQ block** | — | — | ✅ |

Missing answers the audit lists as most-asked and now answerable from the policies (minimum age, children, accessibility, cancellation, collection/firing) — editor can add them with no code change.

### 4.8 Collection: `passes` (`lib/passes.ts:71-117`; 3 placeholders; `PASSES_CONFIGURED=false` → `/loyalty` is `noindex`, out of sitemap, shows "Preview passes…" disclaimer)

| Field | Type | Current value | Rendered by | Label / help | Req. | Validation | Client? |
|---|---|---|---|---|---|---|---|
| `name` | text | `:74,87,103` Day Pass · Maison Pass · Atelier Pass | `/loyalty` rows (`PassOffer.tsx:154`), cart title, confirmation "Pass" | **Pass name** | ✔ | ≤ 24 | ✅ |
| `slug` | slug | `:73,86,102` → cart slug `pass:{slug}` (`lib/cart.ts:222-224`) | — | — | ✔ | unique | 🔒 |
| `description` | textarea | `:75,88,104` | row | **One sentence** | ✔ | ≤ 120 | ✅ |
| `price.amount` | number (optional) | `:76,89,105` 320 / 1400 / 2600 AED | "AED 1,400", cart; absent → "This pass is not on sale online yet. Ask the Maison about it" (`PassOffer.tsx:231-238`) | **Price (AED)** — Leave empty to show "not on sale yet". | — | integer ≥ 0 | ✅ |
| `sessions` | number | `:77,90,106` 1 / 5 / 10 | "Sessions" fact; cart summary "5 sessions · valid 12 months…" (`cart.ts:245-249`) | **Sessions included** | — | 1–100 | ✅ |
| `validity` | text | `:78,91,107` "3 months from purchase" / "12 months from purchase" | "Valid for" fact, cart summary | **Validity (printed)** | — | ≤ 40 | ✅ |
| `benefits[]` | array{line} | `:79,92-95,108-111` ("Any strand: paint, craft or create" — note `:109` says "paint, shape or craft", a leftover from the pottery era) | bullet list | **Benefits (3–4 short lines)** | ✔ | ≤ 4 rows, ≤ 60 chars | ✅ |
| `image` | upload | `:81,97,113` `creative/painting.jpg` 1600², `workshops/watercolour-street.jpg` 1400×1949, `creative/craft.jpg` 1600² (stand-ins; `craft.jpg` alt describes pot-turning = pottery) | row plate | **Photograph** | — | — | ✅ |
| `order` | number | editorial | numerals 01–03 | — | ✔ | — | ✅ |
| Booking Settings `passesLive` | checkbox | `passes.ts:38` `PASSES_CONFIGURED=false` | disclaimer, noindex, sitemap | **Passes are final** — Turns off the "Preview passes" note and lists `/loyalty` in search. Only when real terms exist (no policy covers passes yet — audit §1.7). | — | — | 🔒 |

Loyalty page copy to block-ify (§5): eyebrow "Loyalty", H1 "Come More Than Once.", lead (`loyalty/page.tsx:134-136`), heading "Choose Your Pass", disclaimer (`:92-94`), "How it works" 4 steps (`:155-176`), footer sentence with two links (`:204-218`), empty state (`PassOffer.tsx:323-330`), add/added/failed messages (`:263,286-292,297-302`).

### 4.9 Collection: `testimonials` (`lib/testimonials.ts:33-46`)

Two **invented** quotes (file header: "MUST NOT SHIP"). **No component renders them** (the Testimonials section was removed; `TESTIMONIALS_GROUND` in `constants.ts:875-884` is also orphaned). Create the collection empty; add a `testimonials` block to the page builder for when real, permissioned quotes exist.

| Field | Type | Label / help | Req. | Client? |
|---|---|---|---|---|
| `quote` | textarea | **Quote** — one or two sentences | ✔ ≤ 280 | ✅ |
| `attribution` | text | **Who said it** — a first name with permission, or the session they attended | ✔ ≤ 60 | ✅ |
| `experience` | relationship → experiences | **Session** | — | ✅ |
| `permissionOnFile` | checkbox | **Written permission to publish** — required to publish | ✔ (gate publish) | ✅ |
| `published` | drafts | — | — | ✅ |

### 4.10 Collection: `vibes` (`lib/vibes.ts:62-81`)

| Field | Type | Current value | Label / help | Req. | Client? |
|---|---|---|---|---|---|
| `label` | text | "Messy & Expressive" · "Mindful & Chill" · "Quick 30-Min Crafts" | **Vibe** (set in caps) | ✔ ≤ 24 | ✅ |
| `slug` | slug | `messy-expressive`, `mindful-chill`, `quick-crafts` | — | ✔ | 🔒 |
| `blurb` | text | "Hands in it, no plan, see what happens." · "Slow, quiet, one small thing at a time." · "A short sitting, something finished to take away." | **One line (tooltip)** — a mood, never a fact about the programme | ✔ ≤ 60 | ✅ |
| Brand Copy `vibeQuestion` / `vibeHeading` / `vibeEmptyNote` | text | `vibes.ts:81` "How do you feel like creating today?"; `FindYourVibe.tsx:68` "Find your vibe"; `:160-161` "The Maison is still sorting its activities by vibe…"; `WalkInDiscovery.tsx:94` "Nothing is tagged that way yet…" | **Vibe filter copy** | ✔ | ✅ |

### 4.11 Collection: `enquiries` (form submissions — `lib/enquiry.ts`, `ContactForm.tsx`, `PrivateEventEnquiry.tsx`)

`ENQUIRY_CONFIGURED=false` today: both forms validate client-side then show "This message was not sent… no inbox connected" (`ContactForm.tsx:250-256`, `PrivateEventEnquiry.tsx:558-564`). Phase 2: server action → `payload.create('enquiries')` + notification email; flip the result copy to the success branch already written (`PrivateEventEnquiry.tsx:278-285` "Enquiry received / Thank you. We have your enquiry…").

| Field | Type | Source | Label | Req. | Validation | Who edits |
|---|---|---|---|---|---|---|
| `source` | select[contact, private-event] | which form | **Form** | ✔ | — | ⛔ system |
| `name` | text | both forms `name` ("Please tell us your name.") | **Name** | ✔ | ≤ 120 | ⛔ |
| `email` | email | both ("Please check this email address.") | **Email** | ✔ | regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` (`ContactForm.tsx:109`) | ⛔ |
| `phone` | text | contact: optional; private: required ("Please add a number we can reach you on." `PrivateEventEnquiry.tsx:712`) | **Phone** | private ✔ | ≥ 7 digits | ⛔ |
| `topic` | select | contact `ENQUIRY_TOPICS` (`enquiry.ts:62-75`): event "An event" · booking "A booking" · private "A private event" · collaboration "Working together" · general "Something else"; private form fixed `private` | **Topic** | ✔ | — | ⛔ |
| `message` | textarea | contact "Message" ("Please add a little about what you need."); private "What you have in mind" ("Please add a little about what you have in mind.") | **Message** | ✔ | ≤ 5000 | ⛔ |
| `details[]` | array{label, value} | private form only, filtered to answered + not "Not decided yet" (`:226-232`): Event type (programme name or "Something else"), Creative activity (experience name, "(Coming soon)" suffix), Preferred date (`type=date`; "Please check this date." / "Please choose a date that has not passed."), Estimated guests (numeric; "Please give this as a number, or leave it blank."), Preferred location (free text) | **Answers** | — | — | ⛔ |
| `status` | select[new, replied, closed, spam] | **NEW** | **Status** | ✔ | — | ✅ editor |
| `assignee` | relationship → users | **NEW** | **Assigned to** | — | — | ✅ |
| `internalNotes` | textarea | **NEW** | **Notes (internal)** | — | — | ✅ |
| `ip` / `userAgent` / `referer` / `honeypot` | text | **NEW** (rate-limit by IP per `enquiry.ts:103-106`) | — | — | — | ⛔ |

Form chrome to keep in code (or Booking-Settings-style global `forms`): legends "About you" / "About the event" (`:344,386`), note "Answer what you know. None of this is required…" (`:389-390`), "Not decided yet" (`:56`), "Something else" (`:429`), activity note (`:445`), submit "Send enquiry"/"Sending", error summary "One detail needs checking…" (`:532-533`), stub copy "Admit / The event / What you are sending / An enquiry, not a booking. / Nothing here is fixed once you send it." (`EnquiryStub.tsx:108-161`), contact form topic label "What can we help with" (`ContactForm.tsx:170`), "optional" suffix.

### 4.12 Collection: `bookings` (orders; today browser-only `localStorage` records — `lib/booking.ts:124-135`, `lib/cart.ts:41-117`)

| Field | Type | Source today | Label | Who edits |
|---|---|---|---|---|
| `reference` | text, unique | `mintReference()` `booking.ts:238-244` prefix + 6 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` | **Reference** (printed on ticket, lookup key) | ⛔ |
| `status` | select[pending, confirmed, cancelled, completed, refunded] | `BookingStatus` `:121`; `resolveStatus()` derives `completed` from last session end | **Status** | ✅ editor (cancel/refund) |
| `paid` / `paymentProvider` / `paymentId` / `paidAt` / `amountPaid` | checkbox, text, text, date, number | `record.paid` `:130` | **Payment** (Mamo Pay ids) | ⛔ webhook |
| `customer{firstName,lastName,email,phone,notes}` | group | `BookingDetails` `cart.ts:41-48`, labels `BookingForm.tsx:386-432`, validation `cart.ts:422-435` | **Guest** | ⛔ (editable by admin) |
| `lines[]` | array{kind:select[session,pass], session:relationship, pass:relationship, title, quantity, unitPrice, currency, startsAt, durationMinutes, venueName, venueLocality, summary} | `CartLine` `cart.ts:58-117` | **Lines** | ⛔ |
| `subtotal` / `vat` / `total` / `currency` | number ×3, select | `:293-295` | **Totals** | ⛔ |
| `tickets[]` | array{code, qrDataUrl, holderName, checkedInAt} | **NEW** | **QR tickets** | ✅ (check-in) |
| `invoiceNumber` / `invoicePdf` | text, upload | **NEW** | **Invoice** | ⛔ |
| `passCode` | text | `PassCodeField` (`redeemPassCode` stub `booking.ts:97-107`) | **Code applied** | ⛔ |
| `consentedPolicyVersion` | text | **NEW** (audit §4 checkbox) | — | ⛔ |
| `source` | select[web, admin, in-store] | policy: "Bookings may be made in-store, or through the … online booking system" (`policies.ts:374`) | **Channel** | ✅ |

### 4.13 Collection: `users` (RBAC)

`email`, `name`, `role: select[admin, editor, viewer]`, `active`, `lastLoginAt`. Field-level access: `payments.*`, `email.*`, `users.role`, every 🔒 field → `admin` only; `enquiries`/`bookings` read+update → `editor`; `analytics` read → all roles.

### 4.14 Collection: `pages` (page builder)

| Field | Type | Label | Req. | Client? |
|---|---|---|---|---|
| `title` | text | **Page title** (H1 fallback and SEO title) | ✔ | ✅ |
| `slug` | slug | fixed for the 8 known pages (`home`, `about`, `locations`, `gallery`, `faq`, `contact`, `policies`, `loyalty`); new slugs allowed for future landing pages via a catch-all `app/[slug]/page.tsx` | ✔ | 🔒 |
| `blocks[]` | blocks (catalogue §5) | **Sections** | ✔ | ✅ |
| `seo{title, description, image, noindex}` | group | **Search snippet** | — | ✅ |
| `_status` | drafts + versions | preview via Payload live preview | — | ✅ |

---

## 5. Page builder: block catalogue

Each block = one existing component, re-pointed at props. Fields listed are what the component actually prints today; decorative "doodle" marks and colours remain in the renderer (editor picks only a `tone` where the component already has variants). Pages that do *not* use blocks (collection-driven templates): `/events`, `/events/[slug]`, `/events/[slug]/book`, `/private-events/[slug]`, `/policies/[slug]`, `/checkout`, `/payment-success`, `/booking-status`. Their fixed copy sits in Booking Settings (§3.4) and in the per-route "template copy" groups noted below.

### 5.1 Blocks used today

| Block slug | Renderer | Page(s) | Fields (type) → current value | Notes |
|---|---|---|---|---|
| `hero` | `components/sections/Hero.tsx` (+ `hero/*` intro choreography) | `/` | `headlineLines` array{text} ×3 → "A Palette of" / "Creativity" (accent) / "for Everyone." (`Hero.tsx:301-307`, duplicates Brand Copy `tagline`); `accentLineIndex` number → 1; `sub` text → "There’s no wrong shade of creativity." (`:343`); `lead` textarea → "Pick your palette, get your hands busy and make something that’s completely yours." (`:362-363`); `primaryCta{label,link}` → "Explore experiences" `/events` (`:383`); `secondaryCta{label,link}` → "Plan a private event" `/private-events` (`:394`); `imageDesktop` upload → `/images/image.png` 1920×1080 PNG 2.3 MB (`:83`), `imageMobile` upload → `/images/mobile-hero.png` 768×1376 (`:112`) + alts; `scrollCueLabel` → "Scroll down" (`:410`), `scrollCueTarget` → `#experience-discovery` | Validation: each headline line ≤ 16 chars (script face, 3 lines); exactly one accent line. Both hero photos are AI-generated (see §9). The intro logo animation reads Site Settings logo. |
| `openingStatement` | `components/sections/home/OpeningStatement.tsx` → `BrandStory.tsx` | `/` | `eyebrow` → "What this is" (`OpeningStatement.tsx:59`); statement + panel read Brand Copy `openingStatement.*`; `panelImage` upload → `/images/about-sec-img.png` 1488×718 (**AI, SynthID**) alt "Three poured candles in a lined gift box…" (`BrandStory.tsx:155-156`) | Allow override of the shared copy per block (`useBrandCopy` checkbox default true). |
| `experienceCarousel` | `home/ExperienceDiscovery.tsx` + `ExperienceCarousel` + `events/ExperienceCard.tsx` | `/` | `eyebrow` → "The Maison Palettia experience"; `headingLines` → ["Pick a Colour,", "Pick a Table."]; `standfirst` → "Create Anytime (pick your palette…), or Create Together in a guided session…" (`ExperienceDiscovery.tsx:95-145`); `source` select[all, diy, scheduled, manual] + `experiences` relationship hasMany; card button "View details" (`ExperienceCard.tsx:124`) | Cards print name, photo, `status ?? kindLabel`. |
| `waysToTakePart` | `home/WaysToExperience.tsx` + `WaysTrail.tsx` | `/` | `eyebrow` → "Ways to take part"; `headingLines` → ["There Is More", "Than One Way In."]; `lead` → "Maison Palettia is a place to make, gather and create…" (`:316-330`); `groups[]` array ×4 {`name` → Create/Celebrate/Connect/Collaborate, `lede` textarea (`:197-198,222-223,262-263,280-281`), `photo` upload (`:160,166,172,178` CERAMIC_PAINTING.jpg, events/glitter-keepsakes.jpg, experience/community-table.jpg 1920×1080, events/national-day-cards.jpg), `tint` select, `doors[]` {label, note, link}} — door notes for Create are derived counts ("5 activities, no booking", "2 guided sessions" `:207,213`); programme doors read `programmes` | `doors[].noteSource` select[text, diyCount, scheduledCount, programmeDescription]. Hrefs to `/private-events/<slug>` are hard-coded today → relationship. |
| `twoWays` | `home/TwoWaysToCreate.tsx` | `/` | `eyebrow` → "How to take part"; `heading` → "Make It Your Way."; `lead` → "Drop in and create, or book a seat for a scheduled session." (`:157-172`); `roads[]` ×2 {`eyebrow` → "No booking" / "A date and a seat", `title` → "Create Anytime"/"Create Together", `line` → "Pick a project. Pick your colours. Just drop in." / "A little more planned. Same creative energy.", `facts[]` → ["No booking","Choose your activity", venue] / ["Booked online","Guided sessions", nextDate], `cta{label,link}` → "Find the studio" `/locations` / "See the dates" `/events#scheduled`, `ground` select[terracotta,lilac]} | `home` is **hard-coded** "Times Square Center, Dubai" (`:120`) → read `venues[status=current][0]`; `nextDate` derived from sessions ("Dates coming" fallback `:128`). Plates = first DIY / first scheduled experience image. |
| `whereWeCreate` | `home/WhereWeCreate.tsx` | `/` | `eyebrow` → "Find us"; `headingLines` → ["Your Next Creative", "Stop."]; `lead` → "Find Maison Palettia in the places you already love to visit — and come make something while you’re there." (`:145-160`); `findUsNowLabel` → "Find us now" (`:344`); `venue` relationship (default current) | Map iframe = Google embed from venue name (`embedSrc`). Same lead sentence appears on `/locations` H1 lede, `/locations` meta, FAQ answer 1, `WhereWeSetUp` → Brand Copy `findUsLine` (§7). |
| `closingInvitation` | `home/ClosingStatement.tsx` | `/` | eyebrow prints Brand Copy `tagline`; heading/body print Brand Copy `closing`; `primaryCta` → "Explore experiences" `/events`; `secondaryCta` → "Plan a private event" `/private-events/book` (`:107-126`) | |
| `aboutWelcome` | `app/about/page.tsx` `Welcome()` | `/about` | `eyebrow` → "About the Maison" (`:186`); H1 = Brand Copy `tagline`; paragraphs = Brand Copy `brandStory`; `image` upload → `/images/about-page-img.png` 1950×1950 PNG 2.4 MB alt "Two hands holding a small ceramic pot…" (`:280-286`) | Image is likely AI (PNG, square, see §9). |
| `missionVision` | `about/page.tsx` `Purpose()` | `/about` | two cards: labels + bodies from Brand Copy; `grounds` fixed lilac/cream | Also the dormant `WhyMaison` variant. |
| `communityJourney` | `about/page.tsx` `Community()` | `/about` | `eyebrow` → "The Maison experience" (`:530`); heading/body/closer = Brand Copy `community`; list = Brand Copy `journey[]` | |
| `whatSetsUsApart` | `about/page.tsx` `Apart()` | `/about` | `eyebrow` → "What sets us apart" (`:749`); `headingLines` → ["Why It Feels", "Different"]; cards = Brand Copy `whatSetsUsApart[]` | |
| `closingCtaLilac` | `about/page.tsx` `Close()`, `gallery/page.tsx:199-242`, `faq/page.tsx:202-240`, `policies/page.tsx:163-189`, `private-events/page.tsx` `EnquiryCta`, `contact/page.tsx` `EventsCta` | 6 pages | `eyebrow` (opt) → "Looking for an event?" (contact); `headingLines` → e.g. ["Still","Wondering?"], ["Ready to make","something of your own?"], ["Something","Unclear?"], ["The Programme,","Date by Date."], ["Let’s Make","Something Together."]; `body` textarea → e.g. "Just ask us. We’re always happy to help you get creating." (`faq:229`), "Pick an activity, bring your people, or come on your own." (`gallery:224`), "Have something in mind? Tell us when, who’s coming and what you’d like to make…" (`private-events:1450-1452`, duplicated on `[slug]:803-804`), "Every event lists its venue, its times and what you will make…" (`contact:615-616`); `primaryCta{label,link}` → "Ask the Maison" `/contact` ×3, "Explore experiences" `/events`, "Plan a private event" `/private-events/book`, "Explore upcoming events" `/events`; `secondaryCta` (opt, sticky-note style) → "Plan a private event" `/private-events` | One block, six instances. Validation: heading lines ≤ 2, ≤ 18 chars each. |
| `pageHeader` | `DisplayHeading` + `Eyebrow` pattern in `faq`, `gallery`, `locations`, `policies`, `booking-status`, `events` | 6 pages | `eyebrow` → "Questions" / "Gallery" / "Locations" / "Policies" / "Your booking" / "Experiences"; `headingLines` → ["Before You","Come and Make."] / ["A Little Space","for Big Creativity."] / ["Where to","Find Us."] / ["How the","Maison Works."] / ["Check Your","Booking."] / ["Make It","Your Way."]; `standfirst` → "Answers to common questions about Maison Palettia events." / `openingStatement.body` / `findUsLine` / "What applies when you come to make something with us." / "Enter the reference from your confirmation…"; `sideImage` upload + `sideImageSecondary` (gallery: GLASS_PAINTING.jpg + CANDLE_MAKING.jpg `gallery/page.tsx:153-167`) | Heading lines ≤ 2 (3 on `/private-events`), ≤ 18 chars (script face). |
| `faqList` | `faq/FaqList.tsx` | `/faq` | `groups[]` {`key` select, `title` → "Coming to an event" / "Booking a place" / "Groups and passes"}; items from `faqs` by group | |
| `galleryCollections` | `gallery/GalleryExperience.tsx` | `/gallery` | `collections[]` ×3 {`folio` → "Collection 01/02/03", `heading` → "What you can make" / "The making" / "Made to keep", `lede` → "Plenty of ways to spend an afternoon, and the thing you carry out at the end of it." / "Up close and mid-process: pigment, wax, marbled ink and a loaded brush." / "Finished pieces from real sessions, made to take home." (`gallery/page.tsx:85-116`), `ground` select[surface,cream,sage], `source` select[experiences, media-tag, manual], `images` relationship hasMany media} | Today: 01 = experiences with image (title = name, meta = status/kind label); 02 = `PROCESS_FRAMES` 6 studio stills (`:254-279`, **one missing file**); 03 = `EVENT_PLATES` 3 studio photos. Viewer aria labels "Close gallery viewer", "Previous picture", "Next picture", "View picture: {alt}" stay in code. Divider cards print Brand Copy `openingStatement.closer` and `community.closer` (`GalleryExperience.tsx:406,413`). |
| `locationsHero` | `app/locations/page.tsx` | `/locations` | header (see `pageHeader`); `findUsNowLabel` → "Find us now" (`:192`); `emptyNote` → "The next destination is being confirmed." (`:263`); `venues` relationship (default: all `current`) → `PartnerPlate` + `LocationMap` | `EXPERIENCE_STATEMENT`, `PAST_DESTINATIONS`, `OUR_APPROACH` are imported but not printed (comments only) → a future `pastDestinations` block. |
| `contactIntro` | `app/contact/page.tsx` `Invitation()` + `Details()` + `Enquiry()` + `Portrait()` | `/contact` | `eyebrow` → "Contact"; `headingLines` → ["Let's Create","Something Together."]; `lead` → "Whether it is a question about an upcoming event, a place you would like to keep, or something you would like to make with us, write to the Maison and we will take it from there." (`:157-166`); `findUsHeading` → "Find Us" (`:410`), `whereTerm/emailTerm/phoneTerm/followTerm` → "Where"/"Email"/"Phone"/"Follow", `venuesLinkLabel` → "Venues are listed with each event" `/events` (`:434`); `formHeading` → "Write to Us", `formLead` → "A few lines is plenty. Tell us what you are after and we will come back to you." (`:322-326`); `portrait` upload → `/images/hero/plate-painting.jpg` 1920×1080 alt (`:276-277`) | Contact details read Site Settings. |
| `privateEventsIntro` | `app/private-events/page.tsx` `Introduction()` | `/private-events` | `eyebrow` → "Creative experiences, made for your moment"; `headingLines` → ["Memories","Made by","Hand."]; `lead` → "From birthdays and celebrations to team gatherings and private events, Maison Palettia brings people together to create, connect and have a little fun…" (`:288-314`); `image` → `/images/hero/tote-painting.jpg` 1920×1080 alt "Two pairs of hands at one table…" | |
| `programmesGrid` | `private-events/page.tsx` `WhoItIsFor()` | `/private-events` | `eyebrow` → "Who it is for"; `headingLines` → ["Made for Your","Kind of Crowd."]; `lead` → "Maison Palettia creates hands-on experiences for all kinds of groups. Don’t see yours? That’s probably a conversation worth having." (`:453-471`); `cardCta` → "See the programme" (`:676`); items = `programmes` | Same lead text as the mega menu rail note → Brand Copy `programmesNote`. |
| `activitiesGrid` | `private-events/page.tsx` `Experiences()`; `[slug]/page.tsx` `Activities()`; renderer `private-events/ActivityPlate.tsx` | `/private-events`, `/private-events/[slug]` | `eyebrow` → "The experiences" / "The making"; `headingLines` → ["Pick Your Kind of","Creative."] / ["Pick Your Creative"]; `lead` → "From painting and bedazzling to candles, crochet and more…" (`:786-791`) / "Choose from the Maison’s creative experiences, or let us help you find the one that fits your group, occasion and vibe." (`[slug]:590-593`); `source` → experiences (`privateEventEligible`); `linkTo` select[experiencePage, enquiry] | Plate prints name, description, status. |
| `venueSpotlight` | `private-events/page.tsx` `CreateWithUs()` | `/private-events` | `eyebrow` → "Create with us"; `headingLines` → ["Your Next","Creative Stop."]; `lead` → "Maison Palettia brings creativity into the places you already visit — so you can stop by, pick a project and make something along the way." (`:1037-1041`); `cardLabel` → "Our home" (`:1089`); `venue` relationship (prints name, locality, `descriptor`) | |
| `steps` | `private-events/page.tsx` `HowItWorks()`; `[slug]` `HowItWorks()`; `book/page.tsx` sidebar "What happens next" (`:161`); `loyalty/page.tsx` `HowItWorks()` | 4 routes | `eyebrow` → "How it works"; `headingLines` → ["Let’s Make It","Happen."]; `steps[]` {number, title, detail} → Brand Copy `privateEventSteps` (3) or loyalty's own 4 (`loyalty:155-176` "Choose Your Pass / Add It to Your Booking / Check Out as a Guest / Keep Your Reference"); `variant` select[cards, list] | |
| `passesList` | `loyalty/PassOffer.tsx` | `/loyalty` | `eyebrow` → "Loyalty"; `heading` → "Come More Than Once."; `lead` (`loyalty:134-136`); `listHeading` → "Choose Your Pass"; `previewDisclaimer` textarea (`:92-94`, shown while `passesLive=false`); `sessionsTerm/validTerm` → "Sessions"/"Valid for"; `addLabel` → "Add to booking"; `notOnSale` → "This pass is not on sale online yet."; `askLabel` → "Ask the Maison about it"; `addedNote` → "Added to your booking{count}."; `viewBookingLabel` → "View your booking"; `failedNote`; `emptyTitle/emptyBody/emptyCta` (`PassOffer.tsx:323-330`); `footerSentence` with 2 links (`loyalty:204-218`) | |
| `policiesIndex` | `app/policies/page.tsx` list | `/policies` | header + `items` ⛔ from `policies` ordered | |
| `utilityBar` | `layout/PageUtilityBar.tsx` | event page, checkout | `note` textarea (opt) → "Everything you need is waiting for you…"; `links[]` {label, link} → event: "All events" `/events`, "Questions" `/faq`, "Contact" `/contact`; checkout: "Check a booking" `/booking-status`, "Questions", "Contact" | Heading from Navigation `utilityBar.heading`. |
| `whereWeSetUp` | `events/WhereWeSetUp.tsx` | `/events` foot | `eyebrow` → "Find us"; `heading` → "Your Next Creative Stop."; `lead` → `findUsLine`; `nextLabel` → "Next {weekday} {date}" (`:178`); `cta` → "Find the studio" `/locations` | Lists venues that have an upcoming session. |
| `eventsDoors` + `groupHeads` | `app/events/page.tsx` `Door()`/`GroupHead()` | `/events` (template) | doors: `title` → "Create Anytime"/"Create Together", `note` ← Brand Copy `journey[0|1].description`, `modeLabel` → "No booking"/"Booked online" (`:395`); group heads: `lead` → "Pick a project. Pick your colours. Just drop in." / "A little more planned. Same creative energy." (`:223,279`); `viewLocationLabel` → "View location"; empty state → "The next dates are being set." / "Create Anytime experiences are available in the meantime." (`:284-287`); filters empty → "No events match those filters." / "The programme is small and runs a few dates at a time. Clearing the filters…" / "Clear all filters" (`EventsBrowser.tsx:118-130`); filter labels (`EventFilters` groups: month/day, category "Experience", venue) | Store as `pages[events].templateCopy` group (not blocks). |
| `eventDetailCopy` | `app/events/[slug]/page.tsx` | template | breadcrumb "Home / Events / {category}"; eyebrow `typeLabel` ("Create Anytime" for DIY); fact terms "When/Where/Price/per person/How it runs/No booking needed/Status"; `aboutHeading` → "About This Experience"; location heading → "Where It Happens" (scheduled) / "Your Next Creative Stop." (DIY); `directionsNote` → "Full directions for this centre are confirmed with your booking." (`:1686`); `moreEventsHeading` → "More Events"; `soloEyebrow` → "Scheduled session"; `soloCta` → "View this session"; stub terms "Date/Time/Duration/Location/Price/Experience" | Booking-action copy is in §3.4 `eventPage.*`. |

### 5.2 Dormant blocks (component exists, nothing mounts it — register as optional blocks or delete)

| Block | Component | Data it would read | Decision needed |
|---|---|---|---|
| `brandIntro` | `sections/BrandIntro.tsx` ("Create. Explore. Experience." + "made by hand" + `BRAND_INTRO_IMAGE` `/images/experience/painting.jpg`) | Brand Copy | superseded by `openingStatement` |
| `experienceEditorial` | `sections/Experience.tsx` ("Make space for creativity." + 3 captioned plates `EXPERIENCE_IMAGES`, one file **missing**) | constants | superseded |
| `littleCreators` | `sections/LittleCreators.tsx` ("Tailored kids activities" / "For Our Little Creators." / 3 plates — all three plates carry Photoshop+C2PA and Imagen-shaped 768×1376) | Brand Copy `littleCreators` | client to confirm kids offer + real photos |
| `seasonal` | `home/SeasonalExperiences.tsx` ("Limited time" / "A different season, every season.") | Brand Copy `seasonal*` | worth keeping as a block |
| `collaborateTeaser` | `home/CollaborateTeaser.tsx` ("Collaborative approach" / ["Let’s Create","Together."] / "For malls, retailers and F&B partners…" / "Partner with us" `/contact` / "How we work with malls" `/locations#collaborate` — anchor does not exist) | Brand Copy `collaborations` | keep as block for a future partners page |
| `whyMaison` | `home/WhyMaison.tsx` (prints `BRAND_STORY` array directly into a `<p>` — would render "para1,para2") | Brand Copy | delete or fix |
| `workshopJourney` | `home/WorkshopJourney.tsx` ("What we offer" / ["The Workshop","Journey."] / `/images/workshop-journey.jpg` 6720×4480 2.7 MB) | Brand Copy `journey` | keep |
| `privateEventsTeaser` | `home/PrivateEventsTeaser.tsx` (["Make something","memorable","together."] + programmes list) | programmes | keep |
| `studioInterlude` | `home/StudioInterlude.tsx` (2 plates `/images/i-1.jpg`, `/images/1-2.jpg`) | media | keep as `imagePair` |
| `communityMoment` | `home/CommunityMoment.tsx` (parallax `/images/middle-section-bg.jpg` 6192×4128 4.3 MB) | Brand Copy `community` | keep as `fullBleedStatement` |
| `maisonPhilosophy` | `sections/MaisonPhilosophy.tsx` (`MAISON_PHILOSOPHY` "Made slowly. / Felt deeply." + accent "the long way round") | constants | keep or drop |
| `sessionCarousel` / `sessionShowcase` / `workshopFeature` / `eventHeadline` | `sections/SessionCarousel.tsx`, `events/SessionShowcase.tsx`, `workshops/*` ("Upcoming sessions", "Book this session", "This date is full. The next events are below.") | sessions | keep one as `upcomingSessions` block |
| `studioFilm` | `sections/StudioFilm.tsx` + `FilmStage` (`/videos/maison-film.mp4` 2.5 MB 720p, poster `hero/film-poster.jpg`, "A short film", "1:01") | media (video) | keep as `film` block; the other 3 mp4s (16 MB, 5.9 MB, 2.6 MB) are unreferenced |
| `galleryWall`, `experiencePlate`, `mallMap`, `menuSplash`, `mobileNav` | misc | — | delete candidates |
| Orphan constants with no component at all: `EDITORIAL_PANELS` (`constants.ts:632-697`, two mood panels + 2 editorial images), `HOW_IT_WORKS` (`:736-753` Choose/Book/Come by/Create), `ABOUT_TEASER` (`:762-768`), `PLAN_YOUR_VISIT` (`:821-849`), `TESTIMONIALS_GROUND`, `GALLERY_TILES` (`:919-947`), `HOMEPAGE_FAQ` (only via `FAQ_GROUPS`), `getTestimonials`, `getRecentAdditions` (`lib/recent.ts` 4 items → `/gallery`) | — | import `HOW_IT_WORKS` as a `steps` instance; archive the rest in Brand Copy `notes` |

---

## 6. SEO per route (`buildMetadata` in `lib/seo.ts:130-186`)

| Route | Title (`%s · Maison Palettia`) | Description | noindex | Share image | Source |
|---|---|---|---|---|---|
| `/` | "Maison Palettia" (default, no template) | Site tagline | no | generated logo card `app/opengraph-image.tsx` 1200×630 | `seo.ts:87-127` |
| `/events` | "Experiences" | "Every Maison Palettia creative experience: Create Anytime activities you can enjoy at your own pace, and guided Create Together sessions you book online for a set date." | no | default | `events/page.tsx:22-27` |
| `/events/[slug]` | activity/session title | `excerpt` or `description`, fallback "A Maison Palettia creative experience: art, craft and community in Dubai." | no | **own** 684×360 from the event photo (`events/[slug]/opengraph-image.tsx`; `ROUTES_WITH_OWN_SHARE_IMAGE` `seo.ts:78-81`) | `:91-105`, `revalidate = 600` |
| `/events/[slug]/book` | "Book: {title}" / "Book an event" | "Reserve your place at a Maison Palettia event." | **yes** | default | `book/page.tsx:76-88`, `revalidate = 600` |
| `/private-events` | "Private events" | "Creative experiences designed around your people, your occasion and your space. A private Maison Palettia session where everyone makes something to take home." | no | default | `:99-104` |
| `/private-events/[slug]` | programme name | `lead ?? description` | no | **own** 684×360 (`private-events/[slug]/opengraph-image.tsx`, alt "A Maison Palettia private event: its photograph beside its name") | `:209-231` |
| `/private-events/book` | "Plan a private event" | "Tell us when, who’s coming and what you’d like to make. We’ll help turn the idea into an experience made for your group." | no | default | `:19-24` |
| `/about` | "About" | "Maison Palettia is a creative space built for slowing down, switching off and getting your hands busy." (= `brandStory[0]` first sentence) | no | default | `about/page.tsx:46-51` |
| `/locations` | "Locations" | `findUsLine` | no | default | `:20-25` |
| `/gallery` | "Gallery" | "Step inside Maison Palettia: what gets made here, the hands that make it, and the pieces that go home." | no | default | `:17-22` |
| `/contact` | "Contact" | "Ask the Maison about an event, a booking or working together, or find an upcoming event and keep a place." | no | default | `:41-46` |
| `/faq` | "FAQ" | "Answers to common questions about Maison Palettia events." | no | default | `:13-17` |
| `/policies` | "Policies" | "The Maison Palettia studio policies: how sessions run, what we ask of visitors, and what happens if plans change." | no | default | `:14-19` |
| `/policies/[slug]` | policy title | policy summary | no | default | `:25-35` |
| `/loyalty` | "Passes" | "Maison Palettia passes: hold your sessions in advance and check out as a guest." | **while `PASSES_CONFIGURED=false`** | default | `:12-40` |
| `/checkout` | "Checkout" | "Complete your Maison Palettia booking." | yes | default | `:12-17` |
| `/payment-success` | "Your booking" | "Your Maison Palettia booking reference and event details." | yes | default | `:10-15` |
| `/booking-status` | "Check your booking" | "Look up a Maison Palettia booking by its reference to see its status." | yes | default | `:11-16` |
| `/blog` | "Journal" | "Notes and stories from the Maison Palettia studio." | yes (placeholder page "Phase 9") | default | `blog/page.tsx:5-10` |
| `/button-preview` | "Button preview" | "Temporary: the two candidates for the hero's secondary action." | yes | default | **delete before launch** |
| `/workshops*` | 301 → `/events*` | — | — | — | `next.config.ts` redirects |
| `/sitemap.xml` | static paths + events + programmes + policies (+ `/loyalty` when live) | — | — | — | `app/sitemap.ts` → derive from `pages` + collections |
| `/robots.txt` | allow `/`, disallow 5 paths | — | — | — | `app/robots.ts` → SEO Defaults |

CMS mapping: every collection document and page gets `seo{title, description, image, noindex}`; defaults derive exactly as above. The two per-route OG generators keep working from the document's `image` field (no change).

---

## 7. Strings shared across surfaces (edit once → must update everywhere)

| String | Where it appears today | Proposed single source |
|---|---|---|
| "A Palette of Creativity for Everyone" | `brand.ts:39` (About H1, footer, home closing eyebrow) **and** re-typed as 3 lines in `Hero.tsx:301-307` | Brand Copy `tagline`; hero block gets `useTagline` toggle |
| "A Little Space for Big Creativity." | `brand.ts:105` (home) **and** re-typed `gallery/page.tsx:137` as H1 lines | Brand Copy `openingStatement.heading` |
| "Find Maison Palettia in the places you already love to visit — and come make something while you’re there." | `constants.ts:973` (FAQ), `locations/page.tsx:23,135-136` (meta + lede), `WhereWeCreate.tsx:158-159`, `WhereWeSetUp.tsx:142-143` | Brand Copy `findUsLine` |
| "Your Next Creative Stop." | `WhereWeCreate.tsx:150`, `WhereWeSetUp.tsx:136`, `private-events/page.tsx:1028-1029`, `events/[slug]/page.tsx:1543` | Brand Copy `findUsHeading` |
| "Have something in mind? Tell us when, who’s coming and what you’d like to make. We’ll help turn the idea into an experience made for your group." | `private-events/page.tsx:1450-1452`, `[slug]/page.tsx:803-804`, `book/page.tsx:22,131-132`, FAQ `constants.ts:1152` (variant) | Brand Copy `privateEventInvite` |
| "Don’t see yours? That’s probably a conversation worth having." | `private-events/page.tsx:469-470`, `PrivateEventsMenu.tsx:131` | Brand Copy `programmesNote` |
| "Made for Your Kind of Crowd" | `private-events/page.tsx:459-460`, `PrivateEventsMenu.tsx:130` | Brand Copy / block heading |
| "Make It Your Way." | `events/page.tsx:165`, `TwoWaysToCreate.tsx:164` | Brand Copy `makeItYourWay` |
| "Pick a project. Pick your colours. Just drop in." / "A little more planned. Same creative energy." | `events/page.tsx:223,279`, `TwoWaysToCreate.tsx:191,252` | Booking Settings `labels.diyLine` / `scheduledLine` |
| "Create Anytime" / "Create Together" | ~20 sites (`events/page.tsx`, `WorkshopsMenu`, `SearchPanel:621`, `FAQ`, `policies.ts`, `ExperienceDiscovery`, `WaysToExperience`, `TwoWaysToCreate`, `WalkInFacts`) | Booking Settings `labels.createAnytime` / `createTogether` |
| "Everything you need is waiting for you. Just bring yourself, pick a project and start creating." | `constants.ts:988` (FAQ), `events/[slug]/page.tsx:289` (utility bar) | Brand Copy `everythingProvided` (⚠️ conflicts with DIY policy upgrade clause — client decision pending, audit §1.1) |
| "Everything is laid out before you arrive. You bring nothing but yourself." | `events/[slug]/page.tsx:1762-1763` | same decision |
| "No experience needed, just pick a project and make it yours." | FAQ `constants.ts:1113`; journey[0] `brand.ts:160` | Brand Copy `journey` |
| "Plan a private event" | hero, closing, about close, gallery close, menus, mobile, `PlanAction` | Navigation `privateEventsCtaLabel` |
| "Explore experiences" / "Explore events" / "Browse events" / "View events" / "See upcoming events" | 12+ CTAs | Navigation `exploreLabel` (one wording) |
| "Ask the Maison" | faq, policies, policy detail, pass "Ask the Maison about it" | Navigation `askLabel` |
| Experience main photo alt | identical text in `experiences.ts:92-93` and `workshops.ts:92-93,112-113` | `media.alt` (single record) |
| Times Square Center venue line | `partners.ts` + hard-coded `TwoWaysToCreate.tsx:120` | `venues` |
| Booking terms sentence | checkout, confirmation, FAQ | Booking Settings `terms.*` |
| `MP-D` reference prefix | `booking.ts:158`, lookup placeholder/hint `BookingStatusLookup.tsx:92,99` | Booking Settings `referencePrefix` (hint templated) |

---

## 8. Strings that should stay in code (UI chrome)

Form field labels and validation messages (`First name`, `Please check this email address.`…), aria-labels ("Close", "Previous picture", "Scroll down to Creative experiences", "Primary", "Breadcrumb"), `sr-only` glue (" to ", ", ", "(opens in a new tab)"), pluralisation templates (`spotsLabel`, `countLabel`), date/price formatters (`Intl` with `Asia/Dubai`, `en-AE` currency code display), step numerals, the doodle/ink palette (`INK`, `DoodleName`), Tailwind tone maps (`AUDIENCE_TONES`, `STEP_STOCK`, `WASH`). If Arabic ever lands, these move to Payload `localization` + a `ui-strings` global in one pass; not before.

---

## 9. Image inventory

Dimensions from `sips`; sizes rounded; provenance from C2PA/XMP scan (`SynthID` = Google Imagen/Gemini, `OpenAI` = DALL·E/GPT-image, `trainedAlgorithmicMedia` = IPTC AI flag) plus filename/dimension evidence. **AI-flagged and stock files must not be imported as "studio" media without a client decision.**

### 9.1 Referenced images (import to `media`)

| Path | W×H | KB | Used where (file:line) | Provenance / flag |
|---|---|---|---|---|
| `images/logo.png` | 1015×438 | 72 | `constants.ts:63` header dark, hero intro, 3× OG | **Logo** (client artwork; master `assets/masters/maison-palettia-logo.ai`) |
| `images/scroll-logo.png` | 1120×466 | 72 | `constants.ts:90` header light, footer | Logo lilac cut |
| `brand/p-mark.svg` | svg | 2 | `Footer.tsx:1014` | monogram |
| `app/icon.png` / `apple-icon.png` / `favicon.ico` | 512² / 180² / 48² | 55/11/3 | Next metadata files | favicons (derived from `fav-new-log.png`?) |
| `images/image.png` | 1920×1080 | 2361 | `Hero.tsx:83` desktop hero; `button-preview/page.tsx:48` | **Likely AI** — PNG hero; same scene/alt as `mobile-hero.png` which carries SynthID. Oversized PNG; convert. |
| `images/mobile-hero.png` | 768×1376 | 1223 | `Hero.tsx:112` mobile hero | **AI-generated (C2PA SynthID, trainedAlgorithmicMedia)** |
| `images/about-sec-img.png` | 1488×718 | 2101 | `BrandStory.tsx:155` home panel | **AI-generated (C2PA SynthID)** |
| `images/about-page-img.png` | 1950×1950 | 2482 | `about/page.tsx:280` About hero | **Likely AI** (square PNG, 2.4 MB, no camera data); verify |
| `images/experiences/TOTE_BAG_PAINTING.jpg` | 1024×1024 | 752 | `experiences.ts:177`; via experience: menus, cards, `/gallery`, OG | 1024² + Photoshop/C2PA — code says "client's own set"; **1024² is a generator size — verify** |
| `images/experiences/CERAMIC_PAINTING.jpg` | 1024×1024 | 730 | `experiences.ts:220`; `WaysToExperience.tsx:160` | as above |
| `images/experiences/BEDAZZLING.jpg` | 1024×1024 | 841 | `experiences.ts:261` | as above (balloon dog in rhinestones) |
| `images/experiences/MANDALA_PAINTING.jpg` | 1024×1024 | 948 | `experiences.ts:294` | as above |
| `images/experiences/GLASS_PAINTING.jpg` | 1024×1024 | 732 | `experiences.ts:337`; `gallery/page.tsx:153` | as above |
| `images/experiences/CANDLE_MAKING.jpg` | 1024×1024 | 631 | `experiences.ts:370`; `workshops.ts:91`; `gallery/page.tsx:166` | as above |
| `images/experiences/CROCHETING.jpg` | 1024×1024 | 931 | `experiences.ts:403`; `workshops.ts:111`; `SeasonalExperiences.tsx:90` | as above |
| `images/experience/tote-bag-1.jpg` | 1334×2000 | 1616 | `experiences.ts:146` gallery | photo; printed tote (not painted) — note in code |
| `images/experience/tote-bag-2.jpg` | 2000×1125 | 1034 | `:151` | photo (colour on paper, not a tote) |
| `images/experience/tote-bag-3.jpg` | 1333×2000 | 1545 | `:156` | photo |
| `images/experience/ceramic-1.jpg` | 1429×2000 | 1491 | `:195` | photo |
| `images/experience/ceramic-2.jpg` | 1333×2000 | 1511 | `:200` | photo |
| `images/experience/ceramic-3.jpg` | 2000×1333 | 1498 | `:205` | photo |
| `images/experience/beadazzling-1.jpg` | 7618×5079 | 3003 | `:243` | camera-res photo; **beads, not rhinestones** (code note); oversize |
| `images/experience/beadazzling-2.jpg` | 4032×3024 | 2002 | `:248` | phone photo (4032×3024 = iPhone) |
| `images/experience/beadazzling-3.jpg` | 6267×4178 | 2315 | `:253` | camera photo |
| `images/experience/mandala-1.jpg` | 3000×4500 | 1443 | `:277` | Photoshop; photo |
| `images/experience/mandala-2.jpg` | 3000×4500 | 2231 | `:282` | Photoshop; photo |
| `images/experience/mandala-3.jpg` | 3456×5184 | 2460 | `:287` | camera photo |
| `images/experience/glass-painting-1.jpg` | 856×1500 | 1337 | `:313` | small source |
| `images/experience/glass-painting-2.jpg` | 3024×4032 | 870 | `:318` | phone photo |
| `images/experience/glass-painting-3.jpg` | 1333×2000 | 1999 | `:323` | photo (brushes, not glass — code note) |
| `images/experience/candle-making-1.jpg` | 3931×5896 | 3185 | `:352` | Photoshop; camera photo; oversize |
| `images/experience/candle-making-2.jpg` | 6126×4084 | 3490 | `:357` | oversize |
| `images/experience/candle-making-3.jpg` | 6000×4000 | 1422 | `:362` | photo |
| `images/studio/yarn-board.jpg` | 1920×1080 | 178 | `:385` | 1080p frame (from studio film) |
| `images/1-2.jpg` | 2000×1335 | 892 | `:390`; `StudioInterlude.tsx:142` (unused comp) | photo |
| `images/hero-carousel/crocheting.jpg` | 1600×1553 | 839 | `:395` | Photoshop; photo |
| `images/experience/painting.jpg` | 1333×2000 | 1598 | `constants.ts:553,922`; `gallery/page.tsx:260` | photo (unknown source) |
| `images/experience/community-table.jpg` | 1920×1080 | 158 | `WaysToExperience.tsx:172` | 1080p frame |
| `images/experience/pigment-on-paper.jpg` | — | — | `gallery/page.tsx:264`; `constants.ts:600` | **MISSING FILE** (404 on `/gallery`) |
| `images/events/named-keepsake.jpg` | 768×1024 | 370 | `brand.ts:392`; `SeasonalExperiences.tsx:98` | **studio's own** (brand deck pp.13–14; WhatsApp-compressed) |
| `images/events/glitter-keepsakes.jpg` | 480×640 | 152 | `brand.ts:398`; `WaysToExperience.tsx:166`; `Seasonal…:82` | studio's own; tiny |
| `images/events/national-day-cards.jpg` | 686×572 | 129 | `brand.ts:404`; `WaysToExperience.tsx:178` | studio's own; tiny |
| `images/who-is-it-for/birthday-parties.jpg` | 2000×1333 | 1606 | `privateEvents.ts:197` + OG | client-supplied (note: cake/sparklers, "23" candle — weakest fit) |
| `images/who-is-it-for/corporate-evebts.jpg` | 2000×1333 | 1408 | `:226` (typo filename is intentional) | client-supplied |
| `images/who-is-it-for/school-programs.jpg` | 2000×1429 | 1815 | `:243` | client-supplied; identifiable children — **consent?** |
| `images/who-is-it-for/malls-community.jpg` | 4000×6000 | 2345 | `:273` | Photoshop; client-supplied; oversize |
| `images/hero/making.jpg` | 2000×2500 | 514 | `constants.ts:374` (`HERO_IMAGE` **dead** — `Hero.tsx:46` defines its own local `HERO_IMAGE`); `privateEvents.ts:391` (`PRIVATE_EVENT_IMAGES.hero` **unused** — book page uses `.experience`) | photo; effectively unused |
| `images/creative/painting.jpg` | 1600×1600 | 301 | `privateEvents.ts:423` book-page face; `passes.ts:81` | same frame as `hero/making.jpg` (code note) |
| `images/hero/tote-painting.jpg` | 1920×1080 | 212 | `private-events/page.tsx:342` | 1080p film frame |
| `images/hero/plate-painting.jpg` | 1920×1080 | 108 | `contact/page.tsx:276` | 1080p film frame |
| `images/studio/palette-brush.jpg` | 1920×1080 | 132 | `gallery/page.tsx:256` | film frame |
| `images/studio/marbling.jpg` | 1920×1080 | 108 | `:268` | film frame |
| `images/studio/plate-motif.jpg` | 1920×1080 | 90 | `:272` | film frame |
| `images/studio/candle-pour.jpg` | 1920×1080 | 110 | `:276`; `Seasonal…:106` | film frame |
| `images/workshops/watercolour-street.jpg` | 1400×1949 | 549 | `passes.ts:97` | artwork (master `assets/session-masters/`) |
| `images/creative/craft.jpg` | 1600×1600 | 211 | `passes.ts:113` | **pottery** (alt: turning a pot) — client removed pottery; replace |
| `images/recent/late-blooms.jpg` | 1400×1750 | 399 | `constants.ts:931` (unused `GALLERY_TILES`); `recent.ts:42` (unused) | artwork/still life |
| `images/editorial/late-lilies.jpg` | 2400×1656 | 236 | `constants.ts:588` (unused `EXPERIENCE_IMAGES`) | unused |
| `images/workshops/watercolour-in-progress.jpg` | 1200×1500 | 191 | `constants.ts:594,938` (unused) | unused |
| `images/creative/colour-in-layers.jpg` | 1200×1500 | 198 | `constants.ts:944` (unused) | unused |
| `images/editorial/mural-on-brick.jpg` | 2200×1467 | 1007 | `constants.ts:656` (unused) | third-party mural — **copyright?** |
| `images/editorial/wash-and-light.jpg` | 2100×1448 | 384 | `constants.ts:689` (unused) | unused |
| `images/testimonials/orchard-in-oil.jpg` | 2000×1125 | 307 | `constants.ts:876` (unused) | crop of a painting (`assets/hero-masters/i-2.jpg`) |
| `images/recent/vessel-and-bloom.jpg`, `blue-study.jpg`, `petals-fallen.jpg` | 1400×1750, 1200², 1500×1000 | 418/222/208 | `recent.ts` (unused) | `blue-study` has C2PA |
| `images/creative/tissue-art.jpg`, `coffee-painting.jpg`, `wooden-painting.jpg` | 768×1376 ×3 | 963/799/985 | `LittleCreators.tsx:54-69` (unused) | **Likely AI** (Imagen portrait size, Photoshop+C2PA) |
| `images/i-1.jpg` | 2000×1333 | 939 | `StudioInterlude.tsx:93` (unused) | photo |
| `images/middle-section-bg.jpg` | 6192×4128 | 4296 | `CommunityMoment.tsx:111` (unused) | oversize |
| `images/workshop-journey.jpg` | 6720×4480 | 2750 | `WorkshopJourney.tsx:111` (unused) | child's hands — consent? |
| `images/hero/film-poster.jpg` + `videos/maison-film.mp4` | 1600×900 / 1280×720, 61 s | 100 / 2543 | `StudioFilm.tsx:68-69` (unused; label "A short film", duration "1:01" hard-coded `:54,58`) | studio film |

### 9.2 Unreferenced files on disk (54 images + 3 videos) — do not import; delete or archive

| Group | Files | Flag |
|---|---|---|
| **AI-generated (C2PA confirmed)** | `about-img.png` (OpenAI), `hero/bg-bg.png` (OpenAI), `mobile-banner.png` (OpenAI), `hero-carousel/1-tote.png`, `hero-carousel/2.png`, `hero/img.png` (SynthID) | delete |
| **Stock (Unsplash filenames)** | `tile/chloe-martin-GiIZKZGF3Z0-unsplash.jpg` 4000×6000 4.8 MB, `tile/guido-coppa-…`, `tile/kiy-turk-…`, `tile/mj-…` + 4 other `tile/*.jpg` (crochet-rainbow, granny-square-blanket, printed-tote-copenhagen, tote-rack-new-york — captions name cities, likely stock) | delete |
| Pottery (retired direction) | `experiences/HAND_BUILDING.jpg`, `creative/carved-glaze.jpg`, `workshops/glazed-vessel.jpg` | delete |
| Early banners/duplicates | `banner-img.jpg`, `banner-section-img.jpg` 5616×3744, `about-section-img.jpg` 5054×3369, `mobile-banner-bg.png`, `hero/banner-poster.jpg`, `hero/i-1.jpg` 2810×3548 3.6 MB, `hero/studio-laughter.jpg`, `hero-carousel/1.jpg`, `3-crochet.jpg`, `4.jpg`, `h-3.jpg`, `orporate-events.jpg`, `creative/create.jpg`, `creative/glass-painting.jpg`, `creative/mandala-painting.jpg`, `editorial/mood-bg.jpg`, `editorial/vases-on-lilac.jpg`, `studio/tote-table.jpg` | archive |
| Logo scraps | `fav-new-log.png`, `favicon-logo.png` (1254², source of `app/icon.png`), `new-fav-logo.jpg` | keep one as the favicon master in `media` |
| Doodles | `doodles/d1…d10.png` 1000² ×10 | superseded by inline SVG `hero/doodles.ts`; delete |
| Videos | `videos/maison-banner.mp4` 16 MB (1920×1080, 61 s — same cut as `maison-film.mp4` at 1080p), `maison-banner-bg-1.mp4` 5.9 MB (1920×1080, 21 s), `video-bg.mp4` 2.6 MB (1920×1080, 13 s) | unreferenced; masters live in `assets/video-masters/` (gitignored 111 MB file noted) |
| Fonts | `fonts/Qarine.otf` (unused), `HapshaSophiaScript_01.ttf` (otf is used by `lib/fonts.ts:78` and both OG generators) | keep otf; README says licence file pending |

Masters in `assets/` (not served; 13 jpgs up to 5426×8000) stay in the repo as-is; the `media` collection should be seeded from `public/images`, not from masters.

---

## 10. Settings currently in env / constants that the brief moves into the admin

| Today | Where | Becomes |
|---|---|---|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `.env.example:22`, `constants.ts:486` (+ fake fallback) | Site Settings `contact.whatsappNumber` (runtime, no rebuild) |
| `PAYMENT_CONFIGURED`, `BOOKING_CONFIGURED`, `PASS_CODES_CONFIGURED` | `lib/bookingFlags.ts` | Booking Settings `mode`, `passCodesEnabled` (derived from Payments global presence) |
| `PASSES_CONFIGURED` | `lib/passes.ts:38` | Booking Settings `passesLive` |
| `ENQUIRY_CONFIGURED` | `lib/enquiry.ts:89` | derived: Email global configured + Notifications recipients present |
| `LOW_SEAT_THRESHOLD` | `lib/workshops.ts:18` | Booking Settings |
| `REFERENCE_PREFIX` | `lib/booking.ts:158` | Booking Settings |
| `SITE.url` | `constants.ts:27` | Site Settings `url` (still needed at build for `metadataBase` — read via Local API at build, so no env var) |
| `revalidate = 600` | `events/[slug]/page.tsx:89`, `book/page.tsx:74` | replace with `cacheTag('sessions')` + `revalidateTag` from Payload `afterChange` hooks (content live without rebuild) |
| `DATABASE_URL`, `PAYLOAD_SECRET` | `.env` | **stay in .env** (the two permitted) |

---

## 11. Open questions for the client (surfaced by the crawl)

1. **Imagery provenance.** 8 files are confirmed AI (C2PA/SynthID/OpenAI), including the live mobile hero and the homepage statement panel; the desktop hero and About hero are almost certainly AI too; all 7 activity hero squares are 1024×1024 (generator size) despite the code recording them as "the client's own". Decide: keep with disclosure, or replace with the studio shoot. The `media.provenance` field enforces the decision.
2. **"Everything is provided" vs. the DIY policy's "additional charge" clause** (audit §1.1) — one sentence, printed in 3 places.
3. **Real schedule, prices, seats** for Candle Making and Crocheting (both invented; dates 11 and 24 Oct 2026 will lapse and the site will show nothing bookable).
4. **Contact email / phone / socials / street address / hours** — all `null` today; forms cannot send until an email provider and recipients are entered in the admin.
5. **Mission/Vision labelling** (deck p.3 disagrees with the brief).
6. **Charm bracelet making** (in policy, not in catalogue) and whether 14+ workshops may appear on kids/school programme pages.
7. **Passes**: real names, prices, validity and a policy — or hide `/loyalty` entirely.
8. **Privacy Policy & Terms** — never drafted; footer legal row is empty; checkout consent checkbox pending.
9. **Testimonials** — none real; collection ships empty.
10. **Production domain** (`SITE.url` is a guess) and a branded 1200×630 share image.
11. **Consent** for the two photographs showing children (`school-programs.jpg`, `workshop-journey.jpg`) and the WhatsApp-compressed event photos.
