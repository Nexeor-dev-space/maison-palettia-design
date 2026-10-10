#!/usr/bin/env bash
# ==========================================================================
# start-standalone.sh — run the built standalone server from a full checkout
# ==========================================================================
#
# Used by `npm run start:prod` (Coolify / Nixpacks, nixpacks.toml). The image
# there is the whole checkout plus `.next/` from `npm run build`, so:
#
#   1. `.next/standalone` leaves out the hashed client chunks and `public/`
#      (Next copies neither — scripts/deploy.sh and Dockerfile.runtime place
#      them by hand). Here they already sit beside it, so link them in rather
#      than copy ~100 MB on every boot.
#   2. HOSTNAME: Docker sets it to the container id, and server.js binds to
#      whatever HOSTNAME says. 0.0.0.0 so the proxy can reach it.
#   3. Uploads and invoice PDFs resolve to <checkout>/media and
#      <checkout>/private (cms/lib/paths.ts strips the `.next/standalone`
#      segment), i.e. /app/media and /app/private — mount those as
#      persistent volumes or every deploy deletes them.
#
# Migrations run before this script (package.json `start:prod`), so a deploy
# that adds a table is applied before the new code serves a request. They are
# additive by rule (docs/cms-runbook.md), so the old container keeps working
# while the new one migrates.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SA="$ROOT/.next/standalone"

[ -f "$SA/server.js" ] || { echo "start-standalone: $SA/server.js is missing — run npm run build first" >&2; exit 1; }

mkdir -p "$SA/.next" "$ROOT/media" "$ROOT/private"
[ -e "$SA/.next/static" ] || ln -s "$ROOT/.next/static" "$SA/.next/static"
[ -e "$SA/public" ] || ln -s "$ROOT/public" "$SA/public"

export HOSTNAME="${BIND_HOST:-0.0.0.0}"
export PORT="${PORT:-3000}"
exec node "$SA/server.js"
