import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

import { deriveKey } from "../crypto";
import { MOCK_DELIVERY_HEADER } from "./verify";
import {
  MamoApiError,
  type CreateLinkInput,
  type MamoLink,
  type MamoPayment,
  type PaymentGateway,
  type RedactedWebhook,
} from "./types";

/**
 * ==========================================================================
 * MockMamoClient — the whole payment flow with no Mamo account
 * ==========================================================================
 *
 * The owner has no Mamo keys yet, and the E2E suite must never need them.
 * Outside production, a missing key (or Settings → Payments → Mode: Mock)
 * gives this gateway instead of the real one (./index.ts). It implements the
 * same `PaymentGateway` interface and behaves like Mamo where our code can
 * tell the difference:
 *
 *   · `createLink` validates like Mamo (amount ≥ AED 2, title 1–50 chars)
 *     and returns a `payment_url` on OUR site — the mock hosted page at
 *     `/dev/mamo-mock/pay/{id}` (app/(site)/dev/mamo-mock), which offers
 *     Pay / Fail / Abandon.
 *   · Pay and Fail build a payment object in Mamo's exact shape (research
 *     02 §A5 sample), POST it to our REAL webhook route with the mock
 *     secret in the header the real verifier expects (./verify.ts
 *     `MOCK_DELIVERY_HEADER`), then redirect to `return_url` /
 *     `failure_return_url` with `createdAt&paymentLinkId&status&
 *     transactionId` appended, as Mamo does (research 02 §A3). So the
 *     verification, the claim, verify-by-fetch (`getPayment` reads the
 *     state below) and `applyPaymentSnapshot` all run for real.
 *   · `refund` behaves like Mamo's POST /payments/{id}/refunds (minimum AED
 *     1, at most `max_refund_amount`, accumulating `refunds[]`) and then
 *     delivers `payment.refunded` to the webhook a moment later, as Mamo
 *     would.
 *
 * STATE. Kept on `globalThis` so every module instance in the dev server
 * (Next can load this file more than once — route handlers, the RSC page,
 * the Payload API — and HMR reloads it on every edit) shares one store,
 * and mirrored to `private/dev/mamo-mock.json` (gitignored, SPEC §A.3) so a
 * dev-server restart does not orphan an order sitting on the mock page.
 * Never used in production: the factory refuses, and the mock pages 404.
 */

export interface MockLink extends MamoLink {
  title: string;
  return_url: string;
  failure_return_url: string;
  custom_data: Record<string, unknown>;
  first_name?: string;
  last_name?: string;
  email?: string;
  created_at: string;
}

interface MockState {
  links: Record<string, MockLink>;
  payments: Record<string, MamoPayment & Record<string, unknown>>;
  webhooks: Record<string, { id: string; url: string; enabled_events: string[]; hasAuth: boolean }>;
}

const STATE_FILE = path.join(process.cwd(), "private", "dev", "mamo-mock.json");
const GLOBAL_KEY = Symbol.for("maison-palettia.mamo-mock");

function state(): MockState {
  const holder = globalThis as unknown as Record<symbol, MockState | undefined>;
  if (!holder[GLOBAL_KEY]) {
    let loaded: MockState = { links: {}, payments: {}, webhooks: {} };
    try {
      loaded = { ...loaded, ...(JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as Partial<MockState>) };
    } catch {
      /* first run, or the file was deleted: start empty */
    }
    holder[GLOBAL_KEY] = loaded;
  }
  return holder[GLOBAL_KEY]!;
}

function persist() {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state(), null, 2));
  } catch {
    /* read-only checkout: the in-memory store still works for this process */
  }
}

const suffix = () => randomBytes(5).toString("hex").toUpperCase();

/** Mamo's `created_date` format, `YYYY-MM-DD-HH-MM-SS` (research 02 §A4; timezone UNVERIFIED — UTC here). */
function mamoDate(date = new Date()): string {
  const iso = date.toISOString();
  return `${iso.slice(0, 10)}-${iso.slice(11, 13)}-${iso.slice(14, 16)}-${iso.slice(17, 19)}`;
}

const notFound = (what: string) => new MamoApiError(404, "RECORD_NOT_FOUND", [`${what} record was not found`]);

/**
 * The mock gateway's webhook secret: derived from `PAYLOAD_SECRET` under its
 * own HKDF label, so it needs no storage, differs per installation, and can
 * never equal a real Mamo secret. The receiver accepts it ONLY outside
 * production (./index.ts `receiverSecrets`).
 */
export function mockWebhookSecret(): string {
  return deriveKey("mamo-mock-webhook-v1", 30).toString("base64url");
}

/**
 * POSTs a payment object to our own webhook route exactly as the mock's
 * "Mamo" would. `auth: "none"` / `"wrong"` send an unverifiable delivery,
 * for exercising the 401 path from the poster page.
 */
export async function deliverMockWebhook(
  baseUrl: string,
  body: Record<string, unknown>,
  auth: "mock" | "none" | "wrong" = "mock",
): Promise<{ status: number; text: string }> {
  const headers: Record<string, string> = { "content-type": "application/json", "user-agent": "MamoPay-Mock/1.0" };
  if (auth === "mock") headers[MOCK_DELIVERY_HEADER] = mockWebhookSecret();
  if (auth === "wrong") headers[MOCK_DELIVERY_HEADER] = "not-the-secret";
  try {
    const response = await fetch(`${baseUrl}/api/site/webhooks/mamo`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    return { status: response.status, text: (await response.text()).slice(0, 200) };
  } catch (error) {
    return { status: 0, text: error instanceof Error ? error.name : "fetch failed" };
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* The hosted page's three buttons                                            */
/* ────────────────────────────────────────────────────────────────────────── */

export function mockLink(id: string): MockLink | null {
  return state().links[id] ?? null;
}

export function mockLists(): { links: MockLink[]; payments: Array<MamoPayment & Record<string, unknown>> } {
  const s = state();
  const byNewest = <T extends { created_date?: string; created_at?: string }>(a: T, b: T) =>
    String(b.created_at ?? b.created_date ?? "").localeCompare(String(a.created_at ?? a.created_date ?? ""));
  return {
    links: Object.values(s.links).sort(byNewest).slice(0, 50),
    payments: Object.values(s.payments).sort(byNewest).slice(0, 50),
  };
}

export function mockPayment(id: string): (MamoPayment & Record<string, unknown>) | null {
  return state().payments[id] ?? null;
}

/**
 * What the customer did on the mock page. `captured` deactivates the link
 * (capacity 1); `failed` leaves it payable for a retry, as Mamo does.
 * Returns the payment object — the caller delivers it and redirects.
 */
export function completeMockPayment(linkId: string, outcome: "captured" | "failed"): MamoPayment & Record<string, unknown> {
  const s = state();
  const link = s.links[linkId];
  if (!link) throw notFound("Merchant::Link");
  if (!link.active) throw new MamoApiError(422, "UNPROCESSABLE ENTITY", ["This payment link is no longer active"]);

  const id = `MPB-CHRG-MOCK${suffix()}`;
  const captured = outcome === "captured";
  const amount = Number(link.amount);
  const fee = Math.round(amount * 2.9 + 100) / 100;
  const payment: MamoPayment & Record<string, unknown> = {
    status: captured ? "captured" : "failed",
    id,
    amount,
    amount_currency: "AED",
    refund_amount: 0,
    refund_status: "No refund",
    refunds: [],
    max_refund_amount: captured ? amount : 0,
    custom_data: link.custom_data,
    created_date: mamoDate(),
    customer_details: {
      name: [link.first_name, link.last_name].filter(Boolean).join(" "),
      email: link.email ?? "",
      phone_number: "-",
      comment: "-",
    },
    payment_method: { type: "CREDIT VISA", card_last4: captured ? "1157" : "1788", origin: "International card" },
    settlement_amount: captured ? (amount - fee).toFixed(2) : "0.00",
    settlement_currency: "AED",
    settlement_date: captured ? new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10) : undefined,
    settlement_fee: captured ? `AED ${fee.toFixed(2)}` : "AED 0.00",
    settlement_vat: captured ? `AED ${(fee * 0.05).toFixed(2)}` : "AED 0.00",
    payment_link_id: link.id,
    payment_link_url: link.payment_url,
    external_id: link.external_id ?? null,
    error_code: captured ? null : "insufficient_funds",
    error_message: captured ? null : "Your card has insufficient funds. Please try another card or payment method.",
    next_payment_date: null,
  };
  s.payments[id] = payment;
  if (captured) link.active = false;
  persist();
  return payment;
}

/** Marks a mock payment voided (the "reverse" outcome) — for exercising `payment.voided` from the poster page. */
export function voidMockPayment(id: string): MamoPayment & Record<string, unknown> {
  const payment = state().payments[id];
  if (!payment) throw notFound("Payment");
  payment.status = "voided";
  payment.max_refund_amount = 0;
  persist();
  return payment;
}

/** The webhook body for a payment: the payment object itself plus `event_type` (research 02 §A5). */
export function webhookBodyFor(payment: MamoPayment & Record<string, unknown>, eventType: string): Record<string, unknown> {
  return { ...payment, event_type: eventType };
}

/** The appended return parameters, exactly as Mamo documents them (research 02 §A3). */
export function returnUrlFor(link: MockLink, payment: MamoPayment): string {
  const target = new URL(payment.status === "captured" ? link.return_url : link.failure_return_url);
  target.searchParams.set("createdAt", String(payment.created_date ?? mamoDate()));
  target.searchParams.set("paymentLinkId", link.id);
  target.searchParams.set("status", payment.status === "captured" ? "captured" : "failed");
  target.searchParams.set("transactionId", payment.id);
  return target.toString();
}

/* ────────────────────────────────────────────────────────────────────────── */
/* The gateway                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

export class MockMamoClient implements PaymentGateway {
  readonly mode = "mock" as const;
  readonly isConfigured = true as const;
  readonly #baseUrl: string;

  constructor(opts: { baseUrl: string }) {
    this.#baseUrl = opts.baseUrl.replace(/\/+$/, "");
  }

  async me(): Promise<{ business_name: string }> {
    return { business_name: "Mock Mamo (no money moves)" };
  }

  async createLink(input: CreateLinkInput): Promise<MamoLink> {
    const errors: Record<string, string[]> = {};
    if (!input.title || input.title.length > 50) errors.title = ["must be 1 to 50 characters"];
    if (!(Number(input.amount) >= 2)) errors.amount = ["must be greater than or equal to 2"];
    if (Object.keys(errors).length) {
      throw new MamoApiError(422, "VALIDATION_FAILED", Object.entries(errors).map(([k, v]) => `${k} ${v[0]}`), errors);
    }
    const id = `MB-LINK-MOCK${suffix()}`;
    const link: MockLink = {
      id,
      payment_url: `${this.#baseUrl}/dev/mamo-mock/pay/${id}`,
      active: true,
      external_id: input.external_id,
      amount: Number(input.amount),
      title: input.title,
      return_url: input.return_url,
      failure_return_url: input.failure_return_url,
      custom_data: input.custom_data ?? {},
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      created_at: new Date().toISOString(),
    };
    state().links[id] = link;
    persist();
    return { id, payment_url: link.payment_url, active: true, external_id: link.external_id, amount: link.amount };
  }

  async getLink(id: string): Promise<MamoLink & { charges: MamoPayment[] }> {
    const link = mockLink(id);
    if (!link) throw notFound("Merchant::Link");
    const charges = Object.values(state().payments).filter((payment) => payment.payment_link_id === id);
    return { id: link.id, payment_url: link.payment_url, active: link.active, external_id: link.external_id, amount: link.amount, charges };
  }

  async deactivateLink(id: string): Promise<MamoLink> {
    const link = mockLink(id);
    if (!link) throw notFound("Merchant::Link");
    link.active = false;
    persist();
    return { id: link.id, payment_url: link.payment_url, active: false, external_id: link.external_id, amount: link.amount };
  }

  async getPayment(id: string): Promise<MamoPayment> {
    const payment = mockPayment(id);
    if (!payment) throw notFound("Payment");
    return { ...payment };
  }

  async refund(paymentId: string, amountAed: number): Promise<{ refund_amount: number; refund_status: string }> {
    const payment = mockPayment(paymentId);
    if (!payment) throw notFound("Payment");
    const max = Number(payment.max_refund_amount ?? 0);
    const amount = Math.round(Number(amountAed) * 100) / 100;
    if (!["captured", "refund_initiated", "refunded"].includes(String(payment.status)) || !(amount >= 1) || amount > max + 1e-9) {
      throw new MamoApiError(422, "UNPROCESSABLE ENTITY", ["Can not refund this payment"]);
    }
    const refunds = [...(payment.refunds ?? [])];
    refunds.push({ id: `REFUND-MOCK${suffix()}`, amount, created_date: mamoDate() });
    payment.refunds = refunds;
    payment.refund_amount = Math.round((Number(payment.refund_amount ?? 0) + amount) * 100) / 100;
    payment.max_refund_amount = Math.round((max - amount) * 100) / 100;
    payment.refund_status = "success";
    payment.status = "refunded";
    persist();

    // Mamo tells us about the refund by webhook too; so does the mock, a
    // moment later, so the refund path runs end-to-end.
    const body = webhookBodyFor(payment, "payment.refunded");
    setTimeout(() => void deliverMockWebhook(this.#baseUrl, body), 300);
    return { refund_amount: amount, refund_status: "success" };
  }

  async listWebhooks(): Promise<RedactedWebhook[]> {
    return Object.values(state().webhooks).map((w) => ({ id: w.id, url: w.url, enabled_events: w.enabled_events, auth_header: w.hasAuth ? "[set]" : null }));
  }

  async createWebhook(url: string, events: string[], authHeader: string): Promise<RedactedWebhook> {
    const id = `MB-WH-MOCK${suffix()}`;
    state().webhooks[id] = { id, url, enabled_events: events, hasAuth: Boolean(authHeader) };
    persist();
    return { id, url, enabled_events: events, auth_header: authHeader ? "[set]" : null };
  }

  async updateWebhook(id: string, patch: Partial<{ url: string; enabled_events: string[]; auth_header: string }>): Promise<RedactedWebhook> {
    const hook = state().webhooks[id];
    if (!hook) throw notFound("Webhook");
    if (patch.url) hook.url = patch.url;
    if (patch.enabled_events) hook.enabled_events = patch.enabled_events;
    if (patch.auth_header !== undefined) hook.hasAuth = Boolean(patch.auth_header);
    persist();
    return { id, url: hook.url, enabled_events: hook.enabled_events, auth_header: hook.hasAuth ? "[set]" : null };
  }

  async deleteWebhook(id: string): Promise<{ success: boolean }> {
    const existed = Boolean(state().webhooks[id]);
    delete state().webhooks[id];
    persist();
    return { success: existed };
  }

  toJSON() {
    return { provider: "mamo-mock", mode: this.mode };
  }
}
