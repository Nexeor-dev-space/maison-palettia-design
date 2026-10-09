import { MapPin } from "lucide-react";

import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { Eyebrow, forScript } from "@/components/ui/SectionHeader";
import { formatSessionDate, sessionDateParts } from "@/lib/workshops";
import type { Workshop } from "@/types";

const NUMBER_WORDS = [
  "No", "One", "Two", "Three", "Four", "Five", "Six",
  "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
];

/**
 * The count for a heading set in the script, in words. Hapsha's 7, 8 and 9
 * are placeholder marks rather than figures, so a number past twelve is set in
 * Montserrat rather than risk one.
 */
function countInWords(count: number) {
  return NUMBER_WORDS[count] ?? <span className="font-sans text-[0.75em]">{count}</span>;
}

/**
 * Where the studio sets up — and the last thing on /events.
 *
 * ==========================================================================
 * IT WAS A DISCOVERY WIDGET AND IT IS THE PAGE'S CLOSE
 * ==========================================================================
 *
 * This was <LocationDiscovery>: a bordered list of malls at the foot of the
 * listing, each one a button that wrote back into the filter state above, so
 * pressing one narrowed the events. The client has asked for it to look like
 * the panel that closes /about — Deep Lilac, everything centred, the brand's
 * marks in the corners — and that is the right end for this page: a visitor
 * who has read the dates is either going to a mall or leaving, and a page
 * that stops on a filter control stops mid-sentence.
 *
 * WHAT IT COSTS, SAID PLAINLY. Choosing a location no longer narrows the
 * list. The catalogue holds one destination, so it narrowed nothing — and the
 * line that offered it ("pick a location to see what is on there") has gone
 * with the behaviour rather than being left as a promise the page does not
 * keep. The door here is /locations, which is the page that actually answers
 * "where". See the note in <EventsBrowser> for how to give the filter back
 * if a second destination is ever added.
 *
 * A LIST, NOT A MAP, and that is a data limitation rather than a preference.
 * {@link Venue} carries a name and a locality and nothing else: there are no
 * coordinates anywhere in this project. Drawing pins would mean inventing
 * positions for real malls, which is worse than not drawing them.
 *
 * Each entry carries the count and the next date at that mall, both derived —
 * nothing is stored per venue, so a mall the studio stops running at simply
 * stops appearing. Nothing here is written by hand.
 *
 * ==========================================================================
 * MEASURED, BECAUSE DEEP LILAC IS THE HARDEST GROUND IN THE PALETTE
 * ==========================================================================
 *
 * The type is the near-white `surface`, which is the one light ink that
 * clears 4.5:1 on Deep Lilac (4.90). The plates are White Rock, and the words
 * on them are Charcoal Slate at 9.36:1. The two marks are Soft Lavender and
 * White Rock for the reason /about's close records: on this ground terracotta
 * is 2.0:1 and a lilac mark disappears into the field entirely.
 */
interface WhereWeSetUpProps {
  /** The whole catalogue, so the counts describe the programme. */
  workshops: Workshop[];
}

interface LocationSummary {
  name: string;
  locality: string;
  count: number;
  /** The soonest session at this mall; the catalogue is already date-sorted. */
  next: Workshop;
}

function summarise(workshops: Workshop[]): LocationSummary[] {
  const byVenue = new Map<string, LocationSummary>();

  for (const workshop of workshops) {
    if (!workshop.venue) continue;
    const existing = byVenue.get(workshop.venue.name);
    if (existing) existing.count += 1;
    else
      byVenue.set(workshop.venue.name, {
        name: workshop.venue.name,
        locality: workshop.venue.locality,
        count: 1,
        next: workshop,
      });
  }

  return [...byVenue.values()];
}

export function WhereWeSetUp({ workshops }: WhereWeSetUpProps) {
  const locations = summarise(workshops);
  if (locations.length === 0) return null;

  return (
    <section
      /* `id` so a walk-in activity page can send someone straight here — it
         is the only place on the site that answers "when is the studio
         actually set up", and a walk-in has no date of its own. */
      id="where-we-set-up"
      aria-labelledby="locations-heading"
      className="relative isolate scroll-mt-header overflow-clip bg-primary md:scroll-mt-[var(--spacing-header-lg)]"
    >
      <Container className="relative py-[5rem] text-center md:py-section lg:py-[7rem]">
        <span
          aria-hidden
          className="pointer-events-none absolute left-[6%] top-10 deco-mark w-[5rem] rotate-[-10deg]"
        >
          <DoodleMark name="starburst" color={INK.lavender} treatment="draw" delay={300} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-12 right-[7%] deco-mark w-[4.5rem] rotate-[8deg]"
        >
          <DoodleMark name="splash" color={INK.whiteRock} treatment="draw" delay={420} />
        </span>

        <Reveal>
          {/* `ground="lilac"` takes the near-white ink and the Light Sage
              rule; `justify-center` is all that centring an eyebrow needs. */}
          <Eyebrow ground="lilac" className="justify-center">
            Where we set up
          </Eyebrow>
        </Reveal>

        <Reveal delay={0.06}>
          <h2
            id="locations-heading"
            className="heading-script mx-auto mt-6 max-w-[16ch] pb-[0.3em] text-script-section text-surface"
          >
            {countInWords(locations.length)}{" "}
            {forScript(locations.length === 1 ? "Location" : "Locations")}
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mx-auto mt-2 max-w-[34ch] text-lead text-surface">
            The studio travels. Each date runs at a mall for that day only.
          </p>
        </Reveal>

        {/*
          The destinations themselves, as White Rock plates on the field.
          `justify-center` rather than a grid: there is one of these today and
          a grid would either strand it in the first of three columns or
          stretch it across the measure. A second and a third simply sit
          beside it, and a fourth wraps.
        */}
        <ul className="mx-auto mt-11 flex max-w-[56rem] flex-wrap justify-center gap-4 md:mt-12 md:gap-5">
          {locations.map((location) => {
            const { weekday } = sessionDateParts(location.next.startsAt);

            return (
              <li key={location.name} className="w-full sm:w-[27rem]">
                <Reveal variant="drop" className="h-full">
                  <div className="plate flex h-full items-start gap-4 rounded-[1.25rem] bg-cream p-5 text-left md:p-6">
                    <MapPin
                      aria-hidden
                      strokeWidth={1.5}
                      className="mt-0.5 h-5 w-5 shrink-0 text-terracotta"
                    />

                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-medium leading-snug text-text">
                        {location.name}
                      </span>
                      <span className="mt-1 block text-fine text-text/75">{location.locality}</span>

                      {/* TWO LINES, NOT ONE WITH A DOT IN IT. The count and
                          the next date are two facts, and at this width the
                          single line broke mid-date — "next Sun 11" above
                          "October 2026" — which reads as a wrap accident. */}
                      <span className="mt-4 block text-label font-medium uppercase tracking-eyebrow text-text/75">
                        {location.count} {location.count === 1 ? "event" : "events"}
                      </span>
                      <span className="mt-1.5 block text-label font-medium uppercase tracking-eyebrow text-text/75">
                        Next {weekday} {formatSessionDate(location.next.startsAt)}
                      </span>
                    </span>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>

        <Reveal delay={0.2}>
          {/* `cream` is the tone for a button standing ON Deep Lilac — a lilac
              one cannot be seen at all. See <BlobButton>. */}
          <div className="mt-11 flex justify-center md:mt-12">
            <BlobButton href="/locations" tone="cream" className="min-h-[3.25rem] px-8">
              Find the studio
            </BlobButton>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
