# Team Collaboration Feature Investigation

## Overview

This document investigates the implementation of a team collaboration feature that allows Pro users to invite other Pro users to form teams. Team members can see each other's generated offers, and the dashboard displays who created and modified offers.

## Current State Analysis

### User Authentication & Authorization

- **Authentication**: Supabase Auth with custom session management (magic links)
- **User Model**: `auth.users` table with corresponding `profiles` table
- **Subscription Plans**: `free`, `standard`, `pro` (stored in `profiles.plan`)
- **Authorization**: Row Level Security (RLS) policies enforce user isolation
- **Current Access Pattern**: All queries filtered by `user_id` - users can only see their own data

### Offers Table Structure

Based on code analysis, the `offers` table has the following key columns:

- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `title` (text)
- `industry` (text)
- `status` (text: 'draft', 'sent', 'accepted', 'lost')
- `created_at` (timestamptz)
- `sent_at` (timestamptz, nullable)
- `decided_at` (timestamptz, nullable)
- `decision` (text: 'accepted', 'lost', nullable)
- `pdf_url` (text, nullable)
- `recipient_id` (uuid, nullable, references clients)
- `inputs` (jsonb) - stores form inputs
- `ai_text` (text) - stores generated HTML
- `price_json` (jsonb) - stores pricing information

**Note**: The table does not currently have `updated_at` or `updated_by` columns, which would be needed to track modifications.

### Dashboard Implementation

- **Location**: `web/src/app/dashboard/page.tsx`
- **Query Pattern**:
  ```typescript
  .from('offers')
  .select('id,title,industry,status,created_at,sent_at,decided_at,decision,pdf_url,recipient_id, recipient:recipient_id ( company_name )')
  .eq('user_id', user)
  .order('created_at', { ascending: false })
  ```
- **Current Display**: Shows offers filtered by `user_id` only
- **Missing Information**: No creator/modifier information displayed

### RLS Policies

Current RLS policies on `offers` table:

- **Select**: `auth.uid() = user_id` - Users can only see their own offers
- **Insert**: `auth.uid() = user_id` - Users can only create offers for themselves
- **Update**: `auth.uid() = user_id` - Users can only update their own offers
- **Delete**: `auth.uid() = user_id` - Users can only delete their own offers

## Database Schema Design

### Simplified Approach

This design uses a minimal structure:

- **No roles**: All team members have equal permissions
- **No team configuration**: Teams are just collections of members
- **Simple invitation system**: Email-based invitations with tokens

### New Tables

#### 1. `team_members` Table (Simplified)

This table serves dual purpose: it represents both the team (via unique team_id) and membership.

```sql
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
```

**Note**: The `team_id` is just a UUID that groups members together. The first member to join creates the team_id. No separate teams table needed.

#### 2. `team_invitations` Table

```sql
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
```

**Note**: `team_id` references the UUID used in `team_members`, not a separate teams table.

### Modifications to Existing Tables

#### 1. Add Columns to `offers` Table

```sql
-- Add columns to track creator and modifier
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
```

## Row Level Security (RLS) Policies

### Team Members Table Policies

```sql
-- Users can view members of teams they belong to
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

-- Team members can add other Pro users to their team
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

-- Users can leave teams (remove themselves)
create policy "Users can leave teams"
  on public.team_members
  for delete
  to authenticated
  using (
    team_members.user_id = auth.uid()
    -- Prevent deleting if it's the last member (optional - can be handled in application logic)
  );
```

### Team Invitations Table Policies

```sql
-- Users can view invitations for teams they belong to or invitations sent to their email
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

-- Team members can create invitations
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

-- Invited users can accept/reject invitations
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
```

### Modified Offers Table Policies

```sql
-- Update existing select policy to include team offers
drop policy if exists "Users can select their own offers" on public.offers;

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

-- Update insert policy to allow setting team_id and created_by
drop policy if exists "Users can insert their own offers" on public.offers;

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

-- Update policy to track updated_by
drop policy if exists "Users can update their own offers" on public.offers;

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
```

## API Endpoints Design

### Simplified Endpoints

#### 1. `GET /api/teams`

List all teams the current user belongs to (grouped by team_id).

**Response:**

```typescript
{
  teams: Array<{
    team_id: string;
    members: Array<{
      user_id: string;
      email: string;
      joined_at: string;
    }>;
  }>;
}
```

#### 2. `POST /api/teams`

Create a new team by adding the first member (Pro users only).
This automatically creates a team_id and adds the current user.

**Response:**

```typescript
{
  team_id: string;
  members: Array<{
    user_id: string;
    email: string;
    joined_at: string;
  }>;
}
```

#### 3. `GET /api/teams/[teamId]`

Get team details (list of members).

**Response:**

```typescript
{
  team_id: string;
  members: Array<{
    user_id: string;
    email: string;
    joined_at: string;
  }>;
}
```

#### 4. `DELETE /api/teams/[teamId]`

Leave a team (removes current user from team).
If last member leaves, team effectively disappears.

### Team Invitation Endpoints

#### 5. `POST /api/teams/[teamId]/invitations`

Send an invitation to join the team (team members only).

**Request:**

```typescript
{
  email: string;
  expires_in_days?: number; // Default: 7
}
```

**Response:**

```typescript
{
  invitation: {
    id: string;
    team_id: string;
    email: string;
    token: string;
    status: 'pending';
    expires_at: string;
    created_at: string;
  }
}
```

#### 6. `GET /api/teams/[teamId]/invitations`

List pending invitations for a team (team members only).

#### 7. `POST /api/teams/invitations/[token]/accept`

Accept a team invitation.

**Response:**

```typescript
{
  success: true;
  team_id: string;
}
```

#### 8. `POST /api/teams/invitations/[token]/reject`

Reject a team invitation.

### Dashboard Modifications

#### 9. `GET /api/offers` (Modified)

The existing dashboard query should be updated to:

- Include team offers
- Include `created_by` and `updated_by` information
- Include creator/modifier user details

**Response Enhancement:**

```typescript
{
  offers: Array<{
    // ... existing fields
    created_by: string;
    created_by_user?: {
      id: string;
      email: string;
    };
    updated_by?: string;
    updated_by_user?: {
      id: string;
      email: string;
    };
    team_id?: string;
  }>;
}
```

## UI Components Design

### 1. Team Management Page

**Location**: `web/src/app/teams/page.tsx`

**Features:**

- List all teams user belongs to
- Create new team button (Pro users only) - creates team with just current user
- Team cards showing:
  - Member list (emails)
  - Member count
  - Actions (view, invite, leave)

### 2. Team Detail Page

**Location**: `web/src/app/teams/[teamId]/page.tsx`

**Features:**

- Member list (all members are equal)
- Invite members section
- Pending invitations list
- Leave team button

### 3. Team Invitation Component

**Location**: `web/src/components/teams/InviteMemberDialog.tsx`

**Features:**

- Email input
- Validation (must be Pro user)
- Send invitation
- Copy invitation link

### 4. Create Team Flow

When a Pro user wants to create a team:

1. Click "Create Team" button
2. System generates a new `team_id` (UUID)
3. Adds current user to `team_members` with that `team_id`
4. Team is now created and ready for invitations

### 5. Dashboard Enhancements

#### Offer List Item Enhancement

**Location**: `web/src/components/dashboard/OfferListItem.tsx`

**Changes:**

- Display creator name/email if different from current user
- Display modifier name/email if offer was modified by someone else
- Show team badge if offer belongs to a team
- Visual indicator for team offers

#### Dashboard Filter Enhancement

**Location**: `web/src/app/dashboard/page.tsx`

**Changes:**

- Add filter dropdown with options:
  - "My offers" - only offers where `user_id = current_user_id`
  - "Team offers" - only offers where `team_id` is set and user is a team member
  - "All" - both personal and team offers
  - Filter by team member - dropdown to select specific team member(s) to filter by `created_by`
- Show team information in offer cards (if team_id is set)
- Filter state should persist in URL query params or localStorage

**Implementation:**

```typescript
type OfferFilter = 'my' | 'team' | 'all' | 'member';
type TeamMemberFilter = {
  type: 'member';
  memberIds: string[]; // Array of user_ids to filter by
};

const [offerFilter, setOfferFilter] = useState<OfferFilter>('all');
const [teamMemberFilter, setTeamMemberFilter] = useState<TeamMemberFilter | null>(null);
```

**Query Logic:**

```typescript
// Build query based on filter
let query = sb.from('offers').select('*');

if (offerFilter === 'my') {
  query = query.eq('user_id', userId);
} else if (offerFilter === 'team') {
  query = query.not('team_id', 'is', null).in('team_id', teamIds);
} else if (offerFilter === 'all') {
  query = query.or(
    `user_id.eq.${userId}${teamIds.length > 0 ? `,team_id.in.(${teamIds.join(',')})` : ''}`,
  );
} else if (offerFilter === 'member' && teamMemberFilter) {
  query = query.in('created_by', teamMemberFilter.memberIds);
}
```

**Team Member Filter Dropdown:**

- Fetch all team members from teams user belongs to
- Display as multi-select dropdown with member emails/names
- When members selected, set `offerFilter` to `'member'` and `teamMemberFilter.memberIds` to selected user_ids

**Example:**

```typescript
// Fetch team members for filter dropdown
const { data: teamMembers } = await sb
  .from('team_members')
  .select(`
    user_id,
    user:user_id(id, email)
  `)
  .in('team_id', teamIds);

// Display in dropdown
<Select
  value={teamMemberFilter?.memberIds || []}
  onChange={(memberIds) => {
    if (memberIds.length > 0) {
      setOfferFilter('member');
      setTeamMemberFilter({ type: 'member', memberIds });
    } else {
      setOfferFilter('all');
      setTeamMemberFilter(null);
    }
  }}
  options={teamMembers?.map(tm => ({
    value: tm.user_id,
    label: tm.user?.email || tm.user_id
  })) || []}
  multiple
/>
```

#### KPI Toggle Enhancement

**Location**: `web/src/app/dashboard/page.tsx`

**Changes:**

- Add toggle/switch in KPI section: "Personal" vs "Team" KPIs
- When "Personal" is selected: Calculate metrics from user's own offers only
- When "Team" is selected: Calculate metrics from all team offers (user's offers + team offers)
- Toggle should only be visible if user is a member of at least one team
- Toggle state should persist in localStorage

**Implementation:**

```typescript
const [kpiScope, setKpiScope] = useState<'personal' | 'team'>('personal');

// Calculate metrics based on scope
const metricsOffers = useMemo(() => {
  if (kpiScope === 'personal') {
    return offers.filter((o) => o.user_id === userId);
  } else {
    // Include all offers user can see (personal + team)
    return offers;
  }
}, [offers, kpiScope, userId]);

// Recalculate all metrics from metricsOffers
const totalCreated = metricsOffers.length;
const inReview = metricsOffers.filter((o) => o.status === 'draft').length;
const sent = metricsOffers.filter((o) => o.status === 'sent').length;
const accepted = metricsOffers.filter((o) => o.status === 'accepted').length;
const lost = metricsOffers.filter((o) => o.status === 'lost').length;
// ... etc
```

**UI Component:**

```tsx
{
  hasTeamMemberships && (
    <div className="flex items-center gap-2">
      <span className="text-sm text-fg-muted">Personal</span>
      <Switch
        checked={kpiScope === 'team'}
        onChange={(checked) => {
          setKpiScope(checked ? 'team' : 'personal');
          localStorage.setItem('dashboard-kpi-scope', checked ? 'team' : 'personal');
        }}
      />
      <span className="text-sm text-fg-muted">Team</span>
    </div>
  );
}
```

**Placement:**

- Place toggle in the KPI section header, next to the existing "Detailed/Compact" view toggle
- Only show when `hasTeamMemberships` is true (user belongs to at least one team)

**Metrics Calculation:**

- All metrics (total created, in review, sent, accepted, lost, win rate, avg decision time) should be recalculated based on `metricsOffers`
- Quota metric should always show personal quota (not team quota)
- When switching between Personal/Team, metrics should update immediately without page reload

### 6. Team Selector Component

**Location**: `web/src/components/teams/TeamSelector.tsx`

**Features:**

- Dropdown/select for choosing team when creating offer
- Option to create offer without team (personal)
- Only shows teams user is a member of

## Implementation Considerations

### 1. Pro User Validation

All team-related operations must verify that:

- The current user has a Pro plan
- Users being invited/added have a Pro plan

**Implementation:**

```typescript
async function verifyProUser(sb: SupabaseClient, userId: string): Promise<boolean> {
  const { data: profile } = await sb.from('profiles').select('plan').eq('id', userId).maybeSingle();

  return profile?.plan === 'pro';
}
```

### 2. Team Creation Flow

When creating a team:

1. Verify user has Pro plan
2. Generate new UUID for `team_id`
3. Insert into `team_members` with current user and new `team_id`
4. Team is now created (no separate teams table needed)

### 3. Invitation Flow

1. Team member sends invitation via email
2. System generates unique token
3. Email sent with invitation link: `/teams/invitations/[token]`
4. User clicks link, system validates token
5. If user is logged in and has Pro plan, show accept/reject buttons
6. If user is not logged in, redirect to login, then to invitation
7. If user doesn't have Pro plan, show error message
8. On accept, create `team_members` record and update invitation status

### 4. Offer Creation Flow Updates

When creating an offer:

- Allow user to select a team (optional)
- Set `created_by` to current user
- Set `team_id` if team is selected
- If team is selected, verify user is a team member

### 5. Offer Update Flow Updates

When updating an offer:

- Set `updated_by` to current user
- Verify user has access (owner or team member if offer has team_id)
- Update `updated_at` via trigger

### 6. Dashboard Query Updates

The dashboard query needs to be updated to:

- Join with team_members to get team offers
- Join with profiles/users to get creator/modifier info
- Filter based on user selection (my offers, team offers, all)

**Example Query:**

```typescript
// First, get all team_ids user belongs to
const { data: memberships } = await sb.from('team_members').select('team_id').eq('user_id', userId);

const teamIds = memberships?.map((m) => m.team_id) || [];

// Then query offers
const { data, error } = await sb
  .from('offers')
  .select(
    `
    *,
    created_by_user:created_by(id, email),
    updated_by_user:updated_by(id, email)
  `,
  )
  .or(`user_id.eq.${userId}${teamIds.length > 0 ? `,team_id.in.(${teamIds.join(',')})` : ''}`)
  .order('created_at', { ascending: false });
```

### 7. Migration Strategy

1. Create new tables (team_members, team_invitations) - no separate teams table
2. Add new columns to offers table
3. Backfill `created_by` with `user_id` for existing offers
4. Deploy RLS policies
5. Update API endpoints
6. Update UI components
7. Add feature flag (optional) to enable/disable team features

### 8. Performance Considerations

- Add indexes on frequently queried columns (team_id, created_by, updated_by)
- Cache team membership information
- Use database functions for complex team access checks

### 9. Security Considerations

- All team operations must verify Pro plan status
- RLS policies must be comprehensive
- Invitation tokens must be cryptographically secure
- Rate limit invitation sending
- Audit log team operations

### 10. Email Templates

Create email templates for:

- Team invitation sent
- Team invitation accepted
- Member added to team
- Member removed from team

## Testing Requirements

### Unit Tests

- Team creation (Pro users only)
- Member addition (Pro users only)
- Invitation flow
- RLS policy verification
- Offer access control

### Integration Tests

- End-to-end invitation flow
- Team offer visibility
- Dashboard filtering
- Member role changes

### E2E Tests

- Create team
- Invite member
- Accept invitation
- Create team offer
- View team offers in dashboard
- Update team offer

## Open Questions

1. **Team Limits**: Should there be a maximum number of teams per user? Maximum members per team?
2. **Offer Ownership**: When a user leaves a team, what happens to their offers? Should they remain in the team or become personal?
3. **Last Member**: What happens when the last member leaves a team? Should the team be automatically cleaned up?
4. **Notifications**: Should users be notified when team members create/modify offers?
5. **Analytics**: Should team-level analytics be available?
6. **Billing**: How does team collaboration affect billing? Should team features be part of Pro plan or separate?

## Next Steps

1. Review and approve database schema design
2. Create database migration file
3. Implement RLS policies
4. Create API endpoints
5. Update dashboard queries and UI
6. Implement team management UI
7. Add email templates for invitations
8. Write tests
9. Deploy to staging for testing
10. Gather user feedback
11. Iterate based on feedback

## References

- Current offers RLS policies: `web/supabase/migrations/20250128000003_ensure_offers_rls_policies.sql`
- Dashboard implementation: `web/src/app/dashboard/page.tsx`
- User profile structure: `web/src/lib/services/user.ts`
- Subscription plan logic: `web/src/lib/subscription.ts`
