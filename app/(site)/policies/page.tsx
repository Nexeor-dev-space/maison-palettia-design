import { FixedPage, pageMetadata } from "@/components/blocks/CmsPage";

export function generateMetadata() {
  return pageMetadata("policies", {
    title: "Policies",
    description:
      "The Maison Palettia studio policies: how sessions run, what we ask of visitors, and what happens if plans change.",
    path: "/policies",
  });
}

/**
 * /policies — the hub.
 *
 * A hub rather than one long document, which is the client's own structure.
 * The page is the `policies` document's blocks (SPEC §E.1): the masthead
 * (components/sections/PageHeader.tsx), the index of the `policies`
 * collection (components/sections/policies/PoliciesIndex.tsx, where the
 * reasoning for its shape now lives) and the Deep Lilac close
 * (components/sections/ClosingCta.tsx).
 */
export default function PoliciesPage() {
  return <FixedPage slug="policies" />;
}
