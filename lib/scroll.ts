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
  on?(event: "scroll", handler: () => void): void;
  off?(event: "scroll", handler: () => void): void;
}

let scroller: Scroller | null = null;
const frameListeners = new Set<() => void>();

export function registerScroller(instance: Scroller | null): void {
  for (const listener of frameListeners) scroller?.off?.("scroll", listener);
  scroller = instance;
  for (const listener of frameListeners) scroller?.on?.("scroll", listener);
}

/**
 * Call back whenever the page has moved — in the frame it moved in.
 *
 * WHY THIS IS NOT JUST A `scroll` LISTENER. Lenis moves the page from inside
 * its own animation frame, and the browser does not dispatch `scroll`
 * synchronously when it does: the event is queued and fires in the *next*
 * frame's rendering steps. So anything scrubbed by `window.scrollY` from a
 * scroll listener paints one frame behind the page it belongs to — the hero's
 * photograph did, and against a sticky frame that reads as the banner shaking
 * rather than being carried, which is what the client saw.
 *
 * Lenis emits its own event inside that frame, before the paint, so a
 * consumer subscribed here is always in step. The window listener stays as
 * well: it is the only signal when Lenis is not running — a reader who has
 * asked for reduced motion, a touch drag (`syncTouch` is off), or no
 * JavaScript at all — and calling back twice with the same scroll position
 * costs nothing.
 */
export function onScrollFrame(handler: () => void): () => void {
  frameListeners.add(handler);
  scroller?.on?.("scroll", handler);
  window.addEventListener("scroll", handler, { passive: true });
  return () => {
    frameListeners.delete(handler);
    scroller?.off?.("scroll", handler);
    window.removeEventListener("scroll", handler);
  };
}

/**
 * Send the page to the top, by whichever means is actually in charge.
 *
 * Falls back to the browser when Lenis is not running, and to an instant jump
 * when the reader has asked for reduced motion — a smoothed scroll of the
 * whole page is exactly the kind of movement that setting is asking to stop.
 */
/**
 * Send the page to a position, by whichever means is in charge.
 *
 * The same hand-off `scrollToTop` makes, for a caller that knows where it
 * wants to land — the seasonal section jumps to the step belonging to the
 * occasion that was clicked. A bare `window.scrollTo` would be dragged back by
 * Lenis on the next frame.
 */
export function scrollToY(top: number): void {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (scroller && !reduced) {
    scroller.scrollTo(top);
    return;
  }

  window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
}

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
