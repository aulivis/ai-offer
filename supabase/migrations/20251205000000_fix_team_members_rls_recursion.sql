-- Fix infinite recursion in team_members RLS policies
-- The issue: RLS policies on team_members query team_members itself, causing infinite recursion
-- Solution: Create a security definer function to check team membership without triggering RLS

-- Create a helper function to check if a user is a member of a team
-- This function uses security definer to bypass RLS and avoid recursion
create or replace function public.is_team_member(
  p_team_id uuid,
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1
    from public.team_members
    where team_members.team_id = p_team_id
      and team_members.user_id = p_user_id
  );
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.is_team_member(uuid, uuid) to authenticated;
grant execute on function public.is_team_member(uuid, uuid) to service_role;

-- Drop and recreate team_members policies to use the helper function
do $$
begin
  -- Drop existing policies
  drop policy if exists "Users can view team members" on public.team_members;
  drop policy if exists "Team members can add Pro users" on public.team_members;
  drop policy if exists "Users can leave teams" on public.team_members;

  -- Recreate "Users can view team members" policy using the helper function
  create policy "Users can view team members"
    on public.team_members
    for select
    to authenticated
    using (
      public.is_team_member(team_members.team_id, auth.uid())
    );

  -- Recreate "Team members can add Pro users" policy using the helper function
  create policy "Team members can add Pro users"
    on public.team_members
    for insert
    to authenticated
    with check (
      -- User must be a member of the team (using helper function)
      public.is_team_member(team_members.team_id, auth.uid())
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

  -- Recreate "Users can leave teams" policy (no change needed, doesn't query team_members)
  create policy "Users can leave teams"
    on public.team_members
    for delete
    to authenticated
    using (team_members.user_id = auth.uid());
end
$$;

-- Update team_invitations policies to use the helper function
do $$
begin
  -- Drop existing policies
  drop policy if exists "Users can view relevant invitations" on public.team_invitations;
  drop policy if exists "Team members can create invitations" on public.team_invitations;
  drop policy if exists "Invited users can update their invitations" on public.team_invitations;

  -- Recreate "Users can view relevant invitations" policy using the helper function
  create policy "Users can view relevant invitations"
    on public.team_invitations
    for select
    to authenticated
    using (
      -- Team members can see invitations for their team (using helper function)
      public.is_team_member(team_invitations.team_id, auth.uid())
      -- Or user can see invitations sent to their email
      or (
        team_invitations.email = (
          select email from auth.users where id = auth.uid()
        )
      )
    );

  -- Recreate "Team members can create invitations" policy using the helper function
  create policy "Team members can create invitations"
    on public.team_invitations
    for insert
    to authenticated
    with check (
      -- User must be a member of the team (using helper function)
      public.is_team_member(team_invitations.team_id, auth.uid())
      -- User must have Pro plan
      and exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.plan = 'pro'
      )
      and invited_by = auth.uid()
    );

  -- Recreate "Invited users can update their invitations" policy (no change needed)
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
end
$$;

-- Update offers RLS policies to use the helper function
do $$
begin
  -- Drop existing team-aware policies
  drop policy if exists "Users can select their own and team offers" on public.offers;
  drop policy if exists "Users can insert offers for themselves or their team" on public.offers;
  drop policy if exists "Users can update their own and team offers" on public.offers;

  -- Recreate "Users can select their own and team offers" policy using the helper function
  create policy "Users can select their own and team offers"
    on public.offers
    for select
    to authenticated
    using (
      -- User's own offers
      auth.uid() = user_id
      -- Or offers from teams the user belongs to (using helper function)
      or (
        team_id is not null
        and public.is_team_member(offers.team_id, auth.uid())
      )
    );

  -- Recreate "Users can insert offers for themselves or their team" policy using the helper function
  create policy "Users can insert offers for themselves or their team"
    on public.offers
    for insert
    to authenticated
    with check (
      auth.uid() = user_id
      and created_by = auth.uid()
      and (
        team_id is null
        or public.is_team_member(offers.team_id, auth.uid())
      )
    );

  -- Recreate "Users can update their own and team offers" policy using the helper function
  create policy "Users can update their own and team offers"
    on public.offers
    for update
    to authenticated
    using (
      auth.uid() = user_id
      or (
        team_id is not null
        and public.is_team_member(offers.team_id, auth.uid())
      )
    )
    with check (
      -- Ensure updated_by is set
      updated_by = auth.uid()
      and (
        auth.uid() = user_id
        or (
          team_id is not null
          and public.is_team_member(offers.team_id, auth.uid())
        )
      )
    );
end
$$;

-- Add comment explaining the function
comment on function public.is_team_member(uuid, uuid) is 'Helper function to check team membership without triggering RLS recursion. Uses security definer to bypass RLS when checking team_members table.';

















