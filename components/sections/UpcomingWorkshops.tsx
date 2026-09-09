import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { WorkshopEntry } from "@/components/workshops/WorkshopEntry";
import { WorkshopFeature } from "@/components/workshops/WorkshopFeature";
import { getUpcomingWorkshops } from "@/lib/workshops";
import type { Workshop } from "@/types";

/**
 * The heading, in two masked lines. Deliberately a step below the brand
 * statement above it: that section makes the argument, this one opens the
 * programme, and the type sizes have to say which is which.
 */
const HEADING_LINE =
  "block font-light uppercase leading-[0.98] tracking-[-0.02em] " +
  "text-[2rem] xs:text-[2.4rem] sm:text-[2.9rem] md:text-[2.6rem] lg:text-[3.25rem] xl:text-[3.75rem]";

/**
 * Homepage section 03 — upcoming workshops.
 *
 * The first thing on the page a visitor can actually do. Hero and brand
 * introduction establish that Maison Palettia is a place where things get
 * made; this answers "made how, and when can I come".
 *
 * It is a collection, not a grid. One workshop is given the room of a plate on
 * a gallery wall and runs off the left edge of the measure; the other two are
 * set below it at different sizes, different proportions and different
 * heights, with an empty column between them. Nothing shares a baseline and
 * nothing shares a card, which is the whole difference between a curated
 * programme and a booking engine.
 *
 * The composition answers the section above it. There, the text stepped
 * rightward and the photograph sat high on the right; here the photograph is
 * the thing that breaks the measure, and it breaks it the other way.
 *
 * Server component, awaited in place rather than wrapped in <Suspense>.
 *
 * A boundary here would be the obvious move once the data is remote, and
 * <WorkshopsSkeleton> is written and waiting for it — but it is not free. React
 * streams a suspended boundary's content at the end of the document and swaps
 * it in with an inline script, so a visitor or crawler without JavaScript is
 * left holding the skeleton for good. The root layout already carries a
 * <noscript> rule to keep the scroll reveals from hiding this page from that
 * audience; quietly reintroducing the same hole one section later would undo
 * it. Awaiting costs nothing while the data is local, and the trade is worth
 * making again deliberately when a real CMS call is on the other side.
 */
export async function UpcomingWorkshops() {
  const workshops = await getUpcomingWorkshops();

  return (
    <section
      aria-labelledby="upcoming-workshops-heading"
      className="bg-surface py-[5.5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <SectionHead />
        <WorkshopCollection workshops={workshops} />
      </Container>
    </section>
  );
}

/**
 * Label and heading left, introduction right and dropped to sit on the
 * heading's last line — a spread rather than a centred stack.
 */
function SectionHead() {
  return (
    <div className="grid grid-cols-12 items-end gap-x-6 lg:gap-x-10">
      <div className="col-span-12 md:col-span-6 lg:col-span-7">
        <Reveal>
          <p className="flex items-center gap-4 text-xs font-medium uppercase tracking-eyebrow text-text">
            <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
            Upcoming Workshops
          </p>
        </Reveal>

        <h2 id="upcoming-workshops-heading" className="mt-8 md:mt-11 lg:mt-14">
          {/*
            Two lines, one trigger, each rising from behind its own mask — the
            same device as the brand statement, at a smaller scale. The
            explicit space keeps the accessible name reading as a sentence.
          */}
          <Stagger>
            <HeadingLine>Make time</HeadingLine>{" "}
            <HeadingLine>to create.</HeadingLine>
          </Stagger>
        </h2>
      </div>

      <Reveal
        delay={0.2}
        className="col-span-12 mt-8 md:col-span-5 md:col-start-8 md:mt-0 md:pb-2 lg:col-span-4 lg:col-start-9"
      >
        <p className="max-w-[26rem] text-[0.95rem] leading-[1.85] text-text/80">
          Discover hands-on experiences designed to slow down, explore your creativity, and
          make something beautiful.
        </p>
      </Reveal>
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

/**
 * The collection itself.
 *
 * An ordered list, because the order is the curation — the feature is first
 * and the numbering on screen says so.
 *
 * The two supporting entries are deliberately unequal: different columns,
 * different widths, different proportions and different top margins. Three
 * separate offsets rather than one, because a single stagger is easy to
 * cancel out — the taller entry simply catches up and the pair lands back on a
 * shared baseline, which is the row this section exists to avoid.
 */
function WorkshopCollection({ workshops }: { workshops: Workshop[] }) {
  if (workshops.length === 0) return <NoWorkshops />;

  const [feature, ...supporting] = workshops;
  const proportions = ["aspect-[4/5]", "aspect-square"];

  return (
    <>
      <ol className="mt-16 grid grid-cols-12 gap-x-6 md:mt-24 lg:mt-28 lg:gap-x-10">
        <li className="col-span-12">
          <WorkshopFeature workshop={feature} />
        </li>

        {supporting.map((workshop, i) => (
          <li
            key={workshop.slug}
            className={
              i === 0
                ? "col-span-12 mt-16 md:col-span-5 md:col-start-2 md:mt-24 lg:mt-28"
                : "col-span-12 mt-14 md:col-span-5 md:col-start-8 md:mt-44 lg:col-span-4 lg:col-start-9 lg:mt-64"
            }
          >
            <WorkshopEntry
              workshop={workshop}
              index={i + 2}
              aspect={proportions[i % proportions.length]}
              inset={i === 0 ? "right" : "left"}
              accent={i === 0}
            />
          </li>
        ))}
      </ol>

      <ViewAllLink className="mt-20 border-t border-line pt-8 md:mt-28 md:flex md:justify-end lg:mt-32" />
    </>
  );
}

/**
 * Nothing scheduled. The section keeps its shape and says so plainly rather
 * than leaving the outline of a collection with nothing in it.
 */
function NoWorkshops() {
  return (
    <Reveal className="mt-16 border-t border-line pt-12 md:mt-24 md:pt-16">
      <p className="max-w-[30rem] text-[1.5rem] font-light leading-[1.25] tracking-[-0.015em] md:text-[1.75rem]">
        New creative experiences are coming soon.
      </p>
      <p className="mt-5 max-w-[32rem] text-[0.95rem] leading-[1.85] text-text/75">
        Dates are added as each season is set. The full collection stays open to browse in the
        meantime.
      </p>
      <ViewAllLink className="mt-10" />
    </Reveal>
  );
}

/**
 * The way out of the section. A rule and a line of type — an invitation to
 * keep looking, not a second call to action competing with the feature's.
 */
function ViewAllLink({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Link
        href="/workshops"
        className="group inline-flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-text"
      >
        <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
          View all workshops
        </span>
        <span
          aria-hidden
          className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
        >
          &#8594;
        </span>
      </Link>
    </div>
  );
}
