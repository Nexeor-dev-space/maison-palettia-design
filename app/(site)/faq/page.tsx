import { FixedPage, pageMetadata } from "@/components/blocks/CmsPage";

export function generateMetadata() {
  return pageMetadata("faq", {
    title: "FAQ",
    description: "Answers to common questions about Maison Palettia events.",
    path: "/faq",
  });
}

/**
 * FAQ — the questions that stand between someone and a booking.
 *
 * ==========================================================================
 * WHAT THIS PAGE IS ALLOWED TO SAY
 * ==========================================================================
 *
 * Every answer it renders comes from the `faqs` collection, and every one of
 * those is a sentence the site already stands behind somewhere else — the
 * note at the foot of an event page, the note at the foot of checkout, the
 * loyalty page's own line about a pass. Nothing here was written for this
 * page, because an answer invented on a FAQ page is a policy the studio has
 * not agreed to.
 *
 * The five questions a craft studio is most often asked — minimum age,
 * children, accessibility at each mall, what happens if you cannot make it,
 * and whether pieces are fired and collected later — are therefore NOT on it.
 * See the TODO in lib/constants.ts: not one can be answered from anything in
 * this project, so the page sends those to the enquiry route rather than
 * guessing, and grows a group the moment the studio supplies the wording.
 *
 * ==========================================================================
 * THREE GROUNDS, THE WAY EVERY OTHER PAGE CLOSES
 * ==========================================================================
 *
 * The banner and the questions share ONE Light Sage field at the client's ask
 * — they were White Rock over the near-white `surface`, which drew a seam
 * across the page at exactly the point where the reading starts — and the last
 * beat is Deep Lilac, which is where /about, /locations and /private-events
 * all end and is the ground the footer's wave rises out of.
 *
 * The page is the `faq` document's blocks (SPEC §E.1): the masthead
 * (components/sections/PageHeader.tsx), the questions
 * (components/sections/faq/FaqBody.tsx) and the close
 * (components/sections/ClosingCta.tsx).
 */
export default function FaqPage() {
  return <FixedPage slug="faq" />;
}
