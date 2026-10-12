"use client";

import { CalendarDays, Check, ChevronDown, List, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { pauseScroller, resumeScroller } from "@/lib/scroll";

import { NO_FILTERS, type EventFacets, type EventFilters, type Facet } from "@/lib/eventFilters";
import { cn } from "@/lib/utils";

/**
 * The listing's filter bar.
 *
 * ==========================================================================
 * IT WAS A WALL OF CHIPS AND IT IS A ROW OF SELECTS
 * ==========================================================================
 *
 * The bar used to lay every option out as a toggle chip, one row per group,
 * left-aligned under the lede. The argument for it was that showing the
 * options costs one interaction less than opening a menu — true, and it is
 * still true. What it did not account for is what three groups of chips look
 * like: a paragraph of small grey boxes stacked above the programme, which is
 * the shape of a search tool from 2014 and the first thing on the page after
 * the heading.
 *
 * So the groups collapse into one control each, on the right of the row
 * rather than on a line of their own. The page then opens on the programme
 * with its controls beside it, instead of on its controls.
 *
 * NO COUNT ON SHOW, AT THE CLIENT'S ASK. The left of the row said "2 events
 * scheduled", and each option in the menus carried its tally. The client's
 * rule from the homepage (PDF p05: don't print a number that "can change in
 * the future") applies site-wide, so neither is drawn. Both survive for a
 * screen reader only, because there they are the feedback rather than the
 * copy — see the live region below.
 *
 * WHY NOT A NATIVE `<select>`, since that is what this is. Because the menu a
 * native select opens is drawn by the operating system, in the operating
 * system's type, at the operating system's size — the one element on the page
 * that cannot be made to look like the rest of it. This is the listbox
 * pattern instead: a button that says what is chosen, a panel of options, and
 * the keyboard behaviour a select has (arrows to move, Enter to choose, Escape
 * to close, Home and End to jump), so nothing is lost by drawing it here.
 */
/** The two ways the listing can be read — see <EventsBrowser>. */
export type ListingView = "list" | "calendar";

interface EventFiltersProps {
  facets: EventFacets;
  filters: EventFilters;
  onChange: (next: EventFilters) => void;
  /** How many sessions the current selection leaves, for the live region
      — announced, never shown. */
  resultCount: number;
  totalCount: number;
  /** Which reading the visitor has chosen; the toggle is drawn only when
      a handler is given. */
  view?: ListingView;
  onViewChange?: (view: ListingView) => void;
}

export function EventFilterBar({
  facets,
  filters,
  onChange,
  resultCount,
  totalCount,
  view = "list",
  onViewChange,
}: EventFiltersProps) {
  /*
    Only the groups that can actually narrow something.

    THE DATE SELECT STAYS IN THE CALENDAR, at the client's ask — it used to
    stand down there, on the grounds that the grid was the date control. It
    is the same control in both readings now: in the calendar, picking a
    month moves the grid to it, and a day pressed on the grid shows on the
    select as that day. <EventsBrowser> keeps the two in step, so they can
    never disagree about which date is chosen.

    DATE, EVENT, THEME, VIBE, LOCATION. "Type" (the free-text strand) is gone
    from this row: every scheduled session is filed under one strand, so it
    never drew, and the question it stood in for is answered by Event. THEME
    is the client's Oct 2026 formats — a candle theme, a crochet level — read
    off the sessions' workshop types, which is the choice the brief has a
    customer make first. Vibe reads
    the experiences' tags and draws itself only once two of them are in use
    — the same rule "Find your vibe" follows, for the same reason: a mood
    nobody has tagged is not a choice.
  */
  const groups = [
    { key: "month" as const, label: "Date", options: facets.months },
    { key: "event" as const, label: "Event", options: facets.events },
    { key: "type" as const, label: "Theme", options: facets.types },
    { key: "vibe" as const, label: "Vibe", options: facets.vibes },
    { key: "venue" as const, label: "Location", options: facets.venues },
  ].filter((group) => group.options.length > 1);

  if (groups.length === 0 && !onViewChange) return null;

  /*
    The chips: every filter that is set, with the label its option carries.
    A day chosen on the calendar is not one of the Date select's options (it
    offers months), so it is spelled out from its key.
  */
  const chips = (["month", "event", "type", "vibe", "venue"] as const)
    .filter((key) => filters[key])
    .map((key) => {
      const value = filters[key] as string;
      const facet = FACET_OF[key];
      const found = facets[facet].find((option) => option.value === value)?.label;
      return { key, label: CHIP_LABEL[key], value: found ?? (key === "month" && value.length > 7 ? dayChip(value) : value) };
    });

  /*
    `border-b`, not `border-y` — the rule above this bar is gone at the
    client's ask. It sat directly under the group's own lede, which already
    ends where it ends, so it was drawing a line under something that did not
    need underlining. The one BELOW stays: it is the edge between the controls
    and the results they filter, which is a measure beginning, and that is the
    only thing a rule on this site is for (see globals.css).
  */
  return (
    <div className="relative flex flex-col gap-y-6 border-b border-line py-6 md:flex-row md:items-center md:justify-between md:gap-x-8 md:py-7">
      {/*
        The count is the bar's feedback for a screen reader, and only for one.
        It is a live region because the only other signal that a filter did
        anything is the list below the fold on a phone — a visitor using a
        screen reader would otherwise choose a date and be told nothing at all.

        `sr-only` since the client's no-counts rule (see the note above). It
        is absolutely positioned, so it is out of the flex flow and adds no
        gap; that is also why the bar is `relative`.
      */}
      <p aria-live="polite" className="sr-only">
        {resultCount === totalCount
          ? `${totalCount} ${totalCount === 1 ? "event" : "events"} scheduled`
          : `${resultCount} of ${totalCount} ${totalCount === 1 ? "event" : "events"}`}
      </p>

      {/*
        Only while a filter is on. An empty wrapper here would be a zero-
        height flex item, and on a phone the column's `gap-y-6` would still
        put 24px of nothing above the controls.

        `order-last` BELOW `md`, BECAUSE APPEARING MUST NOT MOVE ANYTHING.
        On a phone the bar is a column, and with this first in it, choosing a
        date put a new 24px row (and its 24px gap) above the controls and
        pushed the Date button down 47px under the thumb that had just pressed
        it — measured at 360; clearing it pulled it back. When the count line
        held that top row the controls never moved, and the count is gone. So
        below `md` the row arrives under the controls instead, where the only
        thing it moves is the list it is about to change anyway. From `md` the
        bar is a row and `md:order-none` puts it back on the left, where
        `md:ml-auto` on the controls already keeps them still. The DOM order
        is the desktop one, so the tab order matches the row a keyboard user
        is most likely to be looking at.
      */}
      {/*
        WHAT IS ON, AND THE WAY TO TAKE EACH ONE OFF. It was a single "Clear
        filters" link, which said that something was narrowing the list but
        not what — the value was only on the button that set it, half a row
        away. Each active filter is now a chip naming the filter and its
        value, and pressing it lifts that one alone; "Clear all" joins them
        once there are two to clear.
      */}
      {chips.length > 0 ? (
        <div className="order-last -mx-gutter flex items-center gap-2 overflow-x-auto px-gutter pb-1 [scrollbar-width:none] md:order-none md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onChange({ ...filters, [chip.key]: null })}
              aria-label={`Remove filter: ${chip.label}, ${chip.value}`}
              className="press-in group inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-pill bg-text py-1.5 pe-3 ps-4 text-left text-label text-surface transition-colors duration-300 ease-soft hover:bg-text/85"
            >
              <span className="font-medium uppercase tracking-eyebrow text-surface/65">{chip.label}</span>
              <span className="font-medium">{chip.value}</span>
              <X aria-hidden strokeWidth={2} className="h-3.5 w-3.5 shrink-0 text-surface/80 group-hover:text-surface" />
            </button>
          ))}
          {chips.length > 1 ? (
            <button
              type="button"
              onClick={() => onChange(NO_FILTERS)}
              className="press-in ms-1 inline-flex min-h-10 shrink-0 items-center whitespace-nowrap text-label font-medium uppercase tracking-eyebrow text-text underline decoration-terracotta/60 underline-offset-4 hover:decoration-terracotta"
            >
              Clear all
            </button>
          ) : null}
        </div>
      ) : null}

      {/*
        The right of the row, and the whole width of a phone. `md:ml-auto`
        holds it there whether or not the chips are beside it, so pressing
        a filter does not make the controls jump; below `md` the same job is
        done by the chips taking `order-last` (see above). Two of these
        sit side by side from `sm`; below that a 3.5rem control at half width
        is narrower than the date it has to hold.
      */}
      {/*
        ==================================================================
        THE PHONE'S BAR: ONE ROW, AND THE FILTERS IN A SHEET
        ==================================================================

        On a phone the bar used to stack the view switch and every filter as
        a 3.5rem pill — about 400px of controls before the first card or the
        calendar, which on a 390 screen is half of it, and the client found it
        hard to use. Below `md` it is one row now: the view switch and a
        "Filters" button (with how many are on), and the choosing happens in a
        bottom sheet where every option is a tap rather than a dropdown inside
        a dropdown. What is on still shows underneath as removable chips.
      */}
      <div className="flex items-center gap-2.5 md:hidden">
        {onViewChange ? <ViewToggle view={view} onChange={onViewChange} compact /> : null}
        {groups.length > 0 ? (
          <MobileFilters
            groups={groups}
            filters={filters}
            onChange={onChange}
            activeCount={chips.length}
          />
        ) : null}
      </div>

      <div className="hidden gap-3 md:ml-auto md:flex md:flex-row md:flex-wrap md:items-center md:justify-end">
        {onViewChange ? <ViewToggle view={view} onChange={onViewChange} /> : null}
        {/*
          Two to a row on a phone from 400px, one below — a filter's value
          can be "Crochet — Returning Learners", and half of a 320px screen is
          narrower than that. An odd one out takes the whole row rather than
          leaving a hole beside it.
        */}
        {groups.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:flex sm:flex-wrap sm:items-center [&>*:last-child:nth-child(odd)]:col-span-full">
            {groups.map((group) => {
              const selected = filters[group.key];
              return (
                <FilterSelect
                  key={group.key}
                  label={group.label}
                  options={group.options}
                  selected={selected}
                  /* A day pressed on the calendar is not one of the select's
                     months; the button names the day itself. */
                  fallbackLabel={group.key === "month" && selected && selected.length > 7 ? dayChip(selected) : undefined}
                  onSelect={(value) => onChange({ ...filters, [group.key]: value })}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const CHIP_LABEL = { month: "Date", event: "Event", type: "Theme", vibe: "Vibe", venue: "Location" } as const;
const FACET_OF = { month: "months", event: "events", type: "types", vibe: "vibes", venue: "venues" } as const;

/** "Sat 21 Nov" for a day key — a day chosen on the calendar, as its chip says it. */
function dayChip(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d, 12)),
  );
}

/**
 * List or calendar — the same programme, two readings.
 *
 * A segmented control: two pressed-state buttons on one light track, both
 * always visible, each with its icon as well as its word. The chosen half is
 * filled Deep Lilac — the brand's colour for the thing that is on — and the
 * other is plain ink on the track, so which reading is showing is never a
 * matter of comparing two shades. `aria-pressed` says it to a screen reader.
 *
 * It was Charcoal Slate inside a lilac hairline, which put the chosen state
 * in the same colour as a chosen filter beside it: two different kinds of
 * "on" that looked alike. Now a chosen filter is Charcoal and a chosen view
 * is Lilac, and the two read apart.
 */
function ViewToggle({
  view,
  onChange,
  compact = false,
}: {
  view: ListingView;
  onChange: (view: ListingView) => void;
  /** The phone's one-row bar: shorter, and it shares the row with "Filters". */
  compact?: boolean;
}) {
  const options: { value: ListingView; label: string; Icon: typeof List }[] = [
    { value: "list", label: "List", Icon: List },
    { value: "calendar", label: "Calendar", Icon: CalendarDays },
  ];
  return (
    <div
      role="group"
      aria-label="View as"
      className={cn(
        "inline-flex gap-1 rounded-pill border border-text/15 bg-surface p-1",
        compact ? "min-h-12 min-w-0 flex-1" : "min-h-[3.5rem] w-full sm:w-auto",
      )}
    >
      {options.map(({ value, label, Icon }) => {
        const on = value === view;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(value)}
            className={cn(
              "press-in inline-flex flex-1 items-center justify-center gap-2 rounded-pill text-action font-medium uppercase tracking-eyebrow transition-colors duration-300 ease-soft",
              compact ? "px-2 tracking-[0.1em]" : "px-5 sm:flex-none",
              on ? "bg-primary text-on-primary shadow-[0_4px_12px_-6px_var(--color-brand-lilac)]" : "text-text hover:bg-cream",
            )}
          >
            {/* The phone's row is shared with "Filters": the words carry it there. */}
            <Icon aria-hidden strokeWidth={1.75} className={cn("h-4 w-4 shrink-0", compact && "hidden min-[420px]:block")} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

interface FilterGroup {
  key: "month" | "event" | "type" | "vibe" | "venue";
  label: string;
  options: Facet[];
}

/**
 * The phone's filters: a button that opens a bottom sheet.
 *
 * Every option is a chip to tap — no listbox inside the sheet, because a
 * dropdown opened inside a scrolling sheet on a phone is two layers of
 * scrolling and a panel that can open off the bottom of the screen. A change
 * applies at once (the list behind updates under the sheet), and "Show
 * results" closes it. Portalled to <body> so it sits over the bottom
 * navigation (z-40) rather than under it; Escape, the scrim and the close
 * button all dismiss it, and focus goes back to the button.
 */
function MobileFilters({
  groups,
  filters,
  onChange,
  activeCount,
}: {
  groups: FilterGroup[];
  filters: EventFilters;
  onChange: (next: EventFilters) => void;
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    pauseScroller();
    sheetRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.removeProperty("overflow");
      resumeScroller();
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          "press-in inline-flex min-h-12 shrink-0 items-center gap-2 rounded-pill px-4 text-action font-medium uppercase tracking-[0.1em] transition-colors duration-300 ease-soft",
          activeCount > 0 ? "bg-text text-surface" : "bg-primary text-on-primary",
        )}
      >
        <SlidersHorizontal aria-hidden strokeWidth={1.75} className="h-4 w-4" />
        Filters
        {activeCount > 0 ? (
          <span className="grid size-5 place-items-center rounded-pill bg-surface text-[0.75rem] font-semibold tracking-normal text-text">
            {activeCount}
            <span className="sr-only"> on</span>
          </span>
        ) : null}
      </button>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-[60] flex flex-col justify-end md:hidden">
              <button type="button" aria-label="Close filters" onClick={close} className="absolute inset-0 bg-text/45" />
              <div
                ref={sheetRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                data-lenis-prevent
                className="relative flex max-h-[85svh] flex-col rounded-t-[1.5rem] bg-surface text-text focus:outline-none"
              >
                <div className="flex items-center justify-between gap-4 border-b border-text/10 px-5 pb-3 pt-4">
                  <h2 id={titleId} className="text-h4 font-medium">
                    Filters
                  </h2>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="press-in grid size-11 place-items-center rounded-pill bg-cream text-text"
                  >
                    <X aria-hidden strokeWidth={2} className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
                  {groups.map((group) => {
                    const selected = filters[group.key];
                    const known = group.options.some((o) => o.value === selected);
                    const rows: { value: string | null; label: string }[] = [
                      { value: null, label: "All" },
                      // A day pressed on the calendar is not one of the months on offer.
                      ...(selected && !known ? [{ value: selected, label: selected.length > 7 ? dayChip(selected) : selected }] : []),
                      ...group.options.map((o) => ({ value: o.value, label: o.label })),
                    ];
                    return (
                      <fieldset key={group.key} className="mb-6 last:mb-1">
                        <legend className="text-label font-medium uppercase tracking-eyebrow text-text/70">{group.label}</legend>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {rows.map((row) => {
                            const on = row.value === selected;
                            return (
                              <button
                                key={row.value ?? "all"}
                                type="button"
                                aria-pressed={on}
                                onClick={() => onChange({ ...filters, [group.key]: row.value })}
                                className={cn(
                                  "press-in inline-flex min-h-11 items-center gap-1.5 rounded-pill px-4 text-[0.9375rem] font-medium transition-colors duration-200 ease-soft",
                                  on ? "bg-primary text-on-primary" : "bg-cream text-text",
                                )}
                              >
                                {on ? <Check aria-hidden strokeWidth={2.25} className="h-4 w-4" /> : null}
                                {row.label}
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 border-t border-text/10 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                  {activeCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => onChange(NO_FILTERS)}
                      className="press-in min-h-12 px-2 text-label font-medium uppercase tracking-eyebrow text-text underline decoration-terracotta/60 underline-offset-4"
                    >
                      Clear all
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={close}
                    className="press-in ms-auto min-h-12 flex-1 rounded-pill bg-primary px-6 text-action font-medium uppercase tracking-eyebrow text-on-primary"
                  >
                    Show results
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

interface FilterSelectProps {
  label: string;
  options: Facet[];
  selected: string | null;
  /** What the button says when `selected` is not one of the options. */
  fallbackLabel?: string;
  onSelect: (value: string | null) => void;
}

/** "All", plus the facets — the null option is a real row in the list. */
function FilterSelect({ label, options, selected, fallbackLabel, onSelect }: FilterSelectProps) {
  const rows: { value: string | null; label: string; count: number | null }[] = [
    { value: null, label: "All", count: null },
    ...options.map((o) => ({ value: o.value, label: o.label, count: o.count })),
  ];

  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const labelId = useId();

  const found = rows.findIndex((r) => r.value === selected);
  const index = Math.max(0, found);
  const current = found === -1 && selected ? { value: selected, label: fallbackLabel ?? selected, count: null } : rows[index];

  /* Opening starts on what is chosen, not at the top of the list. */
  const show = () => {
    setCursor(index);
    setOpen(true);
  };

  const close = (focusButton = true) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  };

  const choose = (value: string | null) => {
    onSelect(value);
    close();
  };

  /* The panel takes focus when it opens, so the arrows reach the options. */
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  /*
    A click anywhere else closes it. `pointerdown` rather than `click` so the
    panel is gone before the thing under the pointer reacts, and no focus is
    taken back — the visitor is already on their way somewhere else.
  */
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const onListKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setCursor((c) => Math.min(rows.length - 1, c + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
        break;
      case "Home":
        event.preventDefault();
        setCursor(0);
        break;
      case "End":
        event.preventDefault();
        setCursor(rows.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(rows[cursor].value);
        break;
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <span id={labelId} className="sr-only">
        {label}
      </span>

      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={`${labelId} ${listId}-value`}
        onClick={() => (open ? close(false) : show())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            show();
          }
        }}
        className={cn(
          /*
            3.5rem, which is the size the client asked for and also the height
            the site's filled actions stand at — the bar then reads as part of
            the page's own furniture rather than as a smaller class of control.
          */
          "group inline-flex min-h-[3.5rem] w-full items-center justify-between gap-4 rounded-pill px-6 py-2 sm:w-auto sm:min-w-[13rem] sm:max-w-[18rem]",
          "border transition-colors duration-300 ease-soft",
          /*
            FILLED IN BOTH STATES, at the client's ask — "it is not visible
            now". At rest this was a hairline in `--color-line` on transparent,
            which on the events page's White Rock ground is a control you have
            to look for: the client could not see the one thing on the row that
            does anything.

            Deep Lilac at rest, which is the colour they named, with
            `--color-on-primary` on it — the one light ink that clears that
            ground at 4.90:1 where plain White Rock is 3.95 and fails what a
            12px label owes. A CHOSEN filter deepens to Charcoal Slate, so the
            two states still differ by more than a word: the control is always
            visible, and whether it is filtering anything is still legible at a
            glance.
          */
          selected
            ? "border-text bg-text text-surface hover:bg-text/90"
            : "border-primary bg-primary text-on-primary hover:bg-text hover:border-text",
        )}
      >
        <span className="flex flex-col items-start gap-0.5 text-left">
          <span
            className={cn(
              "text-label font-medium uppercase tracking-eyebrow",
              /*
                FULL STRENGTH ON THE LILAC, AND THAT IS MEASURED. The other
                state can afford to hold its label back — White Rock at 70% on
                Charcoal Slate is 6.32:1 — but Deep Lilac has no headroom:
                `--color-on-primary` is 4.89:1 on it at full strength, and this
                label is 12px, which owes 4.5. At 75% it measures 3.51 and even
                90% only reaches 4.31, so any softening at all fails.

                The hierarchy between the label and the value below it is
                carried by size and tracking instead, which costs no contrast.
              */
              selected ? "text-surface/70" : "text-on-primary",
            )}
          >
            {label}
          </span>
          {/*
            THE VALUE IN SENTENCE CASE. It was tracked capitals like the
            label above it, which is fine for "All" and "October 2026" and
            not for "CROCHET — RETURNING LEARNERS": a long name in spaced
            capitals is the hardest way to set it, and the button grew wide
            enough to push its neighbours onto a new row. The label keeps the
            capitals, so the two still read as a label and its value.
          */}
          <span id={`${listId}-value`} className="text-[0.9375rem] font-medium leading-snug">
            {current.label}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          strokeWidth={1.75}
          className={cn("h-4 w-4 shrink-0 transition-transform duration-300 ease-soft", open && "rotate-180")}
        />
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelId}
          aria-activedescendant={`${listId}-${cursor}`}
          onKeyDown={onListKeyDown}
          className={cn(
            /*
              The panel is the button's own width on a phone, where the
              buttons sit two to a row and a wider panel anchored to one edge
              would run off the other side of the screen; from `sm` it may
              grow to fit its longest option.
            */
            "plate absolute right-0 top-[calc(100%+0.5rem)] z-30 max-h-[18rem] w-full overflow-y-auto",
            "rounded-md bg-surface p-1.5 focus:outline-none sm:w-max sm:min-w-[13rem] sm:max-w-[22rem]",
          )}
        >
          {rows.map((row, i) => {
            const chosen = row.value === selected;
            return (
              <li
                key={row.value ?? "all"}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={chosen}
                onPointerDown={(event) => {
                  event.preventDefault();
                  choose(row.value);
                }}
                onPointerEnter={() => setCursor(i)}
                className={cn(
                  "flex cursor-none items-center justify-between gap-6 rounded-sm px-4 py-3",
                  "text-[0.9375rem] font-medium leading-snug",
                  i === cursor ? "bg-cream text-text" : "text-text/80",
                  chosen && "text-primary",
                )}
              >
                {row.label}
                {/* The chosen option is ticked as well as coloured, so it is not told by colour alone. */}
                {chosen ? <Check aria-hidden strokeWidth={2} className="h-4 w-4 shrink-0" /> : null}
                {/* The option's tally, for a screen reader only — the client's
                    no-counts rule; see the note at the head of this file. */}
                {row.count !== null ? (
                  <span className="sr-only">
                    , {row.count} {row.count === 1 ? "event" : "events"}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
