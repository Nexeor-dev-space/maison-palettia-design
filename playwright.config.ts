import os from "node:os";
import path from "node:path";

import { defineConfig } from "@playwright/test";

/**
 * ==========================================================================
 * Playwright e2e (SPEC §K "E2E") — against the RUNNING dev server
 * ==========================================================================
 *
 *   npm run test:e2e            (scripts/ci.sh runs it last)
 *
 * The suite drives the real site and admin on http://localhost:3200 (never
 * 3000 — DECISIONS.md #4) with the installed Google Chrome. It does not
 * start a server: start one with `npm run dev` first (or set E2E_BASE_URL).
 *
 * THE DATABASE BEHIND THAT SERVER IS THE OWNER'S (DECISIONS.md #1). Every
 * spec that writes therefore cleans up after itself in `finally`/`afterAll`
 * by exact id — the session it created, the order, tickets, invoice (and
 * its PDF, and the invoice counter when nothing was issued after it), the
 * enquiry, the notification-log rows and job rows they produced — and puts
 * back any setting it touched. Analytics beacons are answered in the
 * browser and never reach the server (e2e/support/test.ts).
 *
 * Sign-in: globalSetup creates a throwaway admin for the run
 * (`e2e-admin-<run>@example.test`, random password, inserted by SQL) and
 * deletes it with its sessions at the end — the owner's own account is
 * never used (e2e/support/env.ts says why). Without DATABASE_URL the admin
 * specs skip and the public ones still run.
 *
 * One worker, in file order: the specs share one database and one booking
 * switch. Output (traces, screenshots) goes to the OS temp dir, not the repo.
 */

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3200";
const outputRoot = path.join(os.tmpdir(), "maison-palettia-e2e");

export default defineConfig({
  testDir: "e2e",
  testMatch: /.*\.spec\.ts$/,
  globalSetup: "./e2e/support/globalSetup.ts",
  outputDir: path.join(outputRoot, "results"),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 20_000,
    navigationTimeout: 90_000,
  },
});
