# 03 — Commerce, notifications, jobs, analytics and secrets

Design for the transactional half of the Maison Palettia CMS: everything that happens after a visitor presses "Confirm booking", everything that emails anyone, every background job, the analytics panel, and how secrets live in the admin panel instead of `.env`.

Scope boundary: the content model (events/sessions, passes, experiences, venues, policies, pages, media) is specified in the sibling document for content. This document names the **fields commerce needs on those collections** (section 2.1) and otherwise treats them as given. Where this document says `events` it means the bookable scheduled session the front end calls `Workshop` (route `/events/[slug]`); rename to whatever the content spec settles on.

Everything below was checked against the installed packages (`payload@3.90.2`, `@payloadcms/db-postgres@3.90.2`, `@payloadcms/next@3.90.2`, `@payloadcms/email-nodemailer@3.90.2` — unpacked in the scratchpad at `flows-spike/`), the Payload docs site, Next 16.3.4's bundled docs (`node_modules/next/dist/docs`), and Mamo's API reference (`mamopay.readme.io`). Where a fact could not be verified it is marked **UNVERIFIED** with what to do about it.

---

## 0. Decisions in one screen

| Topic | Decision | Why |
|---|---|---|
| Runtime | Payload 3.90.2 **in-app** (same Next 16.3.4 process; `app/(payload)/admin`, `app/(payload)/api`). Postgres via `@payloadcms/db-postgres` with `push: false` + migrations. | Peer range `next >=16.3.3 <17` is satisfied by 16.3.4. One process, one deploy, one DB. |
| Background work | Payload Jobs Queue, `autoRun` crons in-process, started at boot from `instrumentation.ts` via `getPayload({ config, cron: true })`. | Verified: crons start inside `BasePayload.init` when `cron: true`; `@payloadcms/next` passes `cron: true` on every admin/REST request (`dist/utilities/initReq.js`), so without instrumentation they only start after the first admin hit. |
| Payments | Mamo Pay Business API, hosted payment link per order (`POST /links`), `capacity: 1`, `external_id` = our order reference. Webhook is a **hint**; truth is always re-fetched with `GET /payments/{id}`. | Mamo's docs document no webhook signature. Verify-by-fetch is immune to forged webhooks and to replay. |
| Inventory | Counters on the event row (`seatsTotal`, `seatsSold`, `seatsHeld`) + a `seat-holds` collection. Acquisition is **one atomic `UPDATE … WHERE remaining >= qty RETURNING`** inside the order's Postgres transaction. Holds expire after 10 minutes via a per-minute job. | Oversell is impossible without a lock or a retry loop: the guard is in the same statement as the increment. |
| Invoices | Gapless per-year numbering via an `invoice-counters` row updated with `INSERT … ON CONFLICT DO UPDATE … RETURNING` in the same transaction as the invoice insert. 5% VAT, prices VAT-inclusive, TRN from settings. PDF with **pdfkit 0.20.2**, stored as a Payload upload (`invoice-files`). | A counter row-lock inside the invoice's transaction is gapless by construction; a rollback releases both. pdfkit is pure Node, MIT, no React tree, embeds TTF + PNG (QR). |
| Tickets | One `tickets` row per seat, code `MPT-XXXXXXXX`, QR payload = `mp1.<code>.<hmac>` (HMAC-SHA256 keyed by HKDF from `PAYLOAD_SECRET`). PDF generated on demand (never stored). Staff check-in view at `/admin/check-in` with camera scanning via **@yudiel/react-qr-scanner 2.6.0** (React 19, MIT, native `BarcodeDetector` with zxing-wasm fallback). | Signed-not-encrypted: scanner can validate offline-ish, DB is still the authority for "already used". |
| Email | Our own Payload `EmailAdapter` that reads **`email-settings` global at send time** (SMTP via `nodemailer@10`, or Resend via `resend@6`). Templates are CMS documents (`email-templates`) with `{{variables}}`, preview and "send me a test". Every send is a `notification-log` row. | `@payloadcms/email-nodemailer` takes transport options at config time — not runtime-editable, so it is not used. |
| Secrets at rest | `encryptedText()` field factory: AES-256-GCM, key = HKDF-SHA256(`PAYLOAD_SECRET`, salt `maison-palettia`, info `secrets-v1`). Stored as `enc:v1:<base64url(iv‖tag‖ct)>`. `afterRead` masks; server code opts in with `context: { revealSecrets: true }`. Field access admin-only. Custom field UI: masked value + Replace + Verify. | Payload's built-in `payload.encrypt` is AES-256-**CTR** (no authentication) keyed from `sha256(secret).slice(0,32)` — fine for its API keys, not what we want for provider credentials. |
| RBAC | `users.role ∈ {admin, editor, front-desk}`; collection + field matrix in §11; first user forced to `admin` by hook. | |
| Analytics | First-party, cookieless `navigator.sendBeacon` to `/api/analytics/collect`; visitor id = `sha256(dailySalt ‖ ip ‖ ua)` with a daily-rotating HKDF salt; raw rows → hourly rollup → `/admin/analytics` dashboard with page/day/referrer/device + sales KPIs. Optional GA4 / Plausible script id in `analytics-settings`. Device parsing with **bowser 2.14.1** (MIT; `ua-parser-js` 2.x is AGPL — avoided). | |
| Revalidation | `afterChange`/`afterDelete` hooks → `revalidatePath` + `revalidateTag(tag, 'max')` (Next 16 signature). Seat availability is **never baked into static HTML** — it is fetched client-side from a `no-store` endpoint — so job-driven inventory changes need no revalidation. | `revalidatePath` only works inside a Next request scope; jobs run outside one. |
| Env | `DATABASE_URL`, `PAYLOAD_SECRET`. Nothing else. The public site URL lives in the `site-settings` global (`publicUrl`). | Owner's hard constraint. |

---

## 1. Process model and file layout

```
payload.config.ts                      # root config (collections, globals, jobs, email, db)
instrumentation.ts                     # getPayload({ config, cron: true }) at boot (Node runtime only)
next.config.ts                         # withPayload(); serverExternalPackages: ['pdfkit']
app/(payload)/admin/[[...segments]]/   # Payload admin (generated by create-payload-app / docs)
app/(payload)/api/[...slug]/route.ts   # Payload REST + custom endpoints
app/(payload)/layout.tsx
app/(site)/…                           # the existing marketing + booking site moves under a route group (content spec)
app/api/analytics/collect/route.ts     # hot-path beacon (plain Next route handler)
app/my-bookings/route.ts               # magic-link landing (sets cookie, redirects)
cms/
  access/        roles.ts, helpers.ts
  collections/   users.ts customers.ts orders.ts tickets.ts payments.ts refunds.ts invoices.ts
                 invoice-files.ts invoice-counters.ts seat-holds.ts pass-purchases.ts enquiries.ts
                 waitlist.ts notification-log.ts email-templates.ts analytics-events.ts analytics-daily.ts
  globals/       payment-settings.ts email-settings.ts invoice-settings.ts notification-settings.ts
                 analytics-settings.ts   (site-settings.ts is the content spec's; it carries publicUrl)
  fields/        encrypted.ts money.ts reference.ts
  endpoints/     checkout.ts payments-mamo.ts tickets.ts my-bookings.ts enquiries.ts settings-actions.ts
  jobs/          index.ts (tasks + workflows), expireHolds.ts, finalizeOrder.ts, sendEmail.ts,
                 sendReminders.ts, reconcilePayments.ts, processRefund.ts, rollupAnalytics.ts, …
  lib/           mamo.ts crypto.ts inventory.ts pricing.ts invoiceNumber.ts pdf/{invoice,ticket}.ts
                 mailer.ts templates.ts revalidate.ts analytics.ts
  components/    SecretField.tsx VerifyButton.tsx SendTestEmail.tsx TemplatePreview.tsx
                 OrderActions.tsx CheckIn/{View.tsx,Scanner.tsx} Analytics/{View.tsx,Charts.tsx}
  views/         checkIn.tsx analytics.tsx
  migrations/    (payload migrate:create)
```

Boot sequence on the self-hosted server: `next start` → Next loads `instrumentation.ts` → `register()` calls `getPayload({ config, cron: true })` → Payload connects to Postgres, runs `onInit` (seeds email templates if missing, ensures first-run defaults), starts the `autoRun` crons (croner 10). `isNextBuild()` guards keep crons out of `next build`.

```ts
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  await getPayload({ config, cron: true })   // InitOptions.cron: "initialize crons for things like autorunning jobs"
}
```

`next.config.ts` additions: `withPayload(nextConfig)`, `serverExternalPackages: ['pdfkit']` (pdfkit reads its AFM standard-font files from disk; bundling breaks that — we also register our own TTFs, see §6.4).

---

## 2. Data model

Conventions: Postgres adapter `idType: 'uuid'` (nothing public ever shows a DB id, but uuids make the REST URLs unguessable). Money is stored as **integer fils** (`amountFils`, 1 AED = 100 fils) to avoid float drift; the site's `Price` type (`{ amount, currency }`) is derived in `afterRead`. All timestamps are `date` fields (UTC in DB, rendered in `Asia/Dubai`).

### 2.1 Fields commerce needs on content collections

On `events` (the bookable session):

| field | type | notes |
|---|---|---|
| `priceFils` | number | VAT-inclusive consumer price |
| `seatsTotal` | number | capacity |
| `seatsSold` | number, admin read-only | maintained only by commerce code |
| `seatsHeld` | number, admin read-only | active holds; maintained only by commerce code |
| `seatsAvailable` | virtual (afterRead) | `seatsTotal − seatsSold − seatsHeld`, never stored |
| `bookingStatus` | select `open \| waitlist \| closed` | the editor's switch; `fully-booked` is derived (`seatsAvailable <= 0`) |
| `salesCloseAt` | date, optional | default = `startsAt`; the server refuses holds after this |
| `checkInWindow` | group `{ beforeMinutes: 60, afterMinutes: 30 }` | what the scanner accepts as "today" |

On `passes`: `priceFils`, `sessions` (number), `validityDays` (number), `sellable` (checkbox) — `toPassCartLine` already treats a missing price as "not for sale".

`seatsSold`/`seatsHeld` have `access.update: isSystem` (false for every admin user; only server code with `overrideAccess: true` writes them) so an editor cannot fat-finger inventory.

### 2.2 Commerce collections

Schemas are written as Payload field lists, abbreviated to what settles design. `ref` = `relationship`.

**`customers`** — guest identities, no auth.
```
email (text, unique, lowercased in beforeValidate)   firstName   lastName   phone
marketingOptIn (checkbox)   notes (textarea, staff)   lastOrderAt (date, system)
stats (group, system): ordersCount, ticketsCount, lifetimeFils
```
Access: read/update admin + front-desk; create system only (checkout creates); delete admin. Index on `email`.

**`orders`**
```
reference (text, unique, index)  — "MP-" + 6 chars from ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (same alphabet as the demo, minus the "D")
status (select) — see state machine §3.1
customer (ref customers)   contact (group: firstName,lastName,email,phone — snapshot at purchase)   notes (textarea, from the booking step)
lines (array):
  kind (select session|pass)   event (ref events, if session)   pass (ref passes, if pass)
  title, category, startsAt, durationMinutes, venueName (snapshots — what the customer saw)
  qty (number)   unitFils   lineFils   passRedemptions (number, seats paid with pass credits)
codes (array): code, kind (pass|gift|promo), purchase (ref pass-purchases), seatsCovered, discountFils
totals (group): subtotalFils, discountFils, grossFils, netFils, vatFils, vatRateBps (500), currency ('AED')
payment (ref payments, current attempt)   invoice (ref invoices)   tickets (join field ← tickets.order)
hold (group): expiresAt (date), seatsByEvent (json)        — for the countdown on the success page
source (group): ipHash, userAgent, referrer (no raw IP)
timeline (array, system, append-only): at, event, by (user/system), detail (json)
internalNotes (textarea, staff)   remindersSentAt (date)
confirmedAt, cancelledAt, expiredAt (date)
```
Access: read admin + front-desk; create system; update admin + front-desk (only `internalNotes`, `contact.phone` — field-level `access.update`); delete nobody (admin `cancel` instead).

**`seat-holds`** — one row per order per event.
```
order (ref)   event (ref)   qty   expiresAt (date, index)   status (held|released|consumed)
```
Hidden from editors; admin read-only. The per-minute job releases expired rows (§4.3).

**`payments`**
```
order (ref, index)   provider ('mamo')   mode (test|live)
providerLinkId (text)   providerLinkUrl   providerPaymentId (text, unique, sparse)
status (select) — §3.2   amountFils   currency
method (group: type, cardLast4, cardBrand/origin)   raw (json, last fetched provider object)
failureCode, failureMessage   capturedAt, failedAt   webhookSeenAt   verifiedAt
```

**`refunds`**
```
order (ref)   payment (ref)   amountFils   reason (select: customer_request | studio_cancelled | duplicate | post_expiry_payment | goodwill | other)   note
status — §3.4   requestedBy (ref users)   approvedBy (ref users)
providerResponse (json)   creditNote (ref invoices)   ticketsVoided (ref tickets, hasMany)   releaseSeats (checkbox, default true)
```

**`invoices`**
```
number (text, unique) — MP-INV-2026-000123 / MP-CN-2026-000045
kind (invoice | credit_note)   year (number)   sequence (number)   order (ref)   refund (ref, credit notes)
issuedAt (date)   seller (group snapshot of invoice-settings: legalName, address, trn, vatRateBps)
buyer (group snapshot: name, email, phone)
lines (array snapshot: description, qty, unitNetFils, netFils, vatFils, grossFils)
totals (group: netFils, vatFils, grossFils)   currency
file (ref invoice-files)   generatedAt   emailedAt
```
Immutable: `access.update` admin-only and a `beforeChange` that throws `Forbidden` for any field but `file`, `emailedAt`, `generatedAt` once `issuedAt` is set.

**`invoice-files`** (upload) — `staticDir: 'private/invoices'`, `mimeTypes: ['application/pdf']`, `access.read: isStaff`, plus an `upload.handlers[]` entry that honours a signed URL for customers (§6.5). Local disk on the self-hosted box; `@payloadcms/storage-s3` if ever on Vercel (§16).

**`invoice-counters`** — `{ kind: 'invoice'|'credit_note', year, last }`, unique on `(kind, year)` (`indexes: [{ fields: ['kind','year'], unique: true }]`). Only ever touched by raw SQL (§6.1).

**`tickets`**
```
code (text, unique) — MPT- + 8 chars   order (ref)   lineIndex (number)   seatNo (number, 1..qty)
event (ref, index)   holderName   status (valid|checked_in|void|refunded)
checkedInAt   checkedInBy (ref users)   checkInDevice (text)
reminderSentAt (date)   qr (text, system) — the signed payload, computed once
```

**`pass-purchases`** — a bought pass, i.e. a wallet of session credits.
```
code (text, unique) — MPP- + 8 chars   customer (ref)   order (ref)   pass (ref passes)
sessionsTotal   sessionsRemaining   expiresAt   status (active|exhausted|expired|void)
redemptions (array: order, event, seats, at)
```

**`enquiries`**
```
name, email, phone, topic (select, same five values as lib/enquiry.ts), message, details (array label/value)
source (contact|private-events)   status (new|in_progress|closed)   assignedTo (ref users)
meta (group: ipHash, userAgent, honeypotTripped)   repliedAt
```
`access.create: () => true` (through our endpoint only — the generic REST create is disabled with `endpoints: false`? no: keep REST on, but the create endpoint is a custom one with rate limiting; collection `access.create` returns `req.context.viaEnquiryEndpoint === true`).

**`waitlist`** — `event, name, email, phone, qty, status (waiting|notified|converted|expired), notifiedAt, convertedOrder`.

**`notification-log`**
```
channel ('email')   to (text)   templateKey   subject   status (queued|sent|failed|skipped)
provider ('smtp'|'resend'|'log')   providerMessageId   error   attempts   sentAt
order (ref)   enquiry (ref)   ticket (ref)   refund (ref)   payloadSnapshot (json, variables used)
```

**`email-templates`** — §8.3.

**`analytics-events`** / **`analytics-daily`** — §12.

### 2.3 Settings globals

| global | fields (★ = `encryptedText`) |
|---|---|
| `payment-settings` | `mode` (test\|live), `testApiKey`★, `liveApiKey`★, `webhookAuthHeader`★ (generated, 40 chars), `webhook` (group per mode: id, url, registeredAt), `linkTitle` ("Maison Palettia booking"), `enableTabby` (bool), `paymentMethods` (card, wallet), `holdMinutes` (default 10), `sendProviderReceipt` (bool, default false — we send our own invoice). UI fields: **Verify connection** (`GET /me`), **Register webhook**. |
| `email-settings` | `provider` (smtp\|resend\|log-only), `fromName`, `fromAddress`, `replyTo`, `smtp` group: host, port, secure, user, `password`★; `resendApiKey`★; `bcc` (optional archive address). UI fields: **Verify connection** (nodemailer `transport.verify()` / Resend `GET /domains`), **Send test email to…**. |
| `invoice-settings` | `legalName` (default "Maison Palettia Events L.L.C."), `addressLines` (array), `trn` (text, validate `/^\d{15}$/`), `vatRateBps` (500), `pricesIncludeVat` (true), `invoicePrefix` ("MP-INV"), `creditNotePrefix` ("MP-CN"), `footerNote` (textarea), `logo` (ref media), `issuerEmail`, `issuerPhone`. |
| `notification-settings` | `recipients` (array: email, name, events: multiselect of `new_order, failed_payment, refund, new_enquiry, waitlist_joined, job_failed, low_seats`), `lowSeatsThreshold` (4), `dailyDigest` (bool, 08:00 Dubai). |
| `analytics-settings` | `enabled` (true), `rawRetentionDays` (90), `respectDoNotTrack` (true), `external` (group: provider none\|ga4\|plausible, `measurementId`, `plausibleDomain`), `excludePaths` (array), `salt` (hidden, system — see §12.2). |
| `site-settings` (content spec) | must carry `publicUrl` (https://www.maisonpalettia.com) — used for links in emails, Mamo return URLs, webhook registration. |

All globals: `access.read: isAdmin` and `access.update: isAdmin`; server code reads with `overrideAccess: true`. Every secret field additionally has field-level admin-only access, which matters for the REST/GraphQL surfaces.

---

## 3. State machines

### 3.1 Order

```
            POST /api/checkout
                 │
                 ▼
   ┌── pending_payment ──(Mamo link created)──► awaiting_payment ──┐
   │        │                                        │             │
   │        │ link creation failed                   │ payment.succeeded verified
   │        ▼                                        ▼             │
   │     failed ◄──── payment.failed ─────────  confirming ────────┤  (finalize-order workflow:
   │                                                 │             │   tickets, invoice, emails)
   │   hold timer (10 min) fires, no capture         ▼             │
   └──────────────────► expired              ┌── confirmed ◄───────┘
                           │                  │      │
   capture arrives after   │                  │      │ refund.succeeded (full)
   expiry: seats free? ────┘                  │      ▼
     yes → confirmed                          │   refunded        partial → stays confirmed, timeline notes it
     no  → refund queued, order stays         │
           expired, reason post_expiry_payment│      studio cancels (admin action) → cancelled (+ refund)
                                              │
                                              └──► completed   (all its events have ended; derived nightly)
```

Transitions are only performed by `cms/lib/orderState.ts::transition(order, to, req, detail)` which validates the edge, appends to `timeline`, and sets the `*At` fields. A `beforeChange` hook on `orders` rejects any status change that did not come through `transition` (`req.context.orderTransition === true`).

### 3.2 Payment (per attempt)

```
created ──► link_ready ──► captured ──► refunded / partially_refunded
               │  └──────► failed            ▲
               └──────────► expired (link deactivated by expire job)   refund.succeeded
               confirmation_required / processing (Mamo intermediate) ──► captured | failed
```
Mamo statuses map: `captured → captured`, `failed → failed`, `processing | confirmation_required → processing`, `refund_initiated → refund_pending`, `refunded → refunded`.

### 3.3 Ticket — `valid → checked_in` (scanner), `valid → void` (refund/cancel), `checked_in → void` only by admin with a note.

### 3.4 Refund — `requested → approved → processing → succeeded | failed`. Front-desk may `request`; only admin may `approve` (field-level `access.update` on `status` + a hook that checks role per edge). `approved` enqueues `process-refund`.

### 3.5 Seat hold — `held → consumed` (payment captured) | `released` (expired, order failed, or cancelled before capture).

### 3.6 Enquiry — `new → in_progress → closed`. Notification — `queued → sent | failed (attempts<5 → retry) | skipped`.

---

## 4. Inventory: holds, oversell protection, expiry

### 4.1 Why counters and not "count the tickets"

Counting tickets + active holds on every read is correct but slow and still racy at write time. The row counters make the write a single guarded statement, and a nightly reconciliation job (`reconcile-inventory`) recomputes `seatsSold`/`seatsHeld` from tickets and holds and alerts if they drift.

### 4.2 Atomic acquisition (inside the checkout transaction)

```ts
// cms/lib/inventory.ts
import { sql } from '@payloadcms/db-postgres'          // re-export of drizzle's sql tag
import type { PayloadRequest } from 'payload'

export class SoldOut extends Error { constructor(public eventId: string, public wanted: number) { super('sold_out') } }

async function txDb(req: PayloadRequest) {
  const id = req.transactionID ? await req.transactionID : undefined   // may be a Promise
  return id ? req.payload.db.sessions[id]?.db ?? req.payload.db.drizzle : req.payload.db.drizzle
}

export async function acquireSeats(req: PayloadRequest, eventId: string, qty: number) {
  const db = await txDb(req)
  const res = await req.payload.db.execute({ db, sql: sql`
    UPDATE events
       SET seats_held = seats_held + ${qty}, updated_at = now()
     WHERE id = ${eventId}
       AND booking_status = 'open'
       AND coalesce(sales_close_at, starts_at) > now()
       AND seats_total - seats_sold - seats_held >= ${qty}
 RETURNING seats_total - seats_sold - seats_held AS remaining` })
  if (res.rows.length === 0) throw new SoldOut(eventId, qty)
  return Number(res.rows[0].remaining)
}

export async function releaseSeats(req, eventId, qty)  // seats_held = greatest(0, seats_held - qty)
export async function consumeSeats(req, eventId, qty)  // seats_held = greatest(0, seats_held - qty), seats_sold = seats_sold + qty
export async function refundSeats(req, eventId, qty)   // seats_sold = greatest(0, seats_sold - qty)
```

Postgres row-level locking makes concurrent `UPDATE`s on the same event row serialize; the second one re-evaluates `WHERE` after the first commits, so the guard cannot be bypassed. No `SELECT … FOR UPDATE`, no retry loop, no advisory lock.

Table/column names are Payload's defaults for a collection slug `events` (`snake_case` of camelCase field names). If the content spec puts the event under another slug, `cms/lib/inventory.ts` is the single file to change; a startup assertion (`payload.db.tables.events`) catches a mismatch on boot.

### 4.3 Holds and expiry

`POST /api/checkout` creates the order, then for each session line calls `acquireSeats` and writes a `seat-holds` row with `expiresAt = now + holdMinutes`. The order stores `hold.expiresAt`; the client shows a countdown on the Mamo-return page and in the basket.

Job `expire-holds` (schedule `* * * * *`, queue `default`): `find seat-holds where status=held and expiresAt < now`, for each (in its own transaction): `releaseSeats`, hold → `released`; if the order is still `awaiting_payment` → `expired`, deactivate the Mamo link (`PATCH /links/{id} { active: false }`), log timeline. Idempotent: a hold already `released` is skipped. Concurrency: task `concurrency: { key: () => 'expire-holds', exclusive: true }` (requires `jobs.enableConcurrencyControl: true`; adds an indexed `concurrencyKey` column — included in the first migration).

### 4.4 Payment after expiry

If `payment.succeeded` arrives for an `expired` order: try `acquireSeats` again for each line (same guard). All succeed → `consumeSeats`, order → `confirmed` as normal. Any fail → release what was acquired, queue `process-refund` with reason `post_expiry_payment` for the full amount, email the customer the "we're sorry, your payment is being returned" template, notify staff. This path is rare (the link was deactivated at expiry; it covers the race where the customer was already on Mamo's page).

### 4.5 Availability on the public site

Event pages are static. They render the server's verdict (as `hasSessionPassed` does today) and a client component `SeatsLive` fetches `GET /api/events/{slug}/availability` (`cache: 'no-store'`, response `{ available, bookingStatus, salesCloseAt }`) on mount and on `visibilitychange`. The booking bar caps quantity against the live value. Checkout re-checks server-side anyway; this only keeps the page honest.

---

## 5. Checkout and payment flow

### 5.1 Sequence

```
Browser (Checkout.tsx)             Next/Payload server                         Mamo
   │ POST /api/checkout {lines, details, codes}
   │──────────────────────────────►│ validate payload (zod), rate-limit by ipHash
   │                               │ BEGIN tx (payload.db.beginTransaction)
   │                               │ upsert customer; price every line from DB (never from client)
   │                               │ apply pass/gift codes (server re-price)
   │                               │ create order (pending_payment), acquireSeats per line, seat-holds
   │                               │ COMMIT
   │                               │ if grossFils === 0 → confirm immediately (skip Mamo) ─► finalize-order
   │                               │ POST /links ────────────────────────────────────────────►│
   │                               │◄──────────────────────────── { id, payment_url } ────────│
   │                               │ payments row (link_ready); order → awaiting_payment
   │◄── 200 { reference, paymentUrl, holdExpiresAt }
   │ location.href = paymentUrl    │                                                          │
   │ … customer pays on Mamo …     │                                                          │
   │◄─────────── redirect to return_url=/payment-success?ref=MP-…&k=<hmac> ───────────────────│
   │ GET /payment-success          │                                                          │
   │ polls GET /api/orders/{ref}/status?k= every 3s (max 3 min)                               │
   │                               │◄─────────── POST /api/payments/mamo/webhook (payment.succeeded)
   │                               │ check auth header; GET /payments/{id} ──────────────────►│
   │                               │◄─────────────────────────── payment object (captured) ───│
   │                               │ BEGIN tx: payments → captured; consumeSeats; order → confirming; COMMIT
   │                               │ payload.jobs.queue({ workflow: 'finalize-order' })
   │◄── status: confirmed, tickets, invoice link                                               │
```

Why a redirect to Mamo's hosted page rather than an embedded widget: the hosted page carries Mamo's PCI scope, Apple Pay/Tabby, and 3-DS; `link_type: 'standalone'`. (`inline`/`modal` exist in the API if the owner later wants the checkout to stay on-site — nothing in this design changes except the client.)

### 5.2 `POST /links` body we send

```ts
{
  title: settings.linkTitle.slice(0, 50),                 // ≤ 50 chars
  description: `Booking ${order.reference}`.slice(0, 75), // ≤ 75 chars
  amount: order.totals.grossFils / 100,                   // AED, min 2
  amount_currency: 'AED',
  capacity: 1, active: true, link_type: 'standalone',
  return_url: `${publicUrl}/payment-success?ref=${ref}&k=${sign('return', ref)}`,
  failure_return_url: `${publicUrl}/checkout?ref=${ref}&failed=1`,
  external_id: order.reference,                           // echoed on the payment object
  custom_data: { orderId: order.id, mode: settings.mode },
  first_name, last_name, email, phone_number,             // prefill
  enable_customer_details: false, enable_quantity: false, enable_tips: false, enable_message: false,
  send_customer_receipt: settings.sendProviderReceipt,    // default false — we send the tax invoice
  enable_tabby: settings.enableTabby,
  payment_methods: settings.paymentMethods,               // ['card','wallet']
}
```
Base URL by mode: live `https://business.mamopay.com/manage_api/v1`, test `https://sandbox.dev.business.mamopay.com/manage_api/v1`. Header `Authorization: Bearer <key>`. Mamo's payment link response gives `id` (`MB-LINK-…`) and `payment_url`.

**UNVERIFIED (Mamo):** whether `return_url` receives any query parameters from Mamo (payment id). The design does not depend on it: our own `k` token proves provenance and the order status comes from our DB.

### 5.3 Webhook endpoint `POST /api/payments/mamo/webhook` (Payload root endpoint)

1. Read raw body (`await req.text()`), parse JSON; extract `id` (`MPB-CHRG-…`), `event_type`, `external_id`.
2. If `payment-settings.webhookAuthHeader` is set, require the inbound header value to match (Mamo's `POST /webhooks` accepts an `auth_header` string; **UNVERIFIED** which header name Mamo echoes it in — the endpoint accepts it in `Authorization` *or* `X-Auth-Header`, and the "Register webhook" button records whichever one arrives on the first delivery so the admin can see it). Mismatch → 401, log.
3. Always `GET /payments/{id}` with our key (verify-by-fetch). The fetched object is the only thing acted upon; the body is stored as `payments.raw.webhook` for audit.
4. Resolve the order by `external_id` (our reference) or `custom_data.orderId`; cross-check `amount` and `amount_currency` against `order.totals`. Mismatch → mark payment `failed` with `failureCode: amount_mismatch`, notify staff, 200.
5. Upsert `payments` by `providerPaymentId` (unique) — a replay is a no-op. Then by status: `captured` → §5.1 confirm path; `failed` → payment `failed`, order `failed`, release holds, email "payment didn't go through" with a retry link (new Mamo link on demand); `refunded`/`refund_initiated` → reconcile the `refunds` row.
6. Return 200 fast; everything slow is queued.

Webhook registration (admin button, per mode): `POST /webhooks { url: `${publicUrl}/api/payments/mamo/webhook`, enabled_events: ['payment.succeeded','payment.failed','payment.refunded','payment.refund_failed','payment.refund_initiated','payment.voided'], auth_header: <generated> }` → store `{ id: 'MB-WH-…', registeredAt }`.

### 5.4 Reconciliation job `reconcile-payments` (every 5 min)

For orders in `awaiting_payment` older than 2 minutes, or `confirming` older than 10 minutes: `GET /payments/{providerPaymentId}` when known; otherwise `GET /payments` filtered by date and matched on `external_id`/`payment_link_id` (**UNVERIFIED** filter params — confirm in the sandbox; worst case page the last 200). Apply the same state logic as the webhook. This makes a lost webhook a 5-minute delay, not a lost sale.

### 5.5 Pricing is server-side only

`cms/lib/pricing.ts::quote(lines, codes, req)` loads each event/pass by id, uses `priceFils` from the DB, applies pass credits (`pass-purchases` with matching `customer.email` and `sessionsRemaining > 0`; one credit = one seat on any `open` event — the policy text says "any strand"), then promo/gift codes, then VAT split. `redeemPassCode` in the client becomes `POST /api/checkout/quote` and returns the re-priced totals — exactly what `PassCodeResult.applied` was written for.

VAT (prices inclusive): `netFils = round(grossFils × 10000 / (10000 + vatRateBps))`, `vatFils = grossFils − netFils`, computed per line and summed (FTA rounds to the fils per line).

---

## 6. Invoices

### 6.1 Gapless numbering

```ts
// cms/lib/invoiceNumber.ts — called inside the same transaction that creates the invoice row
export async function nextInvoiceNumber(req, kind: 'invoice' | 'credit_note', year: number) {
  const db = await txDb(req)
  const res = await req.payload.db.execute({ db, sql: sql`
    INSERT INTO invoice_counters (id, kind, year, last, created_at, updated_at)
         VALUES (gen_random_uuid(), ${kind}, ${year}, 1, now(), now())
    ON CONFLICT (kind, year) DO UPDATE SET last = invoice_counters.last + 1, updated_at = now()
      RETURNING last` })
  const seq = Number(res.rows[0].last)
  const prefix = kind === 'invoice' ? settings.invoicePrefix : settings.creditNotePrefix
  return { seq, number: `${prefix}-${year}-${String(seq).padStart(6, '0')}` }
}
```
Gapless because the counter increment and the invoice `INSERT` are in one transaction: a rollback returns the number. Concurrent issuers queue on the `(kind, year)` row lock. Year = Dubai calendar year of `issuedAt`.

### 6.2 When an invoice is issued

`finalize-order` task `issueInvoice`: one transaction → number → `invoices` row (snapshot of seller from `invoice-settings`, buyer, lines, totals). Then task `generateInvoicePdf` renders and attaches the file (a failed render never loses the number — the row exists; the PDF task retries). Credit notes mirror this on `refund.succeeded` with negative lines referencing the original invoice number.

### 6.3 Required content (UAE tax invoice, B2C ≤ AED 10,000 → "Tax Invoice" simplified form)

"Tax Invoice", seller legal name, address, TRN; invoice number and date; description, qty, unit price (net), VAT rate, VAT amount, gross; totals; order reference; payment method + Mamo payment id; "Prices include 5% VAT". Buyer name/email (no TRN for consumers).

### 6.4 PDF generation — pdfkit 0.20.2

Why pdfkit over `@react-pdf/renderer` 4.9.0: react-pdf *is* pdfkit (0.20.1) plus a Yoga layout engine and a React reconciler; it adds ~2 MB of WASM/JS and a second React renderer inside a Next server process, and its ESM/bundling in Next needs more externals. Our documents are two fixed layouts; pdfkit's imperative API (text, rect, image, registered TTF fonts) is enough, has no React coupling, and runs identically in a job handler and in a `Response` stream.

```ts
// cms/lib/pdf/invoice.ts
import PDFDocument from 'pdfkit'
export function renderInvoice(inv: Invoice, settings: InvoiceSettings, logoPng?: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: inv.number } })
    const chunks: Buffer[] = []
    doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject)
    doc.registerFont('Body', path.join(process.cwd(), 'cms/pdf/fonts/Inter-Regular.ttf'))   // never the AFM standard fonts
    doc.registerFont('Bold', path.join(process.cwd(), 'cms/pdf/fonts/Inter-SemiBold.ttf'))
    // … header, seller block (TRN), buyer, table, totals, footer …
    doc.end()
  })
}
```
Stored via `payload.create({ collection: 'invoice-files', data: { invoice: inv.id }, file: { data: buf, mimetype: 'application/pdf', name: `${inv.number}.pdf`, size: buf.length }, overrideAccess: true, req })`.

### 6.5 Customer access to the PDF

`invoice-files.upload.handlers[0]`: if `req.user` is staff → `return` (default serve). Else require `?sig=<hmac(fileId, exp)>&exp=<unix>`; valid → `return` (serve), else `return new Response('forbidden', { status: 403 })`. The signed URL is what the confirmation email and the "My bookings" page link to (30-day expiry; regenerated on each page view).

---

## 7. Tickets

### 7.1 Issue

Task `issueTickets`: for each session line, `qty` rows, `holderName` = contact name (editable later by front-desk), `code = 'MPT-' + base32(crypto.randomBytes(5))` (8 chars from the unambiguous alphabet, retry on unique conflict). `qr = `mp1.${code}.${b64url(hmacSha256(KEY_TICKETS, code)).slice(0, 22)}``, where `KEY_TICKETS = hkdf(PAYLOAD_SECRET, 'maison-palettia', 'tickets-v1')`.

### 7.2 PDF (on demand)

`GET /api/tickets/{code}/pdf?sig=…` (customer, signed) and `GET /api/orders/{ref}/tickets.pdf` (staff) render with pdfkit: one page per ticket — event title, date/time (Dubai), venue, holder, code in large tabular caps, the QR as PNG (`qrcode@1.5.4` `toBuffer(qr, { type: 'png', errorCorrectionLevel: 'M', margin: 1, width: 512 })`), the Maison logo, and the two policy lines (cancellation window, arrive 10 min early). The confirmation email attaches the same PDF (generated at send time) and links to it.

### 7.3 Check-in endpoint `POST /api/tickets/check-in { qr | code, device }` (staff only)

1. Parse; if `qr`, recompute HMAC in constant time (`timingSafeEqual`) → reject forged codes without a DB read.
2. Load ticket + event. Respond with a verdict, never throw: `ok` (→ `checked_in`, set `checkedInAt/By/Device`, append order timeline), `already_checked_in` (with time + by), `void`, `wrong_day` (event not inside `checkInWindow` of now — staff can override with `force: true`, which is logged), `not_found`.
3. Response carries holder name, event title, time, seat `n of qty`, and remaining unchecked tickets on the same order so the desk can wave a group through.

### 7.4 Admin view `/admin/check-in`

```ts
admin: { components: { views: { checkIn: { Component: '@/cms/views/checkIn#CheckInView', path: '/check-in', exact: true } },
                       afterNavLinks: ['@/cms/components/NavLinks#NavLinks'] } }   // adds "Check-in" and "Analytics" to the nav
```
`CheckInView` is a server component: checks `initPageResult.req.user` role ∈ {admin, front-desk} (editors get a 403 panel), wraps `DefaultTemplate` from `@payloadcms/next/templates`, lists today's events with `checked / sold`, and mounts the client `Scanner`.

`Scanner` (client): `@yudiel/react-qr-scanner` `<Scanner formats={['qr_code']} onScan={…} scanDelay={500} allowMultiple />` — uses the browser's native `BarcodeDetector` where present (Chrome/Android, Safari 17+) and falls back to `barcode-detector`'s zxing-wasm; requires HTTPS for `getUserMedia`. A manual code input sits under it for damaged screens. Audible/vibration feedback on verdict; big green/amber/red panel; last 10 scans list. Works as a phone PWA-ish page (viewport meta is already in the admin shell).

---

## 8. Email

### 8.1 Runtime adapter

```ts
// cms/lib/mailer.ts
import type { EmailAdapter } from 'payload'
export const runtimeEmailAdapter: EmailAdapter = ({ payload }) => ({
  name: 'maison-runtime-mailer',
  defaultFromAddress: 'noreply@invalid.local',       // placeholders — every send sets `from` from settings
  defaultFromName: 'Maison Palettia',
  async sendEmail(message) {
    const s = await payload.findGlobal({ slug: 'email-settings', overrideAccess: true, depth: 0, context: { revealSecrets: true } })
    const from = `${s.fromName} <${s.fromAddress}>`
    switch (s.provider) {
      case 'smtp':   return (await smtpTransport(s)).sendMail({ ...message, from, replyTo: s.replyTo, bcc: s.bcc })
      case 'resend': return (await resendClient(s)).emails.send(toResend({ ...message, from, replyTo: s.replyTo }))
      default:       return { skipped: true }        // 'log-only': the notification-log row is the only trace
    }
  },
})
// smtpTransport(): nodemailer.createTransport({ host, port, secure, auth: { user, pass } }) cached by sha256 of the settings
```
Registered as `email: runtimeEmailAdapter` in `payload.config.ts`, so Payload's own admin mails (forgot-password) go through the same settings. Changing settings in the admin takes effect on the next send — no restart.

Buttons on the global (type `ui` fields, client components using `useAllFormFields` from `@payloadcms/ui` so unsaved values are tested): **Verify connection** → `POST /api/settings/email/verify` (SMTP `transport.verify()`; Resend `GET https://api.resend.com/domains`); **Send test** → `POST /api/settings/email/test { to }` sends the `test` template and shows the provider response. Both endpoints accept the form's current values; a masked secret means "use the stored one".

### 8.2 Sending pipeline

`sendTemplated({ key, to, vars, refs, req })`: render (§8.3) → create `notification-log` (`queued`) → `payload.jobs.queue({ task: 'send-email', input: { logId }, queue: 'email' })`. Task `send-email` loads the row, calls `payload.sendEmail`, sets `sent` + `providerMessageId`, or `failed` + `error` and rethrows so Payload retries (`retries: { attempts: 5, backoff: { type: 'exponential', delay: 30_000 } }`). After the last failure, `onFail` notifies staff (`job_failed`) — unless the failing send *is* the staff notification, in which case it only logs.

### 8.3 Templates as CMS documents

`email-templates`: `key` (select, unique — the code decides the list), `subject` (text with variables), `preheader`, `body` (richText, Lexical), `attachInvoice`/`attachTickets` (checkboxes where relevant), `enabled`. The layout shell (logo, colours, footer with contact details from `site-settings`) is code (`cms/email/layout.ts`). Render: `convertLexicalToHTML` from `@payloadcms/richtext-lexical` → interpolate `{{customer.firstName}}`-style variables with an HTML-escaping interpolator (`{{{raw}}}` is not supported on purpose) → plain-text alternative via `html-to-text`-style stripping of our own shell (no extra dependency: the shell is ours, the body is converted with `convertLexicalToPlaintext`).

Keys and variables:

| key | to | variables |
|---|---|---|
| `order_confirmation` | customer | `order.reference`, `customer.firstName`, `lines[]` (title, when, venue, qty), `totals.gross`, `invoice.number`, `links.tickets`, `links.invoice`, `links.myBookings` |
| `payment_failed` | customer | `order.reference`, `links.retry` |
| `ticket_reminder_24h` | customer | `event.title`, `event.when`, `event.venue`, `tickets.count`, `links.tickets`, `policy.lateCancellation` |
| `order_refunded` / `order_cancelled` | customer | `refund.amount`, `creditNote.number`, `reason` |
| `post_expiry_payment` | customer | `order.reference`, `refund.amount` |
| `magic_link` | customer | `links.myBookings` (expires 30 min) |
| `enquiry_received` (optional auto-reply) | enquirer | `name`, `topic` |
| `waitlist_seat_available` | waitlister | `event.*`, `links.book` |
| `admin_new_order`, `admin_failed_payment`, `admin_refund`, `admin_new_enquiry`, `admin_job_failed`, `admin_low_seats`, `admin_daily_digest` | notification recipients | the entity + `links.admin` |
| `test` | whoever pressed the button | `sentBy`, `provider` |

Each template document shows a read-only `ui` field listing its variables (from a code map keyed by `key`) and a **Preview** `ui` field that posts the unsaved body to `POST /api/email-templates/preview` and renders the HTML in an iframe with sample data; **Send me this** emails the preview to the current admin. `onInit` seeds every key with sensible copy if missing, so the system works before anyone edits a template.

### 8.4 Reminders (24 h before)

Task `send-reminders`, `schedule: [{ cron: '0 */15 * * * *', queue: 'default' }]`: `tickets` where `status = valid`, `reminderSentAt = null`, event `startsAt` between `now + 23h` and `now + 25h` → group by order → `sendTemplated('ticket_reminder_24h')` → stamp `reminderSentAt` on the tickets and `remindersSentAt` on the order. A sweep rather than `waitUntil` at purchase time, because an editor can move an event's date and a queued `waitUntil` job would fire at the wrong time; the 2-hour window plus the stamp makes it idempotent across restarts.

### 8.5 Staff notifications

`notifyStaff(eventKind, vars)` reads `notification-settings.recipients`, filters by subscribed `events`, and sends one `admin_*` email per recipient. Triggered from: order confirmed, payment failed, refund succeeded/failed, enquiry created, waitlist joined, job final failure, `seatsAvailable` crossing `lowSeatsThreshold` (checked in `consumeSeats`), and the optional 08:00 Dubai daily digest (`send-daily-digest`, cron `0 0 4 * * *` UTC = 08:00 GST; the job also checks `settings.dailyDigest`).

---

## 9. Jobs

Config:

```ts
jobs: {
  tasks: [expireHolds, sendEmail, sendReminders, reconcilePayments, reconcileInventory, processRefund,
          issueTickets, issueInvoice, generateInvoicePdf, notifyStaff, waitlistNotify, rollupAnalytics,
          purgeAnalytics, sendDailyDigest, completeOrders],
  workflows: [finalizeOrder],
  autoRun: [
    { cron: '*/20 * * * * *', queue: 'email',   limit: 20 },   // 6-field cron (seconds) — croner 10
    { cron: '* * * * *',      queue: 'default', limit: 25 },
  ],
  shouldAutoRun: async (payload) => (await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })).jobsEnabled !== false,
  enableConcurrencyControl: true,
  deleteJobOnComplete: false,            // keep 14 days for the admin "Jobs" list; purge job trims
  access: { run: ({ req }) => req.user?.role === 'admin' },   // the GET /api/payload-jobs/run endpoint, for a manual kick
}
```

| task / workflow | trigger | queue | retries | notes |
|---|---|---|---|---|
| `expire-holds` | schedule every minute | default | 0 | exclusive concurrency key |
| `finalize-order` (workflow) | payment captured | default | workflow retries 3 | tasks in order: `issueTickets` → `issueInvoice` → `generateInvoicePdf` → `send order_confirmation` → `notifyStaff(new_order)` → `waitlist/pass bookkeeping`. Each task is idempotent (checks what already exists) so a retry resumes. |
| `send-email` | `sendTemplated` | email | 5, exponential from 30 s | |
| `send-reminders` | schedule `0 */15 * * * *` | default | 0 | idempotent by stamp |
| `reconcile-payments` | schedule `0 */5 * * * *` | default | 0 | exclusive |
| `process-refund` | refund `approved` | default | 3 fixed 60 s | calls Mamo; on `refund_status !== 'success'` marks failed, notifies |
| `waitlist-notify` | seats released on an event that had `bookingStatus: waitlist` or was full | default | 2 | FIFO, marks `notified` |
| `rollup-analytics` | schedule `0 7 * * * *` (hourly at :07) | default | 1 | exclusive; also callable from the dashboard "refresh" |
| `purge-analytics` | schedule `0 30 2 * * *` | default | 0 | deletes raw rows older than `rawRetentionDays`, completed jobs older than 14 d |
| `complete-orders` | schedule `0 0 1 * * *` | default | 0 | `confirmed` orders whose last event ended → `completed` |
| `reconcile-inventory` | schedule `0 15 1 * * *` | default | 0 | recompute counters from tickets/holds; alert on drift |
| `send-daily-digest` | schedule `0 0 4 * * *` | email | 1 | yesterday's orders, revenue, enquiries, failures |

Observability: Payload's `payload-jobs` collection is shown in the admin under a "System" group (admin role only) with columns `taskSlug`, `queue`, `state`, `totalTried`, `hasError`, `waitUntil`, `completedAt`; `jobs.jobsCollectionOverrides` adds a `beforeDocumentControls` "Retry" button that calls `payload.jobs.runByID`. A final failure of any task runs `onFail` → `notifyStaff('job_failed')`.

Single-process note: the self-hosted server runs one Node process; `autoRun` is in-process and Payload already refuses to overlap consecutive ticks of the same cron. If the site is ever scaled to two processes, set `shouldAutoRun` to return true only on the designated worker (a `site-settings.jobsWorkerHostname` compared to `os.hostname()` keeps even that out of `.env`).

---

## 10. Secrets at rest

```ts
// cms/fields/encrypted.ts
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'
import type { Field, FieldHook } from 'payload'
import { isAdminField } from '@/cms/access/helpers'

const PREFIX = 'enc:v1:'
export const MASK = '••••••••'
const key = () => Buffer.from(hkdfSync('sha256', process.env.PAYLOAD_SECRET!, 'maison-palettia', 'secrets-v1', 32))

export function seal(plain: string) {
  const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', key(), iv)
  const ct = Buffer.concat([c.update(plain, 'utf8'), c.final()])
  return PREFIX + Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64url')
}
export function open(sealed: string) {
  const b = Buffer.from(sealed.slice(PREFIX.length), 'base64url')
  const d = createDecipheriv('aes-256-gcm', key(), b.subarray(0, 12)); d.setAuthTag(b.subarray(12, 28))
  return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8')
}

const beforeChange: FieldHook = ({ value, previousValue }) => {
  if (value == null || value === '' || value === MASK) return previousValue        // untouched in the form
  if (typeof value === 'string' && value.startsWith(PREFIX)) return value         // already sealed (imports)
  return seal(String(value))
}
const afterRead: FieldHook = ({ value, req }) => {
  if (!value) return value
  return req?.context?.revealSecrets === true ? open(value) : MASK                // clear text never leaves the server
}

export const encryptedText = (name: string, admin: { label?: string; description?: string; verify?: 'mamo' | 'smtp' | 'resend' } = {}): Field => ({
  name, type: 'text',
  access: { read: isAdminField, create: isAdminField, update: isAdminField },
  admin: { ...admin, components: { Field: '@/cms/components/SecretField#SecretField' } },
  hooks: { beforeChange: [beforeChange], afterRead: [afterRead] },
})
```

Properties: AES-256-GCM (authenticated; a tampered row fails to decrypt rather than yielding garbage), 96-bit random IV per write, key derived — never stored — from `PAYLOAD_SECRET` with HKDF so the same secret can key tickets, analytics salt and magic links with distinct `info` strings. Rotating `PAYLOAD_SECRET` requires re-entering the secrets (documented in the admin description; a `payload run cms/scripts/reseal.ts OLD_SECRET` script re-encrypts in place).

`SecretField` (client): shows `••••••••  (set 12 Oct 2026)` or `not set`, a **Replace** button that swaps in an input, **Clear**, and — when `admin.verify` is set — a **Verify** button posting to `/api/settings/{verify}/verify` with the form's current values. It never receives the clear text: `afterRead` masks before the admin API responds.

Where the server reads secrets: `payload.findGlobal({ slug, overrideAccess: true, context: { revealSecrets: true } })` — the only call sites are `cms/lib/mamo.ts`, `cms/lib/mailer.ts`, and the two verify endpoints.

---

## 11. RBAC

`users`: `auth: true`, fields `name`, `role` (select: `admin | editor | front-desk`, default `front-desk`), `active` (checkbox). `access.create/update/delete: isAdmin`; `access.read: isAdmin or self`; `admin.hidden: ({ user }) => user.role !== 'admin'`. `auth.maxLoginAttempts: 5`, `lockTime: 10 min`, `tokenExpiration: 8h`, `verify: false` (admin creates staff), `forgotPassword` through the runtime mailer.

First user: Payload's "create first user" screen runs `registerFirstUser`; a `users.beforeChange` hook sets `role = 'admin'` when `await payload.count({ collection: 'users' }) === 0` regardless of input. `access.create` returns true when the count is 0 so the bootstrap works, and `isAdmin` afterwards.

Matrix (C/R/U/D; `—` none; `R*` read without PII fields; `U:f` update only listed fields):

| collection / global | admin | editor | front-desk |
|---|---|---|---|
| content collections (content spec) | CRUD | CRUD | R |
| `users` | CRUD | R self | R self |
| `customers` | CRUD | — | R U:phone,notes |
| `orders` | R U:internalNotes,contact + actions (cancel, refund, resend) | — | R U:internalNotes, actions (resend) |
| `tickets` | R U | — | R, check-in endpoint |
| `payments` | R | — | R (no `raw`) |
| `refunds` | CRUD (approve) | — | C R (request) |
| `invoices`, `invoice-files` | R (+ regenerate PDF) | — | R |
| `pass-purchases` | R U | — | R |
| `enquiries` | CRUD | — | R U:status,assignedTo,repliedAt |
| `waitlist` | CRUD | — | R U:status |
| `notification-log` | R (+ resend) | — | R |
| `email-templates` | CRUD | R U | — |
| `analytics-*` | R | — | — |
| `payload-jobs`, `seat-holds`, `invoice-counters` | R (+ retry) | — | — |
| all settings globals | R U | — | — |
| `/admin/check-in` view | ✓ | — | ✓ |
| `/admin/analytics` view | ✓ (sales + traffic) | ✓ (traffic only) | — |

Implemented with three helpers (`isAdmin`, `isStaff` = admin|front-desk, `isEditor` = admin|editor) returning `boolean` or a `Where` (`{ id: { equals: req.user.id } }` for self). Field-level access uses the same helpers; e.g. `payments.raw` has `access.read: isAdminField`. Every public-facing write goes through custom endpoints that set `req.context.*` flags the collection `access.create` checks, so the generic REST `POST /api/orders` can never create an order.

---

## 12. Analytics

### 12.1 Collection beacon

`app/(site)/components/AnalyticsBeacon.tsx` (client, mounted once in the site layout): on mount and on every `usePathname()` change, if `analytics-settings.enabled` (passed as a prop from the server layout) and not (`respectDoNotTrack && navigator.doNotTrack === '1'`):

```ts
navigator.sendBeacon('/api/analytics/collect', new Blob([JSON.stringify({ t: 'pv', p: pathname, r: document.referrer || null, w: window.innerWidth })], { type: 'application/json' }))
```
No cookie, no localStorage, no fingerprinting beyond what the server hashes. Checkout funnel events (`checkout_started`, `payment_redirect`) are sent the same way from `Checkout.tsx`; `order_paid` is recorded server-side from the webhook (no visitor hash).

### 12.2 `app/api/analytics/collect/route.ts`

```ts
export async function POST(req: Request) {
  const body = await readJsonMax(req, 1024)                       // size cap, 204 on anything odd
  if (!body || typeof body.p !== 'string' || !body.p.startsWith('/')) return new Response(null, { status: 204 })
  const ip = firstForwardedFor(req.headers) ?? '0.0.0.0'           // behind our own reverse proxy
  const ua = req.headers.get('user-agent') ?? ''
  if (!bucket.take(ip)) return new Response(null, { status: 204 })  // in-memory token bucket, 60/min per IP
  const day = dubaiDate()                                           // YYYY-MM-DD in Asia/Dubai
  const salt = hkdfSync('sha256', process.env.PAYLOAD_SECRET!, 'maison-palettia', `analytics-${day}`, 32)
  const visitor = createHash('sha256').update(Buffer.concat([Buffer.from(salt), Buffer.from(ip), Buffer.from(ua)])).digest('base64url').slice(0, 22)
  buffer.push({ ts: new Date(), day, kind: body.t, path: stripQuery(body.p).slice(0, 200), referrerHost: hostOf(body.r), device: deviceOf(ua, body.w), visitor })
  return new Response(null, { status: 204 })
}
```
The daily salt rotates with the Dubai date, so a visitor id cannot be joined across days and the raw IP is never written. `buffer` flushes to `analytics-events` every 5 s or 200 rows with one multi-row `INSERT` through `payload.db.insert` (`tableName: 'analytics_events'`); on process exit it flushes synchronously-best-effort. `deviceOf` uses `bowser` (`getPlatformType()` → mobile/tablet/desktop, `getBrowserName()`), falling back to width.

Paths are normalised to route shapes for aggregation (`/events/candle-making` stays — it is the content we want to rank — but `/payment-success?…` and `/booking-status?…` drop their query strings, and `excludePaths` from settings drops `/admin`, `/checkout` if the owner wants).

### 12.3 Storage and rollup

`analytics-events` — `ts (index), day (index), kind, path, referrerHost, device, browser, visitor`. Admin-hidden except for admins; never read by the site.

`analytics-daily` — one row per `(day, dimension, key)`: `dimension ∈ { page, referrer, device, browser, total, funnel }`, `views`, `visitors` (distinct `visitor` within the day — exact because the hash is per-day). `rollup-analytics` (hourly) recomputes today and yesterday from raw with `GROUP BY` via `payload.db.execute` and upserts; `purge-analytics` deletes raw rows older than `rawRetentionDays` so the rollups are the long-term record.

### 12.4 Dashboard `/admin/analytics`

Server component view (`admin.components.views.analytics`, `path: '/analytics'`), period picker 7/30/90 days, in `DefaultTemplate`:

- Traffic: views & visitors per day (bar), top pages, top referrers, device split, browser split — from `analytics-daily`.
- Funnel: event page views → checkout started → payment redirect → paid (from `funnel` rows + orders).
- Sales (admin only): orders, revenue (gross/net/VAT), tickets sold, average order, refunds, per-event fill rate (`seatsSold / seatsTotal` for upcoming events), top events — from `orders`/`tickets` via `payload.db.execute` aggregates.
- Ops: notification failures last 7 d, jobs failed, holds expired vs converted (abandonment).

Charts are inline SVG in a small client component (no charting dependency); numbers are formatted with the site's `formatMoney`. The dashboard home gets two KPI tiles via `admin.components.beforeDashboard` (today's orders, upcoming events' seats left).

### 12.5 External analytics (optional)

`analytics-settings.external.provider`: `ga4` injects `<Script src="https://www.googletagmanager.com/gtag/js?id=…" strategy="afterInteractive">` + config with `anonymize_ip`; `plausible` injects `https://plausible.io/js/script.js` with `data-domain`. The site layout reads the global server-side (cached, tag `global:analytics-settings`), so switching provider is instant after revalidation and never a redeploy. Note for the owner: GA4 sets cookies; under UAE PDPL a consent notice is the owner's call — the first-party panel needs none.

---

## 13. On-demand revalidation

### 13.1 Mechanism

Hooks run inside the admin's HTTP request (Payload operations execute in the Next route handler), where `revalidatePath`/`revalidateTag` are allowed. Next 16's `revalidateTag` takes a second argument — `'max'` (stale-while-revalidate) is the documented recommendation; `updateTag` is for Server Actions only and is not used here.

```ts
// cms/lib/revalidate.ts
import { revalidatePath, revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

export const revalidateCollection = (paths: (doc: any, prev?: any) => string[]): CollectionAfterChangeHook =>
  ({ doc, previousDoc, req, collection }) => {
    if (req.context.skipRevalidate) return doc
    safeRevalidate(req, [`collection:${collection.slug}`], paths(doc, previousDoc))
    return doc
  }

function safeRevalidate(req, tags: string[], paths: string[]) {
  try {
    tags.forEach((t) => revalidateTag(t, 'max'))
    paths.forEach((p) => revalidatePath(p))
  } catch (e) {
    // outside a request scope (a job) — hand it to a request
    void fetch(`${publicUrl(req)}/api/revalidate`, { method: 'POST', headers: { authorization: `Bearer ${sign('revalidate', dubaiDate())}` }, body: JSON.stringify({ tags, paths }) })
  }
}
```
`/api/revalidate` is a Payload endpoint that verifies the HMAC (derived from `PAYLOAD_SECRET`, info `revalidate-v1`, bound to the day) and performs the same calls inside a request. Job code (e.g. `complete-orders` changing nothing public) rarely needs it; inventory never does (§4.5).

Data access on the site: `lib/workshops.ts` etc. keep their signatures and call `getPayload` + `payload.find` wrapped in `unstable_cache`-free route-segment caching: each page exports `export const revalidate = 3600` as a safety net (an hour), and `generateStaticParams` stays. (If the content spec turns on `cacheComponents`, the same tags go into `cacheTag()` inside `'use cache'` functions; the hook does not change.)

### 13.2 Mapping

| collection / global (afterChange, afterDelete) | tags | paths |
|---|---|---|
| `events` (incl. `seatsSold/Held` changes? **no** — those updates set `context.skipRevalidate`) | `collection:events` | `/`, `/events`, `/events/{slug}`, `/events/{slug}/book`, `/events/{slug}/opengraph-image`, `/sitemap.xml`; on slug change also the previous slug |
| `experiences` / disciplines | `collection:experiences` | `/`, `/events`, `/gallery` |
| `private-events` (activities) | `collection:private-events` | `/private-events`, `/private-events/{slug}`, `/private-events/book`, `/sitemap.xml` |
| `passes` | `collection:passes` | `/loyalty`, `/checkout` |
| `partners` / venues | `collection:partners` | `/`, `/locations`, `/events`, `/events/{slug}` (venue line), `/private-events` |
| `testimonials`, `recent` | own tag | `/` |
| `policies` | `collection:policies` | `/policies`, `/policies/{slug}`, `/faq`, `/sitemap.xml` |
| `faq` / pages (about, contact copy) | own tag | `/faq`, `/about`, `/contact` |
| `media` | `collection:media` | nothing (immutable URLs; a replaced image is a new filename) |
| `email-templates`, `notification-*`, `payment-settings`, `email-settings`, `invoice-settings` | — | nothing public |
| `site-settings` (contact, socials, publicUrl, WhatsApp) | `global:site-settings` | `/` and every static page: `revalidatePath('/', 'layout')` — the footer and header are on every page |
| `analytics-settings` | `global:analytics-settings` | `revalidatePath('/', 'layout')` (script injection) |
| `redirects` (if the content spec adds them) | `collection:redirects` | — (middleware reads with a 60 s cache) |

Multi-instance caveat from Next's docs: revalidation events are per-process. One process on the owner's server → fine. On Vercel the platform's cache handler propagates them (§16).

---

## 14. Guest checkout, "my bookings" and the status page

- **No accounts, ever** for customers. `customers` is not an auth collection.
- `POST /api/my-bookings/request { email }` → always 200 "if we have bookings for that address, we've sent a link" (no enumeration); rate-limited 3/15 min per ipHash and per email; if a customer exists, `sendTemplated('magic_link')` with `${publicUrl}/my-bookings?t=<token>` where `token = b64url(customerId.exp).hmac` (key info `magic-link-v1`, 30-minute expiry, single-use enforced by storing `customers.lastMagicLinkIssuedAt` and rejecting tokens issued before it).
- `app/my-bookings/route.ts` (GET): validates, sets `mp_session` cookie (httpOnly, Secure, SameSite=Lax, 30 days, value = `customerId.exp.hmac`), redirects to `/my-bookings` page; the page (dynamic, `no-store`) reads the cookie and lists orders → status, tickets (PDF links signed), invoices (signed), cancellation window hints from policy, and a "request a change" mailto/WhatsApp.
- `/booking-status` keeps the reference box but requires **reference + email** (`POST /api/orders/lookup`) and returns the same `BookingSummaryCard` data; `resolveStatus` becomes server truth (`completed` is set by the nightly job).
- `/payment-success?ref&k`: `k` is required to show line details; without it the page only offers the lookup.

Everything the front end already types (`BookingRecord`, `BookingStatus`, `PassCodeResult`) maps 1:1 to API responses, so `lib/booking.ts` becomes thin `fetch` wrappers and the demo store is deleted, as its own comment asks.

---

## 15. Enquiries

`POST /api/enquiries` (Payload endpoint): zod-validate against `EnquiryRequest`, honeypot field (`website`) → silently 200 and `meta.honeypotTripped`, rate-limit 5/hour per ipHash, create with `req.context.viaEnquiryEndpoint = true`, `notifyStaff('new_enquiry')`, optional `enquiry_received` auto-reply if the template is enabled. `ENQUIRY_CONFIGURED` flips to a runtime check (`site-settings.enquiriesEnabled` + a configured mailer). The admin list view groups by `status` with `assignedTo`; a `ui` field offers **Reply by email** (`mailto:` with the reference in the subject — replies happen in the studio's own inbox, the CMS records `repliedAt`).

---

## 16. Deployment: self-hosted Node, and what changes on Vercel

Self-hosted (target): one `next start` process behind the owner's reverse proxy (TLS, `X-Forwarded-For` trusted), persistent disk for `private/invoices` and `media`, Postgres on the shared Nexeor host, nightly `pg_dump` + disk snapshot. `instrumentation.ts` starts crons; `NEXT_RUNTIME` guard keeps them out of the edge runtime. Memory: pdfkit + zxing-wasm are server/client respectively and add nothing resident.

If ever moved to Vercel:
1. `autoRun` must go (Payload: "should not be used on serverless platforms"). Replace with Vercel Cron hitting `GET /api/payload-jobs/run?queue=default&limit=25` every minute and `…?queue=email` — `jobs.access.run` must then also accept Vercel's cron header; that means **one more env var** (`CRON_SECRET`) — the only place the owner's rule bends, and only on Vercel.
2. File storage: `@payloadcms/storage-s3@3.90.2` (or Vercel Blob) for `invoice-files` and `media`; the signed-URL handler keeps working.
3. The analytics in-memory buffer becomes a direct insert per beacon (or a queue); the token bucket becomes per-instance (acceptable).
4. Revalidation propagates through Vercel's shared cache — nothing to do; `instrumentation.ts` is harmless.
5. Postgres connections: use a pooler (Neon/PgBouncer) — `pool.max: 2` per instance.

---

## 17. Libraries (exact versions as of 2026-10-09)

| package | version | license | role |
|---|---|---|---|
| `payload` | 3.90.2 | MIT | CMS, jobs, auth |
| `@payloadcms/next`, `@payloadcms/ui`, `@payloadcms/richtext-lexical`, `@payloadcms/db-postgres` | 3.90.2 | MIT | in-app admin, UI kit, email body editor, Postgres (drizzle-orm 0.45.2, pg 8.20) |
| `@payloadcms/db-sqlite` | 3.90.2 | MIT | **spike only** — never in the real config |
| `nodemailer` | 10.0.16 | MIT-0 | SMTP (installed directly; the `@payloadcms/email-nodemailer` adapter is not used) |
| `resend` | 6.32.1 | MIT | optional provider |
| `pdfkit` | 0.20.2 | MIT | invoice / ticket PDFs (`serverExternalPackages`) |
| `qrcode` | 1.5.4 | MIT | QR PNG for tickets |
| `@yudiel/react-qr-scanner` | 2.6.0 | MIT | camera scanning in the admin (React 17–19; pulls `barcode-detector` 3.x → `zxing-wasm`) |
| `bowser` | 2.14.1 | MIT | device/browser classification (replaces AGPL `ua-parser-js` 2.x) |
| `zod` | ^4 | MIT | endpoint payload validation |
| `sharp` | ^0.35 | Apache-2.0 | required by Payload image uploads (content spec) |
| Node `crypto` (`hkdfSync`, `aes-256-gcm`, `timingSafeEqual`) | — | — | secrets, tokens, QR signatures |

Not chosen: `@react-pdf/renderer` 4.9.0 (wraps pdfkit + Yoga; heavier, second React renderer), `html5-qrcode` 2.3.8 (Apache-2.0, unmaintained since 2023, no React 19 story), `ua-parser-js` 2.x (AGPL-3.0).

---

## 18. Consolidated hook list

| where | hook | does |
|---|---|---|
| `events`, content collections | `afterChange`, `afterDelete` | revalidation (§13); skipped when `context.skipRevalidate` |
| `events` | `afterRead` | computes `seatsAvailable`, `isFullyBooked` |
| `events` | `beforeChange` | rejects `seatsSold/Held` edits unless `context.system` |
| `orders` | `beforeValidate` | mint `reference` on create |
| `orders` | `beforeChange` | enforce state machine (`context.orderTransition`), stamp `*At` |
| `orders` | `afterChange` | on `confirmed`: customer stats, low-seats check; on `cancelled`: release/refund seats via `transition` |
| `customers` | `beforeValidate` | lowercase/trim email |
| `tickets` | `beforeValidate` | mint `code`, compute `qr` |
| `invoices` | `beforeChange` | immutability guard |
| `refunds` | `beforeChange` | edge + role checks; on `approved` → queue `process-refund` (in `afterChange`) |
| `enquiries`, `waitlist` | `afterChange` (create) | `notifyStaff` |
| `users` | `beforeChange` | first user → admin |
| every `encryptedText` field | field `beforeChange`/`afterRead` | seal / mask |
| `payment-settings`, `email-settings` | `afterChange` | drop cached transports/clients (settings hash) |
| `site-settings`, `analytics-settings` | `afterChange` | `revalidatePath('/', 'layout')` |
| `payload.onInit` | — | seed email templates, generate `webhookAuthHeader` + `analytics.salt` if empty, assert `payload.db.tables.events` |

---

## 19. What the owner still has to do (nothing here needs a redeploy)

1. Mamo: open the business account, get the **test** and **live** API keys (dashboard → Developer → Keys; sandbox at `sandbox.dev.business.mamopay.com`), paste both into *Settings → Payments*, press **Verify connection**, press **Register webhook** in test mode, make a sandbox payment, flip to live, register again. Mamo's test card numbers were not in the public docs — they are in the sandbox dashboard.
2. Email: SMTP host/port/user/password (or a Resend key) into *Settings → Email*, **Verify**, **Send test**.
3. Invoice details: legal name, address, **TRN**, logo into *Settings → Invoices*.
4. Notification recipients into *Settings → Notifications*.
5. `site-settings.publicUrl` — the production domain (`lib/constants.ts` still carries a TODO on it).
6. Decide the two policy numbers the policies document leaves open (48 h asked / 24 h enforced) — the refund screen shows them as hints only; refunds stay a staff decision.
7. Hand over the brand TTF files for the PDFs (`cms/pdf/fonts/`).

Server-side one-offs (ours, once): set `DATABASE_URL` and `PAYLOAD_SECRET` on the host, run `payload migrate`, open `/admin` and create the first user.

---

## 20. Spike checklist (SQLite / throwaway Postgres, in the scratchpad only)

- [ ] `instrumentation.ts` + `getPayload({ cron: true })`: confirm `payload.crons.length === 2` at boot and that `expire-holds` ticks (log line) without an admin request.
- [ ] Two concurrent `acquireSeats(…, 9)` on a 12-seat event → exactly one succeeds (Postgres needed; SQLite serialises writes and would hide the race).
- [ ] `nextInvoiceNumber` under 20 parallel transactions with one forced rollback → numbers 1..19 contiguous.
- [ ] `encryptedText` round trip through the admin: masked on read, unchanged on save, replaced on Replace, admin-only via REST as editor (403).
- [ ] Runtime mailer: change SMTP host in admin, send test, observe new transport without restart.
- [ ] pdfkit under `next start` with `serverExternalPackages` → invoice renders with registered TTF; QR decodes with the scanner view on a phone over HTTPS (ngrok/caddy).
- [ ] Mamo sandbox: create link, pay, receive webhook (record the header Mamo uses for `auth_header`), verify-by-fetch, finalize → tickets + invoice + email.
- [ ] `revalidatePath` from an `afterChange` inside the admin request updates `/events/[slug]` on next hit; from a job it falls through to `/api/revalidate`.
