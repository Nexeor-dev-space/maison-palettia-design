import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * ==========================================================================
 * Vitest for the CMS (SPEC §K) — two projects
 * ==========================================================================
 *
 *   unit         tests/unit/**, tests/contract/**, tests/gates/**
 *                Pure code, the sanitised Payload config (RBAC matrix), the
 *                Mamo client against recorded envelopes, and the source
 *                greps. No database, no network, runs in seconds.
 *
 *   integration  tests/integration/**
 *                Real Postgres. NEVER the project database: the global
 *                setup (tests/integration/setup/globalSetup.ts) creates a
 *                throwaway `maison_test_<random>` database on the server
 *                named by DATABASE_URL, runs every migration into it, and
 *                drops it afterwards (WITH FORCE — a crashed run cannot
 *                leave it behind for long; the next run sweeps leftovers
 *                older than a day). The Payload-backed suites boot Payload
 *                against that database with a throwaway PAYLOAD_SECRET and a
 *                dead NEXT_PUBLIC_SERVER_URL (127.0.0.1:9), so nothing they
 *                do can reach the dev server or the owner's data. Files run
 *                one at a time: they share the one database.
 *                When the server refuses CREATE DATABASE (a non-superuser
 *                production role) every integration suite skips itself.
 *
 *   npm run test            both          npm run test:unit / test:integration
 *   npm run test:e2e        Playwright against the running dev server (e2e/)
 *
 * The aliases mirror tsconfig.json so `@/cms/...` imports resolve the same
 * way they do under Next and the Payload CLI.
 */
const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@payload-config": path.resolve(root, "payload.config.ts"),
      "@": root,
    },
  },
  test: {
    environment: "node",
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts", "tests/contract/**/*.test.ts", "tests/gates/**/*.test.ts"],
          testTimeout: 60_000,
          hookTimeout: 120_000,
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["tests/integration/setup/globalSetup.ts"],
          setupFiles: ["tests/integration/setup/environment.ts"],
          fileParallelism: false,
          testTimeout: 120_000,
          // Booting Payload on a fresh database seeds the email templates once (~1 min on a remote host).
          hookTimeout: 300_000,
        },
      },
    ],
  },
});
