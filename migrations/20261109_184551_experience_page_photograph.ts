import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "experiences" ADD COLUMN "page_image_id" uuid;
  ALTER TABLE "_experiences_v" ADD COLUMN "version_page_image_id" uuid;
  ALTER TABLE "system_state" ADD COLUMN "page_photos_moved_at" timestamp(3) with time zone;
  ALTER TABLE "experiences" ADD CONSTRAINT "experiences_page_image_id_media_id_fk" FOREIGN KEY ("page_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experiences_v" ADD CONSTRAINT "_experiences_v_version_page_image_id_media_id_fk" FOREIGN KEY ("version_page_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "experiences_page_image_idx" ON "experiences" USING btree ("page_image_id");
  CREATE INDEX "_experiences_v_version_version_page_image_idx" ON "_experiences_v" USING btree ("version_page_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "experiences" DROP CONSTRAINT "experiences_page_image_id_media_id_fk";
  
  ALTER TABLE "_experiences_v" DROP CONSTRAINT "_experiences_v_version_page_image_id_media_id_fk";
  
  DROP INDEX "experiences_page_image_idx";
  DROP INDEX "_experiences_v_version_version_page_image_idx";
  ALTER TABLE "experiences" DROP COLUMN "page_image_id";
  ALTER TABLE "_experiences_v" DROP COLUMN "version_page_image_id";
  ALTER TABLE "system_state" DROP COLUMN "page_photos_moved_at";`)
}
