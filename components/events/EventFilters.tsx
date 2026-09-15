"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import { activeFilterCount, type EventFacets, type EventFilters, type Facet } from "@/lib/eventFilters";
import { cn } from "@/lib/utils";

/**
 * The listing's filter bar.
 *
 * Chips rather than dropdowns. With a programme this size every option fits on
 * screen, and showing them costs one interaction less than opening a menu to
 * find out what is on offer — which is the whole question a visitor arrives
 * with. It also keeps the bar reading as type on a page rather than as a
 * control panel bolted to one.
 *
 * A group is drawn only when it has more than one option behind it. A single
 * mall in the catalogue means the location control cannot narrow anything, so
 * it does not appear; the bar grows with the programme instead of standing
 * there half-useful. That is also why nothing here is hard-coded — every chip
 * comes from {@link buildFacets}, so a strand the studio has not scheduled is
 * never offered.
 *
 * Toggle buttons with `aria-pressed`, not a hand-rolled radiogroup. Choosing
 * one option clears the others in its group, so it behaves as single-select,
 * but it is announced as a set of toggles — which needs no roving tabindex and
 * no arrow-key handling to be correct. Each group carries its own accessible
 * name, so the chip is announced as "Painting, toggle button, pressed" under a
 * named group rather than as a loose control.
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
  const [open, setOpen] = useState(false);
  const panelId = useId();

  // Only the groups that can actually narrow something.
  const groups = [
    { key: "month" as const, label: "Date", options: facets.months },
    { key: "category" as const, label: "Type", options: facets.categories },
    { key: "venue" as const, label: "Location", options: facets.venues },
  ].filter((group) => group.options.length > 1);

  if (groups.length === 0) return null;

  return (
    <div className="border-t border-line pt-6 md:pt-7">
      {/*
        On a phone the groups start closed behind this. Expanded, three groups
        of chips stand over 400px tall, which put the first session more than a
        full screen below the masthead — the page would have opened on its own
        controls. Desktop has the width to show them at rest, so the trigger is
        `md:hidden` and the panel is always open from `md` up rather than being
        a disclosure that happens to be expanded.
      */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-[2.75rem] w-full items-center justify-between border border-line px-4 text-label font-medium uppercase tracking-eyebrow text-text md:hidden"
      >
        <span>
          Filter events
          {active > 0 ? <span className="ml-2 text-terracotta">({active})</span> : null}
        </span>
        <ChevronDown
          aria-hidden
          strokeWidth={1.5}
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-300 ease-soft",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        id={panelId}
        className={cn(
          "flex-col gap-5 md:mt-0 md:flex md:gap-6",
          open ? "mt-6 flex" : "hidden",
        )}
      >
        {groups.map((group) => (
          <FilterGroup
            key={group.key}
            label={group.label}
            options={group.options}
            selected={filters[group.key]}
            onSelect={(value) => onChange({ ...filters, [group.key]: value })}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-5 md:mt-7">
        {/*
          The count is the bar's feedback. It is a live region because the only
          other signal that a chip did anything is the list below the fold on a
          phone — a visitor using a screen reader would otherwise press a
          filter and be told nothing at all.
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
    </div>
  );
}

interface FilterGroupProps {
  label: string;
  options: Facet[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

function FilterGroup({ label, options, selected, onSelect }: FilterGroupProps) {
  const groupId = `filter-${label.toLowerCase()}`;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-baseline md:gap-6">
      <p
        id={groupId}
        className="shrink-0 text-label font-medium uppercase tracking-eyebrow text-text/60 md:w-20"
      >
        {label}
      </p>

      <div role="group" aria-labelledby={groupId} className="flex flex-wrap gap-2.5">
        <Chip pressed={selected === null} onClick={() => onSelect(null)}>
          All
        </Chip>

        {options.map((option) => (
          <Chip
            key={option.value}
            pressed={selected === option.value}
            onClick={() => onSelect(selected === option.value ? null : option.value)}
          >
            {option.label}
            <span aria-hidden className="ml-2 tabular-nums opacity-55">
              {option.count}
            </span>
            <span className="sr-only">, {option.count} events</span>
          </Chip>
        ))}
      </div>
    </div>
  );
}

/**
 * Square corners and a hairline, to sit with the rest of the page rather than
 * with a shop. Charcoal fills the selected chip at 11.8:1 against its own ink;
 * an unselected one holds `text/75` on the warm ground, which is 5.49:1.
 */
function Chip({
  children,
  pressed,
  onClick,
}: {
  children: React.ReactNode;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        // The min height is a touch target, not a look: 44px is the smallest
        // comfortable one and these sit close together on a phone.
        "inline-flex min-h-[2.75rem] items-center px-4 text-label font-medium uppercase tracking-eyebrow",
        "border transition-colors duration-300 ease-soft",
        pressed
          ? "border-text bg-text text-surface"
          : "border-line text-text/75 hover:border-text/45 hover:text-text",
      )}
    >
      {children}
    </button>
  );
}
