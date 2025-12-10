-- Enable real-time for offers table
-- This allows clients to subscribe to changes in offers for live collaboration features

-- Enable real-time for offers table
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table offers;
    exception
      when duplicate_object then
        -- Table already in publication, ignore
        null;
    end;
  end if;
end $$;

-- Note: In managed Supabase, real-time is typically enabled by default for tables with RLS.
-- This migration ensures the offers table is explicitly added to the publication.
-- Real-time subscriptions are subject to Row Level Security (RLS) policies,
-- so users will only receive updates for offers they have access to.










