import type { ProgrammeSeed } from "../types";

/**
 * The four private-event programmes, from lib/privateEvents.ts
 * PRIVATE_EVENT_AUDIENCES. `mark.color` is the ink KEY (the renderer owns
 * the hex); `tone` is the card palette from AUDIENCE_TONES in
 * app/(site)/private-events/page.tsx:59-97 (birthday → lavender field,
 * corporate → charcoal, school → sage, activations → lilac).
 * `school-programs` keeps its US spelling: it is a live URL.
 */

export const PROGRAMMES: ProgrammeSeed[] = [
  {
    name: "Birthday Parties", // lib/privateEvents.ts:177
    slug: "birthday-parties", // lib/privateEvents.ts:176
    description: "Make the celebration a little more hands-on with a creative activity everyone can enjoy — and take home.", // lib/privateEvents.ts:179
    lead: "Skip the usual party routine. Get everyone making, creating and leaving with a little something to remember the day by.", // lib/privateEvents.ts:181
    image: "images/who-is-it-for/birthday-parties.jpg", // lib/privateEvents.ts:197
    mark: {
      name: "splash", // lib/privateEvents.ts:212
      color: "lavender", // lib/privateEvents.ts:212
    },
    inPrivateEventsMenu: true,
    tone: "lavender", // lib/privateEvents.ts:212
    order: 1,
  },
  {
    name: "Corporate Events", // lib/privateEvents.ts:217
    slug: "corporate-events", // lib/privateEvents.ts:216
    description: "Swap the usual team activity for something a little more creative. Make, chat, unwind and create something together.", // lib/privateEvents.ts:219
    lead: "Hands-on creative experiences designed for team building, company gatherings and time spent connecting beyond the usual workday.", // lib/privateEvents.ts:221
    image: "images/who-is-it-for/corporate-evebts.jpg", // lib/privateEvents.ts:226
    mark: {
      name: "starburst", // lib/privateEvents.ts:232
      color: "lilac", // lib/privateEvents.ts:232
    },
    inPrivateEventsMenu: true,
    tone: "charcoal",
    order: 2,
  },
  {
    name: "School Programmes", // lib/privateEvents.ts:237
    slug: "school-programs", // lib/privateEvents.ts:236
    description: "Bring creativity into the classroom with hands-on activities designed to get students making, exploring and having fun.", // lib/privateEvents.ts:239
    lead: "Hands-on creative experiences that get students making, exploring new skills and learning through creativity.", // lib/privateEvents.ts:241
    image: "images/who-is-it-for/school-programs.jpg", // lib/privateEvents.ts:243
    mark: {
      name: "starleaf", // lib/privateEvents.ts:250
      color: "terracotta", // lib/privateEvents.ts:250
    },
    inPrivateEventsMenu: true,
    tone: "sage",
    order: 3,
  },
  {
    name: "Mall & Community Activations", // lib/privateEvents.ts:255
    slug: "mall-and-community-activations", // lib/privateEvents.ts:254
    description: "Bring Maison Palettia to your space with creative experiences tailored to your audience, theme and event.", // lib/privateEvents.ts:257
    lead: "Bring creativity into your space with hands-on experiences tailored to your theme, audience and occasion — made to draw people in and keep them creating.", // lib/privateEvents.ts:259
    image: "images/who-is-it-for/malls-community.jpg", // lib/privateEvents.ts:273
    mark: {
      name: "coral", // lib/privateEvents.ts:285
      color: "cream", // lib/privateEvents.ts:285
    },
    inPrivateEventsMenu: true,
    tone: "lilac", // lib/privateEvents.ts:270
    order: 4,
  },
];

/** lib/privateEvents.ts PRIVATE_EVENT_STEPS — Brand wording → "Private event — how it works". */
export const PRIVATE_EVENT_STEPS: Array<{ title: string; detail: string }> = [
  {
    title: "Tell Us About Your Event", // lib/privateEvents.ts:328
    detail: "Share your occasion, group size and preferred date.", // lib/privateEvents.ts:329
  },
  {
    title: "Choose Your Experience", // lib/privateEvents.ts:333
    detail: "We will help shape the right creative activity for your group.", // lib/privateEvents.ts:334
  },
  {
    title: "Create Together", // lib/privateEvents.ts:338
    detail: "Everyone makes something, and everyone leaves holding it.", // lib/privateEvents.ts:339
  },
];
