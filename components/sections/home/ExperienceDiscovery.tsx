import { Reveal } from "@/components/motion/Reveal";
import { ExperienceCarousel } from "@/components/sections/home/ExperienceCarousel";
import { INK } from "@/components/sections/hero/composition";
import { Container } from "@/components/ui/Container";
import { DeckSheet } from "@/components/ui/deck/Deck";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { DoodleMark } from "@/components/ui/DoodleMark";
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
export async function ExperienceDiscovery() {
  const experiences = await getCreativeExperiences();
  const walkIn = experiences.filter((e) => e.kind === "diy").length;
  const scheduled = experiences.length - walkIn;

  return (
    <DeckSheet labelledBy="experiences-heading" className="overflow-x-clip">
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
            <p className="flex items-start gap-3 text-[1.0625rem] leading-[1.7] text-text/85">
              <span aria-hidden className="mt-[0.4em] block w-4 shrink-0">
                <DoodleMark name="starleaf" color={INK.terracotta} delay={180} />
              </span>
              <span>
                {walkIn} to walk in and make any time, {scheduled} guided sessions with a date.
                Reach a card to paint it.
              </span>
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
