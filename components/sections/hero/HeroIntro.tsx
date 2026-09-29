"use client";

import { useLayoutEffect, useRef } from "react";

import {
  DOODLE_PLAN,
  DRAW_ORDER,
  RING_ORDER,
  type DoodlePlan,
} from "@/components/sections/hero/composition";
import styles from "@/components/sections/hero/Hero.module.css";
import { LogoReveal } from "@/components/sections/hero/LogoReveal";
import { BRAND_LOGO } from "@/lib/constants";
import { onScrollFrame, pauseScroller, resumeScroller } from "@/lib/scroll";

/*
  ==========================================================================
  THE ENTRANCE, AS THE CLIENT STORYBOARDED IT
  ==========================================================================

  "I'd like to explore a different direction for the opening screen/entrance
  animation... The entrance should be short, playful and seamless,
  transitioning naturally into the main website." Six frames came with it, and
  these numbers are those frames:

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
const BURST_AT = 200; // frame 2: the icons leave the logo
const LIFT_AT = 800; // frame 4: the mark starts for the bar, the icons follow
const SETTLE_MS = 720; // frame 6: ... and the page is composed by 1520ms

/*
  One icon after another on the way out, and again on the way back.

  DELIBERATELY SMALL. At 40ms the nine read as a queue leaving a door; the
  client's word is "burst", and a burst is nine things leaving together with
  just enough lag to see which went first. 12ms puts the last one 96ms behind
  the first, so the whole ring is in the air inside a tenth of a second and
  every icon is home by 696ms — inside the 0.6-0.8s the storyboard gives frame
  3 for them to be in place.
*/
const BURST_STEP = 12;
/*
  The scatter, which is the same gesture reversed. It starts 150ms into the
  last phase rather than with it, so the eye follows the mark up to the bar
  first and the icons move once it has arrived — frame 5 is explicit that the
  drift happens "as the logo settles in the navigation bar", not before it.

  150 + 8 x 11 = 238, so the last icon leaves at 1038ms and is home at 1438ms.
*/
const SCATTER_AT = 150;
const SCATTER_STEP = 11;
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
    }
    ring = Math.max(0.6, ring);

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
      const y = vh / 2 + plan.flower.y * unit * ring;
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
        centre over 200ms against the clean Light Sage ground, with the ring
        stacked invisibly behind it.
      */
      attach();
      /* Frame 2 and 3: the icons leave the mark and take their places. */
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
        The official artwork, never redrawn — from the client's Illustrator
        file. It fades up at the centre of a clean ground (frame 1), the icons
        burst out from behind it (frame 2), and it then flies to the exact box
        of the logo in the header bar and hands over to it (frames 4 and 5).
        See <LogoReveal>; the flight aims at the header's letters, not its
        file, so the two meet exactly.
      */}
      <div ref={logoRef} aria-hidden className={styles.introLogo}>
        <LogoReveal />
      </div>
    </>
  );
}
