import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { buildMetadata } from "@/lib/seo";

// TODO(content): final SEO title and description pending client copy.
export const metadata = buildMetadata({
  title: "Gallery",
  description: "A look inside the Maison Palettia studio.",
  path: "/gallery",
});

export default function GalleryPage() {
  return <PagePlaceholder title="Gallery" phase="Phase 8" />;
}
