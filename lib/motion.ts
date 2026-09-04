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

/** Rises gently into place. The default for text and content blocks. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: transitions.base },
};

/** No movement — for elements where a shift would feel fussy. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.slow },
};

/** A barely-there settle, used for large editorial statements. */
export const subtleReveal: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.995 },
  visible: { opacity: 1, y: 0, scale: 1, transition: transitions.reveal },
};

/** Slow scale-down of a photograph as it enters view. */
export const imageReveal: Variants = {
  hidden: { opacity: 0, scale: 1.06 },
  visible: { opacity: 1, scale: 1, transition: transitions.reveal },
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
  stagger,
} as const;

export type VariantName = keyof typeof variants;

/** Viewport defaults: animate once, slightly before the element is centred. */
export const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;
