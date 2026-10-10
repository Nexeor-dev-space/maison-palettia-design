import type { Payload } from "payload";
import { beforeAll, describe, expect, it } from "vitest";

import { MASK } from "@/cms/lib/crypto";

import { bootPayload, hasDb, inventory, localReq, makeSession, query, sql, staff, SYSTEM } from "../setup/payload";

/**
 * Access rules and secrets through the real Local API (`overrideAccess:
 * false`, as REST runs them), on the throwaway database. SPEC §K
 * integration rows:
 *
 *   · `payment-settings` saved as admin with `test.apiKey` untouched →
 *     ciphertext byte-identical, and the server still reads the key;
 *   · editor → 403 on admin globals; 🔒 fields of content globals ignored;
 *   · anonymous reads of sessions / media carry none of the staff-only keys,
 *     and no drafts;
 *   · editor cannot read orders; front desk cannot change settings;
 *   · an editor save of a session during an active hold does not change
 *     `session_inventory`; `seatsTotal` below sold + held is refused.
 *
 * The pure matrix (every role × every collection) is the unit test
 * tests/unit/security/accessMatrix.test.ts; this file proves the same
 * functions hold when Payload itself applies them.
 */

let payload: Payload;

beforeAll(async () => {
  if (hasDb) payload = await bootPayload();
});

const storedTestKey = async () =>
  (await query<{ test_api_key: string | null; test_api_key_set_at: string | null }>(payload, sql`SELECT test_api_key, test_api_key_set_at FROM payment_settings LIMIT 1`))[0];

describe.skipIf(!hasDb)("encrypted settings survive unrelated saves (SPEC §C.2)", () => {
  it("an admin save that does not touch the key leaves the ciphertext byte-identical; the server still reads it", async () => {
    const admin = await staff(payload, "admin");
    await payload.updateGlobal({ slug: "payment-settings", data: { test: { apiKey: "sk_test_integration_key" } } as never, user: admin, overrideAccess: false });
    const before = await storedTestKey();
    expect(before.test_api_key).toMatch(/^enc:v1:/);
    expect(before.test_api_key).not.toContain("sk_test_integration_key");

    // What the admin form sends back on the next save: the whole document as it READ it — key masked.
    const asRead = await payload.findGlobal({ slug: "payment-settings", user: admin, overrideAccess: false, depth: 0 });
    expect((asRead as { test?: { apiKey?: string } }).test?.apiKey).toBe(MASK);
    await payload.updateGlobal({
      slug: "payment-settings",
      data: { ...asRead, checkout: { ...(asRead as { checkout?: object }).checkout, enableTabby: true } } as never,
      user: admin,
      overrideAccess: false,
    });

    const after = await storedTestKey();
    expect(after.test_api_key).toBe(before.test_api_key);
    expect(after.test_api_key_set_at).toEqual(before.test_api_key_set_at);

    const { readPaymentSettings } = await import("@/cms/lib/mamo/index");
    const settings = await readPaymentSettings(payload);
    expect((settings as { test?: { apiKey?: string } }).test?.apiKey).toBe("sk_test_integration_key");
  });

  it("an editor cannot read the admin globals at all, and an admin read is masked", async () => {
    const editor = await staff(payload, "editor");
    await expect(payload.findGlobal({ slug: "payment-settings", user: editor, overrideAccess: false })).rejects.toMatchObject({ status: 403 });
    await expect(payload.findGlobal({ slug: "email-settings", user: editor, overrideAccess: false })).rejects.toMatchObject({ status: 403 });
    const admin = await staff(payload, "admin");
    const read = JSON.stringify(await payload.findGlobal({ slug: "payment-settings", user: admin, overrideAccess: false }));
    expect(read).not.toContain("sk_test_integration_key");
    expect(read).not.toContain("enc:v1:");
  });
});

describe.skipIf(!hasDb)("roles through the Local API (SPEC §J)", () => {
  it("an editor cannot change admin globals", async () => {
    const editor = await staff(payload, "editor");
    await expect(
      payload.updateGlobal({ slug: "payment-settings", data: { checkout: { enableTabby: false } } as never, user: editor, overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      payload.updateGlobal({ slug: "invoice-settings", data: { legalName: "Hijacked LLC" } as never, user: editor, overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("an editor's change to a 🔒 field of a content global is dropped, the rest of the save applies", async () => {
    const admin = await staff(payload, "admin");
    const editor = await staff(payload, "editor");
    await payload.updateGlobal({ slug: "booking-settings", data: { referencePrefix: "MP" } as never, user: admin, overrideAccess: false });
    await payload.updateGlobal({ slug: "booking-settings", data: { referencePrefix: "HACK" } as never, user: editor, overrideAccess: false });
    const stored = await payload.findGlobal({ slug: "booking-settings", overrideAccess: true, depth: 0 });
    expect((stored as { referencePrefix?: string }).referencePrefix).toBe("MP");
  });

  it("the front desk cannot change content or settings", async () => {
    const desk = await staff(payload, "front-desk");
    await expect(payload.updateGlobal({ slug: "brand-copy", data: { tagline: "Front desk was here" } as never, user: desk, overrideAccess: false })).rejects.toMatchObject({
      status: 403,
    });
    await expect(payload.updateGlobal({ slug: "site-settings", data: { name: "Desk" } as never, user: desk, overrideAccess: false })).rejects.toMatchObject({ status: 403 });
  });

  it("an editor cannot read orders, customers or payments", async () => {
    const editor = await staff(payload, "editor");
    for (const collection of ["orders", "customers", "payments", "tickets"] as const) {
      await expect(payload.find({ collection, user: editor, overrideAccess: false }), collection).rejects.toMatchObject({ status: 403 });
    }
  });

  it("nobody creates orders through the generic API — not even an admin", async () => {
    const admin = await staff(payload, "admin");
    await expect(
      payload.create({ collection: "orders", data: { reference: "MP-HACK" } as never, user: admin, overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("anonymous session reads are published-only and carry no staff-only fields", async () => {
    const draft = await makeSession(payload, { status: "draft" });
    const live = await makeSession(payload, { status: "published" });
    await payload.update({ collection: "sessions", id: live.id, data: { internalNotes: "Staff only: door code 4411" } as never, overrideAccess: true, context: SYSTEM });

    const anonymous = await localReq(payload);
    const result = await payload.find({ collection: "sessions", req: anonymous, overrideAccess: false, depth: 0, limit: 200 });
    const ids = result.docs.map((d) => String(d.id));
    expect(ids).toContain(live.id);
    expect(ids).not.toContain(draft.id);
    const raw = JSON.stringify(result.docs);
    expect(raw).not.toContain("door code 4411");
    for (const doc of result.docs) {
      expect(doc).not.toHaveProperty("internalNotes");
      expect(doc).not.toHaveProperty("instructor");
    }
  });

  it("anonymous media reads carry no consent, provenance, credit or licence", async () => {
    const anonymous = await localReq(payload);
    const result = await payload.find({ collection: "media", req: anonymous, overrideAccess: false, depth: 0, limit: 5 });
    for (const doc of result.docs) {
      for (const key of ["consent", "provenance", "credit", "licence"]) expect(doc).not.toHaveProperty(key);
    }
  });
});

describe.skipIf(!hasDb)("seat counters belong to SQL, not to the session form (SPEC §F.4)", () => {
  it("an editor saving a session while seats are held leaves session_inventory alone", async () => {
    const { acquireSeats } = await import("@/cms/lib/inventory");
    const session = await makeSession(payload, { seats: 8 });
    await acquireSeats(await localReq(payload), session.id, 3);
    expect(await inventory(payload, session.id)).toEqual({ sold: 0, held: 3 });

    const editor = await staff(payload, "editor");
    await payload.update({ collection: "sessions", id: session.id, data: { durationMinutes: 150, seatsTotal: 10 } as never, user: editor, overrideAccess: false });
    expect(await inventory(payload, session.id)).toEqual({ sold: 0, held: 3 });
  });

  it("seatsTotal below what is already sold + held is refused with a plain message", async () => {
    const { acquireSeats } = await import("@/cms/lib/inventory");
    const session = await makeSession(payload, { seats: 6 });
    await acquireSeats(await localReq(payload), session.id, 4);
    const admin = await staff(payload, "admin");
    await expect(
      payload.update({ collection: "sessions", id: session.id, data: { seatsTotal: 3 } as never, user: admin, overrideAccess: false }),
    ).rejects.toThrow(/seat/i);
    const stored = await payload.findByID({ collection: "sessions", id: session.id, overrideAccess: true, depth: 0 });
    expect((stored as { seatsTotal?: number }).seatsTotal).toBe(6);
  });

  it("a draft or closed session can never be acquired, at the SQL level", async () => {
    const { acquireSeats, SoldOut } = await import("@/cms/lib/inventory");
    const draft = await makeSession(payload, { status: "draft" });
    const closed = await makeSession(payload, { bookingStatus: "closed" });
    const req = await localReq(payload);
    await expect(acquireSeats(req, draft.id, 1)).rejects.toBeInstanceOf(SoldOut);
    await expect(acquireSeats(req, closed.id, 1)).rejects.toBeInstanceOf(SoldOut);
    expect(await inventory(payload, draft.id)).toEqual({ sold: 0, held: 0 });
  });
});

describe.skipIf(!hasDb)("unticking 'Can sign in' ends the person's sessions (release review)", () => {
  it("a deactivated colleague's existing token stops working at once, and a leftover user object has no access", async () => {
    const admin = await staff(payload, "admin");
    const email = `it-offboard-${Date.now().toString(36)}@example.test`;
    const password = `pw-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    const created = await payload.create({
      collection: "users",
      data: { email, password, name: "Leaving desk", role: "front-desk", active: true } as never,
      overrideAccess: true,
      context: SYSTEM,
    });

    // Signed in, as they would be at the desk: the token authenticates and
    // the desk can read orders.
    const { token } = await payload.login({ collection: "users", data: { email, password } });
    expect(token).toBeTruthy();
    const headers = new Headers({ Authorization: `JWT ${token}` });
    const before = await payload.auth({ headers });
    expect(before.user?.id).toBe(created.id);
    await expect(payload.find({ collection: "orders", user: before.user, overrideAccess: false, limit: 1 })).resolves.toBeDefined();

    // The admin unticks "Can sign in" from the staff form.
    await payload.update({ collection: "users", id: created.id, data: { active: false } as never, user: admin, overrideAccess: false });

    const sessions = await query<{ n: number }>(payload, sql`SELECT count(*)::int AS n FROM users_sessions WHERE _parent_id = ${created.id}`);
    expect(sessions[0].n).toBe(0);
    // The same token now resolves to nobody: REST answers 401/403 and a
    // refresh-token call has no session to extend.
    const after = await payload.auth({ headers });
    expect(after.user ?? null).toBeNull();

    // Second layer: even a user object that somehow outlived its session
    // (e.g. a request already in flight) is refused by every role check.
    const stale = { ...(before.user as object), active: false, collection: "users" } as never;
    await expect(payload.find({ collection: "orders", user: stale, overrideAccess: false, limit: 1 })).rejects.toMatchObject({ status: 403 });

    // And the login itself is refused while blocked.
    await expect(payload.login({ collection: "users", data: { email, password } })).rejects.toMatchObject({ status: 403 });
  });
});
