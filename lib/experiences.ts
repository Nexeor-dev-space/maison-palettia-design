import type { VibeSlug } from "@/lib/vibes";
import type { ImageAsset } from "@/types";

/**
 * The creative experiences on offer, and the seam the homepage reads them
 * through.
 *
 * WHY THIS EXISTS RATHER THAN `getDisciplines()`. The section used to show the
 * four strands — Paint, Shape, Craft, Create — which are categories rather
 * than things anyone can book. A visitor reading "Craft" learns nothing about
 * what they would actually spend an afternoon doing; "Bedazzling" and "Candle
 * making" are the answer to that question, and they are the words the studio
 * itself uses. The strands still have their place on /about, where the job is
 * to describe a range rather than to offer a menu.
 *
 * WHY NOT `PRIVATE_EVENT_ACTIVITIES`. That list is what a private booking can
 * be built around, and it carries no imagery because that page never shows
 * any. This surface is image-led and is the studio's full public menu, which
 * includes two activities the private list does not. The descriptions here are
 * taken verbatim from that file where they overlap, so the two can never
 * describe the same activity differently.
 *
 * TODO(client): these two lists want merging once the private-events page and
 * this section agree on one set. Nothing is blocked on it today.
 *
 * ORDER is the client's own stated priority: the DIY activities first, in the
 * order they gave them, then the scheduled ones.
 */

export interface CreativeExperience {
  slug: string;
  name: string;
  /**
   * One line. Optional, and absent rather than invented — see the note on
   * the two entries below that have none.
   */
  description?: string;
  /*
    THE LONG DESCRIPTION — the paragraphs the event page's "About" section
    prints, one <p> each, in order.

    IT IS SET ON EVERY ENTRY NOW, AT THE CLIENT'S ASK, and the rule the words
    were written under is worth keeping with them.

    It was unset, and the note here said so: the only descriptive text this
    project held per activity was the one line in `description`, every event
    page already printed that as its lead, and writing more would be inventing
    the client's own copy. The client has since asked for exactly that — "all
    the event description pages should have event description to glorify that
    event" — so the words are theirs to have.

    WHAT THESE SENTENCES MAY SAY. The craft, and nothing else. What the
    material does, what you put on it, what comes out. Every one of them is
    readable off the activity's own name, its `description` and the photograph
    beside it.

    WHAT THEY DO NOT SAY, because none of it is in this project and a page
    that promises it is a page the studio has to honour: no duration, no
    price, no age, no materials list, no group size, no claim about how a
    session is run or who it suits, and no "most popular". Those are the
    studio's facts; `description`, `kind` and lib/workshops.ts are where they
    land when the studio supplies them.

    One <p> per string, in order. Two each is the house length.
  */
  about?: readonly string[];
  /** DIY runs whenever the table is open; scheduled runs at a set time. */
  kind: "diy" | "scheduled";
  /** The studio's own flag, e.g. "Coming soon". Shown verbatim. */
  status?: string;
  /**
   * Which discovery vibes this activity belongs to — the CMS seam for the
   * "Find your vibe" layer.
   *
   * UNSET ON EVERY ACTIVITY BELOW, AND THAT IS NOT AN OVERSIGHT. Whether
   * bedazzling is "messy and expressive" or "quick" is the studio's judgement
   * about its own programme, not a fact that can be read off a name or a
   * photograph. Guessing would put a visitor who asked for calm in front of
   * something loud, which is the one failure a mood filter cannot survive.
   *
   * See lib/vibes.ts for the taxonomy and for what happens while this is
   * empty: the layer reports honestly rather than inventing members. Adding
   * `vibes: ["mindful-chill"]` to an entry is the whole of the change.
   */
  vibes?: readonly VibeSlug[];
  /**
   * A photograph of this activity, where a real one exists.
   *
   * OPTIONAL ON PURPOSE, AND THE WHOLE REASON THIS FIELD CAN BE UNDEFINED.
   * Two of these activities have no photograph anywhere in the project. The
   * section shows the name and a plain ground for those rather than borrowing
   * a picture of a different activity, which would be a caption that lies. Add
   * a file, point this at it, and the entry becomes image-led with no other
   * change. See <ExperienceIndex>.
   */
  image?: ImageAsset & { position?: string };
}

/* ==========================================================================
   IMAGERY PROVENANCE — read before changing a `src` here.

   All seven are the client's own, supplied as a named set in
   public/images/experiences/ — one square 1024x1024 file per activity, the
   file name matching the activity. They replaced a set borrowed from
   elsewhere in the project: two frames of the studio's banner footage, two
   photographs re-cut from 4000px masters, and one picture of a different
   activity standing in for ceramic painting. Every one of these shows the
   thing its row names.

   Square suits where they are used: the menu's thumbnails are 48px squares
   and the homepage plates are close to square, so none of them is being
   cropped hard in either direction.

   The set also contains HAND_BUILDING.jpg, which is not used and should not
   be: it is pottery-making, which the client has asked stays off the site.
   ========================================================================== */

const EXPERIENCES: readonly CreativeExperience[] = [
  {
    slug: "tote-bag-painting",
    name: "Tote Bag Painting",
    about: [
      "A plain cotton tote, fabric paint and a table to spread out on. Cloth takes colour much the way paper does, so a brush loaded with one shade goes down flat and stays where it is put.",
      "Suns and moons, flowers, a name, a single bold shape across the front. There is no pattern to follow here, and the bag goes out over your shoulder rather than into a cupboard.",
    ],
    description: "Fabric paint on plain cotton, the one you carry out with you.",
    kind: "diy",
    image: {
      src: "/images/experiences/TOTE_BAG_PAINTING.jpg",
      alt:
        "A cotton tote painted with a yellow sun and moon face among blue flowers, brushes and jars of paint on the table behind it.",
      position: "50% 45%",
    },
  },
  {
    slug: "ceramic-painting",
    name: "Ceramic Painting",
    about: [
      "A ready-made piece — a plate, a mug — and colour laid over the top of it. Glaze pools in the dips and sits bright on the flat, which is why a simple band of stripes comes out looking considered.",
      "Work freehand, or build a pattern up a ring at a time. Either way what you leave with is something that goes back on a shelf you use.",
    ],
    description: "Colour and pattern laid onto a ready-made piece.",
    kind: "diy",
    image: {
      src: "/images/experiences/CERAMIC_PAINTING.jpg",
      alt:
        "A ceramic plate painted with pale blue stripes and blueberries beside a matching mug, a paint palette and three brushes on a dark table.",
      position: "50% 50%",
    },
  },
  {
    slug: "bedazzling",
    name: "Bedazzling",
    about: [
      "Stones and beads, and something plain to set them on. One at a time, pressed down, until a shape gathers and the plain thing stops being plain.",
      "It is the most immediate thing on the programme: nothing is mixed and nothing is poured, and the whole of it is the distance between the first stone and the last.",
    ],
    description: "Stones and beads set onto something plain until it is not.",
    kind: "diy",
    image: {
      src: "/images/experiences/BEDAZZLING.jpg",
      alt:
        "A hand in a red glove holding up a balloon dog covered all over in pink rhinestones, bright grass behind it.",
      position: "50% 45%",
    },
  },
  {
slug: "mandala-painting",
    name: "Mandala Painting",
    about: [
      "A round board and a centre to work outwards from. Petals, dots and rings, each pass answering the one before it, until the pattern closes at the edge.",
      "It is the quiet one. The repetition does most of the work, and the circle gets better the longer you stay with it.",
    ],
    kind: "diy",
    image: {
      src: "/images/experiences/MANDALA_PAINTING.jpg",
      alt:
        "Hands holding a round mandala board painted in teal, orange and cream, worked outwards from the centre in petals and dots.",
      // The disc fills the square frame and the hand enters from the lower
      // left; held a little above centre so a landscape crop keeps the
      // pattern and loses the foliage rather than the other way round.
      position: "50% 50%",
    },
  },
  {
    slug: "glass-painting",
    name: "Glass Painting",
    about: [
      "Colour laid onto glass, so the piece is lit from behind instead of looked at flat. A dragonfly, flowers, a border around the edge — the light finishes it.",
      "What comes off the table is a panel to stand in a window. On a bright day it throws its own colours onto the wall behind it.",
    ],
    kind: "diy",
    // The client's own wording, carried through rather than paraphrased.
    status: "Coming soon",
    image: {
      src: "/images/experiences/GLASS_PAINTING.jpg",
      alt:
        "A hand holding an arched glass panel painted with a dragonfly among red and pink flowers on green leaves, the sun throwing its colours onto the wall.",
      position: "50% 50%",
    },
  },
  {
    slug: "candle-making",
    name: "Candle Making",
    about: [
      "Wax, a wick and the colour you choose, poured and left to set. The shade is decided before anything is melted, so the jar is one you specified rather than one you picked off a shelf.",
      "Set with dried flowers, or with hearts pressed into the surface, or left perfectly plain. It cools into the shape of the vessel you poured it in.",
    ],
    description: "Wax, wick and colour, poured and left to set.",
    kind: "scheduled",
    image: {
      src: "/images/experiences/CANDLE_MAKING.jpg",
      alt:
        "Two poured candles in glass jars on a white tray, one set with pink wax flowers and one with pink hearts, sprigs of gypsophila beside them.",
      position: "50% 50%",
    },
  },
  {
    slug: "crocheting",
    name: "Crocheting",
    about: [
      "A hook, a ball of yarn and one stitch to start from. Everything after that is the same movement repeated, which is what makes a first row possible at all.",
      "Granny squares worked a round at a time, in whatever colours come out of the basket. A blanket is only ever one of these joined to the next.",
    ],
    description: "A hook, a ball of yarn and one stitch to start from.",
    kind: "scheduled",
    image: {
      src: "/images/experiences/CROCHETING.jpg",
      alt:
        "A crocheted blanket of granny squares in forest green, cream, mustard and rust, each worked with a sun or a moon.",
      position: "50% 50%",
    },
  },
];

/** How each kind is labelled in the interface. */
export const EXPERIENCE_KIND_LABEL: Record<CreativeExperience["kind"], string> = {
  diy: "Any time",
  scheduled: "Scheduled",
};

/**
 * Every creative experience, in the studio's own order.
 *
 * Async and returning a copy, like every other content seam in this project,
 * so pointing it at a CMS is a change to this function body alone.
 */
export async function getCreativeExperiences(): Promise<CreativeExperience[]> {
  return [...EXPERIENCES];
}
