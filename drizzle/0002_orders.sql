-- Orders: a customer's order taken in chat, waiting for the owner's approval.
-- Safe to run more than once, so it can also be pasted into the Supabase SQL editor on a database that already has Jawab.
DO $$ BEGIN CREATE TYPE "public"."fulfilment" AS ENUM('pickup', 'delivery'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'ready', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
ALTER TYPE "public"."run_outcome" ADD VALUE IF NOT EXISTS 'ordered' BEFORE 'escalated';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"thread_id" uuid,
	"customer_id" uuid,
	"ref_code" text NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text,
	"fulfilment" "fulfilment" DEFAULT 'pickup' NOT NULL,
	"address" text,
	"wanted" text,
	"notes" text,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"total_minor" integer NOT NULL,
	"currency" text NOT NULL,
	"stock_taken" boolean DEFAULT false NOT NULL,
	"channel" "channel_type",
	"handled_by" uuid,
	"cancel_reason" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"ready_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	CONSTRAINT "orders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "orders_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action,
	CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action,
	CONSTRAINT "orders_handled_by_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"order_id" uuid NOT NULL,
	"item_id" uuid,
	"variant_id" uuid,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_minor" integer NOT NULL,
	"note" text,
	CONSTRAINT "order_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "order_items_item_id_kb_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."kb_items"("id") ON DELETE set null ON UPDATE no action,
	CONSTRAINT "order_items_variant_id_kb_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."kb_variants"("id") ON DELETE set null ON UPDATE no action
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_items_order" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_ws_ref" ON "orders" USING btree ("workspace_id","ref_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_ws_status_created" ON "orders" USING btree ("workspace_id","status","created_at");--> statement-breakpoint
-- Live updates for the Orders page. jawab_notify() is the same function 0001_realtime creates; it is defined here too
-- (CREATE OR REPLACE, identical body) because some databases, like the production Supabase one, never got it.
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
$$ LANGUAGE plpgsql;--> statement-breakpoint
DROP TRIGGER IF EXISTS "orders_notify" ON "orders";--> statement-breakpoint
CREATE TRIGGER "orders_notify" AFTER INSERT OR UPDATE OR DELETE ON "orders" FOR EACH ROW EXECUTE FUNCTION jawab_notify();--> statement-breakpoint
-- Row-level security by workspace_id, like every other table.
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "orders_ws" ON "orders";--> statement-breakpoint
CREATE POLICY "orders_ws" ON "orders" USING (workspace_id = current_setting('app.workspace_id', true)) WITH CHECK (workspace_id = current_setting('app.workspace_id', true));--> statement-breakpoint
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "order_items_ws" ON "order_items";--> statement-breakpoint
CREATE POLICY "order_items_ws" ON "order_items" USING (workspace_id = current_setting('app.workspace_id', true)) WITH CHECK (workspace_id = current_setting('app.workspace_id', true));
