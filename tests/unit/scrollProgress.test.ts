import { describe, expect, it } from "vitest";

import { parseOffset, progressFor } from "../../lib/scroll";

/**
 * The pure half of the scroll hub (lib/scroll.ts): Framer-style offset strings
 * and the progress arithmetic. Geometry is document-space: an element at
 * top 2000, 400 tall, in a 1000px window.
 */

const TOP = 2000;
const H = 400;
const VH = 1000;

describe("parseOffset", () => {
  it("reads numeric strings", () => {
    expect(parseOffset(["start 0.98", "start 0.6"])).toEqual({ el0: 0, vp0: 0.98, el1: 0, vp1: 0.6 });
  });

  it("reads named points", () => {
    expect(parseOffset(["start end", "end start"])).toEqual({ el0: 0, vp0: 1, el1: 1, vp1: 0 });
    expect(parseOffset(["center center", "end end"])).toEqual({ el0: 0.5, vp0: 0.5, el1: 1, vp1: 1 });
  });

  it("reads percentages", () => {
    expect(parseOffset(["start 85%", "end 72%"])).toEqual({ el0: 0, vp0: 0.85, el1: 1, vp1: 0.72 });
    expect(parseOffset(["start 95%", "end 60%"])).toEqual({ el0: 0, vp0: 0.95, el1: 1, vp1: 0.6 });
  });

  it("accepts plain numbers inside a pair", () => {
    expect(parseOffset(["0 1", "1 0"])).toEqual({ el0: 0, vp0: 1, el1: 1, vp1: 0 });
  });

  it("throws on unsupported forms", () => {
    expect(() => parseOffset(["start", "end start"])).toThrow();
    expect(() => parseOffset(["start 100px", "end start"])).toThrow();
    expect(() => parseOffset(["start middle", "end start"])).toThrow();
  });
});

describe("progressFor", () => {
  it("['start 0.98','start 0.6']: 0 at top=98% of window, 1 at top=60%", () => {
    const o = parseOffset(["start 0.98", "start 0.6"]);
    // a = 2000 - 980 = 1020, b = 2000 - 600 = 1400
    expect(progressFor(1020, VH, TOP, H, o)).toBe(0);
    expect(progressFor(1210, VH, TOP, H, o)).toBeCloseTo(0.5, 10);
    expect(progressFor(1400, VH, TOP, H, o)).toBe(1);
  });

  it("['start end','end start']: 0 as the head meets the foot of the window, 1 as the foot leaves the top", () => {
    const o = parseOffset(["start end", "end start"]);
    // a = 2000 - 1000 = 1000, b = 2000 + 400 - 0 = 2400
    expect(progressFor(1000, VH, TOP, H, o)).toBe(0);
    expect(progressFor(1700, VH, TOP, H, o)).toBeCloseTo(0.5, 10);
    expect(progressFor(2400, VH, TOP, H, o)).toBe(1);
  });

  it("['start 85%','end 72%']", () => {
    const o = parseOffset(["start 85%", "end 72%"]);
    // a = 2000 - 850 = 1150, b = 2000 + 400 - 720 = 1680
    expect(progressFor(1150, VH, TOP, H, o)).toBe(0);
    expect(progressFor(1415, VH, TOP, H, o)).toBeCloseTo(0.5, 10);
    expect(progressFor(1680, VH, TOP, H, o)).toBe(1);
  });

  it("['start 95%','end 60%']", () => {
    const o = parseOffset(["start 95%", "end 60%"]);
    // a = 2000 - 950 = 1050, b = 2000 + 400 - 600 = 1800
    expect(progressFor(1050, VH, TOP, H, o)).toBe(0);
    expect(progressFor(1425, VH, TOP, H, o)).toBeCloseTo(0.5, 10);
    expect(progressFor(1800, VH, TOP, H, o)).toBe(1);
  });

  it("clamps outside the range", () => {
    const o = parseOffset(["start end", "end start"]);
    expect(progressFor(-500, VH, TOP, H, o)).toBe(0);
    expect(progressFor(99_999, VH, TOP, H, o)).toBe(1);
  });

  it("maps a reversed range (b < a) from 0 to 1 against the scroll", () => {
    // a = 2000 - 0 = 2000, b = 2000 - 1000 = 1000
    const o = parseOffset(["start start", "start end"]);
    expect(progressFor(2000, VH, TOP, H, o)).toBe(0);
    expect(progressFor(1500, VH, TOP, H, o)).toBeCloseTo(0.5, 10);
    expect(progressFor(1000, VH, TOP, H, o)).toBe(1);
    expect(progressFor(3000, VH, TOP, H, o)).toBe(0);
    expect(progressFor(0, VH, TOP, H, o)).toBe(1);
  });

  it("guards b === a (zero-length range) as a step, never NaN", () => {
    const o = parseOffset(["start start", "start start"]);
    expect(progressFor(1999, VH, TOP, H, o)).toBe(0);
    expect(progressFor(2000, VH, TOP, H, o)).toBe(1);
    expect(progressFor(2500, VH, TOP, H, o)).toBe(1);
    expect(Number.isNaN(progressFor(2000, VH, TOP, H, o))).toBe(false);
  });
});
