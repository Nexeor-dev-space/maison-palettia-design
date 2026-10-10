import type { VibeSeed } from "../types";

/** The three vibe tags, from lib/vibes.ts. No experience carries one yet (deliberate — see that file). */

export const VIBES: VibeSeed[] = [
  {
    label: "Messy & Expressive", // lib/vibes.ts:65
    slug: "messy-expressive", // lib/vibes.ts:46
    blurb: "Hands in it, no plan, see what happens.", // lib/vibes.ts:66
    order: 1,
  },
  {
    label: "Mindful & Chill", // lib/vibes.ts:70
    slug: "mindful-chill", // lib/vibes.ts:46
    blurb: "Slow, quiet, one small thing at a time.", // lib/vibes.ts:71
    order: 2,
  },
  {
    label: "Quick 30-Min Crafts", // lib/vibes.ts:75
    slug: "quick-crafts", // lib/vibes.ts:46
    blurb: "A short sitting, something finished to take away.", // lib/vibes.ts:76
    order: 3,
  },
];
