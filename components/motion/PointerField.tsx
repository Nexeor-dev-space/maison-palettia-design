"use client";

import { useEffect } from "react";

/**
 * ==========================================================================
 * The pointer field — where the mouse is, published once for the whole page
 * ==========================================================================
 *
 * Writes two custom properties onto <html>:
 *
 *   --pointer ... 1 while the pointer is in the window, 0 before it has ever
 *                 moved and 0 again once it leaves.
 *
 *                 IT EXISTS BECAUSE 0,0 IS AMBIGUOUS. For a LEAN, the resting
 *                 centre and "no pointer" are the same answer — no lean — so
 *                 `--mx: 0` says both and nothing is lost. For anything keyed
 *                 to NEARNESS they are opposites: dead centre is as close as
 *                 the pointer gets, and a mark that grows with proximity would
 *                 sit at full size before the visitor had moved at all. See
 *                 `pointer-lift` in globals.css.
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
/*
  WHERE THE PROPERTIES ARE WRITTEN — the note above says <html>, and that is
  what this used to do. It no longer does, and the reason is the lag in
  issue #70.

  A custom property inherits, so one write to <html> invalidates the computed
  style of every element in the document — on every pointer frame — and starts
  a transition on every mark on the page, the great majority of them nowhere
  near the screen. The cost grew with the length of the page, not with what the
  visitor could see.

  So the pair is now written straight onto the marks that need it
  (`[data-drift]`, `.pointer-lift`), and only onto those currently within the
  window. The CSS that reads `var(--mx, 0)` is untouched: it resolves the value
  on the element itself instead of on an ancestor, and the style recalculation
  is limited to a mark's own little subtree.
*/
const TARGETS = "[data-drift], .pointer-lift";

export function PointerField() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;
    let present = false;
    // Last values written, so a frame in which nothing changed writes nothing.
    let lastX = NaN;
    let lastY = NaN;
    let lastPresent: boolean | null = null;

    const visible = new Set<HTMLElement>();
    const seen = new WeakSet<Element>();

    const paint = (el: HTMLElement) => {
      el.style.setProperty("--mx", x.toFixed(3));
      el.style.setProperty("--my", y.toFixed(3));
      el.style.setProperty("--pointer", present ? "1" : "0");
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            visible.add(el);
            paint(el);
          } else {
            visible.delete(el);
          }
        }
      },
      // A little beyond the window, so a mark is already placed as it arrives.
      { rootMargin: "120px" },
    );

    const adopt = (scope: ParentNode) => {
      for (const el of scope.querySelectorAll<HTMLElement>(TARGETS)) {
        if (seen.has(el)) continue;
        seen.add(el);
        observer.observe(el);
      }
    };
    adopt(document);

    // Marks arrive with client navigations and CMS blocks; adopt them once per
    // frame at most rather than per mutation.
    let scan = 0;
    const mutations = new MutationObserver(() => {
      if (scan) return;
      scan = requestAnimationFrame(() => {
        scan = 0;
        adopt(document);
      });
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    const write = () => {
      frame = 0;
      if (x === lastX && y === lastY && present === lastPresent) return;
      lastX = x;
      lastY = y;
      lastPresent = present;
      for (const el of visible) paint(el);
    };

    const onMove = (event: PointerEvent) => {
      // Two decimals is finer than a mark can show; it keeps a near-still
      // pointer from re-triggering every mark's transition.
      x = Math.round(((event.clientX / window.innerWidth) * 2 - 1) * 100) / 100;
      y = Math.round(((event.clientY / window.innerHeight) * 2 - 1) * 100) / 100;
      present = true;
      if (!frame) frame = requestAnimationFrame(write);
    };

    /* The pointer leaving the window is not the same as it being in the
       middle, but it is the honest resting state: the marks ease home rather
       than staying leant toward a mouse that is no longer there. */
    const onLeave = () => {
      x = 0;
      y = 0;
      present = false;
      if (!frame) frame = requestAnimationFrame(write);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(scan);
      observer.disconnect();
      mutations.disconnect();
      for (const el of visible) {
        el.style.removeProperty("--mx");
        el.style.removeProperty("--my");
        el.style.removeProperty("--pointer");
      }
      visible.clear();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return null;
}
