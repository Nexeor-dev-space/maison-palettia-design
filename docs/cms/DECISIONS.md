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
8. **Phase 2 parity exception: the placeholder Candle Making session shows
   12 seats, not 9.** The design-phase data (lib/workshops.ts) printed
   `seatsAvailable: 9`; SPEC §F.4 deliberately does not carry demo "seats
   sold" into `session-inventory` (a seeded `seatsSold` would be counted by
   the Phase 3 reconcile job as real sales with no orders behind them), so
   the seeded row has `seatsSold: 0` and the page reads "12 spots
   available", and the /book quantity picker offers up to 12. SPEC §F.4
   wins; this is the one accepted visible difference in the Phase 2 parity
   gate (/events, the seven experience pages, the session pages and
   /events/candle-making/book). It disappears when the placeholder sessions
   are replaced with real ones or saved as drafts (`npm run seed -- launch`).
9. **The site's canonical origin waits for a confirmed address.** Canonicals,
   `og:url`, the sitemap and robots use Site details → `publicUrl` only once
   an admin has saved it (`system-state.publicUrlConfirmedAt`); before that
   an https `NEXT_PUBLIC_SERVER_URL`, else `SITE.url`
   (lib/constants.server.ts `getSite`). Reason: on the shared database (#1)
   the seeded `publicUrl` is the dev machine's `http://localhost:3200`.
   Emails, payment returns and preview links keep the SPEC §A.4 order
   (cms/lib/publicUrl.ts), which needs a working address on this machine.
10. **`POST /api/site/revalidate` landed in Phase 2**, not 3B, because
    scheduled publishing (enabled on every drafted collection) purges
    through it — without it a scheduled publish changed the database but not
    the cached page. It implements the SPEC §G.4 contract exactly; 3B owns
    the folder and may restyle it. `<SeatsLive>` is the opposite case: it is
    not mounted until 3B's availability route exists.
