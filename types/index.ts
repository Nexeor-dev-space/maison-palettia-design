/** A single entry in the primary or footer navigation. */
export interface NavItem {
  label: string;
  href: string;
  /** Set for links that leave the site so the UI can flag them. */
  external?: boolean;
  /**
   * Kept out of the desktop bar, but present everywhere the whole site map is
   * offered — the mobile menu and the footer.
   *
   * One list rather than two, because two drift. The bar has room for about
   * five or six entries before it crowds the action at its end, and the one
   * that earns the cut is the entry a visitor reaches for last and can always
   * find at the foot of the page.
   */
  secondary?: boolean;
  /**
   * Opens the creative-strands menu instead of navigating.
   *
   * A flag rather than a match on `href`, because "Workshops" and "Sessions"
   * deliberately share a destination — one asks what you could make, the other
   * when you could make it — and matching on the path would hang a menu off
   * both of them.
   */
  megamenu?: boolean;
  /**
   * Sits with the bar's utilities on the right rather than in the primary
   * navigation on the left.
   *
   * Presentation only, and only on the desktop bar: the mobile menu and the
   * footer still render the entry in document order with everything else, so
   * there is still one list and it still cannot drift. Contact is the entry
   * this exists for — it is a way to reach the studio rather than a place in
   * the programme, and it belongs beside search for the same reason.
   */
  utility?: boolean;
}

/** A grouped column of links in the footer. */
export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * A social profile. `href` stays null until the client supplies real accounts.
 * No icon field: lucide-react v1 removed brand marks, so official Instagram /
 * Facebook glyphs need to be added as dedicated SVG assets during polish.
 */
export interface SocialLink {
  label: string;
  href: string | null;
}

/** Business contact details supplied by the client. */
export interface ContactDetails {
  addressLines: string[];
  email: string | null;
  phone: string | null;
}

/** Per-page SEO overrides passed to `buildMetadata`. */
export interface PageSeo {
  title: string;
  description: string;
  /** Path relative to the site root, e.g. "/workshops". */
  path: string;
  /** Path to an Open Graph image inside /public. */
  image?: string;
}

/**
 * A photograph as it is stored beside the content it belongs to.
 * `position` is the CSS object-position for the editorial crop; leave it out
 * and the image is centred.
 */
export interface ImageAsset {
  src: string;
  alt: string;
  position?: string;
}

/** A money amount, kept numeric so the currency can be formatted per locale. */
export interface Price {
  amount: number;
  /** ISO 4217, e.g. "AED". */
  currency: string;
}

/**
 * Booking state as the CMS reports it. Seat counts alone are not enough — a
 * session can be closed to new bookings while seats technically remain.
 */
export type WorkshopStatus = "open" | "waitlist" | "fully-booked";

/**
 * Where a session happens.
 *
 * The studio does not have one address — it sets up in malls, on fixed dates,
 * at fixed times. That makes the mall a deciding fact rather than a footnote:
 * someone scanning the schedule is matching three things against their own
 * week, and "can I get there" is one of them.
 *
 * Optional, and that is deliberate. The field did not exist before this and
 * nothing in the project can supply it yet, so every component that reads it
 * omits the location entirely rather than printing a gap — a session with no
 * venue on file simply shows none. Adding the shape is what lets the studio
 * start filling it in; it is not a claim that the data is there.
 *
 * Split into parts rather than kept as one string so the listing can set the
 * mall loud and the city quiet, and so a filter by mall costs a component
 * change rather than a migration.
 */
export interface Venue {
  /** The mall, as it is signposted, e.g. "The Dubai Mall". */
  name: string;
  /** The city or district under it, e.g. "Downtown Dubai". */
  locality: string;
}

/**
 * One scheduled workshop session.
 *
 * Shaped for a CMS: every field is data the studio would edit, nothing here
 * describes presentation. The components decide what to show and how.
 */
export interface Workshop {
  /** URL segment — the detail page lives at /workshops/{slug}. */
  slug: string;
  title: string;
  /**
   * Free text rather than a union: the studio adds new strands over time and
   * should not need a code change to do it.
   */
  category: string;
  /** ISO 8601 with the studio's offset, e.g. "2026-10-03T10:00:00+04:00". */
  startsAt: string;
  durationMinutes: number;
  /** Which mall this date runs at. Optional — see {@link Venue}. */
  venue?: Venue;
  price: Price;
  seatsTotal: number;
  seatsAvailable: number;
  status: WorkshopStatus;
  /** One or two sentences. Long-form copy belongs on the detail page. */
  excerpt: string;
  image: ImageAsset;
  /**
   * Further photographs of this event, for the visual section on its page.
   *
   * Optional, and empty everywhere today. The event page renders the section
   * only when there is something in it rather than showing an empty heading or
   * padding it out with pictures of a different event — which is what "gallery"
   * would otherwise quietly become.
   *
   * TODO(client): supply two or three per event from the studio shoot.
   */
  gallery?: ImageAsset[];
}

/**
 * One creative strand — a way of making, rather than a scheduled session.
 *
 * Disciplines are the doors into the programme; a {@link Workshop} is one date
 * behind one of them. `slug` is the join between the two: it is written to be
 * the value a workshop's `category` will eventually carry, so the homepage can
 * start linking into a filtered listing without any of this changing shape.
 */
export interface Discipline {
  /** Lower-case identifier, e.g. "paint". The future workshop filter value. */
  slug: string;
  /** Set in caps by the design; stored in its natural case. */
  name: string;
  /** One sentence. This is a door, not a description of a course. */
  description: string;
  /**
   * Where the strand leads. A plain path today because the workshop listing
   * cannot filter yet, and a query string it would ignore is worse than none;
   * once it can, this becomes `/workshops?discipline=<slug>` and only the
   * content changes.
   */
  href: string;
  image: ImageAsset;
}

/**
 * One entry in the "Just Added" collection — a recent piece, session or studio
 * detail, shown as an image with a line of metadata under it.
 *
 * Deliberately thinner than `Workshop`: this is a glimpse, not a listing.
 * There is no price, no availability and no schedule, because nothing here is
 * being sold — the collection exists to show what the studio has been making.
 */
export interface RecentItem {
  /** URL segment, and the React key for the item. */
  slug: string;
  /** Short — two or three words. It is read at caption size. */
  title: string;
  /** One line of context, e.g. "Painted ceramic" or "Watercolour". */
  subtitle: string;
  /**
   * Editorial date, already formatted for display, e.g. "Oct 2026". Optional:
   * the CMS supplies it, and the caption simply omits the line until it does.
   * Kept as a preformatted string rather than an ISO timestamp because the
   * studio dates these by month, not by instant.
   */
  date?: string;
  /** Where the item leads. */
  href: string;
  image: ImageAsset;
  /**
   * The crop this photograph is shown in. The collection varies its
   * proportions on purpose, so the shape belongs to the item rather than to
   * its position in the row.
   */
  shape: "portrait" | "landscape" | "square";
}

/**
 * One full-bleed editorial panel — a pause in the page rather than a section
 * of content. The artwork is the subject; the words are a caption on it.
 *
 * Shaped for a CMS, so this holds only what the studio would write or swap.
 * Where a panel sits on the page, how its type is placed and how the artwork
 * is scrimmed are art direction and stay in the component.
 */
export interface EditorialPanel {
  /** Small label above the statement, e.g. "MOOD > MOVEMENT". */
  eyebrow: string;
  /**
   * The statement, one entry per line. Authored rather than wrapped: these
   * are three short sentences and the break belongs between them, not
   * wherever the measure happens to run out. Narrow screens ignore the array
   * and let the sentences flow — see the component.
   */
  statement: string[];
  linkLabel: string;
  linkHref: string;
  /** Position in the run of panels, e.g. "01 / 02". */
  index: string;
  image: ImageAsset;
}

/**
 * One step of the invitation that closes the homepage: choose, book, make.
 *
 * Three fields and no icon, because the hierarchy is typographic — a numeral
 * set large and soft, a name set small and hard, a single line under it. The
 * numeral is stored rather than derived from the array index: it is printed
 * copy ("01", not `1`), and the studio should be able to renumber or reorder
 * the run without the component deciding what a step is called.
 */
export interface VisitStep {
  /** The printed numeral, e.g. "01". Decorative — the list carries the order. */
  number: string;
  /** Set in caps by the design; stored in its natural case. */
  name: string;
  /** One short sentence. Any longer and the band stops reading as a footnote. */
  detail: string;
}

/**
 * The closing invitation (homepage section 09) — everything the section says,
 * and nowhere else.
 *
 * Shaped for a CMS: only what the studio would write or re-point lives here.
 * Both calls to action are {@link NavItem}s so the destination is data rather
 * than a path spelled out inside the component — when the site grows a real
 * experiences listing, the invitation follows it by editing one field.
 */
export interface VisitInvitation {
  eyebrow: string;
  /**
   * The invitation itself, one entry per line. Authored rather than wrapped:
   * the break between the lines is composition, not somewhere the measure
   * happened to run out.
   */
  title: readonly string[];
  /** The script aside. Optional — leave it out and the section sets none. */
  signature?: string;
  description: string;
  /** The one dominant action on the page. */
  primaryCta: NavItem;
  /** Kept visually subordinate, and omitted entirely if there is nothing to add. */
  secondaryCta?: NavItem;
  steps: readonly VisitStep[];
}

/**
 * One thing a guest said about the Maison.
 *
 * Thin on purpose. There is no rating, no avatar and no date, because none of
 * those make a quote more true — and a five-star row would turn a page about
 * making things into a review widget.
 */
export interface Testimonial {
  /** Stable key, and the id the tab controls point at. */
  id: string;
  /** One or two sentences. Anything longer stops being a quote and becomes a story. */
  quote: string;
  /**
   * Who said it. A real, attributable name once the studio has permission to
   * print one; until then the workshop they came to, which claims nothing
   * about a person who has not agreed to be quoted.
   */
  attribution: string;
}

/**
 * One question on the homepage's FAQ.
 *
 * A shape, not an architecture: there is no FAQ CMS and this phase does not
 * build one. The homepage carries the few questions that stand between someone
 * and a booking; anything longer belongs on /faq when that route is written.
 */
export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * One loyalty pass, as the studio would sell it.
 *
 * A pass is bought rather than booked, and that is the whole of the difference
 * from a {@link Workshop}: it carries a number of sessions and a validity, and
 * it is redeemed later against dates in the programme. There is no `startsAt`,
 * no {@link Venue} and no seat count here, because a pass is not a place at a
 * table on a particular Saturday.
 *
 * Shaped for a CMS, like everything else the studio would edit. `price` is
 * optional on purpose: a pass that has been written but not yet priced is a
 * real state of the data, and the page shows it as not yet on sale rather than
 * printing a number nobody has set. `sessions` and `validity` are optional for
 * the same reason — both are omitted rather than guessed at.
 */
export interface Pass {
  /** Stable identifier, and the React key. */
  slug: string;
  /** Set in caps by the design; stored in its natural case. */
  name: string;
  /** One sentence. The benefits carry the detail. */
  description: string;
  /** Absent until the studio sets one — see above. */
  price?: Price;
  /** Short lines, three or four at most. Never paragraphs. */
  benefits: readonly string[];
  /** How many sessions the pass carries. Omitted when it is not counted that way. */
  sessions?: number;
  /** Printed copy, e.g. "12 months from purchase". Omitted when unset. */
  validity?: string;
  /** A plate beside the entry. Optional — the row sets none without it. */
  image?: ImageAsset;
}

/**
 * One shopping centre the Maison has an agreement with.
 *
 * Distinct from {@link Venue}, and the distinction matters. A `Venue` is where
 * one session happens — it hangs off a {@link Workshop} and comes and goes with
 * the schedule. This is a standing relationship with a place: the studio signs
 * with a centre and then runs dates inside it, so the partnership outlives any
 * particular Saturday and exists whether or not a date is currently on sale.
 *
 * Shaped so the list can grow without the component changing. Everything the
 * studio cannot supply today is optional, and the section renders around what
 * is missing rather than printing a gap — which is the whole reason `logo` and
 * `image` are optional rather than pointed at a stand-in.
 */
export interface MallPartner {
  /** Stable identifier, and the React key. */
  slug: string;
  /** The centre, as it is signposted, e.g. "Times Square Center". */
  name: string;
  /** The city or district under it, e.g. "Dubai". */
  locality: string;
  /**
   * One line on what the place is. Short, and factual — this is a description
   * of a destination, not a claim about the partnership.
   */
  descriptor: string;
  /**
   * A map or the centre's own page. Optional: an entry with no link simply
   * shows none, which is better than a link that goes to the wrong door.
   */
  locationHref?: string;
  /**
   * The centre's own mark, as the centre supplies it.
   *
   * Optional and left empty until an approved asset arrives. Nothing here
   * draws, traces or approximates a partner's identity: with no logo the entry
   * sets the name as type, which is the honest version of the same thing.
   */
  logo?: ImageAsset;
  /** A photograph of the destination. Absent until the client supplies one. */
  image?: ImageAsset;
}
