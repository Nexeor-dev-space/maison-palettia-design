import type { Payload } from "payload";
import { describe, expect, it } from "vitest";

import { describeFaqMove, moveFaqSections } from "@/cms/lib/faqSections";
import { groupFaqsBySection } from "@/lib/faqSections";

/**
 * FAQ sections managed in the admin (Nov 2026). Pinned here: how the page
 * files questions under sections — including questions saved before the change,
 * which only name their old `group` — and the one-time move that turns the
 * three code-fixed sections into documents, against a small in-memory Payload.
 */

const item = (row: { question: string }) => ({ question: row.question, answer: "" });

describe("groupFaqsBySection", () => {
  const sections = [
    { id: "s-gifts", title: "Gift cards", legacyKey: null },
    { id: "s-coming", title: "Before you arrive", legacyKey: "coming" },
    { id: "s-booking", title: "Booking a place", legacyKey: "booking" },
    { id: "s-empty", title: "Nothing here yet", legacyKey: null },
  ];

  it("prints sections in the given order, each with its own questions, and leaves out empty ones", () => {
    const rows = [
      { question: "Where?", section: "s-coming", group: "coming" },
      { question: "Gift card?", section: "s-gifts", group: "coming" },
      { question: "How do I book?", section: "s-booking", group: "booking" },
    ];
    expect(groupFaqsBySection(sections, rows, item)).toEqual([
      { title: "Gift cards", items: [{ question: "Gift card?", answer: "" }] },
      { title: "Before you arrive", items: [{ question: "Where?", answer: "" }] },
      { title: "Booking a place", items: [{ question: "How do I book?", answer: "" }] },
    ]);
  });

  it("files a question with no section by its old group, under the section that replaced it", () => {
    const rows = [{ question: "Old one", section: null, group: "booking" }];
    expect(groupFaqsBySection(sections, rows, item)).toEqual([{ title: "Booking a place", items: [{ question: "Old one", answer: "" }] }]);
  });

  it("uses a question's own section over its old group", () => {
    const rows = [{ question: "Moved", section: "s-gifts", group: "booking" }];
    expect(groupFaqsBySection(sections, rows, item).map((group) => group.title)).toEqual(["Gift cards"]);
  });

  it("does not print a question whose section is not in the list", () => {
    const rows = [
      { question: "Orphan", section: "s-deleted", group: "coming" },
      { question: "No home", section: null, group: "groups" },
    ];
    expect(groupFaqsBySection(sections, rows, item)).toEqual([]);
  });
});

/** Just enough of Payload for the move: the FAQ page, faq-sections and system-state. */
function fakePayload(faqListGroups: { key: string; title?: string }[] | null, existing: { legacyKey: string }[] = []) {
  const created: Record<string, unknown>[] = [];
  let stamp: string | null = null;
  const payload = {
    find: async ({ collection }: { collection: string }) => {
      if (collection === "pages") {
        return { docs: faqListGroups ? [{ blocks: [{ blockType: "pageHeader" }, { blockType: "faqList", groups: faqListGroups }] }] : [] };
      }
      if (collection === "faq-sections") return { docs: existing };
      throw new Error(`unexpected find on ${collection}`);
    },
    create: async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
      if (collection !== "faq-sections") throw new Error(`unexpected create on ${collection}`);
      created.push(data);
      return { id: created.length, ...data };
    },
    update: async () => {
      throw new Error("the move must not write questions");
    },
    findGlobal: async () => ({ faqSectionsMovedAt: stamp }),
    updateGlobal: async ({ data }: { data: { faqSectionsMovedAt: string } }) => {
      stamp = data.faqSectionsMovedAt;
      return {};
    },
  };
  return { payload: payload as unknown as Payload, created, stamped: () => stamp !== null };
}

describe("moveFaqSections", () => {
  it("creates the three sections with the page's headings, in the page's order, and stamps", async () => {
    const fake = fakePayload([
      { key: "booking", title: "Booking and paying" },
      { key: "coming", title: "Coming to an event" },
      { key: "groups", title: "  " },
    ]);
    const result = await moveFaqSections(fake.payload);
    expect(fake.created).toEqual([
      { title: "Booking and paying", order: 0, legacyKey: "booking" },
      { title: "Coming to an event", order: 1, legacyKey: "coming" },
      { title: "Groups and passes", order: 2, legacyKey: "groups" },
    ]);
    expect(fake.stamped()).toBe(true);
    expect(describeFaqMove(result)).toBe("created 3 FAQ sections (Booking and paying, Coming to an event, Groups and passes).");
  });

  it("adds a section the page left out after the ones it named, with its usual heading", async () => {
    const fake = fakePayload([{ key: "groups", title: "Groups" }]);
    await moveFaqSections(fake.payload);
    expect(fake.created.map((data) => data.title)).toEqual(["Groups", "Coming to an event", "Booking a place"]);
  });

  it("uses the usual headings when there is no FAQ page", async () => {
    const fake = fakePayload(null);
    await moveFaqSections(fake.payload);
    expect(fake.created.map((data) => data.legacyKey)).toEqual(["coming", "booking", "groups"]);
  });

  it("never makes a section twice, so a failed run can simply run again", async () => {
    const fake = fakePayload(null, [{ legacyKey: "coming" }]);
    const result = await moveFaqSections(fake.payload);
    expect(fake.created.map((data) => data.legacyKey)).toEqual(["booking", "groups"]);
    expect(result.existing).toEqual(["Coming to an event"]);
  });

  it("runs once: after the stamp nothing is created", async () => {
    const fake = fakePayload(null);
    await moveFaqSections(fake.payload);
    const again = await moveFaqSections(fake.payload);
    expect(again.state).toBe("already-moved");
    expect(fake.created).toHaveLength(3);
  });

  it("writes nothing in a dry run", async () => {
    const fake = fakePayload(null);
    const result = await moveFaqSections(fake.payload, { dryRun: true });
    expect(result.created).toHaveLength(3);
    expect(fake.created).toHaveLength(0);
    expect(fake.stamped()).toBe(false);
  });
});
