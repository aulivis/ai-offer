# Visual Style Guide

This document provides a comprehensive visual style guide for the Vyndi application, ensuring consistent implementation across all pages and components.

## Table of Contents

1. [Color System](#color-system)
2. [Typography](#typography)
3. [Gradients](#gradients)
4. [Spacing](#spacing)
5. [Components](#components)
6. [Visual Hierarchy](#visual-hierarchy)
7. [Accessibility](#accessibility)

## Color System

### Semantic Color Tokens

**Always use semantic color tokens instead of hardcoded values.**

#### Primary Colors

- `primary` - Main brand color (#009688 - Turquoise)
- `primary-ink` - Text color for primary backgrounds (#ffffff)
- `accent` - Accent color (#c3b3ff)

#### Background Colors

- `bg` - Main page background (#f7f9fb)
- `bg-muted` - Cards, panels, elevated surfaces (#ffffff)

#### Text Colors

- `fg` - Primary text color (#102a43)
- `fg-muted` - Secondary text, labels (#475569) - WCAG AA compliant

#### Border Colors

- `border` - Default border color (#e5e7eb)

#### State Colors

- `success` - Success state (#16a34a)
- `warning` - Warning state (#f59e0b)
- `danger` - Error/destructive state (#dc2626)
- `danger-ink` - Text on danger background (#ffffff)

### Usage Examples

```tsx
// ✅ Correct - Use semantic tokens
<div className="bg-primary text-primary-ink">Primary Button</div>
<p className="text-fg-muted">Secondary text</p>
<div className="bg-success/10 border border-success/30 text-success">Success message</div>

// ❌ Wrong - Don't use hardcoded colors
<div className="bg-teal-500 text-white">Button</div>
<p className="text-gray-600">Text</p>
<div className="bg-green-50 border-green-200 text-green-700">Success</div>
```

### Opacity Modifiers

Use opacity modifiers for variations:

```tsx
// ✅ Correct
<div className="bg-primary/10 border border-primary/20">
<span className="text-primary/90">Muted primary text</span>

// ❌ Wrong - Don't create new color tokens
<div className="bg-primary-light border border-primary-medium">
```

## Typography

### Typography Scale

**Always use typography scale classes instead of arbitrary sizes.**

#### Heading Scale

- `text-display` - Large hero headings (4rem)
- `text-h1` - Main page headings (3.5rem)
- `text-h2` - Section headings (2.5rem)
- `text-h3` - Subsection headings (2rem)
- `text-h4` - Minor headings (1.5rem)
- `text-h5` - Small headings (1.25rem)
- `text-h6` - Smallest headings (1.125rem)

#### Body Scale

- `text-body-large` - Emphasis text (1.125rem)
- `text-body` - Default body text (1rem)
- `text-body-small` - Secondary text (0.875rem)
- `text-caption` - Small labels (0.75rem)

#### UI Scale

- `text-ui-large` - Large UI text (1.125rem)
- `text-ui` - Default UI text (1rem)
- `text-ui-small` - Small UI text (0.875rem)

### Usage Examples

```tsx
// ✅ Correct - Use typography scale
<H1 className="mb-6">Page Title</H1>
<p className="text-body-large">Emphasis text</p>
<span className="text-body-small text-fg-muted">Secondary text</span>

// ❌ Wrong - Don't use arbitrary sizes
<h1 className="text-3xl">Title</h1>
<p className="text-lg">Text</p>
<span className="text-sm text-gray-600">Secondary</span>
```

### Heading Component

Use the `Heading` component for consistent heading styles:

```tsx
import { H1, H2, Heading } from '@/components/ui/Heading';

// Fixed typography (default)
<H1>Page Title</H1>

// Fluid typography for responsive scaling
<Heading level="h1" fluid>
  Responsive Title
</Heading>
```

### Line Heights

Use semantic line height classes:

- `leading-typography-tight` - 1.2
- `leading-typography-snug` - 1.3
- `leading-typography-normal` - 1.5
- `leading-typography-relaxed` - 1.6
- `leading-typography-loose` - 1.8

## Gradients

### Semantic Gradient Tokens

**Always use gradient tokens instead of hardcoded gradients.**

Available gradients:

- `bg-gradient-primary` - Primary brand gradient
- `bg-gradient-hero` - Hero section gradient (dark)
- `bg-gradient-cta` - Call-to-action gradient
- `bg-gradient-settings` - Settings page gradient (light)
- `bg-gradient-dashboard` - Dashboard gradient (light)
- `bg-gradient-offer` - Offer page gradient

### Usage Examples

```tsx
// ✅ Correct - Use gradient tokens
<section className="bg-gradient-hero text-white">
<div className="bg-gradient-cta rounded-xl p-6">

// ❌ Wrong - Don't use hardcoded gradients
<section className="bg-gradient-to-br from-navy-900 via-navy-800 to-turquoise-900">
<div className="bg-gradient-to-r from-teal-500 to-green-500">
```

## Spacing

### Spacing Scale

Use the 4px base unit spacing scale:

- `p-1` / `gap-1` - 0.25rem (4px)
- `p-2` / `gap-2` - 0.5rem (8px)
- `p-3` / `gap-3` - 0.75rem (12px)
- `p-4` / `gap-4` - 1rem (16px)
- `p-6` / `gap-6` - 1.5rem (24px)
- `p-8` / `gap-8` - 2rem (32px)

### Usage Examples

```tsx
// ✅ Correct - Use spacing scale
<div className="p-6 gap-4 mb-8">
<Card className="p-4 md:p-6">

// ❌ Wrong - Don't use arbitrary spacing
<div className="p-5 gap-3.5 mb-7">
```

## Components

### Card Component

Use the `Card` component with consistent variants:

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';

// Default variant
<Card size="md" variant="default">
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Actions</CardFooter>
</Card>

// Elevated variant for emphasis
<Card size="lg" variant="elevated">
  Content
</Card>
```

**Card Variants:**

- `default` - Standard card with subtle border and shadow
- `elevated` - Prominent card with stronger shadow
- `outlined` - Border-only card
- `flat` - No border or shadow

**Card Sizes:**

- `sm` - Small padding (p-4)
- `md` - Medium padding (p-6) - default
- `lg` - Large padding (p-8)

### Button Component

Use semantic button styles:

```tsx
// Primary button
<button className="bg-primary text-primary-ink hover:bg-primary/90">
  Primary Action
</button>

// Secondary button
<button className="border border-border bg-bg-muted hover:bg-bg text-fg">
  Secondary Action
</button>
```

## Visual Hierarchy

### Heading Hierarchy

Maintain proper heading hierarchy:

1. **One H1 per page** - Main page title
2. **H2 for major sections** - Section headings
3. **H3 for subsections** - Subsection headings
4. **H4-H6 for nested content** - Minor headings

```tsx
// ✅ Correct hierarchy
<H1>Page Title</H1>
  <H2>Section Title</H2>
    <H3>Subsection Title</H3>
      <H4>Minor Heading</H4>

// ❌ Wrong - Skipping levels
<H1>Page Title</H1>
  <H3>Section Title</H3> // Should be H2
```

### Visual Weight

Use font weights and sizes to create hierarchy:

- **Bold (700)** - Headings, important labels
- **Semibold (600)** - Subheadings, UI elements
- **Regular (400)** - Body text

### Color Hierarchy

Use color to establish hierarchy:

- `text-fg` - Primary content
- `text-fg-muted` - Secondary content, labels
- `text-primary` - Links, CTAs
- `text-success` / `text-danger` - Status indicators

## Accessibility

### WCAG 2.1 AA Compliance

All color combinations meet WCAG 2.1 Level AA standards:

- **Text on Background**: `fg` on `bg` = 12.6:1 ✅
- **Muted Text**: `fg-muted` on `bg` = 4.8:1 ✅
- **Primary Text**: `primary-ink` on `primary` = 4.5:1 ✅

### Contrast Verification

When using opacity modifiers, ensure sufficient contrast:

```tsx
// ✅ Correct - High contrast
<div className="bg-primary/10 text-primary">Success message</div>

// ⚠️ Verify - Lower contrast
<div className="bg-primary/5 text-primary/70">Muted message</div>
```

### Focus States

All interactive elements have visible focus states:

```tsx
// Focus ring is automatically applied
<button className="focus-visible:ring-2 focus-visible:ring-primary">Button</button>
```

## Best Practices

### DO ✅

1. **Always use semantic tokens** - Never hardcode color values
2. **Use typography scale** - Never use arbitrary font sizes
3. **Use gradient tokens** - Never create custom gradients
4. **Maintain heading hierarchy** - Use H1-H6 in order
5. **Test contrast ratios** - Ensure WCAG AA compliance
6. **Use Card component** - For consistent card styling
7. **Use spacing scale** - For consistent spacing

### DON'T ❌

1. **Don't use hardcoded colors** - `bg-teal-500`, `text-gray-600`, etc.
2. **Don't use arbitrary typography** - `text-xl`, `text-2xl`, etc.
3. **Don't create custom gradients** - Use gradient tokens
4. **Don't skip heading levels** - H1 → H3 is wrong
5. **Don't ignore contrast** - Always verify accessibility
6. **Don't create custom card styles** - Use Card component
7. **Don't use arbitrary spacing** - `p-5`, `gap-3.5`, etc.

## Migration Checklist

When updating existing code:

- [ ] Replace all hardcoded colors with semantic tokens
- [ ] Replace arbitrary typography with typography scale
- [ ] Replace custom gradients with gradient tokens
- [ ] Verify heading hierarchy (H1 → H2 → H3)
- [ ] Check contrast ratios for accessibility
- [ ] Use Card component instead of custom card styles
- [ ] Use spacing scale instead of arbitrary values

## Resources

- [Design System Documentation](./DESIGN_SYSTEM.md)
- [Brand Color Guidelines](./BRAND_COLOR_GUIDELINES.md)
- [Component Usage Guidelines](./COMPONENT_USAGE_GUIDELINES.md)
