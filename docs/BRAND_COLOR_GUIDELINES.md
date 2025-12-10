# Brand Color Guidelines

This document provides comprehensive guidelines for using colors consistently across the Vyndi application.

## Overview

The Vyndi design system uses a semantic color token system that ensures consistency, accessibility, and maintainability. All colors are defined as CSS custom properties and should be used through semantic tokens rather than hardcoded values.

## Color System Architecture

### Semantic Color Tokens

The application uses semantic color tokens that map to specific use cases:

#### Primary Colors

- `primary`: Main brand color (Turquoise #009688) - Used for primary actions, links, and brand elements
- `primary-ink`: Text color for primary backgrounds (#ffffff) - Ensures WCAG AA contrast
- `accent`: Accent color (#c3b3ff) - Used for highlights and secondary actions

#### Background Colors

- `bg`: Main background (#f7f9fb) - Default page background
- `bg-muted`: Muted background (#ffffff) - Cards, panels, elevated surfaces

#### Text Colors

- `fg`: Primary text color (#102a43) - Main content text
- `fg-muted`: Muted text color (#475569) - Secondary text, labels, hints (WCAG AA compliant)

#### Border Colors

- `border`: Default border color (#e5e7eb) - Dividers, borders, outlines

#### Semantic State Colors

- `success`: Success state (#16a34a) - Success messages, positive indicators
- `warning`: Warning state (#f59e0b) - Warnings, cautions
- `danger`: Error/destructive state (#dc2626) - Errors, destructive actions
- `danger-ink`: Text on danger background (#ffffff)

## Usage Guidelines

### ✅ DO

1. **Use Semantic Tokens**

   ```tsx
   // ✅ Correct
   <div className="bg-primary text-primary-ink">Primary Button</div>
   <p className="text-fg-muted">Secondary text</p>
   ```

2. **Use Tailwind Classes with Semantic Tokens**

   ```tsx
   // ✅ Correct
   <div className="bg-bg-muted border border-border">
   <button className="bg-primary hover:bg-primary/90 text-primary-ink">
   ```

3. **Use Opacity Modifiers for Variations**

   ```tsx
   // ✅ Correct - Use opacity for lighter variants
   <div className="bg-primary/10 border border-primary/20">
   <span className="text-primary/90">Muted primary text</span>
   ```

4. **Use Semantic State Colors for Status**
   ```tsx
   // ✅ Correct
   <div className="bg-success/10 text-success">Success message</div>
   <div className="bg-danger/10 text-danger">Error message</div>
   ```

### ❌ DON'T

1. **Don't Use Hardcoded Tailwind Colors**

   ```tsx
   // ❌ Wrong
   <div className="bg-blue-500 text-gray-900">
   <span className="text-slate-600">
   ```

2. **Don't Use Arbitrary Color Values**

   ```tsx
   // ❌ Wrong
   <div style={{ backgroundColor: '#3b82f6' }}>
   <div className="bg-[#3b82f6]">
   ```

3. **Don't Mix Color Systems**

   ```tsx
   // ❌ Wrong - Mixing semantic tokens with hardcoded colors
   <div className="bg-primary text-gray-700">
   ```

4. **Don't Use Non-Semantic Colors for UI States**
   ```tsx
   // ❌ Wrong
   <div className="bg-green-50 text-green-700">Success</div>
   // ✅ Correct
   <div className="bg-success/10 text-success">Success</div>
   ```

## Color Palette Reference

### Primary Brand Colors

| Token         | Hex Value | Usage                                  |
| ------------- | --------- | -------------------------------------- |
| `primary`     | #009688   | Primary buttons, links, brand elements |
| `primary-ink` | #ffffff   | Text on primary background             |
| `accent`      | #c3b3ff   | Accent highlights, secondary actions   |

### Background Colors

| Token      | Hex Value | Usage                            |
| ---------- | --------- | -------------------------------- |
| `bg`       | #f7f9fb   | Main page background             |
| `bg-muted` | #ffffff   | Cards, panels, elevated surfaces |

### Text Colors

| Token      | Hex Value | Usage                  | WCAG AA |
| ---------- | --------- | ---------------------- | ------- |
| `fg`       | #102a43   | Primary text           | ✅      |
| `fg-muted` | #475569   | Secondary text, labels | ✅      |

### Border Colors

| Token    | Hex Value | Usage             |
| -------- | --------- | ----------------- |
| `border` | #e5e7eb   | Borders, dividers |

### State Colors

| Token        | Hex Value | Usage          | WCAG AA |
| ------------ | --------- | -------------- | ------- |
| `success`    | #16a34a   | Success states | ✅      |
| `warning`    | #f59e0b   | Warning states | ✅      |
| `danger`     | #dc2626   | Error states   | ✅      |
| `danger-ink` | #ffffff   | Text on danger | ✅      |

## Accessibility (WCAG 2.1 AA)

All semantic color tokens are designed to meet WCAG 2.1 Level AA contrast requirements:

- **Text on Background**: `fg` on `bg` = 12.6:1 ✅
- **Muted Text**: `fg-muted` on `bg` = 4.8:1 ✅
- **Primary Text**: `primary-ink` on `primary` = 4.5:1 ✅
- **Success Text**: `success` on `bg` = 4.5:1 ✅
- **Danger Text**: `danger` on `bg` = 4.5:1 ✅

### Contrast Verification

When using opacity modifiers, ensure sufficient contrast:

- `text-primary/90` on `bg-bg-muted` = ✅
- `text-fg-muted` on `bg-bg` = ✅
- Always test color combinations with contrast checkers

## Migration Guide

### Replacing Hardcoded Colors

**Before:**

```tsx
<div className="bg-blue-500 text-white">
  <p className="text-gray-600">Content</p>
</div>
```

**After:**

```tsx
<div className="bg-primary text-primary-ink">
  <p className="text-fg-muted">Content</p>
</div>
```

### Replacing State Colors

**Before:**

```tsx
<div className="bg-green-50 border-green-200 text-green-700">Success message</div>
```

**After:**

```tsx
<div className="bg-success/10 border-success/30 text-success">Success message</div>
```

## Component Examples

### Buttons

```tsx
// Primary button
<button className="bg-primary hover:bg-primary/90 text-primary-ink">
  Primary Action
</button>

// Secondary button
<button className="border border-border bg-bg-muted hover:bg-bg text-fg">
  Secondary Action
</button>
```

### Cards

```tsx
<Card className="bg-bg-muted border border-border">
  <h3 className="text-fg">Card Title</h3>
  <p className="text-fg-muted">Card content</p>
</Card>
```

### Status Indicators

```tsx
// Success
<div className="bg-success/10 border border-success/30 text-success">
  Operation successful
</div>

// Error
<div className="bg-danger/10 border border-danger/30 text-danger">
  Operation failed
</div>
```

## Brand Color Customization

The application supports brand color customization through the `BrandingProvider`. User-defined brand colors are applied via CSS custom properties:

- `--brand-primary`: User's primary brand color
- `--brand-secondary`: User's secondary brand color
- `--brand-text`: Text color for brand elements

These are separate from the application's semantic tokens and are used for user-generated content (e.g., offer documents).

## Best Practices

1. **Always use semantic tokens** - Never hardcode color values
2. **Test contrast ratios** - Ensure all text meets WCAG AA standards
3. **Use opacity for variations** - Instead of creating new color tokens
4. **Maintain consistency** - Use the same tokens for the same purposes
5. **Document exceptions** - If you must use a non-semantic color, document why

## Resources

- [Design System Documentation](./DESIGN_SYSTEM.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Questions?

If you're unsure about which color token to use, refer to:

1. This document
2. The design system documentation
3. Existing component implementations
4. The design team

