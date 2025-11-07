-- Cleanup migration: Remove obsolete tables, functions, views, and other database artifacts
-- This migration ensures the database remains clean by removing unused objects
-- All operations are idempotent and safe to run multiple times

-- ============================================================================
-- 1. Drop obsolete tables
-- ============================================================================

-- Drop magic_link_rate_limits table if it exists
-- NOTE: The codebase has been updated to use api_rate_limits instead of magic_link_rate_limits.
-- The magic link rate limiter (web/src/app/api/auth/magic-link/rateLimiter.ts) now uses
-- api_rate_limits with the 'email:' prefix to namespace magic link rate limits.
-- 
-- This table was likely created manually and is now obsolete. Magic link rate limits are
-- stored in api_rate_limits with keys prefixed with 'email:' to avoid conflicts with
-- other rate limits in the same table.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
      and table_name = 'magic_link_rate_limits'
  ) then
    -- Check if table has data before dropping
    if exists (select 1 from public.magic_link_rate_limits limit 1) then
      raise warning 'magic_link_rate_limits table contains data. Consider migrating to api_rate_limits first.';
    end if;
    
    drop table if exists public.magic_link_rate_limits cascade;
    raise notice 'Dropped obsolete table: magic_link_rate_limits (code should use api_rate_limits instead)';
  end if;
end
$$;

-- ============================================================================
-- 2. Drop obsolete functions
-- ============================================================================

-- Drop any legacy function signatures that might have been missed in previous cleanups
-- These are function overloads that are no longer needed

-- Check for any remaining legacy check_and_increment_usage signatures
-- (excluding the current uuid, integer, date signature)
do $$
declare
  rec record;
begin
  for rec in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'check_and_increment_usage'
      and pg_get_function_identity_arguments(p.oid) <> 'uuid, integer, date'
  loop
    execute format('drop function if exists %s cascade;', rec.signature);
    raise notice 'Dropped obsolete function: %', rec.signature;
  end loop;
end
$$;

-- Check for any remaining legacy check_and_increment_device_usage signatures
-- (excluding the current uuid, text, integer, date signature)
do $$
declare
  rec record;
begin
  for rec in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'check_and_increment_device_usage'
      and pg_get_function_identity_arguments(p.oid) <> 'uuid, text, integer, date'
  loop
    execute format('drop function if exists %s cascade;', rec.signature);
    raise notice 'Dropped obsolete function: %', rec.signature;
  end loop;
end
$$;

-- ============================================================================
-- 3. Drop orphaned indexes
-- ============================================================================

-- Drop indexes on non-existent tables (in case tables were dropped manually)
do $$
declare
  rec record;
begin
  for rec in
    select
      schemaname,
      indexname,
      tablename
    from pg_indexes
    where schemaname = 'public'
      and not exists (
        select 1
        from information_schema.tables t
        where t.table_schema = pg_indexes.schemaname
          and t.table_name = pg_indexes.tablename
      )
  loop
    execute format('drop index if exists %I.%I cascade;', rec.schemaname, rec.indexname);
    raise notice 'Dropped orphaned index: % on non-existent table %', rec.indexname, rec.tablename;
  end loop;
end
$$;

-- ============================================================================
-- 4. Drop orphaned views
-- ============================================================================

-- Drop views that reference non-existent tables
do $$
declare
  rec record;
  view_deps record;
  should_drop boolean;
begin
  for rec in
    select
      table_schema,
      table_name
    from information_schema.views
    where table_schema = 'public'
  loop
    should_drop := false;
    
    -- Check if view depends on non-existent tables
    for view_deps in
      select
        dependent_ns.nspname as dependent_schema,
        dependent_view.relname as dependent_view,
        source_ns.nspname as source_schema,
        source_table.relname as source_table
      from pg_depend
      join pg_rewrite on pg_depend.objid = pg_rewrite.oid
      join pg_class as dependent_view on pg_rewrite.ev_class = dependent_view.oid
      join pg_class as source_table on pg_depend.refobjid = source_table.oid
      join pg_namespace dependent_ns on dependent_ns.oid = dependent_view.relnamespace
      join pg_namespace source_ns on source_ns.oid = source_table.relnamespace
      where dependent_ns.nspname = 'public'
        and dependent_view.relname = rec.table_name
        and source_ns.nspname = 'public'
        and not exists (
          select 1
          from information_schema.tables t
          where t.table_schema = source_ns.nspname
            and t.table_name = source_table.relname
        )
    loop
      should_drop := true;
      exit;
    end loop;
    
    if should_drop then
      execute format('drop view if exists %I.%I cascade;', rec.table_schema, rec.table_name);
      raise notice 'Dropped orphaned view: %', rec.table_name;
    end if;
  end loop;
end
$$;

-- ============================================================================
-- 5. Drop orphaned policies
-- ============================================================================

-- Drop RLS policies on non-existent tables
do $$
declare
  rec record;
begin
  for rec in
    select
      schemaname,
      tablename,
      policyname
    from pg_policies
    where schemaname = 'public'
      and not exists (
        select 1
        from information_schema.tables t
        where t.table_schema = pg_policies.schemaname
          and t.table_name = pg_policies.tablename
      )
  loop
    execute format('drop policy if exists %I on %I.%I;', rec.policyname, rec.schemaname, rec.tablename);
    raise notice 'Dropped orphaned policy: % on non-existent table %', rec.policyname, rec.tablename;
  end loop;
end
$$;

-- ============================================================================
-- 6. Clean up orphaned sequences
-- ============================================================================

-- Drop sequences that are not owned by any table column
-- (These might be left over from dropped tables)
do $$
declare
  rec record;
begin
  for rec in
    select
      sequence_schema,
      sequence_name
    from information_schema.sequences
    where sequence_schema = 'public'
      and not exists (
        select 1
        from pg_depend d
        join pg_class c on d.objid = c.oid
        join pg_namespace n on c.relnamespace = n.oid
        where n.nspname = sequence_schema
          and c.relname = sequence_name
          and d.deptype = 'a' -- auto dependency (owned by column)
      )
      and sequence_name not like '%_id_seq' -- Keep common sequences that might be used
  loop
    -- Only drop if sequence is truly orphaned (not referenced by any table)
    if not exists (
      select 1
      from information_schema.columns c
      where c.table_schema = rec.sequence_schema
        and c.column_default like '%' || rec.sequence_name || '%'
    ) then
      execute format('drop sequence if exists %I.%I cascade;', rec.sequence_schema, rec.sequence_name);
      raise notice 'Dropped orphaned sequence: %', rec.sequence_name;
    end if;
  end loop;
end
$$;

-- ============================================================================
-- 7. Clean up storage policies (if any orphaned)
-- ============================================================================

-- Note: Storage policies are managed separately, but we can check for obviously obsolete ones
-- The cleanup_legacy_usage_artifacts migration already cleaned up some storage policies
-- This section is kept for reference but shouldn't need to drop anything

-- ============================================================================
-- 8. Refresh PostgREST schema cache
-- ============================================================================

-- Ensure schema cache is refreshed after cleanup
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'pgrest'
      and p.proname = 'schema_cache_reload'
  ) then
    perform pgrest.schema_cache_reload();
    raise notice 'Refreshed PostgREST schema cache';
  else
    -- Fallback: send notification directly
    perform pg_notify('pgrst', 'reload schema');
    raise notice 'Sent PostgREST schema reload notification';
  end if;
end
$$;

-- ============================================================================
-- Summary
-- ============================================================================

-- This migration is idempotent and safe to run multiple times.
-- It removes:
-- 1. Obsolete tables (magic_link_rate_limits - see warning above)
-- 2. Legacy function overloads (old signatures of check_and_increment_usage, etc.)
-- 3. Orphaned indexes (indexes on non-existent tables)
-- 4. Orphaned views (views referencing non-existent tables)
-- 5. Orphaned RLS policies (policies on non-existent tables)
-- 6. Orphaned sequences (sequences not owned by any table)
-- 7. Refreshes the PostgREST schema cache

-- NOTE: The codebase has been updated to use api_rate_limits instead of magic_link_rate_limits.
-- Before running this migration, ensure any data in magic_link_rate_limits has been migrated
-- to api_rate_limits if needed (though this is unlikely as the tables have the same structure
-- and keys are prefixed with 'email:' for magic link rate limits).

-- Note: This migration does NOT drop tables that are actively used:
-- - api_rate_limits (used for rate limiting)
-- - audit_logs (used for audit logging)
-- - template_render_events (used for telemetry)
-- - template_render_metrics (view, used for telemetry)
-- - offer_text_templates (used for templates)
-- - usage_counters (used for quota tracking)
-- - sessions (used for session management)
-- - device_usage_counters (used for device quota)
-- - pdf_jobs (used for PDF generation)
-- - profiles, offers, recipients, clients, activities (created outside migrations but actively used)

-- Functions that are kept (actively used):
-- - check_and_increment_usage(uuid, integer, date)
-- - check_and_increment_device_usage(uuid, text, integer, date)
-- - check_quota_with_pending
-- - check_device_quota_with_pending
-- - get_quota_snapshot
-- - increment_rate_limit
-- - count_successful_pdfs
-- - recalculate_usage_from_pdfs
-- - count_successful_pdfs_per_device
-- - recalculate_device_usage_from_pdfs
-- - refresh_pdf_jobs_schema_cache
-- - pgrest.schema_cache_reload

