import type { Payload, PayloadRequest } from "payload";

import type { PaymentSetting } from "@/payload-types";

import { envPublicUrl, isProduction, publicUrl } from "../publicUrl";
import { MamoClient } from "./client";
import { MockMamoClient, mockWebhookSecret } from "./mock";
import type { DisabledGateway, Mode, PaymentGateway } from "./types";
import type { WebhookSecret } from "./verify";

export { MamoClient } from "./client";
export { MockMamoClient, mockWebhookSecret } from "./mock";
export * from "./types";

/**
 * ==========================================================================
 * getPaymentGateway — settings in, a gateway (or a reason) out
 * ==========================================================================
 *
 * SPEC §H.4. Nothing about payments lives in `.env`: the mode, both sets of
 * keys and the webhook secrets are in Settings → Payments, so every call
 * that needs Mamo asks this factory, which reads the global afresh. There is
 * deliberately no cached client — building a `MamoClient` is two property
 * assignments, and not caching means an admin who pastes a key, saves and
 * presses Pay gets the new key on the very next request with nothing to
 * invalidate (the "drop cached clients" `afterChange` the SPEC lists for
 * this global has nothing to drop).
 *
 * THE DECISION TABLE:
 *
 *   mode      key for mode   NODE_ENV       → gateway
 *   ───────   ────────────   ────────────   ─────────────────────────────
 *   mock      —              development    MockMamoClient
 *   mock      —              production     disabled("mock_in_production")
 *   test|live set            any            MamoClient(mode, key)
 *   test|live not set        development    MockMamoClient   (no keys yet: the whole flow still runs)
 *   test|live not set        production     disabled("no_<mode>_key")
 *   test|live unreadable     production     disabled("<mode>_key_unreadable")  (PAYLOAD_SECRET changed)
 *
 * A disabled gateway is a value, not an exception: checkout answers 503
 * `gateway_disabled`, the admin shows why, and nothing is ever mocked in
 * production.
 *
 * READING SECRETS. The global is read with `context.internalRead`, the only
 * way `encryptedText` returns clear text (cms/fields/encryptedText.ts), and
 * WITHOUT passing the caller's `req`: Payload's `createLocalReq` merges a
 * given `context` into the request it is handed (utilities/createLocalReq.js,
 * verified 3.90.2), so passing both would leave `internalRead: true` on the
 * caller's request — and every later read in that request (a REST response
 * included) would return keys in clear. A fresh local request keeps the flag
 * on this one read. Settings are never written inside a checkout
 * transaction, so reading outside it loses nothing.
 */

export const PAYMENT_SETTINGS_SLUG = "payment-settings" as const;

/** The payment-settings document with secrets IN CLEAR. Server-only; never return it from a handler. */
export async function readPaymentSettings(payload: Payload): Promise<PaymentSetting> {
  return (await payload.findGlobal({
    slug: PAYMENT_SETTINGS_SLUG,
    depth: 0,
    overrideAccess: true,
    context: { internalRead: true },
  })) as PaymentSetting;
}

const disabled = (reason: string): DisabledGateway => ({ isConfigured: false, reason });

/** Where the mock's hosted page and webhook poster live: the site address, else the `.env` origin. */
async function mockBaseUrl(req: PayloadRequest): Promise<string> {
  return (await publicUrl(req).catch(() => "")) || envPublicUrl() || "http://localhost:3200";
}

/** The mock gateway, or why it cannot be had (production). */
export async function mockGateway(req: PayloadRequest): Promise<PaymentGateway | DisabledGateway> {
  if (isProduction()) return disabled("mock_in_production");
  return new MockMamoClient({ baseUrl: await mockBaseUrl(req) });
}

export async function getPaymentGateway(
  req: PayloadRequest,
  opts?: { forceMode?: "test" | "live" },
): Promise<PaymentGateway | DisabledGateway> {
  const settings = await readPaymentSettings(req.payload);
  const mode: Mode = opts?.forceMode ?? settings.mode ?? "test";
  if (mode === "mock") return mockGateway(req);

  const creds = settings[mode];
  const key = typeof creds?.apiKey === "string" ? creds.apiKey : "";
  if (key) return new MamoClient({ apiKey: key, mode });

  // A `…SetAt` date with no clear text means the value is stored but would
  // not decrypt — the "secret changed" case the dashboard banner explains.
  const unreadable = Boolean(creds?.apiKeySetAt);
  if (isProduction()) return disabled(unreadable ? `${mode}_key_unreadable` : `no_${mode}_key`);
  return mockGateway(req);
}

/**
 * The gateway an EXISTING order or payment must be talked to through: the
 * mode it was created in, whatever Settings says today (a sandbox order
 * after the switch to Live is still a sandbox order). `mock` rows outside
 * production get the mock; in production they get a disabled gateway and
 * are left for a human.
 */
export async function gatewayForMode(req: PayloadRequest, mode: Mode): Promise<PaymentGateway | DisabledGateway> {
  if (mode === "mock") return mockGateway(req);
  return getPaymentGateway(req, { forceMode: mode });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Webhook secrets                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Every secret the webhook receiver must try (SPEC §O): current test and
 * live, plus a previous one while its 10-minute grace lasts. Both modes are
 * always tried regardless of the active mode, because the matching secret
 * is how the receiver learns which environment sent the delivery.
 */
export async function webhookSecrets(req: PayloadRequest): Promise<Array<{ mode: "test" | "live"; value: string; previous: boolean }>> {
  const settings = await readPaymentSettings(req.payload);
  const now = Date.now();
  const out: Array<{ mode: "test" | "live"; value: string; previous: boolean }> = [];
  for (const mode of ["test", "live"] as const) {
    const creds = settings[mode];
    if (typeof creds?.webhookAuthHeader === "string" && creds.webhookAuthHeader) {
      out.push({ mode, value: creds.webhookAuthHeader, previous: false });
    }
    const until = creds?.previousValidUntil ? Date.parse(creds.previousValidUntil) : NaN;
    if (typeof creds?.previousWebhookAuthHeader === "string" && creds.previousWebhookAuthHeader && until > now) {
      out.push({ mode, value: creds.previousWebhookAuthHeader, previous: true });
    }
  }
  return out;
}

/** Everything the receiver tries: the stored secrets, plus the mock's outside production. */
export async function receiverSecrets(req: PayloadRequest): Promise<WebhookSecret[]> {
  const stored = await webhookSecrets(req);
  return isProduction() ? stored : [...stored, { mode: "mock", value: mockWebhookSecret(), previous: false }];
}
