import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { ABOUT_TEASER, EXPERIENCE_IMAGES } from "@/lib/constants";

/**
 * Homepage section 06 — the About teaser.
 *
 * A doorway, not a second About page. The homepage used to carry the Maison's
 * philosophy in full — the same eyebrow, title, description and script accent
 * that /about renders from the same constant — so the page was arguing its
 * case twice and the visitor read the same paragraph on two routes. This says
 * there is a story and points at where it is told.
 *
 * Deliberately small. It sits between the experience above and the booking
 * invitation below, and anything with more weight than a photograph and three
 * lines would interrupt the run to the one thing this page is for.
 */
export function AboutTeaser() {
  const plate = EXPERIENCE_IMAGES.studio;

  return (
    <Container
      as="section"
      aria-labelledby="about-teaser"
      className="py-[4.5rem] md:py-[6rem] lg:py-[7rem]"
    >
      <div className="grid grid-cols-12 items-center gap-x-6 gap-y-10 lg:gap-x-10">
        <Reveal variant="maskUp" className="col-span-12 lg:col-span-6">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-alt lg:aspect-[5/4]">
            <Image
              src={plate.src}
              alt={plate.alt}
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              style={{ objectPosition: plate.position }}
              className="object-cover"
            />
          </div>
        </Reveal>

        <div className="col-span-12 lg:col-span-5 lg:col-start-8">
          <Reveal delay={0.12}>
            <p className="text-label font-medium uppercase tracking-eyebrow text-text/75">
              {ABOUT_TEASER.eyebrow}
            </p>
            <h2
              id="about-teaser"
              className="mt-6 text-[1.75rem] font-light uppercase leading-[1.05] tracking-[-0.02em] md:text-[2.25rem] lg:text-[2.5rem]"
            >
              {ABOUT_TEASER.title.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <p className="mt-7 max-w-[30rem] text-body leading-[1.85] text-text/80">
              {ABOUT_TEASER.body}
            </p>

            <Link
              href="/about"
              className="group mt-9 inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text"
            >
              <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
                {ABOUT_TEASER.cta}
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
      </div>
    </Container>
  );
}
