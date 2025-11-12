# Share Links Analytics Dashboard - Design Specification

## Overview

This document describes the analytics dashboard for share links, providing insights into how customers interact with shared offers. This feature helps users understand engagement, response rates, and optimize their offer sharing strategy.

## Target Users

- **Primary**: Users with Standard/Pro plans who actively share offers
- **Use Case**: Track which offers get the most views, response rates, time to response, and customer engagement patterns

## Key Metrics to Track

### 1. Share-Level Metrics

- **Total Views**: Number of times the share link was accessed
- **Unique Visitors**: Distinct IP addresses/user agents (approximate)
- **Response Rate**: Percentage of views that resulted in a response
- **Time to Response**: Average time between first view and response
- **Response Type**: Accepted vs Rejected breakdown
- **Geographic Distribution**: Country/region based on IP (optional, future)

### 2. Offer-Level Aggregated Metrics

- **Total Shares**: Number of share links created for an offer
- **Total Views**: Sum of all views across all shares
- **Total Responses**: Number of responses received
- **Best Performing Share**: Share link with highest response rate
- **Average Response Time**: Across all shares for the offer

### 3. Time-Based Analytics

- **Views Over Time**: Daily/hourly view patterns
- **Response Timeline**: When responses were received
- **Peak Engagement Times**: When customers are most active

## Dashboard Components

### 1. Share Analytics Page

**Route**: `/dashboard/offers/[offerId]/analytics` or `/dashboard/offers/[offerId]/shares/analytics`

**Layout**:

```
┌─────────────────────────────────────────────────────────────┐
│ Share Analytics: [Offer Title]                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Overview Cards (4 cards in a row)                           │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │ Total    │ │ Views    │ │ Responses│ │ Response │       │
│ │ Shares   │ │          │ │          │ │ Rate     │       │
│ │   5      │ │   42     │ │   3      │ │  7.1%    │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│ Share Links Performance Table                               │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Link | Created | Views | Responses | Rate | Actions │ │
│ ├───────────────────────────────────────────────────────┤ │
│ │ abc123 | Jan 15 | 25   | 2 (1✓,1✗) | 8%  | [View]  │ │
│ │ def456 | Jan 20 | 17   | 1 (1✓)     | 5.9%| [View]  │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ Views Over Time Chart                                       │
│ ┌───────────────────────────────────────────────────────┐ │
│ │   [Line/Bar Chart showing views per day]              │ │
│ │   25│                                                  │ │
│ │   20│     ▁▃▅                                          │ │
│ │   15│  ▁▃▅▇█▆▄                                         │ │
│ │   10│▁▃▅▇█▆▄▃▂                                         │ │
│ │    5│▁▃▅▇█▆▄▃▂▁                                        │ │
│ │    0└─────────────────────────────────────────────    │ │
│ │      Jan 15 16 17 18 19 20 21 22                       │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ Response Timeline                                           │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Jan 15 - Share created                                 │ │
│ │ Jan 16 - First view                                    │ │
│ │ Jan 17 - 5 views                                       │ │
│ │ Jan 18 - ✓ Accepted (Customer Name)                  │ │
│ │ Jan 20 - ✗ Rejected (Customer Name)                  │ │
│ └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2. Individual Share Analytics View

**Route**: `/dashboard/offers/[offerId]/shares/[shareId]/analytics`

**Features**:

- Detailed view for a single share link
- Access log with timestamps, IP addresses (masked), user agents
- Response details (if any)
- Export functionality (CSV/JSON)

### 3. Dashboard Widget (Optional)

**Location**: Main dashboard, offer card/list item

**Display**:

- Small badge/indicator showing if offer has active shares
- Quick stats: "3 shares, 42 views, 2 responses"
- Click to open full analytics

## Database Schema Additions

### Enhanced Access Logs

```sql
-- Add more fields to offer_share_access_logs for analytics
alter table public.offer_share_access_logs
  add column if not exists country_code text, -- ISO country code from IP
  add column if not exists referrer text,     -- HTTP referrer
  add column if not exists device_type text,   -- mobile/desktop/tablet
  add column if not exists browser text,       -- Browser name
  add column if not exists is_unique boolean default true; -- First visit from this IP/UA combo
```

### Analytics Aggregation Table (Optional, for performance)

```sql
create table if not exists public.offer_share_analytics (
  share_id uuid primary key references public.offer_shares (id) on delete cascade,
  total_views integer not null default 0,
  unique_visitors integer not null default 0,
  total_responses integer not null default 0,
  accepted_responses integer not null default 0,
  rejected_responses integer not null default 0,
  first_view_at timestamptz,
  last_view_at timestamptz,
  first_response_at timestamptz,
  last_response_at timestamptz,
  avg_time_to_response_seconds integer, -- Average seconds from first view to response
  updated_at timestamptz not null default timezone('utc', now())
);

-- Update via trigger or scheduled job
create or replace function public.update_share_analytics(p_share_id uuid)
returns void as $$
begin
  insert into public.offer_share_analytics (
    share_id,
    total_views,
    unique_visitors,
    total_responses,
    accepted_responses,
    rejected_responses,
    first_view_at,
    last_view_at,
    first_response_at,
    last_response_at,
    avg_time_to_response_seconds
  )
  select
    p_share_id,
    count(*) as total_views,
    count(distinct ip_address) as unique_visitors,
    count(r.id) as total_responses,
    count(r.id) filter (where r.decision = 'accepted') as accepted_responses,
    count(r.id) filter (where r.decision = 'rejected') as rejected_responses,
    min(a.accessed_at) as first_view_at,
    max(a.accessed_at) as last_view_at,
    min(r.created_at) as first_response_at,
    max(r.created_at) as last_response_at,
    avg(extract(epoch from (r.created_at - min(a.accessed_at))))::integer
      filter (where r.id is not null) as avg_time_to_response_seconds
  from public.offer_share_access_logs a
  left join public.offer_responses r on r.share_id = a.share_id
  where a.share_id = p_share_id
  group by a.share_id
  on conflict (share_id) do update set
    total_views = excluded.total_views,
    unique_visitors = excluded.unique_visitors,
    total_responses = excluded.total_responses,
    accepted_responses = excluded.accepted_responses,
    rejected_responses = excluded.rejected_responses,
    first_view_at = excluded.first_view_at,
    last_view_at = excluded.last_view_at,
    first_response_at = excluded.first_response_at,
    last_response_at = excluded.last_response_at,
    avg_time_to_response_seconds = excluded.avg_time_to_response_seconds,
    updated_at = timezone('utc', now());
end;
$$ language plpgsql security definer;
```

## API Endpoints

### 1. Get Share Analytics

**GET** `/api/offers/[offerId]/shares/analytics`

```typescript
Response: {
  overview: {
    totalShares: number;
    totalViews: number;
    totalResponses: number;
    responseRate: number; // percentage
    avgTimeToResponse: number; // seconds
  }
  shares: Array<{
    id: string;
    token: string;
    createdAt: string;
    views: number;
    uniqueVisitors: number;
    responses: number;
    acceptedResponses: number;
    rejectedResponses: number;
    responseRate: number;
    firstViewAt: string | null;
    lastViewAt: string | null;
  }>;
  viewsOverTime: Array<{
    date: string; // ISO date
    views: number;
    responses: number;
  }>;
  timeline: Array<{
    type: 'share_created' | 'view' | 'response';
    timestamp: string;
    data: Record<string, unknown>;
  }>;
}
```

### 2. Get Individual Share Analytics

**GET** `/api/offers/[offerId]/shares/[shareId]/analytics`

```typescript
Response: {
  share: {
    id: string;
    token: string;
    createdAt: string;
    expiresAt: string | null;
    isActive: boolean;
  }
  stats: {
    totalViews: number;
    uniqueVisitors: number;
    totalResponses: number;
    responseRate: number;
    avgTimeToResponse: number;
  }
  accessLogs: Array<{
    id: string;
    accessedAt: string;
    ipAddress: string; // Masked: "192.168.x.x"
    countryCode: string | null;
    deviceType: string | null;
    browser: string | null;
  }>;
  responses: Array<{
    id: string;
    decision: 'accepted' | 'rejected';
    comment: string | null;
    customerName: string | null;
    createdAt: string;
  }>;
}
```

### 3. Export Analytics Data

**GET** `/api/offers/[offerId]/shares/analytics/export?format=csv|json`

Returns downloadable file with analytics data.

## UI Components

### 1. AnalyticsOverviewCards

**Purpose**: Display key metrics at a glance

**Metrics**:

- Total Shares (with trend indicator)
- Total Views (with growth %)
- Total Responses (with breakdown: accepted/rejected)
- Response Rate (with comparison to average)

### 2. SharePerformanceTable

**Purpose**: Compare performance across different share links

**Columns**:

- Share Link (truncated token)
- Created Date
- Views (with sparkline)
- Responses (with breakdown)
- Response Rate (%)
- Actions (View Details, Copy Link, Revoke)

**Features**:

- Sortable columns
- Filterable by date range
- Export to CSV

### 3. ViewsOverTimeChart

**Purpose**: Visualize engagement over time

**Chart Type**: Line or Area chart
**Data Points**:

- Views per day/hour
- Responses per day/hour
- Overlay: Response events

**Libraries**: Recharts or Chart.js

### 4. ResponseTimeline

**Purpose**: Chronological view of all events

**Event Types**:

- Share created
- Views (grouped by day if many)
- Responses (highlighted)

**Visual Design**:

- Timeline with dots/connectors
- Color-coded by event type
- Expandable for details

### 5. AccessLogTable

**Purpose**: Detailed access log for individual share

**Columns**:

- Timestamp
- IP Address (masked)
- Country (flag icon)
- Device Type
- Browser
- Referrer (if available)

**Features**:

- Pagination
- Filter by date range
- Search by IP/device
- Export functionality

## Visual Design

### Color Scheme

- **Views**: Blue (#3b82f6)
- **Accepted Responses**: Green (#10b981)
- **Rejected Responses**: Red (#ef4444)
- **Neutral/Info**: Gray (#6b7280)

### Charts

- **Line Charts**: For time-series data (views over time)
- **Bar Charts**: For comparisons (shares performance)
- **Pie/Donut Charts**: For response breakdown
- **Sparklines**: Mini charts in table cells

## Implementation Phases

### Phase 1: Basic Analytics (MVP)

1. Overview cards with basic metrics
2. Share performance table
3. Simple views over time chart
4. Response timeline

### Phase 2: Enhanced Analytics

1. Individual share analytics page
2. Access log details
3. Geographic distribution (if IP geolocation added)
4. Device/browser breakdown

### Phase 3: Advanced Features

1. Export functionality
2. Scheduled reports (email)
3. Comparison with other offers
4. Predictive analytics (response probability)

## Performance Considerations

1. **Caching**: Cache aggregated analytics for 5-15 minutes
2. **Pagination**: Limit access logs to recent 1000 entries
3. **Aggregation**: Use materialized views or scheduled jobs for heavy calculations
4. **Indexing**: Ensure proper indexes on access_logs (share_id, accessed_at)

## Privacy & Security

1. **IP Masking**: Show only last octet (192.168.x.x)
2. **Data Retention**: Auto-delete access logs older than 90 days (configurable)
3. **RLS**: Ensure users can only see analytics for their own shares
4. **GDPR**: Provide data export and deletion capabilities

## Example Use Cases

### Use Case 1: Track Offer Performance

User shares an offer with 3 different customers via separate links. They want to see:

- Which customer viewed the offer most
- Which customer responded first
- Overall engagement metrics

### Use Case 2: Optimize Sharing Strategy

User wants to understand:

- Best time to share offers (based on view patterns)
- Optimal expiration dates (do shorter expirations increase response rate?)
- Impact of customer information (do named shares perform better?)

### Use Case 3: Customer Engagement

User wants to track:

- How many times a customer viewed before responding
- Time between views and response
- Whether customers share the link with others (referrer tracking)

## Future Enhancements

1. **A/B Testing**: Compare different offer versions
2. **Heatmaps**: Show which sections of offer get most attention (if we add scroll tracking)
3. **Email Integration**: Track if shared via email vs other channels
4. **Social Sharing**: Track if customers share the link on social media
5. **Custom Events**: Track specific actions (downloaded PDF, clicked pricing section, etc.)

## Technical Stack

- **Charts**: Recharts (React) or Chart.js
- **Date Handling**: date-fns or dayjs
- **Data Aggregation**: PostgreSQL functions or application-level
- **Caching**: React Query or SWR for client-side caching
- **Export**: CSV via papaparse, JSON via native

## Accessibility

- **Screen Readers**: Proper ARIA labels for charts
- **Keyboard Navigation**: Full keyboard support for tables
- **Color Contrast**: WCAG AA compliant
- **Alternative Text**: Text summaries for charts

## Mobile Responsiveness

- **Cards**: Stack vertically on mobile
- **Tables**: Horizontal scroll or card view
- **Charts**: Responsive sizing, touch-friendly
- **Timeline**: Vertical layout on mobile
