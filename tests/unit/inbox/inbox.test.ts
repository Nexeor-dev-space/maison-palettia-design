import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Inbox (3G) unit suite — no database, no config.
 *
 * The contracts module is mocked (its real body would load the Payload
 * config), and so is `createLocalReq` (it builds i18n from a real config).
 * The fake `payload.create` runs the collection's real afterChange hook with
 * the request it was given, which is what proves the announcement waits for
 * the create to resolve rather than running inside it.
 */

const calls: string[] = [];
const contracts = vi.hoisted(() => {
  const hits = new Map<string, number>();
  return {
    hits,
    notifyStaff: vi.fn(async () => ({ logIds: ["log-1"] })),
    sendTemplated: vi.fn(async () => ({ logId: "log-2", status: "queued" as const })),
  };
});

vi.mock("@/cms/lib/contracts", () => ({
  notifyStaff: (...args: unknown[]) => {
    calls.push("notifyStaff");
    return (contracts.notifyStaff as (...a: unknown[]) => unknown)(...args);
  },
  sendTemplated: (...args: unknown[]) => {
    calls.push("sendTemplated");
    return (contracts.sendTemplated as (...a: unknown[]) => unknown)(...args);
  },
  publicUrl: async () => "https://maison.test",
  clientIp: (headers: Headers) => headers.get("x-forwarded-for")?.split(",").pop()?.trim() || "0.0.0.0",
  ipHash: (ip: string) => `hash:${ip}`,
  rateLimit: (bucket: string, key: string, opts: { limit: number }) => {
    const id = `${bucket}:${key}`;
    const next = (contracts.hits.get(id) ?? 0) + 1;
    contracts.hits.set(id, next);
    return next <= opts.limit;
  },
}));

vi.mock("payload", async (importOriginal) => {
  const actual = await importOriginal<typeof import("payload")>();
  return {
    ...actual,
    createLocalReq: async (options: { context?: Record<string, unknown> }, payload: unknown) => ({ context: { ...(options.context ?? {}) }, payload }),
  };
});

const { advanceStatus, announceEnquiry, AFTER_COMMIT } = await import("@/cms/collections/inbox/hooks");
const { buildReplyMailto, enquiryReference, refererPath } = await import("@/cms/collections/inbox/shared");
const { handlePublicEnquiry, ENQUIRY_RATE_LIMIT } = await import("@/cms/endpoints/enquiries");
const { Enquiries } = await import("@/cms/collections/inbox/Enquiries");

/* ─── shared helpers ─────────────────────────────────────────────────────── */

describe("enquiryReference", () => {
  it("derives ENQ- plus the first eight hex digits of the UUID", () => {
    expect(enquiryReference("1a2b3c4d-5e6f-4000-8000-000000000000")).toBe("ENQ-1A2B3C4D");
  });
  it("is stable and never empty", () => {
    expect(enquiryReference(undefined)).toBe("ENQ-—");
    expect(enquiryReference("abc")).toBe("ENQ-ABC");
  });
});

describe("refererPath", () => {
  it("keeps the pathname only — no query, no hash, no host", () => {
    expect(refererPath("https://maison.test/contact?token=secret#x")).toBe("/contact");
    expect(refererPath("/private-events/book")).toBe("/private-events/book");
  });
  it("never yields a protocol-relative path", () => {
    expect(refererPath("https://maison.test//evil.example/x")).toBe("/evil.example/x");
  });
  it("drops non-http values", () => {
    expect(refererPath("javascript:alert(1)")).toBeUndefined();
    expect(refererPath("")).toBeUndefined();
    expect(refererPath(null)).toBeUndefined();
  });
});

describe("buildReplyMailto", () => {
  it("puts the reference in the subject and quotes the message, percent-encoded", () => {
    const url = buildReplyMailto({
      email: "ana+art@example.com",
      name: "Ana Maria",
      reference: "ENQ-1A2B3C4D",
      topicLabel: "A private event",
      message: "Line one\nLine two & more",
      receivedAt: "2026-10-10T10:00:00.000Z",
    });
    expect(url.startsWith("mailto:ana%2Bart%40example.com?subject=")).toBe(true);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("subject")).toBe("Re: A private event [ENQ-1A2B3C4D]");
    const body = params.get("body") ?? "";
    expect(body.startsWith("Hi Ana,")).toBe(true);
    expect(body).toContain("On 10 Oct 2026, 14:00, you wrote:");
    expect(body).toContain("> Line one\r\n> Line two & more");
    expect(url).not.toContain("+"); // `+` is not a space in mailto
  });
  it("trims very long messages so the URL stays openable", () => {
    const url = buildReplyMailto({ email: "a@b.co", reference: "ENQ-1", message: "x".repeat(5000) });
    expect(url.length).toBeLessThan(2000);
  });
});

/* ─── hooks ──────────────────────────────────────────────────────────────── */

type HookArgs = Parameters<typeof advanceStatus>[0];
const runAdvance = (data: Record<string, unknown>, originalDoc: Record<string, unknown>, operation: "create" | "update" = "update") =>
  advanceStatus({ data, originalDoc, operation } as unknown as HookArgs) as Record<string, unknown>;

describe("advanceStatus", () => {
  it("moves a new enquiry to in progress when it is assigned", () => {
    expect(runAdvance({ status: "new", assignedTo: "u1" }, { status: "new", assignedTo: null }).status).toBe("in_progress");
  });
  it("moves a new enquiry to in progress when a reply is stamped (partial update)", () => {
    expect(runAdvance({ repliedAt: "2026-10-10T10:00:00Z" }, { status: "new", repliedAt: null }).status).toBe("in_progress");
  });
  it("respects a status chosen in the same save", () => {
    expect(runAdvance({ status: "closed", assignedTo: "u1" }, { status: "new" }).status).toBe("closed");
  });
  it("leaves non-new enquiries and unrelated edits alone", () => {
    expect(runAdvance({ status: "closed", assignedTo: "u2" }, { status: "closed", assignedTo: "u1" }).status).toBe("closed");
    expect(runAdvance({ status: "new", internalNotes: "x" }, { status: "new" }).status).toBe("new");
    expect(runAdvance({ status: "new", assignedTo: { id: "u1" } }, { status: "new", assignedTo: "u1" }).status).toBe("new");
  });
});

const doc = (over: Record<string, unknown> = {}) => ({
  id: "1a2b3c4d-5e6f-4000-8000-000000000000",
  status: "new",
  source: "contact",
  topic: "private",
  name: "Ana",
  email: "ana@example.com",
  message: "Hello",
  meta: { honeypotTripped: false, referer: "/contact" },
  createdAt: "2026-10-10T10:00:00.000Z",
  updatedAt: "2026-10-10T10:00:00.000Z",
  ...over,
});

const fakeReq = (context: Record<string, unknown> = {}, autoReply = false) =>
  ({
    context,
    payload: {
      logger: { warn: vi.fn(), error: vi.fn() },
      findGlobal: vi.fn(async () => ({ enquiryAutoReply: autoReply })),
    },
  }) as never;

type AfterArgs = Parameters<typeof announceEnquiry>[0];

describe("announceEnquiry", () => {
  beforeEach(() => {
    calls.length = 0;
    contracts.notifyStaff.mockClear();
    contracts.sendTemplated.mockClear();
  });

  it("defers to the creator's after-commit queue when one is provided", async () => {
    const queue: Array<() => Promise<void>> = [];
    await announceEnquiry({ doc: doc(), operation: "create", req: fakeReq({ [AFTER_COMMIT]: queue }) } as unknown as AfterArgs);
    expect(calls).toEqual([]);
    expect(queue).toHaveLength(1);
    await queue[0]();
    expect(calls).toEqual(["notifyStaff"]);
    const [, event, vars, refs] = contracts.notifyStaff.mock.calls[0] as unknown as [unknown, string, Record<string, unknown>, Record<string, string>];
    expect(event).toBe("new_enquiry");
    expect(vars).toMatchObject({ reference: "ENQ-1A2B3C4D", topic: "A private event", source: "Contact form", page: "/contact" });
    expect((vars.links as { admin: string }).admin).toBe("https://maison.test/admin/collections/enquiries/1a2b3c4d-5e6f-4000-8000-000000000000");
    expect(refs).toEqual({ enquiry: "1a2b3c4d-5e6f-4000-8000-000000000000" });
  });

  it("sends the enquiry_received auto-reply only when the setting is on", async () => {
    await announceEnquiry({ doc: doc(), operation: "create", req: fakeReq({}, true) } as unknown as AfterArgs);
    expect(calls).toEqual(["notifyStaff", "sendTemplated"]);
    expect(contracts.sendTemplated.mock.calls[0]?.[1 as never]).toMatchObject({ key: "enquiry_received", to: "ana@example.com" });
  });

  it("never announces honeypot rows or updates", async () => {
    await announceEnquiry({ doc: doc({ meta: { honeypotTripped: true } }), operation: "create", req: fakeReq() } as unknown as AfterArgs);
    await announceEnquiry({ doc: doc(), operation: "update", req: fakeReq() } as unknown as AfterArgs);
    expect(calls).toEqual([]);
  });

  it("swallows a mailer failure (an email can be lost, the enquiry cannot)", async () => {
    contracts.notifyStaff.mockRejectedValueOnce(new Error("NotImplemented"));
    await expect(announceEnquiry({ doc: doc(), operation: "create", req: fakeReq() } as unknown as AfterArgs)).resolves.toBeTruthy();
  });
});

/* ─── the public endpoint ────────────────────────────────────────────────── */

const afterChange = Enquiries.hooks?.afterChange?.[0];

function fakePayload({ enabled = true, failCreate = false } = {}) {
  const created: Array<Record<string, unknown>> = [];
  const order: string[] = [];
  const payload = {
    logger: { warn: vi.fn(), error: vi.fn() },
    findGlobal: vi.fn(async ({ slug }: { slug: string }) => (slug === "site-settings" ? { enquiriesEnabled: enabled } : { enquiryAutoReply: false })),
    create: vi.fn(async (args: { data: Record<string, unknown>; req: { context: Record<string, unknown>; payload: unknown }; overrideAccess?: boolean }) => {
      if (failCreate) throw new Error("relation \"enquiries\" does not exist");
      // What Payload checks: the collection's own access rule, against the request we were given.
      const allowed = await (Enquiries.access!.create as (a: unknown) => unknown)({ req: args.req });
      if (!allowed) throw new Error("Forbidden");
      const row = doc({ ...args.data });
      created.push({ ...args, row });
      await afterChange!({ doc: row, operation: "create", req: args.req } as never);
      order.push("committed");
      return row;
    }),
  };
  contracts.notifyStaff.mockImplementation(async () => {
    order.push("notified");
    return { logIds: [] };
  });
  return { payload, created, order };
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost:3200/api/site/enquiries", {
    method: "POST",
    headers: { "content-type": "application/json", referer: "http://localhost:3200/contact?utm=x", "user-agent": "vitest", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const valid = { source: "contact", name: "  Ana   Maria ", email: " Ana@Example.com ", topic: "general", message: "Hello\r\n\r\n\r\nthere" };
let ipSeq = 0;
const freshIp = () => ({ "x-forwarded-for": `203.0.113.${++ipSeq}` });

describe("handlePublicEnquiry", () => {
  beforeEach(() => {
    calls.length = 0;
    contracts.notifyStaff.mockClear();
  });

  it("stores the enquiry through access.create, then announces after the create resolved", async () => {
    const { payload, created, order } = fakePayload();
    const res = await handlePublicEnquiry(post(valid, freshIp()), { getPayload: async () => payload as never });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
    expect(created).toHaveLength(1);
    const { data, overrideAccess } = created[0] as { data: Record<string, unknown>; overrideAccess: boolean };
    expect(overrideAccess).toBe(false);
    expect(data).toMatchObject({
      status: "new",
      name: "Ana Maria",
      email: "ana@example.com",
      message: "Hello\n\nthere",
      meta: { referer: "/contact", userAgent: "vitest", honeypotTripped: false },
    });
    expect(String((data.meta as { ipHash: string }).ipHash)).toMatch(/^hash:203\.0\.113\./);
    expect(order).toEqual(["committed", "notified"]);
  });

  it("honeypot: same 200, stored closed and flagged, nobody notified", async () => {
    const { payload, created } = fakePayload();
    const res = await handlePublicEnquiry(post({ ...valid, website: "http://spam.example" }, freshIp()), { getPayload: async () => payload as never });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
    const { data } = created[0] as { data: { status: string; meta: { honeypotTripped: boolean } } };
    expect(data.status).toBe("closed");
    expect(data.meta.honeypotTripped).toBe(true);
    expect(calls).toEqual([]);
  });

  it("refuses when enquiries are switched off (503 disabled), storing nothing", async () => {
    const { payload, created } = fakePayload({ enabled: false });
    const res = await handlePublicEnquiry(post(valid, freshIp()), { getPayload: async () => payload as never });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: "disabled" });
    expect(created).toHaveLength(0);
  });

  it("rate-limits at 5 per hour per hashed IP", async () => {
    const { payload } = fakePayload();
    const ip = freshIp();
    const statuses: number[] = [];
    for (let i = 0; i < ENQUIRY_RATE_LIMIT.limit + 1; i += 1) {
      statuses.push((await handlePublicEnquiry(post(valid, ip), { getPayload: async () => payload as never })).status);
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });

  it("rejects cross-site, non-JSON, malformed and invalid bodies before touching the database", async () => {
    const { payload, created } = fakePayload();
    const deps = { getPayload: async () => payload as never };
    expect((await handlePublicEnquiry(post(valid, { ...freshIp(), "sec-fetch-site": "cross-site" }), deps)).status).toBe(403);
    expect((await handlePublicEnquiry(post(valid, { ...freshIp(), "content-type": "application/x-www-form-urlencoded" }), deps)).status).toBe(415);
    expect((await handlePublicEnquiry(post("{not json", freshIp()), deps)).status).toBe(400);
    const bad = await handlePublicEnquiry(post({ ...valid, email: "nope" }, freshIp()), deps);
    expect(bad.status).toBe(400);
    expect(await bad.json()).toMatchObject({ status: "invalid", field: "email" });
    const topic = await handlePublicEnquiry(post({ ...valid, topic: "sales" }, freshIp()), deps);
    expect(await topic.json()).toMatchObject({ status: "invalid", field: "topic" });
    expect((await handlePublicEnquiry(post({ ...valid, message: "x".repeat(40_000) }, freshIp()), deps)).status).toBe(413);
    expect(created).toHaveLength(0);
  });

  it("answers 500 { status: error } when the database refuses, and does not announce", async () => {
    const { payload } = fakePayload({ failCreate: true });
    const res = await handlePublicEnquiry(post(valid, freshIp()), { getPayload: async () => payload as never });
    expect(res.status).toBe(500);
    expect((await res.json()).status).toBe("error");
    expect(calls).toEqual([]);
  });

  it("generic REST cannot create: access.create is false without the endpoint's context flag", async () => {
    const create = Enquiries.access!.create as (a: unknown) => unknown;
    expect(await create({ req: { context: {} } })).toBe(false);
    expect(await create({ req: { context: { viaEnquiryEndpoint: true } } })).toBe(true);
  });
});
