import Link from "next/link";

import { SessionGate } from "@/components/booking/SessionClock";
import { modeCopy } from "@/components/blocks/templateCopy";

import { WorkshopPhoto } from "@/components/workshops/WorkshopPhoto";
import { cn } from "@/lib/utils";
import {
  durationToIso,
  formatDuration,
  formatPrice,
  formatSessionDate,
  hasSessionPassed,
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
 *   date gone by ....... "Date passed"     — charcoal, a statement of fact
 *   fully booked ....... "Fully booked"    — charcoal, a statement of fact
 *   nearly gone ........ "3 spots left"    — Deep Lilac, the one accent
 *   comfortably open ... nothing at all
 *
 * The first row is decided twice: by the server when the HTML is rendered,
 * and again by <SessionGate> against the visitor's clock, because this card
 * sits on a prerendered page and a date can lapse between the render and the
 * visit. The same gate turns "Book" into "View" at the foot.
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
  // The server's verdict, for the HTML; <SessionGate> below re-asks it.
  const passed = hasSessionPassed(workshop);

  /*
    Printed only when it is not the title said twice. Several activities are
    filed under a category of their own name — "Ceramic Painting" under
    "Ceramic Painting" — and an eyebrow repeating the heading beneath it is the
    kind of furniture that makes a composition look automated.
  */

  return (
    <article
      className={cn(
        "group press-in plate relative flex h-full flex-col overflow-clip rounded-[1.25rem] md:rounded-[1.5rem] bg-cream",
        "transition-shadow duration-300 ease-soft hover:shadow-[0_0_0_1.5px_var(--color-primary)] focus-within:shadow-[0_0_0_1.5px_var(--color-primary)]",
        (closed || passed) && "opacity-75",
        className,
      )}
    >
      {/* The photograph flush across top */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-sage/60" data-paint style={{ "--paint": "var(--color-primary)" } as React.CSSProperties}>
        <WorkshopPhoto
          image={workshop.image}
          aspect="aspect-[3/2]"
          sizes={sizes}
          className="rounded-none h-full w-full object-cover transition-transform duration-700 ease-editorial motion-safe:group-hover:scale-[1.04]"
        />

        <SessionGate
          startsAt={workshop.startsAt}
          passedAtRender={passed}
          open={
            closed || scarce ? (
              <Chip dark={closed}>{spotsLabel(workshop)}</Chip>
            ) : null
          }
          passed={<Chip dark>{modeCopy().eventPage.passedLabel}</Chip>}
        />
      </div>

      {/* Structured Card Content */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="flex items-center gap-2.5 text-label font-medium uppercase tracking-eyebrow text-text/75">
          {modeCopy().labels.scheduledSession}
        </p>

        <h3 className="mt-2 text-h3 font-light leading-snug">
          <Link
            href={workshopHref(workshop)}
            className="after:absolute after:inset-0 text-text transition-colors duration-300 ease-soft group-hover:text-primary"
          >
            <span className="ink-rule" style={{ "--rule": "var(--color-primary)" } as React.CSSProperties}>
              {workshop.title}
            </span>
          </Link>
        </h3>

        <p className="mt-3 text-body text-text">
          <time dateTime={workshop.startsAt}>
            {weekday} {formatSessionDate(workshop.startsAt)}
          </time>
          <span aria-hidden className="px-2 text-text/70">
            &middot;
          </span>
          <span className="tabular-nums">{start}</span>
        </p>

        {workshop.venue ? (
          <p className="mt-1 text-fine text-text/75">
            {workshop.venue.name}, {workshop.venue.locality}
          </p>
        ) : null}

        <div className="mt-auto flex items-baseline justify-between gap-4 border-t border-line/60 pt-4 mt-5">
          <p className="text-body font-medium text-text">
            {formatPrice(workshop.price)}
            <span className="ml-1.5 text-fine font-normal text-text/75">
              per person
            </span>
          </p>

          <span
            aria-hidden
            className="inline-flex shrink-0 items-baseline gap-1.5 text-action font-medium uppercase tracking-eyebrow text-text transition-transform duration-300 ease-editorial group-hover:text-primary"
          >
            <SessionGate
              startsAt={workshop.startsAt}
              passedAtRender={passed}
              open={closed ? "View" : "Book"}
              passed="View"
            />
            <span className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1">
              &#8594;
            </span>
          </span>
        </div>

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

/** The status chip on the photograph. */
function Chip({ dark = false, children }: { dark?: boolean; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "absolute left-3 top-3 rounded-sm px-3 py-1.5 text-label font-medium uppercase tracking-eyebrow",
        dark ? "bg-text text-on-dark" : "bg-primary text-on-primary",
        // A few pixels more than the tile, so the two read as separate
        // layers rather than as one flat picture.
        "transition-transform duration-[var(--duration-hover)] ease-editorial",
        "motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5",
      )}
    >
      {children}
    </p>
  );
}
