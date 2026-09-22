"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import type { DoodleName } from "@/components/sections/hero/doodles";
import styles from "@/components/sections/home/SeasonalExperiences.module.css";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { forScript } from "@/components/ui/SectionHeader";
import { SEASONAL_INTRO, SEASONAL_MOMENTS } from "@/lib/brand";
import { scrollToY } from "@/lib/scroll";
import { cn } from "@/lib/utils";

/**
 * Four seasons, one frame that holds still while they change.
 *
 * ==========================================================================
 * IT USED TO NEED A MOUSE, WHICH MEANT IT NEEDED AN APOLOGY
 * ==========================================================================
 *
 * The previous version was a tablist: the panel beside the list only changed
 * when you hovered a row. Three quarters of the content was therefore behind a
 * gesture that does not exist on a phone, and on a desktop nothing said the
 * rows could be hovered at all. The client's note was exactly right — not user
 * friendly.
 *
 * The occasion now changes as the page is scrolled. From `lg` the section pins
 * itself under the bar and the reader scrolls *through* the four: the stage
 * stays, the list marks where they are, and the photograph and its line change
 * beneath it. Nothing is hidden behind a pointer, and the same scroll that
 * reads the rest of the page reads this.
 *
 * BELOW `lg` NOTHING IS PINNED. The four are simply stacked and scrolled. A
 * four-step pinned section on a phone is the pattern everyone complains about,
 * and the content is identical either way.
 *
 * The rows are still buttons. Clicking one scrolls to its step — through Lenis,
 * which owns the scroll — so a keyboard and a mouse can go straight to an
 * occasion instead of dragging through the others, and `aria-selected` still
 * says which one is showing.
 *
 * ==========================================================================
 * THE PANEL: A PHOTOGRAPH, WITH THE OCCASION'S COLOUR BEHIND IT
 * ==========================================================================
 *
 * The client asked for the colour to arrive as a cut-out behind the picture
 * rather than as a flat field. So each occasion has one of the deck's shapes in
 * its own colour, laid behind the plate and pushed past two of its corners
 * where it can actually be seen, and the words sit under the photograph on the
 * page's own ground — never over it, which is the rule the activity plates set.
 *
 * THE PHOTOGRAPHS ARE THE STUDIO'S OWN AND THEY MATCH WHAT THE DECK SAYS
 * HAPPENS. Ramadan's line is "crochet workshops" and the picture is the
 * studio's crochet; Christmas's is "festive candle making" and the picture is a
 * candle being poured. Valentine's and Mother's Day have no photograph of a
 * pipe-cleaner bar or a charm bracelet in the library, so they carry the
 * studio's own keepsake photographs from the same kind of session — decorative
 * (`alt=""`), with the deck's own line printed beneath saying what is actually
 * made. Nothing here claims an occasion is currently running: the deck names no
 * dates and neither does this.
 */

interface Season {
  slug: string;
  occasion: string;
  experience: string;
  colour: string;
  mark: DoodleName;
  image: { src: string; alt: string };
}

const SEASONS: readonly Season[] = SEASONAL_MOMENTS.map((moment, i) => ({
  ...moment,
  ...[
    {
      colour: INK.terracotta,
      mark: "bow" as DoodleName,
      image: {
        src: "/images/events/glitter-keepsakes.jpg",
        alt: "Four handmade keepsakes cupped in children's hands, two lettered with names and hearts and two filled with purple glitter and heart charms.",
      },
    },
    {
      colour: INK.lilac,
      mark: "coral" as DoodleName,
      image: {
        src: "/images/experiences/CROCHETING.jpg",
        alt: "A crocheted blanket of granny squares in green, cream and rust, each worked with a sun or a crescent moon.",
      },
    },
    {
      colour: INK.lavender,
      mark: "splash" as DoodleName,
      image: {
        src: "/images/events/named-keepsake.jpg",
        alt: "Two hands holding personalised keepsakes, one lettered with a name and a heart, the other filled with pastel sprinkles.",
      },
    },
    {
      colour: INK.charcoal,
      mark: "starburst" as DoodleName,
      image: {
        src: "/images/studio/candle-pour.jpg",
        alt: "Wax being poured from a jug into a row of glass candle jars on a workshop table.",
      },
    },
  ][i],
}));

export function SeasonalExperiences() {
  const [active, setActive] = useState(0);
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  /**
   * Which occasion the scroll is on.
   *
   * The span is the section's height less the stage's, which is exactly the
   * distance the page travels while the stage is pinned; divided into as many
   * equal parts as there are occasions. One listener, one rAF, and state is
   * only touched when the answer changes — a scroll that stays inside one step
   * re-renders nothing.
   */
  useEffect(() => {
    const section = track.current;
    const pinned = stage.current;
    if (!section || !pinned) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let wide = window.matchMedia("(min-width: 1024px)").matches;

    const read = () => {
      frame = 0;
      if (!wide) return;
      const span = section.offsetHeight - pinned.offsetHeight;
      if (span <= 0) return;
      const travelled = -section.getBoundingClientRect().top;
      const progress = Math.min(1, Math.max(0, travelled / span));
      const next = Math.min(SEASONS.length - 1, Math.floor(progress * SEASONS.length));
      setActive((current) => (current === next ? current : next));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    const onResize = () => {
      wide = window.matchMedia("(min-width: 1024px)").matches;
      if (!wide) setActive(0);
      onScroll();
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  /** Jump to an occasion's step — the middle of it, so it cannot sit on a seam. */
  const goTo = useCallback((index: number) => {
    const section = track.current;
    const pinned = stage.current;
    if (!section || !pinned) return;
    const span = section.offsetHeight - pinned.offsetHeight;
    if (span <= 0) {
      setActive(index);
      return;
    }
    const top = section.getBoundingClientRect().top + window.scrollY;
    scrollToY(top + ((index + 0.5) / SEASONS.length) * span);
  }, []);

  /* Arrow keys walk the list and take focus with them, as a tablist should. */
  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = SEASONS.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = active === last ? 0 : active + 1;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
    goTo(next);
  };

  return (
    <section
      ref={track}
      aria-labelledby="seasonal-heading"
      className="relative isolate overflow-x-clip bg-sage py-[4.5rem] md:py-[6rem] lg:py-[7rem]"
    >
      <div ref={stage} className={styles.stage}>
        <Container>
          <div className="grid grid-cols-12 items-start gap-x-gutter gap-y-10">
            <div className="col-span-12 lg:col-span-5">
              <Reveal>
                <p className="flex items-center gap-3 text-label font-bold uppercase tracking-eyebrow text-terracotta">
                  <span aria-hidden className="block w-4 shrink-0">
                    <DoodleMark name="dot" color={INK.terracotta} depth={4} />
                  </span>
                  Limited time
                </p>
              </Reveal>

              <Reveal delay={0.06}>
                <h2
                  id="seasonal-heading"
                  className="heading-script mt-5 text-[clamp(2.25rem,1.3rem+3.6vw,3.5rem)] leading-[1.1] text-text"
                >
                  {forScript("A different season, every season.")}
                </h2>
              </Reveal>

              <Reveal delay={0.12}>
                <p className="mt-6 max-w-[38ch] text-[1.0625rem] leading-[1.75] text-text/85">
                  {SEASONAL_INTRO}
                </p>
              </Reveal>

              {/* ------------------------------------------------ the list --- */}
              <div
                role="tablist"
                aria-label="Seasonal occasions"
                aria-orientation="vertical"
                onKeyDown={onKeyDown}
                className="mt-10 flex flex-col"
              >
                {SEASONS.map((season, i) => {
                  const on = i === active;
                  return (
                    <button
                      key={season.slug}
                      ref={(node) => {
                        tabs.current[i] = node;
                      }}
                      type="button"
                      role="tab"
                      id={`season-tab-${season.slug}`}
                      aria-selected={on}
                      aria-controls={`season-panel-${season.slug}`}
                      tabIndex={on ? 0 : -1}
                      onClick={() => goTo(i)}
                      className={cn(
                        "group flex items-center gap-4 border-b border-text/15 py-4 text-left first:border-t",
                        "transition-colors duration-300 ease-soft focus-visible:outline-none",
                      )}
                    >
                      {/* The mark is the selection, so the list reads down one
                          edge instead of shifting when the occasion changes. */}
                      <span
                        aria-hidden
                        className={cn(
                          "block w-6 shrink-0 transition-opacity duration-300 ease-soft",
                          on ? "opacity-100" : "opacity-0",
                        )}
                      >
                        <DoodleMark name={season.mark} color={season.colour} depth={4} />
                      </span>
                      <span
                        /*
                          THE INK STAYS CHARCOAL AND THE COLOUR GOES IN THE
                          MARK. On Light Sage only Deep Lilac (3.95:1) and
                          Charcoal (9.07:1) can be read; Warm Terracotta is
                          2.44:1 and Soft Lavender 1.44:1, so colouring these
                          labels by occasion made half of them unreadable. The
                          cut-out beside the row carries the colour instead —
                          it is decorative and owes no ratio.

                          Inactive is 55%, not 35%: these are four live tabs,
                          and 35% measured 2.4:1, which reads as disabled.
                        */
                        className={cn(
                          "text-[clamp(1.375rem,1rem+1.5vw,2rem)] font-bold uppercase leading-[1] tracking-[0.015em]",
                          "[font-family:var(--font-deck)] [font-synthesis:none]",
                          "transition-colors duration-300 ease-soft",
                          on ? "text-text" : "text-text/55 group-hover:text-text/80",
                        )}
                      >
                        {season.occasion}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ------------------------------------------------ the panels --- */}
            <div className="col-span-12 lg:col-span-6 lg:col-start-7">
              <div className={styles.panels}>
                {SEASONS.map((season, i) => (
                  <figure
                    key={season.slug}
                    id={`season-panel-${season.slug}`}
                    role="tabpanel"
                    aria-labelledby={`season-tab-${season.slug}`}
                    data-on={i === active ? "true" : "false"}
                    className={cn(styles.panel, "flex flex-col")}
                  >
                    <div className={styles.plateWrap}>
                      {/*
                        The occasion's cut-out, behind the photograph and
                        pushed past its corners — the colour of the row it
                        belongs to. It draws itself as its occasion arrives.
                      */}
                      {/* -2%, not -6%: the page's gutter is 20px at 1440 and the panel is the
                          right-hand column, so a larger overhang put the shape past the
                          window and gave the page 21px of sideways scroll. */}
                      <span className={cn(styles.mark, "-right-[2%] -top-[10%] w-[34%] max-w-[13rem]")}>
                        <DoodleMark
                          name={season.mark}
                          color={season.colour}
                          treatment="draw"
                          on={i === active}
                          depth={14}
                        />
                      </span>
                      {/* Held inside the plate's own height and pushed out only to the
                          left: below it, the shape ran under the caption, and on
                          Christmas a Charcoal cut-out sat behind Charcoal words. */}
                      <span className={cn(styles.mark, "bottom-[8%] -left-[6%] w-[22%] max-w-[8rem]")}>
                        <DoodleMark
                          name={season.mark}
                          color={season.colour}
                          treatment="draw"
                          on={i === active}
                          delay={180}
                          depth={22}
                        />
                      </span>

                      <div
                        className={styles.plate}
                        data-paint
                        style={{ "--paint": season.colour } as React.CSSProperties}
                      >
                        <Image
                          src={season.image.src}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 48vw, 92vw"
                          className={styles.photo}
                        />
                      </div>
                    </div>

                    <figcaption className="mt-6 flex items-baseline gap-5">
                      <span className="text-label font-bold tabular-nums tracking-eyebrow text-text/55">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <span className="heading-script block text-[clamp(1.75rem,1.1rem+2.2vw,2.75rem)] leading-[1.1] text-text">
                          {forScript(season.occasion)}
                        </span>
                        <span className="mt-2 block max-w-[32ch] text-[1.0625rem] leading-[1.65] text-text/85">
                          {season.experience}
                        </span>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* The scroll the pinned stage is read with: one screenful per occasion
          after the first. Nothing is in it — it is distance, not content. */}
      <div
        aria-hidden
        className={styles.steps}
        style={{ "--steps": SEASONS.length - 1 } as React.CSSProperties}
      />
    </section>
  );
}
