import type { Block } from "payload";

import { AboutWelcomeBlock } from "./AboutWelcome";
import { ActivitiesGridBlock } from "./ActivitiesGrid";
import { ClosingCtaLilacBlock } from "./ClosingCtaLilac";
import { ClosingInvitationBlock } from "./ClosingInvitation";
import { CollaborateTeaserBlock } from "./CollaborateTeaser";
import { CommunityJourneyBlock } from "./CommunityJourney";
import { ContactIntroBlock } from "./ContactIntro";
import { EnquiryFormBlock } from "./EnquiryForm";
import { EventsBrowserBlock } from "./EventsBrowser";
import { ExperienceCarouselBlock } from "./ExperienceCarousel";
import { FaqListBlock } from "./FaqList";
import { FilmBlock } from "./Film";
import { FullBleedStatementBlock } from "./FullBleedStatement";
import { GalleryCollectionsBlock } from "./GalleryCollections";
import { HeroBlock } from "./Hero";
import { ImagePairBlock } from "./ImagePair";
import { LatestJournalBlock } from "./LatestJournal";
import { LocationsHeroBlock } from "./LocationsHero";
import { MissionVisionBlock } from "./MissionVision";
import { OpeningStatementBlock } from "./OpeningStatement";
import { PageHeaderBlock } from "./PageHeader";
import { PassesListBlock } from "./PassesList";
import { PoliciesIndexBlock } from "./PoliciesIndex";
import { PrivateEventsIntroBlock } from "./PrivateEventsIntro";
import { PrivateEventsTeaserBlock } from "./PrivateEventsTeaser";
import { ProgrammesGridBlock } from "./ProgrammesGrid";
import { RichTextBlock } from "./RichText";
import { SeasonalBlock } from "./Seasonal";
import { StepsBlock } from "./Steps";
import { TestimonialsBlock } from "./Testimonials";
import { TwoWaysBlock } from "./TwoWays";
import { UpcomingSessionsBlock } from "./UpcomingSessions";
import { UtilityBarBlock } from "./UtilityBar";
import { VenueSpotlightBlock } from "./VenueSpotlight";
import { WaysToTakePartBlock } from "./WaysToTakePart";
import { WhatSetsUsApartBlock } from "./WhatSetsUsApart";
import { WhereWeCreateBlock } from "./WhereWeCreate";
import { WhereWeSetUpBlock } from "./WhereWeSetUp";
import { WorkshopJourneyBlock } from "./WorkshopJourney";

export { FAQ_GROUPS } from "./FaqList";
export { stepsSourceFields } from "./Steps";

/**
 * ==========================================================================
 * The page-builder blocks (SPEC §E), one file per block, registered here
 * ==========================================================================
 *
 * `pages.blocks` takes this list. Two groups: the blocks seeded onto the
 * eleven fixed pages at launch (§E.1) and the dormant ones whose components
 * exist but which no page mounts today (§E.2) — registered so an editor may
 * add them, never seeded. The admin's "add block" drawer groups them by
 * `admin.group` (Home, About, Page sections, Private events, Events,
 * Reserved).
 *
 * The rule carried from the codebase: blocks only supply data, the existing
 * components stay the renderers (components/blocks/BlockRenderer.tsx
 * switches on `blockType`, one adapter per block). The field names here are
 * therefore a contract with components/blocks/* (2D) and cms/seed/pages.ts
 * (2B) — `headingLines[] { text }`, `eyebrow`, `lead`, `standfirst`,
 * `primaryCta`/`secondaryCta { label, link }` — spelled in cms/blocks/shared.ts
 * and nowhere else. `interfaceName` gives each block a named type in
 * payload-types.ts (`HeroBlock`, `PageHeaderBlock`, …) for the adapters.
 */

/** §E.1 — in use at launch, in the order they appear down the site. */
export const launchBlocks: Block[] = [
  HeroBlock,
  OpeningStatementBlock,
  ExperienceCarouselBlock,
  WaysToTakePartBlock,
  TwoWaysBlock,
  WhereWeCreateBlock,
  ClosingInvitationBlock,
  AboutWelcomeBlock,
  MissionVisionBlock,
  CommunityJourneyBlock,
  WhatSetsUsApartBlock,
  ClosingCtaLilacBlock,
  PageHeaderBlock,
  FaqListBlock,
  GalleryCollectionsBlock,
  LocationsHeroBlock,
  ContactIntroBlock,
  PrivateEventsIntroBlock,
  ProgrammesGridBlock,
  ActivitiesGridBlock,
  VenueSpotlightBlock,
  StepsBlock,
  EnquiryFormBlock,
  PassesListBlock,
  PoliciesIndexBlock,
  EventsBrowserBlock,
  WhereWeSetUpBlock,
  UtilityBarBlock,
  RichTextBlock,
];

/** §E.2 — registered, not seeded. */
export const dormantBlocks: Block[] = [
  SeasonalBlock,
  WorkshopJourneyBlock,
  PrivateEventsTeaserBlock,
  ImagePairBlock,
  FullBleedStatementBlock,
  FilmBlock,
  UpcomingSessionsBlock,
  TestimonialsBlock,
  CollaborateTeaserBlock,
  LatestJournalBlock,
];

export const blocks: Block[] = [...launchBlocks, ...dormantBlocks];

/** Every block slug, for the renderer's exhaustive switch and the seed's checks. */
export const BLOCK_SLUGS = blocks.map((block) => block.slug);
