/**
 * ==========================================================================
 * The brush's paint — colour and timing, with no DOM in it
 * ==========================================================================
 *
 * A click with <CursorLayer>'s brush leaves one drop of paint exactly where
 * the bristles touch. The drawing lives in components/motion/painter.ts;
 * everything here is the arithmetic it runs on, kept pure so it can be tested
 * without a canvas.
 *
 * BRAND COLOURS ONLY, AND CHOSEN BY WHERE THE DROP LANDS. The client's ask was
 * that drops be different colours in different places, so a colour is never
 * random: the page is laid in a fine grid and each cell takes one of Deep
 * Lilac, Warm Terracotta, Light Sage or Soft Lavender — the same four, in the
 * same order, as `PAINTS` in lib/paint.ts. Clicking the same spot gives the
 * same colour; clicking somewhere else never repeats the drop before it.
 *
 * White Rock and Charcoal Slate are left out. White Rock is the ground of most
 * of this site and would paint nothing at all; Charcoal reads as ink.
 */

export type RGB = readonly [number, number, number];

/**
 * The paint colours, as raw brand tokens rather than `var()`s because a
 * canvas cannot resolve one; the painter reads them off the root.
 */
export const PAINT_TOKENS = [
  "--color-brand-lilac",
  "--color-brand-terracotta",
  "--color-brand-sage",
  "--color-brand-lavender",
] as const;

/**
 * The same values globals.css declares, for the one case the stylesheet
 * cannot be read — the painter prefers the live tokens so a palette change
 * there reaches the paint without touching this file.
 */
export const PAINT_FALLBACK: readonly RGB[] = [
  [0x90, 0x59, 0xa4], // Deep Lilac
  [0xd9, 0x77, 0x57], // Warm Terracotta
  [0xd1, 0xe7, 0xbe], // Light Sage
  [0xc4, 0xb5, 0xfd], // Soft Lavender
];

export const css = ([r, g, b]: RGB) => `rgb(${r} ${g} ${b})`;

/* -------------------------------------------------------------------------- */
/* Which colour lands where                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The side of one colour cell, in CSS px. About the width of a button's
 * label: two clicks on different words land in different cells, two clicks
 * on the same word usually do not.
 */
export const CELL = 48;

/** The drop before this one: where it landed on the page, and which colour it took. */
export type LastDrop = { x: number; y: number; index: number };

const cell = (v: number) => Math.floor(v / CELL);

/** A well-mixed 32-bit hash of a cell, so neighbouring cells come out unrelated. */
function hashCell(cx: number, cy: number): number {
  let h = Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h ^= h >>> 12;
  return h >>> 0;
}

/**
 * Which of `count` colours a drop at a point on the PAGE takes (not the
 * viewport, so a spot keeps its colour however far it has been scrolled).
 *
 * THE CELL PICKS THE COLOUR, AND TWO DROPS RUNNING NEVER SHARE ONE. A hash
 * of the cell scatters the four colours across the page with no pattern to
 * fall into, but on its own it hands the same colour out twice or three
 * times running often enough to look broken — and a repeating pattern was
 * worse, falling into lilac-terracotta-lilac-terracotta whenever clicks came
 * at an even spacing. So the hash decides, and if that would repeat the last
 * drop's colour in a different cell, the drop moves on to another. Clicking
 * the same cell again keeps its colour: that is the same place.
 */
export function colourAt(pageX: number, pageY: number, count: number, last?: LastDrop | null): number {
  const cx = cell(pageX);
  const cy = cell(pageY);
  const h = hashCell(cx, cy);
  let i = h % count;
  const moved = last && (cell(last.x) !== cx || cell(last.y) !== cy);
  if (moved && count > 1 && i === last.index) i = (i + 1 + ((h >>> 8) % (count - 1))) % count;
  return i;
}

/*
  MEASURED IN OKLAB, like every `color-mix()` in the stylesheet: straight-line
  distance there tracks how different two colours look far better than it
  does in sRGB.
*/
const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const toOklab = ([R, G, B]: RGB): [number, number, number] => {
  const r = toLinear(R);
  const g = toLinear(G);
  const b = toLinear(B);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};

/** How far apart two colours look: straight-line distance in OKLab. */
export function distance(a: RGB, b: RGB): number {
  const A = toOklab(a);
  const B = toOklab(b);
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
}

/*
  PAINT THE SAME COLOUR AS THE GROUND IS NO PAINT AT ALL. A drop has no
  outline, so Light Sage on the homepage's Light Sage is simply not there, and
  Light Sage on White Rock is the 1.03:1 pair lib/paint.ts already refuses.
  That file fixes it per section with PAINTS_ON_SAGE and PAINTS_ON_CREAM; the
  brush crosses every section, so it does the same thing live: <CursorLayer>
  already measures the ground under the bristles, and any colour closer to it
  than this is left out of the palette there.

  0.1 catches sage on sage, sage on White Rock and on the near-white, and
  Deep Lilac on a Deep Lilac panel, and lets every other brand pair through.
*/
export const CLASH = 0.1;

/**
 * The colours of `palette` that can be seen on `ground`. All of them with no
 * ground known — and all of them if somehow none clears it, since some paint
 * is better than none.
 *
 * Left out rather than swapped for the next colour along: swapping gives that
 * next colour two shares, and it turns up twice as often as the others.
 */
export function visibleOn(palette: readonly RGB[], ground: RGB | null): RGB[] {
  if (!ground) return [...palette];
  const seen = palette.filter((c) => distance(c, ground) >= CLASH);
  return seen.length ? seen : [...palette];
}

/* -------------------------------------------------------------------------- */
/* Timing                                                                     */
/* -------------------------------------------------------------------------- */

export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x < edge0 ? 0 : 1;
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * A drop lands over `land` ms, stays whole for the first `hold` fraction of
 * its `life`, then dries away. Nothing stays: the paint answers the click, it
 * does not sit over the copy someone is reading.
 */
export const DROP = { land: 160, life: 1400, hold: 0.5 } as const;

/** How much of a drop is left, 1 → 0, at `age` ms. */
export function remaining(age: number, life: number = DROP.life, hold: number = DROP.hold): number {
  if (age <= 0) return 1;
  if (age >= life) return 0;
  return 1 - smoothstep(hold, 1, age / life);
}
