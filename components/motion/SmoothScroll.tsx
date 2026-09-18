"use client";

import Lenis from "lenis";
import { useEffect } from "react";

import { registerScroller } from "@/lib/scroll";

/**
 * Site-wide smoothed scrolling.
 *
 * The wheel stops moving the page a fixed number of pixels per notch and
 * starts handing it a target to ease towards, so a scroll arrives rather than
 * jumps. It is the largest single difference between a page that reads as an
 * editorial site and one that reads as a document, and it is what everything
 * else here is timed against — the parallax on the artwork and the scrubbed
 * reveals are all being driven by this eased position rather than by the raw
 * wheel.
 *
 * Lenis still drives the real scroll position rather than transforming a
 * wrapper, which is what keeps the rest of the site working untouched:
 * `position: sticky` (the hero holds and is covered exactly as before), the
 * IntersectionObserver behind <Reveal>, anchor links, and the browser's own
 * scrollbar all read the same numbers they always did.
 *
 * Touch is deliberately left alone. `syncTouch` is off, so a finger drag keeps
 * the platform's own momentum — smoothing that fights the gesture and is the
 * usual reason a smooth-scroll library feels broken on a phone.
 *
 * Renders nothing.
 */
/**
 * WebKit is left to scroll itself.
 *
 * Safari repositions `position: sticky` elements on its compositor a frame
 * behind a scroll that JavaScript has set, then corrects — and Lenis sets the
 * scroll from JavaScript every frame. On the homepage banner, which is a
 * sticky frame held for two screens, that correction is visible as the whole
 * picture shaking while the page moves through it. The client saw it in
 * Safari and nowhere else; Chrome and Firefox resolve sticky and the new
 * scroll position in the same frame and do not shake.
 *
 * It is not a bug the hero can code around, because it is not in the hero:
 * it is the engine's sticky handling against any scroll it did not initiate.
 * So on WebKit the page keeps its native scrolling — which on a Mac trackpad
 * is already inertial — and everything scrubbed by scroll position reads the
 * window's own event instead (see `onScrollFrame` in lib/scroll.ts). This
 * covers Safari on the desktop and every browser on iOS, which are all
 * WebKit underneath.
 */
const isWebKit = () =>
  typeof navigator !== "undefined" &&
  /AppleWebKit/.test(navigator.userAgent) &&
  !/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/.test(navigator.userAgent);

export function SmoothScroll() {
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;

    const sync = () => {
      // Someone who has asked for reduced motion gets the browser's own
      // scrolling back, immediately and at any point — this is re-read when
      // the preference changes, not only on mount. WebKit gets it always; see
      // the note above.
      if (query.matches || isWebKit()) {
        lenis?.destroy();
        lenis = null;
        registerScroller(null);
        return;
      }
      if (lenis) return;
      lenis = new Lenis({
        // Lenis runs its own animation frame loop; nothing here needs to.
        autoRaf: true,
        // The fraction of the remaining distance covered each frame. The
        // default, and about a fifth of a second to settle: enough to feel
        // carried, short enough that the page never feels like it is lagging
        // behind the wheel.
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: false,
      });
      // Published so anything that moves the page programmatically — the
      // footer's back-to-top — can hand Lenis the job instead of racing it.
      registerScroller(lenis);
    };

    sync();
    query.addEventListener("change", sync);
    return () => {
      query.removeEventListener("change", sync);
      lenis?.destroy();
      registerScroller(null);
    };
  }, []);

  return null;
}
