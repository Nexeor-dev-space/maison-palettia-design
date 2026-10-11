import { BOOKING_CONFIGURED, PAYMENT_CONFIGURED } from "@/lib/bookingFlags";
import { ENQUIRY_CONFIGURED } from "@/lib/enquiry";
import type {
  ContactDetails,
  FaqItem,
  NavGroup,
  NavItem,
  SocialLink,
} from "@/types";

/* ==========================================================================
   THE CMS HOLDS THESE NOW — THIS FILE IS THE FALLBACK AND THE CLIENT COPY
   ==========================================================================

   Since Phase 2 the site settings, the menus, the FAQs and the booking terms
   live in the admin (globals `site-settings`, `navigation`,
   `booking-settings`; collection `faqs`), and the async getters that read
   them are in lib/constants.server.ts — `getSite`, `getContact`,
   `getMainNav`, `getFooterNav`, `getFaqGroups`, `getBookingTerms` and the
   rest, one per constant below.

   This file stays, for two reasons, and both are temporary:

     1. It is the FALLBACK those getters return while the CMS has nothing
        to say (an array not yet seeded, a database that cannot be reached),
        so the site reads exactly as it did before the CMS existed.
     2. CLIENT COMPONENTS IMPORT IT (BottomNav, HeaderBar, Checkout,
        Confirmation, HeroIntro…), and a client component cannot await a
        getter or import the Local API. They move to props from a server
        parent that calls the getter; until each one has, it reads the
        constant here.

   TODO(phase2-cleanup): once every consumer reads a getter or a prop and
   the seed has run everywhere, delete the content constants here — the UI
   chrome ones (`WORKSHOPS_HREF`) can stay.
   ========================================================================== */

/** Canonical brand + site-wide identity values. */
export const SITE = {
  name: "Maison Palettia",
  legalName: "Maison Palettia Events L.L.C.",
  /** Shown in the header wordmark and footer. */
  // "pottery" removed: the client's new direction takes the brand off the
  // wheel entirely. The activities named in its place are painting, textiles,
  // candles, crocheting, tote-bag and ceramic painting, bedazzling, mandala
  // and glass painting — a list too long for a tagline, so this says the
  // category rather than the catalogue.
  tagline: "Creative workshops and events in Dubai",
  locale: "en_AE",
  /** TODO(client): replace with the production domain before launch. */
  url: "https://www.maisonpalettia.com",
} as const;

/**
 * THE OFFICIAL LOGO, AND THE ONLY ONE.
 *
 * The single source of truth for the brand mark: its path, its intrinsic size,
 * and — the part that actually matters — the grounds it may be placed on.
 * Every surface that draws the logo reads these numbers from here, so the file
 * can be replaced in one edit and nothing is left pointing at the old one.
 *
 * WHAT IT IS. Light Sage script on transparency, with the palette motif in the
 * P. Sampled: 93% of its ink is #d1e7be.
 *
 * TWO CUTS, AND THE GROUND DECIDES WHICH. The sage cut reads on a dark ground
 * and vanishes on a light one — on Charcoal Slate it measures 9.07:1, on the
 * footer's own Light Sage field it measures 1.00:1, invisible rather than
 * faint. The client has now supplied the Deep Lilac cut below for light
 * grounds, which is what lets the header carry the mark once it turns white.
 *
 * The footer still closes on its signature line: its field is Light Sage, and
 * Deep Lilac on Light Sage is 3.83:1 — fine at display size, and a decision
 * about that band rather than about this constant.
 *
 * THERE IS NO SECOND MARK. The site previously typeset "Maison Palettia" in
 * the brand script in two places — the header and the foot — which is a logo
 * made out of type and is not what the guidelines permit. Both are gone. Do
 * not add a text mark, a monogram, a favicon drawn by hand, or a recoloured
 * cut: the artwork is the client's and is not ours to redraw.
 *
 */
export const BRAND_LOGO = {
  /**
   * The Light Sage cut, for dark grounds — the header while it is transparent
   * over the hero, and the hero itself.
   */
  src: "/images/logo.png",
  /** The file's own pixel dimensions. Set height only; the aspect follows. */
  width: 1015,
  height: 438,
  /*
    Where the lettering sits inside the file, as shares of its box — measured
    from the alpha channel (ink is 986x404 at x 23–1008, y 16–419). The intro
    draws the mark from its vector, whose box is the ink alone, and flies it
    onto this image; without these the flight would land the letters on the
    file's transparent margin rather than on its letters.
  */
  ink: { left: 23 / 1015, top: 16 / 438, width: 986 / 1015, height: 404 / 438 },

  /**
   * The Deep Lilac cut, for light grounds — the header once it takes its white
   * ground on scroll.
   *
   * This is the dark-on-light cut the earlier note asked for, and it closes
   * the constraint that kept the mark off every pale surface on the site. Deep
   * Lilac measures 5.06:1 on white, well past the 3:1 a logo owes as a
   * graphical object.
   *
   * Its own proportion, not the sage cut's: 1120x466 against 1015x438. Close,
   * but not the same, so the two must never share a width — set the height and
   * let each file keep its own aspect.
   */
  onLight: {
    src: "/images/scroll-logo.png",
    width: 1120,
    height: 466,
    /** Same measurement as above: ink 986x404 at x 76–1061, y 28–431. */
    ink: { left: 76 / 1120, top: 28 / 466, width: 986 / 1120, height: 404 / 466 },
  },
} as const;

/**
 * Primary navigation, ordered by what a visitor came for rather than
 * alphabetically or by how the site was built.
 *
 * Workshops leads. Almost everyone arriving is deciding whether to book a
 * session, and the header used to open with About — a page about the studio,
 * ahead of the page that says what you can actually do there. The rest follow
 * in descending order of how often they answer a question someone has before
 * booking.
 *
 * `menu` marks an entry the header opens as a panel rather than navigating,
 * and names which panel — Experiences opens the programme, Private events the
 * three programmes a host can book. It is a field rather than a match on the
 * path, because entries deliberately share destinations.
 */
export const MAIN_NAV: NavItem[] = [
  /*
    FIVE ENTRIES, SPLIT THREE AND TWO AROUND THE MARK.

    The redesign brief asks the site to answer, in order: what the Maison
    offers, how private events work, and where to find it — and then who it
    is and how to reach it. The bar reads that way. The left track is where to
    go in the programme; the right track, beside search, is the Maison itself
    and the errand of contacting it.

    "Experiences", not "Events". Five of the seven activities are walk-in and
    are never booked for a date, so calling the whole programme "Events"
    promised a calendar most of it does not have. The route stays /events —
    renaming a working URL to match a label would break every link to it.

    Private events and Locations join the bar because the brief makes both
    first-order questions. Gallery joined them later, at the client's ask. Journal, FAQ
    and Passes keep their routes and live in the footer and the mobile menu,
    which read this list in order.
  */
  /*
    THE PHONE SPLITS THIS LIST THREE WAYS — see `mobileSurface` in
    types/index.ts for what each one is for.

    Experiences points at the LISTING, not at an activity: /events is where
    all seven are browsed and each card goes on to its own page. The bar must
    never shortcut past that, which is why there is no dropdown on this entry
    down there — the menu keeps the one that expands.

    Private events goes to its own overview at /private-events, where the
    programmes and the enquiry CTA are, rather than straight at the enquiry
    form. Somebody has to be able to read what they are booking first.
  */
  { label: "Experiences", href: "/events", menu: "experiences", mobileSurface: "bar" },
  { label: "Private events", href: "/private-events", menu: "private-events", mobileSurface: "bar" },
  /*
    ======================================================================
    THREE TABS, AND LOCATIONS / GALLERY / CONTACT MOVED UNDER ABOUT
    ======================================================================

    At the client's ask. The bar carried six entries across two tracks —
    Experiences, Private events, Locations, Gallery on the left, About and
    Contact beside search — and four of those six answer the same question in
    four places: who is this, and how do I reach them.

    So About becomes a panel like the other two, and the three that belong
    under it are marked `secondary`, which is the flag that already means
    "out of the desktop bar, kept everywhere the whole site map is offered".
    See <AboutMenu> for what is in the panel.

    AND `utility` COMES OFF ABOUT. It sat in the right-hand cluster beside
    search, at the smaller rung and with no swatch, which was right for a
    label that only went somewhere. An entry that opens a panel belongs with
    the entries that open panels: all three menu triggers are now on the left
    track, in one treatment, and the right track is search and the action.

    AND THE PHONE FOLLOWED, at the client's ask. It did not at first — the
    note above this one said so — and the result was a bar that grouped the
    site differently from the one above it: the phone's fifth slot was More,
    holding Private events, About, Gallery and Contact, while the desktop had
    put Locations, Gallery and Contact under About and left Private events at
    the top level.

    `mobileSurface` is what fixes it, and only two values had to move:

      Private events .. sheet -> bar. It is a top-level trigger on the
                        desktop bar, so it is a thumb slot here.
      Locations ....... bar -> sheet. It is a door inside the About panel on
                        the desktop bar, so it is a row inside the About
                        sheet here.

    What the two flags now say, in one line each: `bar` is the desktop's
    left-hand triggers minus the one that became a panel, and `sheet` is
    exactly the four doors <AboutMenu> opens — About the Maison, Locations,
    Gallery and Contact, in that order. The phone's fifth slot is named About
    for the same reason.

    `secondary` is still read only by the desktop bar, and still means "out of
    that bar, kept everywhere the whole site map is offered". It is not the
    phone's flag and the two are not interchangeable: Private events is a bar
    slot and not `secondary`, About is `secondary`-adjacent and neither.
  */
  { label: "About", href: "/about", menu: "about", mobileSurface: "sheet" },
  { label: "Locations", href: "/locations", secondary: true, mobileSurface: "sheet" },
  { label: "Gallery", href: "/gallery", secondary: true, mobileSurface: "sheet" },
  { label: "Contact", href: "/contact", secondary: true, mobileSurface: "sheet" },
];

/**
 * The programme's route.
 *
 * Kept as a constant because several surfaces point at it — the mobile menu's
 * schedule link, the strands menu's way out, the primary action — and a path
 * spelled out in four places is a path that eventually disagrees with itself.
 */
export const WORKSHOPS_HREF = "/events";

/**
 * Routes whose hero is a saturated colour field. The header inverts to a light
 * treatment over these until the page scrolls. Add a route here when its hero
 * lands on a dark ground.
 */
/*
  "/" came off this list when the homepage hero became a Light Sage
  composition: pale ink over a light field fails contrast. It keeps a
  transparent bar with dark ink instead — see LIGHT_HERO_ROUTES below.
*/
/*
  EMPTY, AND DELIBERATELY STILL HERE.

  `/private-events` was the only entry. Its banner has been removed, so there
  is no dark hero left on the site for the bar to reverse over — and a route
  left in this list without one would hold the bar in light ink over a light
  page, which also suppresses the painted nav links (see <NavLabel>).

  The list stays because the behaviour it drives is still correct and still
  wired: add a route here the day a dark banner comes back.
*/
export const DARK_HERO_ROUTES: readonly string[] = [];

/**
 * Routes whose hero is a light colour field that runs up behind the bar. The
 * header stays transparent over these until the page scrolls, and keeps its
 * dark ink — the difference from DARK_HERO_ROUTES, which also invert it.
 *
 * The homepage banner is Light Sage and pulls itself up by the bar's height,
 * so a ground on the bar there printed a strip of a second colour across the
 * top of the banner. The client asked for the bar's colour to go.
 */
export const LIGHT_HERO_ROUTES: readonly string[] = ["/"];

/**
 * The single primary call to action, reused in the header and footer.
 *
 * It points at the workshop listing because that is where booking begins and
 * there is no booking route yet — the listing is a placeholder awaiting Phase
 * 5. TODO(client): when a real booking or session-detail flow exists, change
 * this one href and every surface that offers the action follows.
 */
export const PRIMARY_CTA = {
  /*
    "Book a session", not "Book an event". The action points at the listing,
    and most of what is listed there is walk-in — a button promising that
    everything can be booked would contradict the page it opens.
  */
  label: "Book a session",
  href: "/events#scheduled",
} as const;

/**
 * The footer's site map, grouped.
 *
 * Every entry is a route that exists. The footer is the one place on the site
 * with room to invent pages — "Our Philosophy", "Plan Your Visit", "Booking" —
 * and each of those is a homepage section or a state of mind, not somewhere a
 * visitor can go. A link that 404s is worse than a shorter list, so the six
 * routes in {@link MAIN_NAV} are dealt into three pairs and nothing else is
 * added. Grow a group when the route it needs is built.
 *
 * Kept as data so the footer renders one list component three times rather
 * than three near-identical blocks of markup.
 */
export const FOOTER_NAV: NavGroup[] = [
  /*
    Three groups, each a question a visitor arrives with. Every entry is a
    route that exists; a footer link that 404s is worse than a shorter list.
  */
  {
    title: "Create",
    items: [
      { label: "All experiences", href: "/events" },
      { label: "Private events", href: "/private-events" },
      /* PASSES CAME OUT at the client's ask. /loyalty still exists and is
         still reachable from the pages that sell it; it is only off this
         list. Nothing else linked to it from the footer. */
      { label: "Gallery", href: "/gallery" },
    ],
  },
  {
    title: "The Maison",
    items: [
      { label: "About", href: "/about" },
      { label: "Locations", href: "/locations" },
    ],
  },
  {
    title: "Help",
    items: [
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
      { label: "Check a booking", href: "/booking-status" },
    ],
  },
];

/**
 * ==========================================================================
 * STILL EMPTY, AND NOW FOR A NARROWER REASON
 * ==========================================================================
 *
 * The studio policies arrived on 2026-10-05 and are live at /policies — the
 * footer carries all eight in a band of their own, derived from
 * {@link POLICIES} rather than listed here. So this array is no longer
 * "the legal links, missing"; it is the two documents that are STILL missing
 * after the policy document was read end to end:
 *
 *   /privacy ... the document names "Privacy Policy" in its proposed site
 *                structure and never drafts a word of it.
 *   /terms ..... likewise "Terms & Conditions".
 *
 * Neither can be written from anything in this project, and both are the
 * ones a customer looks for in a checkout footer before entering a card, so
 * a link that 404s there is worse than no link at all. Unchanged below.
 */
export const LEGAL_NAV: NavItem[] = [
  /*
    EMPTY ON PURPOSE, AND TEMPORARILY.

    This held "Privacy Policy" → /privacy and "Terms & Conditions" → /terms.
    Neither route exists: both answered 404 from every page on the site, which
    is the worst kind of broken link — it sits in the footer of a checkout,
    where a customer looks for exactly these two documents before deciding
    whether to trust a payment form.

    Removing the links rather than stubbing the pages is the smaller change,
    and an absent link is honest where a link to nothing is not. The footer
    leaves the copyright line on its own and needs no other change.

    TODO(client): a business taking bookings and payments needs both documents.
    Write them, add the two routes, and restore these entries — the footer will
    render them again with no further edit.
  */
];

/*
  HERO_TRIPTYCH was here. It held the three panels the old hero read left to
  right — an impasto landscape, a potter's-wheel loop and a stack of unglazed
  cups — and nothing has referenced it since the hero became a single
  photograph.

  Of its four files, three were pottery and have since been deleted in the
  pottery removal: the wheel loop, its poster frame and the cups. The
  landscape survives as /images/hero/i-1.jpg and now carries the foot of
  /contact.
*/

/** TODO(client): awaiting real address, email and phone number. */
export const CONTACT: ContactDetails = {
  addressLines: ["Dubai", "United Arab Emirates"],
  email: null,
  phone: null,
};

/*
  THERE IS NO WHATSAPP CONSTANT ANY MORE. A `WHATSAPP` export sat here — a
  business number read from a public WHATSAPP_NUMBER environment variable
  (now gone — SPEC §K greps for its exact name), with a placeholder of zeros
  as its fallback — and pointed two surfaces at `wa.me`: a floating
  widget from `lg` and the bottom bar's fourth slot. The client asked for
  WhatsApp to come off the site, on a desktop and on a phone alike, and
  <ContactWidget> and <BottomNav>'s Contact slot link to /contact in their
  place; neither reads anything from this file. The constant went with the
  widget rather than staying as a dead export with a TODO on it, and the
  environment variable went from .env.example for the same reason. If the
  studio ever wants a chat handle published, it belongs on {@link CONTACT}
  beside the phone number, as a contact detail — not as a switch for a
  control that no longer exists.
*/

/**
 * The footer's mailing-list signup, and the switch that hides it.
 *
 * WHY IT IS BUILT BUT NOT SHOWN. The footer was rebuilt after
 * goodman-gallery.com, whose footer leads with a newsletter block — heading,
 * one line of copy, and a filled Subscribe button. This project has no mailing
 * list: no provider, no endpoint, no list to join. A Subscribe button that
 * posts nowhere is the worst version of this, because it takes an address and
 * loses it, so the block renders nothing at all until `actionUrl` is set.
 *
 * That is the same rule {@link SOCIAL_LINKS} and {@link LEGAL_NAV} already
 * follow: the code is ready, the absence is honest,
 * and switching it on is a value rather than a build.
 *
 * HOW TO TURN IT ON. Put the provider's form endpoint in `actionUrl` — the
 * URL a Mailchimp, Klaviyo or Buttondown embed form posts to. <Footer>
 * renders a plain `<form method="post">` at it with one `email` field, so it
 * works with no JavaScript and needs no client library. If the provider wants
 * the field called something other than "email", change `fieldName` with it.
 *
 * A third-party endpoint will navigate away to its own confirmation page. That
 * is the honest default and it is what these embeds do; swapping it for a
 * fetch and an inline "thank you" is a real piece of work, not a prop.
 *
 * TODO(client): placeholder wording, written to the brand voice. Replace with
 * approved copy — and note that `description` is a promise about what gets
 * sent, so it should say what the studio will actually send.
 */
export const NEWSLETTER: {
  /** The provider's form endpoint. `null` hides the block entirely. */
  actionUrl: string | null;
  /** The name the provider expects on the email field. */
  fieldName: string;
  heading: string;
  description: string;
  cta: string;
} = {
  actionUrl: null,
  fieldName: "email",
  heading: "Newsletter",
  description: "New dates and new experiences, straight to your inbox.",
  cta: "Subscribe",
};

/**
 * The studio's profiles, as the client supplied them on 2026-10-10. The CMS
 * copy (Site details → Social profiles) is what the site reads; this list is
 * the fallback when the CMS cannot answer, and the seed's starting rows.
 */
export const SOCIAL_LINKS: SocialLink[] = [
  { label: "Instagram", href: "https://www.instagram.com/maison.palettia/" },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61594873157618" },
  { label: "TikTok", href: "https://www.tiktok.com/@maison.palettia" },
  { label: "Pinterest", href: "https://www.pinterest.com/1fz0ruautd3l2gr85mxiksyx4z7ejo/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/maison-palettia/" },
];

/**
 * Homepage section 04 — how a booking actually works.
 *
 * The one thing the site never said out loud. Maison Palettia does not have a
 * studio you can walk into: it sets up at a mall on a fixed date, and the
 * whole transaction is "find the date, keep a place, turn up". A visitor who
 * has not worked that out is not undecided about booking — they do not know
 * what they would be booking, which is a different and much worse problem.
 *
 * Four steps because that is how many there are, not because four is a tidy
 * number for a row. Nothing here is invented: each line describes something
 * the site already does — the listing at /events, the booking flow off an
 * event page, the venue carried on every session, and the event itself.
 *
 * Kept as data so the section renders one component four times rather than
 * four near-identical blocks, and so the wording is edited in one place.
 */
export const HOW_IT_WORKS: readonly { title: string; body: string }[] = [
  {
    title: "Choose",
    body: "Look through what is coming up and find a date that suits you.",
  },
  {
    title: "Book",
    body: "Keep your place in a couple of minutes. No account needed.",
  },
  {
    title: "Come by",
    body: "Find us at the mall at your time. Everything is set up and waiting.",
  },
  {
    title: "Create",
    body: "Make something with your hands, and take it home with you.",
  },
];


/* ==========================================================================
   The questions that stand between someone and a booking.

   Short on purpose, and every answer here is one the site can already stand
   behind: two of them describe how the programme works and point at the data
   the event pages already carry, and one describes the route someone is
   already on.

   TODO(client): the answers a studio normally needs and this one has not
   written down — minimum age, whether children can attend, accessibility at
   each mall, what happens if you cannot make it, and whether pieces are fired
   and collected later. None are invented here. Each is worth adding, and /faq
   is the route for the long version.
   ========================================================================== */
export const HOMEPAGE_FAQ: FaqItem[] = [
  {
    question: "Where Do the Events Happen?",
    answer:
      // Opens on the client's own sentence (p.06), verbatim — the homepage's
      // "Find us" line and /locations' opening. It replaced "has no studio
      // door of its own… set up inside a mall", which is what this answer
      // said; the second sentence is unchanged because it is the part that
      // answers the question.
      "Find Maison Palettia in the places you already love to visit — and come make something while you’re there. Every event on the programme names its mall and the area it is in, so you know where you are going before you book.",
  },
  {
    question: "How Long Does an Event Run?",
    answer:
      "Each one runs to a fixed start and finish time rather than a drop-in window. Both times, and the length of the event, are on its page.",
  },
  {
    question: "Do I Need to Bring Anything?",
    answer:
      // The client's own line (p.21 of their copy document), verbatim — the
      // note they wrote for the foot of every event page. It is the one claim
      // here about what the studio supplies, and it was a TODO(client) to
      // confirm while it was ours ("Everything is provided. Bring nothing but
      // yourself."); in their words it no longer needs one.
      "Everything you need is waiting for you. Just bring yourself, pick a project and start creating.",
  },
  {
    question: "How Do I Book a Place?",
    answer:
      "Choose a date from the programme, open it, and keep your place from that page. Each event shows how many places are left before you start.",
  },
];

/* ==========================================================================
   WHAT A BOOKING IS — one sentence, said the same way everywhere it is said
   ==========================================================================

   Four places told a customer what pressing "Confirm booking" does, and they
   disagreed. Checkout's foot said "your place is held when you reserve it";
   the line under the button said "nothing is charged now and nothing is
   charged later" and that the studio would confirm "directly"; the
   confirmation said the reference was "a request, not a confirmed booking";
   the FAQ repeated "held". Only the confirmation was right. While
   BOOKING_CONFIGURED is false (lib/bookingFlags.ts) the booking is written
   to the visitor's own browser and nowhere else — the record's status is Pending,
   the studio is not told, and nothing holds a place. "Nothing charged later"
   was worse than wrong: it read as "this session is free", and the client's
   own policy says a booking is confirmed once payment or a deposit is in.

   So there is one sentence per state of the backend, and every surface
   prints the one the flags select (`bookingTerms`). Today that is `request`.

     request ... neither flag set. The truth today: a request, not yet
                 confirmed; no payment; saved in this browser. Whether it
                 then asks the customer to send their reference depends on
                 there being somewhere to send it — see below.
     recorded .. BOOKING_CONFIGURED only: bookings reach the studio, no money
                 moves through the site.
     paid ...... PAYMENT_CONFIGURED as well: confirmed once payment is in,
                 which is the client's policy wording.

   NONE OF THEM SAYS "PLACE" OR "SEAT". The same basket checks out a pass
   (lib/passes.ts), which holds no seat until it is redeemed against a date,
   and the sentence is printed under every basket — so it speaks of the
   booking, never of a place in a room.

   TODO(client): `recorded` and `paid` are written for a backend that does
   not exist yet. Confirm them with the studio when it does — how a customer
   pays when the site takes no payment is theirs to say, not ours.

   "SEND THEM YOUR REFERENCE" ONLY WHEN THERE IS A WAY TO. Nothing tells
   the studio about a request today, so the request line ended "the studio
   confirms it once you send them your reference" — and printed it on every
   confirmation, checkout and the FAQ while {@link CONTACT} had no email and
   no phone, WhatsApp had come off the site, and the /contact form was not
   wired (ENQUIRY_CONFIGURED in lib/enquiry.ts). Every visitor was told to do
   something the site gave them no way to do; an end-to-end booking ended on
   that sentence, a Pending status and no channel. So the clause follows the
   channels: with an email or a phone in CONTACT, or the /contact form wired,
   it is said, and <Confirmation> prints the address, the number or the
   contact page as a link under it; with none, the line stops at "keep the
   reference you are given", which is true and actionable at checkout, on
   the confirmation and in the FAQ alike.
   TODO(client): the studio's email and phone, further up this file — filling
   either one (or wiring the form) switches this back with no other edit.
   ========================================================================== */

/** Somewhere a customer can actually send a reference — see the note above. */
export const REFERENCE_CHANNEL_SET = Boolean(CONTACT.email || CONTACT.phone || ENQUIRY_CONFIGURED);

/**
 * The two wordings of the `request` sentence, picked by whether a channel
 * exists. Named so lib/constants.server.ts can make the same choice from the
 * CMS's contact details (`getBookingTerms`) rather than from {@link CONTACT}.
 */
export const BOOKING_REQUEST_TERMS = {
  withChannel:
    "Booking here makes a request that is not yet confirmed. No payment is taken, the request is saved only in this browser, and the studio confirms it once you send them your reference.",
  withoutChannel:
    "Booking here makes a request that is not yet confirmed. No payment is taken and the request is saved only in this browser, so keep the reference you are given.",
} as const;

export const BOOKING_TERMS = {
  request: REFERENCE_CHANNEL_SET ? BOOKING_REQUEST_TERMS.withChannel : BOOKING_REQUEST_TERMS.withoutChannel,
  recorded:
    "Your booking goes straight to the studio. No payment is taken through this site.",
  paid: "Your booking is confirmed once your payment has gone through.",
} as const;

/**
 * The sentence for the backend's current state, read straight from the flags.
 *
 * It used to take the flags as arguments, because they lived in
 * lib/booking.ts and this file is read by server components that cannot
 * import that one — so the FAQ, rendered on the server, pinned its answer to
 * `request` by hand. The flags now sit in lib/bookingFlags.ts, which anything
 * can import, so every surface asks this and none can fall out of step.
 */
export function bookingTerms(): string {
  if (PAYMENT_CONFIGURED) return BOOKING_TERMS.paid;
  if (BOOKING_CONFIGURED) return BOOKING_TERMS.recorded;
  return BOOKING_TERMS.request;
}

/* ==========================================================================
   /faq — the same questions, grouped, plus the ones the rest of the site
   already answers somewhere else.

   ==========================================================================
   EVERY ANSWER HERE IS A SENTENCE THE SITE ALREADY STANDS BEHIND
   ==========================================================================

   The four in {@link HOMEPAGE_FAQ} above are reused verbatim rather than
   rewritten, and the six added to them are each lifted from the place that
   already says it:

     "No experience needed" ........ the client's "Create" line on /about
                                     (p.26 of their copy document)
     walking in vs booking ......... opens on the client's "Make It Your
                                     Way." standfirst on the homepage (p.04),
                                     then the `kind` split lib/workshops.ts
                                     describes
     "am I charged" ................ BOOKING_TERMS, the sentence checkout
                                     and the confirmation print
     "no account to create" ........ the loyalty page's own line
     what a pass is ................ the loyalty page's own line
     private events ................ the page that exists for it: its group
                                     intro (p.31) and its enquiry band (p.37)

   Nothing is paraphrased into a new claim. Where two places said the same
   thing in different words, the longer of the two is the one kept.

   THE CLIENT'S COPY WINS WHERE IT EXISTS. Their copy document rewrote the
   sentences several of these answers were lifted from, and they have asked
   for wording the document did not reach to follow it — so where an answer
   was the old sentence, it is now theirs, verbatim, and no answer says
   "two kinds" or any other count of what the Maison runs, which can change.

   TODO(client): the answers a studio normally needs and this one has still
   not written down — MINIMUM AGE, WHETHER CHILDREN CAN ATTEND, ACCESSIBILITY
   AT EACH MALL, WHAT HAPPENS IF YOU CANNOT MAKE IT, and WHETHER PIECES ARE
   FIRED AND COLLECTED LATER. They are the five most-asked questions a craft
   studio gets and not one of them can be answered from anything in this
   project, so none of them appears below. Add the studio's own wording to a
   group here and the page renders it with no other edit.
   ========================================================================== */
export interface FaqGroup {
  /** What this run of questions is about. A label, never a claim. */
  title: string;
  items: FaqItem[];
}

export const FAQ_GROUPS: readonly FaqGroup[] = [
  {
    title: "Coming to an event",
    items: [
      HOMEPAGE_FAQ[0],
      HOMEPAGE_FAQ[1],
      HOMEPAGE_FAQ[2],
      {
        question: "Do I Need Any Experience?",
        answer: "No experience needed, just pick a project and make it yours.",
      },
    ],
  },
  {
    title: "Booking a place",
    items: [
      {
        question: "What Is the Difference Between Create Anytime and Create Together?",
        answer:
          "Drop in and create, or book a seat for a scheduled session. Create Anytime activities are DIY: come in and make something at your own pace, any time we are set up, with nothing to book. Create Together sessions are guided, each runs on a set date, and those are the ones you book online.",
      },
      HOMEPAGE_FAQ[3],
      {
        question: "Am I Charged When I Book?",
        /*
          The same sentence checkout and the confirmation print — see
          BOOKING_TERMS above. It said "your place is held when you reserve
          it", which no part of the flow does.

          Picked by the flags like the other two, so it changes with them.
          It was pinned to `request` by hand while the flags could only be
          read from lib/booking.ts, which a server component cannot import;
          they are in lib/bookingFlags.ts now.
        */
        answer: bookingTerms(),
      },
      {
        question: "Do I Need an Account?",
        answer: "No. You check out as a guest. There is no account to create.",
      },
    ],
  },
  {
    title: "Groups and passes",
    items: [
      {
        question: "Can You Run Something for My Group?",
        answer:
          "Yes. Maison Palettia creates hands-on experiences for all kinds of groups. Tell us when, who’s coming and what you’d like to make. We’ll help turn the idea into an experience made for your group.",
      },
      {
        question: "What Is a Pass?",
        answer:
          "A pass holds your sessions in advance, so when a date comes round the only decision left is what to make. Choose one, add it to your booking, and check out as a guest.",
      },
    ],
  },
];
