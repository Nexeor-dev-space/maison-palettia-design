import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Data-only (no schema change, so no .json snapshot). A credit note's status must agree with its
// balance (#214 QA): a note set back to "Available" or "Partially Redeemed" by hand after its whole
// amount was spent showed as usable at checkout but had nothing left. Rule-based, not tied to any
// one code: such notes go back to `redeemed`. Expired notes and notes with nothing redeemed
// (redeemed_amount_fils IS NULL) are untouched. The admin now refuses the mismatch on save
// (cms/collections/commerce/CreditNotes.ts), so this only repairs rows saved before that.
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const result = (await db.execute(sql`
   UPDATE "credit_notes"
      SET "status" = 'redeemed', "updated_at" = now()
    WHERE "status" IN ('available', 'partially_redeemed')
      AND "redeemed_amount_fils" IS NOT NULL
      AND "redeemed_amount_fils" >= "amount_fils"
   RETURNING "code";`)) as unknown as { rows?: Array<{ code: string }> }
  const codes = (result.rows ?? []).map((row) => row.code)
  payload.logger.info({ msg: 'credit_note_status_reconcile: set to redeemed', count: codes.length, codes })
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Intentionally a no-op. `up` only corrects a status that disagreed with the balance; putting it
  // back would re-create a note that looks usable but has no credit. The codes changed are in the
  // `up` log line if a manual review is ever needed.
  payload.logger.info({ msg: 'credit_note_status_reconcile: down is a no-op (nothing to undo)' })
}
