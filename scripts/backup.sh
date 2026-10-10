#!/usr/bin/env bash
# ==========================================================================
# backup.sh — database + uploads + invoice PDFs, one dated folder, rotated
# ==========================================================================
#
#   scripts/backup.sh [--dir /var/backups/maison-palettia] [--keep 14]
#
# Nightly from cron or a systemd timer (docs/cms-runbook.md, "Backups"):
#
#   15 2 * * *  /srv/maison-palettia/app/scripts/backup.sh >> /var/log/maison-palettia-backup.log 2>&1
#
# Writes <dir>/<UTC time>/ containing
#
#   db.dump         pg_dump custom format (-Fc): compressed, restorable table
#                   by table with pg_restore, owner/grants stripped so it
#                   restores into any database as any role
#   media.tar.gz    media/   — every upload (photos, logos, PDF fonts)
#   private.tar.gz  private/ — generated invoice PDFs (legal records: UAE VAT
#                   law expects invoices to be kept for years, so these
#                   matter as much as the database)
#   SHA256SUMS      checksums of the three, for an off-site copy to verify
#
# and deletes dated folders beyond the newest --keep (default 14). The dump
# is checked by listing its table of contents (`pg_restore --list`) before
# the backup counts as done; a backup that cannot be read is a failure, not
# a file. A real restore test is a separate, monthly step in the runbook.
#
# THE PASSWORD NEVER REACHES THE COMMAND LINE. DATABASE_URL (environment,
# else ./.env) is split into PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE/
# PGSSLMODE/PGSSLROOTCERT by Node and handed to pg_dump through its
# environment, so it does not show in `ps` on a shared host.
#
# The backups are as sensitive as the database (customer names, emails,
# encrypted settings): the folder is created 0700. Copy it off the host —
# a backup on the same disk as the data is protection against mistakes,
# not against losing the server.
#
# pg_dump must be the server's major version or newer (the server is
# Postgres 16: install postgresql-client-16 or later).
# ==========================================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

DEST="/var/backups/maison-palettia"
KEEP=14
while [ $# -gt 0 ]; do
  case "$1" in
    --dir) DEST="${2:?--dir needs a value}"; shift ;;
    --keep) KEEP="${2:?--keep needs a value}"; shift ;;
    -h|--help) sed -n '2,40p' "$0"; exit 0 ;;
    *) echo "backup: unknown option $1" >&2; exit 2 ;;
  esac
  shift
done
case "$KEEP" in ''|*[!0-9]*) echo "backup: --keep must be a number" >&2; exit 2 ;; esac
[ "$KEEP" -ge 1 ] || KEEP=1

command -v pg_dump >/dev/null || { echo "backup: pg_dump not found (install postgresql-client-16)" >&2; exit 1; }
command -v pg_restore >/dev/null || { echo "backup: pg_restore not found" >&2; exit 1; }

# DATABASE_URL → libpq environment variables, printed as shell-quoted
# `export` lines and eval'd. Values already in the environment win over .env.
ENV_FILE_FLAG=""
[ -f .env ] && ENV_FILE_FLAG="--env-file=.env"
PGENV="$(node $ENV_FILE_FLAG --input-type=module -e '
  const raw = process.env.DATABASE_URL;
  if (!raw) { console.error("backup: DATABASE_URL is not set (environment or ./.env)"); process.exit(1); }
  const u = new URL(raw);
  const q = (v) => "\x27" + String(v).replace(/\x27/g, "\x27\\\x27\x27") + "\x27";
  const out = {
    PGHOST: u.hostname.replace(/^\[|\]$/g, ""),
    PGPORT: u.port || "5432",
    PGUSER: decodeURIComponent(u.username),
    PGPASSWORD: decodeURIComponent(u.password),
    PGDATABASE: decodeURIComponent(u.pathname.replace(/^\//, "")),
  };
  const mode = u.searchParams.get("sslmode");
  const root = u.searchParams.get("sslrootcert");
  if (mode) out.PGSSLMODE = mode;
  if (root) out.PGSSLROOTCERT = root;
  for (const [k, v] of Object.entries(out)) if (v) console.log(`export ${k}=${q(v)}`);
')"
eval "$PGENV"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
umask 077
mkdir -p "$DEST"
chmod 700 "$DEST"
OUT="$DEST/$STAMP"
WORK="$DEST/.$STAMP.partial"
rm -rf "$WORK"
mkdir -p "$WORK"
trap 'rm -rf "$WORK"' EXIT

started=$(date +%s)
echo "backup: $STAMP → $OUT (database $PGDATABASE on $PGHOST:$PGPORT)"

pg_dump --format=custom --compress=6 --no-owner --no-privileges --file="$WORK/db.dump"
pg_restore --list "$WORK/db.dump" > /dev/null
tables=$(pg_restore --list "$WORK/db.dump" | grep -c " TABLE DATA " || true)
echo "backup: database dumped and readable ($tables tables, $(du -h "$WORK/db.dump" | cut -f1))"

for dir in media private; do
  if [ -d "$dir" ]; then
    # -h follows the top-level symlink if the folder is linked elsewhere.
    tar -C "$APP_DIR" -czhf "$WORK/$dir.tar.gz" "$dir"
    echo "backup: $dir/ archived ($(find "$dir/" -type f | wc -l | tr -d ' ') files, $(du -h "$WORK/$dir.tar.gz" | cut -f1))"
  else
    echo "backup: $dir/ does not exist — skipped"
  fi
done

# Checksums go to a temp name first: a glob run while SHA256SUMS already
# exists would list the (empty) file inside itself.
(
  cd "$WORK"
  files="$(ls -1 db.dump ./*.tar.gz 2>/dev/null | sed 's:^\./::')"
  # shellcheck disable=SC2086 # file names are fixed, no spaces
  if command -v sha256sum >/dev/null; then sha256sum $files; else shasum -a 256 $files; fi > .sums
  mv .sums SHA256SUMS
)
mv "$WORK" "$OUT"
trap - EXIT

# Rotation: dated folders only (the name starts with the year), newest kept.
old="$(cd "$DEST" && ls -1d 2*/ 2>/dev/null | sed 's:/$::' | sort | awk -v keep="$KEEP" '{ a[NR] = $0 } END { for (i = 1; i <= NR - keep; i++) print a[i] }')"
for b in $old; do
  rm -rf "${DEST:?}/$b"
  echo "backup: rotated out $b"
done

echo "backup: done in $(( $(date +%s) - started ))s — $(du -sh "$OUT" | cut -f1) in $OUT"
