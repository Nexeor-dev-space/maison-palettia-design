import type { Field, PayloadRequest, SanitizedConfig } from "payload";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * The RBAC matrix (SPEC §J), checked against the real, sanitised config:
 * every collection and global access function is called as each role and
 * as an anonymous visitor, and the answers are compared with the table
 * below. Then the field-level rules (§J "Field-level") are checked the same
 * way on the fields themselves.
 *
 * Notation per operation, in the order admin · editor · front-desk · public:
 *   Y = allowed, - = refused, W = allowed through a row filter (a `where`:
 *   published-only for visitors, "active colleagues" for staff on users).
 *
 * Where the code is STRICTER than §J, the row says so and keeps the code:
 *   · pages: editors cannot delete any page (§J: only the fixed slugs) —
 *     a page delete is a site-structure change, admin-only by Phase 2.
 *   · media: editors cannot delete (in-use media is refused for admins too).
 *   · front-desk reads content as a visitor does (published only); drafts
 *     are an editing concern and the desk sees them through /preview.
 *   · orders/tickets/invoices/payments/notification-log/session-inventory:
 *     no role creates rows by REST; they are the output of the commerce
 *     code (`context.system`), never of a form.
 * Payload's own internal collections (preferences, locked documents,
 * folders, migrations, kv) and the jobs-stats global keep Payload defaults
 * and are not part of the matrix.
 */

type Role = "admin" | "editor" | "front-desk" | null;
const ROLES: Role[] = ["admin", "editor", "front-desk", null];

const C: Record<string, { create: string; read: string; update: string; delete: string }> = {
  // content (drafted collections: visitors get published rows only)
  pages: { create: "YY--", read: "YYWW", update: "YY--", delete: "Y---" },
  experiences: { create: "YY--", read: "YYWW", update: "YY--", delete: "YY--" },
  sessions: { create: "YY--", read: "YYWW", update: "YY--", delete: "YY--" },
  programmes: { create: "YY--", read: "YYWW", update: "YY--", delete: "YY--" },
  policies: { create: "YY--", read: "YYWW", update: "YY--", delete: "YY--" },
  faqs: { create: "YY--", read: "YYWW", update: "YY--", delete: "YY--" },
  passes: { create: "YY--", read: "YYWW", update: "YY--", delete: "YY--" },
  testimonials: { create: "YY--", read: "YYWW", update: "YY--", delete: "YY--" },
  posts: { create: "YY--", read: "YYWW", update: "YY--", delete: "YY--" },
  // journal categories: no drafts; deleting one is admin-only (and refused while posts use it)
  "post-categories": { create: "YY--", read: "YYYY", update: "YY--", delete: "Y---" },
  venues: { create: "YY--", read: "YYYY", update: "YY--", delete: "YY--" },
  vibes: { create: "YY--", read: "YYYY", update: "YY--", delete: "YY--" },
  redirects: { create: "YY--", read: "YYYY", update: "YY--", delete: "YY--" },
  media: { create: "YY--", read: "YYYY", update: "YY--", delete: "Y---" },
  // staff
  users: { create: "Y---", read: "YWW-", update: "YWW-", delete: "Y---" },
  "settings-audit": { create: "----", read: "Y---", update: "----", delete: "----" },
  // commerce
  "session-inventory": { create: "----", read: "Y-Y-", update: "----", delete: "----" },
  customers: { create: "----", read: "Y-Y-", update: "Y-Y-", delete: "Y---" },
  orders: { create: "----", read: "Y-Y-", update: "Y-Y-", delete: "----" },
  payments: { create: "----", read: "Y-Y-", update: "----", delete: "----" },
  "payment-events": { create: "----", read: "Y---", update: "----", delete: "----" },
  "seat-holds": { create: "----", read: "Y---", update: "----", delete: "----" },
  "invoice-counters": { create: "----", read: "Y---", update: "----", delete: "----" },
  refunds: { create: "Y-Y-", read: "Y-Y-", update: "Y---", delete: "Y---" },
  invoices: { create: "----", read: "Y-Y-", update: "----", delete: "----" },
  "invoice-files": { create: "----", read: "Y-Y-", update: "----", delete: "Y---" },
  tickets: { create: "----", read: "Y-Y-", update: "Y-Y-", delete: "----" },
  "pass-purchases": { create: "----", read: "Y-Y-", update: "Y---", delete: "----" },
  "promo-codes": { create: "Y---", read: "Y-Y-", update: "Y---", delete: "Y---" },
  waitlist: { create: "Y-Y-", read: "Y-Y-", update: "Y-Y-", delete: "Y---" },
  // inbox, comms, reports
  enquiries: { create: "----", read: "YYY-", update: "YYY-", delete: "Y---" },
  "email-templates": { create: "Y---", read: "YY--", update: "YY--", delete: "Y---" },
  "notification-log": { create: "----", read: "Y-Y-", update: "----", delete: "----" },
  "analytics-events": { create: "----", read: "Y---", update: "----", delete: "----" },
  "analytics-daily": { create: "----", read: "Y---", update: "----", delete: "----" },
  "payload-jobs": { create: "----", read: "Y---", update: "----", delete: "----" },
};

const CONTENT_GLOBALS = ["site-settings", "navigation", "brand-copy", "booking-settings", "template-copy", "seo-defaults"];
const ADMIN_GLOBALS = ["payment-settings", "email-settings", "invoice-settings", "notification-settings", "analytics-settings"];
const G: Record<string, { read: string; update: string }> = {
  ...Object.fromEntries(CONTENT_GLOBALS.map((slug) => [slug, { read: "YYYY", update: "YY--" }])),
  ...Object.fromEntries(ADMIN_GLOBALS.map((slug) => [slug, { read: "Y---", update: "Y---" }])),
  "system-state": { read: "----", update: "----" },
};

const PAYLOAD_INTERNAL = new Set(["payload-preferences", "payload-locked-documents", "payload-folders", "payload-migrations", "payload-kv"]);

let config: SanitizedConfig;

beforeAll(async () => {
  process.env.PAYLOAD_SECRET ||= "unit-test-secret-not-used-anywhere-else-0123456789";
  config = await (await import("@payload-config")).default;
}, 120_000);

function reqAs(role: Role): PayloadRequest {
  return {
    user: role ? { id: "00000000-0000-0000-0000-000000000001", role, collection: "users" } : null,
    context: {},
    headers: new Headers(),
    // users.create asks "is this the first user?" — there is one already.
    payload: { count: async () => ({ totalDocs: 1 }), find: async () => ({ docs: [], totalDocs: 1 }) },
  } as unknown as PayloadRequest;
}

async function letter(fn: unknown, role: Role): Promise<string> {
  if (typeof fn !== "function") return "?";
  const result = await fn({ req: reqAs(role), data: {}, id: "00000000-0000-0000-0000-0000000000aa", siblingData: {}, doc: {} });
  return result === true ? "Y" : result === false || result === undefined ? "-" : "W";
}

async function row(access: Record<string, unknown>, op: string): Promise<string> {
  return (await Promise.all(ROLES.map((role) => letter(access[op], role)))).join("");
}

describe("collections (SPEC §J)", () => {
  it("every collection is in the matrix (a new one must be placed in it on purpose)", () => {
    const slugs = config.collections.map((c) => c.slug).filter((slug) => !PAYLOAD_INTERNAL.has(slug)).sort();
    expect(slugs).toEqual(Object.keys(C).sort());
  });

  it("create · read · update · delete per role match the matrix", async () => {
    const actual: Record<string, unknown> = {};
    for (const slug of Object.keys(C)) {
      const access = config.collections.find((c) => c.slug === slug)!.access as Record<string, unknown>;
      actual[slug] = {
        create: await row(access, "create"),
        read: await row(access, "read"),
        update: await row(access, "update"),
        delete: await row(access, "delete"),
      };
    }
    expect(actual).toEqual(C);
  });

  it("a deactivated account ('Can sign in' unticked) is treated as a visitor by every collection rule", async () => {
    // roleOf() fails closed on `active: false`, so a token that outlived the
    // untick still gets exactly what an anonymous visitor gets — never staff access.
    const blocked = (role: Exclude<Role, null>) =>
      ({ ...reqAs(role), user: { id: "00000000-0000-0000-0000-000000000001", role, collection: "users", active: false } }) as unknown as PayloadRequest;
    for (const c of config.collections.filter((c) => !PAYLOAD_INTERNAL.has(c.slug))) {
      for (const op of ["create", "read", "update", "delete"] as const) {
        const fn = (c.access as Record<string, unknown>)[op];
        if (typeof fn !== "function") continue;
        const asVisitor = await letter(fn, null);
        for (const role of ["admin", "editor", "front-desk"] as const) {
          const result = await fn({ req: blocked(role), data: {}, id: "00000000-0000-0000-0000-0000000000aa", siblingData: {}, doc: {} });
          const got = result === true ? "Y" : result === false || result === undefined ? "-" : "W";
          expect(got, `${c.slug}.${op} as blocked ${role}`).toBe(asVisitor);
        }
      }
    }
    const admin = config.collections.find((c) => c.slug === "users")!.access.admin as (a: unknown) => unknown;
    expect(await admin({ req: blocked("admin") })).toBe(false);
    expect(await admin({ req: reqAs("admin") })).toBe(true);
  });

  it("the first user ever created may only be created when the table is empty (and is forced to admin)", async () => {
    const create = config.collections.find((c) => c.slug === "users")!.access.create as (a: unknown) => Promise<boolean>;
    const empty = { user: null, context: {}, payload: { count: async () => ({ totalDocs: 0 }) } };
    expect(await create({ req: empty })).toBe(true);
    expect(await letter(create, null)).toBe("-");
  });

  it("public endpoints create orders/enquiries/waitlist rows; plain REST cannot", async () => {
    for (const slug of ["orders", "enquiries", "waitlist"]) {
      const create = config.collections.find((c) => c.slug === slug)!.access.create as (a: unknown) => unknown;
      expect(await create({ req: reqAs(null), data: {} }), `${slug} anonymous`).toBeFalsy();
      expect(await create({ req: reqAs("editor"), data: {} }), `${slug} editor`).toBeFalsy();
    }
  });
});

describe("globals (SPEC §J, §C.3)", () => {
  it("content globals: everyone reads, editors update; admin globals: admins only; system-state: nobody", async () => {
    const actual: Record<string, unknown> = {};
    for (const slug of Object.keys(G)) {
      const access = config.globals.find((g) => g.slug === slug)!.access as Record<string, unknown>;
      actual[slug] = { read: await row(access, "read"), update: await row(access, "update") };
    }
    expect(actual).toEqual(G);
  });
});

// ─── field level ─────────────────────────────────────────────────────────────

/** Depth-first search for a named field through groups, tabs, rows, collapsibles, arrays and blocks. */
function findField(fields: Field[], path: string[]): Field | undefined {
  const [head, ...rest] = path;
  for (const field of fields) {
    const named = "name" in field && field.name ? field.name : undefined;
    if (named === head) {
      if (rest.length === 0) return field;
      if ("fields" in field && Array.isArray(field.fields)) return findField(field.fields, rest);
      return undefined;
    }
    if (!named) {
      if (field.type === "tabs") {
        for (const tab of field.tabs) {
          if ("name" in tab && tab.name) {
            if (tab.name === head) return rest.length ? findField(tab.fields, rest) : (tab as unknown as Field);
          } else {
            const hit = findField(tab.fields, path);
            if (hit) return hit;
          }
        }
      } else if ("fields" in field && Array.isArray(field.fields)) {
        const hit = findField(field.fields, path);
        if (hit) return hit;
      }
    }
  }
  return undefined;
}

function fieldsOf(kind: "collection" | "global", slug: string): Field[] {
  const entity = kind === "collection" ? config.collections.find((c) => c.slug === slug) : config.globals.find((g) => g.slug === slug);
  if (!entity) throw new Error(`no ${kind} ${slug}`);
  return entity.fields;
}

async function fieldRow(kind: "collection" | "global", slug: string, path: string, op: "read" | "update"): Promise<string> {
  const field = findField(fieldsOf(kind, slug), path.split("."));
  if (!field) return `missing ${slug}.${path}`;
  const fn = (field as { access?: Record<string, unknown> }).access?.[op];
  if (typeof fn !== "function") return "YYYY"; // no field rule: the collection rule decides
  return (await Promise.all(ROLES.map((role) => letter(fn, role)))).join("");
}

const FIELD_RULES: Array<[kind: "collection" | "global", slug: string, path: string, op: "read" | "update", expected: string]> = [
  // admin-only reads (raw provider data, rendered emails, analytics ids)
  ["collection", "payments", "raw", "read", "Y---"],
  ["collection", "payments", "providerLinkUrl", "read", "Y---"],
  ["collection", "refunds", "providerResponse", "read", "Y---"],
  ["collection", "notification-log", "html", "read", "Y---"],
  ["collection", "notification-log", "text", "read", "Y---"],
  // admin-only writes
  ["collection", "users", "role", "update", "Y---"],
  ["collection", "email-templates", "key", "update", "Y---"],
  ["collection", "email-templates", "enabled", "update", "Y---"],
  ["collection", "email-templates", "attachInvoice", "update", "Y---"],
  ["collection", "email-templates", "attachTickets", "update", "Y---"],
  // editor-only reads (never public)
  ["collection", "sessions", "internalNotes", "read", "YY--"],
  ["collection", "sessions", "instructor", "read", "YY--"],
  ["collection", "media", "consent", "read", "YY--"],
  ["collection", "media", "provenance", "read", "YY--"],
  ["collection", "media", "credit", "read", "YY--"],
  ["collection", "media", "licence", "read", "YY--"],
  // 🔒 fields of the content globals (SPEC §J, §C.3)
  ["global", "site-settings", "publicUrl", "update", "Y---"],
  ["global", "site-settings", "locale", "update", "Y---"],
  ["global", "site-settings", "enquiriesEnabled", "update", "Y---"],
  ["global", "site-settings", "jobsEnabled", "update", "Y---"],
  ["global", "site-settings", "allowAiImagery", "update", "Y---"],
  ["global", "booking-settings", "bookingsOpen", "update", "Y---"],
  ["global", "booking-settings", "referencePrefix", "update", "Y---"],
];

describe("field level (SPEC §J 'Field-level')", () => {
  it.each(FIELD_RULES)("%s %s.%s %s → %s", async (kind, slug, path, op, expected) => {
    expect(await fieldRow(kind, slug, path, op)).toBe(expected);
  });

  it("payments' settlement fields are admin-only reads", async () => {
    const fields = fieldsOf("collection", "payments");
    const names = JSON.stringify(fields).match(/"name":"settlement[A-Za-z]*"/g) ?? [];
    expect(names.length).toBeGreaterThan(0);
    for (const quoted of new Set(names)) {
      const name = quoted.slice(8, -1);
      expect(await fieldRow("collection", "payments", name, "read"), name).toBe("Y---");
    }
  });

  it("every encrypted secret anywhere in the schema is admin-only for read, create and update", async () => {
    const found: string[] = [];
    const visit = async (fields: Field[], where: string) => {
      for (const field of fields) {
        const name = "name" in field ? field.name : "";
        if ((field as { custom?: { encrypted?: boolean } }).custom?.encrypted) {
          found.push(`${where}.${name}`);
          const access = (field as { access?: Record<string, unknown> }).access ?? {};
          for (const op of ["read", "create", "update"]) {
            expect((await Promise.all(ROLES.map((r) => letter(access[op], r)))).join(""), `${where}.${name} ${op}`).toBe("Y---");
          }
        }
        if (field.type === "tabs") for (const tab of field.tabs) await visit(tab.fields, `${where}.${"name" in tab ? tab.name : ""}`);
        else if ("fields" in field && Array.isArray(field.fields)) await visit(field.fields, `${where}.${name}`);
      }
    };
    for (const g of config.globals) await visit(g.fields, g.slug);
    for (const c of config.collections) await visit(c.fields, c.slug);
    // Mamo test + live keys and webhook secrets, SMTP password, Resend key at the very least.
    expect(found.length).toBeGreaterThanOrEqual(6);
  });

  it("session-inventory counters are readable by admin and front desk only", async () => {
    for (const name of ["seatsSold", "seatsHeld"]) {
      const row = await fieldRow("collection", "session-inventory", name, "read");
      // Either a field rule or none (then the collection rule — Y-Y- — applies).
      expect(["Y-Y-", "YYYY"]).toContain(row);
    }
  });
});
