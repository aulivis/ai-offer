# Notification UI Design Specification

## Overview

This document describes the UI components for the dashboard notification system. The notification system provides real-time alerts when customers respond to shared offers.

## Components

### 1. NotificationBar Component

**Purpose**: Display the most recent unread notification prominently at the top of the dashboard.

**Location**: Fixed/sticky position at the top of the dashboard, below header navigation.

**Design**:

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ [Customer Name] accepted your offer "[Offer Title]"      │
│   [View Offer] [Dismiss]                                   │
└─────────────────────────────────────────────────────────────┘
```

**Features**:

- Shows most recent unread notification
- Auto-dismisses after 5 seconds (optional)
- Manual dismiss button (×)
- "View Offer" button navigates to offer details
- Color coding:
  - Green/primary for accepted offers
  - Red/orange for rejected offers
- Smooth slide-in animation from top
- Non-intrusive but visible

**Props**:

```typescript
interface NotificationBarProps {
  notification: {
    id: string;
    offerId: string;
    title: string;
    message: string;
    type: 'response';
    metadata: {
      decision: 'accepted' | 'rejected';
      customer_name?: string;
    };
    createdAt: string;
  };
  onDismiss: (id: string) => void;
  onViewOffer: (offerId: string) => void;
}
```

**States**:

- Visible: When there are unread notifications
- Hidden: When no unread notifications or dismissed
- Auto-hiding: Countdown timer for auto-dismiss

### 2. NotificationBell Component

**Purpose**: Bell icon in header/navigation showing unread count and dropdown menu.

**Location**: Header/navigation bar, typically next to user menu.

**Design**:

```
Header:  [Logo] [Dashboard] [Offers] ... [🔔(3)] [User Menu]
                                    │
                                    └─ Dropdown:
                                       ┌─────────────────────────┐
                                       │ Notifications          │
                                       ├─────────────────────────┤
                                       │ ✓ Customer accepted... │
                                       │ ✓ Customer rejected... │
                                       │ ✓ Customer accepted... │
                                       ├─────────────────────────┤
                                       │ [Mark all as read]     │
                                       │ [View all]             │
                                       └─────────────────────────┘
```

**Features**:

- Bell icon (🔔) with badge showing unread count
- Badge appears when count > 0
- Click opens dropdown menu
- Dropdown shows last 5-10 notifications
- Each notification item:
  - Icon (✓ for read, • for unread)
  - Truncated message
  - Timestamp (relative: "2 minutes ago")
  - Click to navigate to offer
- "Mark all as read" action
- "View all" link to activity log page
- Dropdown closes on outside click

**Props**:

```typescript
interface NotificationBellProps {
  notifications: Array<{
    id: string;
    offerId: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }>;
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onViewOffer: (offerId: string) => void;
  onViewAll: () => void;
}
```

**States**:

- Closed: Bell icon visible, dropdown hidden
- Open: Dropdown visible below bell icon
- Loading: Skeleton/spinner while fetching notifications

### 3. ActivityLog Component

**Purpose**: Full page or modal showing all notifications with filtering and grouping.

**Location**: Dedicated page at `/dashboard/activity` or modal overlay.

**Design**:

```
┌─────────────────────────────────────────────────────────────┐
│ Activity Log                                    [×]         │
├─────────────────────────────────────────────────────────────┤
│ Filters: [All] [Responses] [Views] [Shares]               │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Today                                                 │ │
│ ├───────────────────────────────────────────────────────┤ │
│ │ ✓ Customer accepted "Website Redesign"               │ │
│ │   2 hours ago • [View Offer] [Mark as read]          │ │
│ │                                                       │ │
│ │ • Customer rejected "Mobile App Development"          │ │
│ │   3 hours ago • [View Offer] [Mark as read]          │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Yesterday                                             │ │
│ ├───────────────────────────────────────────────────────┤ │
│ │ ✓ Customer accepted "Brand Identity Design"         │ │
│ │   Yesterday at 3:45 PM • [View Offer]                 │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ [Load More] [Mark all as read]                             │
└─────────────────────────────────────────────────────────────┘
```

**Features**:

- Grouped by date (Today, Yesterday, This Week, etc.)
- Filterable by notification type
- Search/filter by offer title
- Pagination or infinite scroll
- Mark individual notifications as read
- Mark all as read
- Click notification to navigate to offer
- Empty state when no notifications
- Loading states

**Props**:

```typescript
interface ActivityLogProps {
  notifications: Array<{
    id: string;
    offerId: string;
    title: string;
    message: string;
    type: 'response' | 'view' | 'share_created';
    metadata: Record<string, unknown>;
    isRead: boolean;
    createdAt: string;
  }>;
  filters: {
    type?: 'response' | 'view' | 'share_created';
    dateRange?: { start: Date; end: Date };
  };
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onViewOffer: (offerId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}
```

**States**:

- Loading: Skeleton cards
- Empty: Empty state message
- Loaded: List of notifications
- Filtered: Filtered list

## Real-time Updates

### Supabase Realtime Integration

**Subscription**:

```typescript
const channel = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'offer_notifications',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      // Add new notification to state
      addNotification(payload.new);
      // Show notification bar
      showNotificationBar(payload.new);
      // Update bell badge count
      incrementUnreadCount();
    },
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'offer_notifications',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      // Update notification read status
      updateNotification(payload.new);
      // Update unread count
      updateUnreadCount();
    },
  )
  .subscribe();
```

**Cleanup**:

```typescript
useEffect(() => {
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## Styling Guidelines

### Colors

- **Success/Accepted**: Green (#10b981 or primary color)
- **Error/Rejected**: Red/orange (#ef4444 or warning color)
- **Info/Neutral**: Blue/gray (#3b82f6 or muted color)
- **Background**: Match dashboard theme
- **Border**: Subtle border for separation

### Typography

- **Title**: Font-semibold, text-sm
- **Message**: Font-normal, text-sm
- **Timestamp**: Font-normal, text-xs, muted color

### Spacing

- **NotificationBar**: Padding 12px-16px, margin-top: 0
- **Bell Dropdown**: Max-width: 400px, padding: 8px
- **Activity Log**: Padding: 24px, gap: 16px between groups

### Animations

- **Slide-in**: NotificationBar slides down from top (300ms ease-out)
- **Fade-in**: Notification items fade in (200ms ease-in)
- **Badge pulse**: Unread count badge pulses on new notification (optional)

## Accessibility

- **ARIA labels**: All interactive elements have proper labels
- **Keyboard navigation**: Tab through notifications, Enter to select
- **Screen reader**: Announce new notifications
- **Focus management**: Focus moves to notification bar when new notification arrives
- **Color contrast**: WCAG AA compliant

## Responsive Design

### Mobile (< 640px)

- **NotificationBar**: Full width, stacked layout
- **Bell**: Smaller icon, badge positioned top-right
- **Dropdown**: Full-width overlay
- **Activity Log**: Full-width cards, simplified layout

### Tablet (640px - 1024px)

- **NotificationBar**: Centered, max-width 600px
- **Bell**: Standard size
- **Dropdown**: Max-width 400px
- **Activity Log**: 2-column layout

### Desktop (> 1024px)

- **NotificationBar**: Centered, max-width 800px
- **Bell**: Standard size
- **Dropdown**: Max-width 400px
- **Activity Log**: Full-width with filters sidebar

## Implementation Notes

1. **State Management**: Use React Context or Zustand for global notification state
2. **Persistence**: Store read/unread status in database, sync via Realtime
3. **Performance**: Virtualize long lists in ActivityLog
4. **Caching**: Cache notifications in localStorage for offline support
5. **Debouncing**: Debounce Realtime updates to prevent UI flicker

## Example Usage

```tsx
// Dashboard page
<AppFrame>
  <NotificationBar
    notification={latestNotification}
    onDismiss={handleDismiss}
    onViewOffer={handleViewOffer}
  />
  <NotificationBell
    notifications={recentNotifications}
    unreadCount={unreadCount}
    onMarkAsRead={handleMarkAsRead}
    onMarkAllAsRead={handleMarkAllAsRead}
    onViewOffer={handleViewOffer}
    onViewAll={() => router.push('/dashboard/activity')}
  />
  {/* Dashboard content */}
</AppFrame>
```

## Future Enhancements

1. **Sound notifications**: Optional sound when new notification arrives
2. **Browser notifications**: Desktop notifications (requires permission)
3. **Email digest**: Daily/weekly summary email (Phase 2)
4. **Notification preferences**: User settings for notification types
5. **Grouped notifications**: Group multiple responses from same customer
6. **Rich notifications**: Show offer preview image in notification
