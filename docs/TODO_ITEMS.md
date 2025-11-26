# TODO Items Documentation

**Date:** January 2025  
**Purpose:** Track incomplete features and technical debt items

---

## Incomplete Features

### 1. Email Invitation System ✅ **IMPLEMENTED**

**Location:** `web/src/app/api/teams/[teamId]/invitations/route.ts` & `web/src/lib/email/teamInvitation.ts`

**Current Status:**

- ✅ Team invitation creation is implemented
- ✅ Database storage works correctly
- ✅ Email utility infrastructure created (`web/src/lib/email/teamInvitation.ts`)
- ✅ Team name and inviter details fetching implemented
- ✅ Personalized email data preparation complete
- ⏸️ Email service configuration pending (requires external email service setup)

**Implementation Details:**

- Email utility function `sendTeamInvitationEmail()` is ready
- Fetches team name and inviter details for personalization
- Non-blocking email sending (invitation created even if email fails)
- Proper error handling in place

**Next Steps:**

- Configure email service (Resend, SendGrid, etc.)
- Implement actual email sending in `sendTeamInvitationEmail()`
- Add email templates

**Priority:** Medium (Infrastructure ready, awaiting email service configuration)

---

### 2. Annual Billing Toggle ✅ **IMPLEMENTED**

**Location:** `web/src/app/billing/page.tsx` & `web/src/lib/billing.ts`

**Current Status:**

- ✅ Monthly billing fully implemented
- ✅ Annual billing infrastructure implemented
- ✅ Billing interval toggle UI added
- ✅ Annual pricing calculations (17% discount = ~2 months free)
- ✅ Environment variables for annual price IDs added
- ✅ PlanCard component updated to support billing intervals
- ✅ Checkout logic updated to use correct price IDs
- ⏸️ Stripe annual price IDs configuration pending

**Implementation Details:**

- Billing utilities created (`web/src/lib/billing.ts`)
  - `calculateAnnualPrice()` - Calculates annual price with discount
  - `calculateEffectiveMonthlyPrice()` - Shows effective monthly rate
  - `calculateAnnualSavings()` - Shows savings breakdown
- UI toggle between monthly/annual billing
- Annual pricing displayed with savings information
- Automatic price ID selection based on interval

**Next Steps:**

- Configure Stripe annual price IDs in environment variables:
  - `NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL`
  - `NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL`
- Create annual price products in Stripe dashboard

**Priority:** Low (Code ready, awaiting Stripe configuration)

---

## Notes

These TODO items represent planned features that were not critical for initial launch. They should be:

1. Tracked in project management system
2. Prioritized based on user feedback
3. Implemented when resources are available

Both items are properly logged/informed to users and don't block core functionality.
