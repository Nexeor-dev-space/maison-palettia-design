import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_latest_journal_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_blocks_latest_journal_cta_link_type" AS ENUM('internal', 'external');
  CREATE TABLE "pages_blocks_latest_journal_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_latest_journal" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Journal',
  	"lead" varchar,
  	"limit" numeric DEFAULT 3,
  	"category_id" uuid,
  	"cta_label" varchar DEFAULT 'Read the Journal',
  	"cta_link_type" "enum_pages_blocks_latest_journal_cta_link_type" DEFAULT 'internal',
  	"cta_link_url" varchar DEFAULT '/journal',
  	"cta_link_anchor" varchar,
  	"cta_link_new_tab" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_latest_journal_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_latest_journal" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'Journal',
  	"lead" varchar,
  	"limit" numeric DEFAULT 3,
  	"category_id" uuid,
  	"cta_label" varchar DEFAULT 'Read the Journal',
  	"cta_link_type" "enum__pages_v_blocks_latest_journal_cta_link_type" DEFAULT 'internal',
  	"cta_link_url" varchar DEFAULT '/journal',
  	"cta_link_anchor" varchar,
  	"cta_link_new_tab" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_latest_journal_heading_lines" ADD CONSTRAINT "pages_blocks_latest_journal_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_latest_journal"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_latest_journal" ADD CONSTRAINT "pages_blocks_latest_journal_category_id_post_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."post_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_latest_journal" ADD CONSTRAINT "pages_blocks_latest_journal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_latest_journal_heading_lines" ADD CONSTRAINT "_pages_v_blocks_latest_journal_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_latest_journal"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_latest_journal" ADD CONSTRAINT "_pages_v_blocks_latest_journal_category_id_post_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."post_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_latest_journal" ADD CONSTRAINT "_pages_v_blocks_latest_journal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_latest_journal_heading_lines_order_idx" ON "pages_blocks_latest_journal_heading_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_latest_journal_heading_lines_parent_id_idx" ON "pages_blocks_latest_journal_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_latest_journal_order_idx" ON "pages_blocks_latest_journal" USING btree ("_order");
  CREATE INDEX "pages_blocks_latest_journal_parent_id_idx" ON "pages_blocks_latest_journal" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_latest_journal_path_idx" ON "pages_blocks_latest_journal" USING btree ("_path");
  CREATE INDEX "pages_blocks_latest_journal_category_idx" ON "pages_blocks_latest_journal" USING btree ("category_id");
  CREATE INDEX "_pages_v_blocks_latest_journal_heading_lines_order_idx" ON "_pages_v_blocks_latest_journal_heading_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_latest_journal_heading_lines_parent_id_idx" ON "_pages_v_blocks_latest_journal_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_latest_journal_order_idx" ON "_pages_v_blocks_latest_journal" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_latest_journal_parent_id_idx" ON "_pages_v_blocks_latest_journal" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_latest_journal_path_idx" ON "_pages_v_blocks_latest_journal" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_latest_journal_category_idx" ON "_pages_v_blocks_latest_journal" USING btree ("category_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_latest_journal_heading_lines" CASCADE;
  DROP TABLE "pages_blocks_latest_journal" CASCADE;
  DROP TABLE "_pages_v_blocks_latest_journal_heading_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_latest_journal" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_latest_journal_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_latest_journal_cta_link_type";`)
}
