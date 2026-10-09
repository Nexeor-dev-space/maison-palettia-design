import type { Payload } from "payload";

import { mediaId, type MediaIds } from "./media";
import { BOOKING_SETTINGS, BOOKING_TERMS_PAID, BOOKING_TERMS_TODAY } from "./strings/booking";
import { BRAND_COPY } from "./strings/brand";
import { NAVIGATION } from "./strings/navigation";
import { PRIVATE_EVENT_STEPS } from "./strings/programmes";
import { BRAND_SHARED, LITTLE_CREATOR_IMAGES, SEASONAL_IMAGES, SEO_DEFAULTS, SITE_SETTINGS } from "./strings/site";
import { TEMPLATE_COPY } from "./strings/templates";
import { describeError, upsertGlobal, type Tally } from "./upsert";

/**
 * ==========================================================================
 * Globals (SPEC §F.6) — the site-wide words and settings
 * ==========================================================================
 *
 * Every global already exists by the time this runs: `onInit`
 * (cms/seed/defaults.ts, SPEC §F.0) creates each one from its field
 * defaults on the first boot, which is also how the five admin-only globals
 * get their safe starting state (payments in test mode, email log-only,
 * invoice details from the legal name, notifications empty, analytics on
 * with consent required). Those five are deliberately NOT written here —
 * "defaults only" — so a re-run can never undo a key an admin has entered.
 *
 * The six content globals are written from cms/seed/strings/*, each value
 * with its `file:line`. Only the fields the seed owns are sent; Payload
 * merges a global update into the stored row, so anything else (an admin's
 * public URL, a field added later) is left alone.
 */

export interface GlobalsOptions {
  /** `launch` mode: the booking terms for paid bookings (SPEC §F.6) instead of today's request sentence. */
  launchTerms: boolean;
  missingOnly: boolean;
}

export async function seedGlobals(
  payload: Payload,
  tally: Tally,
  media: MediaIds,
  options: GlobalsOptions,
  log: (line: string) => void,
): Promise<void> {
  const upsert = { missingOnly: options.missingOnly };

  // One global refusing its data (a validation rule tighter than today's
  // site) must not stop the others: each is saved on its own, and a refusal
  // is reported with Payload's own message and counted as "failed".
  const save = async (slug: Parameters<typeof upsertGlobal>[2], data: Record<string, unknown>) => {
    try {
      await upsertGlobal(payload, tally, slug, data, upsert);
    } catch (error) {
      tally.add(`global:${slug}`, "failed");
      log(`seed: global ${slug} was not saved — ${describeError(error)}`);
    }
  };

  await save(
    "site-settings",
    {
      ...SITE_SETTINGS,
      logoOnDark: mediaId(media, SITE_SETTINGS.logoOnDark),
      logoOnLight: mediaId(media, SITE_SETTINGS.logoOnLight),
      monogram: mediaId(media, SITE_SETTINGS.monogram),
    },
  );

  await save("navigation", NAVIGATION);

  await save(
    "brand-copy",
    {
      ...BRAND_COPY,
      ...BRAND_SHARED,
      privateEventSteps: PRIVATE_EVENT_STEPS,
      seasonalMoments: BRAND_COPY.seasonalMoments.map((moment, i) => ({
        ...moment,
        image: mediaId(media, SEASONAL_IMAGES[i]),
      })),
      littleCreators: BRAND_COPY.littleCreators.map((creator, i) => ({
        ...creator,
        image: mediaId(media, LITTLE_CREATOR_IMAGES[i]),
      })),
    },
  );

  await save("booking-settings", {
    ...BOOKING_SETTINGS,
    bookingTerms: options.launchTerms ? BOOKING_TERMS_PAID : BOOKING_TERMS_TODAY,
  });

  await save("template-copy", TEMPLATE_COPY);

  await save("seo-defaults", SEO_DEFAULTS);
}
