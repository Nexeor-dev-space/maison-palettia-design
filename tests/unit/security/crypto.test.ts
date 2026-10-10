import { afterEach, describe, expect, it, vi } from "vitest";

import { bootStatus, deriveKey, dubaiDay, ipHash, isSealed, MASK, open, seal, secretsKey, tryOpen } from "@/cms/lib/crypto";
import { clientIp } from "@/cms/lib/rateLimit";
import { makeSignedToken, parseSignedToken, sign, verifySig } from "@/cms/lib/signing";
import { routeFor } from "@/cms/lib/publicUrl";
import { sessionSlugFor } from "@/cms/hooks/sessionSlug";

/**
 * The secret-handling primitives (SPEC §C.2, §K unit row): `seal`/`open`
 * (AES-256-GCM under an HKDF key), the mask, the HMAC token family in
 * cms/lib/signing.ts, the daily analytics/IP hash, the last-hop client IP,
 * and the two address helpers every redirect and canonical goes through.
 *
 * A throwaway PAYLOAD_SECRET for this process only — nothing here reads the
 * owner's `.env`.
 */

process.env.PAYLOAD_SECRET ||= "unit-test-secret-not-used-anywhere-else-0123456789";

afterEach(() => {
  vi.useRealTimers();
});

describe("seal / open (AES-256-GCM, enc:v1:)", () => {
  it("round-trips, and two seals of the same text differ (random IV)", () => {
    const a = seal("sk_test_abc123");
    const b = seal("sk_test_abc123");
    expect(isSealed(a)).toBe(true);
    expect(a).not.toBe(b);
    expect(open(a)).toBe("sk_test_abc123");
    expect(open(b)).toBe("sk_test_abc123");
  });

  it("never contains the clear text, in any encoding", () => {
    const plain = "MAMO-LIVE-KEY-0123456789";
    const sealed = seal(plain);
    expect(sealed).not.toContain(plain);
    expect(sealed).not.toContain(Buffer.from(plain).toString("base64"));
    expect(sealed).not.toContain(Buffer.from(plain).toString("base64url"));
  });

  it("refuses a value with one byte flipped (the GCM tag fails)", () => {
    const sealed = seal("secret");
    const packed = Buffer.from(sealed.slice("enc:v1:".length), "base64url");
    packed[packed.length - 1] ^= 0x01;
    const tampered = `enc:v1:${packed.toString("base64url")}`;
    expect(() => open(tampered)).toThrow();
  });

  it("refuses a value sealed under another secret, a truncated value and plain text", () => {
    const other = seal("secret", secretsKey("a-completely-different-secret-value-0000"));
    expect(() => open(other)).toThrow();
    expect(() => open("enc:v1:AAAA")).toThrow(/truncated/);
    expect(() => open("secret")).toThrow(/prefix/);
  });

  it("tryOpen answers null and raises the 'secret changed' flag instead of throwing", () => {
    const saved = { ...bootStatus };
    try {
      bootStatus.secretChanged = false;
      const other = seal("x", secretsKey("a-completely-different-secret-value-0000"));
      expect(tryOpen(other)).toBeNull();
      expect(bootStatus.secretChanged).toBe(true);
      expect(bootStatus.lastDecryptFailureAt).toEqual(expect.any(String));
    } finally {
      Object.assign(bootStatus, saved);
    }
  });

  it("uses exactly eight bullets as the mask, which is never mistaken for a sealed value", () => {
    expect(MASK).toBe("••••••••");
    expect(isSealed(MASK)).toBe(false);
  });

  it("derives a different key per purpose (no key reuse across features)", () => {
    expect(deriveKey("secrets-v1").equals(deriveKey("return-v1"))).toBe(false);
    expect(deriveKey("secrets-v1")).toHaveLength(32);
  });
});

describe("signing (HMAC tokens)", () => {
  it("verifies its own signature and nothing else", () => {
    const sig = sign("magic-link-v1", "user-1|123");
    expect(sig).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(verifySig("magic-link-v1", "user-1|123", sig)).toBe(true);
    expect(verifySig("magic-link-v1", "user-1|124", sig)).toBe(false);
    expect(verifySig("magic-link-v1", "user-1|123", `${sig[0] === "A" ? "B" : "A"}${sig.slice(1)}`)).toBe(false);
    expect(verifySig("magic-link-v1", "user-1|123", "")).toBe(false);
    expect(verifySig("magic-link-v1", "user-1|123", "short")).toBe(false);
  });

  it("separates purposes: a session-v1 signature is not a magic-link-v1 or revalidate-v1 one", () => {
    const sig = sign("session-v1", "customer-1|3");
    expect(verifySig("magic-link-v1", "customer-1|3", sig)).toBe(false);
    expect(verifySig("revalidate-v1", "customer-1|3", sig)).toBe(false);
    expect(verifySig("pdf-v1", "customer-1|3", sig)).toBe(false);
  });

  it("signed tokens carry their expiry and refuse after it", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-10T10:00:00Z"));
    const token = makeSignedToken("waitlist-v1", "entry-42", 60);
    expect(parseSignedToken("waitlist-v1", token)).toEqual({ payload: "entry-42", expires: expect.any(Number) });
    vi.setSystemTime(new Date("2026-10-10T10:01:01Z"));
    expect(parseSignedToken("waitlist-v1", token)).toBeNull();
  });

  it("refuses a token whose expiry was pushed out, or that was minted for another purpose", () => {
    const token = makeSignedToken("magic-link-v1", "c1", 1800);
    const [payload, exp, sig] = token.split(".");
    expect(parseSignedToken("magic-link-v1", `${payload}.${Number(exp) + 3600}.${sig}`)).toBeNull();
    expect(parseSignedToken("session-v1", token)).toBeNull();
    expect(parseSignedToken("magic-link-v1", "a.b")).toBeNull();
    expect(() => makeSignedToken("magic-link-v1", "has.dot", 60)).toThrow();
  });

  it("the revalidate token shape is <unix>.<sha256>.<hmac> over the body hash (SPEC §G.4)", () => {
    const unix = 1_790_000_000;
    const hash = "a".repeat(64);
    const token = `${unix}.${hash}.${sign("revalidate-v1", `${unix}.${hash}`)}`;
    const [u, h, s] = token.split(".");
    expect(verifySig("revalidate-v1", `${u}.${h}`, s)).toBe(true);
    expect(verifySig("revalidate-v1", `${u}.${"b".repeat(64)}`, s)).toBe(false);
  });
});

describe("ipHash — analytics and rate-limit buckets", () => {
  it("is stable within a Dubai day, rotates the next day, and is never the raw address", () => {
    const today = ipHash("203.0.113.9", "2026-10-10");
    expect(ipHash("203.0.113.9", "2026-10-10")).toBe(today);
    expect(ipHash("203.0.113.9", "2026-10-11")).not.toBe(today);
    expect(today).toMatch(/^[0-9a-f]{32}$/);
    expect(today).not.toContain("203");
  });

  it("uses the Dubai calendar: 21:00 UTC is already tomorrow", () => {
    expect(dubaiDay(new Date("2026-10-10T19:59:00Z"))).toBe("2026-10-10");
    expect(dubaiDay(new Date("2026-10-10T20:00:00Z"))).toBe("2026-10-11");
  });
});

describe("clientIp", () => {
  it("takes the LAST X-Forwarded-For hop (the one our proxy appended), not the first", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.1.1.1, 10.0.0.2, 198.51.100.7" }))).toBe("198.51.100.7");
    expect(clientIp(new Headers({ "x-forwarded-for": "spoofed , 198.51.100.7 " }))).toBe("198.51.100.7");
  });

  it("falls back to x-real-ip, then a constant, so limits still apply in development", () => {
    expect(clientIp(new Headers({ "x-real-ip": "192.0.2.1" }))).toBe("192.0.2.1");
    expect(clientIp(new Headers())).toBe("0.0.0.0");
  });
});

describe("addresses", () => {
  it("sessionSlugFor appends the Dubai date and -HHmm", () => {
    expect(sessionSlugFor("candle-making", "2026-10-11T11:30:00Z")).toBe("candle-making-2026-10-11-1530");
    // 22:30 UTC on the 10th is 02:30 on the 11th in Dubai.
    expect(sessionSlugFor("candle-making", "2026-10-10T22:30:00Z")).toBe("candle-making-2026-10-11-0230");
    expect(sessionSlugFor("", "2026-10-11T11:30:00Z")).toBeUndefined();
    expect(sessionSlugFor("x", "not a date")).toBeUndefined();
  });

  it("routeFor maps every routed collection and sends the unknown home", () => {
    expect(routeFor("pages", { slug: "home" })).toBe("/");
    expect(routeFor("pages", { slug: "about" })).toBe("/about");
    expect(routeFor("experiences", { slug: "candle-making" })).toBe("/events/candle-making");
    expect(routeFor("sessions", { slug: "candle-making-2026-10-11-1530" })).toBe("/events/candle-making-2026-10-11-1530");
    expect(routeFor("programmes", { slug: "corporate" })).toBe("/private-events/corporate");
    expect(routeFor("policies", { slug: "privacy" })).toBe("/policies/privacy");
    expect(routeFor("orders", { slug: "x" })).toBe("/");
  });
});
