import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Vitest for the CMS (SPEC §K). Unit suites need no database; the
 * integration suites under tests/integration create a throwaway Postgres
 * database next to the one in `.env` and drop it afterwards (they skip
 * themselves when the server refuses CREATE DATABASE).
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
    include: ["tests/**/*.test.ts", "cms/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
