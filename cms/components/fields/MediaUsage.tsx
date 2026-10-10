import type { UIFieldServerComponent } from "payload";
import React from "react";

import { findMediaReferences } from "@/cms/lib/mediaReferences";

/**
 * ==========================================================================
 * MediaUsage — "Used on" in a photo's sidebar (4B review, SPEC §D.1)
 * ==========================================================================
 *
 * The owner used to learn where a photo appears only when a delete was
 * refused. This read-only panel lists the same places the delete guard
 * checks (cms/lib/mediaReferences.ts), each linking to the page or setting
 * to change, in the admin's own words ("Home page → Hero → Photograph —
 * desktop"). A `ui` field: no column, nothing to migrate. Server-rendered
 * when the document opens; an unsaved upload has nothing to list.
 */
export const MediaUsage: UIFieldServerComponent = async ({ id, req }) => {
  if (!id) return null;
  let refs: Awaited<ReturnType<typeof findMediaReferences>> = [];
  let failed = false;
  try {
    refs = await findMediaReferences(req, String(id));
  } catch {
    failed = true;
  }
  return (
    <div className="field-type mp-kv">
      <span className="mp-kv__label">Used on</span>
      {failed ? (
        <p className="mp-kv__empty">Could not check right now — reload to try again.</p>
      ) : refs.length ? (
        <ul className="mp-usage">
          {refs.map((ref) => (
            <li key={`${ref.collection}:${ref.id}:${ref.where}`}>{ref.href ? <a href={ref.href}>{ref.where}</a> : ref.where}</li>
          ))}
        </ul>
      ) : (
        <p className="mp-kv__empty">Not used anywhere yet — safe to delete.</p>
      )}
      <small className="mp-usage__note">Replacing the file updates every place at once.</small>
    </div>
  );
};
