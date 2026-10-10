/**
 * ==========================================================================
 * Site details, SEO defaults, shared brand lines — SPEC §F.6
 * ==========================================================================
 *
 * `site-settings` ← lib/constants.ts SITE, BRAND_LOGO, CONTACT, SOCIAL_LINKS,
 * NEWSLETTER and the hero route lists; `seo-defaults` ← lib/seo.ts. The
 * public URL is not set here: `onInit` (cms/seed/defaults.ts) already wrote
 * NEXT_PUBLIC_SERVER_URL into it, and it stays a placeholder until an admin
 * saves Site details (SPEC §F.6, `isPlaceholderPublicUrl`). The robots
 * list keeps the global's default, which is app/robots.ts:52-58 plus the two
 * routes Phase 3 adds (/my-bookings, /dev).
 *
 * The brand-copy lines that the brand deck does not own (lib/brand.ts has no
 * constant for them) but that several pages print — the find-us heading and
 * line, the private-event invitation, the programmes note — are copied from
 * the page that prints them, with the other places noted.
 */

export const SITE_SETTINGS = {
  name: "Maison Palettia", // lib/constants.ts:17
  legalName: "Maison Palettia Events L.L.C.", // lib/constants.ts:18
  tagline: "Creative workshops and events in Dubai", // lib/constants.ts:25
  locale: "en_AE", // lib/constants.ts:26
  logoOnDark: "images/logo.png", // lib/constants.ts:64 (BRAND_LOGO.src)
  logoOnLight: "images/scroll-logo.png", // lib/constants.ts:91 (BRAND_LOGO.onLight.src)
  monogram: "brand/p-mark.svg", // components/layout/Footer.tsx:1014
  contact: {
    addressLines: [{ line: "Dubai" }, { line: "United Arab Emirates" }], // lib/constants.ts:413
    // email and phone are null today (lib/constants.ts:414-415); the WhatsApp
    // number's "971500000000" fallback is a fake and is NOT carried (01 §1 defect #2).
  },
  // lib/constants.ts:480-481 — both profiles exist but have no address yet, so nothing is printed.
  socials: [{ platform: "instagram" }, { platform: "facebook" }],
  newsletter: {
    enabled: false, // lib/constants.ts:471 actionUrl null — no provider, nothing rendered
    fieldName: "email", // lib/constants.ts:472
    heading: "Newsletter", // lib/constants.ts:473
    description: "New dates and new experiences, straight to your inbox.", // lib/constants.ts:474
    cta: "Subscribe", // lib/constants.ts:475
  },
  heroTheme: {
    darkRoutes: [], // lib/constants.ts:232 DARK_HERO_ROUTES
    lightRoutes: [{ path: "/" }], // lib/constants.ts:243 LIGHT_HERO_ROUTES
  },
};

export const SEO_DEFAULTS = {
  titleTemplate: "%s · Maison Palettia", // lib/seo.ts:104 (`%s · ${SITE.name}`)
  twitterCard: "summary_large_image", // lib/seo.ts:132
  // shareImage stays empty: the generated logo card (app/opengraph-image.tsx) is the default today.
};

/** Brand wording → "Shared lines" and the purpose card labels. */
export const BRAND_SHARED = {
  findUsHeading: "Your Next Creative Stop.", // components/events/WhereWeSetUp.tsx:181; also components/sections/home/WhereWeCreate.tsx:150, app/(site)/private-events/page.tsx:1040-1041, app/(site)/events/[slug]/page.tsx:1544
  findUsLine:
    "Find Maison Palettia in the places you already love to visit — and come make something while you’re there.", // app/(site)/locations/page.tsx:23; also :135-136, components/sections/home/WhereWeCreate.tsx:158-159, components/events/WhereWeSetUp.tsx:187-188, lib/constants.ts:917
  makeItYourWay: "Make It Your Way.", // components/sections/home/TwoWaysToCreate.tsx:206; app/(site)/events/page.tsx:186 prints it as two lines
  privateEventInvite:
    "Have something in mind? Tell us when, who’s coming and what you’d like to make. We’ll help turn the idea into an experience made for your group.", // app/(site)/private-events/page.tsx:1462-1464; also app/(site)/private-events/[slug]/page.tsx:803-804, app/(site)/private-events/book/page.tsx:22,131-132
  programmesNote: "Don’t see yours? That’s probably a conversation worth having.", // components/layout/PrivateEventsMenu.tsx:132; app/(site)/private-events/page.tsx:469-470
  everythingProvided:
    "Everything you need is waiting for you. Just bring yourself, pick a project and start creating.", // app/(site)/events/[slug]/page.tsx:289; lib/constants.ts:932
  purposeLabels: {
    mission: "Our Mission", // app/(site)/about/page.tsx:394
    vision: "Our Vision", // app/(site)/about/page.tsx:398
  },
};

/** Images the dormant seasonal and kids sections print beside the brand copy. */
export const SEASONAL_IMAGES = [
  "images/events/glitter-keepsakes.jpg", // components/sections/home/SeasonalExperiences.tsx:82 (Valentine’s Day)
  "images/experiences/CROCHETING.jpg", // components/sections/home/SeasonalExperiences.tsx:90 (Ramadan)
  "images/events/named-keepsake.jpg", // components/sections/home/SeasonalExperiences.tsx:98 (Mother’s Day)
  "images/studio/candle-pour.jpg", // components/sections/home/SeasonalExperiences.tsx:106 (Christmas)
];

export const LITTLE_CREATOR_IMAGES = [
  "images/creative/tissue-art.jpg", // components/sections/LittleCreators.tsx:54
  "images/creative/coffee-painting.jpg", // components/sections/LittleCreators.tsx:61
  "images/creative/wooden-painting.jpg", // components/sections/LittleCreators.tsx:68
];
