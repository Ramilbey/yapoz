CREATE TYPE "public"."author" AS ENUM('customer', 'ai', 'staff', 'system');
CREATE TYPE "public"."booking_status" AS ENUM('confirmed', 'cancelled', 'seated', 'no_show');
CREATE TYPE "public"."booking_unit" AS ENUM('party', 'appointment', 'day');
CREATE TYPE "public"."candidate_source" AS ENUM('telegram_channel', 'bot_apply', 'upload');
CREATE TYPE "public"."channel_mode" AS ENUM('autopilot', 'copilot');
CREATE TYPE "public"."channel_type" AS ENUM('telegram', 'whatsapp', 'instagram', 'simulator');
CREATE TYPE "public"."direction" AS ENUM('in', 'out');
CREATE TYPE "public"."escalation_status" AS ENUM('open', 'resolved');
CREATE TYPE "public"."interview_status" AS ENUM('offered', 'scheduled', 'done', 'cancelled');
CREATE TYPE "public"."job_status" AS ENUM('queued', 'running', 'done', 'failed');
CREATE TYPE "public"."kb_kind" AS ENUM('product', 'service', 'policy', 'faq', 'hours', 'info');
CREATE TYPE "public"."message_status" AS ENUM('received', 'pending_approval', 'sent', 'failed', 'discarded');
CREATE TYPE "public"."run_outcome" AS ENUM('auto_resolved', 'booked', 'escalated', 'drafted', 'declined', 'error');
CREATE TYPE "public"."outreach_kind" AS ENUM('invite', 'rejection');
CREATE TYPE "public"."outreach_status" AS ENUM('draft', 'approved', 'sent', 'failed', 'cancelled');
CREATE TYPE "public"."priority" AS ENUM('low', 'normal', 'high', 'urgent');
CREATE TYPE "public"."role" AS ENUM('owner', 'service', 'hr');
CREATE TYPE "public"."stage" AS ENUM('sourced', 'shortlisted', 'invited', 'scheduled', 'interviewed', 'hired', 'rejected');
CREATE TYPE "public"."thread_status" AS ENUM('open', 'needs_human', 'resolved');
CREATE TABLE "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"thread_id" uuid NOT NULL,
	"inbound_message_id" uuid,
	"channel" "channel_type" NOT NULL,
	"model" text NOT NULL,
	"intent" text,
	"topic" text,
	"language" text,
	"sentiment" text,
	"confidence" numeric,
	"tool_calls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"latency_ms" integer,
	"first_response_ms" integer,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cache_read_tokens" integer DEFAULT 0 NOT NULL,
	"cache_write_tokens" integer DEFAULT 0 NOT NULL,
	"outcome" "run_outcome" NOT NULL,
	"error" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "booking_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"unit" "booking_unit" NOT NULL,
	"capacity" integer NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"slot_minutes" integer DEFAULT 30 NOT NULL,
	"max_per_booking" integer DEFAULT 1 NOT NULL,
	"lead_minutes" integer DEFAULT 60 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"thread_id" uuid,
	"customer_id" uuid,
	"customer_name" text NOT NULL,
	"phone" text,
	"kind" text DEFAULT 'booking' NOT NULL,
	"booking_type_id" uuid,
	"service_item_id" uuid,
	"service_name" text,
	"party_size" integer NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"notes" text,
	"ref_code" text NOT NULL,
	"status" "booking_status" DEFAULT 'confirmed' NOT NULL,
	"channel" "channel_type",
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "bot_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"channel" "channel_type" NOT NULL,
	"chat_id" text NOT NULL,
	"flow" text NOT NULL,
	"step" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"kind" text DEFAULT 'busy' NOT NULL,
	"interview_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL
);

CREATE TABLE "candidate_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"candidate_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" "bytea" NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"full_name" text NOT NULL,
	"source" "candidate_source" NOT NULL,
	"source_ref" text,
	"role_interest" text,
	"telegram_chat_id" text,
	"telegram_bot" text,
	"telegram_username" text,
	"phone" text,
	"email" text,
	"language" text DEFAULT 'en' NOT NULL,
	"district" text,
	"total_years" numeric,
	"availability" text[] DEFAULT '{}' NOT NULL,
	"profile" jsonb,
	"raw_text" text NOT NULL,
	"consent" boolean DEFAULT false NOT NULL,
	"consent_at" timestamp with time zone,
	"parsed_by" text,
	"parsed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"type" "channel_type" NOT NULL,
	"mode" "channel_mode" DEFAULT 'autopilot' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"credentials_enc" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"channel" "channel_type" NOT NULL,
	"external_id" text NOT NULL,
	"display_name" text,
	"username" text,
	"phone" text,
	"language" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "escalations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"thread_id" uuid NOT NULL,
	"agent_run_id" uuid,
	"reason" text NOT NULL,
	"category" text NOT NULL,
	"priority" "priority" DEFAULT 'normal' NOT NULL,
	"summary" text NOT NULL,
	"status" "escalation_status" DEFAULT 'open' NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"type" text NOT NULL,
	"props" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" uuid,
	"provider" text NOT NULL,
	"data_enc" text NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"match_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"requisition_id" uuid NOT NULL,
	"outreach_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"mode" text DEFAULT 'onsite' NOT NULL,
	"location" text,
	"meet_url" text,
	"provider" text DEFAULT 'builtin' NOT NULL,
	"external_event_id" text,
	"status" "interview_status" DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "invites" (
	"token" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"email" text NOT NULL,
	"role" "role" NOT NULL,
	"created_by" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text,
	"type" text NOT NULL,
	"dedupe_key" text,
	"payload" jsonb NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"run_after" timestamp with time zone DEFAULT now() NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "kb_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"kind" "kb_kind" NOT NULL,
	"category" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"availability_note" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "kb_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"item_id" uuid NOT NULL,
	"size" text,
	"color" text,
	"option" text,
	"price_minor" integer NOT NULL,
	"stock" integer,
	"sku" text
);

CREATE TABLE "knowledge_gaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"key" text NOT NULL,
	"question" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"kb_item_id" uuid,
	"is_demo" boolean DEFAULT false NOT NULL,
	"first_asked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_asked_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"requisition_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"score" integer,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"summary" text,
	"distance_km" numeric,
	"stage" "stage" DEFAULT 'sourced' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"thread_id" uuid NOT NULL,
	"direction" "direction" NOT NULL,
	"author" "author" NOT NULL,
	"author_user_id" uuid,
	"text" text NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "message_status" NOT NULL,
	"external_message_id" text,
	"agent_run_id" uuid,
	"error" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "outreach" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"match_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"kind" "outreach_kind" NOT NULL,
	"channel" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"interview_mode" text,
	"slots" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"draft" text NOT NULL,
	"final_text" text,
	"status" "outreach_status" DEFAULT 'draft' NOT NULL,
	"approver_id" uuid,
	"approved_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "requisitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"raw_request" text,
	"criteria" jsonb,
	"fairness_notice" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_by" uuid,
	"ranked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "setup_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"kind" text NOT NULL,
	"filename" text,
	"mime" text,
	"bytes" "bytea",
	"text" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "telegram_business_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text,
	"bot_id" text,
	"owner_user_id" text NOT NULL,
	"owner_chat_id" text,
	"can_reply" boolean DEFAULT false NOT NULL,
	"rights" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "telegram_chat_bindings" (
	"bot_id" text NOT NULL,
	"chat_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "telegram_links" (
	"code" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"telegram_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);

CREATE TABLE "threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"channel" "channel_type" NOT NULL,
	"external_thread_id" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"status" "thread_status" DEFAULT 'open' NOT NULL,
	"ai_paused" boolean DEFAULT false NOT NULL,
	"taken_over_by" uuid,
	"routing" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"accent" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_inbound_at" timestamp with time zone,
	"last_preview" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"timezone" text NOT NULL,
	"currency" text NOT NULL,
	"settings" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "booking_types" ADD CONSTRAINT "booking_types_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_booking_type_id_booking_types_id_fk" FOREIGN KEY ("booking_type_id") REFERENCES "public"."booking_types"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "bot_sessions" ADD CONSTRAINT "bot_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "channels" ADD CONSTRAINT "channels_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "customers" ADD CONSTRAINT "customers_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "events" ADD CONSTRAINT "events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invites" ADD CONSTRAINT "invites_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invites" ADD CONSTRAINT "invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "kb_items" ADD CONSTRAINT "kb_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "kb_variants" ADD CONSTRAINT "kb_variants_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "kb_variants" ADD CONSTRAINT "kb_variants_item_id_kb_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."kb_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "knowledge_gaps" ADD CONSTRAINT "knowledge_gaps_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "matches" ADD CONSTRAINT "matches_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "matches" ADD CONSTRAINT "matches_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "matches" ADD CONSTRAINT "matches_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "outreach" ADD CONSTRAINT "outreach_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "outreach" ADD CONSTRAINT "outreach_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "outreach" ADD CONSTRAINT "outreach_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "outreach" ADD CONSTRAINT "outreach_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "setup_sources" ADD CONSTRAINT "setup_sources_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "telegram_business_connections" ADD CONSTRAINT "telegram_business_connections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "telegram_chat_bindings" ADD CONSTRAINT "telegram_chat_bindings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "telegram_links" ADD CONSTRAINT "telegram_links_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "threads" ADD CONSTRAINT "threads_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "threads" ADD CONSTRAINT "threads_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "threads" ADD CONSTRAINT "threads_taken_over_by_users_id_fk" FOREIGN KEY ("taken_over_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "users" ADD CONSTRAINT "users_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "runs_ws_created" ON "agent_runs" USING btree ("workspace_id","created_at");
CREATE UNIQUE INDEX "booking_types_ws_key" ON "booking_types" USING btree ("workspace_id","key");
CREATE UNIQUE INDEX "bookings_ref" ON "bookings" USING btree ("ref_code");
CREATE INDEX "bookings_ws_start" ON "bookings" USING btree ("workspace_id","starts_at");
CREATE UNIQUE INDEX "bot_sessions_chat" ON "bot_sessions" USING btree ("workspace_id","channel","chat_id");
CREATE INDEX "cal_ws_start" ON "calendar_events" USING btree ("workspace_id","starts_at");
CREATE INDEX "cand_ws" ON "candidates" USING btree ("workspace_id");
CREATE UNIQUE INDEX "channels_ws_type" ON "channels" USING btree ("workspace_id","type");
CREATE UNIQUE INDEX "customers_ws_ch_ext" ON "customers" USING btree ("workspace_id","channel","external_id");
CREATE INDEX "esc_ws_status" ON "escalations" USING btree ("workspace_id","status");
CREATE INDEX "events_ws_type_created" ON "events" USING btree ("workspace_id","type","created_at");
CREATE UNIQUE INDEX "integrations_ws_provider" ON "integrations" USING btree ("workspace_id","provider");
CREATE UNIQUE INDEX "jobs_dedupe" ON "jobs" USING btree ("dedupe_key");
CREATE INDEX "jobs_status_run" ON "jobs" USING btree ("status","run_after");
CREATE UNIQUE INDEX "kb_ws_slug" ON "kb_items" USING btree ("workspace_id","slug");
CREATE INDEX "kb_ws_kind" ON "kb_items" USING btree ("workspace_id","kind");
CREATE INDEX "variants_item" ON "kb_variants" USING btree ("item_id");
CREATE UNIQUE INDEX "gaps_ws_key" ON "knowledge_gaps" USING btree ("workspace_id","key");
CREATE UNIQUE INDEX "matches_req_cand" ON "matches" USING btree ("requisition_id","candidate_id");
CREATE INDEX "messages_thread_created" ON "messages" USING btree ("thread_id","created_at");
CREATE INDEX "messages_ws_created" ON "messages" USING btree ("workspace_id","created_at");
CREATE UNIQUE INDEX "tg_bind_bot_chat" ON "telegram_chat_bindings" USING btree ("bot_id","chat_id");
CREATE UNIQUE INDEX "threads_ws_ch_ext" ON "threads" USING btree ("workspace_id","channel","external_thread_id");
CREATE INDEX "threads_ws_last" ON "threads" USING btree ("workspace_id","last_message_at");
CREATE UNIQUE INDEX "users_ws_email" ON "users" USING btree ("workspace_id","email");-- Realtime: every change on these tables emits pg_notify('ws_<workspace>', {...}).
CREATE OR REPLACE FUNCTION jawab_notify() RETURNS trigger AS $$
DECLARE
  rec jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN rec := to_jsonb(OLD); ELSE rec := to_jsonb(NEW); END IF;
  PERFORM pg_notify(
    'ws_' || lower(rec->>'workspace_id'),
    json_build_object(
      't', TG_TABLE_NAME,
      'op', TG_OP,
      'id', rec->>'id',
      'thread', rec->>'thread_id',
      'demo', COALESCE((rec->>'is_demo')::boolean, false)
    )::text
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['threads','messages','escalations','bookings','booking_types','agent_runs','kb_items','kb_variants','knowledge_gaps','requisitions','candidates','matches','outreach','interviews','calendar_events','channels','users','invites']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', tbl || '_notify', tbl);
    EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION jawab_notify()', tbl || '_notify', tbl);
  END LOOP;
END $$;

-- Row-level security by workspace_id (defense in depth). The app connects as the table owner and scopes
-- every query in code; these policies apply to any other role (e.g. Supabase anon/authenticated) and
-- deny access unless app.workspace_id is set to the row's workspace.
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['users','channels','customers','threads','messages','agent_runs','escalations','kb_items','kb_variants','booking_types','knowledge_gaps','bookings','requisitions','candidates','candidate_documents','matches','outreach','interviews','calendar_events','integrations','telegram_business_connections','bot_sessions','events','invites','telegram_links','telegram_chat_bindings','setup_sources']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_ws', tbl);
    EXECUTE format('CREATE POLICY %I ON %I USING (workspace_id = current_setting(''app.workspace_id'', true)) WITH CHECK (workspace_id = current_setting(''app.workspace_id'', true))', tbl || '_ws', tbl);
  END LOOP;
END $$;
