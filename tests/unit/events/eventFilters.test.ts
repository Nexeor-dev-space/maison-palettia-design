import { describe, expect, it } from "vitest";

import {
  activeFilterCount,
  applyFilters,
  buildCalendar,
  buildFacets,
  buildVibeIndex,
  dayKey,
  defaultCalendarMonth,
  monthKeyLabel,
  monthKeys,
  NO_FILTERS,
  shiftMonthKey,
} from "@/lib/eventFilters";
import type { Workshop } from "@/types";

/**
 * The calendar builders in lib/eventFilters.ts: pure functions over the
 * session list, in the studio's time zone, Monday first.
 */
function session(slug: string, startsAt: string): Workshop {
  return {
    slug,
    title: slug,
    category: "Craft",
    startsAt,
    durationMinutes: 120,
    price: { amount: 240, currency: "AED" },
    seatsTotal: 10,
    seatsAvailable: 5,
    status: "open",
    excerpt: "",
    image: { src: "/x.jpg", alt: "" },
  };
}

const october = [
  session("a", "2026-10-03T10:00:00+04:00"),
  session("b", "2026-10-03T15:30:00+04:00"),
  // 23:30 Dubai on the 24th is 19:30 UTC the same day — stays on the 24th.
  session("c", "2026-10-24T23:30:00+04:00"),
  // 01:00 Dubai on the 1st of November is 21:00 UTC on 31 October — must land in November.
  session("d", "2026-11-01T01:00:00+04:00"),
];

describe("month keys", () => {
  it("lists the months the programme touches, chronologically", () => {
    expect(monthKeys(october)).toEqual(["2026-10", "2026-11"]);
  });

  it("shifts across year ends", () => {
    expect(shiftMonthKey("2026-12", 1)).toBe("2027-01");
    expect(shiftMonthKey("2026-01", -1)).toBe("2025-12");
    expect(monthKeyLabel("2026-10")).toBe("October 2026");
  });

  it("opens on the first month with a session still ahead, else the last month", () => {
    const before = Date.parse("2026-10-01T00:00:00Z");
    const between = Date.parse("2026-10-30T00:00:00Z");
    const after = Date.parse("2027-01-01T00:00:00Z");
    expect(defaultCalendarMonth(october, before)).toBe("2026-10");
    expect(defaultCalendarMonth(october, between)).toBe("2026-11");
    expect(defaultCalendarMonth(october, after)).toBe("2026-11");
    expect(defaultCalendarMonth([], before)).toBeNull();
  });
});

describe("buildCalendar", () => {
  it("lays October 2026 out Monday-first with the right padding", () => {
    const grid = buildCalendar(october, "2026-10");
    expect(grid.label).toBe("October 2026");
    expect(grid.weeks).toHaveLength(5);
    // 1 October 2026 is a Thursday: three leading cells from September.
    const first = grid.weeks[0];
    expect(first.slice(0, 3).map((c) => c.inMonth)).toEqual([false, false, false]);
    expect(first[3]).toMatchObject({ key: "2026-10-01", day: 1, inMonth: true });
    // 31 October is a Saturday, so the last row ends on one trailing cell.
    const last = grid.weeks[4];
    expect(last[5]).toMatchObject({ key: "2026-10-31", inMonth: true });
    expect(last[6]).toMatchObject({ key: "2026-11-01", inMonth: false });
  });

  it("places sessions on their Dubai date, soonest first, and keys cells as the filter does", () => {
    const grid = buildCalendar(october, "2026-10");
    const cells = grid.weeks.flat();
    const third = cells.find((c) => c.key === "2026-10-03")!;
    expect(third.workshops.map((w) => w.slug)).toEqual(["a", "b"]);
    expect(cells.find((c) => c.key === "2026-10-24")!.workshops.map((w) => w.slug)).toEqual(["c"]);
    // The November session shows on the trailing 1 November cell, not on 31 October.
    expect(cells.find((c) => c.key === "2026-10-31")!.workshops).toEqual([]);
    expect(cells.find((c) => c.key === "2026-11-01")!.workshops.map((w) => w.slug)).toEqual(["d"]);

    // A cell's key is the same value the date filter narrows on.
    expect(dayKey(october[0].startsAt)).toBe(third.key);
    expect(applyFilters(october, { ...NO_FILTERS, month: third.key }).map((w) => w.slug)).toEqual(["a", "b"]);
  });

  it("draws a month with nothing in it as empty cells, never as an error", () => {
    const grid = buildCalendar(october, "2026-12");
    expect(grid.weeks.flat().every((c) => c.workshops.length === 0)).toBe(true);
    expect(grid.weeks.flat().filter((c) => c.inMonth)).toHaveLength(31);
  });
});

/* ==========================================================================
   Event and Vibe — the experience a date belongs to, and its mood tags.
   ========================================================================== */

const candle = { slug: "candle-making", name: "Candle Making" };
const crochet = { slug: "crocheting", name: "Crocheting" };

const programme = [
  { ...session("candle-1", "2026-11-17T11:00:00+04:00"), experience: candle },
  { ...session("candle-2", "2026-11-17T18:30:00+04:00"), experience: candle },
  { ...session("crochet-1", "2026-11-16T11:00:00+04:00"), experience: crochet },
  // A session the CMS could not resolve an experience for: still listed, never filterable by event or vibe.
  session("orphan", "2026-11-20T11:00:00+04:00"),
];

const VIBE_LIST = [
  { slug: "messy-expressive", label: "Messy & Expressive" },
  { slug: "mindful-chill", label: "Mindful & Chill" },
  { slug: "quick-crafts", label: "Quick 30-Min Crafts" },
];

const tagged = buildVibeIndex([
  { slug: "candle-making", vibes: ["mindful-chill", "quick-crafts"] },
  { slug: "crocheting", vibes: ["mindful-chill"] },
]);

describe("event facet", () => {
  it("offers each experience once, named, with its session count", () => {
    const { events } = buildFacets(programme);
    expect(events).toEqual([
      { value: "candle-making", label: "Candle Making", count: 2 },
      { value: "crocheting", label: "Crocheting", count: 1 },
    ]);
  });

  it("narrows to one experience's dates", () => {
    expect(applyFilters(programme, { ...NO_FILTERS, event: "crocheting" }).map((w) => w.slug)).toEqual(["crochet-1"]);
    expect(applyFilters(programme, { ...NO_FILTERS, event: "candle-making" }).map((w) => w.slug)).toEqual(["candle-1", "candle-2"]);
  });
});

describe("vibe facet", () => {
  it("offers nothing while no experience is tagged, or without the taxonomy", () => {
    expect(buildFacets(programme).vibes).toEqual([]);
    expect(buildFacets(programme, { vibeIndex: buildVibeIndex([{ slug: "candle-making" }]), vibes: VIBE_LIST }).vibes).toEqual([]);
    expect(buildFacets(programme, { vibeIndex: tagged }).vibes).toEqual([]);
  });

  it("counts each session under every vibe its experience carries, in the taxonomy's order", () => {
    const { vibes } = buildFacets(programme, { vibeIndex: tagged, vibes: VIBE_LIST });
    expect(vibes).toEqual([
      { value: "mindful-chill", label: "Mindful & Chill", count: 3 },
      { value: "quick-crafts", label: "Quick 30-Min Crafts", count: 2 },
    ]);
  });

  it("does not offer a tag the taxonomy has no label for", () => {
    const index = buildVibeIndex([{ slug: "candle-making", vibes: ["unknown-vibe"] }]);
    expect(buildFacets(programme, { vibeIndex: index, vibes: VIBE_LIST }).vibes).toEqual([]);
  });

  it("narrows through the experience's tags, and combines with the other dimensions", () => {
    const context = { vibeIndex: tagged, vibes: VIBE_LIST };
    expect(applyFilters(programme, { ...NO_FILTERS, vibe: "quick-crafts" }, context).map((w) => w.slug)).toEqual(["candle-1", "candle-2"]);
    expect(applyFilters(programme, { ...NO_FILTERS, vibe: "mindful-chill", event: "crocheting" }, context).map((w) => w.slug)).toEqual(["crochet-1"]);
    expect(applyFilters(programme, { ...NO_FILTERS, vibe: "mindful-chill", month: "2026-11-17" }, context).map((w) => w.slug)).toEqual(["candle-1", "candle-2"]);
    // Without the index a vibe can match nothing — never everything.
    expect(applyFilters(programme, { ...NO_FILTERS, vibe: "mindful-chill" })).toEqual([]);
  });

  it("prefers a date's own tags over its experience's, and falls back when it has none", () => {
    const context = { vibeIndex: tagged, vibes: VIBE_LIST };
    const dated = [
      // Tagged on the date itself: the experience's "mindful-chill" no longer applies to it.
      { ...programme[0], vibes: ["messy-expressive"] },
      // Untagged: takes Candle Making's tags.
      programme[1],
      // An empty list is "not tagged", not "no vibes".
      { ...programme[2], vibes: [] },
      // Its own tags, with no experience to fall back to.
      { ...programme[3], vibes: ["quick-crafts"] },
    ];
    const { vibes } = buildFacets(dated, context);
    expect(vibes).toEqual([
      { value: "messy-expressive", label: "Messy & Expressive", count: 1 },
      { value: "mindful-chill", label: "Mindful & Chill", count: 2 },
      { value: "quick-crafts", label: "Quick 30-Min Crafts", count: 2 },
    ]);
    expect(applyFilters(dated, { ...NO_FILTERS, vibe: "messy-expressive" }, context).map((w) => w.slug)).toEqual(["candle-1"]);
    expect(applyFilters(dated, { ...NO_FILTERS, vibe: "mindful-chill" }, context).map((w) => w.slug)).toEqual(["candle-2", "crochet-1"]);
    expect(applyFilters(dated, { ...NO_FILTERS, vibe: "quick-crafts" }, context).map((w) => w.slug)).toEqual(["candle-2", "orphan"]);
    // A date's own tags work with no index at all.
    expect(applyFilters(dated, { ...NO_FILTERS, vibe: "quick-crafts" }).map((w) => w.slug)).toEqual(["orphan"]);
  });

  it("counts the new dimensions towards the reset control", () => {
    expect(activeFilterCount(NO_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...NO_FILTERS, event: "crocheting", vibe: "mindful-chill" })).toBe(2);
  });
});
