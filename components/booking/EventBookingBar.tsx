"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The single booking mechanism on an event page.
 *
 * One bar, present from the moment the page loads, holding the four facts
 * someone needs before they commit — what, when, where, how much — and the one
 * action. It replaced a "Ready to join us?" panel at the foot of the page and
 * the inline button in the hero, which between them gave the page two primary
 * calls to action and put the second one below everything a visitor had to
 * read first.
 *
 * It does not own any booking logic. The link is `bookingStepHref()`, the same
 * route the page has always used, and every value shown is read through the
 * same helpers the rest of the site reads. Nothing here knows what a booking
 * is; it is a way to reach the existing flow without scrolling for it.
 *
 * WHY IT RETRACTS. The footer on this site is `position: fixed` behind an
 * opaque `<main>`, and the page uncovers it by scrolling past its own bottom
 * margin — see <FooterReveal>. A bar fixed to the foot of the window would sit
 * on top of that footer for the whole of the reveal, and on top of the last
 * section of the page before it. So the bar watches a sentinel dropped at the
 * end of the content and stands down once it arrives: by the time the footer
 * is being uncovered, the bar is gone.
 *
 * A full date never renders a button that cannot be pressed. It states the
 * fact and offers the listing instead, which is the same honest answer the
 * page gave before and the one outcome that must not be got wrong — someone
 * believing they have booked a closed date.
 *
 * EVERY VALUE ARRIVES FORMATTED. This is a client component, and lib/workshops
 * holds the session array as well as the helpers; importing it here to borrow
 * a formatter would pull the whole catalogue into the browser bundle. No other
 * client component on the site does it, and the note at the foot of lib/utils
 * exists for the same reason. The page resolves the strings and hands them
 * down, so this file knows nothing but how to lay them out.
 */

/** How far above the foot of the window the desktop bar floats. */
const DESKTOP_INSET = "1.25rem";

export interface EventBookingBarProps {
  /** The event's name, for the bar and for the action's accessible label. */
  title: string;
  /** Where the action goes — the existing booking route, resolved by the page. */
  bookingHref: string;
  /** ISO 8601, for the <time> element's own value. */
  startsAt: string;
  /** "Sat, 3 October 2026". */
  dateLabel: string;
  /** "10:00 AM" and "1:00 PM", kept apart so the range reads as a range. */
  startLabel: string;
  endLabel: string;
  /** The mall. Absent on events that have no venue set. */
  venueName?: string;
  /** "AED 320". */
  priceLabel: string;
  /** "5 spots left" — the listing's own wording, never a number invented here. */
  spotsLabel: string;
  /** True when the existing data says the date is full. */
  closed: boolean;
  /** True when the existing data says places are running low. */
  scarce: boolean;
  /**
   * Marks the end of the page's content. The bar stands down once this is in
   * view, so it never covers the last section or the footer behind it.
   */
  sentinelId: string;
}

export function EventBookingBar({ sentinelId, closed, ...event }: EventBookingBarProps) {
  const [isRetracted, setIsRetracted] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = document.getElementById(sentinelId);
    if (!sentinel) return;

    // A position test rather than an intersection one, and deliberately.
    //
    // The question is "has the end of the content reached the foot of the
    // window", which stays true once it is true — the sentinel keeps rising
    // past the top of the screen while the tall in-flow footer scrolls by
    // underneath. An IntersectionObserver cannot answer that: it reports
    // crossings, and a single jump from the top of the page to the bottom —
    // a flick, an anchor, a restored scroll position on reload — moves the
    // sentinel from below the window to above it between two frames, crossing
    // nothing the observer is watching. It then never fires, and the bar sits
    // over the footer for the rest of the page. That is exactly what happened
    // on every viewport short enough that the footer could not pin.
    //
    // One rect read, coalesced to at most one per frame, on a listener that is
    // passive: cheap enough that the correctness is worth it.
    let frame = 0;
    const measure = () => {
      frame = 0;
      setIsRetracted(sentinel.getBoundingClientRect().top <= window.innerHeight);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [sentinelId]);

  return (
    <div
      ref={barRef}
      // `fixed` over everything the page paints, including the pinned footer.
      // `pointer-events-none` on the frame and back on for the bar itself, so
      // the empty measure either side of the desktop bar is not a dead strip
      // over the page.
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 transition-[opacity,transform]",
        "duration-300 ease-soft motion-reduce:transition-none",
        isRetracted ? "translate-y-3 opacity-0" : "translate-y-0 opacity-100",
      )}
      // Hidden from everything, not just from sight, once it is down: a
      // retracted bar that is still in the tab order is a keyboard trap at the
      // foot of every page.
      aria-hidden={isRetracted}
      inert={isRetracted}
    >
      <div className="mx-auto w-full max-w-site px-0 md:px-gutter">
        <div
          className={cn(
            "pointer-events-auto bg-text text-cream",
            // Full bleed and square on a phone — it is the foot of the screen,
            // not an object floating on it. Inset and lifted from `md` up.
            "md:mb-[var(--bar-inset)]",
          )}
          style={{ ["--bar-inset" as string]: DESKTOP_INSET }}
        >
          {/*
            The safe area is added to the padding rather than set as a margin,
            so on a phone with a home indicator the bar's ground runs to the
            bottom of the screen and only its contents are lifted clear.
          */}
          <div
            className="flex items-center gap-4 px-gutter py-3.5 md:gap-8 md:px-8 md:py-5"
            style={{ paddingBottom: "max(0.875rem, env(safe-area-inset-bottom))" }}
          >
            <Facts {...event} closed={closed} />
            <Action title={event.title} bookingHref={event.bookingHref} closed={closed} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * What is being booked.
 *
 * Two readings of the same facts. A phone gets the price and the availability
 * and nothing else — at that width anything more is a paragraph in a bar, and
 * the event's name is already the heading a thumb's length above it. From `md`
 * up, where there is a measure to use, the name, the date and time, the venue
 * and the price sit in a row.
 */
function Facts({
  title,
  startsAt,
  dateLabel,
  startLabel,
  endLabel,
  venueName,
  priceLabel,
  spotsLabel,
  scarce,
  closed,
}: Omit<EventBookingBarProps, "sentinelId" | "bookingHref"> & { closed: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-8">
      {/* --- phone: price, then how many places are left ----------------- */}
      <div className="min-w-0 md:hidden">
        {closed ? (
          <p className="text-action font-medium uppercase tracking-eyebrow text-cream">
            Fully booked
          </p>
        ) : (
          <>
            <p className="text-[1.05rem] font-medium leading-none tracking-[-0.01em] text-cream">
              {priceLabel}
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-fine leading-none text-cream/75">
              {scarce ? (
                <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-pill bg-sage" />
              ) : null}
              {spotsLabel}
            </p>
          </>
        )}
      </div>

      {/* --- md and up: the whole line ------------------------------------ */}
      <div className="hidden min-w-0 flex-1 items-center gap-8 md:flex">
        <p className="min-w-0 truncate text-[1.05rem] font-medium leading-tight tracking-[-0.01em] text-cream">
          {title}
        </p>

        <dl className="flex shrink-0 items-center gap-8">
          <Fact label="Date">
            <time dateTime={startsAt}>{dateLabel}</time>
          </Fact>
          <Fact label="Time">
            <span className="tabular-nums">{startLabel}</span>
            <span aria-hidden> – </span>
            <span className="sr-only">to</span>
            <span className="tabular-nums">{endLabel}</span>
          </Fact>
          {venueName ? (
            <Fact label="Where" className="hidden lg:block">
              {venueName}
            </Fact>
          ) : null}
          {closed ? null : <Fact label="Price">{priceLabel}</Fact>}
        </dl>
      </div>
    </div>
  );
}

function Fact({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-label font-medium uppercase tracking-eyebrow text-cream/70">{label}</dt>
      <dd className="mt-1 whitespace-nowrap text-fine font-medium text-cream">{children}</dd>
    </div>
  );
}

/**
 * The action.
 *
 * A link rather than a button because it goes somewhere — the existing
 * `/events/[slug]/book` route — and the browser should treat it that way: it
 * opens in a new tab on a middle click and shows its destination on hover, as
 * every other way into this flow already does.
 *
 * Sized past the 44px a thumb needs at every width, and labelled with the
 * event's name for a screen reader, since "Book" alone in a bar that follows
 * the page down says nothing about what is being booked.
 */
function Action({
  title,
  bookingHref,
  closed,
}: {
  title: string;
  bookingHref: string;
  closed: boolean;
}) {
  if (closed) {
    return (
      <Link
        href="/events"
        className={cn(
          "group inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap",
          "min-h-11 border border-cream/45 px-5 text-action font-medium uppercase tracking-eyebrow",
          "text-cream transition-colors duration-300 ease-soft hover:border-cream md:px-7",
        )}
      >
        See other dates
        <span
          aria-hidden
          className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
        >
          &#8594;
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={bookingHref}
      aria-label={`Book ${title}`}
      className={cn(
        "group inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap",
        "min-h-11 bg-primary px-5 text-action font-medium uppercase leading-none tracking-eyebrow",
        "text-white transition-colors duration-300 ease-soft hover:bg-primary/90 md:px-8 md:py-5",
      )}
    >
      Book
      <span
        aria-hidden
        className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
      >
        &#8594;
      </span>
    </Link>
  );
}
