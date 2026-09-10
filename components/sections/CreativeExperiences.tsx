import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { StrandIndex } from "@/components/sections/StrandIndex";
import { Container } from "@/components/ui/Container";
import { Signature } from "@/components/ui/Signature";
import { getDisciplines } from "@/lib/disciplines";

/**
 * The section heading, in two masked lines.
 *
 * Set smaller than the strand names below it on purpose — see the note on
 * `NAME` in <StrandIndex>. "creative side." is the line that sets the ceiling
 * and must never wrap or hyphenate.
 */
const HEADING_LINE =
  "block font-light uppercase leading-[0.98] tracking-[-0.02em] " +
  "text-[1.9rem] xs:text-[2.2rem] sm:text-[2.6rem] md:text-[2.5rem] lg:text-[2.9rem] xl:text-[3.2rem]";

/**
 * Homepage section 05 — creative experiences.
 *
 * The section before this one answers "what does it feel like?"; this answers
 * "what can I explore?", and it does it as an index rather than as a display.
 * Four strands run down the page as a numbered list, and one arched window
 * holds beside them and changes what is behind it as each comes level — the
 * Maison's own entrance, used as the single door that all four lead through.
 * See <StrandIndex> for the mechanism and for what happens on a narrow screen.
 *
 * This replaced a hang of four photographs at four different sizes scattered
 * across a twelve-column grid. The idea was that no two plates should read as
 * the same object; what it produced was three thousand pixels of section for
 * four sentences of content, with the empty quarters reading as omissions
 * rather than as space. An index is the honest shape for four short entries:
 * it is scannable, it is a third of the height, and the one photograph that is
 * showing gets a frame worth looking at instead of four competing for the
 * page.
 *
 * The masthead is a spread rather than a stack. The label and the statement
 * hold the left; the signature and the one paragraph the section gets sit off
 * to the right and lower, so the eye crosses the measure before it starts down
 * the list.
 *
 * Awaited in place rather than suspended, for the reason set out in
 * <UpcomingWorkshops>: a boundary would strand a JavaScript-less visitor on
 * the fallback, and the root layout works hard to avoid exactly that.
 *
 * Server component; the index and every animation live in the client
 * components it composes.
 */
export async function CreativeExperiences() {
  const disciplines = await getDisciplines();
  if (disciplines.length === 0) return null;

  return (
    <section
      aria-labelledby="creative-experiences-heading"
      className="bg-sage py-[5.5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <SectionHead />
        <StrandIndex disciplines={disciplines} />

        {/*
          The closing link sits under the list rather than under the whole
          grid, so it lands beneath the last strand's rule and closes the
          index instead of floating in the empty half beside the window.
        */}
        <div className="grid grid-cols-12 gap-x-6 lg:gap-x-12">
          <Reveal variant="fadeIn" className="col-span-12 mt-12 lg:col-span-7 lg:mt-16">
            <Link
              href="/workshops"
              className="group inline-flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-text"
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
        </div>
      </Container>
    </section>
  );
}

/**
 * Label and statement on the left, the signature and the paragraph carried
 * across to the right and dropped below the statement's baseline. Two edges,
 * two heights: the masthead is a spread, and the space in the upper right is
 * the shape of it rather than a gap.
 */
function SectionHead() {
  return (
    <div className="grid grid-cols-12 items-start gap-x-6 lg:gap-x-12">
      <div className="col-span-12 lg:col-span-7">
        <Reveal>
          <p className="flex items-center gap-4 text-xs font-medium uppercase tracking-eyebrow text-text">
            {/* Deep Lilac rather than the Terracotta the warm-ground sections
                use: Terracotta on Light Sage measures 2.36:1, under the 3:1 a
                graphical mark owes, where Deep Lilac clears it at 3.83:1. */}
            <span aria-hidden className="h-px w-9 shrink-0 bg-primary md:w-12" />
            Creative Experiences
          </p>
        </Reveal>

        <h2 id="creative-experiences-heading" className="mt-8 md:mt-10 lg:mt-12">
          {/* Two lines, one trigger. The explicit space keeps the accessible
              name reading as a sentence rather than one run-on word. */}
          <Stagger>
            <HeadingLine>Explore your</HeadingLine> <HeadingLine>creative side.</HeadingLine>
          </Stagger>
        </h2>
      </div>

      <div className="col-span-12 mt-10 lg:col-span-4 lg:col-start-9 lg:mt-[7.5rem]">
        {/*
          A note beside the heading, not a heading of its own. Deep Lilac on
          the sage, letterspaced wide enough to read as signage rather than as
          a label — see <Signature> for why the ink is not a free choice.
        */}
        <Reveal variant="fadeIn" delay={0.25}>
          <Signature ground="sage">where to begin</Signature>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="mt-6 max-w-[26rem] text-[0.95rem] leading-[1.85] text-text/80 md:mt-7">
            From colour and clay to hands-on making, discover experiences designed to bring
            your ideas to life.
          </p>
        </Reveal>
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
