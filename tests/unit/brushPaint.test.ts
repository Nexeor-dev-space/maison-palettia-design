import { describe, expect, it } from "vitest";

import {
  CELL,
  CLASH,
  DROP,
  PAINT_FALLBACK,
  colourAt,
  distance,
  type LastDrop,
  remaining,
  visibleOn,
} from "../../lib/brushPaint";

/**
 * The brush's drop of paint (components/motion/painter.ts). The canvas itself
 * is checked by eye; this is the arithmetic under it — which brand colour
 * lands where, and how long a drop lasts.
 */

const N = PAINT_FALLBACK.length;

describe("colourAt — colour by position", () => {
  it("is the same for the same spot, and anywhere inside one cell", () => {
    expect(colourAt(500, 1200, N)).toBe(colourAt(500, 1200, N));
    const x = CELL * 7;
    const y = CELL * 3;
    expect(colourAt(x + 1, y + 1, N)).toBe(colourAt(x + CELL - 1, y + CELL - 1, N));
  });

  it("only ever indexes the palette, including off the top-left of the page", () => {
    for (const count of [2, 3, 4]) {
      for (const [x, y] of [
        [0, 0],
        [-30, -500],
        [1e6, 3e5],
        [719.5, 12.25],
      ]) {
        const i = colourAt(x, y, count);
        expect(Number.isInteger(i)).toBe(true);
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(count);
      }
    }
  });

  it("uses every colour, in near-equal shares", () => {
    const seen = new Map<number, number>();
    for (let cx = 0; cx < 30; cx++) {
      for (let cy = 0; cy < 20; cy++) {
        const i = colourAt(cx * CELL, cy * CELL, N);
        seen.set(i, (seen.get(i) ?? 0) + 1);
      }
    }
    expect(seen.size).toBe(N);
    for (const count of seen.values()) expect(Math.abs(count - 600 / N)).toBeLessThan(600 / N / 3);
  });

  /** A run of clicks, each told about the one before, as the painter does. */
  const run = (points: [number, number][], count: number) => {
    let last: LastDrop | null = null;
    return points.map(([x, y]) => {
      const index = colourAt(x, y, count, last);
      last = { x, y, index };
      return index;
    });
  };

  it("never repeats the last drop's colour in a different place", () => {
    for (const count of [2, 3, 4]) {
      for (const gap of [50, 70, 96, 120, 200]) {
        const across = run(
          Array.from({ length: 16 }, (_, k) => [100 + k * gap, 140]),
          count,
        );
        const down = run(
          Array.from({ length: 16 }, (_, k) => [300, 90 + k * gap]),
          count,
        );
        for (const row of [across, down]) {
          for (let k = 1; k < row.length; k++) expect(row[k]).not.toBe(row[k - 1]);
        }
      }
    }
  });

  it("does not fall into a two-colour rhythm under evenly spaced clicks", () => {
    // What broke a repeating pattern: clicks at an even spacing only ever
    // alternated two colours.
    for (const count of [3, 4]) {
      for (const gap of [50, 70, 96, 120, 144, 200]) {
        const row = run(
          Array.from({ length: 12 }, (_, k) => [100 + k * gap, 140]),
          count,
        );
        expect(new Set(row).size).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("keeps its colour when the same spot is clicked again", () => {
    const first = colourAt(410, 260, N);
    expect(colourAt(412, 262, N, { x: 410, y: 260, index: first })).toBe(first);
  });
});

describe("visibleOn — never paint the ground's own colour", () => {
  const [LILAC, TERRACOTTA, SAGE, LAVENDER] = PAINT_FALLBACK;
  const WHITE_ROCK = [0xef, 0xe2, 0xca] as const;

  it("leaves sage out on a sage ground, and on White Rock", () => {
    expect(visibleOn(PAINT_FALLBACK, SAGE)).toEqual([LILAC, TERRACOTTA, LAVENDER]);
    expect(visibleOn(PAINT_FALLBACK, WHITE_ROCK)).toEqual([LILAC, TERRACOTTA, LAVENDER]);
  });

  it("leaves Deep Lilac out on a Deep Lilac panel", () => {
    expect(visibleOn(PAINT_FALLBACK, LILAC)).toEqual([TERRACOTTA, SAGE, LAVENDER]);
  });

  it("keeps every colour where all can be seen, with no ground known, or when none clears", () => {
    expect(visibleOn(PAINT_FALLBACK, null)).toEqual([...PAINT_FALLBACK]);
    expect(visibleOn(PAINT_FALLBACK, [0x2d, 0x37, 0x48])).toEqual([...PAINT_FALLBACK]);
    expect(visibleOn([SAGE], SAGE)).toEqual([SAGE]);
    expect(distance(TERRACOTTA, WHITE_ROCK)).toBeGreaterThan(CLASH);
    expect(distance(LAVENDER, WHITE_ROCK)).toBeGreaterThan(CLASH);
  });
});

describe("remaining — how wet a drop still is", () => {
  it("starts full, ends dry, and never goes outside [0, 1]", () => {
    expect(remaining(-10)).toBe(1);
    expect(remaining(0)).toBe(1);
    expect(remaining(DROP.life)).toBe(0);
    expect(remaining(DROP.life * 3)).toBe(0);
  });

  it("holds whole for its hold, then dries", () => {
    expect(remaining(DROP.life * DROP.hold * 0.9)).toBe(1);
    const later = remaining(DROP.life * 0.8);
    expect(later).toBeGreaterThan(0);
    expect(later).toBeLessThan(1);
  });

  it("has landed well before it starts to dry, and is gone within two seconds", () => {
    expect(DROP.land).toBeLessThan(DROP.life * DROP.hold);
    expect(DROP.life).toBeLessThanOrEqual(2000);
  });
});
