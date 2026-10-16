"use client";

import { useMotionValue, type MotionValue } from "framer-motion";
import { useEffect, type RefObject } from "react";

import { observeScrollProgress, type ScrollOffset } from "@/lib/scroll";

/**
 * `useScroll({ target, offset }).scrollYProgress`, minus the per-call scroll
 * tracker: every caller shares the one hub in lib/scroll.ts, which only does
 * work for targets near the window (issue #70).
 *
 * The value starts at 0 on the server and on the first client render, so
 * hydration sees the same thing Framer's hook would give; the hub seeds the
 * real progress in the effect. The target must not be sticky - see the hub's
 * note. A transformed target is fine: geometry is read from the offsetParent
 * chain, which ignores transforms the way Framer does.
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  offset: ScrollOffset,
): MotionValue<number> {
  const progress = useMotionValue(0);
  // The offset is a fresh array literal at every call site; key the effect on
  // its contents so it does not resubscribe on every render.
  const key = `${offset[0]}|${offset[1]}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const [start, end] = key.split("|");
    return observeScrollProgress(el, [start, end], progress);
  }, [ref, key, progress]);

  return progress;
}
