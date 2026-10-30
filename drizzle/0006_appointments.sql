-- Appointments: customers book a service with a staff member in chat. Each booking is an order (kind = 'appointment')
-- so approval, payment receipts and the payment timer work the same as for orders; the time, staff member and meeting
-- room live in "appointments". Staff (any login) switch on taking appointments and set their own hours in "staff".
-- Existing data is untouched: every existing order is kind 'order', every service is online until marked in person.
-- Safe to run more than once (Supabase SQL editor too).
CREATE TABLE IF NOT EXISTS "staff" (
	"user_id" uuid PRIMARY KEY NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
	"workspace_id" text NOT NULL REFERENCES "public"."workspaces"("id") ON DELETE cascade,
	"takes_appointments" boolean DEFAULT false NOT NULL,
	"schedule" jsonb,
	"service_ids" uuid[] DEFAULT '{}' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL REFERENCES "public"."workspaces"("id") ON DELETE cascade,
	"order_id" uuid NOT NULL REFERENCES "public"."orders"("id") ON DELETE cascade,
	"staff_id" uuid REFERENCES "public"."users"("id") ON DELETE set null,
	"item_id" uuid REFERENCES "public"."kb_items"("id") ON DELETE set null,
	"variant_id" uuid REFERENCES "public"."kb_variants"("id") ON DELETE set null,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"meet_link" text,
	"attendance" text,
	"attendance_by" uuid REFERENCES "public"."users"("id") ON DELETE set null,
	"attendance_at" timestamp with time zone,
	"reminded_at" timestamp with time zone,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "kb_items" ADD COLUMN IF NOT EXISTS "in_person" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "kind" text DEFAULT 'order' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "appointments_order" ON "appointments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_staff_start" ON "appointments" USING btree ("staff_id","starts_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_ws_start" ON "appointments" USING btree ("workspace_id","starts_at");--> statement-breakpoint
-- Live updates (jawab_notify() comes from 0001/0002) and the same workspace row-level policy as every other table.
DROP TRIGGER IF EXISTS "appointments_notify" ON "appointments";--> statement-breakpoint
CREATE TRIGGER "appointments_notify" AFTER INSERT OR UPDATE OR DELETE ON "appointments" FOR EACH ROW EXECUTE FUNCTION jawab_notify();--> statement-breakpoint
DROP TRIGGER IF EXISTS "staff_notify" ON "staff";--> statement-breakpoint
CREATE TRIGGER "staff_notify" AFTER INSERT OR UPDATE OR DELETE ON "staff" FOR EACH ROW EXECUTE FUNCTION jawab_notify();--> statement-breakpoint
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "appointments_ws" ON "appointments";--> statement-breakpoint
CREATE POLICY "appointments_ws" ON "appointments" USING (workspace_id = current_setting('app.workspace_id', true)) WITH CHECK (workspace_id = current_setting('app.workspace_id', true));--> statement-breakpoint
ALTER TABLE "staff" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "staff_ws" ON "staff";--> statement-breakpoint
CREATE POLICY "staff_ws" ON "staff" USING (workspace_id = current_setting('app.workspace_id', true)) WITH CHECK (workspace_id = current_setting('app.workspace_id', true));
