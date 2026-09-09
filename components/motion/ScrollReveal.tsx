"use client";

import {
  easeOut,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, type ReactNode } from "react";

/** How far the block rises into place, in pixels. */
const RISE = 120;

/**
 * The lag. A scrubbed reveal tied hard to the scroll position feels mechanical
 * — the type is welded to the wheel — so the progress is run through a spring
 * first and the content arrives a beat behind the page. Damped well past
 * critical: it settles rather than springs, and never overshoots type.
 */
const CATCH_UP = { stiffness: 30, damping: 11, mass: 1, restDelta: 0.0005 } as const;

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Content that rises into place as the page scrolls, and back down again if
 * the page scrolls the other way.
 *
 * The distinction from <Reveal> is worth being clear about, because both are
 * in the project and they are for different things. <Reveal> fires once, on an
 * intersection: it is an entrance, and after it has played the element is
 * simply there. This is tied to scroll position for its whole travel, so the
 * reader is moving it — scrub back up and it goes back down.
 *
 * The travel runs from the block reaching the foot of the window to its head
 * reaching the lower middle of it. Ending there rather than near the top of
 * the window is what makes it safe for a caption sitting low in its panel: by
 * the time the panel is properly framed the rise is finished, whichever end of
 * the panel the caption is anchored to.
 *
 * Use it for the large editorial moments, where the reader should feel that
 * the page is answering the wheel. <Reveal> remains right for everything that
 * simply needs to arrive.
 *
 * Under `prefers-reduced-motion` the content is placed and left alone.
 */
export function ScrollReveal({ children, className }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.98", "start 0.6"],
  });
  const eased = useSpring(scrollYProgress, CATCH_UP);

  // The rise carries the whole travel. The fade is over in the first fifth of
  // it, which is the important part: a scrubbed reveal holds wherever the
  // reader stops, and type left permanently at half opacity on an artwork is
  // a legibility problem rather than an effect. Past the first fifth only the
  // position is still moving, on type that is already fully readable. The
  // reference fades nothing at all for the same reason.
  // Reduced motion flattens the output ranges rather than dropping the style
  // prop, which keeps this to one code path — and the single path is the point
  // rather than the tidiness. The server always renders the start of the
  // travel, and hydration does not patch away an inline style the client has
  // stopped setting: branch here and the caption stays 120px low at zero
  // opacity for good. Driving the values through Framer either way means it
  // writes them itself, every time.
  const y = useTransform(eased, [0, 1], prefersReducedMotion ? [0, 0] : [RISE, 0], {
    ease: easeOut,
  });
  const opacity = useTransform(eased, [0, 0.18], prefersReducedMotion ? [1, 1] : [0, 1]);

  return (
    <motion.div
      ref={ref}
      data-reveal=""
      className={className}
      style={{ y, opacity }}
    >
      {children}
    </motion.div>
  );
}
