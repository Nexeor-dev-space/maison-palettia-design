import type { Payload } from "payload";

import { mediaId, type MediaIds } from "./media";
import { AGE_GUIDANCE, EXPERIENCES } from "./strings/experiences";
import { FAQS } from "./strings/faqs";
import { PASSES } from "./strings/passes";
import { POLICIES } from "./strings/policies";
import { PROGRAMMES } from "./strings/programmes";
import { SESSIONS } from "./strings/sessions";
import { CURRENT_VENUES, PAST_DESTINATIONS } from "./strings/venues";
import { VIBES } from "./strings/vibes";
import { lexicalParagraphs, SEED_CONTEXT, upsertDoc, type Tally } from "./upsert";

/**
 * ==========================================================================
 * Collections (SPEC §F.2–F.5) — lib/*.ts data into the content collections
 * ==========================================================================
 *
 * Order matters only where one document points at another: venues and
 * experiences before sessions (a session names both), programmes before the
 * home page's "Ways to take part" doors (cms/seed/pages.ts). Everything is
 * keyed by `slug`, except FAQs (by `question` — they have no slug).
 *
 * PLACEHOLDERS. The two sessions and the three passes are design-phase
 * stand-ins (invented dates, prices and seats). SPEC §F.4/§F.5 saves them as
 * drafts; the default run publishes them instead, so the site reads exactly
 * as it does today (the Phase 2 parity gate — /events, the home page's
 * "next date" and /loyalty all print them). `launch` mode (see index.ts)
 * applies the SPEC as written. Either way each session carries an internal
 * note saying its date is a placeholder.
 */

export interface ContentOptions {
  /** `launch` mode: placeholder sessions and passes saved as drafts (SPEC §F.4–F.5). */
  placeholdersAsDrafts: boolean;
  missingOnly: boolean;
}

export interface ContentIds {
  venues: Map<string, number | string>;
  experiences: Map<string, number | string>;
  programmes: Map<string, number | string>;
  sessions: Map<string, number | string>;
}

/** SPEC §F.4 — exactly this note, so staff can find every placeholder with one search. */
const PLACEHOLDER_NOTE = "Placeholder dates from the design phase — confirm before publishing";

/** lib/workshops.ts status → sessions.bookingStatus. There is no "fully booked" status: a full session is closed. */
const BOOKING_STATUS: Record<string, "open" | "waitlist" | "closed"> = {
  open: "open",
  waitlist: "waitlist",
  "fully-booked": "closed",
};

/** The Atelier Pass benefit SPEC §F.5 corrects in launch mode (pottery left the programme). */
const POTTERY_LEFTOVER = "Any strand: paint, shape or craft";
const POTTERY_FIX = "Any strand: paint, craft or create";

/**
 * `{experience}-{yyyy-mm-dd}-{HHmm}` in studio time — the session slug rule
 * (SPEC §D.2). Computed here so the seed's lookup key is the same slug the
 * `sessionSlug` hook would generate.
 */
export function sessionSlug(experienceSlug: string, startsAt: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(startsAt));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${experienceSlug}-${part("year")}-${part("month")}-${part("day")}-${part("hour")}${part("minute")}`;
}

export async function seedContent(
  payload: Payload,
  tally: Tally,
  media: MediaIds,
  options: ContentOptions,
  log: (line: string) => void,
): Promise<ContentIds> {
  const upsert = { missingOnly: options.missingOnly };
  const ids: ContentIds = { venues: new Map(), experiences: new Map(), programmes: new Map(), sessions: new Map() };

  /* ── vibes (lib/vibes.ts) ─────────────────────────────────────────────── */
  for (const vibe of VIBES) {
    await upsertDoc(payload, tally, "vibes", "slug", { ...vibe }, upsert);
  }

  /* ── venues (lib/partners.ts + lib/brand.ts PAST_DESTINATIONS) ────────── */
  for (const venue of CURRENT_VENUES) {
    ids.venues.set(venue.slug, await upsertDoc(payload, tally, "venues", "slug", { ...venue }, upsert));
  }
  for (const [i, name] of PAST_DESTINATIONS.entries()) {
    const slug = name
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    // The deck names the places and nothing else. `locality` and
    // `descriptor` are required, so they say exactly that much and no more:
    // the UAE (the deck's "across leading UAE destinations") and a line
    // that cannot be mistaken for an invitation to visit.
    ids.venues.set(
      slug,
      await upsertDoc(
        payload,
        tally,
        "venues",
        "slug",
        {
          name,
          slug,
          locality: "UAE",
          status: "past",
          descriptor: `A past Maison Palettia destination: ${name}.`,
          order: 100 + i,
        },
        upsert,
      ),
    );
  }

  /* ── experiences (lib/experiences.ts) ─────────────────────────────────── */
  for (const experience of EXPERIENCES) {
    const id = await upsertDoc(
      payload,
      tally,
      "experiences",
      "slug",
      {
        name: experience.name,
        slug: experience.slug,
        kind: experience.kind,
        description: experience.description,
        about: experience.about.map((paragraph) => ({ paragraph })),
        image: mediaId(media, experience.image),
        gallery: experience.gallery.map((p) => mediaId(media, p)),
        status: experience.status,
        ageGuidance: AGE_GUIDANCE[experience.slug],
        privateEventEligible: experience.privateEventEligible,
        order: experience.order,
      },
      upsert,
    );
    ids.experiences.set(experience.slug, id);
  }

  /* ── sessions (lib/workshops.ts) + their inventory rows ───────────────── */
  for (const session of SESSIONS) {
    const experience = ids.experiences.get(session.experience);
    if (experience === undefined) throw new Error(`seed: session ${session.title} names an unknown experience ${session.experience}`);
    const slug = sessionSlug(session.experience, session.startsAt);
    const id = await upsertDoc(
      payload,
      tally,
      "sessions",
      "slug",
      {
        experience,
        slug,
        title: session.title,
        category: session.category,
        startsAt: new Date(session.startsAt).toISOString(),
        startsAt_tz: "Asia/Dubai",
        durationMinutes: session.durationMinutes,
        venue: session.venue ? ids.venues.get(session.venue) : undefined,
        priceFils: session.priceFils,
        seatsTotal: session.seatsTotal,
        bookingStatus: BOOKING_STATUS[session.status] ?? "open",
        excerpt: session.excerpt,
        // The session's photograph is its activity's (the same file and alt
        // in lib/workshops.ts and lib/experiences.ts), so the override stays
        // empty and the page falls back to the experience's image.
        internalNotes: PLACEHOLDER_NOTE,
      },
      { ...upsert, draft: options.placeholdersAsDrafts },
    );
    ids.sessions.set(slug, id);
    await ensureInventoryRow(payload, tally, id);
  }

  /* ── programmes (lib/privateEvents.ts) ───────────────────────────────── */
  for (const programme of PROGRAMMES) {
    const id = await upsertDoc(
      payload,
      tally,
      "programmes",
      "slug",
      {
        name: programme.name,
        slug: programme.slug,
        description: programme.description,
        lead: programme.lead,
        image: mediaId(media, programme.image),
        mark: programme.mark,
        inPrivateEventsMenu: programme.inPrivateEventsMenu,
        tone: programme.tone,
        order: programme.order,
      },
      upsert,
    );
    ids.programmes.set(programme.slug, id);
  }

  /* ── policies (lib/policies.ts) ──────────────────────────────────────── */
  for (const policy of POLICIES) {
    await upsertDoc(payload, tally, "policies", "slug", { ...policy }, upsert);
  }

  /* ── FAQs (lib/constants.ts FAQ_GROUPS) ──────────────────────────────── */
  for (const faq of FAQS) {
    await upsertDoc(
      payload,
      tally,
      "faqs",
      "question",
      {
        question: faq.question,
        group: faq.group,
        answerSource: faq.answerSource,
        answer: faq.answer ? lexicalParagraphs([faq.answer]) : undefined,
        showOnHomepage: faq.showOnHomepage,
        order: faq.order,
      },
      upsert,
    );
  }

  /* ── passes (lib/passes.ts) ──────────────────────────────────────────── */
  for (const pass of PASSES) {
    const benefits = pass.benefits.map((line) =>
      options.placeholdersAsDrafts && line === POTTERY_LEFTOVER ? POTTERY_FIX : line,
    );
    await upsertDoc(
      payload,
      tally,
      "passes",
      "slug",
      {
        name: pass.name,
        slug: pass.slug,
        description: pass.description,
        priceFils: pass.priceFils,
        sessions: pass.sessions,
        validityDays: pass.validityDays,
        validityLabel: pass.validityLabel,
        benefits: benefits.map((line) => ({ line })),
        image: mediaId(media, pass.image),
        imageAlt: pass.imageAlt,
        // Not on sale until the studio sets real pass terms (PASSES_CONFIGURED = false today).
        sellable: false,
        order: pass.order,
      },
      { ...upsert, draft: options.placeholdersAsDrafts },
    );
  }

  // Testimonials: none. The two quotes in lib/testimonials.ts are invented
  // and marked MUST NOT SHIP (SPEC §F.5). Promo codes and redirects: none.
  log("content: testimonials, promo codes and redirects are intentionally not seeded.");

  return ids;
}

/**
 * The seat counters live on their own row (SPEC §D.2, `session-inventory`):
 * 0 sold, 0 held. The sessions collection's own afterChange creates it too
 * (2A-1); this only fills the gap when it has not, and never overwrites a
 * row — once tickets exist, the counters belong to cms/lib/inventory.ts.
 */
async function ensureInventoryRow(payload: Payload, tally: Tally, session: number | string): Promise<void> {
  const { totalDocs } = await payload.count({
    collection: "session-inventory",
    where: { session: { equals: session } },
    overrideAccess: true,
    context: { ...SEED_CONTEXT },
  });
  if (totalDocs > 0) {
    tally.add("session-inventory", "unchanged");
    return;
  }
  await payload.create({
    collection: "session-inventory",
    data: { session: String(session), seatsSold: 0, seatsHeld: 0 },
    depth: 0,
    overrideAccess: true,
    context: { ...SEED_CONTEXT },
  });
  tally.add("session-inventory", "created");
}
