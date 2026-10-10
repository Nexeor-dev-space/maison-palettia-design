import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

import { DEFAULT_TEMPLATE_BY_KEY, toLexical } from '../cms/email/defaults'

/*
  Phase 3 review fixes:
    · orders.reviewReason gains five reasons the payment and refund code now
      flags instead of acting silently: `failed_after_capture`,
      `double_capture`, `paid_cancelled_session`, `refund_failed`,
      `unknown_refund`. Added with `ALTER TYPE … ADD VALUE` — nothing in this
      transaction uses them, and every stored value stays valid, so the
      previous release keeps running against this schema (SPEC §A.5).
    · The house copy of three customer emails was wrong about the flow
      (payment_failed said the seats were released; the two cancellation
      emails promised a card refund to desk customers who paid cash). The
      seed never overwrites a template, so the corrected copy is written
      here — ONLY to documents nobody has edited (`updated_at` still equals
      `created_at`). An edited template is the owner's and is left alone.
*/

const REWORDED = ['payment_failed', 'order_cancelled', 'session_cancelled'] as const

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_orders_review_reason" ADD VALUE 'failed_after_capture';
  ALTER TYPE "public"."enum_orders_review_reason" ADD VALUE 'double_capture';
  ALTER TYPE "public"."enum_orders_review_reason" ADD VALUE 'paid_cancelled_session';
  ALTER TYPE "public"."enum_orders_review_reason" ADD VALUE 'refund_failed';
  ALTER TYPE "public"."enum_orders_review_reason" ADD VALUE 'unknown_refund';`)

  const untouched = await db.execute(sql`
    SELECT id, key FROM email_templates
     WHERE key::text IN ('payment_failed', 'order_cancelled', 'session_cancelled') AND updated_at = created_at`)
  for (const row of untouched.rows as Array<{ id: string; key: string }>) {
    const template = DEFAULT_TEMPLATE_BY_KEY[row.key]
    if (!template || !(REWORDED as readonly string[]).includes(row.key)) continue
    await payload.update({
      collection: 'email-templates',
      id: row.id,
      data: { subject: template.subject, preheader: template.preheader ?? null, body: toLexical(template.paragraphs) as never },
      depth: 0,
      overrideAccess: true,
      context: { system: true, seed: true, skipRevalidate: true, disableRevalidate: true },
      req,
    })
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Only the enum goes back. The reworded copy stays: it reads {{hold.until}} / {{refund.where}}, which the
  // previous release does not pass — re-apply the old house copy by hand if rolling back that far.
  await db.execute(sql`
   UPDATE "orders" SET "review_reason" = NULL
    WHERE "review_reason"::text IN ('failed_after_capture', 'double_capture', 'paid_cancelled_session', 'refund_failed', 'unknown_refund');
   ALTER TABLE "orders" ALTER COLUMN "review_reason" SET DATA TYPE text;
  DROP TYPE "public"."enum_orders_review_reason";
  CREATE TYPE "public"."enum_orders_review_reason" AS ENUM('amount_mismatch', 'no_order', 'post_expiry', 'mode_or_link_mismatch', 'dispute', 'voided_after_capture');
  ALTER TABLE "orders" ALTER COLUMN "review_reason" SET DATA TYPE "public"."enum_orders_review_reason" USING "review_reason"::"public"."enum_orders_review_reason";`)
}
