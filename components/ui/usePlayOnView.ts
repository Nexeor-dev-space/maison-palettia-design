"use client";

import { useEffect, useRef } from "react";

/*
  PLAY WHEN IT CAN ACTUALLY BE SEEN — for phones and tablets.

  Where there is no hover to start a crafted button's gesture — a touch
  screen, or any screen narrower than `lg` (1024px), which is a phone or a
  tablet whatever input it reports — this calls `onEnter` each time the
  element comes on screen and `onLeave` each time it goes, so the button
  performs on its own. The narrow-screen half matters: a desktop browser
  narrowed to a phone's width, or devtools' device mode, still reports a
  mouse, and keyed to touch alone the gesture never started there.

  The query is live: resizing across 1024 or switching devtools devices
  turns the behaviour on or off without a reload.

  "On screen" means two things. Most of it is inside the viewport, AND it has
  faded in: the hero's actions sit in the viewport at opacity 0 until the
  photograph has opened (see `.actions` in Hero.module.css), and a gesture
  played then would be played to nobody. So once it intersects, this polls
  the element's effective opacity — its own times every ancestor's — and
  only fires when that is nearly 1. It keeps polling while it is in view, so
  a button that fades OUT and back in (the hero's, as the page scrolls)
  plays again each time it is shown.
*/
export const AUTO_PLAY_QUERY = "(hover: none), (max-width: 1023px)";

/** Whether buttons perform on their own here rather than on hover. */
export function autoPlays(): boolean {
  return typeof window !== "undefined" && window.matchMedia(AUTO_PLAY_QUERY).matches;
}

function effectiveOpacity(el: Element | null) {
  let o = 1;
  for (let n = el; n && n instanceof HTMLElement; n = n.parentElement) {
    o *= parseFloat(getComputedStyle(n).opacity || "1");
    if (o < 0.05) return o;
  }
  return o;
}

export function usePlayOnView<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  onEnter: () => void,
  onLeave: () => void,
) {
  const enter = useRef(onEnter);
  const leave = useRef(onLeave);
  useEffect(() => {
    enter.current = onEnter;
    leave.current = onLeave;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mql = window.matchMedia(AUTO_PLAY_QUERY);
    let io: IntersectionObserver | null = null;
    let poll = 0;
    let shown = false;

    const hide = () => {
      if (shown) {
        shown = false;
        leave.current();
      }
    };
    const check = () => {
      const visible = effectiveOpacity(el) > 0.9;
      if (visible && !shown) {
        shown = true;
        enter.current();
      } else if (!visible && effectiveOpacity(el) < 0.1) {
        hide();
      }
    };

    const start = () => {
      io = new IntersectionObserver(
        ([entry]) => {
          window.clearInterval(poll);
          if (entry.intersectionRatio >= 0.6) {
            check();
            poll = window.setInterval(check, 150);
          } else if (entry.intersectionRatio === 0) {
            hide();
          }
        },
        { threshold: [0, 0.6] },
      );
      io.observe(el);
    };
    const stop = () => {
      io?.disconnect();
      io = null;
      window.clearInterval(poll);
      hide();
    };

    const sync = () => (mql.matches ? start() : stop());
    sync();
    const onChange = () => {
      stop();
      sync();
    };
    mql.addEventListener("change", onChange);
    return () => {
      mql.removeEventListener("change", onChange);
      stop();
    };
  }, [ref]);
}
