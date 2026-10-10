import { FixedPage, pageMetadata } from "@/components/blocks/CmsPage";

export function generateMetadata() {
  return pageMetadata("events", {
    title: "Experiences",
    description:
      "Every Maison Palettia creative experience: Create Anytime activities you can enjoy at your own pace, and guided Create Together sessions you book online for a set date.",
    path: "/events",
  });
}

/*
  Re-rendered at most every ten minutes, for the reason set out on the event
  page (app/(site)/events/[slug]/page.tsx): every card here, and the "Next"
  date in <WhereWeSetUp>, takes the server's verdict on whether its date has
  passed, and a static page would otherwise keep the build's answer for as
  long as the deployment lives. <SessionGate> in each is what actually closes
  a date in the browser; this keeps the HTML close to true. Publishing a
  session revalidates the page at once (cms/hooks/revalidate.ts) — this is
  only the clock.
*/
export const revalidate = 600;

/**
 * /events — every experience, in the two groups the business runs on.
 *
 * TWO GROUPS, EACH ANCHORED. `#create-anytime` and `#scheduled` are what the
 * hero's actions and the header's "Book a session" point at, so a visitor
 * lands on the half of the page their question belongs to. Walk-in comes first
 * because the deck lists it first (p.5); a visitor who came to book is taken
 * straight past it by the anchor.
 *
 * The page is the `events` document's blocks (SPEC §E.1): the header and the
 * two doors with the two halves (components/sections/events/EventsBody.tsx,
 * where the notes on the page's grounds and doors now live) and the closing
 * "where we set up" panel (components/events/WhereWeSetUp.tsx).
 */
export default function EventsPage() {
  return <FixedPage slug="events" />;
}
