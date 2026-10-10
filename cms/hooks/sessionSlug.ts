import { ValidationError, type CollectionBeforeValidateHook, type PayloadRequest } from "payload";

import { findLiveRow, isLive, latestIsLive } from "./formatSlug";

/**
 * ==========================================================================
 * sessionSlug — `{experience}-{yyyy-mm-dd}-{HHmm}`, and the default title
 * ==========================================================================
 *
 * A session's address is derived, not written: the experience's slug plus
 * the start in studio time, e.g. `candle-making-2026-10-11-1000` (SPEC §D.2,
 * §F.4). The minutes make collisions impossible between two sittings of the
 * same experience on one day, so the only clash left is a true duplicate —
 * "A session for this experience already exists on this date and time".
 *
 * WHEN IT IS REGENERATED. While the session has never been live, a slug that
 * looks generated (`…-yyyy-mm-dd-HHmm`, optionally `-2`) follows the
 * experience and the start time, so moving a draft to Saturday moves its
 * address with it. A slug an editor typed by hand is kept (and must be
 * free). Once the session has been published the address is left alone:
 * renaming it is an admin act guarded by `guardSlugChange`, and the
 * Reschedule action (Phase 3) computes and redirects the new one itself.
 *
 * DUPLICATES. Payload's Duplicate blanks the slug (Sessions.ts
 * `beforeDuplicate`), so the copy regenerates the same slug as its source.
 * A DRAFT may carry it with a `-2`, `-3`… suffix so the copy can be saved
 * and then moved to its new date; PUBLISHING a session whose generated slug
 * is taken is refused with the message above, on the Starts field.
 *
 * Runs as a collection `beforeValidate` — after the field hooks, before
 * validation — so the `required` slug and title are filled by the time
 * they are checked. The slug field on `sessions` is built with
 * `from: "slug"`, which stops cms/fields/slug.ts deriving it from the title
 * first (a title-derived slug would look hand-written and stick).
 */

export const STUDIO_TIME_ZONE = "Asia/Dubai";

/** `…-2026-10-11-1000` with an optional `-N` duplicate suffix. */
const GENERATED_TAIL = /-\d{4}-\d{2}-\d{2}-\d{4}(-\d{1,2})?$/;

const parts = (date: Date, timeZone: string) => {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => formatted.find((part) => part.type === type)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
};

/**
 * The generated slug for an experience slug and a start instant, in the
 * session's zone (Asia/Dubai unless the date field stored another). Pure;
 * the §K unit test exercises it directly.
 */
export function sessionSlugFor(experienceSlug: string, startsAt: string | Date, timeZone: string = STUDIO_TIME_ZONE): string | undefined {
  const date = startsAt instanceof Date ? startsAt : new Date(startsAt);
  if (!experienceSlug || Number.isNaN(date.getTime())) return undefined;
  let zone = timeZone || STUDIO_TIME_ZONE;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: zone });
  } catch {
    zone = STUDIO_TIME_ZONE;
  }
  const { year, month, day, hour, minute } = parts(date, zone);
  // 64 is the slug field's limit; the date tail is 16 characters.
  return `${experienceSlug.slice(0, 48).replace(/-+$/, "")}-${year}-${month}-${day}-${hour}${minute}`;
}

export const looksGenerated = (slug: unknown): boolean => typeof slug === "string" && GENERATED_TAIL.test(slug);

const idOf = (value: unknown): string | undefined => {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" && id ? id : undefined;
  }
  return undefined;
};

const text = (value: unknown): string | undefined => (typeof value === "string" && value.trim() ? value : undefined);

async function slugTaken(req: PayloadRequest, slug: string, selfId: unknown): Promise<boolean> {
  const where: Record<string, unknown> = { slug: { equals: slug } };
  if (selfId) where.id = { not_equals: selfId };
  const row = await req.payload.db.findOne({ collection: "sessions", req, where: where as never });
  return Boolean(row);
}

const duplicateError = (req: PayloadRequest, path: string, message: string) =>
  new ValidationError({ collection: "sessions", errors: [{ path, message }] }, req.t);

export const sessionSlug: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data;
  const incoming = data as Record<string, unknown>;
  const previous = (originalDoc ?? {}) as Record<string, unknown>;
  const merged = { ...previous, ...incoming };
  const publishing = incoming._status === "published";
  const current = text(merged.slug);
  const needsTitle = !text(merged.title);

  // The common autosave: a hand-written slug and a title already there — nothing to derive, nothing to look up.
  if (previous.id && !needsTitle && !publishing && current && !looksGenerated(current)) return data;
  // A live session's address is never moved here (see the header).
  if (latestIsLive(previous) && !needsTitle) return data;

  const experienceId = idOf(merged.experience);
  if (!experienceId) return data;
  const experience = (await req.payload
    .findByID({ collection: "experiences", id: experienceId, depth: 0, overrideAccess: true, disableErrors: true, req })
    .catch(() => null)) as { slug?: unknown; name?: unknown } | null;
  if (!experience) return data;

  // Title: the experience's name until somebody writes one (§D.2 "title default experience name").
  if (needsTitle && text(experience.name)) incoming.title = String(experience.name).slice(0, 40);

  const experienceSlug = text(experience.slug);
  const startsAt = merged.startsAt;
  if (!experienceSlug || (typeof startsAt !== "string" && !(startsAt instanceof Date))) return data;

  // Never move a live address here (see the header).
  if (latestIsLive(previous)) return data;
  if (previous.id) {
    const live = await findLiveRow(req, "sessions", previous.id);
    if (isLive(live)) return data;
  }

  if (current && !looksGenerated(current)) {
    if (publishing && (await slugTaken(req, current, previous.id))) {
      throw duplicateError(req, "slug", `Another session already uses the address "${current}".`);
    }
    return data;
  }

  const base = sessionSlugFor(experienceSlug, startsAt, text(merged.startsAt_tz) ?? STUDIO_TIME_ZONE);
  if (!base) return data;

  if (!(await slugTaken(req, base, previous.id))) {
    incoming.slug = base;
    return data;
  }
  if (publishing) {
    throw duplicateError(req, "startsAt", "A session for this experience already exists on this date and time.");
  }
  for (let n = 2; n <= 20; n += 1) {
    const candidate = `${base}-${n}`;
    if (candidate === current || !(await slugTaken(req, candidate, previous.id))) {
      incoming.slug = candidate;
      return data;
    }
  }
  throw duplicateError(req, "startsAt", "A session for this experience already exists on this date and time.");
};
