import type { Workshop } from "@/types";

/**
 * Filtering for the events listing.
 *
 * Pure functions over whatever `getAllWorkshops()` returns — this module holds
 * no data of its own and adds no second source, the same contract
 * `lib/search.ts` already follows. Everything the controls offer is derived
 * from the catalogue at render time, so a date, an event, a vibe or a mall
 * that the studio has not scheduled simply never appears as an option.
 * Nothing here invents a value — the vibes come from the experiences' own
 * tags, through a {@link VibeIndex} the caller builds.
 *
 * The studio runs on Gulf Standard Time; a session's month is read in that
 * zone so a late-evening date cannot fall into the previous month for a
 * visitor reading from another one.
 */
const STUDIO_TIME_ZONE = "Asia/Dubai";

/**
 * Which dimensions the listing filters on. `null` means "not narrowed".
 *
 * DATE, EVENT, THEME, VIBE — and the mall, which keeps its place. The listing used
 * to narrow by `category`, the free-text strand every session carries; with
 * every scheduled session filed under "Craft" the control never drew, and
 * what a visitor actually asks of the dated programme is "which event" and
 * "what mood". So the strand gave way to the experience itself (`event`),
 * and the experience's vibe tags (lib/vibes.ts) became a second way in.
 */
export interface EventFilters {
  /**
   * A date key. Either a month, "2026-10", or a single day, "2026-10-03" —
   * the control picks the grain; the month is a prefix of the day, so one
   * comparison serves both.
   */
  month: string | null;
  /** A {@link Workshop.experience} slug — the event the date is a sitting of. */
  event: string | null;
  /**
   * A {@link Workshop.workshopType} slug — the theme or level the sitting
   * runs in (the Cheesecake Collection, Crochet — Beginners): the client's
   * Oct 2026 formats, lib/workshopTypes.ts. "Theme" on the bar.
   */
  type: string | null;
  /**
   * A vibe slug (lib/vibes.ts). A session's own tags where the date has
   * them, else its experience's through the {@link VibeIndex} the caller
   * builds — see {@link vibesOf}.
   */
  vibe: string | null;
  /** A {@link Venue.name} value, verbatim. */
  venue: string | null;
}

export const NO_FILTERS: EventFilters = { month: null, event: null, type: null, vibe: null, venue: null };

/**
 * Experience slug → the vibe slugs it is tagged with.
 *
 * The join the Vibe filter needs, built once by the caller from the
 * experiences the page already holds — the session list stays a list of
 * sessions and carries no copy of the tags.
 */
export type VibeIndex = ReadonlyMap<string, readonly string[]>;

/** The vibe list as the filter needs it: the slug, and the label to print for it. */
export interface VibeOption {
  slug: string;
  label: string;
}

/**
 * What the Event and Vibe dimensions read beyond the session list. Both
 * optional: without them those two controls simply offer nothing, which is
 * also what they offer while the studio has tagged nothing.
 */
export interface FilterContext {
  vibeIndex?: VibeIndex;
  /** The taxonomy in display order; a tag with no entry here is not offered. */
  vibes?: readonly VibeOption[];
  /**
   * The workshop types in the studio's order, for the Theme options. The
   * options themselves are tallied from the sessions (a type with no date
   * cannot narrow anything); this only orders them, so the candle themes
   * and the crochet ladder read as the studio set them rather than by
   * whichever date comes first. Without it, first-seen order.
   */
  typeOrder?: readonly { slug: string }[];
}

export function buildVibeIndex(experiences: readonly { slug: string; vibes?: readonly string[] }[]): VibeIndex {
  return new Map(experiences.map((experience) => [experience.slug, experience.vibes ?? []]));
}

/**
 * The vibe slugs behind a session: its own, when the studio tagged the date
 * itself, else its experience's through the index. A date tagged in the CMS
 * REPLACES the experience's mood rather than adding to it — that is what
 * tagging one date differently is for.
 */
export function vibesOf(workshop: Workshop, index: VibeIndex | undefined): readonly string[] {
  if (workshop.vibes?.length) return workshop.vibes;
  const slug = workshop.experience?.slug;
  return slug && index ? (index.get(slug) ?? []) : [];
}

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
  events: Facet[];
  /** The themes and levels — the workshop types the sessions run in. */
  types: Facet[];
  vibes: Facet[];
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
export function buildFacets(workshops: Workshop[], context: FilterContext = {}): EventFacets {
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

  /*
    A session can carry several vibes, so this is not a `tally`: each session
    counts once under every vibe its experience is tagged with. The options
    come out in the taxonomy's order rather than first-seen — the CMS sets
    that order and "Find your vibe" already shows it that way — and a tag
    the taxonomy does not know is not offered, because there is no honest
    label to print for it.
  */
  const vibeCounts = new Map<string, number>();
  for (const workshop of workshops) {
    for (const slug of vibesOf(workshop, context.vibeIndex)) {
      vibeCounts.set(slug, (vibeCounts.get(slug) ?? 0) + 1);
    }
  }
  const vibes = (context.vibes ?? [])
    .filter((vibe) => vibeCounts.has(vibe.slug))
    .map((vibe) => ({ value: vibe.slug, label: vibe.label, count: vibeCounts.get(vibe.slug) ?? 0 }));

  const types = tally(workshops, (w) => (w.workshopType ? { value: w.workshopType.slug, label: w.workshopType.name } : null));
  if (context.typeOrder) {
    const rank = new Map(context.typeOrder.map((type, i) => [type.slug, i]));
    const at = (facet: Facet) => rank.get(facet.value) ?? Number.MAX_SAFE_INTEGER;
    types.sort((a, b) => at(a) - at(b));
  }

  return {
    months: dates,
    events: tally(workshops, (w) => (w.experience ? { value: w.experience.slug, label: w.experience.name } : null)),
    types,
    vibes,
    venues: tally(workshops, (w) =>
      w.venue ? { value: w.venue.name, label: w.venue.name, sub: w.venue.locality } : null,
    ),
  };
}

/** The catalogue, narrowed. Unset dimensions do not narrow anything. */
export function applyFilters(workshops: Workshop[], filters: EventFilters, context: FilterContext = {}): Workshop[] {
  return workshops.filter((workshop) => {
    if (filters.month && !dayKey(workshop.startsAt).startsWith(filters.month)) return false;
    if (filters.event && workshop.experience?.slug !== filters.event) return false;
    if (filters.type && workshop.workshopType?.slug !== filters.type) return false;
    if (filters.vibe && !vibesOf(workshop, context.vibeIndex).includes(filters.vibe)) return false;
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

/* ==========================================================================
   The calendar — the same catalogue, laid out as a month.

   A second way of reading the programme, not a second source: every cell is
   filled by `dayKey`, the same Dubai-zone key the date filter compares on, so
   a day picked on the grid narrows the list exactly as choosing that date in
   the select would. The builder is pure and takes no clock; "today" is the
   caller's one `renderedAt`, for the same reason <EventsBrowser> never reads
   Date.now() itself.
   ========================================================================== */

/** One cell of the month grid. */
export interface CalendarDay {
  /** "2026-10-03" — the filter value for this day. */
  key: string;
  /** The day of the month, for the numeral. */
  day: number;
  /** False on the leading and trailing cells that pad the first and last week. */
  inMonth: boolean;
  /** The sessions on this day, soonest first. */
  workshops: Workshop[];
}

/** A month as a grid: six rows at most, seven cells each, Monday first. */
export interface CalendarMonth {
  key: string;
  label: string;
  weeks: CalendarDay[][];
}

/** The weekday headings, Monday first — the UAE's working week. */
export const WEEKDAYS: readonly string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const pad = (n: number) => String(n).padStart(2, "0");

/** Every month the programme touches, chronological, as "2026-10" keys. */
export function monthKeys(workshops: Workshop[]): string[] {
  return [...new Set(workshops.map((w) => monthKey(w.startsAt)))].sort();
}

/** "2026-10" plus or minus some months: "2026-11", "2025-12". */
export function shiftMonthKey(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

/** "October 2026" for a month key — the same label `monthLabel` prints for a session. */
export function monthKeyLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return monthLabelFormatter.format(new Date(Date.UTC(y, m - 1, 15, 12)));
}

/**
 * The month a visitor should open the calendar on: the first month with a
 * session that has not started yet, else the last month in the programme
 * (a schedule that has all gone by opens on its last page rather than on
 * an empty month after it).
 */
export function defaultCalendarMonth(workshops: Workshop[], now: number): string | null {
  const upcoming = workshops.find((w) => Date.parse(w.startsAt) > now);
  if (upcoming) return monthKey(upcoming.startsAt);
  const last = workshops.at(-1);
  return last ? monthKey(last.startsAt) : null;
}

/**
 * The grid for one month.
 *
 * A civil date's weekday does not depend on a time zone, so the cells are
 * laid out from the calendar arithmetic alone (`Date.UTC` on the year, month
 * and day); only the sessions are placed by the zone-aware `dayKey`, which
 * is what keeps a 23:30 session on the Dubai date the studio printed.
 */
export function buildCalendar(workshops: Workshop[], key: string): CalendarMonth {
  const [y, m] = key.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const daysBefore = new Date(Date.UTC(y, m - 1, 1)).getUTCDay() || 7; // Sunday → 7
  const lead = daysBefore - 1;

  const byDay = new Map<string, Workshop[]>();
  for (const workshop of workshops) {
    const k = dayKey(workshop.startsAt);
    const list = byDay.get(k);
    if (list) list.push(workshop);
    else byDay.set(k, [workshop]);
  }
  for (const list of byDay.values()) list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const cell = (offset: number): CalendarDay => {
    const date = new Date(Date.UTC(y, m - 1, 1 + offset));
    const k = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
    return {
      key: k,
      day: date.getUTCDate(),
      inMonth: offset >= 0 && offset < daysInMonth,
      workshops: byDay.get(k) ?? [],
    };
  };

  const total = Math.ceil((lead + daysInMonth) / 7) * 7;
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < total; i += 7) {
    weeks.push(Array.from({ length: 7 }, (_, j) => cell(i + j - lead)));
  }

  return { key, label: monthKeyLabel(key), weeks };
}
