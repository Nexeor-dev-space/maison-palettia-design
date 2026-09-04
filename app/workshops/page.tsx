import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { buildMetadata } from "@/lib/seo";

// TODO(content): final SEO title and description pending client copy.
export const metadata = buildMetadata({
  title: "Workshops",
  description: "Art, craft and pottery workshops at Maison Palettia.",
  path: "/workshops",
});

export default function WorkshopsPage() {
  return <PagePlaceholder title="Workshops" phase="Phase 5" />;
}
