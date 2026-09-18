import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { LITTLE_CREATORS } from "@/lib/brand";

/**
 * Homepage 08 — for our little creators.
 *
 * PLAYFUL, BUT NOT A NURSERY. The brief's line, and the difficulty is real: a
 * kids section is where a premium site most often reaches for primary colours,
 * rounded bubble type and clip-art. None of that is here. The play comes from
 * two things the brand already owns — the arch from the Maison's own signage,
 * cut into three White Rock tiles, and the Light Sage stripe from its brand
 * board, running as a band behind them. The palette and the type are exactly
 * the rest of the page's.
 *
 * NAMES ONLY, BECAUSE THE DECK GIVES NAMES ONLY. Tissue art, coffee painting
 * and wooden painting (p.8) come with no age range, no duration and no
 * description, so the tiles carry the name and nothing is written under it.
 * The deck's photographs for this page are web inspiration images rather than
 * the studio's own, so there are no pictures either — and the section is
 * designed to be complete without them rather than waiting on them.
 */
export function LittleCreators() {
  return (
    <section
      aria-labelledby="little-creators-heading"
      className="relative overflow-hidden bg-sage pt-[5rem] md:pt-section lg:pt-section-lg"
    >
      <Container className="relative">
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <Eyebrow>Tailored kids activities</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="little-creators-heading"
              className="mt-8 md:mt-10"
              lines={["For our little", "creators."]}
            />
          </div>
          <Reveal delay={0.2} className="col-span-12 lg:col-span-5 lg:pb-3">
            {/* Deck p.5, "Family bonding", verbatim. */}
            <p className="max-w-[28rem] text-lead leading-[1.7] text-text">
              Kids and parents share activities for quality time together.
            </p>
          </Reveal>
        </div>
      </Container>

      {/*
        The stripe runs the full width behind the lower half of the tiles, and
        the tiles are solid — no word ever sits on the pattern itself, which
        fails contrast on every other band.
      */}
      <div className="relative mt-14 pb-16 md:mt-20 md:pb-24">
        <div
          aria-hidden
          className="stripes absolute inset-x-0 bottom-0 top-[38%] [--stripe-w:1.5rem]"
        />
        <Container className="relative">
          {/* Held to a narrower measure than the page: at full width three
              arches stood 570px tall with one short word at the foot of each,
              which is a lot of empty stone. */}
          <ul className="mx-auto grid max-w-[60rem] grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6 lg:gap-8">
            {LITTLE_CREATORS.map((activity, i) => (
              <li key={activity.slug}>
                <Reveal variant="fadeIn" delay={i * 0.08}>
                  <div className="arch flex aspect-[5/3] items-end justify-center bg-cream px-6 pb-8 [--arch-rise:42%] sm:aspect-[4/5] sm:pb-10">
                    <h3 className="text-center text-[1.6rem] font-light uppercase leading-[1.05] tracking-[-0.015em] text-text md:text-[1.9rem]">
                      {activity.name}
                    </h3>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </section>
  );
}
