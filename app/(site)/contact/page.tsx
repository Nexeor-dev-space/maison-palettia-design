import { FixedPage, pageMetadata } from "@/components/blocks/CmsPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { getLocalBusinessJsonLd } from "@/lib/jsonLd.server";

const DESCRIPTION =
  "Ask the Maison about an event, a booking or working together, or find an upcoming event and keep a place.";

export function generateMetadata() {
  return pageMetadata("contact", {
    title: "Contact",
    description: DESCRIPTION,
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
export default async function ContactPage() {
  /* The business as structured data (lib/jsonLd.ts): who, where, how to
     reach — the page a search engine reads for exactly that. */
  const jsonLd = await getLocalBusinessJsonLd(DESCRIPTION);
  return (
    <>
      <JsonLd data={jsonLd} />
      <FixedPage slug="contact" />
    </>
  );
}
