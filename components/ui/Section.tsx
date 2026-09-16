import type { ElementType, ReactNode } from "react";

import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

/**
 * The four grounds the homepage is allowed to sit on. There is no fifth, and
 * there is no "none" — see THE HOMEPAGE GROUND RHYTHM at the top of
 * app/globals.css for which section takes which, and the paragraph below for
 * why a transparent section is a bug on this page rather than an option.
 */
export type Ground = "surface" | "cream" | "sage" | "ink";

/**
 * Ground utilities, and the one piece of behaviour that travels with them.
 *
 * `ink` carries three things rather than one. The fill, the light ink that
 * every descendant then inherits, and `--color-focus` — the base layer draws
 * every focus ring in Deep Lilac, and Deep Lilac on Charcoal Slate measures
 * 2.37:1, so on a dark field the ring is very nearly invisible at exactly the
 * moment a keyboard visitor needs it most. White Rock is 9.36:1 there. The
 * homepage's two dark sections both had to remember to set this by hand; now
 * neither can forget.
 */
const GROUNDS: Record<Ground, string> = {
  /** The page ground. Not transparent — read the note in <Section> below. */
  surface: "bg-surface",
  /** White Rock. The page's one warm field, used three times. */
  cream: "bg-cream",
  /** Light Sage. Not on the homepage after this pass; kept for the footer's field and other routes. */
  sage: "bg-sage",
  /** Charcoal Slate: the hero and the film, both full-bleed behind their own scrim. */
  ink: "bg-text text-on-dark [--color-focus:var(--color-cream)]",
};

interface SectionProps {
  /**
   * The id of this section's heading, not of the section.
   *
   * It goes straight onto `aria-labelledby`, and the matching `<SectionHead>`
   * puts the same string on its `<h2>`. One value, passed to both, so a
   * section cannot end up as an unnamed region — which is what four sections
   * on this site were before <Container> started spreading its rest props.
   */
  id: string;
  children: ReactNode;
  ground?: Ground;
  /**
   * Skip the <Container>. For a section whose content reaches the screen
   * edges — a full-bleed photograph, a video backdrop, a map — and which
   * therefore has to rebuild the gutter for the parts that do not bleed,
   * using `px-gutter` and `-mx-gutter` so the two can never drift apart.
   */
  bleed?: boolean;
  as?: ElementType;
  /**
   * Layout only: a column span, an `overflow-hidden`, a `relative isolate`.
   *
   * Never the ground and never the padding. `cn` concatenates rather than
   * resolving conflicts, so a `py-*` or a `bg-*` passed through here would be
   * settled by its position in the generated stylesheet instead of by the
   * caller, which is a bug that only shows up after an unrelated edit.
   */
  className?: string;
}

/**
 * The homepage's section shell: one ground, one vertical rhythm, one label.
 *
 * WHAT IT TAKES OFF EACH SECTION. Every section on this page was writing out
 * its own `<section aria-labelledby>`, its own ground utility, its own
 * breakpoint ladder of vertical padding and, on the dark ones, its own
 * `--color-focus` — five decisions restated eleven times, which is how the page
 * ended up running three different padding scales at once. All of that is here
 * now. A section says which of four grounds it is on and what its heading's id
 * is, and the rhythm is not its problem.
 *
 * `surface` PAINTS A REAL BACKGROUND. It is tempting to let the page ground be
 * the absence of a ground, since `body` is already `--color-surface`, and on
 * this page that is wrong in a way that is invisible until you scroll. The hero
 * is `sticky top-0 z-0` and the first sections sit in a `relative z-10` layer
 * whose whole job is to rise over it and cover it (see the note in
 * app/page.tsx). A section in that layer with no fill of its own is
 * transparent, and the pinned photograph paints straight through the type — it
 * happened the last time <HowItWorks> moved inside the wrapper, and the fix
 * there was the same one this makes structural. There is no ground=`none`
 * option for the same reason.
 *
 * THE HEAD-TO-CONTENT GAP IS NOT SET HERE. A section applies `mt-section-gap`
 * to whatever follows its `<SectionHead>`:
 *
 *     <Section id="gallery-heading" ground="surface">
 *       <SectionHead id="gallery-heading" title="…" />
 *       <ul className="mt-section-gap …">…</ul>
 *     </Section>
 *
 * A margin baked into the head can only be fought with another margin, and
 * some sections put a rule, a full-bleed plate or a second head-level element
 * after theirs. One token, applied where the relationship actually is.
 *
 * Server component, and it must stay one — it is the outermost element of
 * every section, and making it a client component would drag the whole page
 * across the boundary with it.
 */
export function Section({
  id,
  children,
  ground = "surface",
  bleed = false,
  as: Tag = "section",
  className,
}: SectionProps) {
  return (
    <Tag aria-labelledby={id} className={cn("py-section-y", GROUNDS[ground], className)}>
      {bleed ? children : <Container>{children}</Container>}
    </Tag>
  );
}
