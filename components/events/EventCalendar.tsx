"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import { useSessionPassed } from "@/components/booking/SessionClock";
import styles from "@/components/events/EventCalendar.module.css";
import { ScriptTitle } from "@/components/ui/SectionHeader";
import { buildCalendar, dayKey, shiftMonthKey, type CalendarDay } from "@/lib/eventFilters";
import { scrollToY } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import {
  formatDuration,
  formatPrice,
  formatSessionDate,
  formatVenueLine,
  hasSessionPassed,
  isScarce,
  sessionTimeRange,
  spotsLabel,
  workshopHref,
} from "@/lib/workshopHelpers";
import type { Workshop } from "@/types";

/**
 * The programme as a month — the second way of reading the schedule.
 *
 * ==========================================================================
 * A BOARD AND AN AGENDA
 * ==========================================================================
 *
 * The client's brief: a calendar that looks art-directed rather than like a
 * scheduling tool, whose session labels can actually be read, and that is
 * useful on a phone rather than a desktop grid shrunk to fit. So it is two
 * things side by side, the way the reference boards pair a month with a
 * day:
 *
 *   THE BOARD. The month, Monday first, Dubai dates. From `lg` each day with
 *   something on is a card of warm paper carrying its sessions as tiles —
 *   time over title, the title allowed two lines — in their format's colour,
 *   with "+n more" where a day holds more than two. Below `lg` there is no
 *   room for a title, so a day carries one dot per session in the same
 *   colours, and the agenda underneath does the reading.
 *
 *   THE AGENDA. Every session of the chosen day, or of the whole month grouped
 *   by date when no day is chosen, with everything the data holds about it:
 *   the format, the experience, the time from start to end, how long, where,
 *   the price, what is left — and the way into its page. Beside the board from
 *   `xl`, where it scrolls inside the plate; under it everywhere else.
 *
 * ==========================================================================
 * STILL A DATE PICKER OVER THE SAME LIST
 * ==========================================================================
 *
 * Pressing a day hands its `dayKey` up to <EventsBrowser>, which puts it in
 * the same `month` filter the Date select writes to, so the format cards
 * under the calendar narrow to exactly what runs that day. Pressing it again
 * lets the whole month back in. A day with nothing on is not a control — it
 * is not in the tab order, because a button that does nothing is a trap for a
 * keyboard.
 *
 * "+n more" IS PART OF THE DAY'S BUTTON, not a control of its own: pressing
 * it chooses the day, and the agenda then lists every session on it. Nothing
 * is hidden that one press does not show, and the day's accessible name
 * names every session with its time.
 *
 * THE WAY ON IS "VIEW EVENT", NOT "BOOK". The session's own page is where the
 * booking rules live — seats read live, the waitlist, online bookings switched
 * off — and every listing card on the site already goes there. A "Book" here
 * would have to repeat those rules or skip them, so the agenda goes where the
 * cards go.
 *
 * ONE CLOCK. `renderedAt` decides which days have gone by and which is today,
 * the same number every <EventCard> hydrates against; this is a client
 * component and must not read Date.now() while rendering.
 */

/** The six format tones, in the order formats take them; see EventCalendar.module.css. */
const TONES = ["lilac", "terracotta", "sage", "lavender", "slate", "rose"] as const;
type Tone = (typeof TONES)[number];

/** How many sessions a day's card prints as tiles before "+n more". */
const MAX_TILES = 2;

/** How many dots a phone cell draws before "+". */
const MAX_DOTS = 3;

const WEEKDAY_NAMES = [
  { short: "Mon", tiny: "Mo", full: "Monday" },
  { short: "Tue", tiny: "Tu", full: "Tuesday" },
  { short: "Wed", tiny: "We", full: "Wednesday" },
  { short: "Thu", tiny: "Th", full: "Thursday" },
  { short: "Fri", tiny: "Fr", full: "Friday" },
  { short: "Sat", tiny: "Sa", full: "Saturday" },
  { short: "Sun", tiny: "Su", full: "Sunday" },
] as const;

export function EventCalendar({
  workshops,
  month,
  onMonthChange,
  selectedDay,
  onSelectDay,
  canGoBack,
  canGoForward,
  renderedAt,
  formats = [],
  homeMonth = null,
  narrowed = false,
  onReset,
}: {
  /** The sessions to place — already narrowed by event, theme, vibe and location. */
  workshops: Workshop[];
  /** "2026-10". */
  month: string;
  onMonthChange: (key: string) => void;
  /** "2026-10-03", or null for the whole month. */
  selectedDay: string | null;
  onSelectDay: (key: string | null) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  renderedAt: number;
  /** Every format, in the studio's order — what decides each one's colour. */
  formats?: readonly { slug: string }[];
  /** Where "Today" (or "Next dates") goes: this month if it has dates, else the first that does. */
  homeMonth?: string | null;
  /** Whether a filter is narrowing the board — the empty month then offers to clear it. */
  narrowed?: boolean;
  onReset?: () => void;
}) {
  const grid = useMemo(() => buildCalendar(workshops, month), [workshops, month]);
  const today = useMemo(() => dayKey(new Date(renderedAt).toISOString()), [renderedAt]);
  const headingId = `calendar-${month}`;

  /*
    A format's colour is its place in the studio's own order, so it is the
    same on every month and survives a filter. A session with no format, or
    one the list does not hold, is hashed instead — still stable, just not
    guaranteed distinct.
  */
  const toneOf = useMemo(() => {
    const order = new Map(formats.map((format, i) => [format.slug, i]));
    return (workshop: Workshop): Tone => {
      const slug = workshop.workshopType?.slug;
      const at = slug === undefined ? undefined : order.get(slug);
      if (at !== undefined) return TONES[at % TONES.length];
      const key = slug ?? workshop.experience?.slug ?? workshop.title;
      let h = 0;
      for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
      return TONES[h % TONES.length];
    };
  }, [formats]);

  const days = useMemo(() => grid.weeks.flat().filter((cell) => cell.inMonth), [grid]);
  const busy = useMemo(() => days.filter((cell) => cell.workshops.length > 0), [days]);
  const chosen = selectedDay ? (days.find((cell) => cell.key === selectedDay) ?? null) : null;

  const [monthName, year] = splitLabel(grid.label);
  const homeLabel = homeMonth && homeMonth === today.slice(0, 7) ? "Today" : "Next dates";

  /*
    BRING THE AGENDA TO THE VISITOR WHEN IT IS OUT OF SIGHT. Beside the board
    (from `xl`) it is always in view, and on a phone it starts right under the
    small grid. Between those — the full board on a laptop, with the agenda
    under it — pressing a day changes something the visitor cannot see, so
    the page moves to it. Only when it is actually below the fold, and only
    after a press, never on the first render.
  */
  const agendaRef = useRef<HTMLDivElement>(null);
  const pressed = useRef(false);
  useEffect(() => {
    if (!pressed.current || !selectedDay) return;
    pressed.current = false;
    const agenda = agendaRef.current;
    if (!agenda) return;
    const top = agenda.getBoundingClientRect().top;
    if (top > window.innerHeight * 0.75) {
      // Clear of the scrolled header (`--spacing-header-set-lg`, 60px) with room to spare.
      scrollToY(window.scrollY + top - 96);
    }
  }, [selectedDay]);

  const choose = (key: string) => {
    pressed.current = true;
    onSelectDay(selectedDay === key ? null : key);
  };

  return (
    <section aria-labelledby={headingId} className="plate overflow-hidden rounded-lg bg-surface">
      {/* ---- the month, and the ways to move through it ------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 bg-sage px-4 py-4 sm:px-6 md:py-5 lg:px-8">
        <h3 id={headingId} className="flex items-baseline gap-3">
          {/*
            The month in the brand's script, the year in the sans: Hapsha has
            no real 7, 8 or 9, so a year can never be set in it.
          */}
          <span className="heading-script text-script-panel leading-none text-text">
            <ScriptTitle>{monthName}</ScriptTitle>
          </span>
          <span className="text-h4 font-light tabular-nums text-text/70">{year}</span>
        </h3>

        <div className="flex items-center gap-2">
          {homeMonth && homeMonth !== month ? (
            <button
              type="button"
              onClick={() => onMonthChange(homeMonth)}
              className="press-in inline-flex min-h-10 items-center rounded-pill border border-text/25 bg-surface/70 px-4 text-label font-medium uppercase tracking-eyebrow text-text transition-colors duration-300 ease-soft hover:border-primary hover:bg-surface"
            >
              {homeLabel}
            </button>
          ) : null}
          <NavButton label="Previous month" disabled={!canGoBack} onClick={() => onMonthChange(shiftMonthKey(month, -1))}>
            <ChevronLeft aria-hidden strokeWidth={1.75} className="h-4 w-4" />
          </NavButton>
          <NavButton label="Next month" disabled={!canGoForward} onClick={() => onMonthChange(shiftMonthKey(month, 1))}>
            <ChevronRight aria-hidden strokeWidth={1.75} className="h-4 w-4" />
          </NavButton>
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_21rem]">
        {/* ---- the board -------------------------------------------------- */}
        <div className={cn(styles.board, "min-w-0 px-2 pb-4 pt-3 sm:px-4 md:px-5 lg:px-6 lg:pb-6 lg:pt-4")}>
          {/*
            A REAL TABLE, NOT AN ARIA GRID. `role="grid"` promises arrow-key
            movement between cells, which this does not implement — each day
            with sessions is an ordinary button in the tab order. A `<table>`
            gives a screen reader the weekday and the week of every cell
            without that promise.
          */}
          <table
            aria-labelledby={headingId}
            className="w-full table-fixed border-separate border-spacing-1 lg:border-spacing-1.5"
          >
            <thead>
              <tr>
                {WEEKDAY_NAMES.map((day) => (
                  <th
                    key={day.short}
                    scope="col"
                    className="pb-2 pt-1 text-center text-[0.75rem] font-medium uppercase tracking-[0.12em] text-text/60 sm:text-label sm:tracking-eyebrow lg:text-left lg:ps-2.5"
                  >
                    <abbr title={day.full} className="no-underline">
                      <span aria-hidden className="sm:hidden">
                        {day.tiny}
                      </span>
                      <span aria-hidden className="hidden sm:inline">
                        {day.short}
                      </span>
                      <span className="sr-only">{day.full}</span>
                    </abbr>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.weeks.map((week, w) => (
                <tr key={w}>
                  {week.map((cell) => (
                    <td key={cell.key} className="h-px p-0 align-top">
                      <DayCell
                        cell={cell}
                        selected={cell.key === selectedDay}
                        isToday={cell.key === today}
                        passed={cell.key < today}
                        toneOf={toneOf}
                        onSelect={() => choose(cell.key)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

        </div>

        {/* ---- the agenda ------------------------------------------------- */}
        <div ref={agendaRef} className="relative min-w-0 border-t border-text/10 bg-surface xl:border-l xl:border-t-0">
          <Agenda
            monthName={monthName}
            chosen={chosen}
            busy={busy}
            today={today}
            renderedAt={renderedAt}
            toneOf={toneOf}
            onShowMonth={() => onSelectDay(null)}
            onSelectDay={choose}
            narrowed={narrowed}
            onReset={onReset}
          />
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   The board
   ========================================================================== */

function DayCell({
  cell,
  selected,
  isToday,
  passed,
  toneOf,
  onSelect,
}: {
  cell: CalendarDay;
  selected: boolean;
  isToday: boolean;
  passed: boolean;
  toneOf: (workshop: Workshop) => Tone;
  onSelect: () => void;
}) {
  const count = cell.workshops.length;

  /* Outside the month: an empty slot that keeps the weekday columns true. */
  if (!cell.inMonth) return <div aria-hidden className="h-full min-h-[3rem] lg:min-h-[5.5rem]" />;

  /*
    THE NUMERAL. Today wears a Deep Lilac ring and, from `lg`, the word
    "Today" beside it — the one day that has to be findable at a glance, said
    in a shape and a word as well as a colour. A chosen day's numeral is
    filled (lilac on the board, the light ink on a phone's filled cell).
  */
  const numeral = (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-pill text-label font-medium tabular-nums",
        selected
          ? "bg-on-primary text-primary lg:bg-primary lg:text-on-primary"
          : isToday
            ? "text-primary ring-[1.5px] ring-primary"
            : count > 0
              ? "text-text"
              : passed
                ? "text-text/35"
                : "text-text/55",
      )}
    >
      {cell.day}
    </span>
  );

  const todayMark = isToday ? (
    <span className="hidden text-[0.75rem] font-medium uppercase tracking-[0.12em] text-primary lg:inline">Today</span>
  ) : null;

  /*
    A week with nothing on stands lower than one with sessions: an empty
    row only has to hold its numerals, and the height it gives up is what
    lets a busy row print its titles in full without the board growing.
  */
  const shell = cn(
    "flex h-full w-full flex-col rounded-[0.75rem] p-1 text-left min-h-[3rem] sm:min-h-[3.5rem] lg:p-2",
    count > 0 ? "lg:min-h-[8.5rem]" : "lg:min-h-[5.5rem]",
  );

  if (count === 0) {
    return (
      <div className={cn(shell, styles.quiet, "items-center lg:items-start")}>
        <span className="flex items-center gap-2">
          {numeral}
          {todayMark}
        </span>
        {isToday ? <span className="sr-only">Today</span> : null}
      </div>
    );
  }

  /*
    The cell's whole story for a screen reader, since the dots and the
    clamped titles are for the eye: the date, whether it is today, and every
    session's name and start time.
  */
  const label = `${longDate(cell.key)}${isToday ? ", today" : ""}, ${count} ${count === 1 ? "session" : "sessions"}: ${cell.workshops
    .map((w) => `${w.title} at ${sessionTimeRange(w.startsAt, w.durationMinutes).start}`)
    .join(", ")}`;

  const shown = count > MAX_TILES ? MAX_TILES : count;
  const more = count - shown;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={label}
      className={cn(shell, styles.day, "press-in items-center lg:items-stretch", passed && !selected && "opacity-65")}
    >
      <span className="flex w-full items-center justify-center gap-2 lg:justify-start">
        {numeral}
        {todayMark}
      </span>

      {/* The phone's reading: a dot per session, in its format's colour. */}
      <span aria-hidden className="mt-1 flex items-center gap-[3px] lg:hidden">
        {cell.workshops.slice(0, MAX_DOTS).map((w) => (
          <span key={w.slug} data-tone={toneOf(w)} className={cn(styles.tone, styles.dot)} />
        ))}
        {count > MAX_DOTS ? (
          <span className={cn("text-[0.75rem] font-medium leading-none", selected ? "text-on-primary" : "text-text/70")}>+</span>
        ) : null}
      </span>

      {/* The board's reading: a tile per session, then "+n more". */}
      <span aria-hidden className="mt-2 hidden w-full min-w-0 flex-col gap-1.5 lg:flex">
        {cell.workshops.slice(0, shown).map((w) => (
          <span key={w.slug} data-tone={toneOf(w)} className={cn(styles.tone, styles.tile)}>
            <span className="text-[0.75rem] font-medium uppercase tabular-nums leading-tight tracking-[0.06em] text-text/75">
              {sessionTimeRange(w.startsAt, w.durationMinutes).start}
            </span>
            <span className={cn(styles.tileTitle, "text-label font-medium leading-[1.25] text-text")}>{w.title}</span>
          </span>
        ))}
        {more > 0 ? (
          <span className="inline-flex items-center gap-1 self-start rounded-pill px-1.5 py-0.5 text-label font-medium text-primary underline decoration-primary/40 underline-offset-[3px]">
            +{more} more
          </span>
        ) : null}
      </span>
    </button>
  );
}

/* ==========================================================================
   The agenda
   ========================================================================== */

function Agenda({
  monthName,
  chosen,
  busy,
  today,
  renderedAt,
  toneOf,
  onShowMonth,
  onSelectDay,
  narrowed,
  onReset,
}: {
  monthName: string;
  chosen: CalendarDay | null;
  busy: CalendarDay[];
  today: string;
  renderedAt: number;
  toneOf: (workshop: Workshop) => Tone;
  onShowMonth: () => void;
  onSelectDay: (key: string) => void;
  narrowed: boolean;
  onReset?: () => void;
}) {
  const sessions = chosen ? chosen.workshops : busy.flatMap((cell) => cell.workshops);
  const beside = useBeside();
  const announce = chosen
    ? `${longDate(chosen.key)}: ${sessions.length} ${sessions.length === 1 ? "session" : "sessions"}`
    : `All of ${monthName}: ${sessions.length} ${sessions.length === 1 ? "session" : "sessions"}`;

  return (
    /*
      `data-lenis-prevent` WHILE IT SCROLLS ON ITS OWN. The site's smooth
      scroll (Lenis) takes every wheel event for the page, so without this
      the wheel over the agenda moved the page and never the list — the
      month's later dates were out of reach. Only from `xl`, where the agenda
      is the side panel with its own scroll; everywhere else it is part of
      the page and the page's smoothing should carry on over it.
    */
    <div
      data-lenis-prevent={beside ? "" : undefined}
      className={cn(styles.agendaScroll, "flex flex-col xl:absolute xl:inset-0 xl:overflow-y-auto")}
    >
      {/* What changed, said once for a screen reader — the counts the client keeps off the page. */}
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      <div className="sticky top-0 z-10 bg-surface/95 px-4 pb-3 pt-5 backdrop-blur-sm sm:px-6 lg:px-8 xl:px-6">
        <div className="flex items-center justify-between gap-4">
          <p className="whitespace-nowrap text-label font-medium uppercase tracking-eyebrow text-text/60">
            {chosen ? (chosen.key === today ? "Today" : "Chosen day") : "This month"}
          </p>
          {chosen ? (
            <button
              type="button"
              onClick={onShowMonth}
              aria-label={`Show all of ${monthName}`}
              className="press-in shrink-0 text-label font-medium uppercase tracking-eyebrow text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
            >
              Whole month
            </button>
          ) : null}
        </div>
        <h4 className="mt-1 text-h4 font-medium text-text">
          {chosen ? dayHeading(chosen.key) : <span className="lg:max-xl:hidden">All of {monthName}</span>}
          {chosen ? null : <span className="hidden lg:max-xl:inline">Day by day</span>}
        </h4>
      </div>

      <div className="px-4 pb-6 sm:px-6 lg:px-8 xl:px-6">
        {sessions.length === 0 ? (
          <div className="rounded-md bg-cream/45 px-5 py-6">
            <p className="text-body font-medium text-text">
              Nothing scheduled in {monthName}
              {narrowed ? " for these filters" : ""}.
            </p>
            {narrowed && onReset ? (
              <button
                type="button"
                onClick={onReset}
                className="press-in mt-3 text-label font-medium uppercase tracking-eyebrow text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
              >
                Clear filters
              </button>
            ) : (
              <p className="mt-2 text-fine text-text/75">Use the arrows above to move to a month with dates.</p>
            )}
          </div>
        ) : chosen ? (
          <ul className="flex flex-col gap-3">
            {sessions.map((w) => (
              <li key={w.slug}>
                <AgendaItem workshop={w} tone={toneOf(w)} renderedAt={renderedAt} />
              </li>
            ))}
          </ul>
        ) : (
          <>
            {/*
            Between `lg` and `xl` the full board is the month's reading and
            the agenda sits under it, so repeating the whole month there would
            only make the page twice as long. It waits for a day instead.
          */}
            <p className="hidden text-body text-text/80 lg:max-xl:block">
              Choose a date on the board to see its sessions in full.
            </p>
            {/* The month, grouped by date. Each date heading is also the way to
             choose that day, so the board and the list stay one control. */}
            <ol className="flex flex-col gap-6 lg:max-xl:hidden">
              {busy.map((cell) => (
                <li key={cell.key}>
                  <h5 className="mb-2">
                    <button
                      type="button"
                      onClick={() => onSelectDay(cell.key)}
                      aria-label={`Choose ${longDate(cell.key)}`}
                      className={cn(
                        "press-in inline-flex items-baseline gap-2 text-label font-medium uppercase tracking-eyebrow hover:text-primary",
                        cell.key < today ? "text-text/45" : "text-text/75",
                      )}
                    >
                      {shortDate(cell.key)}
                      {cell.key === today ? <span className="text-primary">Today</span> : null}
                    </button>
                  </h5>
                  <ul className="flex flex-col gap-2">
                    {cell.workshops.map((w) => (
                      <li key={w.slug}>
                        <AgendaItem workshop={w} tone={toneOf(w)} renderedAt={renderedAt} compact />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * One session in the agenda: everything the data holds about it, nothing it
 * does not. The title is the link and covers the whole row, the way an
 * <EventCard> does; "View event" is the visible affordance.
 *
 * `compact` is the month list's version — format, time and what is left on
 * two lines — so a month of sessions stays scannable; the chosen day's
 * version adds the experience, the duration, the place and the price.
 */
function AgendaItem({
  workshop,
  tone,
  renderedAt,
  compact = false,
}: {
  workshop: Workshop;
  tone: Tone;
  renderedAt: number;
  compact?: boolean;
}) {
  const passed = useSessionPassed(workshop.startsAt, hasSessionPassed(workshop, renderedAt));
  const { start, end } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);
  const status = passed ? "Date passed" : spotsLabel(workshop);
  const name = `${workshop.title}, ${formatSessionDate(workshop.startsAt)}, ${start} to ${end}${
    workshop.venue ? ` at ${formatVenueLine(workshop.venue)}` : ""
  }`;

  return (
    <article
      data-tone={tone}
      className={cn(
        styles.tone,
        styles.agendaItem,
        "group relative rounded-md",
        compact ? "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 py-3 pe-3 ps-4" : "py-4 pe-4 ps-5",
        passed && "opacity-70",
      )}
    >
      <div className="min-w-0">
        {!compact && workshop.experience ? (
          <p className="text-label font-medium uppercase tracking-eyebrow text-text/65">{workshop.experience.name}</p>
        ) : null}
        <h5 className={cn("font-medium leading-snug text-text", compact ? "text-body" : "mt-1 text-h4")}>
          <Link href={workshopHref(workshop)} aria-label={name} className="after:absolute after:inset-0 after:rounded-md">
            {workshop.title}
          </Link>
        </h5>
        <p className={cn("text-fine text-text/80", compact ? "mt-0.5" : "mt-2")}>
          <span className="whitespace-nowrap tabular-nums">
            {start}
            <span aria-hidden> &ndash; </span>
            <span className="sr-only"> to </span>
            {end}
          </span>
          {!compact ? (
            <>
              <Sep />
              <span className="whitespace-nowrap">{formatDuration(workshop.durationMinutes)}</span>
            </>
          ) : null}
          {compact ? (
            <>
              <Sep />
              <span className={cn("whitespace-nowrap", !passed && isScarce(workshop) && "font-medium text-text")}>{status}</span>
            </>
          ) : null}
        </p>
        {!compact ? (
          <p className="mt-0.5 text-fine text-text/80">
            {workshop.venue ? (
              <>
                {workshop.venue.name}
                <Sep />
              </>
            ) : null}
            <span className="whitespace-nowrap">{formatPrice(workshop.price)}</span>
          </p>
        ) : null}
      </div>

      {compact ? (
        <ArrowRight
          aria-hidden
          strokeWidth={1.75}
          className="h-4 w-4 text-primary transition-transform duration-300 ease-soft motion-safe:group-hover:translate-x-0.5"
        />
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-text/10 pt-3">
          <p className="flex items-center gap-2 text-label font-medium uppercase tracking-eyebrow text-text">
            {!passed && isScarce(workshop) ? <span aria-hidden className="h-1.5 w-1.5 rounded-pill bg-terracotta" /> : null}
            {status}
          </p>
          <span aria-hidden className="flex items-center gap-1.5 text-label font-medium uppercase tracking-eyebrow text-primary">
            View event
            <ArrowRight
              strokeWidth={1.75}
              className="h-4 w-4 transition-transform duration-300 ease-soft motion-safe:group-hover:translate-x-0.5"
            />
          </span>
        </div>
      )}
    </article>
  );
}

function Sep() {
  /* Spaces either side, not padding: they are where a narrow row may break,
     so "6 spots available" drops to the next line at 320px instead of
     running out of its card. */
  return (
    <span aria-hidden className="text-text/35">
      {" "}
      &middot;{" "}
    </span>
  );
}

/* ==========================================================================
   Helpers
   ========================================================================== */

/** The `xl` breakpoint — where the agenda stands beside the board and scrolls by itself. */
const BESIDE = "(min-width: 80rem)";

/** Whether the agenda is the side panel right now; false on the server and before hydration. */
function useBeside(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(BESIDE);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(BESIDE).matches,
    () => false,
  );
}

/** "November 2026" → ["November", "2026"]. */
function splitLabel(label: string): [string, string] {
  const at = label.lastIndexOf(" ");
  return at === -1 ? [label, ""] : [label.slice(0, at), label.slice(at + 1)];
}

const civil = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
};

/** "Saturday 21 November 2026", for a day's accessible name. */
function longDate(key: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(civil(key));
}

/** "Saturday 21 November", for the agenda's heading. */
function dayHeading(key: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(civil(key));
}

/** "Sat 21 Nov", for a date in the month's list. */
function shortDate(key: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
    civil(key),
  );
}

function NavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "press-in inline-flex size-10 items-center justify-center rounded-pill border transition-colors duration-300 ease-soft",
        disabled
          ? "cursor-default border-text/15 text-text/30"
          : "border-primary bg-primary text-on-primary hover:border-text hover:bg-text",
      )}
    >
      {children}
    </button>
  );
}
