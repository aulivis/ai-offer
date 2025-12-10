# RLS Policy Audit Report

## Overview

This document audits the usage of Supabase clients to ensure proper Row Level Security (RLS) enforcement and appropriate use of service role client.

## Client Types

### 1. Authenticated Client (`supabaseServer()`)

- **Purpose:** User-scoped operations that respect RLS policies
- **Security:** Enforces RLS policies automatically
- **Usage:** Should be used for all user data operations

### 2. Service Role Client (`supabaseServiceRole()`)

- **Purpose:** Administrative operations that bypass RLS
- **Security:** Bypasses all RLS policies - use with extreme caution
- **Usage:** Only for:
  - System-level operations (cron jobs, admin tasks)
  - Operations that need to access data across users
  - Initial setup/configuration

## Audit Results

### ✅ Proper Service Role Usage

#### Admin Operations

- `web/src/app/api/admin/*` - All admin routes use service role (appropriate)
- `web/src/app/api/cron/*` - Cron jobs use service role (appropriate)
- `web/src/app/api/health/route.ts` - Health check uses service role (appropriate)

#### Authentication Operations

- `web/src/app/api/auth/magic-link/route.ts` - Uses service role for rate limiting (appropriate)
- `web/src/app/api/auth/callback/route.ts` - Uses service role for session creation (appropriate)
- `web/src/app/api/auth/confirm/route.ts` - Uses service role for session creation (appropriate)
- `web/src/app/api/auth/refresh/route.ts` - Uses service role for token refresh (appropriate)
- `web/src/app/api/auth/logout/route.ts` - Uses service role for session revocation (appropriate)

#### Storage Operations

- `web/src/app/api/storage/upload-brand-logo/route.ts` - Uses service role for bucket management only (appropriate)
- `web/src/app/api/storage/ensure-brand-bucket/route.ts` - Uses service role for bucket setup (appropriate)

#### Newsletter Operations

- `web/src/app/api/newsletter/*` - Uses service role for newsletter management (appropriate)

### ⚠️ Service Role Usage Requiring Review

#### AI Generate Route

**Location:** `web/src/app/api/ai-generate/route.ts`

**Usage:**

1. Line 832: Usage counter sync - **REVIEW NEEDED**
   - Currently uses service role for `syncUsageCounter`
   - Should verify if authenticated client can perform this operation
   - **Recommendation:** Check if RLS allows user to update their own usage counter

2. Line 1411: Offer verification fallback - **ACCEPTABLE**
   - Used as fallback when authenticated client fails
   - Only for diagnostic purposes
   - Logs warning about RLS issue
   - **Status:** Acceptable for diagnostics

3. Line 1498: Share link creation fallback - **ACCEPTABLE**
   - Used as fallback when authenticated client fails
   - Only for share link creation (non-critical)
   - Logs warning about RLS issue
   - **Status:** Acceptable for fallback

4. Line 1590: Share link creation fallback - **ACCEPTABLE**
   - Same as above, different code path
   - **Status:** Acceptable for fallback

**Recommendation:**

- Review usage counter sync - verify if authenticated client can perform this
- Keep fallback uses but ensure they're logged and monitored

#### Teams Route

**Location:** `web/src/app/api/teams/[teamId]/invitations/route.ts`

**Usage:**

- Line 121: Uses service role for team invitation operations
- **Review:** Verify if this is necessary or if authenticated client with proper RLS can handle this

### ✅ Proper Authenticated Client Usage

All other routes use `supabaseServer()` which is the authenticated client:

- User data queries
- Offer operations
- Client management
- Dashboard data

## Recommendations

### High Priority

1. **Review Usage Counter Sync**
   - Verify if `syncUsageCounter` can use authenticated client
   - If RLS allows users to update their own counters, switch to authenticated client
   - If not, ensure service role usage is logged and monitored

2. **Review Team Invitations**
   - Verify if team invitation operations can use authenticated client
   - Check RLS policies for team_members table

### Medium Priority

3. **Add Monitoring**
   - Log all service role client usage
   - Alert on unexpected service role usage patterns
   - Track service role usage metrics

4. **Document Service Role Usage**
   - Add comments explaining why service role is needed
   - Document RLS policy limitations if any

### Low Priority

5. **Code Review Process**
   - Add checklist item for service role usage review
   - Require justification for service role usage in PRs

## RLS Policy Verification

### Tables with RLS Enabled

- ✅ `offers` - User-scoped by `user_id`
- ✅ `clients` - User-scoped by `user_id`
- ✅ `profiles` - User-scoped by `id`
- ✅ `usage_counters` - User-scoped by `user_id`
- ✅ `offer_shares` - User-scoped by `user_id`
- ✅ `pdf_jobs` - User-scoped by `user_id`
- ✅ `team_members` - Team-scoped with proper policies
- ✅ `team_invitations` - Team-scoped with proper policies

### Verification Steps

1. **Test with Authenticated Client:**

   ```typescript
   const sb = await supabaseServer();
   // Should only return user's own data
   const { data } = await sb.from('offers').select('*');
   ```

2. **Verify RLS Policies:**
   - Check migration files for RLS policy definitions
   - Test that users cannot access other users' data
   - Verify team members can only access their team's data

3. **Monitor Service Role Usage:**
   - Log all service role operations
   - Alert on unexpected patterns
   - Review service role usage regularly

## Conclusion

**Overall Assessment:** ✅ **Good**

Most service role usage is appropriate for system-level operations. A few areas need review to ensure they're necessary, but the codebase generally follows security best practices.

**Action Items:**

1. Review usage counter sync operation
2. Review team invitation operations
3. Add monitoring for service role usage
4. Document service role usage rationale

---

**Last Updated:** 2025-01-16
**Next Review:** After RLS policy changes or new service role usage

