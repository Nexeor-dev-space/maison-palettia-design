import type { VenueSeed } from "../types";

/**
 * Venues: the one confirmed partner from lib/partners.ts (status "current")
 * and the brand deck's past destinations from lib/brand.ts PAST_DESTINATIONS
 * (status "past", never shown as somewhere to go — SPEC §F.2).
 *
 * "Times Square Center" is in both lists; it is the current venue, so the
 * past list skips it rather than creating a second document with the same
 * name. No coordinates are seeded: the code refuses to guess a pin
 * (components/sections/LocationMap.tsx) and the map link is a search URL,
 * not a point.
 */

export const CURRENT_VENUES: VenueSeed[] = [
  {
    name: "Times Square Center", // lib/partners.ts:71
    slug: "times-square-center", // lib/partners.ts:70
    locality: "Dubai", // lib/partners.ts:72
    status: "current",
    descriptor: "Find us at Times Square Center, where the Maison comes to life with hands-on experiences, workshops and plenty of reasons to stop by and make something.", // lib/partners.ts:95
    eventDescriptor: "Find us at Times Square Center, where creativity, community and a little time away from the everyday come together.", // lib/partners.ts:97
    locationHref: "https://www.google.com/maps/search/?api=1&query=Times+Square+Center+Dubai", // lib/partners.ts:99
    order: 1,
  },
];

/** Names only; the deck carries no locality or description for them. */
export const PAST_DESTINATIONS: string[] = [
  "Reem Mall", // lib/brand.ts:345
  "Yas Mall", // lib/brand.ts:346
  "Al Hamra Mall", // lib/brand.ts:347
  "WTCAD", // lib/brand.ts:348
  "Al Ghurair Centre", // lib/brand.ts:349
  "Wasl", // lib/brand.ts:350
  "The Galleria Al Maryah Island", // lib/brand.ts:351
  "Dalma Mall", // lib/brand.ts:352
  "Ithra", // lib/brand.ts:354
];
