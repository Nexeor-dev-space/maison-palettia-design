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
6. **`NEXT_PUBLIC_SERVER_URL` is fixed per build.** Next inlines
   `NEXT_PUBLIC_*` variables into the server bundle (confirmed in the Phase 1
   review: the production chunk carries the literal, and the standalone
   server's csrf allowlist is the build-time value). A domain change
   therefore needs `next build` on the host with the new `.env`, not a
   restart; a Dockerfile that only COPYs the build output inherits the build
   host's value. If runtime configurability is ever wanted, rename the key
   without the `NEXT_PUBLIC_` prefix (nothing reads it on the client) — a
   SPEC §C.1 decision, not made here.
7. **Production-mode verification is blocked on the database gate.** With
   `NODE_ENV=production` and no `sslmode` in `DATABASE_URL`, the config
   forces verified TLS (SPEC §A.5) and today's owner Postgres refuses it
   ("The server does not support SSL connections"), so `getPayload` rejects
   in `instrumentation.ts` and Next keeps a dead process up answering 500.
   The Phase 1 standalone smoke was run with `?sslmode=disable` in the
   process environment only. Phase 5B: health-check a real route (e.g.
   `/api/users/me` → `{"user":null}`), not the port, and decide whether
   `register()` should exit non-zero so the supervisor restarts and alerts.
