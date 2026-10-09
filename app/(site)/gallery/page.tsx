import { FixedPage, pageMetadata } from "@/components/blocks/CmsPage";

export function generateMetadata() {
  return pageMetadata("gallery", {
    title: "Gallery",
    description:
      "Step inside Maison Palettia: what gets made here, the hands that make it, and the pieces that go home.",
    path: "/gallery",
  });
}

/**
 * /gallery — a walk through the Maison, not a photo grid.
 *
 * ==========================================================================
 * THE REVAMP, AND WHAT IT IS BUILT FROM
 * ==========================================================================
 *
 * The brief asked for the gallery to stop reading as "here are some pictures"
 * and start reading as "I am stepping into Maison Palettia's creative world":
 * a strong hero, art-directed collections rather than one uniform grid, beats
 * of copy between them, doodles at the seams, and a real image viewer.
 *
 * It is built ENTIRELY from imagery the project already holds and whose
 * provenance and alt text are already settled — the same rule the old wall
 * kept, and the reason there is no stock photography here.
 *
 * The page is the `gallery` document's blocks (SPEC §E.1): the masthead
 * (components/sections/PageHeader.tsx → <GalleryHeader>), the collections
 * (components/sections/gallery/GalleryBody.tsx, which says where each set
 * comes from) and the Deep Lilac close (components/sections/ClosingCta.tsx).
 */
export default function GalleryPage() {
  return <FixedPage slug="gallery" />;
}
