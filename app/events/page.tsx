import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { EventIndexEntry } from "@/components/workshops/EventIndexEntry";
import { buildMetadata } from "@/lib/seo";
import { getAllWorkshops } from "@/lib/workshops";
import type { Workshop } from "@/types";

// TODO(content): final SEO title and description pending client copy.
export const metadata = buildMetadata({
  title: "Events",
  description:
    "Every upcoming Maison Palettia event — pottery, painting and craft, at fixed times in malls across Dubai. Find a date, see the location, keep a place.",
  path: "/events",
});

const HEADING_LINE =
  "block font-light uppercase leading-[0.98] tracking-[-0.02em] " +
  "text-[2.25rem] xs:text-[2.75rem] sm:text-[3.25rem] md:text-[3rem] lg:text-[3.75rem] xl:text-[4.25rem]";

/**
 * The programme — every scheduled session. Step one of the booking journey:
 * discover, understand, reserve, pay.
 *
 * This page was a scaffold reading "the design for this page arrives in Phase
 * 5", and every booking call to action on the site pointed at it.
 *
 * It is a catalogue, not a repeat of the homepage. The homepage section gives
 * three dates equal weight as full-bleed blocks because it has to sell the
 * idea of booking at all; someone who has arrived here has already decided to
 * look at the programme, so the page behaves like an index — plates at varying
 * proportions crossing back and forth down the measure, each with its facts
 * set beside it as a wall label.
 *
 * NO FILTER, deliberately. The data holds three sessions at three different
 * malls, so a filter bar would offer three controls returning one result each
 * — furniture that makes a programme look like an admin tool. The fields are
 * already shaped for it (`venue.name`, `category`); the control belongs with
 * the volume that needs it.
 *
 * Server component; data comes through the same seam as everywhere else.
 */
export default async function WorkshopsPage() {
  const workshops = await getAllWorkshops();

  // The <main> landmark lives in the root layout; this is only the measure.
  return (
    <Container className="py-[5rem] md:py-section lg:py-section-lg">
      <PageHead count={workshops.length} />
      {workshops.length === 0 ? <NoSessions /> : <Index workshops={workshops} />}
    </Container>
  );
}

function PageHead({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-12 items-end gap-x-6 lg:gap-x-10">
      <div className="col-span-12 md:col-span-7">
        <Reveal>
          <p className="flex items-center gap-4 text-xs font-medium uppercase tracking-eyebrow text-text">
            <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
            The programme
          </p>
        </Reveal>

        <h1 className="mt-8 md:mt-11 lg:mt-14">
          <Stagger>
            <HeadingLine>Upcoming</HeadingLine> <HeadingLine>events.</HeadingLine>
          </Stagger>
        </h1>
      </div>

      <Reveal
        delay={0.2}
        className="col-span-12 mt-8 md:col-span-5 md:col-start-8 md:mt-0 md:pb-2 lg:col-span-4 lg:col-start-9"
      >
        <p className="max-w-[26rem] text-[0.95rem] leading-[1.85] text-text/80">
          We bring the studio to a mall near you and run at fixed times. Everything is
          provided — bring nothing but yourself.
        </p>
        {/*
          A count, not a claim. The one number on the page and it is simply
          true, which is the register this whole route holds.
        */}
        <p className="mt-6 text-[0.68rem] font-medium uppercase tracking-eyebrow text-text/75">
          {count} {count === 1 ? "event" : "events"} scheduled
        </p>
      </Reveal>
    </div>
  );
}

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
 * The index, grouped by month.
 *
 * The month heading is derived rather than stored, and appears only where the
 * month actually changes — a programme running entirely inside October gets
 * one heading, one running across a season gets the dividers that make it
 * navigable. Each month is its own section under its own heading, which lets a
 * screen reader announce "October 2026, list of 4 events" rather than one
 * undifferentiated run.
 */
function Index({ workshops }: { workshops: Workshop[] }) {
  const months = groupByMonth(workshops);

  return (
    <div className="mt-16 md:mt-24 lg:mt-28">
      {months.map(({ label, id, events }) => (
        <section key={id} aria-labelledby={id} className="mt-20 first:mt-0 md:mt-28">
          <Reveal>
            <h2
              id={id}
              className="border-t border-line pt-6 text-[0.68rem] font-medium uppercase tracking-eyebrow text-text/75"
            >
              {label}
            </h2>
          </Reveal>

          <ol className="mt-14 flex flex-col gap-20 md:mt-16 md:gap-28 lg:gap-32">
            {events.map(({ workshop, position }) => (
              <li key={workshop.slug}>
                <EventIndexEntry workshop={workshop} index={position} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/**
 * "October 2026" — the heading a month of sessions sits under.
 *
 * Each session carries its position in the whole programme rather than its
 * position within its month, because the index uses that number for two things
 * that must not restart at a month boundary: the printed ordinal, and which
 * side of the page the plate takes. Counting during render instead would mean
 * mutating a variable while React is drawing, which is exactly the kind of
 * thing that survives development and breaks under a re-render.
 */
type MonthGroup = {
  label: string;
  id: string;
  events: { workshop: Workshop; position: number }[];
};

function groupByMonth(workshops: Workshop[]): MonthGroup[] {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dubai",
  });

  const months: MonthGroup[] = [];

  workshops.forEach((workshop, position) => {
    const label = formatter.format(new Date(workshop.startsAt));
    const last = months.at(-1);
    if (last?.label === label) last.events.push({ workshop, position });
    else
      months.push({
        label,
        id: `month-${label.toLowerCase().replace(/\s+/g, "-")}`,
        events: [{ workshop, position }],
      });
  });

  return months;
}

/** Nothing scheduled. The page keeps its shape and says so plainly. */
function NoSessions() {
  return (
    <Reveal className="mt-16 border-t border-line pt-12 md:mt-24 md:pt-16">
      <p className="max-w-[30rem] text-[1.5rem] font-light leading-[1.25] tracking-[-0.015em] md:text-[1.75rem]">
        The next dates are being set.
      </p>
      <p className="mt-5 max-w-[32rem] text-[0.95rem] leading-[1.85] text-text/75">
        New events are announced as each mall is confirmed.
      </p>
    </Reveal>
  );
}
