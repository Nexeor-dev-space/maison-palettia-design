# Maison Palettia — operations runbook

For Nexeor (or whoever runs the server). The owner's own setup list is
[`owner-checklist.md`](owner-checklist.md). The design behind every rule
here is [`cms/SPEC.md`](cms/SPEC.md) §A.5, §C.1 and §L Phase 5; environment
overrides are in [`cms/DECISIONS.md`](cms/DECISIONS.md).

## Before the first production deploy

In order. Nothing here is done by the build; each item is Nexeor's.

1. **A fresh production database.** The database the build used
   (`maison_palettia_prod` on the shared host) is the *development* database
   (DECISIONS.md #1): it holds test orders, mock payments, issued invoice
   numbers, a developer admin account, and `http://localhost:3200` as the
   site address. Rename it (e.g. `ALTER DATABASE maison_palettia_prod RENAME
   TO maison_palettia_dev`, and point the laptops' `.env` at the new name),
   then create an empty `maison_palettia_prod` owned by the new app role
   ([§4](#4-database-gate)). Invoice numbers must start clean on the live
   database — UAE VAT invoices are numbered without gaps.
2. **The database gate** ([§4](#4-database-gate)): role `maison_palettia_app`
   (no superuser/createdb/createrole), and TLS `verify-full` with the CA at
   `/etc/ssl/nexeor-pg.crt`, or a private network with 5433 firewalled.
   `NODE_ENV=production npm run preflight:db` must print OK.
3. **The server** ([§3](#3-first-time-server-setup)): Node 22, the `maison`
   user, the checkout, `.env` with the three keys (new `PAYLOAD_SECRET`, saved
   in the password manager; `NEXT_PUBLIC_SERVER_URL=https://<domain>`), the
   systemd unit and sudoers line.
4. **Domain and proxy:** DNS → server, nginx from
   `deploy/nginx.conf.example`, a Let's Encrypt certificate, ports 80/443
   only.
5. **Backups:** the cron line, `postgresql-client-16`, an off-host copy target,
   and one manual `scripts/backup.sh` run that succeeds.
6. **First deploy:** `scripts/deploy.sh --seed` from a tagged commit.
7. **First user:** open `https://<domain>/admin`, create the owner's account
   (or have the owner do it, `owner-checklist.md` step 1).
8. **Uptime monitor** on `https://<domain>/api/users/me` (expects 200), and an
   address for "Background task failed" emails (owner checklist step 6).
9. **Hand over** [`owner-checklist.md`](owner-checklist.md) — Mamo sandbox and
   live keys, email provider details and the TRN are the owner's to enter.
10. **A restore test** ([§8](#8-backups-and-the-restore-test)) within the first
    month.

Contents

1. [What runs where](#1-what-runs-where)
2. [Server layout](#2-server-layout)
3. [First-time server setup](#3-first-time-server-setup)
4. [Database gate](#4-database-gate)
5. [Deploying](#5-deploying)
6. [Rolling back](#6-rolling-back)
7. [The migration rule](#7-the-migration-rule)
8. [Backups and the restore test](#8-backups-and-the-restore-test)
9. [Rotating `PAYLOAD_SECRET` (reseal)](#9-rotating-payload_secret-reseal)
10. [Resetting a password](#10-resetting-a-password)
11. [Reverse proxy and rate limits](#11-reverse-proxy-and-rate-limits)
12. [Changing the domain](#12-changing-the-domain)
13. [Health, logs, and what to watch](#13-health-logs-and-what-to-watch)
14. [Docker instead of systemd](#14-docker-instead-of-systemd)
15. [If the site moves to Vercel](#15-if-the-site-moves-to-vercel)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. What runs where

```
visitor ──https──► nginx (TLS · appends X-Forwarded-For · 10/min on login endpoints · 30 MB uploads)
                     │  127.0.0.1:3200
                     ▼
                   node releases/current/server.js      ONE process: site + /admin + REST + jobs
                     │   reads/writes  app/media/  app/private/invoices/
                     ▼
                   Postgres 16  maison_palettia_prod   (shared Nexeor host; TLS verify-full or private network)
                   outbound: Mamo Pay · SMTP/Resend · (optional) analytics tags in visitors' browsers
```

- The site, the admin (`/admin`), the REST API (`/api`) and the background
  jobs (emails every 20 s, everything else every minute) are **one Node
  process**. Do not run two: page caches, rate-limit counters and the job
  runner all live in that process's memory (SPEC §A.5).
- `.env` holds **exactly three keys**: `DATABASE_URL`, `PAYLOAD_SECRET`,
  `NEXT_PUBLIC_SERVER_URL`. Every other setting — payment keys, SMTP,
  recipients, legal details, the site address — is in the admin and needs
  no deploy.
- `NEXT_PUBLIC_SERVER_URL` is **compiled in** by `next build`. Changing it
  needs a deploy, not a restart ([§12](#12-changing-the-domain)).

## 2. Server layout

```
/srv/maison-palettia/
  app/                        git checkout, owned by the `maison` user
    .env                      the three keys, mode 600
    media/                    uploads (persistent, backed up)
    private/invoices/         invoice PDFs (persistent, backed up — legal records)
    node_modules/ .next/      build workspace; the live site never runs from here
  releases/
    20261012T091500Z-3fcb989ab12c/   a standalone copy made by scripts/deploy.sh
    current -> 20261012T…            what systemd runs
    logs/deploy-<time>.log           one log per deploy
/var/backups/maison-palettia/<time>/ nightly backups (scripts/backup.sh)
/etc/ssl/nexeor-pg.crt                Postgres CA, if the DB is reached over TLS
```

Why releases: `next build` empties `.next/` while it works, and a server
running from `.next/standalone` would serve errors for the minutes the build
takes. The live process runs from its own copy; the only interruption in a
deploy is the restart (a few seconds). Each release's `media`, `private` and
`.env` are symlinks back into `app/`, and `cms/lib/paths.ts` resolves the
upload folders through them.

## 3. First-time server setup

Once, as root, on a Linux x86-64 host with glibc (Debian/Ubuntu):

```bash
# Node 22 LTS (NodeSource or the distro's nodejs 22), git, rsync, nginx, certbot,
# and the Postgres 16 client tools for backups.
apt install -y git rsync nginx certbot python3-certbot-nginx postgresql-client-16
node -v                                   # must print v22.x

adduser --system --group --shell /bin/bash --home /srv/maison-palettia maison
install -d -o maison -g maison /srv/maison-palettia/releases /var/backups/maison-palettia
sudo -u maison git clone <repo-url> /srv/maison-palettia/app
```

As `maison`, create `/srv/maison-palettia/app/.env` (mode 600):

```dotenv
DATABASE_URL=postgres://maison_palettia_app:<password>@<db-host>:5433/maison_palettia_prod?sslmode=verify-full&sslrootcert=/etc/ssl/nexeor-pg.crt
PAYLOAD_SECRET=<openssl rand -hex 32>
NEXT_PUBLIC_SERVER_URL=https://<domain>
```

Use a hex database password (`openssl rand -hex 24`): a `$` in any value is
expanded as a variable by Next's `.env` loader (and by Docker Compose).
Keep a copy of `PAYLOAD_SECRET` in the Nexeor password manager — without it
the encrypted settings (payment keys, SMTP password) cannot be read back
from a backup.

Then, as root:

```bash
cp /srv/maison-palettia/app/deploy/maison-palettia.service /etc/systemd/system/
systemctl daemon-reload && systemctl enable maison-palettia     # started by the first deploy
echo 'maison ALL=(root) NOPASSWD: /usr/bin/systemctl restart maison-palettia' > /etc/sudoers.d/maison-palettia
chmod 440 /etc/sudoers.d/maison-palettia

cp /srv/maison-palettia/app/deploy/nginx.conf.example /etc/nginx/sites-available/maison-palettia
#   edit: replace maisonpalettia.example with the domain (4 places + cert paths)
ln -s /etc/nginx/sites-available/maison-palettia /etc/nginx/sites-enabled/
certbot --nginx -d <domain> -d www.<domain>
nginx -t && systemctl reload nginx

# firewall: 22, 80, 443 open; 3200 closed (the app binds 127.0.0.1 anyway)

# nightly backup at 02:15
echo '15 2 * * * maison /srv/maison-palettia/app/scripts/backup.sh >> /var/log/maison-palettia-backup.log 2>&1' > /etc/cron.d/maison-palettia-backup
touch /var/log/maison-palettia-backup.log && chown maison /var/log/maison-palettia-backup.log
```

If `node` is not at `/usr/bin/node`, fix `ExecStart` in the unit.

## 4. Database gate

`scripts/preflight-db.mjs` runs first in every deploy, with
`NODE_ENV=production`, and **stops the deploy** if any of these fail
(SPEC §A.5, DECISIONS.md #2):

| Check | Passes when |
|---|---|
| Role | `current_user` is not SUPERUSER and has neither CREATEDB nor CREATEROLE |
| Encryption | `pg_stat_ssl.ssl` is true, **or** the host is private (RFC 1918, loopback, a Docker service name) |
| URL | a public host carries `sslmode=verify-full` (never `disable`) |
| Database | `current_database()` is `maison_palettia_prod` |

Today's credentials fail the first two (the `postgres` superuser, plaintext).
Nexeor's one-off fix, as the Postgres superuser on the DB host:

```sql
CREATE ROLE maison_palettia_app LOGIN PASSWORD '<long random>'
  NOSUPERUSER NOCREATEDB NOCREATEROLE;
-- a FRESH, empty production database (see "Before the first production deploy" above):
CREATE DATABASE maison_palettia_prod OWNER maison_palettia_app;
```

…and then **one** of:

- **(a) TLS:** enable `ssl = on` in the Postgres container with a server
  certificate; copy the CA to `/etc/ssl/nexeor-pg.crt` on the app host;
  `DATABASE_URL` ends `?sslmode=verify-full&sslrootcert=/etc/ssl/nexeor-pg.crt`.
- **(b) Private network:** app and Postgres on the same private network
  (same Docker network, or a private LAN/VPN address); port 5433 firewalled
  from the internet; `DATABASE_URL` uses the private address and ends
  `?sslmode=disable`.

Check by hand at any time: `NODE_ENV=production npm run preflight:db`.
The schema never needs PostGIS.

## 5. Deploying

```bash
sudo -iu maison
cd /srv/maison-palettia/app
git fetch --tags && git checkout <tag-or-commit>
scripts/deploy.sh                 # FIRST deploy only: scripts/deploy.sh --seed
```

What it does, in order (each step stops the deploy if it fails):

| # | Step | Notes |
|---|---|---|
| 1 | preflight-db | hard gate ([§4](#4-database-gate)). On the very first deploy `npm ci` runs first, because the preflight needs the `pg` driver; neither touches the database or the live site. |
| 2 | `npm ci --include=dev` | dev deps are needed by `next build` |
| 3 | `payload migrate` | committed migrations only; the old process keeps serving meanwhile — hence [§7](#7-the-migration-rule) |
| 3b | `--seed` only | `payload run cms/seed/index.ts launch`: media, pages, settings, email templates; sessions and passes as **drafts**, bookings **closed**. Refused if the database already has pages (the seed would overwrite the owner's wording). |
| 4 | `next build` | prerenders through the migrated database |
| 5 | stage release | `releases/<UTC time>-<sha>`, `current` → it |
| 6 | restart | `sudo systemctl restart maison-palettia` |
| 7 | health | `GET /api/users/me` = 200 and `GET /` = 200 within 120 s. **If not, it rolls back to the previous release automatically** and exits non-zero. |
| 8 | purge | `scripts/revalidate.mjs`: signed `POST /api/site/revalidate {paths:["/"], layout:true}` on loopback |
| 9 | prune | keeps the newest 3 releases (`--keep N`) |

It refuses to deploy a checkout whose tracked files differ from the commit
(`--allow-dirty` overrides), and refuses to run twice at once. Typical
duration: 3–6 minutes, of which the site is unavailable for the restart only.

After the **first** deploy: open `https://<domain>/admin` and create the
first user — it becomes the admin. Then hand over
[`owner-checklist.md`](owner-checklist.md).

`scripts/deploy.sh --help` lists every option (`--restart compose|none|cmd:…`,
`--rollback-to`, `--port`, `--releases-dir`, `--skip-install`, …).

## 6. Rolling back

```bash
scripts/deploy.sh --rollback
```

Goes back to the release that was live before the current one (the
deploy keeps a history in `releases/history`, so this is right even after
an earlier rollback), restarts, health-checks, purges. Takes seconds.
**The database is not rolled back** — that is safe because of the
migration rule: the previous code runs against the newer schema.

To pick a specific release instead: `ls /srv/maison-palettia/releases`, then
`scripts/deploy.sh --rollback-to <release>`. The newest 3 releases are kept,
plus always the live one and the one before it.

A deploy whose health check fails rolls itself back the same way, and says so.

When rollback is not enough (a migration itself was wrong): **fix forward**
— write a new additive migration that corrects it and deploy that. Restoring
the database from a backup ([§8](#8-backups-and-the-restore-test)) loses every
order and edit since the backup; it is for disasters, not bad deploys.

## 7. The migration rule

**Within one release, migrations only add.** The old process keeps serving
while `payload migrate` runs and until the restart, and `--rollback` runs
old code against the new schema, so the old code must not break on it.

| Change you want | Release N | Release N+1 (after N is live and stable) |
|---|---|---|
| New field / collection / index | add it (nullable or with a default) | — |
| Remove a field | stop using it in code (keep the column) | migration drops it |
| Rename a field | add the new one; copy data in the migration; code reads new, writes both | drop the old one |
| Make a field required | add with a default, backfill in the migration | add the NOT NULL |
| Change a select's options | add the new options | remove the old ones |

Workflow: edit the collection → `npx payload migrate:create <name>` →
**read the generated SQL** (look for `DROP`, `ALTER … TYPE`, `SET NOT NULL`,
`RENAME`) → commit both files in `migrations/`. `push: false` is permanent;
never hand-edit a migration that has already run anywhere.

## 8. Backups and the restore test

`scripts/backup.sh` (nightly via cron, [§3](#3-first-time-server-setup))
writes `/var/backups/maison-palettia/<UTC time>/`:

| File | What |
|---|---|
| `db.dump` | `pg_dump -Fc --no-owner --no-privileges` — checked readable (`pg_restore --list`) before the backup counts |
| `media.tar.gz` | every upload |
| `private.tar.gz` | invoice PDFs — UAE VAT records; keep them as long as the accounts |
| `SHA256SUMS` | for verifying an off-site copy |

Keeps the newest 14 (`--keep N`, `--dir DIR`). The password goes to
`pg_dump` through its environment, never the command line. **Copy the
folder off the host** (rsync to another machine, or object storage) — a
backup on the same disk protects against mistakes, not against losing the
server. The backups contain customer data and encrypted settings: keep
them as private as the database. A backup restored with a *different*
`PAYLOAD_SECRET` loses the encrypted settings (re-enter the keys in the admin).

**Monthly restore test** (15 minutes; needs a Postgres role that may create
databases — the DB host's superuser, never the app role):

```bash
B=/var/backups/maison-palettia/$(ls -1 /var/backups/maison-palettia | grep '^2' | tail -n1)
(cd "$B" && sha256sum -c SHA256SUMS)
createdb -h <db-host> -p 5433 -U postgres mp_restore_test
pg_restore -h <db-host> -p 5433 -U postgres -d mp_restore_test --no-owner "$B/db.dump"
psql -h <db-host> -p 5433 -U postgres -d mp_restore_test -c \
  "select (select count(*) from orders) orders, (select count(*) from pages) pages, (select count(*) from media) media, (select max(created_at) from orders) newest_order"
tar -tzf "$B/media.tar.gz" | wc -l       # ≈ number of files in app/media
dropdb -h <db-host> -p 5433 -U postgres mp_restore_test
```

The counts should match the live admin (Bookings → Orders, Content → Media).

**Real restore** (disaster only):

```bash
sudo systemctl stop maison-palettia
# as the Postgres superuser: an empty database owned by the app role
dropdb maison_palettia_prod && createdb -O maison_palettia_app maison_palettia_prod
pg_restore -d maison_palettia_prod --no-owner --role=maison_palettia_app "$B/db.dump"
cd /srv/maison-palettia/app && mv media media.old && mv private private.old
tar -xzf "$B/media.tar.gz" && tar -xzf "$B/private.tar.gz"
scripts/deploy.sh --skip-install     # migrates forward if the dump is older than the code, rebuilds, purges
```

## 9. Rotating `PAYLOAD_SECRET` (reseal)

`PAYLOAD_SECRET` signs logins and links and is the root key for the
encrypted settings. Rotate it if it may have leaked, or when someone with
server access leaves.

```bash
cd /srv/maison-palettia/app
scripts/backup.sh                                   # 1. a backup first
cp .env .env.before-rotation && chmod 600 .env.before-rotation
#   2. put the NEW value in .env (openssl rand -hex 32); keep the old one to hand
NODE_ENV=production npx payload run cms/scripts/reseal.ts --dry-run    # 3. prompts for the OLD secret (hidden)
NODE_ENV=production npx payload run cms/scripts/reseal.ts              # 4. re-encrypts every stored secret
sudo systemctl restart maison-palettia && node scripts/revalidate.mjs  # 5. immediately
shred -u .env.before-rotation                       # 6. once the admin shows no red banner
```

The old secret is read from a hidden prompt (or `OLD_PAYLOAD_SECRET` in the
environment) — **never** as an argument (shell history, `ps`). Between
steps 4 and 5 the running process cannot read the settings, so do them back
to back. No rebuild is needed (the secret is not a `NEXT_PUBLIC_` value).

What a rotation invalidates — tell the owner beforehand:

| Thing | Effect | What people do |
|---|---|---|
| Encrypted settings | fine if resealed; if not, a red banner in the admin | re-enter the keys in Settings (Replace) |
| Staff sessions | everyone is logged out | log in again |
| Payment return links (`k`, ≤ 24 h) and PDF download links (≤ 30 days) in sent emails | stop working | customers use "My bookings" on the site |
| Magic links (30 min), customer "my bookings" sessions | expire | request a new link |
| **Ticket QR codes** | **unaffected** (checked against the database) | nothing |

## 10. Resetting a password

Normally: staff use "Forgot password?" on the login page (needs email set up),
or an admin uses **Send login link** on the staff member's page. If the owner
is locked out before email works:

```bash
cd /srv/maison-palettia/app
NODE_ENV=production npx payload run cms/scripts/reset-password.ts owner@example.com
```

It prompts twice for the new password (hidden, 12+ characters), unlocks the
account and reactivates it.

## 11. Reverse proxy and rate limits

[`deploy/nginx.conf.example`](../deploy/nginx.conf.example) is the
reference. What must hold, whatever the proxy:

- **TLS** on the public origin. Mamo Pay webhooks and the check-in camera
  require https.
- **`X-Forwarded-For` is appended** (`$proxy_add_x_forwarded_for`). The app
  reads the **last** hop (`cms/lib/rateLimit.ts::clientIp`); a client can put
  anything on the left. The app must not be reachable except through the
  proxy (it binds 127.0.0.1). If a CDN is added in front, restore the
  visitor's address with nginx's realip module first.
- **10 requests/min/IP** on `/api/users/login`, `forgot-password`,
  `reset-password`, `first-register`, `unlock` (burst 5); a generous limit on
  the rest of `/api/users/`. Payload 3 has no request limiter, and its
  per-account lockout would otherwise let anyone lock the owner out.
- **`client_max_body_size 30m`** — uploads are capped at 25 MB by the app;
  nginx's default 1 MB fails every photo.
- **`/api/site/revalidate` is not exposed** — only loopback callers (the deploy
  script, the jobs runner) use it.
- The app's own limits (checkout, webhook, enquiries, my-bookings, analytics)
  are in-process and need nothing from the proxy.

## 12. Changing the domain

1. DNS → the server; `certbot --nginx -d <new>`; update `server_name` and
   redirects in nginx.
2. `.env`: `NEXT_PUBLIC_SERVER_URL=https://<new>` → `scripts/deploy.sh`
   (a rebuild — the value is compiled in; it is the admin's CSRF allowlist).
3. Admin → Settings → Site details → Advanced → **Site address** → save.
4. Admin → Settings (admin) → Payments (Mamo Pay) → **Register/Update webhook**
   (the dashboard shows a red banner until this is done).
5. Old domain: keep a 301 to the new one in nginx.

## 13. Health, logs, and what to watch

| What | Where |
|---|---|
| Is it up? | `curl -s https://<domain>/api/users/me` → `{"user":null}` (200). The port alone is not enough: if Payload cannot reach the database at boot, the process still listens and answers 500 (DECISIONS.md #7). Point uptime monitoring at this URL. |
| App logs | `journalctl -u maison-palettia -f` |
| Deploy logs | `/srv/maison-palettia/releases/logs/` |
| Backups | `/var/log/maison-palettia-backup.log`; the newest folder's date |
| Jobs, emails, payments | the admin dashboard: red/amber banners for failed background tasks, failed emails, orders needing review, refund requests, webhook spikes. Settings → Who gets notified → "Background task failed" emails someone. |
| Disk | `df -h /srv /var/backups` — releases ≈ 300 MB each before hard-linking; media grows with uploads |

Settings → Site details → Advanced → **Run background tasks** pauses the job
runner (an admin switch, red banner while off). Turn it off before a manual
database operation and back on after.

## 14. Docker instead of systemd

Same host build, different runner — pick one, not both.

```bash
scripts/deploy.sh --restart compose
```

does steps 1–4 on the host, then `docker compose build app` (tagged
`maison-palettia:<release>`) and `docker compose up -d app`, health check,
purge. `--rollback` re-runs the previous tag. The
[`Dockerfile.runtime`](../Dockerfile.runtime) is **runtime only** — it copies
`.next/standalone`, `.next/static` and `public/`; it never builds (the build
needs the database). [`Dockerfile.runtime.dockerignore`](../Dockerfile.runtime.dockerignore) (BuildKit picks it up for `-f Dockerfile.runtime`) is a whitelist that
also keeps `.env` and the traced snapshot of `media/` out of the image.
The host that runs `npm ci` must match the image (linux/amd64, glibc): the
traced `node_modules` carry sharp's native binary. `media/` and `private/`
are bind-mounted from `app/`; the port is published on 127.0.0.1 only.
For a Postgres container on the same Docker network, see the comments in
[`docker-compose.yml`](../docker-compose.yml).

*Not rehearsed on the build machine (no Docker there); the systemd path was.*

## 15. If the site moves to Vercel

SPEC §A.5, "the Vercel delta" — what changes, nothing else does:

| Area | Self-hosted (now) | Vercel |
|---|---|---|
| Uploads, invoice PDFs | `media/`, `private/` on disk | `@payloadcms/storage-s3@3.90.2` (S3/R2 bucket; invoices in a private bucket) |
| Build | `scripts/deploy.sh` | build command `payload migrate && next build` |
| Background jobs | in-process `autoRun` crons | remove `autoRun`; Vercel Cron calls `GET /api/payload-jobs/run?queue=…` with `CRON_SECRET` — the one extra env var, only on Vercel |
| DB pool | `pool.max` as configured | `pool.max: 2` (many short-lived functions) |
| Analytics buffer | in-memory, flushed by the process | direct inserts |
| Revalidation | in-process cache | Vercel's shared cache (works as-is) |
| Database gate | TLS or private network | TLS `verify-full` mandatory (Vercel → Nexeor is the internet) |
| Rate limits | nginx | Vercel Firewall rules on the same `/api/users/*` paths; the in-process limits become per-instance |
| `output: "standalone"` | used | harmless |

## 16. Troubleshooting

| Symptom | Likely cause → fix |
|---|---|
| Deploy stops at preflight | the DB gate ([§4](#4-database-gate)); nothing was changed |
| `--seed refused` | the database already has content — the seed is a first-deploy step. To add only what is missing: `npx payload run cms/seed/index.ts missing-only` |
| Health check fails, auto-rollback | `journalctl -u maison-palettia -n 200`. Common: DB unreachable (TLS/CA path), `NEXT_PUBLIC_SERVER_URL` missing. |
| `revalidate: HTTP 401` at the end of a deploy | `PAYLOAD_SECRET` in the shell differs from the one the server loaded, or the server's clock is off by > 60 s (`timedatectl`) |
| Photo upload fails with 413 | proxy `client_max_body_size` |
| Admin login works on one address but not another | the admin cookie is only accepted from `NEXT_PUBLIC_SERVER_URL`'s origin (CSRF) — use that address, or redeploy with the right one |
| Red banner "Encrypted settings cannot be read" | `PAYLOAD_SECRET` changed without a reseal ([§9](#9-rotating-payload_secret-reseal)) — reseal with the old secret, or re-enter the keys |
| Red banner about the Mamo webhook address | the site address changed: Payments → Register/Update webhook |
| Pages show old content after an edit | should not happen (on-demand revalidation); force it with `node scripts/revalidate.mjs` on the server |
| Uploads disappear after a deploy | something started the server from `.next/standalone` instead of `releases/current`; check `ExecStart`. The boot check in `cms/seed/defaults.ts` refuses an upload folder inside `.next/`. |

## Deploying with Coolify (Nixpacks)

Coolify builds this repository from source with Nixpacks — a different path
from `scripts/deploy.sh` and `Dockerfile.runtime` above. What makes it work:

- **`.dockerignore`** keeps the source in the build context (only
  `node_modules`, `.next`, `.git`, `.env*`, `media/`, `private/` are left
  out). The runtime-only whitelist lives in `Dockerfile.runtime.dockerignore`;
  putting it back at the root strips `.nixpacks/` and the source and the
  build fails with `"/.nixpacks/nixpkgs-….nix": not found`.
- **`nixpacks.toml`** keeps install/build as `npm ci` / `npm run build` and
  starts with `npm run start:prod` = `payload migrate` then
  `scripts/start-standalone.sh` (links `.next/static` and `public/` into the
  standalone folder, binds `0.0.0.0`, listens on `PORT`, default 3000).

### Coolify settings

| Setting | Value |
|---|---|
| Build pack | Nixpacks |
| Ports exposes | `3000` |
| Health check path | `/api/users/me` (expects 200) |
| Persistent storage | volume → `/app/media` (uploads) and volume → `/app/private` (invoice PDFs). **Without these every deploy deletes uploaded photos and invoices.** |

### Environment variables (tick **Build Variable** on the first three — `next build` prerenders from the database)

| Key | Notes |
|---|---|
| `DATABASE_URL` | Must end in `?sslmode=disable` while the Postgres server has no TLS. In production the app otherwise insists on a verified TLS connection and fails with "The server does not support SSL connections". When TLS is enabled on Postgres, switch to `?sslmode=verify-full&sslrootcert=…` (§ Database gate). |
| `PAYLOAD_SECRET` | Must be identical everywhere the same database is used (laptops included) — it decrypts the payment/email keys stored in the admin. Rotating it needs `cms/scripts/reseal.ts` first. |
| `NEXT_PUBLIC_SERVER_URL` | `https://<the public domain>`; baked in at build time (CSRF allowlist). Also set Settings → Site details → Site address to the same URL. |
| `NODE_OPTIONS` | `--max-old-space-size=1536` recommended. The build measured ~850 MB peak and passes at 768, but with little headroom. |
| `NIXPACKS_NODE_VERSION` | `22` |

`scripts/preflight-db.mjs` is not run by Coolify; the database gate (dedicated
non-superuser role, TLS or a private network) is still owed before real
customer data lands — see "Database gate".

### Photos missing on the server ("image" requests return 400)

The media library is rows in Postgres plus files in `/app/media`. If the
files are missing (a new server, an empty or lost volume, or a seed that ran
on another machine), every `/api/media/file/…` is a 404 and `/_next/image`
answers 400. `npm run start:prod` runs `cms/scripts/restore-media.ts` before
the server starts: any seeded photo whose file is missing is re-imported from
its original in `public/` into the same library entry (same name, sizes
regenerated). Photos uploaded through the admin have no copy in git; the start
log lists them as "missing with no source" so they can be re-uploaded. Run it
by hand with `npm run restore:media`.
