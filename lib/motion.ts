import type { Transition, Variants } from "framer-motion";

/**
 * Shared motion language: slow, smooth, editorial. Everything animates with
 * the same easing curve so the site feels like one considered piece.
 *
 * These are plain objects (safe to import from Server Components); the
 * components in `components/motion/` are the client-side consumers.
 */

export const EASE_EDITORIAL = [0.22, 1, 0.36, 1] as const;

export const transitions = {
  base: { duration: 0.6, ease: EASE_EDITORIAL },
  slow: { duration: 0.9, ease: EASE_EDITORIAL },
  reveal: { duration: 1.2, ease: EASE_EDITORIAL },
} satisfies Record<string, Transition>;

/**
 * Each `visible` state is a function of the element's `custom` prop, which
 * carries a delay in seconds. Reading the delay from `custom` rather than from
 * a `transition` prop keeps it independent of how Framer Motion resolves
 * competing transitions, so a choreographed sequence is never silently
 * flattened. Children of <Stagger> pass no custom value and fall back to 0,
 * leaving the parent's staggerChildren in charge.
 */
type Delay = number | undefined;

/*
  ==========================================================================
  WHY EVERY `delay` BELOW IS SPREAD IN CONDITIONALLY
  ==========================================================================

  A <Stagger> sequences its children with `staggerChildren`, and <Reveal>
  passes no `custom` inside one precisely so the parent can own that sequence.
  `custom` then resolves to the default 0 — and a child transition that states
  `delay: 0` OVERRIDES the offset the parent just computed. Every child starts
  at once and the stagger does nothing at all, silently.

  Measured on the four painted panels in <WaysToExperience>: with `delay: 0`
  written out, all four sat at exactly 91.8364% and then 16.9857% of their
  wipe on the same frame — identical to four decimal places. Spreading the
  delay in only when it is truthy, the same four read 34% / 72% / 96% / 100%,
  which is the wave the parent was asking for the whole time.

  So: pass a delay and it is used; pass nothing and the parent decides.
  Writing `delay` unconditionally is what breaks it.
  ========================================================================== */

/** Rises gently into place. The default for text and content blocks. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: Delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { ...transitions.base, ...(delay ? { delay } : {}) },
  }),
};

/** No movement — for elements where a shift would feel fussy. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (delay: Delay = 0) => ({
    opacity: 1,
    transition: { ...transitions.slow, ...(delay ? { delay } : {}) },
  }),
};

/** A barely-there settle, used for large editorial statements. */
export const subtleReveal: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.995 },
  visible: (delay: Delay = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...transitions.reveal, ...(delay ? { delay } : {}) },
  }),
};

/** Slow scale-down of a photograph as it enters view. */
export const imageReveal: Variants = {
  hidden: { opacity: 0, scale: 1.06 },
  visible: (delay: Delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { ...transitions.reveal, ...(delay ? { delay } : {}) },
  }),
};

/**
 * A line of text sliding up from behind a mask. Requires a parent with
 * `overflow: hidden` — use the <MaskedText> component rather than this
 * variant directly.
 *
 * 135%, not the 115% it was: headings are set in the script now, whose
 * capitals stand above the line box into the mask's extra room (see
 * `script-mask` in globals.css), and a shorter travel left their tops showing
 * before the line rose.
 */
export const maskUp: Variants = {
  hidden: { y: "135%" },
  visible: (delay: Delay = 0) => ({
    y: "0%",
    transition: { ...transitions.reveal, ...(delay ? { delay } : {}) },
  }),
};

/**
 * A cut-out landing on the paper — the collage's own arrival.
 *
 * The preloader assembles the brand's shapes by flying them in at an angle
 * and letting them settle square; this is that gesture at section scale, for
 * the parts of the page that ARE pieces laid down: a photograph collage, a
 * row of painted boxes, the closing totem.
 *
 * The angle is small and it is always the same direction. A tilt that
 * alternated, or one drawn from the index, reads as the layout being unsure
 * rather than as paper being placed — and a random one changes on every
 * paint, which is the "constant floating" the brief rules out.
 *
 * `rotate` and `y` only, so it composites: no width, no margin, nothing that
 * makes the page re-lay itself mid-animation.
 */
export const settle: Variants = {
  hidden: { opacity: 0, y: 34, rotate: -1.6 },
  visible: (delay: Delay = 0) => ({
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { ...transitions.reveal, ...(delay ? { delay } : {}) },
  }),
};

/**
 * A field drawn down from its own top edge, revealed rather than moved.
 *
 * The same gesture the header's three panels open with — `clip-path: inset()`
 * travelling, with the content holding still behind it — so a visitor who has
 * opened a menu has already seen this and the page and the chrome share one
 * idea of how a surface arrives.
 *
 * It is for panels and colour fields, never for a run of text: a wipe across
 * a paragraph reads as the words being uncovered one line at a time, which is
 * slower to read than it looks and is what <MaskedText> is for instead.
 *
 * `ease-soft`, not the editorial quintic. Measured elsewhere in this project,
 * the quintic puts a clip-path reveal about 85% of the way down in the first
 * third of its duration and spends the rest on a tail nobody can see — it
 * reads as a snap with a long silence after it.
 */
export const wipeUp: Variants = {
  hidden: { clipPath: "inset(0 0 100% 0)" },
  visible: (delay: Delay = 0) => ({
    clipPath: "inset(0 0 0% 0)",
    /*
      THE DELAY IS OMITTED WHEN IT IS ZERO, and that is not a micro-optimisation.

      Inside a <Stagger> the parent computes each child's start time from
      `staggerChildren`, and <Reveal> deliberately passes no `custom` there so
      the parent can own the sequence. `custom` therefore resolves to the
      default 0 — and a child transition that states `delay: 0` OVERRIDES the
      offset the parent just worked out, so every child starts together and
      the stagger silently does nothing.

      Spreading it in only when it is truthy leaves the parent's value alone.
    */
    transition: {
      duration: 0.78,
      ease: [0.4, 0, 0.2, 1],
      ...(delay ? { delay } : {}),
    },
  }),
};

/**
 * A card dropped onto the table from above.
 *
 * The section's other arrivals all RISE — `fadeUp` and `settle` both start
 * below their resting place and come up, which is the site's default reading
 * of "this has just arrived". This is the one that falls, for a row of cards
 * that overlap each other like a hand being laid down: they are dealt from
 * above, so they come from above.
 *
 * THE EASING IS NOT THE EDITORIAL QUINTIC, and that is the whole difference
 * between a fall and a slide. `EASE_EDITORIAL` is [0.22, 1, 0.36, 1] — almost
 * all of its travel is spent in the first half, so a drop on that curve is
 * already still by the time the eye finds it, which reads as a card appearing
 * slightly lower rather than as one falling. [0.34, 0, 0.28, 1.05] holds the
 * card up at the start, gathers speed the way a dropped thing does, and passes
 * 1 at the end so it lands a little past square and settles back.
 *
 * `y` and `rotate` only, so it composites — the card's own resting `--tilt` is
 * a separate transform on a separate element inside, so the two never fight.
 */
export const drop: Variants = {
  hidden: { opacity: 0, y: -54, rotate: 1.6 },
  visible: (delay: Delay = 0) => ({
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: {
      duration: 0.68,
      ease: [0.34, 0, 0.28, 1.05],
      /* Omitted when zero — see the note on `wipeUp`; a written `delay: 0`
         silently cancels a parent <Stagger>'s offset. */
      ...(delay ? { delay } : {}),
    },
  }),
};

/** Parent wrapper that releases its children one after another. */
export const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

/** Every named variant available to `<Reveal variant="...">`. */
export const variants = {
  fadeUp,
  fadeIn,
  subtleReveal,
  imageReveal,
  maskUp,
  settle,
  drop,
  wipeUp,
  stagger,
} as const;

export type VariantName = keyof typeof variants;

/** Viewport defaults: animate once, slightly before the element is centred. */
export const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;
