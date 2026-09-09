import type {
  ContactDetails,
  EditorialPanel,
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

/** Primary navigation. Keep this list short — it is the whole site map. */
export const MAIN_NAV: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Workshops", href: "/workshops" },
  { label: "Gallery", href: "/gallery" },
  { label: "Journal", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

/**
 * Routes whose hero is a saturated colour field. The header inverts to a light
 * treatment over these until the page scrolls. Add a route here when its hero
 * lands on a dark ground.
 */
export const DARK_HERO_ROUTES: readonly string[] = ["/"];

/** The single primary call to action, reused in the header and footer. */
export const PRIMARY_CTA = {
  label: "Book a Workshop",
  href: "/workshops",
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
      { label: "Workshops", href: "/workshops" },
      { label: "Gallery", href: "/gallery" },
    ],
  },
  {
    title: "Visit",
    items: [
      { label: "Contact", href: "/contact" },
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
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
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
    src: "/images/hero/img-2.jpg",
    alt: "A watercolour study of red blooms rising through washes of blue and green.",
    position: "50% 46%",
  },
  making: {
    // Web encode of the master at public/videos/bg-video.mp4. The master is a
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
    src: "/images/hero/img-1.jpg",
    alt: "A hand-glazed stoneware vase holding pale lilies, on a wooden table.",
    position: "50% 58%",
  },
};

/** TODO(client): awaiting real address, email and phone number. */
export const CONTACT: ContactDetails = {
  addressLines: ["Dubai", "United Arab Emirates"],
  email: null,
  phone: null,
};

/** TODO(client): awaiting live social profile URLs. */
export const SOCIAL_LINKS: SocialLink[] = [
  { label: "Instagram", href: null },
  { label: "Facebook", href: null },
];

/**
 * Brand introduction (homepage section 02).
 *
 * A still lifted from the master wheel footage at public/videos/bg-video.mp4
 * rather than a second shoot: the hero shows the wheel turning, and this holds
 * one moment of it still — the same hands, the same clay, read slowly. Cropped
 * to a 4:5 plate at 1600px, which is the largest it is ever rendered.
 */
export const BRAND_INTRO_IMAGE: HeroPanel = {
  src: "/images/about/hands-at-the-wheel.jpg",
  alt: "Two clay-covered hands cradling a stoneware vessel as it turns on the potter's wheel.",
  position: "50% 42%",
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
 * the first two from the master wheel footage at public/videos/bg-video.mp4
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
  making: CaptionedImage;
  pigment: CaptionedImage;
} = {
  studio: {
    src: "/images/experience/studio-shelf.jpg",
    alt: "Hand-thrown, blue-glazed cups on a studio shelf against a painted brick wall, a clay-covered forearm in the foreground.",
    position: "50% 50%",
    caption: "Finished pieces, studio shelf",
  },
  making: {
    src: "/images/experience/pressing-the-wall.jpg",
    alt: "Clay-slick fingers pressing into the wall of a vessel as it turns, throwing rings running across the wet surface.",
    position: "50% 50%",
    caption: "Pressing the wall out",
  },
  pigment: {
    src: "/images/experience/pigment-on-paper.jpg",
    alt: "A close view of watercolour pigment bleeding into the grain of the paper, red blooms over washes of blue and green.",
    position: "50% 50%",
    caption: "Pigment, still wet",
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
      // The foot of the watercolour used in the hero, enlarged well past the
      // point where it reads as a picture of flowers: what is left is wash,
      // pigment and the grain of the paper. Cut inside the sheet's unpainted
      // margins, which would otherwise show as a pale strip down one edge of
      // the window.
      //
      // The region is chosen for its tonal split rather than its subject. A
      // settled blue field fills the left two thirds and the luminous middle
      // of the painting comes in at the right, which is what lets a caption
      // of three long lines sit on the picture in cream with nothing over it
      // but the foot scrim. A wider cut of the same painting was tried first
      // and the pale centre ran straight through the second line of the
      // statement at every crop.
      src: "/images/editorial/wash-and-light.jpg",
      alt: "A watercolour seen close: deep blue and violet washes sinking into the grain of the paper, a pale bloom of light breaking in at one side.",
      // The horizontal figure only bites on a screen narrower than the plate
      // — a phone, where the crop is a tall slice rather than a wide one — and
      // there it holds that slice inside the blue instead of centring it on
      // the join between the blue and the light. A desktop window is wider
      // than the plate and shows its full width, so it ignores this.
      position: "35% 50%",
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
    linkHref: "/workshops",
    index: "02 / 02",
    image: {
      // The still life from the hero, opened out: the hero shows it as a
      // narrow vertical slice, and this takes the whole width of the sheet so
      // the wall the flowers stand against becomes most of the picture.
      //
      // It is the one asset in the project with a large, even, quiet field in
      // it, which is what a caption of three long lines needs and what none of
      // the wheel footage has — every frame of that is a bright vessel against
      // a busy shelf, and cream type laid on it fails at every crop. Being
      // pale is the point here rather than a problem: the panel is set in
      // charcoal and takes no overlay at all, so the photograph is the only
      // thing in the frame.
      src: "/images/editorial/lilies-and-glaze.jpg",
      alt: "Lilies going over — pink and cream, some already dried to paper — in a hand-glazed stoneware vase, against a wall of soft light.",
      // Two independent figures, because only one of them is ever in play.
      // A window wider than the plate crops it top and bottom, and the
      // vertical figure holds the picture high so the flowers drop into the
      // lower right and the open wall runs across the middle where the
      // caption sits. A window narrower than it — a phone — crops left and
      // right instead, and the horizontal figure keeps that slice over the
      // wall rather than centring it on the flowers.
      position: "18% 34%",
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
  primaryCta: { label: "Explore Experiences", href: "/workshops" },
  secondaryCta: { label: "Contact the Maison", href: "/contact" },
  steps: [
    { number: "01", name: "Choose", detail: "Find the experience that feels right." },
    { number: "02", name: "Book", detail: "Pick a date and reserve your seat." },
    { number: "03", name: "Make", detail: "Arrive, settle in, and begin." },
  ],
};
