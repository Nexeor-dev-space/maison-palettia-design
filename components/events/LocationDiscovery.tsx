import { MapPin } from "lucide-react";

import type { EventFilters } from "@/lib/eventFilters";
import { formatSessionDate, sessionDateParts } from "@/lib/workshops";
import { cn } from "@/lib/utils";
import type { Workshop } from "@/types";

/**
 * Where the studio sets up — the listing's location discovery area.
 *
 * A LIST, NOT A MAP, and that is a data limitation rather than a preference.
 * {@link Venue} carries a name and a locality and nothing else: there are no
 * coordinates anywhere in this project, no map library in package.json, no map
 * configuration and no keys. Drawing pins would mean inventing positions for
 * real malls, which is worse than not drawing them — a visitor navigating by a
 * wrong pin is worse off than one reading a correct address. See the note in
 * the Phase 4 report for what a real map needs.
 *
 * It reads the same catalogue the listing does and writes to the same filter
 * state, so this is a second way into one filter rather than a second
 * filtering system. Choosing a mall here moves the chip in the bar above, and
 * clearing it there clears it here.
 *
 * Each entry carries the count and the next date at that mall, both derived —
 * nothing is stored per venue, so a mall the studio stops running at simply
 * stops appearing.
 */
interface LocationDiscoveryProps {
  /** The whole catalogue, so counts describe the programme, not the filtered view. */
  workshops: Workshop[];
  filters: EventFilters;
  onSelect: (venue: string | null) => void;
}

interface LocationSummary {
  name: string;
  locality: string;
  count: number;
  /** The soonest session at this mall; the catalogue is already date-sorted. */
  next: Workshop;
}

function summarise(workshops: Workshop[]): LocationSummary[] {
  const byVenue = new Map<string, LocationSummary>();

  for (const workshop of workshops) {
    if (!workshop.venue) continue;
    const existing = byVenue.get(workshop.venue.name);
    if (existing) existing.count += 1;
    else
      byVenue.set(workshop.venue.name, {
        name: workshop.venue.name,
        locality: workshop.venue.locality,
        count: 1,
        next: workshop,
      });
  }

  return [...byVenue.values()];
}

export function LocationDiscovery({ workshops, filters, onSelect }: LocationDiscoveryProps) {
  const locations = summarise(workshops);
  if (locations.length === 0) return null;

  return (
    <section
      aria-labelledby="locations-heading"
      className="mt-24 border-t border-line pt-12 md:mt-32 md:pt-16"
    >
      <div className="grid grid-cols-12 items-end gap-x-6 lg:gap-x-10">
        <div className="col-span-12 md:col-span-6">
          <p className="flex items-center gap-4 text-label font-medium uppercase tracking-eyebrow text-text">
            <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
            Where we set up
          </p>
          <h2
            id="locations-heading"
            className="mt-6 text-[1.75rem] font-light uppercase leading-[1.05] tracking-[-0.02em] md:text-[2.25rem]"
          >
            {locations.length} {locations.length === 1 ? "location" : "locations"}
          </h2>
        </div>

        <p className="col-span-12 mt-6 max-w-[26rem] text-body leading-[1.85] text-text/80 md:col-span-5 md:col-start-8 md:mt-0">
          The studio travels. Each date runs at a mall for that day only — pick a
          location to see what is on there.
        </p>
      </div>

      <ul className="mt-12 grid grid-cols-12 gap-x-6 gap-y-4 md:mt-16 lg:gap-x-10">
        {locations.map((location) => {
          const selected = filters.venue === location.name;
          const { weekday } = sessionDateParts(location.next.startsAt);

          return (
            <li key={location.name} className="col-span-12 md:col-span-6 lg:col-span-4">
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(selected ? null : location.name)}
                className={cn(
                  "flex w-full items-start gap-4 border p-5 text-left transition-colors duration-300 ease-soft md:p-6",
                  selected
                    ? "border-text bg-text/[0.04]"
                    : "border-line hover:border-text/45",
                )}
              >
                <MapPin
                  aria-hidden
                  strokeWidth={1.5}
                  className={cn(
                    "mt-0.5 h-5 w-5 shrink-0 transition-colors duration-300 ease-soft",
                    selected ? "text-terracotta" : "text-text/45",
                  )}
                />

                <span className="min-w-0 flex-1">
                  <span className="block text-body font-medium leading-snug text-text">
                    {location.name}
                  </span>
                  <span className="mt-1 block text-fine text-text/75">{location.locality}</span>

                  <span className="mt-4 block text-label font-medium uppercase tracking-eyebrow text-text/75">
                    {location.count} {location.count === 1 ? "event" : "events"}
                    <span aria-hidden className="px-1.5 text-text/35">
                      &middot;
                    </span>
                    next {weekday} {formatSessionDate(location.next.startsAt)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
