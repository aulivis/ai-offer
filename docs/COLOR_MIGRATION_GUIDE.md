# Color Migration Guide

This guide helps developers migrate hardcoded colors to semantic tokens across the codebase.

## Quick Reference: Color Mappings

### Background Colors

| Old (Hardcoded)                | New (Semantic)  | Notes                        |
| ------------------------------ | --------------- | ---------------------------- |
| `bg-gray-50`                   | `bg-bg-muted`   | Muted backgrounds            |
| `bg-gray-100`                  | `bg-bg-muted`   | Loading states, placeholders |
| `bg-white`                     | `bg-bg-muted`   | Cards, panels                |
| `bg-blue-50`                   | `bg-primary/10` | Primary-themed backgrounds   |
| `bg-green-50`                  | `bg-success/10` | Success backgrounds          |
| `bg-red-50`                    | `bg-danger/10`  | Error backgrounds            |
| `bg-yellow-50` / `bg-amber-50` | `bg-warning/10` | Warning backgrounds          |

### Text Colors

| Old (Hardcoded)  | New (Semantic)                     | Notes                          |
| ---------------- | ---------------------------------- | ------------------------------ |
| `text-gray-300`  | `text-white/80` or `text-fg-muted` | Light text on dark backgrounds |
| `text-gray-400`  | `text-fg-muted`                    | Muted text                     |
| `text-gray-500`  | `text-fg-muted`                    | Secondary text                 |
| `text-gray-600`  | `text-fg-muted`                    | Secondary text                 |
| `text-gray-700`  | `text-fg`                          | Primary text                   |
| `text-gray-900`  | `text-fg`                          | Primary text                   |
| `text-blue-600`  | `text-primary`                     | Primary links/actions          |
| `text-blue-700`  | `text-primary`                     | Primary emphasis               |
| `text-blue-900`  | `text-primary/90`                  | Primary dark variant           |
| `text-green-500` | `text-success`                     | Success indicators             |
| `text-green-600` | `text-success`                     | Success text                   |
| `text-green-700` | `text-success`                     | Success emphasis               |
| `text-red-600`   | `text-danger`                      | Error text                     |
| `text-red-700`   | `text-danger`                      | Error emphasis                 |
| `text-red-900`   | `text-danger/90`                   | Error dark variant             |

### Border Colors

| Old (Hardcoded)    | New (Semantic)      | Notes           |
| ------------------ | ------------------- | --------------- |
| `border-gray-100`  | `border-border`     | Default borders |
| `border-gray-200`  | `border-border`     | Default borders |
| `border-blue-200`  | `border-primary/30` | Primary borders |
| `border-green-200` | `border-success/30` | Success borders |
| `border-red-200`   | `border-danger/30`  | Error borders   |

### Slate Colors (Common in Settings)

| Old (Hardcoded)    | New (Semantic)  | Notes             |
| ------------------ | --------------- | ----------------- |
| `text-slate-500`   | `text-fg-muted` | Muted text        |
| `text-slate-600`   | `text-fg-muted` | Secondary text    |
| `text-slate-700`   | `text-fg`       | Primary text      |
| `text-slate-900`   | `text-fg`       | Primary text      |
| `bg-slate-50`      | `bg-bg-muted`   | Muted backgrounds |
| `border-slate-200` | `border-border` | Default borders   |

## Migration Patterns

### Pattern 1: Simple Background Replacement

```tsx
// Before
<div className="bg-gray-50 p-4">

// After
<div className="bg-bg-muted p-4">
```

### Pattern 2: Text Color Replacement

```tsx
// Before
<p className="text-gray-600">Secondary text</p>

// After
<p className="text-fg-muted">Secondary text</p>
```

### Pattern 3: State Colors with Opacity

```tsx
// Before
<div className="bg-blue-50 border-blue-200 text-blue-700">
  Info message
</div>

// After
<div className="bg-primary/10 border-primary/30 text-primary/90">
  Info message
</div>
```

### Pattern 4: Success/Error States

```tsx
// Before
<div className="bg-green-50 border-green-200 text-green-700">
  Success
</div>
<div className="bg-red-50 border-red-200 text-red-700">
  Error
</div>

// After
<div className="bg-success/10 border-success/30 text-success">
  Success
</div>
<div className="bg-danger/10 border-danger/30 text-danger">
  Error
</div>
```

### Pattern 5: Icon Colors

```tsx
// Before
<CheckCircle className="w-6 h-6 text-green-500" />
<AlertCircle className="w-6 h-6 text-red-600" />

// After
<CheckCircle className="w-6 h-6 text-success" />
<AlertCircle className="w-6 h-6 text-danger" />
```

## Automated Migration Script

You can use find-and-replace with these patterns:

### VS Code Find & Replace (Regex)

1. **Replace gray backgrounds:**
   - Find: `bg-gray-(50|100)`
   - Replace: `bg-bg-muted`

2. **Replace gray text:**
   - Find: `text-gray-(400|500|600)`
   - Replace: `text-fg-muted`
   - Find: `text-gray-(700|900)`
   - Replace: `text-fg`

3. **Replace slate colors:**
   - Find: `text-slate-(500|600)`
   - Replace: `text-fg-muted`
   - Find: `text-slate-(700|900)`
   - Replace: `text-fg`

4. **Replace blue colors:**
   - Find: `bg-blue-50`
   - Replace: `bg-primary/10`
   - Find: `text-blue-(600|700)`
   - Replace: `text-primary`

5. **Replace green colors:**
   - Find: `bg-green-50`
   - Replace: `bg-success/10`
   - Find: `text-green-(500|600|700)`
   - Replace: `text-success`

6. **Replace red colors:**
   - Find: `bg-red-50`
   - Replace: `bg-danger/10`
   - Find: `text-red-(600|700)`
   - Replace: `text-danger`

## Files to Migrate

### High Priority (User-Facing Pages)

- ✅ `web/src/app/page.tsx` - Landing page
- ✅ `web/src/app/resources/guide/page.tsx` - Guide page
- ✅ `web/src/app/resources/ai-guide/page.tsx` - AI guide page
- ⏳ `web/src/app/settings/page.tsx` - Settings page (in progress)
- ⏳ `web/src/app/dashboard/page.tsx` - Dashboard
- ⏳ `web/src/app/login/LoginClient.tsx` - Login page
- ⏳ `web/src/app/billing/page.tsx` - Billing page

### Medium Priority (Components)

- ⏳ `web/src/components/landing/*` - Landing page components
- ⏳ `web/src/components/dashboard/*` - Dashboard components
- ⏳ `web/src/components/settings/*` - Settings components
- ⏳ `web/src/components/offers/*` - Offer wizard components

### Lower Priority (Utility Components)

- ⏳ `web/src/components/ui/*` - Base UI components
- ⏳ `web/src/components/cookies/*` - Cookie components
- ⏳ `web/src/components/guides/*` - Guide components

## Verification Checklist

After migration, verify:

- [ ] No hardcoded color classes remain (search for `bg-(blue|green|red|gray|slate|yellow|amber|orange|purple|pink)-`)
- [ ] All text meets WCAG AA contrast (use browser dev tools)
- [ ] Visual appearance matches design intent
- [ ] No broken styles or missing colors
- [ ] Components render correctly in light mode
- [ ] All interactive states (hover, focus) work correctly

## Testing

1. **Visual Regression**: Compare before/after screenshots
2. **Accessibility**: Run contrast checker on all text
3. **Functionality**: Test all interactive elements
4. **Responsive**: Check mobile and desktop views

## Common Pitfalls

1. **Don't replace decorative colors** - Some colors are intentional (e.g., gradient backgrounds)
2. **Check opacity usage** - Ensure `/10`, `/20`, `/30` opacity modifiers are appropriate
3. **Verify contrast** - Always test text on background combinations
4. **Preserve brand colors** - Don't replace user-customizable brand colors in offer documents

## Questions?

Refer to:

- [Brand Color Guidelines](./BRAND_COLOR_GUIDELINES.md)
- [Design System Documentation](./DESIGN_SYSTEM.md)
- Design team for brand-specific questions


