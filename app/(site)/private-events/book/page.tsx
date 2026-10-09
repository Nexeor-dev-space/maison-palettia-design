import { FixedPage, pageMetadata } from "@/components/blocks/CmsPage";

/* The same two sentences of the client's p37 band the page's own intro
   prints (see the note there), so the search snippet and the page speak in
   one voice. It was "Tell Maison Palettia about your gathering and we will
   come back to you…", the wording that rewrite replaced. */
export function generateMetadata() {
  return pageMetadata("private-events-book", {
    title: "Plan a private event",
    description:
      "Tell us when, who’s coming and what you’d like to make. We’ll help turn the idea into an experience made for your group.",
    path: "/private-events/book",
  });
}

/**
 * /private-events/book — the enquiry.
 *
 * The page is the `private-events-book` document's blocks (SPEC §E.1) — its
 * slug, because a page slug is one segment — drawn by
 * components/sections/private-events/EnquiryLayout.tsx around the form in
 * components/private-events/PrivateEventEnquiry.tsx. Why it is an enquiry and
 * not the booking flow is set out there.
 */
export default function PrivateEventBookingPage() {
  return <FixedPage slug="private-events-book" />;
}
