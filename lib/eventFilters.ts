import type { Workshop } from "@/types";

/**
 * Filtering for the events listing.
 *
 * Pure functions over whatever `getAllWorkshops()` returns — this module holds
 * no data of its own and adds no second source, the same contract
 * `lib/search.ts` already follows. Everything the controls offer is derived
 * from the catalogue at render time, so a date, a strand or a mall that the
 * studio has not scheduled simply never appears as an option. Nothing here
 * invents a value.
 *
 * The studio runs on Gulf Standard Time; a session's month is read in that
 * zone so a late-evening date cannot fall into the previous month for a
 * visitor reading from another one.
 */
const STUDIO_TIME_ZONE = "Asia/Dubai";

/** Which dimensions the listing filters on. `null` means "not narrowed". */
export interface EventFilters {
  /**
   * A date key. Either a month, "2026-10", or a single day, "2026-10-03" —
   * the control picks the grain; the month is a prefix of the day, so one
   * comparison serves both.
   */
  month: string | null;
  /** A {@link Workshop.category} value, verbatim. */
  category: string | null;
  /** A {@link Venue.name} value, verbatim. */
  venue: string | null;
}

export const NO_FILTERS: EventFilters = { month: null, category: null, venue: null };

/** One option in a filter group, with the number of sessions behind it. */
export interface Facet {
  value: string;
  label: string;
  /** A second line, where the value has one — the mall's locality. */
  sub?: string;
  count: number;
}

export interface EventFacets {
  months: Facet[];
  categories: Facet[];
  venues: Facet[];
}

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: STUDIO_TIME_ZONE,
});

const dayLabelFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: STUDIO_TIME_ZONE,
});

const monthLabelFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: STUDIO_TIME_ZONE,
});

/** "2026-10-03" — sortable, and stable across the reader's own time zone. */
export function dayKey(startsAt: string): string {
  const parts = dayKeyFormatter.formatToParts(new Date(startsAt));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** "2026-10" — the same key, one level up. A prefix of {@link dayKey}. */
export function monthKey(startsAt: string): string {
  return dayKey(startsAt).slice(0, 7);
}

/** "October 2026". */
export function monthLabel(startsAt: string): string {
  return monthLabelFormatter.format(new Date(startsAt));
}

/** "Sat 3 Oct" — the date control's label when it drops to single dates. */
export function dayLabel(startsAt: string): string {
  return dayLabelFormatter.format(new Date(startsAt));
}

/**
 * Count the distinct values behind each control, in the order the catalogue
 * gives them — which for months is chronological, because `getAllWorkshops`
 * already sorts by date.
 */
function tally(
  workshops: Workshop[],
  read: (w: Workshop) => { value: string; label: string; sub?: string } | null,
): Facet[] {
  const seen = new Map<string, Facet>();

  for (const workshop of workshops) {
    const entry = read(workshop);
    if (!entry) continue;
    const existing = seen.get(entry.value);
    if (existing) existing.count += 1;
    else seen.set(entry.value, { ...entry, count: 1 });
  }

  return [...seen.values()];
}

/**
 * Every option the controls can offer, derived from the catalogue.
 *
 * A group with fewer than two options is returned as-is; it is the caller that
 * decides not to draw a control offering a single choice, because a filter
 * that cannot narrow anything is furniture.
 */
export function buildFacets(workshops: Workshop[]): EventFacets {
  const months = tally(workshops, (w) => ({
    value: monthKey(w.startsAt),
    label: monthLabel(w.startsAt),
  }));

  /*
    The date control changes granularity with the programme. A schedule sitting
    inside one month offers a single month chip, which can narrow nothing — so
    where that happens it drops to the individual dates instead, which is the
    question someone is actually asking of a short programme ("what is on the
    Saturday?"). Once the schedule crosses a month boundary the dates would run
    to dozens of chips, and months become the useful grain again.

    Both are the same filter: a month value is a prefix of a day value, so
    `applyFilters` compares one way for either.
  */
  const dates =
    months.length > 1
      ? months
      : tally(workshops, (w) => ({ value: dayKey(w.startsAt), label: dayLabel(w.startsAt) }));

  return {
    months: dates,
    categories: tally(workshops, (w) => ({ value: w.category, label: w.category })),
    venues: tally(workshops, (w) =>
      w.venue ? { value: w.venue.name, label: w.venue.name, sub: w.venue.locality } : null,
    ),
  };
}

/** The catalogue, narrowed. Unset dimensions do not narrow anything. */
export function applyFilters(workshops: Workshop[], filters: EventFilters): Workshop[] {
  return workshops.filter((workshop) => {
    if (filters.month && !dayKey(workshop.startsAt).startsWith(filters.month)) return false;
    if (filters.category && workshop.category !== filters.category) return false;
    if (filters.venue && workshop.venue?.name !== filters.venue) return false;
    return true;
  });
}

/** How many dimensions are narrowed — drives the reset control. */
export function activeFilterCount(filters: EventFilters): number {
  return Object.values(filters).filter(Boolean).length;
}

/**
 * The listing, grouped under the month each session falls in.
 *
 * Lifted verbatim from the page that used to render the index, because
 * filtering moved the index into the client tree and the grouping had to come
 * with it. The behaviour is unchanged: a heading appears only where the month
 * actually changes, so a programme running inside one month gets one heading
 * and one running across a season gets the dividers that make it navigable.
 *
 * Each session carries its position in the *filtered* run rather than in the
 * catalogue, because the index uses that number for the printed ordinal and
 * for which side of the page the plate takes — and a run that skipped 02
 * because a filter removed it would read as a mistake.
 */
export type MonthGroup = {
  label: string;
  id: string;
  events: { workshop: Workshop; position: number }[];
};

export function groupByMonth(workshops: Workshop[]): MonthGroup[] {
  const months: MonthGroup[] = [];

  workshops.forEach((workshop, position) => {
    const label = monthLabel(workshop.startsAt);
    const last = months.at(-1);
    if (last?.label === label) last.events.push({ workshop, position });
    else
      months.push({
        label,
        id: `month-${label.toLowerCase().replace(/\s+/g, "-")}`,
        events: [{ workshop, position }],
      });
  });

  return months;
}
