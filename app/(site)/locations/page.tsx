import { FixedPage, pageMetadata } from "@/components/blocks/CmsPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { getLocalBusinessJsonLd } from "@/lib/jsonLd.server";

const DESCRIPTION =
  "Find Maison Palettia in the places you already love to visit — and come make something while you’re there.";

/*
  The description is the client's own sentence, the one the page opens on
  (PDF p06), so a search result promises what the page shows. It used to add
  "and the UAE destinations where the Maison has delivered creative workshops
  and activations" — a list the client had taken off this page, which left the
  snippet describing a section that no longer exists.
*/
export function generateMetadata() {
  return pageMetadata("locations", {
    title: "Locations",
    description: DESCRIPTION,
    path: "/locations",
  });
}

/**
 * /locations — where to find the Maison, and nothing else.
 *
 * The page is the `locations` document's blocks (SPEC §E.1): a page header
 * and the venues, drawn as one section by
 * components/sections/locations/LocationsBody.tsx, where the notes on its
 * shape (and on what the client asked to have removed) now live.
 */
export default async function LocationsPage() {
  /* The business and its current venue as structured data (lib/jsonLd.ts). */
  const jsonLd = await getLocalBusinessJsonLd(DESCRIPTION);
  return (
    <>
      <JsonLd data={jsonLd} />
      <FixedPage slug="locations" />
    </>
  );
}
