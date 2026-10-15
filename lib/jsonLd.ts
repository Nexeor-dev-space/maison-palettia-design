import type { PartnerRecord } from "@/lib/partners";
import { studioIso } from "@/lib/studioTime";
import { bookingStepHref, isFullyBooked, workshopHref } from "@/lib/workshopHelpers";
import type { ContactDetails, Pass, SocialLink, Workshop } from "@/types";

/**
 * ==========================================================================
 * Structured data — the schema.org objects the site prints as JSON-LD
 * ==========================================================================
 *
 * Pure builders over data the callers already hold, so they can be unit
 * tested without a database and so nothing here can reach the browser
 * bundle by accident: this module imports no CMS reader. The async twins
 * that gather the inputs from Site details, the venues and the logo live in
 * lib/jsonLd.server.ts; every page prints the result through
 * <JsonLd> (components/seo/JsonLd.tsx), which is what escapes it.
 *
 * WHAT IS CLAIMED, AND WHAT IS NOT. Every value is read off a record the
 * site already shows: the address lines the footer prints, the price the
 * event page prints, the venue the session names. Nothing is estimated —
 * no rating, no review count, no "priceValidUntil" the studio has not set
 * — because a structured-data claim a crawler can check against the page
 * and find missing is worse than none. A field with no data is left out
 * rather than filled with a placeholder, the same rule the components
 * follow.
 */

/** What every builder needs to know about the site. */
export interface JsonLdSite {
  name: string;
  legalName: string;
  /** Absolute origin, no trailing slash. */
  url: string;
  /** Absolute URL of the logo, or null when there is none to print. */
  logo: string | null;
}

/** `src` as an absolute URL: a site-relative path gets the origin in front. */
export function absoluteUrl(site: Pick<JsonLdSite, "url">, src: string): string {
  return src.startsWith("/") ? `${site.url}${src}` : src;
}

const COUNTRY = "AE";

/**
 * The site's postal address lines, read into the parts schema.org wants.
 *
 * Site details stores the address as free lines "as it should print"
 * ("Dubai", "United Arab Emirates" by default). The country is always the
 * UAE — the business is registered there and the site's locale is en_AE —
 * so the country line, when present, is recognised and dropped rather than
 * printed as a street. A line naming an emirate is the locality; whatever
 * is left is the street, joined on one line. An address with nothing but a
 * country still names its country.
 */
export function postalAddress(lines: readonly string[]): Record<string, string> {
  const isCountry = (line: string) => /^(united arab emirates|uae|u\.a\.e\.?)$/i.test(line.trim());
  const isEmirate = (line: string) =>
    /^(dubai|abu dhabi|sharjah|ajman|umm al[- ]quwain|ras al[- ]khaimah|fujairah)$/i.test(line.trim());

  const rest = lines.filter((line) => line.trim() && !isCountry(line));
  const locality = rest.find(isEmirate);
  const street = rest.filter((line) => line !== locality);

  return {
    "@type": "PostalAddress",
    ...(street.length ? { streetAddress: street.join(", ") } : {}),
    ...(locality ? { addressLocality: locality.trim() } : {}),
    addressCountry: COUNTRY,
  };
}

/** A venue's own geo coordinates, when the studio has entered them. */
function geoOf(partner: PartnerRecord | undefined): Record<string, unknown> | null {
  const c = partner?.coordinates;
  if (!c || typeof c.lat !== "number" || typeof c.lng !== "number") return null;
  return { "@type": "GeoCoordinates", latitude: c.lat, longitude: c.lng };
}

/**
 * A venue as a schema.org Place: the centre's name, the locality the
 * session names, and the street lines and coordinates when the venue
 * record carries them.
 */
export function placeOf(name: string, locality: string, partner?: PartnerRecord): Record<string, unknown> {
  const geo = geoOf(partner);
  return {
    "@type": "Place",
    name,
    address: postalAddress([...(partner?.address ?? []), locality]),
    ...(geo ? { geo } : {}),
    ...(partner?.locationHref ? { hasMap: partner.locationHref } : {}),
  };
}

/**
 * The Maison as a LocalBusiness — printed on the homepage, /contact and
 * /locations, the three pages a search engine reads for "who and where".
 *
 * `location` is the partner centre the studio currently sets up in, when
 * there is exactly one: with two the business has two places, not one
 * location, and the venues each carry their own Place on the event pages.
 */
export function localBusinessJsonLd({
  site,
  contact,
  socials,
  partners,
  description,
}: {
  site: JsonLdSite;
  contact: ContactDetails;
  socials: readonly SocialLink[];
  partners: readonly PartnerRecord[];
  description: string;
}): Record<string, unknown> {
  const sameAs = socials.map((s) => s.href).filter((href): href is string => Boolean(href));
  const home = partners.length === 1 ? partners[0] : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${site.url}/#business`,
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    description,
    ...(site.logo ? { logo: site.logo, image: site.logo } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.phone ? { telephone: contact.phone.replace(/[\s()-]/g, "") } : {}),
    address: postalAddress(contact.addressLines),
    ...(home ? { location: placeOf(home.name, home.locality, home) } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

const AVAILABILITY = {
  inStock: "https://schema.org/InStock",
  soldOut: "https://schema.org/SoldOut",
  limited: "https://schema.org/LimitedAvailability",
} as const;

/** How many seats are left, as the vocabulary schema.org offers. */
export function offerAvailability(workshop: Workshop, passed: boolean): string {
  if (passed || isFullyBooked(workshop)) return AVAILABILITY.soldOut;
  if (workshop.status === "waitlist") return AVAILABILITY.limited;
  return AVAILABILITY.inStock;
}

/**
 * A dated session as a schema.org Event, for /events/[slug].
 *
 * `endDate` is derived from the duration, as the page's own time range is.
 * All three instants (`startDate`, `endDate`, `validThrough`) are written in
 * Dubai time with its offset (lib/studioTime.ts) — `endDate` used to come out
 * in UTC beside a +04:00 start, the same instant written two ways.
 * The offer points at the booking step and carries the price the page
 * prints; `validThrough` is the start, because booking closes at the start
 * (see `hasSessionPassed`). A session whose date has gone by is still
 * printed as an Event — the page still exists — but its offer is sold out.
 *
 * `eventStatus` is always "scheduled": cancelled sessions are never listed
 * (lib/workshops.ts), and a full session is a scheduled one with no seats,
 * which is what the offer says.
 */
export function eventJsonLd({
  site,
  workshop,
  description,
  partner,
  passed,
}: {
  site: JsonLdSite;
  workshop: Workshop;
  /** The page's lead or about copy, when there is any. */
  description: string | null;
  /** The partner record matching the session's venue, when one does. */
  partner?: PartnerRecord;
  passed: boolean;
}): Record<string, unknown> {
  const start = new Date(workshop.startsAt);
  const end = new Date(start.getTime() + workshop.durationMinutes * 60_000);
  const url = absoluteUrl(site, workshopHref(workshop));
  const startDate = studioIso(workshop.startsAt);
  const keywords = eventKeywords(workshop);
  const images = [workshop.image, ...(workshop.gallery ?? [])].map((img) => absoluteUrl(site, img.src));

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${url}#event`,
    name: workshop.title,
    ...(description ? { description } : {}),
    url,
    image: images,
    startDate,
    endDate: studioIso(end.toISOString()),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(workshop.venue ? { location: placeOf(workshop.venue.name, workshop.venue.locality, partner) } : {}),
    organizer: { "@type": "Organization", name: site.name, url: site.url },
    ...(workshop.price.amount > 0
      ? {
          offers: {
            "@type": "Offer",
            url: absoluteUrl(site, bookingStepHref(workshop)),
            price: workshop.price.amount,
            priceCurrency: workshop.price.currency,
            availability: offerAvailability(workshop, passed),
            validThrough: startDate,
            ...(workshop.seatsTotal > 0 ? { inventoryLevel: { "@type": "QuantitativeValue", value: workshop.seatsAvailable } } : {}),
          },
        }
      : {}),
    ...(keywords ? { keywords } : {}),
  };
}

/**
 * The words a session is filed under: its category, the activity it is a
 * sitting of, its format and the city — each read off the session, none
 * invented. It was the category alone ("Craft"), which says nothing a
 * crawler can match a search to.
 */
function eventKeywords(workshop: Workshop): string | null {
  const words = [workshop.category, workshop.experience?.name, workshop.workshopType?.name, workshop.venue?.locality];
  const unique = [...new Set(words.map((word) => word?.trim()).filter((word): word is string => Boolean(word)))];
  return unique.length ? unique.join(", ") : null;
}

/**
 * A workshop type's upcoming sessions as Events, for /events/{type}.
 *
 * The dated session pages name the type page as their canonical (see
 * `canonicalEventPath`, lib/eventDetail.ts), so this is the page search
 * engines index, and it carries every date ahead. Each Event keeps its
 * session's own `@id`, `url` and booking offer, so a session reads as the
 * same thing wherever it is printed. Null when no date is ahead: a type with
 * nothing scheduled is a page, not an event.
 */
export function sessionEventsJsonLd({
  site,
  sessions,
  description,
  partnerFor,
}: {
  site: JsonLdSite;
  sessions: readonly Workshop[];
  description: string | null;
  /** The partner record for a session's venue, when one matches. */
  partnerFor: (workshop: Workshop) => PartnerRecord | undefined;
}): Record<string, unknown> | null {
  if (sessions.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@graph": sessions.map((workshop) => {
      // The graph carries the one @context.
      const event = eventJsonLd({ site, workshop, description, partner: partnerFor(workshop), passed: false });
      delete event["@context"];
      return event;
    }),
  };
}

/**
 * The passes on sale, as schema.org Products in an ItemList, for /loyalty.
 *
 * Only a pass with a price is a product; one written but not yet priced
 * is shown on the page as "not on sale yet" and is left out here for the
 * same reason. Returns null when there is nothing to print, so the page
 * can mount nothing rather than an empty list.
 */
export function passesJsonLd({
  site,
  passes,
  path,
}: {
  site: JsonLdSite;
  passes: readonly Pass[];
  /** The page the list lives on, e.g. "/loyalty". */
  path: string;
}): Record<string, unknown> | null {
  const priced = passes.filter((pass) => pass.price && pass.price.amount > 0);
  if (priced.length === 0) return null;
  const url = absoluteUrl(site, path);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${url}#passes`,
    url,
    numberOfItems: priced.length,
    itemListElement: priced.map((pass, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        "@id": `${url}#${pass.slug}`,
        name: pass.name,
        description: pass.description,
        ...(pass.image ? { image: absoluteUrl(site, pass.image.src) } : {}),
        brand: { "@type": "Brand", name: site.name },
        offers: {
          "@type": "Offer",
          url,
          price: pass.price!.amount,
          priceCurrency: pass.price!.currency,
          availability: AVAILABILITY.inStock,
          seller: { "@type": "Organization", name: site.name, url: site.url },
        },
      },
    })),
  };
}
