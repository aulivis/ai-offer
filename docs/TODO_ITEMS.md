# TODO Items

This document tracks TODO comments in the codebase that require infrastructure setup or future implementation.

## Completed ✅

### Admin Role Checks

- **Status**: ✅ Completed
- **Files**:
  - `web/src/app/api/admin/pdf-jobs/metrics/route.ts`
  - `web/src/app/api/admin/pdf-jobs/reset-stuck/route.ts`
  - `web/src/app/api/admin/pdf-jobs/process-retries/route.ts`
- **Implementation**: Created `web/src/lib/admin.ts` utility with `requireAdmin()` function
- **Details**: Admin checks now verify user metadata for admin privileges before allowing access to admin endpoints

### Vercel Cron Secret Verification

- **Status**: ✅ Completed
- **File**: `web/src/app/api/admin/pdf-jobs/process-retries/route.ts`
- **Implementation**: Added `VERCEL_CRON_SECRET` to env schema and implemented verification
- **Details**: Cron requests are now verified using the `VERCEL_CRON_SECRET` environment variable

## Pending - Infrastructure Required 🚧

### Email Service Implementation

- **Status**: 🚧 Pending - Requires email service infrastructure
- **File**: `web/src/lib/email/teamInvitation.ts`
- **TODOs**:
  - Implement email sending when email service is configured
  - Check if email service is configured
- **Options**:
  - Supabase Edge Function for email sending
  - External email service (Resend, SendGrid, etc.)
  - Supabase Auth email customization (if applicable)
- **Current State**: Team invitations are created in the database but emails are not sent. Users can accept invitations through the application UI.
- **Next Steps**:
  1. Choose email service provider
  2. Configure API keys in environment variables
  3. Implement email template system
  4. Update `sendTeamInvitationEmail()` function
  5. Update `isEmailServiceConfigured()` function

### Annual Billing Switch

- **Status**: ✅ Completed
- **File**: `web/src/app/billing/page.tsx`
- **Implementation**:
  - Created `/api/stripe/update-subscription` endpoint to handle subscription updates
  - Updated billing page button to call the API and switch existing subscriptions
  - Uses Stripe's subscription update API with proration
  - Supports switching between monthly and annual billing intervals
- **Details**: Existing Pro users can now switch from monthly to annual billing directly from the billing page

### PDF Compression Enhancement

- **Status**: ✅ Completed
- **File**: `web/src/lib/pdf/compression.ts`
- **Implementation**:
  - Integrated pdf-lib for advanced PDF compression
  - Compression is applied automatically when `compressPdfBuffer()` is called
  - Falls back gracefully if pdf-lib is not available
  - Only returns compressed version if it's actually smaller than original
- **Note**: Requires `pdf-lib` package to be installed. If not installed, compression will gracefully fall back to original PDF.
- **Next Steps** (if needed):
  1. Install pdf-lib: `pnpm add pdf-lib`
  2. Monitor compression ratios in production
  3. Adjust quality settings based on results

## Notes

- All security-related TODOs (admin checks, cron verification) have been completed
- Remaining TODOs are feature enhancements or infrastructure setup that don't block current functionality
- Email service is the highest priority infrastructure item as it affects user experience for team invitations
