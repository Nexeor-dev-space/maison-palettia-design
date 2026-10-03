"use client";

import { useMemo, useState } from "react";
import { BlobButton } from "@/components/ui/BlobButton";

import { EventFilterBar } from "@/components/events/EventFilters";
import { Reveal } from "@/components/motion/Reveal";
import { EventCard } from "@/components/workshops/EventCard";
import {
  applyFilters,
  buildFacets,
  groupByMonth,
  NO_FILTERS,
  type EventFilters,
} from "@/lib/eventFilters";
import type { Workshop } from "@/types";

/**
 * The events listing, below the masthead.
 *
 * The only client component on this route, and it starts here rather than at
 * the page so the head, the metadata and the data fetch all stay on the
 * server. It receives the catalogue already resolved — it does not fetch, and
 * there is no second query behind the filters. Narrowing is a synchronous
 * filter over an array that is already in memory, which is why it needs no
 * loading state and no navigation.
 *
 * Facets are memoised against the catalogue rather than the filters: the
 * options a visitor is offered describe the whole programme, so the count
 * beside "Painting" does not drop to zero the moment they pick a different
 * mall. Only the list below reacts.
 */
export function EventsBrowser({ workshops }: { workshops: Workshop[] }) {
  const [filters, setFilters] = useState<EventFilters>(NO_FILTERS);

  const facets = useMemo(() => buildFacets(workshops), [workshops]);
  const visible = useMemo(() => applyFilters(workshops, filters), [workshops, filters]);
  const months = useMemo(() => groupByMonth(visible), [visible]);

  return (
    <>
      <div className="mt-10 md:mt-12">
        <EventFilterBar
          facets={facets}
          filters={filters}
          onChange={setFilters}
          resultCount={visible.length}
          totalCount={workshops.length}
        />
      </div>

      {visible.length === 0 ? (
        <NoMatches onReset={() => setFilters(NO_FILTERS)} />
      ) : (
        <div className="mt-10 md:mt-12">
          {months.map(({ label, id, events }) => (
            <section key={id} aria-labelledby={id} className="mt-14 first:mt-0 md:mt-16">
              {/*
                The month is a folio, not a heading with a rule under it: the
                rows below draw their own top borders, so a bordered heading
                here would put two lines a few pixels apart.
              */}
              <Reveal>
                <h2 id={id} className="text-label font-medium uppercase tracking-eyebrow text-text/60">
                  {label}
                </h2>
              </Reveal>

              {/*
                CARDS, TWO UP, at the client's ask — see <EventCard> for what
                these were and why a run of rows stopped working at this
                length. `items-stretch` is the grid's default and the card
                takes `h-full`, so two cards in a row are the same height
                however long one of the names runs.
              */}
              <ol className="mt-5 grid gap-6 md:mt-6 md:grid-cols-2 lg:gap-8">
                {events.map(({ workshop, position }) => (
                  <li key={workshop.slug} className="h-full">
                    <EventCard workshop={workshop} index={position} />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}

      {/*
        WHERE THE STUDIO SETS UP HAS LEFT THIS COMPONENT. It was the last
        thing in the browser — a bordered list of malls that wrote back into
        the filter state above, so pressing one narrowed the listing. The
        client has asked for that section to become the page's closing panel,
        which means a full-bleed Deep Lilac field, and a field cannot be
        full-bleed from inside this component's <Container>.

        It is <WhereWeSetUp> now, rendered by the page after this section.
        WHAT THAT COSTS is the filter link: choosing a mall no longer narrows
        the list. With one mall in the catalogue it narrowed nothing, and the
        copy that offered it ("pick a location to see what is on there") has
        gone with the behaviour rather than being left as a promise the page
        does not keep. If the studio adds a second destination, the way back
        is to give that component an optional `onSelect` again and render it
        from here — the summary it draws is unchanged.
      */}
    </>
  );
}

/**
 * Nothing matched. Says so plainly and gives the way back — no promotion, no
 * suggested alternatives the data cannot vouch for.
 */
function NoMatches({ onReset }: { onReset: () => void }) {
  return (
    <div className="mt-16 border-t border-line pt-12 md:mt-20 md:pt-16">
      <p className="max-w-[30rem] text-h3 font-light tracking-[-0.015em]">
        No events match those filters.
      </p>
      <p className="mt-5 max-w-[32rem] text-body leading-[1.85] text-text/75">
        The programme is small and runs a few dates at a time. Clearing the filters
        shows everything that is scheduled.
      </p>

      <BlobButton
        type="button"
        onClick={onReset}
        tone="secondary"
        className="mt-9 min-h-[3.25rem] px-7 md:mt-10"
      >
        Clear all filters
      </BlobButton>
    </div>
  );
}
