/**
 * A one-slot registry for the running smooth-scroll instance.
 *
 * Lenis drives the real scroll position, so a programmatic
 * `window.scrollTo({ behavior: "smooth" })` and Lenis's own eased target are
 * two hands on the same wheel. Anything that wants to move the page asks here
 * first and hands the job to Lenis when it is running.
 *
 * It is a module slot rather than a context because the only consumer is a
 * button in the footer and the only producer is a component that renders
 * nothing at the root — a provider between them would be two files of wiring
 * to carry one reference. `null` is the normal state, not an error: reduced
 * motion tears Lenis down on purpose, and so does a page with no JavaScript.
 */

/** The slice of Lenis this file needs; avoids importing the library here. */
interface Scroller {
  scrollTo(target: number, options?: { duration?: number }): void;
}

let scroller: Scroller | null = null;

export function registerScroller(instance: Scroller | null): void {
  scroller = instance;
}

/**
 * Send the page to the top, by whichever means is actually in charge.
 *
 * Falls back to the browser when Lenis is not running, and to an instant jump
 * when the reader has asked for reduced motion — a smoothed scroll of the
 * whole page is exactly the kind of movement that setting is asking to stop.
 */
export function scrollToTop(): void {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (scroller && !reduced) {
    scroller.scrollTo(0);
    return;
  }

  window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
}
