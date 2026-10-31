-- Order alerts: each person's alert choices, and the devices that asked for notifications.
-- Safe to run more than once, so it can also be pasted into the Supabase SQL editor on a database that already has Jawab.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "alert_prefs" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "push_subs_endpoint" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_subs_user" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
-- Row-level security by workspace_id, like every other table.
ALTER TABLE "push_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "push_subscriptions_ws" ON "push_subscriptions";--> statement-breakpoint
CREATE POLICY "push_subscriptions_ws" ON "push_subscriptions" USING (workspace_id = current_setting('app.workspace_id', true)) WITH CHECK (workspace_id = current_setting('app.workspace_id', true));
