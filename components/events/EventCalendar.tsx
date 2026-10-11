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
    <div className="plate rounded-lg bg-surface p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <h3 id={headingId} className="text-h4 font-medium tracking-[-0.01em] text-text">
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
      <table aria-labelledby={headingId} className="mt-5 w-full table-fixed border-separate border-spacing-1 md:mt-6 md:border-spacing-1.5">
        <thead>
          <tr>
            {WEEKDAYS.map((day) => (
              <th key={day} scope="col" className="pb-2 text-center text-label font-medium uppercase tracking-eyebrow text-text/60">
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
    "relative flex min-h-[3rem] w-full flex-col rounded-md p-1.5 text-left md:min-h-[5.25rem] md:p-2",
    !cell.inMonth && "invisible",
  );

  if (!has) {
    return (
      <div className={shell}>
        <span className={cn("text-label font-medium tabular-nums", passed ? "text-text/35" : "text-text/55", isToday && "text-primary")}>
          {cell.day}
        </span>
      </div>
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
        selected ? "bg-text text-surface" : "bg-cream text-text hover:bg-lavender-soft",
        passed && !selected && "text-text/60",
      )}
    >
      <span className="flex items-center justify-between gap-1">
        <span className={cn("text-label font-medium tabular-nums", isToday && !selected && "text-primary")}>{cell.day}</span>
        <span aria-hidden className="flex items-center gap-0.5">
          {cell.workshops.slice(0, MAX_DOTS).map((w) => (
            <span
              key={w.slug}
              className={cn("block size-1.5 rounded-pill", selected ? "bg-surface" : "bg-primary")}
            />
          ))}
          {count > MAX_DOTS ? <span className="text-[0.625rem] leading-none">+{count - MAX_DOTS}</span> : null}
        </span>
      </span>

      {/* The titles, from `md` — a phone cell has room for the numeral and the dots only. */}
      <span aria-hidden className="mt-1 hidden min-w-0 flex-col gap-0.5 md:flex">
        {cell.workshops.slice(0, MAX_TITLES).map((w) => (
          <span key={w.slug} className="truncate text-[0.6875rem] font-medium leading-[1.3]">
            <span className={cn("tabular-nums", selected ? "text-surface/70" : "text-text/60")}>{formatWorkshopTime(w.startsAt)}</span>{" "}
            {w.title}
          </span>
        ))}
        {count > MAX_TITLES ? (
          <span className={cn("text-[0.6875rem] leading-[1.3]", selected ? "text-surface/70" : "text-text/60")}>
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
