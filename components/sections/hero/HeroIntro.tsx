"use client";

import { useLayoutEffect, useRef } from "react";

import { DOODLE_PLAN, DRAW_ORDER } from "@/components/sections/hero/composition";
import { DOODLES } from "@/components/sections/hero/doodles";
import styles from "@/components/sections/hero/Hero.module.css";
import { LogoReveal } from "@/components/sections/hero/LogoReveal";
import { BRAND_LOGO } from "@/lib/constants";
import { onScrollFrame, pauseScroller, resumeScroller } from "@/lib/scroll";

/*
  The sequence, in milliseconds. These must agree with Hero.module.css, which
  owns the individual transitions; this only decides when each phase begins.
*/
/*
  The draw phase has to outlast the last dot, not merely reach it. With the
  numbers below the sixth dot leaves at 2607ms and takes 240ms to fly, so it is
  home at 2847 and this holds 103ms past it.
*/
const DRAW_MS = 2950; // the logo writes itself, the dots arrive, the flower draws
/*
  WRITE_MS COVERS THE LETTERS AND THE DOTS TOGETHER, which is why it moves
  whenever DOT_STEP does. `schedule()` in <LogoReveal> subtracts the dots'
  whole span from this before it divides what is left among the pen strokes —
  so raising DOT_STEP alone does not slow the dots down, it speeds the
  HANDWRITING up to pay for them. Raising this by exactly the same amount
  keeps the ink budget where it was: the letters write at the pace they were
  tuned to and the dots get their extra time from the phase, not from the pen.

  2050 -> 2740 is that arithmetic: the dots' span goes 60 + 6x85 = 570 to
  60 + 6x200 = 1260, and 2050 + 690 = 2740.
*/
const WRITE_MS = 2740; // the pen writing the mark, first stroke to last dot
/*
  Each palette dot in the "P", after the one before — and the whole point is
  that it is AFTER, not overlapping.

  THIS IS THE THIRD TIME AT THIS NUMBER, so the reasoning is worth keeping. It
  was 55, which put the six away in 275ms; then 85, which this comment used to
  call "the number that makes it read". It did not, and the reason is that the
  step was only ever half the story: a dot's flight is what decides whether the
  one behind it has landed yet. At 85 against a 420ms flight all six were in
  the air at once for most of the sequence — six dots arriving together with a
  slight lean, which is a burst, not a count.

  So the pair is set together now. The flight is 240ms (./Hero.module.css) and
  the step is 200, so each dot is 40ms off the ground when the next one leaves
  — near enough to sequential to count out loud, and still overlapping just
  enough that the row does not read as six separate events.
*/
const DOT_STEP = 200;
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
const DRAW_START = 140; // first piece the clock sends in, if no hand has
/*
  78ms, AND THE ARITHMETIC IS THE FLIGHT'S.

  A piece takes 780ms to come in from off-screen (./Hero.module.css owns that
  number), and DRAW_MS ends the phase at 2400 — set by the last dot in the
  mark, not by the collage. So the last of the eighteen has to leave by 1620ms
  to be home in time, and 140 + 17 × 78 = 1466 lands it at 2246, with 154ms of
  rest before anything moves.

  It is deliberately most of the phase. The cadence before the collage was 44ms
  and had the whole bouquet finished by 1670 — the clock was winning a race it
  is not supposed to be in, and anyone who reached for it after a second and a
  half found nothing left to bring in.
*/
const DRAW_STEP = 78; // each following piece, this much later

/*
  THE CANVAS — what a hand does, and what happens if none arrives.

  SPLATS is the pool of marks, used round-robin. Ten covers the fastest sweep
  anyone can make across the ring inside one mark's 620ms life; an eleventh
  would only ever replace one already faded.

  REACH is how far the hand's pull carries, from the logo's own measured width
  so it holds the same proportion of the ring on a phone as on a desktop —
  clamped, because a very small logo would otherwise want a pull too fine to
  aim and a very large one a pull that takes the whole collage in a stroke.

  AWAY is where a piece waits before it is sent for, as a share of the screen's
  diagonal: 0.62 of it from the middle clears every corner at every ratio I
  tested, so nothing is ever seen hanging at an edge.

  WRITE_TAIL is the mark's last dot finishing after the pen stops, and is what
  the early finish waits for: painting the bouquet quickly is rewarded, but not
  by cutting the logo's writing short, which is the one thing the client asked
  twice to keep.
*/
const SPLATS = 10;
/*
  THE BRUSH, AS AN ACTUAL CURSOR.

  The client asked to explore a paintbrush or colour-dropper pointer, and the
  brand rules say the visual language is the deck's cut-outs — so the pointer
  is one. `splash` is drawn at CURSOR_PX into a data URI and handed to the CSS
  `cursor` property, filled with the colour of the next piece due to land: a
  brush already loaded with the colour it is about to lay down, which is the
  dropper idea and the brush idea in the same mark.

  A real cursor rather than an element chasing the pointer, which is the whole
  reason to do it this way: the compositor draws it, so it cannot lag behind
  the hand, and it costs nothing per frame. The string is rebuilt only when the
  next colour changes — at most eighteen times in the life of the intro.

  26px because a cursor bitmap over about 32px is ignored by some browsers, and
  the hotspot is its middle so the mark sits where the pointer actually is.
*/
const CURSOR_PX = 26;
const REACH_SHARE = 0.42;
const REACH_MIN = 96;
const REACH_MAX = 240;
const TAP_REACH = 1.3;
const AWAY = 0.62;
const TURN = 21; // degrees a piece is turned off its resting angle, in flight
const WRITE_TAIL = 240;
const KEY_STROKE = 2; // shapes a key press lays down
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
  resting card.

  IT SCALES WITH THE TYPE, and it did not use to. A flat 10px was set when the
  foot was trimmed to give the photograph every pixel it could have — but the
  supporting line is sized in `vw`, so on a wide screen 10px sits under 26px
  text set on a 39px line, and the cue's label came up against the descenders
  of "mindfulness, and community." On the machine it was measured on it cleared
  by 13.9px; a slightly different face, a text-size preference or a rounding
  difference closes that, and the client saw the two collide.

  So the floor is 20px and the real figure is a fraction of the line the words
  are actually set on, which holds the same proportion at every width. The cost
  is about 3% of the photograph's height — the smallest amount that makes the
  cue a separate thing from the sentence above it.
*/
const CUE_CLEARANCE_MIN = 20;
const CUE_CLEARANCE_RATIO = 0.7;

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
    // `lineHeight` computes to a pixel length in every engine that matters; if
    // it ever answers `normal`, the floor below is what applies.
    const lead = line ? parseFloat(getComputedStyle(line).lineHeight) : NaN;
    const clearance = Math.max(CUE_CLEARANCE_MIN, Math.round((lead || 0) * CUE_CLEARANCE_RATIO));
    const cueFromEdge = parseFloat(getComputedStyle(cue).bottom) || 0;
    foot = gap + words + clearance + cue.offsetHeight + cueFromEdge;
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
  const splatsRef = useRef<HTMLDivElement>(null);

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
    /*
      And whenever the words themselves change height, for any reason the two
      lines above do not name: a face swapping in after `fonts.ready` has
      already resolved, a browser text-size preference, a zoom that reflows the
      tagline onto two lines. The foot is reserved from a measurement, so it is
      only ever as right as the last measurement — this is what keeps it
      current instead of trusting that nothing moves after load.
    */
    const ro = new ResizeObserver(refit);
    ro.observe(copy);
    return () => {
      cancelled = true;
      ro.disconnect();
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
    /*
      How far out the petals sit, as a multiple of the measured radius.

      One on anything but a phone. On a narrow screen the ring was 98.5% of the
      width with its outermost petals 9px past both edges — measured at 375 and
      390 — so the flower was being cropped by the screen rather than framed by
      it. Drawing it in a little is what a tighter bouquet needs there, and it
      costs nothing at the sizes where the ring already has room.
    */
    const ring = vw < 640 ? 0.93 : 1;
    const plans = new Map(DOODLE_PLAN.map((plan) => [plan.id, plan]));
    /*
      Where every shape will sit, kept as it is placed rather than measured
      again later — the same arithmetic, the same filter. A shape with no box
      is one the width has taken out of the layout (`desktopOnly` below 768),
      and it must be left out of both, or the bouquet could never be finished.
    */
    const targets: { el: HTMLElement; color: string; x: number; y: number }[] = [];
    const away = Math.hypot(vw, vh) * AWAY;
    /*
      EVERY PIECE IS MEASURED WHERE IT LIES, NOT WHERE IT IS WAITING.

      `play` now carries the away transform, which means an element that has
      been through this once is translated off-screen and scaled when the loop
      below reads its box — and React runs this effect twice in development,
      and again on any remount. Measured that way, `--fx` is the distance from
      a position off the screen to the ring, so every piece "lands" somewhere
      out at the edges: the collage assembles into nothing at all.

      The flight's own properties therefore come off first, in one pass over
      all of them, so the single forced layout the next line triggers is paid
      once rather than eighteen times.
    */
    const FLIGHT_VARS = ["--ax", "--ay", "--ar", "--fx", "--fy", "--fs"] as const;
    for (const el of doodles) {
      for (const prop of FLIGHT_VARS) el.style.removeProperty(prop);
    }
    for (const el of doodles) {
      const plan = plans.get(el.dataset.doodle ?? "");
      const box = el.getBoundingClientRect();
      if (!plan || box.width === 0) continue;
      const i = order(el);
      const x = vw / 2 + plan.flower.x * unit * ring;
      const y = vh / 2 + plan.flower.y * unit * ring;
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      el.style.setProperty("--fx", `${x - cx}px`);
      el.style.setProperty("--fy", `${y - cy}px`);
      el.style.setProperty("--fs", `${(plan.flower.width * unit) / box.width}`);
      el.style.setProperty("--fr", `${plan.flower.rotate}deg`);
      el.style.setProperty("--settle-delay", `${i * SETTLE_STEP}ms`);
      /*
        WHERE IT WAITS. On the ray from the middle of the screen through its
        own place in the ring, pushed out past every corner — so a piece flies
        in along the line it will end up on rather than across the composition,
        and eighteen of them arriving read as one gathering rather than as
        traffic. A place in the ring that is almost dead centre has no ray of
        its own to speak of, so it takes an angle from its position in the
        order instead; normalising a near-zero vector would send it anywhere.
      */
      const dx = x - vw / 2;
      const dy = y - vh / 2;
      const len = Math.hypot(dx, dy);
      const angle = len > 1 ? Math.atan2(dy, dx) : ((i / DRAW_ORDER.length) * Math.PI * 2);
      const ux = len > 1 ? dx / len : Math.cos(angle);
      const uy = len > 1 ? dy / len : Math.sin(angle);
      el.style.setProperty("--ax", `${vw / 2 + ux * away - cx}px`);
      el.style.setProperty("--ay", `${vh / 2 + uy * away - cy}px`);
      /*
        And turned off its resting angle on the way, alternating, so the pieces
        turn into place instead of sliding — a collage laid by hand, not a grid
        snapping shut. Deterministic, from the order: nothing here is random.
      */
      el.style.setProperty(
        "--ar",
        `${plan.flower.rotate + (i % 2 ? -1 : 1) * (TURN + (i % 3) * 6)}deg`,
      );
      targets.push({ el, color: plan.color, x, y });
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

    /* ---------------------------------------------- the canvas, and the hand */
    /*
      WHAT A VISITOR IS ACTUALLY DOING HERE. The eighteen pieces of the collage
      wait off-screen, whole and in their own colours. Any piece whose place in
      the ring falls under the hand is sent for early — it flies in and lands,
      and leaves one of the deck's splash cut-outs, in its own colour, where it
      touched down. Sweep once and half the composition comes in behind you.

      THE MARKS ARE YOURS, AND ONLY YOURS. A piece the clock sends for lands
      silently; a piece a hand calls in leaves a splash. Doing nothing gives a
      clean composition assembling itself, and taking part leaves something on
      the page that would not otherwise be there — which is the whole of what
      the client asked this moment to say.

      It is one attribute per piece. The stylesheet owns every millisecond of
      what that attribute means (see ./Hero.module.css), nothing is measured
      per frame, and no animation loop runs — which is why an interaction this
      direct costs less than the timer it replaced.
    */
    const splats = splatsRef.current;
    const reach = Math.min(REACH_MAX, Math.max(REACH_MIN, unit * REACH_SHARE));

    let inked = 0;
    let mark = 0;
    let wrote = false;

    /*
      The pointer, carrying the next colour. `encodeURIComponent` rather than a
      raw SVG: a cut-out path is full of `#` and `,`, either of which ends a
      `url()` early and leaves the cursor silently unset.
    */
    const splash = DOODLES.splash;
    const cursorFor = (color: string) =>
      `url("data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${CURSOR_PX}" height="${CURSOR_PX}" viewBox="0 0 ${splash.w} ${splash.h}"><path d="${splash.d}" fill="${color}"/></svg>`,
      )}") ${CURSOR_PX / 2} ${CURSOR_PX / 2}, crosshair`;

    let loaded = "";
    /* Whatever the clock or the hand will reach for next, in the bouquet's order. */
    const reload = () => {
      const next = targets.find((t) => t.el.dataset.landed === undefined);
      const color = next?.color ?? "";
      if (color === loaded) return;
      loaded = color;
      html.style.cursor = color ? cursorFor(color) : "";
    };

    /* The brand's own splash cut-out, in the colour of whatever just landed. */
    const burst = (x: number, y: number, color: string) => {
      const pool = splats?.children;
      if (!pool?.length) return;
      const node = pool[mark % pool.length] as HTMLElement;
      mark += 1;
      node.style.color = color;
      node.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${(mark * 53) % 360}deg)`;
      delete node.dataset.burst;
      void node.offsetWidth; // so the same node can throw a second mark
      node.dataset.burst = "";
    };

    /* `byHand` is what decides whether a landing leaves a mark. */
    const land = (target: (typeof targets)[number], byHand: boolean) => {
      if (target.el.dataset.landed !== undefined) return false;
      target.el.dataset.landed = "";
      inked += 1;
      if (byHand) burst(target.x, target.y, target.color);
      reload();
      return true;
    };

    /*
      Painting it quickly is rewarded, but not by cutting the mark's writing
      short — that is the one thing the client has asked twice to keep. So the
      moment ends when the bouquet is finished AND the pen has stopped, and in
      any case at DRAW_MS.
    */
    const finished = () => {
      if (wrote && inked >= targets.length) settle();
    };

    /*
      A pull. Every waiting piece whose place falls under the hand is sent for
      at once, so a sweep brings in a handful rather than one. A touch that
      reaches nothing still calls the nearest piece — a tap that did nothing at
      all would read as a broken page rather than as a miss, and the brief
      asked for an immediate visual response.
    */
    const pull = (x: number, y: number, radius: number) => {
      let hit = false;
      let nearest: (typeof targets)[number] | undefined;
      let best = Infinity;
      for (const target of targets) {
        if (target.el.dataset.landed !== undefined) continue;
        const gap = Math.hypot(target.x - x, target.y - y);
        if (gap < best) {
          best = gap;
          nearest = target;
        }
        if (gap <= radius && land(target, true)) hit = true;
      }
      if (!hit && nearest) land(nearest, true);
      finished();
    };

    const onMove = (event: PointerEvent) => {
      pull(event.clientX, event.clientY, reach);
    };
    const onDown = (event: PointerEvent) => {
      pull(event.clientX, event.clientY, reach * TAP_REACH);
    };
    /*
      A keyboard calls pieces in too, in the order the collage was always laid
      in, so nobody is shut out of the moment for not having a pointer. Escape
      ends it outright, and a wheel says the same in the language of a mouse:
      the one thing an intro must never do is hold someone who wants to be in.
    */
    const onKey = (event: KeyboardEvent) => {
      if (["Shift", "Control", "Alt", "Meta", "Tab"].includes(event.key)) return;
      if (event.key === "Escape") {
        settle();
        return;
      }
      let laid = 0;
      for (const target of targets) {
        if (target.el.dataset.landed !== undefined) continue;
        land(target, true);
        if (++laid === KEY_STROKE) break;
      }
      finished();
    };
    const onWheel = () => settle();

    const attach = () => {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      window.addEventListener("keydown", onKey);
      window.addEventListener("wheel", onWheel, { passive: true });
    };
    const detach = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      html.style.removeProperty("cursor");
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
      reload();
      /*
        THE CLOCK IS THE FALLBACK, NOT THE POINT. Anyone who does nothing sees
        the collage assemble itself, piece by piece, and every frame of it is
        whole. Anyone who moves gets there first, and the clock finds those
        pieces already landed and does nothing. `false`: the clock's pieces
        land silently, because the splashes belong to the hand.
      */
      targets.forEach((target, i) =>
        later(() => {
          land(target, false);
          finished();
        }, DRAW_START + i * DRAW_STEP),
      );
      later(() => {
        wrote = true;
        finished();
      }, WRITE_MS + WRITE_TAIL);
      /* However it goes, it is over by here. */
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
      // A remount must find the pieces exactly as this effect first found
      // them: at rest in the collage, with none of the flight written on them.
      doodles.forEach((el) => {
        delete el.dataset.landed;
        for (const prop of FLIGHT_VARS) el.style.removeProperty(prop);
      });
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
    <>
      {/*
        The official artwork, never redrawn — now from the client's Illustrator
        file rather than a PNG. It writes itself: each letter is uncovered along
        the path a pen would take, in writing order, and the six dots in the "P"
        arrive one by one at the end. See <LogoReveal>. The box is the
        lettering's own; the flight above aims at the header's letters, not its
        file, so the two still meet exactly.

        UNTOUCHED BY THIS PASS. The canvas around it changed; the mark did not.
      */}
      <div ref={logoRef} aria-hidden className={styles.introLogo}>
        <LogoReveal writeMs={WRITE_MS} dotStepMs={DOT_STEP} />
      </div>

      {/* The marks a hand leaves — see ./Hero.module.css. */}
      <div ref={splatsRef} aria-hidden className={styles.splats}>
        {Array.from({ length: SPLATS }, (_, i) => (
          <svg
            key={i}
            viewBox={`0 0 ${DOODLES.splash.w} ${DOODLES.splash.h}`}
            className={styles.splat}
            focusable="false"
          >
            <path d={DOODLES.splash.d} fill="currentColor" />
          </svg>
        ))}
      </div>

    </>
  );
}
