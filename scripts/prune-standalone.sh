#!/usr/bin/env bash
# ==========================================================================
# prune-standalone.sh — take secrets and customer files out of the build copy
# ==========================================================================
#
#   bash scripts/prune-standalone.sh        (after `next build`; deploy.sh,
#                                            ci.sh and `npm run build` call it)
#
# `next build` copies everything its file tracer found into
# `.next/standalone`. Payload's and sharp's dynamic `fs` reads make the
# tracer take the whole checkout — `.env`, a snapshot of `media/`, and
# `private/` (invoice PDFs with customers' names, addresses and TRNs).
# `outputFileTracingExcludes` in next.config.ts keeps them out of every
# route's trace, but Turbopack does not apply it to `instrumentation.ts`'s
# trace (Next 16.3: collect-build-traces.js only rewrites route traces), so
# that one trace still brings them in. This removes them afterwards.
#
# Nothing removed here is ever loaded from the standalone copy: the server
# runs with cwd = the release (deploy.sh links `media/` and `private/`
# there and reads `.env` from the app directory), and the rest is source,
# tests and docs. deploy.sh and .dockerignore already left these out of
# the release and the image; this deletes the stale second copy that
# otherwise stays on the build host, out of reach of the retention job.
# ==========================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STANDALONE="$ROOT/.next/standalone"
[ -d "$STANDALONE" ] || { echo "prune-standalone: no .next/standalone — nothing to do"; exit 0; }

cd "$STANDALONE"
shopt -s dotglob nullglob
rm -rf -- .env .env.* media private assets docs tests e2e .git .claude ./*.tsbuildinfo

# Prove it: a later Next or Payload upgrade that traces something new
# must not quietly bring a secret back.
leftover="$(ls -d .env .env.* media private 2>/dev/null || true)"
if [ -n "$leftover" ]; then
  echo "prune-standalone: still present in .next/standalone: $leftover" >&2
  exit 1
fi
echo "ok  .next/standalone has no .env, media/ or private/"
