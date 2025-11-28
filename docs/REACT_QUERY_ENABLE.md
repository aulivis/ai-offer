# Enabling React Query in Vercel Build

## Quick Start

React Query has been enabled! Here's what was changed:

### 1. ✅ Packages Added to `package.json`

```json
"@tanstack/react-query": "^5.62.0",
"@tanstack/react-query-devtools": "^5.62.0"
```

### 2. ✅ QueryProvider Enabled in `AppProviders.tsx`

The QueryProvider wrapper has been uncommented and is now active.

## Next Steps

### Local Development

1. **Install packages locally:**

   ```bash
   pnpm install
   ```

2. **Start dev server:**

   ```bash
   pnpm dev
   ```

3. **Verify React Query DevTools:**
   - Look for the React Query logo in the bottom-right corner (development only)
   - Click to open DevTools and inspect queries

### Vercel Deployment

Vercel will automatically:

1. Detect the new dependencies in `package.json`
2. Run `pnpm install` during build
3. Include React Query in the production bundle

**Note:** DevTools are automatically excluded from production builds (only enabled in development mode).

## Verification

### Check if React Query is Working

1. **Development Mode:**
   - Open browser console
   - Look for React Query DevTools icon in bottom-right
   - No console errors about missing React Query

2. **Use React Query Hooks:**

   ```tsx
   import { useOffers } from '@/hooks/queries/useOffers';

   // This will now work with React Query caching
   const { data, isLoading } = useOffers({ filter: 'all' });
   ```

## Available Features

### Query Hooks

- `useOffers()` - Fetch offers with cursor pagination
- `useInfiniteOffers()` - Infinite scroll for offers
- `useOptimisticOfferUpdate()` - Optimistic updates
- `useInvalidateOffers()` - Cache invalidation

### Configuration

React Query is configured with:

- **Stale Time:** 30 seconds (data considered fresh)
- **Cache Time:** 5 minutes (unused data retention)
- **Retry:** 3 attempts with exponential backoff
- **Refetch on Window Focus:** Enabled (keeps data fresh)

See `web/src/providers/QueryProvider.tsx` for full configuration.

## Troubleshooting

### Build Errors

If you see errors about React Query imports:

1. Ensure packages are installed: `pnpm install`
2. Clear cache: `rm -rf node_modules .next pnpm-lock.yaml && pnpm install`
3. Rebuild: `pnpm build`

### DevTools Not Showing

- DevTools only appear in development mode (`NODE_ENV !== 'production'`)
- Ensure you're running `pnpm dev`, not `pnpm build && pnpm start`

## Documentation

- Full setup guide: `web/docs/REACT_QUERY_SETUP.md`
- Usage examples: `web/src/hooks/queries/useOffers.ts`

## Migration Path

Existing code will continue to work. React Query hooks are available for:

- New components (recommended)
- Gradually migrating existing components
- Both approaches can coexist
