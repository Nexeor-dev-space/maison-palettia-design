"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { Container } from "@/components/ui/Container";
import { HERO_CAROUSEL } from "@/lib/constants";
import { cn } from "@/lib/utils";

/*
  PARKED — not mounted anywhere right now.

  Four client photographs rotating behind the homepage statement, with rule
  indicators and a per-slide eyebrow and headline. The client asked for a
  single looping film instead, so <Hero> carries the video directly and this
  is unused; HERO_CAROUSEL in lib/constants.ts is unused with it.

  Kept rather than deleted, as <WorkshopFeature> and <CreativeExperiences>
  were. The rotation, the reduced-motion handling and the live-region wiring
  are all worked out, and a photographic carousel is the obvious treatment if
  a page ever wants one — the events listing or /about.
*/

/** How long each photograph holds before the next one begins to arrive. */
const HOLD_MS = 6000;

/** The crossfade itself. Long and slow: a hero should breathe, not blink. */
const FADE_MS = 1200;

/**
 * The hero's rotating photograph, and the controls for it.
 *
 * WHAT IS ON SCREEN. Four client-supplied photographs from
 * public/images/hero-carousel/, full bleed, one at a time. The images are the
 * hero — they fill the section, they are not in a card, they have no coloured
 * plate behind them, and the only thing laid over them is the readability
 * gradient the <Hero> shell already carried for its type. See HERO_CAROUSEL in
 * lib/constants.ts for how each file was matched to an activity.
 *
 * WHY A CLIENT COMPONENT. The shell around it is still a server component;
 * only this layer needs state. Keeping the split means the heading, the mark
 * and the link are server-rendered as they were.
 *
 * ALL FOUR ARE MOUNTED AND STACKED, not swapped in and out. A carousel that
 * unmounts the outgoing slide cannot cross-fade — the old picture is gone
 * before the new one has decoded, and the hero flashes its own background
 * colour on every turn. Stacked, the transition is one opacity change and the
 * section is never empty.
 *
 * WHAT IT DOES FOR SOMEONE NOT WATCHING IT. It stops. Auto-advance pauses on
 * hover, on keyboard focus anywhere inside, and while the tab is in the
 * background; it never starts at all under `prefers-reduced-motion`, where the
 * fade is dropped too and the controls become the only way to move. An
 * animation that runs forever under the reader's hand is the thing that makes
 * carousels unusable, and none of this costs the visitor who simply wants to
 * look at the first picture.
 */
export function HeroCarousel({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  const count = HERO_CAROUSEL.length;
  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  /*
    Auto-advance.

    `matchMedia` is read inside the effect rather than during render: it is a
    browser API, it would differ between the server and the first paint, and
    this is exactly the kind of value that has to be asked for after mount.

    The interval is rebuilt whenever `paused` or `index` changes, which also
    gives the right behaviour when someone picks a slide by hand — the timer
    restarts from that moment instead of cutting their choice short.
  */
  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % count), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, count]);

  /*
    Stop while the tab is not being looked at.

    Without this the carousel keeps turning in a background tab and the visitor
    comes back to a slide they never chose, having missed the rest.
  */
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div
      ref={regionRef}
      aria-roledescription="carousel"
      aria-label="Creative activities at Maison Palettia"
      /*
        A flex column that ends at the foot, not just a positioned box.

        The section around it is `flex flex-col justify-end`, which is what
        holds the statement at the bottom of the screen — but this element is
        `absolute`, so it is out of that flow and its own children were not
        being pushed anywhere. It has to repeat the rule for the content it now
        owns, or the whole block rides up to the top of the hero.
      */
      className="absolute inset-0 flex flex-col justify-end"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        // Only resume once focus has actually left the carousel, not while it
        // is moving between the controls inside it.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      {HERO_CAROUSEL.map((slide, i) => {
        const active = i === index;
        return (
          <div
            key={slide.src}
            // `aria-hidden` on the inactive slides so a screen reader is not
            // read four alt texts for one hero.
            aria-hidden={!active}
            className={cn(
              "absolute inset-0 transition-opacity ease-soft motion-reduce:transition-none",
              active ? "opacity-100" : "opacity-0",
            )}
            style={{ transitionDuration: `${FADE_MS}ms` }}
          >
            <Image
              src={slide.src}
              alt={active ? slide.alt : ""}
              fill
              // Only the first is the LCP candidate. The rest are ordinary
              // loads so they do not compete with it for bandwidth.
              priority={i === 0}
              // Full bleed at every width, so the browser should pick by
              // viewport rather than by any layout column.
              sizes="100vw"
              style={{ objectPosition: slide.position }}
              className="object-cover"
            />
          </div>
        );
      })}

      {/*
        The foot: the statement and the carousel's own caption, in one flow.

        THEY SHARE A CONTAINER, AND THEY HAVE TO. Both were absolutely
        positioned to the bottom at first, with matching padding, and that only
        ever works while there is width for two things on one line. At 390
        there is not — the statement runs the full measure — so the caption
        landed on top of "EXPLORE EVENTS", and lifting it clear only moved the
        collision onto the second line of the heading. Absolute positioning
        cannot avoid a block whose height it does not know.

        In flow it cannot collide at any width: a column on a phone, with the
        caption under the statement; one row from `md`, statement left and
        caption right, both sitting on the same baseline. That is the layout
        the absolute version was trying to approximate.

        The statement arrives as `children` — it is server-rendered in <Hero>
        and passed in, so nothing about the heading, the mark or the link moved
        into this client component.
      */}
      <Container className="relative z-10 pb-12 md:pb-16 lg:pb-20">
        <div className="flex flex-col gap-9 md:flex-row md:items-end md:justify-between md:gap-12">
          {/*
            ONE BLOCK, NOT TWO.

            This used to be a static cluster on the left — mark, a fixed
            statement, the link — with the slide's own name and rules floating
            away on the right. Two clusters at the same height, only one of
            which changed, so the picture turned underneath copy that never
            answered it and the eye had two places to be. The name is now the
            eyebrow of the block it belongs to, and the statement changes with
            the photograph, which is the only thing that makes a hero carousel
            worth having rather than a slideshow behind a poster.

            `aria-live` sits on the wrapper rather than on the line, so a
            screen reader is told once, politely, that the pair changed —
            rather than twice, once per element, out of order.
          */}
          <div className="max-w-[46rem]" aria-live="polite" aria-atomic="true">
            <p className="text-label font-medium uppercase tracking-eyebrow text-cream/90">
              {HERO_CAROUSEL[index].activity}
            </p>

            {/*
              Keyed on the index so the line re-runs its own arrival each time
              the slide turns; without the key React updates the text in place
              and the words change with no gesture at all, which reads as a
              glitch rather than as a turn.
            */}
            {/*
              Three lines are reserved whether or not this slide needs them.

              Measured at 1440: three of the four statements set three lines
              and "Wax, wick and colour" sets two. The block is anchored to the
              foot, so without this the whole stack lifted 54px every time the
              short slide came round and dropped back when it left — a hero
              that twitches once every six seconds is worse than one with a
              little air under a short line.

              `3.12em` is three of this element's own 1.04 leading, so it
              tracks the clamped size at every breakpoint rather than pinning a
              pixel height that only holds at one. If the copy changes, count
              the lines on the rendered element — an absolutely positioned
              probe shrink-wraps to its containing block and will under-report.
            */}
            <p
              key={index}
              className="mt-5 min-h-[3.12em] animate-rise text-h1 font-light uppercase leading-[1.04] tracking-[-0.02em] text-cream md:mt-6"
            >
              {HERO_CAROUSEL[index].statement}
            </p>

            {children}
          </div>

          {/*
            Rules, not dots: a dot is a shape with no meaning and four of them
            is a widget. A rule that fills is the device the rest of the site
            draws under every link. They are the only chrome left in the hero.
          */}
          <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
            <div className="flex items-center gap-2.5">
              {HERO_CAROUSEL.map((slide, i) => (
                <button
                  key={slide.src}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show ${slide.activity}`}
                  aria-current={i === index ? "true" : undefined}
                  /*
                    The rule is the design; the padding is what makes it usable
                    on a phone, and the negative margin takes the padding back
                    out of the layout so the row still measures as a row of
                    rules.

                    Measured rather than assumed: `p-2.5` around a 1px rule is
                    a 21px target, not the 44 this comment used to claim. 20px
                    of vertical padding gives 41px.
                  */
                  className="group -mx-2 -my-5 px-2 py-5"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "block h-px w-8 transition-colors duration-500 ease-soft md:w-10",
                      i === index ? "bg-cream" : "bg-cream/40 group-hover:bg-cream/70",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
