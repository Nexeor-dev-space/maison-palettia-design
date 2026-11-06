import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_credit_notes_status" AS ENUM('available', 'redeemed', 'expired');
  CREATE TABLE "credit_notes" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"code" varchar NOT NULL,
  	"status" "enum_credit_notes_status" DEFAULT 'available' NOT NULL,
  	"order_id" uuid NOT NULL,
  	"amount_fils" numeric NOT NULL,
  	"customer_id" uuid,
  	"customer_email" varchar NOT NULL,
  	"customer_name" varchar,
  	"issued_at" timestamp(3) with time zone NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"redeemed_in_order_id" uuid,
  	"redeemed_at" timestamp(3) with time zone,
  	"redeemed_amount_fils" numeric,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "orders" ADD COLUMN "credit_note_used_id" uuid;
  ALTER TABLE "orders" ADD COLUMN "original_booking_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "credit_notes_id" uuid;
  ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_redeemed_in_order_id_orders_id_fk" FOREIGN KEY ("redeemed_in_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "credit_notes_code_idx" ON "credit_notes" USING btree ("code");
  CREATE INDEX "credit_notes_status_idx" ON "credit_notes" USING btree ("status");
  CREATE INDEX "credit_notes_order_idx" ON "credit_notes" USING btree ("order_id");
  CREATE INDEX "credit_notes_customer_idx" ON "credit_notes" USING btree ("customer_id");
  CREATE INDEX "credit_notes_customer_email_idx" ON "credit_notes" USING btree ("customer_email");
  CREATE INDEX "credit_notes_expires_at_idx" ON "credit_notes" USING btree ("expires_at");
  CREATE INDEX "credit_notes_redeemed_in_order_idx" ON "credit_notes" USING btree ("redeemed_in_order_id");
  CREATE INDEX "credit_notes_updated_at_idx" ON "credit_notes" USING btree ("updated_at");
  CREATE INDEX "credit_notes_created_at_idx" ON "credit_notes" USING btree ("created_at");
  ALTER TABLE "orders" ADD CONSTRAINT "orders_credit_note_used_id_credit_notes_id_fk" FOREIGN KEY ("credit_note_used_id") REFERENCES "public"."credit_notes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_original_booking_id_orders_id_fk" FOREIGN KEY ("original_booking_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_credit_notes_fk" FOREIGN KEY ("credit_notes_id") REFERENCES "public"."credit_notes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "orders_credit_note_used_idx" ON "orders" USING btree ("credit_note_used_id");
  CREATE INDEX "orders_original_booking_idx" ON "orders" USING btree ("original_booking_id");
  CREATE INDEX "payload_locked_documents_rels_credit_notes_id_idx" ON "payload_locked_documents_rels" USING btree ("credit_notes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "credit_notes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "credit_notes" CASCADE;
  ALTER TABLE "orders" DROP CONSTRAINT "orders_credit_note_used_id_credit_notes_id_fk";
  
  ALTER TABLE "orders" DROP CONSTRAINT "orders_original_booking_id_orders_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_credit_notes_fk";
  
  DROP INDEX "orders_credit_note_used_idx";
  DROP INDEX "orders_original_booking_idx";
  DROP INDEX "payload_locked_documents_rels_credit_notes_id_idx";
  ALTER TABLE "orders" DROP COLUMN "credit_note_used_id";
  ALTER TABLE "orders" DROP COLUMN "original_booking_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "credit_notes_id";
  DROP TYPE "public"."enum_credit_notes_status";`)
}
