import { describe, expect, it } from "vitest";

import { pollAction, statusPollUrl } from "../../components/booking/orderView";
import { minimalStatus } from "../../cms/lib/mamo/orderView";
import type { Order } from "../../payload-types";

/**
 * The confirmation page's status poll (#216). It now asks without `k`, so
 * the route answers with `minimalStatus` — these tests feed that exact shape
 * through the client's decision, and pin the reply handling: only a 429
 * waits; every other non-OK reply still refreshes the server render.
 */

const ok = { ok: true, status: 200 };
const minimal = (status: Order["status"], expiresAt: string | null = null) =>
  minimalStatus({ status, hold: expiresAt ? { expiresAt } : undefined } as unknown as Order);

describe("statusPollUrl", () => {
  it("asks the status route without k", () => {
    expect(statusPollUrl("MP-AB12")).toBe("/api/site/orders/MP-AB12/status");
  });

  it("encodes the reference", () => {
    expect(statusPollUrl("A B/C")).toBe("/api/site/orders/A%20B%2FC/status");
  });
});

describe("pollAction", () => {
  it("does nothing while the state is the one on screen", () => {
    expect(pollAction(ok, minimal("confirming"), "MP-1", "confirming")).toBe("none");
  });

  it("refreshes when the minimal reply reports a new state", () => {
    expect(pollAction(ok, minimal("confirmed"), "MP-1", "confirming")).toBe("refresh");
    expect(pollAction(ok, minimal("failed", "2026-11-17T10:00:00.000Z"), "MP-1", "awaiting_payment")).toBe("refresh");
  });

  it("still understands the full (k) view, which carries its own reference", () => {
    const full = { ...minimal("confirmed"), reference: "MP-1", lines: [], totals: {}, tickets: [] };
    expect(pollAction(ok, full, "MP-1", "confirming")).toBe("refresh");
    expect(pollAction(ok, full, "MP-1", "confirmed")).toBe("none");
  });

  it("waits on 429 instead of refreshing", () => {
    expect(pollAction({ ok: false, status: 429 }, null, "MP-1", "confirming")).toBe("wait");
  });

  it.each([404, 500, 502, 503])("refreshes on any other non-OK reply (%i), as before", (status) => {
    expect(pollAction({ ok: false, status }, null, "MP-1", "confirming")).toBe("refresh");
  });

  it("ignores a reply it cannot read", () => {
    expect(pollAction(ok, null, "MP-1", "confirming")).toBe("none");
    expect(pollAction(ok, { status: "nonsense" }, "MP-1", "confirming")).toBe("none");
  });

  it("refreshes when nothing was on screen yet and a state arrives", () => {
    expect(pollAction(ok, minimal("confirming"), "MP-1", null)).toBe("refresh");
  });
});
