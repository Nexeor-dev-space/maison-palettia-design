import config from "@payload-config";
import { getPayload } from "payload";

import { describeMove, movePagePhotos } from "@/cms/lib/pagePhotos";

/**
 * ==========================================================================
 * move-page-photos — the experience pages' photographs, into the CMS (once)
 * ==========================================================================
 *
 *   PAGE_PHOTOS_DRY_RUN=1 npx payload run cms/scripts/move-page-photos.ts    report only
 *   npx payload run cms/scripts/move-page-photos.ts                          do it
 *
 * Sets each experience's "Page photograph" and "Gallery" to the photographs
 * the code used to hold (see cms/lib/pagePhotos.ts for exactly what it does
 * and what it leaves alone). It runs by itself on every `npm run start:prod`
 * until it has succeeded once, so this is for a server that starts another
 * way (scripts/deploy.sh with systemd) or for looking before it happens.
 *
 * RUN IT ON THE SERVER. The uploads land wherever this process keeps the
 * media library; from a laptop pointed at the shared database they would be
 * rows without files, so it refuses there. PAGE_PHOTOS_FORCE=1 overrides
 * that for a database that really is local. Environment variables rather
 * than flags because `payload run` does not pass arguments through.
 */
async function main() {
  const payload = await getPayload({ config });
  const result = await movePagePhotos(payload, {
    dryRun: process.env.PAGE_PHOTOS_DRY_RUN === "1",
    force: process.env.PAGE_PHOTOS_FORCE === "1",
    log: (line) => console.log(`move-page-photos: ${line}`),
  });
  console.log(`move-page-photos: ${describeMove(result)}`);
  process.exit(result.state === "refused" ? 1 : 0);
}

// Top-level await: `payload run` exits as soon as the module has evaluated.
try {
  await main();
} catch (err) {
  console.error("move-page-photos: failed —", err instanceof Error ? err.message : err);
  process.exit(1);
}
