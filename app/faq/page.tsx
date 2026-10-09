import { FaqList } from "@/components/faq/FaqList";
import { groundShapes } from "@/components/motion/groundShapes";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { FAQ_GROUPS } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "FAQ",
  description: "Answers to common questions about Maison Palettia events.",
  path: "/faq",
});

/* ==========================================================================
   THE MARKS BEHIND THE QUESTIONS

   The smooth end of the brand's sheet — coral, bean, wave, splash — and none
   of the spiky ones, for the reason the homepage's channel gave up its
   starburst: a page of plain type wants a ground that breathes, not one that
   pricks at it.

   THE GROUND MOVED UNDER THEM. On the near-white `surface` these were lilac,
   terracotta, lavender and lilac; on Light Sage the terracotta splash was the
   one that read as a stain rather than as paper, so it is White Rock now —
   the lighter cut of the same field, which is how <Welcome> on /about puts a
   shape behind a shape.

   They sit in the OUTER MARGINS, and that is why the list below is centred
   rather than set to the left: left-aligned there was exactly one clear band,
   and the first placement put a coral straight across "Coming to an event".

   The sizes came down when the list went WIDER. At 54rem the margins were
   about 270px each and a 7-9% mark had room to spare; at 76rem they are about
   90px, so the same figures would have put every shape under a card. 5-6% is
   80-86px, which fits with a little air either side.

   Sizes are a share of the section's WIDTH and each doodle's own aspect then
   decides its height — see the note in <CreateWithUs> on why that is the
   number to watch on a tall section like this one.
   ========================================================================== */
const FAQ_SHAPES: readonly ShapePlan[] = groundShapes("sage");

/**
 * FAQ — the questions that stand between someone and a booking.
 *
 * ==========================================================================
 * WHAT THIS PAGE IS ALLOWED TO SAY
 * ==========================================================================
 *
 * Every answer it renders comes from {@link FAQ_GROUPS}, and every one of
 * those is a sentence the site already stands behind somewhere else — the
 * note at the foot of an event page, the note at the foot of checkout, the
 * loyalty page's own line about a pass. Nothing here was written for this
 * page, because an answer invented on a FAQ page is a policy the studio has
 * not agreed to.
 *
 * The five questions a craft studio is most often asked — minimum age,
 * children, accessibility at each mall, what happens if you cannot make it,
 * and whether pieces are fired and collected later — are therefore NOT on it.
 * See the TODO in lib/constants.ts: not one can be answered from anything in
 * this project, so the page sends those to the enquiry route rather than
 * guessing, and grows a group the moment the studio supplies the wording.
 *
 * ==========================================================================
 * THREE GROUNDS, THE WAY EVERY OTHER PAGE CLOSES
 * ==========================================================================
 *
 * The banner and the questions share ONE Light Sage field at the client's ask
 * — they were White Rock over the near-white `surface`, which drew a seam
 * across the page at exactly the point where the reading starts — and the last
 * beat is Deep Lilac, which is where /about, /locations and /private-events
 * all end and is the ground the footer's wave rises out of.
 *
 * The two sections stay separate elements rather than merging into one,
 * because the banner has no shapes behind it and the list has four; joining
 * them would put <SectionShapes> behind the heading as well, and its scroll
 * drift is measured off the section it is in.
 *
 * With the seam gone, the padding between them is the join: the banner keeps
 * its own foot and the list opens on a short top, so the eye reads one field
 * with a heading over a list rather than two bands of the same colour.
 */
export default function FaqPage() {
  return (
    <>
      {/* ---- the banner ------------------------------------------------- */}
      <section
        aria-labelledby="faq-title"
        className="relative isolate overflow-clip bg-sage pt-[4rem] pb-[3rem] md:pt-[5.5rem] md:pb-[3.5rem]"
      >
        <SectionShapes plan={groundShapes("sage")} />
        {/*
          ONE MARK, ON THE TOP-RIGHT EDGE. There were two: this and a coral
          crossing the foot of the left gutter, which was fine while the banner
          was tall and stopped being fine the moment it was shortened — the
          coral rode up into "come and make." and the collision was measured,
          not spotted.

          It is not re-placed, it is gone. <SectionShapes> in the section below
          already opens with a coral at its own top-left, about 120px under
          where this one sat, so the corner reads as marked either way and the
          banner keeps the corner the heading and its line never reach.
        */}
        <span
          aria-hidden
          className="pointer-lift pointer-events-none absolute -right-6 top-[12%] deco-mark w-24 -rotate-12 xl:w-28"
          style={{ "--ax": 0.9, "--lift": 0.18 } as React.CSSProperties}
        >
          <DoodleMark name="wave" color={INK.lavender} treatment="draw" delay={420} depth={16} />
        </span>

        <Container className="relative">
          {/*
            TWO COLUMNS, BECAUSE THE BANNER WAS HALF EMPTY. The heading and its
            line were stacked in a 46rem block on the left of a container with
            no max-width at all — <Container>'s `site` width is "" — so at 1440
            the right 700px of the band carried nothing and the client's word
            for the page was "empty".

            The line moves beside the heading and sits on its baseline, which
            is the arrangement <WhereWeCreate> and <Experiences> already use:
            it fills the width AND takes about 90px of height out of the
            banner, so the questions start higher up the page.
          */}
          <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
            <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <Eyebrow>Questions</Eyebrow>
            </Reveal>

            {/*
              The script line, set in two so the break is the design's and not
              the measure's — the same way every other banner on this site is
              composed. `forScript` inside <DisplayHeading> handles the face's
              missing punctuation.
            */}
            {/* `as="h1"` — <DisplayHeading> defaults to h2, and this is the
                page's title. Without it /faq shipped with no h1 at all, so a
                screen-reader user jumping by heading landed on a page that
                never said what it was. */}
            <DisplayHeading
              as="h1"
              id="faq-title"
              className="mt-8 md:mt-10"
              lines={["Before You", "Come and Make."]}
            />

            </div>

            <Reveal delay={0.15} className="col-span-12 lg:col-span-5 lg:pb-3">
              {/* No `max-w`: the column is the measure — see <ExperienceDiscovery>. */}
              <p className="text-statement text-text/85">
                Answers to common questions about Maison Palettia events.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ---- the questions ---------------------------------------------- */}
      <section
        aria-label="Frequently asked questions"
        className="relative isolate overflow-clip bg-sage pb-[4rem] pt-[1rem] md:pb-section md:pt-[2rem] lg:pb-section-lg"
      >
        {/*
          NOT BELOW xl, BECAUSE BELOW xl THERE IS NO MARGIN TO SIT IN. The list
          is capped at 76rem and the band it sits in has no cap at all, so the
          space either side is whatever the window has spare: 112px at 1440,
          352px at 1920 — and 14px at 1024, where the list simply fills the
          band. These are `-z-10`, so a mark with no margin is not broken, it
          is invisible behind a card, which is a request and a paint for
          nothing. `desktopOnly` on the plan would gate them at lg, which is
          exactly the width where that stops being true.
        */}
        <SectionShapes plan={FAQ_SHAPES} />

        <Container className="relative">
          {/*
            WIDER, at the client's ask, and the figure comes from what is
            actually there. <Container>'s `site` width is "" — no cap at all —
            so at 1440 the band is about 1400px and a 54rem list left 270px of
            empty sage down each side. 76rem is 1216, which leaves about 90px
            a side: enough for a 6% mark to sit in and not enough to read as a
            margin somebody forgot to fill.

            Still centred, and every row inside is still set left, so the
            questions all begin in the same place and the list can be scanned
            without being read.
          */}
          <div className="mx-auto max-w-[76rem]">
            <FaqList groups={FAQ_GROUPS} />
          </div>
        </Container>
      </section>

      {/* ---- the way on ------------------------------------------------- */}
      <section
        aria-labelledby="faq-close"
        className="relative isolate overflow-clip bg-primary py-[5rem] text-surface md:py-section lg:py-section-lg [--color-focus:var(--color-cream)]"
      >
        <SectionShapes plan={groundShapes("lilac")} />
        <Container className="text-center">
          <div className="mx-auto max-w-[44rem]">
            <DisplayHeading
              id="faq-close"
              ground="lilac"
              lines={["Still", "Wondering?"]}
            />

            <Reveal delay={0.2}>
              {/*
                Full strength, no alpha. `--color-surface` on Deep Lilac is
                4.90:1 and that is the whole of the headroom — the same rule
                <EnquiryCta> keeps on /private-events.
              */}
              <p className="mx-auto mt-9 max-w-[44rem] text-balance text-lead text-surface">
                If something is unclear, ask before you book.
              </p>
            </Reveal>

            <Reveal delay={0.3} className="mt-10 flex justify-center md:mt-12">
              <BlobButton href="/contact" tone="cream" className="min-h-[3.25rem] px-7">
                Ask the Maison
              </BlobButton>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
