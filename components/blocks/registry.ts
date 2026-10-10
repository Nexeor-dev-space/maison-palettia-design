import type { ComponentType } from "react";

import { AboutWelcomeAdapter, CommunityJourneyAdapter, MissionVisionAdapter, WhatSetsUsApartAdapter } from "./About";
import { ClosingCtaLilacAdapter } from "./ClosingCtaLilac";
import { ClosingInvitationAdapter } from "./ClosingInvitation";
import { ContactIntroAdapter } from "./ContactIntro";
import { EnquiryFormAdapter } from "./EnquiryForm";
import { EventsBrowserAdapter, WhereWeSetUpAdapter } from "./Events";
import {
  CollaborateTeaserAdapter,
  FilmAdapter,
  FullBleedStatementAdapter,
  ImagePairAdapter,
  PrivateEventsTeaserAdapter,
  SeasonalAdapter,
  TestimonialsAdapter,
  UpcomingSessionsAdapter,
  WorkshopJourneyAdapter,
} from "./Dormant";
import { ExperienceCarouselAdapter } from "./ExperienceCarousel";
import { FaqListAdapter } from "./FaqList";
import { GalleryCollectionsAdapter } from "./GalleryCollections";
import { HeroAdapter } from "./Hero";
import { LatestJournalAdapter } from "./LatestJournal";
import { LocationsHeroAdapter } from "./LocationsHero";
import { OpeningStatementAdapter } from "./OpeningStatement";
import { PageHeaderAdapter } from "./PageHeader";
import { PassesListAdapter } from "./PassesList";
import { PoliciesIndexAdapter } from "./PoliciesIndex";
import {
  ActivitiesGridAdapter,
  PrivateEventsIntroAdapter,
  ProgrammesGridAdapter,
  VenueSpotlightAdapter,
} from "./PrivateEvents";
import { RichTextAdapter } from "./RichText";
import { StepsAdapter } from "./Steps";
import { TwoWaysAdapter } from "./TwoWays";
import { UtilityBarAdapter } from "./UtilityBar";
import { WaysToTakePartAdapter } from "./WaysToTakePart";
import { WhereWeCreateAdapter } from "./WhereWeCreate";
import type { AdapterProps, BlockType } from "./types";

/**
 * blockType → adapter. One entry per block slug in cms/blocks/index.ts; the
 * `Record` makes a block added there without an adapter here a type error.
 */
type Registry = { [T in BlockType]: ComponentType<AdapterProps<T>> };

export const ADAPTERS: Registry = {
  hero: HeroAdapter,
  openingStatement: OpeningStatementAdapter,
  experienceCarousel: ExperienceCarouselAdapter,
  waysToTakePart: WaysToTakePartAdapter,
  twoWays: TwoWaysAdapter,
  whereWeCreate: WhereWeCreateAdapter,
  closingInvitation: ClosingInvitationAdapter,
  aboutWelcome: AboutWelcomeAdapter,
  missionVision: MissionVisionAdapter,
  communityJourney: CommunityJourneyAdapter,
  whatSetsUsApart: WhatSetsUsApartAdapter,
  closingCtaLilac: ClosingCtaLilacAdapter,
  pageHeader: PageHeaderAdapter,
  galleryCollections: GalleryCollectionsAdapter,
  faqList: FaqListAdapter,
  policiesIndex: PoliciesIndexAdapter,
  locationsHero: LocationsHeroAdapter,
  contactIntro: ContactIntroAdapter,
  passesList: PassesListAdapter,
  steps: StepsAdapter,
  privateEventsIntro: PrivateEventsIntroAdapter,
  programmesGrid: ProgrammesGridAdapter,
  activitiesGrid: ActivitiesGridAdapter,
  venueSpotlight: VenueSpotlightAdapter,
  eventsBrowser: EventsBrowserAdapter,
  whereWeSetUp: WhereWeSetUpAdapter,
  enquiryForm: EnquiryFormAdapter,
  utilityBar: UtilityBarAdapter,
  richText: RichTextAdapter,
  seasonal: SeasonalAdapter,
  workshopJourney: WorkshopJourneyAdapter,
  privateEventsTeaser: PrivateEventsTeaserAdapter,
  imagePair: ImagePairAdapter,
  fullBleedStatement: FullBleedStatementAdapter,
  film: FilmAdapter,
  upcomingSessions: UpcomingSessionsAdapter,
  testimonials: TestimonialsAdapter,
  collaborateTeaser: CollaborateTeaserAdapter,
  latestJournal: LatestJournalAdapter,
};
