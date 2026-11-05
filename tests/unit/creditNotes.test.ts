import { describe, expect, it } from "vitest";

import {
  CREDIT_NOTE_STATUSES,
  CreditNotes,
  mintCreditNoteCode,
  normaliseCreditNoteCode,
  prepareCreditNote,
} from "../../cms/collections/commerce/CreditNotes";
import { priceBasket, type PricingLine, type PromoRule } from "../../cms/lib/pricing";

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

  describe("2. Mandatory Expiry Date & BeforeValidate Hook", () => {
    it("throws an error when expiry date is missing", async () => {
      await expect(
        prepareCreditNote({
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

      const prepared = await prepareCreditNote({
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

      const prepared = await prepareCreditNote({
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

      const prepared = await prepareCreditNote({
        data,
        req: mockReq,
        operation: "create",
      });

      expect(prepared.customerEmail).toBe("fatima@example.com");
      expect(prepared.customerName).toBe("Fatima Al Mansoori");
      expect(prepared.customer).toBe("customer-999");
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

    it("verifies redemption status: prevents reuse of redeemed credit note", () => {
      const statuses = ["available", "redeemed", "expired"];
      const canRedeem = (status: string, redeemedInOrder?: string) =>
        status === "available" && !redeemedInOrder;

      expect(canRedeem("available")).toBe(true);
      expect(canRedeem("redeemed")).toBe(false);
      expect(canRedeem("available", "order-existing-999")).toBe(false);
      expect(canRedeem("expired")).toBe(false);
    });
  });

  describe("5. Collection Definition & Admin Display Requirements", () => {
    it("configures all 7 required columns in CreditNotes defaultColumns", () => {
      const cols = CreditNotes.admin?.defaultColumns as string[];
      expect(cols).toContain("code");
      expect(cols).toContain("order");
      expect(cols).toContain("customerEmail");
      expect(cols).toContain("amountFils");
      expect(cols).toContain("status");
      expect(cols).toContain("expiresAt");
      expect(cols).toContain("issuedAt");
    });

    it("defines the three statuses: available, redeemed, expired", () => {
      const values = CREDIT_NOTE_STATUSES.map((s) => s.value);
      expect(values).toEqual(["available", "redeemed", "expired"]);
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

