# Template Pattern Library

This document provides reusable patterns and best practices for creating PDF templates in our system.

## Table of Contents

1. [Layout Patterns](#layout-patterns)
2. [Typography Patterns](#typography-patterns)
3. [Component Patterns](#component-patterns)
4. [Print-Specific Patterns](#print-specific-patterns)
5. [Accessibility Patterns](#accessibility-patterns)

## Layout Patterns

### Fixed Header/Footer Pattern

Use fixed headers and footers for consistent branding across all pages.

```typescript
// In partials/body.ts
import { renderSlimHeader, renderSlimFooter } from '../shared/slimHeaderFooter';
import { buildHeaderFooterCtx } from '../shared/headerFooter';

export function renderBody(ctx: RenderCtx): string {
  const headerFooterCtx = buildHeaderFooterCtx(ctx);
  const slimHeader = renderSlimHeader(headerFooterCtx);
  const slimFooter = renderSlimFooter(headerFooterCtx);
  
  return `
    ${slimHeader}
    ${slimFooter}
    <main class="offer-doc__content">
      <!-- Your content here -->
    </main>
  `;
}
```

### First Page Only Header

Display a detailed header only on the first page.

```typescript
function partialHeader(ctx: RenderCtx): string {
  return `
    <header class="offer-doc__header first-page-only">
      <!-- Header content -->
    </header>
  `;
}
```

### Grid Layout Pattern

Use CSS Grid for responsive layouts that adapt to content.

```css
.offer-doc__footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12mm;
}

@media print {
  .offer-doc__footer-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
}
```

### Flexbox Layout Pattern

Use Flexbox for flexible, one-dimensional layouts.

```css
.offer-doc__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  min-width: 0; /* Important for proper shrinking */
}

.offer-doc__meta-item {
  flex: 0 1 auto;
  min-width: 0; /* Important for text wrapping */
}
```

## Typography Patterns

### Heading Hierarchy

Maintain consistent heading hierarchy for accessibility.

```typescript
function renderSectionHeading(text: string, id: string): string {
  return `<h2 class="section-card__title" id="${sanitizeInput(id)}">${sanitizeInput(text)}</h2>`;
}
```

### Text Wrapping

Always ensure text can wrap properly to prevent overflow.

```css
.text-content {
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  max-width: 100%;
}
```

### Print-Optimized Typography

Use print-friendly font sizes and line heights.

```css
body {
  font-size: 11pt;
  line-height: 1.6;
  font-family: 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

h1 {
  font-size: 1.5rem;
  line-height: 1.3;
  margin-top: 1.8rem;
  margin-bottom: 0.8rem;
}

h2 {
  font-size: 1.25rem;
  line-height: 1.35;
  margin-top: 1.6rem;
  margin-bottom: 0.7rem;
}
```

## Component Patterns

### Pricing Table Pattern

Use tables for pricing data (better PDF compatibility).

```typescript
function partialPriceTable(ctx: RenderCtx): string {
  const rows = ctx.rows.map((row) => {
    const total = row.qty * row.unitPrice;
    return `
      <tr>
        <td>${sanitizeInput(row.name)}</td>
        <td>${row.qty} ${sanitizeInput(row.unit)}</td>
        <td>${formatCurrency(row.unitPrice)}</td>
        <td>${row.vat}%</td>
        <td>${formatCurrency(total)}</td>
      </tr>
    `;
  }).join('');

  return `
    <table class="offer-doc__pricing-table">
      <thead>
        <tr>
          <th>Szolgáltatás</th>
          <th>Mennyiség</th>
          <th>Egységár</th>
          <th>ÁFA</th>
          <th>Összesen</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}
```

### Image Gallery Pattern

Handle images with proper validation and fallbacks.

```typescript
import { validateImageAssets } from '../shared/urlValidation';

function partialGallery(ctx: RenderCtx): string {
  const images = validateImageAssets(ctx.images);
  
  if (images.length === 0) {
    return '';
  }

  const items = images
    .slice(0, 3) // Limit to 3 images
    .map((img) => {
      const safeSrc = sanitizeInput(img.src);
      const safeAlt = sanitizeInput(img.alt);
      return `<img src="${safeSrc}" alt="${safeAlt}" />`;
    })
    .join('');

  return `
    <section class="section-card--gallery">
      <h2>${ctx.i18n.t('pdf.templates.sections.gallery')}</h2>
      <div class="offer-doc__gallery">
        ${items}
      </div>
    </section>
  `;
}
```

### Logo Pattern

Handle logos with fallback to monogram.

```typescript
import { buildHeaderFooterCtx } from '../shared/headerFooter';

function partialLogo(ctx: RenderCtx): string {
  const headerFooterCtx = buildHeaderFooterCtx(ctx);
  
  if (headerFooterCtx.logoUrl) {
    return `<img src="${sanitizeInput(headerFooterCtx.logoUrl)}" alt="Logo" />`;
  }
  
  return `<span class="offer-doc__monogram">${headerFooterCtx.monogram}</span>`;
}
```

## Print-Specific Patterns

### Page Break Control

Prevent unwanted page breaks in critical sections.

```css
.section-card {
  break-inside: avoid;
  page-break-inside: avoid;
}

h1, h2, h3 {
  break-after: avoid;
  page-break-after: avoid;
  orphans: 3;
  widows: 3;
}
```

### Print Color Adjustment

Ensure colors print correctly.

```css
@media print {
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
  }
}
```

### Safe Area Pattern

Keep content within safe margins.

```css
.offer-doc__content {
  padding: var(--page-safe-inset);
  max-width: calc(100% - var(--page-margin-left) - var(--page-margin-right));
}
```

## Accessibility Patterns

### Skip Links

Provide skip links for keyboard navigation.

```typescript
import { renderSkipLinks } from '../shared/accessibility';

export function renderBody(ctx: RenderCtx): string {
  return `
    ${renderSkipLinks()}
    <!-- Content -->
  `;
}
```

### Semantic HTML

Use semantic HTML elements.

```typescript
return `
  <header class="offer-doc__header">
    <!-- Header content -->
  </header>
  <main class="offer-doc__content">
    <!-- Main content -->
  </main>
  <footer class="offer-doc__footer">
    <!-- Footer content -->
  </footer>
`;
```

### ARIA Labels

Add ARIA labels for screen readers.

```typescript
return `
  <div class="offer-doc__slim-bar slim-header" aria-hidden="true">
    <!-- Header content -->
  </div>
`;
```

## Best Practices

### 1. Always Sanitize User Input

```typescript
import { sanitizeInput } from '@/lib/sanitize';

const safeText = sanitizeInput(userInput);
```

### 2. Validate URLs

```typescript
import { validateImageUrl } from '../shared/urlValidation';

const logoUrl = validateImageUrl(ctx.branding?.logoUrl);
```

### 3. Use CSS Variables for Theming

```css
.offer-doc__header {
  background: var(--brand-bg, #ffffff);
  color: var(--brand-text, #0f172a);
}
```

### 4. Handle Placeholders

```typescript
import { buildHeaderFooterCtx } from '../shared/headerFooter';

const ctx = buildHeaderFooterCtx(renderCtx);
if (ctx.company.isPlaceholder) {
  // Show placeholder styling
}
```

### 5. Internationalization

```typescript
const label = ctx.i18n.t('pdf.templates.common.companyName');
```

## Common Pitfalls to Avoid

### 1. Don't Use Fixed Heights on Text Containers

```css
/* ❌ Bad */
.text-container {
  height: 100px;
}

/* ✅ Good */
.text-container {
  min-height: 100px;
  height: auto;
}
```

### 2. Don't Forget Word Wrapping

```css
/* ❌ Bad */
.long-text {
  /* No wrapping */
}

/* ✅ Good */
.long-text {
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}
```

### 3. Don't Use Relative URLs for Images

```typescript
// ❌ Bad
const imgSrc = '/images/logo.png';

// ✅ Good
const imgSrc = 'https://cdn.example.com/images/logo.png';
```

### 4. Don't Skip Page Break Controls

```css
/* ❌ Bad */
.section {
  /* No break control */
}

/* ✅ Good */
.section {
  break-inside: avoid;
  page-break-inside: avoid;
}
```

## Template Structure

### Recommended File Organization

```
templates/
  your-template/
    index.ts           # Template definition
    tokens.ts          # Theme tokens
    styles.css.ts      # Template-specific styles
    partials/
      head.ts          # Head content
      body.ts          # Body content
```

### Template Definition Pattern

```typescript
export const yourTemplate: OfferTemplate = {
  id: 'tier.template@1.0.0',
  tier: 'free' | 'premium' | 'pro',
  label: 'Template Name',
  version: '1.0.0',
  marketingHighlight: 'Description for users',
  styles: {
    print: pdfStyles,
    template: templateStyles,
  },
  tokens: templateTokens,
  capabilities: {
    'pricing.table': true,
    'branding.logo': false,
    'gallery': false,
  },
  renderHead,
  renderBody,
};
```

## Resources

- [Template System Documentation](./templates.md)
- [Template Quick Start Guide](./TEMPLATE_QUICK_START.md)
- [Industry Best Practices](../TEMPLATE_SYSTEM_INDUSTRY_COMPARISON.md)






