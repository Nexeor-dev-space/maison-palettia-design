"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { activeFilterCount, type EventFacets, type EventFilters, type Facet } from "@/lib/eventFilters";
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
interface EventFiltersProps {
  facets: EventFacets;
  filters: EventFilters;
  onChange: (next: EventFilters) => void;
  /** How many sessions the current selection leaves, for the live region
      — announced, never shown. */
  resultCount: number;
  totalCount: number;
}

export function EventFilterBar({
  facets,
  filters,
  onChange,
  resultCount,
  totalCount,
}: EventFiltersProps) {
  const active = activeFilterCount(filters);

  // Only the groups that can actually narrow something.
  const groups = [
    { key: "month" as const, label: "Date", options: facets.months },
    { key: "category" as const, label: "Type", options: facets.categories },
    { key: "venue" as const, label: "Location", options: facets.venues },
  ].filter((group) => group.options.length > 1);

  if (groups.length === 0) return null;

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
      {active > 0 ? (
        <div className="order-last flex flex-wrap items-center gap-x-6 gap-y-2 md:order-none">
          <button
            type="button"
            onClick={() => onChange({ month: null, category: null, venue: null })}
            className="group inline-flex items-center gap-2.5 text-label font-medium uppercase tracking-eyebrow text-text"
          >
            <span className="border-b border-terracotta/50 pb-1 transition-colors duration-300 ease-soft group-hover:border-terracotta">
              Clear {active === 1 ? "filter" : "filters"}
            </span>
            <span aria-hidden className="text-terracotta">
              &times;
            </span>
          </button>
        </div>
      ) : null}

      {/*
        The right of the row, and the whole width of a phone. `md:ml-auto`
        holds it there whether or not "Clear filter" is beside it, so pressing
        a filter does not make the controls jump; below `md` the same job is
        done by "Clear filter" taking `order-last` (see above). Two of these
        sit side by side from `sm`; below that a 3.5rem control at half width
        is narrower than the date it has to hold.
      */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:ml-auto md:justify-end">
        {groups.map((group) => (
          <FilterSelect
            key={group.key}
            label={group.label}
            options={group.options}
            selected={filters[group.key]}
            onSelect={(value) => onChange({ ...filters, [group.key]: value })}
          />
        ))}
      </div>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  options: Facet[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

/** "All", plus the facets — the null option is a real row in the list. */
function FilterSelect({ label, options, selected, onSelect }: FilterSelectProps) {
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

  const index = Math.max(0, rows.findIndex((r) => r.value === selected));
  const current = rows[index] ?? rows[0];

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
          "group inline-flex min-h-[3.5rem] w-full items-center justify-between gap-5 rounded-pill px-6 sm:w-auto sm:min-w-[13rem]",
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
          <span id={`${listId}-value`} className="text-action font-medium uppercase tracking-eyebrow">
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
            "plate absolute right-0 top-[calc(100%+0.5rem)] z-30 max-h-[18rem] w-full min-w-[13rem] overflow-y-auto",
            "rounded-md bg-surface p-1.5 focus:outline-none sm:w-max",
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
                  "text-action font-medium uppercase tracking-eyebrow",
                  i === cursor ? "bg-cream text-text" : "text-text/80",
                  chosen && "text-primary",
                )}
              >
                {row.label}
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
