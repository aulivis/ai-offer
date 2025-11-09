-- Additional database indexes for query optimization
-- These indexes improve performance for common query patterns
-- All indexes are created conditionally and only if tables exist

-- Helper function to safely create indexes only if table exists
do $$
begin
  -- Index for querying offers by user_id and status (common in dashboard)
  -- Only create if offers table exists (may be created outside migrations)
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'offers'
  ) then
    -- Check if index already exists before creating
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'offers' 
        and indexname = 'idx_offers_user_id_status'
    ) then
      create index idx_offers_user_id_status 
        on public.offers(user_id, status) 
        where status is not null;
    end if;
    
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'offers' 
        and indexname = 'idx_offers_user_id_created_at'
    ) then
      create index idx_offers_user_id_created_at 
        on public.offers(user_id, created_at desc);
    end if;
  end if;

  -- Index for querying PDF jobs by status and created_at (for pending job processing)
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'pdf_jobs'
  ) then
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'pdf_jobs' 
        and indexname = 'idx_pdf_jobs_status_created_at'
    ) then
      create index idx_pdf_jobs_status_created_at 
        on public.pdf_jobs(status, created_at) 
        where status in ('pending', 'processing');
    end if;
    
    -- Composite index for user_id and offer_id lookups in PDF jobs
    -- Only create if composite index doesn't already exist
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'pdf_jobs' 
        and indexname = 'idx_pdf_jobs_user_offer'
    ) then
      create index idx_pdf_jobs_user_offer 
        on public.pdf_jobs(user_id, offer_id);
    end if;
  end if;

  -- Index for sessions query by user_id and revoked_at (for active session checks)
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'sessions'
  ) then
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'sessions' 
        and indexname = 'idx_sessions_user_revoked'
    ) then
      create index idx_sessions_user_revoked 
        on public.sessions(user_id, revoked_at) 
        where revoked_at is null;
    end if;
  end if;

  -- Index for usage counters by user_id and period_start (for usage queries)
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'usage_counters'
  ) then
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'usage_counters' 
        and indexname = 'idx_usage_counters_user_period'
    ) then
      create index idx_usage_counters_user_period 
        on public.usage_counters(user_id, period_start desc);
    end if;
  end if;

  -- Index for device usage counters by user_id and period_start
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'device_usage_counters'
  ) then
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'device_usage_counters' 
        and indexname = 'idx_device_usage_user_period'
    ) then
      create index idx_device_usage_user_period 
        on public.device_usage_counters(user_id, period_start desc);
    end if;
  end if;

  -- Index for audit logs by user_id and created_at (for user activity queries)
  -- Note: This index adds created_at for sorting, complementing existing user_id index
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'audit_logs'
  ) then
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'audit_logs' 
        and indexname = 'idx_audit_logs_user_created'
    ) then
      create index idx_audit_logs_user_created 
        on public.audit_logs(user_id, created_at desc);
    end if;
  end if;

  -- Note: recipients table has been removed (use clients table instead)
  -- This index creation is kept for backwards compatibility but will be a no-op
  -- if recipients table doesn't exist (which is expected)
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'recipients'
  ) then
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'recipients' 
        and indexname = 'idx_recipients_user_id'
    ) then
      create index idx_recipients_user_id 
        on public.recipients(user_id);
    end if;
  end if;

  -- Index for offer_text_templates by user_id and updated_at (for recent templates)
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'offer_text_templates'
  ) then
    -- Only create if composite index doesn't already exist
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'offer_text_templates' 
        and indexname = 'idx_offer_text_templates_user_updated'
    ) then
      create index idx_offer_text_templates_user_updated 
        on public.offer_text_templates(user_id, updated_at desc);
    end if;
  end if;

  -- Index for template_render_events (for telemetry queries)
  -- Note: template_render_metrics is a view, so we index the underlying table
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'template_render_events'
  ) then
    -- The table already has template_id index, but we can add a composite for common queries
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'template_render_events' 
        and indexname = 'idx_template_render_events_template_created'
    ) then
      create index idx_template_render_events_template_created 
        on public.template_render_events(template_id, created_at desc);
    end if;
  end if;
end
$$;
