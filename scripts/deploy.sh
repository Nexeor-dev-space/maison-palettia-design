#!/usr/bin/env bash
# ==========================================================================
# deploy.sh — one command from "git checkout <tag>" to a live, purged site
# ==========================================================================
#
#   scripts/deploy.sh [--seed]                     deploy the current checkout
#   scripts/deploy.sh --rollback                   back to the release live before this one
#   scripts/deploy.sh --help                       every option
#
# Run on the app host, as the app user, from anywhere (it cd's to the repo
# root it lives in). The order is SPEC §A.5's and never changes:
#
#   1. preflight-db   scripts/preflight-db.mjs with NODE_ENV=production — a
#                     HARD gate: superuser role, CREATEDB, plaintext to a
#                     public host, or the wrong database name stops the
#                     deploy before anything is written (DECISIONS.md #2).
#   2. npm ci         dev dependencies included (`next build` needs
#                     TypeScript and Tailwind; NODE_ENV=production would
#                     otherwise drop them).
#   3. migrate        `payload migrate` — committed migrations only, push:false.
#   (3b. --seed)      first deploy only: `payload run cms/seed/index.ts launch`.
#                     Refused when the database already has pages, because the
#                     seed upserts — on a live site it would put back the
#                     wording the owner has since changed.
#   4. next build     prerenders through the Local API, so it needs the
#                     migrated database (that is why migrate comes first).
#   5. release        the standalone output is copied to releases/<time>-<sha>,
#                     with media/, private/ and .env symlinked back to the
#                     checkout, and `releases/current` is pointed at it.
#   6. restart        systemd (default), docker compose, or a command you give.
#   7. health         GET /api/users/me must answer 200 — a real route, not
#                     the port (DECISIONS.md #7: a process whose Payload failed
#                     to boot still listens and answers 500).
#                     Unhealthy → automatic rollback to the previous release.
#   8. revalidate     scripts/revalidate.mjs POSTs the signed
#                     `{ paths: ["/"], layout: true }` purge on loopback, so no
#                     page cached before the deploy outlives it.
#
# WHY RELEASE DIRECTORIES. `next build` empties `.next/` before it writes,
# and a server started as `node .next/standalone/server.js` loads most of
# its route code lazily from there — so building in place breaks the live
# site for the minutes the build takes. Here the live process runs from its
# own copy under releases/, the build happens next to it, and the only
# interruption is the restart itself. It also makes rollback a symlink flip
# (seconds) instead of a rebuild (minutes). The copy finds its uploads
# because cms/lib/paths.ts resolves the project root from the release's own
# location and `media`/`private` there are symlinks to the checkout's.
#
# ROLLBACK NEVER TOUCHES THE DATABASE. That is safe only because migrations
# are additive within a release (docs/cms-runbook.md, "The migration rule"):
# the previous code must run against the newer schema.
#
# Everything is logged to releases/logs/deploy-<time>.log as well as the
# terminal. One deploy at a time (a lock directory in releases/).
# ==========================================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# ---- options --------------------------------------------------------------
SEED=0
ROLLBACK=0
ROLLBACK_TO=""
SKIP_INSTALL=0
ALLOW_DIRTY=0
APP_PORT="${PORT:-3200}"
RELEASES_DIR="$(dirname "$APP_DIR")/releases"
RESTART="auto"
KEEP=3
HEALTH_TIMEOUT=120
SERVICE="maison-palettia"

usage() {
  cat <<'USAGE'
Usage: scripts/deploy.sh [options]

  --seed               First deploy only: load the launch content after migrating.
                       Refused if the database already has pages.
  --rollback           Go back to the release that was live before the current
                       one (restart, health check, purge). Database untouched.
  --rollback-to REL    Same, to a named release (ls the releases dir).
  --restart MODE       systemd | compose | none | cmd:<shell command>
                       (default: systemd if the unit exists, else compose if
                       docker-compose.yml and docker exist)
  --service NAME       systemd unit name (default maison-palettia)
  --port N             port the app listens on, for the health check and the
                       purge (default $PORT or 3200)
  --releases-dir DIR   where release copies live (default ../releases)
  --keep N             releases to keep on disk (default 3, minimum 2)
  --health-timeout S   seconds to wait for the app to answer (default 120)
  --skip-install       skip `npm ci` (only when package-lock.json is unchanged)
  --allow-dirty        deploy even if tracked files differ from the commit
  -h, --help           this text
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --seed) SEED=1 ;;
    --rollback) ROLLBACK=1 ;;
    --rollback-to) ROLLBACK=1; ROLLBACK_TO="${2:?--rollback-to needs a release name}"; shift ;;
    --skip-install) SKIP_INSTALL=1 ;;
    --allow-dirty) ALLOW_DIRTY=1 ;;
    --restart) RESTART="${2:?--restart needs a value}"; shift ;;
    --service) SERVICE="${2:?--service needs a value}"; shift ;;
    --port) APP_PORT="${2:?--port needs a value}"; shift ;;
    --releases-dir) RELEASES_DIR="${2:?--releases-dir needs a value}"; shift ;;
    --keep) KEEP="${2:?--keep needs a value}"; shift ;;
    --health-timeout) HEALTH_TIMEOUT="${2:?--health-timeout needs a value}"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "deploy: unknown option $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

case "$APP_PORT" in ''|*[!0-9]*) echo "deploy: --port must be a number" >&2; exit 2 ;; esac
case "$KEEP" in ''|*[!0-9]*) echo "deploy: --keep must be a number" >&2; exit 2 ;; esac
[ "$KEEP" -ge 2 ] || KEEP=2
if [ "$SEED" = 1 ] && [ "$ROLLBACK" = 1 ]; then
  echo "deploy: --seed and --rollback do not go together" >&2
  exit 2
fi

# Everything below is a production run: the preflight is a hard gate, the
# Payload config insists on TLS settings and NEXT_PUBLIC_SERVER_URL, and the
# seed/build behave as they will on the live process.
export NODE_ENV=production

mkdir -p "$RELEASES_DIR/logs"
RELEASES_DIR="$(cd "$RELEASES_DIR" && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$RELEASES_DIR/logs/deploy-$STAMP.log"
exec > >(tee -a "$LOG") 2>&1

STARTED=$(date +%s)
say() { printf '\n\033[1;35m==> %s\033[0m  (+%ss)\n' "$*" "$(( $(date +%s) - STARTED ))"; }
info() { printf '    %s\n' "$*"; }
die() { printf '\n\033[1;31mdeploy: %s\033[0m\n' "$*" >&2; exit 1; }

LOCK="$RELEASES_DIR/.deploy.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  die "another deploy is running (lock $LOCK). If none is, remove that directory and retry."
fi
trap 'rmdir "$LOCK" 2>/dev/null || true' EXIT

[ "$(id -u)" = 0 ] && info "warning: running as root — run as the app user so files stay owned by it."

# ---- restart mode -----------------------------------------------------------
if [ "$RESTART" = auto ]; then
  if command -v systemctl >/dev/null 2>&1 && systemctl cat "$SERVICE" >/dev/null 2>&1; then
    RESTART=systemd
  elif [ -f "$APP_DIR/docker-compose.yml" ] && command -v docker >/dev/null 2>&1; then
    RESTART=compose
  else
    die "no systemd unit '$SERVICE' and no docker — pass --restart systemd|compose|none|cmd:<command>."
  fi
fi
case "$RESTART" in
  systemd|compose|none|cmd:*) ;;
  *) die "unknown --restart mode '$RESTART'" ;;
esac
# Release directories serve the systemd and cmd modes. Compose runs from an
# image (Dockerfile) and keeps its history as image tags instead.
USES_RELEASES=1
[ "$RESTART" = compose ] && USES_RELEASES=0

as_root() { if [ "$(id -u)" = 0 ]; then "$@"; else sudo -n "$@"; fi; }

restart_app() {
  local release="$1"
  case "$RESTART" in
    systemd) as_root systemctl restart "$SERVICE" ;;
    compose) MP_IMAGE_TAG="$release" docker compose -f "$APP_DIR/docker-compose.yml" up -d app ;;
    none) info "--restart none: restart the app yourself, then run: node scripts/revalidate.mjs --port $APP_PORT" ;;
    cmd:*) MP_RELEASE_DIR="$RELEASES_DIR/$release" bash -c "${RESTART#cmd:}" ;;
  esac
}

# 200 from /api/users/me with a JSON body that has a "user" key — Payload is
# up, the database answered, the auth layer ran. Polls once a second.
health_check() {
  MP_PORT="$APP_PORT" MP_TIMEOUT="$HEALTH_TIMEOUT" node --input-type=module <<'NODE'
const port = Number(process.env.MP_PORT);
const timeout = Number(process.env.MP_TIMEOUT);
const deadline = Date.now() + timeout * 1000;
let last = "no answer";
while (Date.now() < deadline) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/users/me`, { signal: AbortSignal.timeout(5000) });
    const text = await res.text();
    if (res.status === 200 && /"user"\s*:/.test(text)) {
      const home = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(15000) });
      if (home.status === 200) { console.log(`    healthy: /api/users/me 200, / 200`); process.exit(0); }
      last = `/ answered ${home.status}`;
    } else last = `/api/users/me answered ${res.status}`;
  } catch (error) { last = error.cause?.code ?? error.message; }
  await new Promise((r) => setTimeout(r, 1000));
}
console.error(`    unhealthy after ${timeout}s: ${last}`);
process.exit(1);
NODE
}

purge() {
  node scripts/revalidate.mjs --port "$APP_PORT" --path / || info "warning: the purge failed — pages may show pre-deploy content until they expire. Re-run: node scripts/revalidate.mjs --port $APP_PORT"
}

# Releases are named <UTC time>-<sha>, so lexical order is age order.
# `history` records every release that went live, in order (deploys,
# rollbacks, automatic rollbacks) — the answer to "what was live before
# this?", which after a rollback is not simply the next-oldest release.
HISTORY="$RELEASES_DIR/history"
list_releases() { (cd "$RELEASES_DIR" && ls -1d 2*/ 2>/dev/null | sed 's:/$::' | sort) || true; }
current_release() {
  if [ "$USES_RELEASES" = 1 ]; then
    [ -L "$RELEASES_DIR/current" ] && basename "$(readlink "$RELEASES_DIR/current")" || true
  else
    [ -s "$HISTORY" ] && tail -n 1 "$HISTORY" || true
  fi
}
release_exists() {
  if [ "$USES_RELEASES" = 1 ]; then [ -d "$RELEASES_DIR/$1" ]
  else docker image inspect "maison-palettia:$1" >/dev/null 2>&1; fi
}
# The most recent release in the history, other than $1, that still exists;
# with no history yet, the newest release directory older than $1.
previous_live() {
  local r
  if [ -s "$HISTORY" ]; then
    for r in $(awk '{ a[NR] = $0 } END { for (i = NR; i > 0; i--) print a[i] }' "$HISTORY"); do
      [ "$r" = "$1" ] && continue
      if release_exists "$r"; then echo "$r"; return 0; fi
    done
  fi
  [ "$USES_RELEASES" = 1 ] && list_releases | awk -v cur="$1" '$0 < cur' | tail -n 1
  return 0
}

# Make $1 the live release: the `current` symlink (systemd/cmd modes) and
# the history line (all modes). The restart is separate.
go_live() {
  local release="$1"
  if [ "$USES_RELEASES" = 1 ]; then
    ln -sfn "$release" "$RELEASES_DIR/.current.tmp"
    # GNU mv -T renames over the old link atomically; BSD mv lacks it.
    mv -Tf "$RELEASES_DIR/.current.tmp" "$RELEASES_DIR/current" 2>/dev/null \
      || { rm -f "$RELEASES_DIR/current"; mv -f "$RELEASES_DIR/.current.tmp" "$RELEASES_DIR/current"; }
  fi
  echo "$release" >> "$HISTORY"
}

# ---- rollback -----------------------------------------------------------------
if [ "$ROLLBACK" = 1 ]; then
  CUR="$(current_release)"
  [ -n "$CUR" ] || die "there is no live release to roll back from."
  if [ -n "$ROLLBACK_TO" ]; then
    PREV="$ROLLBACK_TO"
    release_exists "$PREV" || die "release $PREV does not exist. On disk: $(list_releases | tr '\n' ' ')"
  else
    PREV="$(previous_live "$CUR")"
    [ -n "$PREV" ] || die "no earlier live release is left to go back to. On disk: $(list_releases | tr '\n' ' ')"
  fi
  [ "$PREV" != "$CUR" ] || die "$PREV is already live."
  say "Rolling back $CUR → $PREV (the database is not changed)"
  go_live "$PREV"
  say "Restarting ($RESTART)"
  restart_app "$PREV"
  if [ "$RESTART" != none ]; then
    say "Health check"
    health_check || die "$PREV is not healthy either — see the service logs (journalctl -u $SERVICE / docker compose logs app)."
    say "Purging cached pages"
    purge
  fi
  say "Rolled back to $PREV. Log: $LOG"
  exit 0
fi

# ---- the checkout -------------------------------------------------------------
SHA="nogit"
if [ -d .git ] && command -v git >/dev/null 2>&1; then
  SHA="$(git rev-parse --short=12 HEAD)"
  if ! git diff --quiet HEAD -- 2>/dev/null; then
    if [ "$ALLOW_DIRTY" = 1 ]; then
      info "warning: tracked files differ from $SHA (--allow-dirty)."
    else
      git status --short --untracked-files=no
      die "tracked files differ from commit $SHA. Deploy a clean checkout (git stash / git checkout <tag>) or pass --allow-dirty."
    fi
  fi
fi
RELEASE="$STAMP-$SHA"
say "Deploying $RELEASE from $APP_DIR (restart: $RESTART, port $APP_PORT)"
command -v node >/dev/null || die "node is not installed (Node 22 LTS required)."
case "$(node -v)" in v22.*) ;; *) info "warning: Node $(node -v) — the project is built and tested on Node 22 LTS." ;; esac
if [ "$USES_RELEASES" = 1 ]; then command -v rsync >/dev/null || die "rsync is required to stage a release."; fi
mkdir -p media private

preflight() {
  say "Preflight: database gate (SPEC §A.5)"
  node scripts/preflight-db.mjs || die "the database connection does not meet the production gate — nothing was changed. Fix DATABASE_URL / the role (docs/cms-runbook.md, 'Database gate') and re-run."
}

install() {
  if [ "$SKIP_INSTALL" = 1 ]; then
    say "Dependencies: skipped (--skip-install)"
  else
    say "Dependencies: npm ci"
    npm ci --include=dev --no-audit --no-fund --loglevel=error
  fi
}

# The preflight needs the `pg` driver from node_modules. On a host that has
# never been deployed there is none yet, so the install goes first there —
# it touches neither the database nor the running release.
if [ -d node_modules/pg ]; then
  preflight
  install
else
  install
  preflight
fi

say "Database: payload migrate"
npx payload migrate

if [ "$SEED" = 1 ]; then
  say "Seed: checking the database is empty"
  # With --env-file, values already in the environment win over .env.
  ENV_FILE_FLAG=""
  [ -f .env ] && ENV_FILE_FLAG="--env-file=.env"
  PAGES="$(node $ENV_FILE_FLAG --input-type=module -e '
    import pg from "pg";
    const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await c.connect();
    try { const { rows } = await c.query("select count(*)::int as n from pages"); console.log(rows[0].n); }
    catch { console.log(0); } finally { await c.end(); }
  ' || true)"
  case "$PAGES" in ''|*[!0-9]*) die "could not read the pages table to decide whether seeding is safe." ;; esac
  if [ "$PAGES" -gt 0 ]; then
    die "--seed refused: the database already has $PAGES pages. The seed overwrites changed wording with the original; it is a first-deploy step only. (To add only what is missing: npx payload run cms/seed/index.ts missing-only)"
  fi
  say "Seed: launch content (sessions and passes as drafts, bookings closed)"
  npx payload run cms/seed/index.ts launch
fi

say "Build: next build"
npx next build

[ -f .next/standalone/server.js ] || die "next build produced no .next/standalone/server.js (is output: \"standalone\" still in next.config.ts?)."
# The traced copy must not keep .env, media/ or private/ (customer invoices).
bash scripts/prune-standalone.sh || die "could not prune .next/standalone (see scripts/prune-standalone.sh)."

if [ "$USES_RELEASES" = 1 ]; then
  REL="$RELEASES_DIR/$RELEASE"
  PREV_FOR_LINKS="$(current_release)"
  say "Release: staging $REL"
  # The standalone tracer copies far more than the server needs (the whole
  # checkout, including a snapshot of media/ and .env); none of that may
  # shadow the live folders, so it is excluded and re-linked below.
  # --link-dest hard-links every file whose content is unchanged since the
  # live release (node_modules, public/), so a release costs disk only for
  # what changed. --checksum is what makes that work: each build rewrites
  # every file with a fresh mtime, so rsync's default size+mtime test would
  # see all of them as new. The release's own .next/ is NEVER linked: the
  # server rewrites prerendered pages there in place (ISR), and a shared
  # inode would leak a newer page into an older release.
  LINK_DEST=""
  [ -n "$PREV_FOR_LINKS" ] && [ -d "$RELEASES_DIR/$PREV_FOR_LINKS" ] && LINK_DEST="--link-dest=$RELEASES_DIR/$PREV_FOR_LINKS"
  rsync -a --checksum $LINK_DEST \
    --exclude '/.next' --exclude '/.env*' --exclude '/media' --exclude '/private' --exclude '/assets' \
    --exclude '/docs' --exclude '/tests' --exclude '/.git' --exclude '/.claude' --exclude '/*.tsbuildinfo' \
    .next/standalone/ "$REL/"
  rsync -a --exclude '/cache' .next/standalone/.next/ "$REL/.next/"
  # Standalone leaves out the hashed client chunks; public/ is re-synced from
  # the checkout so the release matches it exactly (the traced copy can lag).
  LINK_STATIC=""
  [ -n "$LINK_DEST" ] && [ -d "$RELEASES_DIR/$PREV_FOR_LINKS/.next/static" ] && LINK_STATIC="--link-dest=$RELEASES_DIR/$PREV_FOR_LINKS/.next/static"
  rsync -a --checksum --delete $LINK_STATIC .next/static/ "$REL/.next/static/"
  rsync -a --checksum --delete public/ "$REL/public/"
  ln -sfn "$APP_DIR/media" "$REL/media"
  ln -sfn "$APP_DIR/private" "$REL/private"
  [ -f "$APP_DIR/.env" ] && ln -sfn "$APP_DIR/.env" "$REL/.env"
  echo "$RELEASE" > "$REL/RELEASE"
  info "staged: $(du -sh "$REL" 2>/dev/null | cut -f1) including the files hard-linked from the live release"
  PREVIOUS="$PREV_FOR_LINKS"
  go_live "$RELEASE"
  info "current → $RELEASE"
else
  say "Image: docker compose build (tag maison-palettia:$RELEASE)"
  PREVIOUS="$(current_release)"
  MP_IMAGE_TAG="$RELEASE" docker compose -f "$APP_DIR/docker-compose.yml" build app
  go_live "$RELEASE"
fi

say "Restarting ($RESTART)"
restart_app "$RELEASE"

if [ "$RESTART" = none ]; then
  say "Done — restart the app and purge by hand. Log: $LOG"
  exit 0
fi

say "Health check (up to ${HEALTH_TIMEOUT}s)"
if ! health_check; then
  if [ -n "${PREVIOUS:-}" ]; then
    say "UNHEALTHY — rolling back to $PREVIOUS"
    go_live "$PREVIOUS"
    restart_app "$PREVIOUS"
    health_check && purge
    die "release $RELEASE failed its health check and was rolled back to $PREVIOUS. The migrations it ran stay applied (they are additive). See the service logs."
  fi
  die "release $RELEASE failed its health check and there is no earlier release to fall back to. See the service logs (journalctl -u $SERVICE -n 200)."
fi

say "Purging cached pages (signed revalidate, layout)"
purge

if [ "$USES_RELEASES" = 1 ]; then
  # Keep the newest $KEEP, and always the live one and the one before it
  # (the --rollback target), whatever their age.
  CUR="$(current_release)"
  BEFORE="$(previous_live "$CUR")"
  OLD="$(list_releases | awk -v keep="$KEEP" '{ a[NR] = $0 } END { for (i = 1; i <= NR - keep; i++) print a[i] }')"
  for r in $OLD; do
    [ "$r" = "$CUR" ] || [ "$r" = "$BEFORE" ] && continue
    info "removing old release $r"
    rm -rf "${RELEASES_DIR:?}/$r"
  done
fi

say "Deployed $RELEASE in $(( $(date +%s) - STARTED ))s. Log: $LOG"
[ "$SEED" = 1 ] && info "Next: open /admin and create the first user (it becomes the admin) — docs/owner-checklist.md step 1."
exit 0
