import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
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
export function WhyMaison() {
  return (
    <section
      aria-labelledby="why-maison"
      className="relative bg-sage py-[5rem] md:py-section lg:py-section-lg"
    >
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
