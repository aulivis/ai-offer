-- Fix get_quota_snapshot to properly handle period mismatches
-- The issue: When usage_counters has a different period_start than requested,
-- the function was returning incorrect data (showing 0 when actual value exists)
--
-- Solution: Always select by user_id only (PK), then check if period matches.
-- If period doesn't match, return 0 for confirmed (correct behavior - new period).

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
  v_stored_period_start date;
begin
  -- Ensure user is authenticated
  if v_user_id is null then
    raise exception 'User must be authenticated';
  end if;

  -- Determine period start (always use current month if not provided)
  if p_period_start is null then
    v_period_start := date_trunc('month', timezone('utc', now()))::date;
  else
    v_period_start := p_period_start;
  end if;

  -- Get user's plan from profile
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
  -- CRITICAL: Select by user_id only (PK), not user_id + period_start
  -- This ensures we always find the row, then check if period matches
  select uc.offers_generated, uc.period_start
  into v_confirmed, v_stored_period_start
  from usage_counters uc
  where uc.user_id = v_user_id;

  -- If no row exists OR period doesn't match, confirmed is 0
  -- This is correct: if period changed, counter hasn't been reset yet, but for display
  -- purposes we show 0 for the new period
  if not found then
    v_confirmed := 0;
  elsif v_stored_period_start is distinct from v_period_start then
    -- Period mismatch: counter is for a different period
    -- Return 0 for confirmed (new period hasn't started counting yet)
    v_confirmed := 0;
  else
    -- Period matches: use the counter value
    v_confirmed := coalesce(v_confirmed, 0);
  end if;

  -- Count 'pending' + 'processing' jobs for display purposes
  -- This shows all in-flight work that will consume quota when completed
  select count(*)
  into v_pending_user
  from pdf_jobs pj
  where pj.user_id = v_user_id
    and pj.status in ('pending', 'processing')
    and date(timezone('utc', pj.created_at)) = v_period_start;

  -- Get device quota if device_id is provided
  if p_device_id is not null then
    -- Get confirmed device usage (read-only)
    -- Select by user_id + device_id (PK), not including period_start
    select duc.offers_generated, duc.period_start
    into v_confirmed_device, v_stored_period_start
    from device_usage_counters duc
    where duc.user_id = v_user_id
      and duc.device_id = p_device_id;

    -- If no row exists OR period doesn't match, confirmed is 0
    if not found then
      v_confirmed_device := 0;
    elsif v_stored_period_start is distinct from v_period_start then
      -- Period mismatch: counter is for a different period
      v_confirmed_device := 0;
    else
      -- Period matches: use the counter value
      v_confirmed_device := coalesce(v_confirmed_device, 0);
    end if;

    -- Count 'pending' + 'processing' jobs for device (for display)
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
  -- Always return the REQUESTED period, not the stored period
  plan := v_plan;
  quota_limit := v_limit;
  confirmed := coalesce(v_confirmed, 0);
  pending_user := coalesce(v_pending_user, 0);
  pending_device := v_pending_device;
  confirmed_device := v_confirmed_device;
  remaining := v_remaining;
  period_start := v_period_start; -- Always return requested period

  return next;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.get_quota_snapshot(date, text) to authenticated;















