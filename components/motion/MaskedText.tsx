"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { maskUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface MaskedTextProps {
  children: ReactNode;
  /** Seconds to wait before the line starts rising. */
  delay?: number;
  /**
   * Bottom padding on the mask, as a `pb-*` utility.
   *
   * It has to clear the ink that falls below the baseline, and how much that
   * is belongs to the face rather than to this component: the sans default
   * here needs a hair, and the brand script drops almost a quarter of an em
   * below the baseline on a capital M. A prop rather than something merged in
   * through `className`, because `cn` only concatenates — two competing `pb-*`
   * utilities would be settled by their order in the generated stylesheet.
   */
  maskPadding?: string;
  className?: string;
}

/**
 * One line of display type rising from behind a mask. Animates on mount
 * rather than on scroll, so it suits above-the-fold headlines.
 *
 * The outer span owns the mask and the bottom padding that stops descenders
 * being clipped; the inner span is the thing that moves.
 */
export function MaskedText({
  children,
  delay = 0,
  maskPadding = "pb-[0.12em]",
  className,
}: MaskedTextProps) {
  const prefersReducedMotion = useReducedMotion();

  // Reduced motion holds the same markup and starts the line already in place
  // (`initial={false}`), rather than swapping in a plain span: the server
  // renders the line masked, and hydration would not clear that inline
  // transform from a plain element — see the note in <Reveal>.
  return (
    <span className={cn("block overflow-hidden", maskPadding)}>
      <motion.span
        data-reveal=""
        className={cn("block", className)}
        variants={maskUp}
        initial={prefersReducedMotion ? false : "hidden"}
        animate="visible"
        custom={delay}
      >
        {children}
      </motion.span>
    </span>
  );
}
