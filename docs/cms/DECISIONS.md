# CMS build — environment decisions that override SPEC.md

Recorded 2026-10-09 from the owner's instructions. Where this file and
SPEC.md disagree, this file wins.

1. **Database for development and production is the same, owner-supplied
   Postgres** (`DATABASE_URL` in the git-ignored `.env`, database
   `maison_palettia_prod` on a shared Nexeor host; it was empty at the
   start of the build). There is no Docker on the build machine, so the
   SPEC's "local Docker Postgres for dev" precondition does not apply:
   `npx payload migrate` runs against this database, `push: false`
   always, migrations are additive (SPEC §A.5 rule).
2. **`scripts/preflight-db.mjs` is a hard gate only when
   `NODE_ENV=production`** (deploy). In development it prints the same
   checks as warnings and exits 0, because the supplied credentials are
   the `postgres` superuser over plaintext. The SPEC §A.5 database gate
   (dedicated `maison_palettia_app` role, TLS or private network) is a
   recommendation handed to Nexeor, not something the build performs.
3. **`.env` is the only env file** (not `.env.local`); it holds exactly
   `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL` (SPEC §C.1).
4. **Dev server port is 3200, never 3000** (another project uses 3000 on
   this machine). `.claude/launch.json` encodes this.
5. Everything else configurable lives in the admin panel (SPEC §C.3), with
   no redeploy — the owner's hard constraint.
