import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { getMallPartners } from "@/lib/partners";
import type { MallPartner } from "@/types";

const TERM = "text-label font-medium uppercase tracking-eyebrow text-text/75";

/**
 * The statement, in authored lines.
 *
 * The break belongs between the clauses rather than wherever the measure
 * happens to run out — but only where there is a measure worth breaking. Below
 * `md` the lines are set inline and allowed to flow: a 360px screen cannot
 * hold "brought into the heart" in caps at any size this heading should be
 * set, so insisting on the authored break there buys a wrapped line that
 * breaks in the wrong place *and* a heading two steps too small. The same
 * arrangement <EditorialStatement> uses, and for the same reason.
 */
const STATEMENT = ["Creative experiences,", "brought into the heart", "of the community."];

/**
 * Where the Maison creates — the centres it has agreements with.
 *
 * NOT A LOGO WALL, and built so it cannot drift into one. A logo wall answers
 * "who vouches for us"; this answers "how does this business work", which is
 * the question a visitor, a mall's leasing team and a prospective partner all
 * arrive with. So the destination is set as an editorial entry — name, city,
 * one factual line, a way to find it — rather than as a mark in a row of
 * marks, and the section carries no count, no years, no footfall and no
 * "trusted by". There are no statistics here because the studio has supplied
 * none, and a credibility section that invents its own numbers is the opposite
 * of credible.
 *
 * ONE PARTNER READS AS ONE PARTNER. The client has confirmed a single
 * agreement, and the composition is a spread rather than a grid precisely so
 * that is not a problem: the masthead holds the left, the destinations stack
 * down the right, and one entry fills its column as an object in its own right
 * instead of sitting in the first of three empty cells. A second and a third
 * extend the stack. Adding one is appending to lib/partners.ts — see the note
 * there — and nothing in this file counts, measures or lays out against a
 * number it expects.
 *
 * WHAT IT RENDERS AROUND. A partner may arrive with a logo, a photograph,
 * both, or neither; today's one has neither. Each is drawn only when the data
 * carries it, so the entry is complete at every stage rather than showing the
 * shape of what is missing. Nothing here draws, traces or approximates a
 * partner's identity — with no supplied mark the name is set as type, which is
 * the honest version of the same thing.
 *
 * Server component. Awaited in place rather than suspended, for the reason set
 * out in <UpcomingEvents>.
 */
export async function MallPartners() {
  const partners = await getMallPartners();
  // Nothing to say and nothing said. The same contract <CreativeExperiences>
  // and <LocationDiscovery> keep: a section with no content does not render a
  // heading over an empty space.
  if (partners.length === 0) return null;

  return (
    <Container
      as="section"
      aria-labelledby="mall-partners"
      className="py-[4.5rem] md:py-[6rem] lg:py-[7rem]"
    >
      <div className="grid grid-cols-12 items-start gap-x-6 gap-y-12 lg:gap-x-12">
        <Masthead />

        <div className="col-span-12 lg:col-span-6 lg:col-start-7">
          <ul className="flex flex-col gap-5 md:gap-6">
            {partners.map((partner, i) => (
              <PartnerEntry key={partner.slug} partner={partner} delay={i * 0.08} />
            ))}
          </ul>

          {/*
            The honest version of "and many more". It says the list will grow
            without claiming it already has, and it is the same sentence the
            events listing uses about dates — one voice for one situation.
          */}
          <Reveal variant="fadeIn">
            <p className="mt-8 text-fine leading-[1.8] text-text/75">
              More destinations are announced as each partnership is confirmed.
            </p>
          </Reveal>
        </div>
      </div>
    </Container>
  );
}

/**
 * The left half: what this is, and how the business actually works.
 *
 * The paragraph is the section's real content. A visitor who reads nothing
 * else should come away understanding the model — no fixed address, an
 * agreement with each centre, the studio brought inside for a run of dates —
 * because that model is the thing the client wants understood, by customers
 * and by the next mall alike.
 */
function Masthead() {
  return (
    <div className="col-span-12 lg:col-span-5">
      <Stagger>
        <Reveal>
          <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
            <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
            Where we create
          </p>
        </Reveal>

        <Reveal variant="subtleReveal">
          <h2
            id="mall-partners"
            /*
              Caps, because every other section heading on this page is — the
              listing, the strands, the teaser, the quotes, the invitation. A
              sentence-case heading here would read as a different site.

              The `lg` step is smaller than the `md` one, and that is not a
              slip. From `lg` the masthead drops to five of twelve columns
              while the type is still growing, and the longest authored line
              breaks in two at exactly 1024 — the one thing authored lines
              exist to prevent. The measure only catches up at `xl`.
            */
            className="mt-8 text-[1.5rem] font-light uppercase leading-[1.15] tracking-[-0.02em] md:mt-10 md:text-[1.85rem] md:leading-[1.12] lg:text-[1.7rem] xl:text-[2rem]"
          >
            {STATEMENT.map((line, i) => (
              <span key={line} className="inline md:block">
                {/* The join, and only while the lines are running inline. */}
                {i > 0 ? " " : null}
                {line}
              </span>
            ))}
          </h2>
        </Reveal>

        <Reveal>
          <p className="mt-7 max-w-[32rem] text-body leading-[1.85] text-text/80 md:mt-8">
            Maison Palettia keeps no fixed address. It partners with established centres — an
            agreement with each one — and brings the studio inside for a run of dates, so a
            morning at the table happens somewhere you were already going.
          </p>
        </Reveal>
      </Stagger>
    </div>
  );
}

/**
 * One destination.
 *
 * A plate on White Rock rather than a card with a hairline around it: on this
 * palette a `border-line` rule against cream is very nearly cream, so the
 * border would be doing nothing the fill does not already do. The fill is the
 * object.
 *
 * The name is an `<h3>` whether or not a mark is showing, so the document
 * outline is the same at every stage of the data — and a supplied logo is
 * `alt=""` rather than alt-texted with the name, because the name is set in
 * type directly underneath it and reading it twice helps nobody.
 */
function PartnerEntry({ partner, delay }: { partner: MallPartner; delay: number }) {
  return (
    <Reveal as="li" variant="fadeIn" delay={delay}>
      <article className="bg-cream p-7 md:p-8 lg:p-9">
        {/* Only when there is one. No stand-in photograph — see lib/partners.ts. */}
        {partner.image ? (
          <div className="relative mb-7 aspect-[16/9] overflow-hidden bg-surface-alt">
            <Image
              src={partner.image.src}
              alt={partner.image.alt}
              fill
              sizes="(min-width: 1024px) 46vw, 100vw"
              style={{ objectPosition: partner.image.position }}
              className="object-cover"
            />
          </div>
        ) : null}

        {partner.logo ? (
          // Held in a box and contained rather than sized directly: a partner's
          // mark arrives at whatever proportion it arrives at, and the one
          // thing this must never do is stretch somebody's logo to fit.
          <div className="relative h-8 w-40 md:h-9 md:w-44">
            <Image src={partner.logo.src} alt="" fill className="object-contain object-left" />
          </div>
        ) : (
          <p className={TERM}>Mall partner</p>
        )}

        <h3 className="mt-4 text-[1.5rem] font-light leading-[1.15] tracking-[-0.015em] text-text md:text-[1.75rem]">
          {partner.name}
        </h3>

        <p className="mt-2.5 text-fine font-medium uppercase tracking-eyebrow text-text/75">
          {partner.locality}
        </p>

        <p className="mt-5 max-w-[30rem] text-body leading-[1.8] text-text/80">
          {partner.descriptor}
        </p>

        {partner.locationHref ? (
          <a
            href={partner.locationHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-7 inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text"
          >
            <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
              See the location
            </span>
            {/*
              A corner arrow rather than the straight one the rest of the site
              uses for "onward": this is the only link in the section that
              leaves, and saying so in the glyph as well as in the announcement
              means nobody has to discover it by pressing it.
            */}
            <span
              aria-hidden
              className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:-translate-y-0.5"
            >
              &#8599;
            </span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : null}
      </article>
    </Reveal>
  );
}
