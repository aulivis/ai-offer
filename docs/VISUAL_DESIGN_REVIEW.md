# Visual Design Review

## Executive Summary

This review assesses the application's compliance with the five visual design principles:

1. Clear visual hierarchy
2. Cohesive color palette reflecting brand
3. Effective typography for readability and emphasis
4. Sufficient contrast for legibility (WCAG 2.1 AA)
5. Consistent style across the application

**Overall Status**: ⚠️ **Partially Compliant** - Strong foundation exists, but inconsistencies need to be addressed.

---

## 1. Visual Hierarchy ✅ Mostly Compliant

### Strengths

- ✅ Well-defined typography scale (`TYPOGRAPHY_SCALE`) with hierarchical sizes
- ✅ `Heading` component (`H1`, `H2`, etc.) provides consistent heading styles
- ✅ Typography scale includes proper font weights (400, 600, 700) for emphasis
- ✅ Line heights are defined for readability (1.2-1.6)
- ✅ Fluid typography support for responsive design

### Issues Found

- ⚠️ **Inconsistent Usage**: Many components use arbitrary Tailwind classes (`text-base`, `text-lg`, `text-xl`) instead of the typography scale
  - Example: `LandingHeader.tsx` uses `text-base`, `text-lg` instead of typography tokens
  - Example: Many components don't use the `Heading` component
- ⚠️ **Missing Hierarchy Enforcement**: No linting or guidelines to ensure typography scale is used

### Recommendations

1. Create a linting rule to encourage use of `Heading` component for headings
2. Document when to use `text-base` vs typography scale
3. Audit all components to replace arbitrary text sizes with typography scale

---

## 2. Cohesive Color Palette ⚠️ Partially Compliant

### Strengths

- ✅ Comprehensive semantic color token system defined
- ✅ Color tokens documented in `BRAND_COLOR_GUIDELINES.md`
- ✅ CSS custom properties for theming support
- ✅ Brand color customization via `BrandingProvider`

### Critical Issues Found

- ❌ **Hardcoded Colors in LandingHeader**:
  - `#FF6B35` (orange CTA buttons) - should use semantic token
  - `#E55A2B` (orange hover) - should use semantic token
  - `#1E3A5F` (navy border/text) - should use `navy-900` or semantic token
- ❌ **Hardcoded Tailwind Colors**:
  - `bg-slate-100`, `bg-slate-50`, `text-slate-600` found in multiple components
  - `bg-green-500` found in `SettingsSecurityTab.tsx`
  - Should use semantic tokens (`bg-bg-muted`, `text-fg-muted`, `bg-success`)
- ⚠️ **Payment Card Brand Colors**: Hardcoded colors in `billing/page.tsx` for payment card logos (Visa, Mastercard, etc.) - **Acceptable** as these are brand-specific

### Color Token System

The application defines these semantic tokens:

- `primary` / `primary-ink`: Brand primary color (#009688 turquoise)
- `bg` / `bg-muted`: Background colors
- `fg` / `fg-muted`: Text colors
- `border`: Border color
- `success`, `warning`, `danger`: State colors

### Recommendations

1. **URGENT**: Replace hardcoded colors in `LandingHeader.tsx` with semantic tokens
2. Replace all `slate-*` colors with semantic tokens (`bg-muted`, `fg-muted`, etc.)
3. Replace `green-500` with `success` token
4. Add ESLint rule to prevent hardcoded hex colors
5. Consider adding a semantic token for CTA buttons (currently using hardcoded orange)

---

## 3. Typography for Readability and Emphasis ✅ Compliant

### Strengths

- ✅ Comprehensive typography scale with proper sizes (12px-64px)
- ✅ Appropriate line heights for readability (1.2-1.6)
- ✅ Font weights defined for emphasis (400 normal, 600 semibold, 700 bold)
- ✅ Letter spacing defined for headings
- ✅ Fluid typography support for responsive design
- ✅ Consistent font family (Inter) across the application

### Typography Scale

```
display: 4rem (64px) - Large hero headings
h1: 3rem (48px) - Main page headings
h2: 2.25rem (36px) - Section headings
h3: 1.875rem (30px) - Subsection headings
body: 1rem (16px) - Default body text
bodySmall: 0.875rem (14px) - Secondary text
```

### Minor Issues

- ⚠️ Not all components use the typography scale consistently
- ⚠️ Some components use arbitrary font sizes

### Recommendations

1. Continue using `Heading` component for all headings
2. Document typography usage patterns
3. Consider creating a `BodyText` component for consistent body text styling

---

## 4. Color Contrast (WCAG 2.1 AA) ⚠️ Needs Verification

### Strengths

- ✅ Contrast audit script exists (`scripts/audit-color-contrast.ts`)
- ✅ Documentation claims WCAG AA compliance
- ✅ Semantic tokens designed with contrast in mind
- ✅ `fg-muted` color improved for better contrast (#475569)

### Issues Found

- ❌ **CRITICAL: Orange CTA Buttons Fail WCAG AA**:
  - White text on `#FF6B35` (orange): **2.84:1** ❌ FAILS (needs 4.5:1 for normal text, 3:1 for large text)
  - White text on `#E55A2B` (orange hover): **3.60:1** ⚠️ PASSES for large text only (needs 4.5:1 for normal text)
  - These buttons use `text-base` (16px) which requires 4.5:1 contrast ratio
- ✅ **Navy Text**: `#1E3A5F` on white background: **11.50:1** ✅ PASSES WCAG AAA
- ⚠️ **Hardcoded Colors Not Audited**: The hardcoded colors in `LandingHeader.tsx` are not included in the contrast audit script

### Contrast Requirements (WCAG 2.1 AA)

- Normal text: 4.5:1 contrast ratio
- Large text (18pt+ or 14pt+ bold): 3:1 contrast ratio

### Recommendations

1. **URGENT**: Run contrast audit on hardcoded colors
2. Add hardcoded colors to the contrast audit script
3. Verify all color combinations meet WCAG AA standards
4. Consider creating semantic tokens for CTA buttons to ensure contrast compliance

---

## 5. Consistent Style Across Application ⚠️ Partially Compliant

### Strengths

- ✅ Design system documentation exists (`DESIGN_SYSTEM.md`)
- ✅ Brand color guidelines documented (`BRAND_COLOR_GUIDELINES.md`)
- ✅ Component library with consistent patterns
- ✅ Spacing scale based on 4px unit
- ✅ Consistent border radius values
- ✅ Consistent shadow system

### Issues Found

- ❌ **Mixed Color Systems**: Some components use semantic tokens, others use hardcoded colors
- ❌ **Inconsistent Typography**: Mix of typography scale and arbitrary Tailwind classes
- ⚠️ **Component Inconsistencies**:
  - Some components follow design system
  - Others use arbitrary values
- ⚠️ **No Enforcement**: No linting rules to enforce design system usage

### Examples of Inconsistencies

1. **LandingHeader.tsx**: Uses hardcoded colors instead of semantic tokens
2. **WizardStep2Pricing.tsx**: Uses `bg-slate-100` instead of `bg-bg-muted`
3. **SettingsSecurityTab.tsx**: Uses `bg-green-500` instead of `bg-success`
4. **Multiple components**: Use arbitrary text sizes instead of typography scale

### Recommendations

1. **Create Design System Linting Rules**:
   - Prevent hardcoded hex colors
   - Encourage use of semantic tokens
   - Encourage use of typography scale
2. **Component Audit**: Review all components and migrate to design system
3. **Documentation**: Create migration guide for updating components
4. **Code Review Checklist**: Add design system compliance to PR checklist

---

## Priority Action Items

### High Priority (Critical)

1. ❌ **URGENT**: Fix WCAG AA contrast violation in `LandingHeader.tsx` CTA buttons
   - Orange buttons (#FF6B35) with white text fail contrast requirements (2.84:1)
   - Options: Darken orange, use darker text, or use semantic token with proper contrast
2. ✅ Replace hardcoded colors in `LandingHeader.tsx` with semantic tokens
3. ✅ Replace `slate-*` colors with semantic tokens across all components
4. ✅ Replace `green-500` with `success` token

### Medium Priority

1. ⚠️ Create semantic token for CTA buttons (or document orange as brand color)
2. ⚠️ Add ESLint rules to prevent hardcoded colors
3. ⚠️ Audit all components for typography scale usage
4. ⚠️ Update contrast audit script to include all color combinations

### Low Priority

1. 📝 Create `BodyText` component for consistent body text
2. 📝 Add design system compliance to code review checklist
3. 📝 Create component migration guide

---

## Compliance Summary

| Principle        | Status | Compliance                                        |
| ---------------- | ------ | ------------------------------------------------- |
| Visual Hierarchy | ⚠️     | 70% - Good foundation, inconsistent usage         |
| Color Palette    | ⚠️     | 60% - System exists, hardcoded colors present     |
| Typography       | ✅     | 85% - Well-defined, minor inconsistencies         |
| WCAG Contrast    | ❌     | 60% - **Critical violation found** in CTA buttons |
| Consistent Style | ⚠️     | 65% - Mixed usage of design system                |

**Overall Compliance: 68%** ⚠️ **Critical WCAG violation must be fixed**

---

## Next Steps

1. **IMMEDIATE (Critical)**: Fix WCAG AA contrast violation in CTA buttons
   - Option A: Use darker orange that meets 4.5:1 contrast with white text
   - Option B: Use semantic `primary` color (turquoise #009688) which has proper contrast
   - Option C: Use darker text color on orange background
2. **Immediate**: Replace hardcoded colors in `LandingHeader.tsx` with semantic tokens
3. **Short-term**: Replace all hardcoded colors with semantic tokens
4. **Medium-term**: Add linting rules and audit all components
5. **Long-term**: Maintain design system compliance in code reviews

---

## Files Requiring Updates

### Critical

- `web/src/components/LandingHeader.tsx` - Replace hardcoded colors
- `web/src/components/offers/WizardStep2Pricing.tsx` - Replace slate colors
- `web/src/components/settings/SettingsSecurityTab.tsx` - Replace green color

### Review Needed

- All components using `slate-*`, `gray-*`, `green-*`, `blue-*` Tailwind colors
- All components using arbitrary text sizes instead of typography scale
- All components using hardcoded hex colors

---

## Resources

- [Design System Documentation](./DESIGN_SYSTEM.md)
- [Brand Color Guidelines](./BRAND_COLOR_GUIDELINES.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- Contrast Audit Script: `npm run audit:color-contrast`
