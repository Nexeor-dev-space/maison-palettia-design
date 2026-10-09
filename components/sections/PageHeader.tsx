import Image from "next/image";

import { groundShapes } from "@/components/motion/groundShapes";
import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { INK } from "@/components/sections/hero/composition";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { OPENING_STATEMENT } from "@/lib/brand";
import type { ImageAsset } from "@/types";

/**
 * ==========================================================================
 * THE SUB-PAGE MASTHEAD — eyebrow, a script statement, the line that answers it
 * ==========================================================================
 *
 * The `pageHeader` block (SPEC §E.1). Every sub-page opens on the same
 * three things, and they were hand-written on each page; these are those
 * mastheads, moved here unchanged except that the words arrive as props.
 * Two compositions:
 *
 *   `statement` (/faq, /policies, and any new landing page) — Light Sage,
 *       the heading in seven columns and its line beside it on the baseline,
 *       one cut-out on the top-right edge. The two pages differ only in that
 *       cut-out, so it is a prop.
 *   `gallery` — near-white, the heading and its line in one column and a
 *       layered pair of photographs in the other.
 *
 * Three other pages open on a header that shares a section with what comes
 * after it (/locations, /events, /private-events/book); those are drawn by
 * that block's adapter — see `TAKES_HEADER` in components/blocks/BlockRenderer.
 */

export interface PageHeaderProps {
  /** The page's h1 id — kept per page so the in-page `aria-labelledby` stays what it was. */
  id: string;
  eyebrow?: string | null;
  lines: readonly string[];
  standfirst?: string | null;
}

/**
 * Each page's masthead words before the CMS — the launch wording a page with
 * no stored document renders (components/blocks/layouts.ts), and what the
 * seed writes into its `pageHeader` block. Includes the three pages whose
 * header is folded into the block after it.
 */
export const HEADER_LAUNCH: Record<string, { eyebrow: string; lines: readonly string[]; standfirst: string }> = {
  gallery: { eyebrow: "Gallery", lines: ["A Little Space", "for Big Creativity."], standfirst: OPENING_STATEMENT.body },
  faq: {
    eyebrow: "Questions",
    lines: ["Before You", "Come and Make."],
    standfirst: "Answers to common questions about Maison Palettia events.",
  },
  policies: {
    eyebrow: "Policies",
    lines: ["How the", "Maison Works."],
    standfirst: "What applies when you come to make something with us.",
  },
  locations: {
    eyebrow: "Locations",
    lines: ["Where to", "Find Us."],
    standfirst: "Find Maison Palettia in the places you already love to visit \u2014 and come make something while you\u2019re there.",
  },
  events: { eyebrow: "Experiences", lines: ["Make It", "Your Way."], standfirst: "" },
  "private-events-book": {
    eyebrow: "Private events",
    lines: ["Plan Your Private Experience."],
    standfirst: "Tell us when, who\u2019s coming and what you\u2019d like to make. We\u2019ll help turn the idea into an experience made for your group.",
  },
};

/* ---- /faq, /policies, landing pages -------------------------------------- */

export function StatementHeader({
  id,
  eyebrow,
  lines,
  standfirst,
  mark = "wave",
}: PageHeaderProps & {
  /** The cut-out breaking the top-right edge: the FAQ's wave or the policies' splash. */
  mark?: "wave" | "splash";
}) {
  return (
    <section
      aria-labelledby={id}
      className="relative isolate overflow-clip bg-sage pt-[4rem] pb-[3rem] md:pt-[5.5rem] md:pb-[3.5rem]"
    >
      <SectionShapes plan={groundShapes("sage")} />
      {/*
        ONE MARK, ON THE TOP-RIGHT EDGE. <SectionShapes> in the section below
        already opens with a mark at its own top-left, so the corner reads as
        marked either way and the banner keeps the corner the heading and its
        line never reach.
      */}
      <span
        aria-hidden
        className={`pointer-lift pointer-events-none absolute -right-6 ${mark === "wave" ? "top-[12%]" : "top-[14%]"} deco-mark w-24 -rotate-12 xl:w-28`}
        style={{ "--ax": 0.9, "--lift": 0.18 } as React.CSSProperties}
      >
        <DoodleMark name={mark} color={INK.lavender} treatment="draw" delay={420} depth={16} />
      </span>

      <Container className="relative">
        {/*
          TWO COLUMNS, BECAUSE THE BANNER WAS HALF EMPTY. The line sits beside
          the heading on its baseline — the arrangement <WhereWeCreate> and
          <Experiences> use — which fills the width AND takes about 90px of
          height out of the banner, so what follows starts higher up the page.
        */}
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-7">
            {eyebrow ? (
              <Reveal>
                <Eyebrow>{eyebrow}</Eyebrow>
              </Reveal>
            ) : null}

            {/* `as="h1"` — <DisplayHeading> defaults to h2, and this is the
                page's title. */}
            <DisplayHeading as="h1" id={id} className="mt-8 md:mt-10" lines={lines} />
          </div>

          <Reveal delay={0.15} className="col-span-12 lg:col-span-5 lg:pb-3">
            {/* No `max-w`: the column is the measure — see <ExperienceDiscovery>. */}
            {standfirst ? <p className="text-statement text-text/85">{standfirst}</p> : null}
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ---- /gallery ------------------------------------------------------------ */

const GALLERY_FEATURE: ImageAsset = {
  src: "/images/experiences/GLASS_PAINTING.jpg",
  alt: "A hand holding an arched glass panel painted with a dragonfly among red and pink flowers on green leaves, the sun throwing its colours onto the wall.",
};

const GALLERY_INSET: ImageAsset = {
  src: "/images/experiences/CANDLE_MAKING.jpg",
  alt: "Two poured candles in glass jars on a white tray, one set with pink wax flowers and one with pink hearts, sprigs of gypsophila beside them.",
};

/** The gallery's opening: an editorial masthead, not the homepage banner. */
export function GalleryHeader({
  id,
  eyebrow,
  lines,
  standfirst,
  image = GALLERY_FEATURE,
  inset = GALLERY_INSET,
}: PageHeaderProps & {
  /** The feature — a process frame, the creative world up close. */
  image?: ImageAsset | null;
  /** The smaller overlapping square — a finished activity. */
  inset?: ImageAsset | null;
}) {
  return (
    <section aria-labelledby={id} className="relative isolate overflow-clip bg-surface">
      <SectionShapes plan={groundShapes("surface")} />
      <Container className="relative py-[3.5rem] md:py-[4.5rem] lg:py-[5.5rem]">
        <div className="grid grid-cols-12 items-center gap-x-6 gap-y-12 lg:gap-x-10">
          {/* the words */}
          <div className="col-span-12 lg:col-span-6">
            {eyebrow ? (
              <Reveal>
                <Eyebrow>{eyebrow}</Eyebrow>
              </Reveal>
            ) : null}
            <DisplayHeading as="h1" id={id} className="mt-7 md:mt-9" lines={lines} />
            {standfirst ? (
              <Reveal delay={0.16}>
                <p className="script-lede max-w-[34rem] text-lead text-text/85">{standfirst}</p>
              </Reveal>
            ) : null}
          </div>

          {/* the layered opening image */}
          <div className="col-span-12 lg:col-span-6">
            <Reveal variant="imageReveal" delay={0.1}>
              <div className="relative mx-auto max-w-[32rem] lg:mr-0">
                {/* the feature, a process frame — the creative world up close */}
                <figure className="plate relative block aspect-[4/5] w-full overflow-clip rounded-[1.5rem] rotate-[1.2deg]">
                  {image ? (
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      priority
                      sizes="(min-width: 1024px) 40vw, 92vw"
                      className="object-cover"
                      {...(image.position ? { style: { objectPosition: image.position } } : {})}
                    />
                  ) : null}
                </figure>

                {/* a smaller overlapping square, a finished activity */}
                {inset ? (
                  <figure className="plate absolute -bottom-6 -left-5 hidden w-[42%] overflow-clip rounded-[1.1rem] rotate-[-3deg] sm:block">
                    <span className="relative block aspect-square w-full">
                      <Image
                        src={inset.src}
                        alt={inset.alt}
                        fill
                        sizes="(min-width: 1024px) 18vw, 40vw"
                        className="object-cover"
                        {...(inset.position ? { style: { objectPosition: inset.position } } : {})}
                      />
                    </span>
                  </figure>
                ) : null}

                {/* the brand's cut-out, breaking the top-right corner */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-4 -top-6 w-[4.5rem] rotate-[8deg] md:-right-6 md:w-[5.75rem]"
                >
                  <DoodleMark name="splash" color={INK.lilac} treatment="draw" delay={260} />
                </span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-3 bottom-[18%] deco-mark w-[2.5rem] rotate-[-6deg]"
                >
                  <DoodleMark name="coral" color={INK.terracotta} treatment="draw" delay={420} />
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
