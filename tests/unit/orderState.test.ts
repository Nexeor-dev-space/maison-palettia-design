import { describe, expect, it } from "vitest";

import type { OrderStatus } from "../../cms/lib/contracts";
import { assertTransition, canTransition, InvalidTransition, ORDER_EDGES, STAMP_FOR } from "../../cms/lib/orderState";

/**
 * The §H.1 order machine (SPEC §K "orderState.transition edges — every
 * invalid edge throws"). Walks all 81 (from, to) pairs: the ones in the
 * table pass, every other one throws `InvalidTransition` — so a new edge is
 * a deliberate edit to this list, not an accident in the code.
 */

const STATES: OrderStatus[] = ["pending_payment", "awaiting_payment", "confirming", "confirmed", "completed", "failed", "expired", "cancelled", "refunded"];

const ALLOWED: Array<[OrderStatus, OrderStatus]> = [
  ["pending_payment", "awaiting_payment"],
  ["pending_payment", "confirming"],
  ["pending_payment", "failed"],
  ["pending_payment", "expired"],
  ["awaiting_payment", "confirming"],
  ["awaiting_payment", "failed"],
  ["awaiting_payment", "expired"],
  ["confirming", "confirmed"],
  ["confirming", "cancelled"],
  ["confirming", "refunded"],
  ["confirmed", "completed"],
  ["confirmed", "cancelled"],
  ["confirmed", "refunded"],
  ["completed", "refunded"],
  ["failed", "awaiting_payment"],
  ["failed", "confirming"],
  ["failed", "expired"],
  ["expired", "confirming"],
];

describe("order state machine", () => {
  it("knows every state", () => {
    expect(Object.keys(ORDER_EDGES).sort()).toEqual([...STATES].sort());
  });

  for (const from of STATES) {
    for (const to of STATES) {
      const allowed = ALLOWED.some(([a, b]) => a === from && b === to);
      it(`${from} → ${to} is ${allowed ? "allowed" : "refused"}`, () => {
        expect(canTransition(from, to)).toBe(allowed);
        if (allowed) expect(() => assertTransition(from, to)).not.toThrow();
        else expect(() => assertTransition(from, to)).toThrow(InvalidTransition);
      });
    }
  }

  it("cancelled and refunded are terminal", () => {
    expect(ORDER_EDGES.cancelled).toEqual([]);
    expect(ORDER_EDGES.refunded).toEqual([]);
  });

  it("an expired order can only come back through confirming (late capture), never straight to confirmed", () => {
    expect(canTransition("expired", "confirmed")).toBe(false);
    expect(canTransition("expired", "confirming")).toBe(true);
  });

  it("stamps the matching *At field", () => {
    expect(STAMP_FOR.confirmed).toBe("confirmedAt");
    expect(STAMP_FOR.cancelled).toBe("cancelledAt");
    expect(STAMP_FOR.expired).toBe("expiredAt");
    expect(STAMP_FOR.failed).toBeUndefined();
  });

  it("the refusal is a 409 with a readable message", () => {
    try {
      assertTransition("refunded", "confirmed");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidTransition);
      expect((error as InvalidTransition).status).toBe(409);
      expect((error as Error).message).toContain("refunded");
    }
  });
});
