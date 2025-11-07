# Backend Quota Update Issues Analysis

## Critical Issues Found

### 1. **VERIFIED: Edge Worker Rollback Calls Are Correct**

**Location**: `web/supabase/functions/pdf-worker/index.ts:373, 455, 463`

**Status**: ✅ The edge worker has its own `rollbackUsageIncrement` function with a different signature than the shared library version. The calls are correct for the edge worker's implementation.

**Edge Worker Function Signature** (line 540):
```typescript
export async function rollbackUsageIncrement<K extends CounterKind>(
  supabase: SupabaseClient,
  kind: K,                    // 'user' | 'device'
  target: CounterTargets[K],  // { userId: string } or { userId: string, deviceId: string }
  expectedPeriod: string
)
```

**Current Calls** (CORRECT):
```typescript
// Line 373 - Device quota rollback when device quota check fails
await rollbackUsageIncrement(supabase, 'user', { userId: job.user_id }, usagePeriodStart);

// Line 455 - User quota rollback in error handler
await rollbackUsageIncrement(supabase, 'user', { userId: job.user_id }, usagePeriodStart);

// Line 463 - Device quota rollback in error handler  
await rollbackUsageIncrement(supabase, 'device', { userId: job.user_id, deviceId }, usagePeriodStart);
```

**Potential Issue**: The edge worker's rollback function does NOT have retry logic, while the shared library version (`rollbackUsageIncrementWithRetry`) does. If a rollback fails due to a transient error (network, database lock, etc.), the quota will remain incorrectly incremented.

**Recommendation**: Consider adding retry logic to the edge worker's rollback function, similar to the shared library implementation.

---

### 2. **Potential Issue: Silent Rollback Failures**

**Location**: Multiple places in both edge worker and inline worker

**Issue**: Rollback errors are caught and logged but not re-thrown, which means if rollback fails, the quota stays incorrectly incremented.

**Current code**:
```typescript
try {
  await rollbackUsageIncrement(...);
} catch (rollbackError) {
  console.error('Failed to rollback user usage increment:', rollbackError);
  // Error is logged but not thrown - quota stays incremented!
}
```

**Impact**: 
- If rollback fails (database error, connection issue, etc.), quota will remain incremented
- User will have quota deducted even though PDF generation failed
- No alert or notification that rollback failed

**Recommendation**: 
- Consider retrying rollback operations
- Log rollback failures to monitoring/alerting system
- Potentially add a background job to reconcile quota discrepancies

---

### 3. **Potential Issue: Race Condition in Job Claiming**

**Location**: `web/src/lib/pdfInlineWorker.ts:108-156`

**Issue**: The inline worker checks if job is already claimed, but there's a small window where both workers might process the same job.

**Current flow**:
1. Edge worker claims job (status: pending → processing)
2. Dispatch fails/times out
3. Inline worker checks job status
4. If status is still 'pending' (rare race condition), inline worker claims it
5. Both workers process and both increment quota

**Mitigation**: The code does check job status before claiming, which should prevent most cases. However, there's still a theoretical race condition.

**Impact**: Low - should be rare, but could cause double quota increment

---

### 4. **Potential Issue: Fallback Increment Not Atomic**

**Location**: `web/src/lib/usageHelpers.ts:133-168` and `web/supabase/functions/pdf-worker/index.ts:733-769`

**Issue**: The fallback increment function does:
1. Read current usage
2. Check limit
3. Update usage

This is not atomic - between step 1 and 3, another process could update usage, leading to incorrect counts.

**Impact**: Medium - Could cause quota to be incorrect under high concurrency

**Mitigation**: The primary RPC function (`check_and_increment_usage`) is atomic and should be used in most cases. Fallback is only used if RPC is unavailable.

---

### 5. **Potential Issue: Period Start Mismatch**

**Location**: `web/supabase/migrations/20240711120000_usage_quota_function.sql:32-38`

**Issue**: The SQL function resets counter if `period_start` doesn't match, but if there's a timezone issue or date format mismatch, it could reset unexpectedly.

**Code**:
```sql
-- reset counter when a new billing period starts
if v_usage.period_start is distinct from p_period_start then
  update usage_counters
     set period_start = p_period_start,
         offers_generated = 0
   where user_id = p_user_id
  returning * into v_usage;
end if;
```

**Impact**: Low - Should only happen when billing period actually changes

---

## Most Likely Root Cause for User's Issue

Based on the analysis, the most likely causes for quota not updating after successful PDF creation:

1. **Silent Rollback Failures** (Most Likely): If the PDF generation fails after quota increment, and rollback fails silently, quota stays incremented. However, the user said the PDF was created successfully, so this is less likely.

2. **Missing Retry Logic in Edge Worker**: The edge worker's rollback function doesn't have retry logic. If a transient error occurs during rollback, quota won't be properly decremented. But again, the user's PDF was successful.

3. **Quota Not Actually Incremented**: The most likely scenario is that the quota increment RPC call failed silently or returned an error that wasn't properly handled. Check backend logs for:
   - RPC function errors (`check_and_increment_usage`)
   - Database connection errors
   - Transaction failures

4. **Period Start Mismatch**: If there's a timezone or date format issue, the quota increment might be applied to a different period than expected.

5. **Frontend Not Refreshing**: The frontend might be showing stale quota data. The fix already implemented (1.5s delay before redirect) should help, but verify the dashboard actually refreshes quota on load.

## Recommended Fixes

### Priority 1: Add Retry Logic to Edge Worker Rollback
- Add retry logic to the edge worker's `rollbackUsageIncrement` function
- Use exponential backoff similar to the shared library implementation
- This will reduce quota leaks when rollback fails due to transient errors

### Priority 2: Improve Error Handling and Logging
- Add more detailed logging around quota increment operations
- Log the result of `incrementUsage` calls (allowed, offersGenerated, etc.)
- Add monitoring/alerting for rollback failures
- Add monitoring for quota increment failures

### Priority 3: Add Quota Reconciliation Job
- Create a background job that periodically checks for discrepancies
- Compare `usage_counters.offers_generated` with actual count of PDFs with `pdf_url IS NOT NULL`
- Auto-fix discrepancies or alert administrators
- This will catch and fix quota issues automatically

### Priority 4: Verify RPC Function is Working
- Check if `check_and_increment_usage` RPC function is properly deployed
- Verify the function is being called correctly
- Check database logs for any RPC errors
- Test the RPC function directly to ensure it increments quota correctly

---

## Testing Recommendations

1. **Test rollback scenarios**:
   - Create PDF that fails after quota increment
   - Verify quota is rolled back correctly
   - Check logs for rollback errors

2. **Test concurrent generation**:
   - Generate multiple PDFs simultaneously
   - Verify quota increments correctly
   - Check for double increments

3. **Test edge worker rollback**:
   - Simulate device quota failure
   - Verify user quota is rolled back
   - Check logs for errors

4. **Test period boundary**:
   - Generate PDFs near month boundary
   - Verify quota resets correctly
   - Check for period mismatch issues

---

## Monitoring

Add monitoring for:
- Rollback failures (log and alert)
- Quota increments that don't match PDF generation success
- Discrepancies between `usage_counters` and actual PDF count
- Edge worker errors during quota increment/rollback

