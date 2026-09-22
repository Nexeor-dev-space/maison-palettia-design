import Link from "next/link";

import { EventsBrowser } from "@/components/events/EventsBrowser";
import { ExperiencePlate } from "@/components/events/ExperiencePlate";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { ModeMark } from "@/components/ui/ModeMark";
import { DisplayHeading, Eyebrow, ScriptTitle } from "@/components/ui/SectionHeader";
import { WORKSHOP_JOURNEY } from "@/lib/brand";
import { getCreativeExperiences } from "@/lib/experiences";
import { getMallPartners } from "@/lib/partners";
import { buildMetadata } from "@/lib/seo";
import { getAllWorkshops } from "@/lib/workshops";

export const metadata = buildMetadata({
  title: "Experiences",
  description:
    "Every Maison Palettia creative experience — walk-in DIY activities you can enjoy at your own pace, and guided scheduled sessions you book online for a set date.",
  path: "/events",
});

/**
 * /events — every experience, in the two groups the business runs on.
 *
 * WHAT WAS MISSING. This page listed the scheduled sessions and nothing else,
 * under the heading "Upcoming events". Five of the seven approved activities
 * are walk-in, and none of them appeared on the page the navigation calls
 * Experiences — a visitor who clicked it learned about two things the studio
 * does and not the other five. Its introduction also said the studio runs "in
 * malls across Dubai" and comes to "a mall near you", which overstates one
 * confirmed destination.
 *
 * TWO GROUPS, EACH ANCHORED. `#walk-in` and `#scheduled` are what the hero's
 * actions and the header's "Book a session" point at, so a visitor lands on
 * the half of the page their question belongs to. Walk-in comes first because
 * the deck lists it first (p.5); a visitor who came to book is taken straight
 * past it by the anchor.
 *
 * NOTHING ABOUT BOOKING CHANGED. The scheduled half is the existing
 * <EventsBrowser> — its filters, its cards, its links into the booking step —
 * given a heading. Walk-in activities are plates that open their own pages,
 * where no booking is ever offered.
 */
export default async function EventsPage() {
  const [experiences, workshops, partners] = await Promise.all([
    getCreativeExperiences(),
    getAllWorkshops(),
    getMallPartners(),
  ]);
  const walkIn = experiences.filter((e) => e.kind === "diy");
  const sessions = workshops.filter((w) => w.kind !== "diy");
  const home = partners.length === 1 ? partners[0] : undefined;
  const [diyStep, scheduledStep] = WORKSHOP_JOURNEY;

  return (
    <>
      {/* ---- the head ---- */}
      <section aria-labelledby="experiences-title" className="bg-sage">
        <Container className="pb-12 pt-[3.5rem] md:pb-16 md:pt-[4.5rem] lg:pt-[5.5rem]">
          <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
            <div className="col-span-12 lg:col-span-7">
              <Reveal>
                <Eyebrow>Experiences</Eyebrow>
              </Reveal>
              <DisplayHeading
                as="h1"
                id="experiences-title"
                className="mt-7 md:mt-9"
                lines={["Choose what", "you make."]}
              />
            </div>

            {/* Jump straight to the half of the page the question belongs to. */}
            <Reveal delay={0.15} className="col-span-12 lg:col-span-5 lg:pb-2">
              <nav aria-label="Experience types">
                <ul className="divide-y divide-text/20 border-y border-text/20">
                  <JumpLink href="#walk-in" mode="diy" title="Walk-in DIY" note={diyStep.description} />
                  <JumpLink
                    href="#scheduled"
                    mode="scheduled"
                    title="Scheduled sessions"
                    note={scheduledStep.description}
                  />
                </ul>
              </nav>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ---- walk-in ---- */}
      <section
        id="walk-in"
        aria-labelledby="walk-in-heading"
        className="scroll-mt-24 bg-surface py-[4.5rem] md:py-[6rem]"
      >
        <Container>
          <GroupHead
            id="walk-in-heading"
            mode="diy"
            title="Walk-in DIY"
            lead="No booking needed. Choose an experience on the day and create at your own pace."
          >
            {home ? (
              <p className="text-body leading-[1.7] text-text">
                {home.name}, {home.locality}
                <span className="block text-fine text-text/85">
                  Where the Maison sets up for each run of dates.{" "}
                  <Link href="/locations" className="underline decoration-primary underline-offset-4">
                    Find us
                  </Link>
                </span>
              </p>
            ) : null}
          </GroupHead>

          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 md:mt-12 lg:grid-cols-5">
            {walkIn.map((experience, i) => (
              <Reveal as="li" key={experience.slug} variant="fadeIn" delay={i * 0.05}>
                <ExperiencePlate
                  experience={experience}
                  aspect="aspect-[4/5]"
                  sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 46vw"
                  index={i}
                />
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* ---- scheduled ---- */}
      <section
        id="scheduled"
        aria-labelledby="scheduled-heading"
        className="scroll-mt-24 border-t border-line bg-surface py-[4.5rem] md:py-[6rem]"
      >
        <Container>
          <GroupHead
            id="scheduled-heading"
            mode="scheduled"
            title="Scheduled sessions"
            lead="Guided workshops on a set date and time, booked online. Everything is provided."
          />
          {sessions.length === 0 ? (
            <Reveal className="mt-12 border-t border-line pt-10">
              <p className="max-w-[30rem] text-[1.5rem] font-light leading-[1.25] tracking-[-0.015em]">
                The next dates are being set.
              </p>
              <p className="mt-4 max-w-[32rem] text-body leading-[1.85] text-text/85">
                Walk-in experiences are available in the meantime.
              </p>
            </Reveal>
          ) : (
            <div className="mt-10 md:mt-12">
              <EventsBrowser workshops={sessions} />
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

function JumpLink({
  href,
  mode,
  title,
  note,
}: {
  href: string;
  mode: "diy" | "scheduled";
  title: string;
  note: string;
}) {
  return (
    <li>
      <a href={href} className="group flex items-start justify-between gap-6 py-4">
        <span>
          <span className="flex items-center gap-2.5 text-body font-semibold text-text">
            <ModeMark mode={mode} />
            {title}
          </span>
          <span className="mt-1 block text-fine leading-[1.6] text-text/85">{note}</span>
        </span>
        <span
          aria-hidden
          className="mt-0.5 text-text transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-y-0.5"
        >
          &#8595;
        </span>
      </a>
    </li>
  );
}

function GroupHead({
  id,
  mode,
  title,
  lead,
  children,
}: {
  id: string;
  mode: "diy" | "scheduled";
  title: string;
  lead: string;
  children?: React.ReactNode;
}) {
  return (
    <Reveal>
      <div className="grid grid-cols-12 items-end gap-x-6 gap-y-5 lg:gap-x-10">
        <div className="col-span-12 md:col-span-7">
          <h2
            id={id}
            className="flex items-center gap-3.5 heading-script text-script-compact text-text"
          >
            {/* Lifted to the script's x-height: its letters sit high in their
                line box, so a centred mark read as sitting on the baseline. */}
            <ModeMark mode={mode} className="size-3 -translate-y-[0.15em]" />
            <ScriptTitle>{title}</ScriptTitle>
          </h2>
          <p className="mt-4 max-w-[34rem] text-lead leading-[1.65] text-text/85">{lead}</p>
        </div>
        {children ? <div className="col-span-12 md:col-span-5 md:pb-1">{children}</div> : null}
      </div>
    </Reveal>
  );
}
