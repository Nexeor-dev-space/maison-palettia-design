import type { Discipline } from "@/types";

/**
 * The creative strands offered at Maison Palettia, and the seam where they
 * will meet a CMS.
 *
 * Everything reads these through {@link getDisciplines}, so replacing the
 * array below with a query is a change to one function body. The homepage
 * composition is art-directed rather than uniform, but it is not hard-wired to
 * four: the first entry opens the section and the rest cycle through a
 * repeating rhythm of shapes, so adding a fifth strand extends the hang
 * instead of breaking it.
 */

/* ==========================================================================
   TODO(client): PLACEHOLDER CONTENT — DEVELOPMENT ONLY.

   These four strands are the conceptual directions supplied with the brief,
   not an approved list of what Maison Palettia teaches. Nothing here claims a
   class, a facility or a schedule; each one is a way of making, and the
   wording is deliberately kept to a single sentence so it states nothing that
   would need verifying. Replace with the studio's own strands before launch.

   The photographs are stand-ins, cut from assets already in the project — the
   watercolour and the glazed vessel from the hero, and two frames of the
   master wheel footage.

     TODO(client): this section needs a real shoot more than any other on the
     page. Four strands need four distinct visual identities, and the project
     held three source images between them. That is now fixed for three of the
     four: PAINT, SHAPE and CRAFT are real process photographs of people
     making things.

     All four ship as squares. The originals are portrait (about 2:3) and the
     frames that render them run from 0.95:1 — the desktop arch, which is
     taller than it is wide despite the 42vw hint on it — out to 3:2 on a
     phone. A square is the one master that survives that whole range on a
     centre crop, and it keeps two thirds of the original height where a
     landscape cut kept half. The full-resolution files are at
     assets/creative-masters/, outside public/ so they are retained without
     being deployed; recrop from there rather than from these.

     CREATE is the one still to fix, and it is now wrong rather than merely
     thin; see the note on it below.
   ========================================================================== */
const PLACEHOLDER_DISCIPLINES: Discipline[] = [
  {
    slug: "paint",
    href: "/workshops",
    name: "Paint",
    description: "Colour, expression and imagination.",
    image: {
      src: "/images/creative/painting.jpg",
      alt: "A painter at an easel, brush in hand, working into a canvas of coral and blush roses among deep teal leaves, a loaded palette at the edge of the frame.",
    },
  },
  {
    slug: "shape",
    href: "/workshops",
    name: "Shape",
    description: "Get hands-on with clay and form.",
    image: {
      src: "/images/creative/pottery.jpg",
      alt: "Two clay-covered hands drawing the wall of a cylinder upward on the wheel, the rim rising between their fingers.",
    },
  },
  {
    slug: "craft",
    href: "/workshops",
    name: "Craft",
    description: "Make something thoughtful by hand.",
    image: {
      src: "/images/creative/craft.jpg",
      alt: "Two hands turning a small ceramic pot while a fine brush lays a block of yellow into a design of pastel blue, lilac, mint and coral.",
    },
  },
  {
    slug: "create",
    href: "/workshops",
    name: "Create",
    description: "Experiment, discover and make it your own.",
    image: {
      /*
        TODO(client): this one is off-message and should be reshot. The other
        three show someone making something; this shows a hand holding a
        finished, shop-bought cork coaster on a souvenir stall, with rows more
        behind it and the word PORTUGAL printed in the corner of the design.
        Under a strand that reads "experiment, discover and make it your own"
        it says the opposite — bought, not made — and it carries another
        country's tourist branding onto a Dubai studio's homepage.
      */
      src: "/images/creative/create.jpg",
      alt: "A hand holding up a square cork-backed coaster printed with a patchwork of blue and ochre tile patterns and a row of fish, more of them laid out behind.",
    },
  },
];

/**
 * The strands, in the order they should be read.
 *
 * TODO(client): replace the body with the CMS query. Order is editorial — the
 * section numbers what it renders — so the query should preserve whatever
 * order the studio sets rather than sorting.
 */
export async function getDisciplines(): Promise<Discipline[]> {
  return PLACEHOLDER_DISCIPLINES;
}

