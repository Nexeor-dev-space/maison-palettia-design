import { describe, expect, it } from "vitest";

import { getPopularSearches, searchWorkshops } from "../../lib/search";
import { isFullyBooked, isScarce, spotsLabel, toHeaderSession, workshopHref } from "../../lib/workshopHelpers";
import type { Workshop } from "../../types";

/**
 * The header's slim sessions (#216): <Header> now hands the client bar only
 * what it reads. Whatever the header computes from them — search results,
 * suggestions, seat labels, links — must be what it computed from the full
 * sessions, and nothing it does not read may be shipped.
 */

const blur = { src: "data:image/webp;base64,UklGRkQAAABXRUJQVlA4IDgAAAA=", aspect: 1.5 };

const full = (over: Partial<Workshop>): Workshop => ({
  slug: "candles-sat",
  title: "Candle Making",
  category: "Craft",
  kind: "scheduled",
  startsAt: "2026-11-21T10:00:00+04:00", // a Saturday
  durationMinutes: 120,
  venue: { name: "Dubai Hills Mall", locality: "Dubai Hills" },
  workshopType: { slug: "soy", name: "Soy candles", level: "Beginner" },
  experience: { slug: "candle-making", name: "Candle Making" },
  vibes: ["calm"],
  price: { amount: 320, currency: "AED" },
  seatsTotal: 12,
  seatsAvailable: 8,
  status: "open",
  excerpt: "Pour, scent and wick a hand-poured candle to take home.",
  image: { src: "/images/candles.jpg", alt: "Candles on a table", position: "40% 50%", blur },
  gallery: [
    { src: "/images/g1.jpg", alt: "One", blur },
    { src: "/images/g2.jpg", alt: "Two", blur },
  ],
  ...over,
});

const catalogue: Workshop[] = [
  full({}),
  full({
    slug: "crochet-tue",
    title: "Crocheting",
    category: "Textile",
    startsAt: "2026-11-24T18:00:00+04:00",
    venue: { name: "Mall of the Emirates", locality: "Al Barsha" },
    seatsAvailable: 2,
    excerpt: "Hook, yarn and a first granny square.",
    gallery: undefined,
  }),
  full({
    slug: "mandala-wed",
    title: "Mandala Painting",
    category: "Paint",
    startsAt: "2026-11-25T11:00:00+04:00",
    venue: undefined,
    status: "fully-booked",
    seatsAvailable: 0,
    excerpt: "Dot by dot, a mandala on wood.",
    image: { src: "/images/mandala.jpg", alt: "Mandala" },
  }),
  full({ slug: "bedazzling-wait", title: "Bedazzling", category: "Craft", status: "waitlist", seatsAvailable: 5 }),
];
const slim = catalogue.map(toHeaderSession);

describe("toHeaderSession", () => {
  it("keeps exactly the fields the header reads", () => {
    expect(Object.keys(slim[0]).sort()).toEqual(
      ["category", "durationMinutes", "excerpt", "image", "seatsAvailable", "slug", "startsAt", "status", "title", "venue"].sort(),
    );
    expect(slim[0].image).toEqual({ src: "/images/candles.jpg", position: "40% 50%", blur });
  });

  it("drops what the header never reads — gallery, price, format, vibes, image alt", () => {
    for (const key of ["gallery", "price", "workshopType", "experience", "vibes", "kind", "seatsTotal"]) {
      expect(slim[0]).not.toHaveProperty(key);
    }
    expect(slim[0].image).not.toHaveProperty("alt");
  });

  it("omits optional fields that were absent rather than setting them to undefined", () => {
    expect(slim[2]).not.toHaveProperty("venue");
    expect(slim[2].image).toEqual({ src: "/images/mandala.jpg" });
  });

  it("is smaller once serialised", () => {
    expect(JSON.stringify(slim).length).toBeLessThan(JSON.stringify(catalogue).length);
  });
});

describe("the header computes the same answers from the slim sessions", () => {
  it.each(["candle", "craft", "hills", "granny", "barsha", "weekend", "mandala", "zzz", ""])("search %j", (query) => {
    const fromFull = searchWorkshops(catalogue, query).map((w) => w.slug);
    const fromSlim = searchWorkshops(slim, query).map((w) => w.slug);
    expect(fromSlim).toEqual(fromFull);
  });

  it("popular searches", () => {
    expect(getPopularSearches(slim)).toEqual(getPopularSearches(catalogue));
  });

  it("seat labels, scarcity, fully booked and links", () => {
    catalogue.forEach((w, i) => {
      expect(spotsLabel(slim[i])).toBe(spotsLabel(w));
      expect(isScarce(slim[i])).toBe(isScarce(w));
      expect(isFullyBooked(slim[i])).toBe(isFullyBooked(w));
      expect(workshopHref(slim[i])).toBe(workshopHref(w));
    });
  });
});
