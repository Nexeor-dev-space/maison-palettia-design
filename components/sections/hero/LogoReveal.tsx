import styles from "@/components/sections/hero/Hero.module.css";
import { LOGO_BOX, LOGO_DOTS, LOGO_GLYPHS } from "@/components/sections/hero/logoArt";

/**
 * The mark, as the entrance opens on it.
 *
 * ==========================================================================
 * IT FADES IN NOW, AND THAT IS THE CLIENT'S INSTRUCTION
 * ==========================================================================
 *
 * This component used to write the logo. Each letter was uncovered along the
 * path a pen would take, traced from the letter's own skeleton, with the six
 * palette dots in the "P" arriving one at a time at the end — about 2.7
 * seconds of handwriting, and the note against it said in as many words that
 * the reveal must be the writing and never a fade.
 *
 * The client has since asked for a different direction for the whole opening,
 * and their storyboard's first frame is explicit: "The background is clean,
 * and the Maison Palettia logo fades in at the centre", 0.0–0.2s. A fade is
 * what is asked for, and a 2.7-second writing cannot be fitted inside a
 * 1.5-second entrance in any case.
 *
 * So the mask, the pen paths and the per-letter clip paths are gone and this
 * is the artwork, painted once. `.introLogo` in ./Hero.module.css owns the
 * fade; there is nothing to schedule here any more, which is why this takes no
 * props.
 *
 * WHAT IS ON SCREEN IS STILL THE FILE. The lettering and the dots are the
 * outlines from the client's Illustrator artwork, painted exactly as the file
 * paints them (see ./logoArt.ts) — never redrawn, retyped or approximated.
 * Only the way it arrives has changed.
 *
 * `PEN_MOVES` in ./logoArt.ts has no consumer while the entrance is a fade.
 * It is left in place deliberately: it is a derivation of the client's own
 * artwork that took real work to trace, and putting the writing back is an
 * import and a mask rather than a re-tracing.
 */
export function LogoReveal() {
  return (
    <svg
      className={styles.logoArt}
      viewBox={`0 0 ${LOGO_BOX.width} ${LOGO_BOX.height}`}
      width={LOGO_BOX.width}
      height={LOGO_BOX.height}
      aria-hidden
      focusable="false"
    >
      {/* The artwork: fill and 0.5-unit stroke in the one colour, as the file
          has it — the lettering and the six paint wells in the "P" together,
          because they arrive together now. */}
      <g className={styles.logoInk}>
        {LOGO_GLYPHS.map((glyph, i) => (
          <path key={glyph.name + i} d={glyph.d} fillRule={glyph.evenodd ? "evenodd" : "nonzero"} />
        ))}
        {LOGO_DOTS.map((dot, i) => (
          <path key={`dot-${i}`} d={dot.d} />
        ))}
      </g>
    </svg>
  );
}
