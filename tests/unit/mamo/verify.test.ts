import { describe, expect, it } from "vitest";

import {
  classifyEvent,
  constantTimeEquals,
  dedupeKeyFor,
  headerNamesOf,
  identifyDelivery,
  parseDefensively,
  readBodyCapped,
  REDACTED,
  redactHeaders,
  scrubSecrets,
  type WebhookSecret,
} from "@/cms/lib/mamo/verify";

/**
 * Webhook signature verification (SPEC §H.5 steps 1–4, §K "a serialised
 * payment-events row contains no secret substring"). Mamo's header name is
 * UNVERIFIED (TODO(mamo-verify)), so these pin down every reading the
 * receiver accepts — and that nothing else gets in.
 */

const TEST_SECRET = "tEsT_s3cret-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA".slice(0, 40);
const LIVE_SECRET = "LiVe_s3cret-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB".slice(0, 40);
const OLD_LIVE = "oLd_live-CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC".slice(0, 40);

const secrets: WebhookSecret[] = [
  { mode: "test", value: TEST_SECRET, previous: false },
  { mode: "live", value: LIVE_SECRET, previous: false },
  { mode: "live", value: OLD_LIVE, previous: true },
];

const h = (init: Record<string, string>) => new Headers(init);

describe("identifyDelivery", () => {
  it("matches the raw secret in Authorization and names the mode", () => {
    expect(identifyDelivery(h({ authorization: LIVE_SECRET }), secrets)).toEqual({ mode: "live", headerName: "authorization", previous: false });
    expect(identifyDelivery(h({ authorization: TEST_SECRET }), secrets)).toEqual({ mode: "test", headerName: "authorization", previous: false });
  });

  it("accepts a Bearer prefix (either case) and surrounding whitespace", () => {
    expect(identifyDelivery(h({ authorization: `Bearer ${TEST_SECRET}` }), secrets)?.mode).toBe("test");
    expect(identifyDelivery(h({ authorization: `bearer   ${TEST_SECRET} ` }), secrets)?.mode).toBe("test");
  });

  it("falls back to X-Auth-Header", () => {
    expect(identifyDelivery(h({ "x-auth-header": LIVE_SECRET }), secrets)).toEqual({ mode: "live", headerName: "x-auth-header", previous: false });
  });

  it("finds the secret under an unexpected header name and reports that name (discovery)", () => {
    const match = identifyDelivery(h({ "x-mamo-signature": TEST_SECRET, "content-type": "application/json" }), secrets);
    expect(match).toEqual({ mode: "test", headerName: "x-mamo-signature", previous: false });
  });

  it("accepts a previous secret inside its grace window and says so", () => {
    expect(identifyDelivery(h({ authorization: OLD_LIVE }), secrets)).toEqual({ mode: "live", headerName: "authorization", previous: true });
  });

  it("rejects a wrong, truncated, extended or empty secret", () => {
    expect(identifyDelivery(h({ authorization: "nope" }), secrets)).toBeNull();
    expect(identifyDelivery(h({ authorization: TEST_SECRET.slice(0, -1) }), secrets)).toBeNull();
    expect(identifyDelivery(h({ authorization: `${TEST_SECRET}x` }), secrets)).toBeNull();
    expect(identifyDelivery(h({ authorization: "" }), secrets)).toBeNull();
    expect(identifyDelivery(h({}), secrets)).toBeNull();
  });

  it("never matches when no secret is configured (an empty secret is not a wildcard)", () => {
    expect(identifyDelivery(h({ authorization: "" }), [{ mode: "test", value: "", previous: false }])).toBeNull();
    expect(identifyDelivery(h({ authorization: "anything" }), [])).toBeNull();
  });

  it("does not accept the secret inside a cookie", () => {
    expect(identifyDelivery(h({ cookie: TEST_SECRET }), secrets)).toBeNull();
  });
});

describe("constantTimeEquals", () => {
  it("is plain equality, for any lengths", () => {
    expect(constantTimeEquals("abc", "abc")).toBe(true);
    expect(constantTimeEquals("abc", "abd")).toBe(false);
    expect(constantTimeEquals("abc", "abcd")).toBe(false);
    expect(constantTimeEquals("", "")).toBe(true);
  });
});

describe("what a stored payment-events row may contain", () => {
  it("redacts every header carrying a secret — current, previous, any mode, any name — and the always-secret names", () => {
    const headers = h({
      authorization: `Bearer ${LIVE_SECRET}`,
      "x-auth-header": TEST_SECRET,
      "x-unexpected": `prefix-${OLD_LIVE}`,
      cookie: "payload-token=abc",
      "content-type": "application/json",
      "user-agent": "Mamo/1.0",
    });
    const stored = redactHeaders(headers, secrets.map((s) => s.value));
    expect(stored.authorization).toBe(REDACTED);
    expect(stored["x-auth-header"]).toBe(REDACTED);
    expect(stored["x-unexpected"]).toBe(REDACTED);
    expect(stored.cookie).toBe(REDACTED);
    expect(stored["content-type"]).toBe("application/json");

    // The §K check: serialise the whole row as the receiver would store it.
    const row = {
      dedupeKey: "MPB-CHRG-1:payment.succeeded:captured:0",
      headerNames: headerNamesOf(headers),
      headers: stored,
      payload: { id: "MPB-CHRG-1", event_type: "payment.succeeded", status: "captured" },
    };
    const serialised = JSON.stringify(row);
    for (const secret of secrets) expect(serialised).not.toContain(secret.value);
  });

  it("records header NAMES only, lower-cased and sorted", () => {
    expect(headerNamesOf(h({ "X-B": LIVE_SECRET, Authorization: TEST_SECRET }))).toEqual(["authorization", "x-b"]);
  });

  it("scrubs secrets out of an unverified body excerpt", () => {
    const excerpt = scrubSecrets(`{"note":"${LIVE_SECRET}","id":"x"}`, secrets.map((s) => s.value));
    expect(excerpt).not.toContain(LIVE_SECRET);
    expect(excerpt).toContain(REDACTED);
  });
});

describe("classifyEvent and the dedupe key", () => {
  const paid = { id: "MPB-CHRG-D65B203ABD", event_type: "payment.succeeded", status: "captured", refund_amount: 0 };

  it("accepts payment.* and dispute.* with an id, ignores everything else", () => {
    expect(classifyEvent(paid)).toEqual({ family: "payment", id: paid.id, eventType: "payment.succeeded" });
    expect(classifyEvent({ id: "DSP-1", event_type: "dispute.received" })?.family).toBe("dispute");
    expect(classifyEvent({ id: "X", event_type: "payout.processed" })).toBeNull();
    expect(classifyEvent({ event_type: "payment.succeeded" })).toBeNull();
    expect(classifyEvent({ id: "a b", event_type: "payment.succeeded" })).toBeNull();
    expect(classifyEvent([paid])).toBeNull();
    expect(classifyEvent(null)).toBeNull();
  });

  it("is stable for a re-delivery and distinct per status and refunded amount", () => {
    const key = dedupeKeyFor(paid, "payment");
    expect(key).toBe("MPB-CHRG-D65B203ABD:payment.succeeded:captured:0");
    expect(dedupeKeyFor({ ...paid }, "payment")).toBe(key);
    const refunded10 = dedupeKeyFor({ ...paid, event_type: "payment.refunded", status: "refunded", refund_amount: 10 }, "payment");
    const refunded20 = dedupeKeyFor({ ...paid, event_type: "payment.refunded", status: "refunded", refund_amount: 20 }, "payment");
    expect(new Set([key, refunded10, refunded20]).size).toBe(3);
    expect(dedupeKeyFor({ id: "DSP-1", event_type: "dispute.won", status: "x" }, "dispute")).toBe("DSP-1:dispute.won");
  });
});

describe("unverified input handling", () => {
  it("reads event type and id from the excerpt by pattern, clamped", () => {
    expect(parseDefensively('{"status":"captured","id":"MPB-CHRG-1","event_type":"payment.succeeded"}')).toEqual({
      eventType: "payment.succeeded",
      providerPaymentId: "MPB-CHRG-1",
    });
    expect(parseDefensively('{"id":"<script>","event_type":"DROP TABLE"}')).toEqual({ eventType: undefined, providerPaymentId: undefined });
  });

  it("stops reading a body past the cap", async () => {
    const big = new Request("http://x/", { method: "POST", body: "x".repeat(2048) });
    expect(await readBodyCapped(big, 1024)).toBeNull();
    const small = new Request("http://x/", { method: "POST", body: "hello" });
    expect(await readBodyCapped(small, 1024)).toBe("hello");
    const declared = new Request("http://x/", { method: "POST", body: "tiny", headers: { "content-length": "999999" } });
    expect(await readBodyCapped(declared, 1024)).toBeNull();
  });
});
