# Onboarding System Implementation Guide

This guide shows how to integrate the onboarding system into your application.

## Quick Start

### 1. Database Migration

Run the migration to create onboarding tables:

```bash
# The migration is already created at:
# web/supabase/migrations/20250201000000_create_onboarding_tables.sql
```

### 2. Provider Setup

The `OnboardingProvider` is already added to `AppProviders.tsx`. No additional setup needed.

### 3. Basic Usage

```tsx
import { useOnboarding } from '@/components/onboarding/OnboardingProvider';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';

function MyComponent() {
  const { completeStep, hasCompletedStep } = useOnboarding();

  return (
    <>
      <OnboardingTour
        tourId="my-tour"
        steps={[
          {
            id: 'step-1',
            target: '#my-element',
            title: 'Welcome!',
            content: <p>This is a tour step</p>,
            position: 'bottom',
          },
        ]}
        onComplete={() => completeStep('my-tour')}
      />
    </>
  );
}
```

## Integration Examples

### Dashboard Integration

Add to `web/src/app/dashboard/page.tsx`:

```tsx
import { DashboardOnboarding } from '@/components/onboarding/examples/DashboardOnboarding';

export default function DashboardPage() {
  return (
    <>
      <DashboardOnboarding />
      {/* ... rest of dashboard */}
    </>
  );
}
```

Add data attributes to key elements:

```tsx
<Button data-onboarding="create-offer-button">
  Create Offer
</Button>

<div data-onboarding="offers-list">
  {/* Offers list */}
</div>

<div data-onboarding="metrics">
  {/* Metrics */}
</div>
```

### Offer Wizard Integration

Add to `web/src/app/(dashboard)/dashboard/offers/new/page.tsx`:

```tsx
import { OfferWizardOnboarding } from '@/components/onboarding/examples/OfferWizardOnboarding';

export default function NewOfferPage() {
  return (
    <>
      <OfferWizardOnboarding />
      {/* ... rest of wizard */}
    </>
  );
}
```

Add data attributes:

```tsx
<Input
  data-onboarding="wizard-title-input"
  // ... other props
/>

<Textarea
  data-onboarding="wizard-description-input"
  // ... other props
/>

<div data-onboarding="wizard-pricing-section">
  {/* Pricing section */}
</div>

<div data-onboarding="wizard-preview-panel">
  {/* Preview panel */}
</div>
```

### Settings Integration

Add to `web/src/app/settings/page.tsx`:

```tsx
import { SettingsOnboarding } from '@/components/onboarding/examples/SettingsOnboarding';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('company');
  const { plan } = useSubscription();

  return (
    <>
      <SettingsOnboarding plan={plan} activeSection={activeSection} />
      {/* ... rest of settings */}
    </>
  );
}
```

Add data attributes:

```tsx
<section data-onboarding="settings-company-section">
  {/* Company section */}
</section>

<section data-onboarding="settings-branding-section">
  {/* Branding section */}
</section>

<section data-onboarding="settings-templates-section">
  {/* Templates section */}
</section>
```

## Component Reference

### OnboardingProvider

Context provider that manages onboarding state.

**Hook:**

```tsx
const {
  state: { completedSteps, dismissedElements, profile },
  completeStep,
  dismissElement,
  shouldShowElement,
  hasCompletedStep,
  updateProfile,
  refresh,
} = useOnboarding();
```

### OnboardingTour

Multi-step guided tour with spotlight overlay.

**Props:**

- `tourId: string` - Unique identifier
- `steps: TourStep[]` - Array of tour steps
- `onComplete?: () => void` - Called when tour completes
- `onSkip?: () => void` - Called when tour is skipped
- `open?: boolean` - Controlled open state
- `onOpenChange?: (open: boolean) => void` - Open state change handler

**TourStep:**

```tsx
type TourStep = {
  id: string;
  target?: string; // CSS selector
  title: string;
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    onClick: () => void;
  };
  skipable?: boolean;
};
```

### OnboardingTooltip

Contextual help tooltip.

**Props:**

- `tooltipId: string` - Unique identifier
- `target: string | RefObject<HTMLElement>` - Target element
- `title: string` - Tooltip title
- `content: ReactNode` - Tooltip content
- `position?: 'top' | 'bottom' | 'left' | 'right'`
- `trigger?: 'hover' | 'click' | 'focus' | 'manual'`
- `showOnce?: boolean` - Dismiss permanently after first show
- `delay?: number` - Show delay in ms
- `open?: boolean` - Controlled open state
- `onOpenChange?: (open: boolean) => void`

### OnboardingChecklist

Progress checklist component.

**Props:**

- `title: string` - Checklist title
- `items: ChecklistItem[]` - Checklist items
- `onItemClick?: (itemId: string) => void` - Item click handler

**ChecklistItem:**

```tsx
type ChecklistItem = {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  action?: {
    label: string;
    href: string;
  };
};
```

### OnboardingUpsell

Contextual upgrade prompt.

**Props:**

- `trigger?: string` - Element selector that triggers display
- `title: string` - Upsell title
- `description: string` - Upsell description
- `features?: string[]` - List of features
- `ctaLabel?: string` - CTA button label
- `ctaHref?: string` - CTA link
- `variant?: 'banner' | 'modal' | 'inline'`
- `dismissible?: boolean`
- `onDismiss?: () => void`

## Step IDs Reference

Use consistent step IDs throughout the app:

### Dashboard

- `dashboard-tour` - Dashboard tour completed
- `dashboard-checklist-viewed` - Checklist viewed
- `first-offer-created` - First offer created

### Offer Wizard

- `offer-wizard-tour` - Wizard tour completed
- `offer-wizard-step-1` - Step 1 completed
- `offer-wizard-step-2` - Step 2 completed

### Settings

- `settings-company-configured` - Company info configured
- `settings-branding-configured` - Branding configured

### Sharing

- `first-offer-shared` - First offer shared

## Best Practices

1. **Use data attributes** for target elements:

   ```tsx
   <Button data-onboarding="create-offer-button">
   ```

2. **Complete steps** when users perform actions:

   ```tsx
   useEffect(() => {
     if (offerCreated) {
       completeStep('first-offer-created');
     }
   }, [offerCreated]);
   ```

3. **Check completion** before showing tours:

   ```tsx
   const shouldShow = shouldShowElement('tour-id') && !hasCompletedStep('tour-id');
   ```

4. **Dismiss permanently** for one-time tooltips:

   ```tsx
   <OnboardingTooltip showOnce />
   ```

5. **Contextual upsells** for free users:
   ```tsx
   {
     plan === 'free' && (
       <OnboardingUpsell
         trigger="#premium-feature"
         title="Unlock Premium"
         description="Upgrade to access this feature"
       />
     );
   }
   ```

## Testing

Test onboarding flows:

1. **First-time user** - Should see all tours and tooltips
2. **Returning user** - Should not see dismissed elements
3. **Step completion** - Steps should be marked complete
4. **Cross-device** - Progress should sync via database

## Troubleshooting

**Tours not showing:**

- Check `shouldShowElement()` returns true
- Verify target elements exist with correct selectors
- Check console for errors

**Tooltips not positioning:**

- Ensure target element is in DOM
- Check viewport boundaries
- Verify position prop is correct

**Progress not saving:**

- Check user authentication
- Verify database migration ran
- Check RLS policies
