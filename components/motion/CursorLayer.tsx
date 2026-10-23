"use client";

import { useEffect, useRef } from "react";

import styles from "@/components/motion/CursorLayer.module.css";
import { createPainter } from "@/components/motion/painter";
import { DROP } from "@/lib/brushPaint";

/**
 * ==========================================================================
 * The brush — the cursor for the whole site
 * ==========================================================================
 *
 * A paintbrush that sits exactly on the pointer, leaning into the direction
 * it is moved, and pressing in when the mouse goes down. Over a photograph its bristles take that picture's
 * own colour; everywhere else it carries Deep Lilac.
 *
 * IT WAS A ROUND DAB OF COLOUR, and the client read that as a colour-dropper —
 * fairly, because a filled circle with a ring is the eyedropper icon in every
 * image editor, so over a photograph it offered to pick a colour rather than
 * to paint with one. A brush names the thing the Maison actually sells.
 *
 * ==========================================================================
 * IT USED TO BE FOR THE PICTURES ONLY, AND NOW IT IS FOR EVERYTHING
 * ==========================================================================
 *
 * The note that stood here argued the opposite case: that a site-wide
 * replacement cursor is the common way this idea goes wrong, because it costs
 * a visitor the pointer they know in the places they need it most. The client
 * has asked for the brush everywhere, so it is everywhere — and the two real
 * costs in that argument are paid rather than ignored:
 *
 *   THE CARET. A brush tip has no I-beam to sight along. Over a text field,
 *   a textarea or anything `contenteditable` the brush hides itself and the
 *   native caret comes back, so the one pointing job that needs the pixel —
 *   a booking form, an enquiry, a card field — still has the right tool.
 *
 *   THE HAND. Losing `cursor: pointer` costs the signal that a thing can be
 *   clicked. The brush answers with its own: it grows by an eighth over any
 *   link or control, which is the same information in the brush's own voice.
 *
 * An IFRAME draws its own cursor and cannot be told otherwise, so the brush
 * stands down at the border of one rather than freezing there while the map
 * inside shows its grab hand.
 *
 * IT DOES NOT MOUNT AT ALL for a coarse pointer (every phone and tablet), for
 * a reader who has asked for reduced motion, or without JavaScript. The native
 * cursor is only ever hidden — by `html[data-paint-cursor]` in globals.css —
 * while this is running, so a failure here cannot leave the page with no
 * cursor at all.
 *
 * COST. One `pointermove` listener that writes the position and nothing
 * else, one rAF that does the colour and the lean once a frame, and no React
 * state after mount: everything is written straight onto the node as custom
 * properties. Nothing re-renders while the mouse moves.
 *
 * ==========================================================================
 * NO CATCH-UP, AND THAT IS A FIX
 * ==========================================================================
 *
 * The brush used to ease toward the pointer, closing a fifth of the gap each
 * frame. It looked like a brush being drawn across the page, and it cost the
 * one thing a cursor cannot cost: the bristles were never quite where a click
 * would land. The client felt it as the brush delaying every move, every
 * selection and every click. So the position is written in the move handler
 * itself, straight onto the pointer, and the lean now comes from how fast the
 * hand is moving rather than from how far behind the brush has fallen.
 *
 * ==========================================================================
 * AND IT PAINTS
 * ==========================================================================
 *
 * A click leaves three drops of paint where the bristles touch, in a brand
 * colour chosen by where they land, and they dry away a moment later. For as
 * long as they are wet the bristles carry that same colour — the brush shows
 * the paint it just laid down — and then go back to the ground under them.
 * The drawing is in painter.ts, onto the one canvas rendered below. Moving
 * the brush paints nothing — an earlier version drew a line behind every
 * move, and that was noise.
 *
 * WHERE IT DOES NOT PAINT follows the brush exactly. Over a text field or an
 * iframe the brush has stood down, so there is no tip to paint with and a
 * click there is the field's own. Only the main button paints — a right click
 * is asking for a menu. And a reader who has asked for reduced motion keeps
 * the brush (see below) but gets no drops: a drop is nothing but motion.
 */

/**
 * Where the brush stands down and the native cursor comes back: text entry,
 * and an iframe, which draws its own. Kept in step with the `cursor: text`
 * rule in globals.css — the two have to name the same elements or a visitor
 * gets both cursors at once, or neither.
 */
const NATIVE =
  'input:not([type="button"],[type="submit"],[type="reset"],[type="checkbox"],[type="radio"],[type="range"],[type="color"],[type="file"],[type="image"]), textarea, [contenteditable=""], [contenteditable="true"], iframe';

/** Degrees of lean per pixel the pointer moved sideways in one event, and the cap on it. */
const TILT_PER_PX = 0.55;
const TILT_MAX = 12;

/** How much of the lean is kept each frame once the hand stops — it rights itself in about a fifth of a second. */
const TILT_RETURN = 0.8;

/*
  ==========================================================================
  ON A TOUCH SCREEN: NO BRUSH, BUT THE PAINT
  ==========================================================================

  A phone has no pointer to draw a brush at, so the cursor itself never
  mounts there — but the paint can still answer the finger, at the client's
  ask. A TAP leaves the same three drops a click does, where the finger
  landed, in the colour that place on the page takes. A tap only: a touch
  that moves (a scroll, a swipe through a carousel) or is held (a long-press
  menu) paints nothing, and the browser's own `pointercancel` — sent when a
  touch turns into a scroll — ends it too. Text fields keep the keyboard to
  themselves, as they do on desktop. Off for a reader who asked for less
  motion.

  The ground the painter keeps off is read from the elements under the tap,
  the same rule the brush uses: the first painted background there.
*/
const TAP_SLOP = 10;
const TAP_MS = 450;

function touchPaint(canvas: HTMLCanvasElement | null): (() => void) | undefined {
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const painter = createPainter(canvas);
  if (!painter) return;
  const CLEAR = /^(transparent$|rgba?\([^)]*,\s*0(\.0+)?\s*\)$)/;

  let down: { id: number; x: number; y: number; t: number } | null = null;
  let alive = true;
  const onDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse" || !event.isPrimary) return;
    const target = event.target as Element | null;
    if (typeof target?.closest === "function" && target.closest(NATIVE)) return;
    down = { id: event.pointerId, x: event.clientX, y: event.clientY, t: performance.now() };
  };
  const onUp = (event: PointerEvent) => {
    const start = down;
    down = null;
    if (!start || event.pointerId !== start.id) return;
    if (performance.now() - start.t > TAP_MS) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_SLOP) return;
    const { clientX: x, clientY: y } = event;
    /*
      AFTER THE TAP HAS PAINTED, NOT INSIDE IT. `elementsFromPoint` and
      `getComputedStyle` force a layout, and in the handler that cost lands
      on the tap itself — the link it opens, the menu it toggles — and in the
      INP Lighthouse reports. The ground has to be read before the drop (it
      decides the colour), so both wait together: a frame, then a task, which
      puts them after the browser has shown the tap's own response. A drop a
      frame or two late is invisible; the colour is unchanged.
    */
    requestAnimationFrame(() =>
      setTimeout(() => {
        if (!alive) return;
        for (const node of document.elementsFromPoint(x, y)) {
          if (node === canvas) continue;
          const style = getComputedStyle(node);
          if (style.visibility === "hidden" || Number(style.opacity) < 0.05) continue;
          if (style.backgroundColor && !CLEAR.test(style.backgroundColor)) {
            painter.ground(style.backgroundColor);
            break;
          }
        }
        painter.drop(x, y);
      }, 0),
    );
  };
  const onCancel = () => {
    down = null;
  };
  const onScroll = () => painter.scroll();

  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });
  window.addEventListener("pointercancel", onCancel, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    alive = false;
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
    window.removeEventListener("scroll", onScroll);
    painter.destroy();
  };
}

export function CursorLayer() {
  const dotRef = useRef<HTMLDivElement>(null);
  const paintRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;
    if (!window.matchMedia("(pointer: fine)").matches || !window.matchMedia("(hover: hover)").matches) {
      return touchPaint(paintRef.current);
    }

    /*
      REDUCED MOTION NO LONGER MEANS NO BRUSH, and that was the bug behind
      "I can't see the cursor". While this was a flourish over photographs,
      standing down for that reader was right. It is the site's cursor now, so
      standing down leaves them with the plain arrow the client asked to
      replace — on a machine with Reduce Motion switched on, which is a great
      many of them, the whole feature simply did not exist.

      What they give up instead is the MOTION, which is what they asked about:
      no lean and no drops of paint, so nothing on screen is animating. The
      shape, the colour and the hotspot are identical.
    */
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const root = document.documentElement;
    root.dataset.paintCursor = "on";

    const painter = !calm && paintRef.current ? createPainter(paintRef.current) : null;

    let pointerX = 0;
    let pointerY = 0;
    let active = false;
    let frame = 0;
    let tilt = 0;
    /** The element under the pointer that the colour has not caught up with yet. */
    let pending: Element | null = null;

    /** The bristle tip on the pointer — written in the event itself, never a frame late. */
    const place = () => {
      dot.style.setProperty("--x", `${pointerX}px`);
      dot.style.setProperty("--y", `${pointerY}px`);
    };

    /*
      ONCE A FRAME: THE COLOUR, THEN THE LEAN.

      The colour is measured here rather than in the move handler because it
      is the expensive part — `elementsFromPoint` and a computed style per
      layer — and a move handler that does that holds up the position write
      behind it. Here it runs at most once a frame, for wherever the pointer
      has got to.

      THE LEAN. A brush that never changes angle reads as a sticker; one that
      leans into the direction of travel reads as being moved. The move
      handler pushes the lean; this lets it right itself once the hand stops.
    */
    const settle = () => {
      frame = 0;
      if (pending) {
        const target = pending;
        pending = null;
        follow(target);
      }
      tilt *= TILT_RETURN;
      if (Math.abs(tilt) < 0.2) tilt = 0;
      dot.style.setProperty("--tilt", tilt.toFixed(2));
      if (active && tilt) frame = requestAnimationFrame(settle);
    };

    const tick = () => {
      if (!frame) frame = requestAnimationFrame(settle);
    };

    /**
     * May the brush be drawn at this point?
     *
     * `closest` rather than `target instanceof Element`: a pointer event
     * retargeted to the document or dispatched at the window has no such
     * method, and this runs inside a global listener — a throw here stops
     * every later move being handled and strands the brush mid-page.
     */
    const allowed = (target: Element | null): boolean => {
      if (typeof target?.closest !== "function") return false;
      return !target.closest(NATIVE);
    };

    /*
      WHAT THE BRUSH IS CURRENTLY LOADED WITH, and what it was last asked.

      `loaded` is the resolved value, so re-crossing the same ground costs
      nothing. `lastTarget` is the cheap guard in front of it: `paintAt` walks
      ancestors and calls `getComputedStyle`, which is far too much to do on
      every one of a thousand pointer moves, and the colour cannot have
      changed while the element under the pointer has not.
    */
    let loaded: string | null = null;
    let lastTarget: Element | null = null;

    /*
      ==================================================================
      WHAT COLOUR THE BRUSH IS CARRYING
      ==================================================================

      The client's ask: the part of the page the brush is over should be the
      colour on the brush. So it is no longer only the marked pictures that
      load it — every element does, and there are two ways a colour is found,
      in this order:

        1. AN EXPLICIT `--paint`, which the activity plates, the event tiles
           and the studio pictures already set. That is the section's own
           chosen accent and it beats anything measured.
        2. THE NEAREST PAINTED BACKGROUND. Walking up from the element under
           the pointer to the first one whose background is not transparent —
           which is the ground the visitor can actually see there.

      `probe` RESOLVES WHATEVER IS FOUND INTO REAL CHANNELS. A `--paint` can
      be a hex, a `var()` or a `color-mix()`, and the halo below has to know
      how light the result is. Setting it on an off-screen node and reading
      `color` back hands the browser's own resolution back as `rgb(...)`,
      which is the only reliable way to measure a value the stylesheet wrote.
    */
    const probe = document.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:fixed;left:-9999px;top:0;width:0;height:0";
    document.body.appendChild(probe);

    const CLEAR = /^(transparent$|rgba?\([^)]*,\s*0(\.0+)?\s*\)$)/;

    const resolve = (value: string): string => {
      probe.style.color = "";
      probe.style.color = value;
      return getComputedStyle(probe).color;
    };

    /*
      ==================================================================
      HOW LIGHT IS THAT COLOUR? ASK THE BROWSER, DO NOT PARSE THE STRING
      ==================================================================

      This used to read the channels out of the resolved value with a regex
      for `rgb(r, g, b)`, and that was a real bug with a visible symptom: the
      brush vanished completely over the page's near-white.

      `--color-surface` is a `color-mix()`, and Chrome computes it to
      `oklab(0.970294 -0.0115608 0.0135646)`. The regex pulled "0.970294" out
      of that and treated it as a 0-255 channel — 0.97/255 — so a near-white
      ground measured as almost black, the halo took the dark-ground branch,
      and a near-white outline was drawn around a near-white head on a
      near-white section. Nothing was on screen but the handle and the
      ferrule, which is exactly what the client photographed.

      A one-pixel canvas has no such problem. Whatever colour syntax the
      browser can compute, it can also paint, and reading the pixel back gives
      real sRGB channels — `oklab()`, `color()`, `lab()`, `rgb()` and whatever
      is added next, all without this file knowing any of them exist.
    */
    const swatch = document.createElement("canvas");
    swatch.width = 1;
    swatch.height = 1;
    const ctx = swatch.getContext("2d", { willReadFrequently: true });

    /** Relative luminance of any CSS colour, or null if it cannot be read. */
    const luminance = (value: string): number | null => {
      if (!ctx) return null;
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = value;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      if (a === 0) return null;
      const lin = (c: number) => {
        const v = c / 255;
        return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };

    const paintAt = (target: Element | null): string => {
      if (typeof target?.closest === "function") {
        const marked = target.closest<HTMLElement>("[data-paint]");
        if (marked) {
          const declared = getComputedStyle(marked).getPropertyValue("--paint").trim();
          if (declared) return declared;
        }
      }
      /*
        THE STACK UNDER THE POINTER, NOT THE ANCESTOR CHAIN, and that is a fix
        for a measured miss. Walking up from the element under the pointer
        found the SECTION's cream over the primary button instead of the
        button's own Deep Lilac — because <BlobButton> paints its fill in a
        layer behind the label rather than on the anchor itself, so the colour
        the eye sees there is a sibling of the thing the pointer is on, not a
        parent of it. `elementsFromPoint` returns everything at the point in
        paint order, which is what the eye sees, so the first painted one in
        that list is the colour to pick up.
      */
      for (const node of document.elementsFromPoint(pointerX, pointerY)) {
        if (node === dot || dot.contains(node)) continue;
        const style = getComputedStyle(node);
        /*
          A LAYER THAT IS NOT BEING SHOWN IS NOT A COLOUR, and this is the
          second measured miss. <BlobButton> keeps its hover flood stacked
          over the fill at `opacity: 0`, waiting — so the topmost painted
          thing on the primary button is a Light Sage rectangle nobody can
          see, and the brush dutifully picked up sage while standing on a
          Deep Lilac button. Alpha in the colour is not enough to catch that;
          the opacity is on the element.
        */
        if (style.visibility === "hidden" || Number(style.opacity) < 0.05) continue;
        const bg = style.backgroundColor;
        if (bg && !CLEAR.test(bg)) return bg;
      }
      return "var(--color-primary)";
    };

    /*
      Dip the brush, and set the halo against what it just picked up.

      THE HALO IS THE REASON THIS CAN WORK AT ALL. The brush now carries the
      colour of the ground it is standing on, so without an outline that
      contrasts with that same colour it would vanish on every section. 0.42
      is the midpoint the site's own grounds fall either side of: White Rock,
      Light Sage and the near-white sit above it and take the Charcoal
      outline; Deep Lilac and Charcoal sit below and take the near-white one.
    */
    /*
      Measured once per distinct colour. `resolve` writes a style and reads it
      back (a forced recalculation) and `luminance` reads pixels back from a
      canvas (a CPU round-trip); the site has a handful of grounds and a
      visitor crosses the same few thousands of times, so the answer is kept.
    */
    const lightness = new Map<string, number | null>();
    const measure = (value: string): number | null => {
      if (lightness.has(value)) return lightness.get(value) ?? null;
      const L = luminance(resolve(value));
      lightness.set(value, L);
      return L;
    };

    const haloFor = (value: string) => {
      const L = measure(value);
      /*
        CHARCOAL WHEN THE READING FAILS, and that direction is deliberate.
        Most of this site is printed on light grounds, and the two mistakes
        are not equal: a Charcoal outline on a dark ground is still an
        outline — a shape you can see — while a near-white one on a light
        ground is nothing at all, which is the failure this whole branch
        exists to prevent.
      */
      return L !== null && L <= 0.42 ? "var(--color-surface)" : "var(--color-text)";
    };

    /** The halo for the ground, kept so it can come back when the paint dries. */
    let groundHalo = "var(--color-text)";
    /** While the drops are wet the bristles show their colour, not the ground's. */
    let inkTimer = 0;

    const dip = (value: string) => {
      if (value === loaded) return;
      loaded = value;
      dot.style.setProperty("--paint", value);
      // The painter keeps off whatever colour the brush is standing on.
      painter?.ground(value);
      groundHalo = haloFor(value);
      if (!inkTimer) dot.style.setProperty("--halo", groundHalo);
    };

    /*
      THE BRUSH SHOWS THE PAINT IT JUST LAID. On a touch the bristles take the
      drops' own colour — exactly, not the shade-off the ground colour gets —
      with a halo set against it, and hold it for as long as the drops are on
      the page. Then they go back to whatever the brush is standing on.
    */
    const ink = (colour: string) => {
      window.clearTimeout(inkTimer);
      dot.style.setProperty("--ink", colour);
      dot.style.setProperty("--halo", haloFor(colour));
      dot.dataset.inked = "";
      inkTimer = window.setTimeout(dry, DROP.life);
    };

    const dry = () => {
      inkTimer = 0;
      delete dot.dataset.inked;
      dot.style.setProperty("--halo", groundHalo);
    };

    const enter = (target: Element | null) => {
      active = true;
      // The brush appears where the pointer already is rather than flying in
      // from wherever it was last seen.
      place();
      // Upright on arrival: the lean describes travel, and a brush that
      // appears already tilted has not travelled anywhere yet.
      tilt = 0;
      dot.style.setProperty("--tilt", "0");
      lastTarget = target;
      dip(paintAt(target));
      dot.style.setProperty("--in", "1");
      dot.dataset.state = "on";
      tick();
    };

    const leave = () => {
      active = false;
      pending = null;
      lastTarget = null;
      dot.style.setProperty("--in", "0");
      dot.dataset.state = "off";
    };

    /** Re-dip only when the element under the pointer has actually changed. */
    const follow = (target: Element | null) => {
      if (target === lastTarget) return;
      lastTarget = target;
      dip(paintAt(target));
    };

    const onMove = (event: PointerEvent) => {
      const moved = event.clientX - pointerX;
      pointerX = event.clientX;
      pointerY = event.clientY;
      const target = event.target as Element | null;

      if (!allowed(target)) {
        if (active) leave();
        return;
      }
      if (!active) {
        enter(target);
        return;
      }
      place();
      if (!calm) {
        const want = Math.max(-TILT_MAX, Math.min(TILT_MAX, moved * TILT_PER_PX));
        tilt += (want - tilt) * 0.35;
      }
      if (target !== lastTarget) pending = target;
      tick();
    };

    /*
      The page can move under a still pointer; re-ask what is there — but not
      every frame. Lenis scrolls on every frame, and this used to run
      `elementFromPoint` and, as each new element slid under the brush,
      `elementsFromPoint` plus a `getComputedStyle` per element in the stack in
      the same frame as the scroll itself: forced style recalculation at the
      moment the frame budget is tightest (issue #70). The brush's colour may
      trail a scroll by a tenth of a second; it may not cost the scroll frames.
      The painter's own scroll hook stays per-frame so wet drops keep tracking
      the page.
    */
    let scrollTimer = 0;
    const refresh = () => {
      scrollTimer = 0;
      const target = document.elementFromPoint(pointerX, pointerY);
      if (!allowed(target)) {
        if (active) leave();
        return;
      }
      if (!active) {
        enter(target);
        return;
      }
      follow(target);
    };
    const onScroll = () => {
      painter?.scroll();
      if (!scrollTimer) scrollTimer = window.setTimeout(refresh, 120);
    };

    const press = (event: PointerEvent) => {
      dot.style.setProperty("--press", "0.78");
      if (!active || event.button !== 0 || event.pointerType === "touch") return;
      // The hotspot is the bristle tip, so the drops land where it touched.
      if (painter) ink(painter.drop(event.clientX, event.clientY));
    };
    /*
      `pointercancel` too: a press that turns into the browser's own drag of a
      link or a picture never sends a `pointerup`, and without this the brush
      stayed pressed in until the next click.
    */
    const release = () => dot.style.setProperty("--press", "1");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", release, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", leave);
    document.addEventListener("pointerleave", leave);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(inkTimer);
      window.clearTimeout(scrollTimer);
      painter?.destroy();
      probe.remove();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", leave);
      document.removeEventListener("pointerleave", leave);
      delete root.dataset.paintCursor;
    };
  }, []);

  return (
    <>
      {/* What the brush leaves behind: under it, over everything else. See
          painter.ts. */}
      <canvas ref={paintRef} aria-hidden className={styles.paint} />
      <div ref={dotRef} aria-hidden data-state="off" className={styles.brush}>
        {/*
          A paintbrush, drawn tip-first at the glyph's origin so the point that
          touches the picture is the point the pointer is at.

          EVERY STROKE IS DRAWN TWICE — once wider in the page's near-white, then
          in its own colour on top. That halo is what the old dab's ring was for:
          Deep Lilac on a dark photograph and Charcoal on a pale one both vanish
          without it, and a halo costs nothing where a filter would cost a
          repaint on a moving element.

          Brand colours only: the bristles take the surface's own `--paint`, the
          ferrule is White Rock and the handle Charcoal Slate.
        */}
        <svg viewBox="0 0 40 40" className={styles.glyph} focusable="false">
          {/*
            THE SPUR IS THE HOTSPOT, AND THE TRANSLATE IS WHAT GUARANTEES IT. The
            brush is drawn along the diagonal from a handle at the top right down
            to the bristles at the bottom left, and the point that touches the
            page is the spur on the head's lower-left edge — as drawn, (7.43,
            26.91). The box is positioned so its bottom-left corner sits under
            the pointer and the lean pivots there, so the whole glyph is shifted
            by that difference and the spur lands at 0,40: exactly where the
            pointer is, and exactly what the lean turns about. So a link is
            touched with the bristles, which is the only part of a brush that
            would touch anything.

            THE GEOMETRY IS GENERATED, NOT HAND-TWEAKED. Every point is laid out
            along one axis at 45 degrees — the head's half-width at the ferrule,
            at its belly and at its foot, the depth of the nick, the ferrule's
            length, the handle's taper. Nudging a number in here by eye is how
            this drifted into a blade once already.
          */}
          <g transform="translate(-7.43 13.09)">
            {/*
              EVERY STROKE IS DRAWN TWICE — once wider in `--halo`, then in its
              own colour on top.

              `--halo` IS NOT FIXED, and it cannot be. The bristles now carry the
              colour of whatever is under the pointer, which means on a Light
              Sage section they are Light Sage, on White Rock they are White
              Rock — the same colour as the ground they are standing on. A
              near-white outline around a near-white brush on a near-white
              section is no outline at all. The component measures the colour it
              has just picked up and sets the halo to Charcoal against a light
              one and to the page's near-white against a dark one, so the
              silhouette holds whatever the brush is loaded with.
            */}
            <g
              fill="none"
              stroke="var(--halo, var(--color-surface))"
              strokeWidth={2.6}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.92}
            >
              <path d="M22.91 19.91 C21.78 23.03 20.30 25.78 18.25 27.98 C15.91 30.45 13.01 31.51 10.75 30.52 C9.48 29.96 9.90 28.97 11.81 27.48 C9.20 27.69 7.36 27.55 7.78 26.14 C8.84 23.66 13.58 19.63 16.83 18.36 C18.53 17.65 19.38 17.23 20.09 17.09 Z" />
              <path d="M21.15 18.85 L24.61 15.39" />
              <path d="M26.70 15.78 L39.64 0.57 C40.20 -0.13 40.13 -0.20 39.43 0.36 L24.22 13.30 Z" />
            </g>

            {/*
              The handle, tapering to a point — Warm Terracotta, which is what a
              brush handle is (wood) and also the one colour in the palette that
              holds against White Rock, Light Sage, Deep Lilac and Charcoal
              alike. It was Charcoal Slate, and on the dark grounds that left
              only its own halo showing.
            */}
            <path d="M26.70 15.78 L39.64 0.57 C40.20 -0.13 40.13 -0.20 39.43 0.36 L24.22 13.30 Z" fill="var(--color-terracotta)" />

            {/* The head: narrow at the ferrule, bellied, and cut by a nick at
                the foot so it ends in two lobes rather than one blunt round —
                which is the difference between bristles and a blade. */}
            <path d="M22.91 19.91 C21.78 23.03 20.30 25.78 18.25 27.98 C15.91 30.45 13.01 31.51 10.75 30.52 C9.48 29.96 9.90 28.97 11.81 27.48 C9.20 27.69 7.36 27.55 7.78 26.14 C8.84 23.66 13.58 19.63 16.83 18.36 C18.53 17.65 19.38 17.23 20.09 17.09 Z" className={styles.bristles} />

            {/*
              The ferrule last, over the joint, so neither the head nor the
              handle shows a seam where it meets the band — and Charcoal, not
              White Rock. White Rock was invisible on cream and near-white, which
              is most of this site: the band disappeared and the brush came apart
              into a blob and a separate stick.
            */}
            <path
              d="M21.15 18.85 L24.61 15.39"
              stroke="var(--color-text)"
              strokeWidth={5.0}
              strokeLinecap="butt"
            />
          </g>
        </svg>
      </div>
    </>
  );
}
