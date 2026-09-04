"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ElementType, ReactNode } from "react";

import { StaggerContext } from "@/components/motion/StaggerContext";
import { VIEWPORT, stagger } from "@/lib/motion";

interface StaggerProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
}

/**
 * Releases its <Reveal> children in sequence rather than all at once.
 * Children detect the surrounding context and hand their trigger to this
 * parent, so the whole group animates from one scroll intersection.
 */
export function Stagger({ children, as = "div", className }: StaggerProps) {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  if (prefersReducedMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <StaggerContext value>
      <MotionTag
        data-reveal=""
        className={className}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
      >
        {children}
      </MotionTag>
    </StaggerContext>
  );
}
