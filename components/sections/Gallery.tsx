import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { GALLERY_IMAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * How each plate is cropped and where it sits.
 *
 * Two rows of two, wide-then-narrow and narrow-then-wide. A grid of identical
 * crops reads as a contact sheet — it says "here is our photography" — and the
 * point of this section is the opposite: it should read as glimpses of an
 * afternoon, so no two plates are the same shape.
 *
 * THE STAGGER COMES FROM THE CROPS, NOT FROM A MARGIN. Each row used to drop
 * its second plate by `mt-14` on top of shapes that were already different
 * heights, and the result was four edges per row that answered to nothing:
 * measured at 1440, row one ran 0–595 and 56–753, row two 0–697 and 56–585,
 * leaving 157px of dead space under one plate and 112px under another, with
 * the two rows themselves 56px apart in height. Staggered, but with no anchor
 * — which reads as disordered rather than as composed.
 *
 * The rows are bottom-aligned instead (`items-end` on the list). One ruled
 * edge per row, and the tops left ragged by the difference between a 4:3 and a
 * 4:5 — about 100px in the first row and 170px in the second. The offset is
 * still there and still uneven between the rows; it is now a consequence of
 * the pictures rather than a number sitting on top of them, and both rows come
 * out the same height, so the section has a rhythm instead of a wobble.
 *
 * The spans were 4/3/3/2 across a single row, which put the last photograph at
 * 204px on a 1440 screen — small enough to read as an afterthought rather than
 * as part of the set. Seven and five, twice, keeps every plate at a size worth
 * looking at: 793px and 557px at that width.
 *
 * Two up on a phone throughout, because four stacked plates would be most of a
 * screen each and this section is a glance, not a gallery to browse.
 */
const PLATES = [
  "col-span-6 aspect-[4/3] md:col-span-7",
  "col-span-6 aspect-[4/5] md:col-span-5",
  "col-span-6 aspect-[4/5] md:col-span-5",
  "col-span-6 aspect-[3/2] md:col-span-7",
] as const;

/**
 * Homepage — the gallery.
 *
 * Not a portfolio, and deliberately not the finished-work strip that used to
 * sit on this page. Every photograph here is of the making rather than of the
 * made: a brush half-way through a bloom, pigment still finding its edges on
 * wet paper. The section exists to let someone picture themselves at the
 * table, which is a different job from showing what the table produces.
 *
 * It sits between the programme and the practical sections rather than near
 * the top, because it is reassurance rather than information — it answers
 * "what would this actually be like" for someone already considering a date,
 * and it should never be what a visitor has to scroll past to reach one.
 *
 * NO CALL TO ACTION. The homepage has one primary action and it is booking; a
 * gallery with its own button underneath would be a second, competing with the
 * events above it for no gain. The photographs do their work silently.
 *
 * Server component — four <Image>s and nothing that needs a browser.
 */
export function Gallery() {
  if (GALLERY_IMAGES.length === 0) return null;

  return (
    <Container as="section" aria-labelledby="gallery-heading" className="py-[4.5rem] md:py-section">
      <div className="grid grid-cols-12 items-end gap-x-6 lg:gap-x-10">
        <Reveal className="col-span-12 md:col-span-6">
          <p className="flex items-center gap-4 text-label font-medium uppercase tracking-eyebrow text-text">
            <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
            In the room
          </p>
          <h2 id="gallery-heading" className="mt-6 text-h2 font-light uppercase tracking-[-0.02em]">
            What an afternoon looks like.
          </h2>
        </Reveal>

        <Reveal delay={0.15} className="col-span-12 mt-5 md:col-span-5 md:col-start-8 md:mt-0">
          <p className="max-w-[24rem] text-body text-text/80">
            Ordinary hands and wet paint. Nobody here has done it before either.
          </p>
        </Reveal>
      </div>

      <ul className="mt-12 grid grid-cols-12 items-end gap-x-4 gap-y-6 md:mt-16 md:gap-x-6 lg:gap-x-8">
        {GALLERY_IMAGES.map((plate, i) => (
          <li key={plate.src} className={cn("relative", PLATES[i % PLATES.length])}>
            <Reveal variant="imageReveal" className="absolute inset-0">
              <div className="relative h-full w-full overflow-hidden bg-surface-alt">
                <Image
                  src={plate.src}
                  alt={plate.alt}
                  fill
                  sizes="(min-width: 768px) 28vw, 46vw"
                  style={{ objectPosition: plate.position ?? "50% 50%" }}
                  className="object-cover"
                />
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </Container>
  );
}
