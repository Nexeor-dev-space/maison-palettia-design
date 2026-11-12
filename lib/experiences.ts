import { pagePhotosMoved } from "@/cms/lib/pagePhotosState";
import { TAGS } from "@/lib/cms/cache";
import { toCreativeExperience } from "@/lib/cms/mappers";
import { getCms } from "@/lib/cms/payload";
import { contentReader, findDocs } from "@/lib/cms/query";
import { withInFilePagePhotos } from "@/lib/experiencePagePhotos";
import type { VibeSlug } from "@/lib/vibes";
import type { ImageAsset } from "@/types";
import { withStaticBlurs } from "@/lib/staticBlur";

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
 *
 * SERVER ONLY since Phase 2: `getCreativeExperiences` reads the CMS through
 * the Local API. Client components import the type (erased) and
 * `EXPERIENCE_KIND_LABEL` from lib/experienceLabels.ts — never a value from
 * here.
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
  /**
   * The photograph at the top of the activity's OWN page, where it differs
   * from `image` (which the menu, the homepage carousel and the cards use).
   * Unset, the page opens on `image`. The experience's "Page photograph"
   * in the CMS.
   */
  pageImage?: ImageAsset & { position?: string };
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

/* The CMS (`experiences`, seeded from this array by 2B) is the source now.
   This array is only what `getCreativeExperiences` returns when the
   collection cannot be read at all (a build without the database); an empty
   CMS answer is "nothing published" and is never replaced by it. */
const EXPERIENCES: readonly CreativeExperience[] = [
  {
    slug: "tote-bag-painting",
    name: "Tote Bag Painting",
    about: [
      "Your tote called. It wants a personality.",
      "Give a plain cotton bag a little colour, a little chaos and a lot of you. Paint it, personalise it and walk out with something no one else has.",
    ],
    // gallery and page photograph: lib/experiencePagePhotos.ts, laid over this entry when the CMS cannot be read.
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
    // gallery and page photograph: lib/experiencePagePhotos.ts, laid over this entry when the CMS cannot be read.
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
    // gallery and page photograph: lib/experiencePagePhotos.ts, laid over this entry when the CMS cannot be read.
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
    // gallery and page photograph: lib/experiencePagePhotos.ts, laid over this entry when the CMS cannot be read.
    kind: "diy",
    // The client's own wording, carried through rather than paraphrased —
    // the same flag glass painting carries, and it reaches every surface
    // that reads `status`: this activity's row and preview in the
    // Experiences menu, its plate on /private-events, its card on /events
    // and in the gallery, its label in the enquiry select, and its own page,
    // where `isUpcoming` is what stops the action area offering anything.
    status: "Coming soon",
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
        src: "https://api.staging-obj-blob.client2.nexeor.com/maison-palettia/public/images/experience/glass-painting-1.jpg",
        alt:
          "A backlit panel of glass painted in red, orange, blue and teal cells divided by gold outlines.",
      },
      {
        src: "https://api.staging-obj-blob.client2.nexeor.com/maison-palettia/public/images/experience/glass-painting-2.jpg",
        alt:
          "A hand painting red poppies and green stems onto a glass panel laid flat, jars of colour around it.",
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
    // gallery and page photograph: lib/experiencePagePhotos.ts, laid over this entry when the CMS cannot be read.
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
    // gallery and page photograph: lib/experiencePagePhotos.ts, laid over this entry when the CMS cannot be read.
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

/** How each kind is labelled — lives in lib/experienceLabels.ts so client cards can import it. */
export { EXPERIENCE_KIND_LABEL } from "@/lib/experienceLabels";

/**
 * The published experiences, in the studio's own order (`order`, the
 * collection's default sort), mapped to `CreativeExperience`. Depth 1
 * populates the photographs, the gallery and the vibe tags.
 *
 * THE PAGE PHOTOGRAPHS (issue #201). Each page's banner and About frames
 * are the experience's own "Page photograph" and "Gallery" in the CMS, and
 * the CMS answer is used as it stands: an empty Page photograph opens the
 * page on the main one. The single exception is a database the one-time
 * move (cms/lib/pagePhotos.ts) has not reached yet, which has no page
 * photographs to give — there the code-held ones are laid over the answer
 * exactly as before, so a deploy never changes a page by itself. That is
 * asked inside the cached loader, so one cache entry holds one consistent
 * answer.
 */
const readExperiences = contentReader("experiences", [TAGS.experiences, TAGS.vibes], async (draft) => {
  const docs = await findDocs("experiences", draft, { drafts: true, sort: "order", depth: 1 });
  const experiences = docs.map(toCreativeExperience);
  return (await pagePhotosMoved(await getCms())) ? experiences : experiences.map(withInFilePagePhotos);
});

/**
 * Every creative experience, in the studio's own order.
 *
 * Async and returning a copy, like every other content seam in this project,
 * so pointing it at a CMS was a change to this function body alone — which
 * is what Phase 2 did: the `experiences` collection through `cached`, under
 * the experiences and vibes tags, draft-aware in preview (SPEC §G.1).
 */
export async function getCreativeExperiences(): Promise<CreativeExperience[]> {
  const fromCms = await readExperiences();
  // The in-file list, with its own page photographs, only when the CMS could
  // not be read (null); an empty answer means "nothing published".
  // The code-held photographs get their blurred stand-ins (lib/staticBlur.ts).
  return withStaticBlurs((fromCms ?? EXPERIENCES.map(withInFilePagePhotos)).map(holdStatusInCode));
}

/*
  ==========================================================================
  STATUS FLAGS THE CODE HOLDS, WHATEVER THE CMS SAYS
  ==========================================================================

  Mandala painting is "Coming soon", like glass painting — and at the
  client's ask that is set here rather than in the CMS. The CMS entry for it
  carries no status, and when the CMS can be read its answer replaces the
  in-file list above wholesale, so the flag on the in-file entry never
  reached the site. This lays it back over the CMS answer.

  The wording is the in-file entry's own `status`, so there is one place to
  change it. Because everything reads experiences through this function, it
  reaches every surface that reads `status`: the row and preview in the
  Experiences menu, the card on /events and in the gallery, the plate on
  /private-events, the label in the enquiry select, and the activity's own
  page, where it shows the status and stops the action area offering a
  booking.

  When mandala painting opens, take its slug out of this list AND the
  `status` off its in-file entry; a status typed into the CMS will not
  lift it while the slug is here.
*/
const STATUS_HELD_IN_CODE: readonly string[] = ["mandala-painting"];

function holdStatusInCode(experience: CreativeExperience): CreativeExperience {
  if (!STATUS_HELD_IN_CODE.includes(experience.slug)) return experience;
  const status = EXPERIENCES.find((entry) => entry.slug === experience.slug)?.status;
  return status ? { ...experience, status } : experience;
}
