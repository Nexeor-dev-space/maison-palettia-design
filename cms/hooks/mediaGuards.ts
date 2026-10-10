import {
  APIError,
  ValidationError,
  type CollectionAfterChangeHook,
  type CollectionAfterDeleteHook,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeValidateHook,
} from "payload";

import { describeMediaReferences, findMediaReferences } from "@/cms/lib/mediaReferences";

import { revalidateAllContent } from "./revalidate";

/**
 * ==========================================================================
 * Media guards — the rules that keep an upload honest and the site intact
 * ==========================================================================
 *
 * Four hooks on the media collection (SPEC §D.1):
 *
 *   · beforeValidate  alt text or "decorative", never neither. A photo with
 *                     no alt is an accessibility failure on every page it
 *                     appears on; a decorative texture with made-up alt is
 *                     noise for screen readers. The editor has to choose.
 *   · beforeDelete    refuse while anything references the file, with the
 *                     list of places (cms/lib/mediaReferences.ts). HTTP 409.
 *   · afterChange     a replaced file, a new alt, a moved focal point: the
 *                     URL or the markup of every page using it changed, so
 *                     purge everything (one cheap call) — update only, a
 *                     fresh upload is referenced by nothing yet.
 *   · afterDelete     same purge; the pages that used to show it must not
 *                     keep serving a 404 image from the cache.
 *
 * The provenance gate ("no AI imagery in hero slots") is deliberately NOT
 * here: a media hook cannot know which document will reference the file.
 * It lives on the content collections (`publishGate`, Phase 2A-1).
 */

export const requireAltOrDecorative: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  const incoming = (data ?? {}) as { alt?: unknown; decorative?: unknown };
  const existing = (originalDoc ?? {}) as { alt?: unknown; decorative?: unknown };
  const alt = String(incoming.alt ?? existing.alt ?? "").trim();
  const decorative = (incoming.decorative ?? existing.decorative) === true;
  if (!alt && !decorative) {
    throw new ValidationError(
      {
        collection: "media",
        errors: [
          {
            label: "Alt text",
            message: "Describe what is in the picture, or tick 'Decorative only' if it carries no meaning.",
            path: "alt",
          },
        ],
      },
      req.t,
    );
  }
  return data;
};

export const refuseDeleteWhileReferenced: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const refs = await findMediaReferences(req, String(id));
  if (refs.length > 0) {
    throw new APIError(describeMediaReferences(refs), 409, { references: refs }, true);
  }
};

/** The fields whose change alters what pages render. `sizes` and the focal point are compared by value. */
const WATCHED: Array<keyof WatchedDoc> = ["filename", "url", "alt", "decorative", "focalX", "focalY"];
type WatchedDoc = {
  filename?: unknown;
  url?: unknown;
  alt?: unknown;
  decorative?: unknown;
  focalX?: unknown;
  focalY?: unknown;
  sizes?: unknown;
};

export const revalidateOnMediaChange: CollectionAfterChangeHook = ({ doc, previousDoc, operation, req }) => {
  if (operation !== "update") return doc;
  if (req.context?.skipRevalidate === true || req.context?.disableRevalidate === true) return doc;
  const next = doc as WatchedDoc;
  const prev = (previousDoc ?? {}) as WatchedDoc;
  const changed =
    WATCHED.some((key) => next[key] !== prev[key]) || JSON.stringify(next.sizes ?? null) !== JSON.stringify(prev.sizes ?? null);
  if (changed) revalidateAllContent(req);
  return doc;
};

export const revalidateOnMediaDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (req.context?.skipRevalidate === true || req.context?.disableRevalidate === true) return doc;
  revalidateAllContent(req);
  return doc;
};
