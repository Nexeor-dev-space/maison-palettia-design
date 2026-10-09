import type { FixedPageSlug } from "@/cms/collections/content/Pages";

import type { DefaultBlock } from "./helpers";
import type { BlockType, RenderBlock } from "./types";

/**
 * ==========================================================================
 * The launch layout of each fixed page — what renders before the CMS has one
 * ==========================================================================
 *
 * The eleven `FIXED_PAGE_SLUGS` routes exist in code whether or not their
 * `pages` document does. Before the seed has run (or between this phase's
 * code landing and its migration being applied) there is no document, and a
 * fixed route must not 404 or render blank — so it renders this list: the
 * same sections in the same order, each with no data, which every adapter
 * reads as "the wording this section has always had" (see the rule at the
 * top of ./helpers.ts). The seed (cms/seed/pages.ts) stores the same order
 * with those words written out, so the page looks identical either side of
 * seeding, and from then on the stored document is the only thing rendered.
 *
 * This is NOT a second copy of the content: it names block types and
 * nothing else. The words stay in the section components, where they were.
 */
const LAUNCH: Record<FixedPageSlug, readonly BlockType[]> = {
  home: [
    "hero",
    "openingStatement",
    "experienceCarousel",
    "waysToTakePart",
    "twoWays",
    "whereWeCreate",
    "closingInvitation",
  ],
  about: ["aboutWelcome", "missionVision", "communityJourney", "whatSetsUsApart", "closingCtaLilac"],
  locations: ["pageHeader", "locationsHero"],
  gallery: ["pageHeader", "galleryCollections", "closingCtaLilac"],
  faq: ["pageHeader", "faqList", "closingCtaLilac"],
  contact: ["contactIntro", "closingCtaLilac"],
  policies: ["pageHeader", "policiesIndex", "closingCtaLilac"],
  loyalty: ["passesList", "steps"],
  events: ["pageHeader", "eventsBrowser", "whereWeSetUp"],
  "private-events": [
    "privateEventsIntro",
    "programmesGrid",
    "activitiesGrid",
    "venueSpotlight",
    "steps",
    "closingCtaLilac",
  ],
  "private-events-book": ["pageHeader", "enquiryForm"],
};

export function launchLayout(slug: FixedPageSlug): RenderBlock[] {
  return LAUNCH[slug].map(
    (blockType, i) => ({ blockType, id: `launch-${slug}-${i}`, __default: true }) as { blockType: BlockType; id: string } & DefaultBlock,
  );
}
