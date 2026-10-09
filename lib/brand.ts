/**
 * ==========================================================================
 * THE MAISON'S OWN WORDS
 * ==========================================================================
 *
 * Everything the site says about who Maison Palettia is, in one place, and
 * every line of it is lifted from the client's brand deck ("Maison Palettia —
 * General", fifteen pages). Each export names the page it came from, so a
 * sentence on the site can always be traced back to the document the studio
 * approved rather than to whoever last edited a component.
 *
 * WHAT WAS ADAPTED, AND HOW FAR. The deck is written for mall partners as much
 * as for visitors — it talks about dwell time, footfall and a "special
 * partnership rate". Where a line is shown to visitors, the partner-facing
 * clause is dropped and the claim itself is left exactly as the deck makes it.
 * No claim is strengthened, and nothing is added that the deck does not say.
 *
 * WHAT WAS DELIBERATELY LEFT OUT.
 *
 *   Hand Building (deck p.6) is clay hand-building — pottery-making — and the
 *   client's latest instruction removes pottery from the site. It is the only
 *   activity in the deck that does not appear here. Ceramic painting stays: it
 *   is painting a finished piece, not making one.
 *
 *   The deck's photographs. Its activity, kids and seasonal pages use images
 *   at Pinterest and Bing thumbnail sizes, one of them carrying another
 *   studio's watermark — inspiration imagery, not the studio's own work, and
 *   not something to publish on a commercial site. Pages 11–14 are the
 *   studio's real event photos; the ones used on this site show hands and
 *   finished pieces only, because the rest show identifiable children.
 *
 * TODO(client): the deck labels these two the other way round (p.3 prints
 * VISION above "To inspire…" and MISSION above "We curate…"). The redesign
 * brief assigns them as below, and the brief is the more recent instruction,
 * so it wins — but the two documents disagree and one of them should change.
 */

/** Deck p.1 and the studio's email signature. */
export const TAGLINE = "A Palette of Creativity for Everyone";

/*
  THE BRAND STORY, IN THE CLIENT’S REWRITE — AND IT IS TWO PARAGRAPHS NOW.

  It was one sentence from the deck and a single string, printed in a single
  <p> on /about. The replacement the client sent is two paragraphs with a
  break that does work: the first says what the place is, the second says
  what it asks of you. Joining them into one string would lose that, so the
  constant is a list and the page maps it.
*/
export const BRAND_STORY: readonly string[] = [
  "Maison Palettia is a creative space built for slowing down, switching off and getting your hands busy. Through hands-on experiences and shared creative moments, we bring people together to explore their creativity, unwind and make something of their own.",
  "We believe creativity doesn’t need to be perfect, productive or complicated. Sometimes, it just needs a little time, a little colour and a place to begin.",
];

/*
  THE SAME SENTENCE, TYPESET.

  The homepage opens on the brand story as an editorial spread rather than a
  paragraph, which means the sentence has to be set in parts: a lead-in, the
  one word the brand is named for, and the clause that defines it. These are
  `BRAND_STORY` cut at its own punctuation and nothing else — read them in
  order and you had the deck's sentence back, word for word.

  THAT IS NO LONGER TRUE, AND NOTHING READS THIS. The client has rewritten
  `BRAND_STORY`, so the two no longer agree; the only mentions of this
  constant left in the project are the notes in <BrandStory> and
  <OpeningStatement> saying what it USED to typeset. It is kept because the
  deck's original wording is worth having somewhere, not because anything
  prints it — do not wire it back up without reconciling it against
  `BRAND_STORY` first.
*/
export const BRAND_STORY_SET = {
  leadIn: "Maison Palettia is a creative lifestyle brand inspired by the word",
  word: "Palette",
  defines: "a symbol of colour, expression, and imagination.",
  carries:
    "Blending elegance with playfulness, the brand celebrates creativity, mindfulness, and meaningful human connection, encouraging people to slow down, unplug, and embrace the art of intentional living.",
} as const;

/*
  ==========================================================================
  THE OPENING STATEMENT — the client's words, not the deck's
  ==========================================================================

  `BRAND_STORY` above is what the brand IS, in the client's p.24 rewrite: a
  creative space for slowing down and getting your hands busy. It is the
  copy /about opens on, and its first sentence is that page's search
  description. (It used to be the deck's "creative lifestyle brand, inspired
  by the word Palette" — see `BRAND_STORY_SET` — and nothing prints that
  wording now.)

  What the homepage's "what this is" block carries now is different, and it
  is supplied by the client verbatim in their feedback: an invitation rather
  than a definition. It says what a person can come in and do, in the second
  person, and it closes on a line short enough to remember.

  THE PANEL'S WORDS ARE THE SAME INSTRUCTION, and they belong to the same
  block, so they live in the same constant rather than in a second one that
  could drift from it. Only the sign-off survives from what was there before.

  Not one word here is written for the layout. Anything in this object that
  is not in the client's feedback is a bug.
*/
export const OPENING_STATEMENT = {
  heading: "A Little Space for Big Creativity.",
  body: "Maison Palettia is a place to make, experiment and unwind. Pick a palette, get your hands busy and turn a little bit of imagination into something that’s yours.",
  closer: "Come curious. Leave creative.",
  panel: {
    heading: "Create your Way.",
    body: "Pick an activity, bring your people or come on your own. There’s no right way to be creative here, just your palette, your hands and whatever you feel like making.",
    signOff: "Welcome to Maison Palettia.",
  },
} as const;

/** Deck p.3, as assigned by the redesign brief — see the TODO above. */
export const MISSION = "To bring people together, one creative moment at a time.";

/** Deck p.3, as assigned by the redesign brief — see the TODO above. */
export const VISION =
  "We curate inspiring experiences where imagination, craftsmanship, and community come to life.";

/**
 * Deck p.4. The headline is the deck's own; the body keeps the visitor-facing
 * sentences and drops "increasing dwell time", which is addressed to malls.
 */
export const COMMUNITY = {
  heading: "Creating Community Through Creativity",
  body: "Maison Palettia is a space to slow down, switch off and make something. Through hands-on creative experiences, workshops and seasonal activities, we bring people together to explore creativity, try something new and enjoy time away from their screens.",
  closer: "More than something to do, it’s a reason to pause, connect and come back for something new.",
} as const;

/* ==========================================================================
   THE WORKSHOP JOURNEY — deck p.5
   ========================================================================== */

export interface JourneyStep {
  slug: string;
  name: string;
  /** Verbatim from the deck. */
  description: string;
}

/**
 * The five ways the deck says people experience the Maison.
 *
 * The first two are the business model the whole site is organised around:
 * walk-in activities that are never sold online, and scheduled sessions that
 * are. They lead, in that order, because the deck puts them there.
 */
export const WORKSHOP_JOURNEY: readonly JourneyStep[] = [
  {
    slug: "walk-in-diy",
    /* RENAMED BY THE CLIENT, site-wide: the two ways in are "Create Anytime"
       and "Create Together" wherever they are named. The deck's own words for
       the mechanism — walk-in, scheduled — stay in the descriptions, which is
       what they asked for. The slugs are keys and nothing reads them as copy,
       so they are left alone. */
    name: "Create",
    description:
      "Drop in, choose an experience and create at your own pace. No experience needed, just pick a project and make it yours.",
  },
  {
    slug: "scheduled-sessions",
    name: "Together",
    description:
      "Join a guided workshop, learn something new and create alongside others. Because making is always better with good company around the table.",
  },
  {
    slug: "family-bonding",
    name: "Connect",
    description:
      "From friends and families to colleagues and communities, Maison Palettia gives people a reason to spend time together, away from the usual routine.",
  },
  {
    slug: "monthly-refresh",
    name: "Refresh",
    description:
      "Rotating themes, seasonal activities and fresh creative experiences keep the Maison feeling new, giving you a reason to come back and try something different.",
  },
  {
    slug: "digital-detox",
    name: "Unplug",
    description:
      "Put the phone down, pick something up and give yourself a chance to slow down. Maison Palettia creates space to focus, relax and simply enjoy making.",
  },
] as const;

/* ==========================================================================
   LITTLE CREATORS — deck p.8
   ========================================================================== */

/**
 * The three activities the deck tailors to children.
 *
 * NAMES ONLY. The deck gives nothing beyond the name for any of them — no age
 * range, no duration, no description — so none is written here. The kids
 * section sets them as type, because the deck's own photographs for this page
 * are inspiration images rather than the studio's work.
 */
export const LITTLE_CREATORS: readonly { slug: string; name: string }[] = [
  { slug: "tissue-art", name: "Tissue art" },
  { slug: "coffee-painting", name: "Coffee painting" },
  { slug: "wooden-painting", name: "Wooden painting" },
] as const;

/* ==========================================================================
   SEASONAL CREATIVE EXPERIENCES — deck p.9
   ========================================================================== */

/** Deck p.9, minus "keeping the destination fresh", which is addressed to malls. */
export const SEASONAL_INTRO =
  "Maison Palettia delivers seasonal workshops inspired by celebrations such as Valentine’s Day, Ramadan, Mother’s Day, Christmas, and more. Limited-time experiences worth coming back for.";

export interface SeasonalMoment {
  slug: string;
  occasion: string;
  /** Verbatim from the deck. */
  experience: string;
}

/**
 * The four examples the deck gives, and only those four.
 *
 * They are examples of what the studio has run for a season, not a calendar:
 * the deck names no dates and no year, so nothing here says "this Ramadan" or
 * implies any of them is currently on.
 */
export const SEASONAL_MOMENTS: readonly SeasonalMoment[] = [
  {
    slug: "valentines-day",
    occasion: "Valentine’s Day",
    experience: "Pipe cleaner flower bar & bouquet making",
  },
  { slug: "ramadan", occasion: "Ramadan", experience: "Crochet workshops" },
  { slug: "mothers-day", occasion: "Mother’s Day", experience: "Charm bracelet making" },
  {
    slug: "christmas",
    occasion: "Christmas",
    experience: "Festive candle making & retail display",
  },
] as const;

/* ==========================================================================
   COLLABORATIVE APPROACH — deck p.10
   ========================================================================== */

export interface Collaboration {
  slug: string;
  name: string;
  /** Verbatim from the deck. */
  description: string;
}

/**
 * The three collaboration models the deck describes.
 *
 * NO PARTNER NAMES AND NO LOGOS. The deck names none for these programmes, so
 * the section describes the model and never implies a particular brand has
 * signed up to it.
 */
export const COLLABORATIONS: readonly Collaboration[] = [
  {
    slug: "cross-promotional-vouchers",
    name: "Cross-Promotional Voucher Program",
    description: "Exclusive offers for F&B partners.",
  },
  {
    slug: "retail-and-fnb",
    name: "Retail & F&B Collaborations",
    description: "Co-branded workshops and promotions.",
  },
  {
    slug: "marketing-calendar",
    name: "Marketing Calendar Activations",
    description: "Activations tailored to the mall’s campaigns, at a special partnership rate.",
  },
] as const;

/* ==========================================================================
   WHAT SETS MAISON PALETTIA APART — deck p.11
   ========================================================================== */

/**
 * Four of the deck's six points — the four that describe the experience
 * rather than the commercial arrangement. "Flexible model" (operating inside
 * F&B outlets) belongs with the collaborations, and the deck's own wording for
 * "Community engagement" ends on dwell time and loyalty.
 */
export const WHAT_SETS_US_APART: readonly Collaboration[] = [
  {
    slug: "unique-concept",
    name: "For Everyone",
    description:
      "Creative experiences designed for adults, families, friends, teams and anyone who simply wants to make something.",
  },
  {
    slug: "all-ages",
    name: "Make & Connect",
    description:
      "A space where creativity becomes a way to spend time together, meet people and create shared moments.",
  },
  {
    slug: "sustainability",
    name: "Create Responsibly",
    description:
      "Sustainability is part of how we create, from reusable materials and upcycling to finding thoughtful ways to reduce waste.",
  },
  {
    slug: "trend-responsive",
    name: "Always Something New",
    description:
      "Rotating themes, seasonal experiences and fresh workshop ideas mean there’s always another reason to visit.",
  },
] as const;

/* ==========================================================================
   OUR EXPERIENCE — deck p.12
   ========================================================================== */

/**
 * The deck's framing, kept close. "Over the past year" is the deck's own
 * qualifier and it matters: these are places the studio HAS created, not
 * places it currently runs.
 */
export const EXPERIENCE_STATEMENT =
  "Over the past year, we have delivered creative workshops and activations across leading UAE destinations. Each experience was tailored to its event theme, combining creativity, engagement, and community connection through hands-on activities for both kids and adults.";

/**
 * Where the studio has worked, in the deck's own order and spelling.
 *
 * PAST, NOT CURRENT. The only confirmed ongoing partnership is in
 * lib/partners.ts. Nothing that renders this list may call these partners,
 * locations or venues without the word "past" or an equivalent — the deck
 * says "delivered", and a visitor who reads "Yas Mall" under "Find us" would
 * go looking.
 *
 * NO EMIRATE, NO CITY. The deck gives the names and nothing else, and two of
 * them (Wasl, Ithra) are organisations rather than single addresses, so adding
 * a location to each would mean guessing at some of them.
 *
 * "And more" is the deck's; the list is explicitly not exhaustive, and the UI
 * says so.
 */
export const PAST_DESTINATIONS: readonly string[] = [
  "Reem Mall",
  "Yas Mall",
  "Al Hamra Mall",
  "WTCAD",
  "Al Ghurair Centre",
  "Wasl",
  "The Galleria Al Maryah Island",
  "Dalma Mall",
  "Times Square Center",
  "Ithra",
] as const;

/** Deck p.12, "Our Approach", with the footfall clause left for partners. */
export const OUR_APPROACH: readonly string[] = [
  "Community-driven experiences that encourage interaction and family engagement.",
  "Sustainable creativity through the use of eco-conscious materials.",
  "Memorable activations designed to enhance the visitor experience.",
] as const;

/** Deck p.15, the closing page. */
export const CLOSING = {
  heading: "Let’s Craft a Community Together.",
  body: "Maison Palettia is ready to bring art, creativity, and meaningful engagement.",
} as const;

/* ==========================================================================
   REAL EVENT PHOTOGRAPHY — deck pp.13–14
   ========================================================================== */

/**
 * The only photographs on this site taken at the studio's own events.
 *
 * Extracted from the deck's "Our Activities" pages. Three, and the choice was
 * a rule rather than a taste: of the sixteen real event photos in the deck,
 * these are the ones that show hands and finished pieces and no faces. The
 * rest show identifiable children, and a brand deck sent to a mall is not
 * consent to publish a child's photograph on a public website.
 *
 * They are WhatsApp-compressed phone photos — 480 to 768px on the long edge —
 * so they are only ever set small, as a group of plates, never full-bleed.
 *
 * TODO(client): the event photos with families and children are the most
 * persuasive images the studio owns. With written consent from the families
 * pictured, they can join this set with no change to any component.
 */
export const EVENT_PLATES = [
  {
    src: "/images/events/named-keepsake.jpg",
    alt: "A child’s hands holding two handmade keepsakes: one lettered with a name and a heart, the other filled with glitter, sequins and a small teal ring.",
    width: 768,
    height: 1024,
  },
  {
    src: "/images/events/glitter-keepsakes.jpg",
    alt: "Four handmade keepsakes cupped in children’s hands, two lettered with names and hearts and two filled with purple glitter and heart charms.",
    width: 480,
    height: 640,
  },
  {
    src: "/images/events/national-day-cards.jpg",
    alt: "Two quilled cards for Eid Al Etihad reading “I love UAE”, beside a pen pot made from lolly sticks painted in the colours of the UAE flag.",
    width: 686,
    height: 572,
  },
] as const;
