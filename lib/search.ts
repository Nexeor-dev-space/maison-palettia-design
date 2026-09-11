import { sessionDateParts } from "@/lib/workshops";
import type { Workshop } from "@/types";

/**
 * Search over the events catalogue, for the navbar's search overlay.
 *
 * Reads the same `Workshop[]` every other surface does — the homepage
 * schedule, the listing at `/events`, this module holds no data of its own
 * and is a pure function of whatever `getAllWorkshops()` returns. There is
 * nothing here to keep in sync with the catalogue and nothing to replace when
 * the catalogue moves to a CMS: the seam is already `getAllWorkshops`, and
 * this module sits downstream of it like everything else does.
 *
 * Plain functions, no React. `useSearchResults` — the hook that debounces a
 * query and calls `searchWorkshops` on it — lives in
 * `lib/useDebouncedValue.ts` instead, so this file stays importable from
 * anywhere `lib/workshops.ts` already is, server components included.
 */

/**
 * What a query has to look like to count as asking about the weekend.
 *
 * No workshop stores this — Saturday and Sunday are read off `startsAt`, the
 * same field every date on the site is already formatted from. It exists so
 * that typing "weekend" surfaces sessions that happen to fall on one without
 * the word ever needing to live in the data, and it matches on a prefix in
 * both directions so it fires as the word is still being typed ("week",
 * "weeke") and on the plural ("weekends") as well as the singular.
 */
function readsAsWeekend(query: string): boolean {
  return query.length >= 3 && (query.startsWith("weekend") || "weekend".startsWith(query));
}

/** True for a session that falls on a Saturday or Sunday, studio time. */
export function isWeekendWorkshop(workshop: Workshop): boolean {
  const { weekday } = sessionDateParts(workshop.startsAt);
  return weekday === "Sat" || weekday === "Sun";
}

/**
 * Every field a query is allowed to match against, lower-cased and joined.
 *
 * Title and category cover "event name" and "event type" from the brief in
 * one line each; the venue's two parts cover "location"; the excerpt is the
 * one open-ended field, and it is what lets a material or a mood — "clay",
 * "loose washes" — stand in for a category name someone would not otherwise
 * think to type. Nothing here is invented for search: every field already
 * ships to the page a visitor would land on.
 */
function haystack(workshop: Workshop): string {
  return [workshop.title, workshop.category, workshop.excerpt, workshop.venue?.name, workshop.venue?.locality]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * Every session whose text matches `rawQuery`, best match first.
 *
 * Ranked in four tiers rather than scored — the catalogue is small enough
 * that a real relevance score would be tuning noise nobody could see the
 * difference of. A title starting with the query outranks one that merely
 * contains it, which outranks a match buried in the venue or the excerpt,
 * which outranks a session that matches only because it happens to fall on a
 * weekend and the query reads as one. Ties keep the catalogue's own order —
 * soonest first, the same as everywhere else on the site.
 *
 * Plain substring matching, deliberately. No fuzzy matching, no typo
 * tolerance, no scoring library — the catalogue a studio table's worth of
 * sessions, so anything cleverer is complexity spent on a scale that will
 * never feel it.
 */
export function searchWorkshops(workshops: Workshop[], rawQuery: string): Workshop[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];

  const weekendQuery = readsAsWeekend(query);

  return workshops
    .map((workshop) => {
      const title = workshop.title.toLowerCase();
      let tier = -1;
      if (title.startsWith(query)) tier = 0;
      else if (title.includes(query)) tier = 1;
      else if (haystack(workshop).includes(query)) tier = 2;
      else if (weekendQuery && isWeekendWorkshop(workshop)) tier = 3;
      return { workshop, tier };
    })
    .filter((entry) => entry.tier !== -1)
    .sort((a, b) => a.tier - b.tier || a.workshop.startsAt.localeCompare(b.workshop.startsAt))
    .map((entry) => entry.workshop);
}

/**
 * A short list of terms worth suggesting before anyone has typed anything.
 *
 * Every word here is read off the catalogue at call time rather than kept as
 * a fixed list, so a suggestion can never name a category, a district or a
 * "Weekend" the studio does not currently have on the schedule — the failure
 * mode a hand-written list invites the moment the studio adds or drops a
 * session. Categories lead (what), "Weekend" follows when it is genuinely
 * true of at least one session (when), and localities close it out (where) —
 * the same order the brief asks search itself to answer in.
 *
 * Capped at six so the row of pills stays a row rather than becoming a second
 * catalogue in miniature; categories and "Weekend" are cheap so they are
 * never the ones cut, and the first few localities carry whatever is left.
 */
export function getPopularSearches(workshops: Workshop[]): string[] {
  const categories = [...new Set(workshops.map((workshop) => workshop.category))];
  const localities = [
    ...new Set(workshops.map((workshop) => workshop.venue?.locality).filter((locality) => Boolean(locality))),
  ] as string[];

  const suggestions = [...categories];
  if (workshops.some(isWeekendWorkshop)) suggestions.push("Weekend");
  suggestions.push(...localities);

  return suggestions.slice(0, 6);
}
