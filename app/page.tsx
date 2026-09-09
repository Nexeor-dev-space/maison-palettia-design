import { BrandIntro } from "@/components/sections/BrandIntro";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { UpcomingWorkshops } from "@/components/sections/UpcomingWorkshops";

/**
 * Homepage. Metadata comes from the site defaults in lib/seo.ts.
 * The story runs hero → brand introduction → workshops → the experience;
 * sections below are built one at a time from Phase 4 onward.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <BrandIntro />
      <UpcomingWorkshops />
      <Experience />
    </>
  );
}
