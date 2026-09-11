import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { buildMetadata } from "@/lib/seo";

// TODO(content): final SEO title and description pending client copy.
export const metadata = buildMetadata({
  title: "FAQ",
  description: "Answers to common questions about Maison Palettia events.",
  path: "/faq",
});

export default function FaqPage() {
  return <PagePlaceholder title="FAQ" phase="Phase 10" />;
}
