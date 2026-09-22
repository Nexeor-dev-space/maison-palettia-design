import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { INK } from "@/components/sections/hero/composition";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { DisplayHeading, Eyebrow, forScript } from "@/components/ui/SectionHeader";
import {
  BRAND_STORY,
  CLOSING,
  COMMUNITY,
  EVENT_PLATES,
  MISSION,
  PAST_DESTINATIONS,
  TAGLINE,
  VISION,
  WHAT_SETS_US_APART,
  WORKSHOP_JOURNEY,
} from "@/lib/brand";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description:
    "Maison Palettia is a creative lifestyle brand celebrating creativity, mindfulness and meaningful human connection — hands-on experiences that bring people together.",
  path: "/about",
});

/**
 * /about — who the Maison is, in the order its own deck tells it.
 *
 * Welcome and story (p.2), mission and vision (p.3), how the community is made
 * (p.4–5), what sets it apart (p.11), where it has created (p.12), and the
 * deck's closing line (p.15). Every sentence of substance is lib/brand.ts;
 * the headings are short and say only what their section contains.
 *
 * WHAT CAME OUT. The previous page opened on "Art, craft and company.", ran
 * a sequence of watercolour editorial panels, and included a "Just added"
 * strip whose photographs were glazed ceramic vases — pottery, which the
 * client has asked the site not to show. It also described the programme
 * through the Paint / Shape / Craft / Create strands, which the rest of the
 * site no longer uses.
 */
export default function AboutPage() {
  return (
    <>
      <Welcome />
      <MissionVision />
      <Community />
      <Apart />
      <Created />
      <Close />
    </>
  );
}

/* ---- 01 welcome ---------------------------------------------------------- */

function Welcome() {
  return (
    <section aria-labelledby="about-title" className="bg-surface">
      <Container className="py-[3.5rem] md:py-[5rem] lg:py-[6rem]">
        <div className="grid grid-cols-12 gap-x-6 gap-y-12 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-6">
            <Reveal>
              <Eyebrow>About</Eyebrow>
            </Reveal>
            <p className="mt-9 heading-script text-[2.1rem] leading-[1.15] text-primary md:text-[2.6rem]">
              {TAGLINE}
            </p>
            <DisplayHeading
              as="h1"
              id="about-title"
              className="mt-6"
              lines={["Welcome to", "Maison Palettia."]}
            />
            <Reveal delay={0.15}>
              <p className="mt-9 max-w-[34rem] text-lead leading-[1.75] text-text">{BRAND_STORY}</p>
            </Reveal>
          </div>

          <Reveal variant="fadeIn" className="col-span-12 lg:col-span-5 lg:col-start-8">
            <div className="arch relative aspect-[4/5] overflow-hidden bg-cream [--arch-rise:34%]">
              <Image
                src="/images/experience/painting.jpg"
                alt="A hand painting a pale flower on a canvas at an easel, holding a palette of white, lilac and blue paint."
                fill
                priority
                sizes="(min-width: 1024px) 38vw, 92vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ---- 02 mission and vision ---------------------------------------------- */

/**
 * ==========================================================================
 * THE PURPOSE — A PAUSE, NOT A CORPORATE BLOCK
 * ==========================================================================
 *
 * WHERE IT CAME FROM. This lived on the homepage as <VisionMission>, set the
 * way the brand deck's page 3 sets it: a lavender pill reading VISION, the
 * sentence in an outlined rounded box, the same again for MISSION, and two
 * cut-outs breaking the corners. That is a faithful reproduction of a slide,
 * and the client's note was that reproducing the slide is exactly what not to
 * do — the deck is the source of the colours and the words, not of the
 * layout. It is also two sentences the About page was already carrying, so
 * the page and the homepage were saying the same thing twice.
 *
 * WHAT REPLACES IT, and it is the brief's own direction for this section: the
 * mission set large in the brand's script, the vision revealed under it in
 * Montserrat, and "a quiet emotional pause in the page".
 *
 *   The mission is the script line because it is the shorter and the warmer
 *   of the two — eight words, first person, no clause about curation. It is
 *   the one of the pair that can carry display scale without becoming a
 *   paragraph set in a handwriting face, which §4 of the brief forbids and
 *   which the script is genuinely bad at.
 *
 *   The vision answers it in the sans, dropped and indented so the eye
 *   crosses the measure to reach it. It is the practical half — what the
 *   studio does about the mission — so it reads as the supporting voice
 *   rather than as a second banner.
 *
 * NO BOXES AND NO PILLS. The whole composition is two statements, one
 * hairline and one mark. An outline around a sentence adds nothing a change
 * of scale and ink is not already saying, and boxing both made them look like
 * a form rather than a belief.
 *
 * ONE DOODLE, AND IT IS PUNCTUATION. It sits on the rule where the statement
 * turns into its answer — a printer's mark at the turn, not a shape floating
 * in a corner. The client's note on the last set was that scattering does not
 * look good, and two cut-outs pinned to opposite corners of a slide is
 * scattering with better manners.
 *
 * INK. Deep Lilac on Light Sage measures 3.83:1 — clear of the 3:1 large text
 * owes and under the 4.5:1 it would owe below 24px, which is why the script
 * carries it and the sans does not. The vision is Charcoal Slate at 9.07:1.
 */
/**
 * The mission, broken into display lines — and checked against the constant.
 *
 * Where a statement turns is a design decision on this site, so the breaks are
 * written rather than left to the measure. Writing them means writing the
 * words a second time, which is how a page ends up quietly disagreeing with
 * lib/brand.ts after somebody edits one and not the other.
 *
 * So the pieces are joined back up and compared: if they still spell {@link
 * MISSION} they are used, and if the studio ever reworded the mission the
 * heading falls back to the constant on a single line — right, if less
 * composed, which is the correct way round for a fallback.
 */
const MISSION_LINES = ["To inspire meaningful", "connections through", "the joy of creativity."];

function missionLines(): string[] {
  return MISSION_LINES.join(" ") === MISSION ? MISSION_LINES : [MISSION];
}

function MissionVision() {
  return (
    <section aria-labelledby="purpose-heading" className="bg-sage py-[5rem] md:py-section lg:py-section-lg">
      <Container>
        <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-8">
            <Reveal>
              <Eyebrow>Our mission</Eyebrow>
            </Reveal>

            {/*
              Deep Lilac rather than the ground's charcoal, set inline — and
              that is not laziness.

              <DisplayHeading> picks an ink from its `ground` and concatenates
              the caller's `className` after it, but `cn` in lib/utils is
              documented as plain concatenation: "we only need concatenation,
              not Tailwind conflict resolution". Two utilities of equal
              specificity then race on stylesheet order rather than on the
              order they appear in the attribute, and `text-text` wins — the
              heading rendered charcoal with `text-primary` sitting right
              there in the class list.

              So <DisplayHeading> now takes `tone` and emits one ink class
              instead of two fighting ones — which fixes it here and for the
              other twenty-two call sites that would have hit the same trap.

              Lines are passed because where a statement breaks is a design
              decision on this site, not something left to the measure.
            */}
            <DisplayHeading
              id="purpose-heading"
              tone="accent"
              className="mt-8 md:mt-10"
              lines={missionLines()}
            />
          </div>
        </div>

        {/*
          The answer. Dropped below the statement and pushed to the right half,
          so the page turns a corner between the two rather than stacking them.
        */}
        <div className="mt-14 grid grid-cols-12 gap-x-6 md:mt-20 lg:gap-x-10">
          <Reveal delay={0.15} className="col-span-12 md:col-span-8 md:col-start-5 lg:col-span-6 lg:col-start-7">
            <figure className="relative border-t border-text/30 pt-8">
              {/* On the rule, at the turn. Sized by its wrapper — <DoodleMark>
                  fills the box it is given. */}
              <span
                aria-hidden
                className="absolute -top-4 left-0 block h-8 w-8 bg-sage pr-2"
              >
                <DoodleMark name="starleaf" color="#D97757" treatment="draw" delay={240} />
              </span>

              <figcaption className="text-label font-semibold uppercase tracking-eyebrow text-text">
                Our vision
              </figcaption>
              <blockquote className="mt-5 max-w-[34rem] text-lead font-light leading-[1.6] text-text">
                {VISION}
              </blockquote>
            </figure>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ---- 03 community ------------------------------------------------------- */

function Community() {
  return (
    <section aria-labelledby="community-about" className="bg-surface py-[5rem] md:py-section lg:py-section-lg">
      <Container>
        <div className="grid grid-cols-12 gap-x-6 gap-y-12 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-5">
            <Reveal>
              <Eyebrow>The Maison experience</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="community-about"
              size="compact"
              className="mt-8 md:mt-10"
              lines={["Creating community", "through creativity."]}
            />
            <Reveal delay={0.15}>
              <p className="mt-7 max-w-[30rem] text-body leading-[1.85] text-text/85">{COMMUNITY.body}</p>
              <p className="mt-6 heading-script text-[1.75rem] leading-[1.2] text-primary md:text-[2.1rem]">
                {forScript(COMMUNITY.closer)}
              </p>
            </Reveal>
          </div>

          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <Reveal>
              <h3 className="text-label font-semibold uppercase tracking-eyebrow text-text">
                The workshop journey
              </h3>
            </Reveal>
            <ol className="mt-5 border-t border-text/25">
              {WORKSHOP_JOURNEY.map((step, i) => (
                <li key={step.slug} className="border-b border-text/25 py-5">
                  <Reveal delay={i * 0.05}>
                    <div className="grid grid-cols-[2.5rem_1fr] items-baseline gap-x-3">
                      <span aria-hidden className="text-label font-semibold tabular-nums tracking-eyebrow text-text">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-lead font-semibold leading-snug text-text">{step.name}</p>
                        <p className="mt-1.5 text-body leading-[1.7] text-text/85">{step.description}</p>
                      </div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---- 04 what sets it apart ---------------------------------------------- */

/*
  One mark per point, in the order the deck lists them, and the three angles
  the collage is dropped at. Both came here with the block below — see the note
  on <Apart>.
*/
const MARKS: readonly { name: DoodleName; color: string }[] = [
  { name: "starburst", color: INK.lilac },
  { name: "bean", color: INK.terracotta },
  { name: "coral", color: INK.lavender },
  { name: "zigzag", color: INK.charcoal },
];

/* Dropped, not aligned — the angles are fixed so the collage never reshuffles. */
const TILT = ["-rotate-[5deg]", "rotate-[3deg]", "-rotate-[2deg]"];

/**
 * What sets the Maison apart — the deck's p.11, and three photographs from a
 * table.
 *
 * ==========================================================================
 * THIS ARRIVED FROM THE HOMEPAGE, AND IT REPLACED A SECOND COPY OF ITSELF
 * ==========================================================================
 *
 * The client asked for the homepage's version of this block to live here. The
 * page already had these same four points, from the same `WHAT_SETS_US_APART`,
 * set as ruled rows beside a two-column grid of the same three photographs —
 * so this is not an addition. The better treatment replaced the plainer one
 * and the site says this once.
 *
 * WHAT MAKES IT THE BETTER ONE. The points are type on the paper with the
 * brand's own cut-outs against them: no boxes, no icons in circles, nothing
 * that turns four sentences into four cards. The photographs are a collage
 * dropped at fixed angles and allowed to overlap, which is how the deck lays
 * pictures down — cut paper rather than a grid.
 *
 * THE MARKS CARRY THE COLOUR AND THE WORDS DO NOT. On White Rock only Charcoal
 * and Deep Lilac can hold anything that is read; Soft Lavender is 1.44:1. The
 * cut-outs are decorative and `aria-hidden`, so they owe no ratio and the whole
 * palette is free to appear in them. Every word here stays Charcoal.
 *
 * THE EYEBROW IS THE HEADING. This section's content is a list, not a
 * statement, so there is nothing for a display heading to say that the label
 * does not — and `aria-labelledby="apart-heading"` pointed at an id that did
 * not exist until the label became an `h2`.
 */
function Apart() {
  return (
    <section aria-labelledby="apart-heading" className="bg-cream py-[5rem] md:py-section">
      <Container>
        <Reveal>
          <Eyebrow as="h2" id="apart-heading">
            What sets us apart
          </Eyebrow>
        </Reveal>

        <div className="mt-12 grid grid-cols-12 gap-x-gutter gap-y-14 md:mt-16">
          <Stagger as="ul" className="col-span-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:col-span-7">
            {WHAT_SETS_US_APART.map((point, i) => {
              const mark = MARKS[i % MARKS.length];
              return (
                <Reveal as="li" key={point.slug} className="flex gap-4">
                  <span aria-hidden className="mt-1 block w-7 shrink-0">
                    <DoodleMark name={mark.name} color={mark.color} delay={i * 90} />
                  </span>
                  <div>
                    <p className="text-[1.25rem] uppercase leading-[1] tracking-[0.015em] text-text [font-family:var(--font-deck)] [font-synthesis:none] md:text-[1.5rem]">
                      {point.name}
                    </p>
                    <p className="mt-2 max-w-[34ch] text-[0.9375rem] leading-[1.7] text-text/80">
                      {point.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </Stagger>

          {/*
            The collage. They are small on purpose: these three are phone
            photographs, 480–768px on the long edge, and the code that first
            used them says in as many words not to set them large.
          */}
          <Reveal delay={0.12} className="col-span-12 lg:col-span-5 lg:col-start-8 lg:self-center">
            <Reveal>
              <h3 className="text-label font-semibold uppercase tracking-eyebrow text-text">
                From our tables
              </h3>
            </Reveal>
            <div className="relative mx-auto mt-8 flex max-w-[24rem] items-center justify-center gap-0 lg:max-w-none">
              {EVENT_PLATES.map((plate, i) => (
                <span
                  key={plate.src}
                  className={`plate relative block w-[38%] shrink-0 overflow-hidden rounded-[0.9rem] bg-surface ${TILT[i % TILT.length]} ${i > 0 ? "-ml-[9%]" : ""}`}
                  style={{ zIndex: i === 1 ? 3 : 2 - i }}
                >
                  <span className="relative block aspect-[3/4] w-full">
                    <Image
                      src={plate.src}
                      alt={plate.alt}
                      fill
                      sizes="(min-width: 1024px) 16vw, 34vw"
                      className="object-cover"
                    />
                  </span>
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ---- 05 where it has created -------------------------------------------- */

function Created() {
  return (
    <section aria-labelledby="created-heading" className="bg-surface py-[5rem] md:py-section">
      <Container>
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-5">
            <Reveal>
              <Eyebrow>Our experience</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="created-heading"
              size="compact"
              className="mt-8 md:mt-10"
              lines={["Where we’ve", "created."]}
            />
          </div>
          <Reveal delay={0.15} className="col-span-12 lg:col-span-7">
            <p className="text-[1.3rem] font-light leading-[1.55] tracking-[-0.01em] text-text md:text-[1.6rem]">
              {PAST_DESTINATIONS.join(" · ")} and more.
            </p>
            <Link
              href="/locations"
              className="group -my-1.5 mt-7 inline-flex items-baseline gap-3 py-1.5 text-action font-semibold uppercase tracking-eyebrow text-text"
            >
              <span className="border-b border-primary pb-1.5 transition-colors duration-300 ease-soft group-hover:border-text">
                Locations
              </span>
              <span aria-hidden className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1">
                &#8594;
              </span>
            </Link>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ---- 06 close ----------------------------------------------------------- */

function Close() {
  return (
    <section aria-labelledby="about-close" className="stripes py-16 md:py-24">
      <Container>
        <Reveal className="mx-auto max-w-[50rem] bg-cream px-7 py-14 text-center sm:px-12 md:py-18">
          <h2 id="about-close" className="heading-script text-[2.4rem] leading-[1.1] text-primary sm:text-[3.2rem] md:text-[3.8rem]">
            {forScript(CLOSING.heading)}
          </h2>
          <p className="mx-auto mt-6 max-w-[30rem] text-lead leading-[1.7] text-text">{CLOSING.body}</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/events"
              className="inline-flex min-h-12 items-center rounded-sm bg-primary px-7 text-action font-semibold uppercase tracking-eyebrow text-on-primary press-in transition-colors duration-300 ease-soft hover:bg-primary/90"
            >
              Explore experiences
            </Link>
            <Link
              href="/private-events"
              className="inline-flex min-h-12 items-center rounded-sm border border-text px-7 text-action font-semibold uppercase tracking-eyebrow text-text transition-colors duration-300 ease-soft hover:bg-text hover:text-cream"
            >
              Plan a private event
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
