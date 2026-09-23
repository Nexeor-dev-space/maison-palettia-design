import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { ExperienceCarousel } from "@/components/sections/home/ExperienceCarousel";
import { INK } from "@/components/sections/hero/composition";
import { Container } from "@/components/ui/Container";
import { DeckSheet } from "@/components/ui/deck/Deck";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { getCreativeExperiences } from "@/lib/experiences";

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
/*
  ==========================================================================
  THE MARKS IN THE MASTHEAD — placed against the measured gap, not by eye
  ==========================================================================

  The masthead sets the statement on the left and one line of copy on the
  right, and leaves the middle open above the row of cards. That gap is what
  these fill.

  THE FIRST PLACEMENT PUT TWO OF THREE ON TOP OF SOMETHING. Measured in the
  page at 1440, the section is 1440x1105 and its content sits at:

      eyebrow + heading   x   20-367    y  112-350
      the note            x 1102-1420   y  145-342
      the card track      x   20-1440   y  406-941

  which leaves exactly one empty region: x 367-1102, y 0-406. The starburst
  was at x 1109-1325 y 44-278, squarely under the note; the coral at
  x 864-1008 y 331-554, under the top of the cards. Only the third was clear.
  That is the whole of what the client is seeing — not a taste problem but two
  shapes behind text.

  SO THE PLAN IS SOLVED FROM THAT BOX, AND FROM THE TRAVEL. A resting position
  inside the gap is not enough: each mark also moves, by half its drift over
  the section's pass plus the float's 9px, so what has to fit is the whole
  excursion. Solved that way the splash wanted 5% rather than 2% — at 2% it
  was clipped 8px above the section's own top edge at rest — and the zigzag
  15% rather than 19%, where the bottom of its travel reached the cards.

  Everything below sits inside x 27-74%, with every worst case between y 23
  and y 290 against a track that starts at 350. Measured, not eyeballed.

  TWO MARKS, NOT FOUR. There were four running across the gap on a
  falling-and-rising line. The client kept the first and the third and struck
  the rest, which is the right call: four shapes across one band is a pattern,
  and a pattern behind a masthead competes with it. What is left is one mark
  for each thing in the masthead — the splash against the heading's empty
  half, the coral against the copy — and the band reads as placed rather than
  as filled.

  Desktop only, every one of them. Below `lg` the heading, the note and the
  cards stack and the gap this is filling does not exist — a mark there is not
  a ground, it is something behind the words.
*/
const EXPERIENCE_SHAPES: readonly ShapePlan[] = [
  /* The splash holds the gap the heading leaves. Largest and strongest of the
     two, because it is the one carrying the empty half of the masthead. */
  {
    name: "splash",
    color: INK.lilac,
    width: "13%",
    left: "27%",
    top: "5%",
    rotate: -12,
    drift: 26,
    opacity: 0.22,
    float: 13,
    desktopOnly: true,
  },
  /*
    The coral belongs to the copy on the right, so it is pinned to it.

    A PERCENTAGE CANNOT DO THIS, AND THAT IS WHY IT DRIFTED. <Container> has
    no ceiling — the page runs the full width of the display, held in only by
    the gutter — and the note is `lg:max-w-[30ch]` at a font size that stops
    growing at about 860px. So above `lg` the note's left edge is a FIXED
    distance from the right of the screen: the gutter plus roughly 20rem. A
    shape at `right: 26%` is a distance that grows with the screen, so the two
    separate as the window widens: 36px of gap at 1440, 174px at 2000, 312px
    on a 2560 display. Measured on all four.

    Expressed the way the note is expressed, the gap is the same at every
    width. `--spacing-gutter` is the token <Container> itself uses, so the two
    cannot drift apart again; 20rem is the note's own measure once its type
    has stopped clamping; 1.5rem is the gap.

    The width is clamped for the same reason — 8% of a 2560 display is a
    250px mark against a paragraph that never grows past 320.
  */
  {
    name: "coral",
    color: INK.terracotta,
    width: "clamp(6rem, 8%, 9.5rem)",
    right: "calc(var(--spacing-gutter) + 20rem + 1.5rem)",
    top: "9%",
    rotate: -6,
    drift: 22,
    opacity: 0.2,
    float: 11,
    floatDelay: 0.9,
    desktopOnly: true,
  },
];

export async function ExperienceDiscovery() {
  const experiences = await getCreativeExperiences();
  const walkIn = experiences.filter((e) => e.kind === "diy").length;
  const scheduled = experiences.length - walkIn;

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
      {/* The masthead leaves most of its width open above the cards; this is
          what goes in it. See EXPERIENCE_SHAPES. */}
      <SectionShapes plan={EXPERIENCE_SHAPES} />
      <Container className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          {/*
            THE PILL IS GONE, AND THE HEADING IS THE SITE'S OWN.

            An outlined lilac pill with the title set in condensed caps inside
            it is a device off the deck's title slides, and it was the last
            place a heading on this site was set that way — nine other sections
            and three sub-pages already open on the eyebrow and the script
            statement. Two heading systems on one page is one too many, and the
            one to keep is the one that reads as the website.
          */}
          <div>
            <Reveal>
              <Eyebrow>The Maison Palettia experience</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="experiences-heading"
              className="mt-7 md:mt-9"
              lines={["Pick a colour,", "pick a table."]}
            />
          </div>

          <Reveal delay={0.08} className="lg:max-w-[30ch] lg:pb-2">
            {/* UP FROM 17px. It is the only line of copy in this masthead and
                it was set at body size beside a 70px heading, which read as a
                caption rather than as the thing that tells you what the
                section is. The mark beside it grows with it. */}
            {/* NO MARK IN THE LINE. A starleaf sat in front of the first word
                on its own flex track, which put a second small shape within a
                few pixels of the coral behind it — two terracotta marks doing
                one job. The coral is now placed against this paragraph (see
                EXPERIENCE_SHAPES) and the copy starts on its own measure. */}
            <p className="text-[clamp(1.25rem,1.05rem+0.6vw,1.6rem)] leading-[1.55] text-text/85">
              {walkIn} to walk in and make any time, {scheduled} guided sessions with a date.
              Reach a card to paint it.
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
