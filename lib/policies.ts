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
  /* ======================================================================
     GENERAL CUSTOMER POLICY
     Document sections 1, 10, 13, 22, 23.

     Four short sections of the document are gathered here rather than given
     pages of their own, because each is three or four sentences that apply
     to every visit — belongings, food and drink, conduct, complaints. Four
     pages of one paragraph is a worse read than one page of four.
     ====================================================================== */
  {
    slug: "general-customer-policy",
    title: "General Customer Policy",
    navLabel: "General customer policy",
    summary: "What applies to every visit, whatever you have come to make.",
    sections: [
      {
        heading: "A space for everyone",
        blocks: [
          {
            type: "text",
            body: "Maison Palettia is a creative space designed for everyone to explore, create and enjoy.",
          },
          {
            type: "text",
            body: "By purchasing a product, participating in a DIY activity, or booking a scheduled session, customers agree to follow Maison Palettia's policies and the instructions provided by our team.",
          },
          {
            type: "text",
            body: "Customers are expected to treat the retail store, equipment, materials, staff and other guests with care and respect.",
          },
        ],
      },
      {
        heading: "Following the instructions",
        blocks: [
          {
            type: "text",
            body: "Activities must be performed according to the instructions provided by Maison Palettia.",
          },
          {
            type: "text",
            body: "Some materials, tools, paints, glues, candles, glass, ceramics and other craft supplies may require additional care or supervision.",
          },
          {
            type: "text",
            body: "Maison Palettia reserves the right to stop an activity if a customer's conduct creates a safety risk or causes significant disruption to others.",
          },
          {
            type: "text",
            body: "Parents and guardians are responsible for supervising children where required.",
          },
        ],
      },
      {
        heading: "Your belongings",
        blocks: [
          {
            type: "text",
            body: "Customers are responsible for their personal belongings while visiting Maison Palettia. We recommend that valuable or fragile personal items are not brought into the activity area.",
          },
          {
            type: "text",
            body: "Customers may not bring outside craft materials, chemicals, paints, fragrances or other supplies into the retail store without prior approval.",
          },
        ],
      },
      {
        heading: "Food and drinks",
        blocks: [
          {
            type: "text",
            body: "Food and beverages are permitted only in designated areas. Drinks should be kept away from craft materials, equipment and customer projects.",
          },
        ],
      },
      {
        heading: "Conduct",
        blocks: [
          {
            type: "text",
            body: "Maison Palettia is a welcoming creative environment. We expect customers to treat our team and fellow creators with courtesy and respect. Harassment, abusive language, threatening behaviour, intentional damage or disruptive conduct will not be tolerated.",
          },
          {
            type: "text",
            body: "Maison Palettia may refuse service or ask a customer to leave where necessary to protect the safety and wellbeing of customers, staff or property.",
          },
        ],
      },
      {
        heading: "If something has not gone as expected",
        blocks: [
          {
            type: "text",
            body: "We want every visit to Maison Palettia to be a positive experience. If something hasn't gone as expected, please speak with our team as soon as possible so that we have an opportunity to assist.",
          },
          {
            type: "text",
            body: "Complaints relating to a session, product or completed project should ideally be raised at the time of the visit or within a reasonable period thereafter.",
          },
        ],
      },
      {
        heading: "Changes to these policies",
        blocks: [
          {
            type: "text",
            body: "Maison Palettia may update its policies from time to time. The applicable policy will be the policy in effect at the time of the booking or purchase.",
          },
        ],
      },
    ],
  },

  /* ======================================================================
     DIY EXPERIENCE POLICY
     Document sections 2 and 24.

     "DIY" IS THE DOCUMENT'S WORD AND THE SITE'S WORD BOTH. The catalogue
     splits on `kind: "diy" | "scheduled"` in lib/experiences.ts and the FAQ
     already says "Create Anytime activities are DIY", so the two vocabularies
     already meet. Create Anytime is what the client named these for a
     visitor; DIY is what this document calls them; both appear here, in that
     order, so neither reader is lost.
     ====================================================================== */
  {
    slug: "diy-experience-policy",
    title: "DIY Experience Policy",
    navLabel: "DIY experience policy",
    summary: "For Create Anytime activities, the ones with nothing to book.",
    sections: [
      {
        heading: "What a DIY session is",
        blocks: [
          {
            type: "text",
            body: "Create Anytime activities are DIY sessions: you choose a project when you arrive and make it at your own pace, with our team on hand. Children below the age of 10 may take part under adult supervision only.",
          },
        ],
      },
      {
        heading: "Age guidance by activity",
        blocks: [
          {
            type: "text",
            body: "Age requirements and supervision requirements vary by activity. Please check the guidance for the activity you have in mind before you come.",
          },
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
        ],
      },
      {
        heading: "Ceramics and glass",
        blocks: [
          {
            type: "callout",
            title: "Important for ceramics and glass",
            body: "Maison Palettia takes reasonable care when handling customer projects. However, handmade and painted items may occasionally experience minor imperfections, colour variations, breakage, cracking or other changes during drying, curing or firing. We will do our best to handle every project with care but cannot guarantee that every finished piece will be completely free from such imperfections.",
          },
        ],
      },
      {
        heading: "Creative results may vary",
        blocks: [
          {
            type: "callout",
            title: "Every creation is uniquely yours",
            body: "Because Maison Palettia is a hands-on creative experience, finished projects may vary from examples shown in-store or online. Differences in colour, placement, technique, materials and individual skill are part of the creative process.",
          },
        ],
      },
    ],
  },

  /* ======================================================================
     SCHEDULED WORKSHOP POLICY
     Document sections 3, 6, 7.

     THE "CONFIRMATION SHOULD INCLUDE" LIST IS PUBLISHED, and it is the one
     operational checklist in this file that is. It is an instruction to the
     studio, but what it instructs is what the customer is given in writing,
     so a customer reading it learns what to expect and what to chase if it
     is missing. The test is whether the list helps the reader, and this one
     does. The booking-confirmation wording itself is a live conflict with
     this site — see the audit.
     ====================================================================== */
  {
    slug: "scheduled-workshop-policy",
    title: "Scheduled Workshop Policy",
    navLabel: "Scheduled workshop policy",
    summary: "For Create Together sessions, the guided ones you book onto a date.",
    sections: [
      {
        heading: "The workshops",
        blocks: [
          {
            type: "text",
            body: "Create Together sessions are guided workshops that run to a set date and time. Additional workshops will be introduced later.",
          },
          { type: "ages", rows: WORKSHOP_AGE_GUIDANCE },
        ],
      },
      {
        heading: "Making a booking",
        blocks: [
          { type: "text", body: "Bookings may be made in-store, or through the Maison Palettia online booking system." },
          {
            type: "text",
            body: "A booking is considered confirmed once the required payment or deposit has been received and the customer has received a booking confirmation.",
          },
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
        ],
      },
      {
        heading: "Arriving",
        blocks: [
          {
            type: "text",
            body: "Customers are requested to arrive 10 minutes before their scheduled session. Late arrival may reduce the customer's activity time where the session must finish at the scheduled time. For safety and operational reasons, significantly late customers may not be able to participate.",
          },
        ],
      },
      {
        heading: "Candle making",
        blocks: [
          {
            type: "text",
            body: "Candle-making involves hot wax, fragrance oils, containers and other materials that require care. Participants must follow all safety instructions provided by Maison Palettia staff.",
          },
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
          {
            type: "callout",
            title: "Designed to teach and inspire",
            body: "Our workshops are designed to teach and inspire, not to produce identical results. Every creation is unique, and that's part of the Maison Palettia experience.",
          },
        ],
      },
    ],
  },

  /* ======================================================================
     CANCELLATION & RESCHEDULING
     Document section 4.

     ======================================================================
     THE DOCUMENT GIVES TWO DIFFERENT NOTICE PERIODS AND THIS PAGE PICKS
     NEITHER
     ======================================================================

     Its summary bullets say "More than 24-48 hours before the session" and
     then "Less than 24 hours / No-show". Its prose says "We kindly ask
     customers to provide at least 48 hours' notice". So the notice asked for
     is 48, the notice enforced is 24, and the window between them is written
     as a range rather than a rule.

     The prose is what is published, for two reasons. It is the half written
     in the studio's voice to a customer, which is the test applied to every
     other section in this file; and it is internally consistent on its own
     terms — ask for 48, treat under 24 as non-refundable, leave the gap to
     discretion, which is what the discretion sentence is for.

     The two OUTCOMES in the bullets are real and are not in the prose — free
     rescheduling subject to availability, and a store credit note as the
     alternative — so they are published. They are deliberately written
     WITHOUT a number attached: "where notice is given in good time". Putting
     24 there, or 48, would be this file resolving a client ambiguity by
     typing, which is the one thing it must not do. Raised in the audit.
     ====================================================================== */
  {
    slug: "cancellation-and-rescheduling",
    title: "Cancellation & Rescheduling",
    navLabel: "Cancellation & rescheduling",
    summary: "The notice we ask for, and what happens if plans change.",
    sections: [
      {
        heading: "If your plans change",
        blocks: [
          {
            type: "text",
            body: "We understand that plans can change. We kindly ask customers to provide at least 48 hours' notice if they need to cancel or reschedule. Cancellations or rescheduling requests made less than 24 hours before the session, as well as no-shows, may be treated as non-refundable. Maison Palettia may make reasonable exceptions in genuine circumstances at management discretion.",
          },
        ],
      },
      {
        heading: "Rescheduling",
        blocks: [
          {
            type: "text",
            body: "Where notice is given in good time, rescheduling is free and subject to availability. Customers may instead request a store credit note.",
          },
        ],
      },
      {
        heading: "Late cancellations and no-shows",
        blocks: [
          {
            type: "text",
            body: "A booking cancelled less than 24 hours before the session, or missed without notice, becomes non-refundable and non-transferable.",
          },
        ],
      },
    ],
  },

  /* ======================================================================
     REFUND & EXCHANGE
     Document section 14.

     IT IS A SHORT PAGE BECAUSE ONLY ONE HALF OF THAT SECTION IS A POLICY.
     The "Products" half opens "For retail products, establish whether:" and
     lists four things to decide — a 7-day exchange window, final sale on
     discounted items, non-returnable personalised items, damaged goods
     handled separately. Those are the studio's decisions to take, not this
     file's to take for it, and nothing on this website sells a retail
     product today. Raised in the audit; absent from the page.
     ====================================================================== */
  {
    slug: "refund-and-exchange",
    title: "Refund & Exchange",
    navLabel: "Refund & exchange",
    summary: "Where a session can be refunded, and where it cannot.",
    sections: [
      {
        heading: "Creative sessions",
        blocks: [
          {
            type: "text",
            body: "DIY activities are generally non-refundable once materials have been prepared or the project has been started.",
          },
          {
            type: "text",
            body: "For scheduled workshops, the Cancellation & Rescheduling policy applies.",
          },
        ],
      },
    ],
  },

  /* ======================================================================
     SAFETY & CHILDREN
     Document sections 11 and 12.
     ====================================================================== */
  {
    slug: "safety-and-children",
    title: "Safety & Children",
    navLabel: "Safety & children",
    summary: "How we keep the studio safe, and what supervision each activity needs.",
    sections: [
      {
        heading: "Safety comes first",
        blocks: [
          {
            type: "text",
            body: "Safety comes first at Maison Palettia. Customers must follow all instructions provided by Maison Palettia staff. Running, unsafe use of equipment, intentional misuse of materials, or behaviour that could endanger another customer or team member is not permitted.",
          },
          {
            type: "text",
            body: "Maison Palettia reserves the right to stop participation where a customer does not follow reasonable safety instructions.",
          },
        ],
      },
      {
        heading: "Children, parents and guardians",
        blocks: [
          {
            type: "text",
            body: "Age requirements and supervision requirements may vary depending on the activity. Customers should check the age recommendation for each session before booking.",
          },
          {
            type: "text",
            body: "For activities requiring adult supervision, the parent or legal guardian is responsible for supervising the child throughout the session and ensuring that the child follows Maison Palettia's safety instructions.",
          },
        ],
      },
      {
        heading: "Age guidance",
        blocks: [
          {
            type: "text",
            body: "Create Anytime activities: children below the age of 10 may take part under adult supervision only.",
          },
          { type: "ages", rows: DIY_AGE_GUIDANCE },
          { type: "text", body: "Create Together workshops." },
          { type: "ages", rows: WORKSHOP_AGE_GUIDANCE },
        ],
      },
    ],
  },

  /* ======================================================================
     YOUR FINISHED PROJECTS
     Document sections 8 and 9.

     NOT ONE OF THE TEN PAGE NAMES THE DOCUMENT PROPOSES, and it is here
     anyway. Collection and breakage are the two things a customer asks about
     after the making is done, the document writes both in customer voice,
     and neither belongs under any of the ten names — "Refund & Exchange"
     would turn a handling note into a money question. The audit records the
     departure from the proposed structure.

     THE THREE REMEDIES ARE NOT LISTED. See the file header, point 4.
     ====================================================================== */
  {
    slug: "finished-projects",
    title: "Your Finished Projects",
    navLabel: "Finished projects",
    summary: "Collecting what you have made, and what happens if something breaks.",
    sections: [
      {
        heading: "Collecting your project",
        blocks: [
          {
            type: "text",
            body: "Customers will be notified when their project is ready for collection. Finished projects should be collected within 30 days of notification. Maison Palettia may contact customers regarding projects that remain uncollected. Projects left uncollected beyond the applicable collection period may be subject to disposal or other handling in accordance with Maison Palettia's policy.",
          },
          {
            type: "text",
            body: "Firing and finishing times are estimates and may vary depending on studio workload and the nature of the project.",
          },
        ],
      },
      {
        heading: "Damage and breakage",
        blocks: [
          {
            type: "text",
            body: "Maison Palettia takes reasonable care of customer projects and equipment. However, craft materials and handmade items can be fragile. Maison Palettia is not responsible for damage resulting from improper handling by the customer or from the inherent nature of the materials.",
          },
          {
            type: "text",
            body: "Where something has gone wrong with a project in our care, remedies are handled on a case-by-case basis. Please speak with our team.",
          },
        ],
      },
    ],
  },

  /* ======================================================================
     PHOTOGRAPHY & MEDIA
     Document section 21.

     ONE PARAGRAPH, BECAUSE THE SECTION IS ONE PARAGRAPH PLUS ADVICE. The
     rest of it — "I recommend separating customer project photography from
     customer/person photography", "You should have a proper consent process
     for identifiable people, especially minors" — is the adviser telling the
     studio to build a process. The process does not exist yet, so the page
     cannot describe one, and describing one would be the most consequential
     invention in this whole file: a consent statement is a claim about what
     the studio does with a photograph of a child.
     ====================================================================== */
  {
    slug: "photography-and-media",
    title: "Photography & Media",
    navLabel: "Photography & media",
    summary: "When we photograph what you have made, and when we ask first.",
    sections: [
      {
        heading: "Photography in the studio",
        blocks: [
          {
            type: "text",
            body: "Maison Palettia may photograph or display completed projects for promotional, educational or social media purposes. Where identifiable customers, particularly children, are included in promotional photography, Maison Palettia will obtain the appropriate consent.",
          },
        ],
      },
    ],
  },
];

/**
 * One policy by slug, or null — from the in-file copy.
 *
 * TODO(phase2-cleanup): synchronous, so it cannot read the CMS. Kept with
 * its signature so the routes that call it keep compiling while they move to
 * {@link getPolicyBySlug}; delete it, `POLICIES` and the age tables above
 * once nothing imports them.
 */
export function getPolicy(slug: string): Policy | null {
  return POLICIES.find((policy) => policy.slug === slug) ?? null;
}

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
