import { ExperienceDiscovery } from "@/components/sections/home/ExperienceDiscovery";
import { getCreativeExperiences, type CreativeExperience } from "@/lib/experiences";
import type { Experience } from "@/payload-types";

import { doc, lines, stored, text } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * `experienceCarousel` → <ExperienceDiscovery> + <ExperienceCarousel> +
 * <ExperienceCard> (SPEC §E.1).
 *
 * `source` picks the cards: every activity (the launch behaviour), only the
 * walk-in or only the dated ones, or a hand-picked list in the editor's
 * order. The cards themselves are the site's `CreativeExperience` records
 * from the data layer (lib/experiences.ts), so a card shows exactly what it
 * shows on /events — the block chooses which, never what they say.
 */
export async function ExperienceCarouselAdapter({ block }: AdapterProps<"experienceCarousel">) {
  const b = stored(block);
  if (!b) return <ExperienceDiscovery />;

  const all = await getCreativeExperiences();
  return (
    <ExperienceDiscovery
      eyebrow={text(b.eyebrow)}
      lines={lines(b.headingLines)}
      standfirst={text(b.standfirst)}
      experiences={choose(all, b.source, b.experiences)}
      cardAction={text(b.cardCta) ?? undefined}
    />
  );
}

/** Shared with the other blocks that pick activities. */
export function choose(
  all: CreativeExperience[],
  source: "all" | "diy" | "scheduled" | "manual" | null | undefined,
  picked: Array<string | Experience> | null | undefined,
): CreativeExperience[] {
  switch (source) {
    case "diy":
    case "scheduled":
      return all.filter((experience) => experience.kind === source);
    case "manual": {
      const bySlug = new Map(all.map((experience) => [experience.slug, experience]));
      return (picked ?? [])
        .map((value) => doc(value)?.slug)
        .map((slug) => (slug ? bySlug.get(slug) : undefined))
        .filter((experience): experience is CreativeExperience => Boolean(experience));
    }
    default:
      return all;
  }
}
