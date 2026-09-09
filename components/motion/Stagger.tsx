"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, type ElementType, type ReactNode } from "react";

import { StaggerContext } from "@/components/motion/StaggerContext";
import { VIEWPORT, stagger } from "@/lib/motion";

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
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, VIEWPORT);
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  // Reduced motion jumps the whole group to `visible` instead of rendering a
  // plain element — see the note in <Reveal> on why the motion element has to
  // stay: a plain one would inherit the server's hidden inline style and never
  // clear it. `initial={false}` propagates to the passive children too, so the
  // sequence lands complete rather than playing at speed.
  return (
    <StaggerContext value>
      <MotionTag
        ref={ref}
        data-reveal=""
        className={className}
        variants={stagger}
        initial={prefersReducedMotion ? false : "hidden"}
        animate={prefersReducedMotion || isInView ? "visible" : "hidden"}
      >
        {children}
      </MotionTag>
    </StaggerContext>
  );
}
