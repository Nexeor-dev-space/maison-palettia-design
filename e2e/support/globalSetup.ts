import fs from "node:fs";

import { request } from "@playwright/test";

import { closeDb, createE2EAdmin, deleteE2EAdmin, sweepStaleE2EAdmins } from "./db";
import { ADMIN_STATE, ADMIN_USER_FILE, BASE_URL, projectEnv, STATE_DIR, type E2EAdmin } from "./env";

/**
 * Before any spec: is the server up, and can we sign in?
 *
 *   · `GET /api/users/me` must answer — the suite never starts a server
 *     (Next refuses a second `next dev` in the same checkout), so a dead
 *     server is a clear failure, not 40 timeouts.
 *   · A THROWAWAY ADMIN for this run only (`e2e-admin-<run>@example.test`,
 *     inserted by SQL — e2e/support/env.ts says why the owner's account is
 *     never used). It signs in once through Payload's REST login; the cookie
 *     is kept as a storage state for the admin specs, and the email and
 *     random password in a 0600 file so a fixture can sign in again if the
 *     session is ever refused (e2e/support/test.ts). Both files live in the
 *     OS temp dir.
 *   · Teardown deletes the account with its sessions, preferences and
 *     locks, then both files — also when a spec failed.
 *
 * Without DATABASE_URL (no `.env`, no variable) there is no admin: the
 * admin specs skip and the public ones still run.
 */
export default async function globalSetup(): Promise<() => Promise<void>> {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.rmSync(ADMIN_STATE, { force: true });
  fs.rmSync(ADMIN_USER_FILE, { force: true });

  let admin: E2EAdmin | undefined;
  const ctx = await request.newContext({ baseURL: BASE_URL });
  try {
    const health = await ctx.get("/api/users/me", { timeout: 120_000 }).catch((error: unknown) => {
      throw new Error(`e2e: nothing answers at ${BASE_URL} — start the dev server first (npm run dev). ${(error as Error).message}`);
    });
    if (!health.ok()) throw new Error(`e2e: ${BASE_URL}/api/users/me answered ${health.status()}`);

    if (projectEnv("DATABASE_URL")) {
      await sweepStaleE2EAdmins();
      admin = await createE2EAdmin(`${Date.now().toString(36)}-${process.pid}`);
      fs.writeFileSync(ADMIN_USER_FILE, JSON.stringify(admin), { mode: 0o600 });
      const login = await ctx.post("/api/users/login", { data: { email: admin.email, password: admin.password }, headers: { origin: BASE_URL } });
      if (!login.ok()) {
        throw new Error(
          `e2e: the throwaway admin could not sign in (${login.status()} ${await login.text()}) — ` +
            "has Payload's password format changed? See payloadPasswordHash in e2e/support/db.ts",
        );
      }
      await ctx.storageState({ path: ADMIN_STATE });
    } else {
      console.warn("e2e: no DATABASE_URL (in the environment or .env) — no throwaway admin, so the admin specs will be skipped");
    }
  } catch (error) {
    if (admin) await deleteE2EAdmin(admin.id).catch(() => undefined);
    await closeDb();
    throw error;
  } finally {
    await ctx.dispose();
  }
  // The specs open their own pool (each worker is its own process).
  await closeDb();

  return async () => {
    try {
      if (admin) await deleteE2EAdmin(admin.id);
    } finally {
      await closeDb();
      fs.rmSync(ADMIN_STATE, { force: true });
      fs.rmSync(ADMIN_USER_FILE, { force: true });
    }
  };
}
