import type { DisabledGateway, PaymentGateway, RedactedWebhook } from "../contracts";

/**
 * ==========================================================================
 * Mamo Pay — the shapes, the constants and the one error class
 * ==========================================================================
 *
 * The object shapes themselves (`MamoPayment`, `MamoLink`, `CreateLinkInput`,
 * `RedactedWebhook`, `PaymentGateway`) are the cross-agent contract and live
 * in cms/lib/contracts.ts (SPEC §O); they are re-exported here so code
 * inside cms/lib/mamo imports one path. This file holds what only the
 * gateway needs: the base URLs, the event list we subscribe to, the raw
 * webhook shape Mamo returns, and `MamoApiError`.
 *
 * Every fact below is from docs/cms/research/02-mamo-pay-api.md, which
 * carries the documentation URL for each. Anything that document marks
 * UNVERIFIED is NOT here — it lives in ./verify.ts behind a TODO(mamo-verify)
 * constant, so a correction after sandbox onboarding is a one-line change.
 *
 * NO RUNTIME IMPORT FROM contracts.ts. contracts.ts re-exports this module's
 * runtime values (`MamoApiError`) and the factory in ./index.ts; importing
 * anything but types from it here would make a module cycle whose order of
 * evaluation decides whether a class exists yet. Types are erased, so the
 * `import type` above is free.
 */

export type {
  CreateLinkInput,
  DisabledGateway,
  MamoLink,
  MamoPayment,
  Mode,
  PaymentGateway,
  RedactedWebhook,
} from "../contracts";

/** Research 02 §A1 — https://mamopay.readme.io/reference/get_ (OpenAPI `servers`). */
export const MAMO_BASE_URLS = {
  test: "https://sandbox.dev.business.mamopay.com/manage_api/v1",
  live: "https://business.mamopay.com/manage_api/v1",
} as const;

/**
 * What Register/Update webhook subscribes to (SPEC §H.5): the six payment
 * events that move an order or a refund, and every `dispute.*` so a
 * chargeback reaches the order. Names are the 2026-08 `payment.*` set, not
 * the legacy `charge.*` aliases (research 02 §A5, changelog).
 */
export const MAMO_WEBHOOK_EVENTS = [
  "payment.succeeded",
  "payment.failed",
  "payment.refund_initiated",
  "payment.refunded",
  "payment.refund_failed",
  "payment.voided",
  "dispute.received",
  "dispute.evidence_submitted",
  "dispute.expired",
  "dispute.closed",
  "dispute.won",
  "dispute.lost",
] as const;

/** `POST /webhooks` limits `auth_header` to 1–50 characters (research 02 §A5); 40 URL-safe characters fit with room. */
export const WEBHOOK_SECRET_LENGTH = 40;

/** How long the previous webhook secret keeps verifying after a rotation or re-registration (SPEC §C.3). */
export const WEBHOOK_SECRET_GRACE_MS = 10 * 60_000;

/** A webhook exactly as Mamo returns it — `auth_header` IN CLEAR. Never stored or displayed; see `redactWebhook`. */
export interface MamoWebhookRaw {
  id: string;
  url: string;
  enabled_events?: string[] | null;
  auth_header?: string | null;
}

/**
 * Mamo echoes the webhook's `auth_header` back on every read (research 02
 * §A5). Everything that leaves the client — the List webhooks table, the
 * stored `lastConnectionCheck`, an endpoint response — goes through this, so
 * the secret only ever exists in the encrypted settings column.
 */
export function redactWebhook(webhook: MamoWebhookRaw): RedactedWebhook {
  return {
    id: String(webhook.id),
    url: String(webhook.url ?? ""),
    enabled_events: Array.isArray(webhook.enabled_events) ? webhook.enabled_events.map(String) : [],
    auth_header: webhook.auth_header ? "[set]" : null,
  };
}

/** Narrows the factory's result; `getPaymentGateway` returns one or the other, never throws for "not set up". */
export function isDisabled(gateway: PaymentGateway | DisabledGateway): gateway is DisabledGateway {
  return gateway.isConfigured === false;
}

/**
 * An error from Mamo's API, carrying only what the response envelope said:
 * HTTP status, `error_code`, `messages[]` and the per-field `errors` map
 * (research 02 §A10). It deliberately has no room for the request — not the
 * URL's query, not the headers (the Bearer key), not the body (customer
 * details) — so logging one, returning its message to the admin, or storing
 * it on a payment row can never leak a secret (SPEC §H.4).
 *
 * `status: 0` is ours: the request never got an HTTP answer (timeout, DNS,
 * connection refused), with `errorCode` "TIMEOUT" or "NETWORK".
 */
export class MamoApiError extends Error {
  constructor(
    public status: number,
    public errorCode: string | undefined,
    public messages: string[],
    public errors?: Record<string, string[]>,
  ) {
    super(messages.join("; ") || `Mamo API ${status}`);
    this.name = "MamoApiError";
  }
}
