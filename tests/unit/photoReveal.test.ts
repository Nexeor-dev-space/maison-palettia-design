import { describe, expect, it } from "vitest";

import { PHOTO_REVEAL_SCRIPT } from "../../lib/photoReveal";

/**
 * The photo fade-in's head script (#216): insertions are swept at most once
 * per frame instead of once per mutation batch, and every other path (load,
 * error, DOMContentLoaded, pageshow) still marks pictures straight away.
 */

type Img = { nodeName: string; complete: boolean; attrs: Set<string>; hasAttribute(n: string): boolean; setAttribute(n: string): void };

function img(complete: boolean): Img {
  const attrs = new Set(["data-blur"]);
  return {
    nodeName: "IMG",
    complete,
    attrs,
    hasAttribute: (n) => attrs.has(n),
    setAttribute: (n) => void attrs.add(n),
  };
}

function page(opts: { raf?: boolean } = {}) {
  const images: Img[] = [];
  const docListeners: Record<string, (e: { target: unknown }) => void> = {};
  const winListeners: Record<string, () => void> = {};
  const frames: (() => void)[] = [];
  let observer: (() => void) | null = null;
  let queries = 0;

  const document = {
    documentElement: { setAttribute: () => {} },
    addEventListener: (type: string, fn: (e: { target: unknown }) => void) => void (docListeners[type] = fn),
    querySelectorAll: () => {
      queries++;
      return images.filter((i) => !i.attrs.has("data-loaded"));
    },
  };
  class MutationObserver {
    constructor(fn: () => void) {
      observer = fn;
    }
    observe() {}
  }
  const scope: Record<string, unknown> = {
    document,
    MutationObserver,
    addEventListener: (type: string, fn: () => void) => void (winListeners[type] = fn),
  };
  if (opts.raf !== false) scope.requestAnimationFrame = (fn: () => void) => frames.push(fn);

  new Function(...Object.keys(scope), PHOTO_REVEAL_SCRIPT)(...Object.values(scope));

  return {
    images,
    docListeners,
    winListeners,
    mutate: () => observer?.(),
    flushFrame: () => frames.splice(0).forEach((fn) => fn()),
    pendingFrames: () => frames.length,
    queries: () => queries,
  };
}

describe("photo reveal head script", () => {
  it("sweeps once per frame however many mutation batches arrive", () => {
    const p = page();
    const done = img(true);
    p.images.push(done);
    p.mutate();
    p.mutate();
    p.mutate();
    expect(p.queries()).toBe(0);
    expect(p.pendingFrames()).toBe(1);
    p.flushFrame();
    expect(p.queries()).toBe(1);
    expect(done.attrs.has("data-loaded")).toBe(true);
  });

  it("schedules a new sweep for mutations after the frame has run", () => {
    const p = page();
    p.mutate();
    p.flushFrame();
    p.mutate();
    expect(p.pendingFrames()).toBe(1);
    p.flushFrame();
    expect(p.queries()).toBe(2);
  });

  it("leaves pictures that are still loading unmarked", () => {
    const p = page();
    const loading = img(false);
    p.images.push(loading);
    p.mutate();
    p.flushFrame();
    expect(loading.attrs.has("data-loaded")).toBe(false);
  });

  it("still marks at once on load, error, DOMContentLoaded and pageshow", () => {
    const p = page();
    const a = img(false);
    const b = img(false);
    p.docListeners.load({ target: a });
    p.docListeners.error({ target: b });
    expect(a.attrs.has("data-loaded")).toBe(true);
    expect(b.attrs.has("data-loaded")).toBe(true);

    const c = img(true);
    p.images.push(c);
    p.docListeners.DOMContentLoaded({ target: null });
    expect(c.attrs.has("data-loaded")).toBe(true);

    const d = img(true);
    p.images.push(d);
    p.winListeners.pageshow();
    expect(d.attrs.has("data-loaded")).toBe(true);
    expect(p.pendingFrames()).toBe(0);
  });

  it("sweeps directly where there is no requestAnimationFrame", () => {
    const p = page({ raf: false });
    const done = img(true);
    p.images.push(done);
    p.mutate();
    expect(done.attrs.has("data-loaded")).toBe(true);
  });
});
