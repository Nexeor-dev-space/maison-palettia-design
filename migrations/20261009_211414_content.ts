import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_hero_primary_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_pages_blocks_hero_secondary_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_pages_blocks_experience_carousel_source" AS ENUM('all', 'diy', 'scheduled', 'manual');
  CREATE TYPE "public"."enum_pages_blocks_ways_to_take_part_groups_doors_note_source" AS ENUM('text', 'diyCount', 'scheduledCount', 'programmeDescription');
  CREATE TYPE "public"."enum_pages_blocks_ways_to_take_part_groups_doors_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_pages_blocks_ways_to_take_part_groups_tint" AS ENUM('lilac', 'terracotta', 'lavender', 'sage');
  CREATE TYPE "public"."enum_pages_blocks_two_ways_roads_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_pages_blocks_two_ways_roads_ground" AS ENUM('terracotta', 'lilac');
  CREATE TYPE "public"."enum_pages_blocks_closing_invitation_primary_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_pages_blocks_closing_invitation_secondary_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_pages_blocks_closing_cta_lilac_primary_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_pages_blocks_closing_cta_lilac_secondary_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_pages_blocks_page_header_standfirst_source" AS ENUM('text', 'openingStatementBody', 'findUsLine');
  CREATE TYPE "public"."enum_pages_blocks_faq_list_groups_key" AS ENUM('coming', 'booking', 'groups');
  CREATE TYPE "public"."enum_pages_blocks_gallery_collections_collections_ground" AS ENUM('surface', 'cream', 'sage');
  CREATE TYPE "public"."enum_pages_blocks_gallery_collections_collections_source" AS ENUM('experiences', 'mediaTag', 'manual');
  CREATE TYPE "public"."enum_pages_blocks_gallery_collections_collections_media_tag" AS ENUM('experience-hero', 'experience-gallery', 'programme', 'venue', 'gallery-make', 'gallery-making', 'gallery-keep', 'logo', 'og', 'hero', 'seasonal', 'kids', 'film', 'font');
  CREATE TYPE "public"."enum_pages_blocks_contact_intro_venues_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_pages_blocks_activities_grid_link_to" AS ENUM('experiencePage', 'enquiry');
  CREATE TYPE "public"."enum_pages_blocks_steps_source" AS ENUM('brandCopyPrivateEventSteps', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_steps_variant" AS ENUM('cards', 'list');
  CREATE TYPE "public"."enum_pages_blocks_enquiry_form_sidebar_steps_source" AS ENUM('brandCopyPrivateEventSteps', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_passes_list_empty_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_pages_blocks_passes_list_footer_first_link_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_pages_blocks_passes_list_footer_second_link_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_pages_blocks_events_browser_doors_note_source" AS ENUM('journey0', 'journey1', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_where_we_set_up_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_pages_blocks_utility_bar_links_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_pages_blocks_rich_text_width" AS ENUM('narrow', 'wide');
  CREATE TYPE "public"."enum_pages_blocks_seasonal_source" AS ENUM('brandCopy', 'manual');
  CREATE TYPE "public"."enum_pages_blocks_pe_teaser_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_pages_blocks_testimonials_source" AS ENUM('latest', 'manual');
  CREATE TYPE "public"."enum_pages_blocks_collaborate_teaser_primary_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_pages_blocks_collaborate_teaser_secondary_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_primary_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_secondary_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_blocks_experience_carousel_source" AS ENUM('all', 'diy', 'scheduled', 'manual');
  CREATE TYPE "public"."enum__pages_v_blocks_ways_to_take_part_groups_doors_note_source" AS ENUM('text', 'diyCount', 'scheduledCount', 'programmeDescription');
  CREATE TYPE "public"."enum__pages_v_blocks_ways_to_take_part_groups_doors_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_blocks_ways_to_take_part_groups_tint" AS ENUM('lilac', 'terracotta', 'lavender', 'sage');
  CREATE TYPE "public"."enum__pages_v_blocks_two_ways_roads_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_blocks_two_ways_roads_ground" AS ENUM('terracotta', 'lilac');
  CREATE TYPE "public"."enum__pages_v_blocks_closing_invitation_primary_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_blocks_closing_invitation_secondary_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_blocks_closing_cta_lilac_primary_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_blocks_closing_cta_lilac_secondary_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_blocks_page_header_standfirst_source" AS ENUM('text', 'openingStatementBody', 'findUsLine');
  CREATE TYPE "public"."enum__pages_v_blocks_faq_list_groups_key" AS ENUM('coming', 'booking', 'groups');
  CREATE TYPE "public"."enum__pages_v_blocks_gallery_collections_collections_ground" AS ENUM('surface', 'cream', 'sage');
  CREATE TYPE "public"."enum__pages_v_blocks_gallery_collections_collections_source" AS ENUM('experiences', 'mediaTag', 'manual');
  CREATE TYPE "public"."enum__pages_v_blocks_gallery_collections_collections_media_tag" AS ENUM('experience-hero', 'experience-gallery', 'programme', 'venue', 'gallery-make', 'gallery-making', 'gallery-keep', 'logo', 'og', 'hero', 'seasonal', 'kids', 'film', 'font');
  CREATE TYPE "public"."enum__pages_v_blocks_contact_intro_venues_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_blocks_activities_grid_link_to" AS ENUM('experiencePage', 'enquiry');
  CREATE TYPE "public"."enum__pages_v_blocks_steps_source" AS ENUM('brandCopyPrivateEventSteps', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_steps_variant" AS ENUM('cards', 'list');
  CREATE TYPE "public"."enum__pages_v_blocks_enquiry_form_sidebar_steps_source" AS ENUM('brandCopyPrivateEventSteps', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_passes_list_empty_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_blocks_passes_list_footer_first_link_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_blocks_passes_list_footer_second_link_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_blocks_events_browser_doors_note_source" AS ENUM('journey0', 'journey1', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_where_we_set_up_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_blocks_utility_bar_links_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_blocks_rich_text_width" AS ENUM('narrow', 'wide');
  CREATE TYPE "public"."enum__pages_v_blocks_seasonal_source" AS ENUM('brandCopy', 'manual');
  CREATE TYPE "public"."enum___pages_v_blocks_pe_teaser_v_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_blocks_testimonials_source" AS ENUM('latest', 'manual');
  CREATE TYPE "public"."enum__pages_v_blocks_collaborate_teaser_primary_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_blocks_collaborate_teaser_secondary_cta_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_experiences_kind" AS ENUM('diy', 'scheduled');
  CREATE TYPE "public"."enum_experiences_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__experiences_v_version_kind" AS ENUM('diy', 'scheduled');
  CREATE TYPE "public"."enum__experiences_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_sessions_startsat_tz" AS ENUM('Asia/Dubai');
  CREATE TYPE "public"."enum_sessions_booking_status" AS ENUM('open', 'waitlist', 'closed');
  CREATE TYPE "public"."enum_sessions_salescloseat_tz" AS ENUM('Asia/Dubai');
  CREATE TYPE "public"."enum_sessions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__sessions_v_version_startsat_tz" AS ENUM('Asia/Dubai');
  CREATE TYPE "public"."enum__sessions_v_version_booking_status" AS ENUM('open', 'waitlist', 'closed');
  CREATE TYPE "public"."enum__sessions_v_version_salescloseat_tz" AS ENUM('Asia/Dubai');
  CREATE TYPE "public"."enum__sessions_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_venues_status" AS ENUM('current', 'upcoming', 'past');
  CREATE TYPE "public"."enum_programmes_mark_name" AS ENUM('splash', 'coral', 'starleaf', 'bow', 'zigzag', 'cutout', 'starburst', 'wave', 'bean', 'slabCoral', 'dot');
  CREATE TYPE "public"."enum_programmes_mark_color" AS ENUM('lilac', 'lavender', 'terracotta', 'cream');
  CREATE TYPE "public"."enum_programmes_tone" AS ENUM('lavender', 'charcoal', 'sage', 'lilac', 'default');
  CREATE TYPE "public"."enum_programmes_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__programmes_v_version_mark_name" AS ENUM('splash', 'coral', 'starleaf', 'bow', 'zigzag', 'cutout', 'starburst', 'wave', 'bean', 'slabCoral', 'dot');
  CREATE TYPE "public"."enum__programmes_v_version_mark_color" AS ENUM('lilac', 'lavender', 'terracotta', 'cream');
  CREATE TYPE "public"."enum__programmes_v_version_tone" AS ENUM('lavender', 'charcoal', 'sage', 'lilac', 'default');
  CREATE TYPE "public"."enum__programmes_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_policies_blocks_ages_source" AS ENUM('diy', 'workshop', 'custom');
  CREATE TYPE "public"."enum_policies_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__policies_v_blocks_ages_source" AS ENUM('diy', 'workshop', 'custom');
  CREATE TYPE "public"."enum__policies_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_faqs_answer_source" AS ENUM('text', 'bookingTerms');
  CREATE TYPE "public"."enum_faqs_group" AS ENUM('coming', 'booking', 'groups');
  CREATE TYPE "public"."enum_faqs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__faqs_v_version_answer_source" AS ENUM('text', 'bookingTerms');
  CREATE TYPE "public"."enum__faqs_v_version_group" AS ENUM('coming', 'booking', 'groups');
  CREATE TYPE "public"."enum__faqs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_passes_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__passes_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_testimonials_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__testimonials_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_redirects_source" AS ENUM('manual', 'auto');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'schedulePublish';
  CREATE TABLE "pages_blocks_hero_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"use_tagline" boolean DEFAULT true,
  	"accent_line_index" numeric DEFAULT 1,
  	"sub" varchar DEFAULT 'There’s no wrong shade of creativity.',
  	"lead" varchar DEFAULT 'Pick your palette, get your hands busy and make something that’s completely yours.',
  	"primary_cta_label" varchar DEFAULT 'Explore experiences',
  	"primary_cta_link_type" "enum_pages_blocks_hero_primary_cta_link_type" DEFAULT 'internal',
  	"primary_cta_link_url" varchar DEFAULT '/events',
  	"primary_cta_link_anchor" varchar,
  	"primary_cta_link_new_tab" boolean DEFAULT false,
  	"secondary_cta_label" varchar DEFAULT 'Plan a private event',
  	"secondary_cta_link_type" "enum_pages_blocks_hero_secondary_cta_link_type" DEFAULT 'internal',
  	"secondary_cta_link_url" varchar DEFAULT '/private-events',
  	"secondary_cta_link_anchor" varchar,
  	"secondary_cta_link_new_tab" boolean DEFAULT false,
  	"image_desktop_id" uuid,
  	"image_mobile_id" uuid,
  	"scroll_cue_label" varchar DEFAULT 'Scroll down',
  	"scroll_cue_target" varchar DEFAULT 'experience-discovery',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_opening_statement" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'What this is',
  	"use_brand_copy" boolean DEFAULT true,
  	"heading" varchar,
  	"body" varchar,
  	"closer" varchar,
  	"panel_heading" varchar,
  	"panel_body" varchar,
  	"panel_sign_off" varchar,
  	"panel_image_id" uuid,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_experience_carousel_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_experience_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'The Maison Palettia experience',
  	"standfirst" varchar,
  	"source" "enum_pages_blocks_experience_carousel_source" DEFAULT 'all',
  	"card_cta" varchar DEFAULT 'View details',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_ways_to_take_part_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_ways_to_take_part_groups_doors" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"note_source" "enum_pages_blocks_ways_to_take_part_groups_doors_note_source" DEFAULT 'text',
  	"note" varchar,
  	"programme_id" uuid,
  	"link_type" "enum_pages_blocks_ways_to_take_part_groups_doors_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_anchor" varchar,
  	"link_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "pages_blocks_ways_to_take_part_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"lede" varchar,
  	"photo_id" uuid,
  	"tint" "enum_pages_blocks_ways_to_take_part_groups_tint" DEFAULT 'lilac'
  );
  
  CREATE TABLE "pages_blocks_ways_to_take_part" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Ways to take part',
  	"lead" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_two_ways_roads_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_two_ways_roads" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"line" varchar,
  	"cta_label" varchar,
  	"cta_link_type" "enum_pages_blocks_two_ways_roads_cta_link_type" DEFAULT 'internal',
  	"cta_link_url" varchar,
  	"cta_link_anchor" varchar,
  	"cta_link_new_tab" boolean DEFAULT false,
  	"ground" "enum_pages_blocks_two_ways_roads_ground" DEFAULT 'terracotta'
  );
  
  CREATE TABLE "pages_blocks_two_ways" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'How to take part',
  	"heading" varchar DEFAULT 'Make It Your Way.',
  	"lead" varchar DEFAULT 'Drop in and create, or book a seat for a scheduled session.',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_where_we_create_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_where_we_create" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Find us',
  	"use_find_us_line" boolean DEFAULT true,
  	"lead" varchar,
  	"find_us_now_label" varchar DEFAULT 'Find us now',
  	"venue_id" uuid,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_closing_invitation" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"primary_cta_label" varchar DEFAULT 'Explore experiences',
  	"primary_cta_link_type" "enum_pages_blocks_closing_invitation_primary_cta_link_type" DEFAULT 'internal',
  	"primary_cta_link_url" varchar DEFAULT '/events',
  	"primary_cta_link_anchor" varchar,
  	"primary_cta_link_new_tab" boolean DEFAULT false,
  	"secondary_cta_label" varchar DEFAULT 'Plan a private event',
  	"secondary_cta_link_type" "enum_pages_blocks_closing_invitation_secondary_cta_link_type" DEFAULT 'internal',
  	"secondary_cta_link_url" varchar DEFAULT '/private-events/book',
  	"secondary_cta_link_anchor" varchar,
  	"secondary_cta_link_new_tab" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_about_welcome" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'About the Maison',
  	"image_id" uuid,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_mission_vision" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_community_journey" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'The Maison experience',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_what_sets_us_apart_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_what_sets_us_apart" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'What sets us apart',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_closing_cta_lilac_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_closing_cta_lilac" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"body" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_link_type" "enum_pages_blocks_closing_cta_lilac_primary_cta_link_type" DEFAULT 'internal',
  	"primary_cta_link_url" varchar,
  	"primary_cta_link_anchor" varchar,
  	"primary_cta_link_new_tab" boolean DEFAULT false,
  	"secondary_cta_label" varchar,
  	"secondary_cta_link_type" "enum_pages_blocks_closing_cta_lilac_secondary_cta_link_type" DEFAULT 'internal',
  	"secondary_cta_link_url" varchar,
  	"secondary_cta_link_anchor" varchar,
  	"secondary_cta_link_new_tab" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_page_header_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_page_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"standfirst_source" "enum_pages_blocks_page_header_standfirst_source" DEFAULT 'text',
  	"standfirst" varchar,
  	"side_image_id" uuid,
  	"side_image_secondary_id" uuid,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_faq_list_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" "enum_pages_blocks_faq_list_groups_key",
  	"title" varchar
  );
  
  CREATE TABLE "pages_blocks_faq_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_gallery_collections_collections" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"folio" varchar,
  	"heading" varchar,
  	"lede" varchar,
  	"ground" "enum_pages_blocks_gallery_collections_collections_ground" DEFAULT 'surface',
  	"source" "enum_pages_blocks_gallery_collections_collections_source" DEFAULT 'manual',
  	"media_tag" "enum_pages_blocks_gallery_collections_collections_media_tag"
  );
  
  CREATE TABLE "pages_blocks_gallery_collections" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_locations_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"find_us_now_label" varchar DEFAULT 'Find us now',
  	"empty_note" varchar DEFAULT 'The next destination is being confirmed.',
  	"show_past_destinations" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_contact_intro_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_contact_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Contact',
  	"lead" varchar,
  	"find_us_heading" varchar DEFAULT 'Find Us',
  	"where_term" varchar DEFAULT 'Where',
  	"email_term" varchar DEFAULT 'Email',
  	"phone_term" varchar DEFAULT 'Phone',
  	"follow_term" varchar DEFAULT 'Follow',
  	"venues_link_label" varchar DEFAULT 'Venues are listed with each event',
  	"venues_link_type" "enum_pages_blocks_contact_intro_venues_link_type" DEFAULT 'internal',
  	"venues_link_url" varchar DEFAULT '/events',
  	"venues_link_anchor" varchar,
  	"venues_link_new_tab" boolean DEFAULT false,
  	"form_heading" varchar DEFAULT 'Write to Us',
  	"form_lead" varchar DEFAULT 'A few lines is plenty. Tell us what you are after and we will come back to you.',
  	"portrait_id" uuid,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_pe_intro_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_pe_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Creative experiences, made for your moment',
  	"lead" varchar,
  	"image_id" uuid,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_programmes_grid_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_programmes_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Who it is for',
  	"lead" varchar,
  	"card_cta" varchar DEFAULT 'See the programme',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_activities_grid_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_activities_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'The experiences',
  	"lead" varchar,
  	"link_to" "enum_pages_blocks_activities_grid_link_to" DEFAULT 'experiencePage',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_venue_spotlight_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_venue_spotlight" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Create with us',
  	"lead" varchar,
  	"card_label" varchar DEFAULT 'Our home',
  	"venue_id" uuid,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_steps_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"detail" varchar
  );
  
  CREATE TABLE "pages_blocks_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'How it works',
  	"source" "enum_pages_blocks_steps_source" DEFAULT 'brandCopyPrivateEventSteps',
  	"variant" "enum_pages_blocks_steps_variant" DEFAULT 'cards',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_enquiry_form_sidebar_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"detail" varchar
  );
  
  CREATE TABLE "pages_blocks_enquiry_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"legend_about_you" varchar DEFAULT 'About you',
  	"legend_about_event" varchar DEFAULT 'About the event',
  	"note" varchar DEFAULT 'Answer what you know. None of this is required, and nothing here is fixed once you send it.',
  	"submit_label" varchar DEFAULT 'Send enquiry',
  	"success_heading" varchar DEFAULT 'Enquiry received',
  	"success_body" varchar,
  	"sidebar_steps_heading" varchar DEFAULT 'What happens next',
  	"sidebar_steps_source" "enum_pages_blocks_enquiry_form_sidebar_steps_source" DEFAULT 'brandCopyPrivateEventSteps',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_passes_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Loyalty',
  	"heading" varchar DEFAULT 'Come More Than Once.',
  	"lead" varchar,
  	"list_heading" varchar DEFAULT 'Choose Your Pass',
  	"preview_disclaimer" varchar,
  	"sessions_term" varchar DEFAULT 'Sessions',
  	"valid_term" varchar DEFAULT 'Valid for',
  	"add_label" varchar DEFAULT 'Add to booking',
  	"not_on_sale" varchar DEFAULT 'This pass is not on sale online yet.',
  	"ask_label" varchar DEFAULT 'Ask the Maison about it',
  	"added_note" varchar DEFAULT 'Added to your booking{count}.',
  	"view_booking_label" varchar DEFAULT 'View your booking',
  	"failed_note" varchar,
  	"empty_title" varchar,
  	"empty_body" varchar,
  	"empty_cta_label" varchar,
  	"empty_cta_link_type" "enum_pages_blocks_passes_list_empty_cta_link_type" DEFAULT 'internal',
  	"empty_cta_link_url" varchar,
  	"empty_cta_link_anchor" varchar,
  	"empty_cta_link_new_tab" boolean DEFAULT false,
  	"footer_before" varchar DEFAULT 'Already holding something?',
  	"footer_first_link_label" varchar DEFAULT 'Go to your booking',
  	"footer_first_link_link_type" "enum_pages_blocks_passes_list_footer_first_link_link_type" DEFAULT 'internal',
  	"footer_first_link_link_url" varchar DEFAULT '/checkout',
  	"footer_first_link_link_anchor" varchar,
  	"footer_first_link_link_new_tab" boolean DEFAULT false,
  	"footer_between" varchar DEFAULT ', or',
  	"footer_second_link_label" varchar DEFAULT 'see what is on',
  	"footer_second_link_link_type" "enum_pages_blocks_passes_list_footer_second_link_link_type" DEFAULT 'internal',
  	"footer_second_link_link_url" varchar DEFAULT '/events',
  	"footer_second_link_link_anchor" varchar,
  	"footer_second_link_link_new_tab" boolean DEFAULT false,
  	"footer_after" varchar DEFAULT '.',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_policies_index" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_events_browser_doors" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"note_source" "enum_pages_blocks_events_browser_doors_note_source" DEFAULT 'journey0',
  	"note" varchar,
  	"mode_label" varchar
  );
  
  CREATE TABLE "pages_blocks_events_browser" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"group_leads_diy" varchar DEFAULT 'Pick a project. Pick your colours. Just drop in.',
  	"group_leads_scheduled" varchar DEFAULT 'A little more planned. Same creative energy.',
  	"view_location_label" varchar DEFAULT 'View location',
  	"empty_title" varchar DEFAULT 'The next dates are being set.',
  	"empty_body" varchar DEFAULT 'Create Anytime experiences are available in the meantime.',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_where_we_set_up" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Find us',
  	"heading" varchar DEFAULT 'Your Next Creative Stop.',
  	"use_find_us_line" boolean DEFAULT true,
  	"lead" varchar,
  	"next_label_template" varchar DEFAULT 'Next {weekday} {date}',
  	"cta_label" varchar DEFAULT 'Find the studio',
  	"cta_link_type" "enum_pages_blocks_where_we_set_up_cta_link_type" DEFAULT 'internal',
  	"cta_link_url" varchar DEFAULT '/locations',
  	"cta_link_anchor" varchar,
  	"cta_link_new_tab" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_utility_bar_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"link_type" "enum_pages_blocks_utility_bar_links_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_anchor" varchar,
  	"link_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "pages_blocks_utility_bar" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"note" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"body" jsonb,
  	"width" "enum_pages_blocks_rich_text_width" DEFAULT 'narrow',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_seasonal_moments" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"occasion" varchar,
  	"experience" varchar,
  	"image_id" uuid
  );
  
  CREATE TABLE "pages_blocks_seasonal" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Limited time',
  	"heading" varchar DEFAULT 'A different season, every season.',
  	"intro" varchar,
  	"source" "enum_pages_blocks_seasonal_source" DEFAULT 'brandCopy',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_workshop_journey_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_workshop_journey" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'What we offer',
  	"image_id" uuid,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_pe_teaser_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_pe_teaser" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"cta_label" varchar DEFAULT 'Plan a private event',
  	"cta_link_type" "enum_pages_blocks_pe_teaser_cta_link_type" DEFAULT 'internal',
  	"cta_link_url" varchar DEFAULT '/private-events',
  	"cta_link_anchor" varchar,
  	"cta_link_new_tab" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_image_pair" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"first_id" uuid,
  	"second_id" uuid,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_full_bleed_statement" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" uuid,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_film" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"video_id" uuid,
  	"poster_id" uuid,
  	"label" varchar DEFAULT 'A short film',
  	"duration" varchar DEFAULT '1:01',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_upcoming_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Upcoming sessions',
  	"limit" numeric DEFAULT 4,
  	"experience_id" uuid,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"source" "enum_pages_blocks_testimonials_source" DEFAULT 'latest',
  	"limit" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_collaborate_teaser_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_collaborate_teaser" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Collaborative approach',
  	"lead" varchar,
  	"primary_cta_label" varchar DEFAULT 'Partner with us',
  	"primary_cta_link_type" "enum_pages_blocks_collaborate_teaser_primary_cta_link_type" DEFAULT 'internal',
  	"primary_cta_link_url" varchar DEFAULT '/contact',
  	"primary_cta_link_anchor" varchar,
  	"primary_cta_link_new_tab" boolean DEFAULT false,
  	"secondary_cta_label" varchar,
  	"secondary_cta_link_type" "enum_pages_blocks_collaborate_teaser_secondary_cta_link_type" DEFAULT 'internal',
  	"secondary_cta_link_url" varchar,
  	"secondary_cta_link_anchor" varchar,
  	"secondary_cta_link_new_tab" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" uuid,
  	"meta_noindex" boolean DEFAULT false,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"experiences_id" uuid,
  	"media_id" uuid,
  	"venues_id" uuid,
  	"testimonials_id" uuid
  );
  
  CREATE TABLE "_pages_v_blocks_hero_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"use_tagline" boolean DEFAULT true,
  	"accent_line_index" numeric DEFAULT 1,
  	"sub" varchar DEFAULT 'There’s no wrong shade of creativity.',
  	"lead" varchar DEFAULT 'Pick your palette, get your hands busy and make something that’s completely yours.',
  	"primary_cta_label" varchar DEFAULT 'Explore experiences',
  	"primary_cta_link_type" "enum__pages_v_blocks_hero_primary_cta_link_type" DEFAULT 'internal',
  	"primary_cta_link_url" varchar DEFAULT '/events',
  	"primary_cta_link_anchor" varchar,
  	"primary_cta_link_new_tab" boolean DEFAULT false,
  	"secondary_cta_label" varchar DEFAULT 'Plan a private event',
  	"secondary_cta_link_type" "enum__pages_v_blocks_hero_secondary_cta_link_type" DEFAULT 'internal',
  	"secondary_cta_link_url" varchar DEFAULT '/private-events',
  	"secondary_cta_link_anchor" varchar,
  	"secondary_cta_link_new_tab" boolean DEFAULT false,
  	"image_desktop_id" uuid,
  	"image_mobile_id" uuid,
  	"scroll_cue_label" varchar DEFAULT 'Scroll down',
  	"scroll_cue_target" varchar DEFAULT 'experience-discovery',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_opening_statement" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'What this is',
  	"use_brand_copy" boolean DEFAULT true,
  	"heading" varchar,
  	"body" varchar,
  	"closer" varchar,
  	"panel_heading" varchar,
  	"panel_body" varchar,
  	"panel_sign_off" varchar,
  	"panel_image_id" uuid,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_experience_carousel_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_experience_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'The Maison Palettia experience',
  	"standfirst" varchar,
  	"source" "enum__pages_v_blocks_experience_carousel_source" DEFAULT 'all',
  	"card_cta" varchar DEFAULT 'View details',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_ways_to_take_part_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_ways_to_take_part_groups_doors" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"note_source" "enum__pages_v_blocks_ways_to_take_part_groups_doors_note_source" DEFAULT 'text',
  	"note" varchar,
  	"programme_id" uuid,
  	"link_type" "enum__pages_v_blocks_ways_to_take_part_groups_doors_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_anchor" varchar,
  	"link_new_tab" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_ways_to_take_part_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"lede" varchar,
  	"photo_id" uuid,
  	"tint" "enum__pages_v_blocks_ways_to_take_part_groups_tint" DEFAULT 'lilac',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_ways_to_take_part" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'Ways to take part',
  	"lead" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_two_ways_roads_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_two_ways_roads" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"line" varchar,
  	"cta_label" varchar,
  	"cta_link_type" "enum__pages_v_blocks_two_ways_roads_cta_link_type" DEFAULT 'internal',
  	"cta_link_url" varchar,
  	"cta_link_anchor" varchar,
  	"cta_link_new_tab" boolean DEFAULT false,
  	"ground" "enum__pages_v_blocks_two_ways_roads_ground" DEFAULT 'terracotta',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_two_ways" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'How to take part',
  	"heading" varchar DEFAULT 'Make It Your Way.',
  	"lead" varchar DEFAULT 'Drop in and create, or book a seat for a scheduled session.',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_where_we_create_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_where_we_create" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'Find us',
  	"use_find_us_line" boolean DEFAULT true,
  	"lead" varchar,
  	"find_us_now_label" varchar DEFAULT 'Find us now',
  	"venue_id" uuid,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_closing_invitation" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"primary_cta_label" varchar DEFAULT 'Explore experiences',
  	"primary_cta_link_type" "enum__pages_v_blocks_closing_invitation_primary_cta_link_type" DEFAULT 'internal',
  	"primary_cta_link_url" varchar DEFAULT '/events',
  	"primary_cta_link_anchor" varchar,
  	"primary_cta_link_new_tab" boolean DEFAULT false,
  	"secondary_cta_label" varchar DEFAULT 'Plan a private event',
  	"secondary_cta_link_type" "enum__pages_v_blocks_closing_invitation_secondary_cta_link_type" DEFAULT 'internal',
  	"secondary_cta_link_url" varchar DEFAULT '/private-events/book',
  	"secondary_cta_link_anchor" varchar,
  	"secondary_cta_link_new_tab" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_about_welcome" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'About the Maison',
  	"image_id" uuid,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_mission_vision" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_community_journey" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'The Maison experience',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_what_sets_us_apart_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_what_sets_us_apart" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'What sets us apart',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_closing_cta_lilac_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_closing_cta_lilac" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar,
  	"body" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_link_type" "enum__pages_v_blocks_closing_cta_lilac_primary_cta_link_type" DEFAULT 'internal',
  	"primary_cta_link_url" varchar,
  	"primary_cta_link_anchor" varchar,
  	"primary_cta_link_new_tab" boolean DEFAULT false,
  	"secondary_cta_label" varchar,
  	"secondary_cta_link_type" "enum__pages_v_blocks_closing_cta_lilac_secondary_cta_link_type" DEFAULT 'internal',
  	"secondary_cta_link_url" varchar,
  	"secondary_cta_link_anchor" varchar,
  	"secondary_cta_link_new_tab" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_page_header_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_page_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar,
  	"standfirst_source" "enum__pages_v_blocks_page_header_standfirst_source" DEFAULT 'text',
  	"standfirst" varchar,
  	"side_image_id" uuid,
  	"side_image_secondary_id" uuid,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_list_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" "enum__pages_v_blocks_faq_list_groups_key",
  	"title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_gallery_collections_collections" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"folio" varchar,
  	"heading" varchar,
  	"lede" varchar,
  	"ground" "enum__pages_v_blocks_gallery_collections_collections_ground" DEFAULT 'surface',
  	"source" "enum__pages_v_blocks_gallery_collections_collections_source" DEFAULT 'manual',
  	"media_tag" "enum__pages_v_blocks_gallery_collections_collections_media_tag",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_gallery_collections" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_locations_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"find_us_now_label" varchar DEFAULT 'Find us now',
  	"empty_note" varchar DEFAULT 'The next destination is being confirmed.',
  	"show_past_destinations" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_contact_intro_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_contact_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'Contact',
  	"lead" varchar,
  	"find_us_heading" varchar DEFAULT 'Find Us',
  	"where_term" varchar DEFAULT 'Where',
  	"email_term" varchar DEFAULT 'Email',
  	"phone_term" varchar DEFAULT 'Phone',
  	"follow_term" varchar DEFAULT 'Follow',
  	"venues_link_label" varchar DEFAULT 'Venues are listed with each event',
  	"venues_link_type" "enum__pages_v_blocks_contact_intro_venues_link_type" DEFAULT 'internal',
  	"venues_link_url" varchar DEFAULT '/events',
  	"venues_link_anchor" varchar,
  	"venues_link_new_tab" boolean DEFAULT false,
  	"form_heading" varchar DEFAULT 'Write to Us',
  	"form_lead" varchar DEFAULT 'A few lines is plenty. Tell us what you are after and we will come back to you.',
  	"portrait_id" uuid,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "__pages_v_blocks_pe_intro_v_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "__pages_v_blocks_pe_intro_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'Creative experiences, made for your moment',
  	"lead" varchar,
  	"image_id" uuid,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_programmes_grid_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_programmes_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'Who it is for',
  	"lead" varchar,
  	"card_cta" varchar DEFAULT 'See the programme',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_activities_grid_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_activities_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'The experiences',
  	"lead" varchar,
  	"link_to" "enum__pages_v_blocks_activities_grid_link_to" DEFAULT 'experiencePage',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_venue_spotlight_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_venue_spotlight" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'Create with us',
  	"lead" varchar,
  	"card_label" varchar DEFAULT 'Our home',
  	"venue_id" uuid,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_steps_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"detail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'How it works',
  	"source" "enum__pages_v_blocks_steps_source" DEFAULT 'brandCopyPrivateEventSteps',
  	"variant" "enum__pages_v_blocks_steps_variant" DEFAULT 'cards',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_enquiry_form_sidebar_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"detail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_enquiry_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"legend_about_you" varchar DEFAULT 'About you',
  	"legend_about_event" varchar DEFAULT 'About the event',
  	"note" varchar DEFAULT 'Answer what you know. None of this is required, and nothing here is fixed once you send it.',
  	"submit_label" varchar DEFAULT 'Send enquiry',
  	"success_heading" varchar DEFAULT 'Enquiry received',
  	"success_body" varchar,
  	"sidebar_steps_heading" varchar DEFAULT 'What happens next',
  	"sidebar_steps_source" "enum__pages_v_blocks_enquiry_form_sidebar_steps_source" DEFAULT 'brandCopyPrivateEventSteps',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_passes_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'Loyalty',
  	"heading" varchar DEFAULT 'Come More Than Once.',
  	"lead" varchar,
  	"list_heading" varchar DEFAULT 'Choose Your Pass',
  	"preview_disclaimer" varchar,
  	"sessions_term" varchar DEFAULT 'Sessions',
  	"valid_term" varchar DEFAULT 'Valid for',
  	"add_label" varchar DEFAULT 'Add to booking',
  	"not_on_sale" varchar DEFAULT 'This pass is not on sale online yet.',
  	"ask_label" varchar DEFAULT 'Ask the Maison about it',
  	"added_note" varchar DEFAULT 'Added to your booking{count}.',
  	"view_booking_label" varchar DEFAULT 'View your booking',
  	"failed_note" varchar,
  	"empty_title" varchar,
  	"empty_body" varchar,
  	"empty_cta_label" varchar,
  	"empty_cta_link_type" "enum__pages_v_blocks_passes_list_empty_cta_link_type" DEFAULT 'internal',
  	"empty_cta_link_url" varchar,
  	"empty_cta_link_anchor" varchar,
  	"empty_cta_link_new_tab" boolean DEFAULT false,
  	"footer_before" varchar DEFAULT 'Already holding something?',
  	"footer_first_link_label" varchar DEFAULT 'Go to your booking',
  	"footer_first_link_link_type" "enum__pages_v_blocks_passes_list_footer_first_link_link_type" DEFAULT 'internal',
  	"footer_first_link_link_url" varchar DEFAULT '/checkout',
  	"footer_first_link_link_anchor" varchar,
  	"footer_first_link_link_new_tab" boolean DEFAULT false,
  	"footer_between" varchar DEFAULT ', or',
  	"footer_second_link_label" varchar DEFAULT 'see what is on',
  	"footer_second_link_link_type" "enum__pages_v_blocks_passes_list_footer_second_link_link_type" DEFAULT 'internal',
  	"footer_second_link_link_url" varchar DEFAULT '/events',
  	"footer_second_link_link_anchor" varchar,
  	"footer_second_link_link_new_tab" boolean DEFAULT false,
  	"footer_after" varchar DEFAULT '.',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_policies_index" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_events_browser_doors" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"note_source" "enum__pages_v_blocks_events_browser_doors_note_source" DEFAULT 'journey0',
  	"note" varchar,
  	"mode_label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_events_browser" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"group_leads_diy" varchar DEFAULT 'Pick a project. Pick your colours. Just drop in.',
  	"group_leads_scheduled" varchar DEFAULT 'A little more planned. Same creative energy.',
  	"view_location_label" varchar DEFAULT 'View location',
  	"empty_title" varchar DEFAULT 'The next dates are being set.',
  	"empty_body" varchar DEFAULT 'Create Anytime experiences are available in the meantime.',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_where_we_set_up" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'Find us',
  	"heading" varchar DEFAULT 'Your Next Creative Stop.',
  	"use_find_us_line" boolean DEFAULT true,
  	"lead" varchar,
  	"next_label_template" varchar DEFAULT 'Next {weekday} {date}',
  	"cta_label" varchar DEFAULT 'Find the studio',
  	"cta_link_type" "enum__pages_v_blocks_where_we_set_up_cta_link_type" DEFAULT 'internal',
  	"cta_link_url" varchar DEFAULT '/locations',
  	"cta_link_anchor" varchar,
  	"cta_link_new_tab" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_utility_bar_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"link_type" "enum__pages_v_blocks_utility_bar_links_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_anchor" varchar,
  	"link_new_tab" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_utility_bar" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"note" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"body" jsonb,
  	"width" "enum__pages_v_blocks_rich_text_width" DEFAULT 'narrow',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_seasonal_moments" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"occasion" varchar,
  	"experience" varchar,
  	"image_id" uuid,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_seasonal" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'Limited time',
  	"heading" varchar DEFAULT 'A different season, every season.',
  	"intro" varchar,
  	"source" "enum__pages_v_blocks_seasonal_source" DEFAULT 'brandCopy',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_workshop_journey_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_workshop_journey" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'What we offer',
  	"image_id" uuid,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "__pages_v_blocks_pe_teaser_v_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "__pages_v_blocks_pe_teaser_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar,
  	"cta_label" varchar DEFAULT 'Plan a private event',
  	"cta_link_type" "enum___pages_v_blocks_pe_teaser_v_cta_link_type" DEFAULT 'internal',
  	"cta_link_url" varchar DEFAULT '/private-events',
  	"cta_link_anchor" varchar,
  	"cta_link_new_tab" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_image_pair" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"first_id" uuid,
  	"second_id" uuid,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_full_bleed_statement" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"image_id" uuid,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_film" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"video_id" uuid,
  	"poster_id" uuid,
  	"label" varchar DEFAULT 'A short film',
  	"duration" varchar DEFAULT '1:01',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_upcoming_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"heading" varchar DEFAULT 'Upcoming sessions',
  	"limit" numeric DEFAULT 4,
  	"experience_id" uuid,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"heading" varchar,
  	"source" "enum__pages_v_blocks_testimonials_source" DEFAULT 'latest',
  	"limit" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_collaborate_teaser_heading_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_collaborate_teaser" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar DEFAULT 'Collaborative approach',
  	"lead" varchar,
  	"primary_cta_label" varchar DEFAULT 'Partner with us',
  	"primary_cta_link_type" "enum__pages_v_blocks_collaborate_teaser_primary_cta_link_type" DEFAULT 'internal',
  	"primary_cta_link_url" varchar DEFAULT '/contact',
  	"primary_cta_link_anchor" varchar,
  	"primary_cta_link_new_tab" boolean DEFAULT false,
  	"secondary_cta_label" varchar,
  	"secondary_cta_link_type" "enum__pages_v_blocks_collaborate_teaser_secondary_cta_link_type" DEFAULT 'internal',
  	"secondary_cta_link_url" varchar,
  	"secondary_cta_link_anchor" varchar,
  	"secondary_cta_link_new_tab" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" uuid,
  	"version_meta_noindex" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"experiences_id" uuid,
  	"media_id" uuid,
  	"venues_id" uuid,
  	"testimonials_id" uuid
  );
  
  CREATE TABLE "experiences_about" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"paragraph" varchar
  );
  
  CREATE TABLE "experiences" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"kind" "enum_experiences_kind" DEFAULT 'diy',
  	"description" varchar,
  	"image_id" uuid,
  	"age_guidance" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" uuid,
  	"meta_noindex" boolean DEFAULT false,
  	"slug" varchar,
  	"status" varchar,
  	"private_event_eligible" boolean DEFAULT true,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_experiences_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "experiences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" uuid,
  	"vibes_id" uuid
  );
  
  CREATE TABLE "_experiences_v_version_about" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"paragraph" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_experiences_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_name" varchar,
  	"version_kind" "enum__experiences_v_version_kind" DEFAULT 'diy',
  	"version_description" varchar,
  	"version_image_id" uuid,
  	"version_age_guidance" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" uuid,
  	"version_meta_noindex" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_status" varchar,
  	"version_private_event_eligible" boolean DEFAULT true,
  	"version_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__experiences_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_experiences_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" uuid,
  	"vibes_id" uuid
  );
  
  CREATE TABLE "sessions_about" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"paragraph" varchar
  );
  
  CREATE TABLE "sessions" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"experience_id" uuid,
  	"title" varchar,
  	"category" varchar,
  	"starts_at" timestamp(3) with time zone,
  	"startsat_tz" "enum_sessions_startsat_tz" DEFAULT 'Asia/Dubai',
  	"duration_minutes" numeric DEFAULT 120,
  	"venue_id" uuid,
  	"price_fils" numeric,
  	"seats_total" numeric DEFAULT 12,
  	"excerpt" varchar,
  	"image_id" uuid,
  	"includes" varchar,
  	"min_age" numeric,
  	"instructor" varchar,
  	"booking_status" "enum_sessions_booking_status" DEFAULT 'open',
  	"sales_close_at" timestamp(3) with time zone,
  	"salescloseat_tz" "enum_sessions_salescloseat_tz" DEFAULT 'Asia/Dubai',
  	"check_in_window_before_minutes" numeric DEFAULT 60,
  	"check_in_window_after_minutes" numeric DEFAULT 30,
  	"internal_notes" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" uuid,
  	"meta_noindex" boolean DEFAULT false,
  	"slug" varchar,
  	"reminder_sent_at" timestamp(3) with time zone,
  	"cancelled_at" timestamp(3) with time zone,
  	"cancel_reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_sessions_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "sessions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" uuid
  );
  
  CREATE TABLE "_sessions_v_version_about" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"paragraph" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sessions_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_experience_id" uuid,
  	"version_title" varchar,
  	"version_category" varchar,
  	"version_starts_at" timestamp(3) with time zone,
  	"version_startsat_tz" "enum__sessions_v_version_startsat_tz" DEFAULT 'Asia/Dubai',
  	"version_duration_minutes" numeric DEFAULT 120,
  	"version_venue_id" uuid,
  	"version_price_fils" numeric,
  	"version_seats_total" numeric DEFAULT 12,
  	"version_excerpt" varchar,
  	"version_image_id" uuid,
  	"version_includes" varchar,
  	"version_min_age" numeric,
  	"version_instructor" varchar,
  	"version_booking_status" "enum__sessions_v_version_booking_status" DEFAULT 'open',
  	"version_sales_close_at" timestamp(3) with time zone,
  	"version_salescloseat_tz" "enum__sessions_v_version_salescloseat_tz" DEFAULT 'Asia/Dubai',
  	"version_check_in_window_before_minutes" numeric DEFAULT 60,
  	"version_check_in_window_after_minutes" numeric DEFAULT 30,
  	"version_internal_notes" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" uuid,
  	"version_meta_noindex" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_reminder_sent_at" timestamp(3) with time zone,
  	"version_cancelled_at" timestamp(3) with time zone,
  	"version_cancel_reason" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__sessions_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_sessions_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" uuid
  );
  
  CREATE TABLE "session_inventory" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"session_id" uuid NOT NULL,
  	"seats_sold" numeric DEFAULT 0 NOT NULL,
  	"seats_held" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "venues_address" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"line" varchar NOT NULL
  );
  
  CREATE TABLE "venues_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"days" varchar NOT NULL,
  	"hours" varchar NOT NULL
  );
  
  CREATE TABLE "venues" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"locality" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_venues_status" DEFAULT 'current' NOT NULL,
  	"descriptor" varchar NOT NULL,
  	"event_descriptor" varchar,
  	"location_href" varchar,
  	"map_query" varchar,
  	"coordinates_lat" numeric,
  	"coordinates_lng" numeric,
  	"logo_id" uuid,
  	"image_id" uuid,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "programmes" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"lead" varchar,
  	"image_id" uuid,
  	"mark_name" "enum_programmes_mark_name",
  	"mark_color" "enum_programmes_mark_color",
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" uuid,
  	"meta_noindex" boolean DEFAULT false,
  	"slug" varchar,
  	"in_private_events_menu" boolean DEFAULT true,
  	"tone" "enum_programmes_tone" DEFAULT 'default',
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_programmes_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_programmes_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_name" varchar,
  	"version_description" varchar,
  	"version_lead" varchar,
  	"version_image_id" uuid,
  	"version_mark_name" "enum__programmes_v_version_mark_name",
  	"version_mark_color" "enum__programmes_v_version_mark_color",
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" uuid,
  	"version_meta_noindex" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_in_private_events_menu" boolean DEFAULT true,
  	"version_tone" "enum__programmes_v_version_tone" DEFAULT 'default',
  	"version_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__programmes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "policies_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "policies_blocks_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "policies_blocks_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "policies_blocks_ages_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"activity" varchar,
  	"guidance" varchar
  );
  
  CREATE TABLE "policies_blocks_ages" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source" "enum_policies_blocks_ages_source" DEFAULT 'diy',
  	"block_name" varchar
  );
  
  CREATE TABLE "policies_blocks_callout" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "policies_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar
  );
  
  CREATE TABLE "policies" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"nav_label" varchar,
  	"summary" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" uuid,
  	"meta_noindex" boolean DEFAULT false,
  	"slug" varchar,
  	"effective_date" timestamp(3) with time zone,
  	"show_in_legal_row" boolean DEFAULT false,
  	"requires_checkout_consent" boolean DEFAULT false,
  	"version" numeric DEFAULT 1,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_policies_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_policies_v_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_policies_v_blocks_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_policies_v_blocks_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_policies_v_blocks_ages_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"activity" varchar,
  	"guidance" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_policies_v_blocks_ages" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"source" "enum__policies_v_blocks_ages_source" DEFAULT 'diy',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_policies_v_blocks_callout" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_policies_v_version_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_policies_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_nav_label" varchar,
  	"version_summary" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" uuid,
  	"version_meta_noindex" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_effective_date" timestamp(3) with time zone,
  	"version_show_in_legal_row" boolean DEFAULT false,
  	"version_requires_checkout_consent" boolean DEFAULT false,
  	"version_version" numeric DEFAULT 1,
  	"version_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__policies_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "faqs" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"question" varchar,
  	"answer_source" "enum_faqs_answer_source" DEFAULT 'text',
  	"answer" jsonb,
  	"group" "enum_faqs_group" DEFAULT 'coming',
  	"show_on_homepage" boolean DEFAULT false,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_faqs_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_faqs_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_question" varchar,
  	"version_answer_source" "enum__faqs_v_version_answer_source" DEFAULT 'text',
  	"version_answer" jsonb,
  	"version_group" "enum__faqs_v_version_group" DEFAULT 'coming',
  	"version_show_on_homepage" boolean DEFAULT false,
  	"version_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__faqs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "passes_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"line" varchar
  );
  
  CREATE TABLE "passes" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"price_fils" numeric,
  	"sessions" numeric,
  	"validity_days" numeric,
  	"validity_label" varchar,
  	"image_id" uuid,
  	"sellable" boolean DEFAULT false,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_passes_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_passes_v_version_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"line" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_passes_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_price_fils" numeric,
  	"version_sessions" numeric,
  	"version_validity_days" numeric,
  	"version_validity_label" varchar,
  	"version_image_id" uuid,
  	"version_sellable" boolean DEFAULT false,
  	"version_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__passes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "testimonials" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"quote" varchar,
  	"attribution" varchar,
  	"experience_id" uuid,
  	"permission_on_file" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_testimonials_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_testimonials_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_quote" varchar,
  	"version_attribution" varchar,
  	"version_experience_id" uuid,
  	"version_permission_on_file" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__testimonials_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "vibes" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"blurb" varchar NOT NULL,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "redirects" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"from" varchar NOT NULL,
  	"to" varchar NOT NULL,
  	"permanent" boolean DEFAULT true,
  	"source" "enum_redirects_source" DEFAULT 'manual' NOT NULL,
  	"hits" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "navigation" ALTER COLUMN "experiences_menu_door_title" SET DEFAULT 'Upcoming dates';
  ALTER TABLE "navigation" ALTER COLUMN "experiences_menu_door_sub" SET DEFAULT 'Guided sessions you can book.';
  ALTER TABLE "navigation" ALTER COLUMN "experiences_menu_door_link_url" SET DEFAULT '/events';
  ALTER TABLE "navigation" ALTER COLUMN "experiences_menu_door_link_anchor" SET DEFAULT 'scheduled';
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "experiences_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sessions_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "session_inventory_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "venues_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "programmes_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "policies_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "faqs_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "passes_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "testimonials_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "vibes_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "redirects_id" uuid;
  ALTER TABLE "pages_blocks_hero_heading_lines" ADD CONSTRAINT "pages_blocks_hero_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_image_desktop_id_media_id_fk" FOREIGN KEY ("image_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_image_mobile_id_media_id_fk" FOREIGN KEY ("image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_opening_statement" ADD CONSTRAINT "pages_blocks_opening_statement_panel_image_id_media_id_fk" FOREIGN KEY ("panel_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_opening_statement" ADD CONSTRAINT "pages_blocks_opening_statement_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_experience_carousel_heading_lines" ADD CONSTRAINT "pages_blocks_experience_carousel_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_experience_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_experience_carousel" ADD CONSTRAINT "pages_blocks_experience_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_ways_to_take_part_heading_lines" ADD CONSTRAINT "pages_blocks_ways_to_take_part_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_ways_to_take_part"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_ways_to_take_part_groups_doors" ADD CONSTRAINT "pages_blocks_ways_to_take_part_groups_doors_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_ways_to_take_part_groups_doors" ADD CONSTRAINT "pages_blocks_ways_to_take_part_groups_doors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_ways_to_take_part_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_ways_to_take_part_groups" ADD CONSTRAINT "pages_blocks_ways_to_take_part_groups_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_ways_to_take_part_groups" ADD CONSTRAINT "pages_blocks_ways_to_take_part_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_ways_to_take_part"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_ways_to_take_part" ADD CONSTRAINT "pages_blocks_ways_to_take_part_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_two_ways_roads_facts" ADD CONSTRAINT "pages_blocks_two_ways_roads_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_two_ways_roads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_two_ways_roads" ADD CONSTRAINT "pages_blocks_two_ways_roads_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_two_ways"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_two_ways" ADD CONSTRAINT "pages_blocks_two_ways_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_where_we_create_heading_lines" ADD CONSTRAINT "pages_blocks_where_we_create_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_where_we_create"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_where_we_create" ADD CONSTRAINT "pages_blocks_where_we_create_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_where_we_create" ADD CONSTRAINT "pages_blocks_where_we_create_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_closing_invitation" ADD CONSTRAINT "pages_blocks_closing_invitation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_about_welcome" ADD CONSTRAINT "pages_blocks_about_welcome_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_about_welcome" ADD CONSTRAINT "pages_blocks_about_welcome_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_mission_vision" ADD CONSTRAINT "pages_blocks_mission_vision_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_community_journey" ADD CONSTRAINT "pages_blocks_community_journey_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_what_sets_us_apart_heading_lines" ADD CONSTRAINT "pages_blocks_what_sets_us_apart_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_what_sets_us_apart"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_what_sets_us_apart" ADD CONSTRAINT "pages_blocks_what_sets_us_apart_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_closing_cta_lilac_heading_lines" ADD CONSTRAINT "pages_blocks_closing_cta_lilac_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_closing_cta_lilac"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_closing_cta_lilac" ADD CONSTRAINT "pages_blocks_closing_cta_lilac_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_page_header_heading_lines" ADD CONSTRAINT "pages_blocks_page_header_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_page_header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_page_header" ADD CONSTRAINT "pages_blocks_page_header_side_image_id_media_id_fk" FOREIGN KEY ("side_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_page_header" ADD CONSTRAINT "pages_blocks_page_header_side_image_secondary_id_media_id_fk" FOREIGN KEY ("side_image_secondary_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_page_header" ADD CONSTRAINT "pages_blocks_page_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_list_groups" ADD CONSTRAINT "pages_blocks_faq_list_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_list" ADD CONSTRAINT "pages_blocks_faq_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery_collections_collections" ADD CONSTRAINT "pages_blocks_gallery_collections_collections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_gallery_collections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery_collections" ADD CONSTRAINT "pages_blocks_gallery_collections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_locations_hero" ADD CONSTRAINT "pages_blocks_locations_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact_intro_heading_lines" ADD CONSTRAINT "pages_blocks_contact_intro_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_contact_intro"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact_intro" ADD CONSTRAINT "pages_blocks_contact_intro_portrait_id_media_id_fk" FOREIGN KEY ("portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact_intro" ADD CONSTRAINT "pages_blocks_contact_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_pe_intro_heading_lines" ADD CONSTRAINT "pages_blocks_pe_intro_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_pe_intro"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_pe_intro" ADD CONSTRAINT "pages_blocks_pe_intro_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_pe_intro" ADD CONSTRAINT "pages_blocks_pe_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_programmes_grid_heading_lines" ADD CONSTRAINT "pages_blocks_programmes_grid_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_programmes_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_programmes_grid" ADD CONSTRAINT "pages_blocks_programmes_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_activities_grid_heading_lines" ADD CONSTRAINT "pages_blocks_activities_grid_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_activities_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_activities_grid" ADD CONSTRAINT "pages_blocks_activities_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_venue_spotlight_heading_lines" ADD CONSTRAINT "pages_blocks_venue_spotlight_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_venue_spotlight"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_venue_spotlight" ADD CONSTRAINT "pages_blocks_venue_spotlight_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_venue_spotlight" ADD CONSTRAINT "pages_blocks_venue_spotlight_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_steps_heading_lines" ADD CONSTRAINT "pages_blocks_steps_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_steps_steps" ADD CONSTRAINT "pages_blocks_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_steps" ADD CONSTRAINT "pages_blocks_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_enquiry_form_sidebar_steps_steps" ADD CONSTRAINT "pages_blocks_enquiry_form_sidebar_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_enquiry_form"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_enquiry_form" ADD CONSTRAINT "pages_blocks_enquiry_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_passes_list" ADD CONSTRAINT "pages_blocks_passes_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_policies_index" ADD CONSTRAINT "pages_blocks_policies_index_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_events_browser_doors" ADD CONSTRAINT "pages_blocks_events_browser_doors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_events_browser"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_events_browser" ADD CONSTRAINT "pages_blocks_events_browser_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_where_we_set_up" ADD CONSTRAINT "pages_blocks_where_we_set_up_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_utility_bar_links" ADD CONSTRAINT "pages_blocks_utility_bar_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_utility_bar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_utility_bar" ADD CONSTRAINT "pages_blocks_utility_bar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text" ADD CONSTRAINT "pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_seasonal_moments" ADD CONSTRAINT "pages_blocks_seasonal_moments_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_seasonal_moments" ADD CONSTRAINT "pages_blocks_seasonal_moments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_seasonal"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_seasonal" ADD CONSTRAINT "pages_blocks_seasonal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_workshop_journey_heading_lines" ADD CONSTRAINT "pages_blocks_workshop_journey_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_workshop_journey"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_workshop_journey" ADD CONSTRAINT "pages_blocks_workshop_journey_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_workshop_journey" ADD CONSTRAINT "pages_blocks_workshop_journey_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_pe_teaser_heading_lines" ADD CONSTRAINT "pages_blocks_pe_teaser_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_pe_teaser"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_pe_teaser" ADD CONSTRAINT "pages_blocks_pe_teaser_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_pair" ADD CONSTRAINT "pages_blocks_image_pair_first_id_media_id_fk" FOREIGN KEY ("first_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_pair" ADD CONSTRAINT "pages_blocks_image_pair_second_id_media_id_fk" FOREIGN KEY ("second_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_pair" ADD CONSTRAINT "pages_blocks_image_pair_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_full_bleed_statement" ADD CONSTRAINT "pages_blocks_full_bleed_statement_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_full_bleed_statement" ADD CONSTRAINT "pages_blocks_full_bleed_statement_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_film" ADD CONSTRAINT "pages_blocks_film_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_film" ADD CONSTRAINT "pages_blocks_film_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_film" ADD CONSTRAINT "pages_blocks_film_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_upcoming_sessions" ADD CONSTRAINT "pages_blocks_upcoming_sessions_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_upcoming_sessions" ADD CONSTRAINT "pages_blocks_upcoming_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials" ADD CONSTRAINT "pages_blocks_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_collaborate_teaser_heading_lines" ADD CONSTRAINT "pages_blocks_collaborate_teaser_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_collaborate_teaser"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_collaborate_teaser" ADD CONSTRAINT "pages_blocks_collaborate_teaser_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_venues_fk" FOREIGN KEY ("venues_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_heading_lines" ADD CONSTRAINT "_pages_v_blocks_hero_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_image_desktop_id_media_id_fk" FOREIGN KEY ("image_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_image_mobile_id_media_id_fk" FOREIGN KEY ("image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_opening_statement" ADD CONSTRAINT "_pages_v_blocks_opening_statement_panel_image_id_media_id_fk" FOREIGN KEY ("panel_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_opening_statement" ADD CONSTRAINT "_pages_v_blocks_opening_statement_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_experience_carousel_heading_lines" ADD CONSTRAINT "_pages_v_blocks_experience_carousel_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_experience_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_experience_carousel" ADD CONSTRAINT "_pages_v_blocks_experience_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_ways_to_take_part_heading_lines" ADD CONSTRAINT "_pages_v_blocks_ways_to_take_part_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_ways_to_take_part"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_ways_to_take_part_groups_doors" ADD CONSTRAINT "_pages_v_blocks_ways_to_take_part_groups_doors_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_ways_to_take_part_groups_doors" ADD CONSTRAINT "_pages_v_blocks_ways_to_take_part_groups_doors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_ways_to_take_part_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_ways_to_take_part_groups" ADD CONSTRAINT "_pages_v_blocks_ways_to_take_part_groups_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_ways_to_take_part_groups" ADD CONSTRAINT "_pages_v_blocks_ways_to_take_part_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_ways_to_take_part"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_ways_to_take_part" ADD CONSTRAINT "_pages_v_blocks_ways_to_take_part_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_two_ways_roads_facts" ADD CONSTRAINT "_pages_v_blocks_two_ways_roads_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_two_ways_roads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_two_ways_roads" ADD CONSTRAINT "_pages_v_blocks_two_ways_roads_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_two_ways"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_two_ways" ADD CONSTRAINT "_pages_v_blocks_two_ways_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_where_we_create_heading_lines" ADD CONSTRAINT "_pages_v_blocks_where_we_create_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_where_we_create"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_where_we_create" ADD CONSTRAINT "_pages_v_blocks_where_we_create_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_where_we_create" ADD CONSTRAINT "_pages_v_blocks_where_we_create_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_closing_invitation" ADD CONSTRAINT "_pages_v_blocks_closing_invitation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_about_welcome" ADD CONSTRAINT "_pages_v_blocks_about_welcome_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_about_welcome" ADD CONSTRAINT "_pages_v_blocks_about_welcome_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_mission_vision" ADD CONSTRAINT "_pages_v_blocks_mission_vision_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_community_journey" ADD CONSTRAINT "_pages_v_blocks_community_journey_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_what_sets_us_apart_heading_lines" ADD CONSTRAINT "_pages_v_blocks_what_sets_us_apart_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_what_sets_us_apart"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_what_sets_us_apart" ADD CONSTRAINT "_pages_v_blocks_what_sets_us_apart_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_closing_cta_lilac_heading_lines" ADD CONSTRAINT "_pages_v_blocks_closing_cta_lilac_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_closing_cta_lilac"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_closing_cta_lilac" ADD CONSTRAINT "_pages_v_blocks_closing_cta_lilac_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_header_heading_lines" ADD CONSTRAINT "_pages_v_blocks_page_header_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_page_header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_header" ADD CONSTRAINT "_pages_v_blocks_page_header_side_image_id_media_id_fk" FOREIGN KEY ("side_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_header" ADD CONSTRAINT "_pages_v_blocks_page_header_side_image_secondary_id_media_id_fk" FOREIGN KEY ("side_image_secondary_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_header" ADD CONSTRAINT "_pages_v_blocks_page_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_list_groups" ADD CONSTRAINT "_pages_v_blocks_faq_list_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_list" ADD CONSTRAINT "_pages_v_blocks_faq_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery_collections_collections" ADD CONSTRAINT "_pages_v_blocks_gallery_collections_collections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_gallery_collections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery_collections" ADD CONSTRAINT "_pages_v_blocks_gallery_collections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_locations_hero" ADD CONSTRAINT "_pages_v_blocks_locations_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact_intro_heading_lines" ADD CONSTRAINT "_pages_v_blocks_contact_intro_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_contact_intro"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact_intro" ADD CONSTRAINT "_pages_v_blocks_contact_intro_portrait_id_media_id_fk" FOREIGN KEY ("portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact_intro" ADD CONSTRAINT "_pages_v_blocks_contact_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "__pages_v_blocks_pe_intro_v_heading_lines" ADD CONSTRAINT "__pages_v_blocks_pe_intro_v_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."__pages_v_blocks_pe_intro_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "__pages_v_blocks_pe_intro_v" ADD CONSTRAINT "__pages_v_blocks_pe_intro_v_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "__pages_v_blocks_pe_intro_v" ADD CONSTRAINT "__pages_v_blocks_pe_intro_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_programmes_grid_heading_lines" ADD CONSTRAINT "_pages_v_blocks_programmes_grid_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_programmes_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_programmes_grid" ADD CONSTRAINT "_pages_v_blocks_programmes_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_activities_grid_heading_lines" ADD CONSTRAINT "_pages_v_blocks_activities_grid_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_activities_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_activities_grid" ADD CONSTRAINT "_pages_v_blocks_activities_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_venue_spotlight_heading_lines" ADD CONSTRAINT "_pages_v_blocks_venue_spotlight_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_venue_spotlight"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_venue_spotlight" ADD CONSTRAINT "_pages_v_blocks_venue_spotlight_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_venue_spotlight" ADD CONSTRAINT "_pages_v_blocks_venue_spotlight_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_steps_heading_lines" ADD CONSTRAINT "_pages_v_blocks_steps_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_steps_steps" ADD CONSTRAINT "_pages_v_blocks_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_steps" ADD CONSTRAINT "_pages_v_blocks_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_enquiry_form_sidebar_steps_steps" ADD CONSTRAINT "_pages_v_blocks_enquiry_form_sidebar_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_enquiry_form"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_enquiry_form" ADD CONSTRAINT "_pages_v_blocks_enquiry_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_passes_list" ADD CONSTRAINT "_pages_v_blocks_passes_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_policies_index" ADD CONSTRAINT "_pages_v_blocks_policies_index_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_events_browser_doors" ADD CONSTRAINT "_pages_v_blocks_events_browser_doors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_events_browser"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_events_browser" ADD CONSTRAINT "_pages_v_blocks_events_browser_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_where_we_set_up" ADD CONSTRAINT "_pages_v_blocks_where_we_set_up_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_utility_bar_links" ADD CONSTRAINT "_pages_v_blocks_utility_bar_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_utility_bar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_utility_bar" ADD CONSTRAINT "_pages_v_blocks_utility_bar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD CONSTRAINT "_pages_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_seasonal_moments" ADD CONSTRAINT "_pages_v_blocks_seasonal_moments_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_seasonal_moments" ADD CONSTRAINT "_pages_v_blocks_seasonal_moments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_seasonal"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_seasonal" ADD CONSTRAINT "_pages_v_blocks_seasonal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_workshop_journey_heading_lines" ADD CONSTRAINT "_pages_v_blocks_workshop_journey_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_workshop_journey"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_workshop_journey" ADD CONSTRAINT "_pages_v_blocks_workshop_journey_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_workshop_journey" ADD CONSTRAINT "_pages_v_blocks_workshop_journey_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "__pages_v_blocks_pe_teaser_v_heading_lines" ADD CONSTRAINT "__pages_v_blocks_pe_teaser_v_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."__pages_v_blocks_pe_teaser_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "__pages_v_blocks_pe_teaser_v" ADD CONSTRAINT "__pages_v_blocks_pe_teaser_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image_pair" ADD CONSTRAINT "_pages_v_blocks_image_pair_first_id_media_id_fk" FOREIGN KEY ("first_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image_pair" ADD CONSTRAINT "_pages_v_blocks_image_pair_second_id_media_id_fk" FOREIGN KEY ("second_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image_pair" ADD CONSTRAINT "_pages_v_blocks_image_pair_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_full_bleed_statement" ADD CONSTRAINT "_pages_v_blocks_full_bleed_statement_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_full_bleed_statement" ADD CONSTRAINT "_pages_v_blocks_full_bleed_statement_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_film" ADD CONSTRAINT "_pages_v_blocks_film_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_film" ADD CONSTRAINT "_pages_v_blocks_film_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_film" ADD CONSTRAINT "_pages_v_blocks_film_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_upcoming_sessions" ADD CONSTRAINT "_pages_v_blocks_upcoming_sessions_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_upcoming_sessions" ADD CONSTRAINT "_pages_v_blocks_upcoming_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials" ADD CONSTRAINT "_pages_v_blocks_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_collaborate_teaser_heading_lines" ADD CONSTRAINT "_pages_v_blocks_collaborate_teaser_heading_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_collaborate_teaser"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_collaborate_teaser" ADD CONSTRAINT "_pages_v_blocks_collaborate_teaser_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_venues_fk" FOREIGN KEY ("venues_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experiences_about" ADD CONSTRAINT "experiences_about_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experiences" ADD CONSTRAINT "experiences_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "experiences" ADD CONSTRAINT "experiences_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "experiences_rels" ADD CONSTRAINT "experiences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experiences_rels" ADD CONSTRAINT "experiences_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experiences_rels" ADD CONSTRAINT "experiences_rels_vibes_fk" FOREIGN KEY ("vibes_id") REFERENCES "public"."vibes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v_version_about" ADD CONSTRAINT "_experiences_v_version_about_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_experiences_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v" ADD CONSTRAINT "_experiences_v_parent_id_experiences_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experiences_v" ADD CONSTRAINT "_experiences_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experiences_v" ADD CONSTRAINT "_experiences_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experiences_v_rels" ADD CONSTRAINT "_experiences_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_experiences_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v_rels" ADD CONSTRAINT "_experiences_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v_rels" ADD CONSTRAINT "_experiences_v_rels_vibes_fk" FOREIGN KEY ("vibes_id") REFERENCES "public"."vibes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sessions_about" ADD CONSTRAINT "sessions_about_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sessions_rels" ADD CONSTRAINT "sessions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sessions_rels" ADD CONSTRAINT "sessions_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sessions_v_version_about" ADD CONSTRAINT "_sessions_v_version_about_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sessions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sessions_v" ADD CONSTRAINT "_sessions_v_parent_id_sessions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sessions_v" ADD CONSTRAINT "_sessions_v_version_experience_id_experiences_id_fk" FOREIGN KEY ("version_experience_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sessions_v" ADD CONSTRAINT "_sessions_v_version_venue_id_venues_id_fk" FOREIGN KEY ("version_venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sessions_v" ADD CONSTRAINT "_sessions_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sessions_v" ADD CONSTRAINT "_sessions_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sessions_v_rels" ADD CONSTRAINT "_sessions_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_sessions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sessions_v_rels" ADD CONSTRAINT "_sessions_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "session_inventory" ADD CONSTRAINT "session_inventory_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "venues_address" ADD CONSTRAINT "venues_address_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "venues_hours" ADD CONSTRAINT "venues_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "venues" ADD CONSTRAINT "venues_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "venues" ADD CONSTRAINT "venues_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programmes" ADD CONSTRAINT "programmes_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programmes" ADD CONSTRAINT "programmes_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_programmes_v" ADD CONSTRAINT "_programmes_v_parent_id_programmes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."programmes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_programmes_v" ADD CONSTRAINT "_programmes_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_programmes_v" ADD CONSTRAINT "_programmes_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "policies_blocks_text" ADD CONSTRAINT "policies_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "policies_blocks_list_items" ADD CONSTRAINT "policies_blocks_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."policies_blocks_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "policies_blocks_list" ADD CONSTRAINT "policies_blocks_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "policies_blocks_ages_rows" ADD CONSTRAINT "policies_blocks_ages_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."policies_blocks_ages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "policies_blocks_ages" ADD CONSTRAINT "policies_blocks_ages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "policies_blocks_callout" ADD CONSTRAINT "policies_blocks_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "policies_sections" ADD CONSTRAINT "policies_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "policies" ADD CONSTRAINT "policies_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_policies_v_blocks_text" ADD CONSTRAINT "_policies_v_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_policies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_policies_v_blocks_list_items" ADD CONSTRAINT "_policies_v_blocks_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_policies_v_blocks_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_policies_v_blocks_list" ADD CONSTRAINT "_policies_v_blocks_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_policies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_policies_v_blocks_ages_rows" ADD CONSTRAINT "_policies_v_blocks_ages_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_policies_v_blocks_ages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_policies_v_blocks_ages" ADD CONSTRAINT "_policies_v_blocks_ages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_policies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_policies_v_blocks_callout" ADD CONSTRAINT "_policies_v_blocks_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_policies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_policies_v_version_sections" ADD CONSTRAINT "_policies_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_policies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_policies_v" ADD CONSTRAINT "_policies_v_parent_id_policies_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."policies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_policies_v" ADD CONSTRAINT "_policies_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_faqs_v" ADD CONSTRAINT "_faqs_v_parent_id_faqs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."faqs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passes_benefits" ADD CONSTRAINT "passes_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."passes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "passes" ADD CONSTRAINT "passes_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_passes_v_version_benefits" ADD CONSTRAINT "_passes_v_version_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_passes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_passes_v" ADD CONSTRAINT "_passes_v_parent_id_passes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."passes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_passes_v" ADD CONSTRAINT "_passes_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_testimonials_v" ADD CONSTRAINT "_testimonials_v_parent_id_testimonials_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."testimonials"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_testimonials_v" ADD CONSTRAINT "_testimonials_v_version_experience_id_experiences_id_fk" FOREIGN KEY ("version_experience_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_heading_lines_order_idx" ON "pages_blocks_hero_heading_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_heading_lines_parent_id_idx" ON "pages_blocks_hero_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_image_desktop_idx" ON "pages_blocks_hero" USING btree ("image_desktop_id");
  CREATE INDEX "pages_blocks_hero_image_mobile_idx" ON "pages_blocks_hero" USING btree ("image_mobile_id");
  CREATE INDEX "pages_blocks_opening_statement_order_idx" ON "pages_blocks_opening_statement" USING btree ("_order");
  CREATE INDEX "pages_blocks_opening_statement_parent_id_idx" ON "pages_blocks_opening_statement" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_opening_statement_path_idx" ON "pages_blocks_opening_statement" USING btree ("_path");
  CREATE INDEX "pages_blocks_opening_statement_panel_image_idx" ON "pages_blocks_opening_statement" USING btree ("panel_image_id");
  CREATE INDEX "pages_blocks_experience_carousel_heading_lines_order_idx" ON "pages_blocks_experience_carousel_heading_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_experience_carousel_heading_lines_parent_id_idx" ON "pages_blocks_experience_carousel_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_experience_carousel_order_idx" ON "pages_blocks_experience_carousel" USING btree ("_order");
  CREATE INDEX "pages_blocks_experience_carousel_parent_id_idx" ON "pages_blocks_experience_carousel" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_experience_carousel_path_idx" ON "pages_blocks_experience_carousel" USING btree ("_path");
  CREATE INDEX "pages_blocks_ways_to_take_part_heading_lines_order_idx" ON "pages_blocks_ways_to_take_part_heading_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_ways_to_take_part_heading_lines_parent_id_idx" ON "pages_blocks_ways_to_take_part_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_ways_to_take_part_groups_doors_order_idx" ON "pages_blocks_ways_to_take_part_groups_doors" USING btree ("_order");
  CREATE INDEX "pages_blocks_ways_to_take_part_groups_doors_parent_id_idx" ON "pages_blocks_ways_to_take_part_groups_doors" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_ways_to_take_part_groups_doors_programme_idx" ON "pages_blocks_ways_to_take_part_groups_doors" USING btree ("programme_id");
  CREATE INDEX "pages_blocks_ways_to_take_part_groups_order_idx" ON "pages_blocks_ways_to_take_part_groups" USING btree ("_order");
  CREATE INDEX "pages_blocks_ways_to_take_part_groups_parent_id_idx" ON "pages_blocks_ways_to_take_part_groups" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_ways_to_take_part_groups_photo_idx" ON "pages_blocks_ways_to_take_part_groups" USING btree ("photo_id");
  CREATE INDEX "pages_blocks_ways_to_take_part_order_idx" ON "pages_blocks_ways_to_take_part" USING btree ("_order");
  CREATE INDEX "pages_blocks_ways_to_take_part_parent_id_idx" ON "pages_blocks_ways_to_take_part" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_ways_to_take_part_path_idx" ON "pages_blocks_ways_to_take_part" USING btree ("_path");
  CREATE INDEX "pages_blocks_two_ways_roads_facts_order_idx" ON "pages_blocks_two_ways_roads_facts" USING btree ("_order");
  CREATE INDEX "pages_blocks_two_ways_roads_facts_parent_id_idx" ON "pages_blocks_two_ways_roads_facts" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_two_ways_roads_order_idx" ON "pages_blocks_two_ways_roads" USING btree ("_order");
  CREATE INDEX "pages_blocks_two_ways_roads_parent_id_idx" ON "pages_blocks_two_ways_roads" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_two_ways_order_idx" ON "pages_blocks_two_ways" USING btree ("_order");
  CREATE INDEX "pages_blocks_two_ways_parent_id_idx" ON "pages_blocks_two_ways" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_two_ways_path_idx" ON "pages_blocks_two_ways" USING btree ("_path");
  CREATE INDEX "pages_blocks_where_we_create_heading_lines_order_idx" ON "pages_blocks_where_we_create_heading_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_where_we_create_heading_lines_parent_id_idx" ON "pages_blocks_where_we_create_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_where_we_create_order_idx" ON "pages_blocks_where_we_create" USING btree ("_order");
  CREATE INDEX "pages_blocks_where_we_create_parent_id_idx" ON "pages_blocks_where_we_create" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_where_we_create_path_idx" ON "pages_blocks_where_we_create" USING btree ("_path");
  CREATE INDEX "pages_blocks_where_we_create_venue_idx" ON "pages_blocks_where_we_create" USING btree ("venue_id");
  CREATE INDEX "pages_blocks_closing_invitation_order_idx" ON "pages_blocks_closing_invitation" USING btree ("_order");
  CREATE INDEX "pages_blocks_closing_invitation_parent_id_idx" ON "pages_blocks_closing_invitation" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_closing_invitation_path_idx" ON "pages_blocks_closing_invitation" USING btree ("_path");
  CREATE INDEX "pages_blocks_about_welcome_order_idx" ON "pages_blocks_about_welcome" USING btree ("_order");
  CREATE INDEX "pages_blocks_about_welcome_parent_id_idx" ON "pages_blocks_about_welcome" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_about_welcome_path_idx" ON "pages_blocks_about_welcome" USING btree ("_path");
  CREATE INDEX "pages_blocks_about_welcome_image_idx" ON "pages_blocks_about_welcome" USING btree ("image_id");
  CREATE INDEX "pages_blocks_mission_vision_order_idx" ON "pages_blocks_mission_vision" USING btree ("_order");
  CREATE INDEX "pages_blocks_mission_vision_parent_id_idx" ON "pages_blocks_mission_vision" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_mission_vision_path_idx" ON "pages_blocks_mission_vision" USING btree ("_path");
  CREATE INDEX "pages_blocks_community_journey_order_idx" ON "pages_blocks_community_journey" USING btree ("_order");
  CREATE INDEX "pages_blocks_community_journey_parent_id_idx" ON "pages_blocks_community_journey" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_community_journey_path_idx" ON "pages_blocks_community_journey" USING btree ("_path");
  CREATE INDEX "pages_blocks_what_sets_us_apart_heading_lines_order_idx" ON "pages_blocks_what_sets_us_apart_heading_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_what_sets_us_apart_heading_lines_parent_id_idx" ON "pages_blocks_what_sets_us_apart_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_what_sets_us_apart_order_idx" ON "pages_blocks_what_sets_us_apart" USING btree ("_order");
  CREATE INDEX "pages_blocks_what_sets_us_apart_parent_id_idx" ON "pages_blocks_what_sets_us_apart" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_what_sets_us_apart_path_idx" ON "pages_blocks_what_sets_us_apart" USING btree ("_path");
  CREATE INDEX "pages_blocks_closing_cta_lilac_heading_lines_order_idx" ON "pages_blocks_closing_cta_lilac_heading_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_closing_cta_lilac_heading_lines_parent_id_idx" ON "pages_blocks_closing_cta_lilac_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_closing_cta_lilac_order_idx" ON "pages_blocks_closing_cta_lilac" USING btree ("_order");
  CREATE INDEX "pages_blocks_closing_cta_lilac_parent_id_idx" ON "pages_blocks_closing_cta_lilac" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_closing_cta_lilac_path_idx" ON "pages_blocks_closing_cta_lilac" USING btree ("_path");
  CREATE INDEX "pages_blocks_page_header_heading_lines_order_idx" ON "pages_blocks_page_header_heading_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_page_header_heading_lines_parent_id_idx" ON "pages_blocks_page_header_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_page_header_order_idx" ON "pages_blocks_page_header" USING btree ("_order");
  CREATE INDEX "pages_blocks_page_header_parent_id_idx" ON "pages_blocks_page_header" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_page_header_path_idx" ON "pages_blocks_page_header" USING btree ("_path");
  CREATE INDEX "pages_blocks_page_header_side_image_idx" ON "pages_blocks_page_header" USING btree ("side_image_id");
  CREATE INDEX "pages_blocks_page_header_side_image_secondary_idx" ON "pages_blocks_page_header" USING btree ("side_image_secondary_id");
  CREATE INDEX "pages_blocks_faq_list_groups_order_idx" ON "pages_blocks_faq_list_groups" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_list_groups_parent_id_idx" ON "pages_blocks_faq_list_groups" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_list_order_idx" ON "pages_blocks_faq_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_list_parent_id_idx" ON "pages_blocks_faq_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_list_path_idx" ON "pages_blocks_faq_list" USING btree ("_path");
  CREATE INDEX "pages_blocks_gallery_collections_collections_order_idx" ON "pages_blocks_gallery_collections_collections" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_collections_collections_parent_id_idx" ON "pages_blocks_gallery_collections_collections" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_collections_order_idx" ON "pages_blocks_gallery_collections" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_collections_parent_id_idx" ON "pages_blocks_gallery_collections" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_collections_path_idx" ON "pages_blocks_gallery_collections" USING btree ("_path");
  CREATE INDEX "pages_blocks_locations_hero_order_idx" ON "pages_blocks_locations_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_locations_hero_parent_id_idx" ON "pages_blocks_locations_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_locations_hero_path_idx" ON "pages_blocks_locations_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_contact_intro_heading_lines_order_idx" ON "pages_blocks_contact_intro_heading_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_contact_intro_heading_lines_parent_id_idx" ON "pages_blocks_contact_intro_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_contact_intro_order_idx" ON "pages_blocks_contact_intro" USING btree ("_order");
  CREATE INDEX "pages_blocks_contact_intro_parent_id_idx" ON "pages_blocks_contact_intro" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_contact_intro_path_idx" ON "pages_blocks_contact_intro" USING btree ("_path");
  CREATE INDEX "pages_blocks_contact_intro_portrait_idx" ON "pages_blocks_contact_intro" USING btree ("portrait_id");
  CREATE INDEX "pages_blocks_pe_intro_heading_lines_order_idx" ON "pages_blocks_pe_intro_heading_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_pe_intro_heading_lines_parent_id_idx" ON "pages_blocks_pe_intro_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pe_intro_order_idx" ON "pages_blocks_pe_intro" USING btree ("_order");
  CREATE INDEX "pages_blocks_pe_intro_parent_id_idx" ON "pages_blocks_pe_intro" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pe_intro_path_idx" ON "pages_blocks_pe_intro" USING btree ("_path");
  CREATE INDEX "pages_blocks_pe_intro_image_idx" ON "pages_blocks_pe_intro" USING btree ("image_id");
  CREATE INDEX "pages_blocks_programmes_grid_heading_lines_order_idx" ON "pages_blocks_programmes_grid_heading_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_programmes_grid_heading_lines_parent_id_idx" ON "pages_blocks_programmes_grid_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_programmes_grid_order_idx" ON "pages_blocks_programmes_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_programmes_grid_parent_id_idx" ON "pages_blocks_programmes_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_programmes_grid_path_idx" ON "pages_blocks_programmes_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_activities_grid_heading_lines_order_idx" ON "pages_blocks_activities_grid_heading_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_activities_grid_heading_lines_parent_id_idx" ON "pages_blocks_activities_grid_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_activities_grid_order_idx" ON "pages_blocks_activities_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_activities_grid_parent_id_idx" ON "pages_blocks_activities_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_activities_grid_path_idx" ON "pages_blocks_activities_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_venue_spotlight_heading_lines_order_idx" ON "pages_blocks_venue_spotlight_heading_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_venue_spotlight_heading_lines_parent_id_idx" ON "pages_blocks_venue_spotlight_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_venue_spotlight_order_idx" ON "pages_blocks_venue_spotlight" USING btree ("_order");
  CREATE INDEX "pages_blocks_venue_spotlight_parent_id_idx" ON "pages_blocks_venue_spotlight" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_venue_spotlight_path_idx" ON "pages_blocks_venue_spotlight" USING btree ("_path");
  CREATE INDEX "pages_blocks_venue_spotlight_venue_idx" ON "pages_blocks_venue_spotlight" USING btree ("venue_id");
  CREATE INDEX "pages_blocks_steps_heading_lines_order_idx" ON "pages_blocks_steps_heading_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_steps_heading_lines_parent_id_idx" ON "pages_blocks_steps_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_steps_steps_order_idx" ON "pages_blocks_steps_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_steps_steps_parent_id_idx" ON "pages_blocks_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_steps_order_idx" ON "pages_blocks_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_steps_parent_id_idx" ON "pages_blocks_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_steps_path_idx" ON "pages_blocks_steps" USING btree ("_path");
  CREATE INDEX "pages_blocks_enquiry_form_sidebar_steps_steps_order_idx" ON "pages_blocks_enquiry_form_sidebar_steps_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_enquiry_form_sidebar_steps_steps_parent_id_idx" ON "pages_blocks_enquiry_form_sidebar_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_enquiry_form_order_idx" ON "pages_blocks_enquiry_form" USING btree ("_order");
  CREATE INDEX "pages_blocks_enquiry_form_parent_id_idx" ON "pages_blocks_enquiry_form" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_enquiry_form_path_idx" ON "pages_blocks_enquiry_form" USING btree ("_path");
  CREATE INDEX "pages_blocks_passes_list_order_idx" ON "pages_blocks_passes_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_passes_list_parent_id_idx" ON "pages_blocks_passes_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_passes_list_path_idx" ON "pages_blocks_passes_list" USING btree ("_path");
  CREATE INDEX "pages_blocks_policies_index_order_idx" ON "pages_blocks_policies_index" USING btree ("_order");
  CREATE INDEX "pages_blocks_policies_index_parent_id_idx" ON "pages_blocks_policies_index" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_policies_index_path_idx" ON "pages_blocks_policies_index" USING btree ("_path");
  CREATE INDEX "pages_blocks_events_browser_doors_order_idx" ON "pages_blocks_events_browser_doors" USING btree ("_order");
  CREATE INDEX "pages_blocks_events_browser_doors_parent_id_idx" ON "pages_blocks_events_browser_doors" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_events_browser_order_idx" ON "pages_blocks_events_browser" USING btree ("_order");
  CREATE INDEX "pages_blocks_events_browser_parent_id_idx" ON "pages_blocks_events_browser" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_events_browser_path_idx" ON "pages_blocks_events_browser" USING btree ("_path");
  CREATE INDEX "pages_blocks_where_we_set_up_order_idx" ON "pages_blocks_where_we_set_up" USING btree ("_order");
  CREATE INDEX "pages_blocks_where_we_set_up_parent_id_idx" ON "pages_blocks_where_we_set_up" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_where_we_set_up_path_idx" ON "pages_blocks_where_we_set_up" USING btree ("_path");
  CREATE INDEX "pages_blocks_utility_bar_links_order_idx" ON "pages_blocks_utility_bar_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_utility_bar_links_parent_id_idx" ON "pages_blocks_utility_bar_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_utility_bar_order_idx" ON "pages_blocks_utility_bar" USING btree ("_order");
  CREATE INDEX "pages_blocks_utility_bar_parent_id_idx" ON "pages_blocks_utility_bar" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_utility_bar_path_idx" ON "pages_blocks_utility_bar" USING btree ("_path");
  CREATE INDEX "pages_blocks_rich_text_order_idx" ON "pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_parent_id_idx" ON "pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_path_idx" ON "pages_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_seasonal_moments_order_idx" ON "pages_blocks_seasonal_moments" USING btree ("_order");
  CREATE INDEX "pages_blocks_seasonal_moments_parent_id_idx" ON "pages_blocks_seasonal_moments" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_seasonal_moments_image_idx" ON "pages_blocks_seasonal_moments" USING btree ("image_id");
  CREATE INDEX "pages_blocks_seasonal_order_idx" ON "pages_blocks_seasonal" USING btree ("_order");
  CREATE INDEX "pages_blocks_seasonal_parent_id_idx" ON "pages_blocks_seasonal" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_seasonal_path_idx" ON "pages_blocks_seasonal" USING btree ("_path");
  CREATE INDEX "pages_blocks_workshop_journey_heading_lines_order_idx" ON "pages_blocks_workshop_journey_heading_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_workshop_journey_heading_lines_parent_id_idx" ON "pages_blocks_workshop_journey_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_workshop_journey_order_idx" ON "pages_blocks_workshop_journey" USING btree ("_order");
  CREATE INDEX "pages_blocks_workshop_journey_parent_id_idx" ON "pages_blocks_workshop_journey" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_workshop_journey_path_idx" ON "pages_blocks_workshop_journey" USING btree ("_path");
  CREATE INDEX "pages_blocks_workshop_journey_image_idx" ON "pages_blocks_workshop_journey" USING btree ("image_id");
  CREATE INDEX "pages_blocks_pe_teaser_heading_lines_order_idx" ON "pages_blocks_pe_teaser_heading_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_pe_teaser_heading_lines_parent_id_idx" ON "pages_blocks_pe_teaser_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pe_teaser_order_idx" ON "pages_blocks_pe_teaser" USING btree ("_order");
  CREATE INDEX "pages_blocks_pe_teaser_parent_id_idx" ON "pages_blocks_pe_teaser" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pe_teaser_path_idx" ON "pages_blocks_pe_teaser" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_pair_order_idx" ON "pages_blocks_image_pair" USING btree ("_order");
  CREATE INDEX "pages_blocks_image_pair_parent_id_idx" ON "pages_blocks_image_pair" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_image_pair_path_idx" ON "pages_blocks_image_pair" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_pair_first_idx" ON "pages_blocks_image_pair" USING btree ("first_id");
  CREATE INDEX "pages_blocks_image_pair_second_idx" ON "pages_blocks_image_pair" USING btree ("second_id");
  CREATE INDEX "pages_blocks_full_bleed_statement_order_idx" ON "pages_blocks_full_bleed_statement" USING btree ("_order");
  CREATE INDEX "pages_blocks_full_bleed_statement_parent_id_idx" ON "pages_blocks_full_bleed_statement" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_full_bleed_statement_path_idx" ON "pages_blocks_full_bleed_statement" USING btree ("_path");
  CREATE INDEX "pages_blocks_full_bleed_statement_image_idx" ON "pages_blocks_full_bleed_statement" USING btree ("image_id");
  CREATE INDEX "pages_blocks_film_order_idx" ON "pages_blocks_film" USING btree ("_order");
  CREATE INDEX "pages_blocks_film_parent_id_idx" ON "pages_blocks_film" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_film_path_idx" ON "pages_blocks_film" USING btree ("_path");
  CREATE INDEX "pages_blocks_film_video_idx" ON "pages_blocks_film" USING btree ("video_id");
  CREATE INDEX "pages_blocks_film_poster_idx" ON "pages_blocks_film" USING btree ("poster_id");
  CREATE INDEX "pages_blocks_upcoming_sessions_order_idx" ON "pages_blocks_upcoming_sessions" USING btree ("_order");
  CREATE INDEX "pages_blocks_upcoming_sessions_parent_id_idx" ON "pages_blocks_upcoming_sessions" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_upcoming_sessions_path_idx" ON "pages_blocks_upcoming_sessions" USING btree ("_path");
  CREATE INDEX "pages_blocks_upcoming_sessions_experience_idx" ON "pages_blocks_upcoming_sessions" USING btree ("experience_id");
  CREATE INDEX "pages_blocks_testimonials_order_idx" ON "pages_blocks_testimonials" USING btree ("_order");
  CREATE INDEX "pages_blocks_testimonials_parent_id_idx" ON "pages_blocks_testimonials" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_testimonials_path_idx" ON "pages_blocks_testimonials" USING btree ("_path");
  CREATE INDEX "pages_blocks_collaborate_teaser_heading_lines_order_idx" ON "pages_blocks_collaborate_teaser_heading_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_collaborate_teaser_heading_lines_parent_id_idx" ON "pages_blocks_collaborate_teaser_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_collaborate_teaser_order_idx" ON "pages_blocks_collaborate_teaser" USING btree ("_order");
  CREATE INDEX "pages_blocks_collaborate_teaser_parent_id_idx" ON "pages_blocks_collaborate_teaser" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_collaborate_teaser_path_idx" ON "pages_blocks_collaborate_teaser" USING btree ("_path");
  CREATE INDEX "pages_meta_meta_image_idx" ON "pages" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_experiences_id_idx" ON "pages_rels" USING btree ("experiences_id");
  CREATE INDEX "pages_rels_media_id_idx" ON "pages_rels" USING btree ("media_id");
  CREATE INDEX "pages_rels_venues_id_idx" ON "pages_rels" USING btree ("venues_id");
  CREATE INDEX "pages_rels_testimonials_id_idx" ON "pages_rels" USING btree ("testimonials_id");
  CREATE INDEX "_pages_v_blocks_hero_heading_lines_order_idx" ON "_pages_v_blocks_hero_heading_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_heading_lines_parent_id_idx" ON "_pages_v_blocks_hero_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_order_idx" ON "_pages_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_parent_id_idx" ON "_pages_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_path_idx" ON "_pages_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_image_desktop_idx" ON "_pages_v_blocks_hero" USING btree ("image_desktop_id");
  CREATE INDEX "_pages_v_blocks_hero_image_mobile_idx" ON "_pages_v_blocks_hero" USING btree ("image_mobile_id");
  CREATE INDEX "_pages_v_blocks_opening_statement_order_idx" ON "_pages_v_blocks_opening_statement" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_opening_statement_parent_id_idx" ON "_pages_v_blocks_opening_statement" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_opening_statement_path_idx" ON "_pages_v_blocks_opening_statement" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_opening_statement_panel_image_idx" ON "_pages_v_blocks_opening_statement" USING btree ("panel_image_id");
  CREATE INDEX "_pages_v_blocks_experience_carousel_heading_lines_order_idx" ON "_pages_v_blocks_experience_carousel_heading_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_experience_carousel_heading_lines_parent_id_idx" ON "_pages_v_blocks_experience_carousel_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_experience_carousel_order_idx" ON "_pages_v_blocks_experience_carousel" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_experience_carousel_parent_id_idx" ON "_pages_v_blocks_experience_carousel" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_experience_carousel_path_idx" ON "_pages_v_blocks_experience_carousel" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_ways_to_take_part_heading_lines_order_idx" ON "_pages_v_blocks_ways_to_take_part_heading_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_ways_to_take_part_heading_lines_parent_id_idx" ON "_pages_v_blocks_ways_to_take_part_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_ways_to_take_part_groups_doors_order_idx" ON "_pages_v_blocks_ways_to_take_part_groups_doors" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_ways_to_take_part_groups_doors_parent_id_idx" ON "_pages_v_blocks_ways_to_take_part_groups_doors" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_ways_to_take_part_groups_doors_programme_idx" ON "_pages_v_blocks_ways_to_take_part_groups_doors" USING btree ("programme_id");
  CREATE INDEX "_pages_v_blocks_ways_to_take_part_groups_order_idx" ON "_pages_v_blocks_ways_to_take_part_groups" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_ways_to_take_part_groups_parent_id_idx" ON "_pages_v_blocks_ways_to_take_part_groups" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_ways_to_take_part_groups_photo_idx" ON "_pages_v_blocks_ways_to_take_part_groups" USING btree ("photo_id");
  CREATE INDEX "_pages_v_blocks_ways_to_take_part_order_idx" ON "_pages_v_blocks_ways_to_take_part" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_ways_to_take_part_parent_id_idx" ON "_pages_v_blocks_ways_to_take_part" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_ways_to_take_part_path_idx" ON "_pages_v_blocks_ways_to_take_part" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_two_ways_roads_facts_order_idx" ON "_pages_v_blocks_two_ways_roads_facts" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_two_ways_roads_facts_parent_id_idx" ON "_pages_v_blocks_two_ways_roads_facts" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_two_ways_roads_order_idx" ON "_pages_v_blocks_two_ways_roads" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_two_ways_roads_parent_id_idx" ON "_pages_v_blocks_two_ways_roads" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_two_ways_order_idx" ON "_pages_v_blocks_two_ways" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_two_ways_parent_id_idx" ON "_pages_v_blocks_two_ways" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_two_ways_path_idx" ON "_pages_v_blocks_two_ways" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_where_we_create_heading_lines_order_idx" ON "_pages_v_blocks_where_we_create_heading_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_where_we_create_heading_lines_parent_id_idx" ON "_pages_v_blocks_where_we_create_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_where_we_create_order_idx" ON "_pages_v_blocks_where_we_create" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_where_we_create_parent_id_idx" ON "_pages_v_blocks_where_we_create" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_where_we_create_path_idx" ON "_pages_v_blocks_where_we_create" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_where_we_create_venue_idx" ON "_pages_v_blocks_where_we_create" USING btree ("venue_id");
  CREATE INDEX "_pages_v_blocks_closing_invitation_order_idx" ON "_pages_v_blocks_closing_invitation" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_closing_invitation_parent_id_idx" ON "_pages_v_blocks_closing_invitation" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_closing_invitation_path_idx" ON "_pages_v_blocks_closing_invitation" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_about_welcome_order_idx" ON "_pages_v_blocks_about_welcome" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_about_welcome_parent_id_idx" ON "_pages_v_blocks_about_welcome" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_about_welcome_path_idx" ON "_pages_v_blocks_about_welcome" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_about_welcome_image_idx" ON "_pages_v_blocks_about_welcome" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_mission_vision_order_idx" ON "_pages_v_blocks_mission_vision" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_mission_vision_parent_id_idx" ON "_pages_v_blocks_mission_vision" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_mission_vision_path_idx" ON "_pages_v_blocks_mission_vision" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_community_journey_order_idx" ON "_pages_v_blocks_community_journey" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_community_journey_parent_id_idx" ON "_pages_v_blocks_community_journey" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_community_journey_path_idx" ON "_pages_v_blocks_community_journey" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_what_sets_us_apart_heading_lines_order_idx" ON "_pages_v_blocks_what_sets_us_apart_heading_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_what_sets_us_apart_heading_lines_parent_id_idx" ON "_pages_v_blocks_what_sets_us_apart_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_what_sets_us_apart_order_idx" ON "_pages_v_blocks_what_sets_us_apart" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_what_sets_us_apart_parent_id_idx" ON "_pages_v_blocks_what_sets_us_apart" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_what_sets_us_apart_path_idx" ON "_pages_v_blocks_what_sets_us_apart" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_closing_cta_lilac_heading_lines_order_idx" ON "_pages_v_blocks_closing_cta_lilac_heading_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_closing_cta_lilac_heading_lines_parent_id_idx" ON "_pages_v_blocks_closing_cta_lilac_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_closing_cta_lilac_order_idx" ON "_pages_v_blocks_closing_cta_lilac" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_closing_cta_lilac_parent_id_idx" ON "_pages_v_blocks_closing_cta_lilac" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_closing_cta_lilac_path_idx" ON "_pages_v_blocks_closing_cta_lilac" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_page_header_heading_lines_order_idx" ON "_pages_v_blocks_page_header_heading_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_page_header_heading_lines_parent_id_idx" ON "_pages_v_blocks_page_header_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_page_header_order_idx" ON "_pages_v_blocks_page_header" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_page_header_parent_id_idx" ON "_pages_v_blocks_page_header" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_page_header_path_idx" ON "_pages_v_blocks_page_header" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_page_header_side_image_idx" ON "_pages_v_blocks_page_header" USING btree ("side_image_id");
  CREATE INDEX "_pages_v_blocks_page_header_side_image_secondary_idx" ON "_pages_v_blocks_page_header" USING btree ("side_image_secondary_id");
  CREATE INDEX "_pages_v_blocks_faq_list_groups_order_idx" ON "_pages_v_blocks_faq_list_groups" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_list_groups_parent_id_idx" ON "_pages_v_blocks_faq_list_groups" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_list_order_idx" ON "_pages_v_blocks_faq_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_list_parent_id_idx" ON "_pages_v_blocks_faq_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_list_path_idx" ON "_pages_v_blocks_faq_list" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_gallery_collections_collections_order_idx" ON "_pages_v_blocks_gallery_collections_collections" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_collections_collections_parent_id_idx" ON "_pages_v_blocks_gallery_collections_collections" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_collections_order_idx" ON "_pages_v_blocks_gallery_collections" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_collections_parent_id_idx" ON "_pages_v_blocks_gallery_collections" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_collections_path_idx" ON "_pages_v_blocks_gallery_collections" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_locations_hero_order_idx" ON "_pages_v_blocks_locations_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_locations_hero_parent_id_idx" ON "_pages_v_blocks_locations_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_locations_hero_path_idx" ON "_pages_v_blocks_locations_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_contact_intro_heading_lines_order_idx" ON "_pages_v_blocks_contact_intro_heading_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_contact_intro_heading_lines_parent_id_idx" ON "_pages_v_blocks_contact_intro_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_contact_intro_order_idx" ON "_pages_v_blocks_contact_intro" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_contact_intro_parent_id_idx" ON "_pages_v_blocks_contact_intro" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_contact_intro_path_idx" ON "_pages_v_blocks_contact_intro" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_contact_intro_portrait_idx" ON "_pages_v_blocks_contact_intro" USING btree ("portrait_id");
  CREATE INDEX "__pages_v_blocks_pe_intro_v_heading_lines_order_idx" ON "__pages_v_blocks_pe_intro_v_heading_lines" USING btree ("_order");
  CREATE INDEX "__pages_v_blocks_pe_intro_v_heading_lines_parent_id_idx" ON "__pages_v_blocks_pe_intro_v_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "__pages_v_blocks_pe_intro_v_order_idx" ON "__pages_v_blocks_pe_intro_v" USING btree ("_order");
  CREATE INDEX "__pages_v_blocks_pe_intro_v_parent_id_idx" ON "__pages_v_blocks_pe_intro_v" USING btree ("_parent_id");
  CREATE INDEX "__pages_v_blocks_pe_intro_v_path_idx" ON "__pages_v_blocks_pe_intro_v" USING btree ("_path");
  CREATE INDEX "__pages_v_blocks_pe_intro_v_image_idx" ON "__pages_v_blocks_pe_intro_v" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_programmes_grid_heading_lines_order_idx" ON "_pages_v_blocks_programmes_grid_heading_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_programmes_grid_heading_lines_parent_id_idx" ON "_pages_v_blocks_programmes_grid_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_programmes_grid_order_idx" ON "_pages_v_blocks_programmes_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_programmes_grid_parent_id_idx" ON "_pages_v_blocks_programmes_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_programmes_grid_path_idx" ON "_pages_v_blocks_programmes_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_activities_grid_heading_lines_order_idx" ON "_pages_v_blocks_activities_grid_heading_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_activities_grid_heading_lines_parent_id_idx" ON "_pages_v_blocks_activities_grid_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_activities_grid_order_idx" ON "_pages_v_blocks_activities_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_activities_grid_parent_id_idx" ON "_pages_v_blocks_activities_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_activities_grid_path_idx" ON "_pages_v_blocks_activities_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_venue_spotlight_heading_lines_order_idx" ON "_pages_v_blocks_venue_spotlight_heading_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_venue_spotlight_heading_lines_parent_id_idx" ON "_pages_v_blocks_venue_spotlight_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_venue_spotlight_order_idx" ON "_pages_v_blocks_venue_spotlight" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_venue_spotlight_parent_id_idx" ON "_pages_v_blocks_venue_spotlight" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_venue_spotlight_path_idx" ON "_pages_v_blocks_venue_spotlight" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_venue_spotlight_venue_idx" ON "_pages_v_blocks_venue_spotlight" USING btree ("venue_id");
  CREATE INDEX "_pages_v_blocks_steps_heading_lines_order_idx" ON "_pages_v_blocks_steps_heading_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_steps_heading_lines_parent_id_idx" ON "_pages_v_blocks_steps_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_steps_order_idx" ON "_pages_v_blocks_steps_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_steps_steps_parent_id_idx" ON "_pages_v_blocks_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_order_idx" ON "_pages_v_blocks_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_steps_parent_id_idx" ON "_pages_v_blocks_steps" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_path_idx" ON "_pages_v_blocks_steps" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_enquiry_form_sidebar_steps_steps_order_idx" ON "_pages_v_blocks_enquiry_form_sidebar_steps_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_enquiry_form_sidebar_steps_steps_parent_id_idx" ON "_pages_v_blocks_enquiry_form_sidebar_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_enquiry_form_order_idx" ON "_pages_v_blocks_enquiry_form" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_enquiry_form_parent_id_idx" ON "_pages_v_blocks_enquiry_form" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_enquiry_form_path_idx" ON "_pages_v_blocks_enquiry_form" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_passes_list_order_idx" ON "_pages_v_blocks_passes_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_passes_list_parent_id_idx" ON "_pages_v_blocks_passes_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_passes_list_path_idx" ON "_pages_v_blocks_passes_list" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_policies_index_order_idx" ON "_pages_v_blocks_policies_index" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_policies_index_parent_id_idx" ON "_pages_v_blocks_policies_index" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_policies_index_path_idx" ON "_pages_v_blocks_policies_index" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_events_browser_doors_order_idx" ON "_pages_v_blocks_events_browser_doors" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_events_browser_doors_parent_id_idx" ON "_pages_v_blocks_events_browser_doors" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_events_browser_order_idx" ON "_pages_v_blocks_events_browser" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_events_browser_parent_id_idx" ON "_pages_v_blocks_events_browser" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_events_browser_path_idx" ON "_pages_v_blocks_events_browser" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_where_we_set_up_order_idx" ON "_pages_v_blocks_where_we_set_up" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_where_we_set_up_parent_id_idx" ON "_pages_v_blocks_where_we_set_up" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_where_we_set_up_path_idx" ON "_pages_v_blocks_where_we_set_up" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_utility_bar_links_order_idx" ON "_pages_v_blocks_utility_bar_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_utility_bar_links_parent_id_idx" ON "_pages_v_blocks_utility_bar_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_utility_bar_order_idx" ON "_pages_v_blocks_utility_bar" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_utility_bar_parent_id_idx" ON "_pages_v_blocks_utility_bar" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_utility_bar_path_idx" ON "_pages_v_blocks_utility_bar" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_rich_text_order_idx" ON "_pages_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rich_text_parent_id_idx" ON "_pages_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_path_idx" ON "_pages_v_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_seasonal_moments_order_idx" ON "_pages_v_blocks_seasonal_moments" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_seasonal_moments_parent_id_idx" ON "_pages_v_blocks_seasonal_moments" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_seasonal_moments_image_idx" ON "_pages_v_blocks_seasonal_moments" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_seasonal_order_idx" ON "_pages_v_blocks_seasonal" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_seasonal_parent_id_idx" ON "_pages_v_blocks_seasonal" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_seasonal_path_idx" ON "_pages_v_blocks_seasonal" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_workshop_journey_heading_lines_order_idx" ON "_pages_v_blocks_workshop_journey_heading_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_workshop_journey_heading_lines_parent_id_idx" ON "_pages_v_blocks_workshop_journey_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_workshop_journey_order_idx" ON "_pages_v_blocks_workshop_journey" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_workshop_journey_parent_id_idx" ON "_pages_v_blocks_workshop_journey" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_workshop_journey_path_idx" ON "_pages_v_blocks_workshop_journey" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_workshop_journey_image_idx" ON "_pages_v_blocks_workshop_journey" USING btree ("image_id");
  CREATE INDEX "__pages_v_blocks_pe_teaser_v_heading_lines_order_idx" ON "__pages_v_blocks_pe_teaser_v_heading_lines" USING btree ("_order");
  CREATE INDEX "__pages_v_blocks_pe_teaser_v_heading_lines_parent_id_idx" ON "__pages_v_blocks_pe_teaser_v_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "__pages_v_blocks_pe_teaser_v_order_idx" ON "__pages_v_blocks_pe_teaser_v" USING btree ("_order");
  CREATE INDEX "__pages_v_blocks_pe_teaser_v_parent_id_idx" ON "__pages_v_blocks_pe_teaser_v" USING btree ("_parent_id");
  CREATE INDEX "__pages_v_blocks_pe_teaser_v_path_idx" ON "__pages_v_blocks_pe_teaser_v" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_pair_order_idx" ON "_pages_v_blocks_image_pair" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_image_pair_parent_id_idx" ON "_pages_v_blocks_image_pair" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_image_pair_path_idx" ON "_pages_v_blocks_image_pair" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_pair_first_idx" ON "_pages_v_blocks_image_pair" USING btree ("first_id");
  CREATE INDEX "_pages_v_blocks_image_pair_second_idx" ON "_pages_v_blocks_image_pair" USING btree ("second_id");
  CREATE INDEX "_pages_v_blocks_full_bleed_statement_order_idx" ON "_pages_v_blocks_full_bleed_statement" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_full_bleed_statement_parent_id_idx" ON "_pages_v_blocks_full_bleed_statement" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_full_bleed_statement_path_idx" ON "_pages_v_blocks_full_bleed_statement" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_full_bleed_statement_image_idx" ON "_pages_v_blocks_full_bleed_statement" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_film_order_idx" ON "_pages_v_blocks_film" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_film_parent_id_idx" ON "_pages_v_blocks_film" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_film_path_idx" ON "_pages_v_blocks_film" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_film_video_idx" ON "_pages_v_blocks_film" USING btree ("video_id");
  CREATE INDEX "_pages_v_blocks_film_poster_idx" ON "_pages_v_blocks_film" USING btree ("poster_id");
  CREATE INDEX "_pages_v_blocks_upcoming_sessions_order_idx" ON "_pages_v_blocks_upcoming_sessions" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_upcoming_sessions_parent_id_idx" ON "_pages_v_blocks_upcoming_sessions" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_upcoming_sessions_path_idx" ON "_pages_v_blocks_upcoming_sessions" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_upcoming_sessions_experience_idx" ON "_pages_v_blocks_upcoming_sessions" USING btree ("experience_id");
  CREATE INDEX "_pages_v_blocks_testimonials_order_idx" ON "_pages_v_blocks_testimonials" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_testimonials_parent_id_idx" ON "_pages_v_blocks_testimonials" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_testimonials_path_idx" ON "_pages_v_blocks_testimonials" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_collaborate_teaser_heading_lines_order_idx" ON "_pages_v_blocks_collaborate_teaser_heading_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_collaborate_teaser_heading_lines_parent_id_idx" ON "_pages_v_blocks_collaborate_teaser_heading_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_collaborate_teaser_order_idx" ON "_pages_v_blocks_collaborate_teaser" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_collaborate_teaser_parent_id_idx" ON "_pages_v_blocks_collaborate_teaser" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_collaborate_teaser_path_idx" ON "_pages_v_blocks_collaborate_teaser" USING btree ("_path");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "_pages_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "_pages_v" USING btree ("autosave");
  CREATE INDEX "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_experiences_id_idx" ON "_pages_v_rels" USING btree ("experiences_id");
  CREATE INDEX "_pages_v_rels_media_id_idx" ON "_pages_v_rels" USING btree ("media_id");
  CREATE INDEX "_pages_v_rels_venues_id_idx" ON "_pages_v_rels" USING btree ("venues_id");
  CREATE INDEX "_pages_v_rels_testimonials_id_idx" ON "_pages_v_rels" USING btree ("testimonials_id");
  CREATE INDEX "experiences_about_order_idx" ON "experiences_about" USING btree ("_order");
  CREATE INDEX "experiences_about_parent_id_idx" ON "experiences_about" USING btree ("_parent_id");
  CREATE INDEX "experiences_image_idx" ON "experiences" USING btree ("image_id");
  CREATE INDEX "experiences_meta_meta_image_idx" ON "experiences" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "experiences_slug_idx" ON "experiences" USING btree ("slug");
  CREATE INDEX "experiences_updated_at_idx" ON "experiences" USING btree ("updated_at");
  CREATE INDEX "experiences_created_at_idx" ON "experiences" USING btree ("created_at");
  CREATE INDEX "experiences__status_idx" ON "experiences" USING btree ("_status");
  CREATE INDEX "experiences_rels_order_idx" ON "experiences_rels" USING btree ("order");
  CREATE INDEX "experiences_rels_parent_idx" ON "experiences_rels" USING btree ("parent_id");
  CREATE INDEX "experiences_rels_path_idx" ON "experiences_rels" USING btree ("path");
  CREATE INDEX "experiences_rels_media_id_idx" ON "experiences_rels" USING btree ("media_id");
  CREATE INDEX "experiences_rels_vibes_id_idx" ON "experiences_rels" USING btree ("vibes_id");
  CREATE INDEX "_experiences_v_version_about_order_idx" ON "_experiences_v_version_about" USING btree ("_order");
  CREATE INDEX "_experiences_v_version_about_parent_id_idx" ON "_experiences_v_version_about" USING btree ("_parent_id");
  CREATE INDEX "_experiences_v_parent_idx" ON "_experiences_v" USING btree ("parent_id");
  CREATE INDEX "_experiences_v_version_version_image_idx" ON "_experiences_v" USING btree ("version_image_id");
  CREATE INDEX "_experiences_v_version_meta_version_meta_image_idx" ON "_experiences_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_experiences_v_version_version_slug_idx" ON "_experiences_v" USING btree ("version_slug");
  CREATE INDEX "_experiences_v_version_version_updated_at_idx" ON "_experiences_v" USING btree ("version_updated_at");
  CREATE INDEX "_experiences_v_version_version_created_at_idx" ON "_experiences_v" USING btree ("version_created_at");
  CREATE INDEX "_experiences_v_version_version__status_idx" ON "_experiences_v" USING btree ("version__status");
  CREATE INDEX "_experiences_v_created_at_idx" ON "_experiences_v" USING btree ("created_at");
  CREATE INDEX "_experiences_v_updated_at_idx" ON "_experiences_v" USING btree ("updated_at");
  CREATE INDEX "_experiences_v_latest_idx" ON "_experiences_v" USING btree ("latest");
  CREATE INDEX "_experiences_v_autosave_idx" ON "_experiences_v" USING btree ("autosave");
  CREATE INDEX "_experiences_v_rels_order_idx" ON "_experiences_v_rels" USING btree ("order");
  CREATE INDEX "_experiences_v_rels_parent_idx" ON "_experiences_v_rels" USING btree ("parent_id");
  CREATE INDEX "_experiences_v_rels_path_idx" ON "_experiences_v_rels" USING btree ("path");
  CREATE INDEX "_experiences_v_rels_media_id_idx" ON "_experiences_v_rels" USING btree ("media_id");
  CREATE INDEX "_experiences_v_rels_vibes_id_idx" ON "_experiences_v_rels" USING btree ("vibes_id");
  CREATE INDEX "sessions_about_order_idx" ON "sessions_about" USING btree ("_order");
  CREATE INDEX "sessions_about_parent_id_idx" ON "sessions_about" USING btree ("_parent_id");
  CREATE INDEX "sessions_experience_idx" ON "sessions" USING btree ("experience_id");
  CREATE INDEX "sessions_venue_idx" ON "sessions" USING btree ("venue_id");
  CREATE INDEX "sessions_image_idx" ON "sessions" USING btree ("image_id");
  CREATE INDEX "sessions_meta_meta_image_idx" ON "sessions" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "sessions_slug_idx" ON "sessions" USING btree ("slug");
  CREATE INDEX "sessions_updated_at_idx" ON "sessions" USING btree ("updated_at");
  CREATE INDEX "sessions_created_at_idx" ON "sessions" USING btree ("created_at");
  CREATE INDEX "sessions__status_idx" ON "sessions" USING btree ("_status");
  CREATE INDEX "sessions_rels_order_idx" ON "sessions_rels" USING btree ("order");
  CREATE INDEX "sessions_rels_parent_idx" ON "sessions_rels" USING btree ("parent_id");
  CREATE INDEX "sessions_rels_path_idx" ON "sessions_rels" USING btree ("path");
  CREATE INDEX "sessions_rels_media_id_idx" ON "sessions_rels" USING btree ("media_id");
  CREATE INDEX "_sessions_v_version_about_order_idx" ON "_sessions_v_version_about" USING btree ("_order");
  CREATE INDEX "_sessions_v_version_about_parent_id_idx" ON "_sessions_v_version_about" USING btree ("_parent_id");
  CREATE INDEX "_sessions_v_parent_idx" ON "_sessions_v" USING btree ("parent_id");
  CREATE INDEX "_sessions_v_version_version_experience_idx" ON "_sessions_v" USING btree ("version_experience_id");
  CREATE INDEX "_sessions_v_version_version_venue_idx" ON "_sessions_v" USING btree ("version_venue_id");
  CREATE INDEX "_sessions_v_version_version_image_idx" ON "_sessions_v" USING btree ("version_image_id");
  CREATE INDEX "_sessions_v_version_meta_version_meta_image_idx" ON "_sessions_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_sessions_v_version_version_slug_idx" ON "_sessions_v" USING btree ("version_slug");
  CREATE INDEX "_sessions_v_version_version_updated_at_idx" ON "_sessions_v" USING btree ("version_updated_at");
  CREATE INDEX "_sessions_v_version_version_created_at_idx" ON "_sessions_v" USING btree ("version_created_at");
  CREATE INDEX "_sessions_v_version_version__status_idx" ON "_sessions_v" USING btree ("version__status");
  CREATE INDEX "_sessions_v_created_at_idx" ON "_sessions_v" USING btree ("created_at");
  CREATE INDEX "_sessions_v_updated_at_idx" ON "_sessions_v" USING btree ("updated_at");
  CREATE INDEX "_sessions_v_latest_idx" ON "_sessions_v" USING btree ("latest");
  CREATE INDEX "_sessions_v_autosave_idx" ON "_sessions_v" USING btree ("autosave");
  CREATE INDEX "_sessions_v_rels_order_idx" ON "_sessions_v_rels" USING btree ("order");
  CREATE INDEX "_sessions_v_rels_parent_idx" ON "_sessions_v_rels" USING btree ("parent_id");
  CREATE INDEX "_sessions_v_rels_path_idx" ON "_sessions_v_rels" USING btree ("path");
  CREATE INDEX "_sessions_v_rels_media_id_idx" ON "_sessions_v_rels" USING btree ("media_id");
  CREATE UNIQUE INDEX "session_inventory_session_idx" ON "session_inventory" USING btree ("session_id");
  CREATE INDEX "session_inventory_updated_at_idx" ON "session_inventory" USING btree ("updated_at");
  CREATE INDEX "session_inventory_created_at_idx" ON "session_inventory" USING btree ("created_at");
  CREATE INDEX "venues_address_order_idx" ON "venues_address" USING btree ("_order");
  CREATE INDEX "venues_address_parent_id_idx" ON "venues_address" USING btree ("_parent_id");
  CREATE INDEX "venues_hours_order_idx" ON "venues_hours" USING btree ("_order");
  CREATE INDEX "venues_hours_parent_id_idx" ON "venues_hours" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "venues_slug_idx" ON "venues" USING btree ("slug");
  CREATE INDEX "venues_logo_idx" ON "venues" USING btree ("logo_id");
  CREATE INDEX "venues_image_idx" ON "venues" USING btree ("image_id");
  CREATE INDEX "venues_updated_at_idx" ON "venues" USING btree ("updated_at");
  CREATE INDEX "venues_created_at_idx" ON "venues" USING btree ("created_at");
  CREATE INDEX "programmes_image_idx" ON "programmes" USING btree ("image_id");
  CREATE INDEX "programmes_meta_meta_image_idx" ON "programmes" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "programmes_slug_idx" ON "programmes" USING btree ("slug");
  CREATE INDEX "programmes_updated_at_idx" ON "programmes" USING btree ("updated_at");
  CREATE INDEX "programmes_created_at_idx" ON "programmes" USING btree ("created_at");
  CREATE INDEX "programmes__status_idx" ON "programmes" USING btree ("_status");
  CREATE INDEX "_programmes_v_parent_idx" ON "_programmes_v" USING btree ("parent_id");
  CREATE INDEX "_programmes_v_version_version_image_idx" ON "_programmes_v" USING btree ("version_image_id");
  CREATE INDEX "_programmes_v_version_meta_version_meta_image_idx" ON "_programmes_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_programmes_v_version_version_slug_idx" ON "_programmes_v" USING btree ("version_slug");
  CREATE INDEX "_programmes_v_version_version_updated_at_idx" ON "_programmes_v" USING btree ("version_updated_at");
  CREATE INDEX "_programmes_v_version_version_created_at_idx" ON "_programmes_v" USING btree ("version_created_at");
  CREATE INDEX "_programmes_v_version_version__status_idx" ON "_programmes_v" USING btree ("version__status");
  CREATE INDEX "_programmes_v_created_at_idx" ON "_programmes_v" USING btree ("created_at");
  CREATE INDEX "_programmes_v_updated_at_idx" ON "_programmes_v" USING btree ("updated_at");
  CREATE INDEX "_programmes_v_latest_idx" ON "_programmes_v" USING btree ("latest");
  CREATE INDEX "_programmes_v_autosave_idx" ON "_programmes_v" USING btree ("autosave");
  CREATE INDEX "policies_blocks_text_order_idx" ON "policies_blocks_text" USING btree ("_order");
  CREATE INDEX "policies_blocks_text_parent_id_idx" ON "policies_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "policies_blocks_text_path_idx" ON "policies_blocks_text" USING btree ("_path");
  CREATE INDEX "policies_blocks_list_items_order_idx" ON "policies_blocks_list_items" USING btree ("_order");
  CREATE INDEX "policies_blocks_list_items_parent_id_idx" ON "policies_blocks_list_items" USING btree ("_parent_id");
  CREATE INDEX "policies_blocks_list_order_idx" ON "policies_blocks_list" USING btree ("_order");
  CREATE INDEX "policies_blocks_list_parent_id_idx" ON "policies_blocks_list" USING btree ("_parent_id");
  CREATE INDEX "policies_blocks_list_path_idx" ON "policies_blocks_list" USING btree ("_path");
  CREATE INDEX "policies_blocks_ages_rows_order_idx" ON "policies_blocks_ages_rows" USING btree ("_order");
  CREATE INDEX "policies_blocks_ages_rows_parent_id_idx" ON "policies_blocks_ages_rows" USING btree ("_parent_id");
  CREATE INDEX "policies_blocks_ages_order_idx" ON "policies_blocks_ages" USING btree ("_order");
  CREATE INDEX "policies_blocks_ages_parent_id_idx" ON "policies_blocks_ages" USING btree ("_parent_id");
  CREATE INDEX "policies_blocks_ages_path_idx" ON "policies_blocks_ages" USING btree ("_path");
  CREATE INDEX "policies_blocks_callout_order_idx" ON "policies_blocks_callout" USING btree ("_order");
  CREATE INDEX "policies_blocks_callout_parent_id_idx" ON "policies_blocks_callout" USING btree ("_parent_id");
  CREATE INDEX "policies_blocks_callout_path_idx" ON "policies_blocks_callout" USING btree ("_path");
  CREATE INDEX "policies_sections_order_idx" ON "policies_sections" USING btree ("_order");
  CREATE INDEX "policies_sections_parent_id_idx" ON "policies_sections" USING btree ("_parent_id");
  CREATE INDEX "policies_meta_meta_image_idx" ON "policies" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "policies_slug_idx" ON "policies" USING btree ("slug");
  CREATE INDEX "policies_updated_at_idx" ON "policies" USING btree ("updated_at");
  CREATE INDEX "policies_created_at_idx" ON "policies" USING btree ("created_at");
  CREATE INDEX "policies__status_idx" ON "policies" USING btree ("_status");
  CREATE INDEX "_policies_v_blocks_text_order_idx" ON "_policies_v_blocks_text" USING btree ("_order");
  CREATE INDEX "_policies_v_blocks_text_parent_id_idx" ON "_policies_v_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "_policies_v_blocks_text_path_idx" ON "_policies_v_blocks_text" USING btree ("_path");
  CREATE INDEX "_policies_v_blocks_list_items_order_idx" ON "_policies_v_blocks_list_items" USING btree ("_order");
  CREATE INDEX "_policies_v_blocks_list_items_parent_id_idx" ON "_policies_v_blocks_list_items" USING btree ("_parent_id");
  CREATE INDEX "_policies_v_blocks_list_order_idx" ON "_policies_v_blocks_list" USING btree ("_order");
  CREATE INDEX "_policies_v_blocks_list_parent_id_idx" ON "_policies_v_blocks_list" USING btree ("_parent_id");
  CREATE INDEX "_policies_v_blocks_list_path_idx" ON "_policies_v_blocks_list" USING btree ("_path");
  CREATE INDEX "_policies_v_blocks_ages_rows_order_idx" ON "_policies_v_blocks_ages_rows" USING btree ("_order");
  CREATE INDEX "_policies_v_blocks_ages_rows_parent_id_idx" ON "_policies_v_blocks_ages_rows" USING btree ("_parent_id");
  CREATE INDEX "_policies_v_blocks_ages_order_idx" ON "_policies_v_blocks_ages" USING btree ("_order");
  CREATE INDEX "_policies_v_blocks_ages_parent_id_idx" ON "_policies_v_blocks_ages" USING btree ("_parent_id");
  CREATE INDEX "_policies_v_blocks_ages_path_idx" ON "_policies_v_blocks_ages" USING btree ("_path");
  CREATE INDEX "_policies_v_blocks_callout_order_idx" ON "_policies_v_blocks_callout" USING btree ("_order");
  CREATE INDEX "_policies_v_blocks_callout_parent_id_idx" ON "_policies_v_blocks_callout" USING btree ("_parent_id");
  CREATE INDEX "_policies_v_blocks_callout_path_idx" ON "_policies_v_blocks_callout" USING btree ("_path");
  CREATE INDEX "_policies_v_version_sections_order_idx" ON "_policies_v_version_sections" USING btree ("_order");
  CREATE INDEX "_policies_v_version_sections_parent_id_idx" ON "_policies_v_version_sections" USING btree ("_parent_id");
  CREATE INDEX "_policies_v_parent_idx" ON "_policies_v" USING btree ("parent_id");
  CREATE INDEX "_policies_v_version_meta_version_meta_image_idx" ON "_policies_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_policies_v_version_version_slug_idx" ON "_policies_v" USING btree ("version_slug");
  CREATE INDEX "_policies_v_version_version_updated_at_idx" ON "_policies_v" USING btree ("version_updated_at");
  CREATE INDEX "_policies_v_version_version_created_at_idx" ON "_policies_v" USING btree ("version_created_at");
  CREATE INDEX "_policies_v_version_version__status_idx" ON "_policies_v" USING btree ("version__status");
  CREATE INDEX "_policies_v_created_at_idx" ON "_policies_v" USING btree ("created_at");
  CREATE INDEX "_policies_v_updated_at_idx" ON "_policies_v" USING btree ("updated_at");
  CREATE INDEX "_policies_v_latest_idx" ON "_policies_v" USING btree ("latest");
  CREATE INDEX "_policies_v_autosave_idx" ON "_policies_v" USING btree ("autosave");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE INDEX "faqs__status_idx" ON "faqs" USING btree ("_status");
  CREATE INDEX "_faqs_v_parent_idx" ON "_faqs_v" USING btree ("parent_id");
  CREATE INDEX "_faqs_v_version_version_updated_at_idx" ON "_faqs_v" USING btree ("version_updated_at");
  CREATE INDEX "_faqs_v_version_version_created_at_idx" ON "_faqs_v" USING btree ("version_created_at");
  CREATE INDEX "_faqs_v_version_version__status_idx" ON "_faqs_v" USING btree ("version__status");
  CREATE INDEX "_faqs_v_created_at_idx" ON "_faqs_v" USING btree ("created_at");
  CREATE INDEX "_faqs_v_updated_at_idx" ON "_faqs_v" USING btree ("updated_at");
  CREATE INDEX "_faqs_v_latest_idx" ON "_faqs_v" USING btree ("latest");
  CREATE INDEX "_faqs_v_autosave_idx" ON "_faqs_v" USING btree ("autosave");
  CREATE INDEX "passes_benefits_order_idx" ON "passes_benefits" USING btree ("_order");
  CREATE INDEX "passes_benefits_parent_id_idx" ON "passes_benefits" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "passes_slug_idx" ON "passes" USING btree ("slug");
  CREATE INDEX "passes_image_idx" ON "passes" USING btree ("image_id");
  CREATE INDEX "passes_updated_at_idx" ON "passes" USING btree ("updated_at");
  CREATE INDEX "passes_created_at_idx" ON "passes" USING btree ("created_at");
  CREATE INDEX "passes__status_idx" ON "passes" USING btree ("_status");
  CREATE INDEX "_passes_v_version_benefits_order_idx" ON "_passes_v_version_benefits" USING btree ("_order");
  CREATE INDEX "_passes_v_version_benefits_parent_id_idx" ON "_passes_v_version_benefits" USING btree ("_parent_id");
  CREATE INDEX "_passes_v_parent_idx" ON "_passes_v" USING btree ("parent_id");
  CREATE INDEX "_passes_v_version_version_slug_idx" ON "_passes_v" USING btree ("version_slug");
  CREATE INDEX "_passes_v_version_version_image_idx" ON "_passes_v" USING btree ("version_image_id");
  CREATE INDEX "_passes_v_version_version_updated_at_idx" ON "_passes_v" USING btree ("version_updated_at");
  CREATE INDEX "_passes_v_version_version_created_at_idx" ON "_passes_v" USING btree ("version_created_at");
  CREATE INDEX "_passes_v_version_version__status_idx" ON "_passes_v" USING btree ("version__status");
  CREATE INDEX "_passes_v_created_at_idx" ON "_passes_v" USING btree ("created_at");
  CREATE INDEX "_passes_v_updated_at_idx" ON "_passes_v" USING btree ("updated_at");
  CREATE INDEX "_passes_v_latest_idx" ON "_passes_v" USING btree ("latest");
  CREATE INDEX "_passes_v_autosave_idx" ON "_passes_v" USING btree ("autosave");
  CREATE INDEX "testimonials_experience_idx" ON "testimonials" USING btree ("experience_id");
  CREATE INDEX "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "testimonials" USING btree ("created_at");
  CREATE INDEX "testimonials__status_idx" ON "testimonials" USING btree ("_status");
  CREATE INDEX "_testimonials_v_parent_idx" ON "_testimonials_v" USING btree ("parent_id");
  CREATE INDEX "_testimonials_v_version_version_experience_idx" ON "_testimonials_v" USING btree ("version_experience_id");
  CREATE INDEX "_testimonials_v_version_version_updated_at_idx" ON "_testimonials_v" USING btree ("version_updated_at");
  CREATE INDEX "_testimonials_v_version_version_created_at_idx" ON "_testimonials_v" USING btree ("version_created_at");
  CREATE INDEX "_testimonials_v_version_version__status_idx" ON "_testimonials_v" USING btree ("version__status");
  CREATE INDEX "_testimonials_v_created_at_idx" ON "_testimonials_v" USING btree ("created_at");
  CREATE INDEX "_testimonials_v_updated_at_idx" ON "_testimonials_v" USING btree ("updated_at");
  CREATE INDEX "_testimonials_v_latest_idx" ON "_testimonials_v" USING btree ("latest");
  CREATE INDEX "_testimonials_v_autosave_idx" ON "_testimonials_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "vibes_slug_idx" ON "vibes" USING btree ("slug");
  CREATE INDEX "vibes_updated_at_idx" ON "vibes" USING btree ("updated_at");
  CREATE INDEX "vibes_created_at_idx" ON "vibes" USING btree ("created_at");
  CREATE UNIQUE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sessions_fk" FOREIGN KEY ("sessions_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_session_inventory_fk" FOREIGN KEY ("session_inventory_id") REFERENCES "public"."session_inventory"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_venues_fk" FOREIGN KEY ("venues_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_programmes_fk" FOREIGN KEY ("programmes_id") REFERENCES "public"."programmes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_policies_fk" FOREIGN KEY ("policies_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_passes_fk" FOREIGN KEY ("passes_id") REFERENCES "public"."passes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vibes_fk" FOREIGN KEY ("vibes_id") REFERENCES "public"."vibes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_experiences_id_idx" ON "payload_locked_documents_rels" USING btree ("experiences_id");
  CREATE INDEX "payload_locked_documents_rels_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("sessions_id");
  CREATE INDEX "payload_locked_documents_rels_session_inventory_id_idx" ON "payload_locked_documents_rels" USING btree ("session_inventory_id");
  CREATE INDEX "payload_locked_documents_rels_venues_id_idx" ON "payload_locked_documents_rels" USING btree ("venues_id");
  CREATE INDEX "payload_locked_documents_rels_programmes_id_idx" ON "payload_locked_documents_rels" USING btree ("programmes_id");
  CREATE INDEX "payload_locked_documents_rels_policies_id_idx" ON "payload_locked_documents_rels" USING btree ("policies_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_passes_id_idx" ON "payload_locked_documents_rels" USING btree ("passes_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_vibes_id_idx" ON "payload_locked_documents_rels" USING btree ("vibes_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_opening_statement" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_experience_carousel_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_experience_carousel" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_ways_to_take_part_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_ways_to_take_part_groups_doors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_ways_to_take_part_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_ways_to_take_part" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_two_ways_roads_facts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_two_ways_roads" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_two_ways" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_where_we_create_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_where_we_create" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_closing_invitation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_about_welcome" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_mission_vision" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_community_journey" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_what_sets_us_apart_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_what_sets_us_apart" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_closing_cta_lilac_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_closing_cta_lilac" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_page_header_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_page_header" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq_list_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_gallery_collections_collections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_gallery_collections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_locations_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_contact_intro_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_contact_intro" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_pe_intro_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_pe_intro" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_programmes_grid_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_programmes_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_activities_grid_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_activities_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_venue_spotlight_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_venue_spotlight" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_steps_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_steps_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_enquiry_form_sidebar_steps_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_enquiry_form" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_passes_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_policies_index" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_events_browser_doors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_events_browser" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_where_we_set_up" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_utility_bar_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_utility_bar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_seasonal_moments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_seasonal" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_workshop_journey_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_workshop_journey" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_pe_teaser_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_pe_teaser" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_image_pair" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_full_bleed_statement" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_film" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_upcoming_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_collaborate_teaser_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_collaborate_teaser" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_hero_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_opening_statement" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_experience_carousel_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_experience_carousel" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_ways_to_take_part_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_ways_to_take_part_groups_doors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_ways_to_take_part_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_ways_to_take_part" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_two_ways_roads_facts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_two_ways_roads" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_two_ways" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_where_we_create_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_where_we_create" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_closing_invitation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_about_welcome" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_mission_vision" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_community_journey" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_what_sets_us_apart_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_what_sets_us_apart" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_closing_cta_lilac_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_closing_cta_lilac" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_page_header_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_page_header" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faq_list_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faq_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_gallery_collections_collections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_gallery_collections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_locations_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_contact_intro_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_contact_intro" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "__pages_v_blocks_pe_intro_v_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "__pages_v_blocks_pe_intro_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_programmes_grid_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_programmes_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_activities_grid_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_activities_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_venue_spotlight_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_venue_spotlight" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_steps_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_steps_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_enquiry_form_sidebar_steps_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_enquiry_form" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_passes_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_policies_index" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_events_browser_doors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_events_browser" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_where_we_set_up" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_utility_bar_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_utility_bar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_seasonal_moments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_seasonal" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_workshop_journey_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_workshop_journey" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "__pages_v_blocks_pe_teaser_v_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "__pages_v_blocks_pe_teaser_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_image_pair" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_full_bleed_statement" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_film" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_upcoming_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_collaborate_teaser_heading_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_collaborate_teaser" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "experiences_about" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "experiences" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "experiences_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_experiences_v_version_about" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_experiences_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_experiences_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sessions_about" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sessions_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sessions_v_version_about" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sessions_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sessions_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "session_inventory" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "venues_address" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "venues_hours" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "venues" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programmes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_programmes_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "policies_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "policies_blocks_list_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "policies_blocks_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "policies_blocks_ages_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "policies_blocks_ages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "policies_blocks_callout" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "policies_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "policies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_policies_v_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_policies_v_blocks_list_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_policies_v_blocks_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_policies_v_blocks_ages_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_policies_v_blocks_ages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_policies_v_blocks_callout" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_policies_v_version_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_policies_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_faqs_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "passes_benefits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "passes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_passes_v_version_benefits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_passes_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_testimonials_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vibes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "redirects" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_hero_heading_lines" CASCADE;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_opening_statement" CASCADE;
  DROP TABLE "pages_blocks_experience_carousel_heading_lines" CASCADE;
  DROP TABLE "pages_blocks_experience_carousel" CASCADE;
  DROP TABLE "pages_blocks_ways_to_take_part_heading_lines" CASCADE;
  DROP TABLE "pages_blocks_ways_to_take_part_groups_doors" CASCADE;
  DROP TABLE "pages_blocks_ways_to_take_part_groups" CASCADE;
  DROP TABLE "pages_blocks_ways_to_take_part" CASCADE;
  DROP TABLE "pages_blocks_two_ways_roads_facts" CASCADE;
  DROP TABLE "pages_blocks_two_ways_roads" CASCADE;
  DROP TABLE "pages_blocks_two_ways" CASCADE;
  DROP TABLE "pages_blocks_where_we_create_heading_lines" CASCADE;
  DROP TABLE "pages_blocks_where_we_create" CASCADE;
  DROP TABLE "pages_blocks_closing_invitation" CASCADE;
  DROP TABLE "pages_blocks_about_welcome" CASCADE;
  DROP TABLE "pages_blocks_mission_vision" CASCADE;
  DROP TABLE "pages_blocks_community_journey" CASCADE;
  DROP TABLE "pages_blocks_what_sets_us_apart_heading_lines" CASCADE;
  DROP TABLE "pages_blocks_what_sets_us_apart" CASCADE;
  DROP TABLE "pages_blocks_closing_cta_lilac_heading_lines" CASCADE;
  DROP TABLE "pages_blocks_closing_cta_lilac" CASCADE;
  DROP TABLE "pages_blocks_page_header_heading_lines" CASCADE;
  DROP TABLE "pages_blocks_page_header" CASCADE;
  DROP TABLE "pages_blocks_faq_list_groups" CASCADE;
  DROP TABLE "pages_blocks_faq_list" CASCADE;
  DROP TABLE "pages_blocks_gallery_collections_collections" CASCADE;
  DROP TABLE "pages_blocks_gallery_collections" CASCADE;
  DROP TABLE "pages_blocks_locations_hero" CASCADE;
  DROP TABLE "pages_blocks_contact_intro_heading_lines" CASCADE;
  DROP TABLE "pages_blocks_contact_intro" CASCADE;
  DROP TABLE "pages_blocks_pe_intro_heading_lines" CASCADE;
  DROP TABLE "pages_blocks_pe_intro" CASCADE;
  DROP TABLE "pages_blocks_programmes_grid_heading_lines" CASCADE;
  DROP TABLE "pages_blocks_programmes_grid" CASCADE;
  DROP TABLE "pages_blocks_activities_grid_heading_lines" CASCADE;
  DROP TABLE "pages_blocks_activities_grid" CASCADE;
  DROP TABLE "pages_blocks_venue_spotlight_heading_lines" CASCADE;
  DROP TABLE "pages_blocks_venue_spotlight" CASCADE;
  DROP TABLE "pages_blocks_steps_heading_lines" CASCADE;
  DROP TABLE "pages_blocks_steps_steps" CASCADE;
  DROP TABLE "pages_blocks_steps" CASCADE;
  DROP TABLE "pages_blocks_enquiry_form_sidebar_steps_steps" CASCADE;
  DROP TABLE "pages_blocks_enquiry_form" CASCADE;
  DROP TABLE "pages_blocks_passes_list" CASCADE;
  DROP TABLE "pages_blocks_policies_index" CASCADE;
  DROP TABLE "pages_blocks_events_browser_doors" CASCADE;
  DROP TABLE "pages_blocks_events_browser" CASCADE;
  DROP TABLE "pages_blocks_where_we_set_up" CASCADE;
  DROP TABLE "pages_blocks_utility_bar_links" CASCADE;
  DROP TABLE "pages_blocks_utility_bar" CASCADE;
  DROP TABLE "pages_blocks_rich_text" CASCADE;
  DROP TABLE "pages_blocks_seasonal_moments" CASCADE;
  DROP TABLE "pages_blocks_seasonal" CASCADE;
  DROP TABLE "pages_blocks_workshop_journey_heading_lines" CASCADE;
  DROP TABLE "pages_blocks_workshop_journey" CASCADE;
  DROP TABLE "pages_blocks_pe_teaser_heading_lines" CASCADE;
  DROP TABLE "pages_blocks_pe_teaser" CASCADE;
  DROP TABLE "pages_blocks_image_pair" CASCADE;
  DROP TABLE "pages_blocks_full_bleed_statement" CASCADE;
  DROP TABLE "pages_blocks_film" CASCADE;
  DROP TABLE "pages_blocks_upcoming_sessions" CASCADE;
  DROP TABLE "pages_blocks_testimonials" CASCADE;
  DROP TABLE "pages_blocks_collaborate_teaser_heading_lines" CASCADE;
  DROP TABLE "pages_blocks_collaborate_teaser" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_heading_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_opening_statement" CASCADE;
  DROP TABLE "_pages_v_blocks_experience_carousel_heading_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_experience_carousel" CASCADE;
  DROP TABLE "_pages_v_blocks_ways_to_take_part_heading_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_ways_to_take_part_groups_doors" CASCADE;
  DROP TABLE "_pages_v_blocks_ways_to_take_part_groups" CASCADE;
  DROP TABLE "_pages_v_blocks_ways_to_take_part" CASCADE;
  DROP TABLE "_pages_v_blocks_two_ways_roads_facts" CASCADE;
  DROP TABLE "_pages_v_blocks_two_ways_roads" CASCADE;
  DROP TABLE "_pages_v_blocks_two_ways" CASCADE;
  DROP TABLE "_pages_v_blocks_where_we_create_heading_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_where_we_create" CASCADE;
  DROP TABLE "_pages_v_blocks_closing_invitation" CASCADE;
  DROP TABLE "_pages_v_blocks_about_welcome" CASCADE;
  DROP TABLE "_pages_v_blocks_mission_vision" CASCADE;
  DROP TABLE "_pages_v_blocks_community_journey" CASCADE;
  DROP TABLE "_pages_v_blocks_what_sets_us_apart_heading_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_what_sets_us_apart" CASCADE;
  DROP TABLE "_pages_v_blocks_closing_cta_lilac_heading_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_closing_cta_lilac" CASCADE;
  DROP TABLE "_pages_v_blocks_page_header_heading_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_page_header" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_list_groups" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_list" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery_collections_collections" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery_collections" CASCADE;
  DROP TABLE "_pages_v_blocks_locations_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_contact_intro_heading_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_contact_intro" CASCADE;
  DROP TABLE "__pages_v_blocks_pe_intro_v_heading_lines" CASCADE;
  DROP TABLE "__pages_v_blocks_pe_intro_v" CASCADE;
  DROP TABLE "_pages_v_blocks_programmes_grid_heading_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_programmes_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_activities_grid_heading_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_activities_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_venue_spotlight_heading_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_venue_spotlight" CASCADE;
  DROP TABLE "_pages_v_blocks_steps_heading_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_steps_steps" CASCADE;
  DROP TABLE "_pages_v_blocks_steps" CASCADE;
  DROP TABLE "_pages_v_blocks_enquiry_form_sidebar_steps_steps" CASCADE;
  DROP TABLE "_pages_v_blocks_enquiry_form" CASCADE;
  DROP TABLE "_pages_v_blocks_passes_list" CASCADE;
  DROP TABLE "_pages_v_blocks_policies_index" CASCADE;
  DROP TABLE "_pages_v_blocks_events_browser_doors" CASCADE;
  DROP TABLE "_pages_v_blocks_events_browser" CASCADE;
  DROP TABLE "_pages_v_blocks_where_we_set_up" CASCADE;
  DROP TABLE "_pages_v_blocks_utility_bar_links" CASCADE;
  DROP TABLE "_pages_v_blocks_utility_bar" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text" CASCADE;
  DROP TABLE "_pages_v_blocks_seasonal_moments" CASCADE;
  DROP TABLE "_pages_v_blocks_seasonal" CASCADE;
  DROP TABLE "_pages_v_blocks_workshop_journey_heading_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_workshop_journey" CASCADE;
  DROP TABLE "__pages_v_blocks_pe_teaser_v_heading_lines" CASCADE;
  DROP TABLE "__pages_v_blocks_pe_teaser_v" CASCADE;
  DROP TABLE "_pages_v_blocks_image_pair" CASCADE;
  DROP TABLE "_pages_v_blocks_full_bleed_statement" CASCADE;
  DROP TABLE "_pages_v_blocks_film" CASCADE;
  DROP TABLE "_pages_v_blocks_upcoming_sessions" CASCADE;
  DROP TABLE "_pages_v_blocks_testimonials" CASCADE;
  DROP TABLE "_pages_v_blocks_collaborate_teaser_heading_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_collaborate_teaser" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_rels" CASCADE;
  DROP TABLE "experiences_about" CASCADE;
  DROP TABLE "experiences" CASCADE;
  DROP TABLE "experiences_rels" CASCADE;
  DROP TABLE "_experiences_v_version_about" CASCADE;
  DROP TABLE "_experiences_v" CASCADE;
  DROP TABLE "_experiences_v_rels" CASCADE;
  DROP TABLE "sessions_about" CASCADE;
  DROP TABLE "sessions" CASCADE;
  DROP TABLE "sessions_rels" CASCADE;
  DROP TABLE "_sessions_v_version_about" CASCADE;
  DROP TABLE "_sessions_v" CASCADE;
  DROP TABLE "_sessions_v_rels" CASCADE;
  DROP TABLE "session_inventory" CASCADE;
  DROP TABLE "venues_address" CASCADE;
  DROP TABLE "venues_hours" CASCADE;
  DROP TABLE "venues" CASCADE;
  DROP TABLE "programmes" CASCADE;
  DROP TABLE "_programmes_v" CASCADE;
  DROP TABLE "policies_blocks_text" CASCADE;
  DROP TABLE "policies_blocks_list_items" CASCADE;
  DROP TABLE "policies_blocks_list" CASCADE;
  DROP TABLE "policies_blocks_ages_rows" CASCADE;
  DROP TABLE "policies_blocks_ages" CASCADE;
  DROP TABLE "policies_blocks_callout" CASCADE;
  DROP TABLE "policies_sections" CASCADE;
  DROP TABLE "policies" CASCADE;
  DROP TABLE "_policies_v_blocks_text" CASCADE;
  DROP TABLE "_policies_v_blocks_list_items" CASCADE;
  DROP TABLE "_policies_v_blocks_list" CASCADE;
  DROP TABLE "_policies_v_blocks_ages_rows" CASCADE;
  DROP TABLE "_policies_v_blocks_ages" CASCADE;
  DROP TABLE "_policies_v_blocks_callout" CASCADE;
  DROP TABLE "_policies_v_version_sections" CASCADE;
  DROP TABLE "_policies_v" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "_faqs_v" CASCADE;
  DROP TABLE "passes_benefits" CASCADE;
  DROP TABLE "passes" CASCADE;
  DROP TABLE "_passes_v_version_benefits" CASCADE;
  DROP TABLE "_passes_v" CASCADE;
  DROP TABLE "testimonials" CASCADE;
  DROP TABLE "_testimonials_v" CASCADE;
  DROP TABLE "vibes" CASCADE;
  DROP TABLE "redirects" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pages_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_experiences_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_sessions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_session_inventory_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_venues_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_programmes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_policies_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_faqs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_passes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_testimonials_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_vibes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_redirects_fk";
  
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'noop');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "parent_task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_parent_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_parent_task_slug" AS ENUM('inline', 'noop');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "parent_task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_parent_task_slug" USING "parent_task_slug"::"public"."enum_payload_jobs_log_parent_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'noop');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "payload_locked_documents_rels_pages_id_idx";
  DROP INDEX "payload_locked_documents_rels_experiences_id_idx";
  DROP INDEX "payload_locked_documents_rels_sessions_id_idx";
  DROP INDEX "payload_locked_documents_rels_session_inventory_id_idx";
  DROP INDEX "payload_locked_documents_rels_venues_id_idx";
  DROP INDEX "payload_locked_documents_rels_programmes_id_idx";
  DROP INDEX "payload_locked_documents_rels_policies_id_idx";
  DROP INDEX "payload_locked_documents_rels_faqs_id_idx";
  DROP INDEX "payload_locked_documents_rels_passes_id_idx";
  DROP INDEX "payload_locked_documents_rels_testimonials_id_idx";
  DROP INDEX "payload_locked_documents_rels_vibes_id_idx";
  DROP INDEX "payload_locked_documents_rels_redirects_id_idx";
  ALTER TABLE "navigation" ALTER COLUMN "experiences_menu_door_title" DROP DEFAULT;
  ALTER TABLE "navigation" ALTER COLUMN "experiences_menu_door_sub" DROP DEFAULT;
  ALTER TABLE "navigation" ALTER COLUMN "experiences_menu_door_link_url" DROP DEFAULT;
  ALTER TABLE "navigation" ALTER COLUMN "experiences_menu_door_link_anchor" DROP DEFAULT;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pages_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "experiences_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "sessions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "session_inventory_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "venues_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "programmes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "policies_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "faqs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "passes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "testimonials_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "vibes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "redirects_id";
  DROP TYPE "public"."enum_pages_blocks_hero_primary_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_hero_secondary_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_experience_carousel_source";
  DROP TYPE "public"."enum_pages_blocks_ways_to_take_part_groups_doors_note_source";
  DROP TYPE "public"."enum_pages_blocks_ways_to_take_part_groups_doors_link_type";
  DROP TYPE "public"."enum_pages_blocks_ways_to_take_part_groups_tint";
  DROP TYPE "public"."enum_pages_blocks_two_ways_roads_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_two_ways_roads_ground";
  DROP TYPE "public"."enum_pages_blocks_closing_invitation_primary_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_closing_invitation_secondary_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_closing_cta_lilac_primary_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_closing_cta_lilac_secondary_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_page_header_standfirst_source";
  DROP TYPE "public"."enum_pages_blocks_faq_list_groups_key";
  DROP TYPE "public"."enum_pages_blocks_gallery_collections_collections_ground";
  DROP TYPE "public"."enum_pages_blocks_gallery_collections_collections_source";
  DROP TYPE "public"."enum_pages_blocks_gallery_collections_collections_media_tag";
  DROP TYPE "public"."enum_pages_blocks_contact_intro_venues_link_type";
  DROP TYPE "public"."enum_pages_blocks_activities_grid_link_to";
  DROP TYPE "public"."enum_pages_blocks_steps_source";
  DROP TYPE "public"."enum_pages_blocks_steps_variant";
  DROP TYPE "public"."enum_pages_blocks_enquiry_form_sidebar_steps_source";
  DROP TYPE "public"."enum_pages_blocks_passes_list_empty_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_passes_list_footer_first_link_link_type";
  DROP TYPE "public"."enum_pages_blocks_passes_list_footer_second_link_link_type";
  DROP TYPE "public"."enum_pages_blocks_events_browser_doors_note_source";
  DROP TYPE "public"."enum_pages_blocks_where_we_set_up_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_utility_bar_links_link_type";
  DROP TYPE "public"."enum_pages_blocks_rich_text_width";
  DROP TYPE "public"."enum_pages_blocks_seasonal_source";
  DROP TYPE "public"."enum_pages_blocks_pe_teaser_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_testimonials_source";
  DROP TYPE "public"."enum_pages_blocks_collaborate_teaser_primary_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_collaborate_teaser_secondary_cta_link_type";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_hero_primary_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_hero_secondary_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_experience_carousel_source";
  DROP TYPE "public"."enum__pages_v_blocks_ways_to_take_part_groups_doors_note_source";
  DROP TYPE "public"."enum__pages_v_blocks_ways_to_take_part_groups_doors_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_ways_to_take_part_groups_tint";
  DROP TYPE "public"."enum__pages_v_blocks_two_ways_roads_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_two_ways_roads_ground";
  DROP TYPE "public"."enum__pages_v_blocks_closing_invitation_primary_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_closing_invitation_secondary_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_closing_cta_lilac_primary_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_closing_cta_lilac_secondary_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_page_header_standfirst_source";
  DROP TYPE "public"."enum__pages_v_blocks_faq_list_groups_key";
  DROP TYPE "public"."enum__pages_v_blocks_gallery_collections_collections_ground";
  DROP TYPE "public"."enum__pages_v_blocks_gallery_collections_collections_source";
  DROP TYPE "public"."enum__pages_v_blocks_gallery_collections_collections_media_tag";
  DROP TYPE "public"."enum__pages_v_blocks_contact_intro_venues_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_activities_grid_link_to";
  DROP TYPE "public"."enum__pages_v_blocks_steps_source";
  DROP TYPE "public"."enum__pages_v_blocks_steps_variant";
  DROP TYPE "public"."enum__pages_v_blocks_enquiry_form_sidebar_steps_source";
  DROP TYPE "public"."enum__pages_v_blocks_passes_list_empty_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_passes_list_footer_first_link_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_passes_list_footer_second_link_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_events_browser_doors_note_source";
  DROP TYPE "public"."enum__pages_v_blocks_where_we_set_up_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_utility_bar_links_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_rich_text_width";
  DROP TYPE "public"."enum__pages_v_blocks_seasonal_source";
  DROP TYPE "public"."enum___pages_v_blocks_pe_teaser_v_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_testimonials_source";
  DROP TYPE "public"."enum__pages_v_blocks_collaborate_teaser_primary_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_collaborate_teaser_secondary_cta_link_type";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_experiences_kind";
  DROP TYPE "public"."enum_experiences_status";
  DROP TYPE "public"."enum__experiences_v_version_kind";
  DROP TYPE "public"."enum__experiences_v_version_status";
  DROP TYPE "public"."enum_sessions_startsat_tz";
  DROP TYPE "public"."enum_sessions_booking_status";
  DROP TYPE "public"."enum_sessions_salescloseat_tz";
  DROP TYPE "public"."enum_sessions_status";
  DROP TYPE "public"."enum__sessions_v_version_startsat_tz";
  DROP TYPE "public"."enum__sessions_v_version_booking_status";
  DROP TYPE "public"."enum__sessions_v_version_salescloseat_tz";
  DROP TYPE "public"."enum__sessions_v_version_status";
  DROP TYPE "public"."enum_venues_status";
  DROP TYPE "public"."enum_programmes_mark_name";
  DROP TYPE "public"."enum_programmes_mark_color";
  DROP TYPE "public"."enum_programmes_tone";
  DROP TYPE "public"."enum_programmes_status";
  DROP TYPE "public"."enum__programmes_v_version_mark_name";
  DROP TYPE "public"."enum__programmes_v_version_mark_color";
  DROP TYPE "public"."enum__programmes_v_version_tone";
  DROP TYPE "public"."enum__programmes_v_version_status";
  DROP TYPE "public"."enum_policies_blocks_ages_source";
  DROP TYPE "public"."enum_policies_status";
  DROP TYPE "public"."enum__policies_v_blocks_ages_source";
  DROP TYPE "public"."enum__policies_v_version_status";
  DROP TYPE "public"."enum_faqs_answer_source";
  DROP TYPE "public"."enum_faqs_group";
  DROP TYPE "public"."enum_faqs_status";
  DROP TYPE "public"."enum__faqs_v_version_answer_source";
  DROP TYPE "public"."enum__faqs_v_version_group";
  DROP TYPE "public"."enum__faqs_v_version_status";
  DROP TYPE "public"."enum_passes_status";
  DROP TYPE "public"."enum__passes_v_version_status";
  DROP TYPE "public"."enum_testimonials_status";
  DROP TYPE "public"."enum__testimonials_v_version_status";
  DROP TYPE "public"."enum_redirects_source";`)
}
