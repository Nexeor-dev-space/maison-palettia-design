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

/** Rises gently into place. The default for text and content blocks. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: Delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { ...transitions.base, delay },
  }),
};

/** No movement — for elements where a shift would feel fussy. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (delay: Delay = 0) => ({
    opacity: 1,
    transition: { ...transitions.slow, delay },
  }),
};

/** A barely-there settle, used for large editorial statements. */
export const subtleReveal: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.995 },
  visible: (delay: Delay = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...transitions.reveal, delay },
  }),
};

/** Slow scale-down of a photograph as it enters view. */
export const imageReveal: Variants = {
  hidden: { opacity: 0, scale: 1.06 },
  visible: (delay: Delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { ...transitions.reveal, delay },
  }),
};

/**
 * A line of text sliding up from behind a mask. Requires a parent with
 * `overflow: hidden` — use the <MaskedText> component rather than this
 * variant directly.
 */
export const maskUp: Variants = {
  hidden: { y: "115%" },
  visible: (delay: Delay = 0) => ({
    y: "0%",
    transition: { ...transitions.reveal, delay },
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
  stagger,
} as const;

export type VariantName = keyof typeof variants;

/** Viewport defaults: animate once, slightly before the element is centred. */
export const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;
