import os from "node:os";
import path from "node:path";
import fs from "node:fs";

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { MamoClient } from "@/cms/lib/mamo/client";
import { findExistingRefund, parseMamoDate, postRefundOnce } from "@/cms/lib/mamo/refunds";
import { mintReturnK, verifyReturnK } from "@/cms/lib/mamo/returnToken";
import { MamoApiError, redactWebhook, type MamoPayment, type PaymentGateway } from "@/cms/lib/mamo/types";

/**
 * The gateway pieces that need no database: the return-page `k`, the
 * refund look-before-you-post protocol, the HTTP client's retry/redaction
 * rules (SPEC §K contract row: envelopes, backoff, "MamoApiError carries no
 * headers"), and the mock gateway's Mamo-like behaviour.
 */

beforeAll(() => {
  process.env.PAYLOAD_SECRET ||= "unit-test-secret-not-for-production-0123456789";
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("return-page k (return-v1, 24 h)", () => {
  it("verifies for its own reference only", () => {
    const k = mintReturnK("MP-ABC234");
    expect(verifyReturnK("MP-ABC234", k)).toBe(true);
    expect(verifyReturnK("MP-ABC235", k)).toBe(false);
  });

  it("rejects tampering with the signature or the expiry", () => {
    const k = mintReturnK("MP-ABC234");
    const [exp, sig] = k.split(".");
    expect(verifyReturnK("MP-ABC234", `${Number(exp) + 60}.${sig}`)).toBe(false);
    const flipped = `${sig.slice(0, -1)}${sig.endsWith("A") ? "B" : "A"}`;
    expect(verifyReturnK("MP-ABC234", `${exp}.${flipped}`)).toBe(false);
    expect(verifyReturnK("MP-ABC234", "garbage")).toBe(false);
    expect(verifyReturnK("MP-ABC234", undefined)).toBe(false);
  });

  it("expires after 24 hours", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-10T08:00:00Z"));
    const k = mintReturnK("MP-ABC234");
    vi.setSystemTime(new Date("2026-10-11T07:59:00Z"));
    expect(verifyReturnK("MP-ABC234", k)).toBe(true);
    vi.setSystemTime(new Date("2026-10-11T08:00:01Z"));
    expect(verifyReturnK("MP-ABC234", k)).toBe(false);
  });
});

describe("refunds: look before you post (SPEC §H.7 b–c)", () => {
  const basePayment: MamoPayment = { id: "MPB-1", status: "captured", amount: 240, amount_currency: "AED", max_refund_amount: 240, refunds: [] };

  function fakeGateway(payment: MamoPayment) {
    const refund = vi.fn(async (_id: string, amount: number) => ({ refund_amount: amount, refund_status: "success" }));
    const gateway = { getPayment: vi.fn(async () => payment), refund } as unknown as PaymentGateway;
    return { gateway, refund };
  }

  it("parses Mamo's created_date", () => {
    expect(parseMamoDate("2026-10-10-14-38-53")).toBe(Date.UTC(2026, 9, 10, 14, 38, 53));
    expect(Number.isNaN(parseMamoDate("10/10/2026"))).toBe(true);
  });

  it("finds a refund Mamo already made for this request and does NOT post again", async () => {
    const requestedAt = new Date("2026-10-10T14:38:00Z");
    const payment = { ...basePayment, refunds: [{ id: "REFUND-9", amount: 100, created_date: "2026-10-10-14-38-30" }] };
    const { gateway, refund } = fakeGateway(payment);
    const result = await postRefundOnce(gateway, { providerPaymentId: "MPB-1", amountFils: 10_000, providerRequestAt: requestedAt });
    expect(result).toMatchObject({ kind: "already_posted", providerRefundId: "REFUND-9" });
    expect(refund).not.toHaveBeenCalled();
  });

  it("ignores an older refund of the same amount and posts exactly once", async () => {
    const payment = { ...basePayment, refunds: [{ id: "REFUND-OLD", amount: 100, created_date: "2026-10-09-10-00-00" }] };
    expect(findExistingRefund(payment, 10_000, new Date("2026-10-10T14:38:00Z"))).toBeNull();
    const { gateway, refund } = fakeGateway(payment);
    const result = await postRefundOnce(gateway, { providerPaymentId: "MPB-1", amountFils: 10_000, providerRequestAt: new Date("2026-10-10T14:38:00Z") });
    expect(result.kind).toBe("posted");
    expect(refund).toHaveBeenCalledTimes(1);
    expect(refund).toHaveBeenCalledWith("MPB-1", 100);
  });

  it("refuses over max_refund_amount and under AED 1 without posting", async () => {
    const { gateway, refund } = fakeGateway({ ...basePayment, max_refund_amount: 50 });
    await expect(postRefundOnce(gateway, { providerPaymentId: "MPB-1", amountFils: 6_000, providerRequestAt: new Date() })).rejects.toBeInstanceOf(MamoApiError);
    await expect(postRefundOnce(gateway, { providerPaymentId: "MPB-1", amountFils: 99, providerRequestAt: new Date() })).rejects.toBeInstanceOf(MamoApiError);
    expect(refund).not.toHaveBeenCalled();
  });
});

describe("MamoClient", () => {
  const KEY = "sk-test-SUPERSECRET-1234";

  it("retries a GET on 5xx and returns the second answer", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 500, error: "Internal Server Error" }), { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ business_name: "Studio" }), { status: 200 }));
    const me = await new MamoClient({ apiKey: KEY, mode: "test" }).me();
    expect(me.business_name).toBe("Studio");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://sandbox.dev.business.mamopay.com/manage_api/v1/me");
    expect((init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${KEY}`);
  });

  it("never retries a POST (no idempotency at Mamo) and maps the 422 envelope", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ messages: ["Can not refund this payment"], error_code: "UNPROCESSABLE ENTITY" }), { status: 422 }),
    );
    const error = await new MamoClient({ apiKey: KEY, mode: "live" }).refund("MPB-1", 10).catch((e: unknown) => e);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(error).toBeInstanceOf(MamoApiError);
    expect(error).toMatchObject({ status: 422, errorCode: "UNPROCESSABLE ENTITY", messages: ["Can not refund this payment"] });
    // The error carries nothing from the request.
    const dump = JSON.stringify({ ...(error as object), message: (error as Error).message, stack: (error as Error).stack });
    expect(dump).not.toContain(KEY);
    expect(dump).not.toContain("Bearer");
  });

  it("turns a network failure into status 0 without the request in the message", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError(`fetch failed for https://x/?key=${KEY}`));
    const error = (await new MamoClient({ apiKey: KEY, mode: "live" }).createLink({} as never).catch((e: unknown) => e)) as MamoApiError;
    expect(error.status).toBe(0);
    expect(error.errorCode).toBe("NETWORK");
    expect(error.message).not.toContain(KEY);
  });

  it("redacts auth_header on every webhook read and keeps the key out of JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: "MB-WH-1", url: "https://site/api/site/webhooks/mamo", enabled_events: ["payment.succeeded"], auth_header: "s3cr3t-in-clear" }]), { status: 200 }),
    );
    const client = new MamoClient({ apiKey: KEY, mode: "test" });
    const hooks = await client.listWebhooks();
    expect(hooks).toEqual([{ id: "MB-WH-1", url: "https://site/api/site/webhooks/mamo", enabled_events: ["payment.succeeded"], auth_header: "[set]" }]);
    expect(JSON.stringify(hooks)).not.toContain("s3cr3t");
    expect(JSON.stringify(client)).not.toContain(KEY);
    expect(redactWebhook({ id: "x", url: "u", auth_header: null }).auth_header).toBeNull();
  });
});

describe("MockMamoClient", () => {
  it("validates like Mamo, pays, lists charges, refunds with Mamo's ceilings", async () => {
    // The mock mirrors its state to <cwd>/private/dev — keep the repo's dev store out of it.
    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "mamo-mock-"));
    const cwd = vi.spyOn(process, "cwd").mockReturnValue(scratch);
    vi.resetModules();
    const mock = await import("@/cms/lib/mamo/mock");
    cwd.mockRestore();
    // The mock delivers `payment.refunded` to the webhook ~300 ms after a
    // refund; catch it here instead of letting it reach a running dev server.
    const delivered = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("ok", { status: 200 }));

    const gateway = new mock.MockMamoClient({ baseUrl: "http://localhost:3200" });
    await expect(gateway.createLink({ title: "x", amount: 1.5 } as never)).rejects.toMatchObject({ status: 422, errorCode: "VALIDATION_FAILED" });

    const link = await gateway.createLink({
      title: "Maison Palettia · MP-ABC234",
      amount: 240,
      amount_currency: "AED",
      return_url: "http://localhost:3200/payment-success?ref=MP-ABC234&k=1.x",
      failure_return_url: "http://localhost:3200/checkout?ref=MP-ABC234&payment=failed",
      external_id: "MP-ABC234",
      custom_data: { orderId: "o-1", orderRef: "MP-ABC234", mode: "mock" },
      capacity: 1,
      link_type: "standalone",
    });
    expect(link.payment_url).toBe(`http://localhost:3200/dev/mamo-mock/pay/${link.id}`);

    const declined = mock.completeMockPayment(link.id, "failed");
    expect(declined).toMatchObject({ status: "failed", error_code: "insufficient_funds" });
    const paid = mock.completeMockPayment(link.id, "captured");
    expect(paid).toMatchObject({ status: "captured", amount: 240, external_id: "MP-ABC234", payment_link_id: link.id });
    expect(() => mock.completeMockPayment(link.id, "captured")).toThrow(/no longer active/); // capacity 1

    const back = new URL(mock.returnUrlFor(mock.mockLink(link.id)!, paid));
    expect(back.pathname).toBe("/payment-success");
    expect(back.searchParams.get("status")).toBe("captured");
    expect(back.searchParams.get("transactionId")).toBe(paid.id);
    expect(back.searchParams.get("paymentLinkId")).toBe(link.id);

    expect((await gateway.getLink(link.id)).charges.map((c) => c.status).sort()).toEqual(["captured", "failed"]);

    await gateway.refund(paid.id, 100);
    await expect(gateway.refund(paid.id, 150)).rejects.toMatchObject({ status: 422 }); // over max_refund_amount
    await expect(gateway.refund(paid.id, 0.5)).rejects.toMatchObject({ status: 422 }); // under AED 1
    const after = await gateway.getPayment(paid.id);
    expect(after.refund_amount).toBe(100);
    expect(after.max_refund_amount).toBe(140);
    expect(after.refunds).toHaveLength(1);
    expect(fs.existsSync(path.join(scratch, "private", "dev", "mamo-mock.json"))).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 450));
    expect(delivered).toHaveBeenCalledTimes(1);
    const [url, init] = delivered.mock.calls[0];
    expect(String(url)).toBe("http://localhost:3200/api/site/webhooks/mamo");
    expect(JSON.parse(String(init?.body))).toMatchObject({ id: paid.id, event_type: "payment.refunded", status: "refunded" });
  });
});
