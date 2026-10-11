import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_site_settings_socials_platform" ADD VALUE 'pinterest' BEFORE 'youtube';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings_socials" ALTER COLUMN "platform" SET DATA TYPE text;
  DROP TYPE "public"."enum_site_settings_socials_platform";
  CREATE TYPE "public"."enum_site_settings_socials_platform" AS ENUM('instagram', 'facebook', 'tiktok', 'youtube', 'x', 'linkedin');
  ALTER TABLE "site_settings_socials" ALTER COLUMN "platform" SET DATA TYPE "public"."enum_site_settings_socials_platform" USING "platform"::"public"."enum_site_settings_socials_platform";`)
}
