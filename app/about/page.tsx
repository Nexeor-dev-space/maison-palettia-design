import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { EditorialStatement } from "@/components/sections/EditorialStatement";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { JustAdded } from "@/components/sections/JustAdded";
import { PlanYourVisit } from "@/components/sections/PlanYourVisit";
import { Container } from "@/components/ui/Container";
import { Signature } from "@/components/ui/Signature";
import { BRAND_INTRO_IMAGE, EDITORIAL_PANELS, EXPERIENCE_IMAGES, MAISON_PHILOSOPHY } from "@/lib/constants";
import { getDisciplines } from "@/lib/disciplines";
import { buildMetadata } from "@/lib/seo";
import type { Discipline } from "@/types";

export const metadata = buildMetadata({
  title: "About",
  description:
    "Maison Palettia is a creative space where art, craft and community come together — hands-on events at fixed times in malls across Dubai.",
  path: "/about",
});

const STATEMENT_LINE =
  "block font-light uppercase leading-[0.96] tracking-[-0.02em] " +
  "text-[2.25rem] xs:text-[2.75rem] sm:text-[3.25rem] md:text-[3.25rem] lg:text-[4rem] xl:text-[4.5rem]";

/**
 * About — the story, told the way the rest of the site talks.
 *
 * This was a scaffold, then five movements, and is now eight: a statement, the
 * Maison's own philosophy against a photograph, an editorial spread, the four
 * things you can actually make here, a visual aside, a second spread, what has
 * come out of the room lately, and the way through to the programme.
 *
 * IT GREW BECAUSE THE HOMEPAGE SHRANK. The homepage was carrying four
 * sections of brand storytelling between a visitor and a date they could
 * book. Three of those were duplicates of what this page already said — the
 * philosophy from the same constant, the strands from the same source — so
 * they were simply dropped there; the two editorial spreads and the
 * just-added strip are real content with nowhere else to be, and they are
 * here. The homepage introduces, this page explains, /events converts.
 *
 * EVERY WORD ON THIS PAGE ALREADY EXISTED. The statement and the paragraph are
 * the brand introduction's own copy, the philosophy block is
 * `MAISON_PHILOSOPHY` verbatim, and the four strands are read from
 * `getDisciplines()` — the same source the strands menu in the header uses,
 * so this page cannot drift from either. Nothing here invents a claim about
 * what the studio provides, teaches or promises, because none of that is
 * written down yet and an About page is the worst place to start guessing.
 *
 * Composition follows the site rather than a template: no three-column card
 * row, no team grid, no statistics. Each section is a different shape, and the
 * page is read by moving through them.
 *
 * Server component; it awaits the strands in place, as the homepage does.
 */
export default async function AboutPage() {
  const disciplines = await getDisciplines();

  return (
    <>
      <Introduction />
      <TheMaison />

      {/*
        The first of the two editorial spreads that used to break up the
        homepage. They belong to the story rather than to the booking journey,
        and this is the page that tells the story — see the note on the
        homepage for the rest of that argument.
      */}
      <EditorialStatement panel={EDITORIAL_PANELS.movement} spread="foot" />

      <TheExperience disciplines={disciplines} />
      <VisualStory />

      {/*
        Set as a `foot` spread, not the `field` one it was built for. That
        spread lays charcoal type straight on the picture with a light wash,
        and it needs a pale, quiet photograph to do it. The client's shelved
        pots are neither: measured, charcoal came out at 1.0-1.8:1 against
        them, and the cream wash heavy enough to fix that erased the
        photograph. Under the dark scrim with cream type every element clears
        its bar — worst 4.5:1 — at half the overlay, so the pots stay visible.
        See the note on the plate in lib/constants.ts.
      */}
      <EditorialStatement panel={EDITORIAL_PANELS.making} spread="foot" />

      {/* What has come out of the room lately — the closest thing the site has
          to behind-the-scenes, and squarely About's business rather than the
          homepage's. */}
      <JustAdded />

      {/*
        The practical answer, immediately before the page asks for the booking.
        It kept this adjacency when it moved off the homepage, where it sat
        under the events listing for the same reason: it belongs next to the
        moment the question gets asked, not wherever there is room for it.

        Its tinted band also breaks the run of page-ground sections above it
        and sets up the White Rock close below, so the page ends on three
        distinct grounds rather than trailing off.
      */}
      <HowItWorks />

      {/*
        The close, moved here from the foot of the homepage at the client's
        ask — see the note in <PlanYourVisit>.

        IT REPLACED A SECTION RATHER THAN JOINING ONE. This page already ended
        with an <EventsCta> whose heading was "Come make / something with us."
        over a paragraph and an "Explore events" link. That is the same
        sentence and the same ask this section makes from the same constant,
        so mounting both would have set the identical invitation twice in a
        row, the second time smaller. The one that survives is the one with
        the foot rail on it: where the studio is, who to ask a question, and
        the door for group bookings — three answers the shorter version simply
        did not have room for.
      */}
      <PlanYourVisit />
    </>
  );
}

/** 01 — who this is, in as few words as the brand uses elsewhere. */
function Introduction() {
  return (
    <Container as="section" aria-labelledby="about-intro" className="pt-[4rem] md:pt-[6rem] lg:pt-[7rem]">
      <Reveal>
        <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
          <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
          About the Maison
        </p>
      </Reveal>

      <h1 id="about-intro" className="mt-10 md:mt-14 lg:mt-16">
        <Stagger>
          <StatementLine>Art, craft</StatementLine>{" "}
          <StatementLine>and company.</StatementLine>
        </Stagger>
      </h1>

      <div className="mt-12 grid grid-cols-12 gap-x-6 md:mt-16 lg:gap-x-10">
        <Reveal delay={0.15} className="col-span-12 md:col-span-7 md:col-start-6 lg:col-span-6 lg:col-start-7">
          {/*
            The brand introduction's own paragraph, unchanged. It is the one
            sentence the studio has already written about itself, and writing a
            second one here would leave the site with two answers to the same
            question.
          */}
          <p className="text-lead font-light leading-[1.7] text-text md:text-[1.35rem]">
            Maison Palettia is a creative space where art, craft and community come together. A
            place to slow down, make something with your hands, and leave with an experience
            that stays with you.
          </p>
        </Reveal>
      </div>
    </Container>
  );
}

function StatementLine({ children }: { children: string }) {
  return (
    <span className="block overflow-hidden pb-[0.14em] [&+span]:-mt-[0.14em]">
      <Reveal as="span" variant="maskUp" className={STATEMENT_LINE}>
        {children}
      </Reveal>
    </span>
  );
}

/**
 * 02 — the philosophy, against the picture.
 *
 * A full-bleed White Rock field so the page changes material here rather than
 * merely changing subject. The photograph bleeds off the left edge and the
 * words sit in the right half, which is the same anatomy the events use — one
 * language, two purposes.
 */
function TheMaison() {
  return (
    <section aria-labelledby="the-maison" className="mt-[5rem] bg-cream md:mt-[7rem] lg:mt-[8rem]">
      <Container>
        <div className="grid grid-cols-12 items-center gap-x-6 lg:gap-x-12">
          <figure className="col-span-12 -mx-gutter lg:col-span-6 lg:-ml-gutter lg:mr-0">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-surface-alt sm:aspect-[3/2] lg:aspect-[4/5]">
              <Image
                src={BRAND_INTRO_IMAGE.src}
                alt={BRAND_INTRO_IMAGE.alt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                style={{ objectPosition: BRAND_INTRO_IMAGE.position }}
                className="object-cover"
              />
            </div>
          </figure>

          <div className="col-span-12 py-12 md:py-16 lg:col-span-5 lg:col-start-8 lg:py-24">
            <Reveal>
              <p className="text-label font-medium uppercase tracking-eyebrow text-text/75">
                {MAISON_PHILOSOPHY.eyebrow}
              </p>

              <h2
                id="the-maison"
                className="mt-7 text-[2rem] font-light leading-[1.05] tracking-[-0.02em] md:text-[2.5rem] lg:text-[2.75rem]"
              >
                {MAISON_PHILOSOPHY.title.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h2>
            </Reveal>

            <Reveal delay={0.15}>
              <p className="mt-8 max-w-[32rem] text-body leading-[1.85] text-text/80">
                {MAISON_PHILOSOPHY.description}
              </p>
              {/*
                The script, used once on this page and nowhere else on it. It
                is the brand's rarest gesture and the reason it still reads as
                one — see the contract in <Signature>, which also sets its own
                size because the ink pairings only clear at display scale.
              */}
              <Signature ground="warm" className="mt-10">
                {MAISON_PHILOSOPHY.accent}
              </Signature>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * 03 — the four things you could make.
 *
 * Read from `getDisciplines()` rather than written here. The brief's example
 * had four invented headings for what an event feels like; the studio has four
 * real ones for what an event *is*, with its own sentence under each. Using
 * the real ones costs nothing and means this section updates itself when the
 * programme grows a fifth strand.
 *
 * The row is staggered rather than level — every other plate drops — so four
 * equal items still read as a composition rather than as a card grid.
 */
function TheExperience({ disciplines }: { disciplines: Discipline[] }) {
  return (
    <Container as="section" aria-labelledby="the-experience" className="mt-[5.5rem] md:mt-[8rem] lg:mt-[9rem]">
      <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10">
        <div className="col-span-12 md:col-span-8 lg:col-span-7">
          <Reveal>
            <p className="text-label font-medium uppercase tracking-eyebrow text-text/75">
              What you&rsquo;ll do
            </p>
            <h2
              id="the-experience"
              className="mt-6 text-[1.9rem] font-light uppercase leading-[1.02] tracking-[-0.02em] md:text-[2.4rem] lg:text-[2.9rem]"
            >
              Four ways in.
            </h2>
          </Reveal>

          <Reveal delay={0.15}>
            <p className="mt-7 max-w-[32rem] text-body leading-[1.85] text-text/80 md:mt-8">
              Every event begins with one of these. No experience is assumed and nothing needs
              bringing — the table is set when you arrive.
            </p>
          </Reveal>
        </div>
      </div>

      <ol className="mt-14 grid grid-cols-12 gap-x-6 gap-y-14 md:mt-20 lg:gap-x-10">
        {disciplines.map((strand, i) => (
          <li
            key={strand.slug}
            className={
              i % 2 === 1
                ? "col-span-12 sm:col-span-6 lg:col-span-3 lg:mt-16"
                : "col-span-12 sm:col-span-6 lg:col-span-3"
            }
          >
            <Reveal>
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-surface-alt">
                <Image
                  src={strand.image.src}
                  alt={strand.image.alt}
                  fill
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 46vw, 100vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-6 flex items-center gap-3">
                <span className="text-label font-medium uppercase tracking-eyebrow text-text/75">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span aria-hidden className="h-px w-5 shrink-0 bg-terracotta" />
              </p>
              <h3 className="mt-4 text-lead font-medium uppercase tracking-[0.04em]">
                {strand.name}
              </h3>
              <p className="mt-3 max-w-[20rem] text-body leading-[1.8] text-text/80">
                {strand.description}
              </p>
            </Reveal>
          </li>
        ))}
      </ol>
    </Container>
  );
}

/**
 * 04 — a visual aside.
 *
 * One large plate, one small one held below and inside it, and a single line
 * of type. Deliberately asymmetric and deliberately quiet: the page has said
 * its piece by now, and this is the pause before it asks for anything.
 */
function VisualStory() {
  return (
    <Container as="section" aria-labelledby="visual-story" className="mt-[5.5rem] md:mt-[8rem] lg:mt-[9rem]">
      <h2 id="visual-story" className="sr-only">
        Inside the studio
      </h2>

      <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10">
        <Reveal className="col-span-12 lg:col-span-8">
          <figure>
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-sm bg-surface-alt">
              <Image
                src={EXPERIENCE_IMAGES.painting.src}
                alt={EXPERIENCE_IMAGES.painting.alt}
                fill
                sizes="(min-width: 1024px) 64vw, 100vw"
                className="object-cover"
              />
            </div>
          </figure>
        </Reveal>

        <div className="col-span-12 mt-10 lg:col-span-3 lg:col-start-10 lg:mt-28">
          <Reveal delay={0.15}>
            <p className="text-lead font-light leading-[1.7] text-text md:text-lead">
              A room, a table, and everything already laid out.
            </p>
          </Reveal>

          <Reveal delay={0.25}>
            <figure className="mt-10">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-surface-alt">
                <Image
                  src={EXPERIENCE_IMAGES.pigment.src}
                  alt={EXPERIENCE_IMAGES.pigment.alt}
                  fill
                  sizes="(min-width: 1024px) 24vw, 100vw"
                  className="object-cover"
                />
              </div>
            </figure>
          </Reveal>
        </div>
      </div>
    </Container>
  );
}
