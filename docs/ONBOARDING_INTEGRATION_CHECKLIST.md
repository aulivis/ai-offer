# Onboarding Integration Checklist

This checklist shows exactly what needs to be changed in existing files to complete the onboarding integration.

---

## ✅ Completed (No Action Needed)

- [x] Database migration created
- [x] Core components implemented
- [x] Provider added to AppProviders
- [x] API routes created
- [x] Example components created

---

## 📋 Required Changes

### 1. Dashboard Page Integration

**File:** `web/src/app/dashboard/page.tsx`

#### Add Import

```tsx
import { DashboardOnboarding } from '@/components/onboarding/examples/DashboardOnboarding';
```

#### Add Component (at top of return statement)

```tsx
export default function DashboardPage() {
  // ... existing code ...

  return (
    <>
      <DashboardOnboarding />
      {/* ... rest of existing JSX ... */}
    </>
  );
}
```

#### Add Data Attributes

Find the "Create Offer" button and add:

```tsx
<Button data-onboarding="create-offer-button">{/* ... existing button content ... */}</Button>
```

Find the offers list container and add:

```tsx
<div data-onboarding="offers-list">{/* ... existing offers list ... */}</div>
```

Find the metrics section and add:

```tsx
<div data-onboarding="metrics">{/* ... existing metrics ... */}</div>
```

#### Add Step Completion Tracking

When an offer is successfully created, add:

```tsx
import { useOnboarding } from '@/components/onboarding/OnboardingProvider';

// In component:
const { completeStep } = useOnboarding();

// After successful offer creation:
await completeStep('first-offer-created');
```

---

### 2. Offer Wizard Integration

**File:** `web/src/app/(dashboard)/dashboard/offers/new/page.tsx`

#### Add Import

```tsx
import { OfferWizardOnboarding } from '@/components/onboarding/examples/OfferWizardOnboarding';
```

#### Add Component

```tsx
export default function NewOfferPage() {
  // ... existing code ...

  return (
    <>
      <OfferWizardOnboarding />
      {/* ... rest of existing JSX ... */}
    </>
  );
}
```

#### Add Data Attributes

Find the title input and add:

```tsx
<Input
  data-onboarding="wizard-title-input"
  // ... existing props ...
/>
```

Find the description textarea and add:

```tsx
<Textarea
  data-onboarding="wizard-description-input"
  // ... existing props ...
/>
```

Find the pricing section and add:

```tsx
<div data-onboarding="wizard-pricing-section">{/* ... existing pricing section ... */}</div>
```

Find the preview panel and add:

```tsx
<div data-onboarding="wizard-preview-panel">{/* ... existing preview panel ... */}</div>
```

---

### 3. Settings Page Integration

**File:** `web/src/app/settings/page.tsx`

#### Add Import

```tsx
import { SettingsOnboarding } from '@/components/onboarding/examples/SettingsOnboarding';
```

#### Add Component

```tsx
export default function SettingsPage() {
  // ... existing code ...
  const [activeSection, setActiveSection] = useState('company');

  return (
    <>
      <SettingsOnboarding plan={plan} activeSection={activeSection} />
      {/* ... rest of existing JSX ... */}
    </>
  );
}
```

#### Add Data Attributes

Find the company section and add:

```tsx
<section data-onboarding="settings-company-section" id="company">
  {/* ... existing company section ... */}
</section>
```

Find the branding section and add:

```tsx
<section data-onboarding="settings-branding-section" id="branding">
  {/* ... existing branding section ... */}
</section>
```

Find the templates section and add:

```tsx
<section data-onboarding="settings-templates-section" id="templates">
  {/* ... existing templates section ... */}
</section>
```

#### Add Step Completion Tracking

After successfully saving company info:

```tsx
import { useOnboarding } from '@/components/onboarding/OnboardingProvider';

const { completeStep } = useOnboarding();

const handleCompanySave = async () => {
  // ... existing save logic ...
  await completeStep('settings-company-configured');
};
```

After successfully saving branding:

```tsx
const handleBrandingSave = async () => {
  // ... existing save logic ...
  await completeStep('settings-branding-configured');
};
```

---

### 4. Offer Sharing Integration

**File:** `web/src/components/dashboard/ShareModal.tsx` (or wherever sharing happens)

#### Add Step Completion

After successfully sharing an offer:

```tsx
import { useOnboarding } from '@/components/onboarding/OnboardingProvider';

const { completeStep } = useOnboarding();

const handleShare = async () => {
  // ... existing share logic ...
  await completeStep('first-offer-shared');
};
```

---

### 5. Database Migration

**Action:** Run the migration

```bash
# Using Supabase CLI
npx supabase migration up

# Or using your migration tool
# Apply: web/supabase/migrations/20250201000000_create_onboarding_tables.sql
```

---

## 🧪 Testing Checklist

After making changes, test:

- [ ] **First-time user:**
  - [ ] Dashboard tour appears on first visit
  - [ ] Can navigate through tour steps
  - [ ] Can skip tour
  - [ ] Tour doesn't reappear after dismissal

- [ ] **Offer creation:**
  - [ ] Wizard tour appears for first-time users
  - [ ] Tooltips appear on focus/hover
  - [ ] Steps complete as user progresses
  - [ ] Checklist updates when offer is created

- [ ] **Settings:**
  - [ ] Tooltips appear in each section
  - [ ] Upsells show for free users
  - [ ] Steps complete when settings saved

- [ ] **Persistence:**
  - [ ] Progress saves to database
  - [ ] Dismissed elements don't reappear
  - [ ] Progress syncs across devices

- [ ] **Free user upsells:**
  - [ ] Upsell appears when trying premium template
  - [ ] Upsell appears when quota reached
  - [ ] Upsell appears in branding section
  - [ ] Can dismiss upsells

- [ ] **Accessibility:**
  - [ ] Keyboard navigation works
  - [ ] Screen reader announces tours
  - [ ] Focus management works
  - [ ] Reduced motion respected

---

## 📝 Notes

1. **Data attributes** are non-intrusive - they don't affect existing functionality
2. **Onboarding components** can be conditionally rendered based on user state
3. **Step completion** is async - use `await` when calling `completeStep()`
4. **Dismissed elements** are stored in database - they won't reappear
5. **Mobile responsive** - all components work on mobile devices

---

## 🚀 Quick Start

1. Run database migration
2. Add imports to pages
3. Add onboarding components to JSX
4. Add data attributes to key elements
5. Add step completion tracking
6. Test flows
7. Deploy!

---

## ❓ Troubleshooting

**Tours not showing:**

- Check `shouldShowElement()` returns true
- Verify user hasn't dismissed the tour
- Check target elements exist with correct selectors

**Tooltips not appearing:**

- Verify trigger mode (hover/click/focus)
- Check target element is in DOM
- Verify `showOnce` isn't preventing display

**Progress not saving:**

- Check user is authenticated
- Verify database migration ran
- Check browser console for errors
- Verify RLS policies allow user access

---

**Status:** Ready for integration  
**Estimated Time:** 2-4 hours for full integration  
**Priority:** High (improves user experience and conversion)
