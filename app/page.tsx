import { Hero } from "@/components/sections/Hero";
import { ClosingStatement } from "@/components/sections/home/ClosingStatement";
import { CollaborateTeaser } from "@/components/sections/home/CollaborateTeaser";
import { CommunityMoment } from "@/components/sections/home/CommunityMoment";
import { OpeningStatement } from "@/components/sections/home/OpeningStatement";
import { ExperienceDiscovery } from "@/components/sections/home/ExperienceDiscovery";
import { LittleCreators } from "@/components/sections/home/LittleCreators";
import { PrivateEventsTeaser } from "@/components/sections/home/PrivateEventsTeaser";
import { SeasonalExperiences } from "@/components/sections/home/SeasonalExperiences";
import { TwoWaysToCreate } from "@/components/sections/home/TwoWaysToCreate";
import { WaysToExperience } from "@/components/sections/home/WaysToExperience";
import { WhereWeCreate } from "@/components/sections/home/WhereWeCreate";
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
 *   02b Ways to take part ......... White Rock       the four ways in
 *   03 Why Maison Palettia ........ Light Sage       the deck's own ground
 *   04 What we offer .............. White Rock
 *   05 Walk in, or book ........... Light Sage
 *   06 The Maison experience ...... photograph, then near-white
 *   07 Seasonal ................... White Rock
 *   08 Little creators ............ Light Sage + stripe
 *   09 Where we've created ........ near-white
 *   10 Collaborate teaser ......... White Rock, with a Light Sage panel
 *   11 Private events ............. DEEP LILAC       the one focal field
 *   12 Closing statement .......... the brand stripe
 *
 * Light Sage returns every third section, the way the brand guide describes
 * it — the structural base — and Deep Lilac is spent once. No two neighbours
 * share a ground; 02b takes White Rock precisely because near-white sits
 * above it and Light Sage below, so inserting it kept that rule rather than
 * breaking it.
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
      <OpeningStatement />
      {/*
        THE VISION AND MISSION HAVE GONE TO /about, at the client's ask. They
        sat here as a reproduction of the deck's page 3 — pill, outlined box,
        pill, outlined box — and the note was that the deck is the source of
        the colours and the words, not of the layout. They are redesigned at
        the head of the About page, which is where a statement of purpose
        belongs and where the page was already carrying both sentences.

        NEITHER SENTENCE IS ON THIS PAGE ANY MORE, and that is worth knowing
        rather than assuming. <WhyMaison> used to set the vision small beside
        the brand story with a link to /about under it, which would have been
        the pointer this page kept — but it is no longer mounted here, so the
        homepage now states the mission and the vision nowhere at all.

        That is defensible: the deck's purpose page belongs on About, and this
        page opens on <OpeningStatement>, which carries the brand story. If
        the studio wants the vision teased here again, the smallest honest fix
        is a line of it beside that story with the /about link beneath —
        not a second copy of the section.
      */}
      <ExperienceDiscovery />

      {/*
        THE BREADTH, BEFORE THE STORY. The client's note was that the site
        "should not make Maison Palettia appear to be only a workshop booking
        website". It read as one because everything that is not a workshop —
        private events, corporate, schools, activations — sat at positions ten
        and eleven of twelve, below where most visits end.

        This is the index of all four, directly under the activities: the
        visitor has just finished reading what they could make, and this is
        the moment to say that is one of four ways in. The sections it
        summarises all stay where they are and go deeper; see the note in
        <WaysToExperience> on why the four group names are wayfinding rather
        than the studio's own vocabulary.
      */}
      <WaysToExperience />

      <WorkshopJourney />
      <TwoWaysToCreate />
      <CommunityMoment />
      <SeasonalExperiences />
      <LittleCreators />
      <WhereWeCreate />
      {/*
        A TEASER, NOT THE SECTION. The collaborative approach in full — the
        deck's three partnership models and the approach beneath them — has
        moved to /locations, where a mall deciding whether to host the Maison
        already reads. This keeps the invitation on the homepage and sends
        anyone it speaks to straight there. See <CollaborateTeaser>.
      */}
      <CollaborateTeaser />
      <PrivateEventsTeaser />
      <ClosingStatement />
    </>
  );
}
