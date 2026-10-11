import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sessions_rels" ADD COLUMN "vibes_id" uuid;
  ALTER TABLE "_sessions_v_rels" ADD COLUMN "vibes_id" uuid;
  ALTER TABLE "sessions_rels" ADD CONSTRAINT "sessions_rels_vibes_fk" FOREIGN KEY ("vibes_id") REFERENCES "public"."vibes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sessions_v_rels" ADD CONSTRAINT "_sessions_v_rels_vibes_fk" FOREIGN KEY ("vibes_id") REFERENCES "public"."vibes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sessions_rels_vibes_id_idx" ON "sessions_rels" USING btree ("vibes_id");
  CREATE INDEX "_sessions_v_rels_vibes_id_idx" ON "_sessions_v_rels" USING btree ("vibes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sessions_rels" DROP CONSTRAINT "sessions_rels_vibes_fk";
  
  ALTER TABLE "_sessions_v_rels" DROP CONSTRAINT "_sessions_v_rels_vibes_fk";
  
  DROP INDEX "sessions_rels_vibes_id_idx";
  DROP INDEX "_sessions_v_rels_vibes_id_idx";
  ALTER TABLE "sessions_rels" DROP COLUMN "vibes_id";
  ALTER TABLE "_sessions_v_rels" DROP COLUMN "vibes_id";`)
}
