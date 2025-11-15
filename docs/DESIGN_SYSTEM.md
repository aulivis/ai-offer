# Design System Documentation

This document provides a comprehensive overview of the design system, including design tokens, components, patterns, and best practices.

## Table of Contents

1. [Overview](#overview)
2. [Design Tokens](#design-tokens)
3. [Typography](#typography)
4. [Spacing](#spacing)
5. [Colors](#colors)
6. [Components](#components)
7. [Layout Patterns](#layout-patterns)
8. [View Transitions](#view-transitions)
9. [Container Queries](#container-queries)
10. [Accessibility](#accessibility)
11. [Responsive Design](#responsive-design)
12. [Best Practices](#best-practices)

## Overview

The design system is built on a foundation of design tokens that ensure consistency across the application. It provides:

- **Consistent Spacing**: 4px base unit spacing scale
- **Typography Scale**: Hierarchical typography system with fluid/responsive support
- **Color System**: Semantic color tokens with WCAG AA compliance
- **Component Library**: Reusable UI components with consistent patterns
- **Animation System**: Accessible animations that respect user preferences
- **Responsive Design**: Mobile-first approach with fluid typography

## Design Tokens

Design tokens are the foundational values that define the visual design of the application. They are organized into categories:

- **Spacing**: Consistent spacing values based on 4px base unit
- **Typography**: Font sizes, line heights, weights
- **Colors**: Semantic color tokens
- **Animations**: Durations, easings, patterns
- **Shadows**: Elevation and depth
- **Border Radius**: Corner rounding

### Usage

```typescript
import { tokens } from '@/styles/designTokens';
import {
  SPACING_SCALE,
  TYPOGRAPHY_SCALE,
  getSpacing,
  SPACING_PRESETS,
} from '@/styles/designTokens';

// Use spacing values
const padding = getSpacing('md'); // '1rem'
const gap = SPACING_SCALE.lg; // '1.5rem'

// Use presets
const cardPadding = SPACING_PRESETS.cardPadding; // '1.5rem'

// Use typography tokens
const h1Style = TYPOGRAPHY_SCALE.h1;
const h1StyleObj = getTypography('h1');
// { size: '3rem', lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }
```

### Animation System

The animation system provides consistent animations that respect `prefers-reduced-motion`:

```typescript
import {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  getAnimationDuration,
  getAnimationStyle,
} from '@/styles/animations';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// In a component
function MyComponent() {
  const reducedMotion = useReducedMotion();
  const duration = getAnimationDuration('smooth', true); // Returns 0 if reduced motion

  return (
    <div style={getAnimationStyle('smooth', 'easeOut', true)}>
      Content
    </div>
  );
}
```

#### Duration Scale

| Key       | Value  | Use Case              |
| --------- | ------ | --------------------- |
| `instant` | 75ms   | Instant feedback      |
| `fast`    | 150ms  | Quick transitions     |
| `base`    | 200ms  | Standard transitions  |
| `smooth`  | 300ms  | Smooth transitions    |
| `slow`    | 500ms  | Slow transitions      |
| `slower`  | 1000ms | Very slow transitions |

#### Easing Functions

| Key         | Value                                  | Use Case           |
| ----------- | -------------------------------------- | ------------------ |
| `linear`    | linear                                 | Constant speed     |
| `easeIn`    | cubic-bezier(0.4, 0, 1, 1)             | Slow start         |
| `easeOut`   | cubic-bezier(0, 0, 0.2, 1)             | Slow end           |
| `easeInOut` | cubic-bezier(0.4, 0, 0.2, 1)           | Slow start and end |
| `spring`    | cubic-bezier(0.68, -0.55, 0.265, 1.55) | Spring-like motion |

#### Animation Patterns

Common animation patterns are available as CSS keyframes:

- `fadeIn` - Fade in animation
- `fadeOut` - Fade out animation
- `slideUp` - Slide up animation (for modals, bottom sheets)
- `slideDown` - Slide down animation
- `scaleUp` - Scale up animation (for buttons, cards)
- `scaleDown` - Scale down animation

These are automatically disabled when `prefers-reduced-motion` is enabled.

## Typography

### Typography Scale

The typography scale provides consistent font sizes, line heights, and weights for different text roles.

#### Fixed Typography Scale

Fixed typography uses consistent sizes across all viewports:

```typescript
import { TYPOGRAPHY_SCALE } from '@/styles/typography';

// H1: 3rem (48px)
// H2: 2.25rem (36px)
// H3: 1.875rem (30px)
// Body: 1rem (16px)
```

#### Fluid Typography Scale

Fluid typography scales smoothly between mobile and desktop using `clamp()`:

```typescript
import { FLUID_TYPOGRAPHY_SCALE } from '@/styles/fluidTypography';

// H1: 32px mobile → 48px desktop (clamp(2rem, 1.5rem + 1vw, 3rem))
// H2: 24px mobile → 36px desktop
// Body: 14px mobile → 16px desktop
```

### Heading Component

The `Heading` component provides consistent heading styles with optional fluid typography:

```tsx
import { Heading, H1, H2 } from '@/components/ui/Heading';

// Fixed typography (default)
<H1>Page Title</H1>

// Fluid typography
<Heading level="h1" fluid>
  Responsive Title
</Heading>
```

### Typography Scale Values

| Key         | Size     | Line Height | Weight | Fixed Size      | Fluid Size (Mobile → Desktop) | Use Case            |
| ----------- | -------- | ----------- | ------ | --------------- | ----------------------------- | ------------------- |
| `display`   | 4rem     | 1.1         | 700    | 4rem (64px)     | 48px → 64px                   | Large hero headings |
| `h1`        | 3rem     | 1.2         | 700    | 3rem (48px)     | 32px → 48px                   | Main page headings  |
| `h2`        | 2.25rem  | 1.25        | 600    | 2.25rem (36px)  | 24px → 36px                   | Section headings    |
| `h3`        | 1.875rem | 1.3         | 600    | 1.875rem (30px) | 20px → 30px                   | Subsection headings |
| `h4`        | 1.5rem   | 1.35        | 600    | 1.5rem (24px)   | 18px → 24px                   | Minor headings      |
| `h5`        | 1.25rem  | 1.4         | 600    | 1.25rem (20px)  | 16px → 20px                   | Small headings      |
| `h6`        | 1.125rem | 1.4         | 600    | 1.125rem (18px) | 14px → 18px                   | Smallest headings   |
| `bodyLarge` | 1.125rem | 1.6         | 400    | 1.125rem (18px) | -                             | Emphasis text       |
| `body`      | 1rem     | 1.6         | 400    | 1rem (16px)     | 14px → 16px                   | Default body text   |
| `bodySmall` | 0.875rem | 1.5         | 400    | 0.875rem (14px) | 12px → 14px                   | Secondary text      |
| `caption`   | 0.75rem  | 1.4         | 400    | 0.75rem (12px)  | -                             | Small labels        |
| `uiLarge`   | 1.125rem | 1.5         | 600    | 1.125rem (18px) | -                             | Large UI text       |
| `ui`        | 1rem     | 1.5         | 600    | 1rem (16px)     | -                             | Default UI text     |
| `uiSmall`   | 0.875rem | 1.4         | 600    | 0.875rem (14px) | -                             | Small UI text       |

### Best Practices

- Use semantic heading levels (h1-h6) for accessibility
- Maintain heading hierarchy (h1 → h2 → h3)
- Use fluid typography for headings that need to scale
- Use fixed typography for UI elements that need consistency
- Only one h1 per page

## Spacing

### Spacing Scale

The spacing scale is based on a 4px base unit, aligned with Tailwind CSS:

| Key     | Value   | Pixels | Use Case                     |
| ------- | ------- | ------ | ---------------------------- |
| `xs`    | 0.25rem | 4px    | Minimal spacing              |
| `sm`    | 0.5rem  | 8px    | Small spacing                |
| `sm-md` | 0.75rem | 12px   | Small-medium spacing         |
| `md`    | 1rem    | 16px   | Medium spacing (base)        |
| `lg`    | 1.5rem  | 24px   | Large spacing                |
| `xl`    | 2rem    | 32px   | Extra large spacing          |
| `2xl`   | 2.75rem | 44px   | Touch target size (WCAG AAA) |
| `3xl`   | 3rem    | 48px   | Extra extra large spacing    |
| `4xl`   | 4rem    | 64px   | Huge spacing                 |
| `5xl`   | 5rem    | 80px   | Maximum spacing              |

### Fluid Spacing

Fluid spacing scales smoothly between mobile and desktop:

```typescript
import { FLUID_SPACING_SCALE } from '@/styles/fluidTypography';

// Spacing that scales: 12px mobile → 16px desktop
const padding = FLUID_SPACING_SCALE.md;
```

### Usage

```tsx
// Use Tailwind classes (aligns with spacing scale)
<div className="p-4 gap-6 mb-8">{/* p-4 = 1rem, gap-6 = 1.5rem, mb-8 = 2rem */}</div>;

// Use spacing tokens for inline styles
import { SPACING_SCALE } from '@/styles/spacing';
<div style={{ padding: SPACING_SCALE.md, gap: SPACING_SCALE.lg }}>Content</div>;
```

## Colors

### Color System

The color system uses semantic color tokens for consistency and accessibility:

#### Primary Colors

- `primary`: Primary brand color (#00e5b0)
- `primary-ink`: Text color for primary background (#04251a)
- `accent`: Accent color (#c3b3ff)

#### Semantic Colors

- `success`: Success state (#16a34a)
- `warning`: Warning state (#f59e0b)
- `danger`: Danger/destructive state (#dc2626)
- `danger-ink`: Text color for danger background (#ffffff)

#### Background Colors

- `bg`: Main background (#f7f9fb)
- `bg-muted`: Muted background (#ffffff)

#### Text Colors

- `fg`: Primary text color (#0f172a)
- `fg-muted`: Muted text color (#475569) - WCAG AA compliant

#### Border Colors

- `border`: Border color (#e5e7eb)

### Usage

```tsx
// Use Tailwind classes
<div className="bg-primary text-primary-ink">
  Primary content
</div>

// Use CSS custom properties
<div style={{ backgroundColor: 'var(--color-primary)' }}>
  Content
</div>
```

### Color Contrast

All color combinations are WCAG 2.1 AA compliant. Use the color contrast audit script to verify:

```bash
npm run audit:color-contrast
```

## Components

### Component Library

The component library provides reusable UI components with consistent patterns:

#### Button

```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary" size="md" loading={isSubmitting}>
  Submit
</Button>;
```

#### Input

```tsx
import { Input } from '@/components/ui/Input';

<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  loading={isLoading}
/>;
```

#### Card

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';

<Card size="md" variant="default">
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>;
```

#### Modal

```tsx
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';

<Modal open={isOpen} onClose={() => setIsOpen(false)} size="lg">
  <ModalHeader>
    <h2>Modal Title</h2>
  </ModalHeader>
  <ModalBody>Modal content</ModalBody>
  <ModalFooter>
    <Button onClick={() => setIsOpen(false)}>Close</Button>
  </ModalFooter>
</Modal>;
```

### Component Patterns

#### Compound Components

Many components support compound component patterns for better composition:

```tsx
// Card with compound components
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Actions</CardFooter>
</Card>

// Modal with compound components
<Modal>
  <ModalHeader>Title</ModalHeader>
  <ModalBody>Content</ModalBody>
  <ModalFooter>Actions</ModalFooter>
</Modal>
```

#### Loading States

All interactive components support loading states:

```tsx
<Button loading={isSubmitting}>Submit</Button>
<Input loading={isSearching} />
<Select loading={isLoadingOptions} />
<Link loading={isNavigating}>Navigate</Link>
```

## Layout Patterns

### Container Patterns

```tsx
// Max-width container
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  Content
</div>

// Full-width container
<div className="w-full">
  Content
</div>
```

### Grid Patterns

```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</div>
```

### Flex Patterns

```tsx
// Flex container
<div className="flex items-center justify-between gap-4">
  <div>Left content</div>
  <div>Right content</div>
</div>
```

## Accessibility

### WCAG 2.1 Compliance

The design system is built with WCAG 2.1 Level AA compliance in mind:

- **Color Contrast**: All text meets 4.5:1 contrast ratio (WCAG AA)
- **Touch Targets**: Minimum 44x44px for all interactive elements
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Readers**: Proper ARIA attributes and semantic HTML
- **Reduced Motion**: All animations respect `prefers-reduced-motion`

### ARIA Attributes

All components include proper ARIA attributes:

- `aria-busy`: Loading states
- `aria-invalid`: Error states
- `aria-describedby`: Help text and error messages
- `aria-labelledby`: Labels
- `aria-label`: Icon-only buttons

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Focus management in modals and dialogs
- Escape key closes modals
- Tab key navigates through focusable elements
- Arrow keys for filter chips and grids

## View Transitions

### Overview

The design system uses the View Transitions API for smooth page transitions. This provides native browser support for animating between page states.

### Automatic Transitions

View transitions are automatically enabled for Next.js Link navigation. Key elements (header, main content, footer) have view transition names applied.

### Programmatic Navigation

Use the `useViewTransition` hook for programmatic navigation:

```tsx
import { useViewTransition } from '@/hooks/useViewTransition';
import { useRouter } from 'next/navigation';

function MyComponent() {
  const router = useRouter();
  const startTransition = useViewTransition();

  const handleNavigate = () => {
    startTransition(() => {
      router.push('/dashboard');
    });
  };

  return <button onClick={handleNavigate}>Navigate</button>;
}
```

### Reduced Motion

View transitions automatically respect `prefers-reduced-motion` and are disabled for users who prefer reduced motion.

### View Transition Names

- `header` - Page header
- `main-content` - Main content area
- `footer` - Page footer

## Container Queries

### Overview

Container queries allow components to respond to their container's size rather than the viewport size, enabling more flexible responsive design.

### Container Component

Use the `Container` component to create a container context:

```tsx
import { Container } from '@/components/ui/Container';

<Container type="inline-size" name="card">
  <div className="container-responsive">Content that adapts to container size</div>
</Container>;
```

### Container Types

- `inline-size` - Responds to inline (width) size
- `block-size` - Responds to block (height) size
- `size` - Responds to both inline and block size
- `normal` - No container queries (default)

### Container Query CSS

Use container queries in CSS:

```css
@container card (min-width: 400px) {
  .card-title {
    font-size: 1.25rem;
  }
}

@container card (min-width: 640px) {
  .card-title {
    font-size: 1.5rem;
  }
}
```

### Card Component

The `Card` component automatically enables container queries:

```tsx
<Card>
  <h3 className="card-title-responsive">Title</h3>
  {/* Content adapts to card width */}
</Card>
```

### Container Query Breakpoints

- `320px` - Small container
- `400px` - Medium container
- `640px` - Large container
- `1024px` - Extra large container

## Responsive Design

### Mobile-First Approach

The design system uses a mobile-first approach:

- Base styles target mobile devices
- Use `sm:`, `md:`, `lg:`, `xl:` breakpoints for larger screens
- Breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl), 1920px (2xl)

### Fluid Typography

Use fluid typography for headings that need to scale:

```tsx
<Heading level="h1" fluid>
  Responsive Heading
</Heading>
```

### Responsive Spacing

Use Tailwind's responsive utilities for spacing:

```tsx
<div className="p-4 md:p-6 lg:p-8">Responsive padding</div>
```

### Container Queries

Use container queries for component-level responsiveness:

```tsx
<Container type="inline-size" name="card">
  <div className="container-responsive">Content that adapts to container size</div>
</Container>
```

## Best Practices

### Design Token Usage

1. **Always use design tokens**: Never use arbitrary values
2. **Use spacing scale**: Use spacing tokens instead of arbitrary padding/margins
3. **Use typography scale**: Use typography tokens for consistent text sizing
4. **Use semantic colors**: Use semantic color tokens instead of hex values

### Component Usage

1. **Use compound components**: Use compound component patterns for better composition
2. **Provide loading states**: Always provide loading states for async operations
3. **Handle errors**: Always handle and display errors appropriately
4. **Accessibility first**: Ensure all components are accessible

### Responsive Design

1. **Mobile-first**: Start with mobile styles, then enhance for larger screens
2. **Use fluid typography**: Use fluid typography for headings
3. **Test on multiple devices**: Test on various screen sizes
4. **Use responsive utilities**: Use Tailwind's responsive utilities

### Accessibility

1. **Semantic HTML**: Use semantic HTML elements
2. **ARIA attributes**: Provide proper ARIA attributes
3. **Keyboard navigation**: Ensure all interactive elements are keyboard accessible
4. **Color contrast**: Ensure sufficient color contrast
5. **Screen readers**: Test with screen readers

## Migration Guide

### Migrating to Fluid Typography

**Before:**

```tsx
<h1 className="text-3xl md:text-4xl lg:text-5xl">Title</h1>
```

**After:**

```tsx
<Heading level="h1" fluid>
  Title
</Heading>
```

### Migrating to Design Tokens

**Before:**

```tsx
<div style={{ padding: '24px', fontSize: '18px' }}>Content</div>
```

**After:**

```tsx
import { SPACING_SCALE, TYPOGRAPHY_SCALE } from '@/styles/designTokens';

<div style={{ padding: SPACING_SCALE.lg, fontSize: TYPOGRAPHY_SCALE.bodyLarge.size }}>Content</div>;
```

## Resources

- [Component Usage Guidelines](./COMPONENT_USAGE_GUIDELINES.md)
- [Performance Monitoring](./PERFORMANCE_MONITORING.md)

## Files

- `web/src/styles/spacing.ts` - Spacing scale utilities
- `web/src/styles/typography.ts` - Typography scale utilities
- `web/src/styles/fluidTypography.ts` - Fluid typography utilities
- `web/src/styles/animations.ts` - Animation utilities
- `web/src/styles/designTokens.ts` - Design tokens index
- `web/src/components/ui/*` - UI component library
