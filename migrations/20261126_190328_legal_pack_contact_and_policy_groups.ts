import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_policies_footer_group" AS ENUM('legal', 'support', 'none');
  CREATE TYPE "public"."enum__policies_v_version_footer_group" AS ENUM('legal', 'support', 'none');
  ALTER TABLE "policies" ADD COLUMN "footer_group" "enum_policies_footer_group" DEFAULT 'none';
  ALTER TABLE "_policies_v" ADD COLUMN "version_footer_group" "enum__policies_v_version_footer_group" DEFAULT 'none';
  ALTER TABLE "site_settings" ADD COLUMN "licence_number" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "registered_in" varchar DEFAULT 'Dubai, UAE';
  ALTER TABLE "booking_settings" ADD COLUMN "checkout_cancellation_summary" varchar DEFAULT 'Reschedule or get a credit note with at least 24 hours'' notice. Later cancellations and no-shows are non-refundable.';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "policies" DROP COLUMN "footer_group";
  ALTER TABLE "_policies_v" DROP COLUMN "version_footer_group";
  ALTER TABLE "site_settings" DROP COLUMN "licence_number";
  ALTER TABLE "site_settings" DROP COLUMN "registered_in";
  ALTER TABLE "booking_settings" DROP COLUMN "checkout_cancellation_summary";
  DROP TYPE "public"."enum_policies_footer_group";
  DROP TYPE "public"."enum__policies_v_version_footer_group";`)
}
