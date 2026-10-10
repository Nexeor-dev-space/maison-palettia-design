import { randomBytes } from "node:crypto";

import { APIError, type Endpoint, type PayloadRequest } from "payload";
import { z } from "zod";

import { MASK, sha256Hex } from "@/cms/lib/crypto";
import {
  getPaymentGateway,
  MAMO_WEBHOOK_EVENTS,
  MamoApiError,
  MamoClient,
  PAYMENT_SETTINGS_SLUG,
  readPaymentSettings,
  WEBHOOK_SECRET_GRACE_MS,
  WEBHOOK_SECRET_LENGTH,
  isDisabled,
  type RedactedWebhook,
} from "@/cms/lib/mamo/index";
import { isPlaceholderPublicUrl, publicUrl } from "@/cms/lib/publicUrl";
import { randomCode } from "@/cms/lib/reference";
import type { PaymentSetting } from "@/payload-types";

import { json, parseBody, requireRole } from "./requireRole";

/**
 * ==========================================================================
 * Settings → Payments action buttons (SPEC §C.3, §H.5, §J — admin only)
 * ==========================================================================
 *
 * Paths are relative to `/api/`. Every handler starts with `requireRole`
 * (which also refuses `Sec-Fetch-Site: cross-site`); bodies are zod.
 *
 *   POST /actions/payments/test-connection        { data?, mode? }       GET /me with the form's key (or the stored one)
 *   POST /actions/payments/register-webhook       { mode, confirm? }     preview the URL, then POST|PATCH /webhooks
 *   POST /actions/payments/rotate-webhook-secret  { mode, confirm? }     new secret + PATCH, old one valid 10 min
 *   POST /actions/payments/list-webhooks          { mode, data? }        GET /webhooks, auth header shown as [set]
 *   POST /actions/payments/test-order             {}                     AED 2 sandbox/mock link, no order
 *
 * WHICH KEY. Read-only checks (Test connection, List webhooks) use the
 * UNSAVED form value when the admin has typed one — so a key can be tried
 * before it is saved (§C.3) — and the stored key when the form shows the
 * mask. Actions that write state bound to a key (Register, Rotate) use only
 * the SAVED key, so the webhook can never be registered under one Mamo
 * account while the checkout uses another.
 *
 * WHAT COMES BACK. Never a key or a webhook secret: Mamo's webhook objects
 * pass through `redactWebhook`, `MamoApiError` carries only the envelope.
 * Each write also returns `fields` — `{ "test.webhookId": …, … }` — the
 * new values of the read-only fields it changed, so PaymentActions can put
 * them into the open form. Without that, the next Save of the page would
 * send the values the form loaded with and overwrite what the action just
 * stored (a null `webhookAuthHeader` in particular means "clear" to
 * `encryptedText`, which would delete the webhook secret).
 */

const MODES = ["test", "live"] as const;
type LiveMode = (typeof MODES)[number];
const LABEL: Record<LiveMode, string> = { test: "Sandbox", live: "Live" };

const formData = z.record(z.string(), z.unknown()).optional();
const modeBody = z.object({ mode: z.enum(MODES), confirm: z.boolean().optional(), data: formData });
const testBody = z.object({ data: formData, mode: z.enum(MODES).optional() });

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

/** The form's value for `<mode>.apiKey`: a new key, "use the stored one", or "none". */
function formKey(data: Record<string, unknown> | undefined, mode: LiveMode): { kind: "typed"; value: string } | { kind: "stored" } | { kind: "none" } {
  if (!data) return { kind: "stored" };
  const group = data[mode] as Record<string, unknown> | undefined;
  if (!group || !("apiKey" in group)) return { kind: "stored" };
  const value = group.apiKey;
  if (value === MASK || value === undefined) return { kind: "stored" };
  if (typeof value === "string" && value.trim()) return { kind: "typed", value: value.trim() };
  return { kind: "none" };
}

function storedKey(settings: PaymentSetting, mode: LiveMode): string | null {
  const key = settings[mode]?.apiKey;
  return typeof key === "string" && key ? key : null;
}

/** The key a read-only check should use, or null with the reason. */
function keyFor(settings: PaymentSetting, data: Record<string, unknown> | undefined, mode: LiveMode): { key: string; source: "unsaved" | "saved" } | null {
  const fromForm = formKey(data, mode);
  if (fromForm.kind === "typed") return { key: fromForm.value, source: "unsaved" };
  if (fromForm.kind === "none") return null;
  const key = storedKey(settings, mode);
  return key ? { key, source: "saved" } : null;
}

/** A short, one-way fingerprint so a check result can be tied to the key it tested without storing the key. */
const fingerprint = (key: string) => sha256Hex(`mamo-key:${key}`).slice(0, 12);

function mamoMessage(error: unknown): string {
  if (error instanceof MamoApiError) {
    if (error.status === 401 || error.status === 403) return "Mamo rejected the key (Unauthorized). Check it is the key for this environment.";
    if (error.status === 0) return error.messages[0] ?? "Could not reach Mamo Pay.";
    return `Mamo answered ${error.status}${error.errorCode ? ` ${error.errorCode}` : ""}: ${error.messages.join("; ")}`;
  }
  return error instanceof Error ? error.message : "Unexpected error.";
}

/** A 40-character URL-safe secret — within Mamo's 1–50 limit for `auth_header`. */
const mintSecret = () => randomBytes(30).toString("base64url").slice(0, WEBHOOK_SECRET_LENGTH);

async function webhookTarget(req: PayloadRequest): Promise<string> {
  if (await isPlaceholderPublicUrl(req)) {
    throw new APIError("Set the real site address in Settings → Site details → Advanced first.", 400, undefined, true);
  }
  return `${await publicUrl(req)}/api/site/webhooks/mamo`;
}

/**
 * The masked, current values of one credentials group — what the open form
 * should now hold. Read back after the write so the `…SetAt` stamps the
 * encryptedText hook wrote are included.
 */
async function fieldsFor(req: PayloadRequest, mode: LiveMode, names: string[]): Promise<Record<string, unknown>> {
  const doc = (await req.payload.findGlobal({ slug: PAYMENT_SETTINGS_SLUG, depth: 0, overrideAccess: true })) as PaymentSetting;
  const group = (doc[mode] ?? {}) as Record<string, unknown>;
  return Object.fromEntries(names.map((name) => [`${mode}.${name}`, group[name] ?? null]));
}

const SECRET_FIELDS = [
  "webhookAuthHeader",
  "webhookAuthHeaderSetAt",
  "previousWebhookAuthHeader",
  "previousWebhookAuthHeaderSetAt",
  "previousValidUntil",
];

async function storeCredentials(req: PayloadRequest, mode: LiveMode, patch: Record<string, unknown>): Promise<void> {
  await req.payload.updateGlobal({
    slug: PAYMENT_SETTINGS_SLUG,
    data: { [mode]: patch },
    depth: 0,
    overrideAccess: true,
    req,
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Handlers                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

async function testConnection(req: PayloadRequest): Promise<Response> {
  requireRole(req, ["admin"]);
  const { data, mode } = await parseBody(req, testBody);
  const settings = await readPaymentSettings(req.payload);
  const formMode = typeof data?.mode === "string" ? data.mode : settings.mode;

  const modes = mode ? [mode] : MODES.filter((m) => keyFor(settings, data, m));
  if (!modes.length) {
    if (formMode === "mock") return json({ ok: true, message: "Mock mode needs no key: the built-in fake gateway is always connected." });
    return json({ ok: false, message: "Paste a Sandbox or Live API key first (Mamo Dashboard → Developer → Keys)." });
  }

  const results: Record<string, { ok: boolean; message: string }> = {};
  const fields: Record<string, unknown> = {};
  for (const m of modes) {
    const key = keyFor(settings, data, m);
    let check: { ok: boolean; at: string; message: string; businessName?: string; keyFingerprint?: string; keySource?: string };
    if (!key) {
      check = { ok: false, at: new Date().toISOString(), message: `No ${LABEL[m]} key entered.` };
    } else {
      try {
        const me = await new MamoClient({ apiKey: key.key, mode: m }).me();
        check = {
          ok: true,
          at: new Date().toISOString(),
          message: `Connected to ${me.business_name || "Mamo"} (${LABEL[m]}).`,
          businessName: me.business_name,
          keyFingerprint: fingerprint(key.key),
          keySource: key.source,
        };
      } catch (error) {
        check = { ok: false, at: new Date().toISOString(), message: mamoMessage(error), keyFingerprint: fingerprint(key.key), keySource: key.source };
      }
    }
    // `lastConnectionCheck` is what "Bookings open" and "Mode → Live" test
    // (cms/globals/settingsHooks.ts `gatewayReadiness`). Stored for an unsaved
    // key too: the key and this result are saved together by the next Save,
    // which is the §C.3 "a key pasted and verified in the same session counts".
    await storeCredentials(req, m, { lastConnectionCheck: check });
    fields[`${m}.lastConnectionCheck`] = check;
    results[m] = { ok: check.ok, message: check.message };
  }

  const ok = Object.values(results).every((r) => r.ok);
  const message = modes.map((m) => results[m].message).join(" ");
  const unsaved = modes.some((m) => keyFor(settings, data, m)?.source === "unsaved");
  return json({ ok, message: unsaved && ok ? `${message} Save the page to keep the key.` : message, results, fields });
}

async function registerWebhook(req: PayloadRequest): Promise<Response> {
  requireRole(req, ["admin"]);
  const { mode, confirm } = await parseBody(req, modeBody);
  const url = await webhookTarget(req);
  const settings = await readPaymentSettings(req.payload);
  const key = storedKey(settings, mode);
  if (!key) throw new APIError(`Save the ${LABEL[mode]} API key first, then Test connection.`, 400, undefined, true);
  const creds = settings[mode] ?? {};

  // Step one of the dialog: show the exact URL before anything changes.
  if (!confirm) {
    return json({ ok: true, preview: true, url, action: creds.webhookId ? "update" : "create", message: `Mamo will send ${LABEL[mode]} payment events to ${url}` });
  }

  const client = new MamoClient({ apiKey: key, mode });
  const secret = mintSecret();
  const events = [...MAMO_WEBHOOK_EVENTS];
  let webhook: RedactedWebhook | null = null;
  try {
    if (creds.webhookId) {
      webhook = await client
        .updateWebhook(creds.webhookId, { url, enabled_events: events, auth_header: secret })
        .catch((error: unknown) => {
          if (error instanceof MamoApiError && error.status === 404) return null; // deleted on Mamo's side: create anew
          throw error;
        });
    }
    if (!webhook) {
      // Re-use a registration pointing at the same URL rather than adding a
      // second one that would deliver every event twice.
      const existing = (await client.listWebhooks()).find((w) => w.url === url);
      webhook = existing
        ? await client.updateWebhook(existing.id, { url, enabled_events: events, auth_header: secret })
        : await client.createWebhook(url, events, secret);
    }
  } catch (error) {
    throw new APIError(mamoMessage(error), 502, undefined, true);
  }

  // Mamo now sends the new secret. Store it, and keep the old one verifying
  // for ten minutes for deliveries already in flight.
  const previous = typeof creds.webhookAuthHeader === "string" && creds.webhookAuthHeader ? creds.webhookAuthHeader : null;
  try {
    await storeCredentials(req, mode, {
      webhookAuthHeader: secret,
      previousWebhookAuthHeader: previous,
      previousValidUntil: previous ? new Date(Date.now() + WEBHOOK_SECRET_GRACE_MS).toISOString() : null,
      webhookId: webhook.id,
      webhookUrl: webhook.url || url,
      webhookRegisteredAt: new Date().toISOString(),
    });
  } catch {
    throw new APIError(
      "Mamo accepted the webhook but saving its secret failed, so deliveries will not verify. Press Register/Update webhook again.",
      500,
      undefined,
      true,
    );
  }

  return json({
    ok: true,
    message: `Webhook ${creds.webhookId ? "updated" : "registered"}: ${LABEL[mode]} events now go to ${url}.`,
    webhook,
    fields: await fieldsFor(req, mode, ["webhookId", "webhookUrl", "webhookRegisteredAt", ...SECRET_FIELDS]),
  });
}

async function rotateWebhookSecret(req: PayloadRequest): Promise<Response> {
  requireRole(req, ["admin"]);
  const { mode, confirm } = await parseBody(req, modeBody);
  const settings = await readPaymentSettings(req.payload);
  const key = storedKey(settings, mode);
  const creds = settings[mode] ?? {};
  if (!key || !creds.webhookId) {
    throw new APIError(`Register the ${LABEL[mode]} webhook first.`, 400, undefined, true);
  }
  if (!confirm) {
    return json({ ok: true, preview: true, message: `A new ${LABEL[mode]} secret will be sent to Mamo; the current one keeps working for 10 minutes.` });
  }

  const secret = mintSecret();
  try {
    await new MamoClient({ apiKey: key, mode }).updateWebhook(creds.webhookId, { auth_header: secret });
  } catch (error) {
    if (error instanceof MamoApiError && error.status === 404) {
      throw new APIError("Mamo no longer has this webhook. Use Register/Update webhook instead.", 409, undefined, true);
    }
    throw new APIError(mamoMessage(error), 502, undefined, true);
  }
  const previous = typeof creds.webhookAuthHeader === "string" && creds.webhookAuthHeader ? creds.webhookAuthHeader : null;
  await storeCredentials(req, mode, {
    webhookAuthHeader: secret,
    previousWebhookAuthHeader: previous,
    previousValidUntil: previous ? new Date(Date.now() + WEBHOOK_SECRET_GRACE_MS).toISOString() : null,
  });
  return json({
    ok: true,
    message: `${LABEL[mode]} webhook secret rotated. The previous one is accepted for 10 more minutes.`,
    fields: await fieldsFor(req, mode, SECRET_FIELDS),
  });
}

async function listWebhooks(req: PayloadRequest): Promise<Response> {
  requireRole(req, ["admin"]);
  const { mode, data } = await parseBody(req, modeBody);
  const settings = await readPaymentSettings(req.payload);
  const key = keyFor(settings, data, mode);
  if (!key) throw new APIError(`Paste or save the ${LABEL[mode]} API key first.`, 400, undefined, true);

  let webhooks: RedactedWebhook[];
  try {
    webhooks = await new MamoClient({ apiKey: key.key, mode }).listWebhooks();
  } catch (error) {
    throw new APIError(mamoMessage(error), 502, undefined, true);
  }
  const base = await publicUrl(req);
  const ourId = settings[mode]?.webhookId ?? null;
  return json({
    ok: true,
    message: webhooks.length ? `${webhooks.length} webhook(s) registered in ${LABEL[mode]}.` : `No webhooks registered in ${LABEL[mode]}.`,
    expectedUrl: base ? `${base}/api/site/webhooks/mamo` : null,
    webhooks: webhooks.map((w) => ({
      ...w,
      ours: w.id === ourId,
      // The dashboard's "Webhook points at an old address" check, per row.
      current: Boolean(base) && w.url.startsWith(base),
    })),
  });
}

async function testOrder(req: PayloadRequest): Promise<Response> {
  requireRole(req, ["admin"]);
  const settings = await readPaymentSettings(req.payload);
  if (settings.mode === "live") {
    throw new APIError("Test orders are for the sandbox. Switch Mode to Test (or place a real AED 2 order and refund it).", 400, undefined, true);
  }
  const gateway = await getPaymentGateway(req);
  if (isDisabled(gateway)) throw new APIError(`Payments are not available: ${gateway.reason}.`, 400, undefined, true);

  const base = await publicUrl(req);
  const back = `${base}/admin/globals/${PAYMENT_SETTINGS_SLUG}`;
  const prefix = (settings.checkout?.titlePrefix ?? "Maison Palettia").trim() || "Maison Palettia";
  try {
    // No order: this proves keys, the hosted page and webhook delivery. The
    // receiver recognises `custom_data.kind` and closes the event without
    // looking for an order (cms/lib/mamo/webhook.ts).
    const link = await gateway.createLink({
      title: `${prefix} · Connection test`.slice(0, 50),
      amount: 2,
      amount_currency: "AED",
      return_url: `${back}?testPayment=paid`,
      failure_return_url: `${back}?testPayment=failed`,
      external_id: `TEST-${randomCode(6)}`,
      custom_data: { kind: "connection_test", mode: gateway.mode, by: String(req.user.id) },
      capacity: 1,
      payment_methods: settings.checkout?.paymentMethods?.length ? [...settings.checkout.paymentMethods] : ["card", "wallet"],
      link_type: "standalone",
    });
    return json({
      ok: true,
      paymentUrl: link.payment_url,
      message:
        gateway.mode === "mock"
          ? "Mock test payment created. Pay on the mock page, then check Bookings → Payment events."
          : "Sandbox AED 2 payment created. Pay with 4242 4242 4242 4242, 01/28, CVV 123 (3DS: Checkout1!), then check Bookings → Payment events for a verified delivery.",
    });
  } catch (error) {
    throw new APIError(mamoMessage(error), 502, undefined, true);
  }
}

export const settingsPaymentsEndpoints: Endpoint[] = [
  { path: "/actions/payments/test-connection", method: "post", handler: testConnection },
  { path: "/actions/payments/register-webhook", method: "post", handler: registerWebhook },
  { path: "/actions/payments/rotate-webhook-secret", method: "post", handler: rotateWebhookSecret },
  { path: "/actions/payments/list-webhooks", method: "post", handler: listWebhooks },
  { path: "/actions/payments/test-order", method: "post", handler: testOrder },
];
