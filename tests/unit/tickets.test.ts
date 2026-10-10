import { describe, expect, it } from "vitest";

import {
  checkInWindow,
  decideVerdict,
  dubaiDate,
  dubaiDayBounds,
  FORCEABLE,
  isDubaiDate,
  mintTicket,
  normaliseCode,
  parseQr,
  sigMatches,
} from "../../cms/lib/tickets";

/**
 * Tickets (SPEC §H.7, §K "ticket qrSig constant-time compare"): the pure
 * parts of cms/lib/tickets.ts — minting, parsing what a scanner or a person
 * hands us, the stored-signature compare, and the verdict table. The
 * database half (row lock, write, timeline) is covered by the check-in
 * integration test once the commerce migration exists.
 */

describe("mintTicket", () => {
  it("mints MPT- + 8 Crockford characters, a 22-char signature, and the mp1 payload", () => {
    const t = mintTicket();
    expect(t.code).toMatch(/^MPT-[0-9A-HJKMNP-TV-Z]{8}$/);
    expect(t.qrSig).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(t.qr).toBe(`mp1.${t.code}.${t.qrSig}`);
    expect(t.qr.length).toBeLessThanOrEqual(60); // tickets.qr maxLength
  });

  it("does not repeat over a few thousand mints", () => {
    const codes = new Set(Array.from({ length: 5000 }, () => mintTicket().code));
    expect(codes.size).toBe(5000);
  });

  it("does not depend on PAYLOAD_SECRET", () => {
    const saved = process.env.PAYLOAD_SECRET;
    delete process.env.PAYLOAD_SECRET;
    try {
      expect(() => mintTicket()).not.toThrow();
    } finally {
      if (saved !== undefined) process.env.PAYLOAD_SECRET = saved;
    }
  });
});

describe("normaliseCode", () => {
  it("forgives case, spaces, dashes and a missing prefix", () => {
    expect(normaliseCode("mpt-ab12cd34")).toBe("MPT-AB12CD34");
    expect(normaliseCode(" MPT AB12 CD34 ")).toBe("MPT-AB12CD34");
    expect(normaliseCode("ab12cd34")).toBe("MPT-AB12CD34");
  });

  it("reads Crockford look-alikes as digits", () => {
    expect(normaliseCode("MPT-OOIILL00")).toBe("MPT-00111100");
  });

  it("keeps an 8-character code that happens to start with MPT", () => {
    expect(normaliseCode("MPT12345")).toBe("MPT-MPT12345"); // M, P and T are Crockford characters
  });

  it("rejects anything that cannot be a code", () => {
    for (const bad of ["", "MPT-", "MPT-ABC", "MPT-ABCDEFGHI", "MPT-ABCDEFGU", "hello world", null, undefined]) {
      expect(normaliseCode(bad as string)).toBeNull();
    }
  });
});

describe("parseQr", () => {
  it("splits an mp1 payload", () => {
    const t = mintTicket();
    expect(parseQr(t.qr)).toEqual({ code: t.code, sig: t.qrSig });
  });

  it("treats a bare code as a code without signature", () => {
    expect(parseQr("MPT-AB12CD34")).toEqual({ code: "MPT-AB12CD34", sig: null });
  });

  it("refuses malformed mp1 payloads and junk", () => {
    expect(parseQr("mp1.MPT-AB12CD34")).toBeNull();
    expect(parseQr("mp1.MPT-AB12CD34.short")).toBeNull();
    expect(parseQr("mp1.MPT-AB12CD34.aaaaaaaaaaaaaaaaaaaaaa.extra")).toBeNull();
    expect(parseQr("https://example.com/")).toBeNull();
    expect(parseQr("x".repeat(500))).toBeNull();
  });
});

describe("sigMatches (constant-time compare of the stored signature)", () => {
  it("matches only the exact stored value", () => {
    const { qrSig } = mintTicket();
    expect(sigMatches(qrSig, qrSig)).toBe(true);
    expect(sigMatches(qrSig, `${qrSig.slice(0, 21)}${qrSig[21] === "A" ? "B" : "A"}`)).toBe(false);
    expect(sigMatches(qrSig, qrSig.slice(0, 10))).toBe(false);
    expect(sigMatches(qrSig, "")).toBe(false);
  });

  it("never matches when nothing is stored", () => {
    expect(sigMatches(null, "x")).toBe(false);
    expect(sigMatches("", "")).toBe(false);
  });
});

describe("decideVerdict", () => {
  const now = new Date("2026-10-10T10:00:00Z");
  const session = (minutesFromNow: number, window?: { beforeMinutes?: number; afterMinutes?: number }) => ({
    startsAt: new Date(now.getTime() + minutesFromNow * 60_000).toISOString(),
    checkInWindow: window,
  });

  it("ok inside the window", () => {
    expect(decideVerdict({ ticketStatus: "valid", orderStatus: "confirmed", session: session(20), now })).toBe("ok");
    expect(decideVerdict({ ticketStatus: "valid", orderStatus: "completed", session: session(-25), now })).toBe("ok");
  });

  it("wrong_day outside the default window (60 before, 30 after)", () => {
    expect(decideVerdict({ ticketStatus: "valid", orderStatus: "confirmed", session: session(61), now })).toBe("wrong_day");
    expect(decideVerdict({ ticketStatus: "valid", orderStatus: "confirmed", session: session(-31), now })).toBe("wrong_day");
    expect(decideVerdict({ ticketStatus: "valid", orderStatus: "confirmed", session: session(24 * 60), now })).toBe("wrong_day");
  });

  it("honours a session's own window", () => {
    expect(decideVerdict({ ticketStatus: "valid", orderStatus: "confirmed", session: session(100, { beforeMinutes: 120 }), now })).toBe("ok");
    expect(decideVerdict({ ticketStatus: "valid", orderStatus: "confirmed", session: session(-10, { afterMinutes: 5 }), now })).toBe("wrong_day");
  });

  it("dead tickets win over the clock and are never forceable", () => {
    expect(decideVerdict({ ticketStatus: "refunded", orderStatus: "confirmed", session: session(500), now })).toBe("refunded");
    expect(decideVerdict({ ticketStatus: "valid", orderStatus: "refunded", session: session(0), now })).toBe("refunded");
    expect(decideVerdict({ ticketStatus: "void", orderStatus: "confirmed", session: session(0), now })).toBe("void");
    expect(decideVerdict({ ticketStatus: "valid", orderStatus: "cancelled", session: session(0), now })).toBe("void");
    expect(decideVerdict({ ticketStatus: null, now })).toBe("not_found");
    for (const v of ["void", "refunded", "not_found"] as const) expect(FORCEABLE).not.toContain(v);
  });

  it("already checked in is reported before the clock", () => {
    expect(decideVerdict({ ticketStatus: "checked_in", orderStatus: "confirmed", session: session(500), now })).toBe("already_checked_in");
    expect(FORCEABLE).toEqual(expect.arrayContaining(["already_checked_in", "wrong_day"]));
  });
});

describe("Dubai day helpers", () => {
  it("formats the Dubai date, which runs four hours ahead of UTC", () => {
    expect(dubaiDate(new Date("2026-10-10T19:59:00Z"))).toBe("2026-10-10");
    expect(dubaiDate(new Date("2026-10-10T20:00:00Z"))).toBe("2026-10-11");
  });

  it("bounds a Dubai day in UTC", () => {
    expect(dubaiDayBounds("2026-10-11")).toEqual({ from: "2026-10-10T20:00:00.000Z", to: "2026-10-11T20:00:00.000Z" });
  });

  it("validates ?date=", () => {
    expect(isDubaiDate("2026-10-11")).toBe(true);
    expect(isDubaiDate("2026-13-40")).toBe(false);
    expect(isDubaiDate("tomorrow")).toBe(false);
    expect(isDubaiDate(undefined)).toBe(false);
  });

  it("window edges are inclusive", () => {
    const w = checkInWindow({ startsAt: "2026-10-10T10:00:00Z", checkInWindow: { beforeMinutes: 60, afterMinutes: 30 } });
    expect(w.opensAt.toISOString()).toBe("2026-10-10T09:00:00.000Z");
    expect(w.closesAt.toISOString()).toBe("2026-10-10T10:30:00.000Z");
  });
});
