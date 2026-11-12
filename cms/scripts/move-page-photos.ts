import config from "@payload-config";
import { getPayload } from "payload";

import { describeMove, movePagePhotos } from "@/cms/lib/pagePhotos";

/**
 * ==========================================================================
 * move-page-photos — the experience pages' photographs, into the CMS (once)
 * ==========================================================================
 *
 *   PAGE_PHOTOS_DRY_RUN=1 npm run move:page-photos    report only
 *   npm run move:page-photos                          do it
 *
 * Sets each experience's "Page photograph" and "Gallery" to the photographs
 * the code used to hold (cms/lib/pagePhotos.ts says exactly what it does and
 * what it leaves alone). It also runs by itself at the end of every
 * `npm run start:prod` until it has succeeded once, so this is for a server
 * that starts another way, or for looking before it happens.
 *
 * RUN IT ON THE SERVER. Uploads land wherever this process keeps the media
 * library; from a laptop with no storage keys they would be rows without
 * files, so it refuses there. An environment variable rather than a flag
 * because `payload run` does not pass arguments through.
 */
async function main() {
  const payload = await getPayload({ config });
  const result = await movePagePhotos(payload, {
    dryRun: process.env.PAGE_PHOTOS_DRY_RUN === "1",
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
