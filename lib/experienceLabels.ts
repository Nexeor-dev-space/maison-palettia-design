/**
 * How each kind of experience is labelled in the interface.
 *
 * Its own module, and not in lib/experiences.ts, because a client-reachable
 * card (components/events/ExperienceCard.tsx) prints it, and
 * lib/experiences.ts now reads the CMS through the Local API, which must
 * never reach a browser bundle (docs/cms/research/00-spike.md, G18).
 * lib/experiences.ts re-exports it, so server imports did not change.
 *
 * The editable words are booking-settings' `labels.anyTime` /
 * `labels.scheduled` (lib/modeCopy.ts): <ExperienceCard> takes them as
 * `kindLabels` from its client parent and the gallery reads them on the
 * server. These are the defaults for a card rendered without them.
 */
export const EXPERIENCE_KIND_LABEL: Record<"diy" | "scheduled", string> = {
  diy: "Any time",
  scheduled: "Scheduled",
};
