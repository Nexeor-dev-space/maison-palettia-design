import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { WorkshopPhoto } from "@/components/workshops/WorkshopPhoto";
import {
  durationToIso,
  formatDuration,
  formatPrice,
  formatSessionDate,
  formatVenueLine,
  isFullyBooked,
  isScarce,
  sessionDateParts,
  sessionTimeRange,
  spotsLabel,
  workshopHref,
} from "@/lib/workshops";
import { cn } from "@/lib/utils";
import type { Workshop } from "@/types";

/**
 * One event in the index, as a line in a programme.
 *
 * ==========================================================================
 * IT WAS A CATALOGUE SPREAD AND IT IS AN AGENDA
 * ==========================================================================
 *
 * Every session used to be a full-width photograph with a column of facts
 * beside it, alternating sides down the page — about 520px of picture each,
 * 28 of gap between them. Two dates filled two screens. The argument was that
 * varying the crop stops a run of sessions reading as a product grid, and it
 * did; what it could not fix is that a programme you cannot see at once is
 * not a programme, it is a series of posters. Scanning it meant scrolling
 * past pictures to find dates, which is the opposite of what someone reading
 * a listing came to do.
 *
 * So each session is a ROW now, and the row is built the way a printed agenda
 * is built — the date first and large, then what it is, then the picture, then
 * the practical column of when and how much. Four sessions fit where one used
 * to, the dates line up down the left edge so they can be compared at a
 * glance, and the photographs are still there doing the job a photograph
 * should do in a listing: saying what the thing looks like, not filling a
 * screen.
 *
 * THE DATE IS SET IN THE DECK'S CONDENSED FACE, and that is a constraint
 * rather than a preference: the brand's script has no usable 7, 8 or 9, so a
 * numeral is never set in it. The condensed face is what the deck uses for
 * everything named, and at this size it gives the stamp a printed-timetable
 * weight the body face cannot.
 *
 * ONE LINK PER SESSION, stretched over the row by its `::after`. The arrow at
 * the end is a span for that reason: a second anchor to the same page would
 * put every session in the tab order twice.
 */
export function EventIndexEntry({ workshop, index }: { workshop: Workshop; index: number }) {
  const { weekday, day } = sessionDateParts(workshop.startsAt);
  const { start, end } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);
  const closed = isFullyBooked(workshop);

  return (
    <Reveal
      as="article"
      delay={index * 0.05}
      className={cn(
        "group press-in relative border-t border-line",
        /*
          The wash. A row is a big target with nothing drawn around it, so it
          needs to answer the pointer somehow; a tint that runs the full bleed
          of the row says "this line" without adding a card, a shadow or a
          border to a page that has none of those.
        */
        "transition-colors duration-[var(--duration-hover)] ease-soft",
        "hover:bg-surface-alt/60 focus-within:bg-surface-alt/60",
        closed && "opacity-70",
      )}
    >
      <div className="grid grid-cols-12 items-center gap-x-6 gap-y-6 py-7 md:py-8 lg:gap-x-10 lg:py-9">
        {/* ---- the date stamp ------------------------------------------- */}
        <div className="col-span-4 sm:col-span-3 lg:col-span-2">
          {/*
            THE DAY AND THE WEEKDAY, AND NO MONTH. The month is the heading
            these rows are grouped under, so printing it again on every stamp
            would say "October" three times down one screen. What a reader
            actually compares between two rows in the same month is the date
            and the day of the week.
          */}
          <p className="text-[2.75rem] uppercase leading-[0.82] tracking-[-0.01em] text-text [font-family:var(--font-deck)] [font-synthesis:none] lg:text-[3.5rem]">
            {day}
          </p>
          <p className="mt-2.5 text-label font-medium uppercase tracking-eyebrow text-text/60">
            {weekday}
          </p>
        </div>

        {/* ---- what it is ----------------------------------------------- */}
        <div className="col-span-8 sm:col-span-9 lg:col-span-4">
          <p className="flex items-center gap-3">
            <span aria-hidden className="h-px w-5 shrink-0 bg-terracotta" />
            <span className="text-label font-medium uppercase tracking-eyebrow text-text/75">
              {workshop.category}
            </span>
          </p>

          <h3 className="mt-3 text-[1.5rem] font-light leading-[1.12] tracking-[-0.025em] md:text-[1.875rem] lg:text-[2.125rem]">
            <Link
              href={workshopHref(workshop)}
              aria-label={`${workshop.title}, ${formatSessionDate(workshop.startsAt)}${workshop.venue ? ` at ${formatVenueLine(workshop.venue)}` : ""}`}
              className="after:absolute after:inset-0"
            >
              {/* The site's one underline — see `ink-rule` in globals.css. */}
              <span className="ink-rule" style={{ "--rule": "var(--color-primary)" } as React.CSSProperties}>
                {workshop.title}
              </span>
            </Link>
          </h3>

          {workshop.venue ? (
            <p className="mt-3 text-fine leading-[1.6] text-text/75">
              {workshop.venue.name}
              <span aria-hidden className="px-2 text-text/35">
                &middot;
              </span>
              {workshop.venue.locality}
            </p>
          ) : null}
        </div>

        {/* ---- the picture, at listing size ----------------------------- */}
        <div
          data-paint
          style={{ "--paint": "var(--color-primary)" } as React.CSSProperties}
          className="col-span-12 sm:col-span-6 lg:col-span-3"
        >
          <WorkshopPhoto
            image={workshop.image}
            aspect="aspect-[16/10]"
            sizes="(min-width: 1024px) 24vw, (min-width: 640px) 46vw, 100vw"
          />
        </div>

        {/* ---- when, how long, how much --------------------------------- */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 lg:text-right">
          <p className="text-body font-medium leading-snug text-text">
            <span className="tabular-nums">{start}</span>
            <span aria-hidden> &ndash; </span>
            <span className="sr-only">to</span>
            <span className="tabular-nums">{end}</span>
          </p>
          <p className="mt-1.5 text-fine text-text/70">
            <time dateTime={durationToIso(workshop.durationMinutes)}>
              {formatDuration(workshop.durationMinutes)}
            </time>
            <span aria-hidden className="px-2 text-text/35">
              &middot;
            </span>
            {formatPrice(workshop.price)}
          </p>

          <p className="mt-4 flex items-center gap-2.5 text-label font-medium uppercase tracking-eyebrow text-text lg:justify-end">
            {isScarce(workshop) ? (
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-pill bg-terracotta" />
            ) : null}
            {spotsLabel(workshop)}
          </p>

          {/*
            An affordance, not a link — the title above already covers the
            whole row. See the note on <WorkshopAction>, which follows the
            same rule.
          */}
          <span
            aria-hidden
            className="mt-4 flex w-fit items-center gap-3 text-action font-semibold uppercase tracking-eyebrow text-primary lg:ml-auto"
          >
            <span className="border-b border-primary/40 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-primary">
              View event
            </span>
            <span className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1">
              &#8594;
            </span>
          </span>
        </div>
      </div>
    </Reveal>
  );
}
