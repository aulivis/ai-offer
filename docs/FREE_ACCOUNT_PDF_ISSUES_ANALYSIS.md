# Free Account PDF Generation Issues - Analysis

## Overview
This document identifies potential causes of PDF generation failures on free accounts where quota is decremented but no PDF is created.

## Executive Summary

**Most Critical Issue**: When `dispatchPdfJob` fails, the inline fallback doesn't check if the edge worker already claimed the job. This can lead to:
- Double quota increment (both workers process)
- Quota incremented but no PDF in dashboard (edge worker increments, fails to update offer, rollback fails)

**Root Causes**:
1. **No job status check before inline fallback** - Inline worker processes jobs already claimed by edge worker
2. **Quota increment before offer update** - If offer update fails, rollback may fail, leaving quota incremented
3. **Silent rollback failures** - Rollback errors are logged but not retried
4. **Race conditions** - Multiple concurrent requests can exceed quota limits

**Recommended Immediate Fix**: Add job status check in inline worker before processing (similar to edge worker's `claimJobForProcessing`).

## Critical Issues Identified

### 1. **Race Condition: Quota Increment Before PDF Completion**
**Location**: `web/supabase/functions/pdf-worker/index.ts:331-355`

**Problem**: 
- Quota is incremented AFTER PDF generation but BEFORE offer update
- If offer update fails, quota rollback may fail silently
- Edge worker increments quota, but if dispatch fails, inline worker also tries to increment

**Flow**:
1. PDF generated successfully
2. PDF uploaded to storage
3. **Quota incremented** (user + device for free accounts)
4. Offer update attempted
5. If offer update fails → rollback attempted
6. If rollback fails → quota stays incremented, no PDF in dashboard

**Risk**: HIGH - This matches the reported issue exactly

---

### 2. **Device Limit Check Timing Issue**
**Location**: `web/src/app/api/ai-generate/route.ts:813-828`

**Problem**:
- Free accounts have device limit of 3 per device
- Device limit is checked BEFORE job enqueue
- But device quota is incremented AFTER PDF generation in worker
- Race condition: Multiple concurrent requests can pass pre-check but fail at increment

**Flow**:
1. Pre-check: `projectedDeviceUsage < deviceLimit` ✅
2. Job enqueued
3. Worker processes job
4. Device quota increment: `deviceUsage >= deviceLimit` ❌
5. Error thrown, but user quota already incremented
6. Rollback attempts both, but if rollback fails, user quota stays incremented

**Risk**: MEDIUM-HIGH - Can cause quota leak on free accounts

---

### 3. **Dispatch Failure Fallback Issue - DOUBLE PROCESSING**
**Location**: 
- `web/src/app/api/ai-generate/route.ts:1165-1221` (fallback logic)
- `web/src/lib/pdfInlineWorker.ts:109-112` (inline worker status update)
- `web/supabase/functions/pdf-worker/index.ts:451-465` (edge worker claim)

**Problem**:
- When `dispatchPdfJob` fails, code falls back to inline processing
- Edge worker may have already claimed job (status: pending → processing)
- Inline worker updates status to 'processing' WITHOUT checking if already claimed
- Both workers process the same job
- Both increment quota → **DOUBLE INCREMENT**

**Code Issue**:
```typescript
// Edge worker (CORRECT - checks status before claiming)
async function claimJobForProcessing(...) {
  .update({ status: 'processing', ... })
  .eq('status', 'pending')  // ✅ Only updates if pending
  .maybeSingle();
  return Boolean(data);  // Returns false if already claimed
}

// Inline worker (WRONG - doesn't check if already claimed)
await supabase
  .from('pdf_jobs')
  .update({ status: 'processing', started_at: startedAt })
  .eq('id', job.jobId);  // ❌ Updates regardless of current status
```

**Flow**:
1. Job enqueued (status: 'pending')
2. `dispatchPdfJob` called → edge worker claims job (status: 'pending' → 'processing')
3. Edge worker starts processing, increments quota
4. Dispatch call fails/times out (but edge worker continues processing)
5. Inline fallback starts
6. Inline worker updates status to 'processing' (succeeds even if already processing)
7. Inline worker also processes job and increments quota → **DOUBLE INCREMENT**

**Risk**: CRITICAL - This is the most likely cause of the reported issue!

**Additional Scenario - Quota Incremented But No PDF in Dashboard**:
1. Edge worker claims job (status: 'pending' → 'processing')
2. Edge worker generates PDF successfully
3. Edge worker uploads PDF to storage
4. Edge worker increments quota ✅
5. Edge worker fails to update offer with PDF URL (error)
6. Edge worker rollback fails (quota stays incremented) ❌
7. Dispatch call fails/times out
8. Inline fallback tries to process
9. Inline worker sees job is 'processing' but still tries to update
10. Inline worker might fail early or succeed but edge worker already incremented quota
11. **Result**: Quota incremented, PDF in storage, but offer.pdf_url is NULL → No PDF in dashboard

---

### 4. **Silent Rollback Failures**
**Location**: `web/supabase/functions/pdf-worker/index.ts:421-440`

**Problem**:
- Rollback errors are logged but not propagated
- If rollback fails, quota stays incremented
- No retry mechanism for rollback

**Code**:
```typescript
if (userUsageIncremented) {
  try {
    await rollbackUsageIncrement(...);
  } catch (rollbackError) {
    console.error('Failed to rollback user usage increment:', rollbackError);
    // Error swallowed - quota stays incremented!
  }
}
```

**Risk**: MEDIUM - Quota leak if rollback fails

---

### 5. **Missing Error Handling in Offer Update**
**Location**: `web/src/lib/pdfInlineWorker.ts:241-248` (FIXED)

**Status**: ✅ Fixed in previous change
- Now properly checks for errors and throws
- Ensures rollback happens if offer update fails

---

### 6. **Device Limit Not Passed to Inline Worker**
**Location**: `web/src/app/api/ai-generate/route.ts:1189-1192`

**Problem**:
- Device limit is conditionally passed to inline worker
- If `deviceLimit` is `undefined`, it won't be passed
- Inline worker may not enforce device limits properly

**Code**:
```typescript
...(pdfJobInput.deviceLimit !== undefined
  ? { deviceLimit: pdfJobInput.deviceLimit }
  : {}),
```

**Risk**: LOW-MEDIUM - Device limits may not be enforced in inline fallback

---

### 7. **Pending Job Count Race Condition**
**Location**: `web/src/app/api/ai-generate/route.ts:798-811`

**Problem**:
- Pending jobs are counted BEFORE enqueue
- Between count and enqueue, another request can enqueue a job
- Both requests pass the check, both jobs get enqueued
- Both may succeed, exceeding quota

**Flow**:
1. Request A: Count pending = 2, limit = 3, confirmed = 1 → ✅ Allowed
2. Request B: Count pending = 2, limit = 3, confirmed = 1 → ✅ Allowed
3. Request A: Enqueue job → pending = 3
4. Request B: Enqueue job → pending = 4
5. Both process → quota exceeded

**Risk**: MEDIUM - Can allow quota overrun

---

## Recommended Fixes

### Priority 1: Critical Fixes

1. **Move Quota Increment After Offer Update**
   - Increment quota ONLY after offer is successfully updated
   - Reduces window for quota leak

2. **Add Transaction/Atomicity**
   - Use database transactions to ensure quota increment + offer update are atomic
   - Or use two-phase commit pattern

3. **Fix Dispatch/Inline Coordination**
   - Check if edge worker already claimed job before inline fallback
   - Add job status check before inline processing
   - Prevent double processing

### Priority 2: Important Fixes

4. **Improve Rollback Reliability**
   - Add retry logic for rollback operations
   - Log rollback failures to monitoring system
   - Consider manual rollback mechanism for failed rollbacks

5. **Fix Device Limit Race Condition**
   - Use database-level locking for device quota checks
   - Or use optimistic locking with retry

6. **Fix Pending Count Race Condition**
   - Use database-level check-and-increment
   - Or use advisory locks

### Priority 3: Nice to Have

7. **Add Monitoring/Alerting**
   - Alert when rollback fails
   - Track quota leaks
   - Monitor dispatch failure rate

8. **Add Idempotency**
   - Ensure job processing is idempotent
   - Prevent double processing

---

## Testing Recommendations

1. **Test concurrent requests** on free account with device limit
2. **Test dispatch failure** → inline fallback scenario
3. **Test rollback failure** scenarios
4. **Test quota exhaustion** edge cases
5. **Test device limit** enforcement

---

## Code Locations Summary

- **Quota increment**: `web/supabase/functions/pdf-worker/index.ts:331-355`
- **Inline worker**: `web/src/lib/pdfInlineWorker.ts:215-260`
- **Dispatch fallback**: `web/src/app/api/ai-generate/route.ts:1165-1221`
- **Device limit check**: `web/src/app/api/ai-generate/route.ts:813-828`
- **Pending count**: `web/src/app/api/ai-generate/route.ts:798-811`
- **Rollback logic**: `web/supabase/functions/pdf-worker/index.ts:421-440`

