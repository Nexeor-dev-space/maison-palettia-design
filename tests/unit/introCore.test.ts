import vm from "node:vm";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { DOODLE_PLAN, RING_ORDER, portraitStretch } from "../../components/sections/hero/composition";
import {
  INTRO_TIMING,
  introConfig,
  introScript,
  type IntroController,
  type IntroLogoCuts,
} from "../../components/sections/hero/introCore";
import { INTRO_SCRIPT } from "../../components/sections/hero/intro";

/**
 * The homepage intro's head script (components/sections/hero/introCore.ts).
 *
 * `introRuntime` is stringified into <head>, so the one thing that can break
 * it without breaking the site's types is a reference that escapes the
 * function — a module constant, an import, a helper a build step added. These
 * check the generated script three ways: it parses on its own, every free
 * name in it is a browser global, and it runs the whole sequence against a
 * stub page with nothing else in scope.
 */

const LOGO: IntroLogoCuts = {
  ink: { left: 0.02, top: 0.04, width: 0.96, height: 0.92 },
  onLight: { width: 1015, ink: { left: 0.03, top: 0.05, width: 0.94, height: 0.9 } },
};

const SCRIPT = introScript(introConfig(LOGO));

/* ---------------------------------------------------------------- static */

/** Names the runtime may use without declaring them: the browser's and the language's. */
const GLOBALS = new Set([
  "window",
  "document",
  "location",
  "history",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "getComputedStyle",
  "MutationObserver",
  "ResizeObserver",
  "Event",
  "Math",
  "JSON",
  "String",
  "Object",
  "Array",
  "parseFloat",
  "Infinity",
  "NaN",
  "undefined",
]);

/**
 * Every identifier in the script that is neither declared in it, a property
 * (`.name`), nor an object key (`{ name:` / `, name:`). Scope-blind on
 * purpose: a name declared anywhere counts as declared, which can only hide
 * an escape, never invent one.
 */
function freeNames(source: string): string[] {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, source);
  const tokens: { kind: ts.SyntaxKind; text: string }[] = [];
  for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan()) {
    tokens.push({ kind, text: scanner.getTokenText() });
  }
  const declared = new Set<string>();
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.kind === ts.SyntaxKind.VarKeyword || t.kind === ts.SyntaxKind.LetKeyword || t.kind === ts.SyntaxKind.ConstKeyword) {
      if (tokens[i + 1]?.kind === ts.SyntaxKind.Identifier) declared.add(tokens[i + 1].text);
    }
    if (t.kind === ts.SyntaxKind.FunctionKeyword || t.kind === ts.SyntaxKind.CatchKeyword) {
      let j = i + 1;
      if (tokens[j]?.kind === ts.SyntaxKind.Identifier) declared.add(tokens[j++].text);
      if (tokens[j]?.kind === ts.SyntaxKind.OpenParenToken) {
        for (j++; j < tokens.length && tokens[j].kind !== ts.SyntaxKind.CloseParenToken; j++) {
          if (tokens[j].kind === ts.SyntaxKind.Identifier) declared.add(tokens[j].text);
        }
      }
    }
  }
  const free = new Set<string>();
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.kind !== ts.SyntaxKind.Identifier) continue;
    const prev = tokens[i - 1]?.kind;
    const next = tokens[i + 1]?.kind;
    if (prev === ts.SyntaxKind.DotToken) continue;
    if (next === ts.SyntaxKind.ColonToken && (prev === ts.SyntaxKind.OpenBraceToken || prev === ts.SyntaxKind.CommaToken)) continue;
    if (declared.has(t.text) || GLOBALS.has(t.text)) continue;
    free.add(t.text);
  }
  return [...free];
}

describe("introScript — the generated head script", () => {
  it("parses as a standalone script", () => {
    expect(() => new Function(SCRIPT)).not.toThrow();
  });

  it("names nothing outside itself but browser globals", () => {
    expect(freeNames(SCRIPT)).toEqual([]);
  });

  it("cannot be closed early by its data", () => {
    expect(SCRIPT).not.toMatch(/<\/script/i);
    expect(SCRIPT).not.toMatch(/<!--/);
  });

  it("carries the ring in RING_ORDER and every shape's id", () => {
    const cfg = introConfig(LOGO);
    expect(cfg.ring.map((entry) => entry.id)).toEqual([...RING_ORDER]);
    expect(cfg.ids).toEqual(DOODLE_PLAN.map((plan) => plan.id));
    expect(cfg.timing).toEqual(INTRO_TIMING);
  });
});

/* ------------------------------------------------------------- stub page */

class Style {
  private props = new Map<string, string>();
  cssText = "";
  overflow = "";
  setProperty(name: string, value: string) {
    this.props.set(name, value);
  }
  removeProperty(name: string) {
    if (name === "overflow") this.overflow = "";
    this.props.delete(name);
  }
  getPropertyValue(name: string) {
    return this.props.get(name) ?? "";
  }
  has(name: string) {
    return this.props.has(name);
  }
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

class El {
  attrs = new Map<string, string>();
  style = new Style();
  children: El[] = [];
  parentNode: El | null = null;
  nextSibling: El | null = null;
  offsetWidth = 0;
  offsetHeight = 0;
  offsetTop = 0;
  box: Box = { left: 0, top: 0, width: 0, height: 0 };
  listeners = new Map<string, Set<() => void>>();
  constructor(
    public tag: string,
    attrs: Record<string, string> = {},
  ) {
    for (const [k, v] of Object.entries(attrs)) this.attrs.set(k, v);
  }
  getAttribute(name: string) {
    return this.attrs.has(name) ? (this.attrs.get(name) as string) : null;
  }
  setAttribute(name: string, value: string) {
    this.attrs.set(name, String(value));
  }
  removeAttribute(name: string) {
    this.attrs.delete(name);
  }
  hasAttribute(name: string) {
    return this.attrs.has(name);
  }
  add(...kids: El[]) {
    for (const kid of kids) {
      const before = this.children[this.children.length - 1];
      if (before) before.nextSibling = kid;
      kid.parentNode = this;
      this.children.push(kid);
    }
    return this;
  }
  appendChild(kid: El) {
    kid.parentNode = this;
    return kid;
  }
  remove() {}
  closest() {
    return null;
  }
  getBoundingClientRect() {
    return { ...this.box, right: this.box.left + this.box.width, bottom: this.box.top + this.box.height };
  }
  private all(): El[] {
    return this.children.flatMap((kid) => [kid, ...kid.all()]);
  }
  /** `[attr]` or a tag name — all the runtime asks of the hero. */
  querySelectorAll(selector: string): El[] {
    const attr = /^\[([\w-]+)\]$/.exec(selector);
    return this.all().filter((el) => (attr ? el.attrs.has(attr[1]) : el.tag === selector));
  }
  querySelector(selector: string): El | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }
  addEventListener(type: string, fn: () => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)?.add(fn);
  }
  removeEventListener(type: string, fn: () => void) {
    this.listeners.get(type)?.delete(fn);
  }
  dispatchEvent(event: { type: string }) {
    for (const fn of this.listeners.get(event.type) ?? []) fn();
    return true;
  }
}

interface Page {
  run: (script?: string) => void;
  html: El;
  hero: El;
  logo: El;
  doodles: Map<string, El>;
  history: { scrollRestoration: string };
  frames: () => void;
  advance: (ms: number) => void;
  controller: () => IntroController | null | undefined;
  win: Record<string, unknown>;
  dispatch: (type: string, event?: unknown) => void;
}

/**
 * A page with a homepage banner, already parsed, and a clock that only moves
 * when the test moves it. Every global the script can reach is listed here
 * and nothing else is: the script runs in its own context.
 */
function page({
  path = "/",
  reduced = false,
  vw = 1440,
  vh = 900,
  throwOnMedia = false,
}: { path?: string; reduced?: boolean; vw?: number; vh?: number; throwOnMedia?: boolean } = {}): Page {
  const html = new El("html");
  const body = new El("body");
  const header = new El("header");
  const headerImg = new El("img", { width: "1015" });
  headerImg.box = { left: 40, top: 20, width: 140, height: 60 };

  const hero = new El("section", { "data-hero-intro": "" });
  const logo = new El("div", { "data-intro-logo": "" });
  logo.offsetWidth = 400;
  logo.box = { left: vw / 2 - 200, top: vh / 2 - 86, width: 400, height: 172 };
  const frame = new El("div", { "data-hero-frame": "" });
  frame.offsetHeight = vh;
  const copy = new El("div", { "data-hero-copy": "" });
  copy.offsetTop = 500;
  copy.offsetHeight = 240;
  const actions = new El("div", { "data-hero-actions": "" });
  actions.offsetTop = 180;
  actions.offsetHeight = 60;
  copy.add(actions);
  const cue = new El("div", { "data-hero-cue": "" });
  cue.offsetHeight = 40;
  const doodles = new Map<string, El>();
  DOODLE_PLAN.forEach((plan, i) => {
    const el = new El("div", { "data-doodle": plan.id });
    // Square boxes, laid out along the foot, so every ring icon's aspect is 1.
    el.box = { left: 60 + i * 70, top: vh - 120, width: 48, height: 48 };
    doodles.set(plan.id, el);
  });
  frame.add(...doodles.values(), copy, cue);
  hero.add(logo, frame);
  const main = new El("main").add(hero);
  body.add(header.add(new El("a", { "aria-label": "Maison Palettia home" }).add(headerImg)), main, new El("div"));
  html.add(body);

  let now = 0;
  let nextId = 1;
  const timers = new Map<number, { at: number; fn: () => void }>();
  let rafs = new Map<number, () => void>();
  const winListeners = new Map<string, Set<(event?: unknown) => void>>();
  const history = { scrollRestoration: "auto" };

  const document = {
    documentElement: html,
    body,
    readyState: "complete",
    fonts: { status: "loaded", ready: Promise.resolve() },
    createElement: (tag: string) => new El(tag),
    querySelector: (selector: string) => {
      if (selector.startsWith("body > header")) return headerImg;
      return html.querySelector(selector);
    },
    addEventListener() {},
    removeEventListener() {},
  };

  const win: Record<string, unknown> = {
    document,
    location: { pathname: path },
    history,
    innerWidth: vw,
    innerHeight: vh,
    scrollY: 0,
    scrollTo() {},
    matchMedia: (query: string) => {
      if (throwOnMedia) throw new Error("no media queries");
      return { matches: reduced && query.includes("reduce") };
    },
    getComputedStyle: () => ({
      fontSize: "16px",
      lineHeight: "30px",
      bottom: "12px",
      getPropertyValue: () => "2.25rem",
    }),
    requestAnimationFrame: (fn: () => void) => {
      const id = nextId++;
      rafs.set(id, fn);
      return id;
    },
    cancelAnimationFrame: (id: number) => rafs.delete(id),
    setTimeout: (fn: () => void, ms: number) => {
      const id = nextId++;
      timers.set(id, { at: now + (ms || 0), fn });
      return id;
    },
    clearTimeout: (id: number) => timers.delete(id),
    addEventListener: (type: string, fn: (event?: unknown) => void) => {
      if (!winListeners.has(type)) winListeners.set(type, new Set());
      winListeners.get(type)?.add(fn);
    },
    removeEventListener: (type: string, fn: (event?: unknown) => void) => winListeners.get(type)?.delete(fn),
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    ResizeObserver: class {
      observe() {}
      disconnect() {}
    },
    Event: class {
      constructor(public type: string) {}
    },
  };
  win.window = win;
  const context = vm.createContext(win);

  return {
    run: (script = SCRIPT) => vm.runInContext(script, context),
    html,
    hero,
    logo,
    doodles,
    history,
    win,
    controller: () => win.__mpIntro as IntroController | null | undefined,
    /** One rendering opportunity: every frame callback queued before it. */
    frames: () => {
      const due = rafs;
      rafs = new Map();
      for (const fn of due.values()) fn();
    },
    advance: (ms: number) => {
      const end = now + ms;
      for (;;) {
        const next = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        timers.delete(next[0]);
        now = next[1].at;
        next[1].fn();
      }
      now = end;
    },
    dispatch: (type: string, event?: unknown) => {
      for (const fn of winListeners.get(type) ?? []) fn(event);
    },
  };
}

/* ------------------------------------------------------------- the head */

/*
  The decision is made twice on a homepage load: by INTRO_SCRIPT in <head>,
  and again by the runtime when the inline script after the hero runs it. The
  two must agree on every branch, so both run the same cases.
*/
describe.each([
  ["INTRO_SCRIPT, in <head>", INTRO_SCRIPT],
  ["introScript, after the hero", SCRIPT],
])("the head's decision — %s", (_, script) => {
  it("marks the loader on any other page, and nothing else", () => {
    const p = page({ path: "/about" });
    p.run(script);
    expect(p.html.getAttribute("data-loader")).toBe("write");
    expect(p.html.getAttribute("data-intro")).toBeNull();
    expect(p.controller()).toBeUndefined();
  });

  it("leaves other pages alone under reduced motion", () => {
    const p = page({ path: "/about", reduced: true });
    p.run(script);
    expect(p.html.getAttribute("data-loader")).toBeNull();
  });

  it("composes the homepage at once under reduced motion", () => {
    const p = page({ reduced: true });
    p.run(script);
    expect(p.html.getAttribute("data-intro")).toBe("done");
    expect(p.history.scrollRestoration).toBe("auto");
    expect(p.controller()).toBeUndefined();
  });

  it("plays on the homepage, with restoration off", () => {
    const p = page();
    p.run(script);
    expect(p.html.getAttribute("data-intro")).toBe("play");
    expect(p.history.scrollRestoration).toBe("manual");
  });

  it("skips when anything throws", () => {
    const p = page({ throwOnMedia: true });
    p.run(script);
    expect(p.html.getAttribute("data-intro")).toBe("skip");
  });
});

/* --------------------------------------------------------- the sequence */

describe("introScript — the sequence from first paint", () => {
  it("starts once the head has already decided, as on a real load", () => {
    const p = page();
    p.run(INTRO_SCRIPT);
    expect(p.html.getAttribute("data-intro")).toBe("play");
    expect(p.controller()).toBeUndefined();
    p.run();
    expect(p.html.getAttribute("data-intro")).toBe("play");
    expect(p.controller()?.hero).toBe(p.hero);
  });

  it("runs play → dots → burst → settle → done on the designed clock", () => {
    const p = page();
    p.run();
    const c = p.controller();
    expect(c?.hero).toBe(p.hero);

    // First frame: fitted, held, measured, promoted.
    p.frames();
    const frame = p.hero.querySelector("[data-hero-frame]") as El;
    expect(frame.style.getPropertyValue("--wb")).toMatch(/^\d+px$/);
    expect(p.html.style.overflow).toBe("hidden");
    expect(frame.hasAttribute("data-live")).toBe(true);
    for (const id of RING_ORDER) {
      const el = p.doodles.get(id) as El;
      expect(el.hasAttribute("data-ring")).toBe(true);
      expect(el.style.getPropertyValue("--fx")).toMatch(/px$/);
      expect(el.style.getPropertyValue("--burst-delay")).toBe(`${RING_ORDER.indexOf(id) * INTRO_TIMING.BURST_STEP}ms`);
    }
    const tucked = DOODLE_PLAN.find((plan) => !plan.ring);
    expect(p.doodles.get(tucked?.id ?? "")?.style.getPropertyValue("--settle-delay")).toBe(`${INTRO_TIMING.TUCKED_AT}ms`);

    // Second frame: the clock starts.
    p.frames();
    p.advance(INTRO_TIMING.DOTS_AT - 1);
    expect(p.html.getAttribute("data-intro")).toBe("play");
    p.advance(1);
    expect(p.html.getAttribute("data-intro")).toBe("dots");
    p.advance(INTRO_TIMING.BURST_AT - INTRO_TIMING.DOTS_AT);
    expect(p.html.getAttribute("data-intro")).toBe("burst");
    p.advance(INTRO_TIMING.LIFT_AT - INTRO_TIMING.BURST_AT);
    expect(p.html.getAttribute("data-intro")).toBe("settle");
    expect(p.logo.style.getPropertyValue("--logo-s")).not.toBe("");

    // Not released before React has adopted it…
    expect(p.html.style.overflow).toBe("hidden");
    p.advance(INTRO_TIMING.SETTLE_MS);
    expect(p.html.getAttribute("data-intro")).toBe("done");
    expect(p.html.style.overflow).toBe("hidden");

    // …and released the moment it does, through Lenis's resume.
    let resumed = 0;
    if (c) c.onUnlock = () => resumed++;
    c?.adopt();
    expect(p.html.style.overflow).toBe("");
    expect(resumed).toBe(1);
    expect(c?.cancelled).toBe(false);
  });

  it("lets go of the scroll by itself if React never arrives", () => {
    const p = page();
    p.run();
    p.frames();
    p.frames();
    p.advance(INTRO_TIMING.LIFT_AT);
    expect(p.html.style.overflow).toBe("hidden");
    p.advance(8000);
    expect(p.html.style.overflow).toBe("");
  });

  it("lifts early on a key", () => {
    const p = page();
    p.run();
    p.frames();
    p.frames();
    p.advance(100);
    p.dispatch("keydown", { key: "Shift" });
    expect(p.html.getAttribute("data-intro")).toBe("play");
    p.dispatch("keydown", { key: "Enter" });
    expect(p.html.getAttribute("data-intro")).toBe("settle");
  });

  it("leaves nothing of the flight behind when cancelled", () => {
    const p = page();
    p.run();
    p.frames();
    p.frames();
    p.advance(INTRO_TIMING.BURST_AT);
    p.controller()?.cancel();
    expect(p.html.style.overflow).toBe("");
    expect(p.controller()).toBeNull();
    for (const el of p.doodles.values()) {
      expect(el.hasAttribute("data-ring")).toBe(false);
      expect(el.style.has("--fx")).toBe(false);
    }
    // Never forces `done`, and nothing fires afterwards.
    expect(p.html.getAttribute("data-intro")).toBe("burst");
    p.advance(5000);
    expect(p.html.getAttribute("data-intro")).toBe("burst");
  });

  it("stretches the ring on a phone exactly as portraitStretch() does", () => {
    const vw = 390;
    const vh = 844;
    const p = page({ vw, vh });
    p.run();
    p.frames();
    const unit = 400;
    const ringPlans = RING_ORDER.map((id) => DOODLE_PLAN.find((plan) => plan.id === id)).filter(
      (plan): plan is (typeof DOODLE_PLAN)[number] => !!plan,
    );
    // Recovered from what was written: the across and up-and-down reach.
    const reach = (axis: "x" | "y") =>
      ringPlans
        .filter((plan) => plan.flower[axis] !== 0)
        .map((plan) => {
          const el = p.doodles.get(plan.id) as El;
          const b = el.getBoundingClientRect();
          const centre = axis === "x" ? b.left + b.width / 2 : b.top + b.height / 2;
          const offset = parseFloat(el.style.getPropertyValue(axis === "x" ? "--fx" : "--fy"));
          return (centre + offset - (axis === "x" ? vw : vh) / 2) / (plan.flower[axis] * unit);
        });
    const ring = reach("x")[0];
    const ringY = reach("y")[0];
    for (const r of reach("x")) expect(r).toBeCloseTo(ring, 9);
    for (const r of reach("y")) expect(r).toBeCloseTo(ringY, 9);
    // fitY for square boxes: the half-height a turned square sweeps out.
    const fitY = Math.min(
      ...ringPlans
        .filter((plan) => plan.flower.y !== 0)
        .map((plan) => {
          const w = plan.flower.width * unit;
          const turn = (plan.flower.rotate * Math.PI) / 180;
          const halfH = (w * Math.abs(Math.sin(turn)) + w * Math.abs(Math.cos(turn))) / 2;
          return (vh / 2 - halfH - 8) / (Math.abs(plan.flower.y) * unit);
        }),
    );
    expect(ringY).toBeCloseTo(portraitStretch(ring, fitY, vw, vh), 9);
  });
});
