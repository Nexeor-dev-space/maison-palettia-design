import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_music_tracks_licence" AS ENUM('cc-by-4.0', 'cc-by-sa-4.0', 'cc-by-3.0', 'cc0', 'pixabay', 'other');
  CREATE TABLE "music_tracks" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar NOT NULL,
  	"artist" varchar NOT NULL,
  	"artist_url" varchar,
  	"source_name" varchar,
  	"source_url" varchar,
  	"licence" "enum_music_tracks_licence" DEFAULT 'cc-by-4.0' NOT NULL,
  	"licence_name" varchar,
  	"licence_url" varchar,
  	"modified" boolean DEFAULT false,
  	"credit_override" varchar,
  	"active" boolean DEFAULT true,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "music_settings_exclude_paths" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"path" varchar NOT NULL
  );
  
  CREATE TABLE "music_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"enabled" boolean DEFAULT false,
  	"volume" numeric DEFAULT 40,
  	"shuffle" boolean DEFAULT false,
  	"label" varchar DEFAULT 'Studio sounds',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "music_tracks_id" uuid;
  ALTER TABLE "music_settings_exclude_paths" ADD CONSTRAINT "music_settings_exclude_paths_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."music_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "music_tracks_updated_at_idx" ON "music_tracks" USING btree ("updated_at");
  CREATE INDEX "music_tracks_created_at_idx" ON "music_tracks" USING btree ("created_at");
  CREATE UNIQUE INDEX "music_tracks_filename_idx" ON "music_tracks" USING btree ("filename");
  CREATE INDEX "music_settings_exclude_paths_order_idx" ON "music_settings_exclude_paths" USING btree ("_order");
  CREATE INDEX "music_settings_exclude_paths_parent_id_idx" ON "music_settings_exclude_paths" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_music_tracks_fk" FOREIGN KEY ("music_tracks_id") REFERENCES "public"."music_tracks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_music_tracks_id_idx" ON "payload_locked_documents_rels" USING btree ("music_tracks_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "music_tracks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "music_settings_exclude_paths" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "music_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "music_tracks" CASCADE;
  DROP TABLE "music_settings_exclude_paths" CASCADE;
  DROP TABLE "music_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_music_tracks_fk";
  
  DROP INDEX "payload_locked_documents_rels_music_tracks_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "music_tracks_id";
  DROP TYPE "public"."enum_music_tracks_licence";`)
}
