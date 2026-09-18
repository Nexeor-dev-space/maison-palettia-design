import { Hero } from "@/components/sections/Hero";
import { ClosingStatement } from "@/components/sections/home/ClosingStatement";
import { Collaborations } from "@/components/sections/home/Collaborations";
import { CommunityMoment } from "@/components/sections/home/CommunityMoment";
import { ExperienceDiscovery } from "@/components/sections/home/ExperienceDiscovery";
import { LittleCreators } from "@/components/sections/home/LittleCreators";
import { PrivateEventsTeaser } from "@/components/sections/home/PrivateEventsTeaser";
import { SeasonalExperiences } from "@/components/sections/home/SeasonalExperiences";
import { TwoWaysToCreate } from "@/components/sections/home/TwoWaysToCreate";
import { WhereWeCreate } from "@/components/sections/home/WhereWeCreate";
import { WhyMaison } from "@/components/sections/home/WhyMaison";
import { WorkshopJourney } from "@/components/sections/home/WorkshopJourney";

/**
 * ==========================================================================
 * THE HOMEPAGE, AS ONE STORY
 * ==========================================================================
 *
 * THE ORDER. The redesign brief names a journey — hero, why, what we offer,
 * creative experiences, walk-in versus scheduled, community, seasonal, kids,
 * our experience and locations, collaborations, private events, a final
 * statement — and says the supplied Markdown's section order is the source of
 * truth. The Markdown supplied with the brief is a brand reference (colours,
 * type, spatial assets, reference links) and contains no section order, so
 * the brief's journey was the order given — with one change the client has
 * since asked for: the creative experiences come straight after the banner.
 *
 * WHAT YOU CAN MAKE, THEN WHY. The banner's "scroll down" lands on the seven
 * activities, grouped by whether you walk in or book, so the first thing
 * under it answers what the Maison is for. The story of why it exists follows
 * immediately after.
 *
 * THE GROUNDS, top to bottom:
 *
 *   01 Banner ..................... Light Sage       runs up behind the bar
 *   02 Creative experiences ....... near-white       the photographs carry it
 *   03 Why Maison Palettia ........ Light Sage       the deck's own ground
 *   04 What we offer .............. White Rock
 *   05 Walk in, or book ........... Light Sage
 *   06 The Maison experience ...... photograph, then near-white
 *   07 Seasonal ................... White Rock
 *   08 Little creators ............ Light Sage + stripe
 *   09 Where we've created ........ near-white
 *   10 Collaborations ............. White Rock
 *   11 Private events ............. DEEP LILAC       the one focal field
 *   12 Closing statement .......... the brand stripe
 *
 * Light Sage returns every third section, the way the brand guide describes
 * it — the structural base — and Deep Lilac is spent once. No two neighbours
 * share a ground.
 *
 * WHAT CAME OFF THE PAGE. Testimonials: lib/testimonials.ts declares its own
 * contents invented ("MUST NOT SHIP. Nobody said these things.") and the brief
 * forbids fabricated social proof. The FAQ and gallery sections: both keep
 * their own routes, and neither is part of the journey the brief sets out.
 */
export default function HomePage() {
  return (
    <>
      {/*
        Nothing in the banner is pinned, so it needs no wrapper: it fills the
        first screen, and while the intro plays it is lifted above the page
        (see `.hero` in ./hero/Hero.module.css) so the bouquet paints over
        everything. The creative experiences follow it directly, where its
        "scroll down" leads.
      */}
      <Hero />
      <ExperienceDiscovery />
      <WhyMaison />
      <WorkshopJourney />
      <TwoWaysToCreate />
      <CommunityMoment />
      <SeasonalExperiences />
      <LittleCreators />
      <WhereWeCreate />
      <Collaborations />
      <PrivateEventsTeaser />
      <ClosingStatement />
    </>
  );
}
