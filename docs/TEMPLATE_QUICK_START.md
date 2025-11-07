# Template Creation Quick Start Guide

For creating 1 template per month, this guide shows the fastest workflow.

## 🚀 Quick Workflow

### Option 1: Clone an Existing Template (Recommended)

**Best for**: When you want a similar design to an existing template

```bash
# Clone a template and modify it
pnpm template:clone free.minimal "Modern Clean" premium

# Or clone premium template
pnpm template:clone premium.executive "Corporate Style" free
```

**What it does**:
- Copies all files from source template
- Updates template IDs, class names, and variables
- Adjusts tier-specific settings (capabilities, marketing highlights)
- Ready to customize

**Next steps**:
1. Update colors in `tokens.ts`
2. Modify styles in `styles.css.ts`
3. Adjust layout in `partials/body.ts`
4. Register in `engineRegistry.ts`
5. Test: `pnpm test:templates`

### Option 2: Create from Scratch

**Best for**: When you want a completely new design

```bash
# Create a new template
pnpm template:new "Template Name" premium

# Or free tier
pnpm template:new "Template Name" free
```

**What it generates**:
- ✅ Complete template structure with all required files
- ✅ Common patterns (header, footer, pricing table, sections)
- ✅ Working CSS styles ready to customize
- ✅ Helper functions already imported and used
- ✅ Proper TypeScript types

**Next steps**:
1. Customize `tokens.ts` with your color scheme
2. Modify `styles.css.ts` for your design
3. Adjust layout in `partials/body.ts` if needed
4. Register in `engineRegistry.ts`
5. Test: `pnpm test:templates`

## 📁 Template Structure

```
<template-name>/
├── index.ts          # Template definition & registration
├── tokens.ts         # Colors, typography, spacing
├── styles.css.ts     # Template-specific CSS
└── partials/
    ├── head.ts       # <head> content (meta tags, fonts)
    └── body.ts       # <main> content (header, sections, footer)
```

## 🎨 Customization Checklist

After creating/cloning a template:

### 1. Design Tokens (`tokens.ts`)
- [ ] Update color palette (primary, secondary, text, muted, border, bg)
- [ ] Adjust typography (fonts, sizes, line heights)
- [ ] Set spacing scale (xs, sm, md, lg, xl)
- [ ] Configure border radius

### 2. Styles (`styles.css.ts`)
- [ ] Customize header styles
- [ ] Style sections and content areas
- [ ] Adjust pricing table appearance
- [ ] Style footer layout
- [ ] Add print-specific styles if needed

### 3. Layout (`partials/body.ts`)
- [ ] Modify header structure (add logo, change layout)
- [ ] Adjust sections ordering
- [ ] Customize footer columns
- [ ] Add/remove optional elements (gallery, watermark, etc.)

### 4. Metadata (`index.ts`)
- [ ] Set template label (display name)
- [ ] Add marketing highlight (premium templates)
- [ ] Configure capabilities (branding.logo, gallery, etc.)
- [ ] Update version number

## 🛠️ Common Patterns

### Adding a Logo (Premium Templates)

In `partials/body.ts`, update `partialHeader`:

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

### Adding Image Gallery

In `partials/body.ts`:

```typescript
function partialGallery(ctx: RenderCtx): string {
  const images = ctx.offer.images?.filter(img => img?.src) || [];
  if (images.length === 0) return '';

  const items = images.map(image => `
    <figure>
      <img src="${sanitizeInput(image.src)}" alt="${sanitizeInput(image.alt)}" />
    </figure>
  `).join('');

  return `
    <section class="section-card">
      <h2>${ctx.i18n.t('pdf.templates.sections.gallery')}</h2>
      <div class="gallery">${items}</div>
    </section>
  `;
}
```

### Custom Color Scheme

In `tokens.ts`:

```typescript
export const myTemplateTokens: ThemeTokens = {
  color: {
    primary: '#2563eb',      // Main brand color
    secondary: '#60a5fa',    // Accent color
    text: '#1e293b',         // Main text
    muted: '#64748b',        // Secondary text
    border: '#e2e8f0',       // Borders
    bg: '#ffffff',           // Background
  },
  // ... rest of tokens
};
```

## 📝 Registration

After customizing, register in `engineRegistry.ts`:

```typescript
import { myTemplateTemplate } from './my-template';

// ... other imports

registerTemplate(myTemplateTemplate);
```

## ✅ Testing

```bash
# Run template tests
pnpm test:templates

# Run full test suite
pnpm test

# Check linting
pnpm lint

# Fix formatting
pnpm format:fix
```

## 🎯 Tips for Faster Template Creation

1. **Start with cloning**: Use `template:clone` instead of creating from scratch
2. **Reuse patterns**: Copy functions from existing templates (header, footer, gallery)
3. **Use shared utilities**: Leverage `buildHeaderFooterCtx`, `renderSlimHeader`, etc.
4. **Test frequently**: Run `pnpm test:templates` after major changes
5. **Incremental changes**: Make small changes, test, iterate

## 📚 Reference

- **Full documentation**: See `docs/templates.md`
- **Template types**: See `src/app/pdf/templates/types.ts`
- **Shared utilities**: See `src/app/pdf/templates/shared/`
- **Existing templates**: See `src/app/pdf/templates/free.minimal/` and `premium.executive/`

## 🆘 Troubleshooting

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

