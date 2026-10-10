import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { inject, vi } from "vitest";

import "./types";

/**
 * ==========================================================================
 * Per-file setup for the integration project
 * ==========================================================================
 *
 * Runs before every integration test file imports anything, so module-level
 * reads of the environment (payload.config.ts reads DATABASE_URL at import)
 * see the THROWAWAY database, never the project's.
 *
 *   · DATABASE_URL / PAYLOAD_SECRET   → the run's throwaway values
 *   · NEXT_PUBLIC_SERVER_URL          → http://127.0.0.1:9 (discard port):
 *     the mock gateway posts refund webhooks to the public URL, and the
 *     revalidate fallback posts to the loopback — neither may reach the dev
 *     server on 3200, which serves the owner's database.
 *   · the working directory           → a fresh temp dir, because the mock
 *     gateway keeps its state in `<cwd>/private/dev/mamo-mock.json` and the
 *     dev server reads the repo's copy.
 *
 * NEXT SHIMS. Payload hooks call `revalidatePath`/`revalidateTag` inside
 * `after()` (cms/hooks/revalidate.ts). Outside a Next request both throw, so
 * here `after` runs its callback at once and the two purges are recorded on
 * `globalThis.__revalidations` — which is what the revalidation suite
 * asserts on (SPEC §K "spy on revalidatePath/revalidateTag").
 */

const db = inject("integrationDb");
if (db) {
  process.env.DATABASE_URL = db.url;
  process.env.PAYLOAD_SECRET = db.secret;
  process.env.NEXT_PUBLIC_SERVER_URL = "http://127.0.0.1:9";
  delete process.env.PORT;
}

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "maison-it-"));
try {
  process.chdir(scratch);
} catch {
  /* a worker pool without chdir: the mock state then lands in the repo's private/dev, which is git-ignored */
}

export type Revalidation = { kind: "path" | "tag"; value: string; arg?: string };

declare global {
  var __revalidations: Revalidation[];
}
globalThis.__revalidations = [];

vi.mock("next/cache", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    revalidatePath: (value: string, arg?: string) => {
      globalThis.__revalidations.push({ kind: "path", value, arg });
    },
    revalidateTag: (value: string, arg?: string) => {
      globalThis.__revalidations.push({ kind: "tag", value, arg });
    },
    unstable_cache: (fn: unknown) => fn,
  };
});

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    // Synchronous on purpose: the purge is recorded before the hook returns, so a test can assert right after the save.
    after: (task: (() => unknown) | Promise<unknown>) => {
      if (typeof task === "function") task();
    },
  };
});
