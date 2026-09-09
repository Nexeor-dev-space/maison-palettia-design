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
     holds three source images between them: CRAFT is a detail of the same
     vessel the workshops section shows whole, and SHAPE and CREATE are two
     regions of the same eight-second clip — the wheel and the shelf behind it.
     Paint being made, textiles, tools, more than one pair of hands, and a room
     with people in it are all missing, and no amount of re-cropping will
     supply them.
   ========================================================================== */
const PLACEHOLDER_DISCIPLINES: Discipline[] = [
  {
    slug: "paint",
    href: "/workshops",
    name: "Paint",
    description: "Colour, expression and imagination.",
    image: {
      src: "/images/creative/colour-in-layers.jpg",
      alt: "Watercolour laid wet on wet — yellows and greens rising through blue-violet washes, a crimson bloom at the top edge, the grain of the paper showing through.",
    },
  },
  {
    slug: "shape",
    href: "/workshops",
    name: "Shape",
    description: "Get hands-on with clay and form.",
    image: {
      src: "/images/creative/form-on-the-wheel.jpg",
      alt: "Two clay-covered hands steadying the wide, freshly opened belly of a vessel as the wheel turns beneath it.",
    },
  },
  {
    slug: "craft",
    href: "/workshops",
    name: "Craft",
    description: "Make something thoughtful by hand.",
    image: {
      src: "/images/creative/carved-glaze.jpg",
      alt: "A band of hand-carved scrollwork running across a stoneware vessel, the relief pooled with sage, teal and ochre glaze.",
    },
  },
  {
    slug: "create",
    href: "/workshops",
    name: "Create",
    description: "Experiment, discover and make it your own.",
    image: {
      src: "/images/creative/finished-on-the-shelf.jpg",
      alt: "Hand-thrown cups glazed in slate blue and cream, lined up on a studio shelf against a painted brick wall.",
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

