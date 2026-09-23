import { DOODLES, type DoodleName } from "@/components/sections/hero/doodles";
import styles from "@/components/ui/DoodleMark.module.css";
import { cn } from "@/lib/utils";

/**
 * One of the brand's cut-out shapes, with a way of arriving.
 *
 * ==========================================================================
 * THE CLIENT'S NOTE WAS ABOUT SCATTER, NOT ABOUT MOVEMENT
 * ==========================================================================
 *
 * "Uncontrolled icon scattering did not look good." So none of the three
 * treatments here move a shape from anywhere: each one arrives in the place it
 * already holds, and a set of them arrives in reading order, one after the
 * next, by `delay`.
 *
 *   draw ..... the shape is drawn, outline first and then filled — the way the
 *              deck's cut-outs were made, and the same gesture the homepage
 *              intro uses. This is the default: it is the most the brand's own
 *              and the least like a generic UI animation.
 *   stamp .... a fast press and settle when the card it sits in is hovered.
 *   rise ..... a few pixels up into place, for a mark beside running text.
 *
 * The shapes themselves are the vectors read out of the client's brand deck
 * (see ../sections/hero/doodles.ts); nothing here draws a new one.
 *
 * `on` is what starts `draw` and `rise` — a panel opening, a section arriving.
 * `stamp` ignores it and answers the nearest `.group` instead.
 *
 * Decorative in every case: `aria-hidden`, and never the only thing saying
 * what a row is.
 */
export function DoodleMark({
  name,
  color = "currentColor",
  treatment = "draw",
  trigger = "scroll",
  on = true,
  delay = 0,
  depth = 8,
  className,
}: {
  name: DoodleName;
  /** A brand colour. Defaults to the ink around it. */
  color?: string;
  treatment?: "draw" | "stamp" | "rise";
  /**
   * What makes the mark draw itself.
   *
   *   scroll ... the default. A view timeline runs the draw off the mark's own
   *              travel through the viewport, so a mark far down a page is
   *              still undrawn when you reach it. See DoodleMark.module.css.
   *   state .... the caller owns it, through `on`. For a mark inside something
   *              that opens — a megamenu panel — where "when it is scrolled
   *              to" is the wrong question and the view timeline cannot answer
   *              it anyway: the panel is a scroll container, so a timeline
   *              inside it resolves against the panel and reports the mark as
   *              permanently covered.
   */
  trigger?: "scroll" | "state";
  /** Has the thing holding it arrived yet? Ignored by `stamp`. */
  on?: boolean;
  /** Milliseconds after its neighbours, so a set arrives in order. */
  delay?: number;
  /**
   * How far the mark drifts against the pointer, in pixels at the edge of the
   * window. The client asked for the banner's doodle movement everywhere, and
   * this is the knob: 8 is a mark that breathes, 16 one that plainly follows
   * you, 0 one that is pinned. Raise it for a large shape with space around
   * it and drop it for a small one sitting against type, where a few pixels
   * of travel would read as the layout wobbling.
   */
  depth?: number;
  className?: string;
}) {
  const shape = DOODLES[name];

  return (
    /*
      The drift lives on a wrapper, not on the <svg>, because two of the three
      treatments already own the svg's transform — `stamp` scales it on hover
      and `rise` lifts it into place — and a translate written on the same
      element would overwrite whichever ran second. The wrapper fills the box
      the caller sized, so nothing about how a mark is placed changes.
    */
    <span className={styles.drift} style={{ "--depth": depth } as React.CSSProperties}>
    <svg
      viewBox={`0 0 ${shape.w} ${shape.h}`}
      aria-hidden
      focusable="false"
      data-on={on ? "true" : "false"}
      data-trigger={trigger}
      style={{ "--mark-delay": `${delay}ms`, color } as React.CSSProperties}
      className={cn(styles.mark, styles[treatment], className)}
    >
      <path d={shape.d} fill={color} pathLength={1} className={styles.ink} />
    </svg>
    </span>
  );
}
