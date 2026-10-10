import { SessionShowcase } from "@/components/events/SessionShowcase";
import { Reveal } from "@/components/motion/Reveal";
import { StudioFilm } from "@/components/sections/StudioFilm";
import { CollaborateTeaser } from "@/components/sections/home/CollaborateTeaser";
import { CommunityMoment } from "@/components/sections/home/CommunityMoment";
import { PrivateEventsTeaser } from "@/components/sections/home/PrivateEventsTeaser";
import { SeasonalExperiences } from "@/components/sections/home/SeasonalExperiences";
import { StudioInterlude } from "@/components/sections/home/StudioInterlude";
import { WorkshopJourney } from "@/components/sections/home/WorkshopJourney";
import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/SectionHeader";
import { getTestimonials } from "@/lib/testimonials";
import { experienceSlugOf, getAllWorkshops, hasSessionPassed, serverClock } from "@/lib/workshops";
import type { Media } from "@/payload-types";

import { doc, imageOf, stored, text } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * ==========================================================================
 * The dormant blocks (SPEC §E.2) — registered, never seeded
 * ==========================================================================
 *
 * Sections the homepage once carried and the client took off: their
 * components stay in the tree ("removing a section is not the same decision
 * as throwing the work away"), and the blocks let an editor put one back
 * without a developer. Where a section's own content is a photograph or a
 * clip, the block supplies it; their words are Brand wording's (the seasonal
 * moments, the journey, the collaborations), so these adapters pass only what
 * the block stores and the section keeps the rest.
 */

const src = (value: string | Media | null | undefined) => imageOf(value)?.src;

/** `seasonal` → <SeasonalExperiences>: the moments are Brand wording's seasonal list. */
export function SeasonalAdapter() {
  return <SeasonalExperiences />;
}

/** `workshopJourney` → <WorkshopJourney>: Brand wording's journey, set as paint dabs. */
export function WorkshopJourneyAdapter() {
  return <WorkshopJourney />;
}

/** `privateEventsTeaser` → <PrivateEventsTeaser>: the programmes, with the enquiry door. */
export function PrivateEventsTeaserAdapter() {
  return <PrivateEventsTeaser />;
}

/** `collaborateTeaser` → <CollaborateTeaser>: Brand wording's three partnership models. */
export function CollaborateTeaserAdapter() {
  return <CollaborateTeaser />;
}

/** `imagePair` → <StudioInterlude>: two photographs, no words. */
export function ImagePairAdapter({ block }: AdapterProps<"imagePair">) {
  const b = stored(block);
  const first = b ? imageOf(b.first) : null;
  const second = b ? imageOf(b.second) : null;
  return <StudioInterlude first={first ?? undefined} second={second ?? undefined} />;
}

/** `fullBleedStatement` → <CommunityMoment>: the held photograph behind the community passage. */
export function FullBleedStatementAdapter({ block }: AdapterProps<"fullBleedStatement">) {
  const b = stored(block);
  return <CommunityMoment image={(b && src(b.image)) || undefined} />;
}

/** `film` → <StudioFilm> + <FilmStage>: the clip, its poster, its label and running time. */
export function FilmAdapter({ block }: AdapterProps<"film">) {
  const b = stored(block);
  if (!b) return <StudioFilm />;
  const video = doc(b.video)?.url;
  return (
    <StudioFilm
      video={video ?? undefined}
      poster={src(b.poster)}
      label={text(b.label) ?? undefined}
      duration={text(b.duration) ?? undefined}
    />
  );
}

/**
 * `upcomingSessions` → <SessionShowcase>: the next dated sessions that have
 * not begun, optionally for one activity only, under an optional heading.
 */
export async function UpcomingSessionsAdapter({ block }: AdapterProps<"upcomingSessions">) {
  const b = stored(block);
  const now = serverClock();
  const only = b ? doc(b.experience)?.slug : undefined;
  const sessions = (await getAllWorkshops())
    .filter((session) => session.kind !== "diy" && !hasSessionPassed(session, now))
    .filter((session) => !only || experienceSlugOf(session) === only)
    .slice(0, b?.limit ?? 3);
  if (sessions.length === 0) return null;
  const heading = b ? text(b.heading) : null;
  return (
    <section className="relative isolate bg-surface py-[3.5rem] md:py-[4.5rem]">
      <Container>
        {heading ? <DisplayHeading className="mb-10 md:mb-12" lines={[heading]} /> : null}
        <SessionShowcase sessions={sessions} />
      </Container>
    </section>
  );
}

/**
 * `testimonials` → a small quote band (SPEC §E.2 "new small renderer").
 * Only documents with permission on file ever reach it — the data layer
 * filters them — so nobody is quoted who has not agreed to be.
 */
export async function TestimonialsAdapter({ block }: AdapterProps<"testimonials">) {
  const b = stored(block);
  const manual = b?.source === "manual";
  const all = await getTestimonials(manual ? 100 : (b?.limit ?? 3));
  // Hand-picked: in the editor's order, and only those the data layer
  // returned — a pick without permission on file simply does not appear.
  const quotes = manual
    ? (b.items ?? [])
        .map((item) => all.find((candidate) => candidate.quote === doc(item)?.quote))
        .filter((item): item is (typeof all)[number] => Boolean(item))
    : all;
  if (quotes.length === 0) return null;
  const heading = b ? text(b.heading) : null;
  return (
    <section className="relative isolate bg-cream py-[4rem] md:py-section">
      <Container>
        {heading ? <DisplayHeading className="mb-10 md:mb-12" lines={[heading]} /> : null}
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {quotes.map((item, i) => (
            <Reveal as="li" key={item.id} delay={i * 0.06} className="plate rounded-[1.25rem] bg-surface px-6 py-7">
              <blockquote className="text-lead text-text">&ldquo;{item.quote}&rdquo;</blockquote>
              <p className="mt-4 text-label font-medium uppercase tracking-eyebrow text-text/75">{item.attribution}</p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
