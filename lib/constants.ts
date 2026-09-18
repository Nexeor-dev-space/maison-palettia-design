import type {
  ContactDetails,
  EditorialPanel,
  FaqItem,
  GalleryTile,
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
 * `megamenu: true` marks the entry the header opens as a panel rather than
 * navigating, so the two never drift apart — it is a flag rather than a match
 * on the path, because Workshops and Sessions deliberately share one.
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
    first-order questions. Journal, FAQ, Gallery and Passes keep their routes
    and live in the footer and the mobile menu, which read this list in order.
  */
  { label: "Experiences", href: "/events", megamenu: true },
  { label: "Private events", href: "/private-events" },
  { label: "Locations", href: "/locations" },
  { label: "About", href: "/about", utility: true },
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
/*
  "/" came off this list when the homepage hero became a Light Sage
  composition: pale ink over a light field fails contrast. It keeps a
  transparent bar with dark ink instead — see LIGHT_HERO_ROUTES below.
*/
export const DARK_HERO_ROUTES: readonly string[] = ["/private-events"];

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
      { label: "Passes", href: "/loyalty" },
      { label: "Gallery", href: "/gallery" },
    ],
  },
  {
    title: "The Maison",
    items: [
      { label: "About", href: "/about" },
      { label: "Locations", href: "/locations" },
      { label: "Journal", href: "/blog" },
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
 * The homepage hero — one photograph.
 *
 * Cut from assets/creative-masters/painting.jpg (3457x5185) to a 4:5 window
 * centred 42% down the frame, which is where the painter's hand, the brush and
 * the loaded palette all sit. Higher in the frame loses the hand; lower loses
 * her head. Exported at 2000x2500 and 514KB — it is the page's LCP image, so
 * it is the one asset on the site worth keeping deliberately small.
 *
 * `position` holds the crop above centre and left of centre, and both numbers
 * were measured rather than chosen. The hero is `h-svh`, so a wide desktop
 * window is a short letterbox onto a tall picture and a phone is very nearly
 * the whole of it: 38% down keeps the hand in frame on the wide crop without
 * cutting her head off on the narrow one.
 *
 * The 34% across only does anything on a portrait phone. A viewport narrower
 * than 4:5 is height-constrained, so the sides are what get cut — about 15% of
 * the width at 360x640 — and the subject of the photograph is not in the
 * middle of it. Centred, that crop sheared her forearm at the frame edge and
 * ran the brush off it; at 34% the hand, the brush and the wrist all sit
 * inside the picture. Above 4:5 the image is width-constrained and this number
 * has no effect at all, so the desktop framing is unchanged by it.
 *
 * It replaces the triptych's three assets — a painting, the potter's-wheel
 * video and a still of unglazed cups. None of them is referenced here any more.
 */
export const HERO_IMAGE: ImageAsset = {
  src: "/images/hero/making.jpg",
  alt: "A painter at her easel, brush in hand, working a canvas of coral and blush roses among deep teal leaves, a loaded palette beside her.",
  position: "34% 38%",
};


/**
 * A picture that is cropped rather than placed: it carries its own
 * `position` (the CSS object-position for its crop) alongside the source, and
 * a `poster` when the source is footage. Used by the brand introduction, the
 * captioned images and the testimonials ground.
 *
 * Adjust `position` to re-frame; never swap in a differently-shaped file
 * without re-checking the crop at every breakpoint.
 */
export interface HeroPanel {
  src: string;
  alt: string;
  /** CSS object-position for the editorial crop. */
  position: string;
  /** First frame, for a video panel: it holds the layout while the file loads. */
  poster?: string;
}

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
 * That is the same rule {@link SOCIAL_LINKS}, {@link WHATSAPP} and
 * {@link LEGAL_NAV} already follow: the code is ready, the absence is honest,
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

/** TODO(client): awaiting live social profile URLs. */
export const SOCIAL_LINKS: SocialLink[] = [
  { label: "Instagram", href: null },
  { label: "Facebook", href: null },
];

/**
 * Brand introduction (homepage section 02).
 *
 * Portrait at 1333x2000, which is a 2:3 plate; the section renders it at 4:5
 * on a phone and at desktop, so the crop takes its loss off the top and foot.
 *
 * This was a photograph of two clay-covered hands drawing a vessel up on the
 * potter's wheel — the single most prominent piece of pottery on /about — and
 * the client has taken the brand off the wheel. A hand at a canvas replaces
 * it: the same thing the picture was there to say (somebody's hands, mid
 * making, not a product shot) in a medium the studio still teaches.
 */
export const BRAND_INTRO_IMAGE: HeroPanel = {
  src: "/images/experience/painting.jpg",
  alt: "A hand drawing a brush across a small canvas on an easel, working a white bloom over a soft blue ground, a loaded palette below it.",
  position: "50% 45%",
};

/** A photograph together with the small wall label that sits under it. */
export interface CaptionedImage extends HeroPanel {
  caption: string;
}

/**
 * Section 04 — the experience.
 *
 * Three scales, three subjects: the room, the making, the material.
 *
 * ALL THREE WERE POTTERY AND ALL THREE HAVE BEEN REPLACED. They were a wall
 * of finished pots on a studio shelf, a hand at a canvas, and a maker lifting
 * a glazed dish out of a kiln in a heat glove — two of the three unusable
 * once the client took the brand off the wheel, and the third moved up to
 * carry the brand introduction. The `glaze` key went with them: it named a
 * pottery process, so it is `pigment` now, and /about reads the new name.
 *
 * TODO(client): this section is the one that most wants real workshop
 * photography — people at a table together, tools, someone else's hands. When
 * it arrives, replace these three and keep the shapes: 2:1, 4:5 and 1:1. What
 * is standing in for "the room" is a still life rather than a room, because
 * the project no longer holds a photograph of the studio that is not a
 * photograph of the wheel.
 */
export const EXPERIENCE_IMAGES: {
  studio: CaptionedImage;
  painting: CaptionedImage;
  pigment: CaptionedImage;
} = {
  studio: {
    src: "/images/editorial/late-lilies.jpg",
    alt: "Pale blush and white lilies opening against a bare wall, petals curling back as they age.",
    position: "50% 50%",
    caption: "Late lilies, studio wall",
  },
  painting: {
    src: "/images/workshops/watercolour-in-progress.jpg",
    alt: "A watercolour on the easel — deep red blooms breaking over washes of pale yellow and blue.",
    position: "50% 50%",
    caption: "Colour, still wet",
  },
  pigment: {
    src: "/images/experience/pigment-on-paper.jpg",
    alt: "Pigment sinking into damp paper — deep red blooms bleeding into blue and yellow-green washes.",
    position: "50% 50%",
    caption: "Pigment into paper",
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
 * TODO(client): the second panel is an artwork rather than a photograph of
 * the studio, because the project holds no wide shot of a room that is not a
 * shot of the potter's wheel. It is the first place to spend real workshop
 * photography when it arrives: a room of people making, shot wide, with air
 * around them and one side of the frame left empty. Keep the shape (roughly
 * 3:2) and the panel takes it unchanged; if the new picture is dark, set it
 * as the `foot` spread instead of `field`.
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
      // A watercolour wash — blue and violet breaking into soft yellow-green,
      // 2100x1448 and so almost exactly the 3:2 this panel wants.
      //
      // IT REPLACES A STOREROOM WALL OF TERRACOTTA POTTERY, which the client
      // has taken the brand off. That plate was the hardest this panel ever
      // carried and the note on it said so: floor-to-ceiling racking with a
      // pot against a shelf edge in every square inch, no quiet passage at any
      // crop, and the caption legible only because the wash under it was doing
      // all of the work. This is the opposite kind of picture and the one the
      // TODO above asked for — a broad tonal field with room in it — so the
      // caption sits on the photograph rather than on a scrim over it.
      src: "/images/editorial/wash-and-light.jpg",
      alt: "A watercolour passage of deep blue and violet washes breaking into soft yellow-green.",
      // Centred. The plate is 3:2 and the panel crops it a little either way
      // depending on the window; the wash has no subject to hold, so there is
      // nothing to bias the crop towards.
      position: "50% 50%",
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
 * The closing invitation — plan your visit.
 *
 * The conversion moment, written as an invitation rather than an offer.
 * Everything above it has been showing and explaining; this is the only place
 * Maison Palettia speaks to the visitor directly, and the copy is kept short
 * because by this point nothing needs explaining again.
 *
 * IT CLOSES /about NOW, not the homepage — moved at the client's ask, and in
 * the move it displaced an <EventsCta> that was making the identical ask in
 * fewer words. See <PlanYourVisit>. Nothing in this object changed with the
 * route; the notes below say which page each argument was written about.
 *
 * TODO(client): placeholder wording, written to the brief's brand voice.
 * Replace with approved copy. The composition holds as long as the title stays
 * three short lines, the description stays one sentence, and each step's
 * detail stays under about forty characters.
 *
 * On "Come make something with us.": MAISON_PHILOSOPHY deliberately avoids a
 * fourth "Make …" heading, and this one takes it back on purpose. It is the
 * only statement in the second person and the only one with "us" in it, and
 * it was written to land immediately after "Made slowly. Felt deeply." — a
 * call and its answer, which is how the homepage used to end.
 *
 * THAT PAIRING IS GONE AND THE LINE IS STILL THE RIGHT ONE. The philosophy
 * block now sits in <TheMaison> near the top of /about and this closes the
 * same page, so the two no longer touch; what they have instead is a page
 * that opens on the Maison's own words and ends by asking the reader in. The
 * heading earns its place on the change of person alone — every other one on
 * that page instructs, and this one asks.
 *
 * `primaryCta` points at the workshops listing rather than at a booking flow
 * on purpose: the page should hand the visitor to the collection and let them
 * choose there. When a dedicated experiences route exists, re-point this one
 * field — no component knows the path.
 */
export const PLAN_YOUR_VISIT: VisitInvitation = {
  eyebrow: "Plan Your Visit",
  title: ["Come make", "something", "with us."],
  signature: "see you at the maison",
  description:
    "Choose an experience, find a date that suits you, and give yourself an afternoon in the studio.",
  primaryCta: { label: "Explore events", href: "/events" },
  secondaryCta: { label: "Contact the Maison", href: "/contact" },
  /*
    A SIGNPOSTED ROUTE TO /private-events. The page exists and is linked in the
    footer, and a footer is where a visitor looks for a link they already know
    is there — not where someone organising a birthday finds out the Maison
    does birthdays. This section is a designated "what next", and a group
    organiser reading "come make something with us" is exactly the reader it
    was missing a door for.

    IT USED TO BE THE HOMEPAGE'S ONLY ROUTE TO THAT PAGE, and this section has
    since moved to /about, so the homepage no longer has one outside the
    footer. Worth knowing before anything else is moved: the door still exists,
    it is just no longer on the page most visitors land on.

    It is deliberately a third tier rather than a promoted button: the page has
    one dominant action and it is booking a seat.
  */
  groupCta: {
    note: "Planning something for a group?",
    link: { label: "Private events", href: "/private-events" },
  },
};

/**
 * The ground behind the guest quotes.
 *
 * WAS THIRTY-EIGHT SECONDS OF A POT BEING OPENED AND DRAWN UP ON THE WHEEL.
 * The note here used to argue for footage over a still — a quote about a
 * first afternoon at the wheel sits better on the wheel turning than on a
 * photograph of it stopped — and the client has taken the brand off the
 * wheel, so the argument went with the clip. Both the footage and its poster
 * frame were pottery, and the project holds no other footage, so this is a
 * still now; <HeroVideo> had no other caller and is gone with it.
 *
 * Cut from assets/hero-masters/i-2.jpg, an impressionist oil of children in
 * an orchard, and cut from the FOOT of that painting on purpose: the upper
 * two thirds have faces in them, and a face behind somebody else's quote
 * reads as a picture of the person speaking. The bottom band is skirt, grass
 * and dappled light — brushwork rather than a scene — which is what a ground
 * should be. 2000x1125 at 307KB, against the 4MB the video cost.
 *
 * Decorative, so the alt is empty: the section's meaning is the quotes, and
 * describing the wallpaper to a screen reader only delays them.
 *
 * TODO(client): still no guests in frame. This is the one section whose
 * subject is the people who came, and the project holds no photograph of them.
 */
export const TESTIMONIALS_GROUND: ImageAsset = {
  src: "/images/testimonials/orchard-in-oil.jpg",
  alt: "",
  /*
    Centred. The plate is 16:9 and the section is wider than that at every
    desktop shape, so `cover` crops it top and bottom there; on a phone the
    crop goes the other way. The band has no subject to hold either way.
  */
  position: "50% 50%",
};

/* ==========================================================================
   Homepage gallery — the mosaic's tiles, in the order they are laid.

   ORDER IS COMPOSITION HERE, NOT RANKING. <Gallery> gives the first tile the
   large cell and cuts the rest around it, so moving an entry up this list
   changes the shape of the section rather than only its sequence. The first
   should be the widest-reading picture of the four; the last sits in the long
   landscape cell at the foot and wants a picture that survives being cropped
   to 8:3.

   THREE OF THESE FOUR WERE THE POTTER'S WHEEL before the pottery removal, and
   what stands in is honest about what is left: the project holds exactly one
   process photograph that is not pottery and not already on this page — the
   hand at the canvas, which leads — and the other three are work rather than
   working.

   FOUR DIFFERENT PICTURES, WHICH IS HARDER THAN IT SOUNDS HERE. The set that
   came out of the pottery removal was three watercolours and a photograph, and
   two of those watercolours — `watercolour-in-progress` and `pigment-on-paper`
   — are crops of the same painting. With gutters between the plates that was
   merely repetitive. Flush, with no edge between the cells, two crops of one
   painting side by side read as a single smeared tile and the whole band looks
   like a mistake. So `pigment-on-paper` is out (it still carries /about) and
   the lilies are in, and the order sets the one photograph next to the copy
   tile, the strongest colour in the smallest cell, and the broadest wash in
   the long one. Subject, scale and tone all change between neighbours.

   TODO(client): this is the section the studio shoot should reach first. Four
   frames of people making things, in the activities the Maison actually runs.
   At least one of them should be footage: the grid takes a `video` tile with
   no change to the component, and a table mid-afternoon moving is worth more
   here than any still.
   ========================================================================== */
export const GALLERY_TILES: GalleryTile[] = [
  {
    kind: "image",
    src: "/images/experience/painting.jpg",
    alt: "A hand drawing a brush across a small canvas on an easel, working a white bloom over a soft blue ground, a loaded palette below it.",
    // The tall cell is a 2:3 portrait cropped to roughly 3:2 at desktop, so
    // two thirds of the height goes. Held high: the hand and the brush tip are
    // in the top half, and the loss is spent on the table along the foot.
    position: "50% 38%",
  },
  {
    kind: "image",
    src: "/images/recent/late-blooms.jpg",
    alt: "Pale blush and white lilies opening against a bare wall, petals curling back as they age.",
    // Portrait into a 2:1 slot. Centred a little low, where the flowers are.
    position: "50% 52%",
  },
  {
    kind: "image",
    src: "/images/workshops/watercolour-in-progress.jpg",
    alt: "A watercolour on the easel — deep red blooms breaking over washes of pale yellow and blue.",
    position: "50% 45%",
  },
  {
    kind: "image",
    src: "/images/creative/colour-in-layers.jpg",
    alt: "Washes of yellow-green and violet laid over one another on damp paper, the colour still finding its edges.",
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
