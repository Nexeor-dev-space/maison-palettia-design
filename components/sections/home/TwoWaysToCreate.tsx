import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { ModeMark } from "@/components/ui/ModeMark";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { WORKSHOP_JOURNEY } from "@/lib/brand";
import { getCreativeExperiences } from "@/lib/experiences";
import { getMallPartners } from "@/lib/partners";
import {
  formatPrice,
  formatSessionDate,
  getUpcomingWorkshops,
  isFullyBooked,
  sessionDateParts,
  sessionTimeRange,
  spotsLabel,
} from "@/lib/workshops";

/**
 * Homepage 05 — walk in, or book a date. The decision, laid out.
 *
 * INFORMATION → OPTIONS → DECISION → ACTION. The reference the brief names
 * for this is a print shop's order page, and what it does well is set the
 * options side by side with the same questions answered for each, so choosing
 * is reading across rather than remembering. Here the questions are the ones
 * a visitor actually has — do I book, what can I make, when — and each column
 * ends in the one action that fits it.
 *
 * NOTHING HERE IS WRITTEN FOR THE PAGE. The two leads are the deck's (p.5).
 * The walk-in list is the approved activities of that kind. The dates, times,
 * prices and places are the session records themselves, through the same
 * formatters the listing uses, so this cannot disagree with /events.
 *
 * WHERE, FOR WALK-IN. The one confirmed destination, framed as where the
 * Maison sets up. Nothing in the data ties a particular activity to a
 * particular centre, so the column never says "tote bag painting at…".
 */
export async function TwoWaysToCreate() {
  const [experiences, sessions, partners] = await Promise.all([
    getCreativeExperiences(),
    getUpcomingWorkshops(3),
    getMallPartners(),
  ]);
  const walkIn = experiences.filter((e) => e.kind === "diy");
  const scheduled = sessions.filter((s) => s.kind !== "diy");
  const home = partners.length === 1 ? partners[0] : undefined;
  const [diyStep, scheduledStep] = WORKSHOP_JOURNEY;

  return (
    <section
      id="two-ways"
      aria-labelledby="two-ways-heading"
      className="relative bg-sage py-[5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <Reveal>
          <Eyebrow>How it works</Eyebrow>
        </Reveal>
        <DisplayHeading
          id="two-ways-heading"
          className="mt-8 md:mt-10"
          lines={["Walk in,", "or book a date."]}
        />

        <div className="mt-14 grid grid-cols-1 md:mt-20 lg:grid-cols-2">
          {/* ---- Walk in ---- */}
          <Option
            mode="diy"
            title="Walk-in DIY"
            lead={diyStep.description}
            className="lg:border-r lg:border-text/25 lg:pr-10"
          >
            {/* No opening hours: the project holds none, and "whenever the
                table is open" would imply hours nobody has published. */}
            <Fact term="Booking">Not needed.</Fact>
            <Fact term="Make">
              <ul className="flex flex-wrap gap-x-2 gap-y-1">
                {walkIn.map((e, i) => (
                  <li key={e.slug}>
                    <Link
                      href={`/events/${e.slug}`}
                      className="underline decoration-text/40 underline-offset-4 transition-colors hover:decoration-text"
                    >
                      {e.name}
                    </Link>
                    {e.status ? <span className="text-text/85"> ({e.status.toLowerCase()})</span> : null}
                    {i < walkIn.length - 1 ? <span aria-hidden> · </span> : null}
                  </li>
                ))}
              </ul>
            </Fact>
            {home ? (
              <Fact term="Where">
                {home.name}, {home.locality}
                <span className="mt-1 block text-fine text-text/85">
                  Where the Maison sets up for each run of dates.
                </span>
              </Fact>
            ) : null}
            <Action href="/locations" variant="outline">
              Find us
            </Action>
          </Option>

          {/* ---- Book a session ---- */}
          <Option
            mode="scheduled"
            title="Scheduled sessions"
            lead={scheduledStep.description}
            className="mt-14 lg:mt-0 lg:pl-10"
          >
            <Fact term="Booking">Online, for a set date and time.</Fact>
            <Fact term="Next dates">
              {scheduled.length === 0 ? (
                <p>New dates are being planned.</p>
              ) : (
                <ul className="divide-y divide-text/20">
                  {scheduled.map((session) => {
                    const { weekday } = sessionDateParts(session.startsAt);
                    const { start } = sessionTimeRange(session.startsAt, session.durationMinutes);
                    const full = isFullyBooked(session);
                    return (
                      <li key={session.slug}>
                        <Link
                          href={`/events/${session.slug}`}
                          className="group grid grid-cols-[1fr_auto] items-baseline gap-x-4 py-3.5 first:pt-0"
                        >
                          <span className="min-w-0">
                            <span className="block font-medium text-text group-hover:underline group-hover:decoration-primary group-hover:underline-offset-4">
                              {session.title}
                            </span>
                            <span className="mt-0.5 block text-fine text-text/85">
                              <time dateTime={session.startsAt}>
                                {weekday} {formatSessionDate(session.startsAt)}
                              </time>
                              {" · "}
                              <span className="tabular-nums">{start}</span>
                              {session.venue ? ` · ${session.venue.name}` : ""}
                            </span>
                          </span>
                          <span className="text-right">
                            <span className="block font-medium tabular-nums text-text">
                              {formatPrice(session.price)}
                            </span>
                            <span className="mt-0.5 block text-fine text-text/85">
                              {full ? "Fully booked" : spotsLabel(session)}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Fact>
            <Action href="/events#scheduled" variant="primary">
              View all sessions
            </Action>
          </Option>
        </div>
      </Container>
    </section>
  );
}

function Option({
  mode,
  title,
  lead,
  className,
  children,
}: {
  mode: "diy" | "scheduled";
  title: string;
  lead: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal className={className}>
      <h3 className="flex items-center gap-3 text-[1.6rem] font-light leading-tight tracking-[-0.015em] text-text md:text-[2rem]">
        <ModeMark mode={mode} className="size-3" />
        {title}
      </h3>
      <p className="mt-4 max-w-[30rem] text-lead leading-[1.65] text-text">{lead}</p>
      <dl className="mt-9 border-t border-text/25">{children}</dl>
    </Reveal>
  );
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-text/25 py-5 sm:grid-cols-[7.5rem_1fr] sm:gap-6">
      <dt className="text-label font-semibold uppercase tracking-eyebrow text-text">{term}</dt>
      <dd className="text-body leading-[1.7] text-text">{children}</dd>
    </div>
  );
}

function Action({
  href,
  variant,
  children,
}: {
  href: string;
  variant: "primary" | "outline";
  children: React.ReactNode;
}) {
  return (
    <div className="pt-8">
      <Link
        href={href}
        className={
          variant === "primary"
            ? "group inline-flex min-h-12 items-center gap-3 rounded-sm bg-primary px-7 text-action font-semibold uppercase tracking-eyebrow text-on-primary transition-colors duration-300 ease-soft hover:bg-primary/90"
            : "group inline-flex min-h-12 items-center gap-3 rounded-sm border border-text px-7 text-action font-semibold uppercase tracking-eyebrow text-text transition-colors duration-300 ease-soft hover:bg-text hover:text-cream"
        }
      >
        {children}
        <span
          aria-hidden
          className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
        >
          &#8594;
        </span>
      </Link>
    </div>
  );
}
