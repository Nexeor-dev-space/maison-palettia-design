import type { Metadata } from "next";

import { FixedPage, pageMetadata } from "@/components/blocks/CmsPage";
import { getHomeMetadata } from "@/lib/seo";

/**
 * ==========================================================================
 * THE HOMEPAGE, AS ONE STORY
 * ==========================================================================
 *
 * THE ORDER. The redesign brief names a journey — hero, why, what we offer,
 * creative experiences, walk-in versus scheduled, community, seasonal, kids,
 * our experience and locations, collaborations, private events, a final
 * statement — and says the supplied Markdown's section order is the source of
 * truth. The Markdown supplied with the brief is a brand reference (colours,
 * type, spatial assets, reference links) and contains no section order, so
 * the brief's journey was the order given — with one change the client has
 * since asked for: the creative experiences come straight after the banner.
 *
 * WHAT YOU CAN MAKE, THEN WHY. The banner's "scroll down" lands on the seven
 * activities, grouped by whether you walk in or book, so the first thing
 * under it answers what the Maison is for. The story of why it exists follows
 * immediately after.
 *
 * THE GROUNDS, top to bottom:
 *
 *   01 Banner ..................... Light Sage       runs up behind the bar
 *   02 Opening statement .......... Light Sage       a deck sheet
 *   03 The Maison experience ...... Light Sage       the card track
 *   04 Ways to take part .......... White Rock       the four ways in
 *   05 Create anytime / together .. White Rock head, then Terracotta | Lilac
 *   06 Where we set up ............ White Rock       the map and the studio
 *   07 Closing statement .......... DEEP LILAC       the one focal field
 *
 * SHORTER THAN IT WAS, and the list is the record of it. Five sections have
 * come off at the client's ask rather than been rearranged: the workshop
 * journey, the seasonal band, the little creators, the collaboration teaser
 * and the private-events teaser. Section 06 kept its map and lost the
 * year-in-review framing that used to head it — see <WhereWeCreate>.
 *
 * Light Sage returns every third section, the way the brand guide describes
 * it — the structural base — and Deep Lilac is spent once. No two neighbours
 * share a ground; 02b takes White Rock precisely because near-white sits
 * above it and Light Sage below, so inserting it kept that rule rather than
 * breaking it.
 *
 * WHAT CAME OFF THE PAGE. Testimonials: lib/testimonials.ts declares its own
 * contents invented ("MUST NOT SHIP. Nobody said these things.") and the brief
 * forbids fabricated social proof. The FAQ and gallery sections: both keep
 * their own routes, and neither is part of the journey the brief sets out.
 */
/*
  ==========================================================================
  THE SECTIONS NOW COME FROM THE CMS — and the record below stays with them
  ==========================================================================

  The order above is the `home` document's `blocks` (SPEC §E.1), seeded in
  exactly this order and drawn by <FixedPage> through the block adapters in
  components/blocks/. Before the document exists the same order is the
  launch layout (components/blocks/layouts.ts). The notes that used to sit
  between the sections are kept here, because they are the reasons the page
  is shaped this way and an editor rearranging blocks should be able to
  read them:

  Nothing in the banner is pinned, so it needs no wrapper: it fills the
  first screen, and while the intro plays it is lifted above the page
  (see `.hero` in ./hero/Hero.module.css) so the bouquet paints over
  everything. The creative experiences follow it directly, where its
  "scroll down" leads.


  THE VISION AND MISSION HAVE GONE TO /about, at the client's ask. They
  sat here as a reproduction of the deck's page 3 — pill, outlined box,
  pill, outlined box — and the note was that the deck is the source of
  the colours and the words, not of the layout. They are redesigned at
  the head of the About page, which is where a statement of purpose
  belongs and where the page was already carrying both sentences.

  NEITHER SENTENCE IS ON THIS PAGE ANY MORE, and that is worth knowing
  rather than assuming. <WhyMaison> used to set the vision small beside
  the brand story with a link to /about under it, which would have been
  the pointer this page kept — but it is no longer mounted here, so the
  homepage now states the mission and the vision nowhere at all.

  That is defensible: the deck's purpose page belongs on About, and this
  page opens on <OpeningStatement>, which carries the brand story. If
  the studio wants the vision teased here again, the smallest honest fix
  is a line of it beside that story with the /about link beneath —
  not a second copy of the section.


  THE BREADTH, BEFORE THE STORY. The client's note was that the site
  "should not make Maison Palettia appear to be only a workshop booking
  website". It read as one because everything that is not a workshop —
  private events, corporate, schools, activations — sat at positions ten
  and eleven of twelve, below where most visits end.

  This is the index of all four, directly under the activities: the
  visitor has just finished reading what they could make, and this is
  the moment to say that is one of four ways in. The sections it
  summarises all stay where they are and go deeper; see the note in
  <WaysToExperience> on why the four group names are wayfinding rather
  than the studio's own vocabulary.


  NOTHING STANDS HERE NOW, and two things came off this slot in a row at
  the client's ask — which is worth recording together, because the
  second removal is only legible against the first.

  <WorkshopJourney /> WENT FIRST — "what we offer", the five ways a
  visit can go, set as a row of paint dabs under a script heading.
  Nothing left the site with it: WORKSHOP_JOURNEY is set in full on
  /about in <Community>, and has been since the journey thread moved
  there, so this page was carrying the second and weaker copy.

  <StudioInterlude /> WENT SECOND. It was built to stand here in its
  place — two photographs the client supplied, on the Light Sage ground
  with the cut-outs breaking their edges, and no words at all. They
  looked at it and asked for it off too.

  SO THE PAGE NOW RUNS <WaysToExperience> STRAIGHT INTO
  <TwoWaysToCreate>, and this is the one place the grounds rule above
  does not hold. <TwoWaysToCreate> carries no ground of its own — the
  section is transparent and its header sits on the page's White Rock —
  so the join is White Rock into White Rock, and the Light Sage that
  used to separate them is what has gone.

  IT IS NOT A SEAM, because there is nothing to see: one field of paper
  runs from the last card of the trail, through a screen of air, to
  "Create Anytime, or Create Together.", and the colour only arrives at the two
  panels below that. Checked at 1440 — the two sections read as one
  long sheet rather than as two that failed to change. What is actually
  lost is the breath, not the boundary: four ways in, all type, now run
  into a heading and then into two full panels of colour with no picture
  anywhere between them. If that reads as too much at once, the fix is a
  quieter beat in this slot — not either of the two that came out of it.

  Both components and their stylesheets stay in the tree, the same rule
  <CommunityMoment /> and <SeasonalExperiences /> are kept under below —
  removing a section is not the same decision as throwing the work away.
  /images/workshop-journey.jpg, /images/1-2.jpg and /images/i-1.jpg are
  all now referenced only from those unmounted files.


  <CommunityMoment /> STOOD HERE and has been taken off the page at the
  client's ask. It was the held picture — a screen-high photograph the
  page scrolled over, carrying the deck's "Creating community through
  creativity" heading and its closing line.

  Nothing is lost from the site: COMMUNITY.heading, .body and .closer
  are all still set on /about, in <Community>, which is where the deck
  tells that part of the story anyway. The component and its stylesheet
  are left in the tree rather than deleted, because the decision to
  remove a section is not the same as the decision to throw the work
  away — if it comes back, it comes back here.

  One side effect worth knowing: this was the last place on the home
  page using /images/hero/img.png, the frame that carries Google C2PA
  credentials marking it AI-generated.


  <SeasonalExperiences /> HAS BEEN TAKEN OFF THE PAGE at the client's
  ask — "A different season, every season", the limited-time run with
  Valentine's Day, Ramadan, Mother's Day and Christmas.

  Nothing has moved: this section had no other home and no other page
  links to it, so the seasonal moments are simply not shown. Its copy is
  still in `SEASONAL_MOMENTS` and `SEASONAL_INTRO` in lib/brand.ts, and
  the component and its stylesheet are left in the tree — the same rule
  <CommunityMoment /> is kept under above. Removing a section is not the
  same decision as throwing the work away.


  <LittleCreators /> has MOVED TO /about rather than been removed. It is
  about who the activities are for, which is the about page's subject,
  and it now sits there after <Community> — where the journey thread
  ends on family bonding, so the little creators are the next beat.


  <CollaborateTeaser /> HAS BEEN TAKEN OFF THE PAGE at the client's ask,
  AND NOW LIVES ON /about — the client asked for it back and for it to
  move there. See the note beside it in app/about/page.tsx. The reasoning
  below is why taking it off THIS page costs nothing; it is kept because
  it is still true.

  Originally: —
  "Let's create together", the collaborative-approach teaser with the
  three partnership cards.

  THE CONTENT IS NOT LOST, which is why this is a safe removal: the
  collaborative approach in full — the deck's three partnership models
  and the approach beneath them — already lives on /locations, where a
  mall deciding whether to host the Maison actually reads. This teaser
  was only the invitation to go there, and nothing on the site links to
  it, so taking it off costs the partnership content no route in.

  The component and its stylesheet stay in the tree, as above.

*/
export default function HomePage() {
  return <FixedPage slug="home" />;
}

/*
  The homepage's own canonical ("/") and og:url. They used to be inherited
  from the root layout's defaults, which is also what every 404 inherited —
  see the note in `defaultMetadata` for why they moved here.

  An SEO title or description written in the admin (the page's SEO tab)
  replaces the defaults; the canonical and og:url stay "/" whatever the
  editor writes.
*/
export async function generateMetadata(): Promise<Metadata> {
  const [homeMetadata, meta] = await Promise.all([
    getHomeMetadata(),
    pageMetadata("home", { title: "", description: "", path: "/" }),
  ]);
  const title = typeof meta.title === "string" && meta.title ? meta.title : undefined;
  const description = meta.description && meta.description !== "" ? meta.description : undefined;
  if (!title && !description) return homeMetadata;
  return {
    ...homeMetadata,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    openGraph: { ...homeMetadata.openGraph, ...(title ? { title } : {}), ...(description ? { description } : {}) },
  };
}
