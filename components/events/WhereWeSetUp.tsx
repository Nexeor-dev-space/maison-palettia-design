import { MapPin } from "lucide-react";
import type { ReactNode } from "react";

import { SessionGate } from "@/components/booking/SessionClock";

import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { Eyebrow } from "@/components/ui/SectionHeader";
import { formatSessionDate, hasSessionPassed, sessionDateParts } from "@/lib/workshops";
import type { Workshop } from "@/types";

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
 * Each entry carries the next date at that mall, derived — nothing is stored
 * per venue, so a mall the studio stops running at simply stops appearing.
 *
 * NO COUNTS, AT THE CLIENT'S ASK. The heading was the number of destinations
 * in words ("One Location") and each plate said how many events it held. The
 * client's rule from the homepage chips (PDF p05: "it can change in the
 * future") now applies site-wide, so neither is shown: the heading is the
 * client's own location heading and the plate keeps only the next date, which
 * is a date rather than a tally.
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
  /** The whole catalogue, so each destination's next date is the programme's. */
  workshops: Workshop[];
  /**
   * The page's one `Date.now()`, so this panel's "Next" date and the cards
   * above it never disagree about which sessions the server saw go by.
   */
  renderedAt: number;
}

interface LocationSummary {
  name: string;
  locality: string;
  /**
   * Every session at this mall the server does not already see as begun,
   * soonest first — the catalogue is date-sorted. It was only the first
   * session at all, so a date that had gone by went on being called "Next".
   * Empty is allowed: the mall is still where the studio sets up.
   *
   * FULL SESSIONS STAY IN, ON PURPOSE — unlike the homepage's "next date"
   * chip in <TwoWaysToCreate>, which skips them. That chip sits under "A date
   * and a seat / Booked online" and so offers a seat; this plate answers
   * "when is the studio next at this mall", which a fully booked session
   * still answers — the studio is there that day, and the card for it sits
   * just above saying "Fully booked". TODO(client): confirm that is what
   * "Next" should mean here; if it should be the next bookable date, filter
   * with `isBookable(workshop, renderedAt)` below instead.
   */
  upcoming: Workshop[];
}

function summarise(workshops: Workshop[], renderedAt: number): LocationSummary[] {
  const byVenue = new Map<string, LocationSummary>();

  for (const workshop of workshops) {
    if (!workshop.venue) continue;
    let summary = byVenue.get(workshop.venue.name);
    if (!summary) {
      summary = { name: workshop.venue.name, locality: workshop.venue.locality, upcoming: [] };
      byVenue.set(workshop.venue.name, summary);
    }
    if (!hasSessionPassed(workshop, renderedAt)) summary.upcoming.push(workshop);
  }

  return [...byVenue.values()];
}

/**
 * "Next Sat 11 Oct", for the first of these that has not begun — re-asked in
 * the browser, because /events is prerendered and the server's list is only
 * as fresh as the last render. Each <SessionGate> hands over to the date
 * after it when its own begins; once none is left the line is simply not
 * there, rather than a date that has gone by or a promise of one to come.
 */
function nextDateLine(upcoming: readonly Workshop[]): ReactNode {
  return upcoming.reduceRight<ReactNode>((later, session) => {
    const { weekday } = sessionDateParts(session.startsAt);
    return (
      <SessionGate
        startsAt={session.startsAt}
        open={
          <span className="mt-4 block text-label font-medium uppercase tracking-eyebrow text-text/75">
            Next {weekday} {formatSessionDate(session.startsAt)}
          </span>
        }
        passed={later}
      />
    );
  }, null);
}

export function WhereWeSetUp({ workshops, renderedAt }: WhereWeSetUpProps) {
  const locations = summarise(workshops, renderedAt);
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

        {/*
          THE CLIENT'S LOCATION SECTION, WORD FOR WORD. "Find us" over "Your
          Next Creative Stop." and the line under it are the homepage's (PDF
          p06), where the client rewrote this same idea; "Where we set up",
          a counted heading and "The studio travels…" were the wording that
          rewrite retired.
        */}
        <Reveal>
          {/* `ground="lilac"` takes the near-white ink and the Light Sage
              rule; `justify-center` is all that centring an eyebrow needs. */}
          <Eyebrow ground="lilac" className="justify-center">
            Find us
          </Eyebrow>
        </Reveal>

        <Reveal delay={0.06}>
          <h2
            id="locations-heading"
            className="heading-script mx-auto mt-6 max-w-[16ch] text-balance pb-[0.3em] text-script-section text-surface"
          >
            Your Next Creative Stop.
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mx-auto mt-2 max-w-[40ch] text-lead text-surface">
            Find Maison Palettia in the places you already love to visit — and come
            make something while you&rsquo;re there.
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

                      {/* The next date only. The count of events that sat above
                          it is gone with the client's no-counts rule — see the
                          note at the head of this file. */}
                      {nextDateLine(location.upcoming)}
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
