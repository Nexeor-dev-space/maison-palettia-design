import {
  BRAND_STORY,
  CLOSING,
  COLLABORATIONS,
  COMMUNITY,
  EXPERIENCE_STATEMENT,
  LITTLE_CREATORS,
  MISSION,
  OPENING_STATEMENT,
  OUR_APPROACH,
  SEASONAL_INTRO,
  SEASONAL_MOMENTS,
  TAGLINE,
  VISION,
  WHAT_SETS_US_APART,
  WORKSHOP_JOURNEY,
  type Collaboration,
  type JourneyStep,
  type SeasonalMoment,
} from "@/lib/brand";
import { imageOf } from "@/lib/cms/mappers";
import { getGlobal } from "@/lib/cms/query";
import type { ImageAsset } from "@/types";

/**
 * ==========================================================================
 * lib/brand.ts, from the CMS — the `brand-copy` global ("Brand wording")
 * ==========================================================================
 *
 * The sentences the brand deck supplied and the site prints in more than
 * one place: the tagline, the opening statement, mission and vision, the
 * five-step journey, the closing invitation. Editing one in the admin
 * changes every page that prints it, which is the whole reason they are one
 * global rather than copies in each page's blocks (inventory §3.3, §7).
 *
 * One getter, {@link getBrandCopy}, returns all of it in the shapes
 * lib/brand.ts exports (camelCased: `TAGLINE` → `tagline`, `WORKSHOP_JOURNEY`
 * → `journey`), cached under `global:brand-copy`, draft-aware. A block in
 * "use Brand wording" mode (`useBrandCopy`, `useTagline`, `useFindUsLine`,
 * SPEC §E) reads its text from here.
 *
 * SERVER ONLY — lib/brand.ts is imported by a client component
 * (<SeasonalExperiences>) and must not reach the Local API, so the getter
 * lives in this companion module.
 *
 * FALLBACKS. Strings: the global was created with the deck's wording as its
 * defaults, so a value is always there once the CMS can be read; when it
 * cannot, the constants in lib/brand.ts (and, for the six lines that never
 * had a constant, {@link LINE_DEFAULTS}) answer. Lists: the in-file list
 * only when the global cannot be read; the seed (2B) has filled them, so an
 * empty list in the CMS is the studio's choice and is kept.
 */

/** A seasonal example, with the photograph the CMS can now attach to it. */
export type SeasonalMomentWithImage = SeasonalMoment & { image?: ImageAsset };

export interface BrandCopyContent {
  tagline: string;
  brandStory: string[];
  openingStatement: {
    heading: string;
    body: string;
    closer: string;
    panel: { heading: string; body: string; signOff: string };
  };
  mission: string;
  vision: string;
  /** The two card labels on /about's Purpose section. */
  purposeLabels: { mission: string; vision: string };
  community: { heading: string; body: string; closer: string };
  /** `WORKSHOP_JOURNEY`. The first two are quoted by /events' doors — keep them walk-in and scheduled. */
  journey: JourneyStep[];
  whatSetsUsApart: Collaboration[];
  closing: { heading: string; body: string };
  /** The "Find us" heading and line shared by the homepage, /locations and the event pages. */
  findUsHeading: string;
  findUsLine: string;
  makeItYourWay: string;
  privateEventInvite: string;
  programmesNote: string;
  /** "Everything you need is waiting for you…" — see the policy-audit note in booking-settings. */
  everythingProvided: string;
  seasonalIntro: string;
  seasonalMoments: SeasonalMomentWithImage[];
  littleCreators: { slug: string; name: string; image?: ImageAsset }[];
  collaborations: Collaboration[];
  experienceStatement: string;
  ourApproach: string[];
}

/**
 * The six lines the global carries that lib/brand.ts never did — they were
 * literals in components. Their wording is the global's own defaults
 * (cms/globals/BrandCopy.ts), repeated here only for the no-database case.
 */
const LINE_DEFAULTS = {
  purposeLabels: { mission: "Our Mission", vision: "Our Vision" },
  findUsHeading: "Your Next Creative Stop.",
  findUsLine: "Find Maison Palettia in the places you already love to visit — and come make something while you’re there.",
  makeItYourWay: "Make It Your Way.",
  privateEventInvite:
    "Have something in mind? Tell us when, who’s coming and what you’d like to make. We’ll help turn the idea into an experience made for your group.",
  programmesNote: "Don’t see yours? That’s probably a conversation worth having.",
  everythingProvided: "Everything you need is waiting for you. Just bring yourself, pick a project and start creating.",
} as const;

/** "Valentine’s Day" → "valentines-day": a stable key for rows the CMS gives no slug. */
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Everything in Brand wording, in lib/brand.ts's shapes. */
export async function getBrandCopy(): Promise<BrandCopyContent> {
  const copy = await getGlobal("brand-copy", 1);
  const opening = copy?.openingStatement;

  const story = (copy?.brandStory ?? []).map((row) => row.paragraph).filter(Boolean);
  const journey = (copy?.journey ?? []).map((row) => ({
    slug: row.slug || slugify(row.name),
    name: row.name,
    description: row.description,
  }));
  const apart = (copy?.whatSetsUsApart ?? []).map((row) => ({
    slug: row.slug || slugify(row.name),
    name: row.name,
    description: row.description,
  }));
  const moments = (copy?.seasonalMoments ?? []).map((row): SeasonalMomentWithImage => {
    const image = imageOf(row.image);
    return { slug: slugify(row.occasion), occasion: row.occasion, experience: row.experience ?? "", ...(image ? { image } : {}) };
  });
  const creators = (copy?.littleCreators ?? []).map((row) => {
    const image = imageOf(row.image);
    return { slug: slugify(row.name), name: row.name, ...(image ? { image } : {}) };
  });
  const collaborations = (copy?.collaborations ?? []).map((row) => ({
    slug: slugify(row.name),
    name: row.name,
    description: row.description ?? "",
  }));
  const approach = (copy?.ourApproach ?? []).map((row) => row.line).filter(Boolean);

  // Every `copy ? … : <in-file>` and `|| <constant>` below answers only when
  // Brand wording could not be read; a list the studio emptied stays empty.
  return {
    tagline: copy?.tagline || TAGLINE,
    brandStory: copy ? story : [...BRAND_STORY],
    openingStatement: {
      heading: opening?.heading || OPENING_STATEMENT.heading,
      body: opening?.body || OPENING_STATEMENT.body,
      closer: opening?.closer || OPENING_STATEMENT.closer,
      panel: {
        heading: opening?.panel?.heading || OPENING_STATEMENT.panel.heading,
        body: opening?.panel?.body || OPENING_STATEMENT.panel.body,
        signOff: opening?.panel?.signOff || OPENING_STATEMENT.panel.signOff,
      },
    },
    mission: copy?.mission || MISSION,
    vision: copy?.vision || VISION,
    purposeLabels: {
      mission: copy?.purposeLabels?.mission || LINE_DEFAULTS.purposeLabels.mission,
      vision: copy?.purposeLabels?.vision || LINE_DEFAULTS.purposeLabels.vision,
    },
    community: {
      heading: copy?.community?.heading || COMMUNITY.heading,
      body: copy?.community?.body || COMMUNITY.body,
      closer: copy?.community?.closer || COMMUNITY.closer,
    },
    journey: copy ? journey : WORKSHOP_JOURNEY.map((step) => ({ ...step })),
    whatSetsUsApart: copy ? apart : WHAT_SETS_US_APART.map((item) => ({ ...item })),
    closing: {
      heading: copy?.closing?.heading || CLOSING.heading,
      body: copy?.closing?.body || CLOSING.body,
    },
    findUsHeading: copy?.findUsHeading || LINE_DEFAULTS.findUsHeading,
    findUsLine: copy?.findUsLine || LINE_DEFAULTS.findUsLine,
    makeItYourWay: copy?.makeItYourWay || LINE_DEFAULTS.makeItYourWay,
    privateEventInvite: copy?.privateEventInvite || LINE_DEFAULTS.privateEventInvite,
    programmesNote: copy?.programmesNote || LINE_DEFAULTS.programmesNote,
    everythingProvided: copy?.everythingProvided || LINE_DEFAULTS.everythingProvided,
    seasonalIntro: copy?.seasonalIntro || SEASONAL_INTRO,
    seasonalMoments: copy ? moments : SEASONAL_MOMENTS.map((moment) => ({ ...moment })),
    littleCreators: copy ? creators : LITTLE_CREATORS.map((item) => ({ ...item })),
    collaborations: copy ? collaborations : COLLABORATIONS.map((item) => ({ ...item })),
    experienceStatement: copy?.experienceStatement || EXPERIENCE_STATEMENT,
    ourApproach: copy ? approach : [...OUR_APPROACH],
  };
}
