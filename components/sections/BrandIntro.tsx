import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { BRAND_INTRO_IMAGE } from "@/lib/constants";

/**
 * The statement, in three words. Sized per breakpoint rather than with a
 * single viewport clamp: the type sits in a seven-column well that narrows
 * sharply at `md`, so the scale has to step back there and pick up again once
 * the well widens. "EXPERIENCE." is the line that sets the limit — it must
 * always fit on one line, at every width, without hyphenation.
 */
const STATEMENT_LINE =
  "block font-light uppercase leading-[0.94] tracking-[-0.02em] " +
  "text-[2.25rem] xs:text-[2.75rem] sm:text-[3.5rem] md:text-[3.25rem] lg:text-[4rem] xl:text-[4.75rem]";

/**
 * Homepage section 02 — brand introduction.
 *
 * The hero is a dark, moving triptych; this is the exhale after it. A warm
 * cream field, one still photograph, and three words. The argument carries
 * over rather than restarting: the hero shows the wheel turning, and the plate
 * here holds a single moment of the same clay still enough to look at.
 *
 * The composition is a staircase. The label sits flush to the left edge of the
 * measure, the statement is indented from it, the paragraph indented again,
 * and the photograph is lifted above all three on the right — so no two
 * elements share an axis and the empty upper-left quarter is the point rather
 * than an accident.
 *
 * Server component; every animation lives in the client components it
 * composes.
 */
export function BrandIntro() {
  return (
    <section
      aria-labelledby="brand-intro-heading"
      className="bg-cream py-[5.5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        {/*
          `items-start` matters: without it the photograph stretches to the
          height of the text column and its crop is lost.
        */}
        <div className="grid grid-cols-12 items-start gap-x-6 lg:gap-x-10">
          {/* --- Text column: cols 1–7, indenting further at each step ------ */}
          <div className="col-span-12 md:col-span-7">
            <Reveal>
              <p className="flex items-center gap-4 text-xs font-medium uppercase tracking-eyebrow text-text">
                <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
                About Maison Palettia
              </p>
            </Reveal>

            <h2
              id="brand-intro-heading"
              className="mt-9 md:ml-[8%] md:mt-12 lg:ml-[10%] lg:mt-16"
            >
              {/*
                One trigger, three lines. Each line rises from behind its own
                mask; the explicit spaces keep the accessible name reading
                "Create. Explore. Experience." rather than one run-on word.
              */}
              <Stagger>
                <StatementLine>Create.</StatementLine>{" "}
                <StatementLine>Explore.</StatementLine>{" "}
                <StatementLine>Experience.</StatementLine>
              </Stagger>
            </h2>

            {/*
              The one flourish in the section, and it is a signature rather
              than a heading — the script face is used at a size where it reads
              as a hand-written note under the statement, and nowhere else.
            */}
            <Reveal variant="fadeIn" delay={0.35}>
              <p className="mt-6 font-display text-[1.75rem] leading-none tracking-normal text-primary md:ml-[32%] md:mt-7 md:text-[2rem] lg:ml-[38%] lg:text-[2.25rem]">
                made by hand
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="ml-6 mt-12 max-w-[30rem] md:ml-[16%] md:mt-16 lg:ml-[24%] lg:mt-20">
                <p className="text-[0.95rem] leading-[1.85] text-text/80 md:text-base">
                  Maison Palettia is a creative space where art, craft and community come
                  together. A place to slow down, make something with your hands, and leave
                  with an experience that stays with you.
                </p>

                <Link
                  href="/workshops"
                  className="group mt-9 inline-flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-text md:mt-10"
                >
                  <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
                    Explore the workshops
                  </span>
                  <span
                    aria-hidden
                    className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
                  >
                    &#8594;
                  </span>
                </Link>
              </div>
            </Reveal>
          </div>

          {/* --- Photograph: cols 8–12, lifted above the label -------------- */}
          <figure className="col-span-12 -mr-6 ml-10 mt-14 md:col-span-5 md:col-start-8 md:-mr-10 md:ml-0 md:-mt-2 lg:col-span-5 lg:mr-0 lg:-mt-16">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-alt md:aspect-[2/3] lg:aspect-[4/5]">
              <Reveal variant="imageReveal" className="absolute inset-0">
                <Image
                  src={BRAND_INTRO_IMAGE.src}
                  alt={BRAND_INTRO_IMAGE.alt}
                  fill
                  sizes="(min-width: 1024px) 41vw, (min-width: 768px) 45vw, 90vw"
                  style={{ objectPosition: BRAND_INTRO_IMAGE.position }}
                  className="object-cover"
                />
              </Reveal>
            </div>

            <Reveal variant="fadeIn" delay={0.25}>
              <figcaption className="mt-4 flex items-center gap-3 pr-6 text-[0.65rem] uppercase tracking-eyebrow text-text/75 xs:text-[0.7rem] md:pr-10 lg:pr-0">
                <span aria-hidden className="h-px w-5 shrink-0 bg-text/25" />
                Throwing on the wheel
              </figcaption>
            </Reveal>
          </figure>
        </div>
      </Container>
    </section>
  );
}

/** One masked line of the statement. The mask needs its own overflow parent. */
function StatementLine({ children }: { children: string }) {
  return (
    // The padding keeps descenders off the mask edge; the negative margin
    // takes the same amount back out of the line rhythm.
    <span className="block overflow-hidden pb-[0.14em] [&+span]:-mt-[0.14em]">
      <Reveal as="span" variant="maskUp" className={STATEMENT_LINE}>
        {children}
      </Reveal>
    </span>
  );
}
