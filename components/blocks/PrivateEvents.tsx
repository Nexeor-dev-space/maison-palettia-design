import {
  CreateWithUs,
  Experiences,
  Introduction,
  WhoItIsFor,
} from "@/components/sections/private-events/PrivateEventsSections";
import { getCreativeExperiences } from "@/lib/experiences";
import { getMallPartners } from "@/lib/partners";
import { PRIVATE_EVENT_ENQUIRY_HREF } from "@/lib/privateEvents";
import { getPrivateEventAudiences } from "@/lib/privateEvents.server";

import { getPrivateIneligibleSlugs } from "./data";
import { imageOf, lines, partnerOf, stored, text } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * The /private-events blocks (SPEC §E.1) → the page's own sections in
 * components/sections/private-events/PrivateEventsSections.tsx. The blocks
 * hold the words; the programmes, the activities and the venue are the data
 * layer's, so this page can never name something the studio does not offer.
 */

/** `privateEventsIntro` → <Introduction>. */
export function PrivateEventsIntroAdapter({ block }: AdapterProps<"privateEventsIntro">) {
  const b = stored(block);
  if (!b) return <Introduction />;
  return (
    <Introduction eyebrow={text(b.eyebrow)} lines={lines(b.headingLines) ?? []} lead={text(b.lead)} image={imageOf(b.image)} />
  );
}

/** `programmesGrid` → <WhoItIsFor>: one card per programme, in the studio's order. */
export async function ProgrammesGridAdapter({ block }: AdapterProps<"programmesGrid">) {
  const audiences = await getPrivateEventAudiences();
  const b = stored(block);
  if (!b) return <WhoItIsFor audiences={audiences} />;
  return (
    <WhoItIsFor
      eyebrow={text(b.eyebrow)}
      lines={lines(b.headingLines) ?? []}
      lead={text(b.lead)}
      cardCta={text(b.cardCta)}
      audiences={audiences}
    />
  );
}

/**
 * `activitiesGrid` → <Experiences> + <ActivityPlate>: the activities offered
 * for private events (`privateEventEligible`). The plates are plain tiles
 * unless the block says to link them to the activity's own page or to the
 * enquiry — no `hrefOf` is what keeps them tiles.
 */
export async function ActivitiesGridAdapter({ block }: AdapterProps<"activitiesGrid">) {
  const [all, ineligible] = await Promise.all([getCreativeExperiences(), getPrivateIneligibleSlugs()]);
  const experiences = all.filter((experience) => !ineligible.has(experience.slug));
  const b = stored(block);
  if (!b) return <Experiences experiences={experiences} />;
  return (
    <Experiences
      experiences={experiences}
      eyebrow={text(b.eyebrow)}
      lines={lines(b.headingLines) ?? []}
      lead={text(b.lead)}
      hrefOf={
        b.linkTo === "enquiry"
          ? () => PRIVATE_EVENT_ENQUIRY_HREF
          : b.linkTo === "experiencePage"
            ? (experience) => `/events/${experience.slug}`
            : undefined
      }
    />
  );
}

/** `venueSpotlight` → <CreateWithUs>: the picked venue, or the first current one. */
export async function VenueSpotlightAdapter({ block }: AdapterProps<"venueSpotlight">) {
  const partners = await getMallPartners();
  const b = stored(block);
  if (!b) return <CreateWithUs partner={partners[0]} />;
  return (
    <CreateWithUs
      partner={b.venue ? partnerOf(b.venue, partners) : partners[0]}
      eyebrow={text(b.eyebrow)}
      lines={lines(b.headingLines) ?? []}
      lead={text(b.lead)}
      cardLabel={text(b.cardLabel)}
    />
  );
}
