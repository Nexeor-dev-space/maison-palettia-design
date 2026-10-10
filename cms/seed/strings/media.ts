/**
 * ==========================================================================
 * The media import list (SPEC §F.1) — the 72 files under public/ the code
 * references today (01-content-inventory.md §9.1, minus the three favicons,
 * which stay static, and the missing pigment-on-paper.jpg, defect #1).
 * ==========================================================================
 *
 * One record per FILE: a picture printed in two places with two different
 * alts keeps the alt of its live, primary use and the other is noted. Alt
 * text is copied verbatim from the code beside each `src`; files the site
 * prints with alt="" (logos beside the brand name, textures) are marked
 * decorative. `focal` is the hand-tuned CSS `position` ("50% 45%" →
 * x 50, y 45). `provenance` follows §F.1: ai-generated for the two
 * imported files carrying C2PA/SynthID credentials, unknown for the
 * flagged 1024² activity squares and AI-shaped PNGs and for photographs
 * whose source the repository does not record, studio for the event
 * photographs and the film frames, client-supplied for the programme
 * photographs, the logos and the frames the code says the client supplied.
 */

import type { PublicPath } from "../types";

export interface MediaSeed {
  path: PublicPath;
  alt: string;
  decorative?: boolean;
  /** Focal point in percent of width and height. */
  focal?: [number, number];
  provenance: "studio" | "client-supplied" | "stock" | "ai-generated" | "unknown";
  tags: string[];
  caption?: string;
  consent?: boolean;
}

export const MEDIA: MediaSeed[] = [
  {
    // rendered with alt="" at components/ui/Wordmark.tsx:54
    path: "images/logo.png",
    alt: "",
    decorative: true,
    provenance: "client-supplied",
    tags: ["logo"],
  },
  {
    // rendered with alt="" at components/layout/Footer.tsx:337
    path: "images/scroll-logo.png",
    alt: "",
    decorative: true,
    provenance: "client-supplied",
    tags: ["logo"],
  },
  {
    // rendered with alt="" at components/layout/Footer.tsx:1015
    path: "brand/p-mark.svg",
    alt: "",
    decorative: true,
    provenance: "client-supplied",
    tags: ["logo"],
  },
  {
    // alt: components/sections/Hero.tsx:83
    // focal: components/sections/Hero.tsx:85 (desktop position)
    path: "images/image.png",
    alt: "Two women laughing behind the ceramics they have painted, one holding up a mug dotted with small blue flowers, the other a scallop-edged tray patterned with little pink blooms, with shelves of plain crockery behind them.",
    focal: [50, 50],
    provenance: "unknown",
    tags: ["hero"],
  },
  {
    // alt: components/sections/Hero.tsx:112
    path: "images/mobile-hero.png",
    alt: "Two women laughing behind the ceramics they have painted, one holding up a mug dotted with small blue flowers, the other a scallop-edged tray patterned with little pink blooms, at a wooden table with shelves of plain crockery behind them.",
    provenance: "ai-generated",
    tags: ["hero"],
  },
  {
    // alt: components/sections/BrandStory.tsx:155
    path: "images/about-sec-img.png",
    alt: "Three poured candles in a lined gift box: one in a cut-glass tumbler set with raspberries, one in a brass tin with raspberries and blueberries, and one swirled in a fluted white pot.",
    provenance: "ai-generated",
    tags: ["hero"],
  },
  {
    // alt: app/(site)/about/page.tsx:280
    path: "images/about-page-img.png",
    alt: "Two hands holding a small ceramic pot painted in blocks of soft blue, lilac, pink, yellow and green, a fine brush adding the last line.",
    provenance: "unknown",
    tags: ["hero"],
  },
  {
    // alt: lib/experiences.ts:177
    // focal: lib/experiences.ts:177
    path: "images/experiences/TOTE_BAG_PAINTING.jpg",
    alt: "A cotton tote painted with a yellow sun and moon face among blue flowers, brushes and jars of paint on the table behind it.",
    focal: [50, 45],
    provenance: "unknown",
    tags: ["experience-hero", "gallery-make"],
  },
  {
    // alt: lib/experiences.ts:220
    // focal: lib/experiences.ts:220
    path: "images/experiences/CERAMIC_PAINTING.jpg",
    alt: "A ceramic plate painted with pale blue stripes and blueberries beside a matching mug, a paint palette and three brushes on a dark table.",
    focal: [50, 50],
    provenance: "unknown",
    tags: ["experience-hero", "gallery-make"],
  },
  {
    // alt: lib/experiences.ts:261
    // focal: lib/experiences.ts:261
    path: "images/experiences/BEDAZZLING.jpg",
    alt: "A hand in a red glove holding up a balloon dog covered all over in pink rhinestones, bright grass behind it.",
    focal: [50, 45],
    provenance: "unknown",
    tags: ["experience-hero", "gallery-make"],
  },
  {
    // alt: lib/experiences.ts:294
    // focal: lib/experiences.ts:294
    path: "images/experiences/MANDALA_PAINTING.jpg",
    alt: "Hands holding a round mandala board painted in teal, orange and cream, worked outwards from the centre in petals and dots.",
    focal: [50, 50],
    provenance: "unknown",
    tags: ["experience-hero", "gallery-make"],
  },
  {
    // alt: lib/experiences.ts:337
    // focal: lib/experiences.ts:337
    path: "images/experiences/GLASS_PAINTING.jpg",
    alt: "A hand holding an arched glass panel painted with a dragonfly among red and pink flowers on green leaves, the sun throwing its colours onto the wall.",
    focal: [50, 50],
    provenance: "unknown",
    tags: ["experience-hero", "gallery-make"],
  },
  {
    // alt: lib/experiences.ts:370
    // focal: lib/experiences.ts:370
    path: "images/experiences/CANDLE_MAKING.jpg",
    alt: "Two poured candles in glass jars on a white tray, one set with pink wax flowers and one with pink hearts, sprigs of gypsophila beside them.",
    focal: [50, 50],
    provenance: "unknown",
    tags: ["experience-hero", "gallery-make"],
  },
  {
    // alt: lib/experiences.ts:403
    // also printed with a different alt at components/sections/home/SeasonalExperiences.tsx:90 (one record per file: the alt above wins)
    // focal: lib/experiences.ts:403
    path: "images/experiences/CROCHETING.jpg",
    alt: "A crocheted blanket of granny squares in forest green, cream, mustard and rust, each worked with a sun or a moon.",
    focal: [50, 50],
    provenance: "unknown",
    tags: ["experience-hero", "gallery-make"],
  },
  {
    // alt: lib/experiences.ts:146
    path: "images/experience/tote-bag-1.jpg",
    alt: "A cream canvas tote printed with pink lotus flowers and green lily pads, carried on the shoulder.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:151
    path: "images/experience/tote-bag-2.jpg",
    alt: "A hand laying loose red and yellow blooms of colour across a sheet of paper, the other hand steadying the page.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:156
    path: "images/experience/tote-bag-3.jpg",
    alt: "Someone at a studio table with a loaded paint palette in one hand, canvases propped behind them.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:195
    path: "images/experience/ceramic-1.jpg",
    alt: "Hands holding a small unglazed pot while a fine brush lays a band of blue dots around its neck.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:200
    path: "images/experience/ceramic-2.jpg",
    alt: "A jar of brushes, a palette of mixed blues and greys, and unpainted cups and bowls set out on a white table.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:205
    path: "images/experience/ceramic-3.jpg",
    alt: "A brush painting blue petals onto a speckled stoneware bowl, the pattern already running round its side.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:243
    path: "images/experience/beadazzling-1.jpg",
    alt: "A sorting tray of beads laid out by colour — pink, blue, green, yellow, orange and black.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:248
    path: "images/experience/beadazzling-2.jpg",
    alt: "Strands of beaded baubles hanging close together in pink, red, yellow and black.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:253
    path: "images/experience/beadazzling-3.jpg",
    alt: "Two people at a white table threading a line of blue and red beads, loose beads and tubes in front of them.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:277
    path: "images/experience/mandala-1.jpg",
    alt: "Someone at a wooden table drawing a mandala in fine concentric rings, a tray of watercolour pans beside them.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:282
    path: "images/experience/mandala-2.jpg",
    alt: "A mandala worked in gold line and turquoise dots across a deep brown ground, filling the frame.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:287
    path: "images/experience/mandala-3.jpg",
    alt: "A hand painting a mandala of blue, pink and red petals radiating from a small sun at its centre.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:313
    path: "images/experience/glass-painting-1.jpg",
    alt: "A backlit panel of glass painted in red, orange, blue and teal cells divided by gold outlines.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:318
    path: "images/experience/glass-painting-2.jpg",
    alt: "A hand painting red poppies and green stems onto a glass panel laid flat, jars of colour around it.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:323
    path: "images/experience/glass-painting-3.jpg",
    alt: "Brushes standing in a jar beside a paint-smeared wooden palette on a small round table, an easel behind.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:352
    path: "images/experience/candle-making-1.jpg",
    alt: "A wooden table set for pouring: filled candle glasses with their wicks held upright, empty jars and a spool of cream twine.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:357
    path: "images/experience/candle-making-2.jpg",
    alt: "Wax poured from a glass jug into a tumbler while the other hand holds the wooden wick upright.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:362
    path: "images/experience/candle-making-3.jpg",
    alt: "A hand setting a wick into one of two speckled turquoise and terracotta candle vessels on a white table.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:385
    path: "images/studio/yarn-board.jpg",
    alt: "Balls of yarn in cream, red and a variegated blue resting on a finished mustard crochet piece.",
    provenance: "studio",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:390
    // also printed with a different alt at components/sections/home/StudioInterlude.tsx:142 (one record per file: the alt above wins)
    path: "images/1-2.jpg",
    alt: "A pair of hands crocheting a cream panel with a yellow hook, a wound ball of the same yarn beside them.",
    provenance: "client-supplied",
    tags: ["experience-gallery"],
  },
  {
    // alt: lib/experiences.ts:395
    path: "images/hero-carousel/crocheting.jpg",
    alt: "Balls of pale blue and cream yarn with a crochet hook resting on a finished blanket of shell stitch.",
    provenance: "unknown",
    tags: ["experience-gallery"],
  },
  {
    // alt: app/(site)/gallery/page.tsx:260
    // focal: lib/constants.ts:497
    path: "images/experience/painting.jpg",
    alt: "A hand drawing a brush across a small canvas on an easel, working a white bloom over a soft blue ground, a loaded palette below it.",
    focal: [50, 45],
    provenance: "unknown",
    tags: ["gallery-making"],
  },
  {
    // rendered with alt="" at components/sections/home/WaysTrail.tsx:623
    path: "images/experience/community-table.jpg",
    alt: "",
    decorative: true,
    provenance: "studio",
    tags: [],
  },
  {
    // alt: lib/brand.ts:392
    // also printed with a different alt at components/sections/home/SeasonalExperiences.tsx:98 (one record per file: the alt above wins)
    path: "images/events/named-keepsake.jpg",
    alt: "A child’s hands holding two handmade keepsakes: one lettered with a name and a heart, the other filled with glitter, sequins and a small teal ring.",
    provenance: "studio",
    tags: ["gallery-keep"],
  },
  {
    // alt: lib/brand.ts:398
    // also printed with a different alt at components/sections/home/SeasonalExperiences.tsx:82 (one record per file: the alt above wins)
    path: "images/events/glitter-keepsakes.jpg",
    alt: "Four handmade keepsakes cupped in children’s hands, two lettered with names and hearts and two filled with purple glitter and heart charms.",
    provenance: "studio",
    tags: ["gallery-keep"],
  },
  {
    // alt: lib/brand.ts:404
    path: "images/events/national-day-cards.jpg",
    alt: "Two quilled cards for Eid Al Etihad reading “I love UAE”, beside a pen pot made from lolly sticks painted in the colours of the UAE flag.",
    provenance: "studio",
    tags: ["gallery-keep"],
  },
  {
    // alt: lib/privateEvents.ts:197
    // focal: lib/privateEvents.ts:210 (HEAD)
    path: "images/who-is-it-for/birthday-parties.jpg",
    alt: "Three friends in paper party hats leaning in around a chocolate birthday cake with a lit number candle, sparklers burning in their hands.",
    focal: [50, 42],
    provenance: "client-supplied",
    tags: ["programme"],
  },
  {
    // alt: lib/privateEvents.ts:226
    // focal: lib/privateEvents.ts:226
    path: "images/who-is-it-for/corporate-evebts.jpg",
    alt: "Three colleagues around a wooden table painting on paper with watercolours, one standing and leaning in over the other two.",
    focal: [50, 45],
    provenance: "client-supplied",
    tags: ["programme"],
  },
  {
    // alt: lib/privateEvents.ts:243
    // focal: lib/privateEvents.ts:243
    // identifiable children; no consent on file (01 §11.11)
    path: "images/who-is-it-for/school-programs.jpg",
    alt: "Four school-age children at a table spread with felt tips and paintings, one holding up a loaded paint palette and another a brush.",
    focal: [50, 40],
    provenance: "client-supplied",
    tags: ["programme"],
    consent: false,
  },
  {
    // alt: lib/privateEvents.ts:273
    // focal: lib/privateEvents.ts:283 (HEAD) — holds the hands, mug and plate in a landscape crop
    path: "images/who-is-it-for/malls-community.jpg",
    alt: "A woman painting a pattern onto a ceramic mug at a long table of glaze bottles and brush pots, with other people working and talking behind her.",
    focal: [50, 55],
    provenance: "client-supplied",
    tags: ["programme"],
  },
  {
    // alt: lib/privateEvents.ts:391
    // also printed with a different alt at lib/constants.ts:375 (one record per file: the alt above wins)
    // focal: lib/constants.ts:375
    path: "images/hero/making.jpg",
    alt: "A painter at her easel, brush in hand, working a canvas of coral and blush roses among deep teal leaves, a loaded palette in the foreground.",
    focal: [34, 38],
    provenance: "unknown",
    tags: ["hero"],
  },
  {
    // alt: lib/privateEvents.ts:423
    // also printed with a different alt at lib/passes.ts:81 — kept there as the Day Pass's own `imageAlt` (cms/seed/strings/passes.ts)
    path: "images/creative/painting.jpg",
    alt: "A painter at an easel, brush in hand, working into a canvas of coral and blush roses among deep teal leaves, a loaded palette in the foreground.",
    provenance: "unknown",
    tags: [],
  },
  {
    // alt: app/(site)/private-events/page.tsx:342
    path: "images/hero/tote-painting.jpg",
    alt: "Two pairs of hands at one table: one holds a red paint palette, the other paints a silver and teal design onto a pale denim tote bag.",
    provenance: "studio",
    tags: ["hero"],
  },
  {
    // alt: app/(site)/contact/page.tsx:276
    path: "images/hero/plate-painting.jpg",
    alt: "A pair of hands painting a ceramic plate at a table, a brush in one of them.",
    provenance: "studio",
    tags: ["hero"],
  },
  {
    // alt: app/(site)/gallery/page.tsx:256
    path: "images/studio/palette-brush.jpg",
    alt: "A hand painting a silver motif onto denim with a fine brush, a red palette of mixed colour beside it.",
    provenance: "studio",
    tags: ["gallery-making"],
  },
  {
    // alt: app/(site)/gallery/page.tsx:268
    path: "images/studio/marbling.jpg",
    alt: "A close view of a marbling bath: a fine needle drawn down through floating orange, teal and red inks, pulling them into feathered swirls.",
    provenance: "studio",
    tags: ["gallery-making"],
  },
  {
    // alt: app/(site)/gallery/page.tsx:272
    path: "images/studio/plate-motif.jpg",
    alt: "A hand painting a teal flower motif onto a pale ceramic plate.",
    provenance: "studio",
    tags: ["gallery-making"],
  },
  {
    // alt: app/(site)/gallery/page.tsx:276
    path: "images/studio/candle-pour.jpg",
    alt: "Wax being poured from a jug into a row of glass candle jars on a workshop table.",
    provenance: "studio",
    tags: ["gallery-making"],
  },
  {
    // alt: lib/passes.ts:97
    path: "images/workshops/watercolour-street.jpg",
    alt: "A watercolour of a cobbled hillside street: whitewashed houses under terracotta roofs, geraniums at a shuttered window, and a castle wall rising above the trees.",
    provenance: "unknown",
    tags: [],
  },
  {
    // alt: lib/passes.ts:113
    path: "images/creative/craft.jpg",
    alt: "Two hands turning a small ceramic pot while a fine brush lays a block of yellow into a design of pastel blue, lilac, mint and coral.",
    provenance: "unknown",
    tags: [],
  },
  {
    // alt: lib/constants.ts:875
    // focal: lib/constants.ts:875
    path: "images/recent/late-blooms.jpg",
    alt: "Pale blush and white lilies opening against a bare wall, petals curling back as they age.",
    focal: [50, 52],
    provenance: "unknown",
    tags: [],
  },
  {
    // alt: lib/constants.ts:532
    // focal: lib/constants.ts:532
    // caption: lib/constants.ts:535
    path: "images/editorial/late-lilies.jpg",
    alt: "Pale blush and white lilies opening against a bare wall, petals curling back as they age.",
    focal: [50, 50],
    provenance: "unknown",
    tags: [],
    caption: "Late lilies, studio wall",
  },
  {
    // alt: lib/constants.ts:538
    // focal: lib/constants.ts:538
    // caption: lib/constants.ts:541
    path: "images/workshops/watercolour-in-progress.jpg",
    alt: "A watercolour on the easel: deep red blooms breaking over washes of pale yellow and blue.",
    focal: [50, 50],
    provenance: "unknown",
    tags: [],
    caption: "Colour, still wet",
  },
  {
    // alt: lib/constants.ts:888
    path: "images/creative/colour-in-layers.jpg",
    alt: "Washes of yellow-green and violet laid over one another on damp paper, the colour still finding its edges.",
    provenance: "unknown",
    tags: [],
  },
  {
    // alt: lib/constants.ts:600
    // focal: lib/constants.ts:608 (HEAD) — the crop held high, under the caption band
    path: "images/editorial/mural-on-brick.jpg",
    alt: "A mural covering the side of a brick building: blue and violet flowers, seed heads and a fallen branch painted at architectural scale, growing around the windows.",
    focal: [30, 15],
    provenance: "unknown",
    tags: [],
  },
  {
    // alt: lib/constants.ts:633
    // focal: lib/constants.ts:633
    path: "images/editorial/wash-and-light.jpg",
    alt: "A watercolour passage of deep blue and violet washes breaking into soft yellow-green.",
    focal: [50, 50],
    provenance: "unknown",
    tags: [],
  },
  {
    // rendered with alt="" at lib/constants.ts:821
    // focal: lib/constants.ts:820
    path: "images/testimonials/orchard-in-oil.jpg",
    alt: "",
    decorative: true,
    focal: [50, 50],
    provenance: "unknown",
    tags: [],
  },
  {
    // alt: lib/recent.ts:53
    path: "images/recent/vessel-and-bloom.jpg",
    alt: "A cream ceramic vase painted with blue and ochre scrollwork, spent lilies leaning from its neck.",
    provenance: "unknown",
    tags: [],
  },
  {
    // alt: lib/recent.ts:64
    path: "images/recent/blue-study.jpg",
    alt: "A watercolour passage of deep blue and violet washes breaking into soft yellow-green.",
    provenance: "unknown",
    tags: [],
  },
  {
    // alt: lib/recent.ts:75
    path: "images/recent/petals-fallen.jpg",
    alt: "Two dropped petals resting on a dark wooden table beside the foot of a painted vase.",
    provenance: "unknown",
    tags: [],
  },
  {
    // alt: components/sections/LittleCreators.tsx:54
    path: "images/creative/tissue-art.jpg",
    alt: "Punch-needle squares in wool laid out on cloth (a bear, a panda, a cow, a cactus and a crescent moon), with yarn and needles beside them.",
    provenance: "unknown",
    tags: ["kids"],
  },
  {
    // alt: components/sections/LittleCreators.tsx:61
    path: "images/creative/coffee-painting.jpg",
    alt: "Two koi painted in coffee across a sketchbook page, the brush resting on the paper.",
    provenance: "unknown",
    tags: ["kids"],
  },
  {
    // alt: components/sections/LittleCreators.tsx:68
    path: "images/creative/wooden-painting.jpg",
    alt: "Painted wooden rounds (a sun and moon, a cactus in bloom, tulips with a bee) beside tubes of acrylic paint.",
    provenance: "unknown",
    tags: ["kids"],
  },
  {
    // alt: components/sections/home/StudioInterlude.tsx:93
    path: "images/i-1.jpg",
    alt: "Someone in a denim apron painting a small ceramic bowl in bands of orange, blue and yellow, a loaded palette and open paint tubes on the table beside them.",
    provenance: "client-supplied",
    tags: [],
  },
  {
    // rendered with alt="" at components/sections/home/CommunityMoment.tsx:112
    path: "images/middle-section-bg.jpg",
    alt: "",
    decorative: true,
    provenance: "client-supplied",
    tags: [],
  },
  {
    // alt: components/sections/home/WorkshopJourney.tsx:111
    // identifiable children; no consent on file (01 §11.11)
    path: "images/workshop-journey.jpg",
    alt: "A child's hands colouring in a printed butterfly with an orange crayon, a second pair of hands holding the page steady alongside.",
    provenance: "unknown",
    tags: [],
    consent: false,
  },
  {
    // rendered with alt="" at components/sections/StudioFilm.tsx:70
    path: "images/hero/film-poster.jpg",
    alt: "",
    decorative: true,
    provenance: "studio",
    tags: ["film"],
  },
  {
    // rendered with alt="" at components/sections/StudioFilm.tsx:68
    path: "videos/maison-film.mp4",
    alt: "",
    decorative: true,
    provenance: "studio",
    tags: ["film"],
  },
];
