import config from "@payload-config";
import { getPayload } from "payload";

import { backfillBlur } from "@/cms/lib/backfillBlur";

/**
 * ==========================================================================
 * backfill-blur — blurred stand-ins for pictures uploaded before the field
 * ==========================================================================
 *
 *   BLUR_FROM=https://maisonpalettia.com npx payload run cms/scripts/backfill-blur.ts
 *
 * Fills `blurDataURL` on every media document that has none (see
 * cms/lib/backfillBlur.ts). Files are read from this checkout's media/ and,
 * with BLUR_FROM, any that are not here are fetched from that site. An
 * environment variable rather than a flag because `payload run` does not
 * pass arguments through to the script. BLUR_DRY_RUN=1 reports without
 * writing.
 *
 * The servers also run the same fill on every start (restore-media), from
 * their own disks — this is for filling the shared database ahead of a
 * deploy, so the very first build already prerenders the blurs.
 */
async function main() {
  const payload = await getPayload({ config });
  const origin = process.env.BLUR_FROM || undefined;
  const dryRun = process.env.BLUR_DRY_RUN === "1";
  const result = await backfillBlur(payload, { origin, dryRun });
  console.log(
    `backfill-blur: ${result.total} in library, ${dryRun ? "would make" : "made"} ${result.made}, ${result.none} need none (transparent), ${result.missing.length} with no file found.`,
  );
  if (result.missing.length) console.log(`backfill-blur: no file for: ${result.missing.join(", ")}`);
  process.exit(0);
}

// Top-level await: `payload run` exits as soon as the module has evaluated.
try {
  await main();
} catch (err) {
  console.error("backfill-blur: failed —", err instanceof Error ? err.message : err);
  process.exit(1);
}
