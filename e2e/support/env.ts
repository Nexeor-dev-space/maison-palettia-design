import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Where the e2e suite gets what it needs, in one place.
 *
 *   · `.env` (DATABASE_URL, PAYLOAD_SECRET) — read here, in the test
 *     process only, for two things the browser cannot do: deleting exactly
 *     the rows a spec created, and signing the loopback revalidate call
 *     after a setting is flipped by SQL (e2e/support/db.ts). Nothing is
 *     written to the environment of the server.
 *   · the admin sign-in — NOT the owner's account. globalSetup creates a
 *     throwaway admin for the run (e2e/support/db.ts `createE2EAdmin`),
 *     keeps its email and password in a 0600 file next to the storage
 *     state, and deletes the account (sessions, preferences, locks) at the
 *     end. Why: Payload stores a user's sessions as one array and rewrites
 *     it wholesale from a snapshot on every login, token refresh and user
 *     update, so anyone else signing in to a SHARED account at the same
 *     moment (the owner, another tool) can drop the suite's session id
 *     mid-run — which is how a release review lost five admin specs at
 *     once. An account nobody else knows cannot be raced.
 */

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3200";
export const STATE_DIR = path.join(os.tmpdir(), "maison-palettia-e2e");
export const ADMIN_STATE = path.join(STATE_DIR, "admin-state.json");

function readKeyValueFile(file: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const at = line.indexOf("=");
    if (at > 0 && !line.trim().startsWith("#")) out[line.slice(0, at).trim()] = line.slice(at + 1).trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

let dotenv: Record<string, string> | undefined;
export function projectEnv(name: "DATABASE_URL" | "PAYLOAD_SECRET"): string | undefined {
  if (process.env[name]) return process.env[name];
  dotenv ??= fs.existsSync(path.join(REPO, ".env")) ? readKeyValueFile(path.join(REPO, ".env")) : {};
  return dotenv[name];
}

/** The run's throwaway admin, written by globalSetup and removed by its teardown. */
export const ADMIN_USER_FILE = path.join(STATE_DIR, "admin-user.json");

export type E2EAdmin = { id: string; email: string; password: string };

export function adminUser(): E2EAdmin | null {
  try {
    const value = JSON.parse(fs.readFileSync(ADMIN_USER_FILE, "utf8")) as Partial<E2EAdmin>;
    return value.id && value.email && value.password ? (value as E2EAdmin) : null;
  } catch {
    return null;
  }
}

export const hasAdmin = (): boolean => fs.existsSync(ADMIN_STATE) && adminUser() !== null;
