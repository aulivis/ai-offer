# React Query Setup Guide

## Overview

React Query (TanStack Query) has been integrated into the application to provide intelligent caching, background refetching, and optimistic updates for data fetching.

## Installation

⚠️ **Important**: The React Query packages need to be installed first:

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

## Architecture

### Provider Setup

The `QueryProvider` component wraps the application in `AppProviders.tsx` and provides:

- QueryClient with optimized defaults (30s stale time, 5min cache time)
- Automatic retry logic with exponential backoff
- React Query DevTools in development mode

### Query Hooks

Custom hooks are available in `web/src/hooks/queries/`:

- `useOffers()` - Fetch offers with cursor-based pagination
- `useInfiniteOffers()` - Infinite scroll support for offers
- `useOptimisticOfferUpdate()` - Optimistic updates for offer mutations

## Usage Examples

### Basic Query

```tsx
import { useOffers } from '@/hooks/queries/useOffers';

function OffersList() {
  const { data, isLoading, error } = useOffers({
    filter: 'all',
    teamIds: ['team-1'],
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.items.map((offer) => (
        <div key={offer.id}>{offer.title}</div>
      ))}
    </div>
  );
}
```

### Infinite Scroll

```tsx
import { useInfiniteOffers } from '@/hooks/queries/useOffers';

function InfiniteOffersList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteOffers({
    filter: 'all',
  });

  const offers = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div>
      {offers.map((offer) => (
        <div key={offer.id}>{offer.title}</div>
      ))}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### Optimistic Updates

```tsx
import { useOptimisticOfferUpdate } from '@/hooks/queries/useOffers';

function UpdateOfferButton({ offerId }: { offerId: string }) {
  const updateOffer = useOptimisticOfferUpdate();

  const handleUpdate = () => {
    updateOffer.mutate({
      offerId,
      updates: { status: 'sent', sent_at: new Date().toISOString() },
    });
  };

  return (
    <button onClick={handleUpdate} disabled={updateOffer.isPending}>
      Mark as Sent
    </button>
  );
}
```

### Cache Invalidation

```tsx
import { useInvalidateOffers } from '@/hooks/queries/useOffers';

function CreateOfferButton() {
  const { invalidateAll } = useInvalidateOffers();

  const handleCreate = async () => {
    // Create offer...
    await createOffer(data);
    // Invalidate cache to refetch
    invalidateAll();
  };

  return <button onClick={handleCreate}>Create Offer</button>;
}
```

## Benefits

1. **Automatic Caching**: Data is cached and reused across components
2. **Background Refetching**: Data stays fresh automatically
3. **Optimistic Updates**: UI updates immediately, rolls back on error
4. **Deduplication**: Multiple components requesting same data = single request
5. **Loading States**: Built-in loading, error, and success states
6. **DevTools**: Visual debugging in development mode

## Migration Strategy

The existing dashboard uses direct Supabase queries. To migrate:

1. **Start with new features**: Use React Query hooks for new components
2. **Gradually migrate**: Convert existing queries one at a time
3. **Keep existing code**: Both approaches can coexist during migration

## Configuration

Default configuration in `QueryProvider.tsx`:

- **Stale Time**: 30 seconds (data is fresh)
- **Cache Time**: 5 minutes (unused data stays in cache)
- **Retry**: 3 attempts with exponential backoff
- **Refetch on Window Focus**: Enabled (keeps data fresh)

These can be overridden per query using options:

```tsx
useOffers(params, {
  staleTime: 60000, // 1 minute
  refetchOnWindowFocus: false,
});
```


