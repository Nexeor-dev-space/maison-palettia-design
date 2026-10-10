import type { CollectionConfig } from "payload";

import { Enquiries } from "./Enquiries";

export { ENQUIRY_SOURCES, ENQUIRY_STATUSES, Enquiries, INBOX_GROUP } from "./Enquiries";

/**
 * Group "Inbox": enquiries from the two public forms (SPEC §D.4). Field
 * definitions by 3A-0; 3G adds the endpoint, the Reply-by-email panel and
 * the notification hook. `payload.config.ts` spreads this array, so adding
 * a collection never touches the config file.
 */
export const inboxCollections: CollectionConfig[] = [Enquiries];
