"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ElementType, type ReactNode } from "react";

import { StaggerContext } from "@/components/motion/StaggerContext";
import { useHydratedReducedMotion } from "@/components/motion/useHydratedReducedMotion";
import { VIEWPORT, instantVariants, stagger } from "@/lib/motion";

/* No `staggerChildren`, no time: the group lands complete, together. */
const STILL = instantVariants(stagger);

interface StaggerProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
}

/**
 * Releases its <Reveal> children in sequence rather than all at once.
 * Children detect the surrounding context, stay passive, and inherit this
 * element's animation state — so the whole group runs from one trigger.
 */
export function Stagger({ children, as = "div", className }: StaggerProps) {
  // False while hydrating — see components/motion/useHydratedReducedMotion.ts.
  const prefersReducedMotion = useHydratedReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, VIEWPORT);
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  // Reduced motion jumps the whole group to `visible` instead of rendering a
  // plain element — see the note in <Reveal> on why the motion element has to
  // stay: a plain one would inherit the server's hidden inline style and never
  // clear it. `initial={false}` propagates to the passive children too, so the
  // sequence lands complete rather than playing at speed.
  //
  // After a hydration the preference only arrives on the second render, when
  // `initial` is spent; STILL is what keeps that late jump instant, here and
  // (through <Reveal>'s own STILL variants) in every child.
  return (
    <StaggerContext value>
      <MotionTag
        ref={ref}
        data-reveal=""
        className={className}
        variants={prefersReducedMotion ? STILL : stagger}
        initial={prefersReducedMotion ? false : "hidden"}
        animate={prefersReducedMotion || isInView ? "visible" : "hidden"}
      >
        {children}
      </MotionTag>
    </StaggerContext>
  );
}
