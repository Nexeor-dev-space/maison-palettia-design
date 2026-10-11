import { describe, expect, it } from "vitest";

import {
  applyFilters,
  buildCalendar,
  dayKey,
  defaultCalendarMonth,
  monthKeyLabel,
  monthKeys,
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
    expect(applyFilters(october, { month: third.key, category: null, venue: null }).map((w) => w.slug)).toEqual(["a", "b"]);
  });

  it("draws a month with nothing in it as empty cells, never as an error", () => {
    const grid = buildCalendar(october, "2026-12");
    expect(grid.weeks.flat().every((c) => c.workshops.length === 0)).toBe(true);
    expect(grid.weeks.flat().filter((c) => c.inMonth)).toHaveLength(31);
  });
});
