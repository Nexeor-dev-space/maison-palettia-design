import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "music_tracks" ADD COLUMN "prefix" varchar DEFAULT 'music';
  ALTER TABLE "music_tracks" ADD COLUMN "_objectkey" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "music_tracks" DROP COLUMN "prefix";
  ALTER TABLE "music_tracks" DROP COLUMN "_objectkey";`)
}
