import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { INK } from "@/components/sections/hero/composition";
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
const WHY_SHAPES: readonly ShapePlan[] = [
  { name: "splash", color: INK.lilac, width: "22%", top: "6%", right: "4%", rotate: -10, drift: 28, opacity: 0.16 },
  { name: "bean", color: INK.terracotta, width: "9%", top: "52%", right: "26%", rotate: 16, drift: -22, opacity: 0.18, desktopOnly: true },
  { name: "wave", color: INK.lavender, width: "14%", bottom: "8%", right: "12%", rotate: 6, drift: 20, opacity: 0.24, desktopOnly: true },
];

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
              <p className="mt-7 text-label font-semibold uppercase tracking-eyebrow text-text">
                Our mission
              </p>
            </Reveal>
          </div>

          <div className="col-span-12 lg:col-span-4 lg:col-start-9 lg:pt-28">
            <Reveal delay={0.15}>
              <p className="text-lead leading-[1.75] text-text">{BRAND_STORY}</p>
            </Reveal>

            <Reveal delay={0.25}>
              <figure className="mt-10 border-t border-text/25 pt-7">
                <figcaption className="text-label font-semibold uppercase tracking-eyebrow text-text">
                  Our vision
                </figcaption>
                <blockquote className="mt-3 text-body leading-[1.8] text-text">{VISION}</blockquote>
              </figure>
            </Reveal>

            <Reveal delay={0.3}>
              <Link
                href="/about"
                className="group -my-1.5 mt-9 inline-flex items-baseline gap-3 py-1.5 text-action font-semibold uppercase tracking-eyebrow text-text"
              >
                <span className="border-b border-primary pb-1.5 transition-colors duration-300 ease-soft group-hover:border-text">
                  Our story
                </span>
                <span
                  aria-hidden
                  className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
                >
                  &#8594;
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
