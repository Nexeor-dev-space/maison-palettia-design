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
export function SmoothScroll() {
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;

    const sync = () => {
      // Someone who has asked for reduced motion gets the browser's own
      // scrolling back, immediately and at any point — this is re-read when
      // the preference changes, not only on mount.
      if (query.matches) {
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
