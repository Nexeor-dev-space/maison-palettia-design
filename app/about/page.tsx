import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { LittleCreators } from "@/components/sections/LittleCreators";
import { INK } from "@/components/sections/hero/composition";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { Eyebrow, forScript } from "@/components/ui/SectionHeader";
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
 * ==========================================================================
 * THE HOMEPAGE'S LANGUAGE, NOT THE HOMEPAGE'S LAYOUT
 * ==========================================================================
 *
 * This page was built before the homepage was redesigned and it showed:
 * profiled against the new home page it had 3 script headings to its 17, 5
 * doodles to its 117, and `bg-surface` — the near-white — as its dominant
 * ground where the homepage is Light Sage paper throughout. It read as a
 * different website.
 *
 * What it takes from the homepage is the VOCABULARY:
 *
 *   ONE PAPER.      Light Sage is the ground. White Rock and Deep Lilac are
 *                   objects laid on it — fields, plates, a closing panel —
 *                   never a new page colour. The homepage alternates nothing.
 *   SCRIPT SPEAKS.  Hapsha carries the statements a person would say out
 *                   loud; Montserrat carries everything a person has to use.
 *   DOODLES PUNCTUATE. They break an edge or mark an entry. None floats in
 *                   clear space, which is the one thing the deck never does.
 *   OBJECTS, NOT CARDS. Flush colour fields meeting on a hard seam, plates
 *                   at different sizes and angles — not a grid of boxes with
 *                   one radius and one shadow.
 *
 * What it does NOT take is the composition. The homepage opens on a
 * photograph, runs a carousel, holds a fixed picture and closes on a totem.
 * None of that is here. This page is a story told in six beats and its own
 * devices are a two-field statement, a threaded timeline and an offset
 * collage — so the two pages are unmistakably one brand and plainly not the
 * same page.
 *
 * THE WORDS ARE UNCHANGED. Every sentence is lib/brand.ts, the deck's own —
 * welcome and story (p.2), mission and vision (p.3), the community and how it
 * is made (p.4-5), what sets it apart (p.11), where it has created (p.12) and
 * the closing line (p.15). Nothing here is written for the website and no
 * claim, figure or programme detail has been added.
 */
export default function AboutPage() {
  return (
    <>
      <Welcome />
      <Purpose />
      <Community />
      {/*
        MOVED HERE FROM THE HOME PAGE, at the client's ask, and this is the
        beat it belongs to: <Community> above ends on the journey thread,
        whose last steps are family bonding and the community itself, and the
        little creators are who that is for. It also answers "Appeals to all
        ages" in <Apart> below before that section claims it.

        It keeps its own file rather than becoming another local function
        here: it carries three photographs, their alt text and its own
        placement rhythm, and none of that is about this page.
      */}
      <LittleCreators />
      <Apart />
      <Created />
      <Close />
    </>
  );
}

/* ---- 01 welcome ---------------------------------------------------------- */

/**
 * The opening, and it is deliberately only words.
 *
 * The homepage opens on a photograph the size of the window. If this page did
 * the same it would read as the same page with different copy, so it opens on
 * the one thing an about page has that a homepage does not: the sentence the
 * brand is named for. The tagline is set at script-hero — the largest type on
 * the site — and the story sits under it at a reading measure, dropped to the
 * right so the eye turns a corner instead of running straight down.
 *
 * `pt` is generous and the section carries nothing else. That empty half is
 * the "visual pause" doing a job: it is what makes the next section's colour
 * arrive as an event.
 */
function Welcome() {
  return (
    <section aria-labelledby="about-title" className="relative isolate overflow-hidden bg-sage">
      <Container className="relative py-[5.5rem] md:py-[7rem] lg:py-[8.5rem]">
        {/*
          Two marks, at the margins, each breaking an edge of the measure
          rather than floating in the middle of it. Hidden below `lg`, where
          the air they sit in does not exist.
        */}
        <Reveal
          delay={0.3}
          className="pointer-events-none absolute -right-4 top-[4.5rem] hidden w-[9rem] lg:block xl:w-[11rem]"
        >
          <DoodleMark name="wave" color={INK.lavender} treatment="draw" delay={320} />
        </Reveal>
        <Reveal
          delay={0.42}
          className="pointer-events-none absolute -left-6 bottom-[3rem] hidden w-[6.5rem] lg:block"
        >
          <DoodleMark name="starburst" color={INK.terracotta} treatment="draw" delay={460} />
        </Reveal>

        <Reveal>
          <Eyebrow>About the Maison</Eyebrow>
        </Reveal>

        {/*
          THE TAGLINE, AT THE SIZE IT IS WORTH.

          `pb-[0.3em]` is not decoration and it must stay on the element that
          carries the font-size: Hapsha's capitals and swashes stand about
          0.9em above the baseline against a 0.8em line box, so without the
          clearance the P and the C of the line below cut through the line
          above. Moved to a wrapper it resolves against 16px and fails again.
        */}
        <Reveal delay={0.08}>
          <h1
            id="about-title"
            className="heading-script mt-7 max-w-[15ch] pb-[0.3em] text-script-hero text-text md:mt-9"
          >
            {forScript(TAGLINE)}
          </h1>
        </Reveal>

        {/*
          The story, dropped and pushed right — the corner. One paragraph at a
          reading measure, because BRAND_STORY is one sentence of the deck's
          and breaking it into fragments is what made the homepage's own
          opening read as messy.
        */}
        <div className="mt-10 grid grid-cols-12 md:mt-14">
          <Reveal
            delay={0.16}
            className="col-span-12 md:col-span-9 md:col-start-4 lg:col-span-7 lg:col-start-6"
          >
            <p className="max-w-[46ch] text-[clamp(1.0625rem,0.98rem+0.42vw,1.3125rem)] font-light leading-[1.75] text-text">
              {BRAND_STORY}
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ---- 02 purpose ---------------------------------------------------------- */

/*
  The mission is set in the script and the vision is not, and that is the
  page's typographic rule doing its job rather than a preference.

  MISSION is one sentence somebody would say: "To inspire meaningful
  connections through the joy of creativity." VISION is a description of what
  the business intends to be — longer, and read rather than felt. Script for
  the first, Montserrat for the second.

  The line breaks are given rather than left to the measure, because where a
  statement turns is a design decision on this site. Checked against the
  source so a re-worded MISSION cannot silently ship as three wrong lines.
*/
const MISSION_LINES = ["To inspire meaningful", "connections through", "the joy of creativity."];

function missionLines(): readonly string[] {
  return MISSION_LINES.join(" ") === MISSION ? MISSION_LINES : [MISSION];
}

/**
 * Mission and vision as two fields meeting on a hard seam.
 *
 * One object, not two sections: the Deep Lilac and the White Rock share an
 * edge, a height and a radius, so the pair reads as a single thing laid on
 * the paper. It is the homepage's colour-field language — and it is not the
 * homepage's split screen, which runs full-bleed and edge to edge. This one
 * is held inside the measure and weighted 5/7, so the statement takes the
 * smaller, louder half and the explanation takes the larger, quieter one.
 */
function Purpose() {
  return (
    <section aria-labelledby="purpose-heading" className="bg-sage pb-[5rem] md:pb-section lg:pb-section-lg">
      <Container>
        <Reveal variant="fadeIn">
          <div className="relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem]">
            <div className="flex flex-col lg:min-h-[26rem] lg:flex-row">
              {/* The statement. Deep Lilac, with the one light ink that
                  clears 4.5:1 on it — see inkFor() in <SectionHeader>. */}
              <div className="flex flex-col justify-center bg-primary px-7 py-12 text-surface md:px-11 md:py-16 lg:w-[42%] lg:shrink-0 lg:px-12">
                <Eyebrow ground="lilac">Our mission</Eyebrow>
                <h2
                  id="purpose-heading"
                  className="heading-script mt-6 pb-[0.3em] text-script-compact leading-[1.22] text-surface"
                >
                  {missionLines().map((line) => (
                    <span key={line} className="block">
                      {forScript(line)}
                    </span>
                  ))}
                </h2>
              </div>

              {/* The explanation. White Rock, Montserrat, charcoal. */}
              <div className="relative flex flex-1 flex-col justify-center bg-cream px-7 py-12 md:px-11 md:py-16 lg:px-14">
                <Eyebrow>Our vision</Eyebrow>
                <p className="mt-6 max-w-[42ch] text-[clamp(1.0625rem,1rem+0.3vw,1.25rem)] font-light leading-[1.75] text-text">
                  {VISION}
                </p>
              </div>
            </div>

            {/*
              On the outer corner, not on the seam. A cut-out laid over a join
              reads as a sticker covering a joint rather than as the join
              being made well — which is why the homepage's own two-field
              object had its seam mark removed.
            */}
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-3 right-5 hidden w-[4.5rem] rotate-[-8deg] md:block lg:right-8 lg:w-[5.5rem]"
            >
              <DoodleMark name="splash" color={INK.lavender} treatment="stamp" delay={260} />
            </span>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ---- 03 community -------------------------------------------------------- */

/**
 * How the community is made — the page's one threaded passage.
 *
 * White Rock ground, which is the first change of paper on the page and
 * arrives after the pause in <Welcome> and the object in <Purpose>.
 *
 * The four steps of WORKSHOP_JOURNEY are a sequence — walk-in, scheduled,
 * family, community — so they are drawn as one: a single rule running down
 * the column with a mark on it at each step. The homepage sets the same four
 * as a deck spread; here they are a thread, because this page is telling the
 * story in order and that is the one device that says "in order" without a
 * numeral. (Numerals are also why: Hapsha's 7, 8 and 9 are placeholder marks,
 * so a numbered list in the script is not available to this site.)
 */
function Community() {
  return (
    <section
      aria-labelledby="community-about"
      className="relative isolate overflow-hidden bg-cream py-[5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <div className="grid grid-cols-12 gap-x-6 gap-y-14 lg:gap-x-12">
          {/* The claim. */}
          <div className="col-span-12 lg:col-span-5">
            <Reveal>
              <Eyebrow>The Maison experience</Eyebrow>
            </Reveal>

            <Reveal delay={0.06}>
              <h2
                id="community-about"
                className="heading-script mt-6 max-w-[14ch] pb-[0.3em] text-script-section text-text"
              >
                {forScript(COMMUNITY.heading)}
              </h2>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-6 max-w-[42ch] text-body leading-[1.85] text-text">
                {COMMUNITY.body}
              </p>
            </Reveal>

            {/* The closing line, in the script — it is the one sentence here
                that is a claim rather than a description. */}
            <Reveal delay={0.18}>
              <p className="heading-script mt-8 max-w-[18ch] pb-[0.3em] text-script-compact leading-[1.24] text-primary">
                {forScript(COMMUNITY.closer)}
              </p>
            </Reveal>
          </div>

          {/* The thread. */}
          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <Stagger>
              <ol className="relative">
                {/*
                  ONE RULE FOR THE WHOLE COLUMN, drawn once behind the items
                  rather than as a border on each. A per-item border leaves a
                  hairline gap at every join and the thread stops looking
                  continuous. It stops short of the last mark's centre so the
                  line ends ON the final step rather than running past it.
                */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-[calc(1.5rem+1px)] left-[1.4375rem] top-6 w-px bg-text/25"
                />

                {WORKSHOP_JOURNEY.map((step, i) => (
                  <li key={step.slug} className="relative flex gap-5 pb-10 last:pb-0 md:gap-6">
                    {/*
                      The node. A White Rock disc so the rule is broken rather
                      than crossed, with the mark inside it. Size the box, not
                      the mark — <DoodleMark> fills whatever it is given.
                    */}
                    <span
                      aria-hidden
                      className="relative z-10 mt-0.5 grid size-12 shrink-0 place-items-center rounded-pill bg-cream p-2.5"
                    >
                      <DoodleMark
                        name={JOURNEY_MARKS[i % JOURNEY_MARKS.length]}
                        color={JOURNEY_INKS[i % JOURNEY_INKS.length]}
                        treatment="draw"
                        delay={200 + i * 120}
                      />
                    </span>

                    <div className="pt-1.5">
                      <h3 className="text-[1.0625rem] font-semibold leading-snug text-text md:text-lead">
                        {step.name}
                      </h3>
                      <p className="mt-2 max-w-[38ch] text-body leading-[1.8] text-text/85">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Stagger>
          </div>
        </div>
      </Container>
    </section>
  );
}

/*
  The marks the thread uses, and the inks they are drawn in.

  Kept as lists indexed by position rather than hung off each step's slug: the
  steps come from lib/brand.ts and a fifth one added there should not have to
  remember to add itself here. White Rock is not in the ink list — the nodes
  sit on a White Rock ground and a White Rock cut-out on it is an empty disc.
*/
const JOURNEY_MARKS: readonly DoodleName[] = ["starleaf", "splash", "starburst", "wave"];
const JOURNEY_INKS: readonly string[] = [INK.terracotta, INK.lilac, INK.lavender, INK.terracotta];

/* ---- 04 apart ------------------------------------------------------------ */

/**
 * What sets the Maison apart — four points, set as an editorial list.
 *
 * NOT FOUR CARDS. Four equal boxes in a row is the composition the brief
 * calls a card website, and it is also the least useful arrangement for this
 * content: the points are not parallel options a visitor chooses between,
 * they are four things to read. So they run down the page as entries, each
 * indented a little further than the last, with the mark in the margin.
 *
 * The stagger of the indent is the whole device — it gives the eye a
 * left-hand edge that moves, which is the asymmetry the homepage gets from
 * its collages, in a section that has no photographs to offset.
 */
function Apart() {
  return (
    <section aria-labelledby="apart-heading" className="bg-sage py-[5rem] md:py-section lg:py-section-lg">
      <Container>
        <div className="max-w-[30ch]">
          <Reveal>
            <Eyebrow>What sets us apart</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <h2
              id="apart-heading"
              className="heading-script mt-6 pb-[0.3em] text-script-section text-text"
            >
              {forScript("Why it feels different")}
            </h2>
          </Reveal>
        </div>

        <Stagger className="mt-12 md:mt-16">
          <ul>
            {WHAT_SETS_US_APART.map((point, i) => (
              <li
                key={point.slug}
                /*
                  The moving left edge. Four steps of indent at `lg`, none
                  below it — on a phone the indent would eat the measure and
                  the list would read as badly aligned rather than as placed.
                */
                className={INDENTS[i % INDENTS.length]}
              >
                <article className="flex gap-5 border-t border-text/20 py-7 md:gap-7 md:py-9">
                  <span aria-hidden className="mt-1 block w-9 shrink-0 md:w-11">
                    <DoodleMark
                      name={APART_MARKS[i % APART_MARKS.length]}
                      color={APART_INKS[i % APART_INKS.length]}
                      treatment="draw"
                      delay={180 + i * 130}
                    />
                  </span>

                  <div>
                    <h3 className="text-[1.125rem] font-semibold leading-snug text-text md:text-h3 md:font-medium">
                      {point.name}
                    </h3>
                    <p className="mt-2.5 max-w-[46ch] text-body leading-[1.8] text-text/85">
                      {point.description}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </Stagger>
      </Container>
    </section>
  );
}

const INDENTS = ["lg:ml-0", "lg:ml-[7%]", "lg:ml-[14%]", "lg:ml-[21%]"] as const;
const APART_MARKS: readonly DoodleName[] = ["starburst", "splash", "starleaf", "wave"];
const APART_INKS: readonly string[] = [INK.lilac, INK.terracotta, INK.lavender, INK.lilac];

/* ---- 05 created ---------------------------------------------------------- */

/**
 * Where the Maison has created — the plates, and the places.
 *
 * An offset collage rather than a row of equal thumbnails: three photographs
 * at their own sizes, dropped and turned by a little, which is the homepage's
 * treatment of its own real photographs. The angles and offsets are derived
 * from the index so they are stable between renders — a random tilt on every
 * paint is the "constant floating" the brief rules out.
 *
 * PAST_DESTINATIONS is set as a run of names rather than a list of chips.
 * They are places the Maison has been, and a typographic run reads as a
 * record where a grid of pills reads as a filter you can press.
 */
function Created() {
  return (
    <section
      aria-labelledby="created-heading"
      className="relative isolate overflow-hidden bg-sage pb-[5rem] md:pb-section lg:pb-section-lg"
    >
      <Container>
        <div className="grid grid-cols-12 items-center gap-x-6 gap-y-12 lg:gap-x-12">
          {/* The collage. */}
          <div className="col-span-12 lg:col-span-7">
            <Stagger>
              <div className="flex items-start justify-center gap-4 md:gap-6 lg:justify-start">
                {EVENT_PLATES.map((plate, i) => (
                  <figure
                    key={plate.src}
                    className={`relative overflow-hidden rounded-[0.875rem] bg-cream md:rounded-[1.125rem] ${PLATE_SIZES[i % PLATE_SIZES.length]}`}
                  >
                    <Image
                      src={plate.src}
                      alt={plate.alt}
                      width={plate.width}
                      height={plate.height}
                      sizes="(min-width: 1024px) 22vw, 30vw"
                      className="h-full w-full object-cover"
                    />
                  </figure>
                ))}
              </div>
            </Stagger>
          </div>

          {/* The record. */}
          <div className="col-span-12 lg:col-span-5">
            <Reveal>
              <Eyebrow>Where we have created</Eyebrow>
            </Reveal>
            <Reveal delay={0.06}>
              <h2
                id="created-heading"
                className="heading-script mt-6 max-w-[13ch] pb-[0.3em] text-script-compact text-text"
              >
                {forScript("Tables we have set up")}
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-6 max-w-[38ch] text-body leading-[1.85] text-text/85">
                {PAST_DESTINATIONS.join(" · ")} and more.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              {/* The nav bar's own hover language: no rule at rest, a
                  hairline wiping in from the left. */}
              <Link
                href="/locations"
                className="group/nav mt-7 inline-flex items-center gap-2 text-action font-semibold uppercase tracking-eyebrow text-primary"
              >
                <span className="relative inline-block pb-1.5">
                  Find a studio
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-0 top-full -mt-1 block h-px w-full origin-right scale-x-0 bg-current transition-transform duration-[380ms] ease-editorial group-hover/nav:origin-left group-hover/nav:scale-x-100 group-focus-visible/nav:origin-left group-focus-visible/nav:scale-x-100 motion-reduce:transition-none"
                  />
                </span>
                <span
                  aria-hidden
                  className="transition-transform duration-500 ease-editorial motion-safe:group-hover/nav:translate-x-1"
                >
                  &rarr;
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

/*
  The plates' sizes and their turn. Three different shapes at three different
  heights, so the row has a top edge that moves — a collage rather than a
  strip. Fixed per position and derived from nothing at render time.
*/
const PLATE_SIZES = [
  "w-[34%] rotate-[-3deg] md:w-[32%]",
  "mt-8 w-[30%] rotate-[2deg] md:mt-12 md:w-[28%]",
  "mt-3 w-[32%] rotate-[-1.5deg] md:w-[30%]",
] as const;

/* ---- 06 close ------------------------------------------------------------ */

/**
 * The deck's closing line, on a Deep Lilac field.
 *
 * The one full field of colour on the page, and it is at the end on purpose:
 * the page has been Light Sage paper with two objects on it, so the last beat
 * being entirely a colour is what makes it read as a close rather than as
 * another section. The homepage closes on the same words over its own paper,
 * which is the point — same sentence, same brand, different ending.
 */
function Close() {
  return (
    <section aria-labelledby="about-close" className="relative isolate overflow-hidden bg-primary">
      <Container className="relative py-[5rem] text-center md:py-section lg:py-[7rem]">
        {/* Soft Lavender and White Rock only: on Deep Lilac, terracotta is
            2.0:1 and the lilac marks disappear into the ground entirely. */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-[6%] top-10 hidden w-[5rem] rotate-[-10deg] md:block"
        >
          <DoodleMark name="starburst" color={INK.lavender} treatment="draw" delay={300} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-10 right-[7%] hidden w-[4.5rem] rotate-[8deg] md:block"
        >
          <DoodleMark name="splash" color={INK.whiteRock} treatment="draw" delay={420} />
        </span>

        <Reveal>
          <h2
            id="about-close"
            className="heading-script mx-auto max-w-[16ch] pb-[0.3em] text-script-section text-surface"
          >
            {forScript(CLOSING.heading)}
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <p className="mx-auto mt-5 max-w-[34ch] text-lead leading-[1.7] text-surface">
            {CLOSING.body}
          </p>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
            {/* `cream` is the tone for a button standing ON Deep Lilac — a
                lilac one cannot be seen at all. See <BlobButton>. */}
            <BlobButton href="/events" tone="cream" className="min-h-[3.25rem] px-8">
              Explore experiences
            </BlobButton>

            <Link
              href="/private-events"
              className="group/nav inline-flex min-h-12 items-center text-action font-semibold uppercase tracking-eyebrow text-surface"
            >
              <span className="relative inline-block pb-1.5">
                Plan a private event
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-0 top-full -mt-1 block h-px w-full origin-right scale-x-0 bg-current transition-transform duration-[380ms] ease-editorial group-hover/nav:origin-left group-hover/nav:scale-x-100 group-focus-visible/nav:origin-left group-focus-visible/nav:scale-x-100 motion-reduce:transition-none"
                />
              </span>
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
