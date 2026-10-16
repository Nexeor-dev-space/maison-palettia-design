import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "booking_settings_walk_in_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar
  );
  
  ALTER TABLE "booking_settings" ADD COLUMN "walk_in_how_heading" varchar DEFAULT 'How it works';
  ALTER TABLE "booking_settings" ADD COLUMN "walk_in_open_group_title" varchar DEFAULT 'Open for drop-ins';
  ALTER TABLE "booking_settings" ADD COLUMN "walk_in_soon_group_title" varchar DEFAULT 'Coming soon';
  ALTER TABLE "booking_settings" ADD COLUMN "walk_in_card_action" varchar DEFAULT 'View details';
  ALTER TABLE "booking_settings" ADD COLUMN "walk_in_card_soon_action" varchar DEFAULT 'Take a look';
  ALTER TABLE "booking_settings" ADD COLUMN "walk_in_empty_note" varchar DEFAULT 'Nothing is tagged that way yet. Clear the filter to see every Create Anytime experience.';
  ALTER TABLE "booking_settings_walk_in_steps" ADD CONSTRAINT "booking_settings_walk_in_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."booking_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "booking_settings_walk_in_steps_order_idx" ON "booking_settings_walk_in_steps" USING btree ("_order");
  CREATE INDEX "booking_settings_walk_in_steps_parent_id_idx" ON "booking_settings_walk_in_steps" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "booking_settings_walk_in_steps" CASCADE;
  ALTER TABLE "booking_settings" DROP COLUMN "walk_in_how_heading";
  ALTER TABLE "booking_settings" DROP COLUMN "walk_in_open_group_title";
  ALTER TABLE "booking_settings" DROP COLUMN "walk_in_soon_group_title";
  ALTER TABLE "booking_settings" DROP COLUMN "walk_in_card_action";
  ALTER TABLE "booking_settings" DROP COLUMN "walk_in_card_soon_action";
  ALTER TABLE "booking_settings" DROP COLUMN "walk_in_empty_note";`)
}
