"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ElementType, ReactNode } from "react";

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
 * - Inside <Stagger>: inherits the parent's state so siblings run in sequence.
 * - Reduced motion: renders immediately with no transform or fade.
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
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  if (prefersReducedMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  // Inside a Stagger the parent owns initial/whileInView; declaring them here
  // would make each child animate independently and defeat the sequencing.
  const ownTriggerProps = isInStagger
    ? {}
    : {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: VIEWPORT,
        transition: { delay },
      };

  return (
    <MotionTag data-reveal="" className={className} variants={variants[variant]} {...ownTriggerProps}>
      {children}
    </MotionTag>
  );
}
