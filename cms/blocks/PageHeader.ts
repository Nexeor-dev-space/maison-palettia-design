import type { Block } from "payload";

import { brandCopyLink } from "@/cms/fields";

import { eyebrow, heading, pick, picture, standfirst, whenIs } from "./shared";

/**
 * `pageHeader` → components/sections/PageHeader.tsx. SPEC §E.1. The eyebrow +
 * display-heading opening of faq, gallery, locations, policies,
 * booking-status, events and private-events-book. The standfirst can be the
 * page's own sentence or one of two Brand wording lines the gallery and
 * locations pages already share.
 */
export const PageHeaderBlock: Block = {
  slug: "pageHeader",
  interfaceName: "PageHeaderBlock",
  labels: { singular: "Page header", plural: "Page headers" },
  admin: { group: "Page sections" },
  fields: [
    eyebrow(),
    heading(),
    pick(
      "standfirstSource",
      "Intro sentence comes from",
      [
        { label: "Typed below", value: "text" },
        { label: "Brand wording — “What this is” body", value: "openingStatementBody" },
        { label: "Brand wording — “Find us” line", value: "findUsLine" },
      ],
      { required: true, defaultValue: "text" },
    ),
    brandCopyLink({
      name: "openingStatementLink",
      path: "openingStatement.body",
      label: "“What this is” body",
      condition: whenIs("standfirstSource", "openingStatementBody"),
    }),
    brandCopyLink({ name: "findUsLineLink", path: "findUsLine", label: "“Find us” line", condition: whenIs("standfirstSource", "findUsLine") }),
    standfirst(240, { condition: whenIs("standfirstSource", "text") }),
    picture("sideImage", "Side photograph", { description: "Optional. The gallery header shows two." }),
    picture("sideImageSecondary", "Second side photograph"),
  ],
};
