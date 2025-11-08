# Template System Enhancements

This document outlines all the enhancements made to the PDF template system for improved typography, colors, layout, performance, accessibility, and print optimization.

## 1. Typography Enhancements

### Font Loading
- **Font Preloading**: Added `generateFontPreloads()` utility to preload critical fonts
- **Font Fallbacks**: Enhanced fallback chains with system fonts for better PDF rendering
- **Font Features**: Enabled kerning and ligatures for better text rendering

### Standardized Typography
- **Line Heights**: Standardized line heights (tight: 1.2, normal: 1.5, relaxed: 1.65, loose: 1.8)
- **Font Sizes**: Consistent font size scale (xs to 4xl)
- **Font Rendering**: Optimized with `text-rendering: optimizeLegibility` and font smoothing

### Implementation
```typescript
import { generateFontPreloads, LINE_HEIGHTS, FONT_SIZES } from '@/app/pdf/templates/shared/fonts';
```

## 2. Color System Improvements

### Print Color Optimization
- **Grayscale Conversion**: Utilities to ensure colors print well in grayscale
- **Contrast Checking**: WCAG AA compliance checking (4.5:1 for normal text, 3:1 for large text)
- **Print-Safe Colors**: Automatic color adjustment for print media

### Brand Color Overrides
- Enhanced brand color handling with proper contrast checking
- Automatic fallback to safe colors when contrast is insufficient

### Implementation
```typescript
import { getContrastRatio, meetsWCAGAA, ensurePrintSafe } from '@/app/pdf/templates/shared/colors';
```

## 3. Layout Enhancements

### Grid System
- **12-Column Grid**: Standardized grid system with responsive breakpoints
- **Spacing Scale**: Consistent spacing scale (xs: 4px to 3xl: 56px)
- **Responsive Breakpoints**: sm (640px), md (768px), lg (1024px)

### Implementation
```typescript
import { SPACING_SCALE, GRID_SYSTEM, generateGridCSS } from '@/app/pdf/templates/shared/layout';
```

## 4. Performance Optimizations

### CSS Minification
- Already implemented in `engine.ts` with `minifyCss()` function
- Inline style minification
- HTML whitespace minification

### Critical CSS
- Font preloading for faster rendering
- Optimized CSS delivery

## 5. Accessibility Improvements

### Semantic HTML
- Proper use of semantic elements (`<main>`, `<header>`, `<footer>`, `<nav>`, `<section>`)
- ARIA labels for common elements
- Skip links for keyboard navigation

### Color Independence
- Text indicators where color conveys meaning
- Sufficient color contrast ratios
- Focus indicators for interactive elements

### Image Accessibility
- Visual indicators for missing alt text
- Proper alt text handling

### Implementation
```typescript
import { generateAriaLabel, ensureSemanticStructure, renderSkipLinks } from '@/app/pdf/templates/shared/accessibility';
```

## 6. Template Features

### Watermarks
Support for draft, preview, confidential, and custom watermarks.

```typescript
import { renderWatermark } from '@/app/pdf/templates/shared/watermark';

const { html, css } = renderWatermark({
  type: 'draft',
  opacity: 0.1,
  rotation: -45
});
```

### Table of Contents
Automatic TOC generation from document headings.

```typescript
import { renderTableOfContents, extractHeadings } from '@/app/pdf/templates/shared/tableOfContents';

const headings = extractHeadings(bodyHtml);
const toc = renderTableOfContents(headings, i18n);
```

## 7. Print-Specific Optimizations

### Page Break Control
- Enhanced page break rules to keep related content together
- Headings stay with following paragraphs
- Sections avoid breaking across pages

### Orphans and Widows
- Minimum 3 lines at page start/end
- Proper handling of single lines
- Enhanced control for headings, paragraphs, list items, and table cells

### Print Color Adjustments
- Darkened borders for better visibility in print
- Grayscale-safe color handling
- Enhanced contrast for print media

## 8. Developer Experience

### Shared Utilities
All utilities are located in `web/src/app/pdf/templates/shared/`:
- `fonts.ts` - Typography utilities
- `colors.ts` - Color system utilities
- `layout.ts` - Layout and grid utilities
- `accessibility.ts` - Accessibility helpers
- `watermark.ts` - Watermark generation
- `tableOfContents.ts` - TOC generation
- `slimHeaderFooter.ts` - Header/footer rendering
- `marketingFooter.ts` - Marketing footer

### Type Definitions
Enhanced `OfferData` interface with:
- `watermark?: { type?: 'draft' | 'preview' | 'confidential' | 'custom'; text?: string }`
- `includeTOC?: boolean`

## Usage Examples

### Adding Font Preloading
```typescript
import { generateFontPreloads } from '@/app/pdf/templates/shared/fonts';

export function renderHead(ctx: RenderCtx): string {
  return `
    <meta charset="UTF-8" />
    <title>${safeTitle}</title>
    ${generateFontPreloads()}
  `;
}
```

### Adding Watermark
```typescript
import { renderWatermark } from '@/app/pdf/templates/shared/watermark';

const { html, css } = renderWatermark({ type: 'draft' });
// Add html to body, css to styles
```

### Adding Table of Contents
```typescript
import { renderTableOfContents, extractHeadings } from '@/app/pdf/templates/shared/tableOfContents';

const headings = extractHeadings(ctx.offer.bodyHtml);
const toc = renderTableOfContents(headings, ctx.i18n);
```

## Best Practices

1. **Always use font preloading** for better PDF rendering
2. **Check color contrast** when using custom brand colors
3. **Use semantic HTML** for better accessibility
4. **Test in grayscale** to ensure print readability
5. **Use standardized spacing** from the spacing scale
6. **Add ARIA labels** for complex elements
7. **Ensure images have alt text** for accessibility

## Testing Checklist

- [ ] Fonts load correctly in PDF
- [ ] Colors have sufficient contrast (WCAG AA)
- [ ] Colors print well in grayscale
- [ ] Page breaks work correctly
- [ ] No orphaned/widowed lines
- [ ] Watermarks display correctly (if used)
- [ ] TOC links work correctly (if used)
- [ ] Images have alt text
- [ ] Focus indicators visible
- [ ] Semantic HTML structure correct












