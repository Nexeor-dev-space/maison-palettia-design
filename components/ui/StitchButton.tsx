"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";

import { autoPlays, usePlayOnView } from "@/components/ui/usePlayOnView";
import { cn } from "@/lib/utils";

/*
  ==========================================================================
  THE STITCHED BUTTON — a cream pill hand-sewn round its edge in a running
  stitch of Deep Lilac thread
  ==========================================================================

  The inverse of the primary beside it: cream ground, lilac label, lilac
  thread, at the primary's own size.

  A RUNNING STITCH, SEWN, NOT A DASHED LINE DRAWN. Every stitch is its own
  short length of thread, laid with a slight bow and a sheen, at lengths and
  gaps that wander a little (seeded, so it is the same on every render). The
  gaps are where the thread runs UNDER the fabric.

  THE NEEDLE GOES THROUGH. It travels the edge tip first. At the end of each
  stitch the tip dives into the cream — the part of the needle past the hole
  is hidden, and the needle pivots on the hole as it goes down — and at the
  start of the next stitch it comes back up through a second hole. A short
  shadowed dimple marks each puncture while the needle is in it. The thread
  is laid behind the needle's EYE, never ahead of it, so each stitch appears
  as the needle pulls it through, and a little slack trails from the eye.

  THE PACE IS A HAND'S. It slows as the needle pierces and comes up, moves
  more freely across a stitch, eases in and out, and breathes by a few
  percent — never a constant-speed orbit.

  WHEN IT PLAYS
    desktop .. on hover (or keyboard focus): the stitches are pulled out and
               sewn again. Leaving mid-round lets the round finish.
    touch .... on its own, every time it scrolls into view and has faded in
               (see `usePlayOnView`). No tap needed to discover it.

  When the round is finished the pill lifts a couple of pixels. A click
  presses it like fabric and tightens the thread for a beat before the link
  follows; a modified click is left to the browser. Under reduced motion it
  is a plain link, already sewn.
*/

const INSET = 5.5;
const NEEDLE = 30;
const SPEED = 230; // px of edge per second, before the hand's modulation
const PRESS_MS = 220;

type Seg = readonly [number, number];
type Pt = { x: number; y: number };
type Geo = { d: string; length: number; segs: Seg[]; at: (s: number) => Pt };

/**
 * The same pill as `pillPath`, as a function of distance along it — exact,
 * so nothing has to be measured from the DOM while rendering.
 */
function pillEdge(w: number, h: number) {
  const x0 = INSET;
  const x1 = w - INSET;
  const y0 = INSET;
  const y1 = h - INSET;
  const r = (y1 - y0) / 2;
  const straight = Math.max(0, x1 - x0 - 2 * r);
  const arc = Math.PI * r;
  const length = 2 * straight + 2 * arc;
  const at = (raw: number): Pt => {
    let s = ((raw % length) + length) % length;
    if (s < straight) return { x: x0 + r + s, y: y0 };
    s -= straight;
    if (s < arc) {
      const a = -Math.PI / 2 + s / r;
      return { x: x1 - r + r * Math.cos(a), y: y0 + r + r * Math.sin(a) };
    }
    s -= arc;
    if (s < straight) return { x: x1 - r - s, y: y1 };
    s -= straight;
    const a = Math.PI / 2 + s / r;
    return { x: x0 + r + r * Math.cos(a), y: y0 + r + r * Math.sin(a) };
  };
  return { length, at };
}

/** A pill traced clockwise from the start of its top edge. */
function pillPath(w: number, h: number) {
  const x0 = INSET;
  const y0 = INSET;
  const x1 = w - INSET;
  const y1 = h - INSET;
  const r = (y1 - y0) / 2;
  return `M ${x0 + r} ${y0} L ${x1 - r} ${y0} A ${r} ${r} 0 0 1 ${x1 - r} ${y1} L ${x0 + r} ${y1} A ${r} ${r} 0 0 1 ${x0 + r} ${y0} Z`;
}

/** Small seeded generator: the same "handmade" spacing on every render. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Stitch, gap, stitch … with a hand's variation. */
function stitches(length: number): Seg[] {
  const r = rng(11);
  const out: Seg[] = [];
  let s = 3;
  while (s < length - 6) {
    const len = 8.2 + r() * 3.2;
    const gap = 4.6 + r() * 1.8;
    out.push([s, Math.min(s + len, length - 3)]);
    s += len + gap;
  }
  return out;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function StitchButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const router = useRouter();
  const root = useRef<HTMLAnchorElement>(null);
  const frame = useRef(0);
  const running = useRef(false);
  const hovering = useRef(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  /** How far round the needle's tip is, in px of edge. `Infinity` = fully sewn, no needle. */
  const [tip, setTip] = useState(Infinity);
  const [clock, setClock] = useState(0);
  const [state, setState] = useState<"rest" | "sewing" | "sewn" | "pressed">("rest");

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const d = size.w && size.h ? pillPath(size.w, size.h) : "";
  const geo = useMemo<Geo | null>(() => {
    if (!d) return null;
    const edge = pillEdge(size.w, size.h);
    return { d, length: edge.length, at: edge.at, segs: stitches(edge.length) };
  }, [d, size.w, size.h]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const reduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** One round of sewing, from an unsewn edge. */
  const sew = useCallback(() => {
    if (!geo || reduced()) return;
    cancelAnimationFrame(frame.current);
    running.current = true;
    setState("sewing");
    const { length, segs } = geo;
    const holes = segs.flatMap(([a, b]) => [a, b]);
    const end = length + NEEDLE + 4;
    let s = -NEEDLE * 0.4;
    let last = performance.now();
    const t0 = last;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;
      // Slower as the tip goes through the cloth; freer across a stitch.
      let near = Infinity;
      for (const hole of holes) near = Math.min(near, Math.abs(hole - s));
      const pierce = 0.42 + 0.58 * smooth(0, 5.5, near);
      const breathe = 1 + 0.07 * Math.sin(t * 5.3) + 0.04 * Math.sin(t * 11.7 + 1);
      const easeIn = 0.35 + 0.65 * smooth(0, 0.6, t);
      const easeOut = 0.45 + 0.55 * smooth(end, end - 60, s);
      s += SPEED * pierce * breathe * easeIn * easeOut * dt;
      setTip(s);
      setClock(t);
      if (s < end) frame.current = requestAnimationFrame(tick);
      else {
        running.current = false;
        setTip(Infinity);
        setState(hovering.current ? "sewn" : "rest");
      }
    };
    setTip(s);
    frame.current = requestAnimationFrame(tick);
  }, [geo]);

  /** Back to an empty edge, ready to sew again (touch, between viewings). */
  const unsew = useCallback(() => {
    cancelAnimationFrame(frame.current);
    running.current = false;
    setTip(-NEEDLE);
    setState("rest");
  }, []);

  usePlayOnView(root, sew, unsew);

  // On a touch screen it waits unsewn until it is seen.
  useEffect(() => {
    if (geo && !reduced() && autoPlays() && !running.current) setTip(-NEEDLE);
  }, [geo]);

  const onEnter = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || autoPlays()) return;
    hovering.current = true;
    if (!running.current) sew();
  };
  const onLeave = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || autoPlays()) return;
    hovering.current = false;
    if (!running.current) setState("rest");
  };

  const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || reduced()) return;
    e.preventDefault();
    setState("pressed");
    await new Promise((r) => setTimeout(r, PRESS_MS));
    router.push(href);
  };

  /* ---- what to draw at this instant ---- */
  const at = (x: number) => geo!.at(Math.max(0, Math.min(geo!.length, x)));
  const normal = (x: number) => {
    const a = at(x - 0.5);
    const b = at(x + 0.5);
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    // Outward for a clockwise path in screen space.
    return { x: (b.y - a.y) / len, y: -(b.x - a.x) / len };
  };

  const sewing = Number.isFinite(tip);
  const eye = tip - NEEDLE * 0.86;

  const threads: { d: string; key: number }[] = [];
  const dimples: { x: number; y: number; key: string }[] = [];
  let needleParts: { x1: number; y1: number; x2: number; y2: number }[] = [];
  let tipShown = false;
  let eyePt: { x: number; y: number } | null = null;
  let slack = "";

  if (geo) {
    const { segs } = geo;
    // The thread: every stitch the eye has passed, the current one up to the eye.
    segs.forEach(([a, b], i) => {
      const upTo = sewing ? Math.min(b, eye) : b;
      if (upTo <= a + 0.4) return;
      const A = at(a);
      const B = at(upTo);
      const M = at((a + upTo) / 2);
      const n = normal((a + upTo) / 2);
      const bow = ((i * 37) % 7) / 7 - 0.5; // ±0.5px, fixed per stitch
      threads.push({
        key: i,
        d: `M ${A.x} ${A.y} Q ${M.x + n.x * bow * 1.4} ${M.y + n.y * bow * 1.4} ${B.x} ${B.y}`,
      });
    });

    if (sewing) {
      const tail = tip - NEEDLE;
      // Which parts of the needle are under the cloth: the gaps it has entered.
      const under: Seg[] = [];
      for (let i = 0; i < segs.length; i++) {
        const gapA = segs[i][1];
        const gapB = i + 1 < segs.length ? segs[i + 1][0] : geo.length + 99;
        if (gapA < tip && gapB > tail) under.push([gapA, gapB]);
      }
      // Pivot on the nearest hole it is passing through: the tail rises as the tip dives.
      let pivot = 0;
      for (const [ga, gb] of under) {
        if (ga > tail && ga < tip) pivot = Math.max(pivot, Math.sin(((tip - ga) / NEEDLE) * Math.PI) * 2.4);
        if (gb > tail && gb < tip) pivot = Math.max(pivot, Math.sin(((gb - tail) / NEEDLE) * Math.PI) * 1.6);
      }
      const T0 = at(tail);
      const T1 = at(tip);
      const nT = normal(tail);
      const lift = 1.8 + pivot;
      const base = { x: T0.x + nT.x * lift, y: T0.y + nT.y * lift };
      const lerp = (k: number) => ({ x: base.x + (T1.x - base.x) * k, y: base.y + (T1.y - base.y) * k });
      // Visible = needle minus the gaps it is under.
      let cursor = tail;
      const cuts = [...under].sort((m, n) => m[0] - n[0]);
      const parts: Seg[] = [];
      for (const [ga, gb] of cuts) {
        if (ga > cursor) parts.push([cursor, Math.min(ga, tip)]);
        cursor = Math.max(cursor, gb);
      }
      if (cursor < tip) parts.push([cursor, tip]);
      needleParts = parts
        .filter(([a, b]) => b - a > 0.3)
        .map(([a, b]) => {
          const P1 = lerp((a - tail) / NEEDLE);
          const P2 = lerp((b - tail) / NEEDLE);
          return { x1: P1.x, y1: P1.y, x2: P2.x, y2: P2.y };
        });
      tipShown = parts.some(([, b]) => Math.abs(b - tip) < 0.01);
      const eyeVisible = parts.some(([a, b]) => eye >= a && eye <= b);
      if (eyeVisible) {
        eyePt = lerp(0.14);
        // Slack: a little thread hanging off the eye, swaying.
        const n = normal(eye);
        const sway = Math.sin(clock * 3.1) * 3 + Math.sin(clock * 7.3) * 1.2;
        const E = eyePt;
        const back = at(eye - 16);
        slack = `M ${E.x} ${E.y} C ${E.x + n.x * (9 + sway)} ${E.y + n.y * (9 + sway)}, ${back.x + n.x * (8 - sway)} ${back.y + n.y * (8 - sway)}, ${back.x + n.x * 3} ${back.y + n.y * 3}`;
      }
      for (const [ga, gb] of under) {
        for (const hole of [ga, gb]) {
          if (hole > tail && hole < tip) {
            const H = at(hole);
            dimples.push({ x: H.x, y: H.y, key: `${hole}` });
          }
        }
      }
    }
  }

  const pressed = state === "pressed";

  return (
    <Link
      ref={root}
      href={href}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={() => {
        hovering.current = true;
        if (!running.current) sew();
      }}
      onBlur={() => {
        hovering.current = false;
        if (!running.current) setState("rest");
      }}
      onClick={onClick}
      data-state={state}
      className={cn(
        "relative isolate inline-flex items-center justify-center rounded-[900px] bg-cream",
        "text-action font-medium uppercase tracking-eyebrow text-primary",
        "shadow-[0_6px_18px_-12px_rgb(35_31_32/0.45)]",
        "transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "data-[state=sewn]:-translate-y-[2px] data-[state=sewn]:shadow-[0_14px_28px_-14px_rgb(35_31_32/0.55)]",
        "data-[state=pressed]:translate-y-0 data-[state=pressed]:scale-[0.98] data-[state=pressed]:duration-200",
        "data-[state=pressed]:shadow-[0_3px_8px_-6px_rgb(35_31_32/0.5)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className,
      )}
    >
      {d ? (
        <svg
          aria-hidden
          focusable="false"
          className="pointer-events-none absolute inset-0 overflow-visible"
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
        >
          <defs>
            {/* A breath of unevenness in the thread — under a pixel. */}
            {/* Regions in user space: a bounding-box region collapses to a hairline
                while only one straight edge is sewn, and clips the thread. */}
            <filter id={`${id}-thread`} filterUnits="userSpaceOnUse" x={-12} y={-12} width={size.w + 24} height={size.h + 24}>
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="7" />
              <feDisplacementMap in="SourceGraphic" scale="0.9" />
            </filter>
            <filter id={`${id}-needle`} filterUnits="userSpaceOnUse" x={-24} y={-24} width={size.w + 48} height={size.h + 48}>
              <feDropShadow dx="0.8" dy="1.6" stdDeviation="1" floodColor="#231f20" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* The thread: soft, a touch thick, with a sheen along its twist. */}
          <g
            filter={`url(#${id}-thread)`}
            fill="none"
            strokeLinecap="round"
            style={{ transition: "stroke-width 180ms ease" }}
          >
            {threads.map((t) => (
              <path key={t.key} d={t.d} stroke="currentColor" strokeWidth={pressed ? 3 : 2.5} />
            ))}
            {threads.map((t) => (
              <path key={`s${t.key}`} d={t.d} stroke="rgb(255 255 255 / 0.28)" strokeWidth="0.7" />
            ))}
          </g>

          {/* Puncture dimples where the needle is in the cloth. */}
          {dimples.map((h) => (
            <ellipse key={h.key} cx={h.x} cy={h.y} rx="1.6" ry="1.1" fill="rgb(35 31 32 / 0.28)" />
          ))}

          {slack ? (
            <path d={slack} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.85" />
          ) : null}

          {needleParts.length ? (
            <g filter={`url(#${id}-needle)`} strokeLinecap="round">
              {needleParts.map((n, i) => (
                <line key={i} x1={n.x1} y1={n.y1} x2={n.x2} y2={n.y2} stroke="#5f6570" strokeWidth="2.5" />
              ))}
              {needleParts.map((n, i) => (
                <line key={`h${i}`} x1={n.x1} y1={n.y1} x2={n.x2} y2={n.y2} stroke="rgb(255 255 255 / 0.55)" strokeWidth="0.7" />
              ))}
              {tipShown ? (
                <circle
                  cx={needleParts[needleParts.length - 1].x2}
                  cy={needleParts[needleParts.length - 1].y2}
                  r="1"
                  fill="#5f6570"
                />
              ) : null}
              {eyePt ? <circle cx={eyePt.x} cy={eyePt.y} r="0.9" fill="#f4efe4" /> : null}
            </g>
          ) : null}
        </svg>
      ) : null}
      <span className="relative">{children}</span>
    </Link>
  );
}
