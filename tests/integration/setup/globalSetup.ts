import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import pg from "pg";
import type { TestProject } from "vitest/node";

import type { IntegrationDb } from "./types";

/**
 * ==========================================================================
 * Integration global setup — a throwaway database per run (SPEC §K)
 * ==========================================================================
 *
 * The owner's Postgres is development AND production (docs/cms/DECISIONS.md
 * #1), so integration tests never write to it. Instead, once per run:
 *
 *   1. connect to the server named by DATABASE_URL (the environment, else
 *      `.env`) and CREATE DATABASE maison_test_it_<unix>_<hex>;
 *   2. run every migration into it with the real Payload CLI (`payload
 *      migrate` — the same path a deploy takes, so a migration that does not
 *      apply cleanly to an empty database fails here first);
 *   3. hand the URL, a throwaway PAYLOAD_SECRET and a run-unique invoice
 *      prefix to the test files (`inject("integrationDb")`);
 *   4. afterwards: delete the invoice PDFs this run wrote (they land in the
 *      real `private/invoices`, so the unique prefix is what keeps them
 *      apart from the owner's), and DROP DATABASE … WITH (FORCE).
 *
 * Leftovers from a run that was killed before step 4 are swept at the start
 * of the next run once they are more than six hours old (the name carries
 * the creation time; a parallel run's fresh database is never touched).
 *
 * If the server refuses CREATE DATABASE, `integrationDb` is null and every
 * suite skips with a message rather than failing — on a production role
 * that is the correct outcome.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const run = promisify(execFile);

export function projectDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
    const line = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
    return line?.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

const NAME_RE = /^maison_test_it_(\d{10})_[0-9a-f]{8}$/;
const SWEEP_AFTER_SECONDS = 6 * 60 * 60;

async function sweepLeftovers(admin: pg.Client): Promise<void> {
  const { rows } = await admin.query<{ datname: string }>(`SELECT datname FROM pg_database WHERE datname LIKE 'maison_test_it_%'`);
  const now = Math.floor(Date.now() / 1000);
  for (const { datname } of rows) {
    const match = NAME_RE.exec(datname);
    if (match && now - Number(match[1]) > SWEEP_AFTER_SECONDS) {
      await admin.query(`DROP DATABASE IF EXISTS ${datname} WITH (FORCE)`).catch(() => undefined);
    }
  }
}

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const url = projectDatabaseUrl();
  if (!url) {
    project.provide("integrationDb", null);
    return async () => undefined;
  }

  const hex = randomBytes(4).toString("hex");
  const dbName = `maison_test_it_${Math.floor(Date.now() / 1000)}_${hex}`;
  const admin = new pg.Client({ connectionString: url });
  await admin.connect();
  try {
    await sweepLeftovers(admin);
    await admin.query(`CREATE DATABASE ${dbName}`);
  } catch (error) {
    await admin.end();
    console.warn(`[integration] skipped: the server refused CREATE DATABASE (${(error as Error).message})`);
    project.provide("integrationDb", null);
    return async () => undefined;
  }
  await admin.end();

  const testUrl = new URL(url);
  testUrl.pathname = `/${dbName}`;
  const tag = hex.slice(0, 4).toUpperCase();
  const db: IntegrationDb = {
    url: testUrl.toString(),
    dbName,
    secret: `integration-${randomBytes(24).toString("hex")}`,
    invoicePrefix: `ZT${tag}-I`,
    creditNotePrefix: `ZT${tag}-C`,
  };

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: db.url,
    PAYLOAD_SECRET: db.secret,
    NEXT_PUBLIC_SERVER_URL: "http://127.0.0.1:9",
    NODE_ENV: "test",
  };
  try {
    await run(process.execPath, [path.join(ROOT, "node_modules/payload/bin.js"), "migrate"], { cwd: ROOT, env, maxBuffer: 16 * 1024 * 1024 });
  } catch (error) {
    await dropDatabase(url, dbName);
    const out = error as { stdout?: string; stderr?: string };
    throw new Error(`[integration] payload migrate failed on the throwaway database:\n${out.stdout ?? ""}\n${out.stderr ?? ""}`);
  }

  project.provide("integrationDb", db);

  return async () => {
    removeInvoiceFiles(db);
    await dropDatabase(url, dbName);
  };
}

function removeInvoiceFiles(db: IntegrationDb): void {
  const dir = path.join(ROOT, "private", "invoices");
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    if (file.startsWith(`${db.invoicePrefix}-`) || file.startsWith(`${db.creditNotePrefix}-`)) fs.rmSync(path.join(dir, file), { force: true });
  }
}

async function dropDatabase(url: string, dbName: string): Promise<void> {
  const admin = new pg.Client({ connectionString: url });
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
  } finally {
    await admin.end();
  }
}
