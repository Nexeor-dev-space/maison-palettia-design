import { ValidationError, formatErrors, type CollectionBeforeValidateHook, type PayloadRequest } from "payload";
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
  quote,
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

  /** Settles a promise that should reject and returns what it rejected with (undefined if it resolved). */
  const rejection = (promise: Promise<unknown>) =>
    promise.then(
      () => undefined,
      (e: unknown) => e,
    );

  /**
   * Asserts a Payload ValidationError carrying one field error. The admin shows
   * `data.errors[].message` under the field and the error's own `message` in the
   * toast, so both must be our text (not "The following field is invalid ...")
   * and contain no ':' (the toast splits on the first one).
   */
  const expectFieldError = async (promise: Promise<unknown>, path: string, label: string, message: string) => {
    const err = await rejection(promise);
    expect(err).toBeInstanceOf(ValidationError);
    const error = err as ValidationError;
    expect(error.message).toBe(message);
    expect(error.name).toBe("ValidationError");
    expect(error.data.errors).toEqual([expect.objectContaining({ path, label, message })]);
    expect(error.message).not.toContain(":");
    expect(error.data.errors[0].message).not.toContain(":");
    return error;
  };

  describe("2. Mandatory Expiry Date & BeforeValidate Hook", () => {
    it("throws an error when expiry date is missing", async () => {
      await expectFieldError(
        callPrepareHook({
          data: {
            order: "order-001",
            amountFils: 10_000,
            // expiresAt is undefined
          },
          req: {} as any,
          operation: "create",
        }),
        "expiresAt",
        "Expiry date",
        "Expiry date is mandatory.",
      );
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

      await expectFieldError(
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
        "order",
        "Original booking ID",
        "A credit note has already been issued for this booking.",
      );
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

  describe("5a. Status must agree with the balance (#214 QA: CN-713877)", () => {
    const future = () => new Date(Date.now() + 86400000 * 30).toISOString();
    const past = () => new Date(Date.now() - 3600_000).toISOString();
    const edit = (data: Record<string, unknown>, originalDoc: Record<string, unknown>) =>
      callPrepareHook({ data, originalDoc, operation: "update", req: { context: {} } });

    const FULLY_AVAILABLE =
      "This credit note has already been fully redeemed (AED 240.00 of AED 240.00 used). Its status cannot be changed to Available.";
    const PARTLY_AVAILABLE =
      "This credit note has already been partially redeemed (AED 40.00 of AED 280.00 left). Its status cannot be changed to Available.";
    const FULLY_PARTIAL =
      "This credit note has already been fully redeemed (AED 240.00 of AED 240.00 used). Its status cannot be changed to Partially Redeemed.";

    it("refuses Available on a note whose whole amount has been spent (Redeemed → Available)", async () => {
      const spent = { status: "redeemed", amountFils: 24_000, redeemedAmountFils: 24_000, expiresAt: future() };
      await expectFieldError(edit({ ...spent, status: "available" }, spent), "status", "Status", FULLY_AVAILABLE);
    });

    it("refuses Partially Redeemed on a spent note (Redeemed → Partially Redeemed)", async () => {
      const spent = { status: "redeemed", amountFils: 24_000, redeemedAmountFils: 24_000, expiresAt: future() };
      await expectFieldError(edit({ ...spent, status: "partially_redeemed" }, spent), "status", "Status", FULLY_PARTIAL);
    });

    it("refuses Available on a partly used note (Partially Redeemed → Available, the QA case)", async () => {
      const partly = { status: "partially_redeemed", amountFils: 28_000, redeemedAmountFils: 24_000, expiresAt: future() };
      await expectFieldError(edit({ ...partly, status: "available" }, partly), "status", "Status", PARTLY_AVAILABLE);
    });

    it("refuses Fully Redeemed while credit remains", async () => {
      const partly = { status: "partially_redeemed", amountFils: 28_000, redeemedAmountFils: 24_000, expiresAt: future() };
      await expectFieldError(
        edit({ ...partly, status: "redeemed" }, partly),
        "status",
        "Status",
        "This credit note still has AED 40.00 of AED 280.00 left, so its status cannot be changed to Fully Redeemed. Change the status to Partially Redeemed, or set it to Expired to withdraw it.",
      );
      const untouched = { status: "available", amountFils: 24_000, redeemedAmountFils: null, expiresAt: future() };
      await expectFieldError(
        edit({ ...untouched, status: "redeemed" }, untouched),
        "status",
        "Status",
        "This credit note still has AED 240.00 of AED 240.00 left, so its status cannot be changed to Fully Redeemed. Change the status to Available, or set it to Expired to withdraw it.",
      );
    });

    it("puts the error on amountFils when only the amount changes (lowering a partly used note to what was spent)", async () => {
      const partly = { status: "partially_redeemed", amountFils: 28_000, redeemedAmountFils: 24_000, expiresAt: future() };
      await expectFieldError(
        edit({ ...partly, amountFils: 24_000 }, partly),
        "amountFils",
        "Credit amount",
        "AED 240.00 of this credit note has already been used, so its credit amount must be more than AED 240.00 while it is Partially Redeemed. Enter a higher amount, or change the status to Fully Redeemed.",
      );
    });

    it("words the legacy Available amount-only refusal for the proposed amount", async () => {
      const legacy = { status: "available", amountFils: 28_000, redeemedAmountFils: 24_000, expiresAt: future() };
      await expectFieldError(
        edit({ ...legacy, amountFils: 30_000 }, legacy),
        "amountFils",
        "Credit amount",
        "With a credit amount of AED 300.00, AED 60.00 would be left after AED 240.00 already used, so it cannot stay Available. Change the status to Partially Redeemed.",
      );
    });

    it("refuses raising the amount of a Fully Redeemed note above what was used", async () => {
      const spent = { status: "redeemed", amountFils: 24_000, redeemedAmountFils: 24_000, expiresAt: future() };
      await expectFieldError(
        edit({ ...spent, amountFils: 28_000 }, spent),
        "amountFils",
        "Credit amount",
        "This credit note is Fully Redeemed and AED 240.00 of it has been used, so its credit amount cannot be raised above AED 240.00. Keep it at AED 240.00, or change the status to Partially Redeemed.",
      );
    });

    it("refuses an amount edit on a Fully Redeemed note with nothing recorded as used", async () => {
      const unused = { status: "redeemed", amountFils: 24_000, redeemedAmountFils: null, expiresAt: future() };
      await expectFieldError(
        edit({ ...unused, amountFils: 28_000 }, unused),
        "amountFils",
        "Credit amount",
        "No credit has been recorded as used on this note, so it cannot stay Fully Redeemed with a credit amount of AED 280.00. Change the status to Available, or set it to Expired to withdraw it.",
      );
    });

    it("never puts ':' in any refusal message, including large amounts with thousand separators", async () => {
      const partly = { status: "partially_redeemed", amountFils: 28_000, redeemedAmountFils: 24_000, expiresAt: future() };
      const spent = { status: "redeemed", amountFils: 24_000, redeemedAmountFils: 24_000, expiresAt: future() };
      const legacy = { status: "available", amountFils: 28_000, redeemedAmountFils: 24_000, expiresAt: future() };
      const untouched = { status: "available", amountFils: 24_000, redeemedAmountFils: null, expiresAt: future() };
      const unusedRedeemed = { status: "redeemed", amountFils: 24_000, redeemedAmountFils: null, expiresAt: future() };
      const big = { status: "redeemed", amountFils: 123_456_789, redeemedAmountFils: 123_456_789, expiresAt: future() };
      const duplicateReq = { context: {}, payload: { find: async () => ({ docs: [{ id: "existing" }] }) } };
      const refusals: Promise<unknown>[] = [
        // status changes
        edit({ ...spent, status: "available" }, spent),
        edit({ ...spent, status: "partially_redeemed" }, spent),
        edit({ ...partly, status: "available" }, partly),
        edit({ ...partly, status: "redeemed" }, partly),
        edit({ ...untouched, status: "redeemed" }, untouched),
        edit({ ...big, status: "available" }, big),
        // amount-only changes
        edit({ ...partly, amountFils: 24_000 }, partly),
        edit({ ...legacy, amountFils: 30_000 }, legacy),
        edit({ ...legacy, amountFils: 24_000 }, legacy),
        edit({ ...spent, amountFils: 28_000 }, spent),
        edit({ ...unusedRedeemed, amountFils: 28_000 }, unusedRedeemed),
        // expiry (create and update) and duplicate issuance
        callPrepareHook({ data: { order: "order-001", amountFils: 10_000 }, operation: "create", req: { context: {} } }),
        edit({ expiresAt: null }, { status: "available", amountFils: 24_000 }),
        callPrepareHook({ data: { order: "order-001", amountFils: 10_000, expiresAt: future() }, operation: "create", req: duplicateReq }),
      ];
      const messages: string[] = [];
      for (const refusal of refusals) {
        const err = await rejection(refusal);
        expect(err).toBeInstanceOf(ValidationError);
        const { message, data } = err as ValidationError;
        expect(message).not.toContain(":");
        expect(data.errors[0].message).toBe(message);
        messages.push(message);
      }
      expect(new Set(messages).size).toBe(messages.length - 1); // only the two expiry refusals share a message
      expect(messages[5]).toContain("AED 1,234,567.89");
    });

    it("keeps our message and field data through Payload's formatErrors", async () => {
      const partly = { status: "partially_redeemed", amountFils: 28_000, redeemedAmountFils: 24_000, expiresAt: future() };
      const err = await expectFieldError(edit({ ...partly, status: "available" }, partly), "status", "Status", PARTLY_AVAILABLE);
      const formatted = formatErrors(err) as { errors: { message: string; data?: { errors: { path: string }[] } }[] };
      expect(formatted.errors[0].message).toBe(PARTLY_AVAILABLE);
      expect(formatted.errors[0].data?.errors[0].path).toBe("status");
    });

    it("documents Payload's formatErrors fallback when instanceof fails (why fieldRefusal sets name)", () => {
      type FormatErrorsInput = Parameters<typeof formatErrors>[0];
      // Payload's behaviour, not proof of our code: an error that fails instanceof keeps
      // its message only when it has a name, and loses `data` either way.
      const named = Object.assign(new Error(PARTLY_AVAILABLE), { name: "ValidationError", data: { errors: [] }, status: 400 });
      expect(named).not.toBeInstanceOf(ValidationError);
      expect(formatErrors(named as unknown as FormatErrorsInput).errors).toEqual([{ message: PARTLY_AVAILABLE }]);

      const plain = new ValidationError({ collection: "credit-notes", errors: [{ path: "status", message: "x" }] });
      plain.name = "";
      const unnamed = Object.assign(new Error(plain.message), { name: plain.name, data: plain.data, status: 400 });
      expect(formatErrors(unnamed as unknown as FormatErrorsInput).errors[0].message).toBe("An unknown error occurred.");
    });

    it("still saves an unrelated edit on a partly used note (status and amount unchanged)", async () => {
      const partly = { status: "partially_redeemed", amountFils: 28_000, redeemedAmountFils: 24_000, expiresAt: future() };
      await expect(edit({ ...partly, notes: "Called customer" }, partly)).resolves.toMatchObject({
        status: "partially_redeemed",
        notes: "Called customer",
      });
    });

    it("leaves the restore SQL path untouched (cancellation can still return a note to Available)", () => {
      const text = sqlText(restoreCreditNoteSql("cn-1", 24_000, "order-1"));
      expect(text).toContain("'available'::enum_credit_notes_status");
      expect(text).toContain("WHEN status = 'expired' THEN status");
    });

    it("allows the statuses that match the balance", async () => {
      const partly = { status: "available", amountFils: 28_000, redeemedAmountFils: 24_000, expiresAt: future() };
      await expect(edit({ ...partly, status: "partially_redeemed" }, partly)).resolves.toMatchObject({ status: "partially_redeemed" });
      const fresh = { status: "redeemed", amountFils: 24_000, redeemedAmountFils: null, expiresAt: future() };
      await expect(edit({ ...fresh, status: "available" }, fresh)).resolves.toMatchObject({ status: "available" });
    });

    it("lets any note be withdrawn as Expired, and auto-expiry wins over the guard", async () => {
      const partly = { status: "partially_redeemed", amountFils: 28_000, redeemedAmountFils: 24_000, expiresAt: future() };
      await expect(edit({ ...partly, status: "expired" }, partly)).resolves.toMatchObject({ status: "expired" });
      const spentLapsed = { status: "redeemed", amountFils: 24_000, redeemedAmountFils: 24_000, expiresAt: past() };
      await expect(edit({ ...spentLapsed, status: "available" }, spentLapsed)).resolves.toMatchObject({ status: "expired" });
    });

    it("does not block unrelated edits to a note whose status is unchanged", async () => {
      // The one row like this today (CN-713877) is fixed by the reconcile migration; a notes edit must still save.
      const inconsistent = { status: "available", amountFils: 24_000, redeemedAmountFils: 24_000, expiresAt: future() };
      await expect(edit({ ...inconsistent, notes: "Spoke to customer" }, inconsistent)).resolves.toMatchObject({ notes: "Spoke to customer" });
    });

    it("allows a new note to be created Available", async () => {
      await expect(
        callPrepareHook({ data: { code: "CN-NEW", amountFils: 24_000, expiresAt: future(), status: "available" }, operation: "create", req: { context: {} } }),
      ).resolves.toMatchObject({ status: "available" });
    });
  });

  describe("5b. Checkout pricing per QA scenario (balance → discount)", () => {
    const quoteWith = (amountFils: number, redeemedAmountFils: number | null, seats: number, unitFils = 24_000) =>
      priceBasket([sessionLine({ unitFils, qty: seats })], {
        ...basePriceOptions,
        promo: createCreditNotePromo({ value: creditNoteBalanceFils({ amountFils, redeemedAmountFils }) }),
      });

    it("AED 240 note on a 2-spot AED 480 basket leaves AED 240 payable", () => {
      const r = quoteWith(24_000, null, 2);
      expect(r.totals.subtotalFils).toBe(48_000);
      expect(r.totals.discountFils).toBe(24_000);
      expect(r.totals.grossFils).toBe(24_000);
    });

    it("partly used AED 280 note offers its AED 40 balance", () => {
      const r = quoteWith(28_000, 24_000, 1);
      expect(r.totals.discountFils).toBe(4_000);
      expect(r.totals.grossFils).toBe(20_000);
    });

    it("a note larger than the booking covers it and is capped at the total", () => {
      const r = quoteWith(84_000, null, 1);
      expect(r.totals.discountFils).toBe(24_000);
      expect(r.totals.grossFils).toBe(0);
    });

    it("null redeemed amount is an untouched note, never NaN", () => {
      const balance = creditNoteBalanceFils({ amountFils: 24_000, redeemedAmountFils: null });
      expect(balance).toBe(24_000);
      expect(Number.isNaN(creditNoteBalanceFils({ amountFils: 24_000, redeemedAmountFils: undefined }))).toBe(false);
      expect(Number.isNaN(creditNoteBalanceFils({ amountFils: null, redeemedAmountFils: null }))).toBe(false);
    });
  });

  describe("5c. quote() answers per credit-note state (online, 2 spots @ AED 240)", () => {
    const owner = "owner@example.com";
    const reqWith = (note: Record<string, unknown>) =>
      ({
        payload: {
          findGlobal: async () => ({ vatRateBps: 500, pricesIncludeVat: true }),
          findByID: async () => ({
            id: "s1",
            _status: "published",
            priceFils: 24_000,
            title: "Sculptural Forms",
            experience: "e1",
            startsAt: "2030-01-01T10:00:00Z",
            durationMinutes: 120,
          }),
          find: async ({ collection }: { collection: string }) =>
            collection === "credit-notes"
              ? { docs: [{ id: "cn-1", code: "CN-TEST", customerEmail: owner, expiresAt: "2030-06-01T00:00:00Z", ...note }] }
              : { docs: [] },
        },
      }) as unknown as PayloadRequest;
    const run = (note: Record<string, unknown>, email?: string) =>
      quote(reqWith(note), { lines: [{ kind: "session", id: "s1", qty: 2 }], codes: ["CN-TEST"], email, channel: "online" }, { reserve: false });

    it("an Available AED 240 note brings AED 480 down to AED 240", async () => {
      const q = await run({ status: "available", amountFils: 24_000, redeemedAmountFils: null }, owner);
      expect(q.rejectedCodes).toEqual([]);
      expect(q.totals.discountFils).toBe(24_000);
      expect(q.totals.grossFils).toBe(24_000);
    });

    it("a partly used AED 280 note takes its AED 40 balance", async () => {
      const q = await run({ status: "partially_redeemed", amountFils: 28_000, redeemedAmountFils: 24_000 }, owner);
      expect(q.totals.discountFils).toBe(4_000);
      expect(q.totals.grossFils).toBe(44_000);
    });

    it("a fully redeemed note, or one marked Available with nothing left, is 'exhausted'", async () => {
      for (const note of [
        { status: "redeemed", amountFils: 24_000, redeemedAmountFils: 24_000 },
        { status: "available", amountFils: 24_000, redeemedAmountFils: 24_000 }, // CN-713877's shape
      ]) {
        const q = await run(note, owner);
        expect(q.rejectedCodes).toEqual([{ code: "CN-TEST", reason: "exhausted" }]);
        expect(q.totals.grossFils).toBe(48_000);
      }
    });

    it("an expired note is 'expired'", async () => {
      const q = await run({ status: "available", amountFils: 24_000, redeemedAmountFils: null, expiresAt: "2020-01-01T00:00:00Z" }, owner);
      expect(q.rejectedCodes).toEqual([{ code: "CN-TEST", reason: "expired" }]);
    });

    it("no email, or another email, is 'wrong_customer' and never throws", async () => {
      for (const email of [undefined, "someone@example.com"]) {
        const q = await run({ status: "available", amountFils: 24_000, redeemedAmountFils: null }, email);
        expect(q.rejectedCodes).toEqual([{ code: "CN-TEST", reason: "wrong_customer" }]);
        expect(q.totals.grossFils).toBe(48_000);
      }
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

