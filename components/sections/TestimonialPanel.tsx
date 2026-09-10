"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import type { Testimonial } from "@/types";

/**
 * How long a quote holds before the next one comes up.
 *
 * Seven seconds is roughly twice as long as these take to read, which is the
 * point: an auto-advancing quote that changes the moment you finish it is a
 * slideshow, and one that lingers is a room with someone talking in it.
 */
const DWELL = 7000;

interface TestimonialPanelProps {
  testimonials: Testimonial[];
}

/**
 * The quotes, advancing on their own, with an arrow either side.
 *
 * Built to the carousel pattern rather than the tablist it used to be: it
 * rotates by itself now, and a tablist that changes its own selection is
 * lying about what it is. The region carries `aria-roledescription="carousel"`
 * and each quote is a slide, so a screen reader announces what kind of thing
 * this is before it starts reading the contents.
 *
 * Four separate things stop the rotation, because a moving panel nobody can
 * stop is the classic failure of this component:
 *
 *   - a pointer resting anywhere on the plate pauses it, so a quote cannot
 *     change out from under someone in the middle of reading it;
 *   - focus landing inside does the same, which covers the keyboard;
 *   - either arrow stops it for good — a reader who has taken the controls is
 *     not asking to be moved along again;
 *   - `prefers-reduced-motion` means it never starts, and the panel is simply
 *     the first quote with two arrows beside it.
 *
 * The live region is `off` while it rotates and `polite` once it has stopped.
 * Announcing every automatic change would interrupt a screen reader every
 * seven seconds for as long as the section is open; announcing a change the
 * reader just asked for is the whole point of asking.
 *
 * The quotes are stacked in one grid cell rather than swapped in and out of
 * the flow, which is what keeps the plate from changing height as they change.
 * The alternative is `display: none` plus a hand-set minimum height, and that
 * number is a guess the moment the real quotes arrive — it has to be
 * re-measured at every breakpoint for whatever the longest one turns out to
 * be, and it is wrong until someone does. Stacked, the cell is simply as tall
 * as the tallest quote at whatever width the reader is at.
 *
 * The inactive quotes are held with `visibility: hidden` rather than faded to
 * transparent: that keeps their boxes, which is the point, while still taking
 * them out of the accessibility tree and out of the tab order. A quote a
 * screen reader can reach but a sighted reader cannot see is the failure this
 * avoids, and opacity alone would walk straight into it. Transitioning
 * `visibility` alongside the opacity is what still allows a cross-fade — it
 * flips at the far end of the fade rather than the near one.
 */
export function TestimonialPanel({ testimonials }: TestimonialPanelProps) {
  const [active, setActive] = useState(0);
  /** False once a reader has used an arrow. Never goes back to true. */
  const [isAuto, setIsAuto] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const count = testimonials.length;
  const isRotating = isAuto && !isPaused && !prefersReducedMotion && count > 1;

  useEffect(() => {
    if (!isRotating) return;
    // A timeout re-armed on every change rather than one long interval, so
    // coming back from a pause gives the current quote a full dwell instead of
    // whatever was left of it.
    const timer = window.setTimeout(() => setActive((i) => (i + 1) % count), DWELL);
    return () => window.clearTimeout(timer);
  }, [isRotating, active, count]);

  const go = (step: number) => {
    setIsAuto(false);
    setActive((i) => (i + step + count) % count);
  };

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Guest quotes"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      // Capture, so focus landing on anything inside pauses it — not only on
      // this element itself, which never receives focus.
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="grid" aria-live={isRotating ? "off" : "polite"}>
        {testimonials.map((testimonial, i) => (
          <div
            key={testimonial.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            className={cn(
              "col-start-1 row-start-1 transition-[opacity,visibility] duration-700 ease-soft",
              i === active ? "visible opacity-100" : "invisible opacity-0",
            )}
          >
            <blockquote>
              <p className="text-[1.15rem] font-light leading-[1.55] tracking-[-0.01em] text-text md:text-[1.35rem] lg:text-[1.5rem]">
                {testimonial.quote}
              </p>
              <footer className="mt-6 text-[0.68rem] font-medium uppercase tracking-eyebrow text-text/60 md:mt-7">
                {/*
                  No "—" before it and no quotation marks around the quote. The
                  blockquote already says what this is, and the punctuation is
                  the kind of decoration this site spends its restraint
                  avoiding.
                */}
                <cite className="not-italic">{testimonial.attribution}</cite>
              </footer>
            </blockquote>
          </div>
        ))}
      </div>

      {count > 1 ? (
        <div className="mt-9 flex items-center gap-2 border-t border-line pt-4 md:mt-11 md:pt-5">
          <Arrow direction="previous" onClick={() => go(-1)} />
          <Arrow direction="next" onClick={() => go(1)} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * One arrow.
 *
 * The glyph is set small to match the rest of the interface on this site,
 * which is all hairlines and small caps — but the button around it is padded
 * out to a 44px square, so the thing a thumb has to hit is the size a thumb
 * actually is rather than the size the arrow looks. The negative margin takes
 * that padding back out of the layout on the leading edge, so the first arrow
 * still lines up with the quote above it instead of sitting indented by its
 * own hit area.
 */
function Arrow({
  direction,
  onClick,
}: {
  direction: "previous" | "next";
  onClick: () => void;
}) {
  const isPrevious = direction === "previous";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${isPrevious ? "Previous" : "Next"} quote`}
      className={cn(
        "flex size-11 items-center justify-center text-text/70",
        "transition-colors duration-300 ease-soft hover:text-text",
        isPrevious && "-ml-3.5",
      )}
    >
      <span aria-hidden className="text-base leading-none">
        {isPrevious ? "←" : "→"}
      </span>
    </button>
  );
}
