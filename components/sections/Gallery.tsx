import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
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
 *
 * THE SEVEN-AND-FIVE SPLIT NOW RUNS BELOW `md` AS WELL, not just from it. The
 * mobile default used to pair the plates at equal width (col-span-6 each),
 * which let the 4:5 plate set the row's height outright and left the
 * shallower plate beside it stranded under a gap answering to its aspect
 * ratio rather than its crop: measured at 390px, 84px of bare ground above
 * the first row's 4:3 plate and 97px above the second row's 3:2 plate — 67%
 * and 87% of that plate's own height, which reads as a hole, not a ragged
 * edge. Handing the shallower aspect ratio the wider column — the same 7/5
 * split `md` already runs — claws back with width what the aspect ratio
 * gives away in height: the gap falls to 23px and 39px, 15% and 30% of the
 * plate's height, the same proportions the desktop composition already
 * carries. The `md:` prefix comes off both spans because the split is no
 * longer something that starts at a breakpoint; below `md` it is the reason
 * the raggedness still reads as composed instead of as a gap.
 */
/**
 * Each plate's span, and the `sizes` hint that goes with it.
 *
 * THE HINT IS PER SHAPE, because the plates are not one width.
 *
 * One flat `sizes="(min-width: 768px) 28vw, 46vw"` covered both shapes, and it
 * under-stated the wide plate badly enough to be visible. Measured off the
 * live page: every plate, wide or narrow, was fetched at the same w=828
 * bucket, while a `col-span-7` plate renders 793px at a 1440 window — about
 * 1586 device pixels on an ordinary 2x display. The browser was upscaling the
 * source roughly two-fold, in the one section on the page whose entire job is
 * showing photography.
 *
 * The figures below are the real proportions of the grid rather than round
 * numbers: seven of twelve columns is 55vw once the gutter and the 24-40px
 * column gap are taken out, five of twelve is 39vw. Below `md` the same 7/5
 * split applies to a two-up row, so the plates take about half the measure
 * each.
 */
const PLATES = [
  { span: "col-span-7 aspect-[4/3]", sizes: "(min-width: 768px) 55vw, 50vw" },
  { span: "col-span-5 aspect-[4/5]", sizes: "(min-width: 768px) 39vw, 36vw" },
  { span: "col-span-5 aspect-[4/5]", sizes: "(min-width: 768px) 39vw, 36vw" },
  { span: "col-span-7 aspect-[3/2]", sizes: "(min-width: 768px) 55vw, 50vw" },
] as const;

/**
 * Homepage — the gallery.
 *
 * Built on the shared `Section` / `SectionHead` primitives rather than a
 * hand-rolled head, which is also what moves the eyebrow rule from Warm
 * Terracotta to Deep Lilac: `SectionHead` draws every light-ground rule in
 * the one accent colour, and this section no longer opts out by hand.
 *
 * Not a portfolio, and deliberately not the finished-work strip that used to
 * sit on this page. It is not yet fully the alternative either: the section's
 * job is to let someone picture themselves at the table, and today only the
 * first of the four plates shows a hand actually at it — the other three are
 * pigment and paper after the fact, work rather than working. See the
 * TODO(client) on `GALLERY_IMAGES` in lib/constants.ts, which explains why
 * (the other candidates were the potter's wheel the brand has since moved off)
 * and what the studio shoot needs to bring back: frames of people making
 * things, in the activities the Maison actually runs. These four are kept
 * because they are the most honest four the project currently holds, not
 * because the mismatch is invisible.
 *
 * It sits between the programme and the practical sections rather than near
 * the top, because it is reassurance rather than information — it answers
 * "what would this actually be like" for someone already considering a date,
 * and it should never be what a visitor has to scroll past to reach one.
 *
 * NO CALL TO ACTION, so `SectionHead` below is given no `action`. The
 * homepage has one primary action and it is booking; a gallery with its own
 * button underneath would be a second, competing with the events above it for
 * no gain. The photographs do their work silently.
 *
 * Server component — four <Image>s and nothing that needs a browser.
 */
export function Gallery() {
  if (GALLERY_IMAGES.length === 0) return null;

  return (
    <Section id="gallery-heading" ground="surface">
      <SectionHead
        id="gallery-heading"
        eyebrow="In the room"
        title="What an afternoon looks like."
        standfirst="Ordinary hands and wet paint. Nobody here has done it before either."
        layout="spread"
      />

      <ul className="mt-section-gap grid grid-cols-12 items-end gap-x-4 gap-y-6 md:gap-x-6 lg:gap-x-8">
        {GALLERY_IMAGES.map((plate, i) => {
          const frame = PLATES[i % PLATES.length];
          return (
          <li key={plate.src} className={cn("relative", frame.span)}>
            <Reveal variant="imageReveal" className="absolute inset-0">
              <div className="relative h-full w-full overflow-hidden bg-surface-alt">
                <Image
                  src={plate.src}
                  alt={plate.alt}
                  fill
                  sizes={frame.sizes}
                  style={{ objectPosition: plate.position ?? "50% 50%" }}
                  className="object-cover"
                />
              </div>
            </Reveal>
          </li>
          );
        })}
      </ul>
    </Section>
  );
}
