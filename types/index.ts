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
   * WHERE THIS ENTRY LIVES ON A PHONE. One list, three surfaces, and nothing
   * appears on two of them:
   *
   *   "bar" ..... a slot in <BottomNav>, thumb-height and always on screen.
   *               Reserved for the two destinations a visitor reaches for
   *               mid-task — the programme, and where to find it.
   *   "sheet" ... behind More, in <MoreSheet>. The pages somebody goes to
   *               once: who we are, how to host, how to get in touch.
   *   absent .... the slide-out menu, which is also where the deep browse
   *               lives (search, and the activity lists under the two
   *               dropdowns).
   *
   * The desktop bar ignores this completely and still renders the whole list
   * in order — there is no bottom bar at `lg`, so nothing there duplicates
   * anything.
   */
  mobileSurface?: "bar" | "sheet";
  /**
   * Opens a panel under the bar instead of navigating, and says which one.
   *
   * A field rather than a match on `href`, because entries deliberately share
   * destinations — "Workshops" and "Sessions" both point at the programme, one
   * asking what you could make and the other when — and matching on the path
   * would hang a menu off both of them.
   *
   * It replaced a boolean `megamenu`. There are THREE panels now, and a second
   * boolean beside the first is exactly the drift this file keeps warning
   * about: one entry could have claimed both, and nothing would have said
   * which won. The trigger still navigates for anyone without JavaScript —
   * the `href` is unchanged and the panel is an enhancement over it.
   *
   * "about" is the newest and the odd one out in CONTENT rather than in kind:
   * the other two browse a catalogue, this one holds the four pages about the
   * Maison itself. It is the same <MenuCard> opening on the same behaviour —
   * see <AboutMenu> for why it carries doors rather than a rail.
   */
  menu?: "experiences" | "private-events" | "about";
  /**
   * Sits with the bar's utilities on the right rather than in the primary
   * navigation on the left — About and Contact, beside search. Presentation
   * only, and only on the desktop bar: the mobile menu and the footer still
   * render the entry in document order with everything else, so there is
   * still one list and it cannot drift.
   *
   * Main had dropped this flag along with its right-hand cluster; the current
   * design keeps both, so it comes back with the merge.
   */
  utility?: boolean;
}

/** A grouped column of links in the footer. */
export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * A social profile. `href` is null for a platform without a URL yet, and a
 * row with no href is never printed. No icon field: the glyph is looked up
 * by label in components/ui/SocialGlyph.tsx (lucide-react v1 has no brand
 * marks).
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
  /**
   * Keep this page out of search — opt-in, and the only robots tag the site
   * prints.
   *
   * For pages that are real but are nobody's entry point: a checkout, a
   * payment receipt, a booking lookup, an unbuilt placeholder. Pages carry no
   * robots tag by default, which every crawler reads as `index, follow`, so
   * without this all four of those would be in Google. (The site used to set
   * `index, follow` globally in lib/seo.ts; it no longer does — see the note
   * in `defaultMetadata` there.)
   */
  noindex?: boolean;
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
  /**
   * How this activity is sold.
   *
   * `scheduled` is a session you book online for a fixed date and time.
   * `diy` is a walk-in activity you turn up and do — the studio runs both, and
   * the homepage carousel is explicitly for the first kind only.
   *
   * Optional, and absence means `scheduled`. That is the deliberate default:
   * every session in the project predates this field and every one of them is
   * bookable, so adding the field changes nothing until something is marked,
   * and nothing has to be migrated. A surface that cares filters on it; the
   * listing and the event page do not, because a walk-in activity still has a
   * page worth reading.
   *
   * TODO(client): the studio's eight approved activities split across these two
   * kinds and only the client knows which way each falls. Mark the walk-ins.
   */
  kind?: "scheduled" | "diy";
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

/*
  `steps` was here, and VisitStep with it — three numbered lines the closing
  section set along its foot. They said choose, book, make; HOW_IT_WORKS says
  choose, book, come by, create a sentence each, and renders earlier on the
  same homepage. One page telling a visitor the same thing twice makes neither
  telling the authoritative one, so the shorter version went. See the note at
  the head of <PlanYourVisit>.
*/

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
  /**
   * What to ask a map for, when "<name>, <locality>" is not what finds the
   * place — a centre that shares its name with another city's, say, or one
   * signposted differently from how it is listed.
   *
   * Optional, and normally left unset: the homepage map falls back to the name
   * and the locality, which is a search rather than a coordinate. Nothing in
   * this project stores latitude and longitude, and a pin dropped at a guessed
   * position is worse than no pin at all — see <LocationMap>.
   */
  mapQuery?: string;
}
