import type { PassSeed } from "../types";

/**
 * The three placeholder passes, from lib/passes.ts (PASSES_CONFIGURED is
 * false: names, prices and validity are for review, not final). Benefits are
 * copied as printed today — including the Atelier Pass's "paint, shape or
 * craft", a leftover from the pottery era that SPEC §F.5 asks to correct to
 * "paint, craft or create"; the seed applies that correction only with
 * `--placeholders=draft` (see cms/seed/index.ts), because the default run
 * must leave /loyalty reading exactly as it does now.
 * `validityDays` is the printed validity in days (3 months → 90,
 * 12 months → 365), which the booking system counts from purchase.
 */

export const PASSES: PassSeed[] = [
  {
    name: "Day Pass", // lib/passes.ts:74
    slug: "day-pass", // lib/passes.ts:73
    description: "One session, taken whenever you are ready for it.", // lib/passes.ts:75
    priceFils: 32000,
    sessions: 1,
    validityDays: 90,
    validityLabel: "3 months from purchase", // lib/passes.ts:78
    benefits: [
      "Any strand: paint, craft or create", // lib/passes.ts:79
      "Book any date in the programme", // lib/passes.ts:79
    ],
    image: "images/creative/painting.jpg", // lib/passes.ts:81
    // The file's Media alt is the enquiry page's (lib/privateEvents.ts:423); /loyalty printed its own.
    imageAlt:
      "A painter at an easel, brush in hand, working into a canvas of coral and blush roses among deep teal leaves, a loaded palette at the edge of the frame.", // lib/passes.ts:82
    order: 1,
  },
  {
    name: "Maison Pass", // lib/passes.ts:87
    slug: "maison-pass", // lib/passes.ts:86
    description: "Five sessions to spend across the programme at your own pace.", // lib/passes.ts:88
    priceFils: 140000,
    sessions: 5,
    validityDays: 365,
    validityLabel: "12 months from purchase", // lib/passes.ts:91
    benefits: [
      "Any strand: paint, craft or create", // lib/passes.ts:93
      "Book each session as you go, no dates to choose now", // lib/passes.ts:94
    ],
    image: "images/workshops/watercolour-street.jpg", // lib/passes.ts:97
    order: 2,
  },
  {
    name: "Atelier Pass", // lib/passes.ts:103
    slug: "atelier-pass", // lib/passes.ts:102
    description: "Ten sessions for the year, for when making has become a habit.", // lib/passes.ts:104
    priceFils: 260000,
    sessions: 10,
    validityDays: 365,
    validityLabel: "12 months from purchase", // lib/passes.ts:107
    benefits: [
      "Any strand: paint, shape or craft", // lib/passes.ts:109
      "Book each session as you go, no dates to choose now", // lib/passes.ts:110
    ],
    image: "images/creative/craft.jpg", // lib/passes.ts:113
    order: 3,
  },
];
