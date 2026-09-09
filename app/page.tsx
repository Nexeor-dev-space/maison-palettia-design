import { BrandIntro } from "@/components/sections/BrandIntro";
import { CreativeExperiences } from "@/components/sections/CreativeExperiences";
import { EditorialStatement } from "@/components/sections/EditorialStatement";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { JustAdded } from "@/components/sections/JustAdded";
import { MaisonPhilosophy } from "@/components/sections/MaisonPhilosophy";
import { PlanYourVisit } from "@/components/sections/PlanYourVisit";
import { UpcomingWorkshops } from "@/components/sections/UpcomingWorkshops";
import { EDITORIAL_PANELS } from "@/lib/constants";

/**
 * Homepage. Metadata comes from the site defaults in lib/seo.ts.
 * The story runs hero → brand introduction → workshops → the experience →
 * the creative strands → just added → the philosophy, and closes on the
 * invitation to visit. Sections are built one at a time from Phase 4 onward.
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

        The wrapper deliberately stops before the last section. Once the hero
        has been covered for two full sections there is nothing left to see,
        and letting it scroll away frees the browser from compositing a
        pinned, playing video for the rest of the page.
      */}
      <div className="relative">
        <Hero />

        <div className="relative z-10">
          <BrandIntro />
          <UpcomingWorkshops />
        </div>
      </div>

      <EditorialStatement panel={EDITORIAL_PANELS.movement} spread="foot" />

      <Experience />
      <CreativeExperiences />

      {/*
        The second panel breaks the longest run of content on the page —
        experience, strands, what's just been added — rather than following the
        first one. The featured story lands above it when it arrives, which is
        the arrangement the two panels were composed for: one after the
        workshops listing, one deep in the second half, far enough apart that
        neither reads as the other's twin.
      */}
      <EditorialStatement panel={EDITORIAL_PANELS.making} spread="field" />

      {/*
        TODO: the featured story (section 06) belongs between the creative
        strands and "Just Added" — one experience given the whole page, which
        is what makes the strip below it read as the lighter gesture. Slot it
        in above once it lands.
      */}
      <JustAdded />
      <MaisonPhilosophy />

      {/*
        The last section on the page, and the only one that asks for anything.
        It stays last: the philosophy above it is the argument, and the
        invitation only works as the thing said after it.
      */}
      <PlanYourVisit />
    </>
  );
}
