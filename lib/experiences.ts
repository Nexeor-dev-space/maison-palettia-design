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

   Four of the five photographs are the client's own activity set from
   public/images/hero-carousel/, already identified frame by frame in
   HERO_CAROUSEL (lib/constants.ts); the alt text and crop positions are
   carried across unchanged so one photograph is never described two ways.

   The fifth, ceramic painting, is /images/creative/craft.jpg. That file is a
   genuine ceramic-painting photograph — a brush laying colour onto a
   ready-made pot — and is already used for the Craft strand and on the
   private-events page. The note in HERO_CAROUSEL explains why it is kept out
   of the *hero* specifically; no such restriction applies here, and the
   alternative was leaving the client's second-priority activity without a
   picture while a correct one sat in the repository.

   Mandala painting and glass painting are the client's own photographs,
   supplied for this section and re-cut for the web — 4608x3072 and 4000x4000
   masters down to 1800px on the long edge, with the originals kept outside
   public/ at assets/masters/. The full-size files were 1.2MB and 3.5MB, and a
   4000x4000 source is the exact shape that hung the image optimizer on the
   crocheting frame; see the note in lib/workshops.ts.
   ========================================================================== */

const EXPERIENCES: readonly CreativeExperience[] = [
  {
    slug: "tote-bag-painting",
    name: "Tote bag painting",
    description: "Fabric paint on plain cotton — the one you carry out with you.",
    kind: "diy",
    image: {
      src: "/images/hero-carousel/2.png",
      alt: "Seen from above, two hands painting a hummingbird and a spray of orchids and hibiscus onto a royal blue cotton tote, a tray of colour pots beside them.",
      position: "45% 50%",
    },
  },
  {
    slug: "ceramic-painting",
    name: "Ceramic painting",
    description: "Colour and pattern laid onto a ready-made piece.",
    kind: "diy",
    image: {
      src: "/images/creative/craft.jpg",
      alt: "Two hands turning a small ceramic pot while a fine brush lays a block of yellow into a design of pastel blue, lilac, mint and coral.",
      position: "50% 50%",
    },
  },
  {
    slug: "bedazzling",
    name: "Bedazzling",
    description: "Stones and beads set onto something plain until it is not.",
    kind: "diy",
    image: {
      src: "/images/hero-carousel/4.jpg",
      alt: "A smiling young woman in a denim jacket, her cheeks and brows set with clusters of coloured gems and tiny rhinestone flowers.",
      position: "55% 30%",
    },
  },
  {
    // No description: the studio has not written one, and this is not the
    // place to invent a sentence about what a mandala is. The photograph is
    // the client's own and needs no caption to do its work.
    slug: "mandala-painting",
    name: "Mandala painting",
    kind: "diy",
    image: {
      src: "/images/creative/mandala-painting.jpg",
      alt: "A hand holding up a large round mandala board against blurred autumn foliage — turquoise, worked in concentric white-ridged arcs inlaid with mirror diamonds and dots.",
      // The disc fills the square frame and the hand enters from the lower
      // left; held a little above centre so a landscape crop keeps the
      // pattern and loses the foliage rather than the other way round.
      position: "50% 45%",
    },
  },
  {
    slug: "glass-painting",
    name: "Glass painting",
    kind: "diy",
    // The client's own wording, carried through rather than paraphrased.
    status: "Coming soon",
    image: {
      src: "/images/creative/glass-painting.jpg",
      alt: "A finished glass panel in a pale wooden frame standing on a walnut table, painted with a blue toucan on a branch among monstera and palm leaves, a lamp lit behind it.",
      /*
        The panel sits right of centre and low in a wide, mostly empty frame —
        a lamp and an armchair fill the left third. Pulled across and down so a
        `cover` crop keeps the painted glass and gives away the empty wall,
        which is the only part of this photograph with nothing in it.
      */
      position: "56% 62%",
    },
  },
  {
    slug: "candle-making",
    name: "Candle making",
    description: "Wax, wick and colour, poured and left to set.",
    kind: "scheduled",
    image: {
      src: "/images/hero-carousel/1.jpg",
      alt: "Two hands cupping a freshly poured candle in a glass jar, its wick lit, with tealights burning on the wooden bench around it.",
      position: "50% 40%",
    },
  },
  {
    slug: "crocheting",
    name: "Crocheting",
    description: "A hook, a ball of yarn and one stitch to start from.",
    kind: "scheduled",
    image: {
      src: "/images/hero-carousel/crocheting.jpg",
      alt: "Balls of mint and cream yarn with a crochet hook resting on them, beside a finished blanket worked in shell stitch.",
      position: "58% 42%",
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
