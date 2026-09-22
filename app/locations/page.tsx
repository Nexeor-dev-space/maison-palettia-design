import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { LocationMap } from "@/components/sections/LocationMap";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { COLLABORATIONS, EXPERIENCE_STATEMENT, OUR_APPROACH, PAST_DESTINATIONS } from "@/lib/brand";
import { getMallPartners } from "@/lib/partners";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

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

      {/* ---- for destinations ------------------------------------------
          The partner movement. See the note above <HostMovement>. */}
      <HostMovement />

    </>
  );
}

/**
 * ==========================================================================
 * THE PARTNER MOVEMENT — WHERE THE COLLABORATION CONTENT LIVES NOW
 * ==========================================================================
 *
 * WHAT ARRIVED HERE, AND WHY HERE. The homepage carried the whole
 * collaborative approach: the deck's three partnership models, the approach
 * beneath them and a bordered button. The client asked for the homepage to
 * stay on the Maison's own creative experiences and for this content to move
 * to the page it actually belongs on.
 *
 * That page is this one, and it already said so before any of this moved:
 * the note at the top of the file records that the close is "for partners —
 * malls and F&B outlets — because this is where a destination deciding
 * whether to host the Maison will read". The two sections above are the
 * argument a venue needs — where the Maison is now, and the ten destinations
 * it has delivered at over the past year — so the models belong at the end of
 * that argument rather than at a new address with nothing leading to it.
 *
 * The homepage keeps a one-statement teaser that links straight to
 * `#collaborate` below. See <CollaborateTeaser>.
 *
 * ==========================================================================
 * WHAT IT REPLACES
 * ==========================================================================
 *
 * A two-column close: a compact heading on the left, the three models as
 * plain ruled rows on the right with their descriptions at 13px, and a "Talk
 * to us" button. The client's read of the homepage version was that it felt
 * corporate and generic beside the rest of the site, and this was the same
 * layout with less room.
 *
 * It is now three movements:
 *
 *   The invitation .. a statement across the measure with the marks on it,
 *                     rather than a heading in a column. It is the first
 *                     thing a partner meets here, so it is the one place on
 *                     this page that gets display scale.
 *   The chapters .... the three models as numbered chapters, alternating
 *                     which side the folio sits on and stepping their measure,
 *                     so three items read as a sequence rather than a table.
 *   The invitation
 *   to write ........ one door, set as a sentence rather than as a button in
 *                     a box.
 *
 * NOTHING IS INVENTED. The three models and their descriptions are
 * `COLLABORATIONS` verbatim (deck p.10). No partner is named, no logo is
 * shown, no number, rate, result or case study appears — the deck names none
 * for these programmes, and a partnership page is exactly where inventing one
 * would do the most damage.
 *
 * THE ENQUIRY STILL GOES TO /contact. The private-events form offers "Mall &
 * community activations" as an event type, but it also asks for a guest count
 * and a preferred date, which are the wrong questions to put to a mall's
 * marketing team. /contact is the honest door and it is the one this page
 * already used.
 *
 * INK. This sits on White Rock, where only Charcoal (9.36:1) and Deep Lilac
 * (3.95:1) can carry anything that is read or that marks structure — Warm
 * Terracotta is 2.44:1 and Soft Lavender 1.44:1. So every word is Charcoal
 * and the colour lives in the marks, which are decorative and `aria-hidden`
 * and owe no ratio. The same division <WaysToExperience> works to.
 */
function HostMovement() {
  return (
    <section
      id="collaborate"
      aria-labelledby="host-heading"
      className="scroll-mt-header bg-cream py-[5rem] md:py-section lg:py-section-lg md:scroll-mt-[var(--spacing-header-lg)]"
    >
      <Container>
        {/* ---- the invitation ---- */}
        <div className="relative">
          <Reveal>
            <Eyebrow>For malls &amp; destinations</Eyebrow>
          </Reveal>

          <div className="mt-8 grid grid-cols-12 items-end gap-x-6 gap-y-8 md:mt-10 lg:gap-x-10">
            <DisplayHeading
              id="host-heading"
              className="col-span-12 lg:col-span-7"
              lines={["Bring the Maison", "to your space."]}
            />

            <Reveal delay={0.15} className="col-span-12 lg:col-span-4 lg:col-start-9 lg:pb-4">
              <p className="max-w-[26rem] text-body leading-[1.8] text-text/85">
                Creative activations built around your space and your calendar &mdash; run by the
                Maison, themed to what you already have on.
              </p>
            </Reveal>
          </div>

          {/* Two marks on the statement's own band rather than scattered over
              the section, and both Deep Lilac so they read as one gesture. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-2 right-0 hidden h-16 w-16 lg:block"
          >
            <DoodleMark name="starburst" color="#9059A4" treatment="draw" delay={240} />
          </span>
        </div>

        {/* ---- the chapters ---- */}
        <Stagger as="ol" className="mt-16 md:mt-20">
          {COLLABORATIONS.map((model, i) => (
            <li key={model.slug}>
              <Chapter model={model} index={i + 1} />
            </li>
          ))}
        </Stagger>

        {/* ---- the door ---- */}
        <Reveal delay={0.1}>
          <div className="mt-16 border-t border-text/25 pt-10 md:mt-20">
            <div className="grid grid-cols-12 items-end gap-x-6 gap-y-6 lg:gap-x-10">
              <p className="col-span-12 max-w-[34rem] text-lead font-light leading-[1.6] text-text lg:col-span-7">
                Tell us about your space and what you have coming up, and we will come back with
                what the Maison could make there.
              </p>
              <div className="col-span-12 lg:col-span-4 lg:col-start-9">
                <Link
                  href="/contact"
                  className="group inline-flex min-h-12 items-center gap-3 rounded-sm bg-primary px-7 text-action font-semibold uppercase tracking-eyebrow text-on-primary press-in transition-colors duration-300 ease-soft hover:bg-primary/90"
                >
                  Partner with us
                  <span
                    aria-hidden
                    className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
                  >
                    &#8594;
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/**
 * One collaboration model, as a chapter.
 *
 * The folio changes side on the middle one and the measure steps in with it,
 * so three items of identical anatomy still read as a sequence rather than as
 * three rows of a table. Each carries one mark on its own rule — a chapter
 * ornament, not decoration scattered near it.
 */
function Chapter({
  model,
  index,
}: {
  model: (typeof COLLABORATIONS)[number];
  index: number;
}) {
  /* The middle chapter is the one that moves. Two the same and one different
     is a rhythm; three all different is a shuffle. */
  const flipped = index === 2;

  return (
    <Reveal delay={index * 0.07}>
      <div className="relative grid grid-cols-12 items-start gap-x-6 border-t border-text/25 py-10 md:py-12 lg:gap-x-10">
        <span
          aria-hidden
          className="absolute -top-5 left-0 block h-10 w-10 bg-cream pr-2"
        >
          <DoodleMark
            name={(["bow", "splash", "starleaf"] as const)[index - 1]}
            color="#9059A4"
            treatment="draw"
            delay={index * 120}
          />
        </span>

        <p
          className={cn(
            "col-span-12 text-label font-semibold tabular-nums tracking-eyebrow text-text/85",
            flipped ? "lg:order-2 lg:col-span-1 lg:col-start-12" : "lg:col-span-1",
          )}
        >
          {String(index).padStart(2, "0")}
        </p>

        <div
          className={cn(
            "col-span-12 mt-3 lg:mt-0",
            flipped ? "lg:order-1 lg:col-span-8 lg:col-start-3" : "lg:col-span-8 lg:col-start-3",
          )}
        >
          <h3 className="text-h2 font-light leading-[1.1] tracking-[-0.015em] text-text">
            {model.name}
          </h3>
          {/* Body, not `fine`. These were 13px — the role globals.css keeps
              for actual fine print — and this is the whole description of a
              programme a partner is deciding about. */}
          <p className="mt-4 max-w-[34rem] text-body leading-[1.8] text-text/85">
            {model.description}
          </p>
        </div>
      </div>
    </Reveal>
  );
}
