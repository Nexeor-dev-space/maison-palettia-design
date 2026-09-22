"use client";

import { useEffect } from "react";

/**
 * ==========================================================================
 * The pointer field — where the mouse is, published once for the whole page
 * ==========================================================================
 *
 * Writes two custom properties onto <html>:
 *
 *   --mx ... -1 at the left edge of the window, +1 at the right
 *   --my ... -1 at the top, +1 at the bottom
 *
 * <DoodleMark> multiplies them by its own `--depth` to drift a few pixels
 * against the pointer, which is the behaviour the homepage banner's doodles
 * already had and the client asked for everywhere else.
 *
 * ONE LISTENER, TWO WRITES, AND CSS DOES THE REST. Every mark on the page
 * inherits the same pair, so adding a doodle costs nothing and there is never
 * more than one `pointermove` handler for the field however many marks are
 * mounted. The write is behind `requestAnimationFrame`, so a mouse dragged
 * across the screen produces one style recalculation per frame rather than
 * one per event.
 *
 * THE BANNER KEEPS ITS OWN. <HeroIntro> sets `--mx`/`--my` on the hero
 * <section> itself, and a value set on a nearer ancestor wins — so the
 * banner's doodles stay bound to the pointer's position *within the banner*,
 * which is what their composition was tuned against, while everything below
 * it reads the window-relative pair from here. The two cannot fight.
 *
 * IT DOES NOT MOUNT AT ALL for a coarse pointer (every phone and tablet) or
 * for a reader who has asked for reduced motion, and without JavaScript the
 * properties are simply never set — `var(--mx, 0)` falls back to zero and
 * every mark sits exactly where it is drawn. The drift is decoration, and it
 * is the first thing to go.
 */
export function PointerField() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    let frame = 0;
    let x = 0;
    let y = 0;

    const write = () => {
      frame = 0;
      root.style.setProperty("--mx", x.toFixed(3));
      root.style.setProperty("--my", y.toFixed(3));
    };

    const onMove = (event: PointerEvent) => {
      x = (event.clientX / window.innerWidth) * 2 - 1;
      y = (event.clientY / window.innerHeight) * 2 - 1;
      if (!frame) frame = requestAnimationFrame(write);
    };

    /* The pointer leaving the window is not the same as it being in the
       middle, but it is the honest resting state: the marks ease home rather
       than staying leant toward a mouse that is no longer there. */
    const onLeave = () => {
      x = 0;
      y = 0;
      if (!frame) frame = requestAnimationFrame(write);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      root.style.removeProperty("--mx");
      root.style.removeProperty("--my");
    };
  }, []);

  return null;
}
