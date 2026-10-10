import type { Payload } from "payload";

import { FIXED_PAGE_SLUGS, type FixedPageSlug } from "@/cms/collections/content/Pages";

import type { ContentIds } from "./content";
import { mediaId, type MediaIds } from "./media";
import type { CtaSeed, LinkSeed, SeoSeed } from "./types";
import { describeError, upsertDoc, type Tally } from "./upsert";

/**
 * ==========================================================================
 * The eleven fixed pages (SPEC §F.7) — today's sections, as blocks
 * ==========================================================================
 *
 * One entry per FIXED_PAGE_SLUGS page (cms/collections/content/Pages.ts, the
 * single list), each a `blocks` array in the exact order the route renders
 * its sections today, carrying the exact strings the route prints. Every
 * string is copied from the file named in the comment beside it (git
 * 2e1651b), with JSX entities resolved to the characters they render
 * (&rsquo; → ’, &apos; → ', &mdash; → —) and JSX line wraps collapsed to the
 * single space the browser prints. Straight and curly apostrophes are kept
 * exactly as each page has them — "Let's Make It" on /private-events is
 * straight on purpose (the script face draws it curled; see the comment at
 * app/(site)/private-events/page.tsx:1288-1297), "Let’s Make It" on the
 * programme pages is curly.
 *
 * WHAT IS NOT A STRING HERE. Copy that several pages share is not repeated
 * in a block: a block switched to "Brand wording" (hero tagline is the one
 * exception, below) reads Settings → Brand wording, which cms/seed/globals.ts
 * fills. Lists that come from collections (experiences, programmes, FAQs,
 * policies, passes, venues) are not copied into blocks either; the block
 * names the source and the renderer reads the collection.
 *
 * Pictures are public paths, resolved to the media imported in step 1.
 * Programme doors name the programme by slug, resolved to its id.
 */

const link = (url: string, anchor?: string): LinkSeed => (anchor ? { type: "internal", url, anchor } : { type: "internal", url });
const cta = (label: string, url: string, anchor?: string): CtaSeed => ({ label, link: link(url, anchor) });
const lines = (...text: string[]) => text.map((t) => ({ text: t }));

/** A block before media and programme references are resolved. */
type BlockSeed = { blockType: string } & Record<string, unknown>;

interface PageSeed {
  slug: FixedPageSlug;
  title: string;
  seo: SeoSeed;
  blocks: BlockSeed[];
}

/** Marks a value as a public path to resolve to a media id. */
const img = (path: string) => ({ $media: path });
/** Marks a value as a programme slug to resolve to a programme id. */
const programme = (slug: string) => ({ $programme: slug });

export const PAGES: PageSeed[] = [
  /* ──────────────────────────────────────────────────────────────────────
   * home — app/(site)/page.tsx:75-215
   * ────────────────────────────────────────────────────────────────────── */
  {
    slug: "home",
    title: "Home",
    // app/(site)/page.tsx:17 — homeMetadata: the site defaults (title "Maison Palettia", the
    // tagline as description), canonical "/". Nothing page-specific to store.
    seo: {},
    blocks: [
      {
        // components/sections/Hero.tsx — <Hero /> at app/(site)/page.tsx:75
        blockType: "hero",
        // OFF on purpose: the hero sets the tagline as three lines and ends it
        // with a full stop ("for Everyone."), which Brand wording's tagline
        // ("A Palette of Creativity for Everyone", lib/brand.ts:39) does not
        // have. Borrowing it would change the banner's words.
        useTagline: false,
        headingLines: lines(
          "A Palette of", // components/sections/Hero.tsx:301
          "Creativity", // components/sections/Hero.tsx:304
          "for Everyone.", // components/sections/Hero.tsx:307
        ),
        accentLineIndex: 1, // components/sections/Hero.tsx:304 (styles.accent on the second line)
        sub: "There’s no wrong shade of creativity.", // components/sections/Hero.tsx:343
        lead: "Pick your palette, get your hands busy and make something that’s completely yours.", // components/sections/Hero.tsx:362-363
        primaryCta: cta("Explore experiences", "/events"), // components/sections/Hero.tsx:373,383
        secondaryCta: cta("Plan a private event", "/private-events"), // components/sections/Hero.tsx:393-394
        imageDesktop: img("images/image.png"), // components/sections/Hero.tsx:83
        imageMobile: img("images/mobile-hero.png"), // components/sections/Hero.tsx:112
        scrollCueLabel: "Scroll down", // components/sections/Hero.tsx:410
        scrollCueTarget: "experience-discovery", // components/sections/Hero.tsx:402
      },
      {
        // components/sections/home/OpeningStatement.tsx → components/sections/BrandStory.tsx
        blockType: "openingStatement",
        eyebrow: "What this is", // components/sections/home/OpeningStatement.tsx:59
        useBrandCopy: true, // BrandStory prints OPENING_STATEMENT (lib/brand.ts:105-111) = Brand wording
        panelImage: img("images/about-sec-img.png"), // components/sections/BrandStory.tsx:155
      },
      {
        // components/sections/home/ExperienceDiscovery.tsx
        blockType: "experienceCarousel",
        eyebrow: "The Maison Palettia experience", // components/sections/home/ExperienceDiscovery.tsx:95
        headingLines: lines("Pick a Colour,", "Pick a Table."), // components/sections/home/ExperienceDiscovery.tsx:100
        standfirst:
          "Create Anytime (pick your palette and start whenever you like), or Create Together in a guided session and make something new with us.", // components/sections/home/ExperienceDiscovery.tsx:143-144
        source: "all", // :39 getCreativeExperiences(), every experience in order
        cardCta: "View details", // components/events/ExperienceCard.tsx:124
      },
      {
        // components/sections/home/WaysToExperience.tsx
        blockType: "waysToTakePart",
        eyebrow: "Ways to take part", // components/sections/home/WaysToExperience.tsx:316
        headingLines: lines("There Is More", "Than One Way In."), // components/sections/home/WaysToExperience.tsx:321
        lead: "Maison Palettia is a place to make, gather and create — whether you’re joining us at the Maison or bringing the experience to your own space.", // components/sections/home/WaysToExperience.tsx:328-329
        groups: [
          {
            name: "Create", // components/sections/home/WaysToExperience.tsx:196
            lede: "Pick your project, pick your colours, and make something of your own. Drop in when you feel like creating or book a session for a little more time at the table.", // :198
            photo: img("images/experiences/CERAMIC_PAINTING.jpg"), // :160
            tint: "lilac", // :157 (#9059A4)
            doors: [
              { label: "Create Anytime", noteSource: "diyCount", link: link("/events", "create-anytime") }, // :206-208 ("{n} activities, no booking")
              { label: "Create Together", noteSource: "scheduledCount", link: link("/events", "scheduled") }, // :212-214 ("{n} guided sessions")
            ],
          },
          {
            name: "Celebrate", // :221
            lede: "Make your next celebration a little more hands-on. Bring your people, and we’ll bring the creative setup, materials and activities.", // :223
            photo: img("images/events/glitter-keepsakes.jpg"), // :166
            tint: "terracotta", // :163 (#D97757)
            doors: [
              // :248-250 — label is the programme's name, note its description
              { label: "Birthday Parties", noteSource: "programmeDescription", programme: programme("birthday-parties"), link: link("/private-events/birthday-parties") },
              { label: "Other private events", noteSource: "text", note: "An occasion of your own, built around one of the activities.", link: link("/private-events") }, // :253-255
            ],
          },
          {
            name: "Connect", // :261
            lede: "Good things happen around a table. Bring your team, class or community together for a creative experience designed to get people making, talking and connecting.", // :263
            photo: img("images/experience/community-table.jpg"), // :172
            tint: "lavender", // :169 (#C4B5FD)
            doors: [
              { label: "Corporate Events", noteSource: "programmeDescription", programme: programme("corporate-events"), link: link("/private-events/corporate-events") }, // :266-268
              { label: "School Programmes", noteSource: "programmeDescription", programme: programme("school-programs"), link: link("/private-events/school-programs") }, // :271-273
            ],
          },
          {
            name: "Collaborate", // :279
            lede: "Take the Maison beyond our walls. We work with malls, brands and communities to create workshops, activations and creative experiences made for their audience and space.", // :281
            photo: img("images/events/national-day-cards.jpg"), // :178
            tint: "sage", // :175 (var(--color-sage))
            doors: [
              {
                label: "Mall & Community Activations",
                noteSource: "programmeDescription",
                programme: programme("mall-and-community-activations"),
                link: link("/private-events/mall-and-community-activations"),
              }, // :284-286
              { label: "Retail & brand partnerships", noteSource: "text", note: "Co-branded workshops, and activations built around a campaign.", link: link("/contact") }, // :289-291
            ],
          },
        ],
      },
      {
        // components/sections/home/TwoWaysToCreate.tsx — venue and next date are derived (:129, :159-170)
        blockType: "twoWays",
        eyebrow: "How to take part", // components/sections/home/TwoWaysToCreate.tsx:199
        heading: "Make It Your Way.", // components/sections/home/TwoWaysToCreate.tsx:206
        lead: "Drop in and create, or book a seat for a scheduled session.", // components/sections/home/TwoWaysToCreate.tsx:213
        roads: [
          {
            eyebrow: "No booking", // :228
            title: "Create Anytime", // :229
            line: "Pick a project. Pick your colours. Just drop in.", // :233
            facts: lines("No booking", "Choose your activity"), // :283 (+ the venue line, derived)
            cta: cta("Find the studio", "/locations"), // :284
            ground: "terracotta", // :227
          },
          {
            eyebrow: "A date and a seat", // :290
            title: "Create Together", // :291
            line: "A little more planned. Same creative energy.", // :294
            facts: lines("Booked online", "Guided sessions"), // :301 (+ the next date, derived)
            cta: cta("See the dates", "/events", "scheduled"), // :302
            ground: "lilac", // :289
          },
        ],
      },
      {
        // components/sections/home/WhereWeCreate.tsx — venue: partners[0], the current one (:28-29)
        blockType: "whereWeCreate",
        eyebrow: "Find us", // components/sections/home/WhereWeCreate.tsx:145
        headingLines: lines("Your Next Creative", "Stop."), // components/sections/home/WhereWeCreate.tsx:150
        useFindUsLine: true, // :158-159 is Brand wording → "Find us" line, word for word
        findUsNowLabel: "Find us now", // components/sections/home/WhereWeCreate.tsx:344
      },
      {
        // components/sections/home/ClosingStatement.tsx — eyebrow TAGLINE (:69), heading/body CLOSING (:84-90)
        blockType: "closingInvitation",
        primaryCta: cta("Explore experiences", "/events"), // components/sections/home/ClosingStatement.tsx:107-108
        secondaryCta: cta("Plan a private event", "/private-events/book"), // :124-125 (PRIVATE_EVENT_ENQUIRY_HREF, lib/privateEvents.ts:155)
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────────
   * about — app/(site)/about/page.tsx:95-108
   * ────────────────────────────────────────────────────────────────────── */
  {
    slug: "about",
    title: "About",
    seo: {
      title: "About", // app/(site)/about/page.tsx:47
      description: "Maison Palettia is a creative space built for slowing down, switching off and getting your hands busy.", // app/(site)/about/page.tsx:49
    },
    blocks: [
      {
        // Welcome() :129 — H1 = TAGLINE, paragraphs = BRAND_STORY (Brand wording)
        blockType: "aboutWelcome",
        eyebrow: "About the Maison", // app/(site)/about/page.tsx:186
        image: img("images/about-page-img.png"), // app/(site)/about/page.tsx:280
      },
      // Purpose() :349 — labels "Our Mission"/"Our Vision" (:394, :398) and MISSION/VISION, all Brand wording
      { blockType: "missionVision" },
      {
        // Community() :518 — COMMUNITY + WORKSHOP_JOURNEY (Brand wording)
        blockType: "communityJourney",
        eyebrow: "The Maison experience", // app/(site)/about/page.tsx:530
      },
      {
        // Apart() :674 — cards = WHAT_SETS_US_APART (Brand wording)
        blockType: "whatSetsUsApart",
        eyebrow: "What sets us apart", // app/(site)/about/page.tsx:749
        headingLines: lines("Why It Feels", "Different"), // app/(site)/about/page.tsx:763
      },
      {
        // Close() :935 — the heading and body are CLOSING (lib/brand.ts:366-367), set
        // here as the lilac close's own words; the heading breaks where the
        // 16ch measure (:958) breaks it.
        blockType: "closingCtaLilac",
        headingLines: lines("Let’s Craft a", "Community Together."), // app/(site)/about/page.tsx:960 (CLOSING.heading)
        body: "Maison Palettia is ready to bring art, creativity, and meaningful engagement.", // app/(site)/about/page.tsx:966 (CLOSING.body)
        primaryCta: cta("Explore experiences", "/events"), // app/(site)/about/page.tsx:974-975
        secondaryCta: cta("Plan a private event", "/private-events"), // app/(site)/about/page.tsx:979-980
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────────
   * locations — app/(site)/locations/page.tsx:43-304
   * ────────────────────────────────────────────────────────────────────── */
  {
    slug: "locations",
    title: "Locations",
    seo: {
      title: "Locations", // app/(site)/locations/page.tsx:21
      description: "Find Maison Palettia in the places you already love to visit — and come make something while you’re there.", // app/(site)/locations/page.tsx:23
    },
    blocks: [
      {
        blockType: "pageHeader",
        eyebrow: "Locations", // app/(site)/locations/page.tsx:112
        headingLines: lines("Where to", "Find Us."), // app/(site)/locations/page.tsx:118
        standfirstSource: "findUsLine", // app/(site)/locations/page.tsx:135-136 (word for word)
      },
      {
        // the partner plates and map, :161-266 — venues: every current one (getMallPartners)
        blockType: "locationsHero",
        findUsNowLabel: "Find us now", // app/(site)/locations/page.tsx:192
        emptyNote: "The next destination is being confirmed.", // app/(site)/locations/page.tsx:263
        showPastDestinations: false, // PAST_DESTINATIONS is imported but not printed (01 §5.1)
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────────
   * gallery — app/(site)/gallery/page.tsx:118-244
   * ────────────────────────────────────────────────────────────────────── */
  {
    slug: "gallery",
    title: "Gallery",
    seo: {
      title: "Gallery", // app/(site)/gallery/page.tsx:18
      description: "Step inside Maison Palettia: what gets made here, the hands that make it, and the pieces that go home.", // app/(site)/gallery/page.tsx:20
    },
    blocks: [
      {
        blockType: "pageHeader",
        eyebrow: "Gallery", // app/(site)/gallery/page.tsx:131
        headingLines: lines("A Little Space", "for Big Creativity."), // app/(site)/gallery/page.tsx:137
        standfirstSource: "openingStatementBody", // app/(site)/gallery/page.tsx:141 (OPENING_STATEMENT.body)
        sideImage: img("images/experiences/GLASS_PAINTING.jpg"), // app/(site)/gallery/page.tsx:153
        sideImageSecondary: img("images/experiences/CANDLE_MAKING.jpg"), // app/(site)/gallery/page.tsx:166
      },
      {
        blockType: "galleryCollections",
        collections: [
          {
            folio: "Collection 01", // app/(site)/gallery/page.tsx:88
            heading: "What you can make", // :89
            lede: "Plenty of ways to spend an afternoon, and the thing you carry out at the end of it.", // :96
            ground: "surface", // :97
            source: "experiences", // :67-75 — every experience with a photograph
          },
          {
            folio: "Collection 02", // :102
            heading: "The making", // :103
            lede: "Up close and mid-process: pigment, wax, marbled ink and a loaded brush.", // :104
            ground: "cream", // :105
            source: "manual",
            // PROCESS_FRAMES :254-279, in order — minus pigment-on-paper.jpg (:264),
            // which is not on disk (01 §1 defect #1; SPEC §F.1).
            images: [
              img("images/studio/palette-brush.jpg"), // :256
              img("images/experience/painting.jpg"), // :260
              img("images/studio/marbling.jpg"), // :268
              img("images/studio/plate-motif.jpg"), // :272
              img("images/studio/candle-pour.jpg"), // :276
            ],
          },
          {
            folio: "Collection 03", // :110
            heading: "Made to keep", // :111
            lede: "Finished pieces from real sessions, made to take home.", // :112
            ground: "sage", // :113
            source: "manual",
            // EVENT_PLATES, lib/brand.ts:390-409
            images: [
              img("images/events/named-keepsake.jpg"), // lib/brand.ts:392
              img("images/events/glitter-keepsakes.jpg"), // lib/brand.ts:398
              img("images/events/national-day-cards.jpg"), // lib/brand.ts:404
            ],
          },
        ],
      },
      {
        blockType: "closingCtaLilac",
        headingLines: lines("Ready to make", "something of your own?"), // app/(site)/gallery/page.tsx:219
        body: "Pick an activity, bring your people, or come on your own.", // app/(site)/gallery/page.tsx:224
        primaryCta: cta("Explore experiences", "/events"), // app/(site)/gallery/page.tsx:230-231
        secondaryCta: cta("Plan a private event", "/private-events"), // app/(site)/gallery/page.tsx:236-237
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────────
   * faq — app/(site)/faq/page.tsx:88-242
   * ────────────────────────────────────────────────────────────────────── */
  {
    slug: "faq",
    title: "FAQ",
    seo: {
      title: "FAQ", // app/(site)/faq/page.tsx:14
      description: "Answers to common questions about Maison Palettia events.", // app/(site)/faq/page.tsx:15
    },
    blocks: [
      {
        blockType: "pageHeader",
        eyebrow: "Questions", // app/(site)/faq/page.tsx:133
        headingLines: lines("Before You", "Come and Make."), // app/(site)/faq/page.tsx:150
        standfirstSource: "text",
        standfirst: "Answers to common questions about Maison Palettia events.", // app/(site)/faq/page.tsx:158
      },
      {
        // <FaqList groups={FAQ_GROUPS} /> :196 — headings from lib/constants.ts FAQ_GROUPS
        blockType: "faqList",
        groups: [
          { key: "coming", title: "Coming to an event" }, // lib/constants.ts:1072
          { key: "booking", title: "Booking a place" }, // lib/constants.ts:1084
          { key: "groups", title: "Groups and passes" }, // lib/constants.ts:1113
        ],
      },
      {
        blockType: "closingCtaLilac",
        headingLines: lines("Still", "Wondering?"), // app/(site)/faq/page.tsx:212
        body: "Just ask us. We’re always happy to help you get creating.", // app/(site)/faq/page.tsx:229
        primaryCta: cta("Ask the Maison", "/contact"), // app/(site)/faq/page.tsx:234-235
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────────
   * contact — app/(site)/contact/page.tsx:76-105
   * ────────────────────────────────────────────────────────────────────── */
  {
    slug: "contact",
    title: "Contact",
    seo: {
      title: "Contact", // app/(site)/contact/page.tsx:42
      description: "Ask the Maison about an event, a booking or working together, or find an upcoming event and keep a place.", // app/(site)/contact/page.tsx:44
    },
    blocks: [
      {
        // Invitation() :109, Details() :379, Enquiry() :302, Portrait() :258 —
        // the details themselves are Site details (address, email, phone, socials)
        blockType: "contactIntro",
        eyebrow: "Contact", // app/(site)/contact/page.tsx:151
        headingLines: lines("Let's Create", "Something Together."), // app/(site)/contact/page.tsx:157-158
        lead: "Whether it is a question about an upcoming event, a place you would like to keep, or something you would like to make with us, write to the Maison and we will take it from there.", // app/(site)/contact/page.tsx:164-166
        findUsHeading: "Find Us", // app/(site)/contact/page.tsx:410
        whereTerm: "Where", // app/(site)/contact/page.tsx:415
        emailTerm: "Email", // app/(site)/contact/page.tsx:440
        phoneTerm: "Phone", // app/(site)/contact/page.tsx:451
        followTerm: "Follow", // app/(site)/contact/page.tsx:477
        venuesLinkLabel: "Venues are listed with each event", // app/(site)/contact/page.tsx:434
        venuesLink: link("/events"), // app/(site)/contact/page.tsx:431
        formHeading: "Write to Us", // app/(site)/contact/page.tsx:322
        formLead: "A few lines is plenty. Tell us what you are after and we will come back to you.", // app/(site)/contact/page.tsx:325
        portrait: img("images/hero/plate-painting.jpg"), // app/(site)/contact/page.tsx:276
      },
      {
        // EventsCta() :562 — its one button is the sticky note (PeelNote), carried as the primary action
        blockType: "closingCtaLilac",
        eyebrow: "Looking for an event?", // app/(site)/contact/page.tsx:582
        headingLines: lines("The Programme,", "Date by Date."), // app/(site)/contact/page.tsx:588-589
        body: "Every event lists its venue, its times and what you will make. If you already know what you are after, it is quicker than writing to us.", // app/(site)/contact/page.tsx:615-616
        primaryCta: cta("Explore upcoming events", "/events"), // app/(site)/contact/page.tsx:623-626
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────────
   * policies — app/(site)/policies/page.tsx:55-190
   * ────────────────────────────────────────────────────────────────────── */
  {
    slug: "policies",
    title: "Policies",
    seo: {
      title: "Policies", // app/(site)/policies/page.tsx:15
      description: "The Maison Palettia studio policies: how sessions run, what we ask of visitors, and what happens if plans change.", // app/(site)/policies/page.tsx:17
    },
    blocks: [
      {
        blockType: "pageHeader",
        eyebrow: "Policies", // app/(site)/policies/page.tsx:76
        headingLines: lines("How the", "Maison Works."), // app/(site)/policies/page.tsx:82
        standfirstSource: "text",
        standfirst: "What applies when you come to make something with us.", // app/(site)/policies/page.tsx:89
      },
      // :97-160 — every policy, title + summary, in POLICIES order
      { blockType: "policiesIndex" },
      {
        blockType: "closingCtaLilac",
        headingLines: lines("Something", "Unclear?"), // app/(site)/policies/page.tsx:170
        body: "Ask before you book. We would rather answer a question twice than have you find out on the day.", // app/(site)/policies/page.tsx:174-175
        primaryCta: cta("Ask the Maison", "/contact"), // app/(site)/policies/page.tsx:180-182
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────────
   * loyalty — app/(site)/loyalty/page.tsx:62-102
   * ────────────────────────────────────────────────────────────────────── */
  {
    slug: "loyalty",
    title: "Passes",
    seo: {
      title: "Passes", // app/(site)/loyalty/page.tsx:13
      description: "Maison Palettia passes: hold your sessions in advance and check out as a guest.", // app/(site)/loyalty/page.tsx:15
      noindex: true, // app/(site)/loyalty/page.tsx:39 — !PASSES_CONFIGURED
    },
    blocks: [
      {
        // Intro() :113, the list heading :79, <PassOffer> (components/loyalty/PassOffer.tsx),
        // the preview note :89-97 and the closing sentence at the foot of HowItWorks() :204-218
        blockType: "passesList",
        eyebrow: "Loyalty", // app/(site)/loyalty/page.tsx:119
        heading: "Come More Than Once.", // app/(site)/loyalty/page.tsx:128
        lead: "A pass holds your sessions in advance, so when a date comes round the only decision left is what to make. Choose one, add it to your booking, and check out as a guest. There is no account to create.", // app/(site)/loyalty/page.tsx:134-136
        listHeading: "Choose Your Pass", // app/(site)/loyalty/page.tsx:79
        previewDisclaimer:
          "Preview passes. Maison Palettia has not set its pass terms yet, so the names, prices, session counts and validity above are placeholders put here for review. None of them is final, and nothing is charged at checkout.", // app/(site)/loyalty/page.tsx:92-94
        sessionsTerm: "Sessions", // components/loyalty/PassOffer.tsx:166
        validTerm: "Valid for", // components/loyalty/PassOffer.tsx:172
        addLabel: "Add to booking", // components/loyalty/PassOffer.tsx:263
        notOnSale: "This pass is not on sale online yet.", // components/loyalty/PassOffer.tsx:232
        askLabel: "Ask the Maison about it", // components/loyalty/PassOffer.tsx:237
        addedNote: "Added to your booking{count}.", // components/loyalty/PassOffer.tsx:297 ({count} = " (n in total)" when n > 1)
        viewBookingLabel: "View your booking", // components/loyalty/PassOffer.tsx:302
        // components/loyalty/PassOffer.tsx:286-292 — the sentence ends in a link, "contact the Maison" → /contact
        failedNote: "We could not add this pass to your booking. Please try again, or contact the Maison.",
        emptyTitle: "There are no passes on offer just now.", // components/loyalty/PassOffer.tsx:323
        emptyBody: "The Maison is between offers. Every session in the programme can still be booked on its own in the meantime.", // components/loyalty/PassOffer.tsx:326-327
        emptyCta: cta("Explore events", "/events"), // components/loyalty/PassOffer.tsx:329-330
        footerBefore: "Already holding something?", // app/(site)/loyalty/page.tsx:204
        footerFirstLink: cta("Go to your booking", "/checkout"), // app/(site)/loyalty/page.tsx:206-209
        footerBetween: ", or", // app/(site)/loyalty/page.tsx:211
        footerSecondLink: cta("see what is on", "/events"), // app/(site)/loyalty/page.tsx:213-216
        footerAfter: ".", // app/(site)/loyalty/page.tsx:218
      },
      {
        // HowItWorks() :154 — the loyalty page's own four steps, set as a list
        blockType: "steps",
        eyebrow: "How it works", // app/(site)/loyalty/page.tsx:184
        source: "custom",
        steps: [
          { title: "Choose Your Pass", detail: "Three sizes of the same thing. Take the one that matches how often you will come." }, // app/(site)/loyalty/page.tsx:158-159
          { title: "Add It to Your Booking", detail: "It joins the same basket as any session, alongside anything already held there." }, // :163-164
          { title: "Check Out as a Guest", detail: "A name, an email and a number to reach you on. No account, here or later." }, // :168-169
          { title: "Keep Your Reference", detail: "The Maison confirms your pass directly, and the reference is how you look it up." }, // :173-174
        ],
        variant: "list",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────────
   * events — app/(site)/events/page.tsx:111-336
   * ────────────────────────────────────────────────────────────────────── */
  {
    slug: "events",
    title: "Experiences",
    seo: {
      title: "Experiences", // app/(site)/events/page.tsx:23
      description:
        "Every Maison Palettia creative experience: Create Anytime activities you can enjoy at your own pace, and guided Create Together sessions you book online for a set date.", // app/(site)/events/page.tsx:25
    },
    blocks: [
      {
        // the title block :164-213 (its doors are the events browser's, below)
        blockType: "pageHeader",
        eyebrow: "Experiences", // app/(site)/events/page.tsx:176
        headingLines: lines("Make It", "Your Way."), // app/(site)/events/page.tsx:186
        standfirstSource: "text", // no standfirst on this page
      },
      {
        // the two doors :192-209, the walk-in group :224-278, the scheduled group :281-317
        blockType: "eventsBrowser",
        doors: [
          { title: "Create Anytime", noteSource: "journey0", modeLabel: "No booking" }, // :195-196 (WORKSHOP_JOURNEY[0].description), :416
          { title: "Create Together", noteSource: "journey1", modeLabel: "Booked online" }, // :204-205 (WORKSHOP_JOURNEY[1].description), :416
        ],
        groupLeads: {
          diy: "Pick a project. Pick your colours. Just drop in.", // app/(site)/events/page.tsx:244
          scheduled: "A little more planned. Same creative energy.", // app/(site)/events/page.tsx:300
        },
        viewLocationLabel: "View location", // app/(site)/events/page.tsx:263
        emptyTitle: "The next dates are being set.", // app/(site)/events/page.tsx:305
        emptyBody: "Create Anytime experiences are available in the meantime.", // app/(site)/events/page.tsx:308
      },
      {
        // <WhereWeSetUp> :334 → components/events/WhereWeSetUp.tsx
        blockType: "whereWeSetUp",
        eyebrow: "Find us", // components/events/WhereWeSetUp.tsx:172
        heading: "Your Next Creative Stop.", // components/events/WhereWeSetUp.tsx:181
        useFindUsLine: true, // components/events/WhereWeSetUp.tsx:187-188 is the "Find us" line, word for word
        nextLabelTemplate: "Next {weekday} {date}", // components/events/WhereWeSetUp.tsx:125 (`Next {weekday} {formatSessionDate(…)}`)
        cta: cta("Find the studio", "/locations"), // components/events/WhereWeSetUp.tsx:233-234
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────────
   * private-events — app/(site)/private-events/page.tsx:165-201
   * ────────────────────────────────────────────────────────────────────── */
  {
    slug: "private-events",
    title: "Private events",
    seo: {
      title: "Private events", // app/(site)/private-events/page.tsx:100
      description:
        "Creative experiences designed around your people, your occasion and your space. A private Maison Palettia session where everyone makes something to take home.", // app/(site)/private-events/page.tsx:102
    },
    blocks: [
      {
        // Introduction() :268
        blockType: "privateEventsIntro",
        eyebrow: "Creative experiences, made for your moment", // app/(site)/private-events/page.tsx:288
        headingLines: lines("Memories", "Made by", "Hand."), // app/(site)/private-events/page.tsx:298-300
        lead: "From birthdays and celebrations to team gatherings and private events, Maison Palettia brings people together to create, connect and have a little fun. Choose an experience, bring your people and leave with something you made — and a memory to go with it.", // app/(site)/private-events/page.tsx:309-313
        image: img("images/hero/tote-painting.jpg"), // app/(site)/private-events/page.tsx:342
      },
      {
        // WhoItIsFor() :437 — cards = programmes, in order
        blockType: "programmesGrid",
        eyebrow: "Who it is for", // app/(site)/private-events/page.tsx:453
        headingLines: lines("Made for Your", "Kind of Crowd."), // app/(site)/private-events/page.tsx:459-460
        lead: "Maison Palettia creates hands-on experiences for all kinds of groups. Don’t see yours? That’s probably a conversation worth having.", // app/(site)/private-events/page.tsx:468-470
        cardCta: "See the programme", // app/(site)/private-events/page.tsx:676
      },
      {
        // Experiences() :747 — plates = every experience (ActivityPlate, given no href today: linkTo "none")
        blockType: "activitiesGrid",
        eyebrow: "The experiences", // app/(site)/private-events/page.tsx:784
        headingLines: lines("Pick Your Kind of", "Creative."), // app/(site)/private-events/page.tsx:790-791
        lead: "From painting and bedazzling to candles, crochet and more, there’s plenty to get your hands on. Choose from our creative experiences, or let’s create something around your group, occasion or idea.", // app/(site)/private-events/page.tsx:799-802
        linkTo: "none",
      },
      {
        // CreateWithUs() :1007 — venue: partners[0], the current one (:197)
        blockType: "venueSpotlight",
        eyebrow: "Create with us", // app/(site)/private-events/page.tsx:1031
        headingLines: lines("Your Next", "Creative Stop."), // app/(site)/private-events/page.tsx:1040-1041
        lead: "Maison Palettia brings creativity into the places you already visit — so you can stop by, pick a project and make something along the way.", // app/(site)/private-events/page.tsx:1050-1052
        cardLabel: "Our home", // app/(site)/private-events/page.tsx:1101
      },
      {
        // HowItWorks() :1242 — PRIVATE_EVENT_STEPS (Brand wording → private event steps)
        blockType: "steps",
        eyebrow: "How it works", // app/(site)/private-events/page.tsx:1283
        headingLines: lines("Let's Make It", "Happen."), // app/(site)/private-events/page.tsx:1298-1299 (straight apostrophe, see the note above)
        source: "brandCopyPrivateEventSteps",
        variant: "cards",
      },
      {
        // EnquiryCta() :1394 — PlanAction :1495
        blockType: "closingCtaLilac",
        headingLines: lines("Let's Make", "Something Together."), // app/(site)/private-events/page.tsx:1432-1433
        body: "Have something in mind? Tell us when, who’s coming and what you’d like to make. We’ll help turn the idea into an experience made for your group.", // app/(site)/private-events/page.tsx:1462-1464
        primaryCta: cta("Plan a private event", "/private-events/book"), // app/(site)/private-events/page.tsx:1513-1517 (ENQUIRY_HREF :107)
      },
    ],
  },

  /* ──────────────────────────────────────────────────────────────────────
   * private-events-book — app/(site)/private-events/book/page.tsx:56-212
   * (served at /private-events/book; the slug is the page's key, not its path)
   * ────────────────────────────────────────────────────────────────────── */
  {
    slug: "private-events-book",
    title: "Plan a private event",
    seo: {
      title: "Plan a private event", // app/(site)/private-events/book/page.tsx:20
      description:
        "Tell us when, who’s coming and what you’d like to make. We’ll help turn the idea into an experience made for your group.", // app/(site)/private-events/book/page.tsx:22
    },
    blocks: [
      {
        // the form's `intro` :109-134 and its `face` picture :136-153
        blockType: "pageHeader",
        eyebrow: "Private events", // app/(site)/private-events/book/page.tsx:113
        // One h1 today, "Plan Your Private Experience." (:116); stored as the two
        // lines the 18-character script slot allows.
        headingLines: lines("Plan Your Private", "Experience."),
        standfirstSource: "text",
        standfirst: "Tell us when, who’s coming and what you’d like to make. We’ll help turn the idea into an experience made for your group.", // app/(site)/private-events/book/page.tsx:131-132
        sideImage: img("images/creative/painting.jpg"), // app/(site)/private-events/book/page.tsx:147 (PRIVATE_EVENT_IMAGES.experience, lib/privateEvents.ts:423)
      },
      {
        // <PrivateEventEnquiry> components/private-events/PrivateEventEnquiry.tsx + the sidebar :161-203
        blockType: "enquiryForm",
        legendAboutYou: "About you", // components/private-events/PrivateEventEnquiry.tsx:344
        legendAboutEvent: "About the event", // components/private-events/PrivateEventEnquiry.tsx:386
        note: "Answer what you know. None of this is required, and nothing here is fixed once you send it.", // components/private-events/PrivateEventEnquiry.tsx:389-390
        submitLabel: "Send enquiry", // components/private-events/PrivateEventEnquiry.tsx:546
        successHeading: "Enquiry received", // components/private-events/PrivateEventEnquiry.tsx:278
        // :281 and :284-285, two paragraphs. The second says no copy is emailed —
        // true until Phase 3 sends the enquiry receipt (01 §3.6).
        successBody:
          "Thank you. We have your enquiry.\n\nThe Maison will read it and come back to you with what the session could look like. A copy has not been emailed to you, so keep an eye on the inbox you gave us.",
        sidebarSteps: {
          heading: "What happens next", // app/(site)/private-events/book/page.tsx:161
          source: "brandCopyPrivateEventSteps", // :174 PRIVATE_EVENT_STEPS
        },
      },
    ],
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/* Writing                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

/** Replaces `{ $media }` / `{ $programme }` markers with ids, recursively. */
function resolve(value: unknown, media: MediaIds, content: ContentIds): unknown {
  if (Array.isArray(value)) return value.map((item) => resolve(item, media, content));
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  if (typeof record.$media === "string") return mediaId(media, record.$media);
  if (typeof record.$programme === "string") {
    const id = content.programmes.get(record.$programme);
    if (id === undefined) throw new Error(`seed: page block names an unknown programme ${record.$programme}`);
    return id;
  }
  return Object.fromEntries(Object.entries(record).map(([key, v]) => [key, resolve(v, media, content)]));
}

/**
 * The SEO fields come from @payloadcms/plugin-seo (2A-1), whose group name
 * and sub-fields are the plugin's. Rather than hard-code them, the writer
 * reads the collection's config: a `meta` group gets `title`/`description`
 * (and `noindex` if the plugin was given one); anything absent is skipped
 * and reported, so the seed never writes a field that does not exist.
 */
function seoData(payload: Payload, seo: SeoSeed, log: (line: string) => void): Record<string, unknown> {
  const fields = payload.collections.pages?.config.flattenedFields ?? [];
  const meta = fields.find((field) => "name" in field && field.name === "meta") as
    | { flattenedFields?: Array<{ name?: string }>; fields?: Array<{ name?: string }> }
    | undefined;
  if (!meta) {
    if (seo.title || seo.description) log("pages: no `meta` group on pages (SEO plugin not wired yet) — SEO not written.");
    return {};
  }
  const names = new Set((meta.flattenedFields ?? meta.fields ?? []).map((field) => field.name));
  const out: Record<string, unknown> = {};
  if (seo.title && names.has("title")) out.title = seo.title;
  if (seo.description && names.has("description")) out.description = seo.description;
  if (seo.noindex !== undefined) {
    if (names.has("noindex")) out.noindex = seo.noindex;
    else if (seo.noindex) log("pages: loyalty is noindex today, but `meta` has no `noindex` field to record it in.");
  }
  return Object.keys(out).length ? { meta: out } : {};
}

export async function seedPages(
  payload: Payload,
  tally: Tally,
  media: MediaIds,
  content: ContentIds,
  options: { missingOnly: boolean; skip?: Set<string> },
  log: (line: string) => void,
): Promise<void> {
  const seeded = new Set(PAGES.map((page) => page.slug));
  const missing = FIXED_PAGE_SLUGS.filter((slug) => !seeded.has(slug));
  if (missing.length) throw new Error(`seed: fixed page(s) without a seed entry: ${missing.join(", ")}`);

  for (const page of PAGES) {
    if (options.skip?.has(page.slug)) {
      tally.add("pages", "skipped");
      continue;
    }
    const blocks = page.blocks.map((block) => resolve(block, media, content));
    try {
      await upsertDoc(
        payload,
        tally,
        "pages",
        "slug",
        { title: page.title, slug: page.slug, blocks, ...seoData(payload, page.seo, log) },
        { missingOnly: options.missingOnly },
      );
    } catch (error) {
      tally.add("pages", "failed");
      log(`seed: page ${page.slug} was not saved — ${describeError(error)}`);
    }
  }
}
