"use client";

import { useReducedMotion } from "framer-motion";
import { useSyncExternalStore } from "react";

/**
 * ==========================================================================
 * REDUCED MOTION, ASKED ONLY ONCE THE HTML HAS BEEN ADOPTED
 * ==========================================================================
 *
 * `useReducedMotion` reads `matchMedia` on the very first client render. The
 * server cannot — it has no media query to ask — so it always renders the
 * moving version: the hidden start of a reveal, a shape at the top of its
 * drift, a trail line at 0.1% drawn. For a visitor who has asked for reduced
 * motion the first client render then disagreed with that HTML on the same
 * element, and React logged "A tree hydrated but some attributes of the
 * server rendered HTML didn't match the client properties" on every page:
 * <Reveal>'s `opacity:0` against `opacity:1`, every <SectionShapes> mark's
 * `translateY(-11%) rotate(-12deg)` against `rotate(-12deg)`, the homepage
 * trail's `pathLength` against 1. React does not patch attributes it finds
 * mismatched, so the page only came right because Framer happened to write
 * the same styles again on mount.
 *
 * THIS SAYS `false` WHILE HYDRATING AND THE TRUTH STRAIGHT AFTER. The first
 * client render reproduces the server's (moving) one exactly, so there is
 * nothing to mismatch; React then re-renders with the real preference before
 * the browser has had a frame to play anything, and each caller drops to its
 * still state from there. The pattern is the one SessionClock.tsx and
 * `useCartHydrated` in lib/cart.ts already use: `useSyncExternalStore` with a
 * server snapshot of `false` and a client snapshot of `true`, which React
 * itself reconciles after hydration — no effect, no state set from an effect.
 * The store never changes, so the subscription is empty.
 *
 * On a client-side navigation there is no hydration, so the preference is
 * honoured from the first frame and nothing ever starts moving.
 *
 * WHAT A CALLER OWES IN RETURN. Its still state now arrives as an UPDATE to a
 * mounted element, not as the element's first frame — so an `initial={false}`
 * no longer does the jumping on its own. <Reveal> and <Stagger> switch to
 * `instantVariants` (lib/motion.ts) for that reason; scroll-linked values
 * (<SectionShapes>, the homepage trail) simply take their flattened range or
 * fixed value on the re-render.
 */
const subscribeToNothing = () => () => {};

export function useHydratedReducedMotion(): boolean {
  const prefersReduced = useReducedMotion();
  const hydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  return hydrated && prefersReduced === true;
}
