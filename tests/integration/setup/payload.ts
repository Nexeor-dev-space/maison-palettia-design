import { randomBytes } from "node:crypto";

import { sql as drizzleSql, type SQL } from "@payloadcms/db-postgres/drizzle";
import type { Payload, PayloadRequest, TypedUser } from "payload";
import { inject } from "vitest";

import type { Role } from "@/cms/lib/contracts";

import "./types";

/**
 * ==========================================================================
 * Payload against the throwaway database — the integration suites' toolkit
 * ==========================================================================
 *
 * `bootPayload()` returns the same Payload instance the app would build
 * (`getPayload({ config })` on payload.config.ts), pointed at the run's
 * throwaway database by ./environment.ts. The first boot of a run seeds the
 * defaults (email templates, settings rows) exactly like a first deploy; the
 * later ones find them and take a few seconds.
 *
 * Everything else here is fixture plumbing: staff users per role (for
 * `overrideAccess: false` calls that exercise the real access rules), a
 * venue/experience/session factory, raw SQL for asserting on counters the
 * Local API deliberately hides, and the job runner.
 */

export const SYSTEM = { system: true, skipRevalidate: true, disableRevalidate: true } as const;

export const integrationDb = () => inject("integrationDb");

/** `describe.skipIf(!hasDb)` — no throwaway database, no integration suite. */
export const hasDb = Boolean(inject("integrationDb"));

let booted: Promise<Payload> | undefined;

export function bootPayload(): Promise<Payload> {
  booted ??= (async () => {
    const db = integrationDb();
    if (!db) throw new Error("no integration database (CREATE DATABASE refused?)");
    if (!process.env.DATABASE_URL?.includes(db.dbName)) throw new Error("refusing to boot: DATABASE_URL is not the throwaway database");
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });
    // Run-unique invoice prefixes: invoice PDFs are written to the real
    // private/invoices folder, and the global teardown removes them by prefix.
    await payload.updateGlobal({
      slug: "invoice-settings",
      data: { invoicePrefix: db.invoicePrefix, creditNotePrefix: db.creditNotePrefix },
      overrideAccess: true,
      context: SYSTEM,
    });
    return payload;
  })();
  return booted;
}

/** Raw SQL through Payload's own drizzle connection; returns the rows. */
export async function query<T = Record<string, unknown>>(payload: Payload, statement: SQL): Promise<T[]> {
  const db = payload.db as unknown as { drizzle: unknown; execute: (args: { db: unknown; sql: SQL }) => Promise<{ rows?: T[] } | T[]> };
  const result = await db.execute({ db: db.drizzle, sql: statement });
  return (Array.isArray(result) ? result : (result.rows ?? [])) as T[];
}

export const sql = drizzleSql;

/** A Payload request with no user (anonymous), or with the given user. */
export async function localReq(payload: Payload, user?: TypedUser | null, context: Record<string, unknown> = {}): Promise<PayloadRequest> {
  const { createLocalReq } = await import("payload");
  const req = await createLocalReq({ user: user ?? undefined, context }, payload);
  return req;
}

const users = new Map<Role, TypedUser>();

/** A staff user with this role in the throwaway database (created once per file). */
export async function staff(payload: Payload, role: Role): Promise<TypedUser> {
  const cached = users.get(role);
  if (cached) return cached;
  const email = `it-${role}-${randomBytes(3).toString("hex")}@example.test`;
  const created = await payload.create({
    collection: "users",
    data: { email, password: `pw-${randomBytes(12).toString("hex")}`, name: `Test ${role}`, role, active: true } as never,
    overrideAccess: true,
    context: SYSTEM,
  });
  const user = { ...(created as unknown as TypedUser), collection: "users" } as TypedUser;
  users.set(role, user);
  return user;
}

type Fixture = { venueId: string; experienceId: string; experienceSlug: string };
let fixture: Promise<Fixture> | undefined;

/** One venue and one published experience per file, shared by every session the file creates. */
export function contentFixture(payload: Payload): Promise<Fixture> {
  fixture ??= (async () => {
    const tag = randomBytes(3).toString("hex");
    const venue = await payload.create({
      collection: "venues",
      data: { name: `IT Studio ${tag}`, locality: "Dubai", slug: `it-studio-${tag}`, status: "current", descriptor: "Test", order: 1 } as never,
      overrideAccess: true,
      context: SYSTEM,
    });
    const experience = await payload.create({
      collection: "experiences",
      data: { name: `IT Painting ${tag}`, kind: "scheduled", description: "Test", slug: `it-painting-${tag}`, order: 1, _status: "published" } as never,
      overrideAccess: true,
      context: SYSTEM,
    });
    return { venueId: String(venue.id), experienceId: String(experience.id), experienceSlug: String((experience as { slug?: string }).slug) };
  })();
  return fixture;
}

/** Sessions of one experience must not share a start minute (the slug is `<experience>-<date>-<HHmm>`). */
let sessionCounter = 0;

export async function makeSession(
  payload: Payload,
  opts: { seats?: number; hoursAhead?: number; priceFils?: number; status?: "published" | "draft"; bookingStatus?: string; context?: Record<string, unknown> } = {},
): Promise<{ id: string; slug: string }> {
  const { venueId, experienceId } = await contentFixture(payload);
  const doc = await payload.create({
    collection: "sessions",
    data: {
      experience: experienceId,
      category: "Painting",
      startsAt: new Date(Math.ceil((Date.now() + (opts.hoursAhead ?? 72) * 3_600_000) / 900_000) * 900_000 + (sessionCounter += 1) * 900_000).toISOString(),
      durationMinutes: 120,
      venue: venueId,
      priceFils: opts.priceFils ?? 25_000,
      seatsTotal: opts.seats ?? 10,
      bookingStatus: opts.bookingStatus ?? "open",
      _status: opts.status ?? "published",
    } as never,
    overrideAccess: true,
    context: opts.context ?? SYSTEM,
  });
  return { id: String(doc.id), slug: String((doc as { slug?: string }).slug) };
}

export async function inventory(payload: Payload, sessionId: string): Promise<{ sold: number; held: number }> {
  const [row] = await query<{ sold: string; held: string }>(
    payload,
    sql`SELECT seats_sold AS sold, seats_held AS held FROM session_inventory WHERE session_id = ${sessionId}`,
  );
  return { sold: Number(row?.sold ?? NaN), held: Number(row?.held ?? NaN) };
}

/** Drains both queues the way the autoRun crons would, a few rounds. */
export async function runQueues(payload: Payload, rounds = 6): Promise<void> {
  for (let i = 0; i < rounds; i += 1) {
    const a = await payload.jobs.run({ queue: "default", limit: 50, silent: true } as never);
    const b = await payload.jobs.run({ queue: "email", limit: 50, silent: true } as never);
    const ran = Object.keys((a as { jobStatus?: object })?.jobStatus ?? {}).length + Object.keys((b as { jobStatus?: object })?.jobStatus ?? {}).length;
    if (ran === 0 && i > 0) break;
  }
}

/** Every revalidation recorded since `mark` (see ./environment.ts). */
export function revalidationsSince(mark: number) {
  return globalThis.__revalidations.slice(mark);
}
export const revalidationMark = () => globalThis.__revalidations.length;
