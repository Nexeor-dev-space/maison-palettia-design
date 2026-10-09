import type { GlobalConfig } from "payload";

/**
 * ==========================================================================
 * The twelve settings globals, in the order the admin shows them (SPEC §C.3)
 * ==========================================================================
 *
 * The files are written by agent 1C (`cms/globals/!(index).ts`); this barrel
 * is 1A's and is the only thing `payload.config.ts` imports. Each file
 * exports a `GlobalConfig` named after the file. Six content globals that
 * editors may change, five admin-only settings pages, and the hidden
 * `system-state` that only server code reads.
 *
 * WHILE 1C IS STILL WRITING, a missing file is commented out HERE (never
 * stubbed in its own path, so 1C's file lands without a conflict) and the
 * final step of Phase 1 restores the line. Every import below that is
 * commented out is one 1C had not delivered when this barrel was last built.
 */

import { SiteSettings } from "./SiteSettings";
import { Navigation } from "./Navigation";
import { BrandCopy } from "./BrandCopy";
import { BookingSettings } from "./BookingSettings";
import { TemplateCopy } from "./TemplateCopy";
import { SeoDefaults } from "./SeoDefaults";
import { PaymentSettings } from "./PaymentSettings";
import { EmailSettings } from "./EmailSettings";
import { InvoiceSettings } from "./InvoiceSettings";
import { NotificationSettings } from "./NotificationSettings";
import { AnalyticsSettings } from "./AnalyticsSettings";
import { SystemState } from "./SystemState";

export const globals: GlobalConfig[] = [
  // Settings (editor + admin)
  SiteSettings,
  Navigation,
  BrandCopy,
  BookingSettings,
  TemplateCopy,
  SeoDefaults,
  // Settings (admin)
  PaymentSettings,
  EmailSettings,
  InvoiceSettings,
  NotificationSettings,
  AnalyticsSettings,
  // hidden
  SystemState,
];
