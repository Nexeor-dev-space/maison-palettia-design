/**
 * How each kind of experience is labelled in the interface.
 *
 * Its own module, and not in lib/experiences.ts, because a client-reachable
 * card (components/events/ExperienceCard.tsx) prints it, and
 * lib/experiences.ts now reads the CMS through the Local API, which must
 * never reach a browser bundle (docs/cms/research/00-spike.md, G18).
 * lib/experiences.ts re-exports it, so server imports did not change.
 *
 * TODO(phase2-cleanup): booking-settings carries the same two words
 * (`labels.anyTime`, `labels.scheduled`). A client card can only read them
 * as props from a server parent; until the cards are handed them, these are
 * the defaults the setting was seeded with.
 */
export const EXPERIENCE_KIND_LABEL: Record<"diy" | "scheduled", string> = {
  diy: "Any time",
  scheduled: "Scheduled",
};
