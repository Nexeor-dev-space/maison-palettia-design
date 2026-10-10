#!/usr/bin/env bash
# ==========================================================================
# ci.sh — every gate, in the order a failure is cheapest to find (SPEC §K)
# ==========================================================================
#
#   bash scripts/ci.sh                  everything
#   bash scripts/ci.sh --no-e2e         skip Playwright (no dev server running)
#   bash scripts/ci.sh --no-build       skip `next build` (quick local pass)
#   bash scripts/ci.sh --no-integration skip the Postgres suites
#
#   1. preflight-db       the database-gate checks (warnings outside production)
#   2. tsc --noEmit
#   3. eslint .
#   4. generated files    `payload generate:types` / `generate:importmap`
#                         must reproduce the committed files byte for byte
#   5. vitest (unit)      pure code, the RBAC matrix, contracts, source gates
#                         (env allowlist, no point/PostGIS, no updateTag( …)
#   6. vitest (integration)  real Postgres in a THROWAWAY database that is
#                         created, migrated and dropped by the run
#   7. next build         + robots.txt and sitemap.xml routes in the output,
#                         and no .env / media / private in .next/standalone
#   8. Playwright e2e     against the running dev server (E2E_BASE_URL,
#                         default http://localhost:3200 — never 3000). It
#                         writes to the server's database and cleans up after
#                         itself; admin specs sign in as a throwaway admin
#                         the run creates and deletes (needs DATABASE_URL).
#
# No step edits tracked files: step 4 generates into place, compares with a
# saved copy, and always puts the saved copy back.
# ==========================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RUN_E2E=1
RUN_BUILD=1
RUN_INTEGRATION=1
for arg in "$@"; do
  case "$arg" in
    --no-e2e) RUN_E2E=0 ;;
    --no-build) RUN_BUILD=0 ;;
    --no-integration) RUN_INTEGRATION=0 ;;
    *) echo "ci.sh: unknown option $arg" >&2; exit 2 ;;
  esac
done

STEP=0
step() {
  STEP=$((STEP + 1))
  printf '\n\033[1m── %s. %s\033[0m\n' "$STEP" "$1"
}

step "preflight-db (warnings only outside production)"
node scripts/preflight-db.mjs

step "tsc --noEmit"
npx tsc --noEmit

step "eslint ."
npx eslint .

step "generated files are current (payload-types.ts, importMap.js)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
check_generated() {
  local file="$1" command="$2"
  cp "$file" "$TMP/saved"
  if ! npx payload "$command" >"$TMP/gen.log" 2>&1; then
    cp "$TMP/saved" "$file"
    cat "$TMP/gen.log" >&2
    echo "ci.sh: payload $command failed" >&2
    exit 1
  fi
  if ! cmp -s "$TMP/saved" "$file"; then
    diff -u "$TMP/saved" "$file" | head -40 >&2 || true
    cp "$TMP/saved" "$file"
    echo "ci.sh: $file is out of date — run \`npm run $command\` and commit the result" >&2
    exit 1
  fi
  echo "ok  $file"
}
check_generated payload-types.ts generate:types
check_generated "app/(payload)/admin/importMap.js" generate:importmap

step "vitest — unit, contract, source gates"
npx vitest run --project unit

if [ "$RUN_INTEGRATION" = 1 ]; then
  step "vitest — integration (throwaway Postgres database)"
  npx vitest run --project integration
fi

if [ "$RUN_BUILD" = 1 ]; then
  step "next build"
  npx next build
  bash scripts/prune-standalone.sh
  for route in robots.txt sitemap.xml; do
    if ! grep -qs "$route/route\"" .next/server/app-paths-manifest.json; then
      echo "ci.sh: $route is missing from the build" >&2
      exit 1
    fi
    echo "ok  /$route"
  done
fi

if [ "$RUN_E2E" = 1 ]; then
  step "Playwright e2e against ${E2E_BASE_URL:-http://localhost:3200}"
  npx playwright test
fi

printf '\n\033[1mci.sh: all gates passed\033[0m\n'
