import config from "@payload-config";
import { getPayload, type CollectionSlug, type Payload } from "payload";

import { checkSeed } from "./check";
import { seedContent } from "./content";
import { seedGlobals } from "./globals";
import { seedMedia } from "./media";
import { seedPages } from "./pages";
import { Tally } from "./upsert";

/**
 * ==========================================================================
 * npm run seed — today's site, into the CMS (SPEC §F.1–F.7)
 * ==========================================================================
 *
 *   npm run seed                      parity run (the default)
 *   npm run seed -- launch            SPEC §F.4–F.6 as written (see below)
 *   npm run seed -- missing-only      create what is absent, touch nothing else
 *   npm run seed -- check             dry run: report strings that do not fit
 *
 * (`npx payload run` passes plain words through to the script and swallows
 * `--flags`, so the options are words. There is no environment-variable
 * form: SPEC §C.1 allows only the keys in `.env`.)
 *
 * WHAT IT DOES, in order — each step needs the ids of the one before:
 *   1. media        the 72 public/ files the code references (cms/seed/media.ts)
 *   2. content      vibes, venues, experiences, sessions + inventory rows,
 *                   programmes, policies, FAQs, passes (cms/seed/content.ts)
 *   3. globals      site details, menus, brand wording, booking wording, page
 *                   labels, SEO defaults (cms/seed/globals.ts)
 *   4. pages        the eleven FIXED_PAGE_SLUGS pages, as blocks (cms/seed/pages.ts)
 * Email templates are not here: `onInit` seeds them (SPEC §F.8, 3C).
 *
 * IDEMPOTENT. Everything is upserted by slug / filename / question, and a
 * document is written only when it differs from what the seed would write
 * (cms/seed/upsert.ts). A second run against the same database prints
 * "unchanged" on every row. It runs against whatever DATABASE_URL the
 * environment gives — the owner's Postgres in development (DECISIONS.md §1),
 * production once at first deploy.
 *
 * TWO POSTURES, because SPEC §F and the Phase 2 parity gate disagree about
 * the design-phase placeholders. The default ("parity") leaves the site
 * reading exactly as it does today: the two placeholder sessions and three
 * placeholder passes are published, the Atelier Pass keeps its printed
 * benefit, and the booking-terms sentence is the one the FAQ prints now.
 * `launch` applies SPEC §F.4–F.6 literally: sessions and passes saved as
 * drafts (so /events shows "The next dates are being set." and /loyalty its
 * empty state), the pottery-era benefit corrected, and the paid-bookings
 * terms sentence. Bookings stay CLOSED in both (SPEC §F.6), so event pages
 * show the closed-bookings message instead of the Book button until Phase 3.
 *
 * Not seeded: users (the first admin is created at /admin), orders,
 * customers, analytics, testimonials (the two in lib/testimonials.ts are
 * invented), promo codes, redirects. There is no reset: the seed never
 * deletes anything.
 */

const words = new Set(process.argv.slice(2).map((arg) => arg.replace(/^-+/, "").toLowerCase()));
const launch = words.has("launch");
const missingOnly = words.has("missing-only");
const checkOnly = words.has("check");

const log = (line: string) => console.log(line);

/**
 * Exit only once stdout has drained. On macOS a pipe is asynchronous, so a
 * bare `process.exit()` after `console.log` drops the tail of the report
 * (the tally is the part anyone reads).
 */
async function finish(code: number): Promise<never> {
  await new Promise<void>((resolve) => process.stdout.write("", () => resolve()));
  await new Promise<void>((resolve) => process.stderr.write("", () => resolve()));
  process.exit(code);
}

/** The collections the seed writes, for the closing count. */
const COUNTED: CollectionSlug[] = [
  "media",
  "vibes",
  "venues",
  "experiences",
  "sessions",
  "session-inventory",
  "programmes",
  "policies",
  "faqs",
  "passes",
  "pages",
];

/**
 * The seed's own Postgres sessions may sit idle inside a transaction for
 * longer than an interactive request does: one page save is a few hundred
 * statements (every block table, the version tables, the scheduled-publish
 * bookkeeping), and over a ~200 ms link to the shared host a gap between two
 * of them has been seen to pass the server's 10 s
 * `idle_in_transaction_session_timeout`, which kills the connection and the
 * process with it. So every connection this process uses raises the limit
 * to 2 minutes for its own session — the server setting, and every other
 * client, are untouched.
 *
 * Through the pool's `acquire` event rather than PGOPTIONS, because the
 * SPEC §C.1 grep gate allows no environment keys beyond `.env`'s. The
 * pool already holds connections opened by `onInit`, so `connect` alone
 * would miss them; `acquire` sees every one the first time it is handed
 * out. node-postgres queues a client's queries in order, so the SET runs
 * before the statement the caller is about to send, and costs one round
 * trip per connection, once.
 */
interface PooledClient {
  query: (sql: string) => Promise<unknown>;
}

function allowSlowTransactions(payload: Payload): void {
  // The postgres adapter's node-postgres Pool; typed by shape, since `pg` is the adapter's dependency, not ours.
  const pool = (payload.db as { pool?: { on: (event: "acquire", listener: (client: PooledClient) => void) => unknown } }).pool;
  if (!pool) return;
  const done = new WeakSet<PooledClient>();
  pool.on("acquire", (client) => {
    if (done.has(client)) return;
    done.add(client);
    client.query("SET idle_in_transaction_session_timeout = 120000").catch(() => done.delete(client));
  });
}

async function main() {
  if (words.has("reset")) {
    console.error("seed: there is no reset — the seed only creates and updates. Drop the database by hand if you mean to.");
    await finish(2);
  }
  const payload = await getPayload({ config });
  allowSlowTransactions(payload);
  const started = Date.now();

  const { problems, pagesWithProblems } = checkSeed(payload);
  if (problems.length) {
    log(`\nseed: ${problems.length} seeded value(s) do not fit the schema — the copy is today's and is not trimmed:`);
    for (const problem of problems) log(`  · ${problem.owner} › ${problem.message}`);
  }
  if (checkOnly) {
    log(problems.length ? "\nseed check: FAILED (nothing written)." : "seed check: every seeded value fits its schema (nothing written).");
    await payload.destroy();
    await finish(problems.length ? 1 : 0);
  }
  // A collection or global record that cannot be saved would stop the run
  // half-way; refuse up front instead. A page that cannot be saved is skipped
  // on its own (below) so the rest of the site is still seeded.
  if (problems.some((problem) => !problem.owner.startsWith("page "))) {
    log("\nseed: nothing written — fix the collection/global values above first.");
    await payload.destroy();
    await finish(1);
  }

  log(`seed: ${launch ? "launch" : "parity"} posture${missingOnly ? ", missing-only" : ""}.`);
  const tally = new Tally();

  log("seed: 1/4 media…");
  const media = await seedMedia(payload, tally, log);

  log("seed: 2/4 collections…");
  const content = await seedContent(payload, tally, media, { placeholdersAsDrafts: launch, missingOnly }, log);

  log("seed: 3/4 globals…");
  await seedGlobals(payload, tally, media, { launchTerms: launch, missingOnly }, log);

  log("seed: 4/4 pages…");
  if (pagesWithProblems.size) {
    log(`seed: skipping ${[...pagesWithProblems].join(", ")} until the block schema can hold today's copy (see the list above).`);
  }
  await seedPages(payload, tally, media, content, { missingOnly, skip: pagesWithProblems }, log);

  log("");
  tally.print(log);

  log("\nDocuments now in the database:");
  for (const collection of COUNTED) {
    if (!payload.collections[collection]) continue;
    const { totalDocs } = await payload.count({ collection, overrideAccess: true });
    log(`  ${collection.padEnd(18)} ${totalDocs}`);
  }
  log(`\nseed: done in ${((Date.now() - started) / 1000).toFixed(1)} s.`);

  await payload.destroy();
  await finish(pagesWithProblems.size || tally.anyFailed ? 1 : 0);
}

// Awaited at the top level: `payload run` exits as soon as the import
// resolves, so a floating `main()` would be cut off after its first await.
await main().catch(async (error: unknown) => {
  console.error("seed: failed —", error instanceof Error ? error.message : error);
  const data = (error as { data?: { errors?: unknown } })?.data;
  if (data?.errors) console.error(JSON.stringify(data.errors, null, 2));
  await finish(1);
});
