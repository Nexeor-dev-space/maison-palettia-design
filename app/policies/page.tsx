import Link from "next/link";

import { groundShapes } from "@/components/motion/groundShapes";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { POLICIES } from "@/lib/policies";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Policies",
  description:
    "The Maison Palettia studio policies: how sessions run, what we ask of visitors, and what happens if plans change.",
  path: "/policies",
});

/* ==========================================================================
   THE MARKS

   The smooth end of the sheet, at the sizes /faq uses, and in the outer
   margins for the same reason: the list is capped and centred, so the only
   clear ground on the page is either side of it.

   LILAC AND LAVENDER ONLY. Measured on this White Rock: Deep Lilac 3.95:1,
   Soft Lavender 1.41:1 — a shape and a whisper of one, which is the pairing
   every other long page uses. Warm Terracotta is 2.44 here and is spent on
   the callout rules inside the policies themselves; a third marking colour
   on a page whose job is to be unexciting is one too many.
   ========================================================================== */
const POLICY_SHAPES: readonly ShapePlan[] = groundShapes("cream");

/**
 * /policies — the hub.
 *
 * ==========================================================================
 * A HUB RATHER THAN ONE LONG DOCUMENT, WHICH IS THE CLIENT'S OWN STRUCTURE
 * ==========================================================================
 *
 * The source document's closing section proposes exactly this: "Rather than
 * putting one huge legal page in front of customers, I recommend your website
 * have" — and then the list. Eight of its ten names have content and are
 * here; the other two, plus Membership Terms, have none written anywhere in
 * it, so they are not stubbed. See the header of lib/policies.ts.
 *
 * EACH ROW CARRIES ITS SUMMARY, and the summary describes the page rather
 * than restating the rule. "The notice we ask for, and what happens if plans
 * change" sends a reader to the cancellation policy without being a second,
 * shorter, slightly-different cancellation policy — which is how a hub page
 * ends up contradicting the documents it indexes.
 */
export default function PoliciesPage() {
  return (
    <>
      {/* ---- the banner ------------------------------------------------- */}
      <section
        aria-labelledby="policies-title"
        className="relative isolate overflow-clip bg-sage pb-[3rem] pt-[4rem] md:pb-[3.5rem] md:pt-[5.5rem]"
      >
        <SectionShapes plan={groundShapes("sage")} />
        <span
          aria-hidden
          className="pointer-lift pointer-events-none absolute -right-6 top-[14%] hidden w-24 -rotate-12 lg:block xl:w-28"
          style={{ "--ax": 0.9, "--lift": 0.18 } as React.CSSProperties}
        >
          <DoodleMark name="splash" color={INK.lavender} treatment="draw" delay={420} depth={16} />
        </span>

        <Container className="relative">
          <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
            <div className="col-span-12 lg:col-span-7">
              <Reveal>
                <Eyebrow>Policies</Eyebrow>
              </Reveal>
              <DisplayHeading
                as="h1"
                id="policies-title"
                className="mt-8 md:mt-10"
                lines={["How the", "Maison Works."]}
              />
            </div>

            <Reveal delay={0.15} className="col-span-12 lg:col-span-5 lg:pb-3">
              {/* No `max-w`: the column is the measure — see <ExperienceDiscovery>. */}
              <p className="text-statement text-text/85">
                What applies when you come to make something with us.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ---- the index --------------------------------------------------- */}
      <section
        aria-label="The studio policies"
        className="relative isolate overflow-clip bg-cream pb-[4rem] pt-[3rem] md:pb-section md:pt-[4rem] lg:pb-section-lg"
      >
        <SectionShapes plan={POLICY_SHAPES} />

        <Container className="relative">
          {/*
            ONE COLUMN, NOT A GRID OF CARDS. Eight tiles would make this look
            like a menu of things to choose between, and nobody chooses a
            policy — they arrive looking for one. A single run of rows reads
            top to bottom in the order the studio would explain itself, and
            scans in one pass on a phone.
          */}
          <ul className="mx-auto max-w-[44rem]">
            {POLICIES.map((policy, index) => (
              <li key={policy.slug}>
                <Reveal delay={index * 0.04}>
                  <Link
                    href={`/policies/${policy.slug}`}
                    /*
                      THE WHOLE ROW IS THE TARGET, which is the point of
                      putting the link outside the heading rather than around
                      the title alone: a 20px title is a 20px target, and the
                      row is 100 tall. `block` plus the padding does it with
                      no absolute overlay and no nested interactive elements.
                    */
                    className="group block border-t border-text/15 py-7 transition-colors duration-300 ease-soft hover:bg-sage/40 md:py-8"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0">
                        <h2 className="text-h4 font-semibold tracking-[-0.01em] text-text">
                          {policy.title}
                        </h2>
                        <p className="mt-2 max-w-[42ch] text-body text-text/85">
                          {policy.summary}
                        </p>
                      </div>

                      {/* The arrow is the only thing that moves. Decorative:
                          the link's own text already says where it goes. */}
                      <span
                        aria-hidden
                        className="mt-1 shrink-0 text-text/60 transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
                      >
                        &#8594;
                      </span>
                    </div>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>

          {/*
            THE RULE UNDER THE LAST ROW. Each row draws its own top border, so
            without this the run ends on an open edge while every other row
            is closed above. One empty element rather than a bottom border on
            the last row, which would need a `last:` variant doing the same
            job less obviously.
          */}
          <div className="mx-auto max-w-[44rem] border-t border-text/15" />
        </Container>
      </section>

      {/* ---- the way on -------------------------------------------------- */}
      <section
        aria-labelledby="policies-close"
        className="relative isolate overflow-clip bg-primary py-[4.5rem] text-surface md:py-section lg:py-section-lg [--color-focus:var(--color-cream)]"
      >
        <SectionShapes plan={groundShapes("lilac")} />
        <Container className="text-center">
          <div className="mx-auto max-w-[44rem]">
            <DisplayHeading id="policies-close" ground="lilac" lines={["Something", "Unclear?"]} />

            <Reveal delay={0.2}>
              <p className="mx-auto mt-7 max-w-[40ch] text-lead text-surface">
                Ask before you book. We would rather answer a question twice
                than have you find out on the day.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-9 flex justify-center">
                <BlobButton href="/contact" tone="cream" className="min-h-[3.25rem] px-8">
                  Ask the Maison
                </BlobButton>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
