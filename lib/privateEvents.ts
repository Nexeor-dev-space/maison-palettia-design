import type { DoodleName } from "@/components/sections/hero/doodles";
import type { ImageAsset } from "@/types";

/**
 * Everything the private-events page says, and the seam where it will meet a
 * CMS.
 *
 * Held here rather than inline in the page for the reason lib/disciplines.ts
 * and lib/constants.ts are: the studio will want to change this wording, and
 * copy buried in JSX is copy that needs a developer. Replacing each array with
 * a query is a change to one function body.
 *
 * ==========================================================================
 * WHAT IS CLAIMED HERE, AND WHAT IS DELIBERATELY NOT
 * ==========================================================================
 *
 * The brief for this page was explicit: invent no prices, no packages, no
 * guest counts, no venues, no guaranteed services, no corporate clients and no
 * testimonials. Nothing in this file states any of them, and the page has no
 * shape waiting for them either — there is no pricing block with a blank in
 * it, no "up to N guests" line and no logo wall, because a component built to
 * hold a number is a component that will eventually be given an invented one.
 *
 * AUDIENCES are framed as examples, in the page copy as well as here. The
 * studio has not confirmed it has run any particular kind of event, so the
 * page says these are the kinds of group a session can be built around — a
 * description of the offer, never a record of the past. "The gatherings people
 * ask us about" is exactly what it must not say: that is a claim about demand
 * nobody has measured.
 *
 * ACTIVITIES are not in this file at all any more. They live in
 * lib/experiences.ts, which is the studio's approved list, and the page reads
 * them from there — see section 02 below for why that matters.
 *
 * TODO(client): confirm the four audiences. They are supplied material, not
 * verified material.
 */

/* ==========================================================================
   01 — WHO A PRIVATE EVENT IS FOR

   Four audiences rather than a list of occasions, because "birthday" and
   "team offsite" are not the same question: the first is an occasion, the
   second is a kind of group, and a page that mixes them reads as a tag cloud.
   These are the four the client named.

   NO IMAGES ON THESE, AND THAT IS DELIBERATE. The project has no photograph of
   a corporate group, a birthday or a brand activation — it has photographs of
   people making things. Pairing "Corporate" with a stock-feeling crop of a
   painting class would be a caption that overstates what it shows, so the
   section is type-led and the photography carries the experiences instead.
   That also answers the brief's own instruction not to build four identical
   cards: four cards is what you reach for when each one has a picture.

   TODO(client): a photograph per audience — a team mid-session, a birthday
   table — turns this into an image-led run with no other change.
   ========================================================================== */

export interface PrivateEventAudience {
  /** Stable key, the React key, and the anchor on /private-events. */
  slug: string;
  /** Set in caps by the design; stored in its natural case. */
  name: string;
  /** One line. What this group gets, not what the studio promises. */
  description: string;
  /**
   * The picture the bar's Private events menu shows beside this programme.
   *
   * READ THIS BEFORE CHANGING ONE. Nothing in the project photographs a
   * birthday party, a company gathering or a school group — checked, every
   * folder — so these three are the studio's own photographs whose *contents*
   * come closest to the group named, and they are stand-ins until the client
   * supplies the real thing.
   *
   * What keeps that honest is the alt text: each one describes what is in the
   * frame and never asserts the occasion. The keepsakes photograph says
   * children's hands holding named keepsakes; it does not say "a birthday
   * party". A caption that claims the occasion would be the one thing this
   * file keeps refusing to do, and swapping the file later changes nothing
   * else.
   */
  image?: ImageAsset;
  /**
   * A brand cut-out, drawn when a programme has no photograph at all. Kept as
   * the fallback the row renders when `image` is absent.
   */
  mark?: { name: DoodleName; color: string };
  /**
   * Offered in the bar's Private events menu.
   *
   * Three of the four are: a birthday, a company gathering and a school visit
   * are all things a host books privately. Mall & community activations is
   * not — the proposal lists it as its own programme category, the studio is
   * engaged by the venue rather than by a guest, and putting it in a menu
   * headed "Private events" would file it as something it is not. It keeps
   * its place on the page with the other three.
   */
  inPrivateEventsMenu?: boolean;
}

/**
 * Where "Book a private event" goes, everywhere it is offered.
 *
 * The studio runs one private-event enquiry and it is at /private-events/book
 * — the page the private-events page itself sends people to. Named here so
 * the bar's menu points at the same flow rather than growing a second one.
 */
/**
 * The three brand colours the menu's marks are drawn in, named here rather
 * than reached for one by one. They are the deck's own — the same values
 * `INK` in the hero's composition carries.
 */
const INK_MARK = {
  lilac: "#9059A4",
  lavender: "#C4B5FD",
  terracotta: "#D97757",
} as const;

export const PRIVATE_EVENT_ENQUIRY_HREF = "/private-events/book";

export const PRIVATE_EVENT_AUDIENCES: readonly PrivateEventAudience[] = [
  /*
    THE PROPOSAL'S PROGRAMME PAGES, NOT A LIST WRITTEN FOR THIS ONE.

    These four were Corporate / Celebrations / Community / Brands & events —
    reasonable, but composed for the page. The signed proposal names the
    studio's programmes exactly: Birthday Parties, Corporate Events, School
    Programs, and Mall & Community Activations. Those are the kinds of private
    booking the business has contracted a website for, so they are the ones
    offered here.

    Each line says only what the brand deck supports. Birthdays lean on its
    "Family bonding" (p.5) and "Appeals to all ages" (p.11); activations on
    "Our experience" (p.12), which is the one programme with a track record in
    the deck. Corporate and school programmes have no content in either
    document — the proposal says their pages get content "when ready" — so
    their lines describe the offer and promise nothing about it.
  */
  {
    slug: "birthday-parties",
    name: "Birthday parties",
    description: "Kids and parents sharing a creative activity, and quality time together.",
    image: {
      src: "/images/events/glitter-keepsakes.jpg",
      alt:
        "Four handmade keepsakes cupped in children’s hands, two lettered with names and hearts and two filled with purple glitter and heart charms.",
    },
    mark: { name: "splash", color: INK_MARK.lavender },
    inPrivateEventsMenu: true,
  },
  {
    slug: "corporate-events",
    name: "Corporate events",
    description: "Hands-on creative experiences for teams and company gatherings.",
    image: {
      src: "/images/experience/community-table.jpg",
      alt:
        "A hand resting over a watercolour palette and a sheet of paper at a shared table, brushes and a bag beside it.",
    },
    mark: { name: "starburst", color: INK_MARK.lilac },
    inPrivateEventsMenu: true,
  },
  {
    slug: "school-programs",
    name: "School programmes",
    description: "Creative, hands-on activities brought to students.",
    image: {
      src: "/images/events/national-day-cards.jpg",
      alt:
        "Two quilled cards for Eid Al Etihad reading “I love UAE”, beside a pen pot made from lolly sticks painted in the colours of the UAE flag.",
    },
    mark: { name: "starleaf", color: INK_MARK.terracotta },
    inPrivateEventsMenu: true,
  },
  {
    slug: "mall-and-community-activations",
    name: "Mall & community activations",
    description:
      "Workshops tailored to an event’s theme, bringing creativity to kids and adults alike.",
  },
] as const;

/* ==========================================================================
   02 — CREATIVE ACTIVITIES: DELIBERATELY NOT HERE

   This file used to carry its own list of six activities. It no longer does,
   and that is the point: lib/experiences.ts is the studio's approved list —
   seven entries, each with its own `kind`, its own optional photograph and its
   own optional description — and it arrived after this one.

   Two lists of the same thing is the drift this codebase keeps warning about.
   The private-events page reads `getCreativeExperiences()`, so an activity
   added, renamed or photographed there appears here with no second edit, and
   the two can never disagree about what the Maison offers.
   ========================================================================== */

/* ==========================================================================
   03 — HOW IT WORKS

   The client's own three steps, in the client's own order and close to the
   client's own words. Nothing is added to them — no "within 24 hours", no
   "dedicated coordinator", no "site visit" — because each of those is a
   commitment somebody at the studio would have to keep.
   ========================================================================== */

export interface PrivateEventStep {
  /** The printed numeral. Copy, not an index — see {@link VisitStep}. */
  number: string;
  title: string;
  /** One short sentence. Any longer and the process starts sounding long. */
  detail: string;
}

export const PRIVATE_EVENT_STEPS: readonly PrivateEventStep[] = [
  {
    number: "01",
    title: "Tell us about your event",
    detail: "Share your occasion, group size and preferred date.",
  },
  {
    number: "02",
    title: "Choose your experience",
    detail: "We will help shape the right creative activity for your group.",
  },
  {
    number: "03",
    title: "Create together",
    detail: "Everyone makes something, and everyone leaves holding it.",
  },
] as const;

/* ==========================================================================
   04 — PHOTOGRAPHY

   Two plates, chosen against the same two rules: it must not be pottery, and
   it must be something this project actually has. Named here so the pages read
   their pictures from the same place they read their words, and so swapping in
   the studio's own shoot is one edit.

   THEY ARE ONE PHOTOGRAPH AT TWO CROPS, AND THAT IS THE POINT. Compared byte
   for byte they are different files — 2000x2500 portrait and 1600x1600 square,
   different hashes — but they are the same frame: the same painter, the same
   brush on the same leaf, the same tattoo, the same palette in the foreground.
   /private-events opens on the portrait and /private-events/book carries the
   square one beside the form, which is what makes the two pages read as one
   journey rather than as two forms on one domain. Do not "fix" the duplication
   by pointing one of them somewhere else.

   A THIRD ENTRY WAS REMOVED. `activities` held the ceramic-painting plate for
   the old six-item index. The experiences section now reads its pictures from
   lib/experiences.ts, where that same file is already attached to the ceramic
   painting entry, so keeping a second reference here was one more place for
   the two to drift.

   TODO(client): these pages have no photograph of a group. Every image in the
   project is one pair of hands or a finished piece, so a page about making
   things together illustrates itself with people making things alone. That is
   the single most valuable shot the studio could add here.
   ========================================================================== */

export const PRIVATE_EVENT_IMAGES: Record<"hero" | "experience", ImageAsset> = {
  /**
   * Someone making something, not a photograph of a party — which is the
   * positioning in one decision: nothing says event-planning company faster
   * than a wide shot of people laughing around a table.
   *
   * It is the studio's own painter at her easel, brush loaded, mid-stroke on a
   * coral and teal canvas. Warm, hands in it, unmistakably this brand. The
   * plate was the homepage hero until that became a carousel and has been
   * unreferenced since; this page is the right home for it.
   *
   * (It replaced a watercolour wash, which read as artwork about the brand
   * rather than as the brand at work.)
   *
   * Portrait, 2000x2500. The foot of the frame is the loaded palette — the
   * darkest, busiest part — which is where the hero sets its type, so the
   * scrim there is doing less work than it looks like it is.
   */
  hero: {
    src: "/images/hero/making.jpg",
    alt: "A painter at her easel, brush in hand, working a canvas of coral and blush roses among deep teal leaves, a loaded palette in the foreground.",
    /*
      MEASURED, NOT EYEBALLED. At a desktop's aspect the cover scale is set by
      the width, so the whole frame is shown across and only Y is in play: 828
      of the picture's 1799 rendered pixels, about 46% of its height. Y decides
      which 46%.

      0.55 puts picture rows 30-76% on screen, which lands the hand, the brush
      and the richest coral and teal in the upper third — the part of the frame
      the hero leaves unscrimmed. The palette and the lower canvas fall into the
      foot field, where they are behind the type anyway.

      It was 0.38, which framed the bright middle of the canvas beautifully and
      put white roses directly under a cream headline.

      X still matters on a phone, where the crop takes the sides instead: 38%
      holds the hand and the brush in frame there. See the note on HeroSlide in
      lib/constants.ts for why one value has to answer both.
    */
    position: "38% 55%",
  },
  /**
   * The same frame as the hero, cropped square — see the note above. It sits
   * beside the enquiry form, where its job is continuity rather than novelty:
   * the picture somebody was looking at one click ago.
   *
   * Also shared with the homepage strands, which is why the alt is worded a
   * shade differently from the hero's; both describe the same photograph and
   * neither claims anything the other does not.
   */
  experience: {
    src: "/images/creative/painting.jpg",
    alt: "A painter at an easel, brush in hand, working into a canvas of coral and blush roses among deep teal leaves, a loaded palette in the foreground.",
  },
};
