import type { ImageAsset } from "@/types";

/**
 * Everything the private-events page says, and the seam where it will meet a
 * CMS.
 *
 * Held here rather than inline in the page for the reason lib/disciplines.ts
 * and lib/constants.ts are: the studio will want to change this wording, and
 * copy buried in JSX is copy that needs a developer. Replacing each array with
 * a query is a change to one function body.
 *
 * ==========================================================================
 * WHAT IS CLAIMED HERE, AND WHAT IS DELIBERATELY NOT
 * ==========================================================================
 *
 * The brief for this page was explicit: invent no prices, no packages, no
 * guest counts, no venues, no guaranteed services, no corporate clients and no
 * testimonials. Nothing in this file states any of them, and the page has no
 * shape waiting for them either — there is no pricing block with a blank in
 * it, no "up to N guests" line and no logo wall, because a component built to
 * hold a number is a component that will eventually be given an invented one.
 *
 * What is stated is of two kinds, and they are kept apart on purpose:
 *
 *   OCCASIONS are framed as examples, in the page copy as well as here. The
 *   studio has not confirmed it runs any particular kind of event, so the
 *   section says "the kinds of gathering people ask us about" is exactly what
 *   it must NOT say — that would be a claim about demand nobody has measured.
 *   It says these are examples of what a private session could be built
 *   around, which is a description of the offer, not a record of the past.
 *
 *   ACTIVITIES are the six the client supplied. They describe the craft
 *   itself — what the material is and what you do to it — and never what the
 *   studio provides, fires, supplies or guarantees. "Colour laid onto a
 *   ready-made ceramic piece" is a description of ceramic painting; "glazed
 *   and fired in our kiln within two weeks" would be a service promise this
 *   project has no authority to make.
 *
 * TODO(client): confirm the six activities below are all genuinely offered for
 * private bookings, and confirm the occasion examples. Both are supplied
 * material, not verified material.
 */

/* ==========================================================================
   01 — OCCASIONS

   Presented on the page as examples and nothing else. They are a way of
   saying "this is flexible" in concrete words, which is what someone deciding
   whether to enquire actually needs — an abstract "for any occasion" tells
   them less than five specifics framed as specimens.

   No icons, no cards, no photographs. Each one would need a picture the
   project does not have, and a stock photograph of a birthday is precisely
   the "cheap party visual" the brief rules out.
   ========================================================================== */

export interface PrivateEventOccasion {
  /** Stable key, and the React key. */
  slug: string;
  /** Set in caps by the design; stored in its natural case. */
  label: string;
}

export const PRIVATE_EVENT_OCCASIONS: readonly PrivateEventOccasion[] = [
  { slug: "birthdays", label: "Birthdays" },
  { slug: "team-gatherings", label: "Team gatherings" },
  { slug: "celebrations", label: "Celebrations" },
  { slug: "private-sessions", label: "Private creative sessions" },
  { slug: "brand-community", label: "Brand and community events" },
] as const;

/* ==========================================================================
   02 — CREATIVE ACTIVITIES

   The six the client approved for private events. Pottery is deliberately
   absent: it is the studio's signature in the public programme and most of
   the photography in this project is of it, but the brief excludes it here
   and excluding it is the whole point of having this list rather than reusing
   {@link getDisciplines}.

   NO PER-ACTIVITY PHOTOGRAPHY, AND THAT IS NOT AN OVERSIGHT. The project
   holds real images for two of these six — painting and ceramic painting —
   and nothing at all for tote bags, bedazzling, candles or crochet. Six
   entries where two carry a photograph and four carry a grey box reads as a
   page half-built; six where four carry a photograph of something else
   entirely is worse, because it is a lie about what the session is. So the
   section is set as a typographic index with one true plate beside it, which
   is also the composition the brief asked for — large type, generous space,
   no card grid.

   TODO(client): four of these need a photograph before they can be shown
   individually — tote bag painting, bedazzling, candle making and crocheting.
   Supply those and the index can become plates without the copy changing.
   ========================================================================== */

export interface PrivateEventActivity {
  slug: string;
  name: string;
  /**
   * One line, describing the craft rather than the service. See the note at
   * the head of this file: what the material is and what you do to it, never
   * what the Maison supplies, fires or promises.
   */
  description: string;
}

export const PRIVATE_EVENT_ACTIVITIES: readonly PrivateEventActivity[] = [
  {
    slug: "painting",
    name: "Painting",
    description: "Canvas, brushes and colour, worked at your own pace.",
  },
  {
    slug: "tote-bag-painting",
    name: "Tote bag painting",
    description: "Fabric paint on plain cotton — the one you carry out with you.",
  },
  {
    slug: "ceramic-painting",
    name: "Ceramic painting",
    description: "Colour and pattern laid onto a ready-made piece.",
  },
  {
    slug: "bedazzling",
    name: "Bedazzling",
    description: "Stones and beads set onto something plain until it is not.",
  },
  {
    slug: "candle-making",
    name: "Candle making",
    description: "Wax, wick and colour, poured and left to set.",
  },
  {
    slug: "crocheting",
    name: "Crocheting",
    description: "A hook, a ball of yarn and one stitch to start from.",
  },
] as const;

/* ==========================================================================
   03 — HOW IT WORKS

   The client's own four steps, in the client's own order and close to the
   client's own words. Nothing is added to them — no "within 24 hours", no
   "dedicated coordinator", no "site visit" — because each of those is a
   commitment somebody at the studio would have to keep.
   ========================================================================== */

export interface PrivateEventStep {
  /** The printed numeral. Copy, not an index — see {@link VisitStep}. */
  number: string;
  title: string;
  /** One short sentence. Any longer and the process starts sounding long. */
  detail: string;
}

export const PRIVATE_EVENT_STEPS: readonly PrivateEventStep[] = [
  {
    number: "01",
    title: "Tell us about your event",
    detail: "Who is coming, roughly when, and what the occasion is.",
  },
  {
    number: "02",
    title: "Choose the creative experience",
    detail: "Pick the activity your group would most like to spend an afternoon on.",
  },
  {
    number: "03",
    title: "We plan the experience",
    detail: "We come back to you with the shape of the session and what it involves.",
  },
  {
    number: "04",
    title: "Create together",
    detail: "Everyone makes something, and everyone leaves holding it.",
  },
] as const;

/* ==========================================================================
   04 — PHOTOGRAPHY

   Three plates, each chosen against the same two rules: it must not be
   pottery, and it must be something this project actually has. Named here so
   the page reads its pictures from the same place it reads its words, and so
   swapping in the studio's own shoot is one edit.

   TODO(client): this page has no photograph of a group. Every image in the
   project is one pair of hands or a finished piece, so a page about making
   things together illustrates itself with people making things alone. That is
   the single most valuable shot the studio could add here.
   ========================================================================== */

export const PRIVATE_EVENT_IMAGES: Record<"hero" | "experience" | "activities", ImageAsset> = {
  /**
   * A watercolour wash rather than a photograph of a party, and that is the
   * positioning in one decision: the brief asks for this page not to look like
   * an event-planning company, and nothing says event-planning company faster
   * than a wide shot of people laughing around a table.
   *
   * Deep blue-green through two thirds of the frame with the light breaking
   * warm at the right, which is what makes it hold cream type at the foot —
   * see the scrim on the hero.
   */
  hero: {
    src: "/images/editorial/wash-and-light.jpg",
    alt: "A watercolour wash in deep blue and teal, opening to warm yellow light and a soft dark stroke at the right of the sheet.",
  },
  /**
   * Someone at an easel, mid-brushstroke. The only picture in the project of a
   * person making something that is not pottery, which is exactly what this
   * section is about. Shared with the homepage strands; reused rather than
   * substituted, because a worse-fitting picture for the sake of novelty is a
   * bad trade.
   */
  experience: {
    src: "/images/creative/painting.jpg",
    alt: "A painter at an easel, brush in hand, working into a canvas of coral and blush roses among deep teal leaves, a loaded palette in the foreground.",
  },
  /**
   * Ceramic painting, and literally so: a fine brush laying yellow onto a
   * small pot already blocked in pastel. One of the six activities, shown
   * being done. See the note on the activities list for why the other five
   * are type rather than pictures.
   */
  activities: {
    src: "/images/creative/craft.jpg",
    alt: "Two hands turning a small ceramic pot while a fine brush lays a block of yellow into a design of pastel blue, lilac, mint and coral.",
  },
};
