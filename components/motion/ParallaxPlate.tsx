"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * How much taller the plate is than the frame that clips it, as a fraction of
 * the frame. The whole effect is bought with this overscan: it is the only
 * slack the picture has to move in.
 */
const OVERSCAN = 0.16;

/**
 * How far the plate drifts each way, in the same terms. Deliberately a little
 * less than half the overscan, so a rounded sub-pixel at the extremes can
 * never open a hairline of background along an edge.
 */
const DRIFT_FRAME = 0.075;

/**
 * The same distance measured against the plate's own height, because that is
 * what a percentage `y` resolves against.
 */
const DRIFT = ((DRIFT_FRAME / (1 + OVERSCAN)) * 100).toFixed(3);

interface ParallaxPlateProps {
  /** The artwork. Give it `fill` and let it cover — the plate is the frame. */
  children: ReactNode;
  className?: string;
}

/**
 * A picture that fills its section and drifts against the page as the section
 * passes the window.
 *
 * The plate is cut taller than the frame and slides down inside it, from high
 * as the section enters at the foot of the window to low as it leaves at the
 * head. Net of the page's own travel the picture moves at about 0.93 of the
 * scroll — enough that it is plainly not painted on the page, little enough
 * that it never reads as an effect. Nothing is pinned and nothing is fixed:
 * the whole thing is one transform on one element, which is why it composites
 * on a phone as happily as on a desktop.
 *
 * The drift is tied to scroll position rather than played on entry, so
 * dragging the page back up runs it backwards. That is the difference between
 * a picture that is responding to the reader and one that is performing at
 * them.
 *
 * Under `prefers-reduced-motion` the plate simply sits centred in its frame and
 * never moves, which is the same picture with the parallax taken out.
 *
 * The frame this renders is `absolute inset-0`, so the section above it needs
 * to be `relative` and to give the plate somewhere to sit behind the content.
 */
export function ParallaxPlate({ children, className }: ParallaxPlateProps) {
  const frame = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Measured against the frame, not the plate: the frame is exactly the
  // section, so progress runs 0 as its foot touches the bottom of the window
  // to 1 as its head leaves the top — the reference's "top bottom" to
  // "bottom top".
  const { scrollYProgress } = useScroll({
    target: frame,
    offset: ["start end", "end start"],
  });
  // Reduced motion flattens the range rather than dropping the value, so the
  // plate is still driven by Framer and cannot be left holding whatever the
  // server rendered — see the same note in <ScrollReveal>.
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? ["0%", "0%"] : [`-${DRIFT}%`, `${DRIFT}%`],
  );

  return (
    <div ref={frame} className={cn("absolute inset-0 overflow-hidden", className)}>
      {/*
        `data-reveal` is the no-JavaScript catch in app/layout.tsx: it strips
        the transform, and the overscan means the plate still covers the frame
        with the picture merely sitting a little high.
      */}
      <motion.div
        data-reveal=""
        className="absolute inset-x-0"
        style={{
          // Hung so the overscan is split evenly above and below the frame:
          // at rest the plate is centred, and either extreme of the drift
          // still leaves half a per cent of it over each edge.
          top: `${(-OVERSCAN / 2) * 100}%`,
          height: `${(1 + OVERSCAN) * 100}%`,
          y,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
