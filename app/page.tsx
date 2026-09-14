import { AboutTeaser } from "@/components/sections/AboutTeaser";
import { CreativeExperiences } from "@/components/sections/CreativeExperiences";
import { Gallery } from "@/components/sections/Gallery";
import { Hero } from "@/components/sections/Hero";
import { HomeFaq } from "@/components/sections/HomeFaq";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { PlanYourVisit } from "@/components/sections/PlanYourVisit";
import { Testimonials } from "@/components/sections/Testimonials";
import { UpcomingEvents } from "@/components/sections/UpcomingEvents";

/**
 * Homepage. Metadata comes from the site defaults in lib/seo.ts.
 *
 * THE PROGRAMME IS THE SECOND THING ON THE PAGE. That is the change this
 * revision exists for. The sessions are the product — a place at a table in a
 * mall on a fixed date — and every earlier arrangement of this page put at
 * least one screen of brand writing between a visitor and a date they could
 * book. The hero says what this is; the next thing it does is show what is on.
 *
 * The order after that is the shape of a decision rather than the shape of a
 * story: see a date, understand what turning up involves, see what you would
 * be making, see that there is a story, see what the room looks like, hear
 * from someone who went, have the last question answered, and be asked.
 *
 * WHAT IS NOT HERE, AND WHY.
 *
 *   - The brand introduction. Its paragraph is the one sentence the studio has
 *     written about itself, and /about's own introduction renders exactly that
 *     paragraph. Two routes, one answer, read twice.
 *   - The experience section. "What does it feel like" is a slow two-column
 *     editorial read, and the creative strands below answer the more useful
 *     version of the same question — what you would actually be doing — in a
 *     third of the height.
 *   - The philosophy, the two editorial spreads and the just-added strip,
 *     moved to /about in the previous pass; see the note there.
 *
 * Both unmounted components are intact, not deleted. Nothing was removed to
 * make this page shorter: everything cut is either a duplicate of /about or
 * now lives on /about.
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
        hero's `z-0`, and each carries an opaque ground of its own.

        The wrapper deliberately stops after two sections. Once the hero has
        been covered that far there is nothing left to see, and letting it
        scroll away frees the browser from compositing a pinned, playing video
        for the rest of the page.
      */}
      <div className="relative">
        <Hero />

        <div className="relative z-10">
          <UpcomingEvents />

          {/*
            Directly under the listing, because the listing is what raises the
            question this answers: a visitor has just seen three dates at three
            malls and needs to know what turning up to one actually involves.
          */}
          <HowItWorks />
        </div>
      </div>

      {/* What you would be making — four strands, not a second listing. */}
      <CreativeExperiences />

      {/* A doorway to the story rather than the story itself. */}
      <AboutTeaser />

      {/*
        Reassurance, not information. It sits here rather than near the top
        because its job is to answer "what would this actually be like" for
        someone already weighing a date — never to be something scrolled past
        on the way to one.
      */}
      <Gallery />

      {/*
        TODO(client): THE QUOTES IN THIS SECTION ARE INVENTED AND MUST NOT GO
        LIVE. lib/testimonials.ts says so at the top of the file, in capitals.
        The section is mounted because the client asked for it by name and this
        is its place in the page; the component renders nothing at all when the
        array is empty, so deleting the fabrications does not leave a hole.

        Every other placeholder on this site is a date or a price. A made-up
        endorsement is the one that is a liability rather than a convenience.
        Replace these with real quotes, or empty the array, before launch.
      */}
      <Testimonials />

      {/* The last hesitations, answered in four lines. */}
      <HomeFaq />

      {/*
        The last section, and the only one that asks for anything. It stays
        last for the same reason it always did — everything above it has been
        showing and explaining, and this is the one place the Maison speaks to
        the visitor directly.
      */}
      <PlanYourVisit />
    </>
  );
}
