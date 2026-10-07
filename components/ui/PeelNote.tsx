"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { autoPlays, usePlayOnView } from "@/components/ui/usePlayOnView";
import { cn } from "@/lib/utils";

/*
  ==========================================================================
  THE STICKY NOTE — a translucent slip of handmade paper over the label,
  peeled from the end nearest the hand, in one motion, until every word shows
  ==========================================================================

  The label is printed on the page, on a patch whiter than the paper. The
  note sits over it: warm paper, translucent enough that the words show
  through, a grain of texture, a turn of two degrees and a soft contact
  shadow. A corner is already lifted a little — the cue that it peels.

  ONE FLAP, ONE MOTION. A single `progress` from 0 to 1 drives a fold line
  and the flap beyond it. Nothing hands over to anything else:

    · The fold starts across the CORNER nearest the pointer, diagonal, and
      the cut-off piece lies folded back over the note, underside up — the
      original corner peel.
    · As the peel continues the fold line swings from diagonal to upright
      and travels toward the far end, and the flap TURNS UP: its fold angle
      runs from flat-over (180°) through standing (90°) to leaning a few
      degrees outward. Drawn top-down, that is one affine map — the flap
      scaled about the fold line by cos θ — so a reflection (cos = -1) flows
      continuously into a standing sliver, and the underside shade hands
      over to the paper's face as it passes upright.
    · At full peel the fold sits in the far end's padding, the flap stands
      there hinged to the note with its shadow cast across the page, and
      every word is uncovered. It never comes off.

  The flap leans a little toward the pointer and breathes very slightly
  while held. Leaving lays it back down by the same path.

  WHEN IT PLAYS
    desktop .. on hover (or keyboard focus), from whichever end the pointer
               arrived nearest; slowly.
    phone/tablet  on its own — any touch screen, and any screen under 1024px
               whatever its input — every time it scrolls into view and has faded in,
               from the right end: the same single motion, a hair past full,
               settling just short. The label stays readable and the whole
               note tappable. See `usePlayOnView`.

  Under reduced motion it rests peeled, so the label never depends on
  movement.
*/

const REST_FOLD = 9;
const LIFT_RATE = 0.03;
const SETTLE_RATE = 0.055;
/** Where the fold comes to rest, measured in from the far end, in px. */
const HINGE = 9;
/** cos of the flap's angle at full peel: standing, leaning slightly out. */
const STAND = 0.045;

function pillPath(w: number, h: number) {
  const r = h / 2;
  return `M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w - r} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 ${r} 0 Z`;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function PeelNote({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const root = useRef<HTMLAnchorElement>(null);
  const frame = useRef(0);
  const target = useRef(0);
  const settleTo = useRef<number | null>(null);
  const lean = useRef(0);
  const live = useRef({ progress: 0, lean: 0 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState({ progress: 0, lean: 0, t: 0 });
  /** Which end peels: 1 = right, -1 = left. */
  const [side, setSide] = useState<1 | -1>(1);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Reduced motion: rest peeled, so the label never depends on movement.
    let still = 0;
    if (prefersReduced()) {
      live.current.progress = 0.94;
      still = requestAnimationFrame(() => setView({ progress: 0.94, lean: 0, t: 0 }));
    }
    return () => {
      ro.disconnect();
      cancelAnimationFrame(still);
    };
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  /** Eases progress toward its target — slow to lift, a touch quicker to lay back. */
  const run = useCallback(() => {
    cancelAnimationFrame(frame.current);
    const t0 = performance.now();
    const tick = (now: number) => {
      const s = live.current;
      const goingUp = target.current > s.progress;
      s.progress += (target.current - s.progress) * (goingUp ? LIFT_RATE : SETTLE_RATE);
      s.lean += (lean.current - s.lean) * 0.06;
      // Touch: once it has overshot, let it settle back a little.
      if (settleTo.current !== null && Math.abs(target.current - s.progress) < 0.01) {
        target.current = settleTo.current;
        settleTo.current = null;
      }
      setView({ progress: s.progress, lean: s.lean, t: (now - t0) / 1000 });
      const busy = Math.abs(target.current - s.progress) > 0.001 || settleTo.current !== null;
      // Keep breathing while held peeled.
      if (busy || target.current > 0.5) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, []);

  const peelTo = useCallback(
    (to: number, then: number | null = null) => {
      if (prefersReduced()) return;
      target.current = to;
      settleTo.current = then;
      run();
    },
    [run],
  );

  // Touch screens: peel on sight, every time it comes into view.
  usePlayOnView(
    root,
    () => {
      setSide(1);
      peelTo(1.03, 0.97);
    },
    () => {
      cancelAnimationFrame(frame.current);
      target.current = 0;
      live.current = { progress: 0, lean: 0 };
      setView({ progress: 0, lean: 0, t: 0 });
    },
  );

  const onEnter = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || autoPlays()) return;
    // Pick the end only from rest, so a re-entry mid-peel never flips sides.
    if (live.current.progress < 0.05) {
      const box = e.currentTarget.getBoundingClientRect();
      setSide(e.clientX - box.left < box.width / 2 ? -1 : 1);
    }
    peelTo(1);
  };
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || autoPlays() || prefersReduced()) return;
    const box = e.currentTarget.getBoundingClientRect();
    lean.current = ((e.clientY - box.top) / box.height - 0.5) * 0.07;
  };
  const onLeave = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || autoPlays()) return;
    lean.current = 0;
    peelTo(0);
  };

  const { w, h } = size;
  const ready = w > 0 && h > 0;
  const prog = Math.min(1.05, Math.max(0, view.progress));

  /* ---- the fold ---- */
  const travelShare = smooth(0, 1, prog);
  // Diagonal at the corner, swinging to upright as it travels.
  const upright = smooth(0.08, 0.75, prog);
  const sway = prog > 0.6 ? Math.sin(view.t * 1.5) * 0.006 : 0;
  const angle = (1 - upright) * 0.82 + upright * 0.02 + view.lean + sway; // radians below horizontal
  // `u` points from the peeling end into the note.
  const u = { x: -side * Math.cos(angle), y: Math.sin(angle) };
  const C = { x: side === 1 ? w : 0, y: 0 };
  const travel = REST_FOLD + (w - HINGE - REST_FOLD) * travelShare;
  // The box corner is off the paper (the pill's end is round): start the
  // fold where the diagonal meets the edge, and let that fall away as it rights.
  const fold = travel + 0.42 * (h / 2) * (1 - upright);
  const P = { x: C.x + u.x * fold, y: C.y + u.y * fold };
  const v = { x: -u.y, y: u.x };
  const far = 4 * Math.max(w, h, 1);
  const poly = (sign: 1 | -1) =>
    [
      [P.x + v.x * far, P.y + v.y * far],
      [P.x - v.x * far, P.y - v.y * far],
      [P.x - v.x * far + sign * u.x * far, P.y - v.y * far + sign * u.y * far],
      [P.x + v.x * far + sign * u.x * far, P.y + v.y * far + sign * u.y * far],
    ]
      .map((pt) => pt.join(","))
      .join(" ");

  /* ---- the flap: flat-over (cos -1) → standing, leaning out (cos STAND) ---- */
  const cos = -1 + (1 + STAND) * smooth(0.1, 0.92, prog);
  const lift = Math.sqrt(Math.max(0, 1 - cos * cos)); // how far off the page
  const o = { x: -u.x, y: -u.y }; // outward, toward the peeling end
  const po = P.x * o.x + P.y * o.y;
  const q = cos - 1;
  const m = [1 + q * o.x * o.x, q * o.x * o.y, q * o.x * o.y, 1 + q * o.y * o.y, -q * po * o.x, -q * po * o.y];
  const underside = 1 - smooth(-0.2, 0.05, cos); // which face is toward us

  const d = ready ? pillPath(w, h) : "";

  return (
    <Link
      ref={root}
      href={href}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onFocus={() => !autoPlays() && peelTo(1)}
      onBlur={() => !autoPlays() && peelTo(0)}
      className={cn(
        "relative isolate inline-flex rotate-[-2deg] items-center justify-center rounded-[900px]",
        "text-action font-medium uppercase tracking-eyebrow text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className,
      )}
    >
      {/* The patch of page the note was pressed onto — whiter and cleaner than
          the paper, so where the note has rolled away reads as uncovered —
          and the label printed on it. */}
      <span aria-hidden className="absolute inset-0 rounded-[900px] bg-[rgb(251_248_242/0.92)]" />
      <span className="relative">{children}</span>

      {ready ? (
        <svg
          aria-hidden
          focusable="false"
          className="pointer-events-none absolute inset-0 overflow-visible"
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
        >
          <defs>
            <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="3" result="n" />
              <feColorMatrix in="n" type="saturate" values="0" result="g" />
              <feComponentTransfer in="g" result="a">
                <feFuncA type="linear" slope="0" intercept="0.07" />
              </feComponentTransfer>
              <feComposite in="a" in2="SourceGraphic" operator="in" result="grain" />
              <feMerge>
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="grain" />
              </feMerge>
            </filter>
            <filter id={`${id}-contact`} x="-10%" y="-40%" width="120%" height="180%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#231f20" floodOpacity="0.22" />
            </filter>
            {/* The flap's shadow: tight while it lies flat, long and soft across
                the page as it stands. */}
            <filter id={`${id}-flap`} filterUnits="userSpaceOnUse" x={-far} y={-far} width={far * 2} height={far * 2}>
              <feDropShadow
                dx={o.x * (1.5 + 9 * lift)}
                dy={1.5 + 4 * lift}
                stdDeviation={1.2 + 3.2 * lift}
                floodColor="#231f20"
                floodOpacity={0.2 + 0.14 * lift}
              />
            </filter>
            <clipPath id={`${id}-kept`} clipPathUnits="userSpaceOnUse">
              <polygon points={poly(1)} />
            </clipPath>
            <clipPath id={`${id}-cut`} clipPathUnits="userSpaceOnUse">
              <polygon points={poly(-1)} />
            </clipPath>
            <linearGradient id={`${id}-under`} gradientUnits="userSpaceOnUse" x1={P.x} y1={P.y} x2={C.x} y2={C.y}>
              <stop offset="0" stopColor="#f7efdf" />
              <stop offset="0.55" stopColor="#efe2ca" />
              <stop offset="1" stopColor="#dccbab" />
            </linearGradient>
            {/* The paper's face, darker toward the crease as it stands. */}
            <linearGradient id={`${id}-face`} gradientUnits="userSpaceOnUse" x1={P.x} y1={P.y} x2={C.x} y2={C.y}>
              <stop offset="0" stopColor="#d9c39a" />
              <stop offset="0.5" stopColor="#ecdab6" />
              <stop offset="1" stopColor="#f3e6cb" />
            </linearGradient>
          </defs>

          {/* The note still stuck down: everything behind the fold. */}
          <g filter={`url(#${id}-contact)`}>
            <path
              d={d}
              clipPath={`url(#${id}-kept)`}
              fill="rgb(236 218 182 / 0.46)"
              stroke="rgb(35 31 32 / 0.1)"
              filter={`url(#${id}-grain)`}
            />
          </g>

          {/* The flap: the peeled part, turned about the fold. */}
          <g filter={`url(#${id}-flap)`}>
            <g transform={`matrix(${m.join(" ")})`}>
              <path d={d} clipPath={`url(#${id}-cut)`} fill={`url(#${id}-face)`} />
              <path d={d} clipPath={`url(#${id}-cut)`} fill={`url(#${id}-under)`} opacity={underside} />
            </g>
          </g>
        </svg>
      ) : null}
    </Link>
  );
}
