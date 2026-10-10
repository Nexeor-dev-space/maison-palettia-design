import { sql } from "@payloadcms/db-postgres/drizzle";
import { APIError, type PayloadRequest } from "payload";

import type { Pass, PassPurchase, PromoCode, Session, Venue } from "@/payload-types";

import type { Channel, DeskMethod, Fils, OrderLine, Quote, QuoteInput, Totals } from "./contracts";
import { runSql } from "./inventory";
import { CURRENCY, DEFAULT_VAT_RATE_BPS, MIN_PAYMENT_FILS } from "./money";

/**
 * ==========================================================================
 * Pricing — every amount re-computed on the server (SPEC §H.3 step 2)
 * ==========================================================================
 *
 * The browser sends ids and quantities, never prices. `quote()` loads each
 * session and pass from the database and prices the basket in a fixed
 * order, which is also the order the invoice explains it in:
 *
 *   1. list price   unit × qty per line (`lineFils`)
 *   2. pass credits one credit = one seat on a session line, from the pass
 *                   codes the customer typed (`MPP-…`), cheapest effect first
 *                   in line order; passes cannot pay for passes
 *   3. one promo    percentage or fixed amount over the eligible lines
 *                   (`appliesTo`), after credits, if the minimum spend is met
 *                   — a second promo code is rejected `one_promo_only`
 *   4. desk         complimentary (everything to zero) or an admin's amount
 *                   override ("Desk adjustment"), staff channel only
 *   5. VAT          per line, then summed, so the invoice lines add up:
 *                   inclusive prices → net = round(gross × 10000 / (10000 + bps)),
 *                   VAT = gross − net (SPEC §H.3, research 03 §5.5)
 *
 * Steps 1–5 are the pure function `priceBasket` (unit-tested with no
 * database). `quote()` wraps it with the lookups and, when `reserve` is set,
 * with the two ATOMIC reservations that make credits and promo uses behave
 * like seats:
 *
 *   UPDATE pass_purchases SET sessions_remaining = sessions_remaining − n
 *    WHERE id = … AND status = 'active' AND (expires_at IS NULL OR expires_at > now())
 *      AND sessions_remaining >= n RETURNING sessions_remaining
 *   UPDATE promo_codes SET uses = uses + 1
 *    WHERE id = … AND active AND (max_uses IS NULL OR uses < max_uses) AND <window> RETURNING uses
 *
 * Both run inside the checkout's transaction: twenty customers racing for a
 * three-credit pass spend exactly three credits, and a checkout that fails
 * later (sold out, link error) rolls the credits and the use back with it.
 * A reservation that loses its race is reported in `rejectedCodes` and the
 * basket is re-priced without it — the customer sees the honest total.
 *
 * Money is integer fils throughout (cms/lib/money.ts); Mamo refuses links
 * under AED 2, which `assertPayable` enforces for online orders.
 */

export type RejectReason = Quote["rejectedCodes"][number]["reason"];

/** A line as the pure pricer sees it: the order snapshot plus what promo eligibility needs. */
export interface PricingLine extends Omit<OrderLine, "lineFils" | "passCredits"> {
  experience?: string;
}

/** Credits available on one pass purchase, from a code the customer typed. */
export interface CreditGrant {
  passPurchase: string;
  code: string;
  available: number;
}

export interface PromoRule {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  appliesTo: "all" | "experiences" | "sessions";
  experiences: string[];
  sessions: string[];
  minSpendFils?: number | null;
}

export interface PriceOptions {
  vatRateBps: number;
  pricesIncludeVat: boolean;
  credits: CreditGrant[];
  promo?: PromoRule;
  desk?: { method: DeskMethod; amountFils?: Fils };
}

/** What each code did, for `orders.codes[]`. */
export interface AppliedCode {
  code: string;
  kind: "promo" | "pass";
  purchase?: string;
  seatsCovered?: number;
  discountFils: Fils;
}

/** Per-line breakdown the invoice and the order snapshot use. */
export interface PricedLine extends OrderLine {
  creditFils: Fils;
  promoFils: Fils;
  deskFils: Fils;
  grossFils: Fils;
  netFils: Fils;
  vatFils: Fils;
}

export interface PriceResult {
  lines: PricedLine[];
  totals: Totals;
  passRedemptions: Array<{ passPurchase: string; n: number }>;
  promo?: { promoCode: string; code: string; discountFils: Fils };
  promoRejected?: RejectReason;
  applied: AppliedCode[];
  deskAdjustmentFils: Fils;
  complimentaryFils: Fils;
}

/** `quote()`'s full answer: the contract's `Quote` plus the breakdown the checkout stores. */
export interface DetailedQuote extends Quote {
  pricedLines: PricedLine[];
  applied: AppliedCode[];
  deskAdjustmentFils: Fils;
  complimentaryFils: Fils;
}

/** A basket the server refuses to price: unknown session, draft, unsellable pass, bad quantity. */
export class PricingError extends APIError {
  constructor(
    public reason: "session_unavailable" | "pass_unavailable" | "bad_quantity" | "below_minimum" | "desk_amount",
    message: string,
  ) {
    super(message, reason === "below_minimum" ? 422 : 400, { reason }, true);
    this.name = "PricingError";
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Pure arithmetic                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * VAT split of one line. Inclusive: the charged amount IS the gross and
 * the net is rounded (half away from zero; amounts are never negative), so
 * net + VAT always equals what was paid. Exclusive: the charged amount is
 * the net and VAT is added on top.
 */
export function vatSplit(chargedFils: Fils, vatRateBps: number, pricesIncludeVat = true): { netFils: Fils; vatFils: Fils; grossFils: Fils } {
  if (!Number.isInteger(chargedFils) || chargedFils < 0) throw new RangeError(`charged amount must be whole fils ≥ 0, got ${chargedFils}`);
  if (pricesIncludeVat) {
    const netFils = Math.round((chargedFils * 10_000) / (10_000 + vatRateBps));
    return { netFils, vatFils: chargedFils - netFils, grossFils: chargedFils };
  }
  const vatFils = Math.round((chargedFils * vatRateBps) / 10_000);
  return { netFils: chargedFils, vatFils, grossFils: chargedFils + vatFils };
}

/**
 * Splits `amount` across `weights` in proportion, in whole fils, so the
 * parts sum to exactly `amount` (largest-remainder method; ties go to the
 * earlier line). A discount spread this way never leaves a stray fil.
 */
export function allocate(amount: Fils, weights: number[]): Fils[] {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (amount <= 0 || total <= 0) return weights.map(() => 0);
  const exact = weights.map((w) => (amount * w) / total);
  const parts = exact.map((x) => Math.floor(x));
  let left = amount - parts.reduce((sum, p) => sum + p, 0);
  const order = exact.map((x, i) => ({ i, frac: x - Math.floor(x) })).sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    parts[i] += 1;
    left -= 1;
  }
  return parts;
}

const promoEligible = (line: PricingLine, promo: PromoRule): boolean => {
  if (promo.appliesTo === "all") return true;
  if (line.kind !== "session") return false;
  if (promo.appliesTo === "sessions") return Boolean(line.session && promo.sessions.includes(line.session));
  return Boolean(line.experience && promo.experiences.includes(line.experience));
};

/**
 * Steps 1–5 of the header, with no database. Deterministic: the same basket
 * and the same grants always price the same, which is what lets the
 * checkout re-price after a lost reservation race.
 */
export function priceBasket(input: PricingLine[], opts: PriceOptions): PriceResult {
  const rate = opts.vatRateBps;
  const lines = input.map((line) => {
    if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > 50) throw new PricingError("bad_quantity", `Quantity must be between 1 and 50 (${line.title}).`);
    if (!Number.isInteger(line.unitFils) || line.unitFils < 0) throw new RangeError(`unit price must be whole fils ≥ 0 (${line.title})`);
    return { ...line, lineFils: line.unitFils * line.qty, passCredits: 0, creditFils: 0, promoFils: 0, deskFils: 0 };
  });

  // 2. Pass credits: seats on session lines, grant by grant, line by line.
  const used = new Map<string, number>();
  const usedFils = new Map<string, number>();
  for (const grant of opts.credits) {
    let left = Math.max(0, Math.floor(grant.available));
    for (const line of lines) {
      if (left === 0) break;
      if (line.kind !== "session") continue;
      const take = Math.min(left, line.qty - line.passCredits);
      if (take <= 0) continue;
      line.passCredits += take;
      line.creditFils += take * line.unitFils;
      left -= take;
      used.set(grant.passPurchase, (used.get(grant.passPurchase) ?? 0) + take);
      usedFils.set(grant.passPurchase, (usedFils.get(grant.passPurchase) ?? 0) + take * line.unitFils);
    }
  }
  const afterCredits = () => lines.map((line) => line.lineFils - line.creditFils - line.promoFils - line.deskFils);

  // 3. One promo over the eligible lines, after credits.
  let promoResult: PriceResult["promo"];
  let promoRejected: RejectReason | undefined;
  if (opts.promo) {
    const promo = opts.promo;
    const remaining = afterCredits();
    const eligible = lines.map((line, i) => (promoEligible(line, promo) ? remaining[i] : 0));
    const eligibleTotal = eligible.reduce((sum, x) => sum + x, 0);
    const basketTotal = remaining.reduce((sum, x) => sum + x, 0);
    if (eligibleTotal <= 0) promoRejected = "not_applicable";
    else if (promo.minSpendFils && basketTotal < promo.minSpendFils) promoRejected = "min_spend";
    else {
      const discount =
        promo.type === "percent" ? Math.min(eligibleTotal, Math.round((eligibleTotal * Math.min(100, Math.max(0, promo.value))) / 100)) : Math.min(eligibleTotal, Math.max(0, promo.value));
      allocate(discount, eligible).forEach((part, i) => (lines[i].promoFils += part));
      promoResult = { promoCode: promo.id, code: promo.code, discountFils: discount };
    }
  }

  // 4. Desk: complimentary zeroes everything; an override brings the total down to the amount taken.
  let deskAdjustmentFils = 0;
  let complimentaryFils = 0;
  if (opts.desk?.method === "complimentary") {
    afterCredits().forEach((x, i) => (lines[i].deskFils += x));
    complimentaryFils = lines.reduce((sum, line) => sum + line.deskFils, 0);
  } else if (opts.desk && typeof opts.desk.amountFils === "number") {
    const target = opts.desk.amountFils;
    if (!Number.isInteger(target) || target < 0) throw new PricingError("desk_amount", "The amount taken must be whole fils ≥ 0.");
    // The override is a gross figure; with exclusive pricing compare it on the net basis the lines carry.
    const targetBasis = opts.pricesIncludeVat ? target : Math.round((target * 10_000) / (10_000 + rate));
    const remaining = afterCredits();
    const current = remaining.reduce((sum, x) => sum + x, 0);
    if (targetBasis > current) throw new PricingError("desk_amount", "The amount taken cannot be more than the price. Record extras in the note.");
    deskAdjustmentFils = current - targetBasis;
    allocate(deskAdjustmentFils, remaining).forEach((part, i) => (lines[i].deskFils += part));
  }

  // 5. VAT per line, summed.
  const priced: PricedLine[] = lines.map((line) => {
    const charged = line.lineFils - line.creditFils - line.promoFils - line.deskFils;
    const split = vatSplit(charged, rate, opts.pricesIncludeVat);
    const { experience: _experience, ...rest } = line;
    void _experience;
    return { ...rest, ...split };
  });

  const sum = (pick: (line: PricedLine) => number) => priced.reduce((acc, line) => acc + pick(line), 0);
  const totals: Totals = {
    subtotalFils: sum((l) => l.lineFils),
    discountFils: sum((l) => l.creditFils + l.promoFils + l.deskFils),
    grossFils: sum((l) => l.grossFils),
    netFils: sum((l) => l.netFils),
    vatFils: sum((l) => l.vatFils),
    vatRateBps: rate,
    currency: CURRENCY,
  };

  const passRedemptions = [...used.entries()].filter(([, n]) => n > 0).map(([passPurchase, n]) => ({ passPurchase, n }));
  const applied: AppliedCode[] = [];
  for (const grant of opts.credits) {
    const n = used.get(grant.passPurchase) ?? 0;
    if (n > 0) applied.push({ code: grant.code, kind: "pass", purchase: grant.passPurchase, seatsCovered: n, discountFils: usedFils.get(grant.passPurchase) ?? 0 });
  }
  if (promoResult) applied.push({ code: promoResult.code, kind: "promo", discountFils: promoResult.discountFils });

  return { lines: priced, totals, passRedemptions, promo: promoResult, promoRejected, applied, deskAdjustmentFils, complimentaryFils };
}

/** Mamo refuses links under AED 2: an online basket that is neither free nor ≥ AED 2 cannot be paid. */
export function assertPayable(totals: Totals, channel: Channel): void {
  if (channel !== "online") return;
  if (totals.grossFils > 0 && totals.grossFils < MIN_PAYMENT_FILS) {
    throw new PricingError("below_minimum", "Online payments start at AED 2. Remove the code or add a seat, or book at the studio.");
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Database half                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

const idOf = (value: unknown): string | undefined =>
  typeof value === "string" ? value : value && typeof value === "object" && "id" in value ? String((value as { id: unknown }).id) : undefined;

const PASS_CODE = /^MPP-[A-Z0-9]{4,12}$/;

export const normaliseCode = (code: string): string => code.trim().toUpperCase().replace(/\s+/g, "");

async function vatSettings(req: PayloadRequest): Promise<{ vatRateBps: number; pricesIncludeVat: boolean }> {
  const settings = (await req.payload
    .findGlobal({ slug: "invoice-settings", depth: 0, overrideAccess: true, req })
    .catch(() => null)) as { vatRateBps?: number | null; pricesIncludeVat?: boolean | null } | null;
  const bps = settings?.vatRateBps;
  return {
    vatRateBps: typeof bps === "number" && Number.isInteger(bps) && bps >= 0 ? bps : DEFAULT_VAT_RATE_BPS,
    pricesIncludeVat: settings?.pricesIncludeVat !== false,
  };
}

/** Loads every line from the database. Drafts and unknown ids refuse the basket outright. */
async function loadLines(req: PayloadRequest, input: QuoteInput): Promise<PricingLine[]> {
  const out: PricingLine[] = [];
  for (const line of input.lines) {
    if (line.kind === "session") {
      const session = (await req.payload
        .findByID({ collection: "sessions", id: line.id, depth: 1, overrideAccess: true, disableErrors: true, req })
        .catch(() => null)) as (Session & { _status?: string }) | null;
      if (!session || session._status !== "published") throw new PricingError("session_unavailable", "One of the sessions in your basket is no longer available.");
      const venue = session.venue && typeof session.venue === "object" ? (session.venue as Venue) : null;
      out.push({
        kind: "session",
        session: session.id,
        experience: idOf(session.experience),
        title: (session.title || "Session").slice(0, 120),
        category: session.category ?? undefined,
        startsAt: session.startsAt,
        durationMinutes: session.durationMinutes,
        venueName: venue?.name ?? undefined,
        qty: line.qty,
        unitFils: session.priceFils,
      });
    } else {
      const pass = (await req.payload
        .findByID({ collection: "passes", id: line.id, depth: 0, overrideAccess: true, disableErrors: true, req })
        .catch(() => null)) as (Pass & { _status?: string }) | null;
      if (!pass || pass._status !== "published" || pass.sellable === false || typeof pass.priceFils !== "number") {
        throw new PricingError("pass_unavailable", "This pass is not on sale right now.");
      }
      out.push({ kind: "pass", pass: pass.id, title: pass.name.slice(0, 120), category: "Pass", qty: line.qty, unitFils: pass.priceFils });
    }
  }
  return out;
}

const live = (doc: { startsAt?: string | null; endsAt?: string | null }, now = Date.now()) =>
  (!doc.startsAt || new Date(doc.startsAt).getTime() <= now) && (!doc.endsAt || new Date(doc.endsAt).getTime() > now);

/** Looks up each code; returns usable grants / promo plus the rejections. */
async function resolveCodes(
  req: PayloadRequest,
  input: QuoteInput,
  hasSessionLines: boolean,
): Promise<{ grants: CreditGrant[]; promo?: PromoRule; rejected: Quote["rejectedCodes"] }> {
  const rejected: Quote["rejectedCodes"] = [];
  const grants: CreditGrant[] = [];
  let promo: PromoRule | undefined;
  const email = input.email?.trim().toLowerCase();
  const seen = new Set<string>();

  for (const raw of input.codes.slice(0, 3)) {
    const code = normaliseCode(raw);
    if (!code || seen.has(code)) continue;
    seen.add(code);

    if (PASS_CODE.test(code)) {
      const found = await req.payload.find({ collection: "pass-purchases", where: { code: { equals: code } }, depth: 1, limit: 1, overrideAccess: true, req });
      const purchase = found.docs[0] as PassPurchase | undefined;
      const ownerEmail = purchase && typeof purchase.customer === "object" ? purchase.customer.email?.toLowerCase() : undefined;
      // Online, the pass is the email's: a code typed by someone else is "invalid", not a free seat. The desk vouches in person.
      if (!purchase || (input.channel === "online" && (!email || ownerEmail !== email))) rejected.push({ code, reason: "invalid" });
      else if (purchase.status === "expired" || (purchase.expiresAt && new Date(purchase.expiresAt).getTime() <= Date.now())) rejected.push({ code, reason: "expired" });
      else if (purchase.status !== "active" || purchase.sessionsRemaining < 1) rejected.push({ code, reason: "exhausted" });
      else if (!hasSessionLines) rejected.push({ code, reason: "not_applicable" });
      else grants.push({ passPurchase: purchase.id, code, available: purchase.sessionsRemaining });
      continue;
    }

    if (promo) {
      rejected.push({ code, reason: "one_promo_only" });
      continue;
    }
    const found = await req.payload.find({ collection: "promo-codes", where: { code: { equals: code } }, depth: 0, limit: 1, overrideAccess: true, req });
    const doc = found.docs[0] as PromoCode | undefined;
    if (!doc || doc.active === false) rejected.push({ code, reason: "invalid" });
    else if (!live(doc)) rejected.push({ code, reason: "expired" });
    else if (typeof doc.maxUses === "number" && doc.uses >= doc.maxUses) rejected.push({ code, reason: "exhausted" });
    else
      promo = {
        id: doc.id,
        code: doc.code,
        type: doc.type,
        value: doc.value,
        appliesTo: doc.appliesTo,
        experiences: (doc.experiences ?? []).map(idOf).filter((x): x is string => Boolean(x)),
        sessions: (doc.sessions ?? []).map(idOf).filter((x): x is string => Boolean(x)),
        minSpendFils: doc.minSpendFils,
      };
  }
  return { grants, promo, rejected };
}

/* ── the atomic reservations (exported for the integration test) ── */

export const reservePassSql = (id: string, n: number) => sql`
  UPDATE pass_purchases
     SET sessions_remaining = sessions_remaining - ${n},
         status = CASE WHEN sessions_remaining - ${n} <= 0 THEN 'exhausted'::enum_pass_purchases_status ELSE status END,
         exhausted_at = CASE WHEN sessions_remaining - ${n} <= 0 THEN now() ELSE exhausted_at END,
         updated_at = now()
   WHERE id = ${id} AND status = 'active'
     AND (expires_at IS NULL OR expires_at > now())
     AND sessions_remaining >= ${n}
  RETURNING sessions_remaining`;

export const restorePassSql = (id: string, n: number) => sql`
  UPDATE pass_purchases
     SET sessions_remaining = sessions_remaining + ${n},
         status = CASE WHEN status = 'exhausted' THEN 'active'::enum_pass_purchases_status ELSE status END,
         exhausted_at = CASE WHEN status = 'exhausted' THEN NULL ELSE exhausted_at END,
         updated_at = now()
   WHERE id = ${id}
  RETURNING sessions_remaining`;

export const reservePromoSql = (id: string) => sql`
  UPDATE promo_codes SET uses = uses + 1, updated_at = now()
   WHERE id = ${id} AND active
     AND (max_uses IS NULL OR uses < max_uses)
     AND (starts_at IS NULL OR starts_at <= now())
     AND (ends_at IS NULL OR ends_at > now())
  RETURNING uses`;

export const restorePromoSql = (id: string) => sql`
  UPDATE promo_codes SET uses = greatest(0, uses - 1), updated_at = now() WHERE id = ${id} RETURNING uses`;

/** Gives back what `quote(…, { reserve: true })` took: credits per redemption, one promo use. */
export async function restoreReservations(
  req: PayloadRequest,
  input: { passRedemptions?: Array<{ passPurchase: string; n: number }>; promoCodeId?: string | null },
): Promise<void> {
  for (const r of input.passRedemptions ?? []) if (r.n > 0) await runSql(req, restorePassSql(r.passPurchase, r.n));
  if (input.promoCodeId) await runSql(req, restorePromoSql(input.promoCodeId));
}

/**
 * The contract's `quote()`. With `reserve`, must run inside the checkout's
 * transaction (cms/lib/orders.ts opens it); without, it is the read-only
 * re-price the basket page calls on every code typed.
 */
export async function quote(req: PayloadRequest, input: QuoteInput, opts?: { reserve: boolean }): Promise<DetailedQuote> {
  if (!Array.isArray(input.lines) || input.lines.length === 0) throw new PricingError("bad_quantity", "The basket is empty.");
  const [{ vatRateBps, pricesIncludeVat }, lines] = await Promise.all([vatSettings(req), loadLines(req, input)]);
  const resolved = await resolveCodes(req, input, lines.some((l) => l.kind === "session"));
  const rejectedCodes = [...resolved.rejected];
  let grants = resolved.grants;
  let promo = resolved.promo;

  // Up to three rounds: price, try to reserve, drop whatever lost its race, re-price.
  for (let round = 0; ; round += 1) {
    const priced = priceBasket(lines, { vatRateBps, pricesIncludeVat, credits: grants, promo, desk: input.desk });
    if (priced.promoRejected && promo) {
      rejectedCodes.push({ code: promo.code, reason: priced.promoRejected });
      promo = undefined;
      continue;
    }
    if (!opts?.reserve || round >= 3) return toQuote(priced, rejectedCodes);

    const lost: string[] = [];
    const taken: Array<{ passPurchase: string; n: number }> = [];
    for (const r of priced.passRedemptions) {
      const ok = (await runSql(req, reservePassSql(r.passPurchase, r.n))).length > 0;
      if (ok) taken.push(r);
      else lost.push(r.passPurchase);
    }
    let promoLost = false;
    if (priced.promo) promoLost = (await runSql(req, reservePromoSql(priced.promo.promoCode))).length === 0;
    if (lost.length === 0 && !promoLost) return toQuote(priced, rejectedCodes);

    // Undo this round's successful reservations, then re-price without the losers.
    await restoreReservations(req, { passRedemptions: taken, promoCodeId: priced.promo && !promoLost ? priced.promo.promoCode : null });
    for (const id of lost) {
      const grant = grants.find((g) => g.passPurchase === id);
      if (grant) rejectedCodes.push({ code: grant.code, reason: "exhausted" });
    }
    grants = grants.filter((g) => !lost.includes(g.passPurchase));
    if (promoLost && promo) {
      rejectedCodes.push({ code: promo.code, reason: "exhausted" });
      promo = undefined;
    }
  }
}

function toQuote(priced: PriceResult, rejectedCodes: Quote["rejectedCodes"]): DetailedQuote {
  const lines: OrderLine[] = priced.lines.map(({ creditFils: _c, promoFils: _p, deskFils: _d, grossFils: _g, netFils: _n, vatFils: _v, ...line }) => {
    void [_c, _p, _d, _g, _n, _v];
    return line;
  });
  return {
    lines,
    totals: priced.totals,
    passRedemptions: priced.passRedemptions,
    promo: priced.promo,
    rejectedCodes,
    pricedLines: priced.lines,
    applied: priced.applied,
    deskAdjustmentFils: priced.deskAdjustmentFils,
    complimentaryFils: priced.complimentaryFils,
  };
}
