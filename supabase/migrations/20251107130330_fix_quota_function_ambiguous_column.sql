-- Fix ambiguous column reference in check_and_increment_usage function
-- The RETURNING clause was using unqualified column names which caused ambiguity
-- between the table column and the function return column

create or replace function public.check_and_increment_usage(
  p_user_id uuid,
  p_limit integer,
  p_period_start date
)
returns table (
  allowed boolean,
  offers_generated integer,
  period_start date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage usage_counters%rowtype;
  v_limit integer := p_limit;
begin
  -- lock or initialize the usage row
  select *
    into v_usage
    from usage_counters
   where user_id = p_user_id
     and usage_counters.period_start = p_period_start
   for update;

  if not found then
    insert into usage_counters (user_id, period_start, offers_generated)
    values (p_user_id, p_period_start, 0)
    returning * into v_usage;
  end if;

  -- reset counter when a new billing period starts
  if v_usage.period_start is distinct from p_period_start then
    update usage_counters
       set period_start = p_period_start,
           offers_generated = 0
     where user_id = p_user_id
    returning * into v_usage;
  end if;

  -- enforce the limit when one is provided
  if v_limit is not null and v_usage.offers_generated >= v_limit then
    allowed := false;
    offers_generated := v_usage.offers_generated;
    period_start := v_usage.period_start;
    return;
  end if;

  -- increment the counter and return the updated values
  -- Use qualified column names to avoid ambiguity with return column names
  update usage_counters
     set offers_generated = v_usage.offers_generated + 1
   where user_id = p_user_id
     and usage_counters.period_start = p_period_start
  returning usage_counters.offers_generated, usage_counters.period_start
   into offers_generated, period_start;

  allowed := true;
  return;
end;
$$;

-- Grant execute permissions (in case they were lost)
grant execute on function public.check_and_increment_usage(uuid, integer, date) to authenticated;
grant execute on function public.check_and_increment_usage(uuid, integer, date) to service_role;

