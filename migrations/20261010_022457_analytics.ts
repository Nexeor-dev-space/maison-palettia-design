import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_analytics_events_kind" AS ENUM('pv', 'checkout_started', 'payment_redirect', 'order_paid');
  CREATE TYPE "public"."enum_analytics_events_channel" AS ENUM('direct', 'search', 'social', 'email', 'referral');
  CREATE TYPE "public"."enum_analytics_events_device" AS ENUM('desktop', 'mobile', 'tablet', 'other');
  CREATE TYPE "public"."enum_analytics_daily_dimension" AS ENUM('total', 'page', 'referrer', 'channel', 'device', 'browser', 'country', 'funnel');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'rollup-analytics' BEFORE 'issue-tickets';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'purge-retention' BEFORE 'issue-tickets';
  ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'rollup-analytics' BEFORE 'issue-tickets';
  ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'purge-retention' BEFORE 'issue-tickets';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'rollup-analytics' BEFORE 'issue-tickets';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'purge-retention' BEFORE 'issue-tickets';
  CREATE TABLE "analytics_events" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"ts" timestamp(3) with time zone NOT NULL,
  	"day" varchar NOT NULL,
  	"kind" "enum_analytics_events_kind" DEFAULT 'pv' NOT NULL,
  	"path" varchar NOT NULL,
  	"entry" boolean DEFAULT false,
  	"referrer_host" varchar,
  	"channel" "enum_analytics_events_channel",
  	"device" "enum_analytics_events_device",
  	"browser" varchar,
  	"country" varchar,
  	"visitor" varchar NOT NULL
  );
  
  CREATE TABLE "analytics_daily" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"day" varchar NOT NULL,
  	"dimension" "enum_analytics_daily_dimension" NOT NULL,
  	"key" varchar NOT NULL,
  	"views" numeric DEFAULT 0 NOT NULL,
  	"visitors" numeric DEFAULT 0 NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "analytics_events_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "analytics_daily_id" uuid;
  CREATE INDEX "analytics_events_ts_idx" ON "analytics_events" USING btree ("ts");
  CREATE INDEX "analytics_events_day_idx" ON "analytics_events" USING btree ("day");
  CREATE INDEX "analytics_events_path_idx" ON "analytics_events" USING btree ("path");
  CREATE INDEX "analytics_events_visitor_idx" ON "analytics_events" USING btree ("visitor");
  CREATE INDEX "analytics_daily_day_idx" ON "analytics_daily" USING btree ("day");
  CREATE UNIQUE INDEX "day_dimension_key_idx" ON "analytics_daily" USING btree ("day","dimension","key");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_analytics_events_fk" FOREIGN KEY ("analytics_events_id") REFERENCES "public"."analytics_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_analytics_daily_fk" FOREIGN KEY ("analytics_daily_id") REFERENCES "public"."analytics_daily"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_analytics_events_id_idx" ON "payload_locked_documents_rels" USING btree ("analytics_events_id");
  CREATE INDEX "payload_locked_documents_rels_analytics_daily_id_idx" ON "payload_locked_documents_rels" USING btree ("analytics_daily_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "analytics_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "analytics_daily" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "analytics_events" CASCADE;
  DROP TABLE "analytics_daily" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_analytics_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_analytics_daily_fk";
  
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'noop', 'expire-holds', 'reconcile-payments', 'send-reminders', 'complete-orders', 'reconcile-inventory', 'send-daily-digest', 'issue-tickets', 'issue-invoice', 'generate-invoice-pdf', 'send-email', 'notify-staff', 'process-refund', 'waitlist-notify', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "parent_task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_parent_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_parent_task_slug" AS ENUM('inline', 'noop', 'expire-holds', 'reconcile-payments', 'send-reminders', 'complete-orders', 'reconcile-inventory', 'send-daily-digest', 'issue-tickets', 'issue-invoice', 'generate-invoice-pdf', 'send-email', 'notify-staff', 'process-refund', 'waitlist-notify', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "parent_task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_parent_task_slug" USING "parent_task_slug"::"public"."enum_payload_jobs_log_parent_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'noop', 'expire-holds', 'reconcile-payments', 'send-reminders', 'complete-orders', 'reconcile-inventory', 'send-daily-digest', 'issue-tickets', 'issue-invoice', 'generate-invoice-pdf', 'send-email', 'notify-staff', 'process-refund', 'waitlist-notify', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "payload_locked_documents_rels_analytics_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_analytics_daily_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "analytics_events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "analytics_daily_id";
  DROP TYPE "public"."enum_analytics_events_kind";
  DROP TYPE "public"."enum_analytics_events_channel";
  DROP TYPE "public"."enum_analytics_events_device";
  DROP TYPE "public"."enum_analytics_daily_dimension";`)
}
