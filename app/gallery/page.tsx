import { GalleryWall, type WallItem } from "@/components/gallery/GalleryWall";
import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { Eyebrow, forScript } from "@/components/ui/SectionHeader";
import { EVENT_PLATES } from "@/lib/brand";
import { getCreativeExperiences } from "@/lib/experiences";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Gallery",
  description: "A look inside the Maison Palettia studio.",
  path: "/gallery",
});

/**
 * /gallery — what has actually been made, hung as a wall.
 *
 * ==========================================================================
 * WHERE THESE PICTURES COME FROM, AND WHY THERE ARE NOT MORE
 * ==========================================================================
 *
 * This route was a <PagePlaceholder> stub. `public/images/gallery/` is EMPTY,
 * so a gallery had to be assembled out of what the project already holds, and
 * only from sets whose provenance and alt text are already settled:
 *
 *   THE SEVEN ACTIVITIES  lib/experiences.ts — the client's own named set,
 *                         one square file per activity, each with alt text
 *                         written against the photograph. Its provenance note
 *                         is the authority on this folder; HAND_BUILDING.jpg
 *                         is in it and is deliberately never used, because it
 *                         is pottery-making and the client has asked that
 *                         stays off the site. `getCreativeExperiences()` does
 *                         not return it.
 *   THE EVENT PLATES      lib/brand.ts — three photographs of finished work
 *                         from real sessions, with their own alt text.
 *   TWO STUDIO FRAMES     Pulled from the Maison's banner footage and already
 *                         used elsewhere on the site, so their descriptions
 *                         are settled rather than written for this page.
 *
 * NOT INCLUDED: public/images/creative/ carries Adobe C2PA records that read
 * as web-sourced rather than the studio's own. Those three appear on the home
 * page at the client's direction; putting them in something called a gallery
 * makes a stronger claim about authorship than the files support, so they are
 * left out until the licence is confirmed.
 *
 * NOTHING HERE IS CAPTIONED THAT THE DATA DOES NOT NAME. The seven activities
 * caption themselves with their own `name`. The plates and the studio frames
 * carry no caption, because writing one would be inventing a memory — a date,
 * an occasion, a person — and none of that is recorded anywhere in the
 * project. They are pictures, and the wall lets them be pictures.
 *
 * WHEN REAL GALLERY IMAGERY ARRIVES, it drops into `items` below and the wall
 * absorbs it: the rhythm is keyed off position, so the composition re-forms
 * around any number of pictures without a layout change.
 */
export default async function GalleryPage() {
  const experiences = await getCreativeExperiences();

  /*
    THE ORDER IS THE EDITING. Not "activities, then plates, then frames" —
    that reads as three folders concatenated. The sets are interleaved so a
    finished keepsake sits next to the activity that makes it and a process
    shot breaks the run, which is how a wall is hung and is the only thing
    here that a database could not have produced.
  */
  const activityItems: WallItem[] = experiences
    .filter((experience) => experience.image)
    .map((experience) => ({
      src: experience.image!.src,
      alt: experience.image!.alt,
      caption: experience.name,
    }));

  const plateItems: WallItem[] = EVENT_PLATES.map((plate) => ({
    src: plate.src,
    alt: plate.alt,
  }));

  const items: WallItem[] = interleave(activityItems, plateItems, STUDIO_FRAMES);

  return (
    <section aria-labelledby="gallery-title" className="relative isolate overflow-hidden bg-sage">
      <Container className="relative pb-[5rem] pt-[3.5rem] md:pb-section md:pt-[4.5rem] lg:pb-section-lg lg:pt-[5.5rem]">
        {/* One mark in the margin, breaking the measure's right edge. */}
        <Reveal
          delay={0.28}
          className="pointer-events-none absolute -right-5 top-10 hidden w-[7.5rem] lg:block xl:w-[9rem]"
        >
          <DoodleMark name="splash" color={INK.lavender} treatment="draw" delay={300} />
        </Reveal>

        <div className="max-w-[26ch]">
          <Reveal>
            <Eyebrow>Gallery</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <h1
              id="gallery-title"
              className="heading-script mt-6 pb-[0.3em] text-script-section text-text"
            >
              {forScript("A look inside the studio")}
            </h1>
          </Reveal>
        </div>

        <div className="mt-12 md:mt-16">
          <GalleryWall items={items} />
        </div>
      </Container>
    </section>
  );
}

/*
  The two studio frames, described where they were first used — /about's
  opening object and /contact's banner — so the same photograph is never
  described two different ways on the same site.
*/
const STUDIO_FRAMES: readonly WallItem[] = [
  {
    src: "/images/studio/marbling.jpg",
    alt: "A close view of a marbling bath: a fine needle drawn down through floating orange, teal and red inks, pulling them into feathered swirls.",
  },
  {
    src: "/images/studio/plate-motif.jpg",
    alt: "A hand painting a teal flower motif onto a pale ceramic plate.",
  },
];

/**
 * Round-robin the sets together, longest-first, dropping each as it empties.
 *
 * Deliberately not `concat`: the whole point is that the wall does not read as
 * one folder after another. Deterministic, so the order is the same on the
 * server and on the client and the page does not re-hang itself on hydration.
 */
function interleave(...sets: readonly (readonly WallItem[])[]): WallItem[] {
  const queues = sets.map((set) => [...set]).filter((set) => set.length > 0);
  const out: WallItem[] = [];
  while (queues.length > 0) {
    for (let i = 0; i < queues.length; i++) {
      const next = queues[i].shift();
      if (next) out.push(next);
    }
    for (let i = queues.length - 1; i >= 0; i--) {
      if (queues[i].length === 0) queues.splice(i, 1);
    }
  }
  return out;
}
