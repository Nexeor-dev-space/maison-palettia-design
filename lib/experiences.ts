import { TAGS } from "@/lib/cms/cache";
import { toCreativeExperience } from "@/lib/cms/mappers";
import { contentReader, findDocs } from "@/lib/cms/query";
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
   * Unset, the page opens on `image`. See PAGE_PHOTOS_IN_CODE below.
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
    // gallery: held in code below (PAGE_PHOTOS_IN_CODE), which replaces any list here.
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
    // gallery: held in code below (PAGE_PHOTOS_IN_CODE), which replaces any list here.
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
    // gallery: held in code below (PAGE_PHOTOS_IN_CODE), which replaces any list here.
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
    // gallery: held in code below (PAGE_PHOTOS_IN_CODE), which replaces any list here.
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
    // gallery: held in code below (PAGE_PHOTOS_IN_CODE), which replaces any list here.
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
    // gallery: held in code below (PAGE_PHOTOS_IN_CODE), which replaces any list here.
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
 * populates the photograph, the gallery and the vibe tags.
 */
const readExperiences = contentReader("experiences", [TAGS.experiences, TAGS.vibes], async (draft) => {
  const docs = await findDocs("experiences", draft, { drafts: true, sort: "order", depth: 1 });
  return docs.map(toCreativeExperience);
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
  // The in-file list only when the CMS could not be read (null); an empty
  // answer means "nothing published".
  // The code-held photographs get their blurred stand-ins (lib/staticBlur.ts).
  return withStaticBlurs((fromCms ?? EXPERIENCES).map(holdStatusInCode).map(holdPagePhotosInCode));
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

/*
  ==========================================================================
  AN ACTIVITY PAGE'S PHOTOGRAPHS, SET HERE RATHER THAN IN THE CMS
  ==========================================================================

  At the client's ask (Oct 2026) the Bedazzling page opens on a new picture —
  a hand setting gems on a peacock design with a drill pen — and its About
  section shows three new frames. They are laid over whatever the CMS
  answers, like the status flags above, so the change ships with the code
  and does not depend on an upload in the admin.

  ONLY THE PAGE CHANGES. The hero goes in `pageImage`, not `image`, so the
  activity's card in the menu, on the homepage and on /events keeps the
  square photograph it has; `gallery` is read by the activity's page alone.

  To hand these back to the CMS, delete the entry here and set the
  photographs on the experience in the admin.
*/
const BEDAZZLING_PHOTOS = "/images/experiences/bedazzling";

const PAGE_PHOTOS_IN_CODE: Record<string, Pick<CreativeExperience, "pageImage" | "gallery">> = {
  bedazzling: {
    pageImage: {
      src: `${BEDAZZLING_PHOTOS}/bedazzling-hero.png`,
      alt: "A hand pressing small gems onto a peacock design with a pink drill pen, rows of blue, teal and pearl-white stones already set.",
      position: "50% 45%",
    },
    gallery: [
      {
        src: `${BEDAZZLING_PHOTOS}/bedazzling-espresso-martini.jpg`,
        alt: "A hand holding up a pink canvas covered in gems that spell out Espresso Martini under a sparkling cocktail glass.",
      },
      {
        src: `${BEDAZZLING_PHOTOS}/bedazzling-can.jpg`,
        alt: "Hands setting red and silver gems onto a drinks can with a white pen, trays and tubs of loose stones on the wooden table.",
      },
      {
        src: `${BEDAZZLING_PHOTOS}/bedazzling-cherries.jpg`,
        alt: "A small white canvas on a wooden easel, bedazzled with two red gem cherries hanging from a pink pearl bow.",
      },
    ],
  },
};

/*
  CANDLE MAKING (Oct 2026): the page's banner — dried flowers being pressed
  into a poured candle — and three new frames for its About card.
  PROVENANCE: three of the four are Shutterstock images (Yavdat, Di Studio and
  New Africa, read from each supplied file's own metadata) and may only stay
  with a licence; the fourth, the table of coloured candles, carries no source
  at all. None is the studio's own photograph or its guests.
*/
const CANDLE_PHOTOS = "/images/experiences/candle-making";
PAGE_PHOTOS_IN_CODE["candle-making"] = {
  pageImage: {
    src: `${CANDLE_PHOTOS}/candle-making-hero.jpg`,
    alt: "A hand holding a poured candle in a glass with a pink label, dried pink and purple flowers set in the wax, black wick trimmers at its centre.",
    position: "55% 55%",
  },
  gallery: [
    {
      src: `${CANDLE_PHOTOS}/candle-making-table.jpg`,
      alt: "A long wooden table laid with lace doilies, glass jars and paper cups, and bowls of bubble, rose and flower candles in bright colours.",
    },
    {
      src: `${CANDLE_PHOTOS}/candle-making-wicks.jpg`,
      alt: "Hands trimming the wick of a cream-and-lilac bubble candle with scissors, a blue bubble candle, a pink shell and a pink arch candle beside it.",
    },
    {
      src: `${CANDLE_PHOTOS}/candle-making-jars.jpg`,
      alt: "Hands holding a freshly poured jar candle with its wick held straight by two sticks, sprinkling dried lavender from a small dish.",
    },
  ],
};

/*
  CERAMIC PAINTING (Oct 2026): the page's banner — hands painting colour
  blocks onto a small pot — and three new frames for its About card. The
  banner is a PORTRAIT photograph in a landscape frame, so it is aimed at the
  pot (`position`). PROVENANCE: two of the About frames are Shutterstock
  images (oatawa and Roman Zaiets, read from each supplied file's metadata)
  and may only stay with a licence; the banner and the painted-cup frame
  carry no source at all. None is the studio's own photograph or its guests.
*/
const CERAMIC_PHOTOS = "/images/experiences/ceramic-painting";
PAGE_PHOTOS_IN_CODE["ceramic-painting"] = {
  pageImage: {
    src: `${CERAMIC_PHOTOS}/ceramic-painting-hero.jpg`,
    alt: "Hands painting soft blocks of pink, peach, blue and teal onto a small white pot with a fine brush, pots of paint blurred behind.",
    position: "50% 26%",
  },
  gallery: [
    {
      src: `${CERAMIC_PHOTOS}/ceramic-painting-cups.jpg`,
      alt: "A small cup painted in loose strokes of pale blue, yellow and pink, other painted cups and plain white ware around it.",
    },
    {
      src: `${CERAMIC_PHOTOS}/ceramic-painting-cherries.jpg`,
      alt: "Hands painting little pink cherries with green stems onto a plain ceramic cup, a palette of paints on the table beside it.",
    },
    {
      src: `${CERAMIC_PHOTOS}/ceramic-painting-plates.jpg`,
      alt: "Two people bent over their pieces at a long table, each painting a scalloped ceramic dish in soft green with a fine brush.",
    },
  ],
};

/*
  CROCHETING (Oct 2026): the page's banner — hands working a small white
  round on a gold hook — and three new frames for its About card. The banner
  is a PORTRAIT photograph in a landscape frame, so it is aimed at the hands
  (`position`). PROVENANCE: the table frame is a Shutterstock image (Alfonso
  Soler, read from the supplied file's metadata) and may only stay with a
  licence; the other three carry no source at all. None is the studio's own
  photograph or its guests.
*/
const CROCHET_PHOTOS = "/images/experiences/crocheting";
PAGE_PHOTOS_IN_CODE["crocheting"] = {
  pageImage: {
    src: `${CROCHET_PHOTOS}/crocheting-hero.jpg`,
    alt: "Hands working a small round of white cotton on a gold crochet hook, the first rounds already open and lacy.",
    position: "50% 32%",
  },
  gallery: [
    {
      src: `${CROCHET_PHOTOS}/crocheting-granny-square.jpg`,
      alt: "Hands in a speckled knit sweater starting a pale pink round on a hook, finished granny squares in mustard, green and rust laid out behind.",
    },
    {
      src: `${CROCHET_PHOTOS}/crocheting-blanket.jpg`,
      alt: "A granny-square blanket in red, olive green, cream and white, edged in dark teal, with a ball of the teal yarn resting on it.",
    },
    {
      src: `${CROCHET_PHOTOS}/crocheting-table.jpg`,
      alt: "Two people at a wooden table, one crocheting from a ball of blue yarn while the other points to her work, balls of coloured yarn around them.",
    },
  ],
};

/*
  GLASS PAINTING (Oct 2026): a new banner, and ONE of the About card's three
  frames replaced — the third — so the first two stay whatever the CMS gives.
  That is why it is a slot swap rather than a whole gallery.
  PROVENANCE: the bottle frame is a Shutterstock image (Sumala Chidchoi, read
  from the supplied file's metadata) and may only stay with a licence; the
  banner carries no source at all. Neither is the studio's own photograph.
*/
const GLASS_PHOTOS = "/images/experiences/glass-painting";
PAGE_PHOTOS_IN_CODE["glass-painting"] = {
  pageImage: {
    src: `${GLASS_PHOTOS}/glass-painting-hero.jpg`,
    alt: "A fine brush flooding amber paint into a rose outlined in black on textured glass, the leaves around it already filled in green.",
    position: "50% 55%",
  },
};

/*
  MANDALA PAINTING (Oct 2026): the page's banner — a finished dot mandala in
  teal, lilac and cream among dried flowers — and three new frames for its
  About card. The banner is a PORTRAIT photograph in a landscape frame, so it
  is aimed at the mandala (`position`). PROVENANCE: none of the four carries a
  source in its metadata, and none is the studio's own work. The banner has a
  printed page of a Harry Potter novel in it, legible at banner size.
*/
const MANDALA_PHOTOS = "/images/experiences/mandala-painting";
PAGE_PHOTOS_IN_CODE["mandala-painting"] = {
  pageImage: {
    src: `${MANDALA_PHOTOS}/mandala-painting-hero.jpg`,
    alt: "A dot mandala painted in teal, lilac and cream on a dark round board, laid among daisies, dried petals and an old book page.",
    position: "50% 74%",
  },
  gallery: [
    {
      src: `${MANDALA_PHOTOS}/mandala-painting-teal.jpg`,
      alt: "Close on a teal mandala outlined in gold, rings of tiny gold dots and dark teardrop petals around a blue centre.",
    },
    {
      src: `${MANDALA_PHOTOS}/mandala-painting-red.jpg`,
      alt: "Rings of raised yellow dots, each with a blue centre, spiralling out across a deep red painted board.",
    },
    {
      src: `${MANDALA_PHOTOS}/mandala-painting-candles.jpg`,
      alt: "Two dot mandalas in gold and amber on black boards, set among orange pillar candles, a slice of amethyst and a fern.",
    },
  ],
};

/*
  TOTE BAG PAINTING (Oct 2026): the page's banner — a brush finishing a row
  of blue jellyfish on a canvas tote — and three new frames for its About
  card. PROVENANCE: none of the four carries a source in its metadata, and
  none is known to be the studio's own session.
*/
const TOTE_PHOTOS = "/images/experiences/tote-bag-painting";
PAGE_PHOTOS_IN_CODE["tote-bag-painting"] = {
  pageImage: {
    src: `${TOTE_PHOTOS}/tote-bag-painting-hero.jpg`,
    alt: "A hand painting blue jellyfish with long trailing tentacles onto a canvas tote, pots of paint and paper cups on the table behind.",
    position: "45% 50%",
  },
  gallery: [
    {
      src: `${TOTE_PHOTOS}/tote-bag-painting-leaves.jpg`,
      alt: "A canvas tote painted with a sprig of green leaves over soft pink and teal washes, a palette of greens and a water glass beside it.",
    },
    {
      src: `${TOTE_PHOTOS}/tote-bag-painting-koi.jpg`,
      alt: "Seen from above, a hand outlining two koi fish and small stars in black on a canvas tote, palettes and a mug on the table.",
    },
    {
      src: `${TOTE_PHOTOS}/tote-bag-painting-table.jpg`,
      alt: "A row of people at a long wooden table painting small flowers onto canvas totes, bottles of fabric paint lined up on a shelf.",
    },
  ],
};

/** Single About frames replaced in code, by slug and position (0-based). */
const GALLERY_SLOTS_IN_CODE: Record<string, Record<number, ImageAsset>> = {
  "glass-painting": {
    2: {
      src: `${GLASS_PHOTOS}/glass-painting-bottle.jpg`,
      alt: "Hands painting white clouds onto a glass bottle with a teal sea already painted around its base.",
    },
  },
};

function holdPagePhotosInCode(experience: CreativeExperience): CreativeExperience {
  const photos = PAGE_PHOTOS_IN_CODE[experience.slug];
  const held = photos ? { ...experience, ...photos } : experience;
  const slots = GALLERY_SLOTS_IN_CODE[experience.slug];
  if (!slots) return held;
  // Sets the slot even past the end of a shorter list, so a gallery seeded
  // with two photos still shows the code-held third.
  const gallery = [...(held.gallery ?? [])];
  for (const [i, photo] of Object.entries(slots)) gallery[Number(i)] = photo;
  return { ...held, gallery: gallery.filter(Boolean) };
}
