import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { ExperienceIndex } from "@/components/sections/ExperienceIndex";
import { Container } from "@/components/ui/Container";
import { Signature } from "@/components/ui/Signature";
import { getCreativeExperiences } from "@/lib/experiences";

/**
 * The section heading, in two masked lines.
 *
 * "creative side." is the line that sets the ceiling and must never wrap or
 * hyphenate. It stays the largest type in the section, and the redesign below
 * makes that unambiguous rather than contested: the activity names have come
 * down to wall-label scale, so the statement heads the hang the way the
 * reference's own section title does.
 */
const HEADING_LINE =
  "block font-light uppercase leading-[0.95] tracking-[-0.025em] " +
  "text-[2.3rem] xs:text-[2.75rem] sm:text-[3.4rem] md:text-[3.2rem] lg:text-[3.8rem] xl:text-[4.4rem]";

/**
 * Homepage section 05 — creative experiences.
 *
 * The section before this one answers "what does it feel like?"; this answers
 * "what can I actually do?", and it answers it as a hang: every experience
 * gets a row, a wall label and — where one exists — its own photograph, with
 * the label holding at the top of the window while the picture passes it. See
 * <ExperienceIndex> for the grammar, which is Goodman Gallery's exhibitions
 * index adapted to this palette, and for what happens to the two activities
 * that have no photograph yet.
 *
 * IT SHOWS ACTIVITIES, NOT STRANDS. It used to read `getDisciplines()` —
 * Paint, Shape, Craft, Create. Those are categories, and a visitor reading
 * "Craft" learns nothing about how they would spend an afternoon;
 * "Bedazzling" and "Candle making" are the answer to the question this section
 * asks. The strands keep their place on /about, where describing a range is
 * the job. See lib/experiences.ts.
 *
 * THE MASTHEAD IS A SPREAD, and now a squarer one than it was. The label runs
 * across the top; under it the statement holds the left and the paragraph and
 * the signature hold the right, both starting at the same line. That is the
 * reference's own head — title left, its meta set small and level on the right
 * — and it replaces an arrangement where the right column was dropped 7.5rem
 * down the page to sit beside the statement's foot. Levelling the two closes a
 * pocket of empty upper-right that read as a gap rather than as space, and
 * lets the index start higher.
 *
 * Awaited in place rather than suspended, for the reason set out in
 * <UpcomingEvents>: a boundary would strand a JavaScript-less visitor on the
 * fallback, and the root layout works hard to avoid exactly that.
 *
 * Server component throughout — the index is one too, now that it no longer
 * tracks an active row. Every animation lives in the motion primitives.
 */
export async function CreativeExperiences() {
  const experiences = await getCreativeExperiences();
  if (experiences.length === 0) return null;

  return (
    <section
      aria-labelledby="creative-experiences-heading"
      className="bg-sage py-[5.5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <SectionHead />
        <ExperienceIndex experiences={experiences} />

        {/*
          The closing link. It sits under the rule that closes the index rather
          than inside a column of its own: the list now runs the full measure,
          so there is no half-empty half for it to float in.
        */}
        <Reveal variant="fadeIn">
          <Link
            href="/events"
            className="group mt-12 inline-flex items-center gap-3 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text lg:mt-14"
          >
            <span className="border-b border-primary/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-primary">
              Explore all experiences
            </span>
            <span
              aria-hidden
              className="text-primary transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
            >
              &#8594;
            </span>
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}

/**
 * The label across the top, then the statement and its meta on one line.
 *
 * The signature is a note beside the heading rather than a heading of its own
 * — Deep Lilac on the sage, letterspaced wide enough to read as signage. See
 * <Signature> for why the ink is not a free choice. It follows the paragraph
 * here so the right column reads top-down as sentence then mark, and so the
 * two largest things in the masthead sit at opposite ends of it.
 */
function SectionHead() {
  return (
    <div>
      <Reveal>
        <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
          {/* Deep Lilac rather than the Terracotta the warm-ground sections
              use: Terracotta on Light Sage measures 2.36:1, under the 3:1 a
              graphical mark owes, where Deep Lilac clears it at 3.83:1. */}
          <span aria-hidden className="h-px w-9 shrink-0 bg-primary md:w-12" />
          Creative Experiences
        </p>
      </Reveal>

      <div className="mt-8 grid grid-cols-12 items-start gap-x-6 md:mt-10 lg:mt-12 lg:gap-x-12">
        <h2 id="creative-experiences-heading" className="col-span-12 lg:col-span-7">
          {/* Two lines, one trigger. The explicit space keeps the accessible
              name reading as a sentence rather than one run-on word. */}
          <Stagger>
            <HeadingLine>Explore your</HeadingLine> <HeadingLine>creative side.</HeadingLine>
          </Stagger>
        </h2>

        <div className="col-span-12 mt-8 lg:col-span-4 lg:col-start-9 lg:mt-0">
          <Reveal delay={0.15}>
            {/* 5.38:1 on the sage. */}
            <p className="max-w-[32rem] text-body leading-[1.85] text-text/80">
              From colour and pattern to hands-on making, discover experiences designed to bring
              your ideas to life.
            </p>
          </Reveal>

          <Reveal variant="fadeIn" delay={0.25}>
            <Signature ground="sage" className="mt-8 lg:mt-10">
              where to begin
            </Signature>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

/** One masked line of the heading. The mask needs its own overflow parent. */
function HeadingLine({ children }: { children: string }) {
  return (
    <span className="block overflow-hidden pb-[0.12em] [&+span]:-mt-[0.12em]">
      <Reveal as="span" variant="maskUp" className={HEADING_LINE}>
        {children}
      </Reveal>
    </span>
  );
}
