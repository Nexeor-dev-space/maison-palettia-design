import { AboutTeaser } from "@/components/sections/AboutTeaser";
import { CreativeExperiences } from "@/components/sections/CreativeExperiences";
import { Gallery } from "@/components/sections/Gallery";
import { Hero } from "@/components/sections/Hero";
import { HomeFaq } from "@/components/sections/HomeFaq";
import { MallPartners } from "@/components/sections/MallPartners";
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

        The wrapper deliberately stops after the listing. It held two sections
        until <HowItWorks> moved to /about, and one is enough: the covering
        section only has to outlast a viewport, and the listing runs well over
        it at every width measured — 1258px against 800 at desktop, 1425px
        against 812 on a phone. Scroll-tested after the move: the hero is fully
        covered at 800px of scroll and does not unpin until past 1200, so it
        never lets go while any of it is still on screen. If the listing ever
        becomes short enough to fit inside a viewport, the next section has to
        come back into this layer — and it must carry an opaque ground of its
        own, or the pinned film paints through it.

        Once the hero has been covered there is nothing left to see, and
        letting it scroll away frees the browser from compositing a pinned,
        playing video for the rest of the page.
      */}
      <div className="relative">
        <Hero />

        <div className="relative z-10">
          <UpcomingEvents />
        </div>
      </div>

      {/* What you would be making — four strands, not a second listing. */}
      <CreativeExperiences />

      {/*
        And where you would be making it.

        Directly under the menu, at the client's ask, because the two are one
        thought: the section above names the things you can do and this one
        says they happen inside a mall you already visit. Read the other way
        round — a map first, a menu later — the mall reads as an address and
        the page has to make the connection twice.

        It moved here from between the gallery and the quotes, where it read as
        credibility for a business already argued for. Nothing else on the page
        moved with it.
      */}
      <MallPartners />

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
        The last hesitations, answered in four lines — and answered BEFORE the
        quotes rather than after them, at the client's ask.

        It reads better this way round. The practical doubts ("where is it",
        "what do I need", "how do I book") are the ones standing between a
        visitor and a date, so they are cleared first; the quotes then land on
        somebody who has run out of reasons not to, which is the moment other
        people vouching for it is worth most. Answering after the endorsement
        had the page reassure, then raise the questions again.
      */}
      <HomeFaq />

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
