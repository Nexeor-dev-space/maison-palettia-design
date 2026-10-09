import Link from "next/link";

import { groundShapes } from "@/components/motion/groundShapes";
import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { Container } from "@/components/ui/Container";
import type { Policy } from "@/lib/policies";

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
 * /policies — the hub's index.
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
 *
 * The `policiesIndex` block (SPEC §E.1) — moved here from
 * app/(site)/policies/page.tsx when the page became CMS blocks. The rows are
 * the `policies` collection in its `order`, handed in by the adapter.
 */
export function PoliciesIndex({ policies }: { policies: readonly Policy[] }) {
  return (
    <>
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
            {policies.map((policy, index) => (
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
    </>
  );
}
