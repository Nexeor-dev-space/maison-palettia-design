"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { EventCalendar } from "@/components/events/EventCalendar";
import { EventFilterBar, type ListingView } from "@/components/events/EventFilters";
import { Progression, TypeCard } from "@/components/events/WorkshopTypeCards";
import { Reveal } from "@/components/motion/Reveal";
import { PeelNote } from "@/components/ui/PeelNote";
import { ScriptTitle } from "@/components/ui/SectionHeader";
import { EventCard } from "@/components/workshops/EventCard";
import {
  applyFilters,
  buildFacets,
  buildVibeIndex,
  defaultCalendarMonth,
  groupByMonth,
  monthKeyLabel,
  monthKeys,
  NO_FILTERS,
  type EventFilters,
  type FilterContext,
} from "@/lib/eventFilters";
import type { CreativeExperience } from "@/lib/experiences";
import { VIBES, type Vibe } from "@/lib/vibes";
import type { WorkshopType } from "@/lib/workshopTypes";
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
 * screen reader hears on "Crocheting" (it is no longer drawn — see
 * <EventFilterBar>) does not drop to zero the moment they pick a different
 * mall. Only the list below reacts.
 *
 * THE VIBE FILTER READS THE EXPERIENCES. A session carries no vibes of its
 * own; its experience does, as the tags the studio sets in the CMS
 * (lib/vibes.ts). The page already holds the experiences for the walk-in
 * half, so they come in here too and are folded into a {@link FilterContext}
 * once — the Event filter needs nothing beyond the sessions themselves.
 * `vibes` is the taxonomy in the CMS's order, for the labels; it defaults to
 * the in-file list the way every other vibe surface does.
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
 * date and the select comes back. Event, Vibe and Location keep working in
 * both views and narrow the grid's dots as well as the cards.
 *
 * ==========================================================================
 * WHAT THE FILTERS RETURN: FORMATS, WHEN THE PROGRAMME HAS THEM
 * ==========================================================================
 *
 * The client's Oct 2026 brief has a customer choose a candle theme or a
 * crochet level first and a date second. With `types` handed in, the
 * results under the bar are those formats — each experience's, as the
 * cards its own page draws, with the next date that passes the filters
 * and the recommended path where the studio set one — rather than one
 * card per sitting. The filters are unchanged and still narrow sessions:
 * a format is shown when its experience passes Event, when it is the
 * Theme chosen (or none is), and, once a date, a vibe or a location is
 * chosen, when one of its sittings passes too. The
 * calendar's dots are still the sittings, so a day on the grid narrows to
 * the formats running that day.
 *
 * Without `types` (the programme before the update, or a CMS that holds
 * none) the results are the month-by-month cards they always were.
 */
export function EventsBrowser({
  workshops,
  experiences = [],
  types = [],
  vibes = VIBES,
  renderedAt,
  perPersonLabel,
  emptyTitle = "The next dates are being set.",
  emptyBody = null,
}: {
  workshops: Workshop[];
  /** The experiences the sessions belong to, for their vibe tags and, with `types`, their heads. */
  experiences?: readonly Pick<CreativeExperience, "slug" | "name" | "kind" | "description" | "vibes">[];
  /** The formats the scheduled experiences run in; the results are these when given. */
  types?: readonly WorkshopType[];
  /** The vibe taxonomy, in display order. */
  vibes?: readonly Vibe[];
  renderedAt: number;
  /** The Page labels' "per person", for a format card's price line. */
  perPersonLabel?: string;
  /** With formats but no dates at all: the words under the cards. */
  emptyTitle?: string | null;
  emptyBody?: string | null;
}) {
  const [filters, setFilters] = useState<EventFilters>(NO_FILTERS);
  const [view, setView] = useState<ListingView>("list");

  /*
    The Theme options in the studio's order: experience by experience, then
    each one's own `order`. The types arrive sorted by `order` alone, which
    is a number per experience (the first candle theme and the first crochet
    level are both 1), so sorted flat they interleave; grouped under their
    experiences they read as the candle themes, then the crochet ladder.
  */
  const typeOrder = useMemo(
    () => experiences.flatMap((experience) => types.filter((type) => type.experienceSlug === experience.slug)),
    [experiences, types],
  );
  const context = useMemo<FilterContext>(
    () => ({ vibeIndex: buildVibeIndex(experiences), vibes, typeOrder }),
    [experiences, vibes, typeOrder],
  );
  const facets = useMemo(() => buildFacets(workshops, context), [workshops, context]);
  const visible = useMemo(() => applyFilters(workshops, filters, context), [workshops, filters, context]);
  const months = useMemo(() => groupByMonth(visible), [visible]);
  const groups = useMemo(
    () => (types.length ? formatGroups(experiences, types, visible, filters, renderedAt) : []),
    [experiences, types, visible, filters, renderedAt],
  );
  const formatted = types.length > 0;
  /* What "nothing matched" means: no format left, or no sitting left. */
  const nothing = formatted ? groups.length === 0 : visible.length === 0;

  /*
    The calendar's own inputs. The grid is narrowed by Event, Vibe and
    Location but never by the date — a grid that hid the dots for every day but the one
    chosen would be a grid with nothing to choose from.
  */
  const range = useMemo(() => monthKeys(workshops), [workshops]);
  const opening = useMemo(() => defaultCalendarMonth(workshops, renderedAt), [workshops, renderedAt]);
  const [calendarMonth, setCalendarMonth] = useState<string | null>(opening);
  const undated = useMemo(() => applyFilters(workshops, { ...filters, month: null }, context), [workshops, filters, context]);

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

      {nothing ? (
        calendarOpen && shownMonth ? (
          <NothingThisMonth
            label={selectedDay ? "that day" : monthKeyLabel(shownMonth)}
            onReset={() => setFilters({ ...NO_FILTERS, month: shownMonth })}
            narrowed={Boolean(filters.event || filters.type || filters.vibe || filters.venue || selectedDay)}
          />
        ) : (
          <NoMatches onReset={() => setFilters(NO_FILTERS)} />
        )
      ) : formatted ? (
        <div className="mt-10 md:mt-12">
          {groups.map((group, i) => (
            <FormatGroup key={group.experience.slug} group={group} first={i === 0} renderedAt={renderedAt} perPersonLabel={perPersonLabel} />
          ))}
          {workshops.length === 0 ? (
            <Reveal className="mt-12 border-t border-line pt-10">
              <p className="max-w-[30rem] text-h3 font-light tracking-[-0.015em]">{emptyTitle}</p>
              {emptyBody ? <p className="mt-4 max-w-[32rem] text-body text-text/85">{emptyBody}</p> : null}
            </Reveal>
          ) : null}
        </div>
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

/* ==========================================================================
   The formatted results — one group per experience
   ========================================================================== */

/** One experience's formats that pass the filters, each with its dates that pass. */
interface FormatGroupData {
  experience: Pick<CreativeExperience, "slug" | "name" | "description">;
  formats: { type: WorkshopType; dates: Workshop[] }[];
  /** Every format of the experience, for the path strip's full order. */
  all: WorkshopType[];
  /** The experience's sittings ahead that belong to no format (a date added before its type). */
  loose: Workshop[];
}

/**
 * Which formats the filters leave, by experience, in the studio's order.
 *
 * EVENT is the experience's: a format is its experience's format, so it
 * passes when the experience does. THEME is the format itself: the one
 * chosen stays and its siblings go (the path strip still draws the whole
 * ladder, so the order is not lost). VIBE, DATE AND LOCATION are the
 * sitting's — a date can carry its own vibes, over its experience's
 * (`vibesOf` in lib/eventFilters.ts) — so with any of them set a format
 * stays only while one of its sittings passes: with either set, a format stays only while one of its dates
 * passes — a theme with no sitting in the chosen month is not on in that
 * month. With neither set, a format with no dates yet still shows, saying
 * so, because a theme the studio has announced is a choice even before
 * its first date is published.
 *
 * `dates` are the format's passing sittings ahead of `renderedAt`, soonest
 * first — what the card's "Next date" and "From" read. Passed sittings are
 * dropped from both the cards and the loose list: a format is a thing to
 * choose, and a date that has gone by is not a choice. (The month-by-month
 * cards keep theirs as "Date passed" because there a date IS the card.)
 */
function formatGroups(
  experiences: readonly Pick<CreativeExperience, "slug" | "name" | "kind" | "description" | "vibes">[],
  types: readonly WorkshopType[],
  visible: readonly Workshop[],
  filters: EventFilters,
  renderedAt: number,
): FormatGroupData[] {
  const dated = Boolean(filters.month || filters.venue || filters.vibe);
  const ahead = visible.filter((w) => Date.parse(w.startsAt) > renderedAt).sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return experiences
    .filter((experience) => experience.kind === "scheduled")
    .filter((experience) => !filters.event || experience.slug === filters.event)
    .map((experience) => {
      const all = types.filter((type) => type.experienceSlug === experience.slug);
      const formats = all
        .filter((type) => !filters.type || type.slug === filters.type)
        .map((type) => ({ type, dates: ahead.filter((w) => w.workshopType?.slug === type.slug) }))
        .filter(({ dates }) => !dated || dates.length > 0);
      const loose = filters.type ? [] : ahead.filter((w) => w.experience?.slug === experience.slug && !w.workshopType);
      return { experience, formats, all, loose };
    })
    .filter((group) => group.formats.length > 0 || group.loose.length > 0);
}

/**
 * One experience in the results: its name and line, the way to its own
 * page, its formats as cards, and the path strip where there is one.
 */
function FormatGroup({
  group,
  first,
  renderedAt,
  perPersonLabel,
}: {
  group: FormatGroupData;
  first: boolean;
  renderedAt: number;
  perPersonLabel?: string;
}) {
  const { experience, formats, all, loose } = group;
  const headingId = `formats-${experience.slug}`;

  return (
    <section aria-labelledby={headingId} className={first ? "" : "mt-14 border-t border-line pt-10 md:mt-16 md:pt-12"}>
      <Reveal>
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-4 lg:gap-x-10">
          <div className="col-span-12 md:col-span-8">
            <h3 id={headingId} className="heading-script pb-[0.2em] text-script-compact text-text">
              <ScriptTitle>{experience.name}</ScriptTitle>
            </h3>
            {experience.description ? <p className="mt-3 max-w-[34rem] text-body text-text/85">{experience.description}</p> : null}
          </div>
          <div className="col-span-12 md:col-span-4 md:pb-1 md:text-right">
            <Link
              href={`/events/${experience.slug}`}
              className="inline-flex items-center gap-2 text-label font-medium uppercase tracking-eyebrow text-text underline decoration-primary underline-offset-4"
            >
              About {experience.name}
              <span aria-hidden>&#8594;</span>
            </Link>
          </div>
        </div>
      </Reveal>

      {formats.length > 0 ? (
        <ul className="mt-7 grid gap-5 md:mt-8 md:grid-cols-2 lg:gap-6">
          {formats.map(({ type, dates }, i) => (
            <Reveal as="li" key={type.slug} delay={Math.min(i, 6) * 0.05} className="flex">
              <TypeCard type={type} dates={dates} perPersonLabel={perPersonLabel} />
            </Reveal>
          ))}
        </ul>
      ) : null}

      {/* Sittings with no format — the cards they always had, so a date is never lost from the page. */}
      {loose.length > 0 ? (
        <ol className="mt-7 grid gap-6 md:mt-8 md:grid-cols-2 lg:gap-8">
          {loose.map((workshop, position) => (
            <li key={workshop.slug} className="h-full">
              <EventCard workshop={workshop} index={position} renderedAt={renderedAt} />
            </li>
          ))}
        </ol>
      ) : null}

      <Progression types={all} id={`${headingId}-path`} heading="h4" className="mt-10 md:mt-12" />
    </section>
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
