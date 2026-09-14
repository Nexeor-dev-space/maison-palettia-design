"use client";

import { useMemo, useState } from "react";

import { EventFilterBar } from "@/components/events/EventFilters";
import { LocationDiscovery } from "@/components/events/LocationDiscovery";
import { Reveal } from "@/components/motion/Reveal";
import { EventIndexEntry } from "@/components/workshops/EventIndexEntry";
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
 * beside "Pottery" does not drop to zero the moment they pick a different
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
        <div className="mt-12 md:mt-14 lg:mt-16">
          {months.map(({ label, id, events }) => (
            <section key={id} aria-labelledby={id} className="mt-20 first:mt-0 md:mt-28">
              <Reveal>
                <h2
                  id={id}
                  className="border-t border-line pt-6 text-label font-medium uppercase tracking-eyebrow text-text/75"
                >
                  {label}
                </h2>
              </Reveal>

              <ol className="mt-10 flex flex-col gap-20 md:mt-12 md:gap-24 lg:gap-28">
                {events.map(({ workshop, position }) => (
                  <li key={workshop.slug}>
                    <EventIndexEntry workshop={workshop} index={position} />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}

      {/*
        Always the whole catalogue, never the filtered view: this is how a
        visitor finds the mall they want, so hiding the other three because
        they have already narrowed to one would close the door they came
        through. It writes into the same filter state the bar does.
      */}
      <LocationDiscovery
        workshops={workshops}
        filters={filters}
        onSelect={(venue) => setFilters({ ...filters, venue })}
      />
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
      <p className="max-w-[30rem] text-[1.5rem] font-light leading-[1.25] tracking-[-0.015em] md:text-[1.75rem]">
        No events match those filters.
      </p>
      <p className="mt-5 max-w-[32rem] text-body leading-[1.85] text-text/75">
        The programme is small and runs a few dates at a time. Clearing the filters
        shows everything that is scheduled.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="group mt-9 inline-flex items-center gap-3 text-action font-semibold uppercase tracking-eyebrow text-primary md:mt-10"
      >
        <span className="border-b border-primary/40 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-primary">
          Clear all filters
        </span>
        <span aria-hidden className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1">
          &#8594;
        </span>
      </button>
    </div>
  );
}
