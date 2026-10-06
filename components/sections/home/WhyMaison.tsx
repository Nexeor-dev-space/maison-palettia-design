import { BlobButton } from "@/components/ui/BlobButton";

import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { groundShapes } from "@/components/motion/groundShapes";
import { Container } from "@/components/ui/Container";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { BRAND_STORY, VISION } from "@/lib/brand";

/**
 * Homepage 02 — why the Maison exists.
 *
 * The first thing after the hero is the reason, not the menu: the brief asks
 * the site to tell the story before it pushes a transaction, and the deck
 * opens the same way (p.2, then p.3). Every sentence here is the deck's.
 *
 * COMPOSITION. The mission is the statement, set large on the left. The story
 * and the vision answer it from a narrower column on the right that starts
 * lower, so the eye reads the claim first and the explanation second rather
 * than meeting two blocks of equal weight side by side.
 *
 * LIGHT SAGE, because that is the ground the brand deck is printed on and the
 * one the brand guide assigns to structural surfaces. Opening the story on it
 * is the quickest way to make the page feel like the same brand as the deck.
 *
 * It sits inside the layer that rises over the sticky hero, so the ground has
 * to be opaque — the hero is still pinned underneath while this arrives.
 */
/*
  THE AIR IN HERE IS THE POINT, AND IT WAS STILL JUST AIR.

  The section runs a statement down the left and leaves the right half open,
  which is the composition. Empty is not the same as inert, though: at
  1440 that is roughly 700px of flat Light Sage with nothing in it, and it sits
  directly above another section that opens the same way. Three of the studio's
  own cut-outs, large and held low, give the space something to be.

  Drifting at different rates as the section passes — see <SectionShapes> —
  because the client asked for the gap between this and the experience section
  to have something moving in it.
*/
const WHY_SHAPES: readonly ShapePlan[] = groundShapes("sage");

export function WhyMaison() {
  return (
    <section
      aria-labelledby="why-maison"
      className="relative isolate overflow-hidden bg-sage py-[5rem] md:py-section lg:py-section-lg"
    >
      {/* The right half of this section is empty by design and was empty in
          fact — see WHY_SHAPES. */}
      <SectionShapes plan={WHY_SHAPES} />
      <Container>
        <div className="grid grid-cols-12 gap-x-6 gap-y-12 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <Eyebrow>Why Maison Palettia</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="why-maison"
              className="mt-8 md:mt-10"
              lines={["To inspire meaningful", "connections through", "the joy of creativity."]}
            />
            {/* The heading is MISSION from lib/brand.ts, broken into lines by
                hand — where a statement breaks is a design decision. Labelled
                so it is read as the mission rather than as a slogan. */}
            <Reveal delay={0.2}>
              <p className="mt-7 text-label font-medium uppercase tracking-eyebrow text-text">
                Our mission
              </p>
            </Reveal>
          </div>

          {/*
            THE SECTION-MASTHEAD DESCRIPTION COLUMN. Five of twelve, ending
            flush with the container's right edge, and no cap on the
            paragraph inside it — the column IS the measure. Twenty-two other
            columns on this site are already this; see the note in
            <ExperienceDiscovery>.
          */}
          {/* `lg:pt-28` stays. It is a vertical offset, not a width — this
              column deliberately starts below the heading's baseline, which
              is this section's own composition and not the thing being
              standardised. */}
          <div className="col-span-12 lg:col-span-5 lg:col-start-8 lg:pt-28">
            <Reveal delay={0.15}>
              <p className="text-lead text-text">{BRAND_STORY}</p>
            </Reveal>

            <Reveal delay={0.25}>
              <figure className="mt-10 border-t border-text/25 pt-7">
                <figcaption className="text-label font-medium uppercase tracking-eyebrow text-text">
                  Our vision
                </figcaption>
                <blockquote className="mt-3 text-body text-text">{VISION}</blockquote>
              </figure>
            </Reveal>

            <Reveal delay={0.3}>
              <BlobButton href="/about" tone="painted" className="mt-9 min-h-[3.25rem] px-7">
                Our story
              </BlobButton>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
