"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, type ElementType, type ReactNode } from "react";

import { useIsInStagger } from "@/components/motion/StaggerContext";
import { VIEWPORT, variants, type VariantName } from "@/lib/motion";

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
  const prefersReducedMotion = useReducedMotion();
  const isInStagger = useIsInStagger();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, VIEWPORT);
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  // Inside a Stagger the parent owns initial/animate; declaring them here would
  // make each child animate independently and defeat the sequencing.
  //
  // Reduced motion keeps the motion element and jumps it straight to `visible`
  // (`initial={false}` means "start at the animate state") rather than
  // rendering a plain element. That distinction matters: the server always
  // renders the hidden state, and React hydration does not strip attributes
  // the client render no longer sets — so swapping in a plain element would
  // leave `style="opacity:0"` on the DOM node and the content would never
  // appear at all. Handing the node back to Framer lets it overwrite that.
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
      ref={ref}
      data-reveal=""
      className={className}
      variants={variants[variant]}
      {...ownTriggerProps}
    >
      {children}
    </MotionTag>
  );
}
