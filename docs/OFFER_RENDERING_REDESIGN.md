# Offer HTML Rendering System Redesign

## Overview

The offer HTML rendering system has been completely redesigned from scratch to address persistent issues with formatting and missing images. The new system follows industry best practices for HTML document generation.

## Problems Solved

1. **Missing Images**: Images are now properly embedded as data URLs directly in the stored HTML
2. **Broken Formatting**: All styles are now inline in the HTML document, eliminating style extraction/scoping issues
3. **Complex Template System**: Replaced with a simple, unified renderer

## Architecture

### New Unified Renderer

**Location**: `web/src/lib/offers/renderer.ts`

The new renderer creates complete, self-contained HTML documents with:

- **Inline CSS**: All styles are embedded in `<style>` tags within the document
- **Embedded Images**: Images are stored as data URLs directly in the HTML
- **Semantic HTML**: Proper HTML5 structure with accessibility in mind
- **Responsive Design**: Mobile-friendly with print styles
- **No External Dependencies**: Everything needed is in the HTML document

### Key Features

1. **Image Embedding**: Images are embedded as base64 data URLs when offers are created
2. **Dynamic Styling**: CSS is generated with dynamic brand colors
3. **Complete HTML Documents**: Returns full HTML documents, not fragments
4. **Simple API**: Single function call to render complete offers

## Changes Made

### 1. New Renderer (`web/src/lib/offers/renderer.ts`)

- `renderOfferHtml()`: Main function that generates complete HTML documents
- Handles all offer sections: body content, pricing, schedule, testimonials, guarantees, images
- Generates inline CSS with dynamic brand colors
- Properly formats currency and dates

### 2. Updated Share Page (`web/src/app/offer/[token]/page.tsx`)

- Removed complex template resolution logic
- Removed style extraction and scoping
- Now uses the new unified renderer
- Displays complete HTML documents directly

### 3. Updated Preview API (`web/src/app/api/offer-preview/render/route.ts`)

- Removed template loading and complex rendering
- Now uses the new unified renderer
- Simplified request schema (removed templateId requirement)

### 4. Fixed Image Storage (`web/src/app/api/ai-generate/route.ts`)

- Updated `applyImageAssetsToHtml()` to embed images in stored HTML
- Images are now stored as data URLs in the database
- Both PDF and stored HTML versions include embedded images

## Usage

### Rendering an Offer

```typescript
import { renderOfferHtml } from '@/lib/offers/renderer';
import { createTranslator } from '@/copy';

const html = renderOfferHtml(
  {
    title: 'My Offer',
    companyName: 'My Company',
    bodyHtml: '<p>Offer content</p>',
    locale: 'hu',
    pricingRows: [{ name: 'Service', qty: 1, unit: 'hour', unitPrice: 10000, vat: 27 }],
    images: [{ src: 'data:image/png;base64,...', alt: 'Reference image' }],
    branding: {
      primaryColor: '#1c274c',
      secondaryColor: '#e2e8f0',
      logoUrl: 'https://...',
    },
  },
  createTranslator('hu'),
);
```

## Benefits

1. **Reliability**: No more missing images or broken formatting
2. **Simplicity**: Single renderer function, no complex template system
3. **Performance**: Inline styles mean no style extraction overhead
4. **Maintainability**: Clear, straightforward code
5. **Portability**: Self-contained HTML documents work anywhere

## Migration Notes

- Old template system files remain but are no longer used for offer display
- The new renderer is used for all offer HTML generation
- Images must be embedded as data URLs when offers are created
- The share page now displays complete HTML documents directly

## Future Improvements

- Consider adding template variants (different visual styles)
- Add support for custom CSS themes
- Optimize image compression for storage
- Add caching for rendered HTML
