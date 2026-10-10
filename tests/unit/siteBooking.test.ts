import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { displayStatus, parseOrderView } from "@/components/booking/orderView";
import { basketFingerprint, basketIdFor, readWaitlistToken, requestQuote, saveWaitlistToken, startCheckout, type CartLine } from "@/lib/cart";
import { sendEnquiry } from "@/lib/enquiry";

/**
 * 3F — the browser half of the booking journey (SPEC §H.3, §H.10, §H.11):
 * how the site reads the server's answers, and the basket bookkeeping that
 * decides whether a second Pay re-uses the first order. No database, no
 * server: `fetch` and `sessionStorage` are stubbed.
 */

const session = (slug: string, quantity: number): CartLine => ({
  kind: "session",
  slug,
  title: slug,
  category: "Craft",
  priceAmount: 240,
  priceCurrency: "AED",
  quantity,
  image: { src: "/x.jpg", alt: "" },
  startsAt: "2030-01-01T10:00:00+04:00",
  durationMinutes: 120,
  seatsAvailable: 8,
});

function stubStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    sessionStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
    location: { pathname: "/contact", search: "" },
  });
  return store;
}

function stubFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseOrderView", () => {
  it("reads 3B's flat customer view (lookup / status with k)", () => {
    const view = parseOrderView({
      status: "confirmed",
      holdExpiresAt: null,
      reference: "MP-SXVEK3",
      firstName: "Qa",
      lines: [{ kind: "session", title: "Candle Making", startsAt: "2026-10-11T11:30:00.000Z", durationMinutes: 120, qty: 2, lineFils: 48000 }],
      totals: { subtotalFils: 48000, discountFils: 0, grossFils: 48000, vatFils: 2286, currency: "AED" },
      tickets: [{ code: "MPT-ABCDEFGH", status: "valid", seatNo: null }],
      k: "123.abc",
    });
    expect(view?.reference).toBe("MP-SXVEK3");
    expect(view?.detail?.lines[0]).toMatchObject({ title: "Candle Making", qty: 2, lineFils: 48000 });
    expect(view?.detail?.paid).toBe(true);
    expect(view?.detail?.tickets[0]).toMatchObject({ code: "MPT-ABCDEFGH", seatNo: 1, pdfUrl: undefined });
  });

  it("reads the minimal status (no k) with the reference supplied by the caller", () => {
    const view = parseOrderView({ status: "awaiting_payment", holdExpiresAt: "2030-01-01T00:00:00Z" }, "MP-AAAAAA");
    expect(view).toEqual({ reference: "MP-AAAAAA", status: "awaiting_payment", holdExpiresAt: "2030-01-01T00:00:00Z" });
    expect(view?.detail).toBeUndefined();
  });

  it("refuses unknown states and never follows an off-site download link", () => {
    expect(parseOrderView({ reference: "MP-AAAAAA", status: "paid" })).toBeNull();
    const view = parseOrderView({
      reference: "MP-AAAAAA",
      status: "confirmed",
      detail: {
        lines: [],
        totals: {},
        tickets: [{ code: "MPT-1", status: "valid", seatNo: 1, pdfUrl: "https://evil.example/x.pdf" }],
        invoice: { number: "MP-INV-2026-000001", pdfUrl: "javascript:alert(1)" },
      },
    });
    expect(view?.detail?.tickets[0].pdfUrl).toBeUndefined();
    expect(view?.detail?.invoice?.pdfUrl).toBeUndefined();
  });

  it("maps the machine's nine states to the six a customer is told", () => {
    expect(displayStatus("pending_payment")).toBe("processing");
    expect(displayStatus("awaiting_payment")).toBe("processing");
    expect(displayStatus("confirming")).toBe("processing");
    expect(displayStatus("failed")).toBe("not_paid");
    expect(displayStatus("expired")).toBe("not_paid");
    expect(displayStatus("confirmed")).toBe("confirmed");
    expect(displayStatus("refunded")).toBe("refunded");
  });
});

describe("basketId (SPEC §H.3 basket reuse)", () => {
  beforeEach(() => {
    stubStorage();
  });

  it("is stable for the same basket — a second Pay re-uses the order", () => {
    const lines = [session("a", 2), session("b", 1)];
    const first = basketIdFor(lines);
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(basketIdFor([session("b", 1), session("a", 2)])).toBe(first);
  });

  it("rotates when the basket changes, so a changed basket is never paid as the old order", () => {
    const first = basketIdFor([session("a", 2)]);
    expect(basketIdFor([session("a", 3)])).not.toBe(first);
    expect(basketFingerprint([session("a", 2)])).not.toBe(basketFingerprint([session("a", 3)]));
  });

  it("carries a waitlist offer only for the session it was issued for", () => {
    saveWaitlistToken("a", "tok_ABCDEFGHIJ");
    expect(readWaitlistToken([session("a", 1)])).toBe("tok_ABCDEFGHIJ");
    expect(readWaitlistToken([session("b", 1)])).toBeUndefined();
  });
});

describe("startCheckout outcomes", () => {
  const body = {
    basketId: "00000000-0000-4000-8000-000000000000",
    details: { firstName: "A", lastName: "B", email: "a@b.co", phone: "0501234567" },
    lines: [{ kind: "session" as const, id: "x", qty: 1 }],
    codes: [],
    consents: [],
  };

  it("redirects to the payment page", async () => {
    stubFetch(200, { reference: "MP-AAAAAA", paymentUrl: "http://localhost:3200/dev/mamo-mock/pay/L1", holdExpiresAt: "x" });
    await expect(startCheckout(body)).resolves.toMatchObject({ status: "redirect", reference: "MP-AAAAAA" });
  });

  it("refuses a payment URL with a non-http scheme", async () => {
    stubFetch(200, { reference: "MP-AAAAAA", paymentUrl: "javascript:alert(1)" });
    await expect(startCheckout(body)).resolves.toEqual({ status: "error" });
  });

  it("goes straight to the confirmation when nothing is owed", async () => {
    stubFetch(200, { reference: "MP-AAAAAA", paid: true, k: "1.sig" });
    await expect(startCheckout(body)).resolves.toEqual({ status: "paid", reference: "MP-AAAAAA", k: "1.sig" });
  });

  it.each([
    [409, { reason: "sold_out", available: 2 }, { status: "sold_out", available: 2 }],
    [503, { reason: "bookings_closed" }, { status: "closed" }],
    [503, { reason: "gateway_disabled" }, { status: "gateway_disabled" }],
    [503, { reason: "not_ready" }, { status: "gateway_disabled" }],
    [502, { reason: "payment_link_failed" }, { status: "payment_link_failed" }],
    [429, {}, { status: "rate_limited" }],
    [422, { reason: "amount_below_minimum", message: "Too small." }, { status: "invalid", message: "Too small." }],
  ])("maps %s %j", async (status, response, expected) => {
    stubFetch(status, response);
    await expect(startCheckout(body)).resolves.toMatchObject(expected);
  });
});

describe("requestQuote", () => {
  it("reads totals, rejected codes and pass credits from the server's quote", async () => {
    stubFetch(200, {
      lines: [{ passCredits: 1 }, { passCredits: 0 }],
      totals: { subtotalFils: 48000, discountFils: 24000, grossFils: 24000, vatFils: 1143 },
      promo: null,
      rejectedCodes: [{ code: "OLD", reason: "expired" }, { code: "X", reason: "nonsense" }],
    });
    const result = await requestQuote({ lines: [{ kind: "session", id: "x", qty: 2 }], codes: ["OLD"] });
    expect(result).toEqual({
      status: "ok",
      quote: {
        totals: { subtotalFils: 48000, discountFils: 24000, grossFils: 24000, vatFils: 1143 },
        rejectedCodes: [{ code: "OLD", reason: "expired" }],
        promo: undefined,
        passCredits: 1,
      },
    });
  });

  it("says codes cannot be checked when the route is absent", async () => {
    stubFetch(404, {});
    await expect(requestQuote({ lines: [], codes: ["A"] })).resolves.toEqual({ status: "unavailable" });
  });
});

describe("sendEnquiry", () => {
  const enquiry = { name: "A", email: "a@b.co", topic: "general" as const, message: "Hi", source: "contact" as const };

  beforeEach(() => {
    stubStorage();
  });

  it("is ok only when the server says the enquiry is stored", async () => {
    const fetchMock = stubFetch(200, { status: "ok" });
    await expect(sendEnquiry(enquiry)).resolves.toEqual({ status: "ok" });
    const sent = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(sent).toMatchObject({ source: "contact", page: "/contact" });
  });

  it.each([
    [503, { status: "disabled" }, { status: "disabled" }],
    [429, { status: "rate_limited" }, { status: "rate_limited" }],
    [400, { status: "invalid", field: "email", message: "Please check your email address." }, { status: "invalid", field: "email", message: "Please check your email address." }],
    [500, { status: "error" }, { status: "error" }],
    [200, { status: "something-else" }, { status: "error" }],
  ])("maps %s %j", async (status, response, expected) => {
    stubFetch(status, response);
    await expect(sendEnquiry(enquiry)).resolves.toEqual(expected);
  });

  it("reports a dropped connection as not sent", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    await expect(sendEnquiry(enquiry)).resolves.toEqual({ status: "error" });
  });
});
