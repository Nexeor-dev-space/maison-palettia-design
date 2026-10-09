import { LocationsBody } from "@/components/sections/locations/LocationsBody";
import { getMallPartners, type PartnerRecord } from "@/lib/partners";

import { partnerOf, stored, text } from "./helpers";
import { headerWords } from "./PageHeader";
import type { AdapterProps } from "./types";

/**
 * `locationsHero` (+ the `pageHeader` before it) → <LocationsBody> (SPEC §E.1).
 *
 * The venues are the ones the editor picked, in their order, or — none
 * picked — every current venue in the studio's order (the launch behaviour).
 * `showPastDestinations` has no section to drive yet: the "where we've
 * created" list came off this page at the client's ask (see the REMOVED note
 * in <LocationsBody>), so the switch is stored and waits for that section.
 */
export async function LocationsHeroAdapter({ block, ctx, header }: AdapterProps<"locationsHero">) {
  const words = headerWords(header, ctx);
  const current = await getMallPartners();
  const b = stored(block);

  const picked = b?.venues?.length
    ? b.venues.map((venue) => partnerOf(venue, current)).filter((partner): partner is PartnerRecord => partner !== null)
    : current;

  return (
    <LocationsBody
      eyebrow={words.eyebrow}
      lines={words.lines}
      lead={words.standfirst}
      findUsNowLabel={b ? text(b.findUsNowLabel) : undefined}
      emptyNote={b ? text(b.emptyNote) : undefined}
      partners={picked}
    />
  );
}
