"use client";

import { useEffect, useRef } from "react";

import styles from "@/components/motion/CursorLayer.module.css";

/**
 * ==========================================================================
 * The brush — the cursor for the whole site
 * ==========================================================================
 *
 * A paintbrush that follows the pointer, catching up with it rather than
 * sticking to it, leaning into the direction it is dragged, and pressing in
 * when the mouse goes down. Over a photograph its bristles take that picture's
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
 * COST. One `pointermove` listener, one rAF loop that runs only while the
 * brush is still closing a gap, and no React state after mount: position,
 * lean and colour are written straight onto the node as custom properties.
 * Nothing re-renders while the mouse moves.
 */

/**
 * Where the brush stands down and the native cursor comes back: text entry,
 * and an iframe, which draws its own. Kept in step with the `cursor: text`
 * rule in globals.css — the two have to name the same elements or a visitor
 * gets both cursors at once, or neither.
 */
const NATIVE =
  'input:not([type="button"],[type="submit"],[type="reset"],[type="checkbox"],[type="radio"],[type="range"],[type="color"],[type="file"],[type="image"]), textarea, [contenteditable=""], [contenteditable="true"], iframe';

/** How far the brush closes the gap to the pointer each frame. */
const EASE = 0.22;

/** Degrees of lean per pixel of horizontal lag, and the cap on it. */
const TILT_PER_PX = 0.55;
const TILT_MAX = 12;

export function CursorLayer() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (!window.matchMedia("(hover: hover)").matches) return;

    /*
      REDUCED MOTION NO LONGER MEANS NO BRUSH, and that was the bug behind
      "I can't see the cursor". While this was a flourish over photographs,
      standing down for that reader was right. It is the site's cursor now, so
      standing down leaves them with the plain arrow the client asked to
      replace — on a machine with Reduce Motion switched on, which is a great
      many of them, the whole feature simply did not exist.

      What they give up instead is the MOTION, which is what they asked about:
      the brush lands exactly on the pointer with no easing and no lean, so
      nothing on screen is animating. The shape, the colour and the hotspot are
      identical.
    */
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const root = document.documentElement;
    root.dataset.paintCursor = "on";

    let pointerX = 0;
    let pointerY = 0;
    let x = 0;
    let y = 0;
    let active = false;
    let frame = 0;
    let tilt = 0;

    const draw = () => {
      frame = 0;
      const dx = pointerX - x;
      x += dx * (calm ? 1 : EASE);
      y += (pointerY - y) * (calm ? 1 : EASE);
      /*
        THE LEAN. A brush that never changes angle reads as a sticker; one
        that leans into the direction of travel reads as being dragged. The
        target is the horizontal gap the dab is still closing, capped at
        TILT_MAX so a fast flick across the page cannot spin it, and eased at
        a third of the position's rate so the angle settles after the tip
        does rather than with it.
      */
      const want = calm ? 0 : Math.max(-TILT_MAX, Math.min(TILT_MAX, dx * TILT_PER_PX));
      tilt += calm ? want - tilt : (want - tilt) * 0.12;
      dot.style.setProperty("--x", `${x.toFixed(1)}px`);
      dot.style.setProperty("--y", `${y.toFixed(1)}px`);
      dot.style.setProperty("--tilt", tilt.toFixed(2));
      // Keep going only while there is still a gap worth closing; a still
      // pointer costs nothing.
      if (
        active &&
        (Math.abs(pointerX - x) > 0.4 ||
          Math.abs(pointerY - y) > 0.4 ||
          // The lean settles after the tip, so a frame is still owed while it
          // is unwinding — without this the brush freezes mid-lean.
          Math.abs(tilt) > 0.2)
      ) {
        frame = requestAnimationFrame(draw);
      }
    };

    const tick = () => {
      if (!frame) frame = requestAnimationFrame(draw);
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
    const dip = (value: string) => {
      if (value === loaded) return;
      loaded = value;
      dot.style.setProperty("--paint", value);
      const L = luminance(resolve(value));
      /*
        CHARCOAL WHEN THE READING FAILS, and that direction is deliberate.
        Most of this site is printed on light grounds, and the two mistakes
        are not equal: a Charcoal outline on a dark ground is still an
        outline — a shape you can see — while a near-white one on a light
        ground is nothing at all, which is the failure this whole branch
        exists to prevent.
      */
      dot.style.setProperty(
        "--halo",
        L !== null && L <= 0.42 ? "var(--color-surface)" : "var(--color-text)",
      );
    };

    const enter = (target: Element | null) => {
      active = true;
      // The brush appears where the pointer already is rather than flying in
      // from wherever it was last seen.
      x = pointerX;
      y = pointerY;
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
      follow(target);
      tick();
    };

    // The page can move under a still pointer; re-ask what is there.
    const onScroll = () => {
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

    const press = () => dot.style.setProperty("--press", "0.78");
    const release = () => dot.style.setProperty("--press", "1");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", leave);
    document.addEventListener("pointerleave", leave);

    return () => {
      cancelAnimationFrame(frame);
      probe.remove();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", leave);
      document.removeEventListener("pointerleave", leave);
      delete root.dataset.paintCursor;
    };
  }, []);

  return (
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
  );
}
