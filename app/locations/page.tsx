import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { LocationMap } from "@/components/sections/LocationMap";
import { Container } from "@/components/ui/Container";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { COLLABORATIONS, EXPERIENCE_STATEMENT, OUR_APPROACH, PAST_DESTINATIONS } from "@/lib/brand";
import { getMallPartners } from "@/lib/partners";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Locations",
  description:
    "Where to find Maison Palettia now, and the UAE destinations where the Maison has delivered creative workshops and activations.",
  path: "/locations",
});

/**
 * /locations — where to find the Maison, and where it has been.
 *
 * THE BRIEF ASKED FOR THIS PAGE, AND THE DATA DECIDES ITS SHAPE. The Maison
 * has no studio door; it sets up inside malls. So "where" has two honest
 * answers, and they must never be confused:
 *
 *   Now ........ the confirmed partnerships in lib/partners.ts — one today,
 *                Times Square Center — shown with the project's existing map.
 *   Before ..... the ten destinations the deck says the studio has delivered
 *                workshops and activations at over the past year (p.12).
 *
 * The second list is labelled as past every time it appears and never links
 * to a map, so nobody sets off for Yas Mall expecting a table to be there.
 *
 * NO COORDINATES, NO ADDRESSES, NO EMIRATES. The project holds none, and two
 * of the ten (Wasl, Ithra) are organisations rather than single addresses.
 * The map is the existing keyless embed built from the partner record.
 *
 * The close is for partners — malls and F&B outlets — because this is where a
 * destination deciding whether to host the Maison will read.
 */
export default async function LocationsPage() {
  const partners = await getMallPartners();

  return (
    <>
      {/* ---- now ---- */}
      <section aria-labelledby="locations-title" className="bg-surface">
        <Container className="py-[3.5rem] md:py-[4.5rem] lg:py-[5.5rem]">
          <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
            <div className="col-span-12 lg:col-span-7">
              <Reveal>
                <Eyebrow>Locations</Eyebrow>
              </Reveal>
              <DisplayHeading
                as="h1"
                id="locations-title"
                className="mt-7 md:mt-9"
                lines={["Where to", "find us."]}
              />
            </div>
            <Reveal delay={0.15} className="col-span-12 lg:col-span-5 lg:pb-2">
              <p className="max-w-[30rem] text-lead leading-[1.7] text-text/85">
                Maison Palettia brings creative experiences into the places people already gather —
                set up inside a mall rather than behind a studio door.
              </p>
            </Reveal>
          </div>

          {partners.length > 0 ? (
            <div className="mt-14 md:mt-16">
              <Reveal>
                <h2 className="mb-6 text-label font-semibold uppercase tracking-eyebrow text-text">
                  Find us now
                </h2>
              </Reveal>
              <LocationMap partners={partners} />
            </div>
          ) : (
            <Reveal className="mt-14 border-t border-line pt-10">
              <p className="max-w-[30rem] text-[1.5rem] font-light leading-[1.25]">
                The next destination is being confirmed.
              </p>
            </Reveal>
          )}
        </Container>
      </section>

      {/* ---- before ---- */}
      <section aria-labelledby="past-heading" className="bg-sage py-[5rem] md:py-section lg:py-section-lg">
        <Container>
          <div className="grid grid-cols-12 gap-x-6 gap-y-12 lg:gap-x-10">
            <div className="col-span-12 lg:col-span-5">
              <Reveal>
                <Eyebrow>Our experience</Eyebrow>
              </Reveal>
              <DisplayHeading
                id="past-heading"
                size="compact"
                className="mt-8 md:mt-10"
                lines={["Where we’ve", "created."]}
              />
              <Reveal delay={0.15}>
                <p className="mt-7 max-w-[30rem] text-body leading-[1.85] text-text">
                  {EXPERIENCE_STATEMENT}
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <h3 className="mt-10 text-label font-semibold uppercase tracking-eyebrow text-text">
                  Our approach
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {OUR_APPROACH.map((line) => (
                    <li key={line} className="flex gap-3 text-body leading-[1.7] text-text">
                      <span aria-hidden className="mt-[0.75em] h-px w-3 shrink-0 bg-text/60" />
                      {line}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            <div className="col-span-12 lg:col-span-6 lg:col-start-7">
              <Reveal>
                <h3 className="text-label font-semibold uppercase tracking-eyebrow text-text">
                  Past destinations
                </h3>
              </Reveal>
              <ol className="mt-5 border-t border-text/25">
                {PAST_DESTINATIONS.map((name, i) => (
                  <li key={name} className="border-b border-text/25">
                    <Reveal delay={i * 0.03}>
                      <p className="grid grid-cols-[2.75rem_1fr] items-baseline py-3.5 md:py-4">
                        <span
                          aria-hidden
                          className="text-label font-semibold tabular-nums tracking-eyebrow text-text"
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[1.3rem] font-light leading-tight tracking-[-0.01em] text-text md:text-[1.55rem]">
                          {name}
                        </span>
                      </p>
                    </Reveal>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-fine text-text">And more.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* ---- for destinations ---- */}
      <section aria-labelledby="host-heading" className="bg-cream py-[5rem] md:py-section">
        <Container>
          <div className="grid grid-cols-12 items-end gap-x-6 gap-y-10 lg:gap-x-10">
            <div className="col-span-12 lg:col-span-6">
              <Reveal>
                <Eyebrow>For malls &amp; destinations</Eyebrow>
              </Reveal>
              <DisplayHeading
                id="host-heading"
                size="compact"
                className="mt-8 md:mt-10"
                lines={["Bring the Maison", "to your space."]}
              />
            </div>
            <div className="col-span-12 lg:col-span-5 lg:col-start-8">
              <ul>
                {COLLABORATIONS.map((model) => (
                  <li key={model.slug} className="border-t border-text/25 py-4">
                    <p className="text-body font-semibold text-text">{model.name}</p>
                    <p className="mt-1 text-fine leading-[1.65] text-text/85">{model.description}</p>
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="group mt-6 inline-flex min-h-12 items-center gap-3 rounded-sm bg-primary px-7 text-action font-semibold uppercase tracking-eyebrow text-on-primary transition-colors duration-300 ease-soft hover:bg-primary/90"
              >
                Talk to us
                <span
                  aria-hidden
                  className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
                >
                  &#8594;
                </span>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
