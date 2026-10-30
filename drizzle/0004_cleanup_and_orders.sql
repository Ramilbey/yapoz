-- Booking, hiring and Instagram are removed. Their tables go, rows that only made sense for them go
-- (HR accounts, Instagram customers and their conversations), and the enums lose the old values.
-- New: receipt re-requests, customer-notification tracking, delivery receipts, session revocation, and
-- indexes that keep the inbox fast and stop a retried webhook from saving the same message twice.
-- Safe to run more than once (it can also be pasted into the Supabase SQL editor).
DROP TABLE IF EXISTS "calendar_events", "interviews", "outreach", "matches", "candidate_documents", "candidates", "requisitions", "bookings", "booking_types", "bot_sessions" CASCADE;--> statement-breakpoint
DROP TYPE IF EXISTS "public"."booking_status";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."booking_unit";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."candidate_source";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."interview_status";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."outreach_kind";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."outreach_status";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."stage";--> statement-breakpoint
DELETE FROM "integrations" WHERE "provider" = 'google';--> statement-breakpoint
UPDATE "workspaces" SET "settings" = "settings" - 'modules' - 'hr' - 'resumeRetentionDays' WHERE "settings" ?| array['modules', 'hr', 'resumeRetentionDays'];--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'role' AND e.enumlabel = 'hr') THEN
    DELETE FROM "invites" WHERE "role" = 'hr';
    DELETE FROM "users" WHERE "role" = 'hr';
    ALTER TABLE "invites" ALTER COLUMN "role" SET DATA TYPE text;
    ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
    DROP TYPE "public"."role";
    CREATE TYPE "public"."role" AS ENUM('owner', 'service');
    ALTER TABLE "invites" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";
    ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'channel_type' AND e.enumlabel = 'instagram') THEN
    UPDATE "orders" SET "channel" = NULL WHERE "channel" = 'instagram';
    DELETE FROM "customers" WHERE "channel" = 'instagram';
    DELETE FROM "threads" WHERE "channel" = 'instagram';
    DELETE FROM "agent_runs" WHERE "channel" = 'instagram';
    DELETE FROM "channels" WHERE "type" = 'instagram';
    ALTER TABLE "agent_runs" ALTER COLUMN "channel" SET DATA TYPE text;
    ALTER TABLE "channels" ALTER COLUMN "type" SET DATA TYPE text;
    ALTER TABLE "customers" ALTER COLUMN "channel" SET DATA TYPE text;
    ALTER TABLE "orders" ALTER COLUMN "channel" SET DATA TYPE text;
    ALTER TABLE "threads" ALTER COLUMN "channel" SET DATA TYPE text;
    DROP TYPE "public"."channel_type";
    CREATE TYPE "public"."channel_type" AS ENUM('telegram', 'whatsapp', 'simulator');
    ALTER TABLE "agent_runs" ALTER COLUMN "channel" SET DATA TYPE "public"."channel_type" USING "channel"::"public"."channel_type";
    ALTER TABLE "channels" ALTER COLUMN "type" SET DATA TYPE "public"."channel_type" USING "type"::"public"."channel_type";
    ALTER TABLE "customers" ALTER COLUMN "channel" SET DATA TYPE "public"."channel_type" USING "channel"::"public"."channel_type";
    ALTER TABLE "orders" ALTER COLUMN "channel" SET DATA TYPE "public"."channel_type" USING "channel"::"public"."channel_type";
    ALTER TABLE "threads" ALTER COLUMN "channel" SET DATA TYPE "public"."channel_type" USING "channel"::"public"."channel_type";
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'run_outcome' AND e.enumlabel = 'booked') THEN
    ALTER TABLE "agent_runs" ALTER COLUMN "outcome" SET DATA TYPE text;
    UPDATE "agent_runs" SET "outcome" = 'auto_resolved' WHERE "outcome" = 'booked';
    DROP TYPE "public"."run_outcome";
    CREATE TYPE "public"."run_outcome" AS ENUM('auto_resolved', 'ordered', 'escalated', 'drafted', 'declined', 'error');
    ALTER TABLE "agent_runs" ALTER COLUMN "outcome" SET DATA TYPE "public"."run_outcome" USING "outcome"::"public"."run_outcome";
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "read_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "order_receipts" ADD COLUMN IF NOT EXISTS "rejected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "order_receipts" ADD COLUMN IF NOT EXISTS "rejected_reason" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "receipt_request" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "notifications" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "session_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Earlier duplicates of the same inbound message (a retried webhook racing the first delivery) would block the unique index.
DELETE FROM "messages" m USING "messages" d
  WHERE m.direction = 'in' AND m.external_message_id IS NOT NULL AND d.direction = 'in'
    AND d.thread_id = m.thread_id AND d.external_message_id = m.external_message_id AND (d.created_at, d.id) < (m.created_at, m.id);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "messages_inbound_ext" ON "messages" USING btree ("thread_id","external_message_id") WHERE direction = 'in' and external_message_id is not null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_ws_ext" ON "messages" USING btree ("workspace_id","external_message_id") WHERE external_message_id is not null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_drafts" ON "messages" USING btree ("thread_id") WHERE status = 'pending_approval';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "esc_thread_open" ON "escalations" USING btree ("thread_id") WHERE status = 'open';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_ws_created" ON "events" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_thread" ON "orders" USING btree ("thread_id");--> statement-breakpoint
-- Receipts carry the file: the generic notify function would serialize megabytes per insert just to send five fields.
CREATE OR REPLACE FUNCTION jawab_notify_receipt() RETURNS trigger AS $$
DECLARE
  r record;
BEGIN
  IF TG_OP = 'DELETE' THEN r := OLD; ELSE r := NEW; END IF;
  PERFORM pg_notify('ws_' || lower(r.workspace_id), json_build_object('t', TG_TABLE_NAME, 'op', TG_OP, 'id', r.id, 'thread', r.thread_id, 'demo', r.is_demo)::text);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
DROP TRIGGER IF EXISTS "order_receipts_notify" ON "order_receipts";--> statement-breakpoint
CREATE TRIGGER "order_receipts_notify" AFTER INSERT OR UPDATE OR DELETE ON "order_receipts" FOR EACH ROW EXECUTE FUNCTION jawab_notify_receipt();--> statement-breakpoint
-- The Activity page follows new events live.
DROP TRIGGER IF EXISTS "events_notify" ON "events";--> statement-breakpoint
CREATE TRIGGER "events_notify" AFTER INSERT ON "events" FOR EACH ROW EXECUTE FUNCTION jawab_notify();
