# Realtime Subscriptions Guide

## Overview

Enhanced realtime subscription hooks have been created to enable live updates for offers and PDF jobs. These hooks provide a clean, reusable interface for real-time functionality.

## Migration Required

⚠️ **Important**: Run the migration to enable realtime for the offers table:

```bash
# Migration file: 20250116000003_enable_realtime_for_offers.sql
```

This adds the `offers` table to the Supabase realtime publication, allowing subscriptions.

## Available Hooks

### 1. `useOffersRealtime` - Subscribe to all offers

Subscribes to INSERT, UPDATE, and DELETE events for offers visible to the user.

```tsx
import { useOffersRealtime } from '@/hooks/realtime/useOffersRealtime';
import { useQueryClient } from '@tanstack/react-query';

function OffersList() {
  const queryClient = useQueryClient();
  const { user } = useRequireAuth();
  const { teamIds } = useTeamMemberships();

  useOffersRealtime({
    userId: user?.id,
    teamIds,
    onOfferInserted: (offer) => {
      // Add new offer to React Query cache
      queryClient.setQueryData(['offers'], (old: any) => ({
        ...old,
        items: [offer, ...(old?.items || [])],
      }));
    },
    onOfferUpdated: (offer) => {
      // Update offer in React Query cache
      queryClient.setQueryData(['offers'], (old: any) => ({
        ...old,
        items: old?.items.map((o: any) => (o.id === offer.id ? offer : o)),
      }));
    },
    onOfferDeleted: (offerId) => {
      // Remove offer from React Query cache
      queryClient.setQueryData(['offers'], (old: any) => ({
        ...old,
        items: old?.items.filter((o: any) => o.id !== offerId),
      }));
    },
  });

  // ... rest of component
}
```

### 2. `useOfferRealtime` - Subscribe to single offer

Subscribes to updates for a specific offer (useful for detail pages).

```tsx
import { useOfferRealtime } from '@/hooks/realtime/useOffersRealtime';

function OfferDetailPage({ offerId }: { offerId: string }) {
  const [offer, setOffer] = useState<Offer | null>(null);

  useOfferRealtime(
    offerId,
    true, // enabled
    (updatedOffer) => {
      setOffer(updatedOffer);
    },
  );

  // ... rest of component
}
```

### 3. `usePdfJobRealtime` - Subscribe to PDF job status

Subscribes to PDF job status updates for a specific offer.

```tsx
import { usePdfJobRealtime } from '@/hooks/realtime/useOffersRealtime';

function OfferCard({ offer }: { offer: Offer }) {
  const [pdfUrl, setPdfUrl] = useState(offer.pdf_url);

  usePdfJobRealtime(
    offer.id,
    !pdfUrl, // Only subscribe if PDF doesn't exist yet
    (newPdfUrl) => {
      setPdfUrl(newPdfUrl);
      // Show notification that PDF is ready
      showToast({ title: 'PDF ready', variant: 'success' });
    },
  );

  return <div>{pdfUrl ? <a href={pdfUrl}>Download PDF</a> : <span>Generating PDF...</span>}</div>;
}
```

## Integration with React Query

These hooks work seamlessly with React Query for cache updates:

```tsx
import { useOffersRealtime } from '@/hooks/realtime/useOffersRealtime';
import { useInvalidateOffers } from '@/hooks/queries/useOffers';

function OffersPage() {
  const { invalidateAll } = useInvalidateOffers();
  const { user } = useRequireAuth();

  // Option 1: Invalidate cache on updates (simpler)
  useOffersRealtime({
    userId: user?.id,
    onOfferUpdated: () => invalidateAll(),
    onOfferInserted: () => invalidateAll(),
    onOfferDeleted: () => invalidateAll(),
  });

  // Option 2: Optimistic cache updates (more efficient, see hooks/queries/useOffers.ts)
  // ... use the optimistic update handlers shown above

  // ... rest of component
}
```

## Integration with Existing Dashboard

The existing dashboard already has realtime subscriptions for:

- **Quota updates** (`usage_counters`, `pdf_jobs`)
- **PDF job status** (via `pdf_jobs` table)

The new hooks provide a cleaner, reusable interface for:

- **Offer list updates** (INSERT, UPDATE, DELETE)
- **Single offer updates**
- **PDF job status for specific offers**

## Benefits

1. **Live Collaboration**: See offer updates from other team members in real-time
2. **Better UX**: No need to refresh to see new offers or updates
3. **Reusable**: Clean hooks that can be used across different components
4. **Type-Safe**: Full TypeScript support
5. **Automatic Cleanup**: Subscriptions are automatically cleaned up on unmount

## Performance Considerations

- Subscriptions are filtered by user/team IDs (RLS policies apply)
- Channel names are unique per user/team combination
- Subscriptions are cleaned up when components unmount
- Debouncing is handled in existing quota subscriptions (see dashboard)

## Security

All realtime subscriptions respect Row Level Security (RLS) policies:

- Users only receive updates for offers they have access to
- Team-based filtering is handled at the database level
- No sensitive data leaks through realtime channels


