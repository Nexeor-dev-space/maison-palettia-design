import { AboutTeaser } from "@/components/sections/AboutTeaser";
import { CreativeExperiences } from "@/components/sections/CreativeExperiences";
import { FeaturedFilm } from "@/components/sections/FeaturedFilm";
import { Gallery } from "@/components/sections/Gallery";
import { Hero } from "@/components/sections/Hero";
import { HomeFaq } from "@/components/sections/HomeFaq";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { MallPartners } from "@/components/sections/MallPartners";
import { PlanYourVisit } from "@/components/sections/PlanYourVisit";
import { UpcomingEvents } from "@/components/sections/UpcomingEvents";

/**
 * Homepage. Metadata comes from the site defaults in lib/seo.ts.
 *
 * THE PROGRAMME IS THE SECOND THING ON THE PAGE, and that has not changed:
 * the sessions are the product — a place at a table in a mall on a fixed date
 * — and no arrangement of this page should put a screen of brand writing
 * between a visitor and a date they could book.
 *
 * What changed in this pass is how the page looks rather than what it argues.
 * Four accent colours became one. Three competing vertical rhythms became one
 * token. Fifty-eight one-off type sizes became eight roles. Every section now
 * takes its ground, its padding and its masthead from the same two primitives,
 * so a section can no longer drift on its own.
 *
 * THE GROUND RHYTHM, read top to bottom. The rule is one ground per section
 * and never a band inside one:
 *
 *   Hero .................. Charcoal, full-bleed photograph
 *   Upcoming events ....... surface
 *   How it works .......... surface   (continuous with the listing above it)
 *   Creative experiences .. surface
 *   About teaser .......... White Rock
 *   Featured film ......... Charcoal, full-bleed
 *   Gallery ............... surface
 *   Where we create ....... White Rock
 *   FAQ ................... surface
 *   Plan your visit ....... White Rock
 *   Footer ................ Light Sage
 *
 * WHAT IS NOT HERE, AND WHY.
 *
 *   - The testimonials. lib/testimonials.ts holds invented quotes and says so
 *     in capitals: nobody said those things, and a fabricated endorsement is
 *     the one placeholder on this site that is a liability rather than a
 *     convenience. The section and its data seam are intact and unedited —
 *     remount it the day the studio has quotes it collected, with permission.
 *   - The brand introduction, the experience section, the philosophy, the two
 *     editorial spreads and the just-added strip. All either duplicate /about
 *     or now live there; see the note in the previous revision's history.
 *
 * Everything unmounted is parked, not deleted.
 */
export default function HomePage() {
  return (
    <>
      {/*
        The hero holds at the top of the viewport while the page rises over it
        — the sections below scroll up and cover it rather than pushing it out
        of the way.

        Two things make that work. The hero is `sticky top-0`, and this
        wrapper is what gives sticky somewhere to travel: a sticky element
        stops holding once the foot of its containing block arrives, so the
        wrapper has to be tall enough to outlast the covering. The sections
        that do the covering sit in their own `relative z-10` layer, above the
        hero's `z-0`, and each carries an opaque ground of its own — which is
        why <Section> has no transparent ground to choose.

        The wrapper deliberately stops after two sections. Once the hero has
        been covered that far there is nothing left to see, and letting it
        scroll away frees the browser from compositing a pinned photograph for
        the rest of the page.
      */}
      <div className="relative">
        <Hero />

        <div className="relative z-10">
          <UpcomingEvents />

          {/*
            Directly under the listing, because the listing is what raises the
            question this answers: a visitor has just seen dates at malls and
            needs to know what turning up to one actually involves.
          */}
          <HowItWorks />
        </div>
      </div>

      {/* What you would be making — the strands, not a second listing. */}
      <CreativeExperiences />

      {/* A doorway to the story rather than the story itself. */}
      <AboutTeaser />

      {/*
        The page's one pause. A full-bleed backdrop pinned behind a window the
        page scrolls past, carrying a single line and one way onward.

        It sits here because the two sections either side of it are both
        reading — the story above, the room below — and the page needs one
        moment that asks nothing and explains nothing.
      */}
      <FeaturedFilm />

      {/*
        Reassurance, not information. It answers "what would this actually be
        like" for someone already weighing a date, and must never be something
        scrolled past on the way to one.
      */}
      <Gallery />

      {/*
        Where those rooms actually are, and why they are malls. Credibility
        rather than navigation: the practical "which mall, which Saturday"
        question is answered by the listing at the top of the page. This
        answers the one underneath it — what kind of business this is.
      */}
      <MallPartners />

      {/* The last hesitations, answered in four lines. */}
      <HomeFaq />

      {/*
        The last section, and the only one that asks for anything. Everything
        above it has been showing and explaining; this is the one place the
        Maison speaks to the visitor directly.
      */}
      <PlanYourVisit />
    </>
  );
}
