import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "programmes" ADD COLUMN "booking_policy_id" uuid;
  ALTER TABLE "programmes" ADD COLUMN "booking_policy_note" varchar;
  ALTER TABLE "_programmes_v" ADD COLUMN "version_booking_policy_id" uuid;
  ALTER TABLE "_programmes_v" ADD COLUMN "version_booking_policy_note" varchar;
  ALTER TABLE "programmes" ADD CONSTRAINT "programmes_booking_policy_id_policies_id_fk" FOREIGN KEY ("booking_policy_id") REFERENCES "public"."policies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_programmes_v" ADD CONSTRAINT "_programmes_v_version_booking_policy_id_policies_id_fk" FOREIGN KEY ("version_booking_policy_id") REFERENCES "public"."policies"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "programmes_booking_policy_idx" ON "programmes" USING btree ("booking_policy_id");
  CREATE INDEX "_programmes_v_version_version_booking_policy_idx" ON "_programmes_v" USING btree ("version_booking_policy_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "programmes" DROP CONSTRAINT "programmes_booking_policy_id_policies_id_fk";
  
  ALTER TABLE "_programmes_v" DROP CONSTRAINT "_programmes_v_version_booking_policy_id_policies_id_fk";
  
  DROP INDEX "programmes_booking_policy_idx";
  DROP INDEX "_programmes_v_version_version_booking_policy_idx";
  ALTER TABLE "programmes" DROP COLUMN "booking_policy_id";
  ALTER TABLE "programmes" DROP COLUMN "booking_policy_note";
  ALTER TABLE "_programmes_v" DROP COLUMN "version_booking_policy_id";
  ALTER TABLE "_programmes_v" DROP COLUMN "version_booking_policy_note";`)
}
