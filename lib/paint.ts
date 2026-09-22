/**
 * The four colours the site paints with on interaction.
 *
 * Deep Lilac, Warm Terracotta, Light Sage and Soft Lavender — the approved
 * palette, and nothing else. They are handed out by position rather than by
 * activity, so a row of plates reads left to right as a palette does instead
 * of as four unrelated cards; the fifth plate starts the palette again.
 *
 * Tokens rather than hex, so a change to the brand colours reaches these too.
 */
export const PAINTS = [
  "var(--color-primary)",
  "var(--color-terracotta)",
  "var(--color-sage)",
  "var(--color-lavender)",
] as const;

/**
 * The same four, minus the one that disappears on a Light Sage page, plus
 * White Rock in its place: sage paint on sage paper is not a quiet swatch,
 * it is a missing one.
 */
export const PAINTS_ON_SAGE = [
  "var(--color-primary)",
  "var(--color-terracotta)",
  "var(--color-lavender)",
  "var(--color-cream)",
] as const;

/**
 * On White Rock, the three that can be seen.
 *
 * Light Sage measures 1.03:1 against White Rock — a hue shift with almost no
 * step in lightness, which is right for a large soft field and wrong for a
 * 10px stroke, where it reads as a mistake rather than as a quiet choice.
 * Three colours over four items means the first repeats last, which is a
 * palette running out and starting again rather than two neighbours matching.
 */
export const PAINTS_ON_CREAM = [
  "var(--color-primary)",
  "var(--color-terracotta)",
  "var(--color-lavender)",
] as const;

/** The paint for the nth item in a row, from a palette that suits the ground. */
export function paintAt(index: number, palette: readonly string[] = PAINTS): string {
  return palette[index % palette.length];
}
