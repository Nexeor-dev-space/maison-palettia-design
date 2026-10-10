import type { Endpoint, PayloadRequest } from "payload";
import { beforeAll, describe, expect, it } from "vitest";

import type { Role } from "@/cms/lib/contracts";

/**
 * Every `/api/actions/**` handler, against the role table in SPEC §J
 * ("`/api/actions/**` endpoints — role per handler"). The handlers are
 * taken from the real, sanitised Payload config, so a new endpoint that is
 * not in the table below fails the "nothing unlisted" test — the table is
 * the review checklist, and it cannot drift from the code silently.
 *
 * For each handler:
 *   · anonymous                       → 401
 *   · a signed-in role not allowed    → 403
 *   · an allowed role, cross-site     → 403 (Sec-Fetch-Site, before anything)
 *
 * The request is a bare stand-in with NO `payload`: `requireRole` must be the
 * first thing a handler does (SPEC §J), so a handler that touches the
 * database, parses the body or reads a route param before checking the
 * role crashes here with a TypeError instead of answering 401/403.
 *
 * Endpoints the code has beyond the §J table (all role-checked the same
 * way) are marked "+": they are reads or helpers added in Phases 3–4.
 */

const ALL: Role[] = ["admin", "editor", "front-desk"];
const A: Role[] = ["admin"];
const AE: Role[] = ["admin", "editor"];
const AF: Role[] = ["admin", "front-desk"];

const MATRIX: Record<string, Role[]> = {
  "POST /actions/payments/test-connection": A,
  "POST /actions/payments/register-webhook": A,
  "POST /actions/payments/rotate-webhook-secret": A,
  "POST /actions/payments/list-webhooks": A,
  "POST /actions/payments/test-order": A,
  "GET /actions/payments/:id/refundable": AF, // +
  "POST /actions/payments/:id/recheck": AF, // +
  "POST /actions/payments/:id/deactivate-link": A, // +
  "POST /actions/email/verify": A,
  "POST /actions/email/test": A,
  "POST /actions/email-templates/preview": AE, // +
  "POST /actions/email-templates/send-me": AE, // +
  "POST /actions/tickets/preview": AE,
  "POST /actions/tickets/check-in": AF,
  "POST /actions/tickets/:id/undo-check-in": A, // +
  "GET /actions/tickets/attendees": AF, // +
  "GET /actions/tickets/day": AF, // +
  "POST /actions/checkout/quote": AF, // + desk quote
  "POST /actions/orders/quote": AF, // +
  "POST /actions/orders/manual": AF,
  "GET /actions/orders/:id/refundable": AF, // +
  "POST /actions/orders/:id/move": AF,
  "POST /actions/orders/:id/refund": AF,
  "POST /actions/orders/:id/resend-confirmation": AF,
  "POST /actions/orders/:id/resend-tickets": AF,
  "POST /actions/orders/:id/refunds/:refundId/approve": A,
  "POST /actions/orders/:id/refunds/:refundId/mark-repaid": A,
  "POST /actions/orders/:id/cancel": A,
  "POST /actions/orders/:id/regenerate-invoice": A,
  "POST /actions/orders/:id/resolve-review": A,
  "POST /actions/customers/:id/sign-out-everywhere": A,
  "POST /actions/sessions/:id/repeat": AE,
  "POST /actions/sessions/:id/reschedule": A,
  "POST /actions/sessions/:id/cancel": A,
  "GET /actions/sessions/:id/attendees.csv": AF,
  "POST /actions/users/invite": A,
  "POST /actions/users/:id/send-login-link": A,
  "GET /actions/exports/:file": A,
  "POST /actions/find-text": AE,
  "POST /actions/notifications/:id/resend": A,
  "POST /actions/enquiries/:id/replied": ALL,
  "GET /actions/admin/warnings": ALL, // + the warnings bar on every admin page
  "POST /payload-jobs/:id/retry": A, // §J "jobs/{id}/retry"
};

type Found = { key: string; endpoint: Endpoint };
let found: Found[] = [];

beforeAll(async () => {
  process.env.PAYLOAD_SECRET ||= "unit-test-secret-not-used-anywhere-else-0123456789";
  const config = await (await import("@payload-config")).default;
  const root = (config.endpoints ?? []).filter((e) => e.path.startsWith("/actions/"));
  const jobs = config.collections.find((c) => c.slug === "payload-jobs");
  const retry = (jobs?.endpoints || []).filter((e) => e.path === "/:id/retry").map((e) => ({ ...e, path: `/payload-jobs${e.path}` }));
  found = [...root, ...retry].map((endpoint) => ({ key: `${endpoint.method.toUpperCase()} ${endpoint.path}`, endpoint }));
}, 120_000);

function fakeReq(role: Role | null, headers: Record<string, string> = {}): PayloadRequest {
  return {
    user: role ? { id: "00000000-0000-0000-0000-000000000001", role, collection: "users", email: "t@example.test" } : null,
    headers: new Headers(headers),
    routeParams: { id: "00000000-0000-0000-0000-0000000000aa", refundId: "00000000-0000-0000-0000-0000000000bb", file: "orders.csv" },
    searchParams: new URLSearchParams(),
    context: {},
    json: async () => ({}),
  } as unknown as PayloadRequest;
}

async function statusOf(endpoint: Endpoint, req: PayloadRequest): Promise<number | string> {
  try {
    const res = await endpoint.handler(req);
    return res instanceof Response ? res.status : "no response";
  } catch (error) {
    const status = (error as { status?: number }).status;
    return typeof status === "number" ? status : `threw ${(error as Error).name}: ${(error as Error).message}`;
  }
}

describe("/api/actions/** — role per handler (SPEC §J)", () => {
  it("every action endpoint in the config is in the matrix, and every matrix row exists", () => {
    const keys = found.map((f) => f.key).sort();
    expect(keys).toEqual(Object.keys(MATRIX).sort());
  });

  it("anonymous → 401 on every handler", async () => {
    const wrong: string[] = [];
    for (const { key, endpoint } of found) {
      const status = await statusOf(endpoint, fakeReq(null));
      if (status !== 401) wrong.push(`${key} → ${status}`);
    }
    expect(wrong).toEqual([]);
  });

  it("a signed-in role outside the table → 403", async () => {
    const wrong: string[] = [];
    for (const { key, endpoint } of found) {
      for (const role of ALL.filter((r) => !MATRIX[key]?.includes(r))) {
        const status = await statusOf(endpoint, fakeReq(role));
        if (status !== 403) wrong.push(`${key} as ${role} → ${status}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it("an allowed role sent cross-site (a forged form on another origin) → 403 before anything runs", async () => {
    const wrong: string[] = [];
    for (const { key, endpoint } of found) {
      const status = await statusOf(endpoint, fakeReq(MATRIX[key]?.[0] ?? "admin", { "sec-fetch-site": "cross-site" }));
      if (status !== 403) wrong.push(`${key} → ${status}`);
    }
    expect(wrong).toEqual([]);
  });

  it("an unknown role string is treated as anonymous", async () => {
    const { endpoint } = found.find((f) => f.key === "POST /actions/find-text")!;
    expect(await statusOf(endpoint, fakeReq("owner" as Role))).toBe(401);
  });
});

describe("the job queue itself (SPEC §J: jobs.access.{run,queue,cancel}: isAdmin)", () => {
  it("only admins may run, queue or cancel jobs through Payload's own routes", async () => {
    const config = await (await import("@payload-config")).default;
    const access = config.jobs.access as Record<string, (args: { req: PayloadRequest }) => boolean | Promise<boolean>>;
    for (const op of ["run", "queue", "cancel"]) {
      expect(await access[op]({ req: fakeReq("admin") }), `${op} as admin`).toBe(true);
      for (const role of [null, "editor", "front-desk"] as const) {
        expect(await access[op]({ req: fakeReq(role) }), `${op} as ${role}`).toBe(false);
      }
    }
  });
});
