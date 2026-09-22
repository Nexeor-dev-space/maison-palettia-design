"use client";

import { useEffect, useRef } from "react";

import styles from "@/components/motion/CursorLayer.module.css";

/**
 * ==========================================================================
 * The brush — a cursor for the pictures, and nowhere else
 * ==========================================================================
 *
 * A paintbrush that follows the pointer across a photograph, catching up with
 * it rather than sticking to it, leaning into the direction it is dragged, and
 * pressing in when the mouse goes down. Its bristles take the colour of the
 * picture it is over.
 *
 * IT WAS A ROUND DAB OF COLOUR, and the client read that as a colour-dropper —
 * fairly, because a filled circle with a ring is the eyedropper icon in every
 * image editor, so over a photograph it offered to pick a colour rather than
 * to paint with one. A brush names the thing the Maison actually sells, and it
 * carries the same information: the tip is still tinted with the surface's own
 * `--paint`, so moving between two differently-coloured pictures still reads
 * as reloading it.
 *
 * WHERE IT APPEARS, AND WHY THAT IS A SHORT LIST. Only over an element marked
 * `data-paint` — the photographs on the activity plates, the event tiles and
 * the studio's own pictures. Everywhere else the system cursor is untouched:
 * an arrow over text, a hand over links, a caret in a field. A site-wide
 * replacement cursor is the single most common way this idea goes wrong, and
 * it costs a visitor the pointer they know in exactly the places where they
 * need it most — forms, the basket, checkout, anything they are about to pay
 * for. None of those carry the attribute, so none of them can lose it.
 *
 * It also stands down inside a marked surface for any control nested in it, so
 * a button laid over a photograph keeps its hand.
 *
 * IT DOES NOT MOUNT AT ALL for a coarse pointer (every phone and tablet), for
 * a reader who has asked for reduced motion, or without JavaScript. The native
 * cursor is only ever hidden — by `html[data-paint-cursor]` in globals.css —
 * while this is running and has a surface under the pointer, so a failure
 * here cannot leave the page with no cursor at all.
 *
 * COST. One `pointermove` listener, one rAF loop that runs only while the dab
 * is on screen or settling, and no React state after mount: position is
 * written straight onto the node as two custom properties. Nothing re-renders
 * while the mouse moves.
 */

/** Controls that keep the system cursor even inside a marked surface. */
const CONTROL = 'button, input, select, textarea, label, summary, [role="button"], [contenteditable=""], [contenteditable="true"]';

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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
      x += dx * EASE;
      y += (pointerY - y) * EASE;
      /*
        THE LEAN. A brush that never changes angle reads as a sticker; one
        that leans into the direction of travel reads as being dragged. The
        target is the horizontal gap the dab is still closing, capped at
        TILT_MAX so a fast flick across the page cannot spin it, and eased at
        a third of the position's rate so the angle settles after the tip
        does rather than with it.
      */
      const want = Math.max(-TILT_MAX, Math.min(TILT_MAX, dx * TILT_PER_PX));
      tilt += (want - tilt) * 0.12;
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
     * The surface under a point, or null — null when the point is over a
     * control nested inside one, which is what keeps a button's hand.
     */
    const surfaceAt = (target: Element | null): HTMLElement | null => {
      // `closest` rather than `target instanceof Element`: a pointer event
      // retargeted to the document or dispatched at the window has no such
      // method, and this runs inside a global listener — a throw here stops
      // every later move being handled and strands the brush mid-page.
      if (typeof target?.closest !== "function") return null;
      const surface = target.closest<HTMLElement>("[data-paint]") ?? null;
      if (!surface) return null;
      // Annotated, because the guard above narrows `target` to a non-null
      // Element and the walk assigns `parentElement` (which is nullable) back
      // into the same binding.
      for (let node: Element | null = target; node && node !== surface; node = node.parentElement) {
        if (node.matches(CONTROL)) return null;
      }
      return surface;
    };

    /*
      WHICH SURFACE THE BRUSH IS CURRENTLY LOADED FROM.

      Kept so that crossing straight from one paintable surface to another
      reloads the colour. Without it the brush only ever took a colour on the
      way IN from unpainted page — so dragging along a row of activity cards
      carried the first card's paint across all seven, and the tip disagreed
      with the flood rising underneath it.
    */
    let current: HTMLElement | null = null;

    /** Dip the brush in this surface's own `--paint`. */
    const loadPaint = (surface: HTMLElement) => {
      const paint = getComputedStyle(surface).getPropertyValue("--paint").trim();
      dot.style.setProperty("--paint", paint || "var(--color-primary)");
      current = surface;
    };

    const enter = (surface: HTMLElement) => {
      active = true;
      // The dab appears where the pointer already is rather than flying in
      // from wherever it was last seen.
      x = pointerX;
      y = pointerY;
      // Upright on arrival: the lean describes travel, and a brush that
      // appears already tilted has not travelled anywhere yet.
      tilt = 0;
      dot.style.setProperty("--tilt", "0");
      loadPaint(surface);
      dot.style.setProperty("--in", "1");
      dot.dataset.state = "on";
      tick();
    };

    const leave = () => {
      active = false;
      current = null;
      dot.style.setProperty("--in", "0");
      dot.dataset.state = "off";
    };

    const onMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      const surface = surfaceAt(event.target as Element | null);
      if (surface && !active) enter(surface);
      else if (!surface && active) leave();
      else if (active) {
        // Already painting, but possibly over a different picture now. The
        // position keeps travelling; only the colour is re-dipped.
        if (surface && surface !== current) loadPaint(surface);
        tick();
      }
    };

    // The page can move under a still pointer; re-ask what is there.
    const onScroll = () => {
      const surface = surfaceAt(document.elementFromPoint(pointerX, pointerY));
      if (surface && !active) enter(surface);
      else if (!surface && active) leave();
      // A still pointer can end up over a different card when the row scrolls
      // under it, so the colour is re-checked here too.
      else if (surface && active && surface !== current) loadPaint(surface);
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
      <svg viewBox="0 0 34 34" className={styles.glyph} focusable="false">
        {/*
          Drawn as a brush is held: the head down on the left with its lobe on
          the glyph's bottom-left corner — the hotspot — and a long handle
          tapering up to the right toward the hand.

          THE HEAD IS A TEARDROP ALONG THE AXIS, NOT AN OVAL ACROSS IT. Drawn
          as an oval it read as a spoon, and it left a seam where it met the
          band. It now runs from a rounded lobe at the hotspot, through its
          widest point about two fifths up, to a flat joint cut square against
          the ferrule — with one concave notch on the underside, which is the
          split a loaded brush has and the thing that stops the lobe reading
          as a leaf. The ferrule is laid over that joint so neither side shows
          a seam.

          Every stroke is drawn twice — the halo group first in the page's
          near-white, then the real colours on top — so the silhouette holds
          over a dark crop and a pale one alike.
        */}
        <g
          fill="var(--color-surface)"
          stroke="var(--color-surface)"
          strokeWidth={2.2}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.92}
        >
          <path d="M12.6 18.3 C9.2 19.4, 6.2 21.4, 4.7 23.7 C3.4 25.8, 2.4 28.0, 1.7 30.2 C1.2 31.8, 2.5 33.0, 4.0 32.4 C5.0 32.0, 5.7 31.1, 6.0 30.1 C6.8 31.3, 8.6 31.2, 10.4 29.4 C12.6 27.2, 14.8 23.8, 15.8 21.4 Z" />
          <path d="M15.45 14.05 L18.55 17.15 L31.8 2.2 Z" />
        </g>

        {/* The head. Bellied, with one notch on the underside — the split a
            loaded brush actually has, and the detail that stops the lobe
            reading as a leaf. */}
        <path
          d="M12.6 18.3 C9.2 19.4, 6.2 21.4, 4.7 23.7 C3.4 25.8, 2.4 28.0, 1.7 30.2 C1.2 31.8, 2.5 33.0, 4.0 32.4 C5.0 32.0, 5.7 31.1, 6.0 30.1 C6.8 31.3, 8.6 31.2, 10.4 29.4 C12.6 27.2, 14.8 23.8, 15.8 21.4 Z"
          className={styles.bristles}
        />

        {/* The handle, tapering from the ferrule to a point. A triangle does
            what the reference's slight curve does at this size, and holds its
            edge far better when the whole glyph is 40px. */}
        <path d="M15.45 14.05 L18.55 17.15 L31.8 2.2 Z" fill="var(--color-text)" />

        {/* The ferrule last, over the joint between the two, so neither the
            head nor the handle shows a seam where it meets the band. */}
        <path
          d="M13.6 19.2 L17.6 15.2"
          stroke="var(--color-cream)"
          strokeWidth={4.6}
          strokeLinecap="butt"
        />
      </svg>
    </div>
  );
}
