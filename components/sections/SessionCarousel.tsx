"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * How wide one session is, as a fraction of the rail.
 *
 * THE NUMBER THAT MAKES THE SECTION READ AS A ROW. At 100% each slide fills
 * the measure exactly, the next one sits entirely off-screen, and the section
 * looks like a single event with some small furniture above it — which is what
 * it looked like, and the reason this was rebuilt. Under 100% the following
 * session is cut by the right edge of the window, and a picture sliced by the
 * frame is the one signal every reader already knows how to read.
 *
 * Wider on a phone than on a desktop because the slide has to stay usable: at
 * 390px, 86% still leaves 55px of the next photograph, which is plenty to see
 * and little enough that the facts below the plate are not squeezed.
 */
const SLIDE_WIDTH = "w-[86%] sm:w-[88%] lg:w-[91%]";

/** "01", "02" — printed copy, so the padding happens once, here. */
const ordinal = (n: number) => String(n).padStart(2, "0");

const TERM = "text-label font-medium uppercase tracking-eyebrow text-text/75";

/**
 * One session, with every value already resolved into the string it renders as.
 *
 * EVERY VALUE ARRIVES FORMATTED, for the reason set out in <EventBookingBar>:
 * lib/workshops.ts holds the session array as well as the formatters, and
 * importing it into a client component to borrow one would pull the whole
 * catalogue into the browser bundle. The section resolves the strings and hands
 * them down, so this file knows nothing but how to compose them.
 */
export interface SessionSlide {
  slug: string;
  /** The existing route — resolved by the section, never built here. */
  href: string;
  title: string;
  /** Printed above the title, and only when it says something the title does not. */
  categoryLabel?: string;
  /** One or two sentences off the session's own excerpt. */
  excerpt: string;
  /** ISO 8601, for the <time> element's own value. */
  startsAt: string;
  /** "Saturday, 11 October". */
  dateLabel: string;
  /** "3:30 PM – 5:30 PM". */
  timeLabel: string;
  /** The mall, as it is signposted. Absent on a session with no venue set. */
  venueName?: string;
  /** The district under it. Only ever rendered beneath a name. */
  venueLocality?: string;
  /** "AED 240". */
  priceLabel: string;
  /** "9 spots available" — the site's own wording, never a number invented here. */
  spotsLabel: string;
  /** True when the existing data says places are running low. */
  scarce: boolean;
  /** True when the existing data says the date is full. */
  closed: boolean;
  /** "Book this session", or the honest alternative on a full date. */
  ctaLabel: string;
  image: { src: string; alt: string; position?: string };
}

/**
 * The upcoming sessions, as one large composition at a time.
 *
 * WHY THIS IS NOT A LIST ANY MORE. The section it replaces set every date as
 * the same split block, stacked down the page with a band of signage between
 * them. It was legible and it read as a schedule — you scanned it the way you
 * scan a timetable, which is exactly the posture that does not end in a
 * booking. One session at a time, given the whole width, asks to be looked at
 * instead of scanned.
 *
 * THE PHOTOGRAPH IS THE ARGUMENT AND THE TYPE IS THE ANSWER. The plate takes
 * seven of twelve columns and the facts sit beside it, vertically centred, in
 * the order someone actually asks them: what is it, what is it like, when,
 * what time, where, what does it cost, is there room — then the one action.
 * Nothing is inside a card: there is no border, no shadow and no rounded box,
 * because a card would turn a composition into a product tile and the whole
 * point is that this is neither.
 *
 * ONE ACTION PER SLIDE. The photograph is not a second link to the same place
 * and there is no secondary button beside the primary one — the way out of the
 * section is a line of type under it, as it has always been.
 *
 * NOTHING HERE INVENTS URGENCY. The availability line is the site's own
 * `spotsLabel`, which says "left" only once a date is genuinely down to its
 * last few and "available" otherwise, and the mark beside it is decorative
 * with the words carrying the meaning. There is no countdown, no badge and no
 * "selling fast".
 *
 * It holds one slide as readily as five: with a single session the counter and
 * the controls are simply not rendered, and what is left is one editorial
 * composition — which is the right answer rather than a degraded one.
 */
export function SessionCarousel({ slides }: { slides: SessionSlide[] }) {
  const [index, setIndex] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const count = slides.length;

  /**
   * Where the rail has to be scrolled to for slide `i` to sit at the gutter.
   *
   * Measured off the live boxes rather than derived from the width above,
   * because the width is a percentage and the gap is not: reading the two
   * rectangles is the only version that cannot drift from what CSS actually
   * did, at any breakpoint, in any font.
   */
  const offsetOf = useCallback((i: number) => {
    const rail = railRef.current;
    const slide = slideRefs.current[i];
    if (!rail || !slide) return 0;
    const pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
    return (
      slide.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft - pad
    );
  }, []);

  /*
    The scroll position is the source of truth now, not a state variable the
    buttons own. A reader can move this rail with a thumb, a trackpad, a shift
    wheel or the Tab key, and none of those go through an onClick — so the
    counter reads the rail rather than the other way round, and the two cannot
    disagree.
  */
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || count < 2) return;
    /*
      Read synchronously rather than inside a rAF. The usual reason to defer
      this work is that a scroll handler runs hot — but the browser already
      throttles scroll events to the frame, the loop is a handful of rectangles
      over a handful of slides, and `setIndex` no-ops when the answer has not
      changed. Deferring bought nothing and cost the one thing that matters:
      behaviour that only works where rAF is running.
    */
    const sync = () => {
      let nearest = 0;
      let best = Infinity;
      for (let i = 0; i < count; i += 1) {
        const distance = Math.abs(offsetOf(i) - rail.scrollLeft);
        if (distance < best) {
          best = distance;
          nearest = i;
        }
      }
      setIndex(nearest);
    };
    rail.addEventListener("scroll", sync, { passive: true });
    return () => rail.removeEventListener("scroll", sync);
  }, [count, offsetOf]);

  if (count === 0) return null;

  /*
    Clamped rather than wrapped, and the counter is why. A carousel that loops
    silently from the last slide to the first tells a reader who is watching
    "02 / 02" that they have somehow gone forwards into the beginning; clamping
    means the position on screen and the position in the list always agree.
  */
  /*
    Buttons drive the rail; the rail drives the state. `scrollLeft` rather
    than scrollIntoView, which also scrolls the page vertically when the
    section is only partly on screen — which it usually is, this being a tall
    composition.
  */
  const goTo = (next: number) => {
    const rail = railRef.current;
    const target = Math.min(count - 1, Math.max(0, next));
    if (!rail) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollTo({ left: offsetOf(target), behavior: reduced ? "auto" : "smooth" });
  };
  const go = (delta: number) => goTo(index + delta);

  /*
    THE SWIPE HANDLER IS GONE, AND THAT IS THE POINT. This used to be a
    translated track with a 48px threshold reimplementing the one gesture the
    platform already does better: no momentum, no rubber-banding, no partial
    drag, and nothing at all for a trackpad or a shift-wheel. A snapping scroll
    container gets all of that for free and is genuinely scrollable rather than
    merely clickable, which is the other half of looking scrollable.
  */

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Upcoming sessions"
      className="mt-12 md:mt-16 lg:mt-20"
    >
      {/*
        Announced only when it changes. A live region does not speak its own
        initial contents, so this is silent on load and says which session has
        arrived on every move after that — including a swipe, which otherwise
        changes the whole screen without a word.
      */}
      <p aria-live="polite" className="sr-only">
        {`Session ${index + 1} of ${count}: ${slides[index]?.title ?? ""}`}
      </p>

      {count > 1 ? (
        <Controls index={index} count={count} slides={slides} onGo={go} onGoTo={goTo} />
      ) : null}

      {/*
        THE RAIL. It bleeds the gutter on both sides and puts it back as
        padding, so the first slide still starts on the page's own left margin
        while the row itself runs to the edges of the window — which is what
        lets the next session be cut by the screen rather than by a container
        nobody can see.

        `scroll-px-gutter` is what `snap-start` snaps to, so a snapped slide
        lands on that same margin rather than hard against the window edge.

        The scrollbar is hidden because this is an editorial composition and a
        grey trough under it reads as a browser part rather than a page part.
        Nothing is lost: the cut-off photograph, the arrows and the counter all
        say the same thing, and the gesture works whether or not a bar is drawn.
      */}
      <div
        ref={railRef}
        className={cn(
          "-mx-gutter flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain px-gutter scroll-px-gutter md:gap-6 lg:gap-8",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.slug}
            ref={(node) => {
              slideRefs.current[i] = node;
            }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            /*
              NOT `inert` ANY MORE, and that is a consequence of the rebuild
              rather than an oversight. A translated track parked its other
              slides off-screen, where a live link in the tab order would send
              a keyboard reader somewhere they could not see — so they had to
              be switched off. Every slide on a rail is on the page and only
              ever a scroll away, so switching them off would now be the bug:
              tabbing into one simply brings it into view, which is the same
              thing a thumb does.
            */
            className={cn(
              SLIDE_WIDTH,
              "shrink-0 snap-start transition-opacity duration-500 ease-soft motion-reduce:transition-none",
              /*
                The neighbour is dimmed rather than drawn at full strength: it
                has to read as "the next one" rather than as a second thing
                competing with the one being looked at. 65% is enough to see
                what it is and not enough to argue with the slide in front.
              */
              i === index ? "opacity-100" : "opacity-65",
            )}
          >
            <Slide slide={slide} />
          </div>
        ))}

        {/*
          Trailing air, and it is structural rather than decorative.

          `snap-mandatory` insists on resting at a snap point, and the last
          slide's snap point sits at the gutter — a position the rail cannot
          physically reach, because past the final slide there is nothing left
          to scroll. Measured at 1440 it was 95px short. An engine asked to
          rest somewhere unreachable is being asked to choose, and the choice
          some of them make is to snap back to the previous slide, which makes
          the last session unreachable by scrolling at all.

          The spacer is exactly the leftover the slide width does not use, so
          the last session lands on the same left margin as the first one and
          the row ends on page ground rather than on a half-cut photograph.
        */}
        <div aria-hidden className="w-[14%] shrink-0 sm:w-[12%] lg:w-[9%]" />
      </div>
    </div>
  );
}

/**
 * One session, as one object.
 *
 * WHY IT IS A PANEL NOW. The photograph and the facts used to be two blocks
 * with a column of air between them, laid straight onto the page. On a rail
 * that shows the edge of the next session, that arrangement cannot be read:
 * the type sat between its own photograph and a stranger's, with nothing
 * saying which one it belonged to. The client saw exactly that and said so.
 *
 * One surface fixes it. The picture is flush to three edges of the panel, the
 * White Rock field beside it carries the type, and the two meet on a single
 * interior edge — so everything inside the boundary is one session and the cut
 * photograph at the window's edge is plainly a different one.
 *
 * NOT A CARD, AND THE DIFFERENCE IS DELIBERATE. No border, no shadow, no
 * floating corner radius around a small picture: the panel takes the site's own
 * 8px, the photograph bleeds to its edges rather than sitting inset within it,
 * and the type side is given the kind of padding a spread has. A card frames a
 * product; this is a composition that happens to have an edge.
 *
 * On a phone they stack in the order they are read anyway — picture, name,
 * when, where, what it costs, book — inside the same boundary.
 */
function Slide({ slide }: { slide: SessionSlide }) {
  return (
    /*
      LIGHT SAGE, at the client's ask — the brand field at full strength rather
      than the warm neutral this panel used to take.

      Every ink on it was re-measured against the darker ground before the
      swap, because a panel that changes colour changes every contrast on it:
      the title and the facts hold 9.07:1, the excerpt 5.37 and the labels
      4.71, all past the 4.5 they owe, and the Deep Lilac action reads 3.83
      against the field it sits on, past the 3:1 an edge owes.
    */
    <div className="group/slide grid grid-cols-12 overflow-hidden rounded-sm bg-sage">
      {/*
        `aspect-auto` from `lg` is what makes the two halves one object. With a
        fixed ratio the picture ended at its own height and left a band of the
        panel's ground under it whenever the type ran longer; released, the
        grid row is as tall as the type and `fill` covers whatever that turns
        out to be. The floor is there so a short session cannot collapse the
        picture into a strip.
      */}
      <div className="relative col-span-12 aspect-[4/3] sm:aspect-[3/2] lg:col-span-7 lg:aspect-auto lg:min-h-[30rem]">
        <Image
            src={slide.image.src}
            alt={slide.image.alt}
            fill
            sizes="(min-width: 1024px) 58vw, 100vw"
            style={{ objectPosition: slide.image.position }}
            priority={false}
            loading="lazy"
            /*
              A gentle lift on hover, over the site's own editorial curve.
              Three percent and 700ms: enough that the photograph answers, not
              enough that anything appears to move. Held behind `motion-safe`,
              so a reader who has asked for stillness gets it.
            */
          className={cn(
            "object-cover transition-transform duration-700 ease-editorial",
            "motion-safe:group-hover/slide:scale-[1.03]",
          )}
        />
      </div>

      {/*
        The measure is the padding now, not a grid gap: a panel's type is set
        in from its own edges, and `justify-center` holds it against the
        picture's height rather than letting it ride at the top of a tall row.
      */}
      <div className="col-span-12 flex flex-col justify-center p-7 md:p-9 lg:col-span-5 lg:p-10">
        {/* Only when it says something the title does not. */}
        {slide.categoryLabel ? <p className={TERM}>{slide.categoryLabel}</p> : null}

        <h3
          className={cn(
            "font-light uppercase leading-[1.05] tracking-[-0.02em] text-text",
            slide.categoryLabel ? "mt-4" : "",
            "text-[1.9rem] md:text-[2.25rem] lg:text-[2rem] xl:text-[2.4rem]",
          )}
        >
          {slide.title}
        </h3>

        <p className="mt-5 max-w-[32rem] text-body leading-[1.8] text-text/80">{slide.excerpt}</p>

        {/*
          The three practical facts, labelled. This is the whole reason the
          business exists in the shape it does — a session is a time and a mall,
          and someone deciding is matching both against their own week.
        */}
        {/*
          One column, two, three, back to one, then two — and every step is a
          measured fit rather than a guess. These are the three facts the whole
          section exists to make obvious, so none of them is allowed to be the
          most cramped thing on the slide:

            - two columns on a 390px phone broke "Sun 11 October 2026" in half;
            - three across the narrow type column at `lg` did the same, and
              put the venue on three lines;
            - two across it at exactly 1024, where the column is 381px, still
              wrapped "Times Square Center".

          So the column stacks them again from `lg` and only pairs them once
          `xl` gives the measure back.
        */}
        <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-2">
          <Fact term="Date">
            <time dateTime={slide.startsAt}>{slide.dateLabel}</time>
          </Fact>
          <Fact term="Time">{slide.timeLabel}</Fact>
          {/* Venue is optional on the data model — see {@link Venue}. The mall
              is set loud and the district quiet under it, as everywhere else on
              the site: "can I get there" is answered by the name. */}
          {slide.venueName ? (
            <Fact term="Location">
              {slide.venueName}
              {slide.venueLocality ? (
                <span className="mt-1 block text-fine text-text/75">{slide.venueLocality}</span>
              ) : null}
            </Fact>
          ) : null}
        </dl>

        {/* `border-text/15`, not `border-line`: on White Rock the line token
            is very nearly the ground and the rule disappears. Same mix the
            basket's own dividers use, on the same field. */}
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-text/15 pt-6">
          <p className="text-lead font-medium tabular-nums text-text">{slide.priceLabel}</p>
          <p className="flex items-center gap-2 text-fine text-text/75">
            {slide.scarce ? (
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-pill bg-terracotta" />
            ) : null}
            {slide.spotsLabel}
          </p>
        </div>

        <Link
          href={slide.href}
          aria-label={`${slide.ctaLabel}: ${slide.title}`}
          className={cn(
            "group/cta mt-8 inline-flex w-full min-h-11 items-center justify-center gap-2.5 rounded-sm",
            "px-8 py-4 text-action font-medium uppercase leading-none tracking-eyebrow",
            "transition-colors duration-300 ease-soft sm:w-auto",
            slide.closed
              ? "border border-text/35 text-text hover:border-text/60 hover:bg-text/5"
              : "press-in bg-primary text-on-primary hover:bg-primary/90",
          )}
        >
          {slide.ctaLabel}
          <span
            aria-hidden
            className={cn(
              "transition-transform duration-500 ease-editorial",
              // Answers to the slide as well as to itself, so the action reads
              // as part of the thing being hovered rather than as furniture.
              "motion-safe:group-hover/cta:translate-x-1",
              "motion-safe:group-hover/slide:translate-x-1",
            )}
          >
            &#8594;
          </span>
        </Link>
      </div>
    </div>
  );
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className={TERM}>{term}</dt>
      <dd className="mt-2 text-body leading-snug text-text">{children}</dd>
    </div>
  );
}

/**
 * The carousel's own chrome: where you are, what is next, and the two moves.
 *
 * ABOVE THE COMPOSITION, NOT UNDER IT — AND THAT IS THE WHOLE POINT.
 *
 * These sat below the slide, and below the slide is below the fold: one
 * session is a full-height photograph beside a column of facts, so on a laptop
 * the controls were off the bottom of the window and the section simply read
 * as a single event. Nobody scrolls to look for a control they have no reason
 * to believe exists. Moved up, they are the first thing under the section
 * heading and the carousel announces itself before it has to be discovered.
 *
 * Still off the photograph. The plate stays free of furniture, and the ink
 * here is measured against a known ground rather than against whatever the
 * client's next image happens to be.
 *
 * FOUR SIGNALS, AND THE ONE THAT WAS MISSING IS THE ONE THAT WORKED. The
 * counter says where you are, the rules say how many there are, the arrows say
 * which way to go, and the name of the next session says what is over there.
 * All four are type, all four are small, and all four sit in a strip above a
 * composition that is most of a screen tall — so the section still read as a
 * single event with some furniture above it, which is exactly what the client
 * reported.
 *
 * The note here used to claim that naming the next session was "the whole of
 * what a peeking half-slide is usually there to say". It is not, and that was
 * the mistake: a line of 13px type is a fact you have to read, where a
 * photograph cut off by the edge of the window is a thing you see without
 * reading anything. The rail below now does that, and this strip went from
 * carrying the whole message to labelling it.
 */
function Controls({
  index,
  count,
  slides,
  onGo,
  onGoTo,
}: {
  index: number;
  count: number;
  slides: SessionSlide[];
  onGo: (delta: number) => void;
  onGoTo: (next: number) => void;
}) {
  const upNext = slides[index + 1];

  return (
    <div className="mb-9 flex items-center justify-between gap-5 border-b border-line pb-5 md:mb-12">
      <div className="flex min-w-0 items-center gap-5">
        {/* Decorative: the live region and each slide's own label carry the
            position to anyone not looking at it. */}
        <p
          aria-hidden
          className="shrink-0 text-label font-medium tabular-nums tracking-eyebrow text-text"
        >
          {ordinal(index + 1)}
          <span className="text-text/70"> / {ordinal(count)}</span>
        </p>

        {/*
          One rule per session, and each one is a way in.

          Rules rather than dots, for the reason the hero gives: a dot is a
          shape with no meaning, where a rule that fills is the mark this site
          already draws under every link. Four of them side by side say "there
          are four of these" at a glance, which is the one thing "01 / 04"
          cannot do without being read.
        */}
        <div className="flex min-w-0 items-center gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.slug}
              type="button"
              onClick={() => onGoTo(i)}
              aria-label={`Show ${slide.title}`}
              aria-current={i === index ? "true" : undefined}
              /*
                The rule is the design; the padding is what makes it pressable.

                Measured, because the first pass was not: `p-2.5` around a 1px
                rule is a 21px target, under the 24px a control owes and a long
                way under a thumb. 20px of vertical padding takes it to 41px,
                and the negative margin pulls all of it back out of the row so
                the rules still sit where they are drawn.
              */
              className="group -mx-2 -my-5 shrink-0 px-2 py-5"
            >
              <span
                aria-hidden
                className={cn(
                  "block h-px w-7 transition-colors duration-500 ease-soft md:w-9",
                  i === index ? "bg-text" : "bg-text/25 group-hover:bg-text/60",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {upNext ? (
          <p aria-hidden className="hidden max-w-[16rem] truncate text-fine text-text/70 lg:block">
            Next &middot; {upNext.title}
          </p>
        ) : null}
        {/*
          The one place the section says outright that it is a row. It sits
          with the arrows rather than under the heading because that is where
          someone looks once they have understood there is more than one, and
          it is hidden on a phone, where the gesture is the thumb's and a
          desktop instruction would only be in the way.
        */}
        <p aria-hidden className="hidden text-fine text-text/70 xl:block">
          Scroll or drag
        </p>
        <div className="flex items-center gap-1">
          <Arrow direction="previous" onClick={() => onGo(-1)} disabled={index === 0} />
          <Arrow direction="next" onClick={() => onGo(1)} disabled={index === count - 1} />
        </div>
      </div>
    </div>
  );
}

function Arrow({
  direction,
  onClick,
  disabled,
}: {
  direction: "previous" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  const isPrevious = direction === "previous";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${isPrevious ? "Previous" : "Next"} session`}
      /*
        A ruled circle rather than a bare glyph. The arrows were two characters
        at 70% ink floating at the end of a line of type, which is a shape a
        reader has to decide is a button; a bounded target is one they already
        know is. The border is the palette's own hairline, so this is the same
        material as every other rule on the page.
      */
      className={cn(
        "flex size-11 items-center justify-center rounded-pill border transition-colors duration-300 ease-soft",
        disabled
          ? "cursor-not-allowed border-line text-text/30"
          : "border-text/20 text-text/70 hover:border-text/60 hover:text-text",
      )}
    >
      <span aria-hidden className="text-base leading-none">
        {isPrevious ? "←" : "→"}
      </span>
    </button>
  );
}
