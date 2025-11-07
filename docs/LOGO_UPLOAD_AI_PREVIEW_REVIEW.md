# Logo Upload & AI Preview Flow Review

## Executive Summary

This document provides a comprehensive review of the logo upload and AI preview flows, identifying issues and recommending improvements.

---

## Logo Upload Flow

### Current Architecture

1. **Client-side** (`settings/page.tsx`):
   - User selects file via `<input type="file">`
   - Client validates file size (4MB max)
   - Uploads via `fetchWithSupabaseAuth` to `/api/storage/upload-brand-logo`
   - Stores response in local state (`brand_logo_path`, `brand_logo_url`)
   - User must manually save profile to persist to database

2. **Server-side** (`api/storage/upload-brand-logo/route.ts`):
   - Validates authentication via `withAuth`
   - Rate limiting (10 requests/minute)
   - Ensures bucket exists
   - Validates file type via binary signatures
   - Normalizes image (PNG/JPEG compression, SVG sanitization)
   - Uploads to Supabase Storage (`brand-assets` bucket)
   - Generates signed URL (1-hour TTL)
   - Returns `{ path, signedUrl }`

### Issues Identified

#### 🔴 Critical Issues

1. **Unused Import**
   - `randomUUID` imported but never used in upload route
   - **Impact**: Code clutter, potential confusion

2. **Missing Immediate Persistence**
   - Logo path stored only in local state after upload
   - User must manually click "Save" to persist to database
   - **Impact**: Logo lost if user navigates away before saving
   - **Risk**: Data loss, poor UX

3. **No Upload Progress**
   - Large files (>1MB) have no progress indication
   - **Impact**: Poor UX, users unsure if upload is working

4. **Race Condition Risk**
   - Multiple simultaneous uploads not prevented
   - **Impact**: Could cause inconsistent state

5. **No Client-Side File Type Validation**
   - Only size checked on client, type checked on server
   - **Impact**: Users see error only after upload attempt

#### 🟡 Medium Priority Issues

6. **Signed URL Expiration**
   - Signed URLs expire after 1 hour
   - Stored in state but may be used hours later
   - **Impact**: Broken previews after expiration
   - **Mitigation**: Path-based system already implemented, but legacy URL still stored

7. **Error Message Specificity**
   - Some errors are too generic
   - **Impact**: Users can't diagnose issues easily

8. **No Cleanup on Failure**
   - If upload succeeds but profile save fails, file remains in storage
   - **Impact**: Orphaned files, storage bloat

9. **Bucket Creation on Every Request**
   - `ensureBucketExists()` called on every upload
   - **Impact**: Unnecessary API calls (minor performance hit)

#### 🟢 Low Priority / Improvements

10. **No File Type Validation on Client**
    - Should validate MIME type before upload
    - **Impact**: Better UX, faster feedback

11. **No Image Dimensions Validation**
    - Could validate min/max dimensions
    - **Impact**: Prevent extremely large/small images

12. **No Duplicate Upload Prevention**
    - Same file could be uploaded multiple times
    - **Impact**: Wasted storage (minor)

---

## AI Preview Flow

### Current Architecture

1. **Client-side** (`new/page.tsx`):
   - User fills form with project details
   - Calls `/api/ai-preview` with form data
   - Receives SSE stream with HTML chunks
   - Updates preview in real-time

2. **Server-side** (`api/ai-preview/route.ts`):
   - Validates request schema
   - Rate limiting (30 requests/5 minutes)
   - Constructs prompt from form data
   - Streams from OpenAI API (o4-mini → gpt-4o-mini fallback)
   - Sanitizes HTML output
   - Detects preview issues
   - Returns SSE stream

### Issues Identified

#### 🔴 Critical Issues

1. **Unbounded Memory Accumulation**
   - `accumulated` string grows without limit during streaming
   - **Impact**: Memory leak for very long responses
   - **Risk**: Server crashes on large outputs

2. **Stream Cleanup Race Conditions**
   - Multiple cleanup paths could conflict
   - `closeStreamRef` might be called multiple times
   - **Impact**: Potential memory leaks, errors

3. **No Request Cancellation**
   - Client can't cancel long-running requests
   - **Impact**: Wasted resources, poor UX

4. **Error Recovery Limited**
   - Only 2 retry attempts for abort errors
   - No retry for network errors
   - **Impact**: Transient failures cause permanent errors

#### 🟡 Medium Priority Issues

5. **Timeout Handling**
   - Timeout might not properly clean up all resources
   - Stream might not be fully aborted
   - **Impact**: Resource leaks

6. **No Request Deduplication**
   - Multiple identical requests could be made simultaneously
   - **Impact**: Wasted API credits, slower responses

7. **Model Fallback Logic**
   - Fallback only on abort errors, not on API errors
   - **Impact**: Could fail when fallback would work

8. **No Streaming Backpressure**
   - Stream pushes data as fast as possible
   - **Impact**: Could overwhelm client on slow connections

#### 🟢 Low Priority / Improvements

9. **Prompt Length Not Validated**
   - Very long prompts could exceed token limits
   - **Impact**: API errors, wasted credits

10. **No Response Caching**
    - Identical requests generate new responses
    - **Impact**: Wasted API credits

11. **No Analytics**
    - No tracking of success/failure rates
    - **Impact**: Can't optimize or debug issues

---

## Recommendations

### Logo Upload Flow

#### Immediate Fixes (Critical)

1. ✅ **Remove unused import**
   ```typescript
   // Remove: import { randomUUID } from 'node:crypto';
   ```

2. ✅ **Auto-save logo path after upload**
   - Automatically persist `brand_logo_path` to database after successful upload
   - Show success toast only after database save completes
   - **Implementation**: Call `saveProfile('branding')` automatically after upload

3. ✅ **Add upload progress**
   - Use `XMLHttpRequest` or `fetch` with progress tracking
   - Show progress bar during upload
   - **Implementation**: Replace `fetchWithSupabaseAuth` with progress-aware version

4. ✅ **Prevent concurrent uploads**
   - Disable upload button while upload in progress
   - Cancel previous upload if new one starts
   - **Implementation**: Use `AbortController` for cancellation

5. ✅ **Add client-side file type validation**
   - Validate MIME type before upload
   - Show immediate error for invalid types
   - **Implementation**: Check `file.type` against allowed types

#### Medium Priority

6. **Improve error messages**
   - Map specific error codes to user-friendly messages
   - Include actionable guidance

7. **Add cleanup on failure**
   - Delete uploaded file if profile save fails
   - **Implementation**: Add cleanup endpoint or handle in transaction

8. **Cache bucket existence check**
   - Check bucket once per server instance
   - **Implementation**: Use in-memory cache with TTL

### AI Preview Flow

#### Immediate Fixes (Critical)

1. ✅ **Fix memory accumulation**
   - Limit accumulated string size
   - Or use streaming buffer with size limits
   - **Implementation**: Add max length check, truncate if needed

2. ✅ **Improve stream cleanup**
   - Ensure single cleanup path
   - Use proper resource management
   - **Implementation**: Refactor cleanup logic, use try/finally

3. ✅ **Add request cancellation**
   - Support `AbortController` in client
   - Cancel stream on abort
   - **Implementation**: Pass signal through to OpenAI stream

4. ✅ **Improve error recovery**
   - Retry on network errors
   - Better fallback logic
   - **Implementation**: Add retry wrapper with exponential backoff

#### Medium Priority

5. **Add request deduplication**
   - Cache identical requests for short period
   - **Implementation**: Use request hash as cache key

6. **Improve model fallback**
   - Fallback on API errors, not just aborts
   - **Implementation**: Expand fallback conditions

7. **Add streaming backpressure**
   - Pause stream if client buffer full
   - **Implementation**: Use ReadableStream backpressure API

---

## Implementation Priority

### Phase 1 (Critical - Do Now)
1. Remove unused import ✅
2. Auto-save logo after upload ✅
3. Fix memory accumulation in AI preview ✅
4. Improve stream cleanup ✅

### Phase 2 (High Priority - Next Sprint)
5. Add upload progress
6. Prevent concurrent uploads
7. Add client-side file validation
8. Add request cancellation

### Phase 3 (Medium Priority - Future)
9. Improve error messages
10. Add cleanup on failure
11. Cache bucket checks
12. Add request deduplication

---

## Testing Recommendations

### Logo Upload
- [ ] Test with various file types (valid/invalid)
- [ ] Test with files at size limits (4MB, 4MB+1)
- [ ] Test concurrent uploads
- [ ] Test network interruption during upload
- [ ] Test with expired signed URLs
- [ ] Test profile save failure after upload

### AI Preview
- [ ] Test with very long prompts
- [ ] Test stream cancellation
- [ ] Test network interruption
- [ ] Test timeout scenarios
- [ ] Test model fallback
- [ ] Test memory usage with large responses

---

## Metrics to Track

### Logo Upload
- Upload success rate
- Average upload time
- Error rate by error type
- Storage usage per user

### AI Preview
- Request success rate
- Average response time
- Token usage per request
- Error rate by error type
- Stream completion rate








