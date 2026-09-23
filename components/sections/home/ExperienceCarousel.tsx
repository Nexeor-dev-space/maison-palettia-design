"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ExperienceCard } from "@/components/events/ExperienceCard";
import styles from "@/components/sections/home/ExperienceCarousel.module.css";
import { cn } from "@/lib/utils";
import type { CreativeExperience } from "@/lib/experiences";

/**
 * The seven activities, as a carousel you paint.
 *
 * ==========================================================================
 * WHY A CAROUSEL AND NOT A GRID
 * ==========================================================================
 *
 * The deck runs these as two static rows because it is a PDF and that is what
 * a PDF can do. A website can do the thing the deck was reaching for: put the
 * activities on a track you push through, so discovering the seventh feels
 * like rummaging rather than like reaching the end of a table. That is the
 * difference between taking the deck as a reference and reproducing it.
 *
 * THE PAINT. A card rests as the photograph under a flat wash of one brand
 * colour — unpainted. Reach it and a splash opens from the middle and the
 * picture comes through in full colour. The splash is the deck's own cut-out
 * used as a CSS mask, so the thing growing over the card is the studio's paint
 * mark rather than a circle. See ./ExperienceCarousel.module.css.
 *
 * Each card takes the next colour in the brand's own order, so the track reads
 * as a row of swatches before anything is touched — which is the palette the
 * place is named after.
 *
 * SCROLLING IS THE NATIVE KIND. The track is an overflow container with scroll
 * snapping, so a trackpad, a touch drag and a keyboard all work without this
 * component doing anything. The two buttons are for pointer users who have
 * neither, and they move the track by one card's width, read off the DOM
 * rather than assumed.
 */

/*
  THE PAINTS — and Charcoal Slate is deliberately not one of them.

  It was in this list, and card four came out looking switched off rather than
  painted: at 82% multiply a near-black is not a wash, it is a blackout, and
  the photograph under it stopped being legible while its neighbours were
  merely tinted. Charcoal is the site's ink — type and dark fields — and the
  three brand colours that behave like paint, plus Light Sage, are what a
  palette is actually made of.

  Light Sage is out for the opposite reason: the section's own ground is pale
  green, so a sage-washed card sinks into the page instead of sitting on it.

  Three, then, and three divides seven without ever putting the same colour
  next to itself — 1 4 7 lilac, 2 5 terracotta, 3 6 lavender.
*/

export function ExperienceCarousel({ experiences }: { experiences: CreativeExperience[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /*
    ==================================================================
    THE CARDS ARE DEALT ONTO THE TABLE
    ==================================================================

    This was the one section on the home page with no entrance at all — the
    cards were simply there. They are the page's most hand-made object, each
    one already rotated a degree or two and every other one dropped, so
    arriving in sequence is the gesture they were built for.

    WHY AN OBSERVER AND NOT A `view()` TIMELINE, which is what the brand marks
    use. The track is `overflow-x: auto`, and that makes it a scroll
    container: a view timeline inside one resolves against THAT scrollport
    rather than the page, and a card sitting still inside a track that does
    not scroll vertically reports as permanently covered, so the animation
    sits finished and nothing ever plays. Measured the same way on the doodles
    before this. One observer on the track, against the viewport, has no such
    problem.

    TWO FLAGS, NOT ONE. `armed` is set on mount and is what hides the cards in
    the first place, so a visitor without JavaScript — or before hydration —
    sees the cards rather than an empty rail. `shown` is what plays them.
  */
  /*
    THE FLAGS ARE WRITTEN STRAIGHT TO THE NODE, NOT HELD IN STATE.

    Nothing React renders depends on them — the whole deal is CSS keyed off
    two data attributes — so putting them through `useState` would buy two
    extra renders of a seven-card list and trip
    `react-hooks/set-state-in-effect` on the way. The effect owns the
    attributes and the stylesheet does the rest.

    `armed` is what HIDES the cards, so it is only ever set once this has run
    on the client: before hydration, and with JavaScript off, the rail is
    simply visible. `shown` is what plays them.
  */
  useEffect(() => {
    const el = track.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      el.dataset.shown = "true";
      return;
    }

    el.dataset.armed = "true";
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        el.dataset.shown = "true";
        io.disconnect();
      },
      // A little before the rail is properly on screen, so the first card is
      // already moving by the time it is worth looking at.
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Which arrows are usable, from the track itself rather than from a count. */
  const report = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    report();
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [report]);

  const nudge = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    /* One card plus its gap, measured — card widths change at every breakpoint. */
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <ul
        ref={track}
        onScroll={report}
        /*
          `scroll-px` matches the gutter so a snapped card never sits under the
          page's edge, and the last child gets a spacer so the seventh card can
          reach the left rail like every other one.
        */
        className={cn(
          /*
            `gap-8` at lg, not `gap-5`. The cards are rotated, so each one is
            wider than its box by however far its corners swing; 20px was less
            than two neighbours leaning together spend, which is why the third
            card sat on the second. See the pivot note in the stylesheet.
          */
          "flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain pb-4 pt-2 lg:gap-8",
          styles.track,
          "scroll-px-gutter",
        )}
      >
        {experiences.map((experience, i) => (
          /*
            THE CARD IS SHARED WITH /events NOW — see <ExperienceCard>. The
            angle, the paint, the flood, the numeral and the caption all moved
            there with it, because the walk-in listing was drawing its own
            version of the same seven activities.

            `as="li"` because the deal below selects `[data-armed] > [data-card]`,
            a direct-child rule: in this track the card has to BE the list item
            rather than sit inside one.

            What stayed here is WHERE it sits: the width at each breakpoint,
            the snap, and the drop on every other card. `gap-8` at lg is part
            of that — the cards are rotated, so each is wider than its box by
            however far its corners swing, and 20px was less than two
            neighbours leaning together spend.
          */
          <ExperienceCard
            key={experience.slug}
            experience={experience}
            index={i}
            sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 29vw, (min-width: 640px) 44vw, 74vw"
            as="li"
            className={cn(
              "w-[74%] shrink-0 snap-start sm:w-[44%] lg:w-[29%] xl:w-[22%]",
              i % 2 === 0 ? "lg:mt-0" : "lg:mt-7",
            )}
          />
        ))}
        {/* Lets the last card snap to the rail instead of stopping short. */}
        <li aria-hidden className="w-px shrink-0 sm:w-[20%] lg:w-[8%]" />
      </ul>

      {/*
        Pointer-only. A keyboard reaches every card by tabbing and a touch
        screen drags the track, so these are the one input that has neither —
        and they are `aria-hidden` rather than labelled controls for that
        reason: announcing them would offer a screen reader a second way to do
        what Tab already does.
      */}
      {/*
        `pr-gutter`, because this row is the one thing in the carousel that
        must NOT bleed. <ExperienceDiscovery> wraps the track in `pl-gutter`
        alone on purpose — the cards run off the right of the screen so a
        visitor can see the track continues — and `justify-end` inside that
        wrapper put these two buttons hard against the edge of the display
        with nothing beside them. Restating the same token here lands them on
        the section's right rail, level with the heading above, which is the
        line every other element on the sheet already ends at.
      */}
      <div aria-hidden className="mt-2 hidden justify-end gap-3 pr-gutter lg:flex">
        {([-1, 1] as const).map((direction) => (
          <button
            key={direction}
            type="button"
            tabIndex={-1}
            onClick={() => nudge(direction)}
            disabled={direction === -1 ? atStart : atEnd}
            className={cn(
              // Filled, not outlined. These sit on the sheet's own Light
              // Sage, so a sage button was only ever visible because of the
              // charcoal rectangle around it; Deep Lilac is the one brand
              // colour that clears the paper on its own (3.83:1).
              "grid size-11 place-items-center rounded-pill bg-primary text-on-primary",
              "transition-colors duration-300 ease-soft hover:bg-text",
              "disabled:cursor-default disabled:opacity-30 disabled:hover:bg-primary",
            )}
          >
            <span className="text-lg leading-none">{direction === -1 ? "←" : "→"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
