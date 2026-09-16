import { Reveal } from "@/components/motion/Reveal";
import { StrandIndex } from "@/components/sections/StrandIndex";
import { RuledLink } from "@/components/ui/Action";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { getDisciplines } from "@/lib/disciplines";

/** The heading's id, passed to both halves of the section-labelling contract. */
const HEADING_ID = "creative-experiences-heading";

/**
 * Homepage section 04 — creative experiences.
 *
 * THIS FILE USED TO OPEN BY SAYING IT WAS NOT MOUNTED ANYWHERE. It was, and it
 * had been for some time: app/page.tsx renders it between the steps and the
 * About teaser. The block is deleted rather than corrected because everything
 * it explained — a parked component kept for its hover-linked treatment — is
 * about a composition that no longer exists.
 *
 * WHAT THE SECTION IS NOW. The strands are an index of what you would actually
 * be doing, and each one is a row: a compact block of type at the top of one
 * half, one very large photograph filling the other, alternating sides down
 * the page. That is the reference's EXHIBITIONS AND FAIRS arrangement, which
 * is what the client asked this section to follow. The mechanism, the
 * measured plate heights and the three deletions the client's note implied are
 * all in <StrandIndex>.
 *
 * THE LIGHT SAGE GROUND IS GONE, BY INSTRUCTION. "Remove the background
 * colour" was one of the three notes, and this section was the only Sage field
 * on the homepage — so the page ground now runs unbroken from the hero's foot
 * through to the About teaser's White Rock. Sage has not left the site: the
 * footer is a Sage field on every route, and it is where the colour now lives.
 *
 * Two things the ground change bought, neither of them asked for. The accent
 * can carry the strand numerals — Deep Lilac is 4.90:1 on the page ground
 * against 3.83:1 on Sage, which is the difference between clearing and failing
 * what 11px of text owes. And the section stops being a coloured band in the
 * middle of the page, which is the calmer ground rhythm the approved plan was
 * after anyway.
 *
 * NO <Signature> HERE ANY MORE. The script "where to begin" sat beside the
 * heading doing the job the standfirst does, and <Signature> is a frozen
 * shared component whose ink is chosen per ground — one more thing this
 * section would have had to re-argue for a ground it no longer has.
 *
 * Awaited in place rather than suspended, for the reason set out in
 * <UpcomingEvents>: a boundary would strand a JavaScript-less visitor on the
 * fallback, and the root layout works hard to avoid exactly that.
 *
 * Server component — and as of this pass, so is everything it composes bar the
 * shared motion wrappers.
 */
export async function CreativeExperiences() {
  const disciplines = await getDisciplines();
  if (disciplines.length === 0) return null;

  return (
    <Section id={HEADING_ID} ground="surface">
      <SectionHead
        id={HEADING_ID}
        eyebrow="Creative experiences"
        title="Explore your creative side."
        standfirst="From colour and pattern to hands-on making, discover experiences designed to bring your ideas to life."
        layout="spread"
      />

      {/* <SectionHead> sets no bottom margin — the gap belongs to whatever
          follows it, which here is the index and then the link that closes it. */}
      <StrandIndex disciplines={disciplines} className="mt-section-gap" />

      {/*
        The closing link sits under the run at the left edge of the measure,
        so it reads as the last entry in the index rather than as a stray
        control. Same token as the gap between two strands: it is one more
        step down the same list.
      */}
      <Reveal variant="fadeIn" className="mt-section-gap">
        <RuledLink label="Explore all experiences" href="/events" />
      </Reveal>
    </Section>
  );
}
