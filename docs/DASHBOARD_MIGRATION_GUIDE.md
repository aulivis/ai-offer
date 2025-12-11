# Dashboard Migration Guide

## Overview

This guide explains how to migrate the dashboard from offset-based pagination to cursor-based pagination, or use both approaches side-by-side.

## Current State

The dashboard currently uses:

- Direct Supabase queries with offset-based pagination (`.range(from, to)`)
- Manual state management for offers list
- Real-time subscriptions for live updates

## New Options

Three approaches are now available:

### 1. Cursor-Based Pagination Hook (Recommended for new features)

Use the `useOffersCursorPagination` hook for better performance:

```tsx
import { useOffersCursorPagination } from '@/app/dashboard/useOffersCursorPagination';

function OffersList() {
  const { user } = useRequireAuth();
  const { teamIds } = useTeamMemberships();

  const { offers, isLoading, hasMore, loadMore } = useOffersCursorPagination({
    userId: user?.id || '',
    filter: 'all',
    teamIds,
  });

  return (
    <div>
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
      {hasMore && (
        <button onClick={loadMore} disabled={isLoading}>
          Load More
        </button>
      )}
    </div>
  );
}
```

### 2. React Query with Cursor Pagination (Best for new components)

Use React Query hooks for intelligent caching:

```tsx
import { useInfiniteOffers } from '@/hooks/queries/useOffers';
import { useOffersRealtime } from '@/hooks/realtime/useOffersRealtime';

function OffersList() {
  const { user } = useRequireAuth();
  const { teamIds } = useTeamMemberships();

  const { data, fetchNextPage, hasNextPage } = useInfiniteOffers({
    filter: 'all',
    teamIds,
  });

  const offers = data?.pages.flatMap((page) => page.items) ?? [];

  // Real-time updates automatically update React Query cache
  useOffersRealtime({
    userId: user?.id,
    teamIds,
    onOfferInserted: () => queryClient.invalidateQueries(['offers']),
    onOfferUpdated: () => queryClient.invalidateQueries(['offers']),
  });

  return (
    <div>
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
      {hasNextPage && <button onClick={() => fetchNextPage()}>Load More</button>}
    </div>
  );
}
```

### 3. Hybrid Approach (Gradual Migration)

Keep existing code and add new features with new approach:

```tsx
// Existing dashboard page.tsx - keep as-is
// New components use cursor pagination
// Both work simultaneously
```

## Migration Strategy

### Phase 1: Side-by-Side (No Breaking Changes)

1. Keep existing dashboard code unchanged
2. Use new hooks for new features/components
3. Test both approaches in production

### Phase 2: Incremental Migration

1. Create a new dashboard route: `/dashboard/offers`
2. Use cursor pagination in the new route
3. Keep old route at `/dashboard` temporarily
4. Migrate users gradually

### Phase 3: Full Migration

1. Replace old pagination logic with cursor-based
2. Remove offset-based code
3. Update all references

## Benefits of Cursor Pagination

1. **Better Performance**: No offset performance degradation at scale
2. **Consistent Ordering**: Deterministic ordering even with concurrent inserts
3. **Efficient Queries**: O(1) page access vs O(n) for offset
4. **Real-time Safe**: Works better with real-time updates

## Migration Checklist

- [ ] Install React Query packages (if using React Query approach)
- [ ] Run migration: `20250116000003_enable_realtime_for_offers.sql`
- [ ] Test cursor pagination API endpoint
- [ ] Create test component using new hooks
- [ ] Verify real-time updates work
- [ ] Compare performance metrics
- [ ] Plan migration timeline
- [ ] Communicate changes to team

## Performance Comparison

| Metric         | Offset Pagination | Cursor Pagination |
| -------------- | ----------------- | ----------------- |
| Page 1         | Fast              | Fast              |
| Page 10        | Fast              | Fast              |
| Page 100       | Slower            | Fast              |
| Page 1000      | Very Slow         | Fast              |
| With Real-time | Can skip items    | Works perfectly   |

## Example: Complete Migration

```tsx
// Before (offset-based)
const fetchPage = async (pageNumber: number) => {
  const from = pageNumber * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data } = await supabase
    .from('offers')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);
  return data;
};

// After (cursor-based)
const { offers, loadMore, hasMore } = useOffersCursorPagination({
  userId: user.id,
  filter: 'all',
});
```

## Support

For questions or issues during migration:

- See `web/docs/REACT_QUERY_SETUP.md` for React Query setup
- See `web/docs/REALTIME_SUBSCRIPTIONS.md` for real-time subscriptions
- Check `web/src/app/api/offers/list/route.ts` for API documentation
