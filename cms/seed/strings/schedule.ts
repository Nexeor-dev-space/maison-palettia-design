import type { SessionSeed } from "../types";

/**
 * ==========================================================================
 * The client's timetable — "Scheduled Workshops Update", Oct 2026
 * ==========================================================================
 *
 * Three weeks of dated sittings, "from 16th November onwards only for
 * workshops", three slots a day (11:00 am, 2:30 pm, 6:30 pm) and "seating
 * capacity per workshop: 6 people". The grid below is the update's three
 * weekly tables, one row per weekday, one cell per slot, copied as given;
 * `scheduleSessions` turns it into one session per cell.
 *
 * WHAT IS INVENTED HERE, AND FLAGGED. The update gives no prices and no
 * durations. Each session takes the figure the design-phase placeholder
 * for its experience already carried (candle AED 240 / 2 hours, crochet
 * AED 280 / 2.5 hours) and says so in its internal note, so staff can find
 * every one with a single search and the figures are never mistaken for
 * the studio's.
 *
 * 16 November 2026 is a Monday, so week 1 starts on the Monday row.
 */

/** The six formats, as the slugs cms/seed/strings/workshopTypes.ts gives them. */
const CB = "crochet-beginners";
const BB = "crochet-beginner-basics";
const RL = "crochet-returning-learners";
const BP = "crochet-beginner-project";
const CC = "cheesecake-collection";
const SF = "sculptural-forms";

type Slot = string | null;
/** Monday to Sunday; the three slots in order: 11:00, 14:30, 18:30. */
type Week = readonly [Slot, Slot, Slot][];

const WEEKS: readonly Week[] = [
  // Week 1
  [
    [CB, null, CB],
    [CC, null, CC],
    [CB, null, BB],
    [SF, null, SF],
    [RL, null, RL],
    [CC, BP, SF],
    [CB, null, CC],
  ],
  // Week 2
  [
    [CB, null, CB],
    [CC, null, CC],
    [BB, null, BB],
    [SF, null, SF],
    [RL, null, RL],
    [SF, BP, CC],
    [CB, null, SF],
  ],
  // Week 3
  [
    [CB, null, CB],
    [CC, null, CC],
    [BB, null, BB],
    [SF, null, SF],
    [RL, null, RL],
    [CC, BP, SF],
    [CB, null, CC],
  ],
];

const SLOT_TIMES = ["11:00", "14:30", "18:30"] as const;

/** The update's start: a Monday. */
export const SCHEDULE_START = "2026-11-16";

/** "Seating capacity per workshop: 6 people." */
export const SCHEDULE_SEATS = 6;

/** The placeholder price and duration each experience's existing seed carries. */
const BY_EXPERIENCE: Record<string, { experience: string; priceFils: number; durationMinutes: number; image: string }> = {
  [CC]: { experience: "candle-making", priceFils: 24000, durationMinutes: 120, image: "images/experiences/CANDLE_MAKING.jpg" },
  [SF]: { experience: "candle-making", priceFils: 24000, durationMinutes: 120, image: "images/experiences/CANDLE_MAKING.jpg" },
  [CB]: { experience: "crocheting", priceFils: 28000, durationMinutes: 150, image: "images/experiences/CROCHETING.jpg" },
  [BB]: { experience: "crocheting", priceFils: 28000, durationMinutes: 150, image: "images/experiences/CROCHETING.jpg" },
  [RL]: { experience: "crocheting", priceFils: 28000, durationMinutes: 150, image: "images/experiences/CROCHETING.jpg" },
  [BP]: { experience: "crocheting", priceFils: 28000, durationMinutes: 150, image: "images/experiences/CROCHETING.jpg" },
};

/** The note every generated session carries, so staff can find them all with one search. */
export const SCHEDULE_NOTE =
  "Client timetable (Scheduled Workshops Update, Oct 2026). Price and duration are placeholders — confirm before publishing";

const pad = (n: number) => String(n).padStart(2, "0");

/** `start` plus `days`, as YYYY-MM-DD (civil arithmetic, no zone involved). */
function addDays(start: string, days: number): string {
  const [y, m, d] = start.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * One session per filled cell of the grid, in date order, each at Dubai
 * wall-clock time (+04:00, no daylight saving).
 */
export function scheduleSessions(start = SCHEDULE_START, weeks: readonly Week[] = WEEKS): SessionSeed[] {
  const out: SessionSeed[] = [];
  weeks.forEach((week, w) => {
    week.forEach((slots, weekday) => {
      const day = addDays(start, w * 7 + weekday);
      slots.forEach((type, i) => {
        if (!type) return;
        const base = BY_EXPERIENCE[type];
        if (!base) throw new Error(`schedule: unknown workshop type ${type}`);
        out.push({
          experience: base.experience,
          workshopType: type,
          category: "Craft",
          startsAt: `${day}T${SLOT_TIMES[i]}:00+04:00`,
          durationMinutes: base.durationMinutes,
          venue: "times-square-center",
          priceFils: base.priceFils,
          seatsTotal: SCHEDULE_SEATS,
          status: "open",
          image: base.image,
        });
      });
    });
  });
  return out;
}

export const SCHEDULE: SessionSeed[] = scheduleSessions();
