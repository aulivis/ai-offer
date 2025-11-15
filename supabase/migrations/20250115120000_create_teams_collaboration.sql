-- Create teams collaboration feature
-- This migration adds team_members and team_invitations tables,
-- and modifies the offers table to support team collaboration

-- 1. Create team_members table (represents teams via team_id)
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default timezone('utc', now()),
  unique(team_id, user_id)
);

comment on table public.team_members is 'Team membership records. Each unique team_id represents a team.';

create index if not exists team_members_team_id_idx on public.team_members (team_id);
create index if not exists team_members_user_id_idx on public.team_members (user_id);
create unique index if not exists team_members_team_user_unique_idx on public.team_members (team_id, user_id);

alter table public.team_members enable row level security;

-- 2. Create team_invitations table
create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null,
  invited_by uuid not null references auth.users (id) on delete cascade,
  email text not null,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id)
);

comment on table public.team_invitations is 'Invitations for users to join teams.';

create index if not exists team_invitations_team_id_idx on public.team_invitations (team_id);
create index if not exists team_invitations_email_idx on public.team_invitations (email);
create index if not exists team_invitations_token_idx on public.team_invitations (token);
create index if not exists team_invitations_status_idx on public.team_invitations (status);

alter table public.team_invitations enable row level security;

-- 3. Modify offers table to support team collaboration
alter table public.offers
  add column if not exists created_by uuid references auth.users (id),
  add column if not exists updated_at timestamptz,
  add column if not exists updated_by uuid references auth.users (id),
  add column if not exists team_id uuid;

-- Backfill created_by with user_id for existing offers
update public.offers
set created_by = user_id
where created_by is null;

-- Make created_by not null after backfill
alter table public.offers
  alter column created_by set not null;

-- Add trigger to update updated_at
create or replace function public.handle_offers_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_offers_updated_at on public.offers;
create trigger set_offers_updated_at
before update on public.offers
for each row
execute function public.handle_offers_updated_at();

-- Add indexes
create index if not exists offers_created_by_idx on public.offers (created_by);
create index if not exists offers_updated_by_idx on public.offers (updated_by);
create index if not exists offers_team_id_idx on public.offers (team_id);
create index if not exists offers_updated_at_idx on public.offers (updated_at desc);

-- 4. RLS Policies for team_members
do $$
begin
  -- Users can view members of teams they belong to
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_members'
      and policyname = 'Users can view team members'
  ) then
    create policy "Users can view team members"
      on public.team_members
      for select
      to authenticated
      using (
        exists (
          select 1 from public.team_members tm
          where tm.team_id = team_members.team_id
            and tm.user_id = auth.uid()
        )
      );
  end if;

  -- Team members can add other Pro users to their team
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_members'
      and policyname = 'Team members can add Pro users'
  ) then
    create policy "Team members can add Pro users"
      on public.team_members
      for insert
      to authenticated
      with check (
        -- User must be a member of the team
        exists (
          select 1 from public.team_members tm
          where tm.team_id = team_members.team_id
            and tm.user_id = auth.uid()
        )
        -- Ensure the user being added has a Pro plan
        and exists (
          select 1 from public.profiles
          where profiles.id = team_members.user_id
            and profiles.plan = 'pro'
        )
        -- User must have Pro plan themselves
        and exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
            and profiles.plan = 'pro'
        )
      );
  end if;

  -- Users can leave teams (remove themselves)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_members'
      and policyname = 'Users can leave teams'
  ) then
    create policy "Users can leave teams"
      on public.team_members
      for delete
      to authenticated
      using (team_members.user_id = auth.uid());
  end if;
end
$$;

-- 5. RLS Policies for team_invitations
do $$
begin
  -- Users can view invitations for teams they belong to or invitations sent to their email
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_invitations'
      and policyname = 'Users can view relevant invitations'
  ) then
    create policy "Users can view relevant invitations"
      on public.team_invitations
      for select
      to authenticated
      using (
        -- Team members can see invitations for their team
        exists (
          select 1 from public.team_members
          where team_members.team_id = team_invitations.team_id
            and team_members.user_id = auth.uid()
        )
        -- Or user can see invitations sent to their email
        or (
          team_invitations.email = (
            select email from auth.users where id = auth.uid()
          )
        )
      );
  end if;

  -- Team members can create invitations
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_invitations'
      and policyname = 'Team members can create invitations'
  ) then
    create policy "Team members can create invitations"
      on public.team_invitations
      for insert
      to authenticated
      with check (
        -- User must be a member of the team
        exists (
          select 1 from public.team_members
          where team_members.team_id = team_invitations.team_id
            and team_members.user_id = auth.uid()
        )
        -- User must have Pro plan
        and exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
            and profiles.plan = 'pro'
        )
        and invited_by = auth.uid()
      );
  end if;

  -- Invited users can accept/reject invitations
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_invitations'
      and policyname = 'Invited users can update their invitations'
  ) then
    create policy "Invited users can update their invitations"
      on public.team_invitations
      for update
      to authenticated
      using (
        team_invitations.email = (
          select email from auth.users where id = auth.uid()
        )
        and team_invitations.status = 'pending'
      )
      with check (
        team_invitations.status in ('accepted', 'rejected')
        and accepted_by = auth.uid()
      );
  end if;
end
$$;

-- 6. Update offers RLS policies to include team access
do $$
begin
  -- Drop old policies if they exist
  drop policy if exists "Users can select their own offers" on public.offers;
  drop policy if exists "Users can insert their own offers" on public.offers;
  drop policy if exists "Users can update their own offers" on public.offers;

  -- Create new select policy for team access
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offers'
      and policyname = 'Users can select their own and team offers'
  ) then
    create policy "Users can select their own and team offers"
      on public.offers
      for select
      to authenticated
      using (
        -- User's own offers
        auth.uid() = user_id
        -- Or offers from teams the user belongs to
        or (
          team_id is not null
          and exists (
            select 1 from public.team_members
            where team_members.team_id = offers.team_id
              and team_members.user_id = auth.uid()
          )
        )
      );
  end if;

  -- Create new insert policy for team access
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offers'
      and policyname = 'Users can insert offers for themselves or their team'
  ) then
    create policy "Users can insert offers for themselves or their team"
      on public.offers
      for insert
      to authenticated
      with check (
        auth.uid() = user_id
        and created_by = auth.uid()
        and (
          team_id is null
          or exists (
            select 1 from public.team_members
            where team_members.team_id = offers.team_id
              and team_members.user_id = auth.uid()
          )
        )
      );
  end if;

  -- Create new update policy for team access
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offers'
      and policyname = 'Users can update their own and team offers'
  ) then
    create policy "Users can update their own and team offers"
      on public.offers
      for update
      to authenticated
      using (
        auth.uid() = user_id
        or (
          team_id is not null
          and exists (
            select 1 from public.team_members
            where team_members.team_id = offers.team_id
              and team_members.user_id = auth.uid()
          )
        )
      )
      with check (
        -- Ensure updated_by is set
        updated_by = auth.uid()
        and (
          auth.uid() = user_id
          or (
            team_id is not null
            and exists (
              select 1 from public.team_members
              where team_members.team_id = offers.team_id
                and team_members.user_id = auth.uid()
            )
          )
        )
      );
  end if;
end
$$;

-- Grant permissions
grant usage on schema public to authenticated;
grant select, insert, delete on table public.team_members to authenticated;
grant select, insert, update on table public.team_invitations to authenticated;

