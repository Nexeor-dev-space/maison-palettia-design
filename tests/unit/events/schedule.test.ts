import { describe, expect, it } from "vitest";

import { sessionSlug, sessionSlugBase } from "@/cms/seed/content";
import { SCHEDULE, SCHEDULE_SEATS, SCHEDULE_START, scheduleSessions } from "@/cms/seed/strings/schedule";
import { WORKSHOP_TYPES } from "@/cms/seed/strings/workshopTypes";
import { sessionSlugFor } from "@/cms/hooks/sessionSlug";

/**
 * The client's Nov 2026 timetable as the seed writes it (cms/seed/strings/
 * schedule.ts): three weeks from Monday 16 November, three slots a day,
 * six seats, every cell pointing at a workshop type that exists.
 */
describe("the Nov 2026 timetable", () => {
  it("starts on Monday 16 November 2026 at 11:00 Dubai and runs three weeks", () => {
    expect(SCHEDULE_START).toBe("2026-11-16");
    expect(new Date(Date.UTC(2026, 10, 16)).getUTCDay()).toBe(1); // Monday
    expect(SCHEDULE[0]).toMatchObject({ workshopType: "crochet-beginners", startsAt: "2026-11-16T11:00:00+04:00" });
    expect(SCHEDULE.at(-1)?.startsAt).toBe("2026-12-06T18:30:00+04:00"); // Sunday of week 3
  });

  it("has two sittings every day and three on Saturdays — 45 in all — of six seats each", () => {
    expect(SCHEDULE).toHaveLength(45);
    const byDay = new Map<string, number>();
    for (const s of SCHEDULE) byDay.set(s.startsAt.slice(0, 10), (byDay.get(s.startsAt.slice(0, 10)) ?? 0) + 1);
    for (const [day, count] of byDay) {
      const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
      expect(count, day).toBe(weekday === 6 ? 3 : 2);
    }
    expect(SCHEDULE.every((s) => s.seatsTotal === SCHEDULE_SEATS && s.seatsTotal === 6)).toBe(true);
    expect(SCHEDULE.every((s) => /T(11:00|14:30|18:30):00\+04:00$/.test(s.startsAt))).toBe(true);
  });

  it("names only workshop types the seed creates, under the right experience", () => {
    const types = new Map(WORKSHOP_TYPES.map((t) => [t.slug, t]));
    for (const s of SCHEDULE) {
      const type = types.get(s.workshopType ?? "");
      expect(type, s.workshopType).toBeDefined();
      expect(type?.experience).toBe(s.experience);
    }
    // The crochet ladder is a chain: each level recommends the one before it.
    const crochet = WORKSHOP_TYPES.filter((t) => t.experience === "crocheting").sort((a, b) => a.order - b.order);
    expect(crochet.map((t) => t.progression?.recommendedAfter ?? null)).toEqual([null, ...crochet.slice(0, -1).map((t) => t.slug)]);
  });

  it("gives each session the slug the admin hook would generate: type-date-time", () => {
    const first = SCHEDULE[0];
    const slug = sessionSlug(sessionSlugBase(first), first.startsAt);
    expect(slug).toBe("crochet-beginners-2026-11-16-1100");
    expect(sessionSlugFor("crochet-beginners", first.startsAt)).toBe(slug);
    // Two formats of one experience at the same hour get distinct addresses.
    const slugs = new Set(SCHEDULE.map((s) => sessionSlug(sessionSlugBase(s), s.startsAt)));
    expect(slugs.size).toBe(SCHEDULE.length);
    // A row without a type still keys on its experience, as the two old placeholders do.
    expect(sessionSlugBase({ experience: "candle-making" })).toBe("candle-making");
  });

  it("can be regenerated from another Monday without changing shape", () => {
    const later = scheduleSessions("2026-12-07");
    expect(later).toHaveLength(45);
    expect(later[0].startsAt).toBe("2026-12-07T11:00:00+04:00");
  });
});
