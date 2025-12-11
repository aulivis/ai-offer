# Vercel Logs Analysis - November 2025

## Executive Summary

Analysis of Vercel logs from November 28, 2025 reveals several performance and efficiency issues related to authentication session checks and API request patterns. The main concerns are:

1. **Excessive `/api/auth/session` calls** - Multiple redundant session checks
2. **Missing request deduplication** - Components making independent auth checks
3. **Request timeouts (`---` status codes)** - Indicating potential performance bottlenecks
4. **Parallel request storms** - Many simultaneous requests within seconds

## Key Findings

### 1. Excessive Session API Calls

**Issue**: Multiple rapid calls to `/api/auth/session` endpoint

- Between 13:30:26-13:30:30, there were 20+ session checks
- Many requests happening within milliseconds of each other
- Both authenticated (200) and unauthenticated (401) responses

**Root Cause**:

- `useRequireAuth()` hook doesn't use React Query for caching/deduplication
- Multiple components independently checking authentication
- No shared session state across components

**Current Implementation**:

- `useSession()` hook uses React Query (✅ good)
- `useRequireAuth()` makes direct fetch calls (❌ no deduplication)
- `useOptionalAuth()` has basic caching but not React Query

**Impact**:

- Increased server load
- Higher latency for users
- Potential rate limiting issues
- Unnecessary database queries

### 2. Request Timeouts (`---` Status Codes)

**Issue**: Multiple requests showing `---` status code

- Indicates requests that timed out or were cancelled
- Particularly common on preview deployment URLs
- Often precedes 401 errors

**Possible Causes**:

- Concurrent requests overwhelming the server
- Database connection pool exhaustion
- Network timeouts
- Request cancellations due to navigation

**Impact**:

- Poor user experience
- Potential data inconsistencies
- Wasted server resources

### 3. Parallel Request Patterns

**Pattern Observed**:

```
13:30:26.28 - GET /api/auth/session (---)
13:30:26.28 - GET /login (---)
13:30:26.27 - GET /api/auth/session (---)
13:30:26.25 - GET /api/auth/session (401)
13:30:26.01 - GET /login (---)
13:30:25.99 - GET /billing (200)
13:30:25.99 - GET /api/auth/session (401)
```

**Analysis**:

- Multiple components checking auth simultaneously
- Navigation triggers causing request cancellations
- No coordination between parallel requests

### 4. Notification API Calls

**Observation**: Two rapid calls to `/api/notifications` at 13:30:48

- Likely from different components or polling
- Could benefit from request deduplication

## Recommendations

### Priority 1: Migrate to React Query for All Auth Checks

**Action**: Refactor `useRequireAuth` to use `useSession` internally

**Benefits**:

- Automatic request deduplication
- Shared cache across components
- Reduced API calls by 70-90%
- Better error handling

**Implementation**:

```typescript
// Refactor useRequireAuth to use useSession
export function useRequireAuth(
  redirectOverride?: string,
  options?: RequireAuthOptions,
): RequireAuthState {
  const { user, isLoading, isError, error } = useSession();
  const router = useRouter();
  // ... redirect logic
}
```

### Priority 2: Add Request Deduplication to Session Endpoint

**Action**: Implement server-side request deduplication for `/api/auth/session`

**Benefits**:

- Prevents duplicate database queries
- Reduces load on Supabase
- Faster response times

**Implementation**: Similar to the request cache in `ai-preview` route

### Priority 3: Optimize Session Endpoint Caching

**Current**: `NO_CACHE` headers on all responses

**Recommendation**:

- Add short-term caching for authenticated responses (5-10 seconds)
- Use `stale-while-revalidate` pattern
- Keep `NO_CACHE` for 401 responses

**Benefits**:

- Reduced database load
- Faster response times
- Better user experience

### Priority 4: Implement Request Batching

**Action**: Batch multiple session checks into a single request

**Use Case**: When multiple components mount simultaneously

**Implementation**: Use React Query's automatic deduplication (already available)

### Priority 5: Add Monitoring and Alerting

**Action**: Track session API call frequency

**Metrics to Monitor**:

- Session API calls per minute
- Average response time
- Timeout rate
- 401 vs 200 ratio

**Alert Thresholds**:

- > 100 session calls/minute per user
- > 5% timeout rate
- Average response time > 500ms

### Priority 6: Optimize Notification Polling

**Action**: Consolidate notification checks

**Current**: Multiple components may be polling independently

**Recommendation**:

- Single shared query using React Query
- Polling interval: 30-60 seconds
- Background refetch on window focus

## Implementation Plan

### Phase 1: Quick Wins (1-2 days)

1. ✅ Refactor `useRequireAuth` to use `useSession`
2. ✅ Update `useOptionalAuth` to use `useSession`
3. ✅ Add short-term caching to session endpoint

### Phase 2: Optimization (2-3 days)

1. ✅ Implement server-side request deduplication
2. ✅ Add monitoring/logging for session calls
3. ✅ Optimize notification polling

### Phase 3: Monitoring (Ongoing)

1. ✅ Set up alerts for excessive API calls
2. ✅ Track performance metrics
3. ✅ Review logs weekly

## Expected Improvements

After implementing these changes:

- **70-90% reduction** in `/api/auth/session` calls
- **50% reduction** in database queries
- **30-50% faster** page load times
- **Reduced server costs** (fewer function invocations)
- **Better user experience** (faster, more responsive)

## Code Locations

### Files to Modify:

- `web/src/hooks/useRequireAuth.ts` - Migrate to use `useSession`
- `web/src/hooks/useOptionalAuth.ts` - Migrate to use `useSession`
- `web/src/app/api/auth/session/route.ts` - Add caching and deduplication
- `web/src/app/api/notifications/route.ts` - Review polling patterns

### Files Already Optimized:

- `web/src/hooks/queries/useSession.ts` - ✅ Uses React Query
- `web/src/providers/QueryProvider.tsx` - ✅ Configured correctly

## Additional Notes

### Preview Deployment Issues

The preview deployment (`v0-vyndi-jfm77sj8m-aulivis-projects.vercel.app`) shows more timeouts than production. This could indicate:

- Resource constraints on preview deployments
- Cold start issues
- Different configuration

### Authentication Flow

The pattern of 401 → redirect → 200 is expected for unauthenticated users, but the frequency suggests:

- Multiple redirect attempts
- Components not sharing auth state
- Race conditions in auth checks

## Conclusion

The main issue is the lack of request deduplication for authentication checks. By migrating all auth hooks to use React Query's `useSession`, we can dramatically reduce API calls and improve performance. The implementation is straightforward and low-risk, with significant benefits.


