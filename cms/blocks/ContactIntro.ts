import type { Block } from "payload";

import { link } from "@/cms/fields";

import { eyebrow, heading, lead, picture, prose, row, text } from "./shared";

/**
 * `contactIntro` → components/sections/contact/{Invitation,Details,Portrait}.tsx
 * (contact). SPEC §E.1. The invitation, the details column (address, email,
 * phone and socials come from Site details) and the form's heading. The
 * form itself stays components/contact/ContactForm.tsx and posts to
 * /api/site/enquiries.
 */
export const ContactIntroBlock: Block = {
  slug: "contactIntro",
  interfaceName: "ContactIntroBlock",
  labels: { singular: "Contact — intro and details", plural: "Contact — intro and details" },
  admin: { group: "Page sections" },
  fields: [
    eyebrow({ defaultValue: "Contact" }),
    heading(),
    lead(320),
    text("findUsHeading", "Details heading", 24, { defaultValue: "Find Us" }),
    row([
      text("whereTerm", "“Where” term", 16, { defaultValue: "Where", width: "25%" }),
      text("emailTerm", "“Email” term", 16, { defaultValue: "Email", width: "25%" }),
      text("phoneTerm", "“Phone” term", 16, { defaultValue: "Phone", width: "25%" }),
      text("followTerm", "“Follow” term", 16, { defaultValue: "Follow", width: "25%" }),
    ]),
    text("venuesLinkLabel", "Venues link text", 48, { defaultValue: "Venues are listed with each event" }),
    link({ name: "venuesLink", label: "Venues link destination", defaultValue: { type: "internal", url: "/events" } }),
    text("formHeading", "Form heading", 24, { defaultValue: "Write to Us" }),
    prose("formLead", "Form lead", 200, {
      defaultValue: "A few lines is plenty. Tell us what you are after and we will come back to you.",
    }),
    picture("portrait", "Portrait photograph"),
  ],
};
