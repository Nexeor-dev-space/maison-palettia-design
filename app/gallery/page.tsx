import { GalleryWall, type WallItem } from "@/components/gallery/GalleryWall";
import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { INK } from "@/components/sections/hero/composition";
import { Container } from "@/components/ui/Container";
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
    <section
      aria-labelledby="gallery-title"
      /* `overflow-clip`, not `hidden`: a scroll container breaks the view
         timeline the brand marks draw on. Same trap as everywhere else. */
      className="relative isolate overflow-clip bg-sage"
    >
      {/*
        THE SHAPES BEHIND THE WALL. "Use doodles here to make this section more
        engaged" — and the reference puts them exactly here, at the edges of
        the block rather than over it: a large cut-out breaking the top right,
        smaller ones running down the left margin and along the foot.

        WHICH COLOURS SHOW ON LIGHT SAGE, measured: Deep Lilac 3.83:1, Charcoal
        9.36, Warm Terracotta 2.36, White Rock 1.03, Soft Lavender 1.44. The
        last two are invisible on this ground at any opacity a background can
        afford, so these are lilac and terracotta with one small charcoal.

        They sit in the head's empty right half and in the page's two margins,
        never behind the pictures — a mark half-covered by a photograph reads
        as a rendering fault rather than as a layer.
      */}
      <SectionShapes plan={WALL_SHAPES} />

      <Container className="relative pb-[5rem] pt-[3.5rem] md:pb-section md:pt-[4rem] lg:pb-section-lg lg:pt-[4.5rem]">
        {/*
          THE HEAD WAS A NARROW COLUMN AND THREE QUARTERS OF A SCREEN OF
          NOTHING. `max-w-[26ch]` broke "A look inside the studio" over three
          lines of script in the left quarter of the page, and the eye had to
          cross an empty Light Sage band the height of the viewport before it
          reached a photograph.

          IT IS A REM MEASURE RATHER THAN A `ch` ONE, and that is the fix
          rather than a preference. `ch` is the width of a "0", and Hapsha's
          is narrow while its letters are wide and heavily joined — 26ch
          measured about 380px against lines that want 490. Set against the
          type's own measured run, 33rem takes "A look inside" and "the
          studio" and nothing more.
        */}
        <div className="max-w-[33rem]">
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

        <div className="mt-10 md:mt-12">
          <GalleryWall items={items} />
        </div>
      </Container>
    </section>
  );
}

/*
  Four is the ceiling <SectionShapes> sets. The big lilac splash is the one the
  reference leads with — top right, breaking the measure — and the rest are
  smaller and lower so the page has shapes at both ends rather than a cluster
  at one.
*/
const WALL_SHAPES: readonly ShapePlan[] = [
  {
    name: "splash",
    color: INK.lilac,
    width: "16%",
    right: "-2%",
    top: "1%",
    rotate: -12,
    drift: 22,
    opacity: 0.24,
    float: 13,
    desktopOnly: true,
  },
  {
    /*
      IN THE HEAD, NOT THE MARGIN. This sat at `left: -1%, top: 34%` and was
      invisible: the page runs full-bleed to a 20px gutter, so there is no
      margin to put a shape in, and at a third of the way down it was simply
      behind the first column of photographs. The head's right half is the one
      piece of open Light Sage this page has.
    */
    name: "coral",
    color: INK.lilac,
    width: "8%",
    left: "46%",
    top: "3%",
    rotate: 14,
    drift: -18,
    opacity: 0.18,
    float: 15,
    floatDelay: 1.3,
    desktopOnly: true,
  },
  {
    name: "starburst",
    color: INK.terracotta,
    width: "7%",
    right: "1%",
    bottom: "8%",
    rotate: 10,
    drift: 18,
    opacity: 0.22,
    float: 11,
    floatDelay: 0.7,
  },
  {
    name: "zigzag",
    color: INK.charcoal,
    width: "3.5%",
    left: "6%",
    bottom: "3%",
    rotate: -8,
    drift: -14,
    opacity: 0.16,
    float: 17,
    floatDelay: 2.1,
    desktopOnly: true,
  },
];

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
