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
 * it feel like?", and it is built to be read slowly.
 *
 * The composition is a strict two-column measure rather than a set of free
 * offsets. Everything in the section starts on one of exactly two lines — the
 * left edge of the measure, or column 8 — and every row pairs one thing on
 * each. The asymmetry comes from what sits in those columns (a heading against
 * a paragraph, a quarter-width photograph against a wider one) and from the
 * distance between rows, never from an element finding an edge of its own.
 *
 * Nothing bleeds past the measure. An earlier version ran the first photograph
 * off the right gutter on a negative margin, which holds only until the
 * viewport passes the container's max width: past that the container starts
 * centring itself, and a negative margin cancels the padding but not the auto
 * margin — so the bleed stopped short of the edge and simply looked broken.
 *
 * Nothing here is a feature card and nothing is a claim. The argument is
 * carried by what the photographs are of — a shelf of other people's cups, a
 * hand in wet clay, pigment sinking into paper — and by the silence around
 * them.
 *
 * Server component; every animation lives in the client components it
 * composes.
 */
export function Experience() {
  const { studio, making, pigment } = EXPERIENCE_IMAGES;

  return (
    <section
      aria-labelledby="experience-heading"
      className="bg-cream py-[5.5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        {/* ---------- The masthead -------------------------------------- */}
        <Reveal>
          {/*
            A rule across the full measure. It states where the section's grid
            begins and ends before any content does, which is what lets the
            rows below read as placed rather than drifting.
          */}
          <p className="border-t border-text/20 pt-5 text-xs font-medium uppercase tracking-eyebrow text-text">
            The Maison Palettia Experience
          </p>
        </Reveal>

        {/* ---------- The statement, against the story ------------------- */}
        <div className="mt-14 grid grid-cols-12 gap-x-6 md:mt-16 lg:mt-20 lg:gap-x-10">
          <Reveal className="col-span-12 lg:col-span-6">
            <h2
              id="experience-heading"
              className="text-[2rem] font-light uppercase leading-[1.02] tracking-[-0.02em] xs:text-[2.4rem] sm:text-[3rem] lg:text-[3.25rem] xl:text-[3.75rem]"
            >
              Make space
              <br />
              for creativity.
            </h2>
          </Reveal>

          <div className="col-span-12 mt-10 lg:col-span-5 lg:col-start-8 lg:mt-2">
            <Reveal delay={0.1}>
              <p className="max-w-[34rem] text-[0.95rem] leading-[1.85] text-text/80 md:text-base">
                At Maison Palettia, the process matters as much as the finished piece.
                Come slow down, experiment, get your hands dirty, and enjoy making
                something of your own.
              </p>
            </Reveal>

            {/*
              The first annotation, set below the paragraph it answers. The
              distance is what makes it read as a note in the margin rather
              than as a closing line of the copy.
            */}
            <Annotation className="mt-16 md:mt-20">Slow down</Annotation>
          </div>
        </div>

        {/* ---------- The room, across the whole measure ----------------- */}
        <Plate
          image={studio}
          aspect="aspect-[16/10] md:aspect-[2/1]"
          sizes="(min-width: 90rem) 1312px, (min-width: 64rem) calc(100vw - 8rem), (min-width: 48rem) calc(100vw - 5rem), calc(100vw - 3rem)"
          className="mt-16 md:mt-20 lg:mt-24"
        />

        {/*
          The two details, hung from a shared baseline. Aligning the feet
          rather than the heads is what puts both captions on one line while
          leaving the top edges ragged — the photographs are different shapes
          and different widths, and that is where the asymmetry comes from.
        */}
        <div className="mt-24 grid grid-cols-12 items-end gap-x-6 md:mt-32 lg:mt-40 lg:gap-x-10">
          <Plate
            image={making}
            aspect="aspect-[4/5]"
            sizes="(min-width: 90rem) 411px, (min-width: 64rem) 29vw, (min-width: 48rem) 38vw, calc(100vw - 3rem)"
            className="col-span-9 md:col-span-5 lg:col-span-4"
          />

          <Plate
            image={pigment}
            aspect="aspect-square"
            sizes="(min-width: 90rem) 523px, (min-width: 64rem) 37vw, (min-width: 48rem) 46vw, calc(100vw - 3rem)"
            className="col-span-12 mt-14 md:col-span-6 md:col-start-7 md:mt-0 lg:col-span-5 lg:col-start-8"
          />
        </div>

        {/* ---------- The close ----------------------------------------- */}
        <div className="mt-20 grid grid-cols-12 items-baseline gap-x-6 md:mt-24 lg:gap-x-10">
          <Annotation className="col-span-12 md:col-span-6">Make something yours</Annotation>

          {/*
            The script face, used once in the section and small — a
            hand-written note at the end, not a heading.
          */}
          <Reveal
            variant="fadeIn"
            delay={0.1}
            className="col-span-12 mt-8 md:col-span-6 md:col-start-7 md:mt-0 lg:col-span-5 lg:col-start-8"
          >
            <p className="font-display text-[1.75rem] leading-none tracking-normal text-primary md:text-[2rem] lg:text-[2.25rem]">
              take it home
            </p>
          </Reveal>
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
