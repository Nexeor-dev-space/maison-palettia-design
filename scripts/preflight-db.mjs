#!/usr/bin/env node
/**
 * ==========================================================================
 * preflight-db — is this database connection fit to deploy against?
 * ==========================================================================
 *
 *   node scripts/preflight-db.mjs        (npm run preflight:db)
 *
 * Run by scripts/deploy.sh before `payload migrate` (SPEC §A.5) and by hand.
 * It connects with DATABASE_URL and checks four things the spike found wrong
 * on the supplied credentials (docs/cms/research/00-spike.md §6):
 *
 *   1. TLS — `pg_stat_ssl.ssl` must be true unless the host is private
 *      (RFC 1918, loopback, or a bare Docker service name);
 *   2. role — `current_user` must not be SUPERUSER or have CREATEDB; the app
 *      only needs DDL on its own schema plus DML;
 *   3. database — in production it must be `maison_palettia_prod`;
 *   4. PostGIS — must NOT be required: the schema never uses `type: "point"`
 *      and the alpine image cannot install the extension. Reported for
 *      information only.
 *
 * HARD GATE ONLY IN PRODUCTION (docs/cms/DECISIONS.md, item 2). Today the
 * one database is reached as `postgres` over plaintext, by decision of the
 * owner, so in development every failure prints as a WARNING and the exit
 * code is 0. With NODE_ENV=production the same failures exit 1 and the
 * deploy stops. The checks are identical either way, so a developer sees
 * exactly what the deploy will refuse.
 *
 * Plain Node, no TypeScript, no Payload: this has to run on a host before
 * anything is built, and `pg` is already a dependency of the adapter.
 */
import pg from "pg";

const isProd = process.env.NODE_ENV === "production";
const EXPECTED_DB = "maison_palettia_prod";

if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env");
  } catch {
    /* no .env — DATABASE_URL must come from the environment */
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("preflight-db: DATABASE_URL is not set.");
  process.exit(isProd ? 1 : 0);
}

/** RFC 1918 / loopback / link-local, or a hostname with no dot (a Docker service name). */
function isPrivateHost(host) {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "localhost" || h === "::1" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".local")) return true;
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^fc|^fd/.test(h) && h.includes(":")) return true; // IPv6 ULA
  return !h.includes(".") && !h.includes(":"); // compose service name
}

const problems = [];
const notes = [];
let parsed;
try {
  parsed = new URL(url);
} catch {
  console.error("preflight-db: DATABASE_URL is not a valid URL.");
  process.exit(isProd ? 1 : 0);
}

const host = parsed.hostname;
const privateHost = isPrivateHost(host);
const sslmode = parsed.searchParams.get("sslmode");
if (!privateHost && sslmode !== "verify-full") {
  problems.push(`DATABASE_URL has sslmode=${sslmode ?? "(unset)"} for the public host ${host}; production needs ?sslmode=verify-full&sslrootcert=<ca>.`);
}
if (sslmode === "disable" && !privateHost) {
  problems.push(`sslmode=disable is only acceptable for a private host; ${host} is not one.`);
}

const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 10_000 });
try {
  await client.connect();

  // One client, one query at a time: pg queues concurrent calls but warns about it.
  const { rows: ssl } = await client.query("select ssl from pg_stat_ssl where pid = pg_backend_pid()");
  const { rows: role } = await client.query("select rolname, rolsuper, rolcreatedb, rolcreaterole from pg_roles where rolname = current_user");
  const { rows: db } = await client.query("select current_database() as db");
  const { rows: ext } = await client.query("select count(*)::int as n from pg_extension where extname = 'postgis'");
  const { rows: version } = await client.query("select version()");

  notes.push(`server: ${version[0]?.version?.split(" on ")[0] ?? "unknown"}`);
  notes.push(`host: ${host} (${privateHost ? "private" : "public"}), database: ${db[0]?.db}, role: ${role[0]?.rolname}`);

  if (!ssl[0]?.ssl && !privateHost) problems.push("The connection is NOT encrypted (pg_stat_ssl.ssl = false) and the host is public.");
  if (role[0]?.rolsuper) problems.push(`Role ${role[0].rolname} is a SUPERUSER; the app should connect as a dedicated role (maison_palettia_app).`);
  if (role[0]?.rolcreatedb) problems.push(`Role ${role[0].rolname} has CREATEDB; the app role needs neither CREATEDB nor CREATEROLE.`);
  if (role[0]?.rolcreaterole) problems.push(`Role ${role[0].rolname} has CREATEROLE.`);
  if (isProd && db[0]?.db !== EXPECTED_DB) problems.push(`Connected to database "${db[0]?.db}", expected "${EXPECTED_DB}" in production.`);
  notes.push(ext[0]?.n > 0 ? "postgis: installed (not required by this schema)" : "postgis: not installed (correct — the schema never needs it)");
} catch (error) {
  problems.push(`Could not connect: ${error instanceof Error ? error.message : String(error)}`);
} finally {
  await client.end().catch(() => undefined);
}

for (const note of notes) console.log(`preflight-db: ${note}`);

if (problems.length === 0) {
  console.log("preflight-db: OK — the connection meets the deployment gate (SPEC §A.5).");
  process.exit(0);
}

const level = isProd ? "FAIL" : "WARN";
for (const problem of problems) console[isProd ? "error" : "warn"](`preflight-db ${level}: ${problem}`);
if (isProd) {
  console.error("preflight-db: refusing to continue in production. Fix the items above (docs/cms/SPEC.md §A.5) and re-run.");
  process.exit(1);
}
console.warn("preflight-db: development run — the items above are warnings here and hard failures with NODE_ENV=production (docs/cms/DECISIONS.md).");
process.exit(0);
