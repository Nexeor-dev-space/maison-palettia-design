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
   * One line, under the name.
   *
   * It stayed optional because two activities — mandala and glass painting —
   * had none and a line invented for them would have been the project writing
   * the client's copy. The client has now supplied both, so every entry below
   * carries one; the field keeps its `?` for the next activity added before
   * its words are written, not as a standing gap.
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
  /*
    THE FRAMES THAT SIT BESIDE THE "ABOUT" COPY, and deliberately NOT the
    one in `image` above — that is already the photograph at the top of the
    event page, and a collage that opens with it would print the same frame
    twice on one screen.

    So this is the rest of what the studio has of an activity, and for some
    activities that is nothing. Bedazzling has exactly one photograph in the
    whole project and it is spent on the header, so its About section is the
    copy alone rather than the copy beside a repeat. Add a file here and the
    collage appears; nothing else changes.
  */
  gallery?: readonly ImageAsset[];
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
      "Your tote called. It wants a personality.",
      "Give a plain cotton bag a little colour, a little chaos and a lot of you. Paint it, personalise it and walk out with something no one else has.",
    ],
    gallery: [
      {
        src: "/images/experience/tote-bag-1.jpg",
        alt:
          "A cream canvas tote printed with pink lotus flowers and green lily pads, carried on the shoulder.",
      },
      {
        src: "/images/experience/tote-bag-2.jpg",
        alt:
          "A hand laying loose red and yellow blooms of colour across a sheet of paper, the other hand steadying the page.",
      },
      {
        src: "/images/experience/tote-bag-3.jpg",
        alt:
          "Someone at a studio table with a loaded paint palette in one hand, canvases propped behind them.",
      },
      /*
        NOTE(client): the second and third frames are painting, but not
        painting a tote — one is colour on paper, one is a palette at a table.
        They are the set supplied under this activity's name and they read as
        the studio, which is true; neither alt line claims a bag. Swap either
        for a photograph of a painted tote when one exists.

        `studio/tote-table.jpg` and `studio/palette-brush.jpg` came out of
        this set with the rest. `hero/tote-painting.jpg` was never in it:
        it and `palette-brush` are the same moment of the studio's own film,
        seconds apart, so the two side by side read as one photograph printed
        twice. It stays where it is used alone, on /private-events.
      */
    ],
    description: "A plain tote, waiting for your personality.",
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
      /* The client's headline line (PDF p12), first like every other
         activity's — the brief sets each entry as its own paragraph and the
         first one is the line that leads. */
      "Ceramic is better with a little colour.",
      "Start with a blank ceramic and see what happens. Play with shapes, patterns and colour until an everyday piece becomes something you’ll want to use again and again.",
    ],
    gallery: [
      {
        src: "/images/experience/ceramic-1.jpg",
        alt:
          "Hands holding a small unglazed pot while a fine brush lays a band of blue dots around its neck.",
      },
      {
        src: "/images/experience/ceramic-2.jpg",
        alt:
          "A jar of brushes, a palette of mixed blues and greys, and unpainted cups and bowls set out on a white table.",
      },
      {
        src: "/images/experience/ceramic-3.jpg",
        alt:
          "A brush painting blue petals onto a speckled stoneware bowl, the pattern already running round its side.",
      },
      /*
        `creative/carved-glaze.jpg` CAME OUT OF THIS SET EARLIER and must not
        come back. It is a CARVED and glazed tile — a making technique the
        studio does not run, from the group of pottery and vessel photographs
        retired from this project when the wheel work went. On a page about
        painting a ready-made piece it promises a different craft.
      */
    ],
    description: "A little piece of you, in ceramic form.",
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
      "How much sparkle is too much?",
      "Choose what you want to bedazzle, pick your gems and start placing them one by one. Build a pattern, follow the light or cover the whole thing in sparkle.",
    ],
    /*
      NOTE(client): these three are BEADING — a sorting tray, strung baubles,
      a necklace being threaded — while the copy above describes placing gems.
      They are the set supplied under this activity's name, so they are shown;
      the alt lines say beads, because that is what is in them. If the studio
      means rhinestones rather than beads, this set wants replacing, or the
      copy wants to say beads.
    */
    gallery: [
      {
        src: "/images/experience/beadazzling-1.jpg",
        alt:
          "A sorting tray of beads laid out by colour — pink, blue, green, yellow, orange and black.",
      },
      {
        src: "/images/experience/beadazzling-2.jpg",
        alt:
          "Strands of beaded baubles hanging close together in pink, red, yellow and black.",
      },
      {
        src: "/images/experience/beadazzling-3.jpg",
        alt:
          "Two people at a white table threading a line of blue and red beads, loose beads and tubes in front of them.",
      },
    ],
    description: "When in doubt, add a little sparkle.",
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
    description: "Little dots, endless patterns.",
    about: [
      "Start in the centre. Let the rest unfold.",
      "Build your mandala one dot, petal and ring at a time. Watch the pattern grow as colours and shapes repeat, shift and come together.",
    ],
    gallery: [
      {
        src: "/images/experience/mandala-1.jpg",
        alt:
          "Someone at a wooden table drawing a mandala in fine concentric rings, a tray of watercolour pans beside them.",
      },
      {
        src: "/images/experience/mandala-2.jpg",
        alt:
          "A mandala worked in gold line and turquoise dots across a deep brown ground, filling the frame.",
      },
      {
        src: "/images/experience/mandala-3.jpg",
        alt:
          "A hand painting a mandala of blue, pink and red petals radiating from a small sun at its centre.",
      },
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
    description: "A little colour changes the view.",
    about: [
      "Give the light something to play with.",
      "Paint your design, layer in your colours and let the light become part of it. What starts on the table takes on a whole new look by the window.",
    ],
    gallery: [
      {
        src: "/images/experience/glass-painting-1.jpg",
        alt:
          "A backlit panel of glass painted in red, orange, blue and teal cells divided by gold outlines.",
      },
      {
        src: "/images/experience/glass-painting-2.jpg",
        alt:
          "A hand painting red poppies and green stems onto a glass panel laid flat, jars of colour around it.",
      },
      {
        src: "/images/experience/glass-painting-3.jpg",
        alt:
          "Brushes standing in a jar beside a paint-smeared wooden palette on a small round table, an easel behind.",
      },
      /*
        NOTE(client): the third frame is brushes and a palette rather than
        glass. It is in the set supplied under this activity's name and it
        reads as the studio, which is true; the alt line claims no glass.
      */
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
    gallery: [
      {
        src: "/images/experience/candle-making-1.jpg",
        alt:
          "A wooden table set for pouring: filled candle glasses with their wicks held upright, empty jars and a spool of cream twine.",
      },
      {
        src: "/images/experience/candle-making-2.jpg",
        alt:
          "Wax poured from a glass jug into a tumbler while the other hand holds the wooden wick upright.",
      },
      {
        src: "/images/experience/candle-making-3.jpg",
        alt:
          "A hand setting a wick into one of two speckled turquoise and terracotta candle vessels on a white table.",
      },
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
    gallery: [
      {
        src: "/images/studio/yarn-board.jpg",
        alt:
          "Balls of yarn in cream, red and a variegated blue resting on a finished mustard crochet piece.",
      },
      {
        src: "/images/1-2.jpg",
        alt:
          "A pair of hands crocheting a cream panel with a yellow hook, a wound ball of the same yarn beside them.",
      },
      {
        src: "/images/hero-carousel/crocheting.jpg",
        alt:
          "Balls of pale blue and cream yarn with a crochet hook resting on a finished blanket of shell stitch.",
      },
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
