import type { PayloadRequest } from "payload";

import type { Order, PaymentSetting } from "@/payload-types";

import { MIN_PAYMENT_FILS, toMamoAmount } from "../money";
import { publicUrl } from "../publicUrl";
import { readPaymentSettings } from "./index";
import { mintReturnK } from "./returnToken";
import type { CreateLinkInput, MamoLink, PaymentGateway } from "./types";

/**
 * ==========================================================================
 * Building a Mamo payment link for an order
 * ==========================================================================
 *
 * SPEC §H.3 step 5 fixes the body of `POST /links`; this is that body,
 * built in one place so the checkout (cms/lib/orders.ts `startCheckout`,
 * 3A-1), a retry on the same order and the admin's AED 2 test order all
 * send the same thing:
 *
 *   · `title`        "{titlePrefix} · {reference}", ≤ 50 (Mamo's limit) —
 *                    what the customer sees on Mamo's page and the card
 *                    statement shows;
 *   · `amount`       the order's gross in decimal AED (`toMamoAmount`),
 *                    refused under AED 2 here rather than by Mamo's 422;
 *   · `return_url`   /payment-success?ref&k — `k` from ./returnToken.ts;
 *   · `failure_return_url` /checkout?ref&payment=failed&k — the same order
 *                    is retried with a new link. `k` is ADDED to the
 *                    SPEC's failure URL: without it the status endpoint
 *                    returns only `{ status, holdExpiresAt }`, so the page
 *                    could not show Mamo's decline text (`/checkout` is a
 *                    no-referrer route, SPEC §A.4, like the success page);
 *   · `external_id`  the order REFERENCE and `custom_data` `{ orderId,
 *                    orderRef, mode }` — the webhook's three ways back to
 *                    the order (SPEC §H.5 step 6);
 *   · `capacity: 1`  one payment per link;
 *   · the prefill and the checkout options from Settings → Payments.
 *
 * Every URL is built on `publicUrl` (Site details → Advanced), never on a
 * request's Host header.
 */

export class AmountBelowMinimum extends Error {
  constructor(public grossFils: number) {
    super(`Online payments must be at least AED ${(MIN_PAYMENT_FILS / 100).toFixed(2)}.`);
    this.name = "AmountBelowMinimum";
  }
}

type OrderForLink = Pick<Order, "id" | "reference" | "contact" | "totals">;

export async function buildLinkInput(
  req: PayloadRequest,
  order: OrderForLink,
  mode: "test" | "live" | "mock",
  settings?: PaymentSetting,
): Promise<{ input: CreateLinkInput; k: string }> {
  const grossFils = Number(order.totals?.grossFils ?? 0);
  if (!Number.isInteger(grossFils) || grossFils < MIN_PAYMENT_FILS) throw new AmountBelowMinimum(grossFils);

  const s = settings ?? (await readPaymentSettings(req.payload));
  const checkout = s.checkout ?? {};
  const base = await publicUrl(req);
  const ref = encodeURIComponent(order.reference);
  const k = mintReturnK(order.reference);
  const prefix = (checkout.titlePrefix ?? "Maison Palettia").trim() || "Maison Palettia";

  const input: CreateLinkInput = {
    title: `${prefix} · ${order.reference}`.slice(0, 50),
    amount: toMamoAmount(grossFils),
    amount_currency: "AED",
    return_url: `${base}/payment-success?ref=${ref}&k=${encodeURIComponent(k)}`,
    failure_return_url: `${base}/checkout?ref=${ref}&payment=failed&k=${encodeURIComponent(k)}`,
    external_id: order.reference,
    custom_data: { orderId: order.id, orderRef: order.reference, mode },
    capacity: 1,
    first_name: order.contact?.firstName || undefined,
    last_name: order.contact?.lastName || undefined,
    email: order.contact?.email || undefined,
    payment_methods: checkout.paymentMethods?.length ? [...checkout.paymentMethods] : ["card", "wallet"],
    enable_tabby: checkout.enableTabby === true,
    send_customer_receipt: checkout.sendMamoReceipt === true,
    terms_and_conditions_url: checkout.requireTerms === false ? undefined : `${base}/policies`,
    // Inline links need the customer's names and email (research 02 §A3); without them fall back to the hosted page.
    link_type:
      checkout.linkType === "inline" && order.contact?.firstName && order.contact?.lastName && order.contact?.email
        ? "inline"
        : "standalone",
  };
  return { input, k };
}

/**
 * Builds the body and creates the link. Throws `AmountBelowMinimum` or the
 * gateway's `MamoApiError`; the caller decides what a failure does to the
 * order (SPEC §H.3: `failed`, hold kept, 502 with retry).
 */
export async function createPaymentLink(
  req: PayloadRequest,
  gateway: PaymentGateway,
  order: OrderForLink,
): Promise<{ link: MamoLink; k: string }> {
  const { input, k } = await buildLinkInput(req, order, gateway.mode);
  const link = await gateway.createLink(input);
  return { link, k };
}
