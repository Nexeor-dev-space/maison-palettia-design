import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_lines_kind" AS ENUM('session', 'pass');
  CREATE TYPE "public"."enum_orders_codes_kind" AS ENUM('promo', 'pass');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('pending_payment', 'awaiting_payment', 'confirming', 'confirmed', 'completed', 'failed', 'expired', 'cancelled', 'refunded');
  CREATE TYPE "public"."enum_orders_channel" AS ENUM('online', 'desk');
  CREATE TYPE "public"."enum_orders_desk_payment_method" AS ENUM('cash', 'card_terminal', 'complimentary', 'bank_transfer');
  CREATE TYPE "public"."enum_orders_mode" AS ENUM('test', 'live', 'mock');
  CREATE TYPE "public"."enum_orders_review_reason" AS ENUM('amount_mismatch', 'no_order', 'post_expiry', 'mode_or_link_mismatch', 'dispute', 'voided_after_capture');
  CREATE TYPE "public"."enum_tickets_status" AS ENUM('valid', 'checked_in', 'void', 'refunded');
  CREATE TYPE "public"."enum_tickets_check_in_device" AS ENUM('camera', 'manual', 'list');
  CREATE TYPE "public"."enum_refunds_reason" AS ENUM('customer_request', 'session_cancelled', 'post_expiry_payment', 'duplicate', 'goodwill', 'other');
  CREATE TYPE "public"."enum_refunds_status" AS ENUM('requested', 'approved', 'processing', 'succeeded', 'failed');
  CREATE TYPE "public"."enum_invoices_kind" AS ENUM('invoice', 'credit_note');
  CREATE TYPE "public"."enum_pass_purchases_status" AS ENUM('active', 'exhausted', 'expired', 'void');
  CREATE TYPE "public"."enum_promo_codes_type" AS ENUM('percent', 'fixed');
  CREATE TYPE "public"."enum_promo_codes_applies_to" AS ENUM('all', 'experiences', 'sessions');
  CREATE TYPE "public"."enum_waitlist_status" AS ENUM('waiting', 'notified', 'converted', 'expired', 'cancelled');
  CREATE TYPE "public"."enum_payments_provider" AS ENUM('mamo', 'desk');
  CREATE TYPE "public"."enum_payments_status" AS ENUM('created', 'link_ready', 'processing', 'captured', 'refund_pending', 'partially_refunded', 'refunded', 'failed', 'expired', 'voided');
  CREATE TYPE "public"."enum_payments_method_type" AS ENUM('card', 'wallet', 'cash', 'card_terminal', 'complimentary', 'bank_transfer');
  CREATE TYPE "public"."enum_payments_mode" AS ENUM('test', 'live', 'mock');
  CREATE TYPE "public"."enum_payment_events_mode" AS ENUM('test', 'live', 'mock');
  CREATE TYPE "public"."enum_seat_holds_status" AS ENUM('held', 'released', 'consumed');
  CREATE TYPE "public"."enum_invoice_counters_kind" AS ENUM('invoice', 'credit_note');
  CREATE TYPE "public"."enum_email_templates_key" AS ENUM('order_confirmation', 'payment_failed', 'ticket_reminder_24h', 'order_refunded', 'order_cancelled', 'order_moved', 'session_rescheduled', 'session_cancelled', 'post_expiry_payment', 'magic_link', 'enquiry_received', 'waitlist_joined', 'waitlist_seat_available', 'staff_login_link', 'admin_new_order', 'admin_failed_payment', 'admin_refund_requested', 'admin_refund', 'admin_dispute', 'admin_new_enquiry', 'admin_waitlist_joined', 'admin_job_failed', 'admin_low_seats', 'admin_settings_changed', 'admin_webhook_unverified_spike', 'admin_daily_digest', 'test');
  CREATE TYPE "public"."enum_notification_log_channel" AS ENUM('email');
  CREATE TYPE "public"."enum_notification_log_status" AS ENUM('queued', 'sent', 'failed', 'skipped');
  CREATE TYPE "public"."enum_notification_log_template_key" AS ENUM('order_confirmation', 'payment_failed', 'ticket_reminder_24h', 'order_refunded', 'order_cancelled', 'order_moved', 'session_rescheduled', 'session_cancelled', 'post_expiry_payment', 'magic_link', 'enquiry_received', 'waitlist_joined', 'waitlist_seat_available', 'staff_login_link', 'admin_new_order', 'admin_failed_payment', 'admin_refund_requested', 'admin_refund', 'admin_dispute', 'admin_new_enquiry', 'admin_waitlist_joined', 'admin_job_failed', 'admin_low_seats', 'admin_settings_changed', 'admin_webhook_unverified_spike', 'admin_daily_digest', 'test');
  CREATE TYPE "public"."enum_notification_log_provider" AS ENUM('smtp', 'resend', 'log');
  CREATE TYPE "public"."enum_enquiries_status" AS ENUM('new', 'in_progress', 'closed');
  CREATE TYPE "public"."enum_enquiries_source" AS ENUM('contact', 'private-event');
  CREATE TYPE "public"."enum_enquiries_topic" AS ENUM('event', 'booking', 'private', 'collaboration', 'general');
  CREATE TYPE "public"."enum_payload_jobs_workflow_slug" AS ENUM('finalize-order');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'expire-holds' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'reconcile-payments' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'send-reminders' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'complete-orders' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'reconcile-inventory' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'send-daily-digest' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'issue-tickets' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'issue-invoice' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'generate-invoice-pdf' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'send-email' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'notify-staff' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'process-refund' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'waitlist-notify' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'expire-holds' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'reconcile-payments' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'send-reminders' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'complete-orders' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'reconcile-inventory' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'send-daily-digest' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'issue-tickets' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'issue-invoice' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'generate-invoice-pdf' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'send-email' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'notify-staff' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'process-refund' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'waitlist-notify' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'expire-holds' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'reconcile-payments' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'send-reminders' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'complete-orders' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'reconcile-inventory' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'send-daily-digest' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'issue-tickets' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'issue-invoice' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'generate-invoice-pdf' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'send-email' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'notify-staff' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'process-refund' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'waitlist-notify' BEFORE 'schedulePublish';
  CREATE TABLE "orders_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_orders_lines_kind" NOT NULL,
  	"session_id" uuid,
  	"pass_id" uuid,
  	"title" varchar NOT NULL,
  	"category" varchar,
  	"starts_at" timestamp(3) with time zone,
  	"duration_minutes" numeric,
  	"venue_name" varchar,
  	"qty" numeric NOT NULL,
  	"unit_fils" numeric NOT NULL,
  	"line_fils" numeric NOT NULL,
  	"pass_credits" numeric DEFAULT 0
  );
  
  CREATE TABLE "orders_codes" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"kind" "enum_orders_codes_kind",
  	"purchase_id" uuid,
  	"seats_covered" numeric,
  	"discount_fils" numeric
  );
  
  CREATE TABLE "orders_pass_redemptions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"pass_purchase_id" uuid NOT NULL,
  	"n" numeric NOT NULL
  );
  
  CREATE TABLE "orders_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone NOT NULL,
  	"event" varchar NOT NULL,
  	"by" varchar,
  	"detail" jsonb
  );
  
  CREATE TABLE "orders" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"reference" varchar NOT NULL,
  	"status" "enum_orders_status" DEFAULT 'pending_payment' NOT NULL,
  	"channel" "enum_orders_channel" DEFAULT 'online' NOT NULL,
  	"basket_id" varchar,
  	"customer_id" uuid,
  	"contact_first_name" varchar NOT NULL,
  	"contact_last_name" varchar NOT NULL,
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"contact_marketing_opt_in" boolean DEFAULT false,
  	"notes" varchar,
  	"promo_promo_code_id" uuid,
  	"promo_code" varchar,
  	"promo_discount_fils" numeric,
  	"totals_subtotal_fils" numeric NOT NULL,
  	"totals_discount_fils" numeric DEFAULT 0 NOT NULL,
  	"totals_gross_fils" numeric NOT NULL,
  	"totals_net_fils" numeric NOT NULL,
  	"totals_vat_fils" numeric NOT NULL,
  	"totals_vat_rate_bps" numeric DEFAULT 500 NOT NULL,
  	"totals_currency" varchar DEFAULT 'AED' NOT NULL,
  	"desk_payment_method" "enum_orders_desk_payment_method",
  	"desk_payment_amount_fils" numeric,
  	"desk_payment_note" varchar,
  	"desk_payment_taken_by_id" uuid,
  	"payment_id" uuid,
  	"invoice_id" uuid,
  	"hold_expires_at" timestamp(3) with time zone,
  	"hold_seats_by_session" jsonb,
  	"source_ip_hash" varchar,
  	"source_user_agent" varchar,
  	"source_referrer" varchar,
  	"internal_notes" varchar,
  	"consented_policy_versions" jsonb,
  	"mode" "enum_orders_mode" NOT NULL,
  	"confirmed_at" timestamp(3) with time zone,
  	"cancelled_at" timestamp(3) with time zone,
  	"expired_at" timestamp(3) with time zone,
  	"reminders_sent_at" timestamp(3) with time zone,
  	"needs_review" boolean DEFAULT false,
  	"review_reason" "enum_orders_review_reason",
  	"disputed" boolean DEFAULT false,
  	"dispute_status" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "customers" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"email" varchar NOT NULL,
  	"first_name" varchar,
  	"last_name" varchar,
  	"phone" varchar,
  	"marketing_opt_in" boolean DEFAULT false,
  	"notes" varchar,
  	"stats_orders_count" numeric DEFAULT 0,
  	"stats_tickets_count" numeric DEFAULT 0,
  	"stats_lifetime_fils" numeric DEFAULT 0,
  	"last_order_at" timestamp(3) with time zone,
  	"last_magic_link_issued_at" timestamp(3) with time zone,
  	"session_version" numeric DEFAULT 1 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tickets" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"code" varchar NOT NULL,
  	"status" "enum_tickets_status" DEFAULT 'valid' NOT NULL,
  	"order_id" uuid NOT NULL,
  	"session_id" uuid NOT NULL,
  	"holder_name" varchar,
  	"line_index" numeric NOT NULL,
  	"seat_no" numeric NOT NULL,
  	"checked_in_at" timestamp(3) with time zone,
  	"checked_in_by_id" uuid,
  	"check_in_device" "enum_tickets_check_in_device",
  	"check_in_forced" boolean DEFAULT false,
  	"qr" varchar,
  	"qr_sig" varchar,
  	"reminder_sent_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "refunds" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"order_id" uuid NOT NULL,
  	"payment_id" uuid,
  	"amount_fils" numeric NOT NULL,
  	"reason" "enum_refunds_reason" NOT NULL,
  	"note" varchar,
  	"release_seats" boolean DEFAULT true,
  	"status" "enum_refunds_status" DEFAULT 'requested' NOT NULL,
  	"requested_by_id" uuid,
  	"approved_by_id" uuid,
  	"provider_refund_id" varchar,
  	"idempotency_key" varchar NOT NULL,
  	"provider_request_at" timestamp(3) with time zone,
  	"provider_response" jsonb,
  	"credit_note_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "refunds_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tickets_id" uuid
  );
  
  CREATE TABLE "invoices_seller_address_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"line" varchar NOT NULL
  );
  
  CREATE TABLE "invoices_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"description" varchar NOT NULL,
  	"qty" numeric NOT NULL,
  	"unit_net_fils" numeric NOT NULL,
  	"net_fils" numeric NOT NULL,
  	"vat_fils" numeric NOT NULL,
  	"gross_fils" numeric NOT NULL
  );
  
  CREATE TABLE "invoices" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"number" varchar NOT NULL,
  	"kind" "enum_invoices_kind" DEFAULT 'invoice' NOT NULL,
  	"year" numeric NOT NULL,
  	"sequence" numeric NOT NULL,
  	"order_id" uuid NOT NULL,
  	"refund_id" uuid,
  	"seller_legal_name" varchar,
  	"seller_trn" varchar,
  	"seller_trade_licence_number" varchar,
  	"seller_vat_rate_bps" numeric,
  	"seller_email" varchar,
  	"seller_phone" varchar,
  	"buyer_name" varchar,
  	"buyer_email" varchar,
  	"buyer_phone" varchar,
  	"totals_net_fils" numeric NOT NULL,
  	"totals_vat_fils" numeric NOT NULL,
  	"totals_gross_fils" numeric NOT NULL,
  	"totals_discount_fils" numeric DEFAULT 0,
  	"currency" varchar DEFAULT 'AED' NOT NULL,
  	"payment_label" varchar,
  	"issued_at" timestamp(3) with time zone,
  	"file_id" uuid,
  	"generated_at" timestamp(3) with time zone,
  	"emailed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pass_purchases_redemptions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"for_order_id" uuid NOT NULL,
  	"n" numeric NOT NULL,
  	"at" timestamp(3) with time zone NOT NULL,
  	"restored" boolean DEFAULT false
  );
  
  CREATE TABLE "pass_purchases" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"code" varchar NOT NULL,
  	"status" "enum_pass_purchases_status" DEFAULT 'active' NOT NULL,
  	"customer_id" uuid NOT NULL,
  	"order_id" uuid NOT NULL,
  	"pass_id" uuid NOT NULL,
  	"sessions_total" numeric NOT NULL,
  	"sessions_remaining" numeric NOT NULL,
  	"expires_at" timestamp(3) with time zone,
  	"exhausted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "promo_codes" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"code" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"type" "enum_promo_codes_type" DEFAULT 'percent' NOT NULL,
  	"value" numeric NOT NULL,
  	"applies_to" "enum_promo_codes_applies_to" DEFAULT 'all' NOT NULL,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"max_uses" numeric,
  	"uses" numeric DEFAULT 0 NOT NULL,
  	"min_spend_fils" numeric,
  	"notes" varchar,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "promo_codes_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"experiences_id" uuid,
  	"sessions_id" uuid
  );
  
  CREATE TABLE "waitlist" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"session_id" uuid NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"qty" numeric DEFAULT 1 NOT NULL,
  	"status" "enum_waitlist_status" DEFAULT 'waiting' NOT NULL,
  	"position" numeric,
  	"notified_at" timestamp(3) with time zone,
  	"token" varchar,
  	"token_expires_at" timestamp(3) with time zone,
  	"converted_order_id" uuid,
  	"meta_ip_hash" varchar,
  	"meta_user_agent" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payments" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"order_id" uuid NOT NULL,
  	"provider" "enum_payments_provider" DEFAULT 'mamo' NOT NULL,
  	"status" "enum_payments_status" DEFAULT 'created' NOT NULL,
  	"amount_fils" numeric NOT NULL,
  	"currency" varchar DEFAULT 'AED' NOT NULL,
  	"method_type" "enum_payments_method_type",
  	"method_card_last4" varchar,
  	"method_card_origin" varchar,
  	"provider_link_id" varchar,
  	"provider_payment_id" varchar,
  	"provider_link_url" varchar,
  	"failure_code" varchar,
  	"failure_message" varchar,
  	"raw" jsonb,
  	"settlement_amount" varchar,
  	"settlement_fee" varchar,
  	"settlement_vat" varchar,
  	"settlement_currency" varchar,
  	"settlement_date" varchar,
  	"mode" "enum_payments_mode" NOT NULL,
  	"captured_at" timestamp(3) with time zone,
  	"failed_at" timestamp(3) with time zone,
  	"webhook_seen_at" timestamp(3) with time zone,
  	"verified_at" timestamp(3) with time zone,
  	"link_deactivated_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payment_events" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"provider" varchar DEFAULT 'mamo' NOT NULL,
  	"event_type" varchar,
  	"verified" boolean DEFAULT false NOT NULL,
  	"needs_review" boolean DEFAULT false,
  	"provider_payment_id" varchar,
  	"provider_link_id" varchar,
  	"order_id" uuid,
  	"dedupe_key" varchar NOT NULL,
  	"headers" jsonb,
  	"payload" jsonb,
  	"body_excerpt" varchar,
  	"ip_hash" varchar,
  	"error" varchar,
  	"mode" "enum_payment_events_mode" NOT NULL,
  	"received_at" timestamp(3) with time zone,
  	"processing_started_at" timestamp(3) with time zone,
  	"processed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payment_events_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "seat_holds" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"order_id" uuid NOT NULL,
  	"session_id" uuid NOT NULL,
  	"qty" numeric NOT NULL,
  	"status" "enum_seat_holds_status" DEFAULT 'held' NOT NULL,
  	"expires_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "invoice_files" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"invoice_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric
  );
  
  CREATE TABLE "invoice_counters" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"kind" "enum_invoice_counters_kind" NOT NULL,
  	"year" numeric NOT NULL,
  	"last" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "email_templates" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" "enum_email_templates_key" NOT NULL,
  	"label" varchar NOT NULL,
  	"subject" varchar NOT NULL,
  	"preheader" varchar,
  	"body" jsonb NOT NULL,
  	"attach_invoice" boolean DEFAULT false,
  	"attach_tickets" boolean DEFAULT false,
  	"enabled" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "notification_log" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"channel" "enum_notification_log_channel" DEFAULT 'email' NOT NULL,
  	"to" varchar NOT NULL,
  	"status" "enum_notification_log_status" DEFAULT 'queued' NOT NULL,
  	"template_key" "enum_notification_log_template_key",
  	"subject" varchar,
  	"provider" "enum_notification_log_provider",
  	"provider_message_id" varchar,
  	"attempts" numeric DEFAULT 0 NOT NULL,
  	"error" varchar,
  	"sent_at" timestamp(3) with time zone,
  	"order_id" uuid,
  	"session_id" uuid,
  	"ticket_id" uuid,
  	"refund_id" uuid,
  	"enquiry_id" uuid,
  	"variables" jsonb,
  	"html" varchar,
  	"text" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "enquiries_details" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "enquiries" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"status" "enum_enquiries_status" DEFAULT 'new' NOT NULL,
  	"assigned_to_id" uuid,
  	"replied_at" timestamp(3) with time zone,
  	"source" "enum_enquiries_source" NOT NULL,
  	"topic" "enum_enquiries_topic" NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"message" varchar NOT NULL,
  	"internal_notes" varchar,
  	"meta_ip_hash" varchar,
  	"meta_referer" varchar,
  	"meta_user_agent" varchar,
  	"meta_honeypot_tripped" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_jobs_stats" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_jobs" ADD COLUMN "workflow_slug" "enum_payload_jobs_workflow_slug";
  ALTER TABLE "payload_jobs" ADD COLUMN "meta" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "orders_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "customers_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tickets_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "refunds_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "invoices_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pass_purchases_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "promo_codes_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "waitlist_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payments_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payment_events_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "seat_holds_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "invoice_files_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "invoice_counters_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "email_templates_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "notification_log_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "enquiries_id" uuid;
  ALTER TABLE "orders_lines" ADD CONSTRAINT "orders_lines_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_lines" ADD CONSTRAINT "orders_lines_pass_id_passes_id_fk" FOREIGN KEY ("pass_id") REFERENCES "public"."passes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_lines" ADD CONSTRAINT "orders_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_codes" ADD CONSTRAINT "orders_codes_purchase_id_pass_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."pass_purchases"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_codes" ADD CONSTRAINT "orders_codes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_pass_redemptions" ADD CONSTRAINT "orders_pass_redemptions_pass_purchase_id_pass_purchases_id_fk" FOREIGN KEY ("pass_purchase_id") REFERENCES "public"."pass_purchases"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_pass_redemptions" ADD CONSTRAINT "orders_pass_redemptions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_timeline" ADD CONSTRAINT "orders_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_promo_promo_code_id_promo_codes_id_fk" FOREIGN KEY ("promo_promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_desk_payment_taken_by_id_users_id_fk" FOREIGN KEY ("desk_payment_taken_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_checked_in_by_id_users_id_fk" FOREIGN KEY ("checked_in_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "refunds" ADD CONSTRAINT "refunds_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "refunds" ADD CONSTRAINT "refunds_credit_note_id_invoices_id_fk" FOREIGN KEY ("credit_note_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "refunds_rels" ADD CONSTRAINT "refunds_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."refunds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "refunds_rels" ADD CONSTRAINT "refunds_rels_tickets_fk" FOREIGN KEY ("tickets_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "invoices_seller_address_lines" ADD CONSTRAINT "invoices_seller_address_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "invoices_lines" ADD CONSTRAINT "invoices_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_refund_id_refunds_id_fk" FOREIGN KEY ("refund_id") REFERENCES "public"."refunds"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_file_id_invoice_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."invoice_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pass_purchases_redemptions" ADD CONSTRAINT "pass_purchases_redemptions_for_order_id_orders_id_fk" FOREIGN KEY ("for_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pass_purchases_redemptions" ADD CONSTRAINT "pass_purchases_redemptions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pass_purchases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pass_purchases" ADD CONSTRAINT "pass_purchases_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pass_purchases" ADD CONSTRAINT "pass_purchases_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pass_purchases" ADD CONSTRAINT "pass_purchases_pass_id_passes_id_fk" FOREIGN KEY ("pass_id") REFERENCES "public"."passes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "promo_codes_rels" ADD CONSTRAINT "promo_codes_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."promo_codes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "promo_codes_rels" ADD CONSTRAINT "promo_codes_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "promo_codes_rels" ADD CONSTRAINT "promo_codes_rels_sessions_fk" FOREIGN KEY ("sessions_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_converted_order_id_orders_id_fk" FOREIGN KEY ("converted_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payment_events_texts" ADD CONSTRAINT "payment_events_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payment_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seat_holds" ADD CONSTRAINT "seat_holds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seat_holds" ADD CONSTRAINT "seat_holds_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "invoice_files" ADD CONSTRAINT "invoice_files_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_refund_id_refunds_id_fk" FOREIGN KEY ("refund_id") REFERENCES "public"."refunds"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "enquiries_details" ADD CONSTRAINT "enquiries_details_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "orders_lines_order_idx" ON "orders_lines" USING btree ("_order");
  CREATE INDEX "orders_lines_parent_id_idx" ON "orders_lines" USING btree ("_parent_id");
  CREATE INDEX "orders_lines_session_idx" ON "orders_lines" USING btree ("session_id");
  CREATE INDEX "orders_lines_pass_idx" ON "orders_lines" USING btree ("pass_id");
  CREATE INDEX "orders_codes_order_idx" ON "orders_codes" USING btree ("_order");
  CREATE INDEX "orders_codes_parent_id_idx" ON "orders_codes" USING btree ("_parent_id");
  CREATE INDEX "orders_codes_purchase_idx" ON "orders_codes" USING btree ("purchase_id");
  CREATE INDEX "orders_pass_redemptions_order_idx" ON "orders_pass_redemptions" USING btree ("_order");
  CREATE INDEX "orders_pass_redemptions_parent_id_idx" ON "orders_pass_redemptions" USING btree ("_parent_id");
  CREATE INDEX "orders_pass_redemptions_pass_purchase_idx" ON "orders_pass_redemptions" USING btree ("pass_purchase_id");
  CREATE INDEX "orders_timeline_order_idx" ON "orders_timeline" USING btree ("_order");
  CREATE INDEX "orders_timeline_parent_id_idx" ON "orders_timeline" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "orders_reference_idx" ON "orders" USING btree ("reference");
  CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");
  CREATE INDEX "orders_channel_idx" ON "orders" USING btree ("channel");
  CREATE INDEX "orders_basket_id_idx" ON "orders" USING btree ("basket_id");
  CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");
  CREATE INDEX "orders_promo_promo_promo_code_idx" ON "orders" USING btree ("promo_promo_code_id");
  CREATE INDEX "orders_desk_payment_desk_payment_taken_by_idx" ON "orders" USING btree ("desk_payment_taken_by_id");
  CREATE INDEX "orders_payment_idx" ON "orders" USING btree ("payment_id");
  CREATE INDEX "orders_invoice_idx" ON "orders" USING btree ("invoice_id");
  CREATE INDEX "orders_hold_hold_expires_at_idx" ON "orders" USING btree ("hold_expires_at");
  CREATE INDEX "orders_mode_idx" ON "orders" USING btree ("mode");
  CREATE INDEX "orders_confirmed_at_idx" ON "orders" USING btree ("confirmed_at");
  CREATE INDEX "orders_needs_review_idx" ON "orders" USING btree ("needs_review");
  CREATE INDEX "orders_disputed_idx" ON "orders" USING btree ("disputed");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE UNIQUE INDEX "customers_email_idx" ON "customers" USING btree ("email");
  CREATE INDEX "customers_last_order_at_idx" ON "customers" USING btree ("last_order_at");
  CREATE INDEX "customers_updated_at_idx" ON "customers" USING btree ("updated_at");
  CREATE INDEX "customers_created_at_idx" ON "customers" USING btree ("created_at");
  CREATE UNIQUE INDEX "tickets_code_idx" ON "tickets" USING btree ("code");
  CREATE INDEX "tickets_status_idx" ON "tickets" USING btree ("status");
  CREATE INDEX "tickets_order_idx" ON "tickets" USING btree ("order_id");
  CREATE INDEX "tickets_session_idx" ON "tickets" USING btree ("session_id");
  CREATE INDEX "tickets_checked_in_at_idx" ON "tickets" USING btree ("checked_in_at");
  CREATE INDEX "tickets_checked_in_by_idx" ON "tickets" USING btree ("checked_in_by_id");
  CREATE INDEX "tickets_updated_at_idx" ON "tickets" USING btree ("updated_at");
  CREATE INDEX "tickets_created_at_idx" ON "tickets" USING btree ("created_at");
  CREATE INDEX "refunds_order_idx" ON "refunds" USING btree ("order_id");
  CREATE INDEX "refunds_payment_idx" ON "refunds" USING btree ("payment_id");
  CREATE INDEX "refunds_status_idx" ON "refunds" USING btree ("status");
  CREATE INDEX "refunds_requested_by_idx" ON "refunds" USING btree ("requested_by_id");
  CREATE INDEX "refunds_approved_by_idx" ON "refunds" USING btree ("approved_by_id");
  CREATE UNIQUE INDEX "refunds_idempotency_key_idx" ON "refunds" USING btree ("idempotency_key");
  CREATE INDEX "refunds_credit_note_idx" ON "refunds" USING btree ("credit_note_id");
  CREATE INDEX "refunds_updated_at_idx" ON "refunds" USING btree ("updated_at");
  CREATE INDEX "refunds_created_at_idx" ON "refunds" USING btree ("created_at");
  CREATE INDEX "refunds_rels_order_idx" ON "refunds_rels" USING btree ("order");
  CREATE INDEX "refunds_rels_parent_idx" ON "refunds_rels" USING btree ("parent_id");
  CREATE INDEX "refunds_rels_path_idx" ON "refunds_rels" USING btree ("path");
  CREATE INDEX "refunds_rels_tickets_id_idx" ON "refunds_rels" USING btree ("tickets_id");
  CREATE INDEX "invoices_seller_address_lines_order_idx" ON "invoices_seller_address_lines" USING btree ("_order");
  CREATE INDEX "invoices_seller_address_lines_parent_id_idx" ON "invoices_seller_address_lines" USING btree ("_parent_id");
  CREATE INDEX "invoices_lines_order_idx" ON "invoices_lines" USING btree ("_order");
  CREATE INDEX "invoices_lines_parent_id_idx" ON "invoices_lines" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "invoices_number_idx" ON "invoices" USING btree ("number");
  CREATE INDEX "invoices_kind_idx" ON "invoices" USING btree ("kind");
  CREATE INDEX "invoices_order_idx" ON "invoices" USING btree ("order_id");
  CREATE INDEX "invoices_refund_idx" ON "invoices" USING btree ("refund_id");
  CREATE INDEX "invoices_issued_at_idx" ON "invoices" USING btree ("issued_at");
  CREATE INDEX "invoices_file_idx" ON "invoices" USING btree ("file_id");
  CREATE INDEX "invoices_updated_at_idx" ON "invoices" USING btree ("updated_at");
  CREATE INDEX "invoices_created_at_idx" ON "invoices" USING btree ("created_at");
  CREATE INDEX "pass_purchases_redemptions_order_idx" ON "pass_purchases_redemptions" USING btree ("_order");
  CREATE INDEX "pass_purchases_redemptions_parent_id_idx" ON "pass_purchases_redemptions" USING btree ("_parent_id");
  CREATE INDEX "pass_purchases_redemptions_for_order_idx" ON "pass_purchases_redemptions" USING btree ("for_order_id");
  CREATE UNIQUE INDEX "pass_purchases_code_idx" ON "pass_purchases" USING btree ("code");
  CREATE INDEX "pass_purchases_status_idx" ON "pass_purchases" USING btree ("status");
  CREATE INDEX "pass_purchases_customer_idx" ON "pass_purchases" USING btree ("customer_id");
  CREATE INDEX "pass_purchases_order_idx" ON "pass_purchases" USING btree ("order_id");
  CREATE INDEX "pass_purchases_pass_idx" ON "pass_purchases" USING btree ("pass_id");
  CREATE INDEX "pass_purchases_expires_at_idx" ON "pass_purchases" USING btree ("expires_at");
  CREATE INDEX "pass_purchases_updated_at_idx" ON "pass_purchases" USING btree ("updated_at");
  CREATE INDEX "pass_purchases_created_at_idx" ON "pass_purchases" USING btree ("created_at");
  CREATE UNIQUE INDEX "promo_codes_code_idx" ON "promo_codes" USING btree ("code");
  CREATE INDEX "promo_codes_ends_at_idx" ON "promo_codes" USING btree ("ends_at");
  CREATE INDEX "promo_codes_active_idx" ON "promo_codes" USING btree ("active");
  CREATE INDEX "promo_codes_updated_at_idx" ON "promo_codes" USING btree ("updated_at");
  CREATE INDEX "promo_codes_created_at_idx" ON "promo_codes" USING btree ("created_at");
  CREATE INDEX "promo_codes_rels_order_idx" ON "promo_codes_rels" USING btree ("order");
  CREATE INDEX "promo_codes_rels_parent_idx" ON "promo_codes_rels" USING btree ("parent_id");
  CREATE INDEX "promo_codes_rels_path_idx" ON "promo_codes_rels" USING btree ("path");
  CREATE INDEX "promo_codes_rels_experiences_id_idx" ON "promo_codes_rels" USING btree ("experiences_id");
  CREATE INDEX "promo_codes_rels_sessions_id_idx" ON "promo_codes_rels" USING btree ("sessions_id");
  CREATE INDEX "waitlist_session_idx" ON "waitlist" USING btree ("session_id");
  CREATE INDEX "waitlist_email_idx" ON "waitlist" USING btree ("email");
  CREATE INDEX "waitlist_status_idx" ON "waitlist" USING btree ("status");
  CREATE INDEX "waitlist_notified_at_idx" ON "waitlist" USING btree ("notified_at");
  CREATE INDEX "waitlist_token_idx" ON "waitlist" USING btree ("token");
  CREATE INDEX "waitlist_token_expires_at_idx" ON "waitlist" USING btree ("token_expires_at");
  CREATE INDEX "waitlist_converted_order_idx" ON "waitlist" USING btree ("converted_order_id");
  CREATE INDEX "waitlist_updated_at_idx" ON "waitlist" USING btree ("updated_at");
  CREATE INDEX "waitlist_created_at_idx" ON "waitlist" USING btree ("created_at");
  CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");
  CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");
  CREATE INDEX "payments_provider_link_id_idx" ON "payments" USING btree ("provider_link_id");
  CREATE UNIQUE INDEX "payments_provider_payment_id_idx" ON "payments" USING btree ("provider_payment_id");
  CREATE INDEX "payments_mode_idx" ON "payments" USING btree ("mode");
  CREATE INDEX "payments_captured_at_idx" ON "payments" USING btree ("captured_at");
  CREATE INDEX "payments_updated_at_idx" ON "payments" USING btree ("updated_at");
  CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");
  CREATE INDEX "payment_events_event_type_idx" ON "payment_events" USING btree ("event_type");
  CREATE INDEX "payment_events_verified_idx" ON "payment_events" USING btree ("verified");
  CREATE INDEX "payment_events_needs_review_idx" ON "payment_events" USING btree ("needs_review");
  CREATE INDEX "payment_events_provider_payment_id_idx" ON "payment_events" USING btree ("provider_payment_id");
  CREATE INDEX "payment_events_provider_link_id_idx" ON "payment_events" USING btree ("provider_link_id");
  CREATE INDEX "payment_events_order_idx" ON "payment_events" USING btree ("order_id");
  CREATE UNIQUE INDEX "payment_events_dedupe_key_idx" ON "payment_events" USING btree ("dedupe_key");
  CREATE INDEX "payment_events_mode_idx" ON "payment_events" USING btree ("mode");
  CREATE INDEX "payment_events_received_at_idx" ON "payment_events" USING btree ("received_at");
  CREATE INDEX "payment_events_processed_at_idx" ON "payment_events" USING btree ("processed_at");
  CREATE INDEX "payment_events_updated_at_idx" ON "payment_events" USING btree ("updated_at");
  CREATE INDEX "payment_events_created_at_idx" ON "payment_events" USING btree ("created_at");
  CREATE INDEX "payment_events_texts_order_parent" ON "payment_events_texts" USING btree ("order","parent_id");
  CREATE INDEX "seat_holds_order_idx" ON "seat_holds" USING btree ("order_id");
  CREATE INDEX "seat_holds_session_idx" ON "seat_holds" USING btree ("session_id");
  CREATE INDEX "seat_holds_status_idx" ON "seat_holds" USING btree ("status");
  CREATE INDEX "seat_holds_expires_at_idx" ON "seat_holds" USING btree ("expires_at");
  CREATE INDEX "seat_holds_updated_at_idx" ON "seat_holds" USING btree ("updated_at");
  CREATE INDEX "seat_holds_created_at_idx" ON "seat_holds" USING btree ("created_at");
  CREATE INDEX "invoice_files_invoice_idx" ON "invoice_files" USING btree ("invoice_id");
  CREATE INDEX "invoice_files_updated_at_idx" ON "invoice_files" USING btree ("updated_at");
  CREATE INDEX "invoice_files_created_at_idx" ON "invoice_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "invoice_files_filename_idx" ON "invoice_files" USING btree ("filename");
  CREATE INDEX "invoice_counters_updated_at_idx" ON "invoice_counters" USING btree ("updated_at");
  CREATE INDEX "invoice_counters_created_at_idx" ON "invoice_counters" USING btree ("created_at");
  CREATE UNIQUE INDEX "kind_year_idx" ON "invoice_counters" USING btree ("kind","year");
  CREATE UNIQUE INDEX "email_templates_key_idx" ON "email_templates" USING btree ("key");
  CREATE INDEX "email_templates_updated_at_idx" ON "email_templates" USING btree ("updated_at");
  CREATE INDEX "email_templates_created_at_idx" ON "email_templates" USING btree ("created_at");
  CREATE INDEX "notification_log_to_idx" ON "notification_log" USING btree ("to");
  CREATE INDEX "notification_log_status_idx" ON "notification_log" USING btree ("status");
  CREATE INDEX "notification_log_template_key_idx" ON "notification_log" USING btree ("template_key");
  CREATE INDEX "notification_log_sent_at_idx" ON "notification_log" USING btree ("sent_at");
  CREATE INDEX "notification_log_order_idx" ON "notification_log" USING btree ("order_id");
  CREATE INDEX "notification_log_session_idx" ON "notification_log" USING btree ("session_id");
  CREATE INDEX "notification_log_ticket_idx" ON "notification_log" USING btree ("ticket_id");
  CREATE INDEX "notification_log_refund_idx" ON "notification_log" USING btree ("refund_id");
  CREATE INDEX "notification_log_enquiry_idx" ON "notification_log" USING btree ("enquiry_id");
  CREATE INDEX "notification_log_updated_at_idx" ON "notification_log" USING btree ("updated_at");
  CREATE INDEX "notification_log_created_at_idx" ON "notification_log" USING btree ("created_at");
  CREATE INDEX "enquiries_details_order_idx" ON "enquiries_details" USING btree ("_order");
  CREATE INDEX "enquiries_details_parent_id_idx" ON "enquiries_details" USING btree ("_parent_id");
  CREATE INDEX "enquiries_status_idx" ON "enquiries" USING btree ("status");
  CREATE INDEX "enquiries_assigned_to_idx" ON "enquiries" USING btree ("assigned_to_id");
  CREATE INDEX "enquiries_replied_at_idx" ON "enquiries" USING btree ("replied_at");
  CREATE INDEX "enquiries_source_idx" ON "enquiries" USING btree ("source");
  CREATE INDEX "enquiries_topic_idx" ON "enquiries" USING btree ("topic");
  CREATE INDEX "enquiries_email_idx" ON "enquiries" USING btree ("email");
  CREATE INDEX "enquiries_meta_meta_honeypot_tripped_idx" ON "enquiries" USING btree ("meta_honeypot_tripped");
  CREATE INDEX "enquiries_updated_at_idx" ON "enquiries" USING btree ("updated_at");
  CREATE INDEX "enquiries_created_at_idx" ON "enquiries" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tickets_fk" FOREIGN KEY ("tickets_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_refunds_fk" FOREIGN KEY ("refunds_id") REFERENCES "public"."refunds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_invoices_fk" FOREIGN KEY ("invoices_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pass_purchases_fk" FOREIGN KEY ("pass_purchases_id") REFERENCES "public"."pass_purchases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_promo_codes_fk" FOREIGN KEY ("promo_codes_id") REFERENCES "public"."promo_codes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_waitlist_fk" FOREIGN KEY ("waitlist_id") REFERENCES "public"."waitlist"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payments_fk" FOREIGN KEY ("payments_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payment_events_fk" FOREIGN KEY ("payment_events_id") REFERENCES "public"."payment_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_seat_holds_fk" FOREIGN KEY ("seat_holds_id") REFERENCES "public"."seat_holds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_invoice_files_fk" FOREIGN KEY ("invoice_files_id") REFERENCES "public"."invoice_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_invoice_counters_fk" FOREIGN KEY ("invoice_counters_id") REFERENCES "public"."invoice_counters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_email_templates_fk" FOREIGN KEY ("email_templates_id") REFERENCES "public"."email_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notification_log_fk" FOREIGN KEY ("notification_log_id") REFERENCES "public"."notification_log"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_enquiries_fk" FOREIGN KEY ("enquiries_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_jobs_workflow_slug_idx" ON "payload_jobs" USING btree ("workflow_slug");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("customers_id");
  CREATE INDEX "payload_locked_documents_rels_tickets_id_idx" ON "payload_locked_documents_rels" USING btree ("tickets_id");
  CREATE INDEX "payload_locked_documents_rels_refunds_id_idx" ON "payload_locked_documents_rels" USING btree ("refunds_id");
  CREATE INDEX "payload_locked_documents_rels_invoices_id_idx" ON "payload_locked_documents_rels" USING btree ("invoices_id");
  CREATE INDEX "payload_locked_documents_rels_pass_purchases_id_idx" ON "payload_locked_documents_rels" USING btree ("pass_purchases_id");
  CREATE INDEX "payload_locked_documents_rels_promo_codes_id_idx" ON "payload_locked_documents_rels" USING btree ("promo_codes_id");
  CREATE INDEX "payload_locked_documents_rels_waitlist_id_idx" ON "payload_locked_documents_rels" USING btree ("waitlist_id");
  CREATE INDEX "payload_locked_documents_rels_payments_id_idx" ON "payload_locked_documents_rels" USING btree ("payments_id");
  CREATE INDEX "payload_locked_documents_rels_payment_events_id_idx" ON "payload_locked_documents_rels" USING btree ("payment_events_id");
  CREATE INDEX "payload_locked_documents_rels_seat_holds_id_idx" ON "payload_locked_documents_rels" USING btree ("seat_holds_id");
  CREATE INDEX "payload_locked_documents_rels_invoice_files_id_idx" ON "payload_locked_documents_rels" USING btree ("invoice_files_id");
  CREATE INDEX "payload_locked_documents_rels_invoice_counters_id_idx" ON "payload_locked_documents_rels" USING btree ("invoice_counters_id");
  CREATE INDEX "payload_locked_documents_rels_email_templates_id_idx" ON "payload_locked_documents_rels" USING btree ("email_templates_id");
  CREATE INDEX "payload_locked_documents_rels_notification_log_id_idx" ON "payload_locked_documents_rels" USING btree ("notification_log_id");
  CREATE INDEX "payload_locked_documents_rels_enquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("enquiries_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_codes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_pass_redemptions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_timeline" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "customers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tickets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "refunds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "refunds_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "invoices_seller_address_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "invoices_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "invoices" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pass_purchases_redemptions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pass_purchases" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "promo_codes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "promo_codes_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "waitlist" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payment_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payment_events_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "seat_holds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "invoice_files" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "invoice_counters" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "email_templates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "notification_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "enquiries_details" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "enquiries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_stats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "orders_lines" CASCADE;
  DROP TABLE "orders_codes" CASCADE;
  DROP TABLE "orders_pass_redemptions" CASCADE;
  DROP TABLE "orders_timeline" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "customers" CASCADE;
  DROP TABLE "tickets" CASCADE;
  DROP TABLE "refunds" CASCADE;
  DROP TABLE "refunds_rels" CASCADE;
  DROP TABLE "invoices_seller_address_lines" CASCADE;
  DROP TABLE "invoices_lines" CASCADE;
  DROP TABLE "invoices" CASCADE;
  DROP TABLE "pass_purchases_redemptions" CASCADE;
  DROP TABLE "pass_purchases" CASCADE;
  DROP TABLE "promo_codes" CASCADE;
  DROP TABLE "promo_codes_rels" CASCADE;
  DROP TABLE "waitlist" CASCADE;
  DROP TABLE "payments" CASCADE;
  DROP TABLE "payment_events" CASCADE;
  DROP TABLE "payment_events_texts" CASCADE;
  DROP TABLE "seat_holds" CASCADE;
  DROP TABLE "invoice_files" CASCADE;
  DROP TABLE "invoice_counters" CASCADE;
  DROP TABLE "email_templates" CASCADE;
  DROP TABLE "notification_log" CASCADE;
  DROP TABLE "enquiries_details" CASCADE;
  DROP TABLE "enquiries" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_orders_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_customers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tickets_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_refunds_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_invoices_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pass_purchases_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_promo_codes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_waitlist_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payments_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payment_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_seat_holds_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_invoice_files_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_invoice_counters_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_email_templates_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_notification_log_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_enquiries_fk";
  
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'noop', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "parent_task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_parent_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_parent_task_slug" AS ENUM('inline', 'noop', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "parent_task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_parent_task_slug" USING "parent_task_slug"::"public"."enum_payload_jobs_log_parent_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'noop', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "payload_jobs_workflow_slug_idx";
  DROP INDEX "payload_locked_documents_rels_orders_id_idx";
  DROP INDEX "payload_locked_documents_rels_customers_id_idx";
  DROP INDEX "payload_locked_documents_rels_tickets_id_idx";
  DROP INDEX "payload_locked_documents_rels_refunds_id_idx";
  DROP INDEX "payload_locked_documents_rels_invoices_id_idx";
  DROP INDEX "payload_locked_documents_rels_pass_purchases_id_idx";
  DROP INDEX "payload_locked_documents_rels_promo_codes_id_idx";
  DROP INDEX "payload_locked_documents_rels_waitlist_id_idx";
  DROP INDEX "payload_locked_documents_rels_payments_id_idx";
  DROP INDEX "payload_locked_documents_rels_payment_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_seat_holds_id_idx";
  DROP INDEX "payload_locked_documents_rels_invoice_files_id_idx";
  DROP INDEX "payload_locked_documents_rels_invoice_counters_id_idx";
  DROP INDEX "payload_locked_documents_rels_email_templates_id_idx";
  DROP INDEX "payload_locked_documents_rels_notification_log_id_idx";
  DROP INDEX "payload_locked_documents_rels_enquiries_id_idx";
  ALTER TABLE "payload_jobs" DROP COLUMN "workflow_slug";
  ALTER TABLE "payload_jobs" DROP COLUMN "meta";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "orders_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "customers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tickets_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "refunds_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "invoices_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pass_purchases_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "promo_codes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "waitlist_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payments_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payment_events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "seat_holds_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "invoice_files_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "invoice_counters_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "email_templates_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "notification_log_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "enquiries_id";
  DROP TYPE "public"."enum_orders_lines_kind";
  DROP TYPE "public"."enum_orders_codes_kind";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_orders_channel";
  DROP TYPE "public"."enum_orders_desk_payment_method";
  DROP TYPE "public"."enum_orders_mode";
  DROP TYPE "public"."enum_orders_review_reason";
  DROP TYPE "public"."enum_tickets_status";
  DROP TYPE "public"."enum_tickets_check_in_device";
  DROP TYPE "public"."enum_refunds_reason";
  DROP TYPE "public"."enum_refunds_status";
  DROP TYPE "public"."enum_invoices_kind";
  DROP TYPE "public"."enum_pass_purchases_status";
  DROP TYPE "public"."enum_promo_codes_type";
  DROP TYPE "public"."enum_promo_codes_applies_to";
  DROP TYPE "public"."enum_waitlist_status";
  DROP TYPE "public"."enum_payments_provider";
  DROP TYPE "public"."enum_payments_status";
  DROP TYPE "public"."enum_payments_method_type";
  DROP TYPE "public"."enum_payments_mode";
  DROP TYPE "public"."enum_payment_events_mode";
  DROP TYPE "public"."enum_seat_holds_status";
  DROP TYPE "public"."enum_invoice_counters_kind";
  DROP TYPE "public"."enum_email_templates_key";
  DROP TYPE "public"."enum_notification_log_channel";
  DROP TYPE "public"."enum_notification_log_status";
  DROP TYPE "public"."enum_notification_log_template_key";
  DROP TYPE "public"."enum_notification_log_provider";
  DROP TYPE "public"."enum_enquiries_status";
  DROP TYPE "public"."enum_enquiries_source";
  DROP TYPE "public"."enum_enquiries_topic";
  DROP TYPE "public"."enum_payload_jobs_workflow_slug";`)
}
