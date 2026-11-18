import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_faq_sections_legacy_key" AS ENUM('coming', 'booking', 'groups');
  CREATE TABLE "faq_sections" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar NOT NULL,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"legacy_key" "enum_faq_sections_legacy_key",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "faqs" ADD COLUMN "section_id" uuid;
  ALTER TABLE "_faqs_v" ADD COLUMN "version_section_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "faq_sections_id" uuid;
  ALTER TABLE "system_state" ADD COLUMN "faq_sections_moved_at" timestamp(3) with time zone;
  CREATE UNIQUE INDEX "faq_sections_legacy_key_idx" ON "faq_sections" USING btree ("legacy_key");
  CREATE INDEX "faq_sections_updated_at_idx" ON "faq_sections" USING btree ("updated_at");
  CREATE INDEX "faq_sections_created_at_idx" ON "faq_sections" USING btree ("created_at");
  ALTER TABLE "faqs" ADD CONSTRAINT "faqs_section_id_faq_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."faq_sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_faqs_v" ADD CONSTRAINT "_faqs_v_version_section_id_faq_sections_id_fk" FOREIGN KEY ("version_section_id") REFERENCES "public"."faq_sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faq_sections_fk" FOREIGN KEY ("faq_sections_id") REFERENCES "public"."faq_sections"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "faqs_section_idx" ON "faqs" USING btree ("section_id");
  CREATE INDEX "_faqs_v_version_version_section_idx" ON "_faqs_v" USING btree ("version_section_id");
  CREATE INDEX "payload_locked_documents_rels_faq_sections_id_idx" ON "payload_locked_documents_rels" USING btree ("faq_sections_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "faq_sections" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "faq_sections" CASCADE;
  ALTER TABLE "faqs" DROP CONSTRAINT "faqs_section_id_faq_sections_id_fk";
  
  ALTER TABLE "_faqs_v" DROP CONSTRAINT "_faqs_v_version_section_id_faq_sections_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_faq_sections_fk";
  
  DROP INDEX "faqs_section_idx";
  DROP INDEX "_faqs_v_version_version_section_idx";
  DROP INDEX "payload_locked_documents_rels_faq_sections_id_idx";
  ALTER TABLE "faqs" DROP COLUMN "section_id";
  ALTER TABLE "_faqs_v" DROP COLUMN "version_section_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "faq_sections_id";
  ALTER TABLE "system_state" DROP COLUMN "faq_sections_moved_at";
  DROP TYPE "public"."enum_faq_sections_legacy_key";`)
}
