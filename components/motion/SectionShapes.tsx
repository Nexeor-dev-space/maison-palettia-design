"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import type { DoodleName } from "@/components/sections/hero/doodles";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { cn } from "@/lib/utils";

/**
 * ==========================================================================
 * THE BRAND'S OWN SHAPES, BEHIND A SECTION, DRIFTING AS IT PASSES
 * ==========================================================================
 *
 * A section ground made of the studio's own cut-outs rather than a flat field:
 * two to four marks placed by hand, sized as a share of the section, and moved
 * at different rates while the section crosses the window. The page gains a
 * depth it cannot get from colour alone, and every shape in it is already the
 * Maison's — these are the same vectors <Hero> throws around the logo and
 * <DoodleMark> draws everywhere else.
 *
 * ==========================================================================
 * WHY IT IS PLACED BY HAND AND NOT SCATTERED
 * ==========================================================================
 *
 * <DoodleMark>'s own note is blunt about this: "Uncontrolled icon scattering
 * did not look good." A random placement also changes on every render, which
 * is the "constant floating" the brief rules out. So a section passes a PLAN —
 * an explicit list of shape, colour, size, corner and drift — and gets the
 * same composition every time, on every machine.
 *
 * The plan is deliberately small. Four marks is the ceiling: past that the
 * ground stops being a ground and starts competing with the content sitting on
 * it, which is the failure mode of every "confetti background" ever shipped.
 *
 * ==========================================================================
 * THE DRIFT, AND WHY EACH SHAPE GETS ITS OWN
 * ==========================================================================
 *
 * Every mark moves on the same scroll progress — 0 as the section's foot
 * touches the bottom of the window, 1 as its head leaves the top, which is the
 * measurement <ParallaxPlate> already uses — but each at its own rate and
 * sign. Shapes moving at one speed are a sticker sheet sliding past; shapes
 * moving at different speeds read as layers at different distances, which is
 * the whole point of doing this with scroll rather than with a loop.
 *
 * `drift` is a percentage of the mark's own box, so a large shape and a small
 * one at the same figure travel proportionally and neither runs away with it.
 *
 * ==========================================================================
 * IT CANNOT COST LEGIBILITY
 * ==========================================================================
 *
 * The marks are held at low opacity and sit at `-z-10` behind everything the
 * section renders, so no text is ever laid on a shape at full strength. They
 * are `aria-hidden` and take no pointer events: nothing here is information,
 * and nothing here can swallow a click.
 *
 * Under reduced motion the range is flattened rather than dropped, the same
 * way <ParallaxPlate> and <ScrollReveal> do it — the value is still Framer's,
 * so the marks can never be left holding whatever the server rendered.
 */

export interface ShapePlan {
  /** Which cut-out. See components/sections/hero/doodles.ts. */
  name: DoodleName;
  /** A brand colour, as a literal — <DoodleMark> hands it to an SVG `fill`. */
  color: string;
  /** Width as a share of the section, e.g. "18%". Height follows the vector. */
  width: string;
  /** Where its box sits. Percentages of the section, so it scales with it. */
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  /** Resting angle, in degrees. */
  rotate?: number;
  /**
   * How far it travels over the section's whole pass, as a percentage of its
   * own height. Negative rises against the scroll. Around 10–30 reads as
   * depth; past about 45 it reads as something sliding.
   */
  drift: number;
  /** 0–1. These sit behind type, so this is low by default. */
  opacity?: number;
  /** Hide below `lg`, where a phone has no room to spare for decoration. */
  desktopOnly?: boolean;
  /**
   * Seconds for one breath of the idle float, on top of the scroll drift.
   * Omit it and the mark only moves with the page.
   *
   * WHY BOTH. Scroll drift is depth — it only exists while someone is moving,
   * and a visitor who stops reading is looking at a still ground. A slow float
   * keeps the layer alive when the page is not, which is what makes a band of
   * empty colour read as air rather than as a hole. It has to be SLOW and
   * SMALL: 9-16 seconds and a few pixels. Anything faster is a screensaver,
   * and these sit behind type.
   */
  float?: number;
  /** Seconds of offset, so a row of marks never breathes in lockstep. */
  floatDelay?: number;
}

export function SectionShapes({ plan, className }: { plan: readonly ShapePlan[]; className?: string }) {
  const field = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: field,
    offset: ["start end", "end start"],
  });

  return (
    <div
      ref={field}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
    >
      {plan.map((shape, i) => (
        <Shape key={`${shape.name}-${i}`} shape={shape} progress={scrollYProgress} reduced={!!reduced} />
      ))}
    </div>
  );
}

/**
 * One mark. Split out because `useTransform` is a hook and cannot be called in
 * a loop inside the parent.
 */
function Shape({
  shape,
  progress,
  reduced,
}: {
  shape: ShapePlan;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  reduced: boolean;
}) {
  const travel = reduced ? 0 : shape.drift;
  const y = useTransform(progress, [0, 1], [`${-travel / 2}%`, `${travel / 2}%`]);
  const float = reduced ? 0 : (shape.float ?? 0);

  return (
    <motion.span
      /* The no-JavaScript catch in app/layout.tsx strips transforms from
         anything marked this way; a mark that never drifts is exactly the
         resting composition, so nothing is lost. */
      data-reveal=""
      className={cn(
        "absolute block",
        /* A phone has no air to spare: at 390px the marks that read as a
           ground on a desktop are large objects sitting under the type. The
           plans keep one or two for small screens and hide the rest. */
        shape.desktopOnly ? "hidden lg:block" : null,
      )}
      style={{
        y,
        top: shape.top,
        bottom: shape.bottom,
        left: shape.left,
        right: shape.right,
        width: shape.width,
        rotate: shape.rotate ?? 0,
        opacity: shape.opacity ?? 0.18,
      }}
    >
      {/*
        TWO LAYERS, BECAUSE TWO THINGS MOVE IT.

        The scroll drift is on the span above; the idle float is here, on its
        own element, so the two never compete for one `y`. Nesting is also what
        lets the float carry a whisker of rotation without fighting the resting
        angle, which is set on the parent.

        `depth={0}`: the pointer drift <DoodleMark> does by default is for a
        mark sitting beside type at a readable size. Behind content, at this
        size, a third kind of movement is one too many.
      */}
      <motion.span
        className="block"
        animate={float ? { y: [0, -9, 0, 7, 0], rotate: [0, 1.6, 0, -1.6, 0] } : undefined}
        transition={
          float
            ? {
                duration: float,
                repeat: Infinity,
                ease: "easeInOut",
                delay: shape.floatDelay ?? 0,
              }
            : undefined
        }
      >
        <DoodleMark name={shape.name} color={shape.color} depth={0} treatment="stamp" />
      </motion.span>
    </motion.span>
  );
}
