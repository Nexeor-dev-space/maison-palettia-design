import type { ExperienceSeed } from "../types";

/**
 * The seven activities, copied by value from lib/experiences.ts (git
 * 2e1651b), in the array's order (the client's own: walk-in first).
 * `image` / `gallery` are paths under public/ — the seed resolves them to
 * the media documents imported by cms/seed/media.ts. Age guidance is joined
 * from lib/policies.ts by activity name (SPEC §F.3) in AGE_GUIDANCE below.
 */

export const EXPERIENCES: ExperienceSeed[] = [
  {
    name: "Tote Bag Painting", // lib/experiences.ts:139
    slug: "tote-bag-painting", // lib/experiences.ts:138
    kind: "diy", // lib/experiences.ts:175
    description: "A plain tote, waiting for your personality.", // lib/experiences.ts:174
    about: [
      "Your tote called. It wants a personality.", // lib/experiences.ts:141
      "Give a plain cotton bag a little colour, a little chaos and a lot of you. Paint it, personalise it and walk out with something no one else has.", // lib/experiences.ts:142
    ],
    image: "images/experiences/TOTE_BAG_PAINTING.jpg", // lib/experiences.ts:177
    gallery: [
      "images/experience/tote-bag-1.jpg", // lib/experiences.ts:146
      "images/experience/tote-bag-2.jpg", // lib/experiences.ts:151
      "images/experience/tote-bag-3.jpg", // lib/experiences.ts:156
    ],
    privateEventEligible: true,
    order: 1,
  },
  {
    name: "Ceramic Painting", // lib/experiences.ts:185
    slug: "ceramic-painting", // lib/experiences.ts:184
    kind: "diy", // lib/experiences.ts:218
    description: "A little piece of you, in ceramic form.", // lib/experiences.ts:217
    about: [
      "Ceramic is better with a little colour.", // lib/experiences.ts:190
      "Start with a blank ceramic and see what happens. Play with shapes, patterns and colour until an everyday piece becomes something you’ll want to use again and again.", // lib/experiences.ts:191
    ],
    image: "images/experiences/CERAMIC_PAINTING.jpg", // lib/experiences.ts:220
    gallery: [
      "images/experience/ceramic-1.jpg", // lib/experiences.ts:195
      "images/experience/ceramic-2.jpg", // lib/experiences.ts:200
      "images/experience/ceramic-3.jpg", // lib/experiences.ts:205
    ],
    privateEventEligible: true,
    order: 2,
  },
  {
    name: "Bedazzling", // lib/experiences.ts:228
    slug: "bedazzling", // lib/experiences.ts:227
    kind: "diy", // lib/experiences.ts:259
    description: "When in doubt, add a little sparkle.", // lib/experiences.ts:258
    about: [
      "How much sparkle is too much?", // lib/experiences.ts:230
      "Choose what you want to bedazzle, pick your gems and start placing them one by one. Build a pattern, follow the light or cover the whole thing in sparkle.", // lib/experiences.ts:231
    ],
    image: "images/experiences/BEDAZZLING.jpg", // lib/experiences.ts:261
    gallery: [
      "images/experience/beadazzling-1.jpg", // lib/experiences.ts:243
      "images/experience/beadazzling-2.jpg", // lib/experiences.ts:248
      "images/experience/beadazzling-3.jpg", // lib/experiences.ts:253
    ],
    privateEventEligible: true,
    order: 3,
  },
  {
    name: "Mandala Painting", // lib/experiences.ts:269
    slug: "mandala-painting", // lib/experiences.ts:268
    kind: "diy", // lib/experiences.ts:292
    description: "Little dots, endless patterns.", // lib/experiences.ts:270
    about: [
      "Start in the centre. Let the rest unfold.", // lib/experiences.ts:272
      "Build your mandala one dot, petal and ring at a time. Watch the pattern grow as colours and shapes repeat, shift and come together.", // lib/experiences.ts:273
    ],
    image: "images/experiences/MANDALA_PAINTING.jpg", // lib/experiences.ts:294
    gallery: [
      "images/experience/mandala-1.jpg", // lib/experiences.ts:277
      "images/experience/mandala-2.jpg", // lib/experiences.ts:282
      "images/experience/mandala-3.jpg", // lib/experiences.ts:287
    ],
    privateEventEligible: true,
    order: 4,
  },
  {
    name: "Glass Painting", // lib/experiences.ts:305
    slug: "glass-painting", // lib/experiences.ts:304
    kind: "diy", // lib/experiences.ts:333
    description: "A little colour changes the view.", // lib/experiences.ts:306
    about: [
      "Give the light something to play with.", // lib/experiences.ts:308
      "Paint your design, layer in your colours and let the light become part of it. What starts on the table takes on a whole new look by the window.", // lib/experiences.ts:309
    ],
    image: "images/experiences/GLASS_PAINTING.jpg", // lib/experiences.ts:337
    gallery: [
      "images/experience/glass-painting-1.jpg", // lib/experiences.ts:313
      "images/experience/glass-painting-2.jpg", // lib/experiences.ts:318
      "images/experience/glass-painting-3.jpg", // lib/experiences.ts:323
    ],
    status: "Coming soon", // lib/experiences.ts:335
    privateEventEligible: true,
    order: 5,
  },
  {
    name: "Candle Making", // lib/experiences.ts:345
    slug: "candle-making", // lib/experiences.ts:344
    kind: "scheduled", // lib/experiences.ts:368
    description: "Wax, wick and colour, poured and left to set.", // lib/experiences.ts:367
    about: [
      "Wax, a wick and the colour you choose, poured and left to set. The shade is decided before anything is melted, so the jar is one you specified rather than one you picked off a shelf.", // lib/experiences.ts:347
      "Set with dried flowers, or with hearts pressed into the surface, or left perfectly plain. It cools into the shape of the vessel you poured it in.", // lib/experiences.ts:348
    ],
    image: "images/experiences/CANDLE_MAKING.jpg", // lib/experiences.ts:370
    gallery: [
      "images/experience/candle-making-1.jpg", // lib/experiences.ts:352
      "images/experience/candle-making-2.jpg", // lib/experiences.ts:357
      "images/experience/candle-making-3.jpg", // lib/experiences.ts:362
    ],
    privateEventEligible: true,
    order: 6,
  },
  {
    name: "Crocheting", // lib/experiences.ts:378
    slug: "crocheting", // lib/experiences.ts:377
    kind: "scheduled", // lib/experiences.ts:401
    description: "A hook, a ball of yarn and one stitch to start from.", // lib/experiences.ts:400
    about: [
      "A hook, a ball of yarn and one stitch to start from. Everything after that is the same movement repeated, which is what makes a first row possible at all.", // lib/experiences.ts:380
      "Granny squares worked a round at a time, in whatever colours come out of the basket. A blanket is only ever one of these joined to the next.", // lib/experiences.ts:381
    ],
    image: "images/experiences/CROCHETING.jpg", // lib/experiences.ts:403
    gallery: [
      "images/studio/yarn-board.jpg", // lib/experiences.ts:385
      "images/1-2.jpg", // lib/experiences.ts:390
      "images/hero-carousel/crocheting.jpg", // lib/experiences.ts:395
    ],
    privateEventEligible: true,
    order: 7,
  },
];

/** Experience slug → its line in the policies' age tables (DIY_AGE_GUIDANCE / WORKSHOP_AGE_GUIDANCE). */
export const AGE_GUIDANCE: Record<string, string> = {
  "tote-bag-painting": "Ages 5–10 for stencils and easy painting. Age 11 and over for creative designs.", // lib/policies.ts:135 (Tote bag painting)
  "ceramic-painting": "5 years and over. Ages 5–10 under the close supervision of a parent.", // lib/policies.ts:133 (Ceramic painting)
  "bedazzling": "Ages 5–10 for Mini Bedazzling. Age 11 and over for Creative Bedazzling.", // lib/policies.ts:134 (Bedazzling)
  "mandala-painting": "Age 12 and over.", // lib/policies.ts:137 (Mandala painting)
  "glass-painting": "Age 12 and over.", // lib/policies.ts:136 (Glass painting)
  "candle-making": "Age 14 and over.", // lib/policies.ts:148 (Candle making)
  "crocheting": "Age 14 and over.", // lib/policies.ts:149 (Crocheting)
};
