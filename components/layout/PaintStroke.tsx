import styles from "@/components/layout/PaintStroke.module.css";
import { cn } from "@/lib/utils";

/**
 * A painted swatch behind a link.
 *
 * Rendered by the top-level navigation and by the footer, which is the whole
 * point: the footer is meant to read as the larger, more expressive version
 * of the bar, and two copies of a gesture stay identical only until somebody
 * edits one of them.
 *
 * ==========================================================================
 * WHAT IT NEEDS FROM ITS CALLER
 * ==========================================================================
 *
 * A POSITIONED PARENT, so it has something to sit behind, and the parent must
 * carry the hover group — `group/nav` in the bar, `group/link` in the footer.
 * The stylesheet keys its swell off those two names.
 *
 * A PAINT, or nothing. `paint` is nullable on purpose and null means "draw no
 * swatch at all": on the routes where the bar sits over a dark hero the ink
 * goes light, and a pale swatch behind pale type is the one combination this
 * cannot survive. The caller knows which case it is in; this does not.
 *
 * `-z-10` on the swatch and nothing else: the parent is `isolate`-free on
 * purpose so the swatch stays behind the text but in front of the bar's own
 * ground, which is exactly one layer of stacking and needs no context.
 */
export function PaintStroke({
  paint,
  isCurrent = false,
  seat,
  className,
}: {
  /** A brand paint, or null to draw nothing — see above. */
  paint?: string | null;
  /** The link's own page. Draws a stronger, permanent swatch. */
  isCurrent?: boolean;
  /**
   * How far to lift the stroke off the bottom of its parent, e.g. "0.375rem".
   *
   * For a parent that reserves space under the word — <NavLabel> keeps 6px
   * for its hairline — so the stroke sits on the text rather than on the
   * reserve, and comes out the same weight as one that has no reserve.
   */
  seat?: string;
  className?: string;
}) {
  if (!paint) return null;

  return (
    <span
      aria-hidden
      className={cn(styles.stroke, isCurrent && styles.current, className)}
      style={{ "--paint": paint, ...(seat ? { "--seat": seat } : {}) } as React.CSSProperties}
    />
  );
}

/**
 * The paints a swatch may be drawn in, and why these three.
 *
 * THE FIRST SET WAS THE WRONG ONE, and the reason is worth keeping. It was
 * Soft Lavender, Light Sage and White Rock — the three charcoal clears at full
 * strength. Rendered, they vanished: this bar sits on `--color-surface` and on
 * Light Sage pages, and a pale swatch on a pale bar is a grey smudge. The
 * safest colours were the ones with nothing to say.
 *
 * These three have a step in them against both grounds. They are also the
 * three that would fail behind charcoal at FULL strength — Deep Lilac is
 * 2.34:1 and Warm Terracotta 3.80:1 — which is exactly why the swatch is
 * never drawn at full strength. The alpha is the control, and it is measured:
 * see the note in PaintStroke.module.css on why the paint lightens as it
 * grows, and the composited ratios recorded with it.
 */
export const LINK_PAINTS = [
  "var(--color-lavender)",
  "var(--color-terracotta)",
  "var(--color-primary)",
] as const;

/** The swatch for the nth link in a row, cycling the palette. */
export function linkPaint(index: number): string {
  return LINK_PAINTS[index % LINK_PAINTS.length];
}
