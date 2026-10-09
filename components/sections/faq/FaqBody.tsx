import { FaqList } from "@/components/faq/FaqList";
import { groundShapes } from "@/components/motion/groundShapes";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { Container } from "@/components/ui/Container";
import { FAQ_GROUPS, type FaqGroup } from "@/lib/constants";

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
 * /faq's questions — the `faqList` block (SPEC §E.1), moved here from
 * app/(site)/faq/page.tsx when the page became CMS blocks. The groups and
 * their order are the block's; the questions are the `faqs` collection's,
 * handed in by components/blocks/FaqList.tsx. Left out, the launch list.
 *
 * Every answer it renders is a sentence the site already stands behind
 * somewhere else — the note at the foot of an event page, the note at the
 * foot of checkout, the loyalty page's own line about a pass. Nothing here was
 * written for this page, because an answer invented on a FAQ page is a policy
 * the studio has not agreed to.
 */
export function FaqBody({ groups = FAQ_GROUPS }: { groups?: readonly FaqGroup[] } = {}) {
  return (
    <>
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
            <FaqList groups={groups} />
          </div>
        </Container>
      </section>
    </>
  );
}
