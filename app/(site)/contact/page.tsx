import { FixedPage, pageMetadata } from "@/components/blocks/CmsPage";

export function generateMetadata() {
  return pageMetadata("contact", {
    title: "Contact",
    description:
      "Ask the Maison about an event, a booking or working together, or find an upcoming event and keep a place.",
    path: "/contact",
  });
}

/**
 * /contact — an invitation, then a form, then the way back to the programme.
 *
 * The page is the `contact` document's blocks (SPEC §E.1): the invitation,
 * details, form and portrait (components/sections/contact/ContactIntro.tsx,
 * where the notes on the page's composition now live) and the Deep Lilac
 * close (components/sections/ClosingCta.tsx).
 */
export default function ContactPage() {
  return <FixedPage slug="contact" />;
}
