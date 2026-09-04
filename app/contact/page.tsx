import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { buildMetadata } from "@/lib/seo";

// TODO(content): final SEO title and description pending client copy.
export const metadata = buildMetadata({
  title: "Contact",
  description: "Get in touch with Maison Palettia.",
  path: "/contact",
});

export default function ContactPage() {
  return <PagePlaceholder title="Contact" phase="Phase 10" />;
}
