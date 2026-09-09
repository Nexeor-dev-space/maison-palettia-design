import Image from "next/image";
import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { EXPERIENCE_IMAGES, type CaptionedImage } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Homepage section 04 — the experience.
 *
 * The workshops section answers "what can I do?"; this one answers "what does
 * it feel like?", and it is built to be read slowly. Three movements, each
 * given far more room than it needs, so the page stops moving for a moment:
 *
 *   1. the words, held to the left, with the room opening up beside them;
 *   2. the making, small and close, alone on a wide field;
 *   3. the material, on a lighter panel that runs off the right edge.
 *
 * Nothing here is a feature card and nothing is a claim. The argument is
 * carried by what the photographs are of — a shelf of other people's cups,
 * a hand in wet clay, pigment sinking into paper — and by the amount of
 * silence between them.
 *
 * Server component; every animation lives in the client components it
 * composes.
 */
export function Experience() {
  const { studio, making, pigment } = EXPERIENCE_IMAGES;

  return (
    <section
      aria-labelledby="experience-heading"
      className="relative overflow-hidden bg-cream py-[5.5rem] md:py-section lg:py-section-lg"
    >
      <Container className="relative">
        {/* ---------- 1. The words, and the room ------------------------- */}
        <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10">
          <div className="col-span-12 md:col-span-8 lg:col-span-5">
            <Reveal>
              <p className="flex items-center gap-4 text-xs font-medium uppercase tracking-eyebrow text-text">
                <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
                The Maison Palettia Experience
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <h2
                id="experience-heading"
                className="mt-9 text-[1.9rem] font-light uppercase leading-[1.02] tracking-[-0.02em] xs:text-[2.25rem] sm:text-[2.75rem] md:mt-11 lg:text-[3rem] xl:text-[3.5rem]"
              >
                Make space
                <br />
                for creativity.
              </h2>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mt-8 max-w-[26rem] text-[0.95rem] leading-[1.85] text-text/80 md:mt-10 md:text-base">
                At Maison Palettia, the process matters as much as the finished piece.
                Come slow down, experiment, get your hands dirty, and enjoy making
                something of your own.
              </p>
            </Reveal>

            {/*
              The first annotation. It sits in the text column but a long way
              below the paragraph — the distance is what makes it read as a
              note in the margin rather than as a fourth line of copy.
            */}
            <Annotation className="mt-20 md:mt-24 lg:mt-28">Slow down</Annotation>
          </div>

          {/*
            The room. Lifted so its top edge sits above the heading's baseline
            and run off the right gutter, which is what stops the movement
            reading as a text column beside an image column.
          */}
          <Plate
            image={studio}
            aspect="aspect-[3/2]"
            sizes="(min-width: 1024px) 52vw, (min-width: 768px) 92vw, 94vw"
            className="col-span-12 -mr-6 mt-14 md:-mr-10 md:mt-16 lg:col-span-6 lg:col-start-7 lg:-mr-16 lg:-mt-14"
          />
        </div>


        {/* ---------- 2. The making, small and close --------------------- */}
        <div className="mt-24 grid grid-cols-12 gap-x-6 md:mt-32 md:items-end lg:mt-48 lg:gap-x-10">
          <Plate
            image={making}
            aspect="aspect-[4/5]"
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 72vw"
            className="col-span-9 xs:col-span-8 md:col-span-5 lg:col-span-4 lg:col-start-2"
          />

          {/*
            Hung off the foot of the row rather than centred against the
            photograph, so the eye crosses the empty middle on a diagonal and
            carries on down into the last movement.
          */}
          <Annotation className="col-span-12 mt-14 md:col-span-6 md:col-start-7 md:mb-14 md:mt-0 lg:col-span-4 lg:col-start-9 lg:mb-20">
            Make something yours
          </Annotation>
        </div>

        {/* ---------- 3. The material, on White Rock --------------------- */}
        <div className="relative mt-24 md:mt-32 lg:mt-44">
          {/*
            The one shift of ground in the section: a lighter field that
            starts inside the measure and runs off the right edge, where the
            section clips it. Quiet enough to read as art direction rather
            than as a second colour.
          */}
          <div
            aria-hidden
            className="absolute -inset-y-10 left-[12%] right-[-50vw] bg-surface md:-inset-y-14 md:left-[28%] lg:-inset-y-20"
          />

          {/*
            The photograph comes first in the source so that stacked, the
            script line lands last and actually closes the section; both items
            carry explicit column starts, so side by side the script still
            sits to its left.
          */}
          <div className="relative grid grid-cols-12 items-end gap-x-6 lg:gap-x-10">
            <Plate
              image={pigment}
              aspect="aspect-square"
              sizes="(min-width: 1024px) 37vw, (min-width: 768px) 52vw, 80vw"
              className="col-span-10 col-start-3 xs:col-span-9 xs:col-start-4 md:col-span-7 md:col-start-6 lg:col-span-5 lg:col-start-7"
            />

            {/*
              The script accent, used once and small — a hand-written note at
              the end of the section, not a heading. It closes the narrative
              the three photographs open: come in, make something, take it
              home.
            */}
            <Reveal
              variant="fadeIn"
              className="col-span-12 mt-12 md:col-span-5 md:col-start-1 md:row-start-1 md:mt-0 lg:col-span-3 lg:col-start-2"
            >
              <p className="font-display text-[1.75rem] leading-none tracking-normal text-primary md:text-[2rem] lg:text-[2.25rem]">
                take it home
              </p>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

interface PlateProps {
  image: CaptionedImage;
  /** Aspect-ratio utility. Each plate in the section is a different shape. */
  aspect: string;
  sizes: string;
  className?: string;
}

/**
 * One photograph and its wall label.
 *
 * The hover drift lives on its own node: <Reveal> settles the plate by writing
 * an inline transform, which a utility class on the same element could never
 * override.
 */
function Plate({ image, aspect, sizes, className }: PlateProps) {
  return (
    <figure className={className}>
      <div className={cn("group relative w-full overflow-hidden bg-text/5", aspect)}>
        <Reveal variant="imageReveal" className="absolute inset-0">
          <div className="relative h-full w-full transition-transform duration-[1400ms] ease-editorial motion-safe:group-hover:scale-[1.03]">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes={sizes}
              style={{ objectPosition: image.position }}
              className="object-cover"
            />
          </div>
        </Reveal>
      </div>

      <Reveal variant="fadeIn" delay={0.2}>
        <figcaption className="mt-4 flex items-center gap-3 text-[0.65rem] uppercase tracking-eyebrow text-text/75 xs:text-[0.7rem]">
          <span aria-hidden className="h-px w-5 shrink-0 bg-text/25" />
          {image.caption}
        </figcaption>
      </Reveal>
    </figure>
  );
}

/** A note in the margin: bigger than a caption, quieter than a heading. */
function Annotation({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Reveal className={className}>
      <p className="text-[1.05rem] font-light uppercase leading-none tracking-[0.22em] text-text/80 md:text-[1.2rem] lg:text-[1.35rem]">
        {children}
      </p>
    </Reveal>
  );
}
