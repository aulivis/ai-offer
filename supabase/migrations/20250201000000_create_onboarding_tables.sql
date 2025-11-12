-- Migration: Create onboarding tracking tables
-- This migration creates tables for tracking user onboarding progress, dismissed tours/tooltips,
-- and user onboarding profiles for personalization.

-- 1. Create onboarding_progress table
create table if not exists public.onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  step_id text not null,
  completed_at timestamptz not null default timezone('utc', now()),
  metadata jsonb default '{}',
  unique(user_id, step_id)
);

comment on table public.onboarding_progress is 'Tracks completion of onboarding steps for each user.';
comment on column public.onboarding_progress.step_id is 'Unique identifier for the onboarding step (e.g., "dashboard-tour", "first-offer-created").';
comment on column public.onboarding_progress.metadata is 'Additional context about step completion (e.g., time taken, user actions).';

-- Indexes for onboarding_progress
create index if not exists onboarding_progress_user_id_idx 
  on public.onboarding_progress(user_id, completed_at desc);
create index if not exists onboarding_progress_step_id_idx 
  on public.onboarding_progress(step_id);

-- 2. Create onboarding_dismissals table
create table if not exists public.onboarding_dismissals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  element_id text not null, -- tour_id or tooltip_id
  dismissed_at timestamptz not null default timezone('utc', now()),
  unique(user_id, element_id)
);

comment on table public.onboarding_dismissals is 'Tracks dismissed tours and tooltips to prevent re-showing.';
comment on column public.onboarding_dismissals.element_id is 'Unique identifier for the dismissed element (e.g., "dashboard-tour", "settings-tooltip").';

-- Indexes for onboarding_dismissals
create index if not exists onboarding_dismissals_user_id_idx 
  on public.onboarding_dismissals(user_id);
create index if not exists onboarding_dismissals_element_id_idx 
  on public.onboarding_dismissals(element_id);

-- 3. Create onboarding_profiles table
create table if not exists public.onboarding_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('freelancer', 'agency', 'enterprise', null)),
  industry text,
  goals text[],
  experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced', null)),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.onboarding_profiles is 'Stores user onboarding profile for personalization.';
comment on column public.onboarding_profiles.role is 'User role: freelancer, agency, or enterprise.';
comment on column public.onboarding_profiles.industry is 'User industry/sector.';
comment on column public.onboarding_profiles.goals is 'Array of user goals (e.g., ["save-time", "professional-appearance"]).';
comment on column public.onboarding_profiles.experience_level is 'User experience level with offer creation tools.';

-- Updated_at trigger for onboarding_profiles
create or replace function public.handle_onboarding_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_onboarding_profiles_updated_at on public.onboarding_profiles;
create trigger set_onboarding_profiles_updated_at
before update on public.onboarding_profiles
for each row
execute function public.handle_onboarding_profiles_updated_at();

-- RLS Policies
alter table public.onboarding_progress enable row level security;
alter table public.onboarding_dismissals enable row level security;
alter table public.onboarding_profiles enable row level security;

-- Users can read and write their own onboarding progress
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'onboarding_progress'
      and policyname = 'Users can manage own onboarding progress'
  ) then
    create policy "Users can manage own onboarding progress"
      on public.onboarding_progress
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- Users can read and write their own dismissals
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'onboarding_dismissals'
      and policyname = 'Users can manage own dismissals'
  ) then
    create policy "Users can manage own dismissals"
      on public.onboarding_dismissals
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- Users can read and write their own profile
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'onboarding_profiles'
      and policyname = 'Users can manage own profile'
  ) then
    create policy "Users can manage own profile"
      on public.onboarding_profiles
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

