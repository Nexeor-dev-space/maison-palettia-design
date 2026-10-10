import { FixedPage, pageMetadata } from "@/components/blocks/CmsPage";

export function generateMetadata() {
  return pageMetadata("private-events", {
    title: "Private events",
    description:
      "Creative experiences designed around your people, your occasion and your space. A private Maison Palettia session where everyone makes something to take home.",
    path: "/private-events",
  });
}

/**
 * /private-events — creative experiences for groups.
 *
 * The page is the `private-events` document's blocks (SPEC §E.1):
 * introduction, who it is for, the activities, where the Maison works, how it
 * works and the Deep Lilac close — drawn by
 * components/sections/private-events/PrivateEventsSections.tsx and
 * components/sections/ClosingCta.tsx, where the notes on the page's ground
 * rhythm and on what it is careful not to be now live.
 *
 * (REMOVED) FOR OUR LITTLE CREATORS — at the client's ask, 2026-10-08.
 * "Tailored kids activities" stood between the audiences and the activities;
 * the client asked for it to come off, so the page runs from the audiences
 * straight into the activities themselves.
 */
export default function PrivateEventsPage() {
  return <FixedPage slug="private-events" />;
}
