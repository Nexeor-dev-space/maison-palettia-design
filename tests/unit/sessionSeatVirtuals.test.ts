import { describe, expect, it, vi } from "vitest";

import { addSeatVirtuals } from "../../cms/collections/content/sessionInventory.hooks";

/**
 * The sessions afterRead hook (#216): the seat virtuals are unchanged, and a
 * read that can use no count — a public `select` without capacity — no longer
 * pays a counter lookup per session. `req.payload.db.findOne` is stubbed; the
 * real lookup is covered by the integration suite.
 */

type Row = { seatsSold: number; seatsHeld: number } | null;

function harness(user: unknown, row: Row = { seatsSold: 3, seatsHeld: 2 }) {
  const findOne = vi.fn(async () => row);
  const req = { user, context: {} as Record<string, unknown>, payload: { db: { findOne } } };
  const run = (doc: Record<string, unknown>, overrideAccess?: boolean) =>
    (addSeatVirtuals as unknown as (args: unknown) => Promise<Record<string, unknown>>)({
      doc,
      overrideAccess,
      req,
      collection: {},
      context: req.context,
    });
  return { findOne, req, run };
}

const admin = { role: "admin", active: true };
const frontDesk = { role: "front-desk", active: true };
const editor = { role: "editor", active: true };

describe("addSeatVirtuals", () => {
  it("public read without seatsTotal (e.g. select: { slug }) does no lookup and adds nothing", async () => {
    const { findOne, run } = harness(null);
    const doc = await run({ id: "s1", slug: "candles" });
    expect(findOne).not.toHaveBeenCalled();
    expect(doc).toEqual({ id: "s1", slug: "candles" });
  });

  it("editor read without seatsTotal does no lookup either (editors never see raw counts)", async () => {
    const { findOne, run } = harness(editor);
    const doc = await run({ id: "s1" });
    expect(findOne).not.toHaveBeenCalled();
    expect(doc).toEqual({ id: "s1" });
  });

  it("public read with seatsTotal computes availability from one lookup, without raw counts", async () => {
    const { findOne, run } = harness(null);
    const doc = await run({ id: "s1", seatsTotal: 10 });
    expect(findOne).toHaveBeenCalledTimes(1);
    expect(doc).toMatchObject({ seatsAvailable: 5, isFullyBooked: false });
    expect(doc).not.toHaveProperty("seatsSold");
    expect(doc).not.toHaveProperty("seatsHeld");
  });

  it("marks a full session as fully booked and never goes below zero", async () => {
    const { run } = harness(null, { seatsSold: 9, seatsHeld: 4 });
    const doc = await run({ id: "s1", seatsTotal: 10 });
    expect(doc).toMatchObject({ seatsAvailable: 0, isFullyBooked: true });
  });

  it("a session with no counter row reads as nothing sold", async () => {
    const { run } = harness(null, null);
    const doc = await run({ id: "s1", seatsTotal: 8 });
    expect(doc).toMatchObject({ seatsAvailable: 8, isFullyBooked: false });
  });

  it.each([
    ["admin", admin, undefined],
    ["front desk", frontDesk, undefined],
    ["overrideAccess", null, true],
  ])("%s still gets raw counts even when seatsTotal was not selected", async (_label, user, override) => {
    const { findOne, run } = harness(user);
    const doc = await run({ id: "s1" }, override as boolean | undefined);
    expect(findOne).toHaveBeenCalledTimes(1);
    expect(doc).toMatchObject({ seatsSold: 3, seatsHeld: 2 });
    expect(doc).not.toHaveProperty("seatsAvailable");
  });

  it("an inactive admin is treated as the public", async () => {
    const { findOne, run } = harness({ role: "admin", active: false });
    const doc = await run({ id: "s1" });
    expect(findOne).not.toHaveBeenCalled();
    expect(doc).toEqual({ id: "s1" });
  });

  it("uses a populated inventory join instead of querying", async () => {
    const { findOne, req, run } = harness(admin);
    const doc = await run({ id: "s1", seatsTotal: 10, inventory: { docs: [{ seatsSold: 1, seatsHeld: 1 }] } });
    expect(findOne).not.toHaveBeenCalled();
    expect(doc).toMatchObject({ seatsAvailable: 8, seatsSold: 1, seatsHeld: 1 });
    expect(req.context["inventorySeen:s1"]).toBe(true);
  });

  it("leaves a doc without an id untouched", async () => {
    const { findOne, run } = harness(admin);
    const doc = await run({ seatsTotal: 10 });
    expect(findOne).not.toHaveBeenCalled();
    expect(doc).toEqual({ seatsTotal: 10 });
  });
});
