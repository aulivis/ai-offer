# Component Usage Guidelines

This document provides guidelines for using design system components consistently across the application.

## Table of Contents

1. [Button Component](#button-component)
2. [Input Component](#input-component)
3. [Card Component](#card-component)
4. [Heading Component](#heading-component)
5. [Color Tokens](#color-tokens)
6. [Border Radius](#border-radius)
7. [Shadows](#shadows)
8. [Gradients](#gradients)
9. [Loading States](#loading-states)
10. [Best Practices](#best-practices)

## Button Component

### Usage

Always use the `Button` component instead of custom button styles:

```tsx
import { Button } from '@/components/ui/Button';

// Primary button
<Button variant="primary" size="lg">
  Submit
</Button>

// Secondary button
<Button variant="secondary" size="md">
  Cancel
</Button>

// Ghost button
<Button variant="ghost" size="sm">
  Learn More
</Button>

// Danger button
<Button variant="danger" size="md">
  Delete
</Button>
```

### Variants

- `primary`: Main call-to-action buttons
- `secondary`: Secondary actions
- `ghost`: Tertiary actions, less prominent
- `danger`: Destructive actions

### Sizes

- `sm`: Small buttons (44px min height)
- `md`: Medium buttons (44px min height) - default
- `lg`: Large buttons (48px min height) - for primary CTAs

### For Links

When you need a button-styled link, apply Button classes directly:

```tsx
<Link
  href="/path"
  className="inline-flex items-center justify-center gap-2 rounded-full font-semibold px-7 py-4 text-ui min-h-[48px] bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary)] to-turquoise-600 text-[var(--color-primary-ink)] hover:from-[var(--color-primary)]/90 hover:via-[var(--color-primary)]/90 hover:to-turquoise-700 hover:scale-105 hover:shadow-lg active:scale-95 transition-all duration-300 shadow-md"
>
  Link Text
</Link>
```

## Input Component

### Usage

Always use the `Input` component for form inputs:

```tsx
import { Input } from '@/components/ui/Input';

<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  help="We'll never share your email"
  loading={isSubmitting}
/>;
```

### Features

- Automatic error handling
- Help text support
- Loading state support
- Proper ARIA attributes
- Consistent styling

### With Icons

```tsx
<div className="relative">
  <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fg-muted pointer-events-none z-10" />
  <Input
    className="pl-12"
    // ... other props
  />
</div>
```

## Card Component

### Usage

Use the `Card` component for containers:

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';

<Card size="md" variant="default">
  <CardHeader>
    <h3>Title</h3>
  </CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Actions</CardFooter>
</Card>;
```

### Variants

- `default`: Standard card with border and subtle shadow
- `elevated`: Card with stronger shadow for emphasis
- `outlined`: Card with border only, no shadow
- `flat`: Card with no border or shadow

### Sizes

- `sm`: Small padding (p-4, rounded-xl)
- `md`: Medium padding (p-6, rounded-2xl) - default
- `lg`: Large padding (p-8, rounded-3xl)

## Heading Component

### Usage

Always use the `Heading` component for headings:

```tsx
import { H1, H2, H3, H4, H5, H6, Heading } from '@/components/ui/Heading';

// Fixed typography (default)
<H1>Page Title</H1>
<H2>Section Title</H2>

// Fluid typography (responsive)
<Heading level="h1" fluid>
  Responsive Title
</Heading>
```

### Best Practices

- Use semantic heading levels (h1-h6)
- Only one h1 per page
- Maintain heading hierarchy
- Use fluid typography for headings that need to scale

## Color Tokens

### Usage

Always use semantic color tokens instead of hardcoded colors:

```tsx
// ✅ Correct
<div className="bg-primary text-primary-ink">
<div className="text-fg-muted">
<div className="border-border">

// ❌ Incorrect
<div className="bg-teal-600 text-white">
<div className="text-gray-500">
<div className="border-gray-200">
```

### Available Tokens

- **Backgrounds**: `bg`, `bg-muted`
- **Text**: `fg`, `fg-muted`
- **Borders**: `border`
- **Primary**: `primary`, `primary-ink`
- **Semantic**: `success`, `warning`, `danger`
- **Accent**: `accent`

### Color Palette

- `navy-*`: Navy color scale (50-900)
- `turquoise-*`: Turquoise color scale (50-900)
- Use these for specific design needs, but prefer semantic tokens

## Border Radius

### Standardization

Use consistent border radius per component type:

- **Buttons**: `rounded-full` (Button component handles this)
- **Cards**: `rounded-xl` (sm), `rounded-2xl` (md), `rounded-3xl` (lg)
- **Inputs**: `rounded-2xl` (Input component handles this)
- **Badges/Pills**: `rounded-full`
- **General containers**: `rounded-2xl`

### Usage

```tsx
// ✅ Correct
<Card size="md">  // Uses rounded-2xl
<Input />  // Uses rounded-2xl
<Button />  // Uses rounded-full

// ❌ Incorrect
<div className="rounded-lg">  // Use rounded-2xl instead
<div className="rounded-md">  // Use rounded-2xl instead
```

## Shadows

### Usage

Use design token shadows instead of arbitrary values:

```tsx
// ✅ Correct
<div className="shadow-card">  // Subtle shadow
<div className="shadow-pop">  // Prominent shadow

// ❌ Incorrect
<div className="shadow-lg">
<div className="shadow-xl">
<div className="shadow-2xl">
```

### Shadow Tokens

- `shadow-card`: Subtle elevation (0 2px 6px rgba(15, 23, 42, 0.08))
- `shadow-pop`: Prominent elevation (0 12px 32px rgba(15, 23, 42, 0.16))

## Gradients

### Usage

Use gradient utility classes for common patterns:

```tsx
// ✅ Correct
<div className="bg-gradient-hero">  // Hero sections
<div className="bg-gradient-cta">  // CTA sections
<div className="bg-gradient-settings">  // Settings pages
<div className="bg-gradient-offer">  // Offer pages

// ❌ Incorrect
<div className="bg-gradient-to-br from-navy-900 via-navy-800 to-turquoise-900">
```

### Available Gradients

- `bg-gradient-hero`: Hero section gradient (navy-900 → navy-800 → turquoise-900)
- `bg-gradient-cta`: CTA section gradient (turquoise-500 → turquoise-600 → blue-600)
- `bg-gradient-settings`: Settings page gradient (navy-50 → slate-50 → turquoise-50)
- `bg-gradient-offer`: Offer page gradient (slate-50 → white → slate-100)

## Loading States

### Usage

Use the `LoadingSpinner` component for loading states:

```tsx
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

<LoadingSpinner size="md" aria-label="Loading" />;
```

### Sizes

- `sm`: Small spinner
- `md`: Medium spinner (default)
- `lg`: Large spinner

### In Components

Many components support loading states:

```tsx
<Button loading={isSubmitting}>Submit</Button>
<Input loading={isSearching} />
```

## Best Practices

### 1. Component First

Always prefer design system components over custom implementations:

```tsx
// ✅ Correct
<Button variant="primary">Submit</Button>
<Input label="Email" />
<Card size="md">Content</Card>

// ❌ Incorrect
<button className="bg-primary text-white px-4 py-2 rounded">
<input className="border rounded px-4 py-2">
<div className="bg-white border rounded p-4">
```

### 2. Design Tokens

Always use design tokens instead of hardcoded values:

```tsx
// ✅ Correct
<div className="text-fg-muted">
<div className="bg-primary">
<div className="border-border">

// ❌ Incorrect
<div className="text-gray-500">
<div className="bg-teal-600">
<div className="border-gray-200">
```

### 3. Consistent Spacing

Use the 4px base unit spacing scale:

```tsx
// ✅ Correct
<div className="p-4">  // 1rem (16px)
<div className="gap-6">  // 1.5rem (24px)
<div className="mb-8">  // 2rem (32px)

// ❌ Incorrect
<div className="p-5">  // Use p-4 or p-6
<div className="gap-7">  // Use gap-6 or gap-8
```

### 4. Typography Scale

Use typography scale classes:

```tsx
// ✅ Correct
<p className="text-body">Body text</p>
<p className="text-body-small">Small text</p>
<h1 className="text-h1">Heading</h1>

// ❌ Incorrect
<p className="text-base">Body text</p>
<p className="text-sm">Small text</p>
<h1 className="text-3xl">Heading</h1>
```

### 5. Accessibility

Always ensure accessibility:

- Use semantic HTML
- Provide proper ARIA attributes
- Ensure keyboard navigation
- Maintain color contrast (WCAG AA)
- Use proper focus states

### 6. Responsive Design

Use mobile-first approach:

```tsx
// ✅ Correct
<div className="p-4 md:p-6 lg:p-8">
<div className="text-body md:text-body-large">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// ❌ Incorrect
<div className="p-8 md:p-4">  // Mobile-first!
```

## Migration Checklist

When updating existing code:

- [ ] Replace custom buttons with `Button` component
- [ ] Replace custom inputs with `Input` component
- [ ] Replace custom cards with `Card` component
- [ ] Replace hardcoded colors with semantic tokens
- [ ] Standardize border radius usage
- [ ] Replace arbitrary shadows with design tokens
- [ ] Use gradient utility classes
- [ ] Use `Heading` component consistently
- [ ] Replace custom loading states with `LoadingSpinner`
- [ ] Ensure proper accessibility attributes

## Examples

### Before (Inconsistent)

```tsx
<button className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-xl shadow-lg">
  Submit
</button>
<input className="border-2 border-gray-200 rounded-lg px-4 py-2" />
<div className="bg-white border border-gray-300 rounded-lg p-6 shadow-xl">
  Content
</div>
```

### After (Consistent)

```tsx
<Button variant="primary" size="lg">
  Submit
</Button>
<Input label="Email" />
<Card size="md" variant="elevated">
  Content
</Card>
```

## Resources

- [Design System Documentation](./DESIGN_SYSTEM.md)
- [Component Library](../src/components/ui/)
- [Design Tokens](../src/styles/tokens.preset.ts)



