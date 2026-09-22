import styles from "@/components/layout/FooterWave.module.css";

/**
 * The wave on the footer's top edge.
 *
 * The footer's own White Rock, carried up over the seam on a run of five
 * crests. One shape, one colour — the Deep Lilac band that used to sit under
 * it has been taken out at the client's ask.
 *
 * FIVE CRESTS RATHER THAN TWO AND A HALF. At 1440px wide a single long curve
 * reads as a tilted edge rather than as a wave: the eye needs the line to turn
 * several times before it calls it wavy. Five is as many as this amplitude
 * carries — past that the crests are shorter than they are tall at desktop
 * widths and it starts to read as a scallop or a doily rather than as water.
 *
 * The amplitude is deliberately uneven. Crests of identical height and spacing
 * read as a repeating pattern, which is the one thing a hand-drawn edge never
 * looks like; these run between 22% and 82% of the artwork's height and no two
 * are the same.
 *
 * `preserveAspectRatio="none"` — one smooth curve with no detail to distort,
 * so it stretches to any width without anything giving it away. That is why a
 * wave needs one shape for every screen where the torn splatter edge this
 * replaced needed a mask authored per proportion.
 *
 * Decorative, so it is hidden from the accessibility tree and takes no pointer
 * events. A server component with no props and no state — nothing here follows
 * the cursor.
 */
export function FooterWave() {
  return (
    <svg
      aria-hidden
      focusable="false"
      className={styles.wave}
      viewBox="0 0 1200 100"
      preserveAspectRatio="none"
    >
      <path
        d="M0,58 C58,34 118,22 196,32 C274,42 312,74 396,80 C480,86 522,58 600,46 C678,34 716,54 790,64 C864,74 906,44 984,34 C1062,24 1142,38 1200,54 L1200,100 L0,100 Z"
        fill="var(--color-cream)"
      />
    </svg>
  );
}
