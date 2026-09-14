import type {
  ContactDetails,
  EditorialPanel,
  FaqItem,
  ImageAsset,
  NavGroup,
  NavItem,
  SocialLink,
  VisitInvitation,
} from "@/types";

/** Canonical brand + site-wide identity values. */
export const SITE = {
  name: "Maison Palettia",
  legalName: "Maison Palettia Events L.L.C.",
  /** Shown in the header wordmark and footer. */
  tagline: "Art, craft and pottery workshops in Dubai",
  locale: "en_AE",
  /** TODO(client): replace with the production domain before launch. */
  url: "https://www.maisonpalettia.com",
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
 * `megamenu: true` marks the entry the header opens as a panel rather than
 * navigating, so the two never drift apart — it is a flag rather than a match
 * on the path, because Workshops and Sessions deliberately share one.
 */
export const MAIN_NAV: NavItem[] = [
  /*
    Three entries, and the cut is still the point.

    It was seven — Workshops, Sessions, Gallery, About, Journal, FAQ, Contact —
    which is a site map rather than a navigation. Workshops and Sessions were
    two words for one page and are now one: Events, carrying the strands menu.
    Gallery had no content behind it (public/images/gallery holds a .gitkeep),
    so a page existed only to give the link somewhere to go. Journal and FAQ
    are worth reading and are not what anyone arrives for; both keep their
    routes and move to the footer.

    Events leads rather than About. The studio's business is a table in a mall
    on a fixed date, the first slot is the strongest one a bar has, and a
    visitor who wants the story will find it in the second.

    Contact rejoined the bar itself rather than staying `secondary` (mobile
    and the footer only) once it had a real page behind it — the two go
    together: a link worth promoting to the front row is a link worth someone
    finding something at the other end of.

    It is marked `utility` rather than dropped back out: on the desktop bar it
    sits with search on the right, because reaching the studio is a different
    kind of errand from choosing where to go in the programme. The mobile menu
    and the footer render this list in order and are unaffected.
  */
  { label: "Events", href: "/events", megamenu: true },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact", utility: true },
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
export const DARK_HERO_ROUTES: readonly string[] = ["/"];

/**
 * The single primary call to action, reused in the header and footer.
 *
 * It points at the workshop listing because that is where booking begins and
 * there is no booking route yet — the listing is a placeholder awaiting Phase
 * 5. TODO(client): when a real booking or session-detail flow exists, change
 * this one href and every surface that offers the action follows.
 */
export const PRIMARY_CTA = {
  label: "Book an event",
  href: "/events",
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
  {
    title: "The Maison",
    items: [
      { label: "About", href: "/about" },
      { label: "Journal", href: "/blog" },
    ],
  },
  {
    title: "Create",
    items: [
      { label: "Events", href: "/events" },
      /* Grown, per the rule above: /loyalty is a route that exists now. It is
         deliberately not promoted into MAIN_NAV — that list is three entries
         by design and changing it is a navigation decision, not a side effect
         of building a page. */
      { label: "Passes", href: "/loyalty" },
      { label: "Gallery", href: "/gallery" },
    ],
  },
  {
    title: "Visit",
    items: [
      { label: "Contact", href: "/contact" },
      { label: "Check a booking", href: "/booking-status" },
      { label: "FAQ", href: "/faq" },
    ],
  },
];

/**
 * TODO(client): neither /privacy nor /terms exists as a route yet, so both
 * links 404 today. They are kept because the pages are intended and the
 * footer is where they belong; build them, or empty this array, before launch.
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

/**
 * Homepage hero — a three-part composition read left to right:
 * painting → making → object.
 *
 * The panels abut as one continuous frame rather than three cards, so each
 * entry carries its own `position` (the CSS object-position for its crop)
 * alongside the source. Adjust `position` to re-frame a panel; never swap in
 * a differently-shaped file without re-checking the crop at every breakpoint.
 */
export interface HeroPanel {
  src: string;
  alt: string;
  /** CSS object-position for the editorial crop. */
  position: string;
  /** First frame, for the video panel: it holds the layout while the file loads. */
  poster?: string;
}

export const HERO_TRIPTYCH: {
  painting: HeroPanel;
  making: HeroPanel;
  ceramic: HeroPanel;
} = {
  painting: {
    // Client artwork. It replaces a watercolour of blooms and is a squarer
    // plate than that one — 2810x3548 against 5426x8000 — so the crop was
    // re-checked at each breakpoint rather than inherited. The panel's own
    // shape is what moves, not the picture: a wide band on a phone, a tall
    // slice at desktop.
    src: "/images/hero/i-1.jpg",
    alt: "An oil landscape worked in heavy impasto: slender trees on a hillside meadow, flowering shrubs below them, and banked clouds over distant hills.",
    position: "50% 46%",
  },
  making: {
    // Web encode of the master at assets/video-masters/bg-video.mp4 — outside
    // public/ so it is retained without being served. The master is a
    // 4K, 27 Mbps, 30 MB file — an order of magnitude too heavy to sit in the
    // first paint of the homepage — so it stays in the repository as the
    // source of truth and this 1000px H.264 derivative (~2.4 MB, no audio,
    // faststart) is what ships. Re-run the encode if the master changes.
    src: "/videos/bg-video-web.mp4",
    alt: "Hands drawing a vessel up on the potter's wheel.",
    position: "50% 50%",
    poster: "/images/hero/making-poster.jpg",
  },
  ceramic: {
    // 2000px web encode of assets/hero-masters/stacked-cups.jpg (3744px, 1.8MB).
    // The panel is never wider than ~34vw, so 2000px still covers a 4K display
    // at 2x, and the file lands at 311KB against the 3.6MB the painting beside
    // it is still carrying as an unresized master.
    src: "/images/hero/i-3.jpg",
    alt: "Four hand-built cups, unglazed, nested at angles in a leaning stack on pale plaster.",
    // The centre of the stack, on both axes: the panel is a tall slot at `lg`
    // and cuts the sides, and a wide band on a phone where it cuts the top and
    // foot instead, so the crop has to hold from the middle either way.
    position: "48% 50%",
  },
};

/** TODO(client): awaiting real address, email and phone number. */
export const CONTACT: ContactDetails = {
  addressLines: ["Dubai", "United Arab Emirates"],
  email: null,
  phone: null,
};

/**
 * The floating WhatsApp widget's destination, and nothing else.
 *
 * Deliberately its own constant rather than a field on {@link CONTACT}: that
 * shape is the studio's published contact details, read by the footer, the
 * contact page and the invitation, and a chat handle is a different kind of
 * thing with a different lifecycle. Keeping it separate also means the widget
 * can be switched on or off without touching anything that renders an address.
 *
 * HOW TO TURN IT ON. Put the number here in full international form, digits
 * only — country code first, no `+`, no spaces, no dashes. A UAE mobile looks
 * like "9715XXXXXXXX". That is the whole change; <WhatsAppWidget> renders
 * itself the moment this is not null.
 *
 * WHY IT IS NULL. There is no WhatsApp number anywhere in this project —
 * `CONTACT.phone` is null too — and a floating button that opens a chat with
 * nobody is worse than no button. The widget renders nothing until this is
 * set, which is the same rule the footer already applies to social links.
 *
 * TODO(client): supply the studio's WhatsApp business number.
 */
export const WHATSAPP: {
  /** Digits only, country code first. `null` hides the widget entirely. */
  number: string | null;
  /** Prefilled first message. Optional; the chat opens empty without it. */
  greeting: string | null;
} = {
  number: null,
  greeting: "Hello! I would like to ask about an upcoming event.",
};

/** TODO(client): awaiting live social profile URLs. */
export const SOCIAL_LINKS: SocialLink[] = [
  { label: "Instagram", href: null },
  { label: "Facebook", href: null },
];

/**
 * Brand introduction (homepage section 02).
 *
 * Client photography, and the first place on the page where the hands are
 * somebody's rather than a frame lifted from the hero's footage. Portrait at
 * 1000x1500, which is a 2:3 plate; the section renders it at 4:5 on a phone
 * and at desktop, so the crop takes its loss off the top and foot.
 */
export const BRAND_INTRO_IMAGE: HeroPanel = {
  src: "/images/about/about-img.jpg",
  alt: "Two clay-covered hands drawing a tall, narrow vessel upward on the potter's wheel, wet slip running back down the wheel head.",
  position: "50% 45%",
};

/** A photograph together with the small wall label that sits under it. */
export interface CaptionedImage extends HeroPanel {
  caption: string;
}

/**
 * Homepage section 04 — the experience.
 *
 * Three scales, three subjects: the room, the making, the material. All three
 * are cut from assets already in the project rather than shot separately —
 * the first two from the master wheel footage at assets/video-masters/bg-video.mp4
 * (its background carries the only studio atmosphere the project holds), the
 * third from the watercolour used in the hero.
 *
 * TODO(client): this section is the one that most wants real workshop
 * photography — people at a table together, tools, someone else's hands. When
 * it arrives, replace these three and keep the shapes: 2:1, 4:5 and 1:1. The
 * band is cut at the full 2160px width of the source frame because it runs
 * the whole measure; anything narrower would be upscaled on a large display.
 */
export const EXPERIENCE_IMAGES: {
  studio: CaptionedImage;
  painting: CaptionedImage;
  glaze: CaptionedImage;
} = {
  studio: {
    src: "/images/experience/finished-shelf.jpg",
    alt: "Three shelves of hand-thrown pottery against a white studio wall — rows of pale, unglazed bowls, cups and vases, with a few glazed pieces among them.",
    /*
      Held a little above centre. The plate is a 2:1 band and the photograph is
      3:2, so a quarter of its height is cropped away; centred, that takes the
      tops off the glazed gourds on the top shelf, which are the only strong
      colour in the frame. Lifting the crop keeps them and spends the loss on
      the empty wall along the foot instead.
    */
    position: "50% 44%",
    caption: "Finished pieces, studio shelf",
  },
  painting: {
    src: "/images/experience/painting.jpg",
    alt: "A hand drawing a brush across a small canvas on an easel, working a white bloom over a soft blue ground, a loaded palette below it.",
    position: "50% 50%",
    caption: "Brush to canvas",
  },
  glaze: {
    src: "/images/experience/glaze.jpg",
    alt: "A maker in a work apron lifting a wave-edged dish glazed in deep blue, one hand in a kiln glove.",
    position: "50% 50%",
    caption: "Glazed and fired",
  },
};

/**
 * The editorial panels — two full-bleed pauses in the homepage.
 *
 * They are not sections of content. Each is one artwork at the full width of
 * the window with a caption laid on it, and their job on the page is the
 * silence they put either side of the sections that do the work: the first
 * lands after the workshops listing, the second closes the page. Read in
 * order they are one argument in two spreads — the invitation, then what the
 * invitation is actually about.
 *
 * Both plates are cut from masters already in the project, at the sizes the
 * treatment needs rather than the sizes the earlier sections needed. A panel
 * runs the whole window, so the plate is cut wide enough to cover a desktop
 * viewport without upscaling and tall enough to survive the portrait crop a
 * phone takes out of the same file — roughly 3:2, and never the 2:1 band a
 * fixed-height figure would want.
 *
 * TODO(client): the second panel is a still life because nothing in the
 * project can carry a caption any other way — every frame of the wheel
 * footage is a bright vessel against a busy shelf, with no quiet field in it
 * at any crop. It is the first place to spend real workshop photography when
 * it arrives: a room of people making, shot wide, with air around them and
 * one side of the frame left empty. Keep the shape (roughly 3:2) and the
 * panel takes it unchanged; if the new picture is dark, set it as the `foot`
 * spread instead of `field`.
 */
export const EDITORIAL_PANELS: {
  movement: EditorialPanel;
  making: EditorialPanel;
} = {
  movement: {
    eyebrow: "Mood > Movement",
    statement: ["Create with your hands.", "Slow down.", "Make something yours."],
    linkLabel: "Our Philosophy",
    linkHref: "/about",
    index: "01 / 02",
    image: {
      // A mural painted across the side of a brick building, supplied by the
      // client. It replaces a close crop of the hero's watercolour, and it is
      // a different kind of picture: where that was a smooth tonal field with
      // a dark two thirds to sit a caption on, this is dense and even —
      // painted flowers at architectural scale over warm brickwork, busy from
      // edge to edge with no quiet passage anywhere in it.
      //
      // The foot scrim is what makes it work, and it was measured rather than
      // assumed. Against the caption band the picture averages a mid warm
      // grey; under the scrim's own gradient that lands cream type at about
      // 6.6:1 where the scrim is strongest, 5.4:1 through the middle of the
      // band and 4.7:1 at its weakest — clear of 4.5:1 for the small type at
      // every point, and far clear of the 3:1 the statement owes.
      src: "/images/editorial/mural-on-brick.jpg",
      alt: "A mural covering the side of a brick building: blue and violet flowers, seed heads and a fallen branch painted at architectural scale, growing around the windows.",
      // The vertical figure is the one in play on a desktop window, which is
      // wider than the plate and so crops it top and bottom; 15% holds the
      // crop high, where the caption band came out a third of a stop darker
      // than it does over the foot of the mural. The horizontal figure only
      // bites on a phone, where the crop is a tall slice instead, and there
      // it keeps that slice off the busiest column of windows.
      position: "30% 15%",
    },
  },
  making: {
    eyebrow: "Mood > Making",
    statement: ["Here, creativity", "is about the moment", "as much as the making."],
    linkLabel: "The Maison Palettia Experience",
    // The brief asks this to point at an experiences route. There isn't one
    // yet, and the listing is the nearest true thing — the same substitution
    // PLAN_YOUR_VISIT already makes for "Explore Experiences". Re-point this
    // one field when the route lands; nothing else knows the path.
    linkHref: "/events",
    index: "02 / 02",
    image: {
      // A storeroom wall of finished terracotta — floor-to-ceiling steel
      // racking packed with jugs, urns and water pots, supplied by the client.
      // Cut from assets/editorial-masters/shelved-pots.jpg.
      //
      // The hardest plate this panel has carried. It has no quiet passage at
      // all: every square inch is a pot against a shelf edge, so local
      // contrast is high everywhere and there is no crop that opens a field
      // for the caption the way the original still life did. The White Rock
      // wash below is doing all of the work, and its stops are re-measured
      // against this photograph rather than inherited.
      src: "/images/editorial/shelved-pots.jpg",
      alt: "Floor-to-ceiling steel shelving packed with terracotta pottery — rows of jugs, urns and water pots in orange, buff and cream, a few glazed in green and red.",
      // Held just above centre. The racking runs the full height, so this is
      // not choosing a subject so much as choosing which shelf edge lands
      // behind the statement; a little high keeps the busiest, darkest row of
      // dark-glazed pots down at the foot and out from under the caption.
      position: "50% 42%",
    },
  },
};

/**
 * Homepage section 08 — the Maison philosophy.
 *
 * A manifesto rather than an about block: four fields, no imagery, and
 * nothing that would need verifying. The statement is stored a line at a time
 * because the break between them is art direction — the second line steps
 * across the measure to meet the paragraph below it — not a wrap the browser
 * is free to undo.
 *
 * TODO(client): placeholder wording, written to the brief's brand voice.
 * Replace with approved copy; the composition holds as long as the statement
 * stays two short lines and the accent stays three or four words.
 *
 * The statement deliberately avoids the page's other headings. "Make time to
 * create." already opens the workshops, "Make space for creativity." opens
 * the experience, and "Make something yours" closes it — a third "Make …"
 * would read as a tic rather than a refrain. The accent avoids "made by hand"
 * (the brand introduction) and "take it home" (the experience) for the same
 * reason.
 */
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

/**
 * Homepage section 06 — the About teaser.
 *
 * A doorway, not a summary. The full story is at /about and this exists only
 * to say there is one; the moment it grows into an argument it becomes the
 * second philosophy section the homepage just had removed.
 */
export const ABOUT_TEASER = {
  eyebrow: "The Maison",
  title: ["A room, a table,", "and time to use them."],
  body:
    "Maison Palettia is a creative space where art, craft and community come together — a place to slow down and make something with your hands.",
  cta: "Our story",
} as const;

export const MAISON_PHILOSOPHY: {
  eyebrow: string;
  /** One entry per line. The break is composition, not a wrap. */
  title: readonly string[];
  description: string;
  /** The script accent — a signature, kept to a few words. */
  accent: string;
} = {
  eyebrow: "The Maison",
  title: ["Made slowly.", "Felt deeply."],
  description:
    "There is no rush here, and no right answer — only materials, time, and a room of people finding out what their hands can do.",
  accent: "the long way round",
};

/**
 * Homepage section 09 — plan your visit.
 *
 * The page's one conversion moment, written as an invitation rather than an
 * offer. Everything above it has been showing and explaining; this is the only
 * place Maison Palettia speaks to the visitor directly, and the copy is kept
 * short because by this point nothing needs explaining again.
 *
 * TODO(client): placeholder wording, written to the brief's brand voice.
 * Replace with approved copy. The composition holds as long as the title stays
 * three short lines, the description stays one sentence, and each step's
 * detail stays under about forty characters.
 *
 * On "Come make something with us.": the philosophy section deliberately
 * avoids a fourth "Make …" heading, and this one takes it back on purpose. It
 * is the only statement on the page in the second person, the only one with
 * "us" in it, and it lands immediately after "Made slowly. Felt deeply." — so
 * the two read as a call and its answer, which is how the page is meant to
 * end. Every other heading on the page instructs; this one asks.
 *
 * `primaryCta` points at the workshops listing rather than at a booking flow
 * on purpose: the homepage should hand the visitor to the collection and let
 * them choose there. When a dedicated experiences route exists, re-point this
 * one field — no component knows the path.
 */
export const PLAN_YOUR_VISIT: VisitInvitation = {
  eyebrow: "Plan Your Visit",
  title: ["Come make", "something", "with us."],
  signature: "see you at the maison",
  description:
    "Choose an experience, find a date that suits you, and give yourself an afternoon in the studio.",
  primaryCta: { label: "Explore events", href: "/events" },
  secondaryCta: { label: "Contact the Maison", href: "/contact" },
  steps: [
    { number: "01", name: "Choose", detail: "Find the experience that feels right." },
    { number: "02", name: "Book", detail: "Pick a date and reserve your seat." },
    { number: "03", name: "Make", detail: "Arrive, settle in, and begin." },
  ],
};

/**
 * The ground behind the guest quotes — the studio at the width of the window,
 * running.
 *
 * Client-supplied footage rather than a still: thirty-eight seconds of a pot
 * being opened and drawn up, which is the one thing on the page that shows the
 * making actually taking time. A quote about a first afternoon at the wheel
 * sits better on the wheel turning than on a photograph of it stopped.
 *
 * The master at assets/video-masters/testimonial-bg.mp4 is 4K, 24 Mbps and 116 MB —
 * two orders of magnitude too heavy to put behind a section — so it stays in
 * the repository as the source of truth and this 1600px H.264 derivative
 * (~4 MB, no audio, faststart) is what ships. Re-run the encode if the master
 * changes; the recipe is in the same shape as bg-video-web.mp4 above.
 *
 * TODO(client): still no guests in frame. This is the one section whose
 * subject is the people who came, and every asset in the project shows either
 * an object or one anonymous pair of hands.
 */
export const TESTIMONIALS_GROUND: HeroPanel = {
  src: "/videos/testimonial-bg-web.mp4",
  alt: "The studio: clay-covered hands opening and drawing up a small vessel on the potter's wheel.",
  /*
    Centred. The footage is 16:9 and the section is wider than that at every
    desktop shape, so `cover` crops it top and bottom there and this has no
    effect at all — it is here for narrow screens, where the crop goes the
    other way. The wheel sits centre-left in frame and the hands work across
    the middle, so dead centre is the half worth keeping on a phone.
  */
  position: "50% 50%",
  /* First frame. Holds the section while the file buffers. */
  poster: "/images/testimonials/room-poster.jpg",
};

/* ==========================================================================
   Homepage gallery.

   Existing photographs, all of them already in the repository and already
   optimised — nothing was added or re-encoded for this. They are process
   shots rather than shelves of finished work, because the section's job is to
   let someone picture themselves at the table: hands in the clay, a brush
   half-way through a bloom, a studio with its shelves behind.

   The finished-work strip that used to sit on the homepage is a different
   thing and now lives on /about. This is not that renamed.

   TODO(client): four is thin for a gallery and these are the only process
   photographs in the project that are both on-message and light enough to put
   on the homepage. The studio shoot should replace all four.
   ========================================================================== */
export const GALLERY_IMAGES: ImageAsset[] = [
  {
    src: "/images/workshops/throwing-on-the-wheel.jpg",
    alt: "Two clay-slicked hands steadying a wide-shouldered pot turning on the wheel, studio shelves of pale blue mugs behind.",
  },
  {
    src: "/images/experience/pressing-the-wall.jpg",
    alt: "Fingers drawing the wall of a tall pot upward on the wheel, wet clay running over the knuckles.",
  },
  {
    src: "/images/workshops/watercolour-in-progress.jpg",
    alt: "A watercolour on the easel — deep red blooms breaking over washes of pale yellow and blue.",
  },
  {
    src: "/images/experience/studio-shelf.jpg",
    alt: "A maker's clay-covered forearm at the wheel, with shelves of blue-glazed mugs against whitewashed brick behind.",
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
    question: "Where do the events happen?",
    answer:
      "Maison Palettia has no studio door of its own — we set up inside a mall for the day. Every event on the programme names its mall and the area it is in, so you know where you are going before you book.",
  },
  {
    question: "How long does an event run?",
    answer:
      "Each one runs to a fixed start and finish time rather than a drop-in window. Both times, and the length of the event, are on its page.",
  },
  {
    question: "Do I need to bring anything?",
    answer:
      // TODO(client): confirm. This is the line the events page and the About
      // page already use, and it is the one claim here about what the studio
      // supplies rather than about how the programme is organised.
      "Everything is provided. Bring nothing but yourself.",
  },
  {
    question: "How do I book a place?",
    answer:
      "Choose a date from the programme, open it, and keep your place from that page. Each event shows how many places are left before you start.",
  },
];
