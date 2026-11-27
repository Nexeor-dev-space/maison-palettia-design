import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Data-only (no schema change, so no .json snapshot). Before balances were tracked, a
// credit note worth more than the booking was closed as `redeemed` and the rest was lost.
// Those notes get their balance back: `redeemed_amount_fils` already records what was
// used, so a note with less used than issued becomes `partially_redeemed` again (only if
// it has not expired). Kept separate from 20261113_142954 because Postgres cannot use a
// newly added enum value in the transaction that adds it, and Payload runs each
// migration in its own transaction.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "credit_notes"
      SET "status" = 'partially_redeemed', "updated_at" = now()
    WHERE "status" = 'redeemed'
      AND "redeemed_amount_fils" IS NOT NULL
      AND "redeemed_amount_fils" < "amount_fils"
      AND "expires_at" > now();`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Nothing to undo: 20261113_142954's down folds `partially_redeemed` back into `redeemed`.
}
