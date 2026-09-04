import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { buildMetadata } from "@/lib/seo";

// TODO(content): final SEO title and description pending client copy.
export const metadata = buildMetadata({
  title: "Journal",
  description: "Notes and stories from the Maison Palettia studio.",
  path: "/blog",
});

export default function BlogPage() {
  return <PagePlaceholder title="Journal" phase="Phase 9" />;
}
