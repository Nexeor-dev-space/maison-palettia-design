"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useRef, type ReactNode } from "react";

import { useMediaQuery } from "@/lib/useMediaQuery";

/*
  CRITICALLY DAMPED, AND THAT IS A NUMBER RATHER THAN A FEEL. Damping over
  twice the square root of stiffness (mass 1) is 26 / 26.08 ≈ 1.0: the card
  turns toward the pointer and settles without passing it. The client has
  twice turned down a bounce on this site — see `press-in` — and a spring that
  overshoots is a bounce by another name.
*/
const SPRING = { stiffness: 170, damping: 26 } as const;

/** The vertical lean is a little shallower than the horizontal: a card held
 *  in two hands tips side to side more readily than toward you. */
const VERTICAL = 0.7;

interface PointerTiltProps {
  children: ReactNode;
  /** The most the card turns either way, in degrees. */
  max?: number;
  className?: string;
}

/**
 * A card that leans a few degrees toward a mouse held over it.
 *
 * The pointer's position over the element's own box sets the lean, so the
 * near edge always dips toward the hand. It springs flat again when the
 * pointer leaves.
 *
 * ONE ELEMENT, ALWAYS. Gated off — on a touch screen, a coarse pointer, or for
 * a reader who has asked for less motion — this renders the very same
 * `motion.div` with no style and no handlers, rather than a plain `<div>`.
 * The gate is only known after hydration (the server has no pointer to ask
 * about), and swapping the element then would unmount everything inside it —
 * including the server-rendered card face it carries.
 *
 * Decoration only. Nothing depends on it, and if a browser renders the card
 * soft while it is turned it can be removed without touching anything else.
 */
export function PointerTilt({ children, max = 4, className }: PointerTiltProps) {
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduce = useReducedMotion();
  const active = fine && !reduce;

  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, SPRING);
  const springY = useSpring(rotateY, SPRING);

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    // -1 at the left/top edge, +1 at the right/bottom.
    const x = ((event.clientX - box.left) / box.width) * 2 - 1;
    const y = ((event.clientY - box.top) / box.height) * 2 - 1;
    rotateY.set(x * max);
    rotateX.set(-y * max * VERTICAL);
  }

  function onPointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={
        active ? { rotateX: springX, rotateY: springY, transformPerspective: 1100 } : undefined
      }
      onPointerMove={active ? onPointerMove : undefined}
      onPointerLeave={active ? onPointerLeave : undefined}
    >
      {children}
    </motion.div>
  );
}
