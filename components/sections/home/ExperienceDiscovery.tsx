import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { ExperienceCarousel } from "@/components/sections/home/ExperienceCarousel";
import { Container } from "@/components/ui/Container";
import { DeckSheet } from "@/components/ui/deck/Deck";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { getCreativeExperiences } from "@/lib/experiences";
import { EXPERIENCE_SPOTS } from "@/components/sections/home/homeSpots";

/**
 * The seven activities — a track you push through and paint.
 *
 * ==========================================================================
 * REFERENCED FROM THE DECK, NOT COPIED FROM IT
 * ==========================================================================
 *
 * The deck gives this two static rows of plates, and the first attempt here
 * reproduced them. The client's note was that this had become a conversion of
 * the PDF rather than a site designed from it, and they were right: a grid of
 * seven identical plates is what a page that cannot move has to do.
 *
 * What is kept is the brand's language — the outlined rounded plate, the
 * cut-outs, the six colours, the pill. What changes is that the website does
 * the thing the deck could not: the activities sit on a track you push, and a
 * card is a flat wash of one brand colour until you reach it, when a splash of
 * the studio's own paint opens and the photograph comes through. See
 * <ExperienceCarousel>.
 *
 * The heading sits left with its line beside it rather than centred over the
 * page, so the section reads as part of a scrolling site rather than as a
 * bound leaf. No binding on this sheet for the same reason.
 *
 * Server component: the activities are fetched here and handed to the client
 * component, so the list is rendered on the server and only the track's
 * behaviour ships to the browser.
 */

export async function ExperienceDiscovery() {
  const experiences = await getCreativeExperiences();

  return (
    <DeckSheet
      labelledBy="experiences-heading"
      /*
        LESS AIR AT THE TOP, BECAUSE THE JOIN ABOVE IS INVISIBLE.

        <OpeningStatement> is a sheet on the same Light Sage and pays 112px of
        padding at its foot; this one paid another 112 at its head. Between two
        grounds that differ, 224px is a breath. Between two that are identical
        it is a 224px void with no edge in it, which is the space the client is
        pointing at. Halved here rather than there, so the statement above
        keeps its own rhythm.
      */
      className="relative isolate overflow-x-clip pt-[2rem] md:pt-[2.75rem] lg:pt-[3.5rem]"
    >
      {/* The section's doodles — the header gap, the strip under the cards.
          See homeSpots.ts. */}
      <SectionShapes plan={EXPERIENCE_SPOTS} />
      <Container className="relative">
        {/*
          ==================================================================
          THE SECTION MASTHEAD, ON THE SAME GRID AS EVERY OTHER ONE
          ==================================================================

          This was `flex … lg:justify-between` with the description capped by
          its own `max-w`, and it was the only masthead on the site built that
          way. The cost is what `justify-between` means: the right block is
          pushed against the right edge and its LEFT edge then falls wherever
          its measure happens to put it. Measured at 1440 against the four
          sections that use the grid, this one started 115px further right and
          ran 115px narrower — "Pick a Colour" at x975/w445 against x860/w560
          on /faq, /events, /policies and <WaysToExperience>.

          THE STANDARD, which 22 columns across the site already use: the
          heading takes 7 of 12 and the description takes the last 5, so its
          left edge is a grid line rather than a consequence, and both edges
          land in the same place on every section of every page.

          `items-end` is kept — the two blocks are read off one baseline — and
          so is the gutter, which is the grid's own `lg:gap-x-10`.
        */}
        <div className="grid grid-cols-12 gap-x-6 gap-y-6 lg:items-end lg:gap-x-10">
          {/*
            THE PILL IS GONE, AND THE HEADING IS THE SITE'S OWN.

            An outlined lilac pill with the title set in condensed caps inside
            it is a device off the deck's title slides, and it was the last
            place a heading on this site was set that way — nine other sections
            and three sub-pages already open on the eyebrow and the script
            statement. Two heading systems on one page is one too many, and the
            one to keep is the one that reads as the website.
          */}
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <Eyebrow>The Maison Palettia experience</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="experiences-heading"
              className="mt-7 md:mt-9"
              lines={["Pick a Colour,", "Pick a Table."]}
            />
          </div>

          {/*
            NO `max-w` HERE ANY MORE, AND THAT IS THE POINT OF THE CHANGE.

            This carried `lg:max-w-[42ch] 2xl:max-w-[36ch]`, tuned so the
            paragraph set five lines and ended level with the heading beside
            it. The heights did match; the EDGES did not, and a reader
            scrolling the page sees the edges — two sections running past each
            other with their right-hand copy starting in two different places
            is the thing the eye catches, not a 14px difference in height.

            So the column is the measure now, like every other masthead's. The
            line count follows from it rather than being aimed at.
          */}
          <Reveal delay={0.08} className="col-span-12 lg:col-span-5 lg:pb-2">
            {/* UP FROM 17px. It is the only line of copy in this masthead and
                it was set at body size beside a 70px heading, which read as a
                caption rather than as the thing that tells you what the
                section is. The mark beside it grows with it. */}
            {/* NO MARK IN THE LINE. A starleaf sat in front of the first word
                on its own flex track, which put a second small shape within a
                few pixels of the coral behind it — two terracotta marks doing
                one job. The coral is now placed against this paragraph (see
                EXPERIENCE_SPOTS) and the copy starts on its own measure. */}
            {/*
              THE CLIENT'S OWN LINE, replacing the one that was here.

              It used to count the catalogue — "five to walk in and make any
              time, two guided sessions with a date. Reach a card to paint
              it." Accurate, and a ledger: two numbers and an instruction. The
              client has supplied the sentence they want in its place, which
              says the same thing as an invitation.

              THE COUNTS ARE GONE WITH IT, and the two derived totals that fed
              them are off the component, so no number here can drift from the
              catalogue. The two ways in are still named — "walk in" and
              "a guided session" — which is the distinction the section
              exists to teach.
            */}
            <p className="text-statement text-text/85">
              Create Anytime (pick your palette and start whenever you like), or
              Create Together in a guided session and make something new with us.
            </p>
          </Reveal>
        </div>
      </Container>

      {/*
        The track runs to the screen's edge rather than stopping inside the
        container, so a card is visibly cut off at the right — which is what
        tells a visitor there is more of it without a label saying so.
      */}
      <div className="mt-10 pl-gutter md:mt-14">
        <ExperienceCarousel experiences={experiences} />
      </div>
    </DeckSheet>
  );
}
