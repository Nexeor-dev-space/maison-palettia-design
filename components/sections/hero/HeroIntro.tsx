"use client";

import { useLayoutEffect, useRef } from "react";

import { portraitStretch, DOODLE_PLAN, DRAW_ORDER, RING_ORDER, type DoodlePlan } from "@/components/sections/hero/composition";
import styles from "@/components/sections/hero/Hero.module.css";
import { LogoReveal } from "@/components/sections/hero/LogoReveal";
import { useSiteChrome } from "@/components/layout/SiteChrome";
import { onScrollFrame, pauseScroller, resumeScroller } from "@/lib/scroll";

/*
  ===================================================================
    0.0 - 0.2s   the background is clean, and the logo fades in at the centre
    0.2 - 0.6s   the icons burst out from behind the logo, spreading outward
                 in a smooth, quick motion
    0.6 - 0.8s   all icons are now in place, around the logo
    0.8 - 1.0s   the logo gently moves up from the centre towards the bar
    1.0 - 1.3s   as the logo settles in the bar, the icons gently drift
                 outward and scatter across the screen
    1.3 - 1.5s   the website is fully loaded, the logo in the top bar and the
                 icons continuing to live throughout the design

  WHAT THIS REPLACES, AND WHY NONE OF IT SURVIVES. The entrance before it ran
  for five seconds: the mark wrote itself from its own vector, letter by
  letter, while eighteen cut-outs waited off-screen and flew in one at a time —
  and a visitor could sweep a paintbrush cursor across the screen to call them
  in early, each one stamping a splash where it landed. It was a good moment
  and it is the wrong one now. Every part of it contradicts the note above:
  handwriting cannot be short, an invitation to paint cannot be seamless, and
  a canvas that waits for a hand is the opposite of transitioning naturally
  into the site. So the pen, the splashes, the brush cursor and the clock that
  fed them are gone rather than retimed.

  WHAT IS KEPT. The artwork — the mark is still the client's own vector and the
  icons are still the deck's own cut-outs, in the six approved colours (see
  ./logoArt.ts and ./doodles.ts). The landing is still measured rather than
  guessed: the mark flies to the exact box of the logo in the header bar. And
  an escape is still offered, because an intro must never hold someone who
  wants to be in — see `attach()`.

  These are starts, in milliseconds from the first frame. ./Hero.module.css
  owns every individual transition; this only decides when each phase begins.
*/
/*
  AND A BEAT BETWEEN THE MARK AND THE ICONS, at the client's ask: "we need the
  dots animation we used before for the letter P, after that the doodle pop
  come." The six paint wells in the "P" were part of the opening before the
  handwriting was replaced by a fade, and they went with it. They are back,
  and they are their own phase rather than something running under the burst —
  the note is explicit that the icons come AFTER them.

  It costs about 380ms, so the entrance runs to roughly 1.9s rather than the
  storyboard's 1.5. That is the trade the ask makes, and it is the cheapest
  version of it: the wells are stepped at 62ms rather than the 200 the old
  opening used, which would have cost a second on its own.
*/
/*
  AND THE MARK IS WRITTEN AGAIN, letter by letter, at the client's ask — see
  <LogoReveal>. The pen runs from the first frame on the `play` state and
  takes WRITE_MS; everything after it moves back by the same amount, so the
  dots still follow a finished mark and the icons still follow the dots.

  WRITE_MS IS KEPT SHORT ON PURPOSE. The original writing took 2.5 seconds
  and was cut for it; 900ms is quick enough to read as a confident hand and
  still lets every letter be seen arriving. The whole entrance now composes
  by about 2.55s, against 1.88 with the fade — the cost of the writing, and
  no more. The dots start a hair before the last letter's outline settles,
  so there is no dead beat between the two.
*/
/*
  THE WHOLE OPENING RUNS TO ABOUT FOUR SECONDS, at the client's ask: "reduce
  the pace of the loading animation, extend it to 4 sec". Every beat is
  slower in proportion — the writing, the wells, the ring's hold — rather
  than one beat padded, so it still reads as one movement, only unhurried.
*/
const WRITE_MS = 800; // the pen writes "Maison Palettia", first stroke to last
const DOTS_AT = WRITE_MS - 40;

/** On a touch screen, how much of the gap to the scroll the opening closes each frame. */
const FOLLOW = 0.38;

/** Fired on the frame whenever its foot is refitted — see `refit` below. */
const REFIT_EVENT = "hero-refit"; // the mark is written; the wells start filling
const DOT_STEP = 95; // one well after another — see `.pDot` in Hero.module.css
const BURST_AT = DOTS_AT + 240; // frame 2: the icons leave the logo
const LIFT_AT = BURST_AT + 250; // frame 4: the mark starts for the bar, the icons follow
const SETTLE_MS = 760; // frame 6: ... and the page is composed by ~2000ms

/*
  One icon after another on the way out, and again on the way back.

  DELIBERATELY SMALL. At 40ms the nine read as a queue leaving a door; the
  client's word is "burst", and a burst is nine things leaving together with
  just enough lag to see which went first. 12ms puts the last one 96ms behind
  the first, so the whole ring is in the air inside a tenth of a second and
  every icon is home by 696ms — inside the 0.6-0.8s the storyboard gives frame
  3 for them to be in place.
*/
const BURST_STEP = 18;
/*
  The scatter, which is the same gesture reversed. It starts 150ms into the
  last phase rather than with it, so the eye follows the mark up to the bar
  first and the icons move once it has arrived — frame 5 is explicit that the
  drift happens "as the logo settles in the navigation bar", not before it.

  150 + 8 x 11 = 238, so the last icon leaves at 1038ms and is home at 1438ms.
*/
const SCATTER_AT = 150;
const SCATTER_STEP = 16;
/*
  And the shapes that are NOT in the ring come up later still, behind the
  photograph as it opens over them. See where this is written.
*/
const TUCKED_AT = 400;

/*
  The short entrance, for the homepage shown again by a link inside the site.

  It has always been a different, quieter thing than the opening — nobody
  arriving from another page should be made to watch the logo fly — and it is
  now cut to match the opening's own pace. It is the icons settling in, and
  nothing else.
*/
const ENTER_MS = 900;
const ENTER_STEP = 20;

/*
  How much of the frame's hold the opening takes; it rests fully open for the
  rest. Lowered with the track lengthened (see `.track`): the picture is now
  open well before the hold ends, and the last stretch is the pause the client
  asked for — the banner full bleed, holding, before the page moves on.
*/
const OPENING_SHARE = 0.52;
/*
  ON A PHONE THE PICTURE OPENS IN HALF THE SCROLL, at the client's ask: "make
  the expand animation faster on mobile, otherwise it causes a glitch". The
  slow opening kept the photograph in its most expensive state — the window
  re-cut and every cut-out re-drawn each frame — for a whole screen of
  scrolling, which is where a phone stutters. At 0.42 of the phone's shorter
  hold (see `.track` in Hero.module.css) it is fully open after ~50svh of
  scrolling instead of ~94, and the picture then stands open for the rest.
*/
const OPENING_SHARE_PHONE = 0.42;
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
/**
 * The height <BottomNav> covers, in pixels, or 0 where there is no bar.
 *
 * READ FROM THE TOKEN, NOT THE BAR. The bar is `fixed`, so it is not in the
 * banner's flow and nothing about the layout says it is there — and its
 * painted box is not the figure anyway: `--bottom-nav-h` is 4.9rem where the
 * element measures 53px, because the token reserves the band the wave rises
 * into as well. It is what <main> pads by, so it is what the banner should
 * clear.
 *
 * THROUGH A PROBE, BECAUSE `getPropertyValue` DOES NOT RESOLVE IT. A custom
 * property hands back its specified value — here the literal string
 * `calc(4.9rem + env(safe-area-inset-bottom))` — and `parseFloat` of that is
 * NaN. Applying it as a length and reading the box back is what makes the
 * browser do the arithmetic, `env()` and all. The probe is out of flow and
 * removed on the same tick, so it cannot affect what the caller then measures.
 *
 * 0 from `lg`, where the token is `0px` and there is no bar.
 */
function navBand(): number {
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;left:-9999px;top:0;width:0;visibility:hidden;height:var(--bottom-nav-h,0px)";
  document.body.append(probe);
  const h = probe.offsetHeight;
  probe.remove();
  return h;
}

/**
 * Breathing room under the banner's last control, on a phone only.
 *
 * `navBand()` makes the copy CLEAR the bar; it does not give it any air. The
 * client's note is that there is no bottom padding in the mobile banner, and
 * they are right: the second action was finishing 36px off the bar at 375,
 * which is a gap rather than a margin — the pair reads as having been pushed
 * up against something.
 *
 * 1.5rem on top of the band. A phone only, keyed off the band itself rather
 * than off a second media query, because the two answer the same question:
 * `--bottom-nav-h` is 0 from `lg`, and so is this.
 */
function footPad(band = navBand()): number {
  if (band === 0) return 0;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return rem * 1.5;
}

/** The resting photograph's minimum height: about a third of a short desktop
 *  window (200px at 640), less on a phone, where the words are taller. */
function cardFloor(frameHeight: number): number {
  const clamp = (lo: number, v: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return window.matchMedia("(min-width: 768px)").matches
    ? clamp(160, frameHeight * 0.31, 256)
    : clamp(128, frameHeight * 0.22, 192);
}

/** `--wt` in pixels: the bar plus the air under it. */
function insetTop(frame: HTMLElement): number {
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;visibility:hidden;width:0;height:var(--wt)";
  frame.append(probe);
  const h = probe.offsetHeight;
  probe.remove();
  return h;
}

function fitFoot(frame: HTMLElement, copy: HTMLElement, cue: HTMLElement) {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const raw = getComputedStyle(frame).getPropertyValue("--copy-gap").trim();
  const gap = raw.endsWith("rem") ? parseFloat(raw) * rem : parseFloat(raw) || 0;

  let foot: number;
  if (window.matchMedia(REDUCED).matches) {
    const band = navBand();
    foot = gap + copy.offsetHeight + rem + band + footPad(band);
  } else {
    /*
      THE LAST PARAGRAPH, NOT THE FIRST.

      This was `copy.querySelector("p")`, which is the first one — correct for
      as long as there was exactly one line under the script. There are two
      now: the client's mock-up sets "There's no wrong shade of creativity."
      above the sentence, and the foot went on being reserved down to the
      bottom of THAT, leaving the sentence below it uncounted. The words then
      sat in space the card had not been told to give them, and ran straight
      into the scroll cue.

      Measuring to the bottom of the last one is the version that does not
      care how many there are, which is what this should have been.
    */
    const lines = copy.querySelectorAll("p");
    const line = lines.length ? lines[lines.length - 1] : null;
    /*
      THE LAST THING IN THE BLOCK, NOT THE LAST PARAGRAPH, which is the same
      correction the note above made one step short of.

      The actions sit UNDER the final paragraph, so reserving to that
      paragraph's foot left the row itself uncounted. It did not show while the
      second action was a word on the primary's own line — the row was 60px and
      the clearance and the cue happened to cover it. It is a second pill now,
      and below `md` the two stack: 116px at 390, of which only the cue's worth
      was ever reserved. The row ran off the foot of the banner and under the
      bottom bar, which is what the client is looking at.

      Measuring to the bottom of the actions when there are any is the version
      that does not care what the block ends with.
    */
    const tail = copy.querySelector<HTMLElement>("[data-hero-actions]") ?? line;
    const words = tail ? tail.offsetTop + tail.offsetHeight : copy.offsetHeight;
    // `lineHeight` computes to a pixel length in every engine that matters; if
    // it ever answers `normal`, the floor below is what applies. It is the
    // LAST line's, because that is the one the cue has to clear.
    const lead = line ? parseFloat(getComputedStyle(line).lineHeight) : NaN;
    const clearance = Math.max(CUE_CLEARANCE_MIN, Math.round((lead || 0) * CUE_CLEARANCE_RATIO));
    /*
      THE BAR'S OWN BAND IS ALREADY IN HERE. <BottomNav> is fixed over the
      window's foot on a phone, and the cue's `bottom` is `0.75rem +
      --bottom-nav-h` (see `.cue`), so measuring the cue from the edge counts
      the bar once. This used to add `navBand()` on top, counting it twice:
      68px of the photograph went to empty air on every phone, and on a short
      one (375x667) the card had no height left at all and the tagline slid
      up under the header.

      Where the cue is hidden — a short phone, see `.cue` — its height is 0
      and its `bottom` still carries the bar, so the sum holds.
    */
    const cueFromEdge = parseFloat(getComputedStyle(cue).bottom) || 0;
    foot = gap + words + clearance + cue.offsetHeight + cueFromEdge + footPad();
  }
  /*
    A FLOOR UNDER THE PHOTOGRAPH, at the client's ask. The foot is whatever
    the words need, and on a short window (a laptop at ~1350x640 with its
    toolbars) that left the resting photograph a 60px strip. It now keeps at
    least `cardFloor()` — about 200px there — and when the words need more
    than the screen has left, they start lower and run past the fold. They
    are not lost: as the page scrolls the photograph opens and `--copy-shift`
    carries the whole block up into view, exactly as before.

    `--wf` keeps the foot's NATURAL height, so the doodles placed in it
    (`zone: "foot"`) stay laid out against the words rather than squeezed
    into the shorter visible band. `data-short` hides the scroll cue, which
    is pinned to the window's foot and would otherwise sit on the buttons.
  */
  const room = frame.offsetHeight - insetTop(frame) - cardFloor(frame.offsetHeight);
  const short = foot > room;
  frame.style.setProperty("--wf", `${Math.ceil(foot)}px`);
  frame.style.setProperty("--wb", `${Math.ceil(short ? Math.max(0, room) : foot)}px`);
  if (short) frame.dataset.short = "";
  else delete frame.dataset.short;
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
 * A window `resize` listener that ignores a phone's toolbar.
 *
 * ON A PHONE, SCROLLING RESIZES THE WINDOW. Safari and Chrome both shrink their
 * address bar as the page starts to move and bring it back when it turns, and
 * each time `innerHeight` changes and `resize` fires — which is to say, in the
 * middle of the banner's opening, every time the reader changes direction.
 * Every listener here answered with a full refit: probes appended to <body>,
 * forced layouts, and (on the scroll timeline) every scrubbed animation
 * cancelled and built again. That was a dropped run of frames at exactly the
 * moment the photograph was opening under the reader's thumb.
 *
 * None of it can have changed. The frame is `100svh`, the SMALL viewport, which
 * is the same height whichever state the toolbar is in, and every measurement
 * the banner takes is against the frame. So on a touch screen a resize that
 * leaves the width alone (the toolbar, or the keyboard) is dropped; a rotation
 * still refits. A pointer device keeps every resize: a desktop window dragged
 * taller really does change the frame. Bursts are folded into one call per
 * frame either way.
 */
function onViewportResize(fn: () => void): () => void {
  const touch = window.matchMedia("(pointer: coarse)").matches;
  let width = window.innerWidth;
  let height = window.innerHeight;
  let queued = 0;
  const onResize = () => {
    const changed = window.innerWidth !== width || (!touch && window.innerHeight !== height);
    width = window.innerWidth;
    height = window.innerHeight;
    if (!changed || queued) return;
    queued = requestAnimationFrame(() => {
      queued = 0;
      fn();
    });
  };
  window.addEventListener("resize", onResize);
  return () => {
    cancelAnimationFrame(queued);
    window.removeEventListener("resize", onResize);
  };
}

/**
 * The entrance — the mark, and the ring of the brand's icons that bursts out
 * from behind it and then scatters into the page — and, once it is over, the
 * banner's opening on scroll and the icons' pointer depth.
 *
 * The only part of the banner that needs JavaScript. Everything it animates is
 * server-rendered by <Hero> — the photograph, the words, and the icons around
 * it — and this finds them in the DOM, measures them once, and then only ever
 * changes `data-intro` on <html> and two pointer variables. The stylesheet
 * does the rest, so the whole second and a half runs on the compositor.
 *
 * MEASURED, NOT PLACED. Each icon is laid out in its place in the finished
 * page from the first render; before anything shows, its box is measured and
 * two transforms are written onto it — the one that stacks it behind the mark
 * at the middle of the screen, and the one that puts it in the ring. The
 * scatter is those transforms falling back to none, so the ring is centred on
 * any screen and every icon lands exactly where the design wants it.
 *
 * Under reduced motion there is no entrance and no depth. The banner is simply
 * shown composed.
 */
export function HeroIntro() {
  const logoRef = useRef<HTMLDivElement>(null);
  // The header's two logo cuts and their measured ink boxes, from Site
  // details through the layout (see SiteChrome) — the flight lands on them.
  // Held in a ref because the intro's effect runs once per mount: a new
  // value (a live-preview refresh) must not replay the entrance.
  const { logo: brandLogo } = useSiteChrome();
  const brandLogoRef = useRef(brandLogo);
  useLayoutEffect(() => {
    brandLogoRef.current = brandLogo;
  }, [brandLogo]);

  /* ------------------------------------------------------------------ fit */
  // First, so the intro below measures the doodles in the card's final place.
  useLayoutEffect(() => {
    const hero = logoRef.current?.closest("section");
    const frame = hero?.querySelector<HTMLElement>("[data-hero-frame]");
    const copy = hero?.querySelector<HTMLElement>("[data-hero-copy]");
    const cue = hero?.querySelector<HTMLElement>("[data-hero-cue]");
    if (!frame || !copy || !cue) return;

    /*
      Every refit is announced on the frame, because the scroll effect below
      measures the words' landing and each line's ink timing AGAINST the foot.
      Without this, a refit the resize listener does not see — the observer
      below, a late font — left both measured against the old foot: the words
      landed in the wrong place and their ink switched over the wrong ground,
      which on some phones was the flicker the client heard about.
    */
    const refit = () => {
      fitFoot(frame, copy, cue);
      frame.dispatchEvent(new Event(REFIT_EVENT));
    };
    refit();
    // The tagline's height changes when the script face arrives.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) refit();
    });
    /* The only resize listener in the banner. The scroll effect below hears
       about a resize through REFIT_EVENT, after the foot has been refitted —
       it used to listen as well, and every resize measured and rebuilt the
       opening twice. A phone's toolbar is not a resize; see onViewportResize. */
    const stopResize = onViewportResize(refit);
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
      stopResize();
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
    /* The collage's own order, which is what the short in-site entrance
       staggers on. The ring has its own order — see RING_ORDER below. */
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
    // `scroll-behavior: smooth` would otherwise glide it up under the ring.
    // It can only have moved if someone scrolled while it was still loading.
    if (window.scrollY !== 0) window.scrollTo({ top: 0, behavior: "instant" });
    html.dataset.intro = "play";
    html.style.overflow = "hidden";
    pauseScroller();
    locked = true;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    /*
      The ring is measured in widths of the logo at its centre, so it keeps the
      same close orbit around the mark at every size. `offsetWidth` is its
      laid-out width — the fade above changes opacity only, never the box — and
      the fallback only covers a logo that has somehow not been laid out.
    */
    const unit = logo?.offsetWidth || Math.min(vw, vh) * 0.4;
    const plans = new Map(DOODLE_PLAN.map((plan) => [plan.id, plan]));
    /*
      THE RING IS NOW A SUBSET, so every shape has to be told which it is.

      `data-ring` is what the stylesheet branches on: an icon carrying it
      bursts out of the logo and scatters back; an icon without it is simply
      not part of the entrance and waits, invisible, at its resting place until
      the page composes around it. Nine of the eighteen, chosen by the rule in
      ./composition.ts.

      It is written here rather than in the markup because it is a property of
      the entrance, not of the shape — <Hero> renders the same collage whether
      this component runs or not.
    */
    const inRing = (el: HTMLElement) => plans.get(el.dataset.doodle ?? "")?.ring === true;
    const ringOrder = (el: HTMLElement) => RING_ORDER.indexOf(el.dataset.doodle ?? "");

    /*
      Where every icon waits, and where it is going.

      A shape with no box is one the width has taken out of the layout
      (`desktopOnly` below 768) and is left out of both, or the ring could
      never be finished.

      EVERY ICON IS MEASURED WHERE IT LIES, NOT WHERE IT IS WAITING. `play`
      carries the behind-the-logo transform, which means an element that has
      been through this once is translated to the middle of the screen and
      scaled down when the loop below reads its box — and React runs this
      effect twice in development, and again on any remount. The flight's own
      properties therefore come off first, in one pass over all of them, so the
      single forced layout the next line triggers is paid once rather than
      eighteen times.
    */
    const FLIGHT_VARS = ["--bx", "--by", "--br", "--fx", "--fy", "--fs", "--fr"] as const;
    for (const el of doodles) {
      for (const prop of FLIGHT_VARS) el.style.removeProperty(prop);
      delete el.dataset.ring;
    }

    const measured: { el: HTMLElement; plan: DoodlePlan; box: DOMRect }[] = [];
    for (const el of doodles) {
      const plan = plans.get(el.dataset.doodle ?? "");
      const box = el.getBoundingClientRect();
      if (!plan || box.width === 0) continue;
      measured.push({ el, plan, box });
    }

    /*
      HOW FAR OUT THE RING SITS, MEASURED RATHER THAN GUESSED.

      This was a constant with a breakpoint in it — 0.93 of the radius below
      640 and 1 above — and the constant was wrong in the way constants of this
      kind always are. At 375 the coral, which is both the widest icon and the
      one furthest out, still finished 11px past the right edge: pulling the
      ring in moves an icon's CENTRE and does nothing to its WIDTH, so the
      shape at the edge keeps occupying half of itself past whatever radius it
      is given. Turning 0.93 into 0.90 made it worse, not better, because the
      figure was never about the radius.

      So the radius is derived from the shapes instead. Every icon's box in the
      ring is known before anything moves — the width is `flower.width` in
      units of the mark and the height follows from the shape's own aspect —
      and an icon turned by `flower.rotate` needs the box that turn sweeps out,
      which for a w x h box at an angle is (w|cos| + h|sin|) across and
      (w|sin| + h|cos|) down. From there the largest radius that still leaves
      every icon inside the screen is arithmetic, and the ring takes it.

      THIS FITS WHERE THE ICONS COME TO REST, NOT THE TOP OF THEIR BOUNCE, and
      that is a deliberate choice rather than an oversight. The burst eases on
      `--ease-pop`, a spring that carries a shape 9.78% past its target before
      settling back, so at 375 the coral — the widest icon and the one furthest
      out — swings about 9px past the right edge for roughly a tenth of a
      second at the top of its arc. Fitting the ring to that peak instead was
      tried and is worse: it pulls the radius to 0.85 and the coral then SITS
      against the end of "Palettia" for the whole of frames 3 and 4. A ring
      resting on the mark is a composition problem; a decorative shape grazing
      the edge at the top of a bounce is what a spring looks like.

      It is capped at 1, so on a screen with room this changes nothing at all
      and the composition is the one the client has already approved — at 1440
      it computes to 1 and the ring is untouched. At 375 it lands on 0.94,
      which is within a point of the 0.93 that was hand-tuned there, and that
      agreement is the reason to trust the arithmetic on the widths nobody
      measured by hand. The floor of 0.6 is a guard against a screen so small
      that the honest answer would be to collapse the ring into the mark.
    */
    const RING_MARGIN = 8;
    let ring = 1;
    let fitY = Infinity;
    for (const { plan, box } of measured) {
      if (!plan.ring) continue;
      const w = plan.flower.width * unit;
      const h = w * (box.height / box.width);
      const turn = (plan.flower.rotate * Math.PI) / 180;
      const halfW = (w * Math.abs(Math.cos(turn)) + h * Math.abs(Math.sin(turn))) / 2;
      const halfH = (w * Math.abs(Math.sin(turn)) + h * Math.abs(Math.cos(turn))) / 2;
      const reachX = Math.abs(plan.flower.x) * unit;
      const reachY = Math.abs(plan.flower.y) * unit;
      if (reachX > 0) ring = Math.min(ring, (vw / 2 - halfW - RING_MARGIN) / reachX);
      if (reachY > 0) ring = Math.min(ring, (vh / 2 - halfH - RING_MARGIN) / reachY);
      if (reachY > 0) fitY = Math.min(fitY, (vh / 2 - halfH - RING_MARGIN) / reachY);
    }
    ring = Math.max(0.6, ring);
    const ringY = portraitStretch(ring, fitY, vw, vh);

    for (const { el, plan, box } of measured) {
      if (!inRing(el)) {
        /*
          Not in the entrance, and not meant to be seen arriving either.

          Every shape outside the ring rests wholly behind the photograph — that
          is the rule that decides the ring in the first place — so it is held
          invisible and then faded up BEHIND THE BLOOM rather than in front of
          it. At `SCATTER_AT` it came up while the picture was still opening,
          and for about 170ms a handful of pale cut-outs stood in the middle of
          the screen with nothing covering them yet.

          The bloom finishes at 1440ms; this starts the fade at 1200 and ends
          it at 1520, by which time the photograph is over them. See `.flip` in
          ./Hero.module.css.
        */
        el.style.setProperty("--settle-delay", `${TUCKED_AT}ms`);
        continue;
      }
      el.dataset.ring = "";
      const i = ringOrder(el);
      const x = vw / 2 + plan.flower.x * unit * ring;
      const y = vh / 2 + plan.flower.y * unit * ringY;
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      el.style.setProperty("--fx", `${x - cx}px`);
      el.style.setProperty("--fy", `${y - cy}px`);
      el.style.setProperty("--fs", `${(plan.flower.width * unit) / box.width}`);
      el.style.setProperty("--fr", `${plan.flower.rotate}deg`);
      /*
        BEHIND THE LOGO, WHICH IS THE WHOLE OF FRAME 2. Not off-screen, which
        is where these used to wait: the storyboard says the icons "burst out
        from behind the logo", so every one of them starts stacked at the
        middle of the screen, under the mark. `.introLogo` is z-index 50 and a
        doodle is 20 while the entrance runs, so the mark genuinely covers them
        until they leave it.
      */
      el.style.setProperty("--bx", `${vw / 2 - cx}px`);
      el.style.setProperty("--by", `${vh / 2 - cy}px`);
      /*
        And turned off its resting angle on the way, alternating, so the icons
        turn out of the mark rather than sliding out of it. Deterministic, from
        the order: nothing here is random.
      */
      el.style.setProperty("--br", `${plan.flower.rotate + (i % 2 ? -1 : 1) * 26}deg`);
      el.style.setProperty("--burst-delay", `${i * BURST_STEP}ms`);
      el.style.setProperty("--settle-delay", `${SCATTER_AT + i * SCATTER_STEP}ms`);
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
      const cuts = brandLogoRef.current;
      const cut = target.getAttribute("width") === String(cuts.onLight.width) ? cuts.onLight : cuts;
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

    /*
      THE WAY OUT, AND IT IS THE ONLY THING A HAND CAN DO HERE NOW.

      The entrance before this one was a canvas: a paintbrush cursor, pieces
      called in by sweeping, a splash stamped wherever one landed. None of that
      belongs to a movement that is over in a second and a half, and the client
      has asked for it to be seamless rather than interactive.

      What is kept is the escape. Anything that says "I want to be in the site"
      — a key, a wheel, a tap — ends the entrance where it stands and composes
      the page. At 1.5s almost nobody will reach for it, and the one thing an
      intro must never do is hold someone who did.
    */
    const onKey = (event: KeyboardEvent) => {
      if (["Shift", "Control", "Alt", "Meta", "Tab"].includes(event.key)) return;
      lift();
    };
    const onWheel = () => lift();
    const onDown = () => lift();

    const attach = () => {
      window.addEventListener("keydown", onKey);
      window.addEventListener("wheel", onWheel, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
    };
    const detach = () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointerdown", onDown);
    };

    /*
      Frames 4 to 6, which are one movement: the mark lifts to the bar, the
      icons scatter to their places behind it, the photograph blooms open and
      the words rise. The stylesheet holds each of those on its own delay
      inside this phase.
    */
    let lifted = false;
    function lift() {
      if (lifted) return;
      lifted = true;
      timers.forEach(clearTimeout);
      timers.length = 0;
      detach();
      aimLogo();
      html.dataset.intro = "settle";
      // Every flight is relative to layout, not to the screen, so the page may
      // scroll while the icons finish arriving.
      unlock();
      later(finish, SETTLE_MS);
    }

    cancelPaint = nextPaint(() => {
      /*
        Frame 1 is the state change itself: `play` fades the mark up at the
        centre over 180ms against the clean Light Sage ground, with the wells
        collapsed inside the "P" and the ring stacked invisibly behind it.
      */
      attach();
      /* The wells fill, one at a time, out of the middle of the palette. */
      later(() => {
        html.dataset.intro = "dots";
      }, DOTS_AT);
      /* Frames 2 and 3: the icons leave the mark and take their places. */
      later(() => {
        html.dataset.intro = "burst";
      }, BURST_AT);
      /* Frames 4, 5 and 6. */
      later(lift, LIFT_AT);
    });

    // Teardown never forces `done`: a development remount must be free to
    // start again, and every rule the intro applies is scoped to this page.
    // A development remount releases restoration and takes it again in the
    // same task, so the browser never gets a moment to restore in between.
    return () => {
      cancelPaint();
      timers.forEach(clearTimeout);
      detach();
      // A remount must find the icons exactly as this effect first found
      // them: at rest, with none of the flight written on them.
      doodles.forEach((el) => {
        delete el.dataset.ring;
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
    const card = hero?.querySelector<HTMLElement>("[data-hero-card]");
    const cardInner = hero?.querySelector<HTMLElement>("[data-hero-card-inner]");
    const windowProbe = hero?.querySelector<HTMLElement>("[data-hero-window]");
    if (!track || !frame || !copy || !actions || !cue) return;

    // Reduced motion: nothing opens, and the two actions are simply there.
    if (window.matchMedia(REDUCED).matches) return;

    /*
      WHO READS `--p`. Written onto these, and never onto the frame: a custom
      property set on the frame inherits into every element under it, so one
      write recomputed style for the whole banner on every scroll frame —
      see the note at `.frame` in Hero.module.css. The words' block carries
      the actions with it (they are inside it and inherit), the cue stands on
      its own, and each cut-out's drift box is the one that moves.
    */
    const readers = [
      ...frame.querySelectorAll<HTMLElement>("[data-hero-card-inner] img"),
      frame.querySelector<HTMLElement>("[data-hero-scrim]"),
      copy,
      cue,
      ...frame.querySelectorAll<HTMLElement>("[data-hero-drift]"),
    ].filter((el): el is HTMLElement => el !== null);

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
    const inks: { el: HTMLElement; at: number; lit: boolean | null }[] = [];

    /*
      THE CARD OPENS WITH TRANSFORMS, NOT A CLIP-PATH.

      A changing clip-path repaints the photograph under it every frame, and on
      a phone that repaint is the stutter in the opening. Instead the card is
      the full frame, scaled down (non-uniformly) to the resting window, and
      its contents are scaled back up by the inverse so the picture itself
      does not move: two compositor transforms per frame, nothing repainted.
      The window's box comes from a hidden probe placed with the same --wt,
      --wx and --wb the clip-path used, so the geometry is identical.
      Without this script (or with reduced motion) the CSS clip-path stands.
    */
    const box = { w: 1, h: 1, wx: 0, wt: 0, wb: 0, r: 0 };
    /*
      THE CORNER IS WRITTEN WHEN IT CHANGES BY A PIXEL, NOT EVERY FRAME. The
      two transforms above are compositor work, but `border-radius` is not:
      on a clipped, composited layer a new radius means a new clip mask, and
      WebKit cut one for every frame of the opening — for a corner that is
      8px at rest and gone before the card is a tenth open. Rounded to whole
      pixels and written only on a change, that is a handful of masks in all.
    */
    let radius = "";
    const placeCard = (p: number) => {
      if (!card || !cardInner) return;
      const q = 1 - p;
      const sx = (box.w - 2 * box.wx * q) / box.w;
      const sy = (box.h - (box.wt + box.wb) * q) / box.h;
      const tx = box.wx * q;
      const ty = box.wt * q;
      card.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${sx.toFixed(5)}, ${sy.toFixed(5)})`;
      cardInner.style.transform = `scale(${(1 / sx).toFixed(5)}, ${(1 / sy).toFixed(5)}) translate3d(${(-tx).toFixed(2)}px, ${(-ty).toFixed(2)}px, 0)`;
      const r = box.r * q;
      const next = r >= 0.5 ? `${Math.round(r / sx)}px / ${Math.round(r / sy)}px` : "0";
      if (next !== radius) {
        radius = next;
        card.style.borderRadius = next;
      }
    };
    const measureCard = () => {
      if (!card || !cardInner || !windowProbe) return;
      box.w = Math.max(1, frame.offsetWidth);
      box.h = Math.max(1, frame.offsetHeight);
      box.wx = windowProbe.offsetLeft;
      box.wt = windowProbe.offsetTop;
      box.wb = box.h - windowProbe.offsetTop - windowProbe.offsetHeight;
      box.r = parseFloat(getComputedStyle(windowProbe).borderTopLeftRadius) || 0;
      frame.setAttribute("data-xform", "");
    };

    const measure = () => {
      const trackTop = track.getBoundingClientRect().top + window.scrollY;
      const hold = Math.max(1, track.offsetHeight - frame.offsetHeight);
      start = trackTop;
      end = trackTop + hold * (window.matchMedia("(max-width: 767px)").matches ? OPENING_SHARE_PHONE : OPENING_SHARE);
      /*
        NEVER UNDER THE BAR. Centred at COPY_LANDING, a phone's block — the
        tagline on two lines, both sentences and the two stacked actions,
        about 400px — ran its foot past the window's edge less <BottomNav>, and
        "Plan a private event" landed under the Book button. Held so its foot
        clears the bar by the same pad the resting foot keeps. On a desktop
        the bar is 0 and the block is short, so the centre always wins there.
      */
      const band = navBand();
      const lowest = frame.offsetHeight - band - footPad(band) - copy.offsetHeight;
      const landing = Math.min(frame.offsetHeight * COPY_LANDING - copy.offsetHeight / 2, lowest);
      const shift = landing - copy.offsetTop;
      copyShift = Math.round(shift);
      // `--copy-shift` is written after the ink loop below: written here, it
      // dirtied style and the loop's first `offsetTop` forced a fresh layout.

      /*
        EACH LINE TURNS LIGHT AS THE PHOTOGRAPH PASSES BEHIND IT — the fix for
        the glitch reported on phones.

        The words' ink used to cross from Charcoal to White Rock on one pace
        for the whole block, done by 30% of the opening. On a desktop the
        block is short and the picture is over all of it by then. On a phone
        the block is about 400px tall and the picture's foot is still climbing
        through it: the lower lines turned White Rock while they were still
        on the Light Sage below the picture, all but vanished, and came back
        as the picture reached them — a flicker every visitor scrolled through.

        So each line gets its own window: the progress at which the picture's
        foot reaches its top, and the progress at which it clears its bottom.
        The foot sits `--wb * (1 - p)` above the frame's bottom and the line
        rises by `p * shift`, so the foot meets a line's edge at
          p = (edge − frameHeight + wb) / (wb − shift).
        Layout positions (offsetTop) rather than rects, so the answer does not
        depend on how far the page has scrolled when this runs.
      */
      const wb = parseFloat(frame.style.getPropertyValue("--wb")) || 0;
      const sweep = wb - shift;
      /*
        ONE FLIP PER LINE, NOT A VALUE PER FRAME. The ink used to be a
        `--ink` ratio driven by `--p`, and the colour and the 28px text
        shadow it feeds were recomputed and REPAINTED on every scroll frame
        of the opening — a blurred shadow under a large script headline is
        the most expensive paint in the banner. Now each line records the
        progress at which the picture's foot reaches its middle, `data-lit`
        flips there, and a short CSS transition does the crossing: a handful
        of frames of paint per line instead of a hundred.
      */
      inks.length = 0;
      inks.push({ el: copy, at: 0.175, lit: null });
      for (const el of copy.querySelectorAll<HTMLElement>("[data-ink]")) {
        if (!(sweep > 0)) {
          inks.push({ el, at: 0.175, lit: null });
          continue;
        }
        let top = el.offsetTop;
        for (
          let node = el.offsetParent as HTMLElement | null;
          node && node !== copy;
          node = node.offsetParent as HTMLElement | null
        ) {
          top += node.offsetTop;
        }
        const at = (edge: number) => Math.min(1, Math.max(0, (copy.offsetTop + edge - frame.offsetHeight + wb) / sweep));
        const from = at(top);
        const to = at(top + el.offsetHeight);
        inks.push({ el, at: (from + to) / 2, lit: null });
      }
      frame.style.setProperty("--copy-shift", `${copyShift}px`);
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
    /*
      ON A TOUCH SCREEN THE OPENING FOLLOWS THE FINGER, IT DOES NOT COPY IT.

      A phone's scroll is native (Lenis leaves touch alone), and it reports
      positions unevenly — a burst of events, a gap, a jump at the start of a
      fling — so writing the raw position straight through moved the
      photograph's window by up to 8% of its travel in a single frame and
      then not at all for the next: the stutter the client saw on phones.
      There, `--p` now eases toward the scroll's answer every frame (a
      quarter of the remaining distance), which turns uneven steps into one
      continuous movement and settles within a few frames of the finger
      stopping. A pointer device keeps the direct write: Lenis already eases
      the wheel, and easing twice would make the banner trail the page.
    */
    const touch = window.matchMedia("(pointer: coarse)").matches;

    /*
      ==========================================================================
      THE OPENING RUNS ON THE BROWSER'S OWN SCROLL TIMELINE WHERE IT CAN.
      ==========================================================================

      Everything above this writes the opening from JavaScript: a scroll event
      arrives, `--p` is worked out, and a dozen elements are restyled. On a
      phone that is the jitter the client filmed — twice over. The scroll
      position a touch reports is one frame behind the finger and arrives
      unevenly, so the photograph's window steps rather than slides; and the
      writes land on the main thread, so whenever that thread is busy (an
      image decoding, the next section mounting) the window simply does not
      move for a frame, then jumps.

      A ScrollTimeline hands the whole opening to the compositor instead: each
      element gets a Web Animation whose progress IS the scroll position, read
      on the compositor thread in the same frame the page moves, with no event
      and no script in between. Transforms and opacity then stay in step with
      the scroll even while the main thread is busy. This is what
      `animation-timeline: scroll()` does in CSS, built from script because
      the card's two transforms (see `placeCard`) must stay exact inverses at
      every point of the opening, which a pair of two-keyframe CSS animations
      cannot promise — interpolating a scale and its inverse separately
      wobbles the picture mid-way. Sampling the pair forty-eight times keeps
      the error under a fifth of a percent.

      The easing is sampled into the keyframes too (the same smoothstep the
      script path uses), so the two paths look identical; browsers without
      ScrollTimeline (older Firefox and Safari) keep the script path.

      The script keeps two jobs: the ink flips (`data-lit`) and which of the
      cue and the actions is reachable (`inert`), both attribute toggles.
    */
    type ScrollTimelineCtor = new (init: { source: Element | null; axis?: "block" | "inline" }) => AnimationTimeline;
    const ScrollTimelineImpl = (window as unknown as { ScrollTimeline?: ScrollTimelineCtor }).ScrollTimeline;
    let timeline: AnimationTimeline | null = null;
    if (ScrollTimelineImpl && card && cardInner && typeof card.animate === "function" && CSS.supports("animation-timeline: scroll()")) {
      try {
        timeline = new ScrollTimelineImpl({ source: document.scrollingElement, axis: "block" });
      } catch {
        timeline = null;
      }
    }
    const STEPS = 48;
    const smooth = (t: number) => t * t * (3 - 2 * t);
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    let animations: Animation[] = [];
    let imageAnimations: Animation[] = [];
    let copyShift = 0;
    /** One animation, scrubbed by the page's scroll between two positions in px. */
    const scrub = (el: Element, frames: Keyframe[], from = start, to = end) =>
      el.animate(frames, {
        timeline,
        fill: "both",
        rangeStart: `${from}px`,
        rangeEnd: `${to}px`,
      } as KeyframeAnimationOptions);
    /** Keyframes sampled evenly along the scroll, each holding the eased progress's values. */
    const sampled = (at: (p: number) => Keyframe): Keyframe[] =>
      Array.from({ length: STEPS + 1 }, (_, i) => ({ ...at(smooth(i / STEPS)), offset: i / STEPS, easing: "linear" }));
    const geometry = (p: number) => {
      const q = 1 - p;
      return {
        sx: (box.w - 2 * box.wx * q) / box.w,
        sy: (box.h - (box.wt + box.wb) * q) / box.h,
        tx: box.wx * q,
        ty: box.wt * q,
      };
    };
    /*
      The picture's own zoom and lift join the timeline only once the intro
      is over: its intro states set a larger scale and a transition on the
      same property, and an animation would override both.
    */
    const buildImageTimeline = () => {
      if (!timeline) return;
      for (const a of imageAnimations) a.cancel();
      imageAnimations = [];
      for (const img of frame.querySelectorAll<HTMLElement>("[data-hero-card-inner] img")) {
        const lift = parseFloat(img.style.getPropertyValue("--lift")) || 0;
        imageAnimations.push(
          scrub(
            img,
            sampled((p) => ({
              transform: `translate3d(0, ${(lift * (1 - p)).toFixed(3)}%, 0) scale(${(1.06 - 0.06 * p).toFixed(5)})`,
            })),
          ),
        );
      }
    };
    const buildTimeline = () => {
      if (!timeline || !card || !cardInner) return;
      for (const a of animations) a.cancel();
      animations = [];
      try {
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        animations.push(
          scrub(
            card,
            sampled((p) => {
              const g = geometry(p);
              return { transform: `translate3d(${g.tx.toFixed(2)}px, ${g.ty.toFixed(2)}px, 0) scale(${g.sx.toFixed(5)}, ${g.sy.toFixed(5)})` };
            }),
          ),
          scrub(
            cardInner,
            sampled((p) => {
              const g = geometry(p);
              return {
                transform: `scale(${(1 / g.sx).toFixed(5)}, ${(1 / g.sy).toFixed(5)}) translate3d(${(-g.tx).toFixed(2)}px, ${(-g.ty).toFixed(2)}px, 0)`,
              };
            }),
          ),
        );
        /*
          The corner is not compositor work — a new radius is a new clip mask
          — so it is its own short animation over the first third of the
          opening, after which it holds at nothing and costs nothing.
        */
        const cornerSteps = 8;
        animations.push(
          scrub(
            card,
            Array.from({ length: cornerSteps + 1 }, (_, i) => {
              const f = i / cornerSteps;
              const g = geometry(smooth(f / 3));
              const r = box.r * (1 - f);
              return {
                borderRadius: r >= 0.5 ? `${(r / g.sx).toFixed(2)}px / ${(r / g.sy).toFixed(2)}px` : "0px / 0px",
                offset: f,
                easing: "linear",
              };
            }),
            start,
            start + (end - start) / 3,
          ),
        );
        const scrim = frame.querySelector<HTMLElement>("[data-hero-scrim]");
        if (scrim) animations.push(scrub(scrim, sampled((p) => ({ opacity: clamp01(p * 2.5) }))));
        animations.push(
          scrub(copy, sampled((p) => ({ transform: `translate3d(0, ${(p * copyShift).toFixed(2)}px, 0)` }))),
          scrub(
            actions,
            sampled((p) => {
              const arrived = clamp01((p - 0.55) * 3.2);
              return { opacity: arrived, transform: `translate3d(0, ${((1 - arrived) * 0.75 * rem).toFixed(2)}px, 0)` };
            }),
          ),
          scrub(cue, sampled((p) => ({ opacity: clamp01(1 - p * 6) }))),
        );
        for (const drift of frame.querySelectorAll<HTMLElement>("[data-hero-drift]")) {
          const doodle = drift.parentElement;
          const dirx = parseFloat(doodle?.style.getPropertyValue("--dirx") ?? "") || 0;
          const diry = parseFloat(doodle?.style.getPropertyValue("--diry") ?? "") || 0;
          animations.push(
            scrub(
              drift,
              sampled((p) => ({
                transform: `translate3d(${(dirx * p * 4 * rem).toFixed(2)}px, ${(diry * p * 3 * rem).toFixed(2)}px, 0) scale(${(1 - p * 0.2).toFixed(4)})`,
                opacity: clamp01(1 - p * 1.3),
              })),
            ),
          );
        }
        if (document.documentElement.dataset.intro === "done") buildImageTimeline();
      } catch {
        // A browser that has the constructor but not the range syntax: the
        // script path takes over from here, exactly as if there were none.
        for (const a of animations) a.cancel();
        for (const a of imageAnimations) a.cancel();
        animations = [];
        imageAnimations = [];
        timeline = null;
      }
    };
    const introDone = new MutationObserver(() => {
      if (document.documentElement.dataset.intro === "done" && imageAnimations.length === 0) buildImageTimeline();
    });
    introDone.observe(document.documentElement, { attributes: true, attributeFilter: ["data-intro"] });

    let shown = -1;
    let target = 0;
    let follow = 0;
    const apply = (p: number) => {
      shown = p;
      if (!timeline) {
        const value = p.toFixed(4);
        for (const el of readers) el.style.setProperty("--p", value);
        placeCard(p);
      }
      for (const ink of inks) {
        const lit = p >= ink.at;
        if (lit !== ink.lit) {
          ink.lit = lit;
          ink.el.toggleAttribute("data-lit", lit);
        }
      }
    };

    /*
      THE BANNER'S LAYERS EXIST WHILE THE BANNER IS ON SCREEN, not for the
      life of the page. `data-live` carries every `will-change` in the
      stylesheet (the frame, the picture's card, the scrim, the words, the
      cut-outs). Toggled by an observer, not by the scroll handler: promoting
      twenty layers in the first frame of a scroll is itself a dropped frame,
      so they are promoted while the page is still, and dropped once the
      banner has gone by.

      A SCREEN EARLY, coming back. On the way down the layers are made on
      load, at rest. On the way back up from the sections below they were
      made the moment the track's foot crossed into view — twenty layers in
      one frame of the reader's scroll, with the banner on screen to show it.
      The margin moves that frame a full screen ahead, while the banner is
      still out of sight, and keeps the layers a screen past it on the way
      down so a short scroll back does not rebuild them.
    */
    const live = new IntersectionObserver(
      ([entry]) => {
        frame.toggleAttribute("data-live", entry.isIntersecting);
      },
      { rootMargin: "100% 0px" },
    );
    live.observe(track);
    const step = () => {
      follow = 0;
      const next = shown + (target - shown) * FOLLOW;
      apply(Math.abs(target - next) < 0.0008 ? target : next);
      if (shown !== target) follow = requestAnimationFrame(step);
    };

    const write = () => {
      const t = Math.min(1, Math.max(0, (window.scrollY - start) / (end - start)));
      // Smoothstep: the opening gathers pace and then settles, rather than
      // tracking the scrollbar mechanically.
      const p = t * t * (3 - 2 * t);
      target = p;
      // On the timeline the compositor already follows the finger; the
      // easing below exists for the script path only.
      if (!touch || shown < 0 || timeline) apply(p);
      else if (!follow) follow = requestAnimationFrame(step);

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
    /* Measured afresh, then either the timeline is rebuilt against the new
       geometry or the card is placed by hand. */
    const refresh = () => {
      measure();
      measureCard();
      if (timeline) buildTimeline();
      if (!timeline) placeCard(Math.max(0, shown));
    };
    const onResize = () => {
      refresh();
      onScroll();
    };

    refresh();
    write();
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (cancelled) return;
      onResize();
    });
    const stopScroll = onScrollFrame(onScroll);
    // The foot was refitted (see REFIT_EVENT): measure against the new one.
    // This is also how a real resize arrives — the fit effect owns the only
    // resize listener, so the opening is rebuilt once per resize, not twice.
    frame.addEventListener(REFIT_EVENT, onResize);
    return () => {
      cancelled = true;
      cancelAnimationFrame(follow);
      stopScroll();
      frame.removeEventListener(REFIT_EVENT, onResize);
      live.disconnect();
      introDone.disconnect();
      for (const a of animations) a.cancel();
      for (const a of imageAnimations) a.cancel();
      frame.removeAttribute("data-live");
      frame.removeAttribute("data-xform");
      for (const el of readers) el.style.removeProperty("--p");
      card?.style.removeProperty("transform");
      card?.style.removeProperty("border-radius");
      cardInner?.style.removeProperty("transform");
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

    /*
      ONTO THE ICONS, NOT THE SECTION. `.parallax` is the only rule that reads
      the pair, and a custom property written on the <section> restyled the
      whole banner — words, photograph and all — on every pointer frame.

      AND NO LAYOUT READ PER FRAME. The section's box is measured once, in
      page coordinates, and only again after a resize; where it is on screen
      now is that minus the scroll, which costs no layout.
    */
    const targets = [...hero.querySelectorAll<HTMLElement>(`.${styles.parallax}`)];
    const write = (mx: string, my: string) => {
      for (const el of targets) {
        el.style.setProperty("--mx", mx);
        el.style.setProperty("--my", my);
      }
    };
    let box: { left: number; top: number; width: number; height: number } | null = null;
    const stale = () => {
      box = null;
    };
    const ro = new ResizeObserver(stale);
    ro.observe(hero);
    window.addEventListener("resize", stale);

    let frameId = 0;
    const onMove = (event: PointerEvent) => {
      if (document.documentElement.dataset.intro !== "done") return;
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        if (!box) {
          const r = hero.getBoundingClientRect();
          box = { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height };
        }
        const left = box.left - window.scrollX;
        const top = box.top - window.scrollY;
        write(
          (((event.clientX - left) / box.width) * 2 - 1).toFixed(3),
          (((event.clientY - top) / box.height) * 2 - 1).toFixed(3),
        );
      });
    };
    const onLeave = () => write("0", "0");
    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      window.removeEventListener("resize", stale);
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <>
      {/*
        The official artwork, never redrawn — from the client's Illustrator
        file. It fades up at the centre of a clean ground (frame 1), the icons
        burst out from behind it (frame 2), and it then flies to the exact box
        of the logo in the header bar and hands over to it (frames 4 and 5).
        See <LogoReveal>; the flight aims at the header's letters, not its
        file, so the two meet exactly.
      */}
      <div ref={logoRef} aria-hidden className={styles.introLogo}>
        <LogoReveal writeMs={WRITE_MS} dotStepMs={DOT_STEP} />
      </div>
    </>
  );
}
