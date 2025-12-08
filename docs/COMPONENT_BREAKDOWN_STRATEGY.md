# Component Breakdown Strategy

**Date:** January 2025  
**Purpose:** Document strategy for breaking down large React components identified in codebase review

---

## Overview

Large components reduce maintainability, testability, and reusability. This document outlines the strategy for refactoring the identified large components.

## Identified Large Components

### 1. Dashboard Page (`web/src/app/dashboard/page.tsx`)

- **Size:** ~2355 lines
- **Issues:**
  - Multiple concerns mixed (offers listing, quota management, realtime subscriptions)
  - Complex state management
  - Difficult to test individual features
- **Priority:** High

### 2. New Offer Wizard (`web/src/app/(dashboard)/dashboard/offers/new/page.tsx`)

- **Size:** Large (exact line count to be verified)
- **Issues:**
  - Multi-step wizard logic
  - Template management
  - Form state management
- **Priority:** High

---

## Refactoring Strategy

### Phase 1: Extract Custom Hooks

#### Dashboard Page

1. **Extract Quota Management Hook**
   - Create `useDashboardQuota.ts`
   - Move quota loading, realtime subscriptions
   - Extract quota refresh logic

2. **Extract Offers Management Hook**
   - Create `useDashboardOffers.ts`
   - Move offers fetching, pagination, filtering
   - Extract realtime offer subscriptions

3. **Extract Filter Logic Hook**
   - Create `useOfferFilters.ts`
   - Move filter state and logic
   - Extract filter persistence

4. **Extract Realtime Subscriptions**
   - Create `useDashboardRealtime.ts`
   - Consolidate all realtime subscriptions
   - Manage subscription cleanup

#### New Offer Wizard

1. **Extract Wizard State Hook**
   - Create `useOfferWizard.ts`
   - Manage wizard step navigation
   - Handle form state across steps

2. **Extract Template Management Hook**
   - Create `useOfferTemplate.ts`
   - Handle template selection
   - Template preview logic

3. **Extract Form Data Hook**
   - Create `useOfferFormData.ts`
   - Manage form fields
   - Handle validation

### Phase 2: Extract Components

#### Dashboard Page Components

1. **DashboardHeader Component**
   - Extract header with filter controls
   - Export button
   - View toggles

2. **OffersList Component**
   - Extract offers rendering logic
   - Empty states
   - Loading states

3. **QuotaBar Component**
   - Extract quota display
   - Usage visualization
   - Upgrade prompts

4. **OffersPagination Component**
   - Extract pagination controls
   - Page size selector

#### Wizard Components

1. **WizardStep Components**
   - Extract each wizard step
   - `WizardStep1Details.tsx`
   - `WizardStep2Pricing.tsx` (already exists)
   - `WizardStep3Preview.tsx`

2. **WizardNavigation Component**
   - Extract step navigation
   - Progress indicator

3. **WizardFormProvider**
   - Extract form context provider
   - Shared form state

### Phase 3: Create Utility Functions

1. **Dashboard Utilities**
   - `dashboardUtils.ts` - Offer formatting, filtering helpers
   - `dashboardQuotaUtils.ts` - Quota calculation helpers

2. **Wizard Utilities**
   - `wizardValidation.ts` - Step validation logic
   - `wizardDataTransform.ts` - Data transformation between steps

---

## Implementation Guidelines

### Component Size Targets

- **Target:** Maximum 300 lines per component
- **Ideal:** 100-200 lines per component
- **Hooks:** Maximum 150 lines per hook

### Naming Conventions

- Components: PascalCase (e.g., `OffersList`)
- Hooks: camelCase starting with `use` (e.g., `useDashboardOffers`)
- Utilities: camelCase (e.g., `dashboardUtils`)

### File Organization

```
web/src/
├── app/
│   └── dashboard/
│       ├── page.tsx (main orchestrator, ~100 lines)
│       ├── components/
│       │   ├── DashboardHeader.tsx
│       │   ├── OffersList.tsx
│       │   ├── QuotaBar.tsx
│       │   └── OffersPagination.tsx
│       ├── hooks/
│       │   ├── useDashboardQuota.ts
│       │   ├── useDashboardOffers.ts
│       │   ├── useOfferFilters.ts
│       │   └── useDashboardRealtime.ts
│       └── utils/
│           ├── dashboardUtils.ts
│           └── dashboardQuotaUtils.ts
```

---

## Testing Strategy

### Component Testing

- Test each extracted component in isolation
- Use React Testing Library
- Mock hooks and dependencies

### Hook Testing

- Test hooks independently using `@testing-library/react-hooks`
- Test state transitions
- Test side effects (realtime subscriptions, API calls)

### Integration Testing

- Test component interactions
- Test full workflows (e.g., filter → load → display)

---

## Migration Plan

### Step-by-Step Approach

1. **Week 1: Hooks Extraction**
   - Extract one hook at a time
   - Update original component to use new hook
   - Test thoroughly before moving to next hook

2. **Week 2: Component Extraction**
   - Extract components one by one
   - Maintain functionality during extraction
   - Add component tests

3. **Week 3: Refinement**
   - Optimize extracted components
   - Remove duplicated code
   - Improve type safety

4. **Week 4: Testing & Documentation**
   - Comprehensive testing
   - Update documentation
   - Code review

---

## Success Criteria

✅ Component size reduced to <300 lines  
✅ Each extracted component has unit tests  
✅ No functionality regressions  
✅ Improved code reusability  
✅ Better maintainability  
✅ Type safety maintained

---

## Notes

- Extract incrementally to avoid breaking changes
- Maintain backward compatibility during migration
- Use feature flags if needed for gradual rollout
- Document breaking changes clearly

---

**Status:** Planning Complete - Ready for Implementation
