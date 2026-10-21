-- Realtime: every change on these tables emits pg_notify('ws_<workspace>', {...}).
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
--> statement-breakpoint
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['threads','messages','escalations','bookings','booking_types','agent_runs','kb_items','kb_variants','knowledge_gaps','requisitions','candidates','matches','outreach','interviews','calendar_events','channels','users','invites']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', tbl || '_notify', tbl);
    EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION jawab_notify()', tbl || '_notify', tbl);
  END LOOP;
END $$;
--> statement-breakpoint
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
