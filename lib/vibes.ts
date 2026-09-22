import type { CreativeExperience } from "@/lib/experiences";

/**
 * The discovery layer: how you feel like creating, rather than how the studio
 * files it.
 *
 * ==========================================================================
 * WHAT THIS FILE DELIBERATELY DOES NOT CONTAIN
 * ==========================================================================
 *
 * It does not say which activities are messy, which are calm, or which take
 * half an hour. Nobody at the studio has told us, and those are judgements
 * about their own programme rather than facts anyone can read off the data:
 * ceramic painting is meditative or fiddly depending on who is holding the
 * brush, and no field in lib/experiences.ts records the difference.
 *
 * So the taxonomy lives here and the MEMBERSHIP lives on each activity, as
 * `vibes` — a field the studio fills in, in the CMS, in their own words about
 * their own activities. Until they do, every list below is genuinely empty and
 * the interface says so rather than guessing. A vibe with invented members
 * would be worse than no vibe layer at all: a visitor who picks "Mindful &
 * Chill" and is handed bedazzling has been lied to about the one thing they
 * asked for.
 *
 * TODO(client): tag the activities. It is one line per activity in
 * lib/experiences.ts, e.g.
 *
 *     { slug: "mandala-painting", …, vibes: ["mindful-chill"] }
 *
 * An activity can carry several. The menu, the search panel and anything else
 * that reads {@link experiencesByVibe} start working the moment the first tag
 * lands — no component changes, no migration.
 *
 * ==========================================================================
 * WHY THESE THREE
 * ==========================================================================
 *
 * They are the client's own examples, kept in their own words. They are not
 * new product categories and must never become them: the factual structure —
 * walk-in versus scheduled, and the private-event audiences — stays exactly
 * where it is and stays the thing a visitor can rely on. This is a second way
 * in for someone who knows how they feel but not what the studio calls it.
 */

/** A stable identifier. New vibes are added here and tagged in the CMS. */
export type VibeSlug = "messy-expressive" | "mindful-chill" | "quick-crafts";

export interface Vibe {
  slug: VibeSlug;
  /** The client's own label. Set in caps by the design, stored as written. */
  label: string;
  /**
   * One short line, said to the visitor rather than about the activity.
   *
   * It describes a MOOD and never a fact about the programme — no durations,
   * no prices, no "perfect for groups" — because the moment it describes the
   * activities it is making the claim this file exists to avoid.
   */
  blurb: string;
}

export const VIBES: readonly Vibe[] = [
  {
    slug: "messy-expressive",
    label: "Messy & Expressive",
    blurb: "Hands in it, no plan, see what happens.",
  },
  {
    slug: "mindful-chill",
    label: "Mindful & Chill",
    blurb: "Slow, quiet, one small thing at a time.",
  },
  {
    slug: "quick-crafts",
    label: "Quick 30-Min Crafts",
    blurb: "A short sitting, something finished to take away.",
  },
] as const;

/** The question above the row. Kept here so every surface asks it the same way. */
export const VIBE_QUESTION = "How do you feel like creating today?";

/** One vibe by slug, or null — so a stale link cannot throw. */
export function getVibe(slug: string): Vibe | null {
  return VIBES.find((vibe) => vibe.slug === slug) ?? null;
}

/**
 * The activities carrying a vibe.
 *
 * Returns an empty array while the studio has tagged nothing, which is the
 * honest answer and the one every caller is built to handle — see the note at
 * the top of this file.
 */
export function experiencesByVibe(
  experiences: readonly CreativeExperience[],
  slug: VibeSlug,
): CreativeExperience[] {
  return experiences.filter((experience) => experience.vibes?.includes(slug));
}

/**
 * Whether the discovery layer has anything behind it yet.
 *
 * The one switch every surface checks. It is deliberately a question about the
 * DATA rather than a feature flag someone has to remember to turn on: tag an
 * activity and the layer appears, untag them all and it disappears cleanly.
 */
export function hasVibeTags(experiences: readonly CreativeExperience[]): boolean {
  return experiences.some((experience) => (experience.vibes?.length ?? 0) > 0);
}

/** How many activities sit behind each vibe, in the order {@link VIBES} sets. */
export function vibeCounts(
  experiences: readonly CreativeExperience[],
): { vibe: Vibe; count: number }[] {
  return VIBES.map((vibe) => ({
    vibe,
    count: experiencesByVibe(experiences, vibe.slug).length,
  }));
}
