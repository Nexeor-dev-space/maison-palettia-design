# 02 — Mamo Pay (UAE) API research and integration design

Research date: 2026-10-09. Every fact below carries the URL it was read from. Anything I could not find in Mamo's own documentation is marked **UNVERIFIED** and the design does not depend on it.

Primary sources:

- API reference (readme.io): https://mamopay.readme.io/reference/ — index of every page in Markdown form: https://mamopay.readme.io/llms.txt (append `.md` to any reference URL to get the raw page, e.g. https://mamopay.readme.io/reference/post_links.md).
- Help centre, Developers collection: https://help.mamopay.com/en/collections/7614470-developers
- Status page: https://mamo.instatus.com/
- Third-party harvest of the OpenAPI (useful cross-check, not authoritative): https://github.com/api-evangelist/mamo — note its `conventions/mamo-conventions.yml` independently records "No documented Idempotency-Key header or published rate-limit headers".

Local copies of everything fetched (raw `.md` pages, OpenAPI YAML, AsyncAPI) are in `/private/tmp/claude-501/-Users-rohitkvinod-Desktop-Nexeor-Projects-maison-palettia-maison-palettia-design/df75f822-a1ef-443c-9554-2d6d52e6ae08/scratchpad/mamo-specs/` (`md/*.md`, `openapi/*.yml`).

---

## Part A — What the API actually offers

### A1. Base URLs and environments

| Environment | Base URL | Source |
|---|---|---|
| Sandbox | `https://sandbox.dev.business.mamopay.com/manage_api/v1` | https://mamopay.readme.io/reference/get_ (OpenAPI `servers`) |
| Production | `https://business.mamopay.com/manage_api/v1` | same |
| Sandbox dashboard | `https://sandbox.dev.business.mamopay.com/` | https://help.mamopay.com/en/articles/13833518-integration-go-live-checklist |
| Production dashboard, API keys | `https://dashboard.mamopay.com/app/developer/keys` | https://mamopay.readme.io/reference/authentication |

- Sandbox is "an exact replica of production with your own Dashboard and API Key"; you get it by asking Mamo (chat bubble on the reference site, or "Get Sandbox" on the dashboard developer page; account must be verified first). Sources: https://help.mamopay.com/en/articles/7234144-api-integrations , https://mamopay.readme.io/reference/get_ , https://mamopay.readme.io/reference/authentication
- Sandbox-created links pay at `https://sandbox.dev.business.mamopay.com/pay/<slug>`; production at `https://business.mamopay.com/pay/<slug>` (from the `payment_url` examples on https://mamopay.readme.io/reference/post_links and https://mamopay.readme.io/reference/get_links-linkid).
- Hosted checkout and the API share one key per environment. Separate accounts/keys for sandbox vs production (https://mamopay.readme.io/reference/authentication).

### A2. Authentication

- HTTP Bearer: `Authorization: Bearer <api_key>`. Example key shape in the spec: `sk-123abc-abcd-1234-1234-123123123123` (format not formally documented; do not validate the prefix). Sources: https://mamopay.readme.io/reference/authentication , https://mamopay.readme.io/reference/get_
- `Content-Type: application/json` on requests (every endpoint's `parameters`, e.g. https://mamopay.readme.io/reference/post_links).
- Smoke test: `GET /me` → `{ "business_name", "business_tag", "website" }`; 403 `{ "messages": ["Unauthorized"], "error_code": "UNAUTHORIZED" }`. Source: https://mamopay.readme.io/reference/get_me
- Keys are shown once; losing one means generating a new one in Dashboard → Developer. Mamo's own guidance is env vars/secrets manager, never client-side. Source: https://help.mamopay.com/en/articles/13559353-best-practices-for-storing-your-api-key (our design stores them encrypted in the DB instead — see Part B — which satisfies the same threat model.)
- **UNVERIFIED**: key rotation with overlap, restricted/scoped keys, IP allow-listing. None documented.

### A3. Creating a payment — the three models

Mamo has no "checkout session" or "payment intent" primitive. The three ways to take a card payment are:

1. **Payment link (hosted page)** — `POST /links` returns `payment_url`; you redirect the customer there. `link_type: "standalone"` (default). This is the model this project should use. Source: https://mamopay.readme.io/reference/post_links
2. **Inline / modal** — same `POST /links` with `link_type: "inline"` (requires `email`, `first_name`, `last_name`), then embed with `https://assets.mamopay.com/stable/checkout-inline-2.0.0.min.js` → `new MamoPay().addIframeToWebsite("mamo-checkout-element", paymentLink)`. Iframe on your domain; redirects to `return_url`/`failure_return_url` on completion. Source: https://help.mamopay.com/en/articles/9140223-inline-payments-integration
3. **Direct charge (MIT)** — `POST /payments` with a stored `card_id` (card saved via a link with `save_card`). Merchant-initiated, for repeat billing; not for first-time checkout. Source: https://mamopay.readme.io/reference/post_payments

#### `POST /links` — fields that matter to us (verbatim from https://mamopay.readme.io/reference/post_links)

| Field | Type / constraint | Notes |
|---|---|---|
| `title` | string, 1–50 chars, **required** | "The title of the payment link" |
| `description` | string, max 75 | shown on checkout page |
| `amount` | number, **minimum 2**, default 119.99 | **Major units, decimal** (119.99 = AED 119.99). Not minor units. "amount could be 0 with save_card 'required' option for card verification" |
| `amount_currency` | enum `AED, USD, EUR, GBP, SAR`, default `AED` | currencies article: https://help.mamopay.com/en/articles/8225989-supported-currencies |
| `capacity` | integer, null = unlimited | "The number of times a payment link can be used" — set `1` for one link per order |
| `active` | boolean, default true | set false via PATCH to kill a link |
| `return_url` | URI | "redirected to after a successful payment" |
| `failure_return_url` | URI | "redirected to after a failure payment" |
| `terms_and_conditions_url` | URI | "if provided, the customer will be required to accept the terms" |
| `link_type` | enum `standalone, modal, inline`, default standalone | |
| `payment_methods` | array | "'card' always included as the default option, and wallet for Apple Pay and Google Pay. Example to accept all: ['card', 'wallet']" |
| `first_name`, `last_name`, `email`, `phone_number` | string | pre-populate the card step (phone added 2026-07-20 per changelog) |
| `enable_customer_details` | bool, default false | adds a name/email/phone screen before payment — leave false, we already have the details |
| `enable_quantity`, `enable_tips`, `enable_message`, `enable_tabby`, `enable_qr_code` | bool, default false | keep false |
| `send_customer_receipt` | bool, default false | Mamo emails its own receipt |
| `save_card` | enum `off, optional, required`, default off | |
| `custom_data` | object | free-form; **echoed back on `GET /payments*` and in webhook payloads** |
| `external_id` | string | "to associate with payments captured by this payment link"; echoed in payment objects |
| `hold_and_charge_later` | bool, default false | auth-then-capture; see A8 |
| `processing_fee_percentage` | number ≥ 0 | surcharge passed to the customer |
| `rules.allowed[]` | `{type:"bins", list, decline_message}` | BIN restrictions |
| `subscription_id` / `subscription` | | recurring; not needed |
| `payouts_share` | | marketplace split; not needed |

Response 200 (example from the same page): `id: "MB-LINK-37D90AAF51"`, `payment_url`, plus all input fields echoed and read-only extras `platform`, `prefilled_customer`, `internal_note`, `lang`, `expiration_date` (null), `is_widget`, `max_amount`, `processing_fee_amount`.

**Link expiry**: there is **no request field** to set an expiry; `expiration_date` appears only in responses (null in every example). Treat links as non-expiring and enforce our own hold window by `PATCH /links/{id} { active: false }` (https://mamopay.readme.io/reference/patch_links-linkid) or `DELETE /links/{id}` → `{ "success": true }` (https://mamopay.readme.io/reference/delete_links-linkid). **UNVERIFIED** whether Mamo can enable a settable expiry on request.

#### Redirect back to the merchant (verbatim, https://mamopay.readme.io/reference/post_links)

> Once your customer completes a payment, the redirect URL will be appended with the following params: `createdAt` (date the charge was captured at), `paymentLinkId`, `status` ("captured or failed"), `transactionId` (the transaction / charge id).
> Sample: `https://www.mamopay.com/?createdAt=2023-08-09-16-42-35&paymentLinkId=MB-LINK-3216D27C9D&status=captured&transactionId=MPB-CHRG-BEE56990A9`

These query params are **not signed**. Never mark an order paid from them; use `transactionId` to call `GET /payments/{id}` server-side (A4).

### A4. Reading payment status

- `GET /payments/{paymentId}` — full Payment object. Source: https://mamopay.readme.io/reference/get_payments-paymentid
  - `status` enum: `confirmation_required | captured | refund_initiated | processing | failed | refunded` (same page and https://mamopay.readme.io/reference/charge-object). The reverse endpoint's example shows `"voided"` as well (https://mamopay.readme.io/reference/post_payments-paymentid-reverses). **UNVERIFIED**: the exact string for an authorised-but-uncaptured hold.
  - Fields: `id`, `amount` (number, major units), `amount_currency`, `refund_amount`, `refund_status` (seen: `"No refund"`, `"success"`), `refunds[] {id, amount, amount_currency, billing_amount, billing_amount_currency}`, `max_refund_amount`, `billing_descriptor`, `custom_data`, `external_id`, `created_date` (`YYYY-MM-DD-HH-MM-SS`, timezone **UNVERIFIED**), `settlement_amount`, `settlement_currency`, `settlement_date`, `settlement_fee` ("AED 1.07"), `settlement_vat`, `customer_details {name,email,phone_number,comment}`, `payment_method {card_id,type,card_holder_name,card_last4,card_expiry_month,card_expiry_year,origin}`, `payment_link_id`, `payment_link_url`, `error_code`, `error_message`, `subscription_id`, `next_payment_date`.
  - 404: `{ "messages": ["Payment record was not found"], "error_code": "RECORD_NOT_FOUND" }`.
- `GET /links/{linkId}` — the link **plus a `charges[]` array** of every payment made through it (each with `id`, `status`, `amount`, `refund_amount`, `refund_status`, `custom_data`, `customer_details`, `payment_method`, settlement fields). This is the reconciliation primitive for an order whose redirect/webhook never arrived. Source: https://mamopay.readme.io/reference/get_links-linkid
- `GET /payments?page=&per_page=` — paginated list, **no filters** (no status/date/external_id query). `pagination_meta {page, per_page, total_pages, next_page, prev_page, from, to, total_count}`. Source: https://mamopay.readme.io/reference/get_payments
- Note the ID prefixes are inconsistent across examples (`MPB-CHRG-…`, `PAY-…`, `CHG-…`); do not validate by prefix.
- Endpoint rename: `/charges` → `/payments` on 2026-07-27 (https://mamopay.readme.io/reference/changelog). Old `/charges` paths still appear in some prose links; use `/payments`.

### A5. Webhooks

Registration (https://mamopay.readme.io/reference/post_webhooks):

- `POST /webhooks` body: `url` (URI, required), `enabled_events` (string[], required), `auth_header` (string, 1–50 chars, optional, described only as "authentication header"). Response: `{ id: "MB-WH-D8B07FB8D7", url, enabled_events, auth_header }`.
- `GET /webhooks`, `PATCH /webhooks/{webhookId}` (same body), `DELETE /webhooks/{webhookId}` → `{ "success": true }`. Sources: https://mamopay.readme.io/reference/get_webhooks , https://mamopay.readme.io/reference/patch_webhooks-webhookid , https://mamopay.readme.io/reference/delete_webhooks-webhookid
- Registered per environment (sandbox webhooks via the sandbox base URL + sandbox key).

Events (verbatim list, same page): `payment.failed`, `payment.succeeded`, `payment.refund_initiated`, `payment.refunded`, `payment.refund_failed`, `payment.card_verified`, `payment.authorized`, `payment.voided`, `subscription.failed`, `subscription.succeeded`, `payment_link.create`, `payout.processed`, `payout.failed`, `expense.create`, `expense.update`, `card_transaction.create`, `card_transaction.update`, `dispute.received`, `dispute.evidence_submitted`, `dispute.expired`, `dispute.closed`, `dispute.won`, `dispute.lost`. The `charge.*` names are "kept as legacy aliases… New integrations should use payment.*" (renamed 2026-08-06, https://mamopay.readme.io/reference/changelog).

Payload shape (https://mamopay.readme.io/reference/charge-object — "Payment Object"): for `payment.failed/succeeded/refund_initiated/refunded/refund_failed/card_verified` the body **is the Payment object itself** (A4 fields) with one extra field `event_type: "payment.succeeded"`. No envelope, no event id, no timestamp field other than `created_date`. Sample:

```json
{
  "status": "captured",
  "id": "MPB-CHRG-D65B203ABD",
  "amount": 33.99,
  "amount_currency": "AED",
  "refund_amount": 0,
  "refund_status": "No refund",
  "refunds": [],
  "max_refund_amount": 33.99,
  "custom_data": {},
  "created_date": "2023-12-25-14-38-53",
  "customer_details": { "name": "", "email": "support@mamopay.com", "phone_number": "-", "comment": "-" },
  "payment_method": { "card_id": null, "type": "CREDIT VISA", "card_holder_name": "John Doe", "card_last4": "1111", "card_expiry_month": "12", "card_expiry_year": "2028", "origin": "International card" },
  "settlement_amount": "31.99", "settlement_currency": "AED", "settlement_date": "2024-01-01",
  "settlement_fee": "AED 1.90", "settlement_vat": "AED 0.10",
  "payment_link_id": "MB-LINK-1EC52247EE",
  "payment_link_url": "https://staging.business.mamopay.com/pay/mamosandbox-8acfdf",
  "external_id": null, "error_code": null, "error_message": null, "next_payment_date": null,
  "event_type": "payment.succeeded"
}
```

`payment_link.create` delivers the Payment Link object with `event_type` (https://mamopay.readme.io/reference/payment-link-object). We will not subscribe to it.

Verification:

- The only mechanism is the `auth_header` string you register. Mamo's go-live checklist says: "Validate the `Authorization` header or confirm requests originate from Mamo to prevent spoofing" (https://help.mamopay.com/en/articles/13833518-integration-go-live-checklist). Reading the two together: Mamo sends your `auth_header` value back on each delivery, and the checklist names the `Authorization` header as the place to validate. **PLAUSIBLE but not spelled out in the reference**: the exact request header name and whether the value is sent raw or prefixed. The first thing to do with a sandbox account is register a `https://webhook.site/...` URL and read the delivery headers; the design below (B5) compares the configured secret against `Authorization` and `X-Auth-Header`/raw-match and logs headers on mismatch, and in every case re-fetches the payment from the API before trusting it, so the integration is safe even if the header turns out to be absent.
- **UNVERIFIED (not documented anywhere)**: HMAC signatures, signing secrets, timestamp headers, retry schedule, delivery timeout, ordering guarantees, event ids, sandbox "send test event" button, source IP ranges. Design accordingly: webhooks are a *fast path*, never the only path (B7 reconciliation).

### A6. Refunds, captures, reversals

- `POST /payments/{paymentId}/refunds` body `{ "amount": number }` — "Amount to be refunded. Only AED transfers supported", minimum 1. Response `{ "refund_amount": 20, "refund_status": "success" }`. 422 `{ "messages": ["Can not refund this payment"], "error_code": "UNPROCESSABLE ENTITY" }`. Source: https://mamopay.readme.io/reference/post_payments-paymentid-refunds
- Partial refunds: the Payment object carries `refunds[]` (one entry per refund, each with its own `REFUND-…` id) and `max_refund_amount` ("The maximum amount that can still be refunded on this payment") — so multiple partials are supported and the ceiling is readable before you call. Sources: https://mamopay.readme.io/reference/charge-object , https://mamopay.readme.io/reference/get_payments-paymentid (example shows `refund_amount: 10` with a `refunds[]` item of 2 — i.e. accumulated). Refund breakdown added 2026-07-23 (changelog).
- Status transitions surface as webhooks `payment.refund_initiated` → `payment.refunded` | `payment.refund_failed`, and on the object as `status: refund_initiated | refunded` with `refund_status`.
- **UNVERIFIED**: refund settlement time, refund `refund_status` enum beyond `"success"`/`"No refund"`, refunding non-AED payments, whether the refund `id` is returned by the POST (the example response has none).
- Capture / reverse (only for `hold_and_charge_later` links): `POST /payments/{id}/captures { amount ≤ authorised }`, `POST /payments/{id}/reverses` (→ `status: "voided"`). 422 "Can not capture/reverse this payment". Sources: https://mamopay.readme.io/reference/post_payments-paymentid-captures , https://mamopay.readme.io/reference/post_payments-paymentid-reverses , https://help.mamopay.com/en/articles/9717496-hold-funds-charge-later (hold duration **UNVERIFIED**). Not used in this design; workshops are paid in full at booking.

### A7. Customers

There is **no Customer resource**. Customer identity exists only as (a) the `first_name/last_name/email/phone_number` prefill on a link, (b) `customer_details` echoed on the Payment, and (c) a saved `card_id` (via `save_card`) for later `POST /payments` merchant-initiated charges (https://mamopay.readme.io/reference/post_payments). Customer records live in our CMS; correlate with `custom_data.orderId` / `external_id`.

### A8. Apple Pay / Google Pay

- "By default, both Apple Pay & Google Pay are enabled on all payment links generated from your Mamo Dashboard or API's." Request them with `payment_methods: ["card","wallet"]`. Sources: https://help.mamopay.com/en/articles/9310197-enable-apple-pay , https://mamopay.readme.io/reference/post_links
- Hosted page accepts "Mastercard, Visa, Apple Pay, and Google Pay" (https://help.mamopay.com/en/articles/9140223-inline-payments-integration). Tabby (BNPL) is a separate toggle `enable_tabby`.
- Apple Pay on **web** requires Apple domain verification: ask Mamo for the file and serve it at `https://<your-domain>/.well-known/apple-developer-merchantid-domain-association` (go-live checklist and Apple Pay article). This is clearly required for `inline`/`modal` (iframe on our domain). **UNVERIFIED** whether it is also required for `standalone` links (hosted on mamopay.com). Plan: start with `standalone`; ask Mamo during sandbox onboarding; if needed, serve the file from an admin-uploaded asset (B9) so it needs no redeploy.

### A9. Sandbox behaviour and test cards (verbatim from https://mamopay.readme.io/reference/post_links)

> To make payments with different use cases on the test environment, you can use the card details below alongside the below CVV and expiry date. CVV: 123, Expiry: 01/28

| Card number | Result | 3DS | Address required | Country |
|---|---|---|---|---|
| 4659 1055 6905 1157 | Success | no | no | GB |
| 4242 4242 4242 4242 | Success | yes | no | GB |
| 4111 1111 1111 1111 | Success | yes | yes | US |
| 4567 3613 2598 1788 | Fail | no | no | GB |
| 4095 2548 0264 2505 | Fail | no | yes | US |

> 3DS: If prompted for a password, enter **Checkout1!**

Go-live: Mamo recommends a small live transaction (e.g. AED 2) and an immediate refund after switching keys (https://help.mamopay.com/en/articles/13833518-integration-go-live-checklist).

### A10. Rate limits, idempotency, errors

- **Rate limits: UNVERIFIED** — nothing published (no 429 semantics, no headers). The only related item is the customer-side decline `retry_limit_exceeded` = "Too many failed attempts… limit to the number of payment attempts per day" (https://mamopay.readme.io/reference/transaction-failure-messages). Client should still handle 429/5xx with capped exponential backoff.
- **Idempotency: not supported** on payments/links — no `Idempotency-Key` header documented anywhere in the reference (the unofficial PHP client exposes one only for international payouts: https://github.com/xplicit-dev/mamopay). Dedupe on our side via one link per order (`external_id` + `custom_data.orderId`) and a unique index on processed webhook events (B5).
- Error envelope (consistent across pages, e.g. https://mamopay.readme.io/reference/post_links):
  - 403 `{ "messages": ["Unauthorized"], "error_code": "UNAUTHORIZED" }`
  - 404 `{ "messages": ["Merchant::Link record was not found"], "error_code": "RECORD_NOT_FOUND" }`
  - 422 `{ "messages": [...], "error_code": "VALIDATION_FAILED", "errors": { "title": ["can't be blank"] } }` or `{ "messages": ["Can not refund this payment"], "error_code": "UNPROCESSABLE ENTITY" }`
  - 500 `{ "status": 500, "error": "Internal Server Error" }` (refund page) or empty.
- Card decline codes (surface in `error_code`/`error_message` on failed payments; full table with customer-facing text at https://mamopay.readme.io/reference/transaction-failure-messages): `generic` (+aliases `generic_decline, try_again_later, transaction_not_allowed, rule`), `authentication_failed`, `insufficient_funds`, `issuer_declined` (+`contact_card_issuer, do_not_honor`), `timeout`, `invalid_card`, `expired_card`, `tabby_rejected`, `retry_limit_exceeded`, `duplicate_payment`, `invalid_bin`, `invalid_expiry`, `incorrect_verification_code`, `cvv2_failure` (+`invalid_amex_cvv`), `tabby_minimum`, `not_supported_card` (+`subscriptions_card_not_supported`), `authentication_expired`.

### A11. SDKs

- **No official Node SDK.** Verified today: `npm view mamopay`, `npm view mamo-pay`, `npm view @mamopay/node` → 404; `npm search mamopay` → empty. Mamo's reference offers generated snippets only (readme.io "code generator", https://mamopay.readme.io/reference/get_).
- Official: Flutter `mamo_business_sdk` (https://pub.dev/packages/mamo_business_sdk); WooCommerce/Shopify/PrestaShop plugins (downloaded from the dashboard); inline JS `checkout-inline-2.0.0.min.js`; an MCP server at `https://mcp.mamopay.com/mcp` (OAuth sign-in, read/ask tooling — not for integration) (https://mamopay.readme.io/reference/what-is-mamo-mcp).
- Unofficial: PHP `xplicit-dev/mamopay` (https://github.com/xplicit-dev/mamopay).
- Conclusion: write a ~200-line typed client over global `fetch` (Node 20+). Surface is small (A3–A6).

---

## Part B — Proposed integration design

Context fixed by the owner: Payload CMS 3.x in-app (`@payloadcms/next`), Postgres, self-hosted Node, no `.env` beyond `DATABASE_URL`/`PAYLOAD_SECRET`(/public URL if unavoidable), all secrets editable in admin at runtime, encrypted at rest. Existing code: `lib/booking.ts` (`placeBooking`, `BookingRecord`, `MP-D` demo refs), `lib/cart.ts` (client snapshot basket, `BookingDetails`), `lib/bookingFlags.ts` (`PAYMENT_CONFIGURED` etc. — become runtime reads), `components/booking/Checkout.tsx`, `app/payment-success/page.tsx` (already the redirect target the brief names).

### B0. Decisions

| Question | Decision | Why |
|---|---|---|
| Checkout model | `POST /links`, `link_type: "standalone"`, `capacity: 1`, redirect to `payment_url` | Zero PCI scope, Apple/Google Pay on by default, no domain verification dependency for v1, fewest unknowns. Inline iframe is a later enhancement behind the same server code. |
| Money representation | Store **fils (integer)** in our DB; convert to Mamo major units at the boundary (`amount = fils / 100`, 2 dp) and back (`Math.round(amount * 100)`) | Mamo uses decimals; integers avoid float drift in totals. |
| Source of truth for "paid" | Only a server-side `GET /payments/{id}` (or `GET /links/{id}` → `charges[]`) response with `status === "captured"`, matching `payment_link_id`, `amount_currency` and amount | Redirect params are unsigned; webhook auth is a shared string. |
| Three ingestion paths, one function | redirect → webhook → poller all call `applyPaymentSnapshot(order, payment)` | Idempotent, order-of-arrival independent. |
| Mode | `test` / `live` switch in admin, both key sets stored; each Order records which mode created it | Reconciliation never crosses environments. |
| Mock | Automatic when the active mode has no key **and** `NODE_ENV !== "production"`; explicit `mode: "mock"` also allowed in non-production. Production with no key → checkout disabled with an admin banner, never mocked. | Local dev with no Mamo account; no fake payments in prod. |
| Our own hold window | `holdMinutes` (default 30) in admin; poller deactivates the Mamo link and expires the order | Mamo links do not expire. |
| Receipts | `send_customer_receipt: false` (admin toggle); we send our own confirmation with invoice PDF + QR tickets | Avoid two emails; our invoice carries the legal details from admin. |

### B1. File layout (to be created in the repo in the implementation phase)

```
lib/payments/
  money.ts                     fils <-> Mamo decimal helpers
  crypto.ts                    AES-256-GCM encrypt/decrypt keyed from PAYLOAD_SECRET (HKDF)
  mamo/types.ts                MamoPayment, MamoLink, MamoWebhook, error types
  mamo/client.ts               MamoClient (fetch-based), MamoApiError, retry/backoff
  mamo/mock.ts                 MockMamoClient (in-memory links, simulated webhook)
  mamo/index.ts                getPaymentGateway(): resolves settings -> client (test|live|mock)
  orders.ts                    createPendingOrder(), applyPaymentSnapshot(), expireOrder()
  fulfilment.ts                on paid: tickets (QR), invoice PDF, email (owned by spec 03/04)
cms/globals/PaymentSettings.ts         admin-editable keys/mode/options (encrypted fields)
cms/collections/Orders.ts
cms/collections/PaymentEvents.ts       webhook log + idempotency
cms/collections/Refunds.ts             (or an array field on Orders; collection chosen for audit)
cms/components/PaymentSettingsActions.tsx  "Test connection", "Register webhook", "Rotate secret"
cms/endpoints/payments.ts              Payload custom endpoints backing those buttons + refund action
cms/jobs/reconcilePayments.ts          Payload Jobs task + autoRun cron
app/api/checkout/start/route.ts        creates Order + Mamo link, returns payment_url
app/api/payments/mamo/webhook/route.ts webhook receiver
app/payment-success/page.tsx           (modify) confirms via server, renders real state
app/checkout/page.tsx                  (modify) `?payment=failed` banner
app/.well-known/apple-developer-merchantid-domain-association/route.ts  serves admin-uploaded file
```

### B2. Settings model — Payload global `payment-settings`

Secrets are stored encrypted in Postgres and decrypted only in server code that asks for it explicitly. Admin UI shows a mask. No key ever reaches the browser or the REST API.

```ts
// cms/globals/PaymentSettings.ts
import type { GlobalConfig, Field } from "payload";
import { encryptSecret, decryptSecret, maskSecret } from "@/lib/payments/crypto";

/** A text field whose stored value is ciphertext and whose read value is a mask. */
const secretField = (name: string, label: string, admin = {}): Field => ({
  name, type: "text", label,
  admin: { ...admin, description: "Stored encrypted. Leave blank to keep the current value." },
  hooks: {
    beforeChange: [({ value, originalDoc, siblingData, path }) => {
      if (value === "" || value === undefined || value === null) {
        // blank submit keeps the existing ciphertext
        return originalDoc ? getAtPath(originalDoc, path) : undefined;
      }
      if (typeof value === "string" && value.startsWith("enc:v1:")) return value; // already ciphertext
      return encryptSecret(value);
    }],
    afterRead: [({ value, req }) =>
      req?.context?.revealSecrets ? decryptSecret(value) : maskSecret(decryptSecret(value))],
  },
});

const envGroup = (name: "test" | "live"): Field => ({
  name, type: "group", label: name === "test" ? "Sandbox (test) credentials" : "Live credentials",
  fields: [
    secretField("apiKey", "API key (Dashboard → Developer → Keys)"),
    secretField("webhookAuthHeader", "Webhook auth header (generated)", { readOnly: true }),
    { name: "webhookId", type: "text", admin: { readOnly: true } },
    { name: "webhookUrl", type: "text", admin: { readOnly: true } },
    { name: "webhookRegisteredAt", type: "date", admin: { readOnly: true } },
    { name: "lastConnectionCheck", type: "json", admin: { readOnly: true,
        description: "Result of the last 'Test connection' (GET /me)" } },
  ],
});

export const PaymentSettings: GlobalConfig = {
  slug: "payment-settings",
  label: "Payments",
  access: { read: isAdmin, update: isAdmin },          // staff roles cannot read this global
  admin: { group: "Settings", components: { elements: { beforeDocumentControls: ["@/cms/components/PaymentSettingsActions"] } } },
  fields: [
    { name: "provider", type: "select", options: ["mamo"], defaultValue: "mamo", admin: { readOnly: true } },
    { name: "mode", type: "radio", options: [
        { label: "Sandbox (test)", value: "test" },
        { label: "Live", value: "live" },
        { label: "Mock (local dev only)", value: "mock" } ],
      defaultValue: "test", required: true,
      validate: (v) => (v === "mock" && process.env.NODE_ENV === "production") ? "Mock mode is not allowed in production" : true },
    envGroup("test"),
    envGroup("live"),
    { name: "checkout", type: "group", fields: [
      { name: "linkType", type: "select", options: ["standalone", "inline"], defaultValue: "standalone" },
      { name: "paymentMethods", type: "select", hasMany: true, options: ["card", "wallet"], defaultValue: ["card", "wallet"] },
      { name: "sendMamoReceipt", type: "checkbox", defaultValue: false, label: "Also let Mamo email its own receipt" },
      { name: "requireTerms", type: "checkbox", defaultValue: true, label: "Require accepting /policies on the Mamo page" },
      { name: "holdMinutes", type: "number", defaultValue: 30, min: 5, max: 240,
        admin: { description: "How long a basket is held while the customer pays. Mamo links never expire; we deactivate them after this." } },
      { name: "titlePrefix", type: "text", defaultValue: "Maison Palettia", maxLength: 30 },
    ]},
    { name: "reconciliation", type: "group", fields: [
      { name: "enabled", type: "checkbox", defaultValue: true },
      { name: "everyMinutes", type: "number", defaultValue: 3, min: 1, max: 60 },
      { name: "lastRunAt", type: "date", admin: { readOnly: true } },
      { name: "lastRunSummary", type: "json", admin: { readOnly: true } },
    ]},
  ],
};
```

Encryption (`lib/payments/crypto.ts`): AES-256-GCM via `node:crypto`; key = `hkdfSync("sha256", PAYLOAD_SECRET, "maison-palettia", "payment-settings-v1", 32)`; 12-byte random IV; stored as `enc:v1:<iv_b64>:<tag_b64>:<ct_b64>`. `maskSecret` returns `••••••••` + last 4. Rotating `PAYLOAD_SECRET` requires re-entering secrets (document in runbook; admin "Test connection" would fail loudly with "could not decrypt — re-enter key").

Server-side read helper:

```ts
// lib/payments/mamo/index.ts
export async function getPaymentGateway(): Promise<PaymentGateway> {
  const payload = await getPayload({ config });
  const s = await payload.findGlobal({ slug: "payment-settings", overrideAccess: true,
                                       context: { revealSecrets: true } });
  const mode = s.mode as "test" | "live" | "mock";
  const isProd = process.env.NODE_ENV === "production";
  if (mode === "mock") return isProd ? disabledGateway("mock-in-production") : new MockMamoClient(s);
  const key = s[mode]?.apiKey;
  if (!key) return isProd ? disabledGateway(`no-${mode}-key`) : new MockMamoClient(s);
  return new MamoClient({ apiKey: key, mode, settings: s });
}
```

`disabledGateway` makes `/api/checkout/start` return `503 { reason }` and makes `PAYMENT_CONFIGURED` false at runtime, so the existing "no payment was taken" copy stays truthful. **`lib/bookingFlags.ts` constants become async reads** of this gateway's `isConfigured` (server components can `await` it; the checkout client component receives it as a prop).

Public URL (needed for `return_url` and the webhook URL): read from the Site Settings global (`siteUrl`, admin-editable, spec 01), falling back to `payload.config.serverURL`. No new env var.

### B3. Server-side client module

```ts
// lib/payments/mamo/client.ts
import type { MamoLink, MamoPayment, MamoWebhook, CreateLinkInput } from "./types";

export class MamoApiError extends Error {
  constructor(public status: number, public errorCode: string | undefined,
              public messages: string[], public errors?: Record<string, string[]>) {
    super(messages.join("; ") || `Mamo API ${status}`);
  }
}

const BASE = {
  test: "https://sandbox.dev.business.mamopay.com/manage_api/v1",
  live: "https://business.mamopay.com/manage_api/v1",
} as const;

export class MamoClient {
  readonly mode: "test" | "live";
  readonly isConfigured = true;
  #key: string;
  constructor(opts: { apiKey: string; mode: "test" | "live" }) { this.#key = opts.apiKey; this.mode = opts.mode; }

  async #req<T>(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, body?: unknown,
                { retries = method === "GET" ? 3 : 0, timeoutMs = 15_000 } = {}): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeoutMs);
      let res: Response;
      try {
        res = await fetch(`${BASE[this.mode]}${path}`, {
          method, signal: ctrl.signal,
          headers: { Authorization: `Bearer ${this.#key}`, "Content-Type": "application/json", Accept: "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
      } catch (e) {
        if (attempt < retries) { await backoff(attempt); continue; }
        throw new MamoApiError(0, "NETWORK", [String(e)]);
      } finally { clearTimeout(t); }

      if (res.ok) return (await res.json()) as T;
      const payload = await res.json().catch(() => ({}));
      const err = new MamoApiError(res.status, payload.error_code, payload.messages ?? [payload.error ?? res.statusText], payload.errors);
      if ((res.status === 429 || res.status >= 500) && attempt < retries) { await backoff(attempt); continue; }
      throw err;
    }
  }

  // Business
  me() { return this.#req<{ business_name: string; business_tag: string; website: string }>("GET", "/me"); }
  // Links
  createLink(input: CreateLinkInput) { return this.#req<MamoLink>("POST", "/links", input); }
  getLink(linkId: string) { return this.#req<MamoLink & { charges: MamoPayment[] }>("GET", `/links/${enc(linkId)}`); }
  deactivateLink(linkId: string) { return this.#req<MamoLink>("PATCH", `/links/${enc(linkId)}`, { active: false }); }
  // Payments
  getPayment(paymentId: string) { return this.#req<MamoPayment>("GET", `/payments/${enc(paymentId)}`); }
  listPayments(page = 1, perPage = 50) { return this.#req<{ data: MamoPayment[]; pagination_meta: PaginationMeta }>("GET", `/payments?page=${page}&per_page=${perPage}`); }
  refund(paymentId: string, amountAed: number) {
    return this.#req<{ refund_amount: number; refund_status: string }>("POST", `/payments/${enc(paymentId)}/refunds`, { amount: amountAed });
  }
  // Webhooks
  listWebhooks() { return this.#req<MamoWebhook[]>("GET", "/webhooks"); }
  createWebhook(url: string, events: string[], authHeader: string) { return this.#req<MamoWebhook>("POST", "/webhooks", { url, enabled_events: events, auth_header: authHeader }); }
  updateWebhook(id: string, patch: Partial<{ url: string; enabled_events: string[]; auth_header: string }>) { return this.#req<MamoWebhook>("PATCH", `/webhooks/${enc(id)}`, patch); }
  deleteWebhook(id: string) { return this.#req<{ success: boolean }>("DELETE", `/webhooks/${enc(id)}`); }
}
const enc = encodeURIComponent;
const backoff = (n: number) => new Promise(r => setTimeout(r, Math.min(8000, 500 * 2 ** n) + Math.random() * 250));
```

`lib/payments/money.ts`:

```ts
export const filsToMamoAmount = (fils: number) => Math.round(fils) / 100;          // 11999 -> 119.99
export const mamoAmountToFils = (amount: number | string) => Math.round(Number(amount) * 100);
export const MAMO_MIN_AMOUNT_FILS = 200;   // POST /links amount minimum 2 (AED)
export const MAMO_MIN_REFUND_FILS = 100;   // POST /payments/{id}/refunds amount minimum 1
```

### B4. Data model (Payload collections)

`orders` (admin: "Bookings → Orders"; staff read, admin write; customers never log in):

```ts
reference: text, unique            // "MP-7K3QZ9" — real refs; keep MP-D for the demo store until it is deleted
status: select ["pending_payment","paid","payment_failed","expired","cancelled","refunded","partially_refunded"]
mode: select ["test","live","mock"]  // which gateway minted it
customer: group { firstName, lastName, email, phone, notes }
lines: array [{ kind: "session"|"pass", workshop: relationship(workshops), sessionId, title, startsAt, quantity, unitFils, lineFils, currency:"AED" }]
subtotalFils, discountFils, totalFils: number ; currency: "AED"
payment: group {
  provider: "mamo", linkId, paymentUrl, paymentId, paymentStatus (raw Mamo status), cardType, cardLast4, cardOrigin,
  amountFils (as reported by Mamo), settlementAmount, settlementFee, settlementVat, settlementDate,
  failureCode, failureMessage, paidAt, lastSyncedAt, linkDeactivatedAt
}
refundedFils: number ; maxRefundableFils: number (mirror of Mamo max_refund_amount)
fulfilment: group { ticketsIssuedAt, invoiceNumber, invoicePdf: upload, confirmationEmailSentAt, lastEmailError }
expiresAt: date                      // createdAt + holdMinutes
```

`payment-events` (append-only log and idempotency table): `provider`, `eventType`, `paymentId`, `linkId`, `order: relationship`, `dedupeKey: text unique` (= `${paymentId}:${eventType}:${status}:${refund_amount}`), `verified: checkbox` (auth header matched), `headers: json` (minus Authorization value), `payload: json`, `receivedAt`, `processedAt`, `error`.

`refunds`: `order`, `amountFils`, `reason`, `requestedBy: relationship(users)`, `status ["requested","sent","initiated","succeeded","failed"]`, `mamoRefundId`, `mamoResponse: json`, `idempotencyKey: text unique` (uuid minted when the admin clicks), timestamps.

Seat accounting lives in `workshops`/`sessions` (spec 01): `capacity`, `seatsHeld` (pending orders not yet expired), `seatsSold`. A `pending_payment` order holds seats; `paid` converts hold → sold; `expired/failed/cancelled` releases.

### B5. Checkout handoff flow

```
Browser (Checkout.tsx)                 Next route / Payload                       Mamo
─────────────────────                  ─────────────────────                      ────
POST /api/checkout/start ───────────▶ 1 validate details; re-price every line from CMS;
  { lines, details }                     check seats; hold seats; create Order(pending_payment, mode)
                                       2 gateway.createLink({...}) ─────────────▶ POST /links
                                       3 save linkId/paymentUrl on Order     ◀──── 200 {id, payment_url}
◀───────── { paymentUrl, reference } 
window.location.assign(paymentUrl) ────────────────────────────────────────────▶ hosted page (card / Apple / Google Pay)
                                                                                 customer pays
                                       4 POST /api/payments/mamo/webhook  ◀───── payment.succeeded (Payment object)
                                         verify header → GET /payments/{id} ───▶
                                         applyPaymentSnapshot → fulfil (tickets, invoice, email)
◀──────────────────── 302 return_url?order=MP-…&createdAt=…&paymentLinkId=…&status=captured&transactionId=…
GET /payment-success?order=…&transactionId=… 
                                       5 server component: load Order by reference;
                                         if not yet paid → GET /payments/{transactionId} → applyPaymentSnapshot
                                         render Confirmed / Processing / Failed
```

`POST /links` body we send (all values from admin settings or the order):

```ts
const link = await gateway.createLink({
  title: `${s.checkout.titlePrefix} · ${order.reference}`.slice(0, 50),
  description: summariseLines(order.lines).slice(0, 75),          // "Watercolour Morning × 2 · Sat 18 Oct"
  amount: filsToMamoAmount(order.totalFils),                        // >= 2.00
  amount_currency: "AED",
  capacity: 1,
  active: true,
  link_type: s.checkout.linkType,                                   // "standalone"
  payment_methods: s.checkout.paymentMethods,                       // ["card","wallet"]
  return_url: `${siteUrl}/payment-success?order=${order.reference}`,
  failure_return_url: `${siteUrl}/checkout?order=${order.reference}&payment=failed`,
  terms_and_conditions_url: s.checkout.requireTerms ? `${siteUrl}/policies` : undefined,
  first_name: order.customer.firstName, last_name: order.customer.lastName,
  email: order.customer.email, phone_number: order.customer.phone,
  enable_customer_details: false, enable_quantity: false, enable_tips: false, enable_message: false,
  send_customer_receipt: s.checkout.sendMamoReceipt,
  external_id: order.id,
  custom_data: { orderId: order.id, orderRef: order.reference, mode: gateway.mode, site: "maison-palettia" },
});
```

Failure handling at step 2: if `createLink` throws, release the seat hold, set `status: "payment_failed"` with `failureMessage`, return 502 to the browser with a retry affordance. If the request timed out ambiguously, we still create a fresh link on retry; an orphaned link that is later paid will still match the order through `custom_data.orderId` in the webhook (and if the order is already paid, the event is flagged `needs_review` for a manual refund — admins see it in Payment events).

Amount minimum: if `totalFils < 200` (e.g. after a pass discount) checkout must refuse with a clear message; Mamo rejects amounts below 2.

`/payment-success` (server component, replaces the demo `Confirmation` reading localStorage): loads the order by `?order=`; if `status !== "paid"` and `?transactionId=` is present, it calls `gateway.getPayment(transactionId)`, asserts `payment_link_id === order.payment.linkId` and `mamoAmountToFils(amount) === order.totalFils` and `amount_currency === "AED"`, then `applyPaymentSnapshot`. Renders: **Confirmed** (tickets + "invoice emailed"), **Processing** (`processing`/`confirmation_required` — "we'll email you within a few minutes"; page polls `/api/orders/[ref]/status` every 5 s up to 2 min), or **Not paid** (link back to checkout; basket still in sessionStorage).

`/checkout?payment=failed&order=` shows the decline reason from `order.payment.failureMessage` using Mamo's customer-facing wording (A10) and lets the customer retry → we **reuse the same order** and create a new link if the old one is still unpaid (deactivating the old one).

### B6. Webhook route — verification and idempotent order update

Registration is done from the admin ("Register webhook" button → Payload endpoint `POST /api/payments/register-webhook`): it mints a 40-char URL-safe random secret (fits Mamo's 1–50 limit), stores it encrypted under `<mode>.webhookAuthHeader`, computes `url = ${siteUrl}/api/payments/mamo/webhook`, calls `createWebhook(url, EVENTS, secret)` (or `updateWebhook` if `<mode>.webhookId` exists), stores `webhookId/webhookUrl/webhookRegisteredAt`. `EVENTS = ["payment.succeeded","payment.failed","payment.refund_initiated","payment.refunded","payment.refund_failed"]`. "Rotate secret" = new secret + `PATCH /webhooks/{id} { auth_header }` + accept **both** old and new for 10 minutes.

```ts
// app/api/payments/mamo/webhook/route.ts
import { timingSafeEqual } from "node:crypto";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();                       // keep raw for the log
  const headers = Object.fromEntries(req.headers);    // Authorization redacted before storing
  const settings = await loadPaymentSettingsRevealed();

  // 1. Which environment sent this? The secret that matches tells us (test vs live).
  const presented = req.headers.get("authorization") ?? req.headers.get("x-auth-header") ?? "";
  const mode = (["test", "live"] as const).find(m => matches(presented, settings[m]?.webhookAuthHeader, settings[m]?.previousWebhookAuthHeader));
  const verified = Boolean(mode);

  let body: MamoPayment & { event_type?: string };
  try { body = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }
  if (!body?.id || !body?.event_type?.startsWith("payment.")) return new Response("ignored", { status: 200 });

  // 2. Idempotency: one row per (payment, event, status, refund_amount)
  const dedupeKey = `${body.id}:${body.event_type}:${body.status}:${body.refund_amount ?? 0}`;
  const event = await insertPaymentEventIfNew({ dedupeKey, verified, mode, headers: redact(headers), payload: body });
  if (!event) return new Response("duplicate", { status: 200 });

  if (!verified) {                                    // log, alert, do not act — 401 so Mamo's sender sees it
    await markEvent(event.id, { error: "auth header mismatch" });
    return new Response("unauthorized", { status: 401 });
  }

  // 3. Never trust the body: re-fetch from Mamo with our key in the matched environment.
  const gateway = await getPaymentGateway({ forceMode: mode! });
  const payment = await gateway.getPayment(body.id);

  // 4. Find the order (custom_data.orderId first, then external_id, then linkId) and apply.
  const order = await findOrderForPayment(payment, mode!);
  if (!order) { await markEvent(event.id, { error: "no matching order", needsReview: true }); return new Response("no order", { status: 200 }); }
  await applyPaymentSnapshot(order, payment, { source: "webhook", eventId: event.id });
  await markEvent(event.id, { processedAt: new Date(), order: order.id });
  return new Response("ok", { status: 200 });
}

function matches(presented: string, ...secrets: (string | undefined)[]) {
  const p = presented.replace(/^Bearer\s+/i, "");
  return secrets.some(s => s && s.length === p.length && timingSafeEqual(Buffer.from(s), Buffer.from(p)));
}
```

Return codes: 200 for anything we understood (including duplicates and "no order") so Mamo does not keep resending; 401 only on auth mismatch; 5xx on our own failures so that *if* Mamo retries we get another chance. Because retry behaviour is UNVERIFIED, the poller (B7) is what guarantees eventual consistency.

`applyPaymentSnapshot(order, payment)` (in `lib/payments/orders.ts`) — a pure state transition run inside a DB transaction with `SELECT … FOR UPDATE` on the order:

```ts
switch (payment.status) {
  case "captured":
    if (order.status === "pending_payment" || order.status === "payment_failed") {
      assert(payment.payment_link_id === order.payment.linkId || payment.custom_data?.orderId === order.id);
      assert(payment.amount_currency === "AED" && mamoAmountToFils(payment.amount) === order.totalFils, "amount mismatch -> needs_review");
      order.status = "paid"; order.payment.paidAt = now(); convertHoldToSold(order);
      await enqueue("fulfil-order", { orderId: order.id });   // tickets + invoice + email, once (guarded by fulfilment.ticketsIssuedAt)
    }
    break;
  case "failed":
    if (order.status === "pending_payment") { order.status = "payment_failed"; order.payment.failureCode = payment.error_code; order.payment.failureMessage = payment.error_message; /* keep hold until expiresAt so the customer can retry */ }
    break;
  case "refund_initiated": syncRefunds(order, payment); break;
  case "refunded": syncRefunds(order, payment); order.status = mamoAmountToFils(payment.refund_amount) >= order.totalFils ? "refunded" : "partially_refunded"; break;
  case "processing": case "confirmation_required": /* leave pending; poller will revisit */ break;
}
copyCardAndSettlementFields(order, payment); order.payment.paymentId = payment.id; order.payment.paymentStatus = payment.status; order.payment.lastSyncedAt = now();
```

### B7. Reconciliation job (poll pending payments)

Payload 3 Jobs Queue task, scheduled in-process with `jobs.autoRun` (works because the self-hosted Node process is long-lived):

```ts
// payload.config.ts (excerpt)
jobs: {
  tasks: [reconcilePaymentsTask, fulfilOrderTask, expireOrdersTask],
  autoRun: [{ cron: "*/3 * * * *", queue: "payments", limit: 10 }],   // interval mirrored from admin setting at boot; a settings change re-queues
}
```

`reconcilePaymentsTask` (cms/jobs/reconcilePayments.ts), each run, for the **active mode only**:

1. `pending_payment` orders older than 90 s with a `linkId`: `GET /links/{linkId}` → inspect `charges[]`; for each charge call `applyPaymentSnapshot` (a `captured` charge marks paid even if neither redirect nor webhook arrived). Cap 50 orders/run; sequential with 150 ms spacing (rate limits are unknown).
2. `pending_payment`/`payment_failed` orders past `expiresAt` with no captured charge: `PATCH /links/{id} {active:false}`, `status: "expired"`, release seats, record `linkDeactivatedAt`. If a payment later lands anyway (race), the webhook path marks the order paid and flags `needs_review: "paid after expiry"` so staff can either honour or refund.
3. Orders with `refunds.status in (sent, initiated)`: `GET /payments/{paymentId}` → `syncRefunds`.
4. `paid` orders in the last 48 h whose `lastSyncedAt` is older than 6 h: refresh settlement fields (fee/VAT/settlement date for the finance view). Low priority, cap 20/run.
5. Write `reconciliation.lastRunAt/lastRunSummary` to the global; surface in the admin analytics panel. Alert (admin notification email) when any order has been `pending_payment` for > 24 h with a captured charge that failed to apply (amount mismatch).

If the process is ever not long-lived (Vercel), replace `autoRun` with an external cron hitting Payload's `GET /api/payload-jobs/run?queue=payments` with the jobs access secret — see Part C.

### B8. Refund flow (admin-initiated)

Admin UI: on an Order, a "Refund" action (custom component) with amount (prefilled to remaining `maxRefundableFils`) and reason. Backed by Payload endpoint `POST /api/orders/:id/refund` (admin role only):

1. Load order `FOR UPDATE`; require `status in (paid, partially_refunded)` and `payment.paymentId`.
2. `GET /payments/{paymentId}` → `max_refund_amount`; reject if `amountFils > mamoAmountToFils(max_refund_amount)` or `< 100`.
3. Insert `refunds` row `{status:"requested", idempotencyKey: uuid}` **before** calling Mamo; if a row for this order is already `requested/sent` within 60 s, refuse (double-click guard).
4. `POST /payments/{paymentId}/refunds { amount: filsToMamoAmount(amountFils) }` → on 200 store response, `status:"sent"`, `refundedFils += amount` provisional; on 422 store messages, `status:"failed"`, show "Can not refund this payment" verbatim.
5. Webhooks `payment.refund_initiated/refunded/refund_failed` (and the poller) reconcile `refunds[]` from Mamo into our rows by matching amounts/ids (`REFUND-…`), set order `refunded|partially_refunded`.
6. Fulfilment: on `refunded` void the tickets (QR lookups return "refunded"), send the customer a refund email, and restore seats if the session is in the future (admin checkbox on the action: "release seats").

Only AED refunds are supported by the endpoint; our orders are AED-only.

### B9. Mock mode for local dev

`MockMamoClient` (lib/payments/mamo/mock.ts) implements the same interface:

- `createLink` → stores the link in a module-level `Map` (and mirrors into a `payment-mocks` collection so it survives restarts) and returns `payment_url: ${siteUrl}/dev/mamo-mock/pay/${id}`.
- `app/dev/mamo-mock/pay/[id]/page.tsx` (only mounted when `NODE_ENV !== "production"`): shows amount/title and three buttons — **Pay (success)**, **Pay (fail: insufficient_funds)**, **Abandon**. On click it (a) builds a Payment object exactly like A5's sample with `event_type`, `payment_link_id`, `custom_data` copied from the link; (b) POSTs it to our own `/api/payments/mamo/webhook` with the configured mock auth header (so the real webhook code path is exercised); (c) redirects to `return_url`/`failure_return_url` with `createdAt&paymentLinkId&status&transactionId` appended exactly as Mamo does.
- `getPayment/getLink` read from the Map; `refund` appends to `refunds[]` and lowers `max_refund_amount`; `me()` returns `{ business_name: "Mock Studio" }`.
- The admin shows a persistent yellow banner "Payments are in MOCK mode — nothing is charged" and all mock orders are `mode: "mock"` and excluded from analytics revenue.

### B10. Admin actions and go-live runbook (no redeploy at any step)

Buttons on the Payments global (`PaymentSettingsActions.tsx` → endpoints in `cms/endpoints/payments.ts`):

- **Test connection** — `GET /me` with the selected environment's key; stores `{ ok, business_name, checkedAt }` or the error envelope.
- **Register / update webhook** — as in B6; shows the resulting `MB-WH-…` id and URL.
- **List Mamo webhooks** — `GET /webhooks` to spot stale registrations.
- **Rotate webhook secret**.
- **Send test order** (sandbox only) — creates a AED 2 order and opens the Mamo page in a new tab; use card `4242 4242 4242 4242`, `01/28`, `123`, 3DS `Checkout1!`.

Runbook: (1) obtain sandbox account → paste sandbox key → Test connection → Register webhook → place test orders for success/fail/refund (A9 cards) → confirm Payment events show `verified: true` and the header name actually used (fix `matches()` if Mamo uses a different header). (2) Obtain live key → paste → Test connection → Register webhook (live) → switch `mode: live` → AED 2 live payment + immediate refund from the Order screen (Mamo's own recommendation) → done. If Apple Pay does not appear on the hosted page in live, ask Mamo whether domain verification is needed for standalone links; if so upload the file in Site Settings (`appleDomainAssociation` upload) — `app/.well-known/apple-developer-merchantid-domain-association/route.ts` streams it with `Content-Type: text/plain`.

### B11. Security notes

- API keys and webhook secrets: encrypted at rest (AES-256-GCM, key derived from `PAYLOAD_SECRET`), never returned unmasked over REST/GraphQL, readable only by the `admin` role, decrypted only via `context.revealSecrets` in server code. Payload's `payment-settings` global should also be excluded from any public `/api` access via `access.read: isAdmin`.
- Webhook endpoint accepts only JSON, caps body at 256 KB, constant-time compares the secret, logs headers with the secret redacted, and acts only after an authenticated re-fetch.
- Orders are never created or priced from browser data: `/api/checkout/start` re-reads prices and seats from the CMS (this is the TODO already written in `lib/cart.ts` and `lib/booking.ts`).
- Public pages never receive `payment.paymentId` beyond last-4/card type.
- The `?order=` lookup on `/payment-success` reveals nothing sensitive (reference + first name + session titles). A signed `?t=` token could be added later if the client wants the page unguessable; references are 6 chars from a 32-symbol alphabet (~1 billion), rate-limit the status endpoint.

---

## Part C — Deployment notes

Self-hosted Node (target): long-lived process ⇒ `jobs.autoRun` cron works in-process; webhook URL is stable; `siteUrl` from admin. Put the app behind HTTPS (Mamo posts to an HTTPS URL; the examples use HTTPS). Keep server clock NTP-synced (our `expiresAt` logic). Nothing here needs the persistent disk except Media/invoice PDFs (spec 03).

If moved to Vercel: (1) no in-process cron — schedule Vercel Cron to call Payload's jobs-run endpoint every 3 min, or trigger reconciliation from the `/payment-success` server render plus a cron; (2) function timeout — keep the webhook handler under 10 s (re-fetch + DB write is fine; move fulfilment to a job); (3) Node runtime (not Edge) for `node:crypto`; (4) the encryption key still derives from `PAYLOAD_SECRET`, so nothing changes in the admin; (5) `siteUrl` must be the production domain, not the preview URL, for webhook registration.

---

## Part D — Open questions for Mamo (ask during sandbox onboarding)

1. Exact header name/format used to send our `auth_header` on deliveries, and whether deliveries are retried (schedule, timeout, max attempts).
2. Any published or soft rate limit on `GET /payments/{id}` and `GET /links/{id}` (our poller does ≤ 50 calls / 3 min).
3. Is Apple domain verification required for `standalone` links, or only inline/modal?
4. Can `expiration_date` be set per link for API-created links?
5. Timezone of `created_date` / `settlement_date`.
6. Refund settlement timing and the full `refund_status` vocabulary.
7. Any `Idempotency-Key` support planned for `POST /links` / `POST /payments/{id}/refunds`.

## Part E — Source index

Reference: https://mamopay.readme.io/reference/get_ · https://mamopay.readme.io/reference/authentication · https://mamopay.readme.io/reference/get_me · https://mamopay.readme.io/reference/post_links · https://mamopay.readme.io/reference/get_links · https://mamopay.readme.io/reference/get_links-linkid · https://mamopay.readme.io/reference/patch_links-linkid · https://mamopay.readme.io/reference/delete_links-linkid · https://mamopay.readme.io/reference/get_payments · https://mamopay.readme.io/reference/get_payments-paymentid · https://mamopay.readme.io/reference/post_payments · https://mamopay.readme.io/reference/post_payments-paymentid-refunds · https://mamopay.readme.io/reference/post_payments-paymentid-captures · https://mamopay.readme.io/reference/post_payments-paymentid-reverses · https://mamopay.readme.io/reference/post_webhooks · https://mamopay.readme.io/reference/get_webhooks · https://mamopay.readme.io/reference/patch_webhooks-webhookid · https://mamopay.readme.io/reference/delete_webhooks-webhookid · https://mamopay.readme.io/reference/charge-object · https://mamopay.readme.io/reference/payment-link-object · https://mamopay.readme.io/reference/transaction-failure-messages · https://mamopay.readme.io/reference/changelog · https://mamopay.readme.io/reference/what-is-mamo-mcp · https://mamopay.readme.io/llms.txt

Help centre: https://help.mamopay.com/en/articles/7234144-api-integrations · https://help.mamopay.com/en/articles/9140223-inline-payments-integration · https://help.mamopay.com/en/articles/9310197-enable-apple-pay · https://help.mamopay.com/en/articles/13833518-integration-go-live-checklist · https://help.mamopay.com/en/articles/13559353-best-practices-for-storing-your-api-key · https://help.mamopay.com/en/articles/9717496-hold-funds-charge-later · https://help.mamopay.com/en/articles/9954034-getting-integration-support · https://help.mamopay.com/en/articles/8225989-supported-currencies · https://help.mamopay.com/en/collections/7614470-developers

Other: https://mamo.instatus.com/ · https://dashboard.mamopay.com/app/developer/keys · https://github.com/api-evangelist/mamo · https://github.com/xplicit-dev/mamopay · https://pub.dev/packages/mamo_business_sdk · npm registry checks run 2026-10-09 (`mamopay`, `mamo-pay`, `@mamopay/node` → 404).
