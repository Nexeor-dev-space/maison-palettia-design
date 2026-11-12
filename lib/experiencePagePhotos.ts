import type { ImageAsset } from "@/types";

/**
 * ==========================================================================
 * The experience pages' photographs as the code held them
 * ==========================================================================
 *
 * Until Nov 2026 each experience page's banner and About frames were set
 * here and laid over whatever the CMS answered, so a photograph changed in
 * the admin never reached the page (issue #201). They are the experience's
 * own "Page photograph" and "Gallery" fields now.
 *
 * This file is what is left of the old arrangement, and has two readers:
 *
 *   · cms/lib/pagePhotos.ts — the one-time move that uploads these files to
 *     the media library and sets them on the experiences;
 *   · lib/experiences.ts — which keeps laying them over the CMS answer until
 *     that move has stamped the database, and uses them when the CMS cannot
 *     be read at all. So a deploy looks the same before and after the move.
 *
 * Import-free (types only) on purpose: the site and a `payload run` script
 * both load it. Once every database has been moved, the overlay in
 * lib/experiences.ts and the move can be deleted, and this stays only as the
 * no-database fallback.
 *
 * `src` is a path under public/. PROVENANCE is noted per experience below
 * and recorded on each library row by STOCK_PHOTOS.
 */

export type PagePhoto = ImageAsset & { position?: string };

export interface PagePhotos {
  /** The banner at the top of the experience's own page. */
  pageImage?: PagePhoto;
  /** The About frames. Replaces the CMS gallery whole. */
  gallery?: ImageAsset[];
}

const BEDAZZLING_PHOTOS = "/images/experiences/bedazzling";

export const PAGE_PHOTOS: Record<string, PagePhotos> = {
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
PAGE_PHOTOS["candle-making"] = {
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
PAGE_PHOTOS["ceramic-painting"] = {
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
PAGE_PHOTOS["crocheting"] = {
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
PAGE_PHOTOS["glass-painting"] = {
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
PAGE_PHOTOS["mandala-painting"] = {
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
PAGE_PHOTOS["tote-bag-painting"] = {
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
export const GALLERY_SLOTS: Record<string, Record<number, ImageAsset>> = {
  "glass-painting": {
    2: {
      src: `${GLASS_PHOTOS}/glass-painting-bottle.jpg`,
      alt: "Hands painting white clouds onto a glass bottle with a teal sea already painted around its base.",
    },
  },
};
/**
 * The files above that are stock images (read from each supplied file's own
 * metadata; see the notes beside each experience). The move records these as
 * "Stock" in the library and every other one as "Client-supplied".
 */
export const STOCK_PHOTOS: ReadonlySet<string> = new Set([
  `${CANDLE_PHOTOS}/candle-making-hero.jpg`,
  `${CANDLE_PHOTOS}/candle-making-wicks.jpg`,
  `${CANDLE_PHOTOS}/candle-making-jars.jpg`,
  `${CERAMIC_PHOTOS}/ceramic-painting-cherries.jpg`,
  `${CERAMIC_PHOTOS}/ceramic-painting-plates.jpg`,
  `${CROCHET_PHOTOS}/crocheting-table.jpg`,
  `${GLASS_PHOTOS}/glass-painting-bottle.jpg`,
]);

/**
 * The About frames a page showed, given the CMS's own list: the code-held
 * list where there is one, otherwise the CMS list with any single code-held
 * slots laid over it. Generic so the site applies it to images and the move
 * applies it to media ids — one rule, two callers.
 *
 * A slot past the end of a shorter list is still set, so a gallery with two
 * photographs still gets the code-held third.
 */
export function pageGallery<T>(stored: readonly T[], whole: readonly T[] | undefined, slots: Readonly<Record<number, T>> | undefined): T[] {
  if (whole) return [...whole];
  if (!slots) return [...stored];
  const gallery: Array<T | undefined> = [...stored];
  for (const [index, frame] of Object.entries(slots)) gallery[Number(index)] = frame;
  return gallery.filter((frame): frame is T => frame !== undefined);
}

/** An experience with the code-held page photographs laid over its own, as the site showed it before the move. */
export function withInFilePagePhotos<E extends { slug: string; pageImage?: PagePhoto; gallery?: readonly ImageAsset[] }>(experience: E): E {
  const photos = PAGE_PHOTOS[experience.slug];
  const slots = GALLERY_SLOTS[experience.slug];
  if (!photos && !slots) return experience;
  const gallery = pageGallery(experience.gallery ?? [], photos?.gallery, slots);
  return {
    ...experience,
    ...(photos?.pageImage ? { pageImage: photos.pageImage } : {}),
    ...(gallery.length ? { gallery } : {}),
  };
}
