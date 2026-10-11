import type { WorkshopTypeSeed } from "../types";

/**
 * The formats from the client's "Scheduled Workshops Update" (Oct 2026):
 * two Candle Making themes for the first month, and the four Crochet
 * levels a customer progresses through.
 *
 * WHAT IS THE CLIENT'S AND WHAT IS NOT. The names, the two candle theme
 * descriptions, the crochet level order and "seating capacity per
 * workshop: 6" are the client's own words. The crochet descriptions are
 * NOT: the update says "the description of the workshops will be given
 * once we finalize the concept", so those four carry no description and
 * the site prints none until the studio writes them. The progression
 * notes are the plainest reading of the ladder the update draws
 * (Beginners → Beginner Basics → Returning Learners → Beginner Project)
 * and say nothing a level's name does not already say.
 *
 * Images are left to the experience's photograph — the update supplied
 * none per theme or level.
 */
export const WORKSHOP_TYPES: WorkshopTypeSeed[] = [
  {
    experience: "candle-making",
    name: "The Cheesecake Collection",
    slug: "cheesecake-collection",
    description: "Food-inspired cheesecake candles you personalise with your choice of colours, fragrances and decorative toppings.",
    order: 1,
  },
  {
    experience: "candle-making",
    name: "Sculptural Forms",
    slug: "sculptural-forms",
    description: "Decorative, sculptural candles in distinctive shapes and designs, customised to your preferences.",
    order: 2,
  },
  {
    experience: "crocheting",
    name: "Crochet — Beginners",
    slug: "crochet-beginners",
    level: "Beginner",
    progression: { note: "Start here" },
    order: 1,
  },
  {
    experience: "crocheting",
    name: "Crochet — Beginner Basics",
    slug: "crochet-beginner-basics",
    level: "Beginner",
    progression: { recommendedAfter: "crochet-beginners", note: "After Beginners" },
    order: 2,
  },
  {
    experience: "crocheting",
    name: "Crochet — Returning Learners",
    slug: "crochet-returning-learners",
    level: "Returning",
    progression: { recommendedAfter: "crochet-beginner-basics", note: "After Beginner Basics" },
    order: 3,
  },
  {
    experience: "crocheting",
    name: "Crochet — Beginner Project",
    slug: "crochet-beginner-project",
    level: "Beginner",
    progression: { recommendedAfter: "crochet-returning-learners", note: "A project to take home" },
    order: 4,
  },
];
