-- Payment receipts: what a customer sent to pay for an order, and what Yapoz made of it (advice for the owner).
-- Safe to run more than once, so it can also be pasted into the Supabase SQL editor on a database that already has Yapoz.
-- Needs jawab_notify() from 0002_orders.sql.
DO $$ BEGIN CREATE TYPE "public"."receipt_verdict" AS ENUM('consistent', 'review', 'mismatch', 'unreadable'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"order_id" uuid NOT NULL,
	"thread_id" uuid,
	"mime" text NOT NULL,
	"sha256" text NOT NULL,
	"bytes" "bytea" NOT NULL,
	"reading" jsonb,
	"checks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verdict" "receipt_verdict" NOT NULL,
	"model" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_receipts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "order_receipts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "order_receipts_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "receipts_order" ON "order_receipts" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "receipts_ws_hash" ON "order_receipts" USING btree ("workspace_id","sha256");--> statement-breakpoint
-- Live updates for the Orders page when a receipt arrives.
DROP TRIGGER IF EXISTS "order_receipts_notify" ON "order_receipts";--> statement-breakpoint
CREATE TRIGGER "order_receipts_notify" AFTER INSERT OR UPDATE OR DELETE ON "order_receipts" FOR EACH ROW EXECUTE FUNCTION jawab_notify();--> statement-breakpoint
-- Row-level security by workspace_id, like every other table.
ALTER TABLE "order_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "order_receipts_ws" ON "order_receipts";--> statement-breakpoint
CREATE POLICY "order_receipts_ws" ON "order_receipts" USING (workspace_id = current_setting('app.workspace_id', true)) WITH CHECK (workspace_id = current_setting('app.workspace_id', true));
