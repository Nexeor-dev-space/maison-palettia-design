import { TAGS } from "@/lib/cms/cache";
import { ageRowOf, toPolicy, type AgeRow, type AgeTables } from "@/lib/cms/mappers";
import { contentReader, findDocs } from "@/lib/cms/query";

/* ==========================================================================
   MAISON PALETTIA — THE STUDIO POLICIES
   ==========================================================================

   Source: "Maison Palettia - Policy.docx", supplied by the client 2026-10-05
   (client-feedback/), titled "Maison Palettia — Proposed Retail & Creative
   Studio Policies".

   ==========================================================================
   THAT DOCUMENT IS TWO DOCUMENTS, AND ONLY ONE OF THEM GOES ON A WEBSITE
   ==========================================================================

   It is written by an adviser TO the studio owner, so customer-facing policy
   prose sits interleaved with notes addressed to the business. The two read
   almost alike on the page and are nothing alike in what they commit the
   studio to, so the split is recorded here rather than left to judgement at
   the point of use.

   PUBLISHED — prose written in the studio's own voice, to a customer:
     "We understand that plans can change…", "Safety comes first at Maison
     Palettia…", "Customers are responsible for their personal belongings…".
     These are policy. They are reproduced as written, not paraphrased: a
     policy restated in nicer words is a different policy.

   NOT PUBLISHED — anything addressed to the owner. Six kinds of it:

     1. RECOMMENDATIONS. "I particularly like the management-discretion
        clause…", "I'd keep this separate from cancellations", "I would have
        a lawyer review this wording before publication", "I'd recommend
        excluding gift cards", "Suggested principles:", "This protects you
        without sounding unnecessarily harsh."

     2. OPEN QUESTIONS the studio has not answered. "For retail products,
        establish whether:" is not a refund policy, it is a list of decisions
        still to take. Publishing its bullets would be answering them on the
        studio's behalf. Same for "Also clarify whether discounts apply to:".

     3. EVERYTHING MARKED "COMING SOON" — sections 15 to 20, the whole of
        membership. The document says Coming Soon four times in their
        headings. A benefit published as current is a benefit owed.

     4. REMEDIES LISTED AS THE STUDIO'S OPTIONS. Section 9 lists "recreate
        the project / provide a replacement blank / offer a credit note" and
        then says the customer-facing version "can simply say that remedies
        are handled on a case-by-case basis". Printing the three turns the
        studio's discretion into the customer's entitlement, so the page says
        the sentence the document asked for instead.

     5. INTERNAL JUSTIFICATIONS. "This prevents one late customer from
        delaying everyone else" explains a rule to the owner; the rule itself
        is published without it.

     6. OPERATIONAL CHECKLISTS. The list of what a booking confirmation
        "should include" is an instruction to whoever builds the confirmation
        email. It is published here only because a customer reading it learns
        what to expect in writing — see the note on that section.

   ==========================================================================
   AND ONE THING THE DOCUMENT HAS THAT THE SITE MUST NOT TAKE FROM IT
   ==========================================================================

   The DIY list in section 2 includes CHARM BRACELET MAKING. It is not in
   lib/experiences.ts and it is not on this website. A policy page is not how
   an activity gets added to a catalogue — the price, the pictures, the
   description and the client's confirmation would all still be missing — so
   it is absent from {@link DIY_AGE_GUIDANCE} below and raised in the audit
   instead. The same test is why GLASS PAINTING keeps its age line: unlike the
   bracelets, it IS in the catalogue, carrying the site's own "Coming soon".

   ==========================================================================
   WHAT IS STILL MISSING, AND SO IS NOT HERE
   ==========================================================================

   The document's own section 25 proposes ten pages. Three of them have no
   content anywhere in it:

     Membership Terms ...... every membership section is "Coming Soon".
     Privacy Policy ........ named in the structure, never drafted.
     Terms & Conditions .... named in the structure, never drafted.

   None is stubbed. {@link LEGAL_NAV} in lib/constants.ts carries the note on
   why a footer link to a page that does not exist is worse than no link, and
   that reasoning is unchanged by the fact that someone has now listed the
   page's name.

   NO EFFECTIVE DATE is printed. The document carries none, and section 1
   makes the date operative — "the applicable policy will be the policy in
   effect at the time of the booking or purchase" — so a date invented here
   would be the one invented fact that the rest of the policy hangs on.
   ========================================================================== */

/** One run of prose, a list, or a run of age guidance. */
export type PolicyBlock =
  | { type: "text"; body: string }
  | { type: "list"; items: readonly string[] }
  | { type: "ages"; rows: readonly { activity: string; guidance: string }[] }
  /**
   * A short statement set apart from the prose around it. Used where the
   * document itself breaks out of the run — "Important for Ceramics and
   * Glass", "Every creation is uniquely yours" — and nowhere else, so the
   * emphasis on the page is the document's own and not an editor's.
   */
  | { type: "callout"; title: string; body: string };

export interface PolicySection {
  /** The section's own heading. Always a label, never a claim. */
  heading: string;
  blocks: readonly PolicyBlock[];
}

export interface Policy {
  slug: string;
  /** The page's title, as the footer and the hub both print it. */
  title: string;
  /** The short form, for the footer where the measure is tight. */
  navLabel: string;
  /** One line on the hub. Describes the page; never adds a rule to it. */
  summary: string;
  sections: readonly PolicySection[];
  /** Where it is listed (`footerGroup`): a footer column, or the Policies page only. */
  group?: PolicyGroup;
  /** `effectiveDate`, ISO, or null when the policy does not state one. */
  effectiveDate?: string | null;
}

/** `policies.footerGroup`. `none` is House rules: the Policies page lists it, the footer does not. */
export type PolicyGroup = "legal" | "support" | "none";

/** The groups in page order, with the headings the footer and the Policies page print. */
export const POLICY_GROUPS: readonly { key: PolicyGroup; title: string; inFooter: boolean }[] = [
  { key: "legal", title: "Legal & Policies", inFooter: true },
  { key: "support", title: "Customer Support", inFooter: true },
  { key: "none", title: "House rules", inFooter: false },
];

/** Policies by group, in group order, each group in `order`; an empty group is left out. */
export function groupPolicies(
  policies: readonly Policy[],
  { footerOnly = false }: { footerOnly?: boolean } = {},
): { key: PolicyGroup; title: string; policies: Policy[] }[] {
  return POLICY_GROUPS.filter((group) => !footerOnly || group.inFooter)
    .map((group) => ({
      key: group.key,
      title: group.title,
      policies: policies.filter((policy) => (policy.group ?? "none") === group.key),
    }))
    .filter((group) => group.policies.length > 0);
}

const EFFECTIVE = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", day: "numeric", month: "long", year: "numeric" });

const DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai", year: "numeric", month: "2-digit", day: "2-digit" });

/**
 * The effective date as printed — "27 November 2026" — and as `<time
 * dateTime>` — "2026-11-27" — both on the Dubai calendar (a date picked in
 * the admin is stored as that day's midnight in the editor's zone, in UTC).
 * Null for no date or an unreadable one.
 */
export function formatEffectiveDate(iso: string | null | undefined): { label: string; day: string } | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : { label: EFFECTIVE.format(date), day: DAY.format(date) };
}

/* --------------------------------------------------------------------------
   THE AGE GUIDANCE, ONCE

   Document section 2. It is read by the DIY policy and by Safety & Children,
   and it is the single most copy-and-pasteable thing in this file — an age
   written twice is an age that disagrees with itself the first time one of
   them is corrected — so it is defined here and referenced.

   CHARM BRACELET MAKING IS DELIBERATELY ABSENT. See the file header.
   -------------------------------------------------------------------------- */
export const DIY_AGE_GUIDANCE: readonly { activity: string; guidance: string }[] = [
  { activity: "Ceramic painting", guidance: "5 years and over. Ages 5–10 under the close supervision of a parent." },
  { activity: "Bedazzling", guidance: "Ages 5–10 for Mini Bedazzling. Age 11 and over for Creative Bedazzling." },
  { activity: "Tote bag painting", guidance: "Ages 5–10 for stencils and easy painting. Age 11 and over for creative designs." },
  { activity: "Glass painting", guidance: "Age 12 and over." },
  { activity: "Mandala painting", guidance: "Age 12 and over." },
];

/* --------------------------------------------------------------------------
   SCHEDULED WORKSHOP AGES

   Document section 3. Both match lib/workshops.ts in name; neither activity
   carried an age on this site before today, so there is nothing to disagree
   with — see the audit.
   -------------------------------------------------------------------------- */
export const WORKSHOP_AGE_GUIDANCE: readonly { activity: string; guidance: string }[] = [
  { activity: "Candle making", guidance: "Age 14 and over." },
  { activity: "Crocheting", guidance: "Age 14 and over." },
];

/* Fallback only — the `policies` collection (seeded from this array by 2B)
   is the source; see FROM THE CMS at the foot. Read only when the CMS cannot
   answer at all (a build without the database), and by the sync `getPolicy`. */
export const POLICIES: readonly Policy[] = [
  /* Regenerated from the published `policies` collection on 27 November 2026,
     when the legal pack (Terms & Conditions, Privacy, Cookie, Cancellation,
     Rescheduling & Refund, Retail Returns, Safety Guidelines, Service Delivery) was published
     and Cancellation & Rescheduling, Refund & Exchange and Safety & Children
     were withdrawn in its favour. Same order and wording as the CMS. */
  {
    slug: "terms-and-conditions",
    title: "Terms & Conditions",
    navLabel: "Terms & Conditions",
    summary: "The agreement between you and Maison Palettia when you use our website, book an experience or buy from us.",
    group: "legal",
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "About these terms",
        blocks: [
          { type: "text", body: "Welcome to Maison Palettia. These Terms & Conditions govern your use of our website (maisonpalettia.com), your bookings and purchases, and your participation in our creative experiences, whether you book online, through an approved booking platform or at our studio." },
          { type: "text", body: "By using our website, making a booking or buying any product or service from Maison Palettia, you agree to these Terms & Conditions and to the policies they refer to. Please read them before you pay. If you do not agree with them, please do not book or buy from us." },
          { type: "text", body: "In these terms, \"Maison Palettia\", \"we\", \"us\" and \"our\" mean Maison Palettia Events L.L.C., and \"you\" means the person using our website, making a booking or buying from us." },
        ],
      },
      {
        heading: "Who we are",
        blocks: [
          { type: "text", body: "Maison Palettia Events L.L.C. is a Limited Liability Company licensed by the Dubai Department of Economy and Tourism under Commercial Licence No. 1626148." },
          {
            type: "list",
            items: [
              "Address: Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates",
              "Email: info@maisonpalettia.com",
              "Call: +971 50 474 7762",
              "WhatsApp: +971 55 496 6116",
              "Website: maisonpalettia.com",
            ],
          },
          { type: "text", body: "Maison Palettia is a creative recreational space offering interactive creative activities, DIY experiences, guided workshops, craft products and related retail items. Our experiences are designed to encourage creativity, enjoyment and personal expression for individuals, families and groups." },
        ],
      },
      {
        heading: "Who can book",
        blocks: [
          {
            type: "list",
            items: [
              "You must be at least 18 years old, and able to enter into a binding agreement, to make a booking or a purchase on our website.",
              "Children and young people are welcome at many of our experiences, but their places must be booked by a parent, legal guardian or another responsible adult, who accepts these terms on their behalf.",
              "If you book for other people, you confirm that you are allowed to do so and that you will share these terms, and any age or safety guidance, with everyone in your booking.",
              "You are responsible for giving us accurate and complete contact and booking details, and for checking the date, time, experience and number of participants in your booking confirmation.",
            ],
          },
        ],
      },
      {
        heading: "Bookings and reservations",
        blocks: [
          {
            type: "list",
            items: [
              "Bookings may be made through our website, approved booking platforms or in person at our studio, subject to availability.",
              "When you go to payment, we hold your places for a short time while you pay and release them if the payment is not completed. An online booking is confirmed only once your payment has been successfully processed and we have sent you a booking confirmation.",
              "Session availability, durations and what is included vary by experience and are shown on each experience's page before you book.",
              "We may adjust session schedules, activities or arrangements where reasonably necessary. If a change materially affects your booking, the section \"If we cancel or change your booking\" in our Cancellation, Rescheduling & Refund Policy applies.",
              "Walk-in Create Anytime (DIY) activities do not need to be booked in advance. They are paid for and enjoyed in the studio, subject to available space and materials.",
            ],
          },
        ],
      },
      {
        heading: "Prices and payment",
        blocks: [
          {
            type: "list",
            items: [
              "All prices are shown in UAE Dirhams (AED) and include VAT where applicable, unless we clearly state otherwise.",
              "Online payments are processed securely by our payment provider, Mamo Pay, on its own secure payment page. You can pay with Visa or Mastercard credit and debit cards, and with any other payment method shown on the Mamo Pay payment page.",
              "Your card details are entered on Mamo Pay's page and handled by Mamo Pay. Maison Palettia never receives or stores your full card number or security code. We receive only the payment status, a transaction reference and limited details such as the type of card and its last four digits.",
              "Our merchant country is the United Arab Emirates and all online transactions are processed in AED. If your card was issued outside the UAE, your bank may apply its own exchange rate or foreign transaction fees, which are outside our control.",
              "Purchases in the studio can be paid for using the payment methods available there.",
              "Please keep a copy of your booking confirmation, invoice and transaction records for your own reference.",
            ],
          },
        ],
      },
      {
        heading: "Booking confirmation, e-tickets and invoices",
        blocks: [
          { type: "text", body: "As soon as your online payment is successful, we email you, at the address you gave at checkout:" },
          {
            type: "list",
            items: [
              "A booking confirmation with your booking reference and the details of your experience",
              "Your e-ticket or e-tickets, each with a unique QR code that we scan when you arrive",
              "Your invoice for the payment",
            ],
          },
          { type: "text", body: "You can show your e-ticket on your phone or on paper. If the email has not arrived within a few minutes, please check your spam or junk folder, then contact us and we will send it again." },
          { type: "text", body: "Walk-in DIY activities and studio purchases are paid for and delivered in the studio, and you receive your receipt at the time of purchase." },
        ],
      },
      {
        heading: "Cancellation, rescheduling and refunds",
        blocks: [
          { type: "text", body: "Please contact us as early as possible if your plans change. In summary:" },
          {
            type: "list",
            items: [
              "With at least 24 hours' notice before your session starts, you may reschedule to another available date or receive a credit note for the full amount you paid.",
              "We do not give cash or card refunds when you cancel a booking yourself. A cancellation made with enough notice is always settled with a credit note.",
              "With less than 24 hours' notice, or if you do not attend, the booking is non-refundable and no credit note is issued.",
              "If we cancel or materially change your booking, we will offer you a new date or a credit note, and a refund to your original payment method if you do not accept either, or where UAE consumer protection law requires it. Where we choose, we may instead refund you in full straight away.",
              "Group, private and special-event bookings and promotional offers may have their own conditions, which we will tell you before you pay.",
            ],
          },
          { type: "text", body: "The full rules are in our Cancellation, Rescheduling & Refund Policy at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds, which forms part of these terms." },
        ],
      },
      {
        heading: "Late arrivals",
        blocks: [
          {
            type: "list",
            items: [
              "Please arrive about 10 minutes before your session starts.",
              "Late arrival may reduce the time you have to complete your activity, as sessions finish at their scheduled time.",
              "Where scheduling, capacity or safety requires it, we may not be able to admit customers who arrive significantly late. A booking you cannot take part in because you arrived too late is treated as a no-show.",
              "We will always make reasonable efforts to accommodate late arrivals where we can.",
            ],
          },
        ],
      },
      {
        heading: "Activities and creative experiences",
        blocks: [
          {
            type: "list",
            items: [
              "Our activities are intended for recreational, creative and experiential purposes.",
              "Please follow the instructions given by Maison Palettia staff throughout your experience.",
              "Use materials, tools and equipment responsibly and only for their intended purpose.",
              "Some activities have age requirements, need additional supervision or call for specific safety precautions. These are shown on the experience's page and explained on the day.",
              "Handmade and creative work varies by nature, so individual results will differ. Minor variations in colour, texture, finish or appearance are part of handmade work and are not in themselves a defect.",
            ],
          },
        ],
      },
      {
        heading: "Children and parental responsibility",
        blocks: [
          {
            type: "list",
            items: [
              "Children taking part in an activity must meet the age requirement given for that activity.",
              "Parents, guardians or accompanying adults are responsible for supervising children where supervision is required.",
              "Maison Palettia staff facilitate creative experiences. They are not childcare providers.",
              "Please tell our staff about any safety concern or assistance a child needs before the activity starts.",
              "Children must follow the safety instructions throughout their experience.",
            ],
          },
          { type: "text", body: "Age and supervision guidance for each activity is set out in our Customer Safety & Activity Guidelines at maisonpalettia.com/policies/safety-guidelines." },
        ],
      },
      {
        heading: "Safety and materials",
        blocks: [
          {
            type: "list",
            items: [
              "Some activities involve materials such as paints, wax, glass, adhesives, embellishments, tools or other creative supplies.",
              "Please follow all safety instructions and use materials responsibly.",
              "Do not misuse, remove or damage our equipment, tools, furniture or materials.",
              "Report any incident, injury, spill or damage to a member of staff immediately.",
              "Maison Palettia takes reasonable measures to provide a safe and properly managed environment.",
            ],
          },
          { type: "text", body: "Please read our Customer Safety & Activity Guidelines at maisonpalettia.com/policies/safety-guidelines before your visit." },
        ],
      },
      {
        heading: "Your creations and collection",
        blocks: [
          {
            type: "list",
            items: [
              "You are responsible for your creation during the activity, with reasonable help from our staff.",
              "Some creations need drying, curing, firing, finishing or other processing before they are ready.",
              "We will tell you when and how to collect your creation where collection applies, and we ask you to follow those instructions.",
              "We make reasonable efforts to look after creations awaiting collection.",
            ],
          },
          { type: "text", body: "Collection periods, and what happens to creations that are not collected, are set out in Your Finished Projects at maisonpalettia.com/policies/finished-projects." },
        ],
      },
      {
        heading: "Retail products and DIY kits",
        blocks: [
          {
            type: "list",
            items: [
              "Product descriptions, availability and prices may change and are subject to availability.",
              "Use DIY kits, materials and products in line with the instructions supplied with them.",
              "Returns, exchanges and refunds of products are covered by our Retail Returns & Refund Policy at maisonpalettia.com/policies/retail-returns-and-refunds and by UAE consumer protection law.",
            ],
          },
        ],
      },
      {
        heading: "Passes, gift cards, vouchers and credit notes",
        blocks: [
          {
            type: "list",
            items: [
              "Passes, gift cards, vouchers, promotional codes and credit notes are subject to the terms stated when they are bought or issued, including their validity period and any restrictions.",
              "They can be redeemed only against bookings or purchases at Maison Palettia, subject to availability, and only within their validity period.",
              "A credit note is linked to the email address of the booking it was issued for, and each credit note can be used once.",
              "They cannot be exchanged for cash unless UAE law requires it.",
            ],
          },
        ],
      },
      {
        heading: "Pricing and description errors",
        blocks: [
          { type: "text", body: "We take care to make sure that prices and descriptions on our website are accurate. If we find an obvious error in the price or description of something you have booked or bought, we will contact you as soon as possible and let you choose between continuing at the correct price or cancelling for a full refund to your original payment method. We are not obliged to provide a booking or product at an obviously incorrect price." },
        ],
      },
      {
        heading: "Events beyond our control",
        blocks: [
          { type: "text", body: "We are not responsible for a delay or failure to provide a booking that is caused by events beyond our reasonable control, such as severe weather, power or utility failures, public health measures, instructions from the authorities or the closure of a venue." },
          { type: "text", body: "If this happens, we will tell you as soon as we can and treat your booking as cancelled or changed by us, so you will be offered a new date, a credit note or a refund as described in our Cancellation, Rescheduling & Refund Policy." },
        ],
      },
      {
        heading: "Photography and media",
        blocks: [
          { type: "text", body: "Maison Palettia may take photographs or videos of its premises, activities or events for promotional purposes." },
          { type: "text", body: "Identifiable images of customers are used for promotional or marketing purposes only with appropriate consent and in line with applicable privacy requirements. We always ask a parent or guardian before using an identifiable image of a child." },
          { type: "text", body: "Please contact us with any photography or media concern. See also our Photography & Media policy at maisonpalettia.com/policies/photography-and-media and our Privacy Policy at maisonpalettia.com/policies/privacy-policy." },
        ],
      },
      {
        heading: "Using our website",
        blocks: [
          {
            type: "list",
            items: [
              "Please use our website only for lawful purposes, such as finding out about our experiences, booking and managing your bookings.",
              "Do not try to gain unauthorised access to the website or its systems, introduce malicious code, or interfere with how the website works.",
              "We try to keep the website available and accurate, but we cannot guarantee that it will always be uninterrupted or free from errors.",
            ],
          },
        ],
      },
      {
        heading: "Website content and intellectual property",
        blocks: [
          { type: "text", body: "All website content, including branding, artwork, graphics, text, images, designs and other materials, is owned by or licensed to Maison Palettia, unless stated otherwise." },
          { type: "text", body: "Content may not be reproduced, distributed, modified or used commercially without our prior written permission. You may share links to our pages and keep copies of your own tickets and invoices for personal use." },
        ],
      },
      {
        heading: "Limitation of liability",
        blocks: [
          { type: "text", body: "Maison Palettia shall take reasonable measures to provide its experiences, products and services in a safe and professional manner." },
          { type: "text", body: "Customers are expected to exercise reasonable care, follow instructions and use materials and equipment responsibly." },
          { type: "text", body: "Nothing in these Terms & Conditions shall exclude or limit any liability that cannot legally be excluded or limited under applicable UAE laws." },
        ],
      },
      {
        heading: "Complaints",
        blocks: [
          { type: "text", body: "We want every visit to be a good one. If something has not gone as expected, please tell a member of our team during your visit so that we can try to put it right straight away." },
          { type: "text", body: "Otherwise, email us at info@maisonpalettia.com or call +971 50 474 7762 with your booking reference or proof of purchase and a short description of the problem. We aim to respond within 2 working days, and to resolve every complaint fairly and as quickly as we can." },
          { type: "text", body: "This does not affect your right to contact the relevant UAE consumer protection authority." },
        ],
      },
      {
        heading: "Sanctions",
        blocks: [
          { type: "text", body: "Maison Palettia will not trade with, or provide any services or products to, OFAC-sanctioned countries or persons, or any other person, entity or country subject to sanctions, in accordance with the laws of the United Arab Emirates and the requirements of our payment providers." },
          { type: "text", body: "We may refuse or cancel a booking or order, and refund any payment received, where we are required to do so." },
        ],
      },
      {
        heading: "Our other policies",
        blocks: [
          { type: "text", body: "These policies form part of these Terms & Conditions:" },
          {
            type: "list",
            items: [
              "Cancellation, Rescheduling & Refund Policy: maisonpalettia.com/policies/cancellation-rescheduling-and-refunds",
              "Privacy Policy: maisonpalettia.com/policies/privacy-policy",
              "Cookie Policy: maisonpalettia.com/policies/cookie-policy",
              "Customer Safety & Activity Guidelines: maisonpalettia.com/policies/safety-guidelines",
              "Retail Returns & Refund Policy: maisonpalettia.com/policies/retail-returns-and-refunds",
              "Service Delivery Policy: maisonpalettia.com/policies/service-delivery",
              "Our house rules for visits, DIY experiences, scheduled workshops, finished projects and photography: maisonpalettia.com/policies",
            ],
          },
          { type: "text", body: "If one of them conflicts with these Terms & Conditions, these Terms & Conditions apply. Nothing in any of them limits your rights under UAE consumer protection law." },
        ],
      },
      {
        heading: "Changes to these terms",
        blocks: [
          { type: "text", body: "We may update these Terms & Conditions from time to time. The updated version will be published on this page with its new effective date. The terms that apply to a booking or purchase are the ones in effect when you made it." },
        ],
      },
      {
        heading: "Governing law and jurisdiction",
        blocks: [
          { type: "text", body: "These Terms & Conditions, and any dispute arising from them or from a booking or purchase, are governed by the laws of the United Arab Emirates as applied in the Emirate of Dubai, and are subject to the jurisdiction of the competent courts of Dubai." },
          { type: "text", body: "If any part of these terms is found to be invalid or unenforceable, the rest of them remains in effect." },
        ],
      },
      {
        heading: "Contact us",
        blocks: [
          { type: "text", body: "For booking, product or policy enquiries, please contact us:" },
          { type: "text", body: "Maison Palettia Events L.L.C., Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates." },
          {
            type: "list",
            items: [
              "Email: info@maisonpalettia.com",
              "Call: +971 50 474 7762",
              "WhatsApp: +971 55 496 6116",
              "Website: maisonpalettia.com",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "cancellation-rescheduling-and-refunds",
    title: "Cancellation, Rescheduling & Refund Policy",
    navLabel: "Cancellation & Refunds",
    summary: "What happens if your plans change, or ours do, and how credit notes and refunds work.",
    group: "support",
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "About this policy",
        blocks: [
          { type: "text", body: "At Maison Palettia, we prepare materials, set up creative spaces and reserve time for every experience. This policy explains what happens if you need to cancel or reschedule a booking, what happens if we have to, and how credit notes and refunds work." },
          { type: "text", body: "It forms part of our Terms & Conditions at maisonpalettia.com/policies/terms-and-conditions." },
        ],
      },
      {
        heading: "At a glance",
        blocks: [
          {
            type: "list",
            items: [
              "24 hours' notice or more: reschedule to another available date, or receive a credit note for the full amount you paid.",
              "Less than 24 hours' notice, or a no-show: non-refundable, and no credit note is issued.",
              "Cancellations by customers are always settled with a credit note. We do not give cash or card refunds when you cancel.",
              "If we cancel or materially change your booking: a new date or a credit note, or a refund to your original payment method if neither suits you or where the law requires it.",
            ],
          },
        ],
      },
      {
        heading: "Booking confirmation",
        blocks: [
          { type: "text", body: "Your booking is confirmed once your payment has been successfully processed and we have emailed you your booking confirmation, e-tickets and invoice. These are sent straight after your payment goes through." },
          { type: "text", body: "Please check the date, time, experience and number of participants as soon as you receive them, and tell us straight away if anything is wrong. These cancellation and rescheduling terms are shown before you pay, and you agree to them at checkout." },
        ],
      },
      {
        heading: "How to cancel or reschedule",
        blocks: [
          { type: "text", body: "Please contact us as early as possible, quoting your booking reference:" },
          {
            type: "list",
            items: [
              "Email: info@maisonpalettia.com",
              "Call: +971 50 474 7762",
              "WhatsApp: +971 55 496 6116",
            ],
          },
          { type: "text", body: "Notice is counted from the time we receive your message to the start time of your session shown on your booking confirmation, in Dubai time." },
        ],
      },
      {
        heading: "Rescheduling",
        blocks: [
          {
            type: "list",
            items: [
              "With at least 24 hours' notice before your session starts, you may move your booking to another available date or time, at no extra charge.",
              "Rescheduling is subject to availability. If no suitable date is available, we will issue you a credit note for the full amount you paid instead.",
              "With less than 24 hours' notice, a booking cannot be rescheduled.",
            ],
          },
        ],
      },
      {
        heading: "Cancelling your booking",
        blocks: [
          {
            type: "list",
            items: [
              "With at least 24 hours' notice before your session starts, you will receive a credit note for the full amount you paid for the cancelled booking. Contact us as described above and our team will cancel the booking and issue your credit note.",
              "We do not give cash or card refunds for cancellations made by customers. A cancellation made in good time is always settled with a credit note.",
              "With less than 24 hours' notice, the booking is non-refundable and no credit note is issued.",
            ],
          },
        ],
      },
      {
        heading: "Late arrivals and no-shows",
        blocks: [
          {
            type: "list",
            items: [
              "Please arrive about 10 minutes before your session starts.",
              "If you arrive late, your activity time may be shorter, as sessions finish at their scheduled time, and we cannot always repeat the part you missed.",
              "If you do not attend without having told us at least 24 hours before the session, or arrive too late to take part, the booking is treated as a no-show.",
              "No-shows are non-refundable and no credit note is issued.",
            ],
          },
          { type: "text", body: "If something serious and unexpected stops you from attending, please contact us. Any exception is at our discretion." },
        ],
      },
      {
        heading: "If we cancel or change your booking",
        blocks: [
          { type: "text", body: "Occasionally we may need to cancel or materially change a session, for example because of an instructor's illness, a problem at the venue or events beyond our control. If this happens, we will tell you as soon as we can, using the contact details in your booking, and offer you:" },
          {
            type: "list",
            items: [
              "A new date or time, subject to availability; or",
              "A credit note for the full amount you paid.",
            ],
          },
          { type: "text", body: "If you do not wish to accept either option, or where UAE consumer protection law requires it, we will refund the full amount you paid to your original payment method." },
          { type: "text", body: "Where we choose, for example when a whole session is cancelled, we may instead refund the full amount you paid to your original payment method straight away, and we will tell you so in our message." },
        ],
      },
      {
        heading: "How credit notes work",
        blocks: [
          {
            type: "list",
            items: [
              "Our team issues your credit note for the full amount you paid for the cancelled booking and sends it to the email address on your booking, with a unique code and its validity period.",
              "For a booking of more than one place, the amount is split into one credit note per place, each with its own code.",
              "You can redeem a credit note against a future booking or purchase at Maison Palettia, online by entering its code at checkout or in the studio, within the validity period stated on it.",
              "Each credit note can be used once, and one code can be used per booking. If the new booking costs more, you pay the difference; if it costs less, the unused balance is not carried over.",
              "It is linked to the email address of the original booking.",
              "It is not exchangeable for cash unless UAE law requires it. A credit note not used by the end of its validity period expires.",
            ],
          },
        ],
      },
      {
        heading: "When a refund applies",
        blocks: [
          {
            type: "list",
            items: [
              "Refunds apply where we cancel or materially change a booking and you do not accept a new date or a credit note, or we choose to refund you straight away, where we make a pricing error, or where UAE consumer protection law requires a refund.",
              "Refunds are made in AED to the original payment method, through Mamo Pay for online payments. We cannot refund to a different card or account.",
              "We process approved refunds as soon as possible. Depending on your bank or card issuer, a refund can take 5 to 10 working days to appear on your statement.",
              "We are not responsible for exchange-rate differences or fees charged by your bank.",
              "When a refund is processed, we email you a confirmation, with a document recording the refund for your records. That document is an accounting record of the refund, not store credit.",
            ],
          },
        ],
      },
      {
        heading: "Create Anytime (DIY) walk-ins",
        blocks: [
          {
            type: "list",
            items: [
              "Walk-in DIY activities are paid for in the studio.",
              "Once materials have been prepared or your project has been started, a DIY activity is non-refundable.",
              "Changing to a different project after you have started may be subject to an additional charge.",
            ],
          },
        ],
      },
      {
        heading: "Special events, private and group bookings",
        blocks: [
          { type: "text", body: "Private events, corporate bookings, parties, group bookings, special events and promotional offers may carry their own conditions, such as deposits, minimum numbers or different notice periods. We will tell you those conditions before you confirm and pay, and where they differ from this policy, the conditions given for that booking apply." },
        ],
      },
      {
        heading: "Your statutory rights",
        blocks: [
          { type: "text", body: "Nothing in this policy limits any right you have under UAE consumer protection law." },
        ],
      },
      {
        heading: "Contact us",
        blocks: [
          { type: "text", body: "To cancel or reschedule, or with any question about this policy, please contact us:" },
          { type: "text", body: "Maison Palettia Events L.L.C., Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates." },
          {
            type: "list",
            items: [
              "Email: info@maisonpalettia.com",
              "Call: +971 50 474 7762",
              "WhatsApp: +971 55 496 6116",
              "Website: maisonpalettia.com",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    navLabel: "Privacy Policy",
    summary: "What we collect when you browse or book, why, who sees it, and how to change or delete it.",
    group: "legal",
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "Who we are",
        blocks: [
          { type: "text", body: "Maison Palettia respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, share and protect personal information when you visit our website, make a booking, buy a product or otherwise deal with us." },
          { type: "text", body: "Maison Palettia Events L.L.C. (\"Maison Palettia\", \"we\", \"us\"), a Limited Liability Company licensed by the Dubai Department of Economy and Tourism under Commercial Licence No. 1626148, runs creative art and craft experiences in Dubai, United Arab Emirates. We are the controller responsible for the personal data described in this policy." },
          {
            type: "list",
            items: [
              "Address: Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates",
              "Email: info@maisonpalettia.com",
              "Call: +971 50 474 7762",
              "WhatsApp: +971 55 496 6116",
              "Website: maisonpalettia.com",
            ],
          },
          { type: "text", body: "We follow the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021). We also offer the rights described under \"Your rights\" to every customer, wherever they live." },
        ],
      },
      {
        heading: "Information we collect",
        blocks: [
          { type: "text", body: "When you book an experience, buy a pass, or use a pass, voucher or credit note:" },
          {
            type: "list",
            items: [
              "Your first and last name, email address and mobile number",
              "What you booked: the experience, the date, how many places, and the names on the tickets",
              "Your payment status, transaction references, invoices, refunds, credit notes and any pass balance",
              "Notes you add to your booking, such as allergies, accessibility needs or a celebration we should know about",
              "Whether you agreed to receive news and offers from us, and which versions of our terms and policies you agreed to at checkout",
            ],
          },
          { type: "text", body: "When you send an enquiry (private events, corporate bookings, general questions) or join a waitlist: your name, email address and phone number, and anything you tell us in your message." },
          { type: "text", body: "When you sign in to see your bookings: your email address, and a record of the one-time sign-in link we email you." },
          { type: "text", body: "When you buy something in the studio: the details of your purchase and, if you give them to us, your name and contact details." },
          { type: "text", body: "When you visit the website: which pages you viewed, which website sent you here, your device type, your browser and your country. Your IP address is used only to create the anonymous daily code described under \"Cookies and website technologies\" and to protect the website from abuse, and is never stored in readable form." },
          { type: "text", body: "We collect only the information we reasonably need to run our studio and provide our services." },
          { type: "callout", title: "We never see your card", body: "Online payments are handled by Mamo Pay on its own secure payment page. Your full card number and security code never reach our systems." },
        ],
      },
      {
        heading: "How we use your information",
        blocks: [
          {
            type: "list",
            items: [
              "To deliver your booking. This covers confirming your place, sending your e-tickets and invoice, reminding you before your session, checking you in on the day, and handling rescheduling, cancellations, credit notes and refunds. We need this information to fulfil our agreement with you.",
              "To process payments and purchases, and to prevent fraud.",
              "To answer you. When you send an enquiry or join a waitlist, we use your details to reply and to offer you a place if one opens up.",
              "To keep proper records. UAE tax law requires us to keep invoices and payment records, and we keep records of the terms you agreed to.",
              "To keep the studio safe. We use the notes you give us about allergies, age or accessibility needs to plan your session, and we protect our customers, staff and premises.",
              "To improve our website, services and customer experience. We use visit statistics to understand which pages help people and which don't.",
              "To send news and offers, only if you said yes. We email you about new experiences and offers only if you ticked the box to receive them. Every such email has an unsubscribe link.",
              "To meet our legal, regulatory, accounting and tax obligations.",
            ],
          },
          { type: "text", body: "We do not sell your personal data. We do not use it for automated decisions that have legal or similarly significant effects on you." },
        ],
      },
      {
        heading: "Payment information",
        blocks: [
          { type: "text", body: "Online payments are processed by our payment provider, Mamo Pay. You enter your card details on Mamo Pay's secure payment page, and Mamo Pay handles them under its own security and privacy practices." },
          { type: "text", body: "We receive the payment status, the amount, a transaction reference and limited card details, such as the type of card, the last four digits and whether it was issued in the UAE, so that we can confirm your booking, issue your invoice and process any refund. We do not store complete card details on our systems." },
        ],
      },
      {
        heading: "Who we share it with",
        blocks: [
          { type: "text", body: "We share personal data only with the service providers that help us run the studio, and only as much as each one needs:" },
          {
            type: "list",
            items: [
              "Mamo Pay: processes online payments and refunds.",
              "Resend: delivers our emails, including booking confirmations, e-tickets, invoices, reminders and, for those who opted in, news and offers.",
              "Our website hosting and cloud storage providers: run the website and store its database and files securely on our behalf.",
              "Google, Meta and Microsoft: only if you accept the cookie banner (see \"Cookies and website technologies\").",
              "WhatsApp (Meta): if you choose to contact us on WhatsApp, that conversation is handled under WhatsApp's terms.",
              "Professional advisers, such as accountants, auditors and lawyers, where we need their advice.",
            ],
          },
          { type: "text", body: "We may also share information when the law requires it, for example with UAE tax or other authorities, or to protect our customers, staff or studio. Any sharing is limited to what is reasonably necessary and handled in line with applicable data protection requirements." },
        ],
      },
      {
        heading: "Marketing communications",
        blocks: [
          { type: "text", body: "We send news, offers and updates about new experiences and events only where you have agreed to receive them and the law allows. You can opt out at any time with the unsubscribe link in any marketing email, or by contacting us." },
          { type: "text", body: "We will still send you messages about your bookings and purchases, such as confirmations, e-tickets, reminders and changes, because they are part of the service you asked for." },
        ],
      },
      {
        heading: "Cookies and website technologies",
        blocks: [
          { type: "text", body: "Our own visitor statistics use no cookies. We count visits on our own server. We never store your IP address or browser details. Instead, they are turned into a one-way code that changes every day, so a visitor cannot be followed from one day to the next. If your browser sends a \"Do Not Track\" or Global Privacy Control signal, we respect it." },
          { type: "text", body: "Optional analytics and advertising tools load only if you accept them in the cookie banner. Depending on the tools we use at the time, these may include:" },
          {
            type: "list",
            items: [
              "Google Analytics 4 (Google): measures how visitors use the site. Sets cookies such as _ga.",
              "Meta Pixel (Meta Platforms): measures how our Instagram and Facebook adverts perform. Sets cookies such as _fbp.",
              "Microsoft Clarity (Microsoft): records anonymised page interactions such as clicks and scrolling, so we can find confusing parts of the site. Sets cookies such as _clck.",
            ],
          },
          { type: "text", body: "These providers handle the data under their own privacy policies. If you decline, none of them load, and they never load on our checkout, payment and booking pages. To change your choice, clear this website's cookies and site data in your browser settings, and the banner will ask you again." },
          { type: "text", body: "Your browser also stores:" },
          {
            type: "list",
            items: [
              "Your basket and the checkout details you've typed. These are kept only while the tab is open and cleared when you close it.",
              "Your cookie banner choice, so we don't ask you again.",
              "If you sign in to see your bookings, a secure sign-in cookie that keeps you signed in for up to 30 days.",
            ],
          },
          { type: "text", body: "Full details are in our Cookie Policy at maisonpalettia.com/policies/cookie-policy." },
        ],
      },
      {
        heading: "Keeping it safe",
        blocks: [
          { type: "text", body: "We use reasonable technical and organisational measures to protect your personal information. Access to customer data is limited to the staff who need it, and every account is password-protected. Tickets carry signed QR codes, so they can't be forged. IP addresses are stored only as one-way codes, never in readable form." },
          { type: "text", body: "No internet transmission or electronic storage system can be guaranteed to be completely secure, but if we ever learn of a breach that affects you, we'll tell you and the relevant authorities as the law requires." },
        ],
      },
      {
        heading: "How long we keep it",
        blocks: [
          {
            type: "list",
            items: [
              "Bookings, invoices and payment records: at least five years, as UAE tax law requires.",
              "Copies of the emails we send you: cleared after 30 days. We keep a record that each email was sent with your booking.",
              "Detailed website visit records: 90 days. After that we keep only anonymous daily totals.",
              "Enquiries and waitlist requests: for as long as we need them to answer you, arrange your booking or event and deal with any follow-up.",
              "Your marketing preference: until you unsubscribe or ask us to delete it.",
            ],
          },
          { type: "text", body: "Otherwise, we keep personal information only for as long as reasonably necessary for the purposes in this policy, including customer support, legal compliance and accounting." },
        ],
      },
      {
        heading: "Your rights",
        blocks: [
          { type: "text", body: "Subject to applicable law, you can ask us to:" },
          {
            type: "list",
            items: [
              "Give you a copy of the personal data we hold about you, and information about how we use it",
              "Correct anything that's wrong or incomplete",
              "Delete your data, unless we're legally required to keep it (for example, invoices)",
              "Stop or limit how we use it, or object to a particular use",
              "Send your data to you, or to another organisation, in a common format",
              "Stop marketing emails. You can also use the unsubscribe link in any of them.",
              "Withdraw consent you've given, such as for cookies or marketing. Withdrawing consent doesn't affect anything we did before.",
            ],
          },
          { type: "text", body: "To use any of these rights, contact us using the details below. We may ask you to confirm your identity first, and we'll reply within 30 days." },
        ],
      },
      {
        heading: "Children",
        blocks: [
          { type: "text", body: "Many of our experiences welcome children, subject to their age requirements and supervision by a parent or guardian, but bookings must be made by a parent, guardian or other adult. If a child's name appears on a ticket, it is because the booking adult gave it to us. We use it only to run that session." },
          { type: "text", body: "We do not knowingly collect personal data directly from anyone under 18, and we handle children's information in line with UAE data protection requirements. Photographs taken at our experiences are covered separately in our Photography & Media policy at maisonpalettia.com/policies/photography-and-media." },
        ],
      },
      {
        heading: "Third-party websites",
        blocks: [
          { type: "text", body: "Our website links to services run by others, such as Mamo Pay's payment page, WhatsApp, Instagram and other social networks, and online maps. We are not responsible for their privacy practices, so please read their own policies when you use them." },
        ],
      },
      {
        heading: "Data stored outside the UAE",
        blocks: [
          { type: "text", body: "Some of the providers above process or store data outside the United Arab Emirates. When that happens, we rely on the safeguards the PDPL allows, such as the provider's contractual data protection commitments, so that your data stays protected to the standard this policy describes." },
        ],
      },
      {
        heading: "Changes to this policy",
        blocks: [
          { type: "text", body: "We may update this policy when our services or the law change. The effective date on this page shows when it last changed. If we make a significant change, we'll show a notice on the website or email customers who have booked with us." },
        ],
      },
      {
        heading: "Contact us",
        blocks: [
          { type: "text", body: "For questions about this policy or your data, or to use any of your rights, please contact us:" },
          { type: "text", body: "Maison Palettia Events L.L.C., Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates." },
          {
            type: "list",
            items: [
              "Email: info@maisonpalettia.com",
              "Call: +971 50 474 7762",
              "WhatsApp: +971 55 496 6116",
              "Website: maisonpalettia.com",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "cookie-policy",
    title: "Cookie Policy",
    navLabel: "Cookie Policy",
    summary: "The cookies and browser storage our website uses, why we use them, and how you can control them.",
    group: "legal",
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "What cookies are",
        blocks: [
          { type: "text", body: "Cookies are small text files that a website saves on your device. Websites can also keep small amounts of information in your browser's own storage, known as local storage and session storage. This policy covers both, and calls them cookies and similar technologies." },
          { type: "text", body: "It explains what our website at maisonpalettia.com uses and how you can control it. Please read it together with our Privacy Policy at maisonpalettia.com/policies/privacy-policy." },
          { type: "callout", title: "Nothing optional without your say-so", body: "We use only what the website needs to work, and our own visitor statistics use no cookies at all. Optional analytics tools load only after you accept them, and never on our checkout, payment and booking pages." },
        ],
      },
      {
        heading: "Strictly necessary",
        blocks: [
          { type: "text", body: "These make the website work. They do not track you, and they are not affected by the cookie banner." },
          {
            type: "list",
            items: [
              "Your booking basket and the details you type at checkout (session storage). Kept only while the tab is open and cleared when you close it.",
              "The email address you used to look up a booking on the Check a booking page (session storage), for that tab only.",
              "Your cookie choice (local storage, mp_consent). Remembers whether you accepted or declined optional analytics, so we do not ask on every page. Kept until you clear this website's data in your browser.",
              "Booking sign-in (cookie __Host-mp_session). Set only if you sign in from an emailed link to see your bookings. Keeps you signed in for up to 30 days, is sent only over a secure connection and cannot be read by scripts on the page.",
              "Staff sign-in and preview (cookies such as payload-token). Used only by Maison Palettia staff who sign in to manage the website.",
            ],
          },
        ],
      },
      {
        heading: "Preferences",
        blocks: [
          {
            type: "list",
            items: [
              "Background music (session storage). Remembers, for the current tab only, whether you paused the music and where the track had reached, so it does not restart on every page.",
            ],
          },
        ],
      },
      {
        heading: "Our own visitor statistics (no cookies)",
        blocks: [
          { type: "text", body: "We count visits on our own server, without cookies and without storing anything on your device. Your IP address and browser details are turned into a one-way code that changes every day, so a visitor cannot be followed from one day to the next, and they are never stored in readable form." },
          { type: "text", body: "We record which page was viewed, the website that sent you, your device type, browser and country. Detailed records are kept for 90 days, after which only anonymous daily totals remain. Visits to our checkout, payment and booking-status pages are never recorded. On a booking page we count only that the page was viewed, never anything you type into it. If your browser sends a \"Do Not Track\" or Global Privacy Control signal, your visit is not counted." },
        ],
      },
      {
        heading: "Optional analytics and marketing",
        blocks: [
          { type: "text", body: "These load only if you click Accept in the cookie banner. Depending on the tools we use at the time, they may include:" },
          {
            type: "list",
            items: [
              "Google Analytics 4 (Google): measures how visitors use the site. Sets cookies such as _ga and _ga_ followed by an ID, kept for up to 2 years.",
              "Microsoft Clarity (Microsoft): records anonymised page interactions such as clicks and scrolling, so we can find confusing parts of the site. Sets cookies such as _clck (up to 1 year) and _clsk (1 day).",
              "Meta Pixel (Meta Platforms): measures how our Instagram and Facebook adverts perform. Sets cookies such as _fbp, kept for up to 3 months.",
            ],
          },
          { type: "text", body: "These providers handle the data under their own privacy policies. If you click Decline, or do not answer, none of them load. They never load on our checkout, payment and booking pages, even if you accepted." },
        ],
      },
      {
        heading: "Changing your choice",
        blocks: [
          { type: "text", body: "When the banner first appears you can choose Accept or Decline. Both are equally easy, and the website works fully either way." },
          { type: "text", body: "To change your mind later, clear this website's cookies and site data in your browser settings. The banner will appear again on your next visit and you can choose afresh. Clearing site data also removes any cookies the optional tools had set on our website." },
          { type: "text", body: "You can also block or delete cookies through your browser settings, or use private browsing. If you block strictly necessary storage, parts of the website, such as booking and checkout, may not work." },
        ],
      },
      {
        heading: "Third-party services",
        blocks: [
          {
            type: "list",
            items: [
              "When you pay online, you leave our website for Mamo Pay's secure payment page. Mamo Pay uses its own cookies to process your payment securely and prevent fraud, under its own policies.",
              "Our location maps are drawn from map images supplied by OpenFreeMap, which your browser requests directly, so OpenFreeMap receives your IP address to deliver them.",
              "Links to WhatsApp, Instagram, Facebook, TikTok, Pinterest, LinkedIn and Google Maps take you to those services, which use their own cookies under their own policies.",
            ],
          },
        ],
      },
      {
        heading: "Changes to this policy",
        blocks: [
          { type: "text", body: "We will update this policy if we change the cookies or tools our website uses. The effective date on this page shows when it last changed." },
        ],
      },
      {
        heading: "Contact us",
        blocks: [
          { type: "text", body: "For any question about cookies or this policy, please contact us:" },
          { type: "text", body: "Maison Palettia Events L.L.C., Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates." },
          {
            type: "list",
            items: [
              "Email: info@maisonpalettia.com",
              "Call: +971 50 474 7762",
              "WhatsApp: +971 55 496 6116",
              "Website: maisonpalettia.com",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "retail-returns-and-refunds",
    title: "Retail Returns & Refund Policy",
    navLabel: "Retail Returns",
    summary: "Returns, exchanges and refunds for products bought from our studio, including craft kits and gifts.",
    group: "support",
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "What this policy covers",
        blocks: [
          { type: "text", body: "This policy applies to retail purchases from Maison Palettia, including craft kits, handmade gifts, souvenirs, candles, home décor, DIY materials and other products bought in our studio." },
          { type: "text", body: "Bookings for experiences and workshops are covered by our Cancellation, Rescheduling & Refund Policy at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds." },
        ],
      },
      {
        heading: "Before you buy",
        blocks: [
          { type: "text", body: "Products are subject to availability. Please inspect products and read their descriptions before you buy, and ask our team if you have any question about a product." },
        ],
      },
      {
        heading: "Damaged or defective products",
        blocks: [
          {
            type: "list",
            items: [
              "If a product is damaged, defective or not as described, please contact us as soon as reasonably possible after you notice the problem.",
              "Bring the product to the studio, or send us clear photos of the problem, together with your proof of purchase.",
              "Once we have assessed it, we will provide an appropriate remedy in line with the UAE Consumer Protection Law (Federal Law No. 15 of 2020), such as a repair, a replacement, an exchange or a refund to your original payment method, depending on the problem and what the law requires.",
              "For a damaged or defective product, you will never be asked to accept a credit note in place of a remedy you are entitled to by law.",
            ],
          },
        ],
      },
      {
        heading: "Returns and exchanges for a change of mind",
        blocks: [
          {
            type: "list",
            items: [
              "We are not obliged to accept returns of products that are not damaged or defective, but we will consider a change-of-mind return or exchange if you contact us as soon as possible after your purchase.",
              "The product must be unused and in its original condition and packaging, and returned with your proof of purchase.",
              "Accepted change-of-mind returns are settled with an exchange or a credit note for the amount you paid. They are not refunded in cash or to your card.",
              "Personalised or custom-made items, products that have been used, DIY kits and materials that have been opened, candles that have been lit, and items sold as final sale cannot be returned for a change of mind.",
            ],
          },
        ],
      },
      {
        heading: "Proof of purchase",
        blocks: [
          { type: "text", body: "We may ask for your receipt, invoice or other proof of purchase before we process a return, exchange or refund. Without it, we may not be able to help." },
        ],
      },
      {
        heading: "Handmade and creative products",
        blocks: [
          { type: "text", body: "Handmade and creative products vary by nature. Minor variations in colour, texture, finish or appearance are part of their character and are not in themselves a defect." },
        ],
      },
      {
        heading: "DIY kits and materials",
        blocks: [
          { type: "text", body: "Please use DIY kits and materials only as intended, following the instructions and safety guidance supplied with them. The finished result depends on your own work, so a result that differs from the example shown is not a defect." },
        ],
      },
      {
        heading: "Refunds and credit notes",
        blocks: [
          {
            type: "list",
            items: [
              "Where a refund is due, it is made in AED to the original payment method. Card refunds can take 5 to 10 working days to appear on your statement, depending on your bank.",
              "A credit note can be redeemed against future bookings or purchases at Maison Palettia within the validity period stated on it, and is not exchangeable for cash unless UAE law requires it.",
            ],
          },
        ],
      },
      {
        heading: "Your statutory rights",
        blocks: [
          { type: "text", body: "Nothing in this policy limits your rights under the UAE Consumer Protection Law (Federal Law No. 15 of 2020) and its implementing regulations." },
        ],
      },
      {
        heading: "Contact us",
        blocks: [
          { type: "text", body: "For any question about a product, a return or a refund, please contact us:" },
          { type: "text", body: "Maison Palettia Events L.L.C., Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates." },
          {
            type: "list",
            items: [
              "Email: info@maisonpalettia.com",
              "Call: +971 50 474 7762",
              "WhatsApp: +971 55 496 6116",
              "Website: maisonpalettia.com",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "safety-guidelines",
    title: "Customer Safety & Activity Guidelines",
    navLabel: "Safety Guidelines",
    summary: "How we keep the studio safe, what we ask of every participant, and the age and supervision each activity needs.",
    group: "support",
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "Safety comes first",
        blocks: [
          { type: "text", body: "Maison Palettia is committed to providing a welcoming, enjoyable and safe creative environment. Our activities are for recreational and creative enjoyment, and we ask every participant to follow staff instructions and use materials and equipment responsibly." },
          { type: "text", body: "Running, unsafe use of equipment, intentional misuse of materials, or behaviour that could endanger another customer or team member is not permitted. Maison Palettia reserves the right to stop participation where a customer does not follow reasonable safety instructions." },
        ],
      },
      {
        heading: "Your responsibilities as a participant",
        blocks: [
          {
            type: "list",
            items: [
              "Follow the instructions given by Maison Palettia staff.",
              "Use tools, equipment and materials only for their intended purpose.",
              "Help keep the environment safe and respectful for everyone.",
              "Avoid interfering with other participants' activities or creations.",
              "Report any accident, injury, spill or damage to a member of staff immediately.",
              "Follow any safety requirements specific to your activity.",
            ],
          },
        ],
      },
      {
        heading: "Materials and equipment",
        blocks: [
          { type: "text", body: "Activities may involve paints, adhesives, wax, glass, embellishments, craft tools or other materials. Please follow the instructions and precautions given for each one." },
          {
            type: "list",
            items: [
              "Materials must not be eaten, swallowed or misused, or applied to the skin or body, unless an activity specifically intends it and our staff have approved it.",
              "Hot wax, heating equipment, glass and sharp tools are used only in the way our staff show you.",
              "Please do not bring your own craft materials, chemicals, paints or fragrances into the studio without our prior approval.",
              "Finished items such as candles should be allowed to cool and set for the time we recommend before you use them.",
            ],
          },
        ],
      },
      {
        heading: "Children and supervision",
        blocks: [
          {
            type: "list",
            items: [
              "Children must meet the age requirement for each activity. Please check the age guidance before you book or visit.",
              "For activities that need adult supervision, the parent or legal guardian is responsible for supervising the child throughout the session and making sure the child follows our safety instructions.",
              "Our staff are creative experience facilitators, not childcare providers.",
              "Please tell our staff about any safety concern or assistance a child needs before the activity starts.",
            ],
          },
        ],
      },
      {
        heading: "Age guidance",
        blocks: [
          { type: "text", body: "Create Anytime activities: children below the age of 10 may take part under adult supervision only." },
          { type: "ages", rows: DIY_AGE_GUIDANCE },
          { type: "text", body: "Create Together workshops:" },
          { type: "ages", rows: WORKSHOP_AGE_GUIDANCE },
        ],
      },
      {
        heading: "Allergies and sensitivities",
        blocks: [
          {
            type: "list",
            items: [
              "Please tell our staff about any allergy, sensitivity or medical condition that could be affected by the materials before you take part.",
              "Avoid handling any material that may cause you an adverse reaction.",
              "Ask our staff for help or an alternative if you are unsure about a material.",
            ],
          },
        ],
      },
      {
        heading: "Personal belongings",
        blocks: [
          { type: "text", body: "You are responsible for your personal belongings during your visit. We take reasonable measures to look after our space, but we cannot guarantee the security of personal belongings, so please keep valuables with you and avoid bringing fragile items into the activity area." },
        ],
      },
      {
        heading: "Respect for the space",
        blocks: [
          { type: "text", body: "Please treat our premises, equipment, furniture, materials, staff and other participants with care and respect." },
          { type: "text", body: "Maison Palettia may step in where behaviour creates a safety concern or materially disrupts an experience, including by stopping an activity or asking a customer to leave, always fairly and in line with applicable law." },
        ],
      },
      {
        heading: "Contact us",
        blocks: [
          { type: "text", body: "If you have a safety question before your visit, please contact us:" },
          { type: "text", body: "Maison Palettia Events L.L.C., Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates." },
          {
            type: "list",
            items: [
              "Email: info@maisonpalettia.com",
              "Call: +971 50 474 7762",
              "WhatsApp: +971 55 496 6116",
              "Website: maisonpalettia.com",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "service-delivery",
    title: "Service Delivery Policy",
    navLabel: "Service Delivery",
    summary: "How and when you receive your booking confirmation, e-tickets and invoice after you pay online.",
    group: "support",
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "What we deliver",
        blocks: [
          { type: "text", body: "Maison Palettia sells creative experiences, such as scheduled workshops and DIY sessions, and products bought in our studio. We do not currently ship products. An online booking is delivered to you electronically, as described below, and the experience itself takes place at our studio on the date and time you booked." },
        ],
      },
      {
        heading: "When you receive your booking",
        blocks: [
          { type: "text", body: "As soon as your online payment is successful, we email you, at the address you gave at checkout:" },
          {
            type: "list",
            items: [
              "A booking confirmation with your booking reference and the details of your experience",
              "Your e-ticket or e-tickets, each with a unique QR code that we scan when you arrive",
              "Your invoice for the payment",
            ],
          },
          { type: "text", body: "There is no delivery charge. Prices are in UAE Dirhams (AED) and online payments are processed by our payment provider, Mamo Pay." },
        ],
      },
      {
        heading: "If your email has not arrived",
        blocks: [
          { type: "text", body: "Please check your spam or junk folder first. If the email is not there within a few minutes of paying, contact us with your name and the email address you used, and we will send it again. You can also look up your booking on our website with your booking reference and email address." },
        ],
      },
      {
        heading: "On the day",
        blocks: [
          { type: "text", body: "Show your e-ticket on your phone or on paper when you arrive, and please arrive about 10 minutes before your session starts. Late arrivals are covered by our Terms & Conditions at maisonpalettia.com/policies/terms-and-conditions." },
        ],
      },
      {
        heading: "Walk-ins and studio purchases",
        blocks: [
          { type: "text", body: "Walk-in DIY activities and products bought in the studio are paid for and handed over in the studio, and you receive your receipt at the time of purchase." },
        ],
      },
      {
        heading: "Changes and cancellations",
        blocks: [
          { type: "text", body: "If we need to change or cancel your booking, we will contact you using the details in your booking. Your options, and what happens if you need to change your plans, are set out in our Cancellation, Rescheduling & Refund Policy at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds." },
        ],
      },
      {
        heading: "Contact us",
        blocks: [
          { type: "text", body: "If anything about the delivery of your booking is not right, please contact us:" },
          { type: "text", body: "Maison Palettia Events L.L.C., Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates." },
          {
            type: "list",
            items: [
              "Email: info@maisonpalettia.com",
              "Call: +971 50 474 7762",
              "WhatsApp: +971 55 496 6116",
              "Website: maisonpalettia.com",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "general-customer-policy",
    title: "General Customer Policy",
    navLabel: "General customer policy",
    summary: "What applies to every visit, whatever you have come to make.",
    group: "none",
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "A space for everyone",
        blocks: [
          { type: "text", body: "Maison Palettia is a creative space designed for everyone to explore, create and enjoy." },
          { type: "text", body: "By purchasing a product, participating in a DIY activity, or booking a scheduled session, customers agree to follow Maison Palettia's policies and the instructions provided by our team." },
          { type: "text", body: "Customers are expected to treat the retail store, equipment, materials, staff and other guests with care and respect." },
          { type: "text", body: "These house rules apply together with our Terms & Conditions at maisonpalettia.com/policies/terms-and-conditions and our Customer Safety & Activity Guidelines at maisonpalettia.com/policies/safety-guidelines." },
        ],
      },
      {
        heading: "Following the instructions",
        blocks: [
          { type: "text", body: "Activities must be performed according to the instructions provided by Maison Palettia." },
          { type: "text", body: "Some materials, tools, paints, glues, candles, glass, ceramics and other craft supplies may require additional care or supervision." },
          { type: "text", body: "Maison Palettia reserves the right to stop an activity if a customer's conduct creates a safety risk or causes significant disruption to others." },
          { type: "text", body: "Parents and guardians are responsible for supervising children where required." },
        ],
      },
      {
        heading: "Your belongings",
        blocks: [
          { type: "text", body: "Customers are responsible for their personal belongings while visiting Maison Palettia. We recommend that valuable or fragile personal items are not brought into the activity area." },
          { type: "text", body: "Customers may not bring outside craft materials, chemicals, paints, fragrances or other supplies into the retail store without prior approval." },
        ],
      },
      {
        heading: "Food and drinks",
        blocks: [
          { type: "text", body: "Food and beverages are permitted only in designated areas. Drinks should be kept away from craft materials, equipment and customer projects." },
        ],
      },
      {
        heading: "Conduct",
        blocks: [
          { type: "text", body: "Maison Palettia is a welcoming creative environment. We expect customers to treat our team and fellow creators with courtesy and respect. Harassment, abusive language, threatening behaviour, intentional damage or disruptive conduct will not be tolerated." },
          { type: "text", body: "Maison Palettia may refuse service or ask a customer to leave where necessary to protect the safety and wellbeing of customers, staff or property." },
        ],
      },
      {
        heading: "If something has not gone as expected",
        blocks: [
          { type: "text", body: "We want every visit to Maison Palettia to be a positive experience. If something hasn't gone as expected, please speak with our team as soon as possible so that we have an opportunity to assist." },
          { type: "text", body: "Complaints relating to a session, product or completed project should ideally be raised at the time of the visit or within a reasonable period thereafter." },
          { type: "text", body: "You can also email us at info@maisonpalettia.com or call +971 50 474 7762. We aim to respond within 2 working days. Our complaints process is set out in our Terms & Conditions at maisonpalettia.com/policies/terms-and-conditions." },
        ],
      },
      {
        heading: "Changes to these policies",
        blocks: [
          { type: "text", body: "Maison Palettia may update its policies from time to time. The applicable policy will be the policy in effect at the time of the booking or purchase." },
        ],
      },
    ],
  },
  {
    slug: "diy-experience-policy",
    title: "DIY Experience Policy",
    navLabel: "DIY experience policy",
    summary: "For Create Anytime activities, the ones with nothing to book.",
    group: "none",
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "What a DIY session is",
        blocks: [
          { type: "text", body: "Create Anytime activities are DIY sessions: you choose a project when you arrive and make it at your own pace, with our team on hand. Children below the age of 10 may take part under adult supervision only." },
        ],
      },
      {
        heading: "Age guidance by activity",
        blocks: [
          { type: "text", body: "Age requirements and supervision requirements vary by activity. Please check the guidance for the activity you have in mind before you come." },
          { type: "ages", rows: DIY_AGE_GUIDANCE },
        ],
      },
      {
        heading: "How a DIY session runs",
        blocks: [
          {
            type: "list",
            items: [
              "DIY sessions are subject to available space, materials and retail store capacity.",
              "Customers select their project from the options available at the time of their visit.",
              "The price of a DIY session states what is included.",
              "Standard materials required for the selected project are included unless specifically stated otherwise.",
              "Additional materials, upgrades or premium items may be available for an additional charge.",
              "Customers are responsible for following the instructions provided by the Maison Palettia team.",
              "Once a project has been started, changing to a different project may be subject to an additional charge.",
              "Completed projects should be collected within the timeframe communicated by the team, particularly where drying, curing or firing is required.",
            ],
          },
          { type: "text", body: "DIY activities are paid for in the studio and are non-refundable once materials have been prepared or your project has been started. See our Cancellation, Rescheduling & Refund Policy at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds." },
        ],
      },
      {
        heading: "Ceramics and glass",
        blocks: [
          { type: "callout", title: "Important for ceramics and glass", body: "Maison Palettia takes reasonable care when handling customer projects. However, handmade and painted items may occasionally experience minor imperfections, colour variations, breakage, cracking or other changes during drying, curing or firing. We will do our best to handle every project with care but cannot guarantee that every finished piece will be completely free from such imperfections." },
        ],
      },
      {
        heading: "Creative results may vary",
        blocks: [
          { type: "callout", title: "Every creation is uniquely yours", body: "Because Maison Palettia is a hands-on creative experience, finished projects may vary from examples shown in-store or online. Differences in colour, placement, technique, materials and individual skill are part of the creative process." },
        ],
      },
    ],
  },
  {
    slug: "scheduled-workshop-policy",
    title: "Scheduled Workshop Policy",
    navLabel: "Scheduled workshop policy",
    summary: "For Create Together sessions, the guided ones you book onto a date.",
    group: "none",
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "The workshops",
        blocks: [
          { type: "text", body: "Create Together sessions are guided workshops that run to a set date and time. Additional workshops will be introduced later." },
          { type: "ages", rows: WORKSHOP_AGE_GUIDANCE },
        ],
      },
      {
        heading: "Making a booking",
        blocks: [
          { type: "text", body: "Bookings may be made in-store, or through the Maison Palettia online booking system." },
          { type: "text", body: "A booking is considered confirmed once the required payment or deposit has been received and the customer has received a booking confirmation." },
          { type: "text", body: "Your confirmation will set out:" },
          {
            type: "list",
            items: [
              "The activity",
              "The date",
              "The start time",
              "The duration",
              "The number of participants",
              "The price",
              "Any special requirements",
              "Cancellation and rescheduling information",
            ],
          },
          { type: "text", body: "If your plans change, our Cancellation, Rescheduling & Refund Policy applies: with at least 24 hours' notice before your session you may reschedule or receive a credit note for the amount you paid. With less notice, or if you do not attend, the booking is non-refundable. Full details are at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds." },
        ],
      },
      {
        heading: "Arriving",
        blocks: [
          { type: "text", body: "Customers are requested to arrive 10 minutes before their scheduled session. Late arrival may reduce the customer's activity time where the session must finish at the scheduled time. For safety and operational reasons, significantly late customers may not be able to participate." },
          { type: "text", body: "A booking you cannot take part in because you arrived too late is treated as a no-show and is non-refundable." },
        ],
      },
      {
        heading: "Candle making",
        blocks: [
          { type: "text", body: "Candle-making involves hot wax, fragrance oils, containers and other materials that require care. Participants must follow all safety instructions provided by Maison Palettia staff." },
          {
            type: "list",
            items: [
              "Children should participate only where the specific session is designed for their age group.",
              "Hot wax and heating equipment should be handled only by participants and staff according to the retail store safety instructions.",
              "Customers should not bring their own fragrance oils, wax, containers or other materials unless specifically approved.",
              "Finished candles should be allowed to cool and set for the recommended period before collection or use.",
              "Customers receive appropriate candle-burning and safety instructions with their finished product.",
            ],
          },
        ],
      },
      {
        heading: "Crochet",
        blocks: [
          {
            type: "list",
            items: [
              "The materials included are stated in the workshop description.",
              "Customers may keep the project and materials specified in the workshop description.",
              "If customers miss part of the workshop because of late arrival, Maison Palettia cannot guarantee that the instructor can repeat the missed portion individually.",
              "Workshop outcomes may vary according to individual skill level.",
            ],
          },
          { type: "callout", title: "Designed to teach and inspire", body: "Our workshops are designed to teach and inspire, not to produce identical results. Every creation is unique, and that's part of the Maison Palettia experience." },
        ],
      },
    ],
  },
  {
    slug: "finished-projects",
    title: "Your Finished Projects",
    navLabel: "Finished projects",
    summary: "Collecting what you have made, and what happens if something breaks.",
    group: "none",
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "Collecting your project",
        blocks: [
          { type: "text", body: "Customers will be notified when their project is ready for collection. Finished projects should be collected within 30 days of notification. Maison Palettia may contact customers regarding projects that remain uncollected. Projects left uncollected beyond the applicable collection period may be subject to disposal or other handling in accordance with Maison Palettia's policy." },
          { type: "text", body: "Firing and finishing times are estimates and may vary depending on studio workload and the nature of the project." },
        ],
      },
      {
        heading: "Damage and breakage",
        blocks: [
          { type: "text", body: "Maison Palettia takes reasonable care of customer projects and equipment. However, craft materials and handmade items can be fragile. Maison Palettia is not responsible for damage resulting from improper handling by the customer or from the inherent nature of the materials." },
          { type: "text", body: "Where something has gone wrong with a project in our care, remedies are handled on a case-by-case basis. Please speak with our team." },
        ],
      },
    ],
  },
  {
    slug: "photography-and-media",
    title: "Photography & Media",
    navLabel: "Photography & media",
    summary: "When we photograph what you have made, and when we ask first.",
    group: "none",
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "Photography in the studio",
        blocks: [
          { type: "text", body: "Maison Palettia may photograph or display completed projects for promotional, educational or social media purposes. Where identifiable customers, particularly children, are included in promotional photography, Maison Palettia will obtain the appropriate consent." },
          { type: "text", body: "If you have any concern about photography, please tell our team or contact us at info@maisonpalettia.com. How we handle photographs and other personal data is explained in our Privacy Policy at maisonpalettia.com/policies/privacy-policy." },
        ],
      },
    ],
  },
];

/* ==========================================================================
   FROM THE CMS (Phase 2, SPEC §G.1)

   The `policies` collection carries the same sections and blocks one to one
   (block slugs = `PolicyBlock.type`), seeded from `POLICIES` above. An
   `ages` block either types its own rows (`custom`) or points at a shared
   table (`diy` | `workshop`), and the shared tables are not stored on the
   policy at all: they are built from each activity's `ageGuidance` in the
   `experiences` collection — "an age written twice is an age that disagrees
   with itself" (see THE AGE GUIDANCE, ONCE, above), now edited in one place
   for every policy that prints it.
   ========================================================================== */

/**
 * The shared age tables from the activities: `diy` from walk-in activities,
 * `workshop` from scheduled ones, each row the activity's name in sentence
 * case and its guidance.
 *
 * TODO(phase2-cleanup): ORDER. The tables above list activities in the
 * document's order (ceramic, bedazzling, tote bag, glass, mandala), which is
 * not the activities' display order, and three policy pages print them. So
 * that the pages read exactly as before the CMS, rows are put in the order
 * of the in-file table, with any activity it does not know appended in
 * display order. Once the in-file copy is retired, display order alone
 * should decide. A table the CMS cannot fill (no activity of that kind has
 * guidance yet) keeps the in-file rows, for the same reason.
 */
function ageTablesOf(experiences: { kind: "diy" | "scheduled"; name: string; ageGuidance?: string | null }[]): AgeTables {
  const inLegacyOrder = (rows: AgeRow[], legacy: readonly AgeRow[]) => {
    const rank = (row: AgeRow) => {
      const index = legacy.findIndex((known) => known.activity === row.activity);
      return index === -1 ? legacy.length : index;
    };
    return rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => rank(a.row) - rank(b.row) || a.index - b.index)
      .map(({ row }) => row);
  };
  const table = (kind: "diy" | "scheduled", legacy: readonly AgeRow[]) => {
    const rows = experiences
      .filter((experience) => experience.kind === kind)
      .map(ageRowOf)
      .filter((row): row is AgeRow => Boolean(row));
    return rows.length ? inLegacyOrder(rows, legacy) : legacy;
  };
  return { diy: table("diy", DIY_AGE_GUIDANCE), workshop: table("scheduled", WORKSHOP_AGE_GUIDANCE) };
}

/**
 * Published policies in display order (`order`), with their age tables
 * resolved. Tagged policies AND experiences: editing an activity's age
 * guidance changes three policy pages.
 */
const readPolicies = contentReader("policies", [TAGS.policies, TAGS.experiences], async (draft) => {
  const [docs, experiences] = await Promise.all([
    findDocs("policies", draft, { drafts: true, sort: "order", depth: 0 }),
    findDocs("experiences", draft, { drafts: true, sort: "order", depth: 0 }),
  ]);
  const tables = ageTablesOf(experiences);
  return docs.map((doc) => toPolicy(doc, tables));
});

/** Every policy, in the order the index and the footer list them. */
export async function getPolicies(): Promise<Policy[]> {
  const fromCms = await readPolicies();
  // The in-file policies only when the CMS could not be read (null).
  return [...(fromCms ?? POLICIES)];
}

/**
 * One policy by slug, or null — the async, CMS-backed {@link getPolicy}.
 * A null answer is the route's cue for `redirectOr404` (lib/cms/redirects.ts):
 * a renamed policy leaves a redirect behind.
 */
export async function getPolicyBySlug(slug: string): Promise<Policy | null> {
  return (await getPolicies()).find((policy) => policy.slug === slug) ?? null;
}
