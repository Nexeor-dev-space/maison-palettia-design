"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "@/components/sections/home/ExperienceCarousel.module.css";
import { INK } from "@/components/sections/hero/composition";
import { cn } from "@/lib/utils";
import { EXPERIENCE_KIND_LABEL, type CreativeExperience } from "@/lib/experiences";

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
const WASH = [INK.lilac, INK.terracotta, INK.lavender];

export function ExperienceCarousel({ experiences }: { experiences: CreativeExperience[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

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
          "scroll-px-gutter [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {experiences.map((experience, i) => {
          const paint = WASH[i % WASH.length];
          /*
            THE HAND-PLACED RHYTHM, and the reason this no longer reads as a
            slide. Seven identical plates in a straight line is what a page
            that cannot move has to do; a website can set them down the way a
            person would. Every other card drops a little and each one rests at
            a slight angle, both derived from the index so the track is stable
            between renders rather than random on every paint.

            The angle is under two degrees and straightens as you reach the
            card — enough to read as placed by hand, nowhere near enough to
            look like a mistake, and it answers the client's standing note that
            uncontrolled movement "doesn't look good or smooth".
          */
          const tilt = (i % 2 === 0 ? -1 : 1) * (1.1 + (i % 3) * 0.35);
          const drop = i % 2 === 0 ? 0 : 1;

          return (
            <li
              key={experience.slug}
              className={cn(
                styles.card,
                "group w-[74%] shrink-0 snap-start sm:w-[44%] lg:w-[29%] xl:w-[22%]",
                drop ? "lg:mt-7" : "lg:mt-0",
              )}
              style={{ "--tilt": `${tilt}deg` } as React.CSSProperties}
            >
              <Link href={`/events/${experience.slug}`} className="block focus-visible:outline-none">
                <span
                  className={cn(
                    styles.frame,
                    /*
                      ONE ASPECT, NOT TWO. Mixing 3:4 and 4:5 across a row that
                      is already staggered put the seven names at four
                      different heights, and a row you have to re-find the
                      baseline of on every card is harder to scan than the
                      grid it replaced. The tilt and the drop carry the
                      hand-placed feeling on their own; the frame stays one
                      shape so the captions land on two lines rather than four.
                    */
                    /*
                      NO STROKE. The frame carried a 2.5px Charcoal outline, a
                      device off the deck's title plates, and at seven cards it
                      drew a hard cage around every photograph. The pictures
                      hold their own edges — the rounded corner and the paint
                      are the card.
                    */
                    "aspect-[3/4] w-full rounded-[1.25rem] bg-cream",
                    "group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-sage",
                  )}
                  /*
                    THE BRUSH. This is what was missing: the cards carried the
                    splash but never told <CursorLayer> they were paintable, so
                    the pointer stayed an arrow over the one section of the site
                    whose whole idea is painting. `data-paint` turns it into the
                    studio's brush and `--paint` loads it with this card's own
                    colour — the same colour the splash is about to open in, so
                    the brush in your hand is the paint you are applying.
                  */
                  data-paint
                  style={{ "--paint": paint } as React.CSSProperties}
                >
                  {/*
                    ONE PICTURE, NOT THREE LAYERS. This was the photograph, a
                    flat brand-colour wash over all of it, and a second copy of
                    the same photograph revealed through a growing mask — which
                    read as a dark overlay sliding off on hover. It also fetched
                    every activity image twice. The paint rising from the foot
                    is the whole interaction now.
                  */}
                  {experience.image ? (
                    <Image
                      src={experience.image.src}
                      alt={experience.image.alt}
                      fill
                      sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 29vw, (min-width: 640px) 44vw, 74vw"
                      style={{ objectPosition: experience.image.position ?? "50% 50%" }}
                      className={styles.base}
                    />
                  ) : null}

                  {/*
                    The flood: the card's own colour thrown up over the lower
                    half, torn along the top with dabs scattered off it, and
                    solid below so no picture shows through. One masked layer
                    — see ./ExperienceCarousel.module.css.
                  */}
                  <span aria-hidden className={styles.flood} />

                  {/*
                    Rides in on the paint. `aria-hidden` and a span rather than
                    a link — the card is already one anchor to this page, and
                    the name above is what a screen reader announces.
                  */}
                  <span
                    aria-hidden
                    className={cn(
                      styles.action,
                      "inline-flex items-center gap-2 whitespace-nowrap rounded-pill",
                      "bg-cream px-5 py-2.5 text-label font-semibold uppercase tracking-eyebrow text-text",
                    )}
                  >
                    View details
                    <span className="text-[0.9em] leading-none">&#8594;</span>
                  </span>

                  {/*
                    THE NUMERAL REPLACES THE BADGE CHIP. A sticker in the corner
                    of every card is the deck's device and says the same word
                    seven times; the count says where you are in a row of seven,
                    which is the thing a track actually needs. The kind is still
                    printed — in words, under the name, where it is read rather
                    than decoded.
                  */}
                  <span
                    aria-hidden
                    className={cn(
                      styles.numeral,
                      "absolute left-4 top-3 z-10 text-[2.25rem] font-bold leading-none tabular-nums",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>

                {/*
                  Left-aligned, not centred. A centred caption under a centred
                  plate is a slide; a name set to the same left edge as the
                  picture reads as an entry in a list you are scrolling.
                */}
                <span className="mt-4 block text-[1.0625rem] font-semibold leading-snug text-text transition-colors duration-300 ease-soft group-hover:text-primary">
                  {experience.name}
                </span>

                <span className="mt-1.5 flex items-center gap-2 text-fine text-text/75">
                  <span
                    aria-hidden
                    className="h-2 w-2 shrink-0 rounded-pill"
                    style={{ backgroundColor: paint }}
                  />
                  {experience.status ?? EXPERIENCE_KIND_LABEL[experience.kind]}
                </span>
              </Link>
            </li>
          );
        })}
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
