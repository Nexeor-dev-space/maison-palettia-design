import type { CollectionConfig } from "payload";

import { Customers } from "./Customers";
import { InvoiceCounters } from "./InvoiceCounters";
import { InvoiceFiles } from "./InvoiceFiles";
import { Invoices } from "./Invoices";
import { Orders } from "./Orders";
import { PassPurchases } from "./PassPurchases";
import { PaymentEvents } from "./PaymentEvents";
import { Payments } from "./Payments";
import { PromoCodes } from "./PromoCodes";
import { Refunds } from "./Refunds";
import { SeatHolds } from "./SeatHolds";
import { Tickets } from "./Tickets";
import { Waitlist } from "./Waitlist";

export { Customers } from "./Customers";
export { INVOICE_KINDS, Invoices } from "./Invoices";
export { InvoiceCounters } from "./InvoiceCounters";
export { INVOICE_FILES_DIR, InvoiceFiles } from "./InvoiceFiles";
export { CHANNELS, DESK_METHODS, LINE_KINDS, ORDER_STATUSES, Orders, REVIEW_REASONS } from "./Orders";
export { PASS_PURCHASE_STATUSES, PassPurchases } from "./PassPurchases";
export { PaymentEvents } from "./PaymentEvents";
export { PAYMENT_METHOD_TYPES, PAYMENT_PROVIDERS, PAYMENT_STATUSES, Payments } from "./Payments";
export { PROMO_APPLIES_TO, PROMO_TYPES, PromoCodes } from "./PromoCodes";
export { REFUND_REASONS, REFUND_STATUSES, Refunds } from "./Refunds";
export { SEAT_HOLD_STATUSES, SeatHolds } from "./SeatHolds";
export { BOOKINGS_GROUP, MODE_OPTIONS, STAFF_ROLES } from "./shared";
export { CHECK_IN_DEVICES, TICKET_STATUSES, Tickets } from "./Tickets";
export { WAITLIST_STATUSES, Waitlist } from "./Waitlist";

/**
 * Group "Bookings": the thirteen commerce collections of SPEC §D.3, field
 * definitions by 3A-0; access rules, hooks and admin actions are layered on
 * by 3A-1 (orders, inventory, pricing), 3B (payments), 3C (invoices, PDFs)
 * and 3E (tickets, check-in). `payload.config.ts` spreads this array, so
 * adding a collection never touches the config file.
 *
 * Order matters only for the sidebar: the things staff open daily first.
 */
export const commerceCollections: CollectionConfig[] = [
  Orders,
  Customers,
  Tickets,
  Refunds,
  Invoices,
  PassPurchases,
  PromoCodes,
  Waitlist,
  Payments,
  PaymentEvents,
  SeatHolds,
  InvoiceFiles,
  InvoiceCounters,
];
