import { ExperiencePlate } from "@/components/events/ExperiencePlate";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { ModeMark } from "@/components/ui/ModeMark";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { getCreativeExperiences, type CreativeExperience } from "@/lib/experiences";

/**
 * Homepage 02 — what you can make, grouped by how you take part. Directly
 * under the banner, where its "scroll down" leads.
 *
 * THE GROUPING IS THE POINT. The single most important thing a visitor has to
 * understand about the Maison is that most of it is walk-in and some of it is
 * booked for a date. So the seven activities are not one grid with a badge on
 * each; they are two groups, each introduced by what it means — walk in with
 * no booking, or book a session — and each plate carries the same mark the
 * hero uses, so the distinction is learned once and read everywhere.
 *
 * FIVE PORTRAITS, THEN TWO LANDSCAPES. Walk-in activities are many and quick
 * to scan, so they run as a strip of narrow plates. The two scheduled
 * sessions are fewer and a commitment of an afternoon, so each gets a wide
 * plate. The change of shape between the groups marks the change of mode
 * before a word of either label is read.
 *
 * Every name, line, status and photograph comes from lib/experiences.ts, the
 * studio's approved list. Each plate opens that activity's own page, where a
 * walk-in activity is never offered a booking.
 */
export async function ExperienceDiscovery() {
  const experiences = await getCreativeExperiences();
  const walkIn = experiences.filter((e) => e.kind === "diy");
  const scheduled = experiences.filter((e) => e.kind === "scheduled");

  return (
    <section
      aria-labelledby="experience-discovery"
      className="relative bg-surface py-[5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <Eyebrow>Creative experiences</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="experience-discovery"
              className="mt-8 md:mt-10"
              lines={["Choose what", "you make."]}
            />
          </div>

          {/* The key, stated once, before either group. */}
          <Reveal delay={0.2} className="col-span-12 lg:col-span-5 lg:pb-3">
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <dt className="flex items-center gap-2.5 text-label font-semibold uppercase tracking-eyebrow text-text">
                  <ModeMark mode="diy" /> Walk-in DIY
                </dt>
                <dd className="mt-2 text-fine leading-[1.65] text-text/85">
                  Choose on the day and create at your own pace. No booking.
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-2.5 text-label font-semibold uppercase tracking-eyebrow text-text">
                  <ModeMark mode="scheduled" /> Scheduled
                </dt>
                <dd className="mt-2 text-fine leading-[1.65] text-text/85">
                  A guided session on a set date. Booked online.
                </dd>
              </div>
            </dl>
          </Reveal>
        </div>

        <Group
          id="walk-in-diy"
          mode="diy"
          title="Walk-in DIY"
          note={`${walkIn.length} experiences · no booking needed`}
          className="mt-16 md:mt-20"
        >
          <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-5 lg:gap-x-6">
            {walkIn.map((experience, i) => (
              <Reveal as="li" key={experience.slug} variant="fadeIn" delay={i * 0.05}>
                <ExperiencePlate
                  experience={experience}
                  aspect="aspect-[4/5]"
                  sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 46vw"
                />
              </Reveal>
            ))}
          </ul>
        </Group>

        <Group
          id="scheduled-sessions"
          mode="scheduled"
          title="Scheduled sessions"
          note="Guided · booked online"
          className="mt-16 md:mt-20"
        >
          <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:gap-x-10">
            {scheduled.map((experience, i) => (
              <Reveal as="li" key={experience.slug} variant="fadeIn" delay={i * 0.08}>
                <ExperiencePlate
                  experience={experience}
                  aspect="aspect-[4/3] lg:aspect-[16/10]"
                  sizes="(min-width: 640px) 46vw, 92vw"
                  large
                />
              </Reveal>
            ))}
          </ul>
        </Group>
      </Container>
    </section>
  );
}

function Group({
  id,
  mode,
  title,
  note,
  className,
  children,
}: {
  id: string;
  mode: CreativeExperience["kind"];
  title: string;
  note: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className} role="group" aria-labelledby={id}>
      <Reveal>
        <div className="mb-7 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-text/25 pt-5 md:mb-9">
          <h3
            id={id}
            className="flex items-center gap-3 text-lead font-semibold tracking-[-0.005em] text-text"
          >
            <ModeMark mode={mode} />
            {title}
          </h3>
          <p className="text-label font-semibold uppercase tracking-eyebrow text-text/85">{note}</p>
        </div>
      </Reveal>
      {children}
    </div>
  );
}
