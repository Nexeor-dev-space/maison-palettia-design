import type { CollectionConfig } from "payload";

import { EmailTemplates } from "./EmailTemplates";
import { NotificationLog } from "./NotificationLog";

export { EMAILS_GROUP, EmailTemplates, TEMPLATE_KEYS } from "./EmailTemplates";
export { NOTIFICATION_PROVIDERS, NOTIFICATION_STATUSES, NotificationLog } from "./NotificationLog";

/**
 * Group "Emails": the templates editors word and the log of what was sent
 * (SPEC §D.5). Field definitions by 3A-0; the preview and variables panels,
 * the Resend button and the hooks by 3C. `payload.config.ts`
 * spreads this array, so adding a collection never touches the config file.
 */
export const commsCollections: CollectionConfig[] = [EmailTemplates, NotificationLog];
