-- Stock modes (made to order, daily quantity, tracked count), holds that reserve stock when an order is placed, an
-- "expired" order status for orders whose payment didn't arrive in time, and low-stock cards that aren't about a chat.
-- Existing data: items whose options already had a stock count become "tracked"; everything else follows the
-- business's default mode. Existing orders get no holds and no timer. Safe to run more than once (Supabase SQL editor too).
DO $$ BEGIN
  CREATE TYPE "public"."hold_status" AS ENUM('held', 'firm', 'consumed', 'released');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."stock_mode" AS ENUM('none', 'daily', 'tracked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE IF NOT EXISTS 'expired';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_stock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL REFERENCES "public"."workspaces"("id") ON DELETE cascade,
	"variant_id" uuid NOT NULL REFERENCES "public"."kb_variants"("id") ON DELETE cascade,
	"date" date NOT NULL,
	"qty" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL REFERENCES "public"."workspaces"("id") ON DELETE cascade,
	"order_id" uuid NOT NULL REFERENCES "public"."orders"("id") ON DELETE cascade,
	"variant_id" uuid NOT NULL REFERENCES "public"."kb_variants"("id") ON DELETE cascade,
	"date" date,
	"qty" integer NOT NULL,
	"status" "hold_status" DEFAULT 'held' NOT NULL,
	"expires_at" timestamp with time zone,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "escalations" ALTER COLUMN "thread_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "escalations" ADD COLUMN IF NOT EXISTS "dedupe_key" text;--> statement-breakpoint
ALTER TABLE "kb_items" ADD COLUMN IF NOT EXISTS "unavailable_until" date;--> statement-breakpoint
ALTER TABLE "kb_items" ADD COLUMN IF NOT EXISTS "stock_mode" "stock_mode";--> statement-breakpoint
ALTER TABLE "kb_variants" ADD COLUMN IF NOT EXISTS "daily_qty" integer;--> statement-breakpoint
ALTER TABLE "kb_variants" ADD COLUMN IF NOT EXISTS "low_stock_at" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "wanted_date" date;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "hold_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "firmed_by" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "expired_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "daily_stock_variant_date" ON "daily_stock" USING btree ("variant_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "holds_variant_status" ON "stock_holds" USING btree ("variant_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "holds_order" ON "stock_holds" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "esc_dedupe_open" ON "escalations" USING btree ("workspace_id","dedupe_key") WHERE status = 'open' and dedupe_key is not null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_hold_due" ON "orders" USING btree ("hold_expires_at") WHERE status = 'pending' and hold_expires_at is not null;--> statement-breakpoint
-- Options that already counted stock keep counting it, whatever the business default turns out to be.
UPDATE "kb_items" i SET "stock_mode" = 'tracked'
  WHERE i."stock_mode" IS NULL AND EXISTS (SELECT 1 FROM "kb_variants" v WHERE v."item_id" = i."id" AND v."stock" IS NOT NULL);--> statement-breakpoint
-- Live updates (jawab_notify() comes from 0001/0002) and the same workspace row-level policy as every other table.
DROP TRIGGER IF EXISTS "stock_holds_notify" ON "stock_holds";--> statement-breakpoint
CREATE TRIGGER "stock_holds_notify" AFTER INSERT OR UPDATE OR DELETE ON "stock_holds" FOR EACH ROW EXECUTE FUNCTION jawab_notify();--> statement-breakpoint
DROP TRIGGER IF EXISTS "daily_stock_notify" ON "daily_stock";--> statement-breakpoint
CREATE TRIGGER "daily_stock_notify" AFTER INSERT OR UPDATE OR DELETE ON "daily_stock" FOR EACH ROW EXECUTE FUNCTION jawab_notify();--> statement-breakpoint
ALTER TABLE "stock_holds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "stock_holds_ws" ON "stock_holds";--> statement-breakpoint
CREATE POLICY "stock_holds_ws" ON "stock_holds" USING (workspace_id = current_setting('app.workspace_id', true)) WITH CHECK (workspace_id = current_setting('app.workspace_id', true));--> statement-breakpoint
ALTER TABLE "daily_stock" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "daily_stock_ws" ON "daily_stock";--> statement-breakpoint
CREATE POLICY "daily_stock_ws" ON "daily_stock" USING (workspace_id = current_setting('app.workspace_id', true)) WITH CHECK (workspace_id = current_setting('app.workspace_id', true));
