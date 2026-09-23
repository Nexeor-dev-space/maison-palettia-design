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
 * So the groups collapse into one control each, and the row moves to the
 * right of the count rather than sitting on its own line. The page then opens
 * on the programme with its controls beside it, instead of on its controls.
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
  /** How many sessions the current selection leaves, for the live region. */
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

  return (
    <div className="flex flex-col gap-y-6 border-y border-line py-6 md:flex-row md:items-center md:justify-between md:gap-x-8 md:py-7">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {/*
          The count is the bar's feedback. It is a live region because the only
          other signal that a filter did anything is the list below the fold on
          a phone — a visitor using a screen reader would otherwise choose a
          date and be told nothing at all.
        */}
        <p aria-live="polite" className="text-label font-medium uppercase tracking-eyebrow text-text/75">
          {resultCount === totalCount
            ? `${totalCount} ${totalCount === 1 ? "event" : "events"} scheduled`
            : `${resultCount} of ${totalCount} ${totalCount === 1 ? "event" : "events"}`}
        </p>

        {active > 0 ? (
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
        ) : null}
      </div>

      {/*
        Right of the count, and the whole width of a phone. Two of these sit
        side by side from `sm`; below that a 3.5rem control at half width is
        narrower than the date it has to hold.
      */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:justify-end">
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
          selected
            ? "border-text bg-text text-surface"
            : "border-line bg-transparent text-text hover:border-text/45",
        )}
      >
        <span className="flex flex-col items-start gap-0.5 text-left">
          <span
            className={cn(
              "text-[0.625rem] font-semibold uppercase tracking-eyebrow",
              selected ? "text-surface/70" : "text-text/55",
            )}
          >
            {label}
          </span>
          <span id={`${listId}-value`} className="text-action font-semibold uppercase tracking-eyebrow">
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
                  "text-action font-semibold uppercase tracking-eyebrow",
                  i === cursor ? "bg-cream text-text" : "text-text/80",
                  chosen && "text-primary",
                )}
              >
                {row.label}
                {row.count !== null ? (
                  <>
                    <span aria-hidden className="tabular-nums text-text/45">
                      {row.count}
                    </span>
                    <span className="sr-only">, {row.count} events</span>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
