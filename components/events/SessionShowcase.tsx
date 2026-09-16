import Link from "next/link";

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
 * The eyebrow, and the one rule about it.
 *
 * Printed only when it is not the title said twice. Several activities are
 * filed under a category of their own name — "Ceramic Painting" under
 * "Ceramic Painting" — and an eyebrow repeating the heading beneath it is the
 * furniture that makes a composition look automated. Lifted verbatim from
 * <EventCard> rather than re-derived, so the two can never disagree.
 */
function categoryOf(workshop: Workshop): string | null {
  const category = workshop.category.trim();
  return category.toLowerCase() === workshop.title.toLowerCase() ? null : category;
}

/** "Sat 11 October 2026", through the site's own formatters. */
function whenOf(workshop: Workshop): { date: string; start: string } {
  const { weekday } = sessionDateParts(workshop.startsAt);
  const { start } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);
  return { date: `${weekday} ${formatSessionDate(workshop.startsAt)}`, start };
}

/**
 * The sessions, as one lead and a column of the rest.
 *
 * ==========================================================================
 * THE BRIEF WAS "LIKE GOODMAN GALLERY'S HEADLINES" — WHAT THAT MEANT
 * ==========================================================================
 *
 * Their page is not a grid of equal tiles. It is one large card holding the
 * left of the measure — a picture, then a category, a date and a title — with
 * a narrow column of three small cards stacked beside it, each the same
 * anatomy at a quarter of the size. What that composition does, and what a
 * uniform grid cannot, is say WHICH ONE MATTERS while still showing all of
 * them. A gallery uses it to lead with a film and list the interviews under
 * it; a studio can use it to lead with the next date and list the ones after.
 *
 * So the soonest session takes the large card, and every session after it is a
 * row in the stack. Nothing is hidden and nothing needs scrolling to reach —
 * which was the complaint against the carousel this section used to carry, and
 * is the reason the grid that replaced it was already the right instinct. This
 * only adds the hierarchy the grid was missing: three identical tiles say
 * "here are three things", where a lead and a list say "here is the next one,
 * and here is what follows".
 *
 * WHAT IS NOT TAKEN FROM THE REFERENCE. Their cards are rounded and their
 * images run a parallax on scroll. Neither belongs here: this site sets
 * photographs as artwork rather than as the top of a card (see
 * <WorkshopPhoto>), and a parallax on a section a visitor is reading dates off
 * is movement charging rent it does not pay.
 *
 * IT DEGRADES IN BOTH DIRECTIONS. One session renders as the lead alone, with
 * no empty column beside it. Two is a lead and one row, which is what the
 * studio has today. Five is a lead and four rows and needs no edit here.
 *
 * NOTHING ABOUT BOOKING CHANGES. Every link is `workshopHref`, every price is
 * `formatPrice`, every availability line is `spotsLabel` — the same helpers
 * <EventCard> and the listing call, imported rather than reimplemented.
 */
export function SessionShowcase({ sessions }: { sessions: Workshop[] }) {
  if (sessions.length === 0) return null;

  const [lead, ...rest] = sessions;

  return (
    <div
      className={cn(
        "mt-14 grid grid-cols-12 gap-x-6 gap-y-12 md:mt-20 lg:gap-x-10",
        // The stack only earns a column of its own when there is something in
        // it. With one session the lead takes the full measure rather than
        // sitting in seven twelfths with five twelfths of nothing beside it.
        rest.length === 0 && "lg:gap-x-0",
      )}
    >
      <div className={cn("col-span-12", rest.length > 0 && "lg:col-span-7")}>
        <LeadSession workshop={lead} full={rest.length === 0} />
      </div>

      {rest.length > 0 ? (
        <div className="col-span-12 lg:col-span-5">
          {/*
            A list, and typed as one. The rows are a sequence of dates after
            the lead, which is exactly what `<ol>` means — and it gives a
            screen reader the count before the first item rather than after the
            last.
          */}
          <ol>
            {rest.map((workshop) => (
              <li key={workshop.slug}>
                <StackedSession workshop={workshop} />
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The lead: the soonest session, at the size of the argument it is making.
 *
 * The picture is 3:2 and the type sits on a Light Sage panel under it — the
 * material the studio chose for a session — which is what separates the lead
 * from the rows beside it without drawing a box around either. Charcoal reads
 * 9.07:1 on that field, the labels 4.71 and the Deep Lilac action 3.83
 * against it, all past what they owe.
 */
function LeadSession({ workshop, full }: { workshop: Workshop; full: boolean }) {
  const category = categoryOf(workshop);
  const { date, start } = whenOf(workshop);
  const closed = isFullyBooked(workshop);
  const scarce = isScarce(workshop);

  return (
    <article className={cn("group relative flex flex-col", closed && "opacity-75")}>
      <div className="relative">
        <WorkshopPhoto
          image={workshop.image}
          aspect="aspect-[3/2]"
          sizes={full ? "(min-width: 1024px) 92vw, 92vw" : "(min-width: 1024px) 56vw, 92vw"}
        />

        {/* Only when the data has something to say — see <EventCard>. */}
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

      <div className="flex flex-1 flex-col bg-sage p-7 md:p-9 lg:p-10">
        {category ? (
          <p className="text-label font-medium uppercase tracking-eyebrow text-text/75">
            {category}
          </p>
        ) : null}

        <h3
          className={cn(
            "text-h2 font-light uppercase leading-[1.05] tracking-[-0.02em]",
            category && "mt-4",
          )}
        >
          <Link href={workshopHref(workshop)} className="after:absolute after:inset-0">
            {workshop.title}
          </Link>
        </h3>

        <p className="mt-5 max-w-[34rem] text-body leading-[1.8] text-text/80">
          {workshop.excerpt}
        </p>

        <p className="mt-6 text-body leading-[1.7] text-text">
          <time dateTime={workshop.startsAt}>{date}</time>
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

        {/* `mt-auto` holds the price row at the foot whatever the excerpt does. */}
        <div className="mt-auto flex items-baseline justify-between gap-4 border-t border-text/15 pt-6 md:mt-10">
          <p className="text-lead font-medium text-text">
            {formatPrice(workshop.price)}
            <span className="ml-1.5 text-fine font-normal text-text/75">per person</span>
          </p>

          {/*
            A span, not a link. The title already stretches one anchor over the
            whole card; a second to the same page would put every session in the
            tab order twice.
          */}
          <span
            aria-hidden
            className="inline-flex shrink-0 items-baseline gap-2 text-action font-medium uppercase tracking-eyebrow text-text"
          >
            {closed ? "View session" : "Book this session"}
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

/**
 * One of the dates after the lead.
 *
 * The same anatomy at a quarter of the size — picture, category, title, when —
 * set as a row rather than a tile so several of them read as a list the eye
 * runs down. The rule sits above each row and the first one carries none, so
 * the stack starts flush with the top of the lead's photograph rather than a
 * hairline below it.
 */
function StackedSession({ workshop }: { workshop: Workshop }) {
  const category = categoryOf(workshop);
  const { date, start } = whenOf(workshop);
  const closed = isFullyBooked(workshop);

  return (
    <article
      className={cn(
        "group relative flex items-start gap-5 py-7 first:pt-0 md:gap-6",
        // The separator belongs between rows, not around them.
        "[li+li_&]:border-t [li+li_&]:border-line",
        closed && "opacity-75",
      )}
    >
      <div className="w-24 shrink-0 md:w-28">
        <WorkshopPhoto image={workshop.image} aspect="aspect-[4/5]" sizes="112px" />
      </div>

      <div className="min-w-0 flex-1">
        {category ? (
          <p className="text-label font-medium uppercase tracking-eyebrow text-text/75">
            {category}
          </p>
        ) : null}

        <h3 className={cn("text-h3 font-light tracking-[-0.015em]", category && "mt-2.5")}>
          <Link href={workshopHref(workshop)} className="after:absolute after:inset-0">
            <span className="bg-gradient-to-r from-primary to-primary bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-1 transition-[background-size] duration-500 ease-editorial group-hover:bg-[length:100%_1px] group-focus-within:bg-[length:100%_1px]">
              {workshop.title}
            </span>
          </Link>
        </h3>

        <p className="mt-3 text-fine leading-[1.7] text-text">
          <time dateTime={workshop.startsAt}>{date}</time>
          <span aria-hidden className="px-2 text-text/70">
            &middot;
          </span>
          <span className="tabular-nums">{start}</span>
        </p>

        <p className="mt-2 text-fine leading-[1.7] text-text/75">
          {formatPrice(workshop.price)}
          {closed ? " · Fully booked" : null}
        </p>
      </div>
    </article>
  );
}
