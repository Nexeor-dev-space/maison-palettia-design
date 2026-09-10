"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface FooterRevealProps {
  children: ReactNode;
}

/**
 * How much shorter than the window the footer has to be before it is pinned,
 * and how far over it has to go before it is let back into the flow.
 *
 * Two different figures on purpose. A single threshold flips back and forth
 * when the window is near it — which on a phone happens every time the address
 * bar hides — and each flip changes the height of the document under a reader
 * who is mid-scroll. The gap between these two is the dead zone that stops it.
 *
 * Small, because the margin is genuinely tight: this footer runs about 886px
 * at desktop widths against a window that is often only a little taller than
 * that. A dead zone of any size costs pinning on real laptops, so it is kept
 * to the few pixels it takes to absorb a scrollbar appearing.
 */
const PIN_HEADROOM = 8;

/**
 * Pins the footer to the foot of the window and lets the page uncover it.
 *
 * The mirror of the hero. That one is `sticky top-0` and the sections rise
 * over it; this one is fixed at the bottom and the same sections slide up off
 * it, so the page is bracketed by two things that hold still while everything
 * between them travels. The footer is not sliding into view — it has been
 * there the whole time, behind the page.
 *
 * Two pieces make it work, and both live in the layout rather than here:
 *
 *   1. `<main>` carries an opaque ground and sits above this in the stacking
 *      order. That is what hides the footer for the whole of the page; take
 *      the background off and it shows through every seam.
 *   2. `<main>` also carries a bottom margin of exactly this element's height,
 *      which is the scroll distance that lets its foot clear the footer and
 *      uncover it. Without the margin the document ends level with the main
 *      and the footer is never reached.
 *
 * Which is why the height is measured rather than assumed. It is content-
 * driven, and the arch on top of it is sized in `vw`, so it changes with the
 * window and with anything the studio adds; a number written down here would
 * be wrong at most widths and stale after the next edit.
 *
 * THE FOOTER IS ONLY PINNED WHEN IT FITS ON THE SCREEN. `fixed` anchors its
 * foot to the foot of the window, so a footer taller than the window keeps its
 * head above the top of the screen — and being fixed, there is no scrolling to
 * it. On a phone this footer is around 1100px against an 844px screen, which
 * would put the arch and the wordmark permanently out of reach. Where it does
 * not fit it simply stays in the flow and the page ends with it, which is the
 * behaviour every page had before this component existed.
 *
 * Everything degrades to that same layout without JavaScript: the fixed
 * position is only ever applied after mount, and `--footer-height` is never
 * set, so the margin's own `0px` fallback holds. That is what a crawler and a
 * printed page get too, which is the right answer for both.
 */
export function FooterReveal({ children }: FooterRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const root = document.documentElement;
    let pinned = false;

    const sync = () => {
      const height = element.getBoundingClientRect().height;
      const fits = pinned
        ? height <= window.innerHeight
        : height <= window.innerHeight - PIN_HEADROOM;

      if (fits) {
        root.style.setProperty("--footer-height", `${Math.round(height)}px`);
      } else {
        // Not just cosmetic: left behind, it would hold a margin under a page
        // whose footer is back in the flow, and the page would end on a gap.
        root.style.removeProperty("--footer-height");
      }

      if (fits !== pinned) {
        pinned = fits;
        setIsPinned(fits);
      }
    };

    sync();

    // The footer's own height, and the window's. Both move independently —
    // the arch is a share of the width, and the window is the window.
    const observer = new ResizeObserver(sync);
    observer.observe(element);
    window.addEventListener("resize", sync);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
      root.style.removeProperty("--footer-height");
    };
  }, []);

  return (
    <div
      ref={ref}
      // z-0 rather than a negative index: this and <main> are both positioned,
      // so paint order is settled between the two of them without either
      // having to go behind the document's own background. `undefined` rather
      // than an empty string keeps the attribute off the served markup.
      className={isPinned ? "fixed inset-x-0 bottom-0 z-0" : undefined}
    >
      {children}
    </div>
  );
}
