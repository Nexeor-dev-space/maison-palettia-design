"use client";

import { motion, useInView } from "framer-motion";
import { useCallback, useRef, type ElementType, type ReactNode } from "react";

import { useIsInStagger } from "@/components/motion/StaggerContext";
import { useHydratedReducedMotion } from "@/components/motion/useHydratedReducedMotion";
import { VIEWPORT, instantVariants, variants, type VariantName } from "@/lib/motion";

/* Every named variant with its transitions made instant, built once. */
const STILL = Object.fromEntries(
  Object.entries(variants).map(([name, v]) => [name, instantVariants(v)]),
) as Record<VariantName, ReturnType<typeof instantVariants>>;

interface RevealProps {
  children: ReactNode;
  /** Which shared animation to use. Defaults to a gentle fade-up. */
  variant?: VariantName;
  /** Render as a different element, e.g. "section" or "li". */
  as?: ElementType;
  /** Seconds to wait before starting. Ignored inside a <Stagger>. */
  delay?: number;
  className?: string;
}

/**
 * Animates its children into view using the shared motion language.
 *
 * - Standalone: triggers on its own scroll intersection, once.
 * - Inside <Stagger>: stays passive and inherits the parent's animation state,
 *   so siblings run in sequence from a single trigger.
 * - Reduced motion: appears immediately, with no transform or fade.
 */
export function Reveal({
  children,
  variant = "fadeUp",
  as = "div",
  delay = 0,
  className,
}: RevealProps) {
  // False while hydrating, so the first client render is the server's — see
  // components/motion/useHydratedReducedMotion.ts.
  const prefersReducedMotion = useHydratedReducedMotion();
  const isInStagger = useIsInStagger();
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  /*
    Which element the scroll observer watches.

    Normally the animated element itself — but `maskUp` hides a line by sliding
    it clean out of the `overflow: hidden` parent that masks it, and an element
    clipped entirely away has no intersection with the viewport at all. Watch
    it and the browser answers "never on screen", so the reveal never starts,
    so the line never comes back: a standalone masked line stays invisible for
    good. (A masked line inside a <Stagger> escapes this by accident — the
    Stagger owns the trigger, and its own element is not the clipped one.)

    So for that variant the mask is watched instead. It sits exactly where the
    line will land and is never transformed, which makes it the more accurate
    thing to measure anyway.
  */
  const watchesMask = variant === "maskUp";
  const observed = useRef<Element | null>(null);
  const attachRef = useCallback(
    (node: HTMLElement | null) => {
      // A callback ref is assigned during commit, before the effect inside
      // useInView runs — so `observed.current` is already set when the
      // observer is created.
      observed.current = watchesMask ? (node?.parentElement ?? node) : node;
    },
    [watchesMask],
  );
  const isInView = useInView(observed, VIEWPORT);

  // Inside a Stagger the parent owns initial/animate; declaring them here would
  // make each child animate independently and defeat the sequencing.
  //
  // Reduced motion keeps the motion element and jumps it straight to `visible`
  // rather than rendering a plain element. That distinction matters: the
  // server always renders the hidden state, and React hydration does not strip
  // attributes the client render no longer sets — so swapping in a plain
  // element would leave `style="opacity:0"` on the DOM node and the content
  // would never appear at all. Handing the node back to Framer lets it
  // overwrite that.
  //
  // THE JUMP IS TWO THINGS NOW. After a hydration the preference arrives one
  // render late, on an element already showing the server's hidden state, so
  // `initial={false}` has nothing left to do and the STILL variants make the
  // change to `visible` land in no time. On a client-side navigation the
  // preference is there from the first frame and `initial={false}` starts it
  // visible outright. Both apply inside a <Stagger> too: the parent owns
  // WHEN, but each child's own variants say HOW FAST.
  const ownTriggerProps = isInStagger
    ? {}
    : prefersReducedMotion
      ? { initial: false, animate: "visible", custom: delay }
      : {
          initial: "hidden",
          animate: isInView ? "visible" : "hidden",
          custom: delay,
        };

  return (
    <MotionTag
      ref={attachRef}
      data-reveal=""
      className={className}
      variants={prefersReducedMotion ? STILL[variant] : variants[variant]}
      {...ownTriggerProps}
    >
      {children}
    </MotionTag>
  );
}
