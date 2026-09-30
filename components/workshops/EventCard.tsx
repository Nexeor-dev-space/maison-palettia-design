import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { DoodleMark } from "@/components/ui/DoodleMark";
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
 * One scheduled session, as a card.
 *
 * ==========================================================================
 * IT WAS AN AGENDA AND THE CLIENT ASKED FOR CARDS
 * ==========================================================================
 *
 * Every session was a ROW on a hairline — date stamp, title, a small
 * photograph, then a right-hand column of time, price and seats — built the
 * way a printed programme is built so that four dates could be compared at a
 * glance. That argument holds for a programme of twenty. For the two dates
 * the studio actually has scheduled it produced two thin lines across a very
 * wide page, with a third of the measure empty in the middle of each, which
 * is what the client is looking at.
 *
 * So each session is an object now: a Light Sage plate holding its own
 * photograph, with the date, the name, the place, the time and the price set
 * on it in that order. Two of them side by side fill the same width that two
 * rows left empty, and a third would simply start a second row.
 *
 * LIGHT SAGE ON WHITE ROCK, which is the pairing this site already uses for a
 * card on the cream ground — see <CollaborateTeaser>. The two are 1.03:1
 * apart in lightness and it is `plate` that separates them rather than an
 * outline, for the reason that utility exists: the client's note was "don't
 * use this much hard stroke lines". Charcoal Slate on Light Sage is 9.07:1,
 * so every word on the card keeps the ink it had in the row.
 *
 * THE PHOTOGRAPH IS INSET RATHER THAN BLED to the card's edge, and nothing is
 * written on it. That is today's other note, applied here before it could be
 * made again: a name laid over a photograph is either unreadable or needs a
 * shade under it, and the answer both times was to give the words their own
 * ground.
 *
 * ONE MARK PER CARD, breaking the photograph's top-right corner — the brand's
 * own cut-out, one of the three colours that can be seen on Light Sage, and
 * placed rather than scattered.
 *
 * ONE LINK PER SESSION, stretched over the card by its `::after`. The arrow at
 * the end is a span for that reason: a second anchor to the same page would
 * put every session in the tab order twice.
 */

/*
  The mark on each card. Three colours, three shapes, taken by position so a
  run of cards reads as a palette rather than as a repeat — and Light Sage and
  White Rock are not among them, because the plate is sage and a sage mark on
  it is not a quiet mark, it is a missing one.

  `paint` is the same colour as a CSS token: it is what the brush cursor picks
  up over the photograph, and <DoodleMark> needs the literal because it hands
  the value to an SVG `fill`.
*/
const CARD_MARKS: readonly { name: DoodleName; ink: string; paint: string }[] = [
  { name: "starburst", ink: INK.lilac, paint: "var(--color-primary)" },
  { name: "splash", ink: INK.terracotta, paint: "var(--color-terracotta)" },
  { name: "bow", ink: INK.lavender, paint: "var(--color-lavender)" },
];

export function EventCard({ workshop, index }: { workshop: Workshop; index: number }) {
  const { weekday, day } = sessionDateParts(workshop.startsAt);
  const { start, end } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);
  const closed = isFullyBooked(workshop);
  const mark = CARD_MARKS[index % CARD_MARKS.length];

  return (
    <Reveal
      as="article"
      /* Dealt onto the table, one after the other — the same `drop` the
         swatch cards use, at the 0.12 that keeps the order legible. */
      variant="drop"
      delay={index * 0.12}
      className={cn(
        "group press-in plate relative flex h-full flex-col rounded-[1.25rem] bg-sage p-3 md:p-4",
        "transition-shadow duration-[var(--duration-hover)] ease-soft",
        closed && "opacity-75",
      )}
    >
      {/* ---- the photograph, inset in the plate ------------------------- */}
      <div
        className="relative"
        data-paint
        style={{ "--paint": mark.paint } as React.CSSProperties}
      >
        <WorkshopPhoto
          image={workshop.image}
          aspect="aspect-[16/10]"
          sizes="(min-width: 1024px) 40vw, (min-width: 640px) 46vw, 92vw"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-2 -top-4 w-[3.25rem] md:-right-3 md:-top-5 md:w-[4.25rem]"
        >
          <DoodleMark name={mark.name} color={mark.ink} treatment="draw" delay={220 + index * 120} />
        </span>
      </div>

      {/* ---- what it is -------------------------------------------------- */}
      <div className="flex flex-1 flex-col px-2 pb-1.5 pt-5 md:px-2.5 md:pt-6">
        <div className="flex items-start justify-between gap-4">
          {/*
            THE DAY AND THE WEEKDAY, AND NO MONTH. The month is the heading
            these cards are grouped under. Set in the deck's condensed face
            because the brand's script has no usable 7, 8 or 9, so a numeral
            is never set in it.
          */}
          <p className="flex items-baseline gap-2.5">
            <span className="text-folio uppercase leading-none tracking-[-0.01em] text-text [font-family:var(--font-deck)] [font-synthesis:none]">
              {day}
            </span>
            <span className="text-label font-medium uppercase tracking-eyebrow text-text/70">
              {weekday}
            </span>
          </p>

          <p className="flex items-center gap-2.5 pt-1">
            <span aria-hidden className="h-px w-4 shrink-0 bg-terracotta" />
            <span className="text-label font-medium uppercase tracking-eyebrow text-text/75">
              {workshop.category}
            </span>
          </p>
        </div>

        <h3 className="mt-4 text-h3 font-light tracking-[-0.025em]">
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
          <p className="mt-2.5 text-fine leading-[1.6] text-text/75">
            {workshop.venue.name}
            <span aria-hidden className="px-2 text-text/35">
              &middot;
            </span>
            {workshop.venue.locality}
          </p>
        ) : null}

        {/* ---- when, how long, how much ---------------------------------- */}
        <div className="mt-auto pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 border-t border-text/15 pt-4">
            <p className="text-body font-medium leading-snug text-text">
              <span className="tabular-nums">{start}</span>
              <span aria-hidden> &ndash; </span>
              <span className="sr-only">to</span>
              <span className="tabular-nums">{end}</span>
            </p>
            <p className="text-fine text-text/75">
              <time dateTime={durationToIso(workshop.durationMinutes)}>
                {formatDuration(workshop.durationMinutes)}
              </time>
              <span aria-hidden className="px-2 text-text/35">
                &middot;
              </span>
              {formatPrice(workshop.price)}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
            <p className="flex items-center gap-2.5 text-label font-medium uppercase tracking-eyebrow text-text">
              {isScarce(workshop) ? (
                <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-pill bg-terracotta" />
              ) : null}
              {spotsLabel(workshop)}
            </p>

            {/*
              An affordance, not a link — the title above already covers the
              whole card. See the note on <WorkshopAction>, which follows the
              same rule.
            */}
            <span
              aria-hidden
              className="flex items-center gap-3 text-action font-semibold uppercase tracking-eyebrow text-primary"
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
      </div>
    </Reveal>
  );
}
