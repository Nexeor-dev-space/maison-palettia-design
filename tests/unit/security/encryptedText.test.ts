import type { FieldAccess, FieldHook, PayloadRequest, TextField } from "payload";
import { describe, expect, it, vi } from "vitest";

import { encryptedText } from "@/cms/fields/encryptedText";
import { isSealed, MASK, open, seal } from "@/cms/lib/crypto";

/**
 * `encryptedText()` (SPEC §C.2, §K: "the four beforeChange branches"). The
 * hooks are called directly with the arguments Payload passes, and a
 * stand-in `req.payload.db` that returns the row AS STORED — the adapter
 * layer, which is what branch 2 must read (never `previousValue`, which on
 * a global save is already the mask).
 *
 *   1. null              → Clear: value and `…SetAt` both nulled
 *   2. "" | MASK | absent → Untouched: the stored ciphertext, byte for byte
 *   3. enc:v1:…          → Already sealed: kept as given
 *   4. anything else     → Sealed now, `…SetAt` stamped
 *
 * The integration suite repeats branch 2 end to end on a real global save
 * (tests/integration/payload/secrets.test.ts).
 */

process.env.PAYLOAD_SECRET ||= "unit-test-secret-not-used-anywhere-else-0123456789";

const [secretField, setAtField] = encryptedText("apiKey", { label: "API key", verify: "mamo" }) as [TextField, TextField];
const beforeChange = secretField.hooks!.beforeChange![0] as FieldHook;
const afterRead = secretField.hooks!.afterRead![0] as FieldHook;

const STORED = seal("sk_test_stored_value");

type Call = Parameters<FieldHook>[0];

function reqWith(stored: unknown, context: Record<string, unknown> = {}) {
  const db = {
    findGlobal: vi.fn(async () => ({ id: "g1", test: { apiKey: stored, apiKeySetAt: "2026-01-01T00:00:00.000Z" } })),
    findOne: vi.fn(async () => ({ id: "doc-1", test: { apiKey: stored } })),
  };
  return { req: { payload: { db }, context } as unknown as PayloadRequest, db };
}

const globalCall = (value: unknown, req: PayloadRequest, siblingData: Record<string, unknown> = {}): Call =>
  ({
    value,
    req,
    path: ["test", "apiKey"],
    global: { slug: "payment-settings" },
    collection: null,
    originalDoc: { test: { apiKey: MASK } },
    previousValue: MASK, // what Payload really hands a global hook: the masked afterRead output
    siblingData,
  }) as unknown as Call;

describe("encryptedText beforeChange — the four branches", () => {
  it("1. null clears the value and the 'set on' date", async () => {
    const { req, db } = reqWith(STORED);
    const sibling: Record<string, unknown> = { apiKeySetAt: "2026-01-01T00:00:00.000Z" };
    expect(await beforeChange(globalCall(null, req, sibling))).toBeNull();
    expect(sibling.apiKeySetAt).toBeNull();
    expect(db.findGlobal).not.toHaveBeenCalled();
  });

  it.each([
    ["the mask", MASK],
    ["an empty string", ""],
    ["an absent value", undefined],
  ])("2. %s keeps the STORED ciphertext byte for byte (never previousValue)", async (_label, value) => {
    const { req, db } = reqWith(STORED);
    const sibling: Record<string, unknown> = {};
    const out = await beforeChange(globalCall(value, req, sibling));
    expect(out).toBe(STORED);
    expect(out).not.toBe(MASK);
    expect(db.findGlobal).toHaveBeenCalledWith(expect.objectContaining({ slug: "payment-settings" }));
    expect(sibling).not.toHaveProperty("apiKeySetAt"); // untouched: no new date
  });

  it("2. on a collection it reads the stored row by id; on create there is nothing to keep", async () => {
    const { req, db } = reqWith(STORED);
    const call = { ...globalCall(MASK, req), global: null, collection: { slug: "customers" }, originalDoc: { id: "doc-1" } } as unknown as Call;
    expect(await beforeChange(call)).toBe(STORED);
    expect(db.findOne).toHaveBeenCalledWith(expect.objectContaining({ collection: "customers", where: { id: { equals: "doc-1" } } }));

    const create = { ...call, originalDoc: undefined } as unknown as Call;
    expect(await beforeChange(create)).toBeNull();
  });

  it("2. a stored value that is not ours is never written back (reads as 'not set')", async () => {
    const { req } = reqWith("plain-text-written-around-the-hooks");
    expect(await beforeChange(globalCall(MASK, req))).toBeNull();
  });

  it("3. an already-sealed value (reseal script, import) is kept as given, no new date", async () => {
    const { req, db } = reqWith(STORED);
    const resealed = seal("sk_test_resealed");
    const sibling: Record<string, unknown> = {};
    expect(await beforeChange(globalCall(resealed, req, sibling))).toBe(resealed);
    expect(sibling).not.toHaveProperty("apiKeySetAt");
    expect(db.findGlobal).not.toHaveBeenCalled();
  });

  it("4. a new value is sealed and the 'set on' date stamped", async () => {
    const { req } = reqWith(STORED);
    const sibling: Record<string, unknown> = {};
    const out = await beforeChange(globalCall("sk_test_brand_new", req, sibling));
    expect(isSealed(out)).toBe(true);
    expect(out).not.toContain("sk_test_brand_new");
    expect(open(out as string)).toBe("sk_test_brand_new");
    expect(new Date(String(sibling.apiKeySetAt)).getTime()).toBeGreaterThan(Date.now() - 60_000);
  });
});

describe("encryptedText afterRead — the mask is the only thing a reader sees", () => {
  const read = (value: unknown, context: Record<string, unknown> = {}) =>
    afterRead({ value, req: { context } } as unknown as Call);

  it("masks for every ordinary read, admin form included", () => {
    expect(read(STORED)).toBe(MASK);
  });

  it("reveals only to server code that asked (internalRead / revealSecrets)", () => {
    expect(read(STORED, { internalRead: true })).toBe("sk_test_stored_value");
    expect(read(STORED, { revealSecrets: true })).toBe("sk_test_stored_value");
  });

  it("never returns a value that is not ours, even to server code; empty reads as null", () => {
    expect(read("plain", { internalRead: true })).toBeNull();
    expect(read(null)).toBeNull();
    expect(read("")).toBeNull();
  });
});

describe("encryptedText field shape", () => {
  const as = (role: string | null) => ({ req: { user: role ? { role } : null } }) as unknown as Parameters<FieldAccess>[0];

  it("is admin-only for read, create and update (SPEC §J field-level)", async () => {
    for (const op of ["read", "create", "update"] as const) {
      const access = secretField.access![op]!;
      expect(await access(as("admin"))).toBe(true);
      expect(await access(as("editor"))).toBe(false);
      expect(await access(as("front-desk"))).toBe(false);
      expect(await access(as(null))).toBe(false);
    }
    expect(await setAtField.access!.read!(as("editor"))).toBe(false);
  });

  it("carries the marker the reseal script finds, and the sibling date field", () => {
    expect(secretField.custom).toEqual({ encrypted: true });
    expect(setAtField.name).toBe("apiKeySetAt");
  });
});
