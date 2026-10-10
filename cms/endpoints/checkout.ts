import { APIError, type Endpoint, type PayloadRequest } from "payload";
import { z } from "zod";

import { quote } from "@/cms/lib/contracts";
import { lineSchema } from "@/cms/lib/mamo/schemas";

import { json, parseBody, requireRole } from "./requireRole";

/**
 * ==========================================================================
 * Checkout from the admin — pricing a desk booking before it is made
 * ==========================================================================
 *
 *   POST /actions/checkout/quote   admin, front-desk   { lines, codes, email?, desk? } → priced lines + totals
 *
 * The Create booking dialog (cms/components/orders/CreateBookingDialog.tsx,
 * 4B) shows the price, the VAT split and what a promo or pass code does
 * BEFORE the staff member presses Create — which itself goes to
 * `orders/manual` (admin-orders.ts, 3A-1) and runs the same `quote` with
 * `reserve: true`. Here it runs with `reserve: false`: asking reserves
 * nothing, and no seats are held.
 *
 * `desk.amountFils` (charging something other than the quoted price) is an
 * ADMIN-only override (SPEC §H.3 "Desk bookings"); from front-desk it is
 * refused rather than silently dropped, so the dialog cannot show a price
 * the booking will not use.
 */

const quoteBody = z.object({
  lines: z.array(lineSchema).min(1).max(20),
  codes: z.array(z.string().trim().min(1).max(40)).max(3).default([]),
  email: z.string().trim().toLowerCase().email().max(200).optional(),
  desk: z
    .object({
      method: z.enum(["cash", "card_terminal", "complimentary", "bank_transfer"]),
      amountFils: z.number().int().min(0).max(100_000_000).optional(),
    })
    .optional(),
});

async function deskQuote(req: PayloadRequest): Promise<Response> {
  requireRole(req, ["admin", "front-desk"]);
  const body = await parseBody(req, quoteBody);
  if (body.desk?.amountFils !== undefined && req.user.role !== "admin") {
    throw new APIError("Only an admin can change the amount charged at the desk.", 403, undefined, true);
  }
  const result = await quote(req, { lines: body.lines, codes: body.codes, email: body.email, channel: "desk", desk: body.desk }, { reserve: false });
  return json({ ok: true, ...result });
}

export const checkoutEndpoints: Endpoint[] = [{ path: "/actions/checkout/quote", method: "post", handler: deskQuote }];
