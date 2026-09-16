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
 * hyphenate. It stays the largest type in the section by a clear margin: 70px
 * at `xl` against the 36px the activity names take at their largest, so the
 * statement heads the hang the way the reference's own section title does even
 * now the names have gone back up a step. See NAME in <ExperienceIndex>.
 */
const HEADING_LINE =
  "block font-light uppercase leading-[0.95] tracking-[-0.025em] " +
  "text-[2.3rem] xs:text-[2.75rem] sm:text-[3.4rem] md:text-[3.2rem] lg:text-[3.8rem] xl:text-[4.4rem]";

/**
 * Homepage section 05 — creative experiences.
 *
 * The section before this one answers "what does it feel like?"; this answers
 * "what can I actually do?", and it answers it as a hang: every experience
 * gets a row, a compact wall label at the top of one half and — where one
 * exists — a very large photograph filling the other, sides alternating down
 * the run. See <ExperienceIndex> for the grammar, which is Goodman Gallery's
 * exhibitions index adapted to this palette, and for what happens to the two
 * activities that have no photograph yet.
 *
 * THREE THINGS THE CLIENT ASKED FOR, AND THE TWO OF THEM THAT LIVE HERE. The
 * rules between rows and the bigger pictures are <ExperienceIndex>'s business;
 * the ground is this file's. The section was set on full-strength Light Sage —
 * a brand field a section takes deliberately, per the note on `--color-surface`
 * in globals.css — and it now takes the page ground like the listing directly
 * above it. That is not only a colour: Light Sage is a ground that holds muted
 * ink to a `text-text/75` floor and puts Deep Lilac at 3.83:1, where the page
 * surface allows /70 and lifts Deep Lilac to 4.90. Every ink note below and in
 * <ExperienceIndex> was re-measured against the new ground rather than carried
 * over, and one consequence is that the "View activity" affordance on each row
 * can be 12px Deep Lilac copy at all.
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
      /*
        `bg-surface`, which is the page's own ground and is therefore the same
        thing as having no background at all — written out rather than left off
        because a section with no ground of its own is transparent, and the
        homepage stacks this one over a sticky hero film. <UpcomingEvents>
        directly above takes the identical token for the identical reason. See
        the note at the head of this file for what the colour was and why it
        has gone.
      */
      className="bg-surface py-[5.5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <SectionHead />
        <ExperienceIndex experiences={experiences} />

        {/*
          The closing link. It sits under the last row rather than inside a
          column of its own: the rows run the full measure, so there is no
          half-empty half for it to float in. It is also the section's only
          remaining link to the whole listing — each row now points at its own
          activity's page, so this one has to stay distinct from them, which is
          why it keeps the charcoal-and-underline treatment where the rows'
          affordance is Deep Lilac.
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
 * — Deep Lilac, now on the page ground rather than on Light Sage: `ground` is
 * "warm" for that reason, and both grounds happen to resolve to the same ink,
 * so nothing moves on screen and the component is simply telling the truth
 * about what it is printed on. Letterspaced wide enough to read as signage. See
 * <Signature> for why the ink is not a free choice. It follows the paragraph
 * here so the right column reads top-down as sentence then mark, and so the
 * two largest things in the masthead sit at opposite ends of it.
 */
function SectionHead() {
  return (
    <div>
      <Reveal>
        <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
          {/* Deep Lilac, and it stays Deep Lilac now the ground has changed.
              On the page surface Terracotta measures 3.02:1 — it would scrape
              the 3:1 a graphical mark owes rather than fail it, as it did at
              2.36 on Light Sage — but the mark ties this eyebrow to the band
              labels below it and to the accent the rest of the section is set
              in, and Deep Lilac clears the same bar at 4.90. */}
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
            {/* The ground moved and the floor moved with it: muted ink owes
                `text-text/75` on Light Sage, where /70 measures 4.14 and
                fails, and only /70 on the page surface, where it measures
                4.70. /80 was safe on the old ground and is comfortably clear
                on this one. */}
            <p className="max-w-[32rem] text-body leading-[1.85] text-text/80">
              From colour and pattern to hands-on making, discover experiences designed to bring
              your ideas to life.
            </p>
          </Reveal>

          <Reveal variant="fadeIn" delay={0.25}>
            <Signature ground="warm" className="mt-8 lg:mt-10">
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
