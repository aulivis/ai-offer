# Offer Sharing and Customer Response Feature - Investigation Report

## Executive Summary

This document investigates the feasibility and implementation approach for enabling users to share offers with customers via shareable links, allowing customers to view offers in their browser and accept/reject them, with automatic notifications to the offer creator.

## Current State Analysis

### Existing Infrastructure

1. **Offers Table Structure** (from codebase analysis):
   - `id` (uuid) - Primary key
   - `user_id` (uuid) - Foreign key to auth.users
   - `title` (text) - Offer title
   - `industry` (text) - Industry classification
   - `status` (text) - Current status: 'draft', 'sent', 'accepted', 'lost'
   - `recipient_id` (uuid, nullable) - Foreign key to clients table
   - `pdf_url` (text, nullable) - URL to generated PDF
   - `sent_at` (timestamptz, nullable) - When offer was sent
   - `decided_at` (timestamptz, nullable) - When customer decided
   - `decision` (text, nullable) - 'accepted' or 'lost'
   - `created_at` (timestamptz) - Creation timestamp
   - Additional fields: `inputs`, `ai_text`, `price_json` (stored as JSONB)

2. **Clients Table**:
   - Stores customer/recipient information
   - Has RLS policies ensuring users can only access their own clients
   - Fields include: `id`, `user_id`, `company_name`, `address`, `tax_id`, `representative`, `phone`, `email`

3. **PDF Generation**:
   - PDFs are generated using Puppeteer
   - Stored in Supabase Storage bucket 'offers'
   - PDFs are currently only accessible via authenticated download

4. **Authentication & Authorization**:
   - Supabase Auth with Row Level Security (RLS)
   - All offers are protected by RLS policies
   - Currently, only authenticated users can view their own offers

5. **Notification System**:
   - Email subscription system exists (`email_subscriptions` table)
   - No current email notification system for offer updates
   - Magic link emails are sent via Supabase Auth

### Current Limitations

1. **No Public Access**: Offers are only accessible to authenticated users
2. **No Shareable Links**: No mechanism to generate shareable URLs
3. **No Customer Response**: Customers cannot accept/reject offers directly
4. **No Notifications**: No email/SMS notifications when customers respond
5. **Manual Status Updates**: Users must manually mark offers as sent/accepted/lost

## Requirements

### Functional Requirements

1. **Shareable Links**:
   - Users can generate a shareable link for any offer
   - Links should be secure (token-based, not guessable)
   - Links should have optional expiration dates
   - Links should be revocable

2. **Customer View**:
   - Customers can view offers in browser without authentication
   - View should match the PDF appearance (HTML rendering)
   - Customers should see offer details, pricing, and terms
   - Responsive design for mobile/desktop

3. **Customer Response**:
   - Customers can accept or reject offers
   - Optional: Customers can add comments/notes
   - Response should be timestamped
   - Response should update offer status automatically

4. **Dashboard Notifications (MVP)**:
   - Real-time notification bar/log on dashboard when customer responds
   - Shows offer title, customer decision, and timestamp
   - Clickable to navigate to offer details
   - Mark as read/dismiss functionality
   - Activity log/history view for all offer events
   - **Future Phase**: Email/SMS notifications (deferred for MVP)

5. **Link Management**:
   - Users can view all shared links for an offer
   - Users can revoke/disable links
   - Users can see link access statistics (views, responses)

### Non-Functional Requirements

1. **Security**:
   - Links must be cryptographically secure (unpredictable tokens)
   - Links should have optional expiration
   - Rate limiting on public endpoints
   - Protection against enumeration attacks

2. **Performance**:
   - Public offer view should load quickly
   - No authentication overhead for customers
   - Efficient caching where possible
   - Real-time notifications via Supabase Realtime

3. **Privacy**:
   - Customers should not see other offers
   - Link access should be logged for audit purposes
   - GDPR compliance considerations

4. **User Experience**:
   - Dashboard notifications should be non-intrusive but visible
   - Activity log should be easily accessible
   - Notifications should persist until dismissed

## Technical Approach

### Database Schema Changes

#### 1. Create `offer_shares` Table

```sql
create table if not exists public.offer_shares (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique, -- Secure random token for URL
  expires_at timestamptz, -- Optional expiration
  is_active boolean not null default true, -- Can be revoked
  customer_email text, -- Optional: email of customer
  customer_name text, -- Optional: name of customer
  access_count integer not null default 0, -- Track views
  last_accessed_at timestamptz, -- Last access timestamp
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Indexes
create index if not exists offer_shares_offer_id_idx on public.offer_shares (offer_id);
create index if not exists offer_shares_token_idx on public.offer_shares (token) where is_active = true;
create index if not exists offer_shares_user_id_idx on public.offer_shares (user_id);

-- RLS Policies
alter table public.offer_shares enable row level security;

-- Users can manage their own offer shares
create policy "Users can manage their own offer shares"
  on public.offer_shares
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public can read active shares by token (for viewing offers)
create policy "Public can read active shares by token"
  on public.offer_shares
  for select
  to anon
  using (
    is_active = true
    and (expires_at is null or expires_at > now())
  );
```

#### 2. Create `offer_responses` Table

```sql
create table if not exists public.offer_responses (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id) on delete cascade,
  share_id uuid not null references public.offer_shares (id) on delete cascade,
  decision text not null check (decision in ('accepted', 'rejected')),
  comment text, -- Optional customer comment
  customer_name text, -- Name provided by customer
  customer_email text, -- Email provided by customer
  ip_address text, -- For audit purposes
  user_agent text, -- For audit purposes
  created_at timestamptz not null default timezone('utc', now())
);

-- Indexes
create index if not exists offer_responses_offer_id_idx on public.offer_responses (offer_id);
create index if not exists offer_responses_share_id_idx on public.offer_responses (share_id);

-- RLS Policies
alter table public.offer_responses enable row level security;

-- Users can read responses to their offers
create policy "Users can read responses to their offers"
  on public.offer_responses
  for select
  to authenticated
  using (
    exists (
      select 1 from public.offers
      where offers.id = offer_responses.offer_id
      and offers.user_id = auth.uid()
    )
  );

-- Public can insert responses (when responding via share link)
create policy "Public can insert responses"
  on public.offer_responses
  for insert
  to anon
  with check (
    exists (
      select 1 from public.offer_shares
      where offer_shares.id = offer_responses.share_id
      and offer_shares.is_active = true
      and (offer_shares.expires_at is null or offer_shares.expires_at > now())
    )
  );
```

#### 3. Update `offers` Table

Add trigger to automatically update offer status when response is received:

```sql
-- Function to update offer status on response and create notification
create or replace function public.handle_offer_response()
returns trigger as $$
declare
  v_offer_user_id uuid;
  v_offer_title text;
  v_customer_name text;
begin
  -- Get offer details
  select user_id, title into v_offer_user_id, v_offer_title
  from public.offers
  where id = new.offer_id;

  -- Get customer name from share or response
  v_customer_name := coalesce(new.customer_name, 'Customer');

  -- Update offer status and decision
  update public.offers
  set
    status = case
      when new.decision = 'accepted' then 'accepted'
      when new.decision = 'rejected' then 'lost'
      else status
    end,
    decision = new.decision,
    decided_at = new.created_at,
    sent_at = coalesce(sent_at, new.created_at) -- Set sent_at if not already set
  where id = new.offer_id;

  -- Create notification for offer creator
  insert into public.offer_notifications (
    offer_id,
    user_id,
    type,
    title,
    message,
    metadata
  ) values (
    new.offer_id,
    v_offer_user_id,
    'response',
    case
      when new.decision = 'accepted' then 'Offer Accepted'
      else 'Offer Rejected'
    end,
    case
      when new.decision = 'accepted'
        then v_customer_name || ' accepted your offer "' || v_offer_title || '"'
      else
        v_customer_name || ' rejected your offer "' || v_offer_title || '"'
    end,
    jsonb_build_object(
      'decision', new.decision,
      'customer_name', v_customer_name,
      'customer_email', new.customer_email,
      'comment', new.comment,
      'response_id', new.id
    )
  );

  return new;
end;
$$ language plpgsql security definer;

-- Trigger
drop trigger if exists on_offer_response on public.offer_responses;
create trigger on_offer_response
after insert on public.offer_responses
for each row
execute function public.handle_offer_response();
```

#### 4. Create `offer_notifications` Table (For dashboard notifications)

```sql
create table if not exists public.offer_notifications (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('response', 'view', 'share_created')),
  title text not null, -- Notification title
  message text not null, -- Notification message
  metadata jsonb default '{}', -- Additional data (decision, customer name, etc.)
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

-- Indexes
create index if not exists offer_notifications_user_id_idx
  on public.offer_notifications (user_id, is_read, created_at desc);
create index if not exists offer_notifications_offer_id_idx
  on public.offer_notifications (offer_id);

-- RLS Policies
alter table public.offer_notifications enable row level security;

-- Users can manage their own notifications
create policy "Users can manage their own notifications"
  on public.offer_notifications
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

#### 5. Create `offer_share_access_logs` Table (Optional, for analytics)

```sql
create table if not exists public.offer_share_access_logs (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.offer_shares (id) on delete cascade,
  ip_address text,
  user_agent text,
  accessed_at timestamptz not null default timezone('utc', now())
);

create index if not exists offer_share_access_logs_share_id_idx
  on public.offer_share_access_logs (share_id);
```

### API Endpoints

#### 1. Create Share Link

**POST** `/api/offers/[offerId]/share`

```typescript
Request Body:
{
  expiresAt?: string; // ISO date string, optional
  customerEmail?: string; // Optional
  customerName?: string; // Optional
}

Response:
{
  shareId: string;
  shareUrl: string; // Full URL: https://app.com/offer/[token]
  token: string;
  expiresAt: string | null;
  createdAt: string;
}
```

#### 2. List Share Links

**GET** `/api/offers/[offerId]/shares`

```typescript
Response: {
  shares: Array<{
    id: string;
    token: string;
    shareUrl: string;
    expiresAt: string | null;
    isActive: boolean;
    accessCount: number;
    lastAccessedAt: string | null;
    createdAt: string;
  }>;
}
```

#### 3. Revoke Share Link

**DELETE** `/api/offers/[offerId]/shares/[shareId]`

#### 4. Public Offer View

**GET** `/offer/[token]`

- Public endpoint (no authentication required)
- Validates token and expiration
- Returns HTML view of offer
- Logs access

#### 5. Submit Response

**POST** `/api/offer/[token]/respond`

```typescript
Request Body:
{
  decision: 'accepted' | 'rejected';
  comment?: string;
  customerName?: string;
  customerEmail?: string;
}

Response:
{
  success: boolean;
  message: string;
}
```

#### 6. Get Notifications

**GET** `/api/notifications`

```typescript
Query Params:
- unreadOnly?: boolean (default: false)
- limit?: number (default: 50)
- offset?: number (default: 0)

Response:
{
  notifications: Array<{
    id: string;
    offerId: string;
    type: 'response' | 'view' | 'share_created';
    title: string;
    message: string;
    metadata: Record<string, unknown>;
    isRead: boolean;
    createdAt: string;
  }>;
  unreadCount: number;
  total: number;
}
```

#### 7. Mark Notification as Read

**PATCH** `/api/notifications/[notificationId]/read`

#### 8. Mark All Notifications as Read

**POST** `/api/notifications/read-all`

### Frontend Changes

#### 1. Dashboard - Offer List Item

- Add "Share" button to each offer
- Show share status indicator (has active shares)
- Show response status if customer responded

#### 2. Share Modal/Dialog

- Generate share link
- Copy link to clipboard
- Set expiration date
- View existing shares
- Revoke shares
- View access statistics

#### 3. Public Offer View Page (`/offer/[token]`)

- Render offer HTML (similar to PDF preview)
- Display pricing table
- Accept/Reject buttons
- Optional comment field
- Thank you message after response

#### 4. Dashboard Notification System

- **Notification Bar**: Fixed or sticky bar at top of dashboard showing recent unread notifications
- **Notification Bell**: Icon with badge showing unread count
- **Activity Log**: Dedicated page/section showing all offer-related events
- **Real-time Updates**: Use Supabase Realtime to show new notifications instantly
- **Mark as Read**: Click to mark individual or all notifications as read
- **Future Phase**: Email/SMS notification preferences (deferred)

### Dashboard Notification System (MVP)

#### Real-time Notifications

1. **Database Trigger**: Automatically creates notification when customer responds
2. **Supabase Realtime**: Subscribe to `offer_notifications` table changes
3. **Notification Display**:
   - Notification bar/banner at top of dashboard
   - Bell icon with unread count badge
   - Click to view details or navigate to offer

#### Notification Types

1. **Response Notifications**:
   - Triggered when customer accepts/rejects offer
   - Shows: Offer title, customer name, decision, timestamp
   - Clickable to navigate to offer details

2. **View Notifications** (Future):
   - When customer views shared offer
   - Shows: Offer title, view timestamp

3. **Share Created** (Future):
   - When share link is created
   - Shows: Offer title, share link details

#### UI Components

1. **NotificationBar Component**:
   - Sticky/fixed position at top of dashboard
   - Shows most recent unread notification
   - Auto-dismisses after 5 seconds or manual dismiss
   - "View All" link to activity log

2. **NotificationBell Component**:
   - Bell icon in header/navigation
   - Badge showing unread count
   - Dropdown menu with recent notifications
   - "Mark all as read" action

3. **ActivityLog Component**:
   - Full page or modal showing all notifications
   - Filterable by type, date range
   - Grouped by offer or chronological
   - Mark individual or all as read

#### Future: Email/SMS Notifications

**Deferred to Phase 2**:

- Email notifications via external service (Resend, SendGrid)
- SMS notifications via Twilio (optional)
- User preferences for notification types
- Per-offer notification settings

### Security Considerations

1. **Token Generation**:
   - Use cryptographically secure random tokens (32+ bytes)
   - Base64URL encoding for URL-safe tokens
   - Example: `crypto.randomBytes(32).toString('base64url')`

2. **Rate Limiting**:
   - Public endpoints should have stricter rate limits
   - Prevent brute force token guessing
   - Limit response submissions per share

3. **Access Control**:
   - Tokens must be validated on every request
   - Check expiration and active status
   - Log access attempts for security monitoring

4. **Data Privacy**:
   - Don't expose sensitive user data in public views
   - Sanitize customer inputs
   - Respect GDPR requirements (right to deletion)

5. **CSRF Protection**:
   - Public endpoints don't need CSRF (no authenticated session)
   - But should validate request origin if possible

### Implementation Steps

#### Phase 1: Database & Backend (Week 1)

1. Create database migrations for new tables
2. Implement share link generation API
3. Implement public offer view API
4. Implement response submission API
5. Add database triggers for status updates

#### Phase 2: Frontend - Sharing (Week 2)

1. Add share button to offer list
2. Create share modal/dialog
3. Implement share link management UI
4. Add share status indicators

#### Phase 3: Public View (Week 2-3)

1. Create public offer view page
2. Style to match PDF appearance
3. Implement accept/reject UI
4. Add response confirmation

#### Phase 4: Dashboard Notifications (Week 3)

1. Create notification database table and triggers
2. Implement notification API endpoints
3. Build NotificationBar component
4. Build NotificationBell component
5. Build ActivityLog component
6. Integrate Supabase Realtime for live updates
7. Add notification indicators to offer list

#### Phase 5: Testing & Polish (Week 4)

1. End-to-end testing
2. Security testing
3. Performance optimization
4. Documentation

### Alternative Approaches Considered

1. **Signed URLs** (like S3 presigned URLs):
   - Pros: No database storage needed
   - Cons: Harder to revoke, expiration management complex
   - Decision: Not chosen - need revocation capability

2. **Email-only sharing**:
   - Pros: Simpler implementation
   - Cons: Requires email, less flexible
   - Decision: Not chosen - want link-based sharing

3. **Customer accounts**:
   - Pros: Better tracking, multiple offers per customer
   - Cons: Higher friction, more complex
   - Decision: Not chosen for MVP - can add later

### Open Questions

1. **Notification Display**: Where should notifications appear?
   - Recommendation: Sticky bar at top + bell icon in header
   - Consider: Toast-style notifications vs persistent bar

2. **Notification Persistence**: How long to keep notifications?
   - Recommendation: Keep all notifications, allow user to filter/archive
   - Consider: Auto-archive after 30 days

3. **Link Expiration**: Default expiration period?
   - Recommendation: 90 days default, user-configurable

4. **Response Limits**: Can customers change their response?
   - Recommendation: Allow one response per share, but allow new share links

5. **Analytics**: What analytics to track?
   - Recommendation: Views, response rate, time to response

6. **Team Support**: How to handle notifications for teams?
   - Current: Single-user system
   - Future: If teams are added, notifications should be per-team or per-user based on offer ownership

### Cost Considerations

1. **Database Storage**: Minimal - new tables are small
2. **Supabase Realtime**: Included in Supabase plan (no additional cost)
3. **Email Service**: Deferred to Phase 2 (~$0.001-0.01 per email)
4. **SMS Service**: Deferred to Phase 2 (~$0.01-0.05 per SMS)
5. **Storage**: No additional cost (using existing PDF storage)

### Risks & Mitigations

1. **Risk**: Token guessing/brute force
   - Mitigation: Long tokens (32+ bytes), rate limiting, monitoring

2. **Risk**: Link sharing abuse
   - Mitigation: Rate limiting, access logging, optional expiration

3. **Risk**: Notification visibility (users might miss dashboard notifications)
   - Mitigation: Persistent notification bar, bell icon with badge, real-time updates
   - Future: Email notifications will address this

4. **Risk**: Performance impact on public endpoints
   - Mitigation: Caching, CDN, database indexes

## Conclusion

This feature is **highly feasible** and aligns well with the existing architecture. The implementation requires:

- ✅ Database schema additions (straightforward)
- ✅ New API endpoints (standard Next.js API routes)
- ✅ Public-facing pages (Next.js pages)
- ✅ Email notification integration (external service)
- ✅ UI components for sharing management

**Estimated Timeline**: 3-4 weeks for full implementation
**Complexity**: Medium
**Value**: High - significantly improves user workflow

## Next Steps

1. Review and approve this investigation
2. Create detailed technical specification for notification UI
3. Begin Phase 1 implementation (database & backend)
4. Design notification bar/bell UI components
5. **Future**: Set up email service for Phase 2
