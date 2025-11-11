# Multi-User Account Sharing - Implementation Investigation

**Date**: 2025-01-28  
**Status**: Investigation & Design Proposal

## Executive Summary

This document investigates the possibility of sharing an account with multiple users, allowing multiple email/Google accounts to be attached to one main account so they can all see the same offers. This feature would enable team collaboration and account sharing scenarios.

## Current State Analysis

### Existing Authentication Infrastructure

1. **Supabase Auth with Multiple Identities**
   - Supabase Auth natively supports multiple identities per user through the `auth.identities` table
   - Currently implemented: Google identity linking (`/api/auth/google/link`)
   - Users can link a Google account to their existing email-based account
   - Both identities authenticate to the same `auth.users` record

2. **Data Model**
   - All data is scoped by `user_id` (FK to `auth.users.id`)
   - Tables with user scoping:
     - `offers` - user's offers
     - `clients` - user's clients
     - `activities` - user's activity log
     - `profiles` - user profile (1:1 with auth.users)
     - `usage_counters` - user's usage quota
     - `pdf_jobs` - user's PDF generation jobs
     - `offer_text_templates` - user's templates
     - All tables have RLS policies: `auth.uid() = user_id`

3. **Current Limitations**
   - Multiple identities link to the same user account, but they're all the same person
   - No concept of "team" or "organization"
   - No way for User A to grant access to User B to see User A's offers
   - Each user has their own isolated data

## Implementation Approaches

### Option A: Identity-Based Sharing (Simplest)

**Concept**: Extend the existing identity linking to allow multiple users to link their identities to a shared "main" account.

**How it works**:

- User A creates/maintains the "main" account
- User B and User C link their Google/email identities to User A's account
- All three identities authenticate to the same `auth.users` record
- All three users see the same offers, clients, etc.

**Pros**:

- ✅ Minimal code changes (leverages existing identity linking)
- ✅ No database schema changes needed
- ✅ Works with existing RLS policies
- ✅ Simple to understand and implement
- ✅ All users share the same quota/billing

**Cons**:

- ❌ All users share the same password/authentication (if using magic link, they share the same email)
- ❌ No granular permissions (all users have full access)
- ❌ No audit trail of who did what (all actions appear as the same user)
- ❌ Can't revoke access for individual users easily
- ❌ If one user changes password, affects all users
- ❌ Limited to Supabase's identity linking capabilities

**Implementation Complexity**: ⭐ Low

---

### Option B: Team/Organization Model (Recommended)

**Concept**: Create a team/organization structure where multiple users can be members of a team, and offers belong to teams.

**How it works**:

- Create `teams` table (or `organizations`)
- Create `team_members` table (many-to-many relationship)
- Modify `offers` table to have `team_id` instead of (or in addition to) `user_id`
- Users can be members of multiple teams
- RLS policies check team membership

**Database Schema**:

```sql
-- Teams/Organizations table
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Team members (many-to-many)
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  invited_by uuid references auth.users(id),
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique(team_id, user_id)
);

-- Modify offers to support teams
alter table public.offers
  add column team_id uuid references public.teams(id) on delete set null;

-- Create index for team-based queries
create index idx_offers_team_id on public.offers(team_id) where team_id is not null;
```

**RLS Policies**:

```sql
-- Users can see offers from their teams
create policy "Users can view team offers"
  on public.offers
  for select
  to authenticated
  using (
    auth.uid() = user_id OR
    team_id IN (
      select team_id from public.team_members
      where user_id = auth.uid()
    )
  );
```

**Pros**:

- ✅ Proper separation of users (each has their own auth account)
- ✅ Granular permissions (owner, admin, member roles)
- ✅ Audit trail (can track which user performed actions)
- ✅ Easy to add/remove team members
- ✅ Users can belong to multiple teams
- ✅ Can have team-level settings and branding
- ✅ Supports future features (team billing, team quotas, etc.)

**Cons**:

- ❌ Requires significant database schema changes
- ❌ Requires migration of existing data
- ❌ More complex RLS policies
- ❌ Need to handle both personal and team offers
- ❌ More complex UI (team selection, member management)

**Implementation Complexity**: ⭐⭐⭐ Medium-High

---

### Option C: Account Sharing with Explicit Permissions

**Concept**: Create an explicit sharing model where users can grant access to specific offers or their entire account to other users.

**How it works**:

- Create `account_shares` table
- User A can share their account with User B
- User B gets read/write access to User A's offers
- Can be per-offer or account-wide
- Supports permission levels (read-only, read-write)

**Database Schema**:

```sql
-- Account shares
create table public.account_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  shared_with_id uuid not null references auth.users(id) on delete cascade,
  permission text not null check (permission in ('read', 'write')),
  created_at timestamptz not null default now(),
  unique(owner_id, shared_with_id)
);

-- Offer shares (optional - for per-offer sharing)
create table public.offer_shares (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  shared_with_id uuid not null references auth.users(id) on delete cascade,
  permission text not null check (permission in ('read', 'write')),
  created_at timestamptz not null default now(),
  unique(offer_id, shared_with_id)
);
```

**RLS Policies**:

```sql
-- Users can see offers they own or have been shared with them
create policy "Users can view shared offers"
  on public.offers
  for select
  to authenticated
  using (
    auth.uid() = user_id OR
    id IN (select offer_id from public.offer_shares where shared_with_id = auth.uid()) OR
    user_id IN (select owner_id from public.account_shares where shared_with_id = auth.uid())
  );
```

**Pros**:

- ✅ Flexible - can share account-wide or per-offer
- ✅ Explicit permissions (read vs write)
- ✅ Easy to revoke access
- ✅ Users maintain separate accounts
- ✅ Can track who shared what with whom

**Cons**:

- ❌ More complex than Option A
- ❌ Requires database schema changes
- ❌ Need to handle both personal and shared offers in UI
- ❌ More complex RLS policies
- ❌ Doesn't scale well for large teams

**Implementation Complexity**: ⭐⭐ Medium

---

## Recommended Approach: Option B (Team/Organization Model)

### Why Team Model?

1. **Scalability**: Supports both small teams (2-3 users) and larger organizations
2. **Future-proof**: Foundation for team features (team billing, team quotas, team branding)
3. **Proper separation**: Each user maintains their own authentication
4. **Flexibility**: Users can belong to multiple teams
5. **Industry standard**: Similar to how Slack, Notion, GitHub handle teams

### Implementation Plan

#### Phase 1: Database Schema (Migration)

1. Create `teams` table
2. Create `team_members` table
3. Add `team_id` to `offers` (nullable, for backward compatibility)
4. Create RLS policies for team-based access
5. Migrate existing data (create personal teams for existing users)

#### Phase 2: Backend API

1. Team management endpoints:
   - `POST /api/teams` - Create team
   - `GET /api/teams` - List user's teams
   - `POST /api/teams/:id/members` - Invite member
   - `DELETE /api/teams/:id/members/:userId` - Remove member
   - `PATCH /api/teams/:id/members/:userId` - Update role

2. Modify offer endpoints to support teams:
   - `POST /api/offers` - Create offer (with optional team_id)
   - `GET /api/offers` - List offers (personal + team offers)
   - Update RLS policies in queries

#### Phase 3: Frontend UI

1. Team management page (`/settings/teams`)
   - Create team
   - View team members
   - Invite members (via email)
   - Remove members
   - Manage roles

2. Offer creation/editing:
   - Team selector (personal vs team)
   - Show team offers in dashboard
   - Filter by team

3. Dashboard updates:
   - Team filter
   - Show which team an offer belongs to
   - Team member indicators

#### Phase 4: Invitation System

1. Email invitations for team members
2. Invitation acceptance flow
3. Invitation expiration
4. Resend invitations

### Database Migration Example

```sql
-- Migration: Add team support
-- File: 20250128000006_add_teams_support.sql

-- 1. Create teams table
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index idx_teams_owner_id on public.teams(owner_id);

-- 2. Create team_members table
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  invited_by uuid references auth.users(id),
  invited_at timestamptz not null default timezone('utc', now()),
  joined_at timestamptz,
  unique(team_id, user_id)
);

create index idx_team_members_team_id on public.team_members(team_id);
create index idx_team_members_user_id on public.team_members(user_id);

-- 3. Add team_id to offers (nullable for backward compatibility)
alter table public.offers
  add column if not exists team_id uuid references public.teams(id) on delete set null;

create index idx_offers_team_id on public.offers(team_id) where team_id is not null;

-- 4. Enable RLS
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- 5. RLS Policies for teams
create policy "Users can view teams they belong to"
  on public.teams
  for select
  to authenticated
  using (
    owner_id = auth.uid() OR
    id IN (select team_id from public.team_members where user_id = auth.uid())
  );

create policy "Team owners can create teams"
  on public.teams
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Team owners can update their teams"
  on public.teams
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- 6. RLS Policies for team_members
create policy "Users can view team members of their teams"
  on public.team_members
  for select
  to authenticated
  using (
    team_id IN (
      select id from public.teams
      where owner_id = auth.uid() OR
      id IN (select team_id from public.team_members where user_id = auth.uid())
    )
  );

create policy "Team owners can add members"
  on public.team_members
  for insert
  to authenticated
  with check (
    team_id IN (select id from public.teams where owner_id = auth.uid())
  );

create policy "Team owners can remove members"
  on public.team_members
  for delete
  to authenticated
  using (
    team_id IN (select id from public.teams where owner_id = auth.uid())
  );

-- 7. Update offers RLS to include team access
drop policy if exists "Users can select their own offers" on public.offers;
create policy "Users can select their own and team offers"
  on public.offers
  for select
  to authenticated
  using (
    auth.uid() = user_id OR
    team_id IN (
      select team_id from public.team_members
      where user_id = auth.uid()
    )
  );

-- 8. Update offers insert policy
drop policy if exists "Users can insert their own offers" on public.offers;
create policy "Users can insert offers for themselves or their teams"
  on public.offers
  for insert
  to authenticated
  with check (
    auth.uid() = user_id AND
    (team_id IS NULL OR team_id IN (
      select team_id from public.team_members where user_id = auth.uid()
    ))
  );

-- 9. Update offers update policy
drop policy if exists "Users can update their own offers" on public.offers;
create policy "Users can update their own and team offers"
  on public.offers
  for update
  to authenticated
  using (
    auth.uid() = user_id OR
    (team_id IN (
      select team_id from public.team_members
      where user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    ))
  )
  with check (
    auth.uid() = user_id OR
    (team_id IN (
      select team_id from public.team_members
      where user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    ))
  );

-- 10. Migration: Create personal teams for existing users
insert into public.teams (id, name, owner_id, created_at, updated_at)
select
  gen_random_uuid(),
  'Personal',
  id,
  created_at,
  updated_at
from auth.users
where not exists (
  select 1 from public.teams where owner_id = auth.users.id
);

-- 11. Add existing users as owners of their personal teams
insert into public.team_members (team_id, user_id, role, joined_at)
select
  t.id,
  t.owner_id,
  'owner',
  t.created_at
from public.teams t
where not exists (
  select 1 from public.team_members tm
  where tm.team_id = t.id and tm.user_id = t.owner_id
);
```

### API Endpoints

```typescript
// POST /api/teams
// Create a new team
{
  name: string;
}

// GET /api/teams
// List all teams user belongs to
Response: {
  teams: Array<{
    id: string;
    name: string;
    role: 'owner' | 'admin' | 'member';
    memberCount: number;
  }>;
}

// POST /api/teams/:id/members
// Invite a user to a team
{
  email: string;
  role?: 'admin' | 'member'; // default: 'member'
}

// DELETE /api/teams/:id/members/:userId
// Remove a member from a team

// PATCH /api/teams/:id/members/:userId
// Update member role
{
  role: 'owner' | 'admin' | 'member';
}

// GET /api/teams/:id/members
// List team members
Response: {
  members: Array<{
    id: string;
    email: string;
    role: string;
    joinedAt: string | null;
    invitedAt: string;
  }>;
}
```

### Security Considerations

1. **RLS Policies**: All team data must be protected by RLS
2. **Role-based Access**: Only owners can add/remove members
3. **Invitation Security**: Invitations should expire (e.g., 7 days)
4. **Email Verification**: Invited users must verify their email
5. **Audit Trail**: Log team membership changes
6. **Quota Management**: Decide if team offers share quota or have separate quota

### Quota/Billing Considerations

**Option 1: Shared Quota**

- All team members share the same quota
- Simpler to implement
- May cause conflicts if multiple users generate offers simultaneously

**Option 2: Per-User Quota**

- Each user has their own quota
- Team offers count against the creator's quota
- More complex but fairer

**Option 3: Team Quota**

- Teams have their own quota separate from personal quota
- Requires team billing/subscription
- Most complex but most flexible

**Recommendation**: Start with Option 1 (shared quota), migrate to Option 3 later if needed.

## Alternative: Quick Win with Option A

If you need a quick solution with minimal changes, **Option A (Identity-Based Sharing)** can be implemented quickly:

1. Extend the existing Google link flow to support email identity linking
2. Add UI to show linked identities
3. Add ability to unlink identities
4. Document that all linked identities share the same account

**Limitations to communicate**:

- All users share the same authentication
- No granular permissions
- All actions appear as the same user

## Comparison Matrix

| Feature              | Option A (Identity) | Option B (Team) | Option C (Sharing) |
| -------------------- | ------------------- | --------------- | ------------------ |
| Implementation Time  | 1-2 days            | 1-2 weeks       | 1 week             |
| Database Changes     | None                | Significant     | Moderate           |
| Code Changes         | Minimal             | Significant     | Moderate           |
| User Separation      | ❌                  | ✅              | ✅                 |
| Granular Permissions | ❌                  | ✅              | ✅                 |
| Audit Trail          | ❌                  | ✅              | ✅                 |
| Scalability          | ⚠️ Limited          | ✅ Excellent    | ⚠️ Moderate        |
| Future Features      | ❌                  | ✅              | ⚠️ Limited         |

## Recommendation

**For long-term success**: Implement **Option B (Team/Organization Model)**

**For quick MVP**: Implement **Option A (Identity-Based Sharing)** as a temporary solution, then migrate to Option B

## Next Steps

1. **Decision**: Choose approach (A, B, or C)
2. **Design Review**: Review database schema and API design
3. **Prototype**: Build a small prototype to validate approach
4. **Migration Plan**: Plan data migration for existing users
5. **Implementation**: Follow phased approach outlined above
6. **Testing**: Comprehensive testing of team features
7. **Documentation**: Update user documentation

## Questions to Answer

1. **Use Case**: What's the primary use case?
   - Small teams (2-5 users) sharing offers?
   - Larger organizations with multiple departments?
   - Client access (read-only)?

2. **Billing**: How should team billing work?
   - Shared subscription?
   - Per-user pricing?
   - Team plans?

3. **Permissions**: What permission levels are needed?
   - Owner/Admin/Member sufficient?
   - Need custom roles?
   - Need per-offer permissions?

4. **Migration**: How to handle existing users?
   - Auto-create personal teams?
   - Opt-in migration?
   - Grandfather existing accounts?

## References

- [Supabase Auth - Multiple Identities](https://supabase.com/docs/guides/auth/auth-identity-linking)
- [Supabase RLS - Team-based Access](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth - User Management](https://supabase.com/docs/guides/auth/managing-users)
