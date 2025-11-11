# Multi-User Account Sharing - Quick Summary

## TL;DR

**Question**: Can multiple users (different email/Google accounts) share one account to see the same offers?

**Answer**: Yes, but there are three approaches with different trade-offs.

## Three Options

### 🟢 Option A: Identity Linking (Quick & Simple)

- **Time**: 1-2 days
- **Changes**: Minimal code changes, no DB changes
- **How**: Extend existing Google link feature to allow multiple users to link identities to one account
- **Best for**: Quick MVP, small teams (2-3 users)
- **Limitation**: All users share same authentication, no permissions

### 🟡 Option B: Team/Organization Model (Recommended)

- **Time**: 1-2 weeks
- **Changes**: New tables (teams, team_members), modify offers table, new APIs
- **How**: Create teams where multiple users can be members, offers belong to teams
- **Best for**: Long-term solution, proper teams, scalable
- **Benefits**: Proper user separation, permissions, audit trail

### 🟠 Option C: Account Sharing

- **Time**: 1 week
- **Changes**: New sharing tables, modify RLS policies
- **How**: Users explicitly share their account or specific offers with others
- **Best for**: Flexible sharing, per-offer permissions

## Current State

✅ **Already Implemented**:

- Supabase Auth supports multiple identities per user
- Google identity linking exists (`/api/auth/google/link`)
- Users can link Google account to email account

❌ **Not Implemented**:

- Multiple different users sharing one account
- Team/organization structure
- Account sharing between users

## Recommendation

**For Production**: **Option B (Team Model)**

- Proper architecture
- Scalable
- Industry standard approach
- Foundation for future features

**For Quick MVP**: **Option A (Identity Linking)**

- Fastest to implement
- Leverages existing code
- Can migrate to Option B later

## Implementation Complexity

| Option | DB Changes | Code Changes | Time Estimate |
| ------ | ---------- | ------------ | ------------- |
| A      | None       | Low          | 1-2 days      |
| B      | High       | High         | 1-2 weeks     |
| C      | Medium     | Medium       | 1 week        |

## Key Questions to Answer

1. **Use Case**: How many users per account? (2-3 vs 10+)
2. **Timeline**: Need it quickly or can invest in proper solution?
3. **Billing**: Shared subscription or per-user?
4. **Permissions**: Need different access levels?

## Next Steps

1. Review full investigation: `MULTI_USER_ACCOUNT_SHARING.md`
2. Decide on approach (A, B, or C)
3. Review database schema design
4. Create implementation plan
5. Build prototype

## Files Created

- `web/docs/future/MULTI_USER_ACCOUNT_SHARING.md` - Full investigation document
- `web/docs/future/MULTI_USER_ACCOUNT_SHARING_SUMMARY.md` - This summary
