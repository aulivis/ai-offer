# Quota System Design

## Overview

The quota system manages user and device-level usage limits for PDF generation. This document describes the unified quota service architecture.

## Problem Statement

The quota system had multiple issues causing inconsistent display across pages:

1. **Billing page** queried `usage_counters` directly and recalculated, causing inconsistencies
2. **Multiple quota sources**: Dashboard, QuotaWarningBar, and Billing used different methods
3. **Period mismatch**: `get_quota_snapshot` was selecting by `user_id + period_start` instead of `user_id` only
4. **Cookie/caching issues**: Different pages showed different values
5. **Real-time subscriptions**: Multiple subscriptions with period checks causing race conditions

## Solution: Unified Quota Service

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Unified Quota Service                           │
│              (@/lib/services/quota.ts)                       │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  getQuotaData() - SINGLE SOURCE OF TRUTH            │   │
│  │  - Always uses get_quota_snapshot RPC function      │   │
│  │  - Handles period calculation consistently          │   │
│  │  - Returns normalized QuotaData type                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Helper Functions:                                           │
│  - isUserQuotaExhausted()                                    │
│  - isDeviceQuotaExhausted()                                  │
│  - getRemainingUserQuota()                                   │
│  - getRemainingDeviceQuota()                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Used by:
                              ▼
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐        ┌──────▼──────┐      ┌──────▼──────┐
   │Dashboard│        │QuotaWarning │      │   Billing   │
   │  Page   │        │    Bar      │      │    Page     │
   └─────────┘        └─────────────┘      └─────────────┘
```

### Key Components

#### 1. Unified Quota Service (`web/src/lib/services/quota.ts`)

- Single function: `getQuotaData()` - the ONLY way to fetch quota for UI
- Always uses `get_quota_snapshot` RPC function
- Consistent period handling (defaults to current month)
- Helper functions for quota exhaustion checks

#### 2. Database Function

The `get_quota_snapshot` RPC function:

- Selects by `user_id` only (PK), not `user_id + period_start`
- Properly handles period mismatches (returns 0 for new period)
- Always returns requested period (not stored period)
- Consistent with `check_and_increment_usage` logic

#### 3. Components

All components use the unified service:

- **Dashboard**: Uses `getQuotaData()` instead of direct RPC call
- **QuotaWarningBar**: Uses `getQuotaData()` and helper functions
- **Billing Page**: Uses `getQuotaData()` instead of direct table queries
- **useQuotaManagement Hook**: Uses `getQuotaData()` for consistency

#### 4. Real-time Subscriptions

- Removed period checks from subscriptions (handled by `get_quota_snapshot`)
- Refresh quota on any `usage_counters` or `pdf_jobs` change
- Debounced rapid changes to prevent excessive refreshes

## Usage

### Fetching Quota Data

```typescript
import { getQuotaData } from '@/lib/services/quota';

const quotaData = await getQuotaData(userId, periodStart);
```

### Checking Quota Exhaustion

```typescript
import { isUserQuotaExhausted, isDeviceQuotaExhausted } from '@/lib/services/quota';

if (isUserQuotaExhausted(quotaData)) {
  // Handle exhausted quota
}

if (isDeviceQuotaExhausted(quotaData, deviceId)) {
  // Handle device quota exhausted
}
```

### Getting Remaining Quota

```typescript
import { getRemainingUserQuota, getRemainingDeviceQuota } from '@/lib/services/quota';

const remaining = getRemainingUserQuota(quotaData);
const deviceRemaining = getRemainingDeviceQuota(quotaData, deviceId);
```

## Benefits

1. **Single Source of Truth**: All quota data comes from one function
2. **Consistency**: All pages show the same quota values
3. **Period Handling**: Correctly handles period transitions
4. **Maintainability**: Changes to quota logic only need to be made in one place
5. **Performance**: Single RPC call instead of multiple queries
6. **Real-time Updates**: Simplified subscriptions that work reliably

## Database Schema

### Usage Counters

```sql
CREATE TABLE usage_counters (
  user_id UUID PRIMARY KEY,
  period_start DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  limit_value INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Device Usage Counters

```sql
CREATE TABLE device_usage_counters (
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  period_start DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  limit_value INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, device_id, period_start)
);
```

## Testing

### Checklist

- [ ] Dashboard shows correct quota on initial load
- [ ] Billing page shows same quota as dashboard
- [ ] QuotaWarningBar shows/hides correctly
- [ ] Quota updates in real-time when PDF is generated
- [ ] Period transitions work correctly (month change)
- [ ] Multiple tabs show consistent quota
- [ ] Quota increments correctly after PDF generation
- [ ] Quota displays correctly for free/standard/pro plans

## Future Improvements

1. **Add caching**: Cache quota data for a few seconds to reduce database load
2. **Add retry logic**: Retry failed quota fetches with exponential backoff
3. **Add analytics**: Track quota usage patterns
4. **Add alerts**: Alert when quota inconsistencies are detected

## Related Documentation

- [Architecture Documentation](./ARCHITECTURE.md) - System architecture overview
- [API Documentation](./API.md) - API endpoints reference

