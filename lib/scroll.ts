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
  stop(): void;
  start(): void;
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

/**
 * Hold and release the page behind a full-screen overlay.
 *
 * `document.body { overflow: hidden }` is the usual lock and it is not enough
 * here, for two reasons. Lenis listens for wheel and touch on the window with
 * `passive: false` and moves the page itself, so a lock the browser honours is
 * a lock Lenis can still scroll straight past; and on iOS Safari the body rule
 * has never reliably held the document in the first place. Stopping Lenis
 * closes both: while it is stopped it calls `preventDefault()` on every scroll
 * gesture it sees, and it puts `lenis-stopped` on <html>, which globals.css
 * already answers with `overflow: hidden`.
 *
 * Anything scrollable *inside* the overlay must carry `data-lenis-prevent`, or
 * it is caught by the same net — Lenis checks that attribute before it checks
 * whether it is stopped, which is exactly the escape hatch a modal needs.
 *
 * Both are no-ops when Lenis is not running (reduced motion, or no JavaScript),
 * where the browser's own scrolling and the body rule are all there is.
 */
export function pauseScroller(): void {
  scroller?.stop();
}

export function resumeScroller(): void {
  scroller?.start();
}
