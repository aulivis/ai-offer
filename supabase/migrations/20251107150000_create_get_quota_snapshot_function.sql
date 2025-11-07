-- Create a database function that returns quota snapshot for display
-- This allows frontend to query quota directly from the database
-- Uses read-only queries (no locking) for display purposes
-- Uses the same counting logic as check_quota_with_pending for consistency

create or replace function public.get_quota_snapshot(
  p_period_start date default null,
  p_device_id text default null
)
returns table (
  plan text,
  quota_limit integer,
  confirmed integer,
  pending_user integer,
  pending_device integer,
  confirmed_device integer,
  remaining integer,
  period_start date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_period_start date;
  v_plan text;
  v_limit integer;
  v_confirmed integer;
  v_pending_user integer;
  v_pending_device integer;
  v_confirmed_device integer;
  v_total integer;
  v_remaining integer;
begin
  -- Ensure user is authenticated
  if v_user_id is null then
    raise exception 'User must be authenticated';
  end if;

  -- Determine period start
  if p_period_start is null then
    -- Use first day of current month
    v_period_start := date_trunc('month', timezone('utc', now()))::date;
  else
    v_period_start := p_period_start;
  end if;

  -- Get user's plan from profile
  -- Use table alias to avoid ambiguity with return column name
  select coalesce(p.plan, 'free') into v_plan
  from profiles p
  where p.id = v_user_id;

  -- Determine limit based on plan
  case v_plan
    when 'pro' then
      v_limit := null; -- Unlimited
    when 'standard' then
      v_limit := 5;
    else
      v_limit := 2; -- Free plan
  end case;

  -- Get confirmed usage (read-only, no lock)
  -- Use table alias to avoid ambiguity with return column names
  select coalesce(uc.offers_generated, 0)
  into v_confirmed
  from usage_counters uc
  where uc.user_id = v_user_id
    and uc.period_start = v_period_start;

  -- Initialize to 0 if not found
  if v_confirmed is null then
    v_confirmed := 0;
  end if;

  -- Count pending and processing jobs (read-only)
  -- Uses same logic as check_quota_with_pending
  select count(*)
  into v_pending_user
  from pdf_jobs pj
  where pj.user_id = v_user_id
    and pj.status in ('pending', 'processing')
    and date(timezone('utc', pj.created_at)) = v_period_start;

  -- Get device quota if device_id is provided
  if p_device_id is not null then
    -- Get confirmed device usage (read-only)
    -- Use table alias to avoid ambiguity with return column names
    select coalesce(duc.offers_generated, 0)
    into v_confirmed_device
    from device_usage_counters duc
    where duc.user_id = v_user_id
      and duc.device_id = p_device_id
      and duc.period_start = v_period_start;

    -- Initialize to 0 if not found
    if v_confirmed_device is null then
      v_confirmed_device := 0;
    end if;

    -- Count pending and processing jobs for device (read-only)
    select count(*)
    into v_pending_device
    from pdf_jobs pj2
    where pj2.user_id = v_user_id
      and pj2.device_id = p_device_id
      and pj2.status in ('pending', 'processing')
      and date(timezone('utc', pj2.created_at)) = v_period_start;
  else
    v_confirmed_device := null;
    v_pending_device := null;
  end if;

  -- Calculate remaining quota
  if v_limit is not null then
    v_total := coalesce(v_confirmed, 0) + coalesce(v_pending_user, 0);
    v_remaining := greatest(v_limit - v_total, 0);
  else
    v_remaining := null; -- Unlimited
  end if;

  -- Return the snapshot
  plan := v_plan;
  quota_limit := v_limit;
  confirmed := coalesce(v_confirmed, 0);
  pending_user := coalesce(v_pending_user, 0);
  pending_device := v_pending_device;
  confirmed_device := v_confirmed_device;
  remaining := v_remaining;
  period_start := v_period_start;

  return next;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.get_quota_snapshot(date, text) to authenticated;

