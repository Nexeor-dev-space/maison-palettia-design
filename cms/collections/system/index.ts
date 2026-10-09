import type { CollectionConfig } from "payload";

import { Media } from "./Media";
import { SettingsAudit } from "./SettingsAudit";
import { Users } from "./Users";

export { Media, MEDIA_TAGS } from "./Media";
export { SettingsAudit } from "./SettingsAudit";
export { Users } from "./Users";

/** Group "System" (+ media under "Content"): the collections every phase relies on (SPEC §D.1). */
export const systemCollections: CollectionConfig[] = [Users, Media, SettingsAudit];
