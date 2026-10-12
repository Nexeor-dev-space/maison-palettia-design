"use client";

import { useEffect, useRef, useState } from "react";

import { useSiteChrome } from "@/components/layout/SiteChrome";
import styles from "@/components/motion/SiteLoader.module.css";
import { LogoReveal } from "@/components/sections/hero/LogoReveal";
import { DOODLE_PLAN, RING_ORDER } from "@/components/sections/hero/composition";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { pauseScroller, resumeScroller } from "@/lib/scroll";

/**
 * ==========================================================================
 * The loading animation, on every page — not only the homepage
 * ==========================================================================
 *
 * The client's ask: the opening that plays when the homepage loads should
 * play when ANY page is refreshed. The homepage keeps its own intro (the
 * mark, the wells, the ring that flies into the collage — <HeroIntro>); every
 * other page gets this one, which is the same opening without a collage to
 * land in:
 *
 *   1. the Light Sage ground and the mark written letter by letter — the same
 *      <LogoReveal>, the same pen, the same pace (WRITE_MS);
 *   2. the six paint wells fill the "P";
 *   3. the homepage's own ring of nine cut-outs bursts out from behind the
 *      mark — the same shapes, places, spring and stagger (DOODLE_PLAN);
 *   4. the mark flies up to the header's logo as the cut-outs scatter and the
 *      ground fades, and the page is there underneath.
 *
 * ON A REAL PAGE LOAD ONLY. The <head> script (sections/hero/intro.ts) writes
 * `data-loader="write"` before the first paint, on every path but "/", unless
 * the reader has asked for reduced motion. A client-side navigation never
 * runs that script, so moving around the site never replays this — the
 * layout, and this component in it, persist across pages.
 *
 * THE WRITING STARTS WITH THE PAGE, NOT WITH REACT: it is CSS on the `write`
 * state (see `.pen` in Hero.module.css). This component's clock starts after
 * the first paint, so the dots always follow a finished word, however long
 * the page takes to hydrate.
 *
 * AN ESCAPE, AS THE HOMEPAGE HAS ONE. Any key, wheel or tap goes straight to
 * the way out — a loader must never hold someone who wants to be in. And a
 * CSS failsafe takes the ground away after six seconds if this never runs.
 */

/* The same pen and the same wells as the homepage intro — see <HeroIntro>. */
const WRITE_MS = 900;
const DOT_STEP = 62;
const DOTS_AT = WRITE_MS - 40;
const BURST_AT = DOTS_AT + 380;
const FLY_AT = BURST_AT + 600; // the homepage holds the ring this long before the mark lifts
const OUT_MS = 820; // the flight and the fade, then the loader is gone

/*
  THE RING IS THE HOMEPAGE'S — the same nine plans <HeroIntro> bursts, in its
  order, clockwise from twelve. Read from ./sections/hero/composition.ts, so a
  change to the homepage's ring is a change to this one.
*/
const RING = RING_ORDER.map((id) => DOODLE_PLAN.find((plan) => plan.id === id)).filter(
  (plan): plan is (typeof DOODLE_PLAN)[number] => Boolean(plan),
);
/** The homepage's steps: 12ms between bursts, 11ms between scatters. */
const BURST_STEP = 12;
const SCATTER_STEP = 11;
/** The gap the homepage keeps between the widest cut-out and the screen's edge. */
const RING_MARGIN = 8;

type Vars = React.CSSProperties & Record<`--${string}`, string | number>;

/** Run `fn` once the browser has painted the current state. */
function nextPaint(fn: () => void): () => void {
  let second = 0;
  const first = requestAnimationFrame(() => {
    second = requestAnimationFrame(fn);
  });
  return () => {
    cancelAnimationFrame(first);
    cancelAnimationFrame(second);
  };
}

export function SiteLoader() {
  const { logo: brandLogo } = useSiteChrome();
  const brandLogoRef = useRef(brandLogo);
  useEffect(() => {
    brandLogoRef.current = brandLogo;
  }, [brandLogo]);

  const markRef = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    // Not a page load that plays the loader: this is the homepage, a reader
    // who asked for less motion, or the script never ran. Draw nothing again.
    // (A frame later rather than in the effect body: the markup is hidden by
    // CSS anyway, so this only drops it from the DOM.)
    if (html.dataset.loader !== "write") {
      const frame = requestAnimationFrame(() => setGone(true));
      return () => cancelAnimationFrame(frame);
    }

    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

    html.style.overflow = "hidden";
    pauseScroller();
    let locked = true;
    const unlock = () => {
      if (!locked) return;
      locked = false;
      html.style.removeProperty("overflow");
      resumeScroller();
    };

    /*
      INK TO INK, as the homepage intro aims: the mark is the vector, whose
      box is the lettering alone; the header's logo is a PNG with transparent
      margins round the same lettering. So the flight aims at the letters
      inside the header's image — its box trimmed by the margins measured for
      whichever cut it shows — and scales by the ratio of the two inks.
    */
    const aim = () => {
      const mark = markRef.current;
      const target = document.querySelector<HTMLImageElement>('body > header a[aria-label$="home"] img');
      if (!mark || !target) return;
      const cuts = brandLogoRef.current;
      const cut = cuts.onLight && target.getAttribute("width") === String(cuts.onLight.width) ? cuts.onLight : cuts;
      const from = mark.getBoundingClientRect();
      const box = target.getBoundingClientRect();
      if (from.width === 0 || box.width === 0) return;
      const to = {
        left: box.left + box.width * cut.ink.left,
        top: box.top + box.height * cut.ink.top,
        width: box.width * cut.ink.width,
        height: box.height * cut.ink.height,
      };
      mark.style.setProperty("--logo-x", `${to.left + to.width / 2 - (from.left + from.width / 2)}px`);
      mark.style.setProperty("--logo-y", `${to.top + to.height / 2 - (from.top + from.height / 2)}px`);
      mark.style.setProperty("--logo-s", `${to.width / from.width}`);
    };

    let flown = false;
    const fly = () => {
      if (flown) return;
      flown = true;
      timers.forEach(clearTimeout);
      timers.length = 0;
      detach();
      aim();
      html.dataset.loader = "fly";
      unlock();
      later(() => {
        delete html.dataset.loader;
        setGone(true);
      }, OUT_MS);
    };

    const onKey = (event: KeyboardEvent) => {
      if (["Shift", "Control", "Alt", "Meta", "Tab"].includes(event.key)) return;
      fly();
    };
    const attach = () => {
      window.addEventListener("keydown", onKey);
      window.addEventListener("wheel", fly, { passive: true });
      window.addEventListener("pointerdown", fly, { passive: true });
    };
    const detach = () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", fly);
      window.removeEventListener("pointerdown", fly);
    };

    /*
      HOW FAR OUT THE RING SITS, measured as the homepage measures it: the
      largest share of each cut-out's reach that still leaves its turned box
      inside the screen, capped at 1 (a desktop) and floored at 0.6.
    */
    const fitRing = () => {
      const mark = markRef.current;
      const loader = mark?.parentElement;
      if (!mark || !loader) return;
      const unit = mark.offsetWidth || Math.min(window.innerWidth, window.innerHeight) * 0.4;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let ring = 1;
      loader.querySelectorAll<HTMLElement>("[data-piece]").forEach((el) => {
        const plan = RING.find((p) => p.id === el.dataset.piece);
        if (!plan || el.offsetWidth === 0) return;
        const w = plan.flower.width * unit;
        const h = w * (el.offsetHeight / el.offsetWidth);
        const turn = (plan.flower.rotate * Math.PI) / 180;
        const halfW = (w * Math.abs(Math.cos(turn)) + h * Math.abs(Math.sin(turn))) / 2;
        const halfH = (w * Math.abs(Math.sin(turn)) + h * Math.abs(Math.cos(turn))) / 2;
        const reachX = Math.abs(plan.flower.x) * unit;
        const reachY = Math.abs(plan.flower.y) * unit;
        if (reachX > 0) ring = Math.min(ring, (vw / 2 - halfW - RING_MARGIN) / reachX);
        if (reachY > 0) ring = Math.min(ring, (vh / 2 - halfH - RING_MARGIN) / reachY);
      });
      loader.style.setProperty("--ring", Math.max(0.6, ring).toFixed(3));
    };

    const cancelPaint = nextPaint(() => {
      fitRing();
      attach();
      later(() => {
        html.dataset.loader = "dots";
      }, DOTS_AT);
      later(() => {
        html.dataset.loader = "burst";
      }, BURST_AT);
      later(fly, FLY_AT);
    });

    // Teardown never finishes the loader: React runs this effect twice in
    // development, and the second run must still find `write`.
    return () => {
      cancelPaint();
      timers.forEach(clearTimeout);
      detach();
      unlock();
    };
  }, []);

  if (gone) return null;

  return (
    <div aria-hidden className={styles.loader}>
      <div className={styles.ground} />
      {RING.map((plan, i) => (
        <span
          key={plan.id}
          data-piece={plan.id}
          className={styles.piece}
          style={
            {
              "--fx": plan.flower.x,
              "--fy": plan.flower.y,
              "--fw": plan.flower.width,
              "--fr": `${plan.flower.rotate}deg`,
              "--burst-delay": `${i * BURST_STEP}ms`,
              "--settle-delay": `${i * SCATTER_STEP}ms`,
            } as Vars
          }
        >
          <DoodleMark name={plan.name} color={plan.color} treatment="stamp" depth={0} />
        </span>
      ))}
      <div ref={markRef} className={styles.mark}>
        <LogoReveal writeMs={WRITE_MS} dotStepMs={DOT_STEP} />
      </div>
    </div>
  );
}
