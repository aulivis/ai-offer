-- Migration: Add auto-cleanup for preview offers
-- This migration creates a function to automatically delete expired preview offers
-- Preview offers are temporary offers created for wizard preview with short expiration

-- Function to clean up expired preview offers
-- Preview offers are identified by:
-- 1. Status = 'draft'
-- 2. Have associated share with expires_at in the past
-- 3. Have inputs.preview = true OR created within last 24 hours with no PDF URL
create or replace function public.cleanup_expired_preview_offers()
returns integer as $$
declare
  deleted_count integer;
begin
  -- Delete offers that:
  -- 1. Are drafts
  -- 2. Have expired shares (expires_at < now())
  -- 3. Have no PDF URL (preview-only, never saved)
  with expired_previews as (
    select distinct o.id
    from public.offers o
    inner join public.offer_shares os on os.offer_id = o.id
    where o.status = 'draft'
      and o.pdf_url is null
      and os.expires_at is not null
      and os.expires_at < now()
      and (
        -- Marked as preview in inputs
        (o.inputs->>'preview')::boolean = true
        -- OR created within last 24 hours (likely preview)
        or o.created_at > now() - interval '24 hours'
      )
  )
  delete from public.offers
  where id in (select id from expired_previews);

  get diagnostics deleted_count = row_count;
  
  return deleted_count;
end;
$$ language plpgsql security definer;

comment on function public.cleanup_expired_preview_offers() is 'Cleans up expired preview offers (temporary offers created for wizard preview).';

-- Grant execute permission to service_role (will be called by cron or manually)
grant execute on function public.cleanup_expired_preview_offers() to service_role;

-- Schedule cleanup job using pg_cron (if extension is enabled)
-- This will run daily at 2 AM UTC to clean up expired preview offers
-- Note: pg_cron may not be available on all Supabase plans
-- Alternative: Use Supabase Edge Function with cron trigger (see setup instructions below)
do $$
begin
  -- Check if pg_cron extension exists and is available
  if exists (
    select 1 from pg_extension where extname = 'pg_cron'
  ) then
    -- Unschedule any existing job with the same name
    perform cron.unschedule('cleanup-preview-offers') where exists (
      select 1 from cron.job where jobname = 'cleanup-preview-offers'
    );
    
    -- Schedule the cleanup job: daily at 2 AM UTC
    -- Cron format: minute hour day month weekday
    -- '0 2 * * *' = every day at 2:00 AM UTC
    perform cron.schedule(
      'cleanup-preview-offers',
      '0 2 * * *',
      'SELECT public.cleanup_expired_preview_offers();'
    );
    
    raise notice 'Scheduled cleanup job: cleanup-preview-offers (daily at 2 AM UTC)';
  else
    raise notice 'pg_cron extension not available. Please use Supabase Edge Function with cron trigger instead.';
  end if;
exception
  when others then
    -- Silently fail if pg_cron is not available or accessible
    raise notice 'Could not schedule cleanup job. pg_cron may not be available. Use Edge Function alternative instead.';
end
$$;

-- ALTERNATIVE SETUP: Supabase Edge Function with Cron Trigger
-- 
-- If pg_cron is not available, use Supabase Edge Functions instead:
--
-- 1. Create Edge Function: supabase/functions/cleanup-preview-offers/index.ts
--    ```typescript
--    import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
--    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
--    
--    serve(async (req) => {
--      const supabaseAdmin = createClient(
--        Deno.env.get('SUPABASE_URL') ?? '',
--        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
--      )
--      
--      const { data, error } = await supabaseAdmin.rpc('cleanup_expired_preview_offers')
--      
--      if (error) {
--        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
--      }
--      
--      return new Response(
--        JSON.stringify({ 
--          success: true, 
--          deleted_count: data,
--          timestamp: new Date().toISOString()
--        }),
--        { headers: { 'Content-Type': 'application/json' } }
--      )
--    })
--    ```
--
-- 2. In Supabase Dashboard:
--    - Go to Database > Cron Jobs
--    - Click "Create Cron Job"
--    - Set schedule: "0 2 * * *" (daily at 2 AM UTC)
--    - Set HTTP request to: POST https://[your-project].supabase.co/functions/v1/cleanup-preview-offers
--    - Add header: Authorization: Bearer [your-service-role-key]
--
-- 3. Or use Supabase CLI to create cron trigger:
--    ```bash
--    supabase functions deploy cleanup-preview-offers
--    ```
--    Then configure cron in Dashboard as above.

