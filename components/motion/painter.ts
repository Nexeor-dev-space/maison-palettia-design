import {
  DROP,
  PAINT_FALLBACK,
  PAINT_TOKENS,
  colourAt,
  css,
  remaining,
  visibleOn,
  type LastDrop,
  type RGB,
} from "@/lib/brushPaint";

/**
 * ==========================================================================
 * The drop of paint a click leaves
 * ==========================================================================
 *
 * <CursorLayer> owns the brush; this owns the one canvas under it. A click
 * lands three drops of one brand colour where the bristles touched — the
 * brush's hotspot, which is the pointer — and they dry away a moment later.
 * Which colour is set by where they land; see lib/brushPaint.ts. The colour is
 * handed back so the brush can carry it on its bristles while it is wet.
 *
 * THREE DROPS, ONE COLOUR, NO OUTLINE, NO TRAIL. The first version drew a wet
 * line behind every movement and threw a ring of outlined drops of every
 * colour out of each click; the second left one lone dot. What the client
 * settled on is a touch of paint: a main drop on the tip and two small ones
 * beside it, all the colour the brush is carrying.
 *
 * PAINT IS ON THE PAGE, NOT THE GLASS. The canvas is fixed to the viewport,
 * but a scroll moves every drop by the same amount, so a drop on a button
 * travels with the button.
 *
 * COST. Nothing runs while there is nothing wet: the frame loop stops when the
 * last drop has dried and is woken by the next click.
 */

type Drop = {
  x: number;
  y: number;
  born: number;
  /** How long after the touch it lands — the two small ones follow the main drop. */
  delay: number;
  r: number;
  angle: number;
  /** The radius at each lobe, as a fraction of `r` — a dab, not a circle. */
  lobes: number[];
  fill: string;
};

export type Painter = {
  /** A click, at the bristle tip. Returns the colour laid, as CSS. */
  drop(x: number, y: number): string;
  /** The page has moved under the paint. */
  scroll(): void;
  /** What the bristles are standing on now, as any CSS colour. */
  ground(value: string): void;
  destroy(): void;
};

/** A hand that clicks fast cannot pile up more than this many touches' worth at once. */
const MAX_DROPS = 36;

/**
 * Read any CSS colour as real channels, or null if it cannot be painted.
 *
 * A canvas cannot take `var()`, and the tokens and the measured ground may be
 * written in any syntax the browser likes, so the value is painted into one
 * pixel and read back — the same trick <CursorLayer> uses to measure the
 * ground. A transparent sentinel first, so a value the canvas rejects is
 * caught rather than read as whatever was set before it.
 */
function colourReader(): (value: string) => RGB | null {
  const pixel = document.createElement("canvas");
  pixel.width = 1;
  pixel.height = 1;
  const px = pixel.getContext("2d", { willReadFrequently: true });
  return (value) => {
    if (!value || !px) return null;
    px.clearRect(0, 0, 1, 1);
    px.fillStyle = "rgba(0, 0, 0, 0)";
    px.fillStyle = value;
    px.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = px.getImageData(0, 0, 1, 1).data;
    return a === 0 ? null : [r, g, b];
  };
}

/** A small overshoot, so a drop lands with a little give rather than a pop. */
const easeOutBack = (t: number) => {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

const between = (min: number, max: number) => min + Math.random() * (max - min);

export function createPainter(canvas: HTMLCanvasElement): Painter | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const read = colourReader();
  const style = getComputedStyle(document.documentElement);
  const palette = PAINT_TOKENS.map(
    (token, i) => read(style.getPropertyValue(token).trim()) ?? PAINT_FALLBACK[i],
  );
  /** The ground under the bristles, as <CursorLayer> last measured it. */
  let under: RGB | null = null;
  /** The drop before this one, so the next one never repeats its colour. */
  let last: (LastDrop & { count: number }) | null = null;

  let drops: Drop[] = [];
  let frame = 0;
  let width = 0;
  let height = 0;
  let scrollX = window.scrollX;
  let scrollY = window.scrollY;

  /*
    THE CANVAS IS MEASURED, NOT ASSUMED TO BE innerWidth. `innerWidth`
    includes a classic scrollbar and the fixed box does not, so sizing the
    backing store to it would stretch every drop sideways by the scrollbar's
    width. The box's own size is the space `clientX` is measured in.
  */
  const fit = () => {
    const box = canvas.getBoundingClientRect();
    width = box.width;
    height = box.height;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wake();
  };

  /*
    A DROP IS A RING OF LOBES joined through their midpoints, so its edge is
    soft and a little uneven — paint, not a circle from a geometry kit. Filled
    only: no outline, which is what made the first version's drops read as
    rings.
  */
  const draw = (d: Drop, scale: number) => {
    const L = d.lobes.length;
    const ring = d.lobes.map((lobe, j) => {
      const t = d.angle + (j / L) * Math.PI * 2;
      const r = d.r * lobe * scale;
      return [d.x + Math.cos(t) * r, d.y + Math.sin(t) * r] as const;
    });
    const mid = (a: readonly number[], b: readonly number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    ctx.beginPath();
    const start = mid(ring[L - 1], ring[0]);
    ctx.moveTo(start[0], start[1]);
    for (let j = 0; j < L; j++) {
      const next = mid(ring[j], ring[(j + 1) % L]);
      ctx.quadraticCurveTo(ring[j][0], ring[j][1], next[0], next[1]);
    }
    ctx.closePath();
    ctx.fillStyle = d.fill;
    ctx.fill();
  };

  const render = () => {
    frame = 0;
    const now = performance.now();
    drops = drops.filter((d) => now - d.born - d.delay < DROP.life);
    ctx.clearRect(0, 0, width, height);
    for (const d of drops) {
      const age = now - d.born - d.delay;
      if (age < 0) continue;
      const left = remaining(age);
      ctx.globalAlpha = left;
      // Lands with a little give, and draws in slightly as it dries.
      const land = easeOutBack(Math.min(1, age / DROP.land));
      draw(d, land * (0.88 + 0.12 * left));
    }
    ctx.globalAlpha = 1;
    if (drops.length) frame = requestAnimationFrame(render);
  };

  function wake() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  const drop = (x: number, y: number) => {
    const choices = visibleOn(palette, under);
    const pageX = x + window.scrollX;
    const pageY = y + window.scrollY;
    /*
      The last drop only counts if it was chosen from the same colours: its
      index means something else once the ground has taken one away.
    */
    const index = colourAt(pageX, pageY, choices.length, last?.count === choices.length ? last : null);
    last = { x: pageX, y: pageY, index, count: choices.length };
    const fill = css(choices[index]);
    const born = performance.now();
    const lobes = () => Array.from({ length: 9 }, () => between(0.86, 1.1));

    // The main drop, on the tip.
    drops.push({
      x,
      y,
      born,
      delay: 0,
      r: between(6, 7.5),
      angle: between(0, Math.PI * 2),
      lobes: lobes(),
      fill,
    });

    /*
      TWO SMALL ONES BESIDE IT, close enough to read as the same touch —
      within a drop's width of the main one's edge — and turned well apart
      from each other so the three never line up into a row.
    */
    const turn = between(0, Math.PI * 2);
    for (const angle of [turn, turn + between(1.7, 2.6)]) {
      const reach = between(10, 14);
      drops.push({
        x: x + Math.cos(angle) * reach,
        y: y + Math.sin(angle) * reach,
        born,
        delay: between(25, 60),
        r: between(2.4, 3.4),
        angle: between(0, Math.PI * 2),
        lobes: lobes(),
        fill,
      });
    }
    if (drops.length > MAX_DROPS) drops = drops.slice(-MAX_DROPS);
    wake();
    return fill;
  };

  const scroll = () => {
    const dx = window.scrollX - scrollX;
    const dy = window.scrollY - scrollY;
    scrollX = window.scrollX;
    scrollY = window.scrollY;
    if (!dx && !dy) return;
    for (const d of drops) {
      d.x -= dx;
      d.y -= dy;
    }
    wake();
  };

  window.addEventListener("resize", fit);
  fit();

  return {
    drop,
    scroll,
    ground(value) {
      under = read(value);
    },
    destroy() {
      cancelAnimationFrame(frame);
      frame = 0;
      window.removeEventListener("resize", fit);
      ctx.clearRect(0, 0, width, height);
    },
  };
}
