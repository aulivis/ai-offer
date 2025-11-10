# Design Tokens Documentation

This document describes the design token system used throughout the application for consistent spacing, typography, and animations.

## Overview

The design token system provides:

- **Spacing Scale**: Consistent spacing values based on 4px base unit
- **Typography Scale**: Consistent font sizes, line heights, and weights
- **Animation System**: Consistent animations that respect `prefers-reduced-motion`

## Spacing Scale

### Usage

```typescript
import { SPACING_SCALE, getSpacing, SPACING_PRESETS } from '@/styles/spacing';

// Use spacing values
const padding = getSpacing('md'); // '1rem'
const gap = SPACING_SCALE.lg; // '1.5rem'

// Use presets
const cardPadding = SPACING_PRESETS.cardPadding; // '1.5rem'
```

### Scale Values

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

### Tailwind Integration

The spacing scale aligns with Tailwind's default spacing scale. Use Tailwind classes directly:

```tsx
<div className="p-4 gap-6 mb-8">{/* p-4 = 1rem, gap-6 = 1.5rem, mb-8 = 2rem */}</div>
```

## Typography Scale

### Usage

```typescript
import { TYPOGRAPHY_SCALE, getTypography } from '@/styles/typography';
import { Heading, H1, H2, H3 } from '@/components/ui/Heading';

// Use Heading component
<H1>Main Title</H1>
<H2>Section Title</H2>
<Heading level="h3" size="h2">Custom styled heading</Heading>

// Use typography values directly
const h1Style = getTypography('h1');
// { size: '3rem', lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }
```

### Scale Values

| Key         | Size     | Line Height | Weight | Use Case            |
| ----------- | -------- | ----------- | ------ | ------------------- |
| `display`   | 4rem     | 1.1         | 700    | Large hero headings |
| `h1`        | 3rem     | 1.2         | 700    | Main page headings  |
| `h2`        | 2.25rem  | 1.25        | 600    | Section headings    |
| `h3`        | 1.875rem | 1.3         | 600    | Subsection headings |
| `h4`        | 1.5rem   | 1.35        | 600    | Minor headings      |
| `h5`        | 1.25rem  | 1.4         | 600    | Small headings      |
| `h6`        | 1.125rem | 1.4         | 600    | Smallest headings   |
| `bodyLarge` | 1.125rem | 1.6         | 400    | Emphasis text       |
| `body`      | 1rem     | 1.6         | 400    | Default body text   |
| `bodySmall` | 0.875rem | 1.5         | 400    | Secondary text      |
| `caption`   | 0.75rem  | 1.4         | 400    | Small labels        |
| `uiLarge`   | 1.125rem | 1.5         | 600    | Large UI text       |
| `ui`        | 1rem     | 1.5         | 600    | Default UI text     |
| `uiSmall`   | 0.875rem | 1.4         | 600    | Small UI text       |

### Heading Component

The `Heading` component provides consistent heading styles:

```tsx
import { Heading, H1, H2, H3 } from '@/components/ui/Heading';

// Basic usage
<H1>Page Title</H1>
<H2>Section Title</H2>

// Custom styling
<Heading level="h2" size="h1" className="text-primary">
  Custom Styled Heading
</Heading>
```

## Animation System

### Usage

```typescript
import {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  getAnimationDuration,
  getAnimationStyle,
  useReducedMotion
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

### Duration Scale

| Key       | Value  | Use Case              |
| --------- | ------ | --------------------- |
| `instant` | 75ms   | Instant feedback      |
| `fast`    | 150ms  | Quick transitions     |
| `base`    | 200ms  | Standard transitions  |
| `smooth`  | 300ms  | Smooth transitions    |
| `slow`    | 500ms  | Slow transitions      |
| `slower`  | 1000ms | Very slow transitions |

### Easing Functions

| Key         | Value                                  | Use Case           |
| ----------- | -------------------------------------- | ------------------ |
| `linear`    | linear                                 | Constant speed     |
| `easeIn`    | cubic-bezier(0.4, 0, 1, 1)             | Slow start         |
| `easeOut`   | cubic-bezier(0, 0, 0.2, 1)             | Slow end           |
| `easeInOut` | cubic-bezier(0.4, 0, 0.2, 1)           | Slow start and end |
| `spring`    | cubic-bezier(0.68, -0.55, 0.265, 1.55) | Spring-like motion |

### Reduced Motion Support

All animations automatically respect `prefers-reduced-motion`. The `useReducedMotion` hook provides React integration:

```tsx
import { useReducedMotion } from '@/hooks/useReducedMotion';

function AnimatedComponent() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={reducedMotion ? '' : 'animate-fadeIn'}
      style={reducedMotion ? {} : { transition: 'opacity 300ms ease-out' }}
    >
      Content
    </div>
  );
}
```

### Animation Patterns

Common animation patterns are available as CSS keyframes:

- `fadeIn` - Fade in animation
- `fadeOut` - Fade out animation
- `slideUp` - Slide up animation (for modals, bottom sheets)
- `slideDown` - Slide down animation
- `scaleUp` - Scale up animation (for buttons, cards)
- `scaleDown` - Scale down animation

These are automatically disabled when `prefers-reduced-motion` is enabled.

## Component Variants

### Card Component

The `Card` component now supports size and variant props:

```tsx
import { Card } from '@/components/ui/Card';

// Size variants
<Card size="sm">Small card</Card>
<Card size="md">Medium card (default)</Card>
<Card size="lg">Large card</Card>

// Variant styles
<Card variant="default">Default card</Card>
<Card variant="elevated">Elevated card</Card>
<Card variant="outlined">Outlined card</Card>
<Card variant="flat">Flat card</Card>
```

### Button Component

The `Button` component already supports size variants (`sm`, `md`, `lg`) and variants (`primary`, `secondary`, `ghost`, `danger`).

## Best Practices

1. **Use design tokens consistently**: Always use the spacing and typography scales instead of arbitrary values
2. **Respect reduced motion**: Always check for reduced motion preference in animations
3. **Maintain visual hierarchy**: Use the typography scale to maintain consistent heading sizes
4. **Use semantic HTML**: Use appropriate heading levels (h1-h6) for accessibility
5. **Test on mobile**: Ensure spacing and typography work well on mobile devices

## Migration Guide

### Migrating to Heading Component

**Before:**

```tsx
<h1 className="text-4xl font-bold">Title</h1>
```

**After:**

```tsx
import { H1 } from '@/components/ui/Heading';
<H1>Title</H1>;
```

### Migrating to Spacing Scale

**Before:**

```tsx
<div className="p-6 gap-4 mb-8">
```

**After:**

```tsx
// Already using Tailwind classes (which align with spacing scale)
<div className="p-6 gap-4 mb-8">
// Or use spacing tokens for inline styles
<div style={{ padding: getSpacing('lg'), gap: getSpacing('md') }}>
```

## Files

- `web/src/styles/spacing.ts` - Spacing scale utilities
- `web/src/styles/typography.ts` - Typography scale utilities
- `web/src/styles/animations.ts` - Animation utilities
- `web/src/styles/designTokens.ts` - Design tokens index
- `web/src/components/ui/Heading.tsx` - Heading component
- `web/src/components/ui/Card.tsx` - Card component (with size/variant props)
- `web/src/hooks/useReducedMotion.ts` - Reduced motion hook


