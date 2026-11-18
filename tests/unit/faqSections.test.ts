import type { Payload } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = vi.hoisted(() => ({ committed: 0, killed: 0 }));
vi.mock("payload", async (importOriginal) => ({
  ...(await importOriginal<typeof import("payload")>()),
  createLocalReq: async () => ({ context: {} }),
  initTransaction: async () => true,
  commitTransaction: async () => {
    tx.committed++;
  },
  killTransaction: async () => {
    tx.killed++;
  },
}));

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

  it("does not file a question added since the change (no old group) anywhere until it has a section", () => {
    const rows = [{ question: "New draft", section: null, group: null }];
    expect(groupFaqsBySection(sections, rows, item)).toEqual([]);
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

/**
 * Just enough of Payload for the move: the FAQ page, faq-sections, and counts
 * of questions (published and latest drafts) still waiting for each old key.
 */
function fakePayload(
  faqListGroups: { key: string; title?: string }[] | null,
  options: { legacy?: string[]; waiting?: string[]; waitingDrafts?: string[]; failOn?: number } = {},
) {
  const created: Record<string, unknown>[] = [];
  const waiting = new Set(options.waiting ?? ["coming", "booking", "groups"]);
  const waitingDrafts = new Set(options.waitingDrafts ?? []);
  const keyOf = (where: unknown, field: string) => JSON.stringify(where).match(new RegExp(`"${field}":\\{"equals":"(\\w+)"`))?.[1];
  const payload = {
    find: async ({ collection }: { collection: string }) => {
      if (collection === "pages") {
        return { docs: faqListGroups ? [{ blocks: [{ blockType: "pageHeader" }, { blockType: "faqList", groups: faqListGroups }] }] : [] };
      }
      if (collection === "faq-sections") return { docs: (options.legacy ?? []).map((legacyKey) => ({ legacyKey })) };
      throw new Error(`unexpected find on ${collection}`);
    },
    count: async ({ collection, where }: { collection: string; where: unknown }) => {
      if (collection !== "faqs") throw new Error(`unexpected count on ${collection}`);
      return { totalDocs: waiting.has(keyOf(where, "group") ?? "") ? 2 : 0 };
    },
    countVersions: async ({ collection, where }: { collection: string; where: unknown }) => {
      if (collection !== "faqs") throw new Error(`unexpected countVersions on ${collection}`);
      return { totalDocs: waitingDrafts.has(keyOf(where, "version.group") ?? "") ? 1 : 0 };
    },
    create: async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
      if (collection !== "faq-sections") throw new Error(`unexpected create on ${collection}`);
      if (options.failOn === created.length + 1) throw new Error("database went away");
      created.push(data);
      return { id: created.length, ...data };
    },
    update: async () => {
      throw new Error("the move must not write questions");
    },
    updateGlobal: async () => {
      throw new Error("the move must not write system-state");
    },
  };
  return { payload: payload as unknown as Payload, created };
}

describe("moveFaqSections", () => {
  beforeEach(() => {
    tx.committed = 0;
    tx.killed = 0;
  });

  it("creates the three sections with the page's headings, in the page's order, in one transaction", async () => {
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
    expect(tx).toEqual({ committed: 1, killed: 0 });
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

  it("does nothing once every question has its section", async () => {
    const fake = fakePayload(null, { legacy: ["coming", "booking", "groups"] });
    const result = await moveFaqSections(fake.payload);
    expect(result.state).toBe("already-moved");
    expect(fake.created).toHaveLength(0);
    expect(describeFaqMove(result)).toBe("every FAQ question already has its section.");
  });

  it("repairs a missing original section when questions still wait for it, keeping its place on the page", async () => {
    const fake = fakePayload(null, { legacy: ["coming", "groups"] });
    await moveFaqSections(fake.payload);
    expect(fake.created).toEqual([{ title: "Booking a place", order: 1, legacyKey: "booking" }]);
  });

  it("counts a question waiting only in an unpublished draft", async () => {
    const fake = fakePayload(null, { legacy: ["coming", "booking"], waiting: [], waitingDrafts: ["groups"] });
    await moveFaqSections(fake.payload);
    expect(fake.created.map((data) => data.legacyKey)).toEqual(["groups"]);
  });

  it("does not bring back an original section an editor deleted once nothing needed it", async () => {
    const fake = fakePayload(null, { legacy: ["coming", "booking"], waiting: ["coming", "booking"] });
    const result = await moveFaqSections(fake.payload);
    expect(result.state).toBe("already-moved");
    expect(fake.created).toHaveLength(0);
  });

  it("rolls back if a section cannot be made, so the next start tries again", async () => {
    const fake = fakePayload(null, { failOn: 2 });
    await expect(moveFaqSections(fake.payload)).rejects.toThrow("database went away");
    expect(tx).toEqual({ committed: 0, killed: 1 });
  });

  it("writes nothing in a dry run", async () => {
    const fake = fakePayload(null);
    const result = await moveFaqSections(fake.payload, { dryRun: true });
    expect(result).toEqual({ state: "dry-run", created: ["Coming to an event", "Booking a place", "Groups and passes"] });
    expect(fake.created).toHaveLength(0);
  });
});
