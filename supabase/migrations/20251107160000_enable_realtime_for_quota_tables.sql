-- Enable real-time for quota-related tables
-- This allows clients to subscribe to changes in usage_counters and pdf_jobs
-- In Supabase, real-time is typically enabled automatically for tables with RLS,
-- but we explicitly add them to the publication to ensure they're available

-- Enable real-time for usage_counters
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table usage_counters;
    exception
      when duplicate_object then
        -- Table already in publication, ignore
        null;
    end;
  end if;
end $$;

-- Enable real-time for pdf_jobs
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table pdf_jobs;
    exception
      when duplicate_object then
        -- Table already in publication, ignore
        null;
    end;
  end if;
end $$;

-- Enable real-time for device_usage_counters (if it exists)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') 
     and exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'device_usage_counters') then
    begin
      alter publication supabase_realtime add table device_usage_counters;
    exception
      when duplicate_object then
        -- Table already in publication, ignore
        null;
    end;
  end if;
end $$;

-- Note: In managed Supabase, real-time is typically enabled by default for tables with RLS.
-- This migration ensures the tables are explicitly added to the publication.

