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
  /** DIY runs whenever the table is open; scheduled runs at a set time. */
  kind: "diy" | "scheduled";
  /** The studio's own flag, e.g. "Coming soon". Shown verbatim. */
  status?: string;
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
    name: "Tote bag painting",
    description: "Fabric paint on plain cotton — the one you carry out with you.",
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
    name: "Ceramic painting",
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
    name: "Mandala painting",
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
    name: "Glass painting",
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
    name: "Candle making",
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
