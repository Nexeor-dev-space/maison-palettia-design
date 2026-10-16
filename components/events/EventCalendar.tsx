"use client";

import { useModeCopy } from "@/components/layout/SiteChrome";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
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
 *   THE BOARD. The month, Monday first, Dubai dates, under a key to the
 *   format colours. From `lg` each day with something on is a card of warm
 *   paper carrying its courses as small tickets — the time on the stub, the
 *   course on the body, a course run twice that day one ticket with both
 *   times — in their format's colour, with "+n more" past two. Below `lg`
 *   there is no room for a title, so a day carries one dot per session in
 *   the same colours, and the agenda does the reading.
 *
 *   THE AGENDA. Only once a day is chosen: every session of it, with
 *   everything the data holds — the format, the experience, the time from
 *   start to end, how long, where, the price, what is left — and the way into
 *   its page. Beside the board from `xl`, where it scrolls inside the plate;
 *   under it everywhere else. With no day chosen the board has the whole
 *   width, and the month's sessions are the cards under the calendar.
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
  formats?: readonly { slug: string; name: string }[];
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

  /*
    THE KEY TO THE COLOURS: the formats that run this month, in the studio's
    order. It is what lets a tile drop the experience from its title — the
    colour says "Crochet", the tile says "Beginners" — and what makes a
    phone's dots readable at all.
  */
  const legend = useMemo(() => {
    const running = new Set(days.flatMap((cell) => cell.workshops.map((w) => w.workshopType?.slug)));
    const shown = formats
      .map((format, i) => ({ slug: format.slug, name: shortTitle(format.name), tone: TONES[i % TONES.length] }))
      .filter((format) => running.has(format.slug));
    /* "Crochet — Beginners", "Crochet — Returning Learners" share one "Crochet" label; a name with no dash stands alone. */
    const groups: { label: string | null; formats: typeof shown }[] = [];
    formats.forEach((format) => {
      const entry = shown.find((f) => f.slug === format.slug);
      if (!entry) return;
      const at = format.name.indexOf(" — ");
      const label = at === -1 ? null : format.name.slice(0, at);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.formats.push(entry);
      else groups.push({ label, formats: [entry] });
    });
    return { count: shown.length, groups };
  }, [days, formats]);
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

      {/* What changed, said once for a screen reader — the counts the client keeps off the page. */}
      <p aria-live="polite" className="sr-only">
        {chosen
          ? `${longDate(chosen.key)}: ${chosen.workshops.length} ${chosen.workshops.length === 1 ? "session" : "sessions"}`
          : ""}
      </p>

      <div className={cn("grid", chosen && "xl:grid-cols-[minmax(0,1fr)_21rem]")}>
        {/* ---- the board -------------------------------------------------- */}
        <div className={cn(styles.board, "min-w-0 px-2 pb-4 pt-3 sm:px-4 md:px-5 lg:px-6 lg:pb-6 lg:pt-4")}>
          {legend.count > 1 ? (
            <ul
              aria-label="Colour key"
              className="mb-1 flex flex-wrap gap-x-5 gap-y-1.5 px-1 pb-2 pt-1 text-fine text-text/80 lg:mb-2 lg:px-1.5"
            >
              {legend.groups.map((group) => (
                <li key={group.formats[0].slug} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {group.label ? <span className="font-medium text-text">{group.label}</span> : null}
                  {group.formats.map((format) => (
                    <span key={format.slug} className="flex items-center gap-1.5">
                      <span aria-hidden data-tone={format.tone} className={cn(styles.tone, styles.swatch)} />
                      {format.name}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          ) : null}

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

          {busy.length === 0 ? (
            <div className="mx-1 mt-3 rounded-md bg-cream/45 px-5 py-5 lg:mx-1.5">
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
          ) : !chosen ? (
            <p className="mt-1 px-1 text-fine text-text/60 lg:px-1.5">Choose a date to see its sessions.</p>
          ) : null}
        </div>

        {/* ---- the agenda: only for a chosen day ---------------------------- */}
        {chosen ? (
          <div ref={agendaRef} className="relative min-w-0 border-t border-text/10 bg-surface xl:border-l xl:border-t-0">
            <Agenda day={chosen} today={today} renderedAt={renderedAt} toneOf={toneOf} onClose={() => onSelectDay(null)} />
          </div>
        ) : null}
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
  if (!cell.inMonth) return <div aria-hidden className="h-full min-h-[3rem] lg:min-h-[2.75rem]" />;

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
    lets a busy row print its titles in full without the board growing. A
    busy row is as tall as its tickets and no taller.
  */
  const shell = cn(
    "flex h-full w-full flex-col rounded-[0.75rem] p-1 text-left min-h-[3rem] sm:min-h-[3.5rem] lg:min-h-[2.75rem] lg:p-1.5",
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

  /*
    ONE TILE PER COURSE, NOT PER SITTING. Most days run the same course
    twice — a morning and an evening — and two tiles saying the same title
    were most of the board's noise. Sittings of one course share a tile that
    lists their times; "+n more" still counts sessions, not tiles.
  */
  const tiles = groupSittings(cell.workshops);
  const shownTiles = tiles.slice(0, MAX_TILES);
  const more = count - shownTiles.reduce((sum, tile) => sum + tile.length, 0);

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

      {/* The board's reading: a ticket per course, then "+n more". */}
      <span aria-hidden className="mt-1 hidden w-full min-w-0 flex-col gap-1 lg:flex">
        {shownTiles.map((sittings) => (
          <span key={sittings[0].slug} data-tone={toneOf(sittings[0])} className={cn(styles.tone, styles.ticket)}>
            <span className={styles.stub}>
              {/* Each time unbroken, so a narrow stub breaks between them, never inside "6:30 PM". */}
              {sittings.map((w, i) => (
                <span key={w.slug} className={styles.time}>
                  {i > 0 ? <span className={styles.timeSep}>&amp; </span> : null}
                  {shortTime(sessionTimeRange(w.startsAt, w.durationMinutes).start)}
                </span>
              ))}
            </span>
            <span className={cn(styles.ticketBody, "text-label font-medium leading-[1.25] text-text")}>
              <span className={styles.tileTitle}>{shortTitle(sittings[0].title)}</span>
            </span>
          </span>
        ))}
        {more > 0 ? <span className="self-start px-1 text-[0.75rem] font-medium text-text/60">+{more} more</span> : null}
      </span>
    </button>
  );
}

/* ==========================================================================
   The agenda
   ========================================================================== */

function Agenda({
  day,
  today,
  renderedAt,
  toneOf,
  onClose,
}: {
  day: CalendarDay;
  today: string;
  renderedAt: number;
  toneOf: (workshop: Workshop) => Tone;
  onClose: () => void;
}) {
  const beside = useBeside();

  return (
    /*
      `data-lenis-prevent` WHILE IT SCROLLS ON ITS OWN. The site's smooth
      scroll (Lenis) takes every wheel event for the page, so without this
      the wheel over the agenda moved the page and never the list — a busy
      day's later sessions were out of reach. Only from `xl`, where the agenda
      is the side panel with its own scroll; everywhere else it is part of
      the page and the page's smoothing should carry on over it.
    */
    <div
      data-lenis-prevent={beside ? "" : undefined}
      className={cn(styles.agendaScroll, "flex flex-col xl:absolute xl:inset-0 xl:overflow-y-auto")}
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-surface/95 px-4 pb-3 pt-5 backdrop-blur-sm sm:px-6 lg:px-8 xl:px-6">
        <div>
          <p className="text-label font-medium uppercase tracking-eyebrow text-text/60">
            {day.key === today ? "Today" : "Chosen day"}
          </p>
          <h4 className="mt-1 text-h4 font-medium text-text">{dayHeading(day.key)}</h4>
        </div>
        {/* Closing is letting the whole month back in — the same as pressing the day again. */}
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${dayHeading(day.key)}`}
          className="press-in inline-flex size-9 shrink-0 items-center justify-center rounded-pill border border-text/20 text-text transition-colors duration-300 ease-soft hover:border-primary hover:text-primary"
        >
          <X aria-hidden strokeWidth={1.75} className="h-4 w-4" />
        </button>
      </div>

      <ul className="flex flex-col gap-3 px-4 pb-6 sm:px-6 lg:px-8 xl:px-6">
        {day.workshops.map((w) => (
          <li key={w.slug}>
            <AgendaItem workshop={w} tone={toneOf(w)} renderedAt={renderedAt} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * One session in the agenda, as a ticket: everything the data holds about it
 * on the face, what is left and the way in on the stub. The title is the
 * link and covers the whole ticket, the way an <EventCard> does; "View
 * event" is the visible affordance.
 */
function AgendaItem({ workshop, tone, renderedAt }: { workshop: Workshop; tone: Tone; renderedAt: number }) {
  const { eventPage } = useModeCopy();
  const passed = useSessionPassed(workshop.startsAt, hasSessionPassed(workshop, renderedAt));
  const { start, end } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);
  const status = passed ? eventPage.passedLabel : spotsLabel(workshop);
  const name = `${workshop.title}, ${formatSessionDate(workshop.startsAt)}, ${start} to ${end}${
    workshop.venue ? ` at ${formatVenueLine(workshop.venue)}` : ""
  }`;

  return (
    /*
      The wrapper carries the tone and the drop-shadow edge: the ticket's
      notches are a mask, and a mask clips the element's own box-shadow, so
      the edge is drawn by a filter on the parent, which follows the bites.
    */
    <div data-tone={tone} className={cn(styles.tone, styles.agendaWrap, passed && "opacity-70")}>
      <article className={cn(styles.agendaTicket, "group relative rounded-md")}>
        <div className="min-w-0 px-5 pb-4 pt-4">
          {workshop.experience ? (
            <p className="text-label font-medium uppercase tracking-eyebrow text-text/65">{workshop.experience.name}</p>
          ) : null}
          <h5 className="mt-1 text-h4 font-medium leading-snug text-text">
            <Link href={workshopHref(workshop)} aria-label={name} className="after:absolute after:inset-0 after:rounded-md">
              {workshop.title}
            </Link>
          </h5>
          <p className="mt-2 text-fine text-text/80">
            <span className="whitespace-nowrap tabular-nums">
              {start}
              <span aria-hidden> &ndash; </span>
              <span className="sr-only"> to </span>
              {end}
            </span>
            <Sep />
            <span className="whitespace-nowrap">{formatDuration(workshop.durationMinutes)}</span>
          </p>
          <p className="mt-0.5 text-fine text-text/80">
            {workshop.venue ? (
              <>
                {workshop.venue.name}
                <Sep />
              </>
            ) : null}
            <span className="whitespace-nowrap">{formatPrice(workshop.price)}</span>
          </p>
        </div>

        {/* The stub: what is left, and the way in. */}
        <div className={cn(styles.agendaStub, "px-5")}>
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
      </article>
    </div>
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

/** A day's sessions as courses: sittings with the same title together, in the order the day first runs them. */
function groupSittings(workshops: Workshop[]): Workshop[][] {
  const byTitle = new Map<string, Workshop[]>();
  for (const w of workshops) {
    const sittings = byTitle.get(w.title);
    if (sittings) sittings.push(w);
    else byTitle.set(w.title, [w]);
  }
  return [...byTitle.values()];
}

/**
 * "Crochet — Beginners" → "Beginners": the course without its experience,
 * which the colour (and the key above the board) already says. A title with
 * no dash is left whole.
 */
function shortTitle(title: string): string {
  const at = title.indexOf(" — ");
  return at === -1 ? title : title.slice(at + 3);
}

/** "11:00 AM" → "11 AM", "6:30 PM" unchanged: a tile holding two times has no room for ":00". */
function shortTime(time: string): string {
  return time.replace(":00", "");
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
