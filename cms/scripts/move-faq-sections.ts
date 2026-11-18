import config from "@payload-config";
import { getPayload } from "payload";

import { describeFaqMove, moveFaqSections } from "@/cms/lib/faqSections";

/**
 * ==========================================================================
 * move-faq-sections — the FAQ page's three sections, into the CMS (once)
 * ==========================================================================
 *
 *   FAQ_SECTIONS_DRY_RUN=1 npm run move:faq-sections    report only
 *   npm run move:faq-sections                           do it
 *
 * Creates the FAQ section documents for the three sections that were fixed in
 * code, with the headings the FAQ page was printing (cms/lib/faqSections.ts).
 * It also runs by itself at the end of every `npm run start:prod` until it has
 * succeeded once, so this is for a server started another way, or for looking
 * first. An environment variable rather than a flag because `payload run`
 * does not pass arguments through.
 */
async function main() {
  const payload = await getPayload({ config });
  const result = await moveFaqSections(payload, { dryRun: process.env.FAQ_SECTIONS_DRY_RUN === "1" });
  console.log(`move-faq-sections: ${describeFaqMove(result)}`);
  process.exit(0);
}

// Top-level await: `payload run` exits as soon as the module has evaluated.
try {
  await main();
} catch (err) {
  console.error("move-faq-sections: failed —", err instanceof Error ? err.message : err);
  process.exit(1);
}
