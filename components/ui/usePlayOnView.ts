"use client";

import { useEffect, useRef } from "react";

import { onScrollFrame } from "@/lib/scroll";

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
  only fires when that is nearly 1. It keeps checking while it is in view
  and anything could be changing it, so a button that fades OUT and back in
  (the hero's, as the page scrolls) plays again each time it is shown.
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

    /*
      IN BURSTS, NOT FOREVER — the fix for a main thread that never went idle.

      This used to poll every 150ms for as long as the element was in view,
      and the hero's note is in view from the first paint for as long as the
      banner is on screen: a `getComputedStyle` up the whole ancestor chain six
      or seven times a second, at rest, indefinitely. Lighthouse could not find
      a quiet moment on the homepage to call it interactive.

      The opacity it watches only changes for a reason: the page scrolls (the
      hero's actions are scrubbed by the scroll), a reveal plays as the element
      arrives, or the tab comes back. So each of those ARMS the same 150ms
      poll for the next ARM_MS, and the poll stops itself once that time is up
      and the last SETTLED checks agree — all shown, or all hidden. Anything
      still in between keeps it running, as before. While anything can be
      changing the cadence is exactly what it was; at rest there is nothing.

      Scroll is heard through `onScrollFrame` (lib/scroll.ts), the site's one
      scroll hub, and only while the element is in view.
    */
    const ARM_MS = 2500;
    const SETTLED = 3;
    let inView = false;
    let until = 0;
    let streak = 0;
    let last: "shown" | "hidden" | "between" | null = null;
    let stopScroll: (() => void) | null = null;

    const hide = () => {
      if (shown) {
        shown = false;
        leave.current();
      }
    };
    const halt = () => {
      window.clearInterval(poll);
      poll = 0;
    };
    const check = () => {
      // Once per check: the walk up the ancestors is the whole cost.
      const opacity = effectiveOpacity(el);
      const visible = opacity > 0.9;
      if (visible && !shown) {
        shown = true;
        enter.current();
      } else if (!visible && opacity < 0.1) {
        hide();
      }
      const state = visible ? "shown" : opacity < 0.1 ? "hidden" : "between";
      streak = state === last ? streak + 1 : 1;
      last = state;
      if (poll && performance.now() >= until && state !== "between" && streak >= SETTLED) halt();
    };
    const arm = () => {
      if (!inView) return;
      until = performance.now() + ARM_MS;
      if (!poll) poll = window.setInterval(check, 150);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") arm();
    };

    const enterView = () => {
      inView = true;
      if (!stopScroll) stopScroll = onScrollFrame(arm);
    };
    const leaveView = () => {
      inView = false;
      stopScroll?.();
      stopScroll = null;
      halt();
    };

    const start = () => {
      io = new IntersectionObserver(
        ([entry]) => {
          halt();
          if (entry.intersectionRatio >= 0.6) {
            enterView();
            check();
            arm();
          } else {
            leaveView();
            if (entry.intersectionRatio === 0) hide();
          }
        },
        { threshold: [0, 0.6] },
      );
      io.observe(el);
      document.addEventListener("visibilitychange", onVisibility);
    };
    const stop = () => {
      io?.disconnect();
      io = null;
      document.removeEventListener("visibilitychange", onVisibility);
      leaveView();
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
