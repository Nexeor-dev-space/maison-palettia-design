import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { embedSrc } from "@/components/sections/LocationMap";
import { Container } from "@/components/ui/Container";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { EXPERIENCE_STATEMENT, PAST_DESTINATIONS } from "@/lib/brand";
import { getMallPartners } from "@/lib/partners";

/**
 * Homepage 09 — where the Maison has created, and where to find it now.
 *
 * TWO DIFFERENT CLAIMS, KEPT VISIBLY APART. The deck lists ten destinations
 * where the studio has delivered workshops and activations "over the past
 * year" (p.12). It does not say the studio is at any of them now, and only one
 * partnership is confirmed as current (lib/partners.ts). So the page shows
 * both, labelled for what they are: a record of where it has been, on the
 * left, and the place to find it today, on the right, with a map. Nothing on
 * the left links to a map or says "visit".
 *
 * THE RECORD AS A POSTER. Ten names set large and running on, separated by a
 * rule rather than listed — the way a tour poster lists its cities. It reads
 * as a body of work at a glance, and "and more" closes it because the deck's
 * list closes that way and is not exhaustive.
 *
 * THE MAP IN AN ARCH. The Maison's entrances and signage are arches, and the
 * same shape framing the map is what stops a Google embed looking like an
 * afterthought pasted into the page. It is the project's existing keyless
 * embed, built from the partner record — no coordinates are invented.
 */
export async function WhereWeCreate() {
  const partners = await getMallPartners();
  const home = partners[0];

  return (
    <section
      aria-labelledby="where-heading"
      className="relative bg-surface py-[5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <div className="grid grid-cols-12 gap-x-6 gap-y-16 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <Eyebrow>Our experience</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="where-heading"
              className="mt-8 md:mt-10"
              lines={["Where we’ve", "created."]}
            />
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-[36rem] text-body leading-[1.85] text-text/85">
                {EXPERIENCE_STATEMENT}
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <h3 className="mt-12 text-label font-semibold uppercase tracking-eyebrow text-text">
                Past destinations
              </h3>
              <ul className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-2 text-[1.35rem] font-light leading-[1.4] tracking-[-0.01em] text-text md:text-[1.75rem]">
                {PAST_DESTINATIONS.map((name) => (
                  <li key={name} className="flex items-baseline gap-3">
                    <span>{name}</span>
                    <span aria-hidden className="inline-block h-px w-5 translate-y-[-0.35em] bg-terracotta" />
                  </li>
                ))}
                <li className="text-text/85">and more</li>
              </ul>
            </Reveal>
          </div>

          {home ? (
            <div className="col-span-12 lg:col-span-4 lg:col-start-9">
              <Reveal variant="fadeIn">
                <div className="arch relative aspect-[4/5] overflow-hidden bg-cream [--arch-rise:30%]">
                  {/*
                    Taller than its frame and lifted by the height of Google's
                    place card, so the card sits above the arch and out of
                    sight. The card carries a star rating and a review count —
                    Google's, not the studio's, but on this page it would read
                    as a rating the Maison is showing, which the brief rules
                    out. Only the top is cropped: Google's logo and terms sit
                    at the foot of the embed and stay visible, as the embed's
                    terms require.
                  */}
                  <iframe
                    title={`Map showing ${home.name}, ${home.locality}`}
                    src={embedSrc(home)}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-x-0 -top-28 h-[calc(100%+7rem)] w-full border-0 grayscale-[35%]"
                  />
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <h3 className="mt-7 text-label font-semibold uppercase tracking-eyebrow text-text">
                  Find us now
                </h3>
                <p className="mt-3 text-[1.5rem] font-light leading-tight tracking-[-0.01em] text-text">
                  {home.name}
                </p>
                <p className="mt-1 text-body text-text/85">{home.locality}</p>
                <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3">
                  <Link
                    href="/locations"
                    className="group -my-1.5 inline-flex items-baseline gap-3 py-1.5 text-action font-semibold uppercase tracking-eyebrow text-text"
                  >
                    <span className="border-b border-primary pb-1.5 transition-colors duration-300 ease-soft group-hover:border-text">
                      Locations
                    </span>
                    <span aria-hidden className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1">
                      &#8594;
                    </span>
                  </Link>
                  {home.locationHref ? (
                    <a
                      href={home.locationHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group -my-1.5 inline-flex items-baseline gap-3 py-1.5 text-action font-semibold uppercase tracking-eyebrow text-text"
                    >
                      <span className="border-b border-text/60 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-text">
                        Directions
                      </span>
                      <span className="sr-only">(opens Google Maps in a new tab)</span>
                      <span aria-hidden>&#8599;</span>
                    </a>
                  ) : null}
                </div>
              </Reveal>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
