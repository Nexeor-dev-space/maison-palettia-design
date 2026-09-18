import Link from "next/link";

import { ModeMark } from "@/components/ui/ModeMark";

import { WorkshopPhoto } from "@/components/workshops/WorkshopPhoto";
import { cn } from "@/lib/utils";
import {
  durationToIso,
  formatDuration,
  formatPrice,
  formatSessionDate,
  isFullyBooked,
  isScarce,
  sessionDateParts,
  sessionTimeRange,
  spotsLabel,
  workshopHref,
} from "@/lib/workshops";
import type { Workshop } from "@/types";

/**
 * One event, as a tile in a grid.
 *
 * ==========================================================================
 * THE BRIEF WAS "ARRANGE THEM LIKE PLATINUMLIST" — HERE IS WHAT THAT MEANT
 * ==========================================================================
 *
 * What is worth taking from a ticketing marketplace is the ANATOMY, not the
 * styling: a picture, a status chip on it, then a fixed reading order of
 * title, date, place, price, with the whole tile clickable. A visitor scanning
 * six of those compares dates in one pass. That is genuinely better than what
 * this site had on the homepage — one session at a time behind arrows, which
 * is a posture of browsing rather than of choosing.
 *
 * WHAT IS DELIBERATELY NOT TAKEN, AND THIS IS THE IMPORTANT HALF. Platinumlist
 * cards carry "Top seller", "Selling fast", "Bestseller", "26% OFF", a
 * strikethrough original price and a star rating. Every one of those is a
 * claim, and this project has data for none of them — no ratings, no sales
 * ranking, no list price to discount from, no second price tier. Reproducing
 * that chrome would mean writing urgency the studio has not earned and cannot
 * support, which is the one thing the brief for this site has ruled out at
 * every stage.
 *
 * So the chip says only what `seatsAvailable` already knows:
 *
 *   fully booked ....... "Fully booked"    — charcoal, a statement of fact
 *   nearly gone ........ "3 spots left"    — Deep Lilac, the one accent
 *   comfortably open ... nothing at all
 *
 * The third case matters most. A chip on every tile is a chip that means
 * nothing; scarcity only reads as scarcity when most tiles are quiet. That is
 * `isScarce`, which the site already uses, not a new rule invented here.
 *
 * NO BORDER, NO SHADOW, NO PANEL. The house language has none anywhere — see
 * <WorkshopPhoto>, which exists to set a photograph as artwork rather than as
 * the top of a card. So the picture is the tile's body and the type sits under
 * it on the page's own ground, with one hairline above the price row. It reads
 * as a repeating unit in a grid, which is what a card is for, without
 * importing a marketplace's box.
 *
 * ONE LINK PER TILE, stretched over the whole thing by its `::after`. The
 * price row's affordance is a `<span>` for that reason: a second anchor to the
 * same page would put every event in the tab order twice.
 */
export function EventCard({
  workshop,
  sizes,
  className,
}: {
  workshop: Workshop;
  /** Rendered width per breakpoint, so the browser fetches one size only. */
  sizes: string;
  className?: string;
}) {
  const { weekday } = sessionDateParts(workshop.startsAt);
  const { start } = sessionTimeRange(
    workshop.startsAt,
    workshop.durationMinutes,
  );
  const closed = isFullyBooked(workshop);
  const scarce = isScarce(workshop);

  /*
    Printed only when it is not the title said twice. Several activities are
    filed under a category of their own name — "Ceramic Painting" under
    "Ceramic Painting" — and an eyebrow repeating the heading beneath it is the
    kind of furniture that makes a composition look automated.
  */

  return (
    <article
      className={cn(
        "group relative flex flex-col",
        // A sold-out date stays in the grid and stays readable — it is still
        // information — but it stops competing with the ones that can be had.
        closed && "opacity-75",
        className,
      )}
    >
      <div className="relative">
        <WorkshopPhoto
          image={workshop.image}
          aspect="aspect-[3/2]"
          sizes={sizes}
        />

        {/*
          The chip sits on a solid ground rather than a tint, so it is legible
          over any photograph without anyone re-measuring when the studio swaps
          a picture. White Rock on Charcoal is 12.33:1; the near-white on Deep
          Lilac is 4.90:1, which is what `--color-on-primary` exists for.
        */}
        {closed || scarce ? (
          <p
            className={cn(
              "absolute left-3 top-3 rounded-sm px-3 py-1.5 text-label font-medium uppercase tracking-eyebrow",
              closed ? "bg-text text-on-dark" : "bg-primary text-on-primary",
            )}
          >
            {spotsLabel(workshop)}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-1 flex-col">
        {/*
          How you take part, not which strand it is filed under. The category
          ("Craft") came from the old Paint / Shape / Craft / Create system and
          told a visitor nothing they could act on; "Scheduled session" tells
          them this is a date they book — the same mark and words the hero,
          the homepage groups and the menus use.
        */}
        <p className="flex items-center gap-2.5 text-label font-semibold uppercase tracking-eyebrow text-text">
          <ModeMark mode="scheduled" />
          Scheduled session
        </p>

        <h3 className="mt-3 text-h3 font-light tracking-[-0.015em]">
          <Link
            href={workshopHref(workshop)}
            className="after:absolute after:inset-0"
          >
            <span className="bg-gradient-to-r from-primary to-primary bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-1 transition-[background-size] duration-500 ease-editorial group-hover:bg-[length:100%_1px] group-focus-within:bg-[length:100%_1px]">
              {workshop.title}
            </span>
          </Link>
        </h3>

        {/*
          Date, then time, then place — the same order and the same formatters
          the listing and the event page use, so a visitor who has read one has
          already learned how to read the others.
        */}
        <p className="mt-4 text-body leading-[1.7] text-text">
          <time dateTime={workshop.startsAt}>
            {weekday} {formatSessionDate(workshop.startsAt)}
          </time>
          {/* /70, not /40. It separates two data points, so it is doing
              structural work rather than decorating — and /40 measured 2.17:1
              on this ground, which is faint enough to read as a rendering
              artefact rather than as a considered mark. */}
          <span aria-hidden className="px-2 text-text/70">
            &middot;
          </span>
          <span className="tabular-nums">{start}</span>
        </p>

        {workshop.venue ? (
          <p className="mt-1.5 text-fine leading-[1.7] text-text/75">
            {workshop.venue.name}, {workshop.venue.locality}
          </p>
        ) : null}

        {/*
          `mt-auto` pins this to the foot of the tile, so the price rows line up
          across the grid even when one title wraps to two lines and its
          neighbour does not. Without it the rules stagger and the grid reads as
          a collage.
        */}
        <div className="mt-auto flex items-baseline justify-between gap-4 border-t border-line pt-5">
          <p className="text-body font-medium text-text">
            {formatPrice(workshop.price)}
            <span className="ml-1.5 text-fine font-normal text-text/75">
              per person
            </span>
          </p>

          <span
            aria-hidden
            className="inline-flex shrink-0 items-baseline gap-2 text-action font-medium uppercase tracking-eyebrow text-text"
          >
            {closed ? "View" : "Book"}
            <span className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1">
              &#8594;
            </span>
          </span>
        </div>

        {/*
          Duration is carried for a screen reader and for machines but not
          printed: the tile already sets four facts and a fifth turns a scan
          into a read. The event page prints it in full.
        */}
        <span className="sr-only">
          Lasts{" "}
          <time dateTime={durationToIso(workshop.durationMinutes)}>
            {formatDuration(workshop.durationMinutes)}
          </time>
        </span>
      </div>
    </article>
  );
}
