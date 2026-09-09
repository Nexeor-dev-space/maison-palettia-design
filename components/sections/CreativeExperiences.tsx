import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { Signature } from "@/components/ui/Signature";
import { getDisciplines } from "@/lib/disciplines";
import { cn } from "@/lib/utils";
import type { Discipline } from "@/types";

/**
 * The section heading, in two masked lines.
 *
 * "creative side." is the line that sets the ceiling — fourteen characters of
 * uppercase in a six-column well, which at `lg` is only about 430px wide. The
 * scale steps back at `md`, where the well is narrower still, and opens up
 * again at `xl`. It must never wrap or hyphenate.
 */
const HEADING_LINE =
  "block font-light uppercase leading-[0.98] tracking-[-0.02em] " +
  "text-[1.9rem] xs:text-[2.2rem] sm:text-[2.6rem] md:text-[2.5rem] lg:text-[2.9rem] xl:text-[3.4rem]";

/**
 * Homepage section 05 — creative experiences.
 *
 * Four doors, hung rather than tabulated. The section before this one answers
 * "what does it feel like?"; this answers "what can I explore?", and it has to
 * do it by looking rather than by reading — so the four strand names are set
 * as the largest type on the page after the hero, and the photographs are
 * given four different footprints so no two read as the same object.
 *
 * The composition is a hang, not a grid, and the proof is that no two rows are
 * alike. The opening plate shares its band with the heading, so the section
 * begins mid-exploration instead of behind a masthead. The second strand is a
 * small square alone on the left with eight empty columns beside it. The third
 * runs nearly the full measure as a wide band with its label set beside it
 * rather than under it. The fourth returns to a tall plate off-centre, with a
 * Sage panel reaching out from behind it into the space the closing link sits
 * in. Right, left, across, centre-left: the eye is made to travel.
 *
 * Nothing here is a card. No two plates share a width, a proportion, a type
 * size or a baseline, and the arrangement of each unit differs — which is the
 * whole difference between a curated collection and four boxes in a row.
 *
 * Awaited in place rather than suspended, for the reason set out in
 * <UpcomingWorkshops>: a boundary would strand a JavaScript-less visitor on
 * the fallback, and the root layout works hard to avoid exactly that.
 *
 * Server component; every animation lives in the client components it
 * composes.
 */
export async function CreativeExperiences() {
  const disciplines = await getDisciplines();
  if (disciplines.length === 0) return null;

  const [opening, ...rest] = disciplines;

  return (
    <section
      aria-labelledby="creative-experiences-heading"
      className="bg-sage py-[5.5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        {/* ---- Band 1: the masthead and the opening plate, side by side --- */}
        <div className="grid grid-cols-12 items-start gap-x-6 lg:gap-x-10">
          <div className="col-span-12 md:col-span-7 lg:col-span-6">
            <SectionHead />
          </div>

          <Plate
            discipline={opening}
            index={1}
            layout={OPENING}
            className="col-span-12 mt-14 md:col-span-5 md:col-start-8 md:mt-0"
          />
        </div>

        {/* ---- The rest of the hang -------------------------------------- */}
        <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10">
          {rest.map((discipline, i) => (
            <Plate
              key={discipline.slug}
              discipline={discipline}
              index={i + 2}
              layout={HANG[i % HANG.length]}
              className={HANG[i % HANG.length].placement}
            />
          ))}

          {/*
            The closing link is placed inside the hang rather than after it, so
            it lands in the empty right-hand half of the last row instead of
            starting a row of its own.
          */}
          <Reveal
            variant="fadeIn"
            className="col-span-12 mt-14 self-end md:col-span-6 md:col-start-7 md:mt-0 md:self-center lg:col-span-4 lg:col-start-9"
          >
            <Link
              href="/workshops"
              className="group inline-flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-text"
            >
              <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
                Explore all experiences
              </span>
              <span
                aria-hidden
                className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
              >
                &#8594;
              </span>
            </Link>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/** Label, statement, signature, and the one paragraph the section gets. */
function SectionHead() {
  return (
    <>
      <Reveal>
        <p className="flex items-center gap-4 text-xs font-medium uppercase tracking-eyebrow text-text">
          {/* Deep Lilac rather than the Terracotta the warm-ground sections
              use: Terracotta on Light Sage measures 2.36:1, under the 3:1 a
              graphical mark owes, where Deep Lilac clears it at 3.83:1. */}
          <span aria-hidden className="h-px w-9 shrink-0 bg-primary md:w-12" />
          Creative Experiences
        </p>
      </Reveal>

      <h2 id="creative-experiences-heading" className="mt-8 md:mt-10 lg:mt-12">
        {/* Two lines, one trigger. The explicit space keeps the accessible
            name reading as a sentence rather than one run-on word. */}
        <Stagger>
          <HeadingLine>Explore your</HeadingLine> <HeadingLine>creative side.</HeadingLine>
        </Stagger>
      </h2>

      {/*
        A note under the heading, not a heading of its own.

        This was the script face until the brand pass; the script had reached
        every section on the homepage, and a gesture that appears everywhere
        is not a rare one. It is Deep Lilac on the sage now, letterspaced wide
        enough to read as signage rather than as a label.
      */}
      <Reveal variant="fadeIn" delay={0.3}>
        <Signature ground="sage" className="mt-5 md:mt-6">
          where to begin
        </Signature>
      </Reveal>

      <Reveal delay={0.15}>
        <p className="mt-9 max-w-[28rem] text-[0.95rem] leading-[1.85] text-text/80 md:mt-10">
          From colour and clay to hands-on making, discover experiences designed to bring
          your ideas to life.
        </p>
      </Reveal>
    </>
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

/* ==========================================================================
   The hang
   ========================================================================== */

interface PlateLayout {
  /** Where the plate sits in the section's 12-column grid. */
  placement: string;
  /**
   * "stacked" sets the name over the photograph and the description under it,
   * so the word announces the door and the picture is what is behind it.
   * "split" moves the whole label beside a wide photograph instead — the one
   * unit in the section that is arranged differently, which is what stops the
   * four from reading as one repeated component.
   */
  arrangement: "stacked" | "split";
  aspect: string;
  sizes: string;
  /** The bigger the plate, the bigger its word. */
  nameSize: string;
  /** Inset at phone width, so the stack reads as a sequence, not a column. */
  inset: string;
  /** Reaches a White Rock panel out to the right of the photograph. Used once. */
  accent?: boolean;
  /**
   * Crowns the photograph with the Maison's entrance arch. Set on exactly one
   * plate in this section and one in the brand introduction, and nowhere else
   * on the site: the motif is meant to be recognised, which needs it to be
   * infrequent enough that a visitor notices the second one.
   */
  crown?: boolean;
}

const NAME_LEAD = "text-[1.9rem] xs:text-[2.15rem] lg:text-[2.4rem] xl:text-[2.7rem]";
const NAME_QUIET = "text-[1.55rem] xs:text-[1.75rem] lg:text-[1.9rem]";

/** The opening plate. Placed by the band it shares with the heading. */
const OPENING: PlateLayout = {
  placement: "",
  arrangement: "stacked",
  aspect: "aspect-[4/5]",
  sizes: "(min-width: 90rem) 525px, (min-width: 48rem) 36vw, calc(100vw - 4.5rem)",
  nameSize: NAME_LEAD,
  inset: "mr-6 md:mr-0",
  crown: true,
};

/**
 * The rhythm the remaining strands cycle through: a small square alone on the
 * left, a wide band across the measure, a tall plate off-centre. Indexed with
 * a modulo rather than written out four times, so a fifth strand from the CMS
 * extends the hang instead of falling out of it.
 */
const HANG: PlateLayout[] = [
  {
    // Small, left, and lifted into the empty quarter beneath the heading.
    placement: "col-span-12 mt-16 md:col-span-4 md:mt-24 lg:col-span-4 lg:-mt-64",
    arrangement: "stacked",
    aspect: "aspect-square",
    sizes: "(min-width: 90rem) 415px, (min-width: 64rem) 29vw, (min-width: 48rem) 30vw, calc(100vw - 6rem)",
    nameSize: NAME_QUIET,
    inset: "ml-12 md:ml-0",
  },
  {
    // The wide band. Its label sits beside it, not beneath it.
    placement: "col-span-12 mt-24 md:mt-32 lg:mt-40",
    arrangement: "split",
    aspect: "aspect-[16/9]",
    sizes: "(min-width: 90rem) 865px, (min-width: 64rem) 64vw, (min-width: 48rem) calc(100vw - 5rem), calc(100vw - 3rem)",
    nameSize: NAME_LEAD,
    inset: "",
  },
  {
    // Tall, off-centre, with the White Rock panel reaching into the closing
    // link's half.
    placement:
      "col-span-12 mt-24 md:col-span-6 md:mt-32 lg:col-span-4 lg:col-start-2 lg:mt-40",
    arrangement: "stacked",
    aspect: "aspect-[2/3]",
    sizes: "(min-width: 90rem) 415px, (min-width: 64rem) 29vw, (min-width: 48rem) 45vw, calc(100vw - 5.5rem)",
    nameSize: NAME_QUIET,
    inset: "mr-10 md:mr-0",
    accent: true,
  },
];

/**
 * The strand name is the anchor, stretched across its plate by the `::after`,
 * so the photograph and the arrow are clickable while the tab order gains one
 * well-named stop per strand.
 */
const PLATE_LINK =
  "transition-colors duration-300 ease-soft hover:text-primary after:absolute after:inset-0";

interface PlateProps {
  discipline: Discipline;
  index: number;
  layout: PlateLayout;
  className?: string;
}

/** One door: a number, a word, a photograph and a way in. */
function Plate({ discipline, index, layout, className }: PlateProps) {
  const split = layout.arrangement === "split";

  const name = (
    <h3 className={cn("font-semibold uppercase leading-[1] tracking-[-0.01em]", layout.nameSize)}>
      <Link
        href={discipline.href}
        aria-label={`${discipline.name} — explore ${discipline.name.toLowerCase()} experiences`}
        className={PLATE_LINK}
      >
        {discipline.name}
      </Link>
    </h3>
  );

  const blurb = (
    <>
      <p className="max-w-[22rem] text-[0.9rem] leading-[1.8] text-text/75">
        {discipline.description}
      </p>
      <PlateAction name={discipline.name} />
    </>
  );

  const photo = (
    <figure className={cn("relative", layout.inset)}>
      {layout.accent ? (
        /*
          A panel rather than a shadow. It starts well inside the photograph's
          right edge and runs on into the empty half of the row, and the two
          share a foot — an offset block floating at mid-height would read as a
          stray rectangle rather than as part of the arrangement. Desktop only:
          at narrower widths there is no empty half for it to occupy.

          White Rock, now that the section itself is Light Sage. This is the
          Maison's own spatial pairing rather than an arbitrary tint — sage
          structure with a warm neutral surface set into it — and it is the
          reason the panel still reads as a built element instead of as a
          lighter patch of the same colour.
        */
        <span
          aria-hidden
          className="absolute bottom-0 left-[70%] top-[38%] hidden w-[75%] bg-surface-alt lg:block"
        />
      ) : null}
      <Photo
        image={discipline.image}
        aspect={layout.aspect}
        sizes={layout.sizes}
        crown={layout.crown}
      />
    </figure>
  );

  if (split) {
    return (
      <article className={cn("group relative", className)}>
        <div className="grid grid-cols-12 items-end gap-x-6 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-4 lg:pr-8">
            <Reveal variant="fadeIn">
              <PlateIndex index={index} />
            </Reveal>
            <Reveal delay={0.05} className="mt-5">
              {name}
            </Reveal>
            <Reveal delay={0.15} className="mt-5">
              {blurb}
            </Reveal>
          </div>

          <div className="col-span-12 mt-9 lg:col-span-8 lg:col-start-5 lg:mt-0">{photo}</div>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("group relative", className)}>
      <Reveal variant="fadeIn">
        <PlateIndex index={index} />
      </Reveal>
      <Reveal delay={0.05} className="mt-5">
        {name}
      </Reveal>
      <div className="mt-7">{photo}</div>
      <Reveal delay={0.15} className="mt-6">
        {blurb}
      </Reveal>
    </article>
  );
}

/**
 * "02", then a short rule. The section counts what it renders.
 *
 * The numeral is /85 rather than the /70 it carried before the brand pass:
 * Light Sage is a lighter ground than the off-white this section used to sit
 * on, and /70 measures 4.14:1 against it, under the 4.5:1 owed at this size.
 * The rule beside it takes Deep Lilac for the same reason the masthead's does
 * — Terracotta is 2.36:1 on sage and fails even the graphical bar.
 */
function PlateIndex({ index }: { index: number }) {
  return (
    <p className="flex items-center gap-4 text-[0.62rem] font-medium uppercase tracking-eyebrow text-text/85">
      {String(index).padStart(2, "0")}
      <span aria-hidden className="h-px w-6 shrink-0 bg-primary" />
    </p>
  );
}

interface PhotoProps {
  image: Discipline["image"];
  aspect: string;
  sizes: string;
  /** Crowns the plate with the entrance arch. See `PlateLayout.crown`. */
  crown?: boolean;
}

/**
 * The photograph, set as artwork: square edges, no border, nothing laid over
 * it. The reveal and the hover lift are separate transforms on separate
 * elements — <Reveal> settles the plate by writing an inline transform, which
 * a utility class on the same node could never override.
 */
function Photo({ image, aspect, sizes, crown }: PhotoProps) {
  return (
    <div className={cn("relative w-full overflow-hidden bg-text/5", aspect, crown && "arch")}>
      <Reveal variant="imageReveal" className="absolute inset-0">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-[1400ms] ease-editorial motion-safe:group-hover:scale-[1.035] motion-safe:group-focus-within:scale-[1.035]"
        />
      </Reveal>
    </div>
  );
}

/**
 * The visible way in. Not a link: each plate has exactly one anchor — its name
 * — stretched across the whole plate, so a second anchor to the same place
 * would double every strand in the tab order for nothing.
 */
function PlateAction({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="mt-6 flex w-fit items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-eyebrow text-primary"
    >
      <span className="border-b border-primary/40 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-primary group-focus-within:border-primary">
        Explore {name}
      </span>
      <span className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1 motion-safe:group-focus-within:translate-x-1">
        &#8594;
      </span>
    </span>
  );
}
