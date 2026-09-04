import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { buildMetadata } from "@/lib/seo";

// TODO(content): final SEO title and description pending client copy.
export const metadata = buildMetadata({
  title: "About",
  description: "About Maison Palettia.",
  path: "/about",
});

export default function AboutPage() {
  return <PagePlaceholder title="About" phase="Phase 7" />;
}
