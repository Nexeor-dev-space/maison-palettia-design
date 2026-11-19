import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_two_ways_roads" ADD COLUMN "photo_id" uuid;
  ALTER TABLE "_pages_v_blocks_two_ways_roads" ADD COLUMN "photo_id" uuid;
  ALTER TABLE "pages_blocks_two_ways_roads" ADD CONSTRAINT "pages_blocks_two_ways_roads_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_two_ways_roads" ADD CONSTRAINT "_pages_v_blocks_two_ways_roads_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_two_ways_roads_photo_idx" ON "pages_blocks_two_ways_roads" USING btree ("photo_id");
  CREATE INDEX "_pages_v_blocks_two_ways_roads_photo_idx" ON "_pages_v_blocks_two_ways_roads" USING btree ("photo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_two_ways_roads" DROP CONSTRAINT "pages_blocks_two_ways_roads_photo_id_media_id_fk";
  
  ALTER TABLE "_pages_v_blocks_two_ways_roads" DROP CONSTRAINT "_pages_v_blocks_two_ways_roads_photo_id_media_id_fk";
  
  DROP INDEX "pages_blocks_two_ways_roads_photo_idx";
  DROP INDEX "_pages_v_blocks_two_ways_roads_photo_idx";
  ALTER TABLE "pages_blocks_two_ways_roads" DROP COLUMN "photo_id";
  ALTER TABLE "_pages_v_blocks_two_ways_roads" DROP COLUMN "photo_id";`)
}
