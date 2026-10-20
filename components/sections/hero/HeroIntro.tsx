"use client";

import { useLayoutEffect, useRef } from "react";

import { DRAW_ORDER } from "@/components/sections/hero/composition";
import styles from "@/components/sections/hero/Hero.module.css";
import { INTRO_TIMING, REFIT_EVENT, introConfig, introRuntime, type IntroController } from "@/components/sections/hero/introCore";
import { LogoReveal } from "@/components/sections/hero/LogoReveal";
import { useSiteChrome } from "@/components/layout/SiteChrome";
import { onScrollFrame, pauseScroller, resumeScroller } from "@/lib/scroll";

/*
  THE CLOCK, THE RING AND THE FIT NOW LIVE IN ./introCore.ts, with the
  storyboard and every note that explains a number — the frame list, the
  pen's WRITE_MS, the wells, the burst and scatter steps, the tucked shapes'
  fade, the short entrance. They moved because the intro no longer waits for
  this component: the head script runs the same function from the first
  paint, and this adopts what it started (see the intro effect below). One
  function for both is what keeps them from drifting apart.

  What stays here is what only ever ran after hydration: the short entrance
  for a return inside the site, the banner's opening on scroll, and the
  icons' pointer depth.
*/
const { ENTER_MS, ENTER_STEP, WRITE_MS, DOT_STEP } = INTRO_TIMING;
/* The foot's fit and the bar's band, borrowed from the runtime as plain code. */
const { navBand, footPad, fitFoot, onViewportResize } = introRuntime(null, "core");

/** On a touch screen, how much of the gap to the scroll the opening closes each frame. */
const FOLLOW = 0.38;

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
 * it — and the intro finds them in the DOM, measures them once, and then only
 * ever changes `data-intro` on <html> and two pointer variables. The
 * stylesheet does the rest, so the whole second and a half runs on the
 * compositor.
 *
 * THE INTRO ITSELF IS RUN BY THE HEAD SCRIPT, from first paint, with the
 * same function this imports (./introCore.ts); this component adopts it on
 * hydration and only starts it when nothing else did.
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

    /* ---- reduced motion: the hero composed, and nothing else ---- */
    if (window.matchMedia(REDUCED).matches) {
      // A sequence started before the preference changed is stopped first, or
      // its next phase would undo this one.
      const started = window.__mpIntro;
      if (started && started.hero === hero) started.cancel();
      html.dataset.intro = "done";
      return;
    }

    /*
      Scroll restoration stays off for as long as the homepage is showing, in
      every case below. The browser decides whether to restore when reload is
      pressed, from the page being left — so for a refresh from halfway down to
      start at the top, where the intro happens, it has to be off already then,
      not merely switched off by the new page. Handed back on the way out, so
      back and forward still return people to their place on every other page.
    */
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const releaseRestoration = () => {
      if ("scrollRestoration" in history) history.scrollRestoration = "auto";
    };

    /*
      ---- the intro: ADOPTED, NOT STARTED ----

      EVERY PAGE LOAD PLAYS THE INTRO — a first visit, a return, a refresh —
      and on a page load the head script is already running it by the time
      this hydrates (./introCore.ts): the clock started at first paint, and the
      wells, the burst or even the lift may be behind it. So this takes over
      the one thing the script was waiting for React to do, which is to own
      the scroll: Lenis is paused while the script holds the page and resumed
      when it lets go, and the lock is let go now if the lift has already
      asked for it.

      AND STARTS IT ONLY WHEN NOTHING DID. `play` still standing with no
      sequence on this hero means the script never got to it — the document
      finished without a parsed banner, or it threw — and the same runtime is
      run here instead, on this hero, from the next frame: exactly what this
      effect used to do itself.

      `play` is written only by the head script, and only on a real load of
      the homepage, so it is the one state that plays it. Anything else with
      no sequence running means the homepage is being shown again inside the
      site — by a link back from another page, or after leaving mid-intro —
      and gets the short entrance below rather than holding someone moving
      around the site.
    */
    const running = (c: IntroController | null | undefined): c is IntroController =>
      !!c && c.hero === hero && !c.cancelled;
    let intro = window.__mpIntro;
    if (!running(intro) && html.dataset.intro === "play") {
      try {
        intro = introRuntime(introConfig(brandLogoRef.current), "boot", hero);
      } catch {
        intro = null;
      }
    }
    if (running(intro)) {
      const sequence = intro;
      sequence.onLock = pauseScroller;
      sequence.onUnlock = resumeScroller;
      if (sequence.locked) pauseScroller();
      sequence.adopt();
      /*
        Teardown is DEFERRED BY A TASK, and never forces `done`. React runs
        every effect twice in development, tearing the first run down and
        mounting again in the same task: the second run's `adopt()` clears
        this before it fires, so the one sequence carries on untouched. A real
        unmount — leaving the homepage mid-intro — lets it fire, and the
        sequence stops where it stands with nothing left written on the icons
        and the scroll released, exactly as this effect's own teardown did.
        Restoration is released and taken again in the same task on a
        remount, so the browser never gets a moment to restore in between.
      */
      return () => {
        sequence.pendingCancel = window.setTimeout(sequence.cancel, 0);
        releaseRestoration();
      };
    }

    /* ---- the homepage again, without a reload ---- */
    const doodles = Array.from(hero.querySelectorAll<HTMLElement>("[data-doodle]"));
    /* The collage's own order, which is what the short in-site entrance
       staggers on. The ring has its own order — see RING_ORDER. */
    const order = (el: HTMLElement) => DRAW_ORDER.indexOf(el.dataset.doodle ?? "");
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

    html.dataset.intro = "skip";
    doodles.forEach((el) => el.style.setProperty("--enter-delay", `${80 + order(el) * ENTER_STEP}ms`));
    hero.style.setProperty("--bloom-delay", "0ms");
    const cancelPaint = nextPaint(() => {
      html.dataset.intro = "enter";
      later(() => {
        html.dataset.intro = "done";
      }, ENTER_MS);
    });
    return () => {
      cancelPaint();
      timers.forEach(clearTimeout);
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

        `data-intro-logo` is how the head script finds it before React has a
        ref to give, and the flight's `--logo-*` it may already have written
        by hydration are why React is told not to mind its style.
      */}
      <div ref={logoRef} aria-hidden data-intro-logo="" suppressHydrationWarning className={styles.introLogo}>
        <LogoReveal writeMs={WRITE_MS} dotStepMs={DOT_STEP} />
      </div>
    </>
  );
}
