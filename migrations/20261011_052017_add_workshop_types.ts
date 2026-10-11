import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_workshop_types_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__workshop_types_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "workshop_types_about" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"paragraph" varchar
  );
  
  CREATE TABLE "workshop_types" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"experience_id" uuid,
  	"name" varchar,
  	"level" varchar,
  	"description" varchar,
  	"image_id" uuid,
  	"progression_recommended_after_id" uuid,
  	"progression_note" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" uuid,
  	"meta_noindex" boolean DEFAULT false,
  	"slug" varchar,
  	"status" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_workshop_types_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_workshop_types_v_version_about" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"paragraph" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_workshop_types_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_experience_id" uuid,
  	"version_name" varchar,
  	"version_level" varchar,
  	"version_description" varchar,
  	"version_image_id" uuid,
  	"version_progression_recommended_after_id" uuid,
  	"version_progression_note" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" uuid,
  	"version_meta_noindex" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_status" varchar,
  	"version_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__workshop_types_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  ALTER TABLE "sessions" ADD COLUMN "workshop_type_id" uuid;
  ALTER TABLE "_sessions_v" ADD COLUMN "version_workshop_type_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "workshop_types_id" uuid;
  ALTER TABLE "workshop_types_about" ADD CONSTRAINT "workshop_types_about_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshop_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshop_types" ADD CONSTRAINT "workshop_types_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshop_types" ADD CONSTRAINT "workshop_types_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshop_types" ADD CONSTRAINT "workshop_types_progression_recommended_after_id_workshop_types_id_fk" FOREIGN KEY ("progression_recommended_after_id") REFERENCES "public"."workshop_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshop_types" ADD CONSTRAINT "workshop_types_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshop_types_v_version_about" ADD CONSTRAINT "_workshop_types_v_version_about_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshop_types_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshop_types_v" ADD CONSTRAINT "_workshop_types_v_parent_id_workshop_types_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."workshop_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshop_types_v" ADD CONSTRAINT "_workshop_types_v_version_experience_id_experiences_id_fk" FOREIGN KEY ("version_experience_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshop_types_v" ADD CONSTRAINT "_workshop_types_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshop_types_v" ADD CONSTRAINT "_workshop_types_v_version_progression_recommended_after_id_workshop_types_id_fk" FOREIGN KEY ("version_progression_recommended_after_id") REFERENCES "public"."workshop_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshop_types_v" ADD CONSTRAINT "_workshop_types_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "workshop_types_about_order_idx" ON "workshop_types_about" USING btree ("_order");
  CREATE INDEX "workshop_types_about_parent_id_idx" ON "workshop_types_about" USING btree ("_parent_id");
  CREATE INDEX "workshop_types_experience_idx" ON "workshop_types" USING btree ("experience_id");
  CREATE INDEX "workshop_types_image_idx" ON "workshop_types" USING btree ("image_id");
  CREATE INDEX "workshop_types_progression_progression_recommended_after_idx" ON "workshop_types" USING btree ("progression_recommended_after_id");
  CREATE INDEX "workshop_types_meta_meta_image_idx" ON "workshop_types" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "workshop_types_slug_idx" ON "workshop_types" USING btree ("slug");
  CREATE INDEX "workshop_types_updated_at_idx" ON "workshop_types" USING btree ("updated_at");
  CREATE INDEX "workshop_types_created_at_idx" ON "workshop_types" USING btree ("created_at");
  CREATE INDEX "workshop_types__status_idx" ON "workshop_types" USING btree ("_status");
  CREATE INDEX "_workshop_types_v_version_about_order_idx" ON "_workshop_types_v_version_about" USING btree ("_order");
  CREATE INDEX "_workshop_types_v_version_about_parent_id_idx" ON "_workshop_types_v_version_about" USING btree ("_parent_id");
  CREATE INDEX "_workshop_types_v_parent_idx" ON "_workshop_types_v" USING btree ("parent_id");
  CREATE INDEX "_workshop_types_v_version_version_experience_idx" ON "_workshop_types_v" USING btree ("version_experience_id");
  CREATE INDEX "_workshop_types_v_version_version_image_idx" ON "_workshop_types_v" USING btree ("version_image_id");
  CREATE INDEX "_workshop_types_v_version_progression_version_progressio_idx" ON "_workshop_types_v" USING btree ("version_progression_recommended_after_id");
  CREATE INDEX "_workshop_types_v_version_meta_version_meta_image_idx" ON "_workshop_types_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_workshop_types_v_version_version_slug_idx" ON "_workshop_types_v" USING btree ("version_slug");
  CREATE INDEX "_workshop_types_v_version_version_updated_at_idx" ON "_workshop_types_v" USING btree ("version_updated_at");
  CREATE INDEX "_workshop_types_v_version_version_created_at_idx" ON "_workshop_types_v" USING btree ("version_created_at");
  CREATE INDEX "_workshop_types_v_version_version__status_idx" ON "_workshop_types_v" USING btree ("version__status");
  CREATE INDEX "_workshop_types_v_created_at_idx" ON "_workshop_types_v" USING btree ("created_at");
  CREATE INDEX "_workshop_types_v_updated_at_idx" ON "_workshop_types_v" USING btree ("updated_at");
  CREATE INDEX "_workshop_types_v_latest_idx" ON "_workshop_types_v" USING btree ("latest");
  CREATE INDEX "_workshop_types_v_autosave_idx" ON "_workshop_types_v" USING btree ("autosave");
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_workshop_type_id_workshop_types_id_fk" FOREIGN KEY ("workshop_type_id") REFERENCES "public"."workshop_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sessions_v" ADD CONSTRAINT "_sessions_v_version_workshop_type_id_workshop_types_id_fk" FOREIGN KEY ("version_workshop_type_id") REFERENCES "public"."workshop_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workshop_types_fk" FOREIGN KEY ("workshop_types_id") REFERENCES "public"."workshop_types"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sessions_workshop_type_idx" ON "sessions" USING btree ("workshop_type_id");
  CREATE INDEX "_sessions_v_version_version_workshop_type_idx" ON "_sessions_v" USING btree ("version_workshop_type_id");
  CREATE INDEX "payload_locked_documents_rels_workshop_types_id_idx" ON "payload_locked_documents_rels" USING btree ("workshop_types_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workshop_types_about" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "workshop_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_workshop_types_v_version_about" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_workshop_types_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "workshop_types_about" CASCADE;
  DROP TABLE "workshop_types" CASCADE;
  DROP TABLE "_workshop_types_v_version_about" CASCADE;
  DROP TABLE "_workshop_types_v" CASCADE;
  ALTER TABLE "sessions" DROP CONSTRAINT "sessions_workshop_type_id_workshop_types_id_fk";
  
  ALTER TABLE "_sessions_v" DROP CONSTRAINT "_sessions_v_version_workshop_type_id_workshop_types_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_workshop_types_fk";
  
  DROP INDEX "sessions_workshop_type_idx";
  DROP INDEX "_sessions_v_version_version_workshop_type_idx";
  DROP INDEX "payload_locked_documents_rels_workshop_types_id_idx";
  ALTER TABLE "sessions" DROP COLUMN "workshop_type_id";
  ALTER TABLE "_sessions_v" DROP COLUMN "version_workshop_type_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "workshop_types_id";
  DROP TYPE "public"."enum_workshop_types_status";
  DROP TYPE "public"."enum__workshop_types_v_version_status";`)
}
