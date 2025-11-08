# Why We Count Pending/Processing Jobs in Quota

## The Problem Without Counting Pending/Processing

If we **only counted successful PDFs** (confirmed quota), we would have a **race condition** that allows quota limits to be exceeded.

### Example: Race Condition Scenario

**Scenario**: User has quota limit of 2, currently has 1 confirmed PDF.

**Timeline** (without counting pending/processing):

```
Time  Request A              Request B              Request C              Database State
─────────────────────────────────────────────────────────────────────────────────────
T1    Check quota            -                      -                      confirmed: 1
      confirmed: 1           
      limit: 2               
      remaining: 1 ✅         -                      -                      
      
T2    Enqueue job            Check quota            -                      confirmed: 1
      (creates 'pending')     confirmed: 1                                  pending: 1
                             limit: 2                                      
                             remaining: 1 ✅         -                      
                             
T3    -                      Enqueue job            Check quota            confirmed: 1
                             (creates 'pending')     confirmed: 1          pending: 2
                                                   limit: 2               
                                                   remaining: 1 ✅         
                                                   
T4    -                      -                      Enqueue job            confirmed: 1
                                                   (creates 'pending')     pending: 3
                                                   
T5    Process job            Process job            Process job            confirmed: 4 ❌
      (pending→confirmed)     (pending→confirmed)    (pending→confirmed)   EXCEEDS LIMIT!
```

**Result**: 3 PDFs generated, but limit is 2. ❌ **Quota exceeded!**

---

## The Solution: Count Pending/Processing

By counting `pending + processing` jobs, we **reserve quota** for in-flight work:

**Timeline** (with counting pending/processing):

```
Time  Request A              Request B              Request C              Database State
─────────────────────────────────────────────────────────────────────────────────────
T1    Check quota            -                      -                      confirmed: 1
      confirmed: 1           -                      -                      pending: 0
      pending: 0             -                      -                      total: 1
      total: 1               
      remaining: 1 ✅         -                      -                      
      
T2    Enqueue job            Check quota            -                      confirmed: 1
      (creates 'pending')     confirmed: 1          -                      pending: 1
                             pending: 1             -                      total: 2
                             total: 2               
                             remaining: 0 ❌        -                      DENIED!
                             
T3    -                      -                      Check quota            confirmed: 1
                                                   confirmed: 1            pending: 1
                                                   pending: 1              total: 2
                                                   total: 2               
                                                   remaining: 0 ❌         DENIED!
                                                   
T4    Process job            -                      -                      confirmed: 2
      (pending→confirmed)     -                      -                      pending: 0
                                                   total: 2 ✅ (within limit)
```

**Result**: Only 1 PDF generated (total becomes 2). ✅ **Quota respected!**

---

## Does This Prevent Multiple Users on Same Account?

**Yes, but correctly!** The system is designed to:

1. ✅ **Allow legitimate concurrent requests** that fit within quota
2. ✅ **Prevent quota over-allocation** by reserving quota for in-flight jobs
3. ✅ **Reject requests that would exceed quota** even if not yet confirmed

### Example: Two Users, Quota Available

**Scenario**: User has quota limit of 2, currently has 0 confirmed PDFs.

```
Time  User A                 User B                 Database State
─────────────────────────────────────────────────────────────────────
T1    Check quota            -                      confirmed: 0
      confirmed: 0           -                      pending: 0
      pending: 0             -                      total: 0
      total: 0               
      remaining: 2 ✅        -                      
      
T2    Enqueue job            Check quota            confirmed: 0
      (creates 'pending')     confirmed: 0          pending: 1
                             pending: 1             total: 1
                             total: 1               
                             remaining: 1 ✅        
                             
T3    -                      Enqueue job            confirmed: 0
                             (creates 'pending')     pending: 2
                                                   total: 2
                                                   
T4    Process job            Process job            confirmed: 2 ✅
      (pending→confirmed)     (pending→confirmed)    (within limit)
```

**Result**: Both users succeed, total is 2. ✅ **Correct behavior!**

---

## The Trade-off

### Without Counting Pending/Processing
- ❌ Quota can be exceeded under concurrent load
- ❌ Race conditions cause quota leaks
- ✅ Simpler logic (only count confirmed)

### With Counting Pending/Processing (Current Design)
- ✅ Quota limits are enforced accurately
- ✅ Prevents race conditions
- ✅ Better user experience (reject early, not after PDF generation)
- ⚠️ Slightly more complex logic

---

## Current Implementation Details

### 1. **Initial Quota Check** (Before Job Enqueue)
```typescript
// In API route: web/src/app/api/ai-generate/route.ts
const quotaCheck = await checkQuotaWithPending(sb, user.id, planLimit, usagePeriodStart);
// Counts: confirmed + pending + processing
// If total >= limit → REJECT immediately
```

**Purpose**: Reject requests early if quota would be exceeded, even including in-flight work.

### 2. **Final Quota Increment** (After PDF Generation)
```sql
-- In check_and_increment_usage function
-- Counts: confirmed + pending (excluding current job)
-- If total >= limit → REJECT (but PDF already generated)
```

**Purpose**: Final atomic check before incrementing. Excludes current job to prevent double-counting.

### 3. **Why Exclude Current Job in Increment?**

When we're about to increment quota for a job:
- The job is currently `pending` or `processing`
- We're about to convert it to `confirmed`
- If we count it in pending, we'd double-count: `confirmed + pending (including current) = over-count`

**Solution**: Exclude current job from pending count during increment.

---

## Summary

**Question**: Why count pending/processing instead of only successful PDFs?

**Answer**: To prevent race conditions where multiple concurrent requests could all pass the quota check and exceed the limit.

**Question**: Does this prevent multiple users on the same account from generating PDFs simultaneously?

**Answer**: No - it allows legitimate concurrent requests that fit within quota, but prevents quota over-allocation by reserving quota for in-flight jobs.

**The system correctly**:
1. ✅ Allows 2 simultaneous requests when quota is 0/2
2. ✅ Rejects a 2nd request when quota is 1/2 and 1st is pending
3. ✅ Prevents quota from exceeding the limit under any concurrency scenario

---

## Alternative Approaches (Not Recommended)

### Option 1: Only Count Confirmed
- ❌ Race conditions allow quota over-allocation
- ❌ Requires complex retry/rollback logic
- ❌ Poor user experience (generate PDF then fail)

### Option 2: Use Database Locks/Transactions
- ⚠️ Can cause deadlocks under high concurrency
- ⚠️ Slower performance (serialized requests)
- ✅ Prevents race conditions

### Option 3: Current Approach (Count Pending/Processing)
- ✅ Prevents race conditions
- ✅ Good performance (allows concurrent requests)
- ✅ Better user experience (reject early)
- ✅ Atomic operations prevent double-counting

**Conclusion**: Current approach is the best balance of correctness, performance, and user experience.







