/**
 * A one-slot registry for the running smooth-scroll instance.
 *
 * Lenis drives the real scroll position, so a programmatic
 * `window.scrollTo({ behavior: "smooth" })` and Lenis's own eased target are
 * two hands on the same wheel. Anything that wants to move the page asks here
 * first and hands the job to Lenis when it is running.
 *
 * It is a module slot rather than a context because the only consumer is a
 * button in the footer and the only producer is a component that renders
 * nothing at the root — a provider between them would be two files of wiring
 * to carry one reference. `null` is the normal state, not an error: reduced
 * motion tears Lenis down on purpose, and so does a page with no JavaScript.
 */

import type { MotionValue } from "framer-motion";

/** The slice of Lenis this file needs; avoids importing the library here. */
interface Scroller {
  scrollTo(target: number, options?: { duration?: number }): void;
  stop(): void;
  start(): void;
  on?(event: "scroll", handler: () => void): void;
  off?(event: "scroll", handler: () => void): void;
  /** Lenis exposes its current (animated) scroll position here. */
  scroll?: number;
}

let scroller: Scroller | null = null;
const frameListeners = new Set<() => void>();

export function registerScroller(instance: Scroller | null): void {
  for (const listener of frameListeners) scroller?.off?.("scroll", listener);
  scroller = instance;
  for (const listener of frameListeners) scroller?.on?.("scroll", listener);
}

/**
 * Call back whenever the page has moved — in the frame it moved in.
 *
 * WHY THIS IS NOT JUST A `scroll` LISTENER. Lenis moves the page from inside
 * its own animation frame, and the browser does not dispatch `scroll`
 * synchronously when it does: the event is queued and fires in the *next*
 * frame's rendering steps. So anything scrubbed by `window.scrollY` from a
 * scroll listener paints one frame behind the page it belongs to — the hero's
 * photograph did, and against a sticky frame that reads as the banner shaking
 * rather than being carried, which is what the client saw.
 *
 * Lenis emits its own event inside that frame, before the paint, so a
 * consumer subscribed here is always in step. The window listener stays as
 * well: it is the only signal when Lenis is not running — a reader who has
 * asked for reduced motion, a touch drag (`syncTouch` is off), or no
 * JavaScript at all — and calling back twice with the same scroll position
 * costs nothing.
 */
export function onScrollFrame(handler: () => void): () => void {
  frameListeners.add(handler);
  scroller?.on?.("scroll", handler);
  window.addEventListener("scroll", handler, { passive: true });
  return () => {
    frameListeners.delete(handler);
    scroller?.off?.("scroll", handler);
    window.removeEventListener("scroll", handler);
  };
}

/**
 * Send the page to the top, by whichever means is actually in charge.
 *
 * Falls back to the browser when Lenis is not running, and to an instant jump
 * when the reader has asked for reduced motion — a smoothed scroll of the
 * whole page is exactly the kind of movement that setting is asking to stop.
 */
/**
 * Send the page to a position, by whichever means is in charge.
 *
 * The same hand-off `scrollToTop` makes, for a caller that knows where it
 * wants to land — the seasonal section jumps to the step belonging to the
 * occasion that was clicked. A bare `window.scrollTo` would be dragged back by
 * Lenis on the next frame.
 */
export function scrollToY(top: number): void {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (scroller && !reduced) {
    scroller.scrollTo(top);
    return;
  }

  window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
}

export function scrollToTop(): void {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (scroller && !reduced) {
    scroller.scrollTo(0);
    return;
  }

  window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
}

/**
 * Hold and release the page behind a full-screen overlay.
 *
 * `document.body { overflow: hidden }` is the usual lock and it is not enough
 * here, for two reasons. Lenis listens for wheel and touch on the window with
 * `passive: false` and moves the page itself, so a lock the browser honours is
 * a lock Lenis can still scroll straight past; and on iOS Safari the body rule
 * has never reliably held the document in the first place. Stopping Lenis
 * closes both: while it is stopped it calls `preventDefault()` on every scroll
 * gesture it sees, and it puts `lenis-stopped` on <html>, which globals.css
 * already answers with `overflow: hidden`.
 *
 * Anything scrollable *inside* the overlay must carry `data-lenis-prevent`, or
 * it is caught by the same net — Lenis checks that attribute before it checks
 * whether it is stopped, which is exactly the escape hatch a modal needs.
 *
 * Both are no-ops when Lenis is not running (reduced motion, or no JavaScript),
 * where the browser's own scrolling and the body rule are all there is.
 */
export function pauseScroller(): void {
  scroller?.stop();
}

export function resumeScroller(): void {
  scroller?.start();
}

/* ==========================================================================
 * THE SCROLL-PROGRESS HUB (issue #70)
 * ==========================================================================
 *
 * Framer's `useScroll({ target, offset })` builds a scroll tracker per call: its
 * own scroll listener, its own ResizeObservers, its own layout reads. With
 * dozens of scrubbed elements on one page that is dozens of listeners all
 * measuring on every scroll event, off-screen ones included.
 *
 * This is the replacement: ONE tick function on `onScrollFrame` (Lenis's event
 * when it runs, the window's otherwise), ONE IntersectionObserver that decides
 * which targets are near the window, ONE ResizeObserver that says when the
 * cached geometry went stale. Per tick it reads the scroll position once and
 * does plain arithmetic for the visible targets only - no layout reads.
 *
 * GEOMETRY IS DOCUMENT-SPACE AND TRANSFORM-FREE. `top` is the sum of
 * `offsetTop` up the `offsetParent` chain, exactly what Framer measures, so a
 * target that is itself translated by the animation it drives (ScrollReveal's
 * `y`) does not chase its own tail. The flip side: callers must pass an
 * element that is neither `position: sticky` (its offsetTop is not a document
 * position) nor inside a ancestor that is translated vertically by scroll.
 * Pass a plain wrapper if in doubt.
 *
 * There is deliberately no spring here: callers that want lag wrap the
 * returned value in `useSpring` themselves.
 */

export type ScrollOffset = readonly [string | number, string | number];

export interface ParsedOffset {
  /** Point on the element (0 = its top, 1 = its bottom) for offset 0 / offset 1. */
  el0: number;
  /** Point in the viewport (0 = top, 1 = bottom) for offset 0 / offset 1. */
  vp0: number;
  el1: number;
  vp1: number;
}

const NAMED_POINTS: Record<string, number> = { start: 0, center: 0.5, end: 1 };

function parsePoint(raw: string): number {
  const token = raw.trim();
  if (token in NAMED_POINTS) return NAMED_POINTS[token];
  if (/^-?\d*\.?\d+%$/.test(token)) return parseFloat(token) / 100;
  if (/^-?\d*\.?\d+$/.test(token)) return parseFloat(token);
  throw new Error(`Unsupported scroll offset point "${raw}"`);
}

function parseEdge(edge: string | number): [number, number] {
  const parts = String(edge).trim().split(/\s+/);
  if (parts.length !== 2) {
    throw new Error(`Unsupported scroll offset "${edge}": expected "<element> <viewport>"`);
  }
  return [parsePoint(parts[0]), parsePoint(parts[1])];
}

/**
 * Framer's "<elementPoint> <viewportPoint>" offset pairs, as fractions.
 * Supports `start`/`center`/`end`, numbers 0..1 and percentages. Pixel and
 * `vh` forms are not supported on purpose - nothing here uses them - and throw
 * rather than silently scrubbing against the wrong range.
 */
export function parseOffset(offset: ScrollOffset): ParsedOffset {
  const [el0, vp0] = parseEdge(offset[0]);
  const [el1, vp1] = parseEdge(offset[1]);
  return { el0, vp0, el1, vp1 };
}

/**
 * Progress 0..1 for a target at document-space `top` / `height`, with the page
 * scrolled to `y` in a window `viewportH` tall. The scroll positions at which
 * progress is 0 and 1 are where the element point meets the viewport point:
 * `a` for offset 0, `b` for offset 1. A reversed range (b < a) still maps
 * correctly; a zero-length one is a step at `a`.
 */
export function progressFor(
  y: number,
  viewportH: number,
  top: number,
  height: number,
  parsed: ParsedOffset,
): number {
  const a = top - viewportH * parsed.vp0 + height * parsed.el0;
  const b = top - viewportH * parsed.vp1 + height * parsed.el1;
  if (b === a) return y >= a ? 1 : 0;
  const p = (y - a) / (b - a);
  // `!(p > 0)` rather than `p < 0`: a reversed range at its start gives -0.
  return !(p > 0) ? 0 : p > 1 ? 1 : p;
}

interface HubEntry {
  el: HTMLElement;
  parsed: ParsedOffset;
  mv: MotionValue<number>;
  top: number;
  height: number;
  measured: boolean;
  dirty: boolean;
  last: number;
}

const hubEntries = new Set<HubEntry>();
const hubVisible = new Set<HubEntry>();
const hubByElement = new Map<Element, Set<HubEntry>>();
let hubIo: IntersectionObserver | null = null;
let hubRo: ResizeObserver | null = null;
let hubOffFrame: (() => void) | null = null;
let hubRaf = 0;

function measureEntry(e: HubEntry): void {
  let top = 0;
  let node: HTMLElement | null = e.el;
  while (node) {
    top += node.offsetTop;
    const parent = node.offsetParent as HTMLElement | null;
    if (parent) top += parent.clientTop;
    node = parent;
  }
  e.top = top;
  e.height = e.el.offsetHeight;
  e.measured = true;
  e.dirty = false;
}

function updateEntry(e: HubEntry, y: number, vh: number): void {
  const p = progressFor(y, vh, e.top, e.height, e.parsed);
  if (p !== e.last) {
    e.last = p;
    e.mv.set(p);
  }
}

function hubY(): number {
  return scroller?.scroll ?? window.scrollY;
}

function hubTick(): void {
  const y = hubY();
  const vh = window.innerHeight;
  // Cheap synchronous check for targets the IntersectionObserver has not
  // reported yet - a big anchor jump lands in one frame, and waiting for IO
  // would leave them a frame behind. Cached geometry only: no layout reads.
  for (const e of hubEntries) {
    if (hubVisible.has(e) || !e.measured || e.dirty) continue;
    if (e.top + e.height >= y - vh && e.top <= y + 2 * vh) hubVisible.add(e);
  }
  for (const e of hubVisible) {
    if (e.dirty) measureEntry(e);
    updateEntry(e, y, vh);
  }
}

function hubFlush(): void {
  hubRaf = 0;
  let any = false;
  for (const e of hubVisible) {
    if (e.dirty) {
      measureEntry(e);
      any = true;
    }
  }
  if (any) hubTick();
}

function hubSchedule(): void {
  if (!hubRaf && hubVisible.size) hubRaf = requestAnimationFrame(hubFlush);
}

function hubMarkAllDirty(): void {
  for (const e of hubEntries) e.dirty = true;
  hubSchedule();
}

function hubOnIntersect(records: IntersectionObserverEntry[]): void {
  const y = hubY();
  const vh = window.innerHeight;
  for (const record of records) {
    const group = hubByElement.get(record.target);
    if (!group) continue;
    for (const e of group) {
      // Measure on every change: on entry the cache may be stale or absent, on
      // exit it makes the final value exact.
      if (e.dirty || !e.measured) measureEntry(e);
      if (record.isIntersecting) hubVisible.add(e);
      else hubVisible.delete(e);
      // On the way out this lands the value on exactly 0 or 1.
      updateEntry(e, y, vh);
    }
  }
}

function hubOnResize(records: ResizeObserverEntry[]): void {
  for (const record of records) {
    if (record.target === document.body) {
      hubMarkAllDirty();
      return;
    }
    const group = hubByElement.get(record.target);
    if (group) for (const e of group) e.dirty = true;
  }
  hubSchedule();
}

function hubAttach(): void {
  hubIo = new IntersectionObserver(hubOnIntersect, { rootMargin: "100% 0px" });
  hubRo = new ResizeObserver(hubOnResize);
  hubRo.observe(document.body);
  hubOffFrame = onScrollFrame(hubTick);
  window.addEventListener("resize", hubMarkAllDirty);
  window.addEventListener("load", hubMarkAllDirty);
  void document.fonts?.ready.then(() => {
    if (hubIo) hubMarkAllDirty();
  });
}

function hubDetach(): void {
  hubIo?.disconnect();
  hubRo?.disconnect();
  hubIo = null;
  hubRo = null;
  hubOffFrame?.();
  hubOffFrame = null;
  window.removeEventListener("resize", hubMarkAllDirty);
  window.removeEventListener("load", hubMarkAllDirty);
  if (hubRaf) cancelAnimationFrame(hubRaf);
  hubRaf = 0;
}

/**
 * Drive `mv` with `el`'s scroll progress through `offset` - the shared-hub
 * stand-in for `useScroll({ target, offset }).scrollYProgress`. Browser only
 * (call it from an effect). Returns an idempotent unsubscribe.
 */
export function observeScrollProgress(
  el: HTMLElement,
  offset: ScrollOffset,
  mv: MotionValue<number>,
): () => void {
  const entry: HubEntry = {
    el,
    parsed: parseOffset(offset),
    mv,
    top: 0,
    height: 0,
    measured: false,
    dirty: true,
    last: Number.NaN,
  };

  if (hubEntries.size === 0) hubAttach();
  hubEntries.add(entry);
  let group = hubByElement.get(el);
  if (!group) hubByElement.set(el, (group = new Set()));
  group.add(entry);
  hubIo?.observe(el);
  hubRo?.observe(el);

  // Seed the value now rather than a frame after the IntersectionObserver's
  // first report, so an element already in view never paints at 0.
  measureEntry(entry);
  const y = hubY();
  const vh = window.innerHeight;
  if (entry.top + entry.height >= y - vh && entry.top <= y + 2 * vh) hubVisible.add(entry);
  updateEntry(entry, y, vh);

  let active = true;
  return () => {
    if (!active) return;
    active = false;
    hubEntries.delete(entry);
    hubVisible.delete(entry);
    const g = hubByElement.get(el);
    if (g) {
      g.delete(entry);
      if (g.size === 0) {
        hubByElement.delete(el);
        hubIo?.unobserve(el);
        hubRo?.unobserve(el);
      }
    }
    if (hubEntries.size === 0) hubDetach();
  };
}
