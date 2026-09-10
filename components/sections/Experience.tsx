import Image from "next/image";
import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { EXPERIENCE_IMAGES, type CaptionedImage } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * The height the two detail plates share from `md` up, so their tops and feet
 * both land on a line. Proportional to the viewport so the pair keeps its
 * relationship to the band above it, and capped so it stops growing on a very
 * wide display long before the photographs run out of pixels.
 */
const PLATE_HEIGHT = "md:aspect-auto md:h-[42vw] md:max-h-[46rem]";

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
          shape="aspect-[16/10] md:aspect-[2/1]"
          sizes="(min-width: 90rem) 1312px, (min-width: 64rem) calc(100vw - 8rem), (min-width: 48rem) calc(100vw - 5rem), calc(100vw - 3rem)"
          className="mt-16 md:mt-20 lg:mt-24"
        />

        {/*
          The two details, side by side across the whole measure, parted by a
          single gutter and cut to one height.

          The height is what makes the pair read. Given their own aspect
          ratios they stood 116px apart at the top, and that ragged edge —
          intended as asymmetry — simply read as two pictures that had failed
          to line up. Sharing a height puts all four corners on two lines, and
          the asymmetry moves where it belongs: into the widths, which stay
          five columns against seven, and into what each frame then holds — a
          near-square of hands at the wheel beside a long landscape of
          pigment.

          A height rather than a pair of matched aspect ratios, because the
          columns are proportional and the gutter is not, so no fixed ratio
          holds both plates level at every width. Stacked on a phone there is
          no pair to level, so each takes its own shape back.
        */}
        <div className="mt-20 grid grid-cols-12 items-start gap-x-6 md:mt-24 lg:mt-28 lg:gap-x-10">
          <Plate
            image={making}
            shape={`${PLATE_HEIGHT} aspect-[4/5]`}
            sizes="(min-width: 64rem) 39vw, (min-width: 48rem) 38vw, calc(100vw - 3rem)"
            className="col-span-9 md:col-span-5 lg:col-span-5"
          />

          <Plate
            image={pigment}
            shape={`${PLATE_HEIGHT} aspect-square`}
            sizes="(min-width: 64rem) 55vw, (min-width: 48rem) 54vw, calc(100vw - 3rem)"
            className="col-span-12 mt-12 md:col-span-7 md:col-start-6 md:mt-0 lg:col-span-7 lg:col-start-6"
          />
        </div>

        {/* ---------- The close ----------------------------------------- */}
        <div className="mt-16 grid grid-cols-12 items-baseline gap-x-6 gap-y-8 md:mt-20 lg:gap-x-10">
          <Annotation className="col-span-12 md:col-span-6">Make something yours</Annotation>

          {/*
            The script face, used once in the section and small — a
            hand-written note at the end, not a heading.
          */}
          <Reveal
            variant="fadeIn"
            delay={0.1}
            className="col-span-12 md:col-span-6 md:col-start-7 lg:col-span-5 lg:col-start-8"
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
  /**
   * The frame's shape: an aspect ratio, and from `md` up on the pair, a shared
   * height that overrides it.
   */
  shape: string;
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
function Plate({ image, shape, sizes, className }: PlateProps) {
  return (
    <figure className={className}>
      <div className={cn("group relative w-full overflow-hidden bg-text/5", shape)}>
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

/**
 * A note in the margin: bigger than a caption, quieter than a heading.
 *
 * Leading rather than `leading-none`, because one of the two sits in a
 * three-column well between the photographs and wraps there — set solid, the
 * two lines would touch.
 */
function Annotation({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Reveal className={className}>
      <p className="text-[1.05rem] font-light uppercase leading-[1.3] tracking-[0.22em] text-text/80 md:text-[1.2rem] lg:text-[1.35rem]">
        {children}
      </p>
    </Reveal>
  );
}
