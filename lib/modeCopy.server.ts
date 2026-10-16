import { cache } from "react";

import { getGlobal } from "@/lib/cms/query";
import { mergeModeCopy, type ModeCopy, type StoredModeCopy } from "@/lib/modeCopy";

/**
 * The walk-in / scheduled wording from Booking & checkout wording (lib/modeCopy.ts),
 * cached under `global:booking-settings` and draft-aware. Saving the global
 * purges that tag and the layout (cms/globals/settingsHooks.ts), so a change
 * shows on the next visit. The in-file defaults answer when the CMS cannot.
 *
 * `React.cache`d: the layout, the block adapters and the templates all ask in one
 * request, and they get one merge.
 *
 * SERVER ONLY — client components read the same value through `useModeCopy()`.
 */
export const getModeCopy = cache(async (): Promise<ModeCopy> => {
  const settings = await getGlobal("booking-settings", 0);
  return mergeModeCopy(settings as StoredModeCopy | null);
});
