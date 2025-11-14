# Template Documentation

## Overview

The template system provides a unified way to create and manage PDF offer templates. Templates are versioned, cached, and support both free and premium tiers.

## Quick Start

### Creating a Template

**Option 1: Clone an Existing Template (Recommended)**

```bash
# Clone a template and modify it
pnpm template:clone free.minimal "Modern Clean" premium
```

**Option 2: Create from Scratch**

```bash
# Create a new template
pnpm template:new "Template Name" premium
```

### Template Structure

```
<template-name>/
├── index.ts          # Template definition & registration
├── tokens.ts         # Colors, typography, spacing
├── styles.css.ts     # Template-specific CSS
└── partials/
    ├── head.ts       # <head> content (meta tags, fonts)
    └── body.ts       # <main> content (header, sections, footer)
```

### Registration

Register your template in `engineRegistry.ts`:

```typescript
import { myTemplateTemplate } from './my-template';
registerTemplate(myTemplateTemplate);
```

### Testing

```bash
# Run template tests
pnpm test:templates

# Update snapshots if needed
pnpm test:templates -u
```

## Architecture

### Template Registry

The unified registry (`engineRegistry.ts`) provides:

- Template validation with Zod schemas
- Caching (1-hour TTL)
- Metadata extraction
- Support for free and premium tiers
- Legacy ID mapping

### OfferTemplate Contract

Templates export an `OfferTemplate` object:

```typescript
{
  id: "premium.elegant@1.1.0",  // Unique identifier with semver
  tier: "premium",               // "free" or "premium"
  label: "Elegant",              // Display name
  marketingHighlight: "...",     // Premium template highlight
  capabilities: {                // Feature flags
    "branding.logo": true,
    "gallery": true
  },
  tokens: ThemeTokens,           // Colors, typography, spacing
  styles: string,                // CSS styles
  renderHead: (ctx) => string,   // <head> renderer
  renderBody: (ctx) => string    // <main> renderer
}
```

### RenderCtx

The context object passed to renderers:

```typescript
{
  offer: {                        // Offer metadata
    title: string,
    companyName: string,
    templateId: string
  },
  rows: PriceRow[],              // Pricing data
  branding: {                    // User branding overrides
    logoUrl?: string,
    colors?: Record<string, string>
  },
  i18n: I18nTranslator,          // Translation helper
  tokens: ThemeTokens,           // Merged theme tokens
  images: ImageAsset[]           // Up to 3 image assets
}
```

## Design Tokens

### Color Palette

```typescript
export const myTemplateTokens: ThemeTokens = {
  color: {
    primary: '#2563eb', // Main brand color
    secondary: '#60a5fa', // Accent color
    text: '#1e293b', // Main text
    muted: '#64748b', // Secondary text
    border: '#e2e8f0', // Borders
    bg: '#ffffff', // Background
  },
  // ... typography, spacing, etc.
};
```

### Typography

Use semantic token names:

- `tokens.typography.h1` - Main headings
- `tokens.typography.h2` - Section headings
- `tokens.typography.body` - Body text
- `tokens.typography.small` - Small text

### Spacing

Use the spacing scale:

- `tokens.spacing.xs` - 4px
- `tokens.spacing.sm` - 8px
- `tokens.spacing.md` - 16px
- `tokens.spacing.lg` - 24px
- `tokens.spacing.xl` - 32px

## Common Patterns

### Header with Logo

```typescript
function partialHeader(ctx: RenderCtx): string {
  const safeCtx = buildHeaderFooterCtx(ctx);
  const { company, title, logoUrl, logoAlt, monogram } = safeCtx;

  const logoSlot = logoUrl
    ? `<div class="offer-doc__logo-wrap"><img class="offer-doc__logo" src="${logoUrl}" alt="${logoAlt}" /></div>`
    : `<div class="offer-doc__logo-wrap"><span class="offer-doc__monogram">${monogram}</span></div>`;

  return `
    <header class="offer-doc__header">
      ${logoSlot}
      <h1>${title}</h1>
    </header>
  `;
}
```

### Image Gallery

```typescript
function partialGallery(ctx: RenderCtx): string {
  const images = ctx.offer.images?.filter((img) => img?.src) || [];
  if (images.length === 0) return '';

  const items = images
    .map(
      (image) => `
    <figure>
      <img src="${sanitizeInput(image.src)}" alt="${sanitizeInput(image.alt)}" />
    </figure>
  `,
    )
    .join('');

  return `
    <section class="section-card">
      <h2>${ctx.i18n.t('pdf.templates.sections.gallery')}</h2>
      <div class="gallery">${items}</div>
    </section>
  `;
}
```

### Fixed Header/Footer

```typescript
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

### Pricing Table

Use the shared pricing table component:

```typescript
import { renderPricingTable } from '../shared/pricingTable';

function partialPricing(ctx: RenderCtx): string {
  return `
    <section class="section-card">
      <h2>${ctx.i18n.t('pdf.templates.sections.pricing')}</h2>
      ${renderPricingTable(ctx.rows, ctx.tokens)}
    </section>
  `;
}
```

## Internationalization

All customer-facing strings must use `ctx.i18n`:

```typescript
// ✅ Correct
<h2>${ctx.i18n.t('pdf.templates.sections.pricing')}</h2>

// ❌ Incorrect
<h2>Pricing</h2>
```

Common translation keys:

- `pdf.templates.sections.pricing` - "Pricing"
- `pdf.templates.sections.gallery` - "Gallery"
- `pdf.templates.sections.nextSteps` - "Next Steps"

## Versioning

Templates use semantic versioning:

- **Patch** (`1.0.1`): Minor spacing tweaks, copy fixes
- **Minor** (`1.1.0`): New optional sections, token updates
- **Major** (`2.0.0`): Breaking layout changes

Update both `id` and `version` fields when bumping:

```typescript
export const myTemplate: OfferTemplate = {
  id: 'premium.elegant@1.1.0',
  version: '1.1.0',
  // ...
};
```

## Tier Configuration

### Free Templates

```typescript
{
  tier: "free",
  label: "Minimal",
  // No marketingHighlight needed
  capabilities: {
    "branding.logo": false,  // Free templates have limited capabilities
    "gallery": false
  }
}
```

### Premium Templates

```typescript
{
  tier: "premium",
  label: "Elegant",
  marketingHighlight: "Professional design with advanced branding options",
  capabilities: {
    "branding.logo": true,
    "gallery": true,
    "watermark": true
  }
}
```

## Caching

Templates are automatically cached for 1 hour. The cache is:

- **Automatic**: No manual management needed
- **Invalidated on registration**: New registrations clear the cache
- **Manual control**: Use `clearTemplateCache(id)` to force refresh

## Testing

### Golden File Tests

Templates are tested against golden snapshots:

```bash
# Run tests
pnpm test:templates

# Update snapshots
pnpm test:templates -u
```

### Linting

```bash
# Check code style
pnpm lint

# Fix formatting
pnpm format:fix
```

## Troubleshooting

### Template not showing in UI

- Check registration in `engineRegistry.ts`
- Verify template ID format: `tier.name@1.0.0`
- Check tier matches user's plan

### Styles not applying

- Verify CSS class names match between HTML and CSS
- Check CSS variables (tokens) are defined
- Test print styles separately

### Test failures

- Update snapshots: `pnpm test:templates -u`
- Check HTML structure matches expected format
- Verify all required fields are present

### TypeScript errors

- Ensure all imports are correct
- Check function signatures match `RenderCtx` type
- Verify template exports match `OfferTemplate` interface

## Best Practices

1. **Use semantic HTML**: Use proper heading hierarchy, semantic elements
2. **Token-based styling**: Avoid hard-coding colors/fonts, use tokens
3. **Internationalization**: Always use `ctx.i18n` for user-facing text
4. **Accessibility**: Include proper ARIA labels, alt text for images
5. **Print optimization**: Test print styles, use `@media print` queries
6. **Error handling**: Sanitize all user input, handle missing data gracefully
7. **Performance**: Keep templates lightweight, avoid complex computations

## Reference

- **Template Types**: `src/app/pdf/templates/types.ts`
- **Shared Utilities**: `src/app/pdf/templates/shared/`
- **Example Templates**: `src/app/pdf/templates/html/free.minimal/`, `src/app/pdf/templates/html/premium.professional/`
- **Registry**: `src/app/pdf/templates/engineRegistry.ts`
