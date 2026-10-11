import { describe, expect, it } from "vitest";

import { serializeJsonLd } from "@/components/seo/JsonLd";
import { eventJsonLd, localBusinessJsonLd, passesJsonLd, postalAddress, type JsonLdSite } from "@/lib/jsonLd";
import type { PartnerRecord } from "@/lib/partners";
import type { Workshop } from "@/types";

/**
 * The structured-data builders (lib/jsonLd.ts) over fixed inputs. Pure
 * functions, so this is the whole contract: what each object claims, what
 * it leaves out when the data is missing, and that the serialiser cannot be
 * broken out of by an editor-written string.
 */
const site: JsonLdSite = {
  name: "Maison Palettia",
  legalName: "Maison Palettia Events L.L.C.",
  url: "https://example.test",
  logo: "https://example.test/logo.png",
};

const partner: PartnerRecord = {
  slug: "times-square-center",
  name: "Times Square Center",
  locality: "Dubai",
  descriptor: "A centre.",
  locationHref: "https://maps.example/tsc",
  address: ["Level 1, Unit 12", "Sheikh Zayed Road"],
  coordinates: { lat: 25.11, lng: 55.2 },
};

const session: Workshop = {
  slug: "candle-making-2026-10-11-1530",
  title: "Candle Making",
  category: "Craft",
  kind: "scheduled",
  startsAt: "2026-10-11T15:30:00+04:00",
  durationMinutes: 120,
  venue: { name: "Times Square Center", locality: "Dubai" },
  price: { amount: 240, currency: "AED" },
  seatsTotal: 12,
  seatsAvailable: 9,
  status: "open",
  excerpt: "Pour your own candle.",
  image: { src: "/images/experiences/CANDLE_MAKING.jpg", alt: "Candles" },
};

describe("postalAddress", () => {
  it("splits the site's printed lines into street, locality and country", () => {
    expect(postalAddress(["Unit 4, Some Building", "Dubai", "United Arab Emirates"])).toEqual({
      "@type": "PostalAddress",
      streetAddress: "Unit 4, Some Building",
      addressLocality: "Dubai",
      addressCountry: "AE",
    });
  });

  it("never prints a street it was not given", () => {
    expect(postalAddress(["Dubai", "United Arab Emirates"])).toEqual({
      "@type": "PostalAddress",
      addressLocality: "Dubai",
      addressCountry: "AE",
    });
    expect(postalAddress([])).toEqual({ "@type": "PostalAddress", addressCountry: "AE" });
  });
});

describe("localBusinessJsonLd", () => {
  it("claims only what Site details holds, and locates the business at its one venue", () => {
    const data = localBusinessJsonLd({
      site,
      contact: { addressLines: ["Dubai", "United Arab Emirates"], email: "hello@example.test", phone: "+971 4 000 0000" },
      socials: [
        { label: "Instagram", href: "https://instagram.com/x" },
        { label: "Facebook", href: null },
      ],
      partners: [partner],
      description: "Creative workshops in Dubai",
    });

    expect(data["@type"]).toBe("LocalBusiness");
    expect(data.legalName).toBe(site.legalName);
    expect(data.telephone).toBe("+97140000000");
    expect(data.sameAs).toEqual(["https://instagram.com/x"]);
    expect(data.location).toMatchObject({
      "@type": "Place",
      name: "Times Square Center",
      hasMap: "https://maps.example/tsc",
      geo: { "@type": "GeoCoordinates", latitude: 25.11, longitude: 55.2 },
      address: { streetAddress: "Level 1, Unit 12, Sheikh Zayed Road", addressLocality: "Dubai" },
    });
  });

  it("omits what is missing rather than filling it in", () => {
    const data = localBusinessJsonLd({
      site: { ...site, logo: null },
      contact: { addressLines: [], email: null, phone: null },
      socials: [],
      partners: [partner, { ...partner, slug: "second", name: "Second" }],
      description: "x",
    });
    expect(data).not.toHaveProperty("logo");
    expect(data).not.toHaveProperty("email");
    expect(data).not.toHaveProperty("telephone");
    expect(data).not.toHaveProperty("sameAs");
    // Two venues is two places, not one location.
    expect(data).not.toHaveProperty("location");
  });
});

describe("eventJsonLd", () => {
  it("describes a bookable session with its venue, times and offer", () => {
    const data = eventJsonLd({ site, workshop: session, description: "Pour your own candle.", partner, passed: false });

    expect(data["@type"]).toBe("Event");
    expect(data.url).toBe("https://example.test/events/candle-making-2026-10-11-1530");
    expect(data.startDate).toBe(session.startsAt);
    expect(data.endDate).toBe("2026-10-11T13:30:00.000Z"); // 15:30 +04:00 plus two hours
    expect(data.image).toEqual(["https://example.test/images/experiences/CANDLE_MAKING.jpg"]);
    expect(data.location).toMatchObject({ "@type": "Place", name: "Times Square Center" });
    expect(data.offers).toMatchObject({
      "@type": "Offer",
      url: "https://example.test/events/candle-making-2026-10-11-1530/book",
      price: 240,
      priceCurrency: "AED",
      availability: "https://schema.org/InStock",
      validThrough: session.startsAt,
      inventoryLevel: { value: 9 },
    });
  });

  it("marks a full, waitlisted or passed session in the offer, never in the event status", () => {
    const full = eventJsonLd({ site, workshop: { ...session, seatsAvailable: 0, status: "fully-booked" }, description: null, passed: false });
    const waitlist = eventJsonLd({ site, workshop: { ...session, status: "waitlist" }, description: null, passed: false });
    const passed = eventJsonLd({ site, workshop: session, description: null, passed: true });

    for (const data of [full, waitlist, passed]) expect(data.eventStatus).toBe("https://schema.org/EventScheduled");
    expect((full.offers as { availability: string }).availability).toBe("https://schema.org/SoldOut");
    expect((waitlist.offers as { availability: string }).availability).toBe("https://schema.org/LimitedAvailability");
    expect((passed.offers as { availability: string }).availability).toBe("https://schema.org/SoldOut");
    expect(full).not.toHaveProperty("description");
  });

  it("prints no offer for a session with no price, and no location for one with no venue", () => {
    const noVenue: Workshop = { ...session, price: { amount: 0, currency: "AED" } };
    delete noVenue.venue;
    const data = eventJsonLd({ site, workshop: noVenue, description: null, passed: false });
    expect(data).not.toHaveProperty("offers");
    expect(data).not.toHaveProperty("location");
  });
});

describe("passesJsonLd", () => {
  it("lists only the priced passes as products, and nothing when none is priced", () => {
    const passes = [
      { slug: "day", name: "Day Pass", description: "One session.", benefits: [], price: { amount: 320, currency: "AED" } },
      { slug: "draft", name: "Unpriced", description: "Not on sale.", benefits: [] },
    ];
    const data = passesJsonLd({ site, passes, path: "/loyalty" });
    expect(data?.numberOfItems).toBe(1);
    expect(data?.itemListElement).toMatchObject([
      { position: 1, item: { "@type": "Product", name: "Day Pass", offers: { price: 320, priceCurrency: "AED" } } },
    ]);
    expect(passesJsonLd({ site, passes: [passes[1]], path: "/loyalty" })).toBeNull();
  });
});

describe("serializeJsonLd", () => {
  it("cannot be closed early by an editor-written </script>", () => {
    const out = serializeJsonLd({ name: "</script><img src=x onerror=alert(1)>" });
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual({ name: "</script><img src=x onerror=alert(1)>" });
  });
});
