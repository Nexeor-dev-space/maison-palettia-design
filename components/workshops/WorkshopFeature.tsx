import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { WorkshopPhoto } from "@/components/workshops/WorkshopPhoto";
import {
  bookSessionHref,
  durationToIso,
  formatDuration,
  formatPrice,
  formatSessionDate,
  formatVenueLine,
  isFullyBooked,
  isScarce,
  sessionTimeRange,
  spotsLabel,
} from "@/lib/workshops";
import { cn } from "@/lib/utils";
import type { Workshop } from "@/types";

/**
 * The next session, as a booking.
 *
 * This was a featured workshop: a photograph the width of the measure, a
 * title, a paragraph about centring clay, and "Explore workshop". It read as a
 * beautiful thing to admire. The studio's business is a table in a mall on a
 * Saturday at eleven, and none of that told you where or when.
 *
 * So the composition is split rather than stacked. The photograph keeps the
 * left and still does the work of making someone want this; the right is a
 * White Rock field carrying the four facts that let them act on it — where,
 * when, what time, what it costs — and the one action. Both halves run off
 * their own edge of the page, which is what keeps the panel reading as a field
 * the page is divided into rather than as a card sitting on it.
 *
 * The hierarchy inside the panel is the client's: venue, then date, then the
 * fixed time set larger than anything except the session's own name. The time
 * is stacked across a rule rather than run together on one line, because
 * "10:00 AM - 1:00 PM" scanned at a glance is the single thing that says this
 * is a scheduled event and not an opening-hours range.
 *
 * There is one link, and it is the booking action. The title used to be an
 * anchor to /workshops/{slug}, which answers 404 — a heading that looks
 * clickable and goes nowhere is worse than a heading. See `bookSessionHref`.
 */
interface WorkshopFeatureProps {
  workshop: Workshop;
  index: string;
  /** Puts the photograph on the right at `lg`. Alternated down the schedule. */
  flip?: boolean;
  /** The panel's ground. Alternated so no two neighbours share one. */
  tone?: "cream" | "sage";
}

export function WorkshopFeature({
  workshop,
  index,
  flip = false,
  tone = "cream",
}: WorkshopFeatureProps) {
  const { start, end } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);
  const closed = isFullyBooked(workshop);

  // No gap at `lg`: the photograph and the booking panel meet on a single
  // edge, so the pair reads as one object split down the middle rather than a
  // picture placed next to a box. It is also why neither half has a border —
  // the seam between two colours is the only line the composition needs.
  return (
    <article className="group grid grid-cols-12 items-stretch gap-y-0">
      {/* --- The making, on the left ------------------------------------- */}
      {/*
        Which side each half takes is set here rather than in the markup order.
        The photograph always comes first in the DOM — it is what the alt text
        describes and what a reader should meet before the facts — and only its
        column changes, so a flipped block reads identically to a screen reader
        and stacks identically on a phone.
      */}
      <figure
        className={cn(
          // `lg:row-start-1` is load-bearing on a flipped block. Grid's default
          // placement is sparse: it never backtracks. With the photograph first
          // in the DOM and pinned to column 7, the panel that follows it cannot
          // be placed to its left in the same row, so it drops to a second one
          // — which is exactly what happened, and cost the pair their shared
          // height. Naming the row for both keeps them side by side whichever
          // way round they are.
          "col-span-12 -mx-gutter lg:col-span-6 lg:row-start-1",
          flip ? "lg:col-start-7 lg:-mr-gutter lg:ml-0" : "lg:col-start-1 lg:-ml-gutter lg:mr-0",
        )}
      >
        <WorkshopPhoto
          image={workshop.image}
          /*
            A definite proportion at every width, and this one is load-bearing
            rather than decorative.

            It was `lg:aspect-auto lg:h-full`, which took the plate's height
            from the booking panel beside it through `items-stretch`. That
            looked identical and broke the photograph: a box whose height comes
            from a sibling has no definite size of its own when the browser
            first evaluates it, so the lazy loader never fetched the file and
            the scroll observer behind <Reveal> never reported the element on
            screen — leaving it parked at the variant's `opacity: 0` over a
            White Rock placeholder, which is the same colour as the panel. The
            result was a plain cream rectangle that looked deliberate.

            A square at `lg` measures within 6% of what the stretch produced,
            so the composition is unchanged; `items-stretch` now works the
            other way, with the panel growing to meet the picture.

            A band rather than a plate on a phone — 16:10 against the 4:3 this
            started at, which is about 70px less to scroll past. On a narrow
            screen the photograph sits directly between the heading and the
            first thing anyone can act on, and the client was specific that the
            booking information must not be behind a screen of imagery.
          */
          aspect="aspect-[16/10] sm:aspect-[3/2] lg:aspect-square"
          sizes="(min-width: 1024px) 52vw, 100vw"
        />
      </figure>

      {/* --- The booking, on the right ----------------------------------- */}
      <div
        className={cn(
          "col-span-12 -mx-gutter px-gutter py-12 md:py-14 lg:col-span-6 lg:row-start-1 lg:px-12 lg:py-14 xl:px-16",
          // White Rock and Light Sage are both pale brand grounds and charcoal
          // clears 9:1 on either, so alternating them costs nothing in
          // legibility and stops three identical blocks reading as a template.
          tone === "sage" ? "bg-sage" : "bg-cream",
          flip ? "lg:col-start-1 lg:-ml-gutter lg:mr-0" : "lg:col-start-7 lg:-mr-gutter lg:ml-0",
        )}
      >
        <Reveal delay={0.1}>
          <p className="flex items-center gap-4">
            <span className="text-[0.62rem] font-medium uppercase tracking-eyebrow text-text">
              {index}
            </span>
            <span aria-hidden className="h-px w-8 shrink-0 bg-terracotta" />
            <span className="text-[0.62rem] font-medium uppercase tracking-eyebrow text-text/75">
              {workshop.category}
            </span>
          </p>

          <h3 className="mt-6 text-[1.75rem] font-light leading-[1.12] tracking-[-0.02em] md:text-[2.1rem] lg:text-[2.25rem]">
            {workshop.title}
          </h3>
        </Reveal>

        <Reveal delay={0.2}>
          {/*
            The facts, ruled off from the name above them. Hairlines rather
            than boxes: the panel is already a field of its own colour, and
            drawing a border inside it would be the second container the
            section does not need.
          */}
          <div className="mt-9 border-t border-text/15 pt-8">
            {workshop.venue ? (
              <Field term="Where">
                <span className="block text-[1.05rem] font-medium leading-snug text-text">
                  {workshop.venue.name}
                </span>
                <span className="mt-1.5 block text-[0.85rem] text-text/75">
                  {workshop.venue.locality}
                </span>
              </Field>
            ) : null}

            <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-8">
              <Field term="Date">
                <time
                  dateTime={workshop.startsAt}
                  className="block text-[1.05rem] font-medium leading-snug text-text"
                >
                  {formatSessionDate(workshop.startsAt)}
                </time>
                <span className="mt-1.5 block text-[0.85rem] text-text/75">
                  <time dateTime={durationToIso(workshop.durationMinutes)}>
                    {formatDuration(workshop.durationMinutes)}
                  </time>
                </span>
              </Field>

              <Field term="Price">
                <span className="block text-[1.05rem] font-medium leading-snug text-text">
                  {formatPrice(workshop.price)}
                </span>
                <span className="mt-1.5 block text-[0.85rem] text-text/75">per person</span>
              </Field>
            </div>

            {/*
              The fixed time, given the largest type in the panel after the
              session's own name. Stacked across a short rule so the two ends
              read as a window rather than as two unrelated clock faces — this
              is the fact the client asked to be impossible to miss.
            */}
            <div className="mt-8">
              <Term>Time</Term>
              <p className="mt-3 flex items-center gap-4 text-[1.6rem] font-light leading-none tracking-[-0.01em] text-text md:text-[1.85rem]">
                <span className="tabular-nums">{start}</span>
                <span aria-hidden className="h-px w-6 shrink-0 bg-text/30" />
                <span className="sr-only">to</span>
                <span className="tabular-nums">{end}</span>
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Spots workshop={workshop} />
          </div>

          <BookButton workshop={workshop} closed={closed} />
        </Reveal>
      </div>
    </article>
  );
}

function Term({ children }: { children: string }) {
  return (
    <span className="block text-[0.6rem] font-medium uppercase tracking-eyebrow text-text/75">
      {children}
    </span>
  );
}

function Field({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <Term>{term}</Term>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/**
 * What is left of the session.
 *
 * Terracotta appears only as the dot, never as the type: at this size the
 * fill measures about 3:1 on the page's grounds, which is under what a label
 * owes. The colour marks the scarce case; the words carry it.
 */
function Spots({ workshop, className }: { workshop: Workshop; className?: string }) {
  const scarce = isScarce(workshop);

  return (
    <p
      className={`flex items-center gap-2.5 text-[0.62rem] font-medium uppercase tracking-eyebrow text-text ${className ?? ""}`}
    >
      {scarce ? (
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-pill bg-terracotta" />
      ) : null}
      {spotsLabel(workshop)}
    </p>
  );
}

/**
 * The one action in the section, and the strongest thing in it.
 *
 * Deep Lilac, filled, square-cornered — the site's only saturated field, spent
 * here because this is the only place on the homepage where something is
 * actually being asked of the reader. Square because nothing on this site is
 * rounded except the two arches.
 *
 * A full session gets no button. An action that cannot be taken is worse than
 * a plain sentence, and a visitor believing they have booked something that
 * was closed is the one unacceptable outcome in this section.
 */
function BookButton({
  workshop,
  closed,
  className,
}: {
  workshop: Workshop;
  closed: boolean;
  className?: string;
}) {
  if (closed) {
    return (
      <p className={`mt-8 text-[0.9rem] leading-[1.75] text-text/80 ${className ?? ""}`}>
        This date is full — the next sessions are below.
      </p>
    );
  }

  const where = workshop.venue ? ` at ${formatVenueLine(workshop.venue)}` : "";

  return (
    <Link
      href={bookSessionHref(workshop)}
      aria-label={`Book ${workshop.title}${where} on ${formatSessionDate(workshop.startsAt)}`}
      className={`mt-8 inline-flex items-center justify-center gap-2.5 bg-primary px-8 py-4 text-[0.7rem] font-medium uppercase leading-none tracking-eyebrow text-white transition-colors duration-300 ease-soft hover:bg-primary/90 ${className ?? ""}`}
    >
      Book event
      <span
        aria-hidden
        className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
      >
        &#8594;
      </span>
    </Link>
  );
}
