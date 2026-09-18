"use client";

import { useLayoutEffect, useRef } from "react";

import { DOODLE_PLAN, DRAW_ORDER } from "@/components/sections/hero/composition";
import styles from "@/components/sections/hero/Hero.module.css";
import { LogoReveal } from "@/components/sections/hero/LogoReveal";
import { BRAND_LOGO } from "@/lib/constants";
import { onScrollFrame, pauseScroller, resumeScroller } from "@/lib/scroll";

/*
  The sequence, in milliseconds. These must agree with Hero.module.css, which
  owns the individual transitions; this only decides when each phase begins.
*/
/*
  The draw phase has to outlast the last dot, not merely reach it: measured,
  the sixth dot begins at 2032ms and its pop runs 300ms, so at 2300 the flight
  was taking the mark away 32ms before it had finished arriving. 2400 leaves
  the margin.
*/
const DRAW_MS = 2400; // the logo writes itself, the dots arrive, the flower draws
const WRITE_MS = 2050; // the pen writing the mark, first stroke to last dot
/*
  Each palette dot in the "P", after the one before. At 55ms the six were over
  in 275ms, which is a flicker rather than a count — the client asked twice for
  them "one by one", and this is the number that makes it read. Six at 85ms is
  425ms of arrivals, and DRAW_MS holds long enough for the last one's pop to
  finish before the mark flies to the bar.
*/
const DOT_STEP = 85;
const SETTLE_MS = 2000; // doodles fly home behind the photograph, it blooms open, the words rise
const ENTER_MS = 1400; // the short entrance on a return without a reload

/*
  THE BEATS ARE SET BY THE LAST PETAL, NOT THE FIRST.

  Eighteen shapes now trace the flower, five more than the ring was tuned for,
  and a stagger is a multiplication: at the old 65ms the eighteenth shape began
  at 1265ms, its pop ran to 1965ms and its fill to 2145ms — both past the
  1800ms `settle` then took the flower apart at, so the last two petals would
  have snapped rather than finished. 44ms puts the last one's delay at 908ms,
  its outline home at 1668ms and its fill at 1808ms — the whole bouquet drawn
  before anything moves.

  The draw now holds to 2050ms, for the mark rather than the flower: written
  from its vector, letter by letter, it needs 1.8s to read as a hand and not
  as a wipe, and the flower simply rests, finished, for the last quarter
  second.

  THE MARK IS OPAQUE FROM THE FIRST FRAME. Its container used to fade and
  scale in over 800ms while the writing started underneath, so the first
  letters arrived half-transparent — a fade doing the revealing, which is the
  one thing the client ruled out. The mask hides everything until the pen
  moves, so the container has nothing to hide and no longer fades at all.
*/
const DRAW_START = 160; // first shape begins tracing
const DRAW_STEP = 44; // each following shape, this much later
const SETTLE_STEP = 22; // flights leave in the same order, a beat apart
const ENTER_STEP = 28; // the short entrance's shapes, a beat apart

/*
  How much of the frame's hold the opening takes; it rests fully open for the
  rest. Lowered with the track lengthened (see `.track`): the picture is now
  open well before the hold ends, and the last stretch is the pause the client
  asked for — the banner full bleed, holding, before the page moves on.
*/
const OPENING_SHARE = 0.52;
/* Where the words land, as a share of the screen's height: below both faces in the photograph. */
const COPY_LANDING = 0.7;
/* The opening progress at which the two actions become usable, and the cue stops being. */
const ACTIONS_FROM = 0.62;
const CUE_UNTIL = 0.12;

const REDUCED = "(prefers-reduced-motion: reduce)";


/*
  Clear air kept between the supporting line and the scroll cue under the
  resting card. Every pixel taken out of the foot is a pixel the photograph
  gains, which is what the client asked for — so this, `--copy-gap` and `--wt`
  were all trimmed together, and the cue still has its own bottom offset under
  this.
*/
const CUE_CLEARANCE = 14;

/**
 * Sizes the banner's foot — the space under the resting card — to exactly
 * what sits in it, so the photograph takes the rest of the screen and nothing
 * under it can overlap at any height.
 *
 * What sits there: the gap, the tagline and its supporting line, clear air,
 * and the scroll cue at the bottom edge. Under reduced motion the cue is not
 * shown and the two actions are, so the whole block of words counts instead.
 *
 * Read from layout — `offsetTop` and `offsetHeight` — rather than from
 * on-screen boxes, which include the intro's transforms: the words are still
 * rising out of their masks when this first runs.
 */
function fitFoot(frame: HTMLElement, copy: HTMLElement, cue: HTMLElement) {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const raw = getComputedStyle(frame).getPropertyValue("--copy-gap").trim();
  const gap = raw.endsWith("rem") ? parseFloat(raw) * rem : parseFloat(raw) || 0;

  let foot: number;
  if (window.matchMedia(REDUCED).matches) {
    foot = gap + copy.offsetHeight + rem;
  } else {
    const line = copy.querySelector("p");
    const words = line ? line.offsetTop + line.offsetHeight : copy.offsetHeight;
    const cueFromEdge = parseFloat(getComputedStyle(cue).bottom) || 0;
    foot = gap + words + CUE_CLEARANCE + cue.offsetHeight + cueFromEdge;
  }
  frame.style.setProperty("--wb", `${Math.ceil(foot)}px`);
}

/**
 * Two frames, so a style change lands after the browser has painted the one
 * before it. Returns a cancel function: an effect torn down between the frames
 * — React runs every effect twice in development — must be able to stop it.
 */
function nextPaint(fn: () => void): () => void {
  let inner = 0;
  const outer = requestAnimationFrame(() => {
    inner = requestAnimationFrame(fn);
  });
  return () => {
    cancelAnimationFrame(outer);
    cancelAnimationFrame(inner);
  };
}

/**
 * The intro — the logo, and the bouquet the doodles draw around it before they
 * fly home behind the banner's photograph — and, once it is over, the banner's
 * opening on scroll and the doodles' pointer depth.
 *
 * The only part of the banner that needs JavaScript. Everything it animates is
 * server-rendered by <Hero> — the photograph, the words, and the doodles
 * around it — and this finds them in the DOM, measures them once, and then
 * only ever changes `data-intro` on <html> and two pointer variables. The
 * stylesheet does the rest.
 *
 * Measured, not placed: each doodle is laid out in its place behind the card
 * from the first render; before anything shows, its box is measured and the
 * transform that would put it in a bouquet around the centre of the screen is
 * written onto it. The flight home is that transform transitioning back to
 * none, so the bouquet is centred on any screen and every shape lands exactly.
 *
 * Under reduced motion there is no intro and no depth. The banner is simply
 * shown composed.
 */
export function HeroIntro() {
  const logoRef = useRef<HTMLDivElement>(null);

  /* ------------------------------------------------------------------ fit */
  // First, so the intro below measures the doodles in the card's final place.
  useLayoutEffect(() => {
    const hero = logoRef.current?.closest("section");
    const frame = hero?.querySelector<HTMLElement>("[data-hero-frame]");
    const copy = hero?.querySelector<HTMLElement>("[data-hero-copy]");
    const cue = hero?.querySelector<HTMLElement>("[data-hero-cue]");
    if (!frame || !copy || !cue) return;

    const refit = () => fitFoot(frame, copy, cue);
    refit();
    // The tagline's height changes when the script face arrives.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) refit();
    });
    // Registered before the scroll effect's own listener, so on a resize the
    // foot is refitted before the words' landing is measured against it.
    window.addEventListener("resize", refit);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", refit);
    };
  }, []);

  useLayoutEffect(() => {
    const html = document.documentElement;
    const logo = logoRef.current;
    const hero = logo?.closest("section");
    if (!hero) return;

    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    let cancelPaint = () => {};

    /* ---- reduced motion: the hero composed, and nothing else ---- */
    if (window.matchMedia(REDUCED).matches) {
      html.dataset.intro = "done";
      return;
    }

    /*
      EVERY PAGE LOAD PLAYS THE INTRO — a first visit, a return, a refresh.
      `play` is written only by the script in <head> (./intro.ts), and only on
      a real load of the homepage, so it is the one state that plays it.
      Anything else means the homepage is being shown again inside the site —
      by a link back from another page, or after leaving mid-intro — and gets
      the short entrance rather than holding someone moving around the site.

      React runs this effect twice in development; the first run is torn down
      before it changes the state, so the second still finds `play`.
    */
    const play = html.dataset.intro === "play";

    const doodles = Array.from(hero.querySelectorAll<HTMLElement>("[data-doodle]"));
    const order = (el: HTMLElement) => DRAW_ORDER.indexOf(el.dataset.doodle ?? "");

    let locked = false;
    const unlock = () => {
      if (!locked) return;
      locked = false;
      html.style.removeProperty("overflow");
      resumeScroller();
    };

    /*
      Scroll restoration stays off for as long as the homepage is showing, in
      either case below. The browser decides whether to restore when reload is
      pressed, from the page being left — so for a refresh from halfway down to
      start at the top, where the intro happens, it has to be off already then,
      not merely switched off by the new page. Handed back on the way out, so
      back and forward still return people to their place on every other page.
    */
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const releaseRestoration = () => {
      if ("scrollRestoration" in history) history.scrollRestoration = "auto";
    };

    const finish = () => {
      html.dataset.intro = "done";
      unlock();
    };

    /* ---- the homepage again, without a reload ---- */
    if (!play) {
      html.dataset.intro = "skip";
      doodles.forEach((el) => el.style.setProperty("--enter-delay", `${80 + order(el) * ENTER_STEP}ms`));
      hero.style.setProperty("--bloom-delay", "0ms");
      cancelPaint = nextPaint(() => {
        html.dataset.intro = "enter";
        later(finish, ENTER_MS);
      });
      return () => {
        cancelPaint();
        timers.forEach(clearTimeout);
        releaseRestoration();
      };
    }

    /* ---- the intro ---- */
    // At the top before anything is measured, and instantly: the page's
    // `scroll-behavior: smooth` would otherwise glide it up under the bouquet.
    // It can only have moved if someone scrolled while it was still loading.
    if (window.scrollY !== 0) window.scrollTo({ top: 0, behavior: "instant" });
    html.dataset.intro = "play";
    html.style.overflow = "hidden";
    pauseScroller();
    locked = true;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    /*
      The flower is measured in widths of the logo at its centre, so the petals
      keep the same close ring around it at every size. `offsetWidth` is its
      laid-out width — the entrance animation is still scaling it — and the
      fallback only covers a logo that has somehow not been laid out.
    */
    const unit = logo?.offsetWidth || Math.min(vw, vh) * 0.4;
    const plans = new Map(DOODLE_PLAN.map((plan) => [plan.id, plan]));
    for (const el of doodles) {
      const plan = plans.get(el.dataset.doodle ?? "");
      const box = el.getBoundingClientRect();
      if (!plan || box.width === 0) continue;
      const i = order(el);
      el.style.setProperty("--fx", `${vw / 2 + plan.flower.x * unit - (box.left + box.width / 2)}px`);
      el.style.setProperty("--fy", `${vh / 2 + plan.flower.y * unit - (box.top + box.height / 2)}px`);
      el.style.setProperty("--fs", `${(plan.flower.width * unit) / box.width}`);
      el.style.setProperty("--fr", `${plan.flower.rotate}deg`);
      el.style.setProperty("--draw-delay", `${DRAW_START + i * DRAW_STEP}ms`);
      el.style.setProperty("--settle-delay", `${i * SETTLE_STEP}ms`);
    }

    // Where the logo lands: the logo in the header bar, measured while the bar
    // is hidden but still laid out.
    const aimLogo = () => {
      const target = document.querySelector<HTMLImageElement>('body > header a[aria-label$="home"] img');
      if (!logo || !target) return;
      /*
        INK TO INK. The intro's mark is the vector, whose box is the lettering
        alone; the header's is a PNG with transparent margins around the same
        lettering — different ones in each cut. So the flight aims at the
        letters inside the header's image, not at its box: the image's rect
        is trimmed by the margins measured for whichever cut it is showing
        (the `width` attribute is the file's own, so it tells the two apart),
        and the scale is the ratio of the two inks. Landed, the vector's
        letters sit on the PNG's to within a pixel, and the handover is
        invisible.
      */
      const cut = target.getAttribute("width") === String(BRAND_LOGO.onLight.width) ? BRAND_LOGO.onLight : BRAND_LOGO;
      const from = logo.getBoundingClientRect();
      const box = target.getBoundingClientRect();
      if (from.width === 0 || box.width === 0) return;
      const to = {
        left: box.left + box.width * cut.ink.left,
        top: box.top + box.height * cut.ink.top,
        width: box.width * cut.ink.width,
        height: box.height * cut.ink.height,
      };
      logo.style.setProperty("--logo-x", `${to.left + to.width / 2 - (from.left + from.width / 2)}px`);
      logo.style.setProperty("--logo-y", `${to.top + to.height / 2 - (from.top + from.height / 2)}px`);
      logo.style.setProperty("--logo-s", `${to.width / from.width}`);
    };

    const skip = (event: Event) => {
      if (event instanceof KeyboardEvent && ["Shift", "Control", "Alt", "Meta"].includes(event.key)) return;
      if (html.dataset.intro === "draw") settle();
    };
    const attach = () => {
      window.addEventListener("keydown", skip);
      window.addEventListener("pointerdown", skip);
      window.addEventListener("wheel", skip, { passive: true });
      window.addEventListener("touchstart", skip, { passive: true });
    };
    const detach = () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", skip);
    };

    function settle() {
      timers.forEach(clearTimeout);
      timers.length = 0;
      detach();
      aimLogo();
      html.dataset.intro = "settle";
      // Every flight is relative to layout, not to the screen, so the page may
      // scroll while the shapes finish arriving.
      unlock();
      later(finish, SETTLE_MS);
    }

    cancelPaint = nextPaint(() => {
      html.dataset.intro = "draw";
      attach();
      later(settle, DRAW_MS);
    });

    // Teardown never forces `done`: a development remount must be free to
    // start again, and every rule the intro applies is scoped to this page.
    // A development remount releases restoration and takes it again in the
    // same task, so the browser never gets a moment to restore in between.
    return () => {
      cancelPaint();
      timers.forEach(clearTimeout);
      detach();
      unlock();
      releaseRestoration();
    };
  }, []);

  /* --------------------------------------------------------------- scroll */
  useLayoutEffect(() => {
    const hero = logoRef.current?.closest("section");
    const track = hero?.querySelector<HTMLElement>("[data-hero-track]");
    const frame = hero?.querySelector<HTMLElement>("[data-hero-frame]");
    const copy = hero?.querySelector<HTMLElement>("[data-hero-copy]");
    const actions = hero?.querySelector<HTMLElement>("[data-hero-actions]");
    const cue = hero?.querySelector<HTMLElement>("[data-hero-cue]");
    if (!track || !frame || !copy || !actions || !cue) return;

    // Reduced motion: nothing opens, and the two actions are simply there.
    if (window.matchMedia(REDUCED).matches) return;

    /*
      The frame is sticky inside its track. Measured here, on load, on resize
      and once the fonts have arrived (the tagline's height depends on them):

        start, end ... the scroll positions between which the photograph
                       opens: from the top of the track to most of the way
                       through the hold, so it rests fully open for the last
                       stretch before the page moves on.
        copy shift ... how far the words rise, so their block lands centred a
                       little below the middle of the screen, whatever its
                       height at this width.
    */
    let start = 0;
    let end = 1;
    const measure = () => {
      const trackTop = track.getBoundingClientRect().top + window.scrollY;
      const hold = Math.max(1, track.offsetHeight - frame.offsetHeight);
      start = trackTop;
      end = trackTop + hold * OPENING_SHARE;
      const landing = frame.offsetHeight * COPY_LANDING - copy.offsetHeight / 2;
      frame.style.setProperty("--copy-shift", `${Math.round(landing - copy.offsetTop)}px`);
    };

    /*
      Invisible things must not be reachable: the actions are inert until the
      words are inside the picture, the cue once it has faded. Written only
      when the answer changes, not on every frame.
    */
    let actionsLive: boolean | null = null;
    let cueLive: boolean | null = null;

    /*
      WRITTEN IN THE SAME FRAME AS THE SCROLL, not the next one.

      This used to schedule a `requestAnimationFrame` from the scroll event.
      Lenis drives the page from its own frame loop — it moves the scroll, the
      browser fires `scroll`, and a callback scheduled there does not run until
      the frame after. So every frame was painted with the new scroll position
      and the previous frame's `--p`: the page moved, and the picture inside
      the sticky frame followed one frame behind, which reads as the banner
      shaking against the page rather than being carried by it.

      Writing here is safe because this handler only ever writes: `measure()`
      has already cached the two scroll positions, so nothing below reads
      layout and nothing can thrash it.

      Being called in the right frame is `onScrollFrame`'s job — it subscribes
      to Lenis where Lenis is running, and to the window's own event where it
      is not. See the note there.
    */
    const write = () => {
      const t = Math.min(1, Math.max(0, (window.scrollY - start) / (end - start)));
      // Smoothstep: the opening gathers pace and then settles, rather than
      // tracking the scrollbar mechanically.
      const p = t * t * (3 - 2 * t);
      frame.style.setProperty("--p", p.toFixed(4));

      const nextActions = p >= ACTIONS_FROM;
      if (nextActions !== actionsLive) {
        actionsLive = nextActions;
        actions.inert = !nextActions;
      }
      const nextCue = p < CUE_UNTIL;
      if (nextCue !== cueLive) {
        cueLive = nextCue;
        cue.inert = !nextCue;
      }
    };
    const onScroll = write;
    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    write();
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (cancelled) return;
      measure();
      write();
    });
    const stopScroll = onScrollFrame(onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      stopScroll();
      window.removeEventListener("resize", onResize);
      actions.inert = false;
      cue.inert = false;
    };
  }, []);

  /* -------------------------------------------------------------- pointer */
  useLayoutEffect(() => {
    const hero = logoRef.current?.closest("section");
    if (!hero) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia(REDUCED).matches) return;

    let frameId = 0;
    const onMove = (event: PointerEvent) => {
      if (document.documentElement.dataset.intro !== "done") return;
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const box = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", (((event.clientX - box.left) / box.width) * 2 - 1).toFixed(3));
        hero.style.setProperty("--my", (((event.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
      });
    };
    const onLeave = () => {
      hero.style.setProperty("--mx", "0");
      hero.style.setProperty("--my", "0");
    };
    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frameId);
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    /*
      The official artwork, never redrawn — now from the client's Illustrator
      file rather than a PNG. It writes itself: each letter is uncovered along
      the path a pen would take, in writing order, and the six dots in the "P"
      arrive one by one at the end. See <LogoReveal>. The box is the
      lettering's own; the flight above aims at the header's letters, not its
      file, so the two still meet exactly.
    */
    <div ref={logoRef} aria-hidden className={styles.introLogo}>
      <LogoReveal writeMs={WRITE_MS} dotStepMs={DOT_STEP} />
    </div>
  );
}
