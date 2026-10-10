import type { SessionSeed } from "../types";

/**
 * The two dated sessions, copied by value from lib/workshops.ts. Both are
 * placeholders from the design phase (invented date, price and seats; the
 * names and photographs are real) — SPEC §F.4. `status` is the old
 * workshop status; the seed maps it to `bookingStatus` (fully-booked →
 * closed). The demo "seats available" figures are deliberately not carried:
 * no tickets stand behind them (the inventory row starts at 0 sold, 0 held).
 */

export const SESSIONS: SessionSeed[] = [
  {
    experience: "candle-making", // lib/workshops.ts:74
    title: "Candle Making", // lib/workshops.ts:75
    category: "Craft", // lib/workshops.ts:76
    startsAt: "2026-10-11T15:30:00+04:00", // lib/workshops.ts:77
    durationMinutes: 120,
    venue: "times-square-center",
    priceFils: 24000,
    seatsTotal: 12,
    status: "open", // lib/workshops.ts:83
    excerpt: "Choose your scent, pour your candle and create something that's uniquely yours.", // lib/workshops.ts:85
    image: "images/experiences/CANDLE_MAKING.jpg", // lib/workshops.ts:91
  },
  {
    experience: "crocheting", // lib/workshops.ts:97
    title: "Crocheting", // lib/workshops.ts:98
    category: "Craft", // lib/workshops.ts:99
    startsAt: "2026-10-24T11:00:00+04:00", // lib/workshops.ts:100
    durationMinutes: 150,
    venue: "times-square-center",
    priceFils: 28000,
    seatsTotal: 8,
    status: "fully-booked", // lib/workshops.ts:106
    excerpt: "A hook, a ball of yarn and one stitch to start from, worked into something you take with you.", // lib/workshops.ts:109
    image: "images/experiences/CROCHETING.jpg", // lib/workshops.ts:111
  },
];
