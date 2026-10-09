import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * ==========================================================================
 * Where the checkout is — the one answer for every on-disk path the CMS uses
 * ==========================================================================
 *
 * Uploads (`media/`), the invoice PDFs Phase 3 writes under `private/`, and
 * anything else that must outlive a release live beside the code at the repo
 * root, on the persistent disk the deploy backs up (SPEC §A.5). Resolving
 * that root is less obvious than it looks, because the CMS runs in three
 * shapes and `import.meta.url` means something different in each:
 *
 *   · `next dev` and `next start` — Turbopack does not inline
 *     `import.meta.url`; the compiled chunk asks the runtime for the file's
 *     path and gets `<dir that contains .next>/cms/lib/paths.ts`, i.e. the
 *     real source path. `path.resolve(dirname, "../..")` is the checkout.
 *   · `node .next/standalone/server.js` — the same runtime call, but the
 *     "directory that contains `.next`" is now `<repo>/.next/standalone`,
 *     so the naive answer is INSIDE THE BUILD OUTPUT. `server.js` also
 *     `process.chdir`s there, so `process.cwd()` is no help either. Every
 *     `next build` recreates that folder: uploads written there vanish on the
 *     next release (docs/cms/research/00-spike.md, G12 — observed empirically
 *     in the Phase 1 review).
 *   · the `payload` CLI (`migrate`, `generate:*`, `run cms/scripts/…`) —
 *     runs from source; `import.meta.url` is the real path.
 *
 * So: walk up from this file to the candidate root, then strip a trailing
 * `.next/standalone` (or a bare `.next`) segment. The strip is literal and
 * does nothing when the folder is somewhere else — a Docker image that
 * COPYs `.next/standalone` to `/app` (Phase 5) resolves to `/app`, which is
 * exactly where its `media/` volume mounts.
 *
 * `assertOutsideBuildOutput` is the belt to that brace: cms/seed/defaults.ts
 * runs it at boot over every upload directory, so a future bundler change
 * that makes the resolution wrong again is reported on the first start, not
 * discovered after a deploy has deleted a season of photographs.
 */

const here = path.dirname(fileURLToPath(import.meta.url));

/** Strip `/.next/standalone` or `/.next` from the end of an absolute path, once. */
function outsideNext(candidate: string): string {
  const parts = candidate.split(path.sep);
  if (parts.at(-2) === ".next" && parts.at(-1) === "standalone") return parts.slice(0, -2).join(path.sep);
  if (parts.at(-1) === ".next") return parts.slice(0, -1).join(path.sep);
  return candidate;
}

/** Absolute path of the checkout (the directory holding `payload.config.ts`). */
export const PROJECT_ROOT = outsideNext(path.resolve(here, "../.."));

/** Where `media` uploads are stored. Gitignored, backed up with the database. */
export const MEDIA_DIR = path.join(PROJECT_ROOT, "media");

/** Where files that must never be served by URL live (invoice PDFs, Phase 3). */
export const PRIVATE_DIR = path.join(PROJECT_ROOT, "private");

/** True when `dir` sits inside a `.next` build output — i.e. would be wiped by the next build. */
export function isInsideBuildOutput(dir: string): boolean {
  return path.resolve(dir).split(path.sep).includes(".next");
}

/** Throws a message that says which directory is wrong and why it matters. */
export function assertOutsideBuildOutput(what: string, dir: string): void {
  if (!isInsideBuildOutput(dir)) return;
  throw new Error(
    `${what} resolves to "${dir}", which is inside a .next build output and would be deleted by the next \`next build\`. ` +
      "Check cms/lib/paths.ts against how the server was started (SPEC §A.5, spike G12).",
  );
}
