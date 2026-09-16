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
export const DARK_HERO_ROUTES: readonly string[] = ["/", "/private-events"];

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
         of building a page. Same for /private-events, added on the same rule
         when that page was built: it is a real route, so the footer carries
         it, and the bar is left alone. */
      { label: "Private events", href: "/private-events" },
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
 * THE HOMEPAGE HERO — one film, looping, and nothing else behind it.
 *
 * It replaced a carousel of four photographs. A hero that turns every six
 * seconds is four openings rather than one, and it spent its whole budget
 * proving the Maison does more than one thing — which the Creative Experiences
 * menu three sections down now does properly, with a name under every picture.
 * A single film says the same thing better: hands, a brush, paint going onto
 * cloth, continuously.
 *
 * THE POSTER IS A FRAME OF THE FILM, not a photograph chosen to stand near it.
 * Cut from the video itself at three seconds, so the still and the moving
 * image are the same shot and the swap when the film starts is invisible.
 * It is also what a reader who has asked for reduced motion gets instead of
 * the video — see <Hero>, where the film is hidden outright rather than paused
 * with a play button nobody asked for.
 *
 * TODO(client): the film is 1920x1080, 20.7s, 6.0MB at 2.3Mbps. That is a
 * reasonable rate for its size and it is still six megabytes on the homepage.
 * Worth a second derivative — 1280-wide for phones, served through a <source>
 * media query — before launch.
 */
export const HERO_VIDEO = {
  src: "/videos/maison-banner-bg-1.mp4",
  poster: {
    src: "/images/hero/banner-poster.jpg",
    alt: "Two hands painting a pale denim tote with a fine brush, a coral palette of teal, white and lilac paint on the table beside them.",
  },
} as const;

/**
 * One photograph in the hero carousel.
 *
 * `position` is the CSS object-position for the crop, and a single value
 * serves every breakpoint on purpose. `object-fit: cover` only ever crops one
 * axis: on a tall phone it crops the sides, so the X term decides the framing;
 * on a wide desktop it crops top and bottom, so the Y term does. One
 * "X% Y%" therefore answers both without a media query — set X for the phone
 * and Y for the desktop.
 */
export interface HeroSlide {
  /** The activity this photograph actually shows. Caption, and control label. */
  activity: string;
  src: string;
  alt: string;
  position: string;
  /**
   * The line the hero sets large while this slide is showing.
   *
   * Not written for the hero. Every one of these is the studio's own
   * description of that activity, already in the project — see
   * PRIVATE_EVENT_ACTIVITIES in lib/privateEvents.ts and the same strings in
   * lib/experiences.ts. Reusing them means the hero cannot describe an
   * activity differently from the page that sells it, and it keeps invented
   * hero copy out of the one place on the site most likely to be read.
   */
  statement: string;
}

/**
 * THE HERO CAROUSEL — four client-supplied photographs, and nothing else.
 *
 * Every file here is from public/images/hero-carousel/, which is the set the
 * client provided for this purpose. Nothing is stock, nothing is generated,
 * nothing is borrowed from another folder in this project.
 *
 * EACH FILE WAS OPENED AND ASSIGNED BY WHAT IS IN THE FRAME, not by its name.
 * That mattered when the originals were called 1–4 and said nothing, and it
 * still matters now that two are subject-named: the client asked for the new
 * crochet file to replace "the 3rd image", and the third slide in this array
 * is candle making. `3-crochet.jpg` is a crocheted rainbow, so it went to the
 * crocheting slide — the fourth — because this carousel prints the activity
 * name on screen beside the photograph and the two must agree. The "3" is the
 * client's own numbering for the file, and the crochet slide's previous file
 * was `3.jpg`, which is very likely what they were counting.
 *
 * THE ORDER is the client's stated activity priority — tote bag painting
 * first, then bedazzling, then the scheduled sessions.
 *
 * CERAMIC PAINTING IS MISSING, AND IS DELIBERATELY NOT FAKED. It is second in
 * the client's priority list and none of the four photographs shows it: there
 * is candle making, tote painting, crochet and face gems, and that is all. The
 * brief's own instruction for this case is to use the strongest available
 * images and adjust the carousel rather than invent an asset, so the carousel
 * is four slides and the ceramic slide is simply absent.
 *
 * TODO(client): supply a ceramic-painting photograph for this folder and it
 * becomes one more entry in this array — the carousel counts its own slides.
 * (A real ceramic-painting photograph does already exist elsewhere in the
 * project, at /images/creative/craft.jpg, used by the strands and the private
 * events page. It is deliberately NOT pulled in here: the brief says not to
 * take images from other folders, and a hero is exactly where a borrowed crop
 * would be noticed.)
 */
export const HERO_CAROUSEL: readonly HeroSlide[] = [
  {
    activity: "Tote bag painting",
    statement: "Fabric paint on plain cotton — the one you carry out with you.",
    src: "/images/hero-carousel/h-1.jpg",
    alt: "A natural cotton tote carried at someone's side, printed with a sun-faced design ringed by the words \u201cwe\u2019re in this together\u201d, against a pale blue wall.",
    /*
      Client replacement for 1-tote.png. 6240x4160, so a 3:2 landscape into a
      hero that runs from 3:2 at desktop down to a tall portrait on a phone —
      at 390 only a third of the frame's width survives, which is why X matters
      more here than Y. The bag's centre sits at about 48% across and fills the
      middle of the frame top to bottom, so Y stays centred and X holds the
      design in the middle of the narrowest crop.

      TODO(client): two things worth a look before launch. The design is
      screen-printed rather than painted — crisp two-colour artwork with set
      type — and this slide says "fabric paint on plain cotton", so the picture
      and the sentence under it describe different things. And it carries
      another maker's name ("NAVA & SNOW") along the bottom of the print, which
      on a full-bleed homepage hero reads as the Maison showing somebody else's
      product as its own work.
    */
    position: "48% 50%",
  },
  {
    activity: "Bedazzling",
    statement: "Stones and beads set onto something plain until it is not.",
    src: "/images/hero-carousel/4.jpg",
    alt: "A smiling young woman in a denim jacket, her cheeks and brows set with clusters of coloured gems and tiny rhinestone flowers.",
    // Y is high because the eyes sit in the top third: a centred crop would
    // cut them off the moment the viewport goes wide.
    position: "55% 30%",
  },
  {
    activity: "Candle making",
    statement: "Wax, wick and colour, poured and left to set.",
    src: "/images/hero-carousel/1.jpg",
    alt: "Two hands cupping a freshly poured candle in a glass jar, its wick lit, with tealights burning on the wooden bench around it.",
    position: "50% 40%",
  },
  {
    activity: "Crocheting",
    statement: "A hook, a ball of yarn and one stitch to start from.",
    src: "/images/hero-carousel/h-3.jpg",
    alt: "A crocheted granny-square blanket in teal, green, mustard and cream laid across weathered decking, with pine cones, orange lanterns and autumn leaves gathered beside it.",
    /*
      Client replacement for 3-crochet.jpg. 4288x2848, another 3:2 landscape.
      The blanket runs from the left edge to about two thirds across and the
      autumn arrangement holds the right, so X is pulled left of centre: a
      centred crop puts the seam between the two down the middle of a phone,
      and at 42% the narrow crop is blanket — the thing the slide is about —
      with the arrangement arriving as the frame widens.

      It measures better than the rainbow it replaces, which failed the mark at
      1440 (2.89:1 against 3:1). See the note on the head wash below.
    */
    position: "42% 50%",
  },
] as const;

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
  /*
    THE ONLY ROUTE TO /private-events FROM THE HOMEPAGE. The page exists and is
    linked in the footer, and a footer is where a visitor looks for a link they
    already know is there — not where someone organising a birthday finds out
    the Maison does birthdays. This section is the page's designated "what
    next", and a group organiser reading "come make something with us" is
    exactly the reader it was missing a door for.

    It is deliberately a third tier rather than a promoted button: the homepage
    has one dominant action and it is booking a seat.
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
