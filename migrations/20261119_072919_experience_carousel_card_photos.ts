import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_experience_carousel_card_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"experience_id" uuid,
  	"photo_id" uuid
  );
  
  CREATE TABLE "_pages_v_blocks_experience_carousel_card_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"experience_id" uuid,
  	"photo_id" uuid,
  	"_uuid" varchar
  );
  
  ALTER TABLE "pages_blocks_experience_carousel_card_photos" ADD CONSTRAINT "pages_blocks_experience_carousel_card_photos_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_experience_carousel_card_photos" ADD CONSTRAINT "pages_blocks_experience_carousel_card_photos_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_experience_carousel_card_photos" ADD CONSTRAINT "pages_blocks_experience_carousel_card_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_experience_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_experience_carousel_card_photos" ADD CONSTRAINT "_pages_v_blocks_experience_carousel_card_photos_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_experience_carousel_card_photos" ADD CONSTRAINT "_pages_v_blocks_experience_carousel_card_photos_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_experience_carousel_card_photos" ADD CONSTRAINT "_pages_v_blocks_experience_carousel_card_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_experience_carousel"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_experience_carousel_card_photos_order_idx" ON "pages_blocks_experience_carousel_card_photos" USING btree ("_order");
  CREATE INDEX "pages_blocks_experience_carousel_card_photos_parent_id_idx" ON "pages_blocks_experience_carousel_card_photos" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_experience_carousel_card_photos_experience_idx" ON "pages_blocks_experience_carousel_card_photos" USING btree ("experience_id");
  CREATE INDEX "pages_blocks_experience_carousel_card_photos_photo_idx" ON "pages_blocks_experience_carousel_card_photos" USING btree ("photo_id");
  CREATE INDEX "_pages_v_blocks_experience_carousel_card_photos_order_idx" ON "_pages_v_blocks_experience_carousel_card_photos" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_experience_carousel_card_photos_parent_id_idx" ON "_pages_v_blocks_experience_carousel_card_photos" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_experience_carousel_card_photos_experien_idx" ON "_pages_v_blocks_experience_carousel_card_photos" USING btree ("experience_id");
  CREATE INDEX "_pages_v_blocks_experience_carousel_card_photos_photo_idx" ON "_pages_v_blocks_experience_carousel_card_photos" USING btree ("photo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_experience_carousel_card_photos" CASCADE;
  DROP TABLE "_pages_v_blocks_experience_carousel_card_photos" CASCADE;`)
}
