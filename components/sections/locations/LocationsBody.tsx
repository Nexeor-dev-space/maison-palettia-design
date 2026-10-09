import { groundShapes } from "@/components/motion/groundShapes";
import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { LocationMap, PartnerPlate } from "@/components/sections/LocationMap";
import { Container } from "@/components/ui/Container";
import { INK } from "@/components/sections/hero/composition";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import type { PartnerRecord } from "@/lib/partners";

/**
 * /locations — where to find the Maison, and nothing else.
 *
 * THE BRIEF ASKED FOR THIS PAGE, AND THE DATA DECIDES ITS SHAPE. The Maison
 * has no studio door; it sets up inside malls. So "where" is the confirmed
 * partnerships in lib/partners.ts — one today, Times Square Center — named on
 * a plate and shown on the project's existing map.
 *
 * IT USED TO ANSWER "WHERE HAS IT BEEN" TOO: the ten destinations the deck
 * says the studio delivered workshops and activations at over the past year
 * (p.12), and a partner door under them. The client asked for the page to be
 * the location alone, so both went — see the two REMOVED notes at the foot.
 *
 * THE PAGE IS TWO BLOCKS NOW, ONE SECTION. The `locations` document stores
 * a `pageHeader` and a `locationsHero` (SPEC §E.1), and the header's words
 * are set inside this section — where the heading, its line and the map have
 * always shared one grid — rather than as a band of their own (see
 * `TAKES_HEADER` in components/blocks/BlockRenderer.tsx). Moved here from
 * app/(site)/locations/page.tsx; the words arrive as props, defaulting to the
 * launch wording.
 *
 * NO COORDINATES, NO ADDRESSES, NO EMIRATES. The project holds none. The map
 * is the existing keyless embed built from the partner record.
 */
export function LocationsBody({
  eyebrow = "Locations",
  lines = ["Where to", "Find Us."],
  lead = "Find Maison Palettia in the places you already love to visit \u2014 and come make something while you\u2019re there.",
  findUsNowLabel = "Find us now",
  emptyNote = "The next destination is being confirmed.",
  partners,
}: {
  eyebrow?: string | null;
  lines?: readonly string[];
  lead?: string | null;
  findUsNowLabel?: string | null;
  emptyNote?: string | null;
  partners: PartnerRecord[];
}) {
  return (
    <>
      {/* ---- now ---- */}
      {/*
        `overflow-clip` because the destination plate hangs a cut-out off its
        bottom-right corner, and in this layout that corner IS the page's
        right edge — the mark ran 27px past it and gave the document 7px of
        horizontal scroll. Every other page that renders <PartnerPlate> was
        already clipping at the section, which is why this only showed here.

        Clip, not hidden: `hidden` would make this a scroll container and
        break the `view()` timelines the marks inside it draw off.
      */}
      {/*
        LIGHT SAGE, AT THE CLIENT'S ASK — and the page's three grounds were
        set together: Light Sage here, White Rock for "Where we've created"
        below it, Light Sage again for the partner section, then the Deep
        Lilac door. The page alternates from the top instead of opening on
        two neighbouring warm fields.

        It was White Rock, and before that the pale sage-white `surface`. Each
        change takes the objects standing on it with it, which is the only
        part of a ground swap that is not a one-word edit:

          the destination plate ... was Light Sage on the cream. Sage on sage
            is 1.03:1 — not a card, a patch of the same paper — so it is the
            White Rock one again (`PartnerPlate`'s default).
          the two cut-outs ....... unchanged. Deep Lilac reads 3.83:1 on this
            ground and Warm Terracotta 2.36:1, which is what they were doing
            on the cream.

        Charcoal Slate is 9.07:1 here, so no word on the section changes ink.
      */}
      <section aria-labelledby="locations-title" className="relative isolate overflow-clip bg-sage">
        <SectionShapes plan={groundShapes("sage")} />
        <Container className="py-[3.5rem] md:py-[4.5rem] lg:py-[5.5rem]">
          {/*
            ==============================================================
            TWO COLUMNS THAT EACH SAY ONE THING — at the client's ask
            ==============================================================

            It was two rows. The top row put the heading on the left and the
            statement on the right, and the map ran the full measure beneath
            them. Two problems with that, and the client named the second:

            THE STATEMENT WAS NOT WITH ITS HEADING. "Where to find us." asks
            a question and the paragraph answers it — in the places you
            already love to visit — but the two sat in
            different columns separated by the width of the page, so the
            answer read as an unrelated aside rather than as the second half
            of the sentence. It sits under the heading now, which is simply
            where an answer goes.

            AND THE PAGE OPENED ON AN EMPTY BAND. With the statement pulled
            out of the right column, that half of the first screen held
            nothing at all, and the one object the page is actually for was
            below it. The map moves up into that space, so a visitor who
            never scrolls still gets the address.

            The columns are 5 and 6 of 12 with a gap between, rather than 6
            and 6: the heading is set in the script at display size and its
            two lines want a measure that does not force a third.
          */}
          <div className="grid grid-cols-12 gap-x-6 gap-y-12 lg:gap-x-10">
            <div className="relative col-span-12 lg:col-span-5">
              {eyebrow ? (
                <Reveal>
                  <Eyebrow>{eyebrow}</Eyebrow>
                </Reveal>
              ) : null}
              <DisplayHeading
                as="h1"
                id="locations-title"
                className="mt-7 md:mt-9"
                lines={lines}
              />
              <Reveal delay={0.15}>
                {/* Full-strength charcoal and the role's own 1.6, not 85%
                    ink opened to 1.7 — see the note on --text-lead. 9.07:1
                    on the pale green. */}
                {/*
                  THE CLIENT'S SENTENCE, verbatim (p.06 of their copy
                  document). It replaced this page's old line on the
                  homepage's "Find us" block — "brings creative experiences
                  into the places people already gather, set up inside a mall
                  rather than behind a studio door" — and the client has
                  asked for wording the document did not reach to follow its
                  new copy, so the page that exists to answer "where" opens
                  on the same answer the homepage gives.
                */}
                {lead ? <p className="mt-6 max-w-[30rem] text-lead text-text md:mt-8">{lead}</p> : null}
              </Reveal>

              {/*
                ==========================================================
                THE DESTINATION, UNDER THE STATEMENT THAT DESCRIBES IT
                ==========================================================

                <LocationMap> draws this plate as its own caption and it sat
                under the map, in the right-hand column. The client has asked
                for it here, and it is the better reading: the statement says
                the Maison is found in the places you already love to visit,
                and the plate names the place. An answer belongs under its
                own sentence, not across a gutter and below a map.

                The map turns its caption off rather than this drawing a
                second one — same component, one definition. See
                <PartnerPlate>.

                A PLATE PER PARTNER, not `partners[0]`. There is one today and
                the map already handles a second by splitting into two
                columns; the column would otherwise name the first and leave
                the rest to the map alone.
              */}
              <Reveal delay={0.22}>
                <div className="mt-10 flex flex-col gap-4 md:mt-12">
                  {partners.map((partner) => (
                    /* White Rock — the default. The section around it is Light
                       Sage again, and a sage plate on it would be a patch of
                       the paper rather than a card. */
                    <PartnerPlate
                      key={partner.slug}
                      partner={partner}
                      /* h2: the plate sits straight under this page's h1,
                         and "Find us now" in the next column is an h2 too.
                         It drew an h3 and the page skipped a level. */
                      headingLevel="h2"
                      /* STACKED FROM `lg`, because that is where this column
                         stops being the full measure and becomes 5 of 12 —
                         391px at 1024. Side by side in that, the 200px
                         button left the line 97px wide, one word to a line
                         and the plate 1,080px tall. See `stackAt`. */
                      stackAt="lg"
                    />
                  ))}
                </div>
              </Reveal>

            </div>

            <div className="col-span-12 lg:col-span-6 lg:col-start-7">
              {partners.length > 0 ? (
                <>
                  <Reveal>
                    <h2 className="mb-6 text-label font-medium uppercase tracking-eyebrow text-text">
                      {findUsNowLabel}
                    </h2>
                  </Reveal>
                  {/*
                    THE SHAPE IS SET HERE BECAUSE THE WIDTH IS SET HERE. In
                    half the measure the component's own `lg:aspect-[2/1]`
                    is a letterbox under 300px tall, which is not a map you
                    can find a turning on. See the `aspect` prop.
                  */}
                  <LocationMap
                    partners={partners}
                    caption={false}
                    /* SHORTER AT `lg` THAN THE 4:3 IT WAS — the client's
                       "doesn't need to be SO big". 16:10 in this column is
                       about 660 by 412 at 1440, eighty pixels off the height
                       and still a map you can find a turning on. */
                    aspect="aspect-[4/5] sm:aspect-[16/10] lg:aspect-[16/10]"
                  />

                  {/*
                    ======================================================
                    THE CUT-OUTS FOLLOWED THE AIR ACROSS THE ROW
                    ======================================================

                    They were a band at the foot of the LEFT column, placed
                    there when the heading and its statement left 500px of it
                    empty against an 850px map. The plate has come down into
                    that column, so the left is now the taller of the two and
                    the band was measured straight across the card — over the
                    destination's own name.

                    What is short now is this column: the map stops about
                    150px above the row's foot. So the marks move here, and
                    there are two rather than three, at the size 150px of
                    band can hold. (Re-measured once the plate stacked from
                    `lg` — see `stackAt` on it: the left column is still the
                    taller, and the map now stops about 330px above the
                    row's foot at 1440 and 540 at 1024, so the band under it
                    has more room than it uses, not less.)

                    MEASURED, AS EVERY MARK ON THIS SITE IS — and re-measured
                    each time the ground has changed. On this Light Sage the
                    two that carry are the same two they have always been:
                    Deep Lilac at 3.83:1 and Warm Terracotta at 2.36:1, both
                    plainly shapes. Soft Lavender is 1.51 here and White Rock
                    1.03 — the plate beside them is the White Rock now, and a
                    mark in that colour would read as a smudge of the card
                    rather than as a cut-out.

                    Decorative and `aria-hidden`, `lg:` only: below that the
                    columns stack and there is no band for them to sit in.
                  */}
                  <span
                    aria-hidden
                    className="pointer-events-none relative mt-8 deco-mark h-[7rem] select-none"
                  >
                    {/* SPREAD WIDER THAN THEY WERE. The icons are the
                        client's own set now and their proportions are not the
                        old ones — at 4% and 26% the pair overlapped into a
                        pile under the map. */}
                    <span className="absolute bottom-0 left-[2%] block w-[6rem] rotate-[-9deg]">
                      <DoodleMark name="coral" color={INK.lilac} treatment="draw" delay={260} />
                    </span>
                    <span className="absolute bottom-[12%] left-[44%] block w-[4.5rem] rotate-[16deg]">
                      <DoodleMark name="starburst" color={INK.terracotta} treatment="draw" delay={420} />
                    </span>
                  </span>
                </>
              ) : (
                <Reveal className="border-t border-line pt-10 lg:mt-12">
                  <p className="max-w-[30rem] text-h3 font-light">
                    {emptyNote}
                  </p>
                </Reveal>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/*
        ==================================================================
        (REMOVED) WHERE WE'VE CREATED — at the client's ask
        ==================================================================

        "This page should only be used for about and the location of the
        store. The information currently on the page can be used for
        collaboration with brands and malls pages instead the main page."

        What stood here was the record: the year's statement, the three
        approach lines, and the ten past destinations from Reem Mall to
        Ithra. None of it is lost — `EXPERIENCE_STATEMENT`, `OUR_APPROACH`
        and `PAST_DESTINATIONS` are untouched in lib/brand.ts, so a Brands &
        Malls page is this section lifted back out of there. Nothing else on
        the site reads them today.
      */}

      {/*
        ==================================================================
        (REMOVED) THE PARTNER DOOR — at the client's ask
        ==================================================================

        A Deep Lilac band closed the page: "Tell us about your space and what
        you have coming up", and "Partner with us" to /contact. It belonged to
        the collaboration content above it, and the ticket is explicit — the
        call to action goes to the collaboration page if that page is kept,
        and goes entirely if it is not. There is no such page today.

        <PartnerClose> went with it. The page now ends on the location, which
        is what it is for.
      */}
    </>
  );
}
