"use client";

import { useEffect } from "react";

/**
 * PAUSES INFINITE CSS LOOPS WHILE THEY ARE OFF SCREEN.
 *
 * A profile of the home page found 48 of 52 infinite animations — the
 * <DoodleMark> idle floats, the section-ground floats, the banner's drift and
 * its scroll cue — still running with nothing of them on screen. Each one is
 * cheap; all of them together are a style-and-composite cost on every frame
 * of an idle page.
 *
 * One IntersectionObserver for the whole site, not one per mark: anything
 * carrying `data-loop` is observed, and gets `data-offscreen` while it is
 * outside the viewport. globals.css turns that into
 * `animation-play-state: paused` for the element, its descendants and their
 * pseudo-elements. No margin: a loop paused a few pixels early is invisible,
 * one left running "just in case" is the cost this exists to remove.
 *
 * A MutationObserver picks up marks that mount later (client navigation,
 * lazy sections). It only scans added nodes, so it is idle while the DOM is.
 */
export function LoopPause() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        entry.target.toggleAttribute("data-offscreen", !entry.isIntersecting);
      }
    });

    const scan = (root: ParentNode) => {
      if (root instanceof Element && root.hasAttribute("data-loop")) io.observe(root);
      for (const el of root.querySelectorAll("[data-loop]")) io.observe(el);
    };
    scan(document.body);

    const mo = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) scan(node);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);

  return null;
}
