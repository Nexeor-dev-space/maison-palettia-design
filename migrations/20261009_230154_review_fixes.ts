import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
  Review fixes (Phase 2):
    · activitiesGrid.linkTo gains "none" (plates are not links — today's
      /private-events) and defaults to it;
    · passes.imageAlt — a pass's own wording for a photograph shared with
      another page (the Day Pass on /loyalty).

  The enum is rebuilt rather than extended with `ALTER TYPE … ADD VALUE`:
  a value added that way cannot be used in the same transaction, and the
  new column default uses it. Detaching the columns to text, recreating the
  type as a superset and casting back is safe inside the migration's
  transaction, and stays backward-compatible — every stored value
  ("experiencePage", "enquiry") is still valid, so the previous release can
  keep running against this schema (SPEC §A.5 additive rule).
*/
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_activities_grid" ALTER COLUMN "link_to" DROP DEFAULT;
  ALTER TABLE "pages_blocks_activities_grid" ALTER COLUMN "link_to" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_blocks_activities_grid_link_to";
  CREATE TYPE "public"."enum_pages_blocks_activities_grid_link_to" AS ENUM('none', 'experiencePage', 'enquiry');
  ALTER TABLE "pages_blocks_activities_grid" ALTER COLUMN "link_to" SET DATA TYPE "public"."enum_pages_blocks_activities_grid_link_to" USING "link_to"::"public"."enum_pages_blocks_activities_grid_link_to";
  ALTER TABLE "pages_blocks_activities_grid" ALTER COLUMN "link_to" SET DEFAULT 'none'::"public"."enum_pages_blocks_activities_grid_link_to";
  ALTER TABLE "_pages_v_blocks_activities_grid" ALTER COLUMN "link_to" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_activities_grid" ALTER COLUMN "link_to" SET DATA TYPE text;
  DROP TYPE "public"."enum__pages_v_blocks_activities_grid_link_to";
  CREATE TYPE "public"."enum__pages_v_blocks_activities_grid_link_to" AS ENUM('none', 'experiencePage', 'enquiry');
  ALTER TABLE "_pages_v_blocks_activities_grid" ALTER COLUMN "link_to" SET DATA TYPE "public"."enum__pages_v_blocks_activities_grid_link_to" USING "link_to"::"public"."enum__pages_v_blocks_activities_grid_link_to";
  ALTER TABLE "_pages_v_blocks_activities_grid" ALTER COLUMN "link_to" SET DEFAULT 'none'::"public"."enum__pages_v_blocks_activities_grid_link_to";
  ALTER TABLE "passes" ADD COLUMN "image_alt" varchar;
  ALTER TABLE "_passes_v" ADD COLUMN "version_image_alt" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_activities_grid" ALTER COLUMN "link_to" SET DATA TYPE text;
  UPDATE "pages_blocks_activities_grid" SET "link_to" = 'experiencePage' WHERE "link_to" = 'none';
  ALTER TABLE "pages_blocks_activities_grid" ALTER COLUMN "link_to" SET DEFAULT 'experiencePage'::text;
  DROP TYPE "public"."enum_pages_blocks_activities_grid_link_to";
  CREATE TYPE "public"."enum_pages_blocks_activities_grid_link_to" AS ENUM('experiencePage', 'enquiry');
  ALTER TABLE "pages_blocks_activities_grid" ALTER COLUMN "link_to" SET DEFAULT 'experiencePage'::"public"."enum_pages_blocks_activities_grid_link_to";
  ALTER TABLE "pages_blocks_activities_grid" ALTER COLUMN "link_to" SET DATA TYPE "public"."enum_pages_blocks_activities_grid_link_to" USING "link_to"::"public"."enum_pages_blocks_activities_grid_link_to";
  ALTER TABLE "_pages_v_blocks_activities_grid" ALTER COLUMN "link_to" SET DATA TYPE text;
  UPDATE "_pages_v_blocks_activities_grid" SET "link_to" = 'experiencePage' WHERE "link_to" = 'none';
  ALTER TABLE "_pages_v_blocks_activities_grid" ALTER COLUMN "link_to" SET DEFAULT 'experiencePage'::text;
  DROP TYPE "public"."enum__pages_v_blocks_activities_grid_link_to";
  CREATE TYPE "public"."enum__pages_v_blocks_activities_grid_link_to" AS ENUM('experiencePage', 'enquiry');
  ALTER TABLE "_pages_v_blocks_activities_grid" ALTER COLUMN "link_to" SET DEFAULT 'experiencePage'::"public"."enum__pages_v_blocks_activities_grid_link_to";
  ALTER TABLE "_pages_v_blocks_activities_grid" ALTER COLUMN "link_to" SET DATA TYPE "public"."enum__pages_v_blocks_activities_grid_link_to" USING "link_to"::"public"."enum__pages_v_blocks_activities_grid_link_to";
  ALTER TABLE "passes" DROP COLUMN "image_alt";
  ALTER TABLE "_passes_v" DROP COLUMN "version_image_alt";`)
}
