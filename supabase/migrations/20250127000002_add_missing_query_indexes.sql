-- Additional database indexes for query optimization
-- These indexes improve performance for common query patterns identified in code review
-- All indexes are created conditionally and only if tables exist

do $$
begin
  -- Index for PDF jobs JSONB queries (payload->>usagePeriodStart and payload->>deviceId)
  -- This GIN index enables efficient queries on JSONB fields used in countPendingPdfJobs
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'pdf_jobs'
  ) then
    -- GIN index for JSONB payload queries
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'pdf_jobs' 
        and indexname = 'idx_pdf_jobs_payload_gin'
    ) then
      create index idx_pdf_jobs_payload_gin 
        on public.pdf_jobs using gin(payload);
    end if;
    
    -- Composite index for common query pattern: user_id + status + payload JSONB queries
    -- This optimizes countPendingPdfJobs queries
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'pdf_jobs' 
        and indexname = 'idx_pdf_jobs_user_status_payload'
    ) then
      create index idx_pdf_jobs_user_status_payload 
        on public.pdf_jobs(user_id, status) 
        where status in ('pending', 'processing');
    end if;
    
    -- Index for download_token lookups (used in PDF download endpoints)
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'pdf_jobs' 
        and indexname = 'idx_pdf_jobs_download_token'
    ) then
      create index idx_pdf_jobs_download_token 
        on public.pdf_jobs(download_token) 
        where download_token is not null;
    end if;
  end if;

  -- Index for device_usage_counters composite queries
  -- Queries filter by (user_id, device_id, period_start)
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'device_usage_counters'
  ) then
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'device_usage_counters' 
        and indexname = 'idx_device_usage_user_device_period'
    ) then
      create index idx_device_usage_user_device_period 
        on public.device_usage_counters(user_id, device_id, period_start desc);
    end if;
  end if;

  -- Index for activities table (user_id lookups)
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'activities'
  ) then
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'activities' 
        and indexname = 'idx_activities_user_id'
    ) then
      create index idx_activities_user_id 
        on public.activities(user_id);
    end if;
    
    -- Index for activities by user_id and created_at (for sorting)
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'activities' 
        and indexname = 'idx_activities_user_created'
    ) then
      create index idx_activities_user_created 
        on public.activities(user_id, created_at desc);
    end if;
  end if;

  -- Index for offers table by recipient lookups (if recipients table exists)
  -- This optimizes queries that join offers with recipients
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'offers'
  ) then
    -- Index for industry filtering (common in dashboard)
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'offers' 
        and indexname = 'idx_offers_user_industry'
    ) then
      create index idx_offers_user_industry 
        on public.offers(user_id, industry) 
        where industry is not null;
    end if;
  end if;

  -- Index for profiles table plan lookups (frequently queried)
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    -- Index for plan queries (used in usage checks)
    if not exists (
      select 1 from pg_indexes 
      where schemaname = 'public' 
        and tablename = 'profiles' 
        and indexname = 'idx_profiles_plan'
    ) then
      create index idx_profiles_plan 
        on public.profiles(plan) 
        where plan is not null;
    end if;
  end if;
end
$$;




