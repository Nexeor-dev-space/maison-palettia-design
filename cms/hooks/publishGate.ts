import { ValidationError, type CollectionBeforeValidateHook, type PayloadRequest } from "payload";

import { hasGlobal } from "@/cms/lib/publicUrl";

/**
 * ==========================================================================
 * publishGate — what may not go live, even though it may be saved
 * ==========================================================================
 *
 * Two checks that only bite at the moment of PUBLISHING (`_status ===
 * "published"`); drafts save freely, so an editor can prepare a page with a
 * placeholder picture and fix it before it goes out (SPEC §D.2, §D.7, §I):
 *
 *   · IMAGERY PROVENANCE (`experiences`, `programmes`, `sessions`). The
 *     media library records where every picture came from. AI-generated or
 *     unknown-origin pictures may not be published in a hero or card slot
 *     unless Settings → Site details → Advanced → "Allow AI-generated
 *     imagery" is on. Stock passes (its licence note is optional). The rule
 *     lives here, not on media, because only the referencing document
 *     knows the picture is being used as a hero.
 *   · PERMISSION (`testimonials`). A quote is published only with written
 *     permission on file.
 *
 * The seed (§F) reproduces the site exactly as it stands, flagged pictures
 * included, and runs with `context.system`; the gate is about editors'
 * new choices and lets server code through. Everything else — REST, the
 * admin, scheduled publishing — is checked.
 */

export type ImageSlot = {
  /** Upload field name on the collection (`image`, `gallery`). */
  field: string;
  /** How the message names it: "The hero image", "A gallery photograph". */
  noun: string;
};

/** The blocked origins, labelled as the Media "Where it came from" select labels them. */
const BLOCKED: Record<string, string> = { "ai-generated": "“AI-generated”", unknown: "“Unknown”" };

const idsOf = (value: unknown): string[] => {
  const list = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  return list
    .map((item) => (item && typeof item === "object" && "id" in item ? (item as { id?: unknown }).id : item))
    .filter((id): id is string => typeof id === "string" && id.length > 0);
};

async function aiImageryAllowed(req: PayloadRequest): Promise<boolean> {
  if (!hasGlobal(req.payload, "site-settings")) return false;
  try {
    const settings = (await req.payload.findGlobal({
      slug: "site-settings",
      depth: 0,
      overrideAccess: true,
      req,
    })) as { allowAiImagery?: unknown };
    return settings?.allowAiImagery === true;
  } catch {
    return false;
  }
}

const publishing = (data: unknown) => (data as { _status?: unknown } | undefined)?._status === "published";

/** beforeValidate: refuse to publish with AI-generated or unknown-origin imagery in `slots`. */
export const imageryPublishGate =
  (slots: ImageSlot[]): CollectionBeforeValidateHook =>
  async ({ collection, data, originalDoc, req }) => {
    if (!data || !publishing(data) || req.context?.system === true) return data;

    const wanted = slots.flatMap((slot) => {
      const value = slot.field in data ? (data as Record<string, unknown>)[slot.field] : (originalDoc as Record<string, unknown> | undefined)?.[slot.field];
      return idsOf(value).map((id) => ({ slot, id }));
    });
    if (wanted.length === 0) return data;

    const { docs } = await req.payload.find({
      collection: "media",
      where: { id: { in: Array.from(new Set(wanted.map((entry) => entry.id))) } },
      depth: 0,
      limit: wanted.length,
      pagination: false,
      overrideAccess: true,
      req,
    });
    const media = new Map(docs.map((doc) => [String(doc.id), doc as { filename?: string | null; provenance?: string | null }]));

    const flagged = wanted.filter((entry) => BLOCKED[media.get(entry.id)?.provenance ?? ""]);
    if (flagged.length === 0 || (await aiImageryAllowed(req))) return data;

    const errors = flagged.map(({ slot, id }) => {
      const doc = media.get(id);
      return {
        path: slot.field,
        message: `${slot.noun} "${doc?.filename ?? id}" is marked ${BLOCKED[doc?.provenance ?? ""]}. Replace it, change its origin in Media, or allow AI imagery in Settings → Site details → Advanced.`,
      };
    });
    throw new ValidationError({ collection: collection.slug, errors }, req.t);
  };

/** beforeValidate on `testimonials`: no permission on file, no publishing. */
export const testimonialPermissionGate: CollectionBeforeValidateHook = async ({ collection, data, originalDoc, req }) => {
  if (!data || !publishing(data)) return data;
  const permission = "permissionOnFile" in data ? data.permissionOnFile : (originalDoc as { permissionOnFile?: unknown } | undefined)?.permissionOnFile;
  if (permission === true) return data;
  throw new ValidationError(
    {
      collection: collection.slug,
      errors: [
        {
          path: "permissionOnFile",
          message: "Tick “Written permission to publish” before publishing this quote. Without it the quote stays a draft.",
        },
      ],
    },
    req.t,
  );
};
