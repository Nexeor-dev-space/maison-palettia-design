import type { Discipline } from "@/types";

/**
 * The creative strands offered at Maison Palettia, and the seam where they
 * will meet a CMS.
 *
 * Everything reads these through {@link getDisciplines}, so replacing the
 * array below with a query is a change to one function body. The homepage
 * composition is art-directed rather than uniform, but it is not hard-wired to
 * a count: the first entry opens the section and the rest cycle through a
 * repeating rhythm of shapes, so adding a strand extends the hang instead of
 * breaking it.
 */

/* ==========================================================================
   TODO(client): PLACEHOLDER CONTENT — DEVELOPMENT ONLY.

   These strands are the conceptual directions supplied with the brief,
   not an approved list of what Maison Palettia teaches. Nothing here claims a
   class, a facility or a schedule; each one is a way of making, and the
   wording is deliberately kept to a single sentence so it states nothing that
   would need verifying. Replace with the studio's own strands before launch.

   The photographs are stand-ins, cut from assets already in the project.

     THREE STRANDS, NOT FOUR. There was a fourth — SHAPE, "get hands-on with
     clay and form", over a photograph of two hands throwing on the wheel —
     and the client has taken the brand off the wheel. It is removed rather
     than re-dressed: every other strand here is a way of working a surface,
     and there is no approved activity that "shape" could honestly stand for.
     PAINT and CRAFT are real process photographs of people making things, and
     CRAFT is ceramic painting, which is approved and stays.

     TODO(client): this section needs a real shoot more than any other on the
     page. Three strands need three distinct visual identities and the pool is
     thinner than it was.

     All three ship as squares. The originals are portrait (about 2:3) and the
     frames that render them run from 0.95:1 — the desktop arch, which is
     taller than it is wide despite the 42vw hint on it — out to 3:2 on a
     phone. A square is the one master that survives that whole range on a
     centre crop, and it keeps two thirds of the original height where a
     landscape cut kept half. The full-resolution files are at
     assets/creative-masters/, outside public/ so they are retained without
     being deployed; recrop from there rather than from these.

     CREATE is the one still to fix; see the note on it below.
   ========================================================================== */
const PLACEHOLDER_DISCIPLINES: Discipline[] = [
  {
    slug: "paint",
    href: "/events",
    name: "Paint",
    description: "Colour, expression and imagination.",
    image: {
      src: "/images/creative/painting.jpg",
      alt: "A painter at an easel, brush in hand, working into a canvas of coral and blush roses among deep teal leaves, a loaded palette at the edge of the frame.",
    },
  },
  {
    slug: "craft",
    href: "/events",
    name: "Craft",
    description: "Make something thoughtful by hand.",
    image: {
      src: "/images/creative/craft.jpg",
      alt: "Two hands turning a small ceramic pot while a fine brush lays a block of yellow into a design of pastel blue, lilac, mint and coral.",
    },
  },
  {
    slug: "create",
    href: "/events",
    name: "Create",
    description: "Experiment, discover and make it your own.",
    image: {
      /*
        TODO(client): this one is off-message and should be reshot. The
        other two show someone making something; this shows a hand holding a
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

