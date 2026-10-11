"use client";

import { useMemo, useState } from "react";

import { EventCalendar } from "@/components/events/EventCalendar";
import { EventFilterBar, type ListingView } from "@/components/events/EventFilters";
import { Reveal } from "@/components/motion/Reveal";
import { PeelNote } from "@/components/ui/PeelNote";
import { EventCard } from "@/components/workshops/EventCard";
import {
  applyFilters,
  buildFacets,
  defaultCalendarMonth,
  groupByMonth,
  monthKeyLabel,
  monthKeys,
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
 * options a visitor is offered describe the whole programme, so the count a
 * screen reader hears on "Painting" (it is no longer drawn — see
 * <EventFilterBar>) does not drop to zero the moment they pick a different
 * mall. Only the list below reacts.
 *
 * `renderedAt` is the page's one `Date.now()`, passed straight through to each
 * <EventCard> so the HTML can already say "Date passed" where the server saw
 * a date go by. It is not read here, and must not be re-taken here: this is a
 * client component, and a clock read while rendering would differ between
 * the server and the browser. (The calendar takes it for the same reason:
 * which month to open on, and which day is today.)
 *
 * ==========================================================================
 * TWO READINGS OF ONE LIST — see <EventCalendar>
 * ==========================================================================
 *
 * The calendar is not a second listing with its own state; it is the Date
 * control drawn as a month. While it is open the `month` filter holds the
 * month on the grid, or the day the visitor pressed on it, and the cards
 * below are `applyFilters` over exactly that — the same function, the same
 * key, the same result the select would give. Opening the calendar replaces
 * whatever date the select held with the grid's month; closing it clears the
 * date and the select comes back. Type and Location keep working in both
 * views and narrow the grid's dots as well as the cards.
 */
export function EventsBrowser({
  workshops,
  renderedAt,
}: {
  workshops: Workshop[];
  renderedAt: number;
}) {
  const [filters, setFilters] = useState<EventFilters>(NO_FILTERS);
  const [view, setView] = useState<ListingView>("list");

  const facets = useMemo(() => buildFacets(workshops), [workshops]);
  const visible = useMemo(() => applyFilters(workshops, filters), [workshops, filters]);
  const months = useMemo(() => groupByMonth(visible), [visible]);

  /*
    The calendar's own inputs. The grid is narrowed by Type and Location but
    never by the date — a grid that hid the dots for every day but the one
    chosen would be a grid with nothing to choose from.
  */
  const range = useMemo(() => monthKeys(workshops), [workshops]);
  const opening = useMemo(() => defaultCalendarMonth(workshops, renderedAt), [workshops, renderedAt]);
  const [calendarMonth, setCalendarMonth] = useState<string | null>(opening);
  const undated = useMemo(() => applyFilters(workshops, { ...filters, month: null }), [workshops, filters]);

  /* A day key is a month key with a day on the end; the grid's month is the
     first seven characters of whichever the filter holds. */
  const shownMonth = view === "calendar" && filters.month ? filters.month.slice(0, 7) : calendarMonth;
  const selectedDay = view === "calendar" && filters.month && filters.month.length > 7 ? filters.month : null;

  const changeView = (next: ListingView) => {
    setView(next);
    if (next === "calendar") {
      const month = calendarMonth ?? opening;
      setFilters((current) => ({ ...current, month }));
    } else {
      setFilters((current) => ({ ...current, month: null }));
    }
  };

  const changeMonth = (key: string) => {
    setCalendarMonth(key);
    setFilters((current) => ({ ...current, month: key }));
  };

  const selectDay = (key: string | null) => {
    setFilters((current) => ({ ...current, month: key ?? shownMonth }));
  };

  /*
    "Clear filters" from the bar clears the date too; while the calendar is
    open that must put the grid back on its month rather than leave the
    cards unnarrowed under a grid that still shows one. The bar hands back
    `month: null` in that case and this puts the month back.
  */
  const changeFilters = (next: EventFilters) => {
    if (view === "calendar" && next.month === null) {
      setFilters({ ...next, month: shownMonth ?? null });
    } else {
      setFilters(next);
    }
  };

  const calendarOpen = view === "calendar" && shownMonth !== null;

  /*
    What the bar is told. The grid's month is structure, not a choice — a
    visitor who opened the calendar has not filtered anything yet — so the
    bar sees no date until a day is pressed, and "Clear filter" appears for
    that day alone. Every change the bar hands back then carries `month:
    null`, which `changeFilters` turns back into the month on the grid.
  */
  const barFilters = calendarOpen && !selectedDay ? { ...filters, month: null } : filters;

  return (
    <>
      <div className="mt-10 md:mt-12">
        <EventFilterBar
          facets={facets}
          filters={barFilters}
          onChange={changeFilters}
          resultCount={visible.length}
          totalCount={workshops.length}
          view={view}
          onViewChange={changeView}
        />
      </div>

      {calendarOpen && shownMonth ? (
        <div className="mt-8 md:mt-10">
          <EventCalendar
            workshops={undated}
            month={shownMonth}
            onMonthChange={changeMonth}
            selectedDay={selectedDay}
            onSelectDay={selectDay}
            canGoBack={range.length > 0 && shownMonth > range[0]}
            canGoForward={range.length > 0 && shownMonth < range[range.length - 1]}
            renderedAt={renderedAt}
          />
        </div>
      ) : null}

      {visible.length === 0 ? (
        calendarOpen && shownMonth ? (
          <NothingThisMonth
            label={selectedDay ? "that day" : monthKeyLabel(shownMonth)}
            onReset={() => setFilters({ ...NO_FILTERS, month: shownMonth })}
            narrowed={Boolean(filters.category || filters.venue || selectedDay)}
          />
        ) : (
          <NoMatches onReset={() => setFilters(NO_FILTERS)} />
        )
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
                    <EventCard workshop={workshop} index={position} renderedAt={renderedAt} />
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
 * The calendar's empty state: a month, or a chosen day, with nothing on.
 *
 * Quieter than <NoMatches> on purpose — an empty month on a calendar is not
 * a failed search, it is a page of the diary, and the arrows above it are
 * the way on. The reset is offered only when a filter or a chosen day is
 * doing the narrowing, because then there IS something to clear.
 */
function NothingThisMonth({
  label,
  narrowed,
  onReset,
}: {
  label: string;
  narrowed: boolean;
  onReset: () => void;
}) {
  return (
    <div className="mt-10 md:mt-12">
      <p className="max-w-[30rem] text-h3 font-light tracking-[-0.015em]">No events in {label}.</p>
      {narrowed ? (
        <PeelNote type="button" onClick={onReset} className="mt-7 min-h-[3.25rem] px-7">
          Show the whole month
        </PeelNote>
      ) : (
        <p className="mt-4 max-w-[32rem] text-body text-text/75">Use the arrows above to move to a month with dates.</p>
      )}
    </div>
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
      <p className="mt-5 max-w-[32rem] text-body text-text/75">
        The programme is small and runs a few dates at a time. Clearing the filters
        shows everything that is scheduled.
      </p>

      <PeelNote
        type="button"
        onClick={onReset}
        className="mt-9 min-h-[3.25rem] px-7 md:mt-10"
      >
        Clear all filters
      </PeelNote>
    </div>
  );
}
