import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'front-desk');
  CREATE TYPE "public"."enum_media_tags" AS ENUM('experience-hero', 'experience-gallery', 'programme', 'venue', 'gallery-make', 'gallery-making', 'gallery-keep', 'logo', 'og', 'hero', 'seasonal', 'kids', 'film', 'font');
  CREATE TYPE "public"."enum_media_provenance" AS ENUM('studio', 'client-supplied', 'stock', 'ai-generated', 'unknown');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'noop');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_log_parent_task_slug" AS ENUM('inline', 'noop');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'noop');
  CREATE TYPE "public"."enum_payload_folders_folder_type" AS ENUM('media');
  CREATE TYPE "public"."enum_site_settings_socials_platform" AS ENUM('instagram', 'facebook', 'tiktok', 'youtube', 'x', 'linkedin');
  CREATE TYPE "public"."enum_site_settings_locale" AS ENUM('en_AE');
  CREATE TYPE "public"."enum_navigation_primary_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_navigation_primary_menu" AS ENUM('none', 'experiences', 'private-events', 'about');
  CREATE TYPE "public"."enum_navigation_primary_mobile_surface" AS ENUM('bar', 'sheet', 'none');
  CREATE TYPE "public"."enum_navigation_experiences_menu_groups_kind" AS ENUM('diy', 'scheduled');
  CREATE TYPE "public"."enum_navigation_private_events_menu_doors_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_navigation_about_menu_doors_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_navigation_about_menu_doors_mark" AS ENUM('splash', 'coral', 'starleaf', 'bow', 'zigzag', 'cutout', 'starburst', 'wave', 'bean', 'slabCoral', 'dot');
  CREATE TYPE "public"."enum_navigation_footer_groups_items_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_navigation_legal_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_navigation_primary_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_navigation_experiences_menu_door_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_booking_settings_utility_bars_event_detail_links_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_booking_settings_utility_bars_checkout_links_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_booking_settings_closed_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_seo_defaults_twitter_card" AS ENUM('summary_large_image', 'summary');
  CREATE TYPE "public"."enum_payment_settings_checkout_payment_methods" AS ENUM('card', 'wallet');
  CREATE TYPE "public"."enum_payment_settings_mode" AS ENUM('test', 'live', 'mock');
  CREATE TYPE "public"."enum_payment_settings_provider" AS ENUM('mamo');
  CREATE TYPE "public"."enum_payment_settings_checkout_link_type" AS ENUM('standalone', 'inline');
  CREATE TYPE "public"."enum_email_settings_provider" AS ENUM('log-only', 'smtp', 'resend');
  CREATE TYPE "public"."enum_notification_settings_recipients_events" AS ENUM('new_order', 'failed_payment', 'refund_requested', 'refund', 'dispute', 'new_enquiry', 'waitlist_joined', 'job_failed', 'low_seats', 'settings_changed', 'webhook_unverified_spike', 'daily_digest');
  CREATE TYPE "public"."enum_analytics_settings_external_provider" AS ENUM('none', 'ga4', 'plausible', 'umami');
  CREATE TYPE "public"."enum_analytics_settings_consent_policy_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_analytics_settings_dashboard_default_range" AS ENUM('7', '30', '90');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'front-desk' NOT NULL,
  	"active" boolean DEFAULT true,
  	"last_login_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media_tags" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_media_tags",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"alt" varchar,
  	"decorative" boolean DEFAULT false,
  	"caption" varchar,
  	"credit" varchar,
  	"provenance" "enum_media_provenance" DEFAULT 'studio' NOT NULL,
  	"licence" varchar,
  	"consent" boolean DEFAULT false,
  	"folder_id" uuid,
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
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_menu_url" varchar,
  	"sizes_menu_width" numeric,
  	"sizes_menu_height" numeric,
  	"sizes_menu_mime_type" varchar,
  	"sizes_menu_filesize" numeric,
  	"sizes_menu_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_plate_url" varchar,
  	"sizes_plate_width" numeric,
  	"sizes_plate_height" numeric,
  	"sizes_plate_mime_type" varchar,
  	"sizes_plate_filesize" numeric,
  	"sizes_plate_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "settings_audit" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"global" varchar NOT NULL,
  	"field" varchar NOT NULL,
  	"from" varchar,
  	"to" varchar,
  	"user_id" uuid,
  	"at" timestamp(3) with time zone NOT NULL,
  	"ip_hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb,
  	"parent_task_slug" "enum_payload_jobs_log_parent_task_slug",
  	"parent_task_i_d" varchar
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"concurrency_key" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_folders_folder_type" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_payload_folders_folder_type",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "payload_folders" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"folder_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid,
  	"media_id" uuid,
  	"settings_audit_id" uuid,
  	"payload_folders_id" uuid
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_contact_address_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"line" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_contact_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"days" varchar NOT NULL,
  	"hours" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_site_settings_socials_platform" NOT NULL,
  	"url" varchar
  );
  
  CREATE TABLE "site_settings_hero_theme_dark_routes" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"path" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_hero_theme_light_routes" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"path" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar DEFAULT 'Maison Palettia' NOT NULL,
  	"legal_name" varchar DEFAULT 'Maison Palettia Events L.L.C.' NOT NULL,
  	"tagline" varchar DEFAULT 'Creative workshops and events in Dubai' NOT NULL,
  	"logo_on_dark_id" uuid,
  	"logo_on_dark_ink_left" numeric,
  	"logo_on_dark_ink_top" numeric,
  	"logo_on_dark_ink_width" numeric,
  	"logo_on_dark_ink_height" numeric,
  	"logo_on_light_id" uuid,
  	"monogram_id" uuid,
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"contact_whatsapp_number" varchar,
  	"contact_whatsapp_greeting" varchar DEFAULT 'Hello! I would like to ask about an upcoming event.',
  	"newsletter_enabled" boolean DEFAULT false,
  	"newsletter_action_url" varchar,
  	"newsletter_field_name" varchar DEFAULT 'email',
  	"newsletter_heading" varchar DEFAULT 'Newsletter',
  	"newsletter_description" varchar DEFAULT 'New dates and new experiences, straight to your inbox.',
  	"newsletter_cta" varchar DEFAULT 'Subscribe',
  	"public_url" varchar NOT NULL,
  	"locale" "enum_site_settings_locale" DEFAULT 'en_AE',
  	"enquiries_enabled" boolean DEFAULT true,
  	"jobs_enabled" boolean DEFAULT true,
  	"allow_ai_imagery" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "navigation_primary" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"link_type" "enum_navigation_primary_link_type" DEFAULT 'internal' NOT NULL,
  	"link_url" varchar,
  	"link_anchor" varchar,
  	"link_new_tab" boolean DEFAULT false,
  	"menu" "enum_navigation_primary_menu" DEFAULT 'none',
  	"mobile_surface" "enum_navigation_primary_mobile_surface" DEFAULT 'sheet' NOT NULL,
  	"mobile_short_label" varchar,
  	"secondary" boolean DEFAULT false,
  	"utility" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation_experiences_menu_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_navigation_experiences_menu_groups_kind" NOT NULL,
  	"title" varchar NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "navigation_private_events_menu_doors" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"sub" varchar,
  	"link_type" "enum_navigation_private_events_menu_doors_link_type" DEFAULT 'internal' NOT NULL,
  	"link_url" varchar,
  	"link_anchor" varchar,
  	"link_new_tab" boolean DEFAULT false,
  	"accent" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation_about_menu_doors" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"sub" varchar,
  	"link_type" "enum_navigation_about_menu_doors_link_type" DEFAULT 'internal' NOT NULL,
  	"link_url" varchar,
  	"link_anchor" varchar,
  	"link_new_tab" boolean DEFAULT false,
  	"mark" "enum_navigation_about_menu_doors_mark"
  );
  
  CREATE TABLE "navigation_footer_groups_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"link_type" "enum_navigation_footer_groups_items_link_type" DEFAULT 'internal' NOT NULL,
  	"link_url" varchar,
  	"link_anchor" varchar,
  	"link_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation_footer_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_legal" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"link_type" "enum_navigation_legal_link_type" DEFAULT 'internal' NOT NULL,
  	"link_url" varchar,
  	"link_anchor" varchar,
  	"link_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"primary_cta_label" varchar DEFAULT 'Book a session' NOT NULL,
  	"primary_cta_link_type" "enum_navigation_primary_cta_link_type" DEFAULT 'internal' NOT NULL,
  	"primary_cta_link_url" varchar,
  	"primary_cta_link_anchor" varchar,
  	"primary_cta_link_new_tab" boolean DEFAULT false,
  	"bottom_bar_contact_label" varchar DEFAULT 'Contact',
  	"bottom_bar_about_label" varchar DEFAULT 'About',
  	"bottom_bar_book_label" varchar DEFAULT 'Book',
  	"book_sheet_heading" varchar DEFAULT 'What would you like to create?',
  	"book_sheet_lead" varchar DEFAULT 'Choose a scheduled experience to start your booking.',
  	"book_sheet_anytime_note" varchar DEFAULT 'Prefer to come anytime?',
  	"book_sheet_anytime_link_label" varchar DEFAULT 'Browse all experiences',
  	"skip_link" varchar DEFAULT 'Skip to content',
  	"experiences_menu_door_title" varchar NOT NULL,
  	"experiences_menu_door_sub" varchar,
  	"experiences_menu_door_link_type" "enum_navigation_experiences_menu_door_link_type" DEFAULT 'internal' NOT NULL,
  	"experiences_menu_door_link_url" varchar,
  	"experiences_menu_door_link_anchor" varchar,
  	"experiences_menu_door_link_new_tab" boolean DEFAULT false,
  	"experiences_menu_preview_action_diy" varchar DEFAULT 'See the activity',
  	"experiences_menu_preview_action_scheduled" varchar DEFAULT 'See the session',
  	"private_events_menu_rail_title" varchar DEFAULT 'Made for Your Kind of Crowd',
  	"private_events_menu_rail_note" varchar DEFAULT 'Don’t see yours? That’s probably a conversation worth having.',
  	"private_events_menu_preview_eyebrow" varchar DEFAULT 'Private events',
  	"private_events_menu_preview_action" varchar DEFAULT 'See this programme',
  	"mobile_private_events_cta" varchar DEFAULT 'Book a private event',
  	"footer_find_us_heading" varchar DEFAULT 'Find us',
  	"footer_studio_heading" varchar DEFAULT 'The studio',
  	"footer_why_heading" varchar DEFAULT 'Why we do it',
  	"footer_follow_heading" varchar DEFAULT 'Follow',
  	"footer_policies_heading" varchar DEFAULT 'Policies',
  	"footer_directions_label" varchar DEFAULT 'Get directions',
  	"footer_policies_blurb" varchar DEFAULT 'How sessions run, what we ask of visitors, and what happens if plans change.',
  	"footer_back_to_top" varchar DEFAULT 'Back to top',
  	"utility_bar_heading" varchar DEFAULT 'More from Maison Palettia',
  	"search_trigger_label" varchar DEFAULT 'Search experiences',
  	"search_heading" varchar DEFAULT 'Search Maison Palettia',
  	"search_placeholder_wide" varchar DEFAULT 'Search events by name, type or location',
  	"search_placeholder_narrow" varchar DEFAULT 'Search by name, type or place',
  	"search_popular_heading" varchar DEFAULT 'Popular searches',
  	"search_sessions_heading" varchar DEFAULT 'Sessions with dates',
  	"search_activities_heading" varchar DEFAULT 'Activities',
  	"search_view_all_label" varchar DEFAULT 'View all events',
  	"search_no_results_title" varchar DEFAULT 'No events found',
  	"search_no_results_body" varchar DEFAULT 'Try searching for another event, location, or activity.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "brand_copy_brand_story" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"paragraph" varchar NOT NULL
  );
  
  CREATE TABLE "brand_copy_journey" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"name" varchar NOT NULL,
  	"description" varchar NOT NULL
  );
  
  CREATE TABLE "brand_copy_what_sets_us_apart" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"name" varchar NOT NULL,
  	"description" varchar NOT NULL
  );
  
  CREATE TABLE "brand_copy_private_event_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"detail" varchar
  );
  
  CREATE TABLE "brand_copy_seasonal_moments" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"occasion" varchar NOT NULL,
  	"experience" varchar,
  	"image_id" uuid
  );
  
  CREATE TABLE "brand_copy_little_creators" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"image_id" uuid
  );
  
  CREATE TABLE "brand_copy_collaborations" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "brand_copy_our_approach" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"line" varchar NOT NULL
  );
  
  CREATE TABLE "brand_copy" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tagline" varchar DEFAULT 'A Palette of Creativity for Everyone' NOT NULL,
  	"opening_statement_heading" varchar DEFAULT 'A Little Space for Big Creativity.',
  	"opening_statement_body" varchar DEFAULT 'Maison Palettia is a place to make, experiment and unwind. Pick a palette, get your hands busy and turn a little bit of imagination into something that’s yours.',
  	"opening_statement_closer" varchar DEFAULT 'Come curious. Leave creative.',
  	"opening_statement_panel_heading" varchar DEFAULT 'Create your Way.',
  	"opening_statement_panel_body" varchar DEFAULT 'Pick an activity, bring your people or come on your own. There’s no right way to be creative here, just your palette, your hands and whatever you feel like making.',
  	"opening_statement_panel_sign_off" varchar DEFAULT 'Welcome to Maison Palettia.',
  	"closing_heading" varchar DEFAULT 'Let’s Craft a Community Together.',
  	"closing_body" varchar DEFAULT 'Maison Palettia is ready to bring art, creativity, and meaningful engagement.',
  	"mission" varchar DEFAULT 'To bring people together, one creative moment at a time.',
  	"vision" varchar DEFAULT 'We curate inspiring experiences where imagination, craftsmanship, and community come to life.',
  	"purpose_labels_mission" varchar DEFAULT 'Our Mission',
  	"purpose_labels_vision" varchar DEFAULT 'Our Vision',
  	"community_heading" varchar DEFAULT 'Creating Community Through Creativity',
  	"community_body" varchar DEFAULT 'Maison Palettia is a space to slow down, switch off and make something. Through hands-on creative experiences, workshops and seasonal activities, we bring people together to explore creativity, try something new and enjoy time away from their screens.',
  	"community_closer" varchar DEFAULT 'More than something to do, it’s a reason to pause, connect and come back for something new.',
  	"find_us_heading" varchar DEFAULT 'Your Next Creative Stop.',
  	"find_us_line" varchar DEFAULT 'Find Maison Palettia in the places you already love to visit — and come make something while you’re there.',
  	"make_it_your_way" varchar DEFAULT 'Make It Your Way.',
  	"private_event_invite" varchar DEFAULT 'Have something in mind? Tell us when, who’s coming and what you’d like to make. We’ll help turn the idea into an experience made for your group.',
  	"programmes_note" varchar DEFAULT 'Don’t see yours? That’s probably a conversation worth having.',
  	"everything_provided" varchar DEFAULT 'Everything you need is waiting for you. Just bring yourself, pick a project and start creating.',
  	"seasonal_intro" varchar DEFAULT 'Maison Palettia delivers seasonal workshops inspired by celebrations such as Valentine’s Day, Ramadan, Mother’s Day, Christmas, and more. Limited-time experiences worth coming back for.',
  	"experience_statement" varchar,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "booking_settings_book_step_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "booking_settings_utility_bars_event_detail_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"link_type" "enum_booking_settings_utility_bars_event_detail_links_link_type" DEFAULT 'internal' NOT NULL,
  	"link_url" varchar,
  	"link_anchor" varchar,
  	"link_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "booking_settings_utility_bars_checkout_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"link_type" "enum_booking_settings_utility_bars_checkout_links_link_type" DEFAULT 'internal' NOT NULL,
  	"link_url" varchar,
  	"link_anchor" varchar,
  	"link_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "booking_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"bookings_open" boolean DEFAULT false,
  	"closed_message" varchar DEFAULT 'Online bookings open soon.',
  	"closed_cta_label" varchar DEFAULT 'Enquire',
  	"closed_cta_link_type" "enum_booking_settings_closed_cta_link_type" DEFAULT 'internal' NOT NULL,
  	"closed_cta_link_url" varchar DEFAULT '/contact',
  	"closed_cta_link_anchor" varchar,
  	"closed_cta_link_new_tab" boolean DEFAULT false,
  	"booking_terms" varchar DEFAULT 'Your booking is confirmed once your payment has gone through.',
  	"reference_prefix" varchar DEFAULT 'MP-',
  	"low_seat_threshold" numeric DEFAULT 4,
  	"status_copy_confirmed_label" varchar DEFAULT 'Confirmed',
  	"status_copy_confirmed_note" varchar DEFAULT 'Your place is held. Come to the venue at the time below.',
  	"status_copy_pending_label" varchar DEFAULT 'Pending',
  	"status_copy_pending_note" varchar DEFAULT 'This booking is waiting on confirmation from the Maison.',
  	"status_copy_completed_label" varchar DEFAULT 'Completed',
  	"status_copy_completed_note" varchar DEFAULT 'This event has already taken place. We hope you took something home.',
  	"status_copy_cancelled_label" varchar DEFAULT 'Cancelled',
  	"status_copy_cancelled_note" varchar DEFAULT 'This booking is no longer held.',
  	"purchase_confirmed_note" varchar DEFAULT 'Your purchase is confirmed.',
  	"checkout_heading" varchar DEFAULT 'Complete Your Booking.',
  	"checkout_back_label" varchar DEFAULT 'Back',
  	"checkout_details_heading" varchar DEFAULT 'Your details',
  	"checkout_details_lead" varchar,
  	"checkout_carried_over_note" varchar,
  	"checkout_confirm_label" varchar DEFAULT 'Confirm booking',
  	"checkout_confirming_label" varchar DEFAULT 'Confirming…',
  	"checkout_empty_title" varchar DEFAULT 'Nothing to confirm yet',
  	"checkout_empty_body" varchar DEFAULT 'Choose an event to start a booking.',
  	"checkout_empty_cta" varchar DEFAULT 'Browse events',
  	"checkout_error_generic" varchar DEFAULT 'We could not complete your booking just now. Nothing has been charged. Please try again in a moment.',
  	"checkout_error_empty" varchar DEFAULT 'There is nothing in your booking to confirm. Choose an event to continue.',
  	"checkout_error_passed" varchar DEFAULT 'A date in your booking has already passed, so it cannot be confirmed. Remove it to continue.',
  	"checkout_error_fields" varchar DEFAULT 'Some details need a look before you continue. Each one is marked beside its field.',
  	"cart_heading" varchar DEFAULT 'Your booking',
  	"cart_add_another" varchar DEFAULT 'Add another event',
  	"cart_remove_label" varchar DEFAULT 'Remove',
  	"cart_passed_line" varchar DEFAULT 'This date has passed',
  	"cart_subtotal_label" varchar DEFAULT 'Subtotal',
  	"cart_total_label" varchar DEFAULT 'Total',
  	"basket_link_label" varchar DEFAULT 'Booking',
  	"pass_code_copy_label" varchar DEFAULT 'Pass or promo code',
  	"pass_code_copy_placeholder" varchar DEFAULT 'Enter code',
  	"pass_code_copy_apply" varchar DEFAULT 'Apply',
  	"pass_code_copy_messages_empty" varchar DEFAULT 'Enter a code to apply it.',
  	"pass_code_copy_messages_unavailable" varchar DEFAULT 'Codes are not active on this site yet, so nothing has been applied and your total is unchanged.',
  	"pass_code_copy_messages_invalid" varchar DEFAULT 'We do not recognise that code. Check it and try again.',
  	"pass_code_copy_messages_applied" varchar DEFAULT 'Code applied to this booking.',
  	"book_step_heading" varchar DEFAULT 'Book Your Place.',
  	"book_step_lead" varchar,
  	"book_step_back_label" varchar DEFAULT 'Back to the event',
  	"book_step_continue_label" varchar DEFAULT 'Continue to checkout',
  	"book_step_opening_label" varchar DEFAULT 'Opening checkout…',
  	"book_step_summary_error" varchar DEFAULT 'Some details need a look before you continue. Each one is marked beside its field.',
  	"book_step_notes_label" varchar DEFAULT 'Anything we should know (optional)',
  	"book_step_passed_title" varchar DEFAULT 'This date has passed',
  	"book_step_passed_body" varchar DEFAULT '{title} on {date} has already taken place, so it can no longer be booked.',
  	"book_step_passed_cta" varchar DEFAULT 'Browse all experiences',
  	"confirmation_heading" varchar DEFAULT 'Your reference is ready.',
  	"confirmation_view_events_label" varchar DEFAULT 'Browse events',
  	"confirmation_check_status_label" varchar DEFAULT 'Check a booking',
  	"confirmation_not_found_heading" varchar DEFAULT 'Find your booking.',
  	"confirmation_not_found_title" varchar DEFAULT 'No booking to show',
  	"confirmation_not_found_body_with_ref" varchar DEFAULT 'We could not find a booking with the reference {reference}. Check it and try again.',
  	"confirmation_not_found_body_no_ref" varchar DEFAULT 'Open the link from your confirmation email, or look up your booking by its reference.',
  	"status_heading" varchar DEFAULT 'Check Your Booking.',
  	"status_lead" varchar DEFAULT 'Enter the reference from your confirmation.',
  	"status_field_label" varchar DEFAULT 'Booking reference',
  	"status_placeholder" varchar DEFAULT '{prefix}4K7XY',
  	"status_hint" varchar DEFAULT 'It looks like {prefix} followed by six characters.',
  	"status_cta" varchar DEFAULT 'Find my booking',
  	"status_none_title" varchar DEFAULT 'No booking found',
  	"status_none_body" varchar DEFAULT 'Check the reference and try again, or get in touch and we will look it up.',
  	"status_none_cta" varchar DEFAULT 'Contact us',
  	"event_page_book_label" varchar DEFAULT 'Book',
  	"event_page_passed_label" varchar DEFAULT 'Date passed',
  	"event_page_per_person_label" varchar DEFAULT 'per person',
  	"event_page_closed_full_fact" varchar DEFAULT 'This date is full',
  	"event_page_closed_passed_fact" varchar DEFAULT 'This date has passed',
  	"event_page_none_open_suffix" varchar DEFAULT 'No other dates are open right now.',
  	"event_page_others_open_suffix" varchar DEFAULT 'Other dates are open.',
  	"event_page_see_open_label" varchar DEFAULT 'See open dates',
  	"event_page_diy_title" varchar DEFAULT 'No booking needed',
  	"event_page_diy_body" varchar DEFAULT 'Come when the experience is available and start creating.',
  	"event_page_diy_cta" varchar DEFAULT 'Find us',
  	"event_page_coming_soon_note" varchar DEFAULT 'This experience is coming soon.',
  	"event_page_ready_heading" varchar DEFAULT 'Everything Is Ready.',
  	"event_page_ready_body" varchar DEFAULT 'Everything is laid out before you arrive. You bring nothing but yourself.',
  	"event_page_utility_note" varchar DEFAULT 'Everything you need is waiting for you. Just bring yourself, pick a project and start creating.',
  	"labels_create_anytime" varchar DEFAULT 'Create Anytime',
  	"labels_create_together" varchar DEFAULT 'Create Together',
  	"labels_any_time" varchar DEFAULT 'Any time',
  	"labels_scheduled" varchar DEFAULT 'Scheduled',
  	"labels_no_booking" varchar DEFAULT 'No booking',
  	"labels_booked_online" varchar DEFAULT 'Booked online',
  	"labels_scheduled_session" varchar DEFAULT 'Scheduled session',
  	"labels_diy_line" varchar DEFAULT 'Pick a project. Pick your colours. Just drop in.',
  	"labels_scheduled_line" varchar DEFAULT 'A little more planned. Same creative energy.',
  	"utility_bars_event_detail_note" varchar,
  	"utility_bars_checkout_note" varchar,
  	"ticket_heading" varchar DEFAULT 'Show this at the table.',
  	"ticket_instructions" varchar DEFAULT 'Please arrive ten minutes before your session starts. Showing this ticket on your phone is fine.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "template_copy" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"event_detail_breadcrumb_root" varchar DEFAULT 'All events',
  	"event_detail_when_term" varchar DEFAULT 'Date',
  	"event_detail_time_term" varchar DEFAULT 'Time',
  	"event_detail_duration_term" varchar DEFAULT 'Duration',
  	"event_detail_where_term" varchar DEFAULT 'Location',
  	"event_detail_price_term" varchar DEFAULT 'Price',
  	"event_detail_per_person_label" varchar DEFAULT 'per person',
  	"event_detail_how_it_runs_term" varchar DEFAULT 'Experience',
  	"event_detail_status_term" varchar DEFAULT 'Status',
  	"event_detail_about_heading" varchar DEFAULT 'About this experience',
  	"event_detail_location_heading_scheduled" varchar DEFAULT 'Where It Happens',
  	"event_detail_location_heading_diy" varchar DEFAULT 'Your Next Creative Stop.',
  	"event_detail_directions_note" varchar,
  	"event_detail_more_events_heading" varchar DEFAULT 'More events',
  	"event_detail_solo_eyebrow" varchar DEFAULT 'One date',
  	"event_detail_solo_cta" varchar DEFAULT 'See all experiences',
  	"event_detail_upcoming_dates_heading" varchar DEFAULT 'Upcoming dates',
  	"event_detail_waitlist_heading" varchar DEFAULT 'Join the waitlist',
  	"event_detail_waitlist_body" varchar DEFAULT 'This date is full. Leave your details and we will email you if a place opens up.',
  	"event_detail_waitlist_cta" varchar DEFAULT 'Join the waitlist',
  	"event_detail_waitlist_success" varchar DEFAULT 'You are on the list. We will email you if a place opens up.',
  	"programme_detail_eyebrow" varchar DEFAULT 'Private events',
  	"programme_detail_activities_heading" varchar DEFAULT 'Pick Your Creative',
  	"programme_detail_activities_lead" varchar,
  	"programme_detail_steps_eyebrow" varchar DEFAULT 'How it works',
  	"programme_detail_close_heading" varchar DEFAULT 'Let’s Make It Happen.',
  	"programme_detail_cta_primary_label" varchar DEFAULT 'Plan a private event',
  	"programme_detail_cta_secondary_label" varchar DEFAULT 'Contact us',
  	"policy_detail_eyebrow" varchar DEFAULT 'Policy',
  	"policy_detail_back_label" varchar DEFAULT 'All policies',
  	"policy_detail_close_heading" varchar DEFAULT 'Still Wondering?',
  	"policy_detail_close_body" varchar DEFAULT 'If something here does not answer your question, ask the Maison.',
  	"policy_detail_close_cta" varchar DEFAULT 'Ask the Maison',
  	"events_browser_date_filter_label" varchar DEFAULT 'Date',
  	"events_browser_type_filter_label" varchar DEFAULT 'Type',
  	"events_browser_location_filter_label" varchar DEFAULT 'Location',
  	"events_browser_clear_filter_label" varchar DEFAULT 'Clear filter',
  	"events_browser_clear_all_label" varchar DEFAULT 'Clear all filters',
  	"events_browser_empty_title" varchar DEFAULT 'Nothing matches those filters',
  	"events_browser_empty_body" varchar DEFAULT 'Try a different date, type or location.',
  	"events_browser_door_mode_labels_diy" varchar DEFAULT 'No booking',
  	"events_browser_door_mode_labels_scheduled" varchar DEFAULT 'Booked online',
  	"events_browser_date_passed_label" varchar DEFAULT 'Date passed',
  	"events_browser_fully_booked_label" varchar DEFAULT 'Fully booked',
  	"not_found_eyebrow" varchar DEFAULT 'Page not found',
  	"not_found_heading" varchar DEFAULT 'This page has | wandered off.',
  	"not_found_body" varchar DEFAULT 'There is no page at this address on the Maison Palettia site.',
  	"not_found_cta" varchar DEFAULT 'Back to the homepage',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "seo_defaults_robots_disallow" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"path" varchar NOT NULL
  );
  
  CREATE TABLE "seo_defaults" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title_template" varchar DEFAULT '%s · Maison Palettia' NOT NULL,
  	"share_image_id" uuid,
  	"twitter_card" "enum_seo_defaults_twitter_card" DEFAULT 'summary_large_image',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payment_settings_checkout_payment_methods" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_payment_settings_checkout_payment_methods",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "payment_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"mode" "enum_payment_settings_mode" DEFAULT 'test' NOT NULL,
  	"provider" "enum_payment_settings_provider" DEFAULT 'mamo',
  	"test_api_key" varchar,
  	"test_api_key_set_at" timestamp(3) with time zone,
  	"test_webhook_auth_header" varchar,
  	"test_webhook_auth_header_set_at" timestamp(3) with time zone,
  	"test_previous_webhook_auth_header" varchar,
  	"test_previous_webhook_auth_header_set_at" timestamp(3) with time zone,
  	"test_previous_valid_until" timestamp(3) with time zone,
  	"test_webhook_id" varchar,
  	"test_webhook_registered_at" timestamp(3) with time zone,
  	"test_webhook_url" varchar,
  	"test_last_connection_check" jsonb,
  	"test_observed_auth_header_name" varchar,
  	"live_api_key" varchar,
  	"live_api_key_set_at" timestamp(3) with time zone,
  	"live_webhook_auth_header" varchar,
  	"live_webhook_auth_header_set_at" timestamp(3) with time zone,
  	"live_previous_webhook_auth_header" varchar,
  	"live_previous_webhook_auth_header_set_at" timestamp(3) with time zone,
  	"live_previous_valid_until" timestamp(3) with time zone,
  	"live_webhook_id" varchar,
  	"live_webhook_registered_at" timestamp(3) with time zone,
  	"live_webhook_url" varchar,
  	"live_last_connection_check" jsonb,
  	"live_observed_auth_header_name" varchar,
  	"checkout_link_type" "enum_payment_settings_checkout_link_type" DEFAULT 'standalone',
  	"checkout_enable_tabby" boolean DEFAULT false,
  	"checkout_send_mamo_receipt" boolean DEFAULT false,
  	"checkout_require_terms" boolean DEFAULT true,
  	"checkout_hold_minutes" numeric DEFAULT 15,
  	"checkout_title_prefix" varchar DEFAULT 'Maison Palettia',
  	"checkout_capture_note" varchar DEFAULT 'You will be taken to Mamo Pay to complete payment securely.',
  	"reconciliation_enabled" boolean DEFAULT true,
  	"reconciliation_every_minutes" numeric DEFAULT 5,
  	"reconciliation_last_run_at" timestamp(3) with time zone,
  	"reconciliation_last_run_summary" jsonb,
  	"apple_domain_association" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "email_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"provider" "enum_email_settings_provider" DEFAULT 'log-only' NOT NULL,
  	"from_name" varchar DEFAULT 'Maison Palettia',
  	"from_address" varchar,
  	"reply_to" varchar,
  	"bcc" varchar,
  	"smtp_host" varchar,
  	"smtp_port" numeric DEFAULT 587,
  	"smtp_secure" boolean DEFAULT false,
  	"smtp_user" varchar,
  	"smtp_password" varchar,
  	"smtp_password_set_at" timestamp(3) with time zone,
  	"resend_api_key" varchar,
  	"resend_api_key_set_at" timestamp(3) with time zone,
  	"last_verify" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "invoice_settings_address_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"line" varchar NOT NULL
  );
  
  CREATE TABLE "invoice_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"legal_name" varchar,
  	"trade_licence_number" varchar,
  	"trn" varchar,
  	"issuer_email" varchar,
  	"issuer_phone" varchar,
  	"vat_rate_bps" numeric DEFAULT 500 NOT NULL,
  	"prices_include_vat" boolean DEFAULT true,
  	"invoice_prefix" varchar DEFAULT 'MP-INV',
  	"credit_note_prefix" varchar DEFAULT 'MP-CN',
  	"footer_note" jsonb,
  	"logo_id" uuid,
  	"pdf_fonts_regular_id" uuid,
  	"pdf_fonts_bold_id" uuid,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "notification_settings_recipients_events" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_notification_settings_recipients_events",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "notification_settings_recipients" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"email" varchar NOT NULL
  );
  
  CREATE TABLE "notification_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"low_seats_override" numeric,
  	"enquiry_auto_reply" boolean DEFAULT false,
  	"daily_digest" boolean DEFAULT false,
  	"daily_digest_hour" numeric DEFAULT 8,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "analytics_settings_exclude_paths" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"path" varchar NOT NULL
  );
  
  CREATE TABLE "analytics_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"respect_do_not_track" boolean DEFAULT true,
  	"raw_retention_days" numeric DEFAULT 90,
  	"external_provider" "enum_analytics_settings_external_provider" DEFAULT 'none',
  	"external_measurement_id" varchar,
  	"external_plausible_domain" varchar,
  	"external_umami_script_url" varchar,
  	"external_umami_website_id" varchar,
  	"external_meta_pixel_id" varchar,
  	"consent_required" boolean DEFAULT true,
  	"consent_banner_text" varchar DEFAULT 'We use analytics cookies to understand how the site is used. Nothing is loaded until you accept.',
  	"consent_accept_label" varchar DEFAULT 'Accept',
  	"consent_decline_label" varchar DEFAULT 'Decline',
  	"consent_policy_link_type" "enum_analytics_settings_consent_policy_link_type" DEFAULT 'internal' NOT NULL,
  	"consent_policy_link_url" varchar,
  	"consent_policy_link_anchor" varchar,
  	"consent_policy_link_new_tab" boolean DEFAULT false,
  	"dashboard_default_range" "enum_analytics_settings_dashboard_default_range" DEFAULT '30',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "system_state" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"canary" varchar,
  	"canary_set_at" timestamp(3) with time zone,
  	"installed_at" timestamp(3) with time zone,
  	"seed_version" varchar,
  	"public_url_confirmed_at" timestamp(3) with time zone,
  	"last_digest_day" varchar,
  	"last_inventory_reconcile_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_tags" ADD CONSTRAINT "media_tags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "settings_audit" ADD CONSTRAINT "settings_audit_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_folders_folder_type" ADD CONSTRAINT "payload_folders_folder_type_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_folders" ADD CONSTRAINT "payload_folders_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_settings_audit_fk" FOREIGN KEY ("settings_audit_id") REFERENCES "public"."settings_audit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_folders_fk" FOREIGN KEY ("payload_folders_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_contact_address_lines" ADD CONSTRAINT "site_settings_contact_address_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_contact_hours" ADD CONSTRAINT "site_settings_contact_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_socials" ADD CONSTRAINT "site_settings_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_hero_theme_dark_routes" ADD CONSTRAINT "site_settings_hero_theme_dark_routes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_hero_theme_light_routes" ADD CONSTRAINT "site_settings_hero_theme_light_routes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_on_dark_id_media_id_fk" FOREIGN KEY ("logo_on_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_on_light_id_media_id_fk" FOREIGN KEY ("logo_on_light_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_monogram_id_media_id_fk" FOREIGN KEY ("monogram_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_primary" ADD CONSTRAINT "navigation_primary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_experiences_menu_groups" ADD CONSTRAINT "navigation_experiences_menu_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_private_events_menu_doors" ADD CONSTRAINT "navigation_private_events_menu_doors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_about_menu_doors" ADD CONSTRAINT "navigation_about_menu_doors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_groups_items" ADD CONSTRAINT "navigation_footer_groups_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_groups" ADD CONSTRAINT "navigation_footer_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_legal" ADD CONSTRAINT "navigation_legal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brand_copy_brand_story" ADD CONSTRAINT "brand_copy_brand_story_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brand_copy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brand_copy_journey" ADD CONSTRAINT "brand_copy_journey_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brand_copy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brand_copy_what_sets_us_apart" ADD CONSTRAINT "brand_copy_what_sets_us_apart_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brand_copy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brand_copy_private_event_steps" ADD CONSTRAINT "brand_copy_private_event_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brand_copy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brand_copy_seasonal_moments" ADD CONSTRAINT "brand_copy_seasonal_moments_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "brand_copy_seasonal_moments" ADD CONSTRAINT "brand_copy_seasonal_moments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brand_copy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brand_copy_little_creators" ADD CONSTRAINT "brand_copy_little_creators_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "brand_copy_little_creators" ADD CONSTRAINT "brand_copy_little_creators_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brand_copy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brand_copy_collaborations" ADD CONSTRAINT "brand_copy_collaborations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brand_copy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "brand_copy_our_approach" ADD CONSTRAINT "brand_copy_our_approach_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brand_copy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "booking_settings_book_step_steps" ADD CONSTRAINT "booking_settings_book_step_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."booking_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "booking_settings_utility_bars_event_detail_links" ADD CONSTRAINT "booking_settings_utility_bars_event_detail_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."booking_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "booking_settings_utility_bars_checkout_links" ADD CONSTRAINT "booking_settings_utility_bars_checkout_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."booking_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seo_defaults_robots_disallow" ADD CONSTRAINT "seo_defaults_robots_disallow_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."seo_defaults"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seo_defaults" ADD CONSTRAINT "seo_defaults_share_image_id_media_id_fk" FOREIGN KEY ("share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payment_settings_checkout_payment_methods" ADD CONSTRAINT "payment_settings_checkout_payment_methods_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payment_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "invoice_settings_address_lines" ADD CONSTRAINT "invoice_settings_address_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."invoice_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "invoice_settings" ADD CONSTRAINT "invoice_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "invoice_settings" ADD CONSTRAINT "invoice_settings_pdf_fonts_regular_id_media_id_fk" FOREIGN KEY ("pdf_fonts_regular_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "invoice_settings" ADD CONSTRAINT "invoice_settings_pdf_fonts_bold_id_media_id_fk" FOREIGN KEY ("pdf_fonts_bold_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notification_settings_recipients_events" ADD CONSTRAINT "notification_settings_recipients_events_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."notification_settings_recipients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notification_settings_recipients" ADD CONSTRAINT "notification_settings_recipients_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."notification_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "analytics_settings_exclude_paths" ADD CONSTRAINT "analytics_settings_exclude_paths_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."analytics_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_tags_order_idx" ON "media_tags" USING btree ("order");
  CREATE INDEX "media_tags_parent_idx" ON "media_tags" USING btree ("parent_id");
  CREATE INDEX "media_folder_idx" ON "media" USING btree ("folder_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_menu_sizes_menu_filename_idx" ON "media" USING btree ("sizes_menu_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_plate_sizes_plate_filename_idx" ON "media" USING btree ("sizes_plate_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE INDEX "settings_audit_global_idx" ON "settings_audit" USING btree ("global");
  CREATE INDEX "settings_audit_user_idx" ON "settings_audit" USING btree ("user_id");
  CREATE INDEX "settings_audit_at_idx" ON "settings_audit" USING btree ("at");
  CREATE INDEX "settings_audit_updated_at_idx" ON "settings_audit" USING btree ("updated_at");
  CREATE INDEX "settings_audit_created_at_idx" ON "settings_audit" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_concurrency_key_idx" ON "payload_jobs" USING btree ("concurrency_key");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_folders_folder_type_order_idx" ON "payload_folders_folder_type" USING btree ("order");
  CREATE INDEX "payload_folders_folder_type_parent_idx" ON "payload_folders_folder_type" USING btree ("parent_id");
  CREATE INDEX "payload_folders_name_idx" ON "payload_folders" USING btree ("name");
  CREATE INDEX "payload_folders_folder_idx" ON "payload_folders" USING btree ("folder_id");
  CREATE INDEX "payload_folders_updated_at_idx" ON "payload_folders" USING btree ("updated_at");
  CREATE INDEX "payload_folders_created_at_idx" ON "payload_folders" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_settings_audit_id_idx" ON "payload_locked_documents_rels" USING btree ("settings_audit_id");
  CREATE INDEX "payload_locked_documents_rels_payload_folders_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_folders_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_contact_address_lines_order_idx" ON "site_settings_contact_address_lines" USING btree ("_order");
  CREATE INDEX "site_settings_contact_address_lines_parent_id_idx" ON "site_settings_contact_address_lines" USING btree ("_parent_id");
  CREATE INDEX "site_settings_contact_hours_order_idx" ON "site_settings_contact_hours" USING btree ("_order");
  CREATE INDEX "site_settings_contact_hours_parent_id_idx" ON "site_settings_contact_hours" USING btree ("_parent_id");
  CREATE INDEX "site_settings_socials_order_idx" ON "site_settings_socials" USING btree ("_order");
  CREATE INDEX "site_settings_socials_parent_id_idx" ON "site_settings_socials" USING btree ("_parent_id");
  CREATE INDEX "site_settings_hero_theme_dark_routes_order_idx" ON "site_settings_hero_theme_dark_routes" USING btree ("_order");
  CREATE INDEX "site_settings_hero_theme_dark_routes_parent_id_idx" ON "site_settings_hero_theme_dark_routes" USING btree ("_parent_id");
  CREATE INDEX "site_settings_hero_theme_light_routes_order_idx" ON "site_settings_hero_theme_light_routes" USING btree ("_order");
  CREATE INDEX "site_settings_hero_theme_light_routes_parent_id_idx" ON "site_settings_hero_theme_light_routes" USING btree ("_parent_id");
  CREATE INDEX "site_settings_logo_on_dark_idx" ON "site_settings" USING btree ("logo_on_dark_id");
  CREATE INDEX "site_settings_logo_on_light_idx" ON "site_settings" USING btree ("logo_on_light_id");
  CREATE INDEX "site_settings_monogram_idx" ON "site_settings" USING btree ("monogram_id");
  CREATE INDEX "navigation_primary_order_idx" ON "navigation_primary" USING btree ("_order");
  CREATE INDEX "navigation_primary_parent_id_idx" ON "navigation_primary" USING btree ("_parent_id");
  CREATE INDEX "navigation_experiences_menu_groups_order_idx" ON "navigation_experiences_menu_groups" USING btree ("_order");
  CREATE INDEX "navigation_experiences_menu_groups_parent_id_idx" ON "navigation_experiences_menu_groups" USING btree ("_parent_id");
  CREATE INDEX "navigation_private_events_menu_doors_order_idx" ON "navigation_private_events_menu_doors" USING btree ("_order");
  CREATE INDEX "navigation_private_events_menu_doors_parent_id_idx" ON "navigation_private_events_menu_doors" USING btree ("_parent_id");
  CREATE INDEX "navigation_about_menu_doors_order_idx" ON "navigation_about_menu_doors" USING btree ("_order");
  CREATE INDEX "navigation_about_menu_doors_parent_id_idx" ON "navigation_about_menu_doors" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_groups_items_order_idx" ON "navigation_footer_groups_items" USING btree ("_order");
  CREATE INDEX "navigation_footer_groups_items_parent_id_idx" ON "navigation_footer_groups_items" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_groups_order_idx" ON "navigation_footer_groups" USING btree ("_order");
  CREATE INDEX "navigation_footer_groups_parent_id_idx" ON "navigation_footer_groups" USING btree ("_parent_id");
  CREATE INDEX "navigation_legal_order_idx" ON "navigation_legal" USING btree ("_order");
  CREATE INDEX "navigation_legal_parent_id_idx" ON "navigation_legal" USING btree ("_parent_id");
  CREATE INDEX "brand_copy_brand_story_order_idx" ON "brand_copy_brand_story" USING btree ("_order");
  CREATE INDEX "brand_copy_brand_story_parent_id_idx" ON "brand_copy_brand_story" USING btree ("_parent_id");
  CREATE INDEX "brand_copy_journey_order_idx" ON "brand_copy_journey" USING btree ("_order");
  CREATE INDEX "brand_copy_journey_parent_id_idx" ON "brand_copy_journey" USING btree ("_parent_id");
  CREATE INDEX "brand_copy_what_sets_us_apart_order_idx" ON "brand_copy_what_sets_us_apart" USING btree ("_order");
  CREATE INDEX "brand_copy_what_sets_us_apart_parent_id_idx" ON "brand_copy_what_sets_us_apart" USING btree ("_parent_id");
  CREATE INDEX "brand_copy_private_event_steps_order_idx" ON "brand_copy_private_event_steps" USING btree ("_order");
  CREATE INDEX "brand_copy_private_event_steps_parent_id_idx" ON "brand_copy_private_event_steps" USING btree ("_parent_id");
  CREATE INDEX "brand_copy_seasonal_moments_order_idx" ON "brand_copy_seasonal_moments" USING btree ("_order");
  CREATE INDEX "brand_copy_seasonal_moments_parent_id_idx" ON "brand_copy_seasonal_moments" USING btree ("_parent_id");
  CREATE INDEX "brand_copy_seasonal_moments_image_idx" ON "brand_copy_seasonal_moments" USING btree ("image_id");
  CREATE INDEX "brand_copy_little_creators_order_idx" ON "brand_copy_little_creators" USING btree ("_order");
  CREATE INDEX "brand_copy_little_creators_parent_id_idx" ON "brand_copy_little_creators" USING btree ("_parent_id");
  CREATE INDEX "brand_copy_little_creators_image_idx" ON "brand_copy_little_creators" USING btree ("image_id");
  CREATE INDEX "brand_copy_collaborations_order_idx" ON "brand_copy_collaborations" USING btree ("_order");
  CREATE INDEX "brand_copy_collaborations_parent_id_idx" ON "brand_copy_collaborations" USING btree ("_parent_id");
  CREATE INDEX "brand_copy_our_approach_order_idx" ON "brand_copy_our_approach" USING btree ("_order");
  CREATE INDEX "brand_copy_our_approach_parent_id_idx" ON "brand_copy_our_approach" USING btree ("_parent_id");
  CREATE INDEX "booking_settings_book_step_steps_order_idx" ON "booking_settings_book_step_steps" USING btree ("_order");
  CREATE INDEX "booking_settings_book_step_steps_parent_id_idx" ON "booking_settings_book_step_steps" USING btree ("_parent_id");
  CREATE INDEX "booking_settings_utility_bars_event_detail_links_order_idx" ON "booking_settings_utility_bars_event_detail_links" USING btree ("_order");
  CREATE INDEX "booking_settings_utility_bars_event_detail_links_parent_id_idx" ON "booking_settings_utility_bars_event_detail_links" USING btree ("_parent_id");
  CREATE INDEX "booking_settings_utility_bars_checkout_links_order_idx" ON "booking_settings_utility_bars_checkout_links" USING btree ("_order");
  CREATE INDEX "booking_settings_utility_bars_checkout_links_parent_id_idx" ON "booking_settings_utility_bars_checkout_links" USING btree ("_parent_id");
  CREATE INDEX "seo_defaults_robots_disallow_order_idx" ON "seo_defaults_robots_disallow" USING btree ("_order");
  CREATE INDEX "seo_defaults_robots_disallow_parent_id_idx" ON "seo_defaults_robots_disallow" USING btree ("_parent_id");
  CREATE INDEX "seo_defaults_share_image_idx" ON "seo_defaults" USING btree ("share_image_id");
  CREATE INDEX "payment_settings_checkout_payment_methods_order_idx" ON "payment_settings_checkout_payment_methods" USING btree ("order");
  CREATE INDEX "payment_settings_checkout_payment_methods_parent_idx" ON "payment_settings_checkout_payment_methods" USING btree ("parent_id");
  CREATE INDEX "invoice_settings_address_lines_order_idx" ON "invoice_settings_address_lines" USING btree ("_order");
  CREATE INDEX "invoice_settings_address_lines_parent_id_idx" ON "invoice_settings_address_lines" USING btree ("_parent_id");
  CREATE INDEX "invoice_settings_logo_idx" ON "invoice_settings" USING btree ("logo_id");
  CREATE INDEX "invoice_settings_pdf_fonts_pdf_fonts_regular_idx" ON "invoice_settings" USING btree ("pdf_fonts_regular_id");
  CREATE INDEX "invoice_settings_pdf_fonts_pdf_fonts_bold_idx" ON "invoice_settings" USING btree ("pdf_fonts_bold_id");
  CREATE INDEX "notification_settings_recipients_events_order_idx" ON "notification_settings_recipients_events" USING btree ("order");
  CREATE INDEX "notification_settings_recipients_events_parent_idx" ON "notification_settings_recipients_events" USING btree ("parent_id");
  CREATE INDEX "notification_settings_recipients_order_idx" ON "notification_settings_recipients" USING btree ("_order");
  CREATE INDEX "notification_settings_recipients_parent_id_idx" ON "notification_settings_recipients" USING btree ("_parent_id");
  CREATE INDEX "analytics_settings_exclude_paths_order_idx" ON "analytics_settings_exclude_paths" USING btree ("_order");
  CREATE INDEX "analytics_settings_exclude_paths_parent_id_idx" ON "analytics_settings_exclude_paths" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media_tags" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "settings_audit" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_folders_folder_type" CASCADE;
  DROP TABLE "payload_folders" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings_contact_address_lines" CASCADE;
  DROP TABLE "site_settings_contact_hours" CASCADE;
  DROP TABLE "site_settings_socials" CASCADE;
  DROP TABLE "site_settings_hero_theme_dark_routes" CASCADE;
  DROP TABLE "site_settings_hero_theme_light_routes" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "navigation_primary" CASCADE;
  DROP TABLE "navigation_experiences_menu_groups" CASCADE;
  DROP TABLE "navigation_private_events_menu_doors" CASCADE;
  DROP TABLE "navigation_about_menu_doors" CASCADE;
  DROP TABLE "navigation_footer_groups_items" CASCADE;
  DROP TABLE "navigation_footer_groups" CASCADE;
  DROP TABLE "navigation_legal" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TABLE "brand_copy_brand_story" CASCADE;
  DROP TABLE "brand_copy_journey" CASCADE;
  DROP TABLE "brand_copy_what_sets_us_apart" CASCADE;
  DROP TABLE "brand_copy_private_event_steps" CASCADE;
  DROP TABLE "brand_copy_seasonal_moments" CASCADE;
  DROP TABLE "brand_copy_little_creators" CASCADE;
  DROP TABLE "brand_copy_collaborations" CASCADE;
  DROP TABLE "brand_copy_our_approach" CASCADE;
  DROP TABLE "brand_copy" CASCADE;
  DROP TABLE "booking_settings_book_step_steps" CASCADE;
  DROP TABLE "booking_settings_utility_bars_event_detail_links" CASCADE;
  DROP TABLE "booking_settings_utility_bars_checkout_links" CASCADE;
  DROP TABLE "booking_settings" CASCADE;
  DROP TABLE "template_copy" CASCADE;
  DROP TABLE "seo_defaults_robots_disallow" CASCADE;
  DROP TABLE "seo_defaults" CASCADE;
  DROP TABLE "payment_settings_checkout_payment_methods" CASCADE;
  DROP TABLE "payment_settings" CASCADE;
  DROP TABLE "email_settings" CASCADE;
  DROP TABLE "invoice_settings_address_lines" CASCADE;
  DROP TABLE "invoice_settings" CASCADE;
  DROP TABLE "notification_settings_recipients_events" CASCADE;
  DROP TABLE "notification_settings_recipients" CASCADE;
  DROP TABLE "notification_settings" CASCADE;
  DROP TABLE "analytics_settings_exclude_paths" CASCADE;
  DROP TABLE "analytics_settings" CASCADE;
  DROP TABLE "system_state" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_media_tags";
  DROP TYPE "public"."enum_media_provenance";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_log_parent_task_slug";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_payload_folders_folder_type";
  DROP TYPE "public"."enum_site_settings_socials_platform";
  DROP TYPE "public"."enum_site_settings_locale";
  DROP TYPE "public"."enum_navigation_primary_link_type";
  DROP TYPE "public"."enum_navigation_primary_menu";
  DROP TYPE "public"."enum_navigation_primary_mobile_surface";
  DROP TYPE "public"."enum_navigation_experiences_menu_groups_kind";
  DROP TYPE "public"."enum_navigation_private_events_menu_doors_link_type";
  DROP TYPE "public"."enum_navigation_about_menu_doors_link_type";
  DROP TYPE "public"."enum_navigation_about_menu_doors_mark";
  DROP TYPE "public"."enum_navigation_footer_groups_items_link_type";
  DROP TYPE "public"."enum_navigation_legal_link_type";
  DROP TYPE "public"."enum_navigation_primary_cta_link_type";
  DROP TYPE "public"."enum_navigation_experiences_menu_door_link_type";
  DROP TYPE "public"."enum_booking_settings_utility_bars_event_detail_links_link_type";
  DROP TYPE "public"."enum_booking_settings_utility_bars_checkout_links_link_type";
  DROP TYPE "public"."enum_booking_settings_closed_cta_link_type";
  DROP TYPE "public"."enum_seo_defaults_twitter_card";
  DROP TYPE "public"."enum_payment_settings_checkout_payment_methods";
  DROP TYPE "public"."enum_payment_settings_mode";
  DROP TYPE "public"."enum_payment_settings_provider";
  DROP TYPE "public"."enum_payment_settings_checkout_link_type";
  DROP TYPE "public"."enum_email_settings_provider";
  DROP TYPE "public"."enum_notification_settings_recipients_events";
  DROP TYPE "public"."enum_analytics_settings_external_provider";
  DROP TYPE "public"."enum_analytics_settings_consent_policy_link_type";
  DROP TYPE "public"."enum_analytics_settings_dashboard_default_range";`)
}
