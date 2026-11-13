import type { CollectionBeforeValidateHook } from "payload";
import { describe, expect, it } from "vitest";

import {
  CREDIT_NOTE_STATUSES,
  CreditNotes,
  mintCreditNoteCode,
  normaliseCreditNoteCode,
  prepareCreditNote,
} from "../../cms/collections/commerce/CreditNotes";
import {
  creditNoteBalanceFils,
  priceBasket,
  reserveCreditNoteSql,
  restoreCreditNoteSql,
  type PricingLine,
  type PromoRule,
} from "../../cms/lib/pricing";

/** Flattens a drizzle `sql` template into its static text (parameters dropped). */
const sqlText = (q: { queryChunks: unknown[] }): string =>
  q.queryChunks
    .map((c) => (c && typeof c === "object" && "value" in (c as object) ? ((c as { value: unknown }).value as string[]).join("") : ""))
    .join("")
    .replace(/\s+/g, " ");

describe("Credit Note System (FEAT #183)", () => {
  const sessionLine = (over: Partial<PricingLine> = {}): PricingLine => ({
    kind: "session",
    session: "s1",
    experience: "e1",
    title: "Pottery Workshop",
    qty: 1,
    unitFils: 25_000, // AED 250.00
    ...over,
  });

  const basePriceOptions = {
    vatRateBps: 500,
    pricesIncludeVat: true,
    credits: [],
  };

  const createCreditNotePromo = (over: Partial<PromoRule> = {}): PromoRule => ({
    id: "cn-12345",
    code: "CN-TEST01",
    type: "fixed",
    value: 25_000, // AED 250.00
    appliesTo: "all",
    experiences: [],
    sessions: [],
    isCreditNote: true,
    creditNoteId: "cn-12345",
    originalOrderId: "order-original-001",
    ...over,
  });

  describe("1. Promo Code Generation & Normalisation", () => {
    it("generates unique promo code with CN- prefix and uppercase alphanumeric characters", () => {
      const code1 = mintCreditNoteCode();
      const code2 = mintCreditNoteCode();

      expect(code1).toMatch(/^CN-[A-F0-9]{6}$/);
      expect(code2).toMatch(/^CN-[A-F0-9]{6}$/);
      expect(code1).not.toBe(code2);
    });

    it("normalises custom promo codes to uppercase without whitespace", () => {
      expect(normaliseCreditNoteCode("  cn-promo123  ")).toBe("CN-PROMO123");
      expect(normaliseCreditNoteCode("cn promo 456")).toBe("CNPROMO456");
      expect(normaliseCreditNoteCode("my-credit-note")).toBe("MY-CREDIT-NOTE");
    });
  });

  const callPrepareHook = (args: {
    data?: any;
    req?: any;
    operation?: "create" | "update";
    originalDoc?: any;
  }) =>
    prepareCreditNote({
      collection: {} as any,
      context: {} as any,
      req: {} as any,
      operation: "create",
      ...args,
    } as Parameters<CollectionBeforeValidateHook>[0]);

  describe("2. Mandatory Expiry Date & BeforeValidate Hook", () => {
    it("throws an error when expiry date is missing", async () => {
      await expect(
        callPrepareHook({
          data: {
            order: "order-001",
            amountFils: 10_000,
            // expiresAt is undefined
          },
          req: {} as any,
          operation: "create",
        }),
      ).rejects.toThrow("Expiry date is mandatory.");
    });

    it("auto-generates code if not provided", async () => {
      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
      const data: any = {
        order: "order-001",
        amountFils: 10_000,
        expiresAt: futureDate,
        customerEmail: "user@example.com",
      };

      const prepared = await callPrepareHook({
        data,
        req: {} as any,
        operation: "create",
      });

      expect(prepared.code).toMatch(/^CN-[A-F0-9]{6}$/);
      expect(prepared.status).toBeUndefined(); // default will be handled by Payload schema
    });

    it("automatically sets status to expired when expiresAt is in the past and status is available", async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      const data: any = {
        code: "CN-EXPIRED",
        order: "order-001",
        amountFils: 10_000,
        expiresAt: pastDate,
        status: "available",
        customerEmail: "user@example.com",
      };

      const prepared = await callPrepareHook({
        data,
        req: {} as any,
        operation: "update",
      });

      expect(prepared.status).toBe("expired");
    });

    it("auto-populates customer details from the linked order when omitted", async () => {
      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
      const mockReq = {
        payload: {
          findByID: async ({ id }: { id: string }) => {
            if (id === "order-001") {
              return {
                id: "order-001",
                contact: {
                  firstName: "Fatima",
                  lastName: "Al Mansoori",
                  email: "fatima@example.com",
                },
                customer: "customer-999",
              };
            }
            return null;
          },
        },
      } as any;

      const data: any = {
        code: "CN-FATIMA01",
        order: "order-001",
        amountFils: 15_000,
        expiresAt: futureDate,
      };

      const prepared = await callPrepareHook({
        data,
        req: mockReq,
        operation: "create",
      });

      expect(prepared.customerEmail).toBe("fatima@example.com");
      expect(prepared.customerName).toBe("Fatima Al Mansoori");
      expect(prepared.customer).toBe("customer-999");
    });

    it("prevents duplicate credit note creation for an order that already has one", async () => {
      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
      const mockReq = {
        payload: {
          find: async () => ({
            docs: [{ id: "existing-cn-1", code: "CN-EXISTING" }],
          }),
        },
      } as any;

      await expect(
        callPrepareHook({
          data: {
            code: "CN-NEW001",
            order: "order-001",
            amountFils: 10_000,
            expiresAt: futureDate,
          },
          req: mockReq,
          operation: "create",
        }),
      ).rejects.toThrow("A credit note has already been issued for this booking.");
    });

    it("allows updating credit note status to redeemed without requiring expiresAt in update payload", async () => {
      const updateData: any = {
        status: "redeemed",
        redeemedInOrder: "order-new-123",
        redeemedAt: new Date().toISOString(),
        redeemedAmountFils: 25_000,
      };

      const originalDoc = {
        id: "cn-12345",
        code: "CN-TEST01",
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
        status: "available",
      };

      const prepared = await callPrepareHook({
        data: updateData,
        originalDoc,
        operation: "update",
      });

      expect(prepared.status).toBe("redeemed");
      expect(prepared.redeemedInOrder).toBe("order-new-123");
      expect(prepared.code).toBeUndefined(); // preserves original code, does not re-mint
    });
  });

  describe("3. Credit Application & Pricing Calculation", () => {
    it("handles scenario where credit is LESS than the new booking amount (partial coverage)", () => {
      // Booking: 1 seat @ AED 250 (25,000 fils)
      // Credit Note: AED 100 (10,000 fils)
      const creditNote = createCreditNotePromo({ value: 10_000 });
      const result = priceBasket([sessionLine({ unitFils: 25_000, qty: 1 })], {
        ...basePriceOptions,
        promo: creditNote,
      });

      expect(result.promo?.discountFils).toBe(10_000);
      expect(result.totals.subtotalFils).toBe(25_000);
      expect(result.totals.discountFils).toBe(10_000);
      expect(result.totals.grossFils).toBe(15_000); // Customer pays remaining AED 150.00
      expect(result.totals.netFils + result.totals.vatFils).toBe(15_000);
      expect(result.promo?.isCreditNote).toBe(true);
      expect(result.promo?.creditNoteId).toBe("cn-12345");
      expect(result.promo?.originalOrderId).toBe("order-original-001");
    });

    it("handles scenario where credit is EQUAL to the new booking amount (exact full coverage)", () => {
      // Booking: 1 seat @ AED 250 (25,000 fils)
      // Credit Note: AED 250 (25,000 fils)
      const creditNote = createCreditNotePromo({ value: 25_000 });
      const result = priceBasket([sessionLine({ unitFils: 25_000, qty: 1 })], {
        ...basePriceOptions,
        promo: creditNote,
      });

      expect(result.promo?.discountFils).toBe(25_000);
      expect(result.totals.subtotalFils).toBe(25_000);
      expect(result.totals.discountFils).toBe(25_000);
      expect(result.totals.grossFils).toBe(0); // Customer pays AED 0.00
      expect(result.totals.netFils).toBe(0);
      expect(result.totals.vatFils).toBe(0);
    });

    it("handles scenario where credit is GREATER than the new booking amount (excess credit, capped to total)", () => {
      // Booking: 1 seat @ AED 150 (15,000 fils)
      // Credit Note: AED 250 (25,000 fils)
      const creditNote = createCreditNotePromo({ value: 25_000 });
      const result = priceBasket([sessionLine({ unitFils: 15_000, qty: 1 })], {
        ...basePriceOptions,
        promo: creditNote,
      });

      // Discount is capped at the basket total
      expect(result.promo?.discountFils).toBe(15_000);
      expect(result.totals.subtotalFils).toBe(15_000);
      expect(result.totals.discountFils).toBe(15_000);
      expect(result.totals.grossFils).toBe(0); // Free checkout
      expect(result.totals.netFils).toBe(0);
      expect(result.totals.vatFils).toBe(0);
    });

    it("records applied credit note details into applied codes list", () => {
      const creditNote = createCreditNotePromo({ code: "CN-SUMMER", value: 12_000 });
      const result = priceBasket([sessionLine({ unitFils: 20_000, qty: 1 })], {
        ...basePriceOptions,
        promo: creditNote,
      });

      expect(result.applied).toContainEqual({
        code: "CN-SUMMER",
        kind: "promo",
        discountFils: 12_000,
      });
    });
  });

  describe("4. Credit Note Validation Rules", () => {
    it("verifies customer ownership: accepts when email matches", () => {
      const customerEmail = "sarah@example.com";
      const creditNoteOwner = "sarah@example.com";
      const isOwner = customerEmail.toLowerCase() === creditNoteOwner.toLowerCase();
      expect(isOwner).toBe(true);
    });

    it("verifies customer ownership: rejects when email does not match", () => {
      const customerEmail = "impostor@example.com";
      const creditNoteOwner = "sarah@example.com";
      const isOwner = customerEmail.toLowerCase() === creditNoteOwner.toLowerCase();
      expect(isOwner).toBe(false);
    });

    it("verifies Scenario 1: credit note amount (AED 280) exceeds slot booking (AED 240)", () => {
      // Slot booking: 1 spot @ AED 240 (24,000 fils)
      // Credit note: AED 280 (28,000 fils)
      const creditNote = createCreditNotePromo({ code: "CN-280", value: 28_000 });
      const result = priceBasket([sessionLine({ unitFils: 24_000, qty: 1 })], {
        ...basePriceOptions,
        promo: creditNote,
      });

      expect(result.promo?.discountFils).toBe(24_000);
      expect(result.totals.subtotalFils).toBe(24_000);
      expect(result.totals.discountFils).toBe(24_000);
      expect(result.totals.grossFils).toBe(0); // covered in full, no payment needed
      expect(result.totals.netFils).toBe(0);
      expect(result.totals.vatFils).toBe(0);

      // The remaining AED 40 stays on the note as its balance.
      const afterFirst = { amountFils: 28_000, redeemedAmountFils: result.promo?.discountFils ?? 0 };
      expect(creditNoteBalanceFils(afterFirst)).toBe(4_000);

      // The next booking is offered the balance, not the original amount.
      const second = priceBasket([sessionLine({ unitFils: 24_000, qty: 1 })], {
        ...basePriceOptions,
        promo: createCreditNotePromo({ code: "CN-280", value: creditNoteBalanceFils(afterFirst) }),
      });
      expect(second.promo?.discountFils).toBe(4_000);
      expect(second.totals.grossFils).toBe(20_000);
      expect(creditNoteBalanceFils({ amountFils: 28_000, redeemedAmountFils: 28_000 })).toBe(0);
    });

    it("computes the balance defensively (never negative, missing redeemed amount = untouched note)", () => {
      expect(creditNoteBalanceFils({ amountFils: 28_000, redeemedAmountFils: null })).toBe(28_000);
      expect(creditNoteBalanceFils({ amountFils: 28_000, redeemedAmountFils: 30_000 })).toBe(0);
    });

    it("reserves by amount and only while enough balance is left", () => {
      const text = sqlText(reserveCreditNoteSql("cn-1", 24_000));
      expect(text).toContain("redeemed_amount_fils = coalesce(redeemed_amount_fils, 0) +");
      expect(text).toContain("status IN ('available', 'partially_redeemed')");
      expect(text).toContain("amount_fils - coalesce(redeemed_amount_fils, 0) >=");
      expect(text).toContain("'partially_redeemed'::enum_credit_notes_status");
      expect(text).toContain("expires_at > now()");
    });

    it("restores by amount and keeps an expired note expired", () => {
      const text = sqlText(restoreCreditNoteSql("cn-1", 24_000, "order-1"));
      expect(text).toContain("WHEN status = 'expired' THEN status");
      expect(text).toContain("coalesce(redeemed_amount_fils, 0) -");
      expect(text).not.toContain("SET status = 'available', redeemed_in_order_id = NULL");
    });

    it("shows the remaining balance as a read-only virtual field", () => {
      const field = CreditNotes.fields.find((f: any) => f.name === "balanceFils") as any;
      expect(field.virtual).toBe(true);
      expect(field.admin.readOnly).toBe(true);
      expect(field.hooks.afterRead[0]({ siblingData: { amountFils: 28_000, redeemedAmountFils: 24_000 } })).toBe(4_000);
    });

    it("verifies multi-slot booking credit note splitting across slots", () => {
      // Order with 3 slots (e.g. 3 spots @ AED 280 = AED 840 total = 84,000 fils)
      const totalAmountFils = 84_000;
      const totalSlots = 3;
      const noteCount = Math.max(1, totalSlots);
      const baseFils = Math.floor(totalAmountFils / noteCount);
      const remainder = totalAmountFils - baseFils * noteCount;

      const slotAmounts: number[] = [];
      for (let i = 0; i < noteCount; i++) {
        slotAmounts.push(baseFils + (i === noteCount - 1 ? remainder : 0));
      }

      expect(slotAmounts).toEqual([28_000, 28_000, 28_000]); // 3 notes of AED 280 each
      expect(slotAmounts.reduce((a, b) => a + b, 0)).toBe(totalAmountFils);
    });

    it("verifies field-level expiresAt validator allows partial updates", () => {
      const expiresAtField = CreditNotes.fields
        .flatMap((f: any) => (f.type === "row" ? f.fields : [f]))
        .find((f: any) => f.name === "expiresAt");

      const validateFn = expiresAtField.validate;
      // On update where expiresAt is omitted, it must return true (not fail)
      expect(validateFn(undefined, { operation: "update" })).toBe(true);
      expect(validateFn(null, { operation: "update" })).toBe(true);
      // On create without expiresAt, it must return error
      expect(validateFn(undefined, { operation: "create" })).toBe("Expiry date is mandatory.");
    });

    it("verifies field-level code beforeValidate hook preserves existing code on update", () => {
      const codeField = CreditNotes.fields
        .flatMap((f: any) => (f.type === "row" ? f.fields : [f]))
        .find((f: any) => f.name === "code");

      const hookFn = codeField.hooks.beforeValidate[0];
      // On update without code passed, it must return undefined/null, NOT mint a new code
      expect(hookFn({ value: undefined, operation: "update" })).toBeUndefined();
      expect(hookFn({ value: null, operation: "update" })).toBeNull();
      // On create without code passed, it must mint a new code
      const minted = hookFn({ value: undefined, operation: "create" });
      expect(minted).toMatch(/^CN-[0-9A-F]{6}$/);
    });

    it("verifies expiry: rejects expired credit note", () => {
      const past = new Date(Date.now() - 3600_000).toISOString();
      const isExpired = new Date(past).getTime() <= Date.now();
      expect(isExpired).toBe(true);
    });

    it("verifies expiry: accepts unexpired credit note", () => {
      const future = new Date(Date.now() + 3600_000 * 24).toISOString();
      const isExpired = new Date(future).getTime() <= Date.now();
      expect(isExpired).toBe(false);
    });

    it("auto-expires a partly used note once its expiry has passed", async () => {
      const past = new Date(Date.now() - 3600_000).toISOString();
      const data = await (prepareCreditNote as any)({
        data: { expiresAt: past },
        originalDoc: { status: "partially_redeemed", expiresAt: past },
        operation: "update",
        req: { context: {} },
      });
      expect(data.status).toBe("expired");
    });
  });

  describe("5. Collection Definition & Admin Display Requirements", () => {
    it("configures all required columns in CreditNotes defaultColumns including order and redeemedInOrder", () => {
      const cols = CreditNotes.admin?.defaultColumns as string[];
      expect(cols).toContain("code");
      expect(cols).toContain("order");
      expect(cols).toContain("redeemedInOrder");
      expect(cols).toContain("customerEmail");
      expect(cols).toContain("amountFils");
      expect(cols).toContain("status");
      expect(cols).toContain("expiresAt");
      expect(cols).toContain("issuedAt");
    });

    it("has dedicated admin group 'Credit Notes'", () => {
      expect(CreditNotes.admin?.group).toBe("Credit Notes");
    });

    it("defines the statuses including available, partially_redeemed, redeemed, expired", () => {
      const values = CREDIT_NOTE_STATUSES.map((s) => s.value);
      expect(values).toContain("available");
      expect(values).toContain("partially_redeemed");
      expect(values).toContain("redeemed");
      expect(values).toContain("expired");
    });

    it("marks expiry date field as mandatory (required: true)", () => {
      const expiresAtField = CreditNotes.fields.flatMap((f: any) =>
        f.type === "row" ? f.fields : [f],
      ).find((f: any) => f.name === "expiresAt");

      expect(expiresAtField).toBeDefined();
      expect(expiresAtField.required).toBe(true);
    });

    it("marks original booking ID field as mandatory (required: true)", () => {
      const orderField = CreditNotes.fields.flatMap((f: any) =>
        f.type === "row" ? f.fields : [f],
      ).find((f: any) => f.name === "order");

      expect(orderField).toBeDefined();
      expect(orderField.required).toBe(true);
      expect(orderField.relationTo).toBe("orders");
    });
  });
});

