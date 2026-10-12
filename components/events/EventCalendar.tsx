"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

import {
  buildCalendar,
  dayKey,
  shiftMonthKey,
  type CalendarDay,
  WEEKDAYS,
} from "@/lib/eventFilters";
import { cn } from "@/lib/utils";
import { formatWorkshopTime } from "@/lib/workshopHelpers";
import type { Workshop } from "@/types";

/**
 * The programme as a month — the second way of reading the schedule.
 *
 * ==========================================================================
 * A DATE PICKER OVER THE SAME LIST, NOT A SECOND LISTING
 * ==========================================================================
 *
 * The cards below the filter bar are the listing; this grid narrows them. A
 * day with sessions is a button, and pressing it hands its `dayKey` up to
 * <EventsBrowser>, which puts it in the same `month` filter the Date select
 * writes to — so the cards under the grid are exactly the ones that select
 * would have shown. Pressing the day again lets the whole month back in.
 * Nothing here links to an event: the card is where a session is opened,
 * and a grid cell that navigated would put every date in the tab order
 * twice.
 *
 * WHAT A CELL SAYS. The numeral, and one dot per session (three at most —
 * the fourth and after are "+n" for a screen reader, since a mall programme
 * runs a few dates a day at the very most). From `md` the first two titles
 * are printed under the numeral, which is the glance a calendar is for. A
 * day with nothing on is not a control: it is a numeral at reduced strength,
 * and it is not in the tab order, because a button that does nothing is a
 * trap for a keyboard. A date that has gone by keeps its sessions (the card
 * says "Date passed") but is set quieter, like the card's own chip.
 *
 * ONE CLOCK. `renderedAt` decides which days have gone by and which is today,
 * the same number every <EventCard> hydrates against. This is a client
 * component and must not read Date.now() while rendering.
 *
 * MONDAY FIRST, Dubai dates. The grid comes from `buildCalendar`, which
 * places sessions by the studio's own day key; the weekday headings are the
 * UAE's working week.
 */
export function EventCalendar({
  workshops,
  month,
  onMonthChange,
  selectedDay,
  onSelectDay,
  canGoBack,
  canGoForward,
  renderedAt,
}: {
  /** The sessions to place — already narrowed by type and location. */
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
}) {
  const grid = useMemo(() => buildCalendar(workshops, month), [workshops, month]);
  const today = useMemo(() => dayKey(new Date(renderedAt).toISOString()), [renderedAt]);
  const headingId = `calendar-${month}`;

  return (
    <div className="plate overflow-hidden rounded-lg bg-surface">
      {/*
        A HEADER BAND, so the month is a title and not a line of text resting
        on the grid. Light Sage under it separates the controls from the days
        the way the reference boards do, and it is the same sage the format
        tickets now wear, so the two objects on this page belong together.
      */}
      <div className="flex items-center justify-between gap-4 bg-sage px-4 py-4 md:px-6 md:py-5">
        <h3 id={headingId} className="text-h3 font-light text-text">
          {grid.label}
        </h3>
        <div className="flex items-center gap-2">
          <NavButton
            label="Previous month"
            disabled={!canGoBack}
            onClick={() => onMonthChange(shiftMonthKey(month, -1))}
          >
            <ChevronLeft aria-hidden strokeWidth={1.75} className="h-4 w-4" />
          </NavButton>
          <NavButton
            label="Next month"
            disabled={!canGoForward}
            onClick={() => onMonthChange(shiftMonthKey(month, 1))}
          >
            <ChevronRight aria-hidden strokeWidth={1.75} className="h-4 w-4" />
          </NavButton>
        </div>
      </div>

      {/*
        A REAL TABLE, NOT AN ARIA GRID. `role="grid"` promises arrow-key
        movement between cells, which this does not implement — each day
        with sessions is an ordinary button in the tab order. A `<table>`
        gives a screen reader the row and column of every cell (the weekday
        and the week) without that promise, and needs no `display: contents`
        wrapper, which some browsers drop from the accessibility tree.
      */}
      <table aria-labelledby={headingId} className="w-full table-fixed border-separate border-spacing-1 p-3 md:border-spacing-1.5 md:p-4">
        <thead>
          <tr>
            {WEEKDAYS.map((day) => (
              <th key={day} scope="col" className="pb-2.5 text-center text-label font-medium uppercase tracking-eyebrow text-text/60">
                {/* The full weekday for a screen reader; three letters for the eye. */}
                <span aria-hidden>{day}</span>
                <span className="sr-only">{FULL_WEEKDAY[day]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.weeks.map((week, w) => (
            <tr key={w}>
              {week.map((cell) => (
                <td key={cell.key} className="p-0 align-top">
                  <DayCell
                    cell={cell}
                    selected={cell.key === selectedDay}
                    isToday={cell.key === today}
                    passed={cell.key < today}
                    onSelect={() => onSelectDay(selectedDay === cell.key ? null : cell.key)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const FULL_WEEKDAY: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

/*
  ==========================================================================
  A GROUND PER FORMAT — what turns a column of truncated text into a board
  ==========================================================================

  Every session printed in a cell was the same grey line, so a month of
  "Crochet — Beginners" and "The Cheesecake Collection" read as one wall of
  words and the only way to tell two dates apart was to read them. The
  reference boards the client sent all do the same thing instead: each kind
  of thing gets a colour, and the shape of the month becomes legible before
  a single word is.

  The key is the FORMAT, not the session, so every Tuesday of one course is
  the same colour all the way down the month. Hashed rather than assigned,
  because the formats come from the CMS and this file must not hold a list
  of them — a new format gets a colour without anyone editing this.

  All four take Charcoal well past AA, and the chips carry their time and
  title as text, so the colour is never the only thing saying what a day
  holds.
*/
const CHIP_GROUND = ["bg-lavender-soft", "bg-sage", "bg-terracotta/25", "bg-cream"] as const;

function chipGround(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return CHIP_GROUND[h % CHIP_GROUND.length];
}

const MAX_DOTS = 3;
const MAX_TITLES = 2;

function DayCell({
  cell,
  selected,
  isToday,
  passed,
  onSelect,
}: {
  cell: CalendarDay;
  selected: boolean;
  isToday: boolean;
  passed: boolean;
  onSelect: () => void;
}) {
  const count = cell.workshops.length;
  const has = count > 0 && cell.inMonth;

  /*
    The cell's whole story for a screen reader, since the dots and the
    truncated titles are for the eye: the date, how many sessions, and each
    one's name and start time.
  */
  const label = has
    ? `${longDate(cell.key)}, ${count} ${count === 1 ? "event" : "events"}: ${cell.workshops
        .map((w) => `${w.title} at ${formatWorkshopTime(w.startsAt)}`)
        .join(", ")}`
    : undefined;

  const shell = cn(
    "relative flex min-h-[3.25rem] w-full flex-col rounded-[0.75rem] p-1.5 text-left md:min-h-[6.5rem] md:p-2",
    !cell.inMonth && "invisible",
  );

  /* The numeral. Today wears a filled Deep Lilac disc rather than coloured
     type — the one mark on the board that has to be findable at a glance,
     and the reference boards all give it a disc. */
  const numeral = (
    <span
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-pill text-label font-medium tabular-nums",
        isToday && !selected && "bg-primary text-on-primary",
        isToday && selected && "bg-surface text-text",
        !isToday && (selected ? "text-surface" : passed ? "text-text/40" : "text-text/70"),
      )}
    >
      {cell.day}
    </span>
  );

  if (!has) {
    /* A day with nothing on is still part of the month, so it keeps a faint
       ground: without one the grid was numerals floating in space and the
       weeks did not read as rows. Not a button and not in the tab order —
       there is nothing to press. */
    return (
      <div className={cn(shell, cell.inMonth && "bg-cream/40")}>{numeral}</div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={label}
      className={cn(
        shell,
        "press-in transition-colors duration-300 ease-soft",
        /*
          Chosen: Charcoal Slate, the same deepening a chosen filter takes
          (see <FilterSelect>). At rest: White Rock, the plate's own ground
          lifted one step, so a day with something on reads as an object
          on the grid before it is read as a number.
        */
        selected ? "bg-text" : "bg-cream/80 hover:bg-lavender-soft",
        /* A ring, not a fill, for a day that has gone by: it keeps its
           sessions and its colour but stops competing with the ones ahead. */
        passed && !selected && "opacity-60",
      )}
    >
      <span className="flex items-center justify-between gap-1">
        {numeral}
        {/* The dots are the PHONE's reading of the same thing the chips say
            below, so they stand down once the chips are drawn. */}
        <span aria-hidden className="flex items-center gap-0.5 md:hidden">
          {cell.workshops.slice(0, MAX_DOTS).map((w) => (
            <span key={w.slug} className={cn("block size-1.5 rounded-pill", selected ? "bg-surface" : "bg-primary")} />
          ))}
          {count > MAX_DOTS ? (
            <span className={cn("text-label leading-none", selected ? "text-surface" : "text-text/70")}>+{count - MAX_DOTS}</span>
          ) : null}
        </span>
      </span>

      {/*
        THE SESSIONS AS CHIPS, from `md`. Each one is its format's colour
        (see CHIP_GROUND) with the time set in tabular figures ahead of the
        name, so a column of Tuesdays lines up and the eye can run down it.
        A phone keeps the dots above: there is no room for a chip, and the
        card list under the grid is the phone's real reading of the day.
      */}
      <span aria-hidden className="mt-1.5 hidden min-w-0 flex-col gap-1 md:flex">
        {cell.workshops.slice(0, MAX_TITLES).map((w) => (
          <span
            key={w.slug}
            className={cn(
              "truncate rounded-[0.4rem] px-1.5 py-1 text-label font-medium leading-[1.25] text-text",
              chipGround(w.workshopType?.slug ?? w.title),
            )}
          >
            <span className="tabular-nums text-text/70">{formatWorkshopTime(w.startsAt)}</span> {w.title}
          </span>
        ))}
        {count > MAX_TITLES ? (
          <span className={cn("px-1.5 text-label leading-[1.25]", selected ? "text-surface/75" : "text-text/60")}>
            +{count - MAX_TITLES} more
          </span>
        ) : null}
      </span>
    </button>
  );
}

/** "Saturday 3 October 2026" for a day key, for the cell's label. */
function longDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d, 12)));
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
          ? "cursor-default border-line text-text/35"
          : "border-primary bg-primary text-on-primary hover:border-text hover:bg-text",
      )}
    >
      {children}
    </button>
  );
}
