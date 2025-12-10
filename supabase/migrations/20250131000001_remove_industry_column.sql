-- Migration: Remove industry column from offers table and industries from profiles table
-- This removes the Industry functionality completely from the database

-- Drop the industry index if it exists
do $$
begin
  if exists (
    select 1 from pg_indexes 
    where schemaname = 'public' 
      and tablename = 'offers' 
      and indexname = 'idx_offers_user_industry'
  ) then
    drop index if exists public.idx_offers_user_industry;
  end if;
end
$$;

-- Drop industry column from offers table if it exists
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'offers'
      and column_name = 'industry'
  ) then
    alter table public.offers drop column industry;
  end if;
end
$$;

-- Drop industries column from profiles table if it exists (could be text[], jsonb, or text)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'industries'
  ) then
    alter table public.profiles drop column industries;
  end if;
end
$$;










