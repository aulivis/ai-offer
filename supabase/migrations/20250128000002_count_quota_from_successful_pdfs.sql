-- Function to count actual successful PDFs (offers with pdf_url not null) for quota
-- This ensures quota is based on actual successful PDF generations, not just counters

create or replace function public.count_successful_pdfs(
  p_user_id uuid,
  p_period_start date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  -- Count offers with pdf_url not null created in the period
  -- This represents actual successful PDF generations
  select count(*)
    into v_count
    from offers
   where user_id = p_user_id
     and pdf_url is not null
     and date(timezone('utc', created_at)) = p_period_start;
  
  return coalesce(v_count, 0);
end;
$$;

-- Function to recalculate and sync usage counter based on actual successful PDFs
create or replace function public.recalculate_usage_from_pdfs(
  p_user_id uuid,
  p_period_start date
)
returns table (
  old_count integer,
  new_count integer,
  updated boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_count integer;
  v_new_count integer;
  v_updated boolean := false;
begin
  -- Get current counter value
  select coalesce(offers_generated, 0)
    into v_old_count
    from usage_counters
   where user_id = p_user_id
     and period_start = p_period_start;
  
  -- If no counter exists, initialize it
  if not found then
    insert into usage_counters (user_id, period_start, offers_generated)
    values (p_user_id, p_period_start, 0)
    on conflict (user_id) do nothing;
    v_old_count := 0;
  end if;
  
  -- Count actual successful PDFs
  v_new_count := count_successful_pdfs(p_user_id, p_period_start);
  
  -- Update counter if different
  if v_old_count != v_new_count then
    update usage_counters
       set offers_generated = v_new_count
     where user_id = p_user_id
       and period_start = p_period_start;
    v_updated := true;
  end if;
  
  old_count := v_old_count;
  new_count := v_new_count;
  updated := v_updated;
  
  return next;
end;
$$;

-- Grant execute permissions
grant execute on function public.count_successful_pdfs(uuid, date) to authenticated;
grant execute on function public.count_successful_pdfs(uuid, date) to service_role;
grant execute on function public.recalculate_usage_from_pdfs(uuid, date) to authenticated;
grant execute on function public.recalculate_usage_from_pdfs(uuid, date) to service_role;

