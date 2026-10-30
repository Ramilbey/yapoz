-- First-time email verification for self-serve sign-ups.
-- Safe to run more than once, so it can also be pasted into the Supabase SQL editor on a database that already has Jawab.
-- The column default marks every existing user as verified, so nobody already on Jawab gets locked out.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_verifications" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "email_verifications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint
-- Row-level security by workspace_id, like every other table.
ALTER TABLE "email_verifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "email_verifications_ws" ON "email_verifications";--> statement-breakpoint
CREATE POLICY "email_verifications_ws" ON "email_verifications" USING (workspace_id = current_setting('app.workspace_id', true)) WITH CHECK (workspace_id = current_setting('app.workspace_id', true));
