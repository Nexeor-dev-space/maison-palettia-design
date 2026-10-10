import {
  MAMO_BASE_URLS,
  MamoApiError,
  redactWebhook,
  type CreateLinkInput,
  type MamoLink,
  type MamoPayment,
  type MamoWebhookRaw,
  type PaymentGateway,
  type RedactedWebhook,
} from "./types";

/**
 * ==========================================================================
 * MamoClient — the real gateway, a thin typed layer over `fetch`
 * ==========================================================================
 *
 * Mamo publishes no Node SDK (research 02 §A11), and the surface we use is
 * eleven calls, so this is the ~150 lines research 02 §B3 sketched, with
 * three rules that matter more than the calls themselves:
 *
 *   1. ONLY GETs ARE RETRIED. Mamo documents no `Idempotency-Key` (research
 *      02 §A10), so re-sending a POST /links after a timeout could create a
 *      second payable link, and re-sending POST /refunds could refund twice.
 *      Writes go out once; an ambiguous failure surfaces to the caller,
 *      whose own protocol decides (the refund job looks before it posts,
 *      SPEC §H.7; checkout keeps the hold and lets the customer retry).
 *      GETs back off 0.5 s → 1 s → 2 s (+ jitter, capped at 8 s) on network
 *      errors, 429 and 5xx — rate limits are unpublished, so 429 is treated
 *      like any transient failure.
 *   2. 15-SECOND TIMEOUT on every call. A webhook handler or a checkout that
 *      waits on Mamo for a minute holds a DB transaction for a minute.
 *   3. ERRORS NEVER CARRY THE REQUEST. `MamoApiError` is built from the
 *      response envelope only; the Bearer key and the customer details in
 *      the body cannot reach a log line or an admin toast through it.
 *
 * The key is held in a private field (`#key`): it does not appear in
 * `JSON.stringify(client)`, `console.log(client)` or a Payload log of the
 * object, and nothing reads it back out.
 *
 * Amounts cross this boundary in Mamo's units (decimal AED); conversion to
 * and from fils is the caller's, through cms/lib/money.ts.
 */

const TIMEOUT_MS = 15_000;
const GET_RETRIES = 3;

type Method = "GET" | "POST" | "PATCH" | "DELETE";

const enc = encodeURIComponent;

const backoff = (attempt: number) =>
  new Promise((resolve) => setTimeout(resolve, Math.min(8_000, 500 * 2 ** attempt) + Math.random() * 250));

/** Mamo's error envelope, whichever of its two shapes came back (research 02 §A10). */
function errorFrom(status: number, body: unknown, statusText: string): MamoApiError {
  const envelope = (body && typeof body === "object" ? body : {}) as {
    messages?: unknown;
    error_code?: unknown;
    errors?: unknown;
    error?: unknown;
  };
  const messages = Array.isArray(envelope.messages)
    ? envelope.messages.map(String)
    : typeof envelope.error === "string"
      ? [envelope.error]
      : [statusText || `HTTP ${status}`];
  const errors =
    envelope.errors && typeof envelope.errors === "object"
      ? Object.fromEntries(
          Object.entries(envelope.errors as Record<string, unknown>).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.map(String) : [String(value)],
          ]),
        )
      : undefined;
  return new MamoApiError(status, typeof envelope.error_code === "string" ? envelope.error_code : undefined, messages, errors);
}

export class MamoClient implements PaymentGateway {
  readonly mode: "test" | "live";
  readonly isConfigured = true as const;
  readonly #key: string;
  readonly #base: string;

  constructor(opts: { apiKey: string; mode: "test" | "live" }) {
    if (!opts.apiKey) throw new Error("MamoClient needs an API key.");
    this.mode = opts.mode;
    this.#key = opts.apiKey;
    this.#base = MAMO_BASE_URLS[opts.mode];
  }

  async #request<T>(method: Method, path: string, body?: unknown): Promise<T> {
    const retries = method === "GET" ? GET_RETRIES : 0;
    for (let attempt = 0; ; attempt += 1) {
      let response: Response;
      try {
        response = await fetch(`${this.#base}${path}`, {
          method,
          signal: AbortSignal.timeout(TIMEOUT_MS),
          headers: {
            Authorization: `Bearer ${this.#key}`,
            Accept: "application/json",
            ...(body === undefined ? {} : { "Content-Type": "application/json" }),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          cache: "no-store",
        });
      } catch (error) {
        if (attempt < retries) {
          await backoff(attempt);
          continue;
        }
        // Only the error's NAME: a fetch failure message can quote the URL,
        // and keeping the rule "nothing from the request" absolute is
        // simpler than reasoning about which parts are safe.
        const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
        throw new MamoApiError(
          0,
          timedOut ? "TIMEOUT" : "NETWORK",
          [timedOut ? "Mamo Pay did not answer within 15 seconds." : "Could not reach Mamo Pay."],
        );
      }

      const text = await response.text();
      let parsed: unknown = undefined;
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = undefined;
        }
      }
      if (response.ok) return parsed as T;

      if ((response.status === 429 || response.status >= 500) && attempt < retries) {
        await backoff(attempt);
        continue;
      }
      throw errorFrom(response.status, parsed, response.statusText);
    }
  }

  // ── business ──────────────────────────────────────────────────────────
  /** `GET /me` — the smoke test behind Test connection (research 02 §A2). */
  me(): Promise<{ business_name: string }> {
    return this.#request<{ business_name: string }>("GET", "/me");
  }

  // ── links ─────────────────────────────────────────────────────────────
  createLink(input: CreateLinkInput): Promise<MamoLink> {
    return this.#request<MamoLink>("POST", "/links", input);
  }

  /** The link plus `charges[]` — every payment made through it; the poller's primitive (research 02 §A4). */
  async getLink(id: string): Promise<MamoLink & { charges: MamoPayment[] }> {
    const link = await this.#request<MamoLink & { charges?: MamoPayment[] }>("GET", `/links/${enc(id)}`);
    return { ...link, charges: Array.isArray(link?.charges) ? link.charges : [] };
  }

  /** Links never expire on Mamo's side; our hold timer kills them (research 02 §A3). */
  deactivateLink(id: string): Promise<MamoLink> {
    return this.#request<MamoLink>("PATCH", `/links/${enc(id)}`, { active: false });
  }

  // ── payments ──────────────────────────────────────────────────────────
  /** The verify-by-fetch call: a webhook body or a redirect is only a hint until this says so (SPEC §H.5 step 6). */
  getPayment(id: string): Promise<MamoPayment> {
    return this.#request<MamoPayment>("GET", `/payments/${enc(id)}`);
  }

  /** `amountAed` in decimal AED, minimum 1. NOT retried — see rule 1 above. */
  refund(paymentId: string, amountAed: number): Promise<{ refund_amount: number; refund_status: string }> {
    return this.#request("POST", `/payments/${enc(paymentId)}/refunds`, { amount: amountAed });
  }

  // ── webhooks (always redacted on the way out) ─────────────────────────
  async listWebhooks(): Promise<RedactedWebhook[]> {
    const body = await this.#request<MamoWebhookRaw[] | { data?: MamoWebhookRaw[] }>("GET", "/webhooks");
    const rows = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
    return rows.map(redactWebhook);
  }

  async createWebhook(url: string, events: string[], authHeader: string): Promise<RedactedWebhook> {
    return redactWebhook(
      await this.#request<MamoWebhookRaw>("POST", "/webhooks", { url, enabled_events: events, auth_header: authHeader }),
    );
  }

  async updateWebhook(
    id: string,
    patch: Partial<{ url: string; enabled_events: string[]; auth_header: string }>,
  ): Promise<RedactedWebhook> {
    return redactWebhook(await this.#request<MamoWebhookRaw>("PATCH", `/webhooks/${enc(id)}`, patch));
  }

  deleteWebhook(id: string): Promise<{ success: boolean }> {
    return this.#request<{ success: boolean }>("DELETE", `/webhooks/${enc(id)}`);
  }

  /** Keeps the key out of `console.log(client)` in Node's inspector as well. */
  toJSON() {
    return { provider: "mamo", mode: this.mode };
  }
}
