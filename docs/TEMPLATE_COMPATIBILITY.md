# Template Compatibility with New Rendering System

## Overview

All 6 templates are now fully compatible with the new unified rendering system. The system intelligently routes between the existing template engine (for template-specific styling) and the unified renderer (for default rendering).

## Template Support

### Free Templates

1. **free.minimal.html@1.0.0** (Vera Minimal)
   - Default template
   - Clean, professional design
   - Works with both systems

2. **free.classic.html@1.0.0** (Viola Classic)
   - Elegant, classic typography
   - Paper-based aesthetic
   - Full template system support

3. **free.minimalist.html@1.0.0**
   - Minimalist design
   - Clean layout
   - Full template system support

### Premium Templates

4. **premium.professional.html@1.0.0** (Valeria Professional)
   - Modern, premium design
   - Animated elements and gradients
   - Full template system support

5. **premium.luxury.html@1.0.0**
   - Luxury aesthetic
   - Premium styling
   - Full template system support

6. **premium.brutalist.html@1.0.0**
   - Brutalist design
   - Bold typography
   - Full template system support

## How It Works

### Template Selection

When `templateId` is provided in `OfferRenderData`:

1. The system loads the template using `loadTemplate()`
2. Uses the existing template engine (`buildOfferHtml`)
3. Ensures images are properly embedded
4. Returns fully formatted HTML with template-specific styling

### Fallback Behavior

If template rendering fails:

1. Falls back to the unified renderer
2. Logs a warning for debugging
3. Ensures offers always render successfully

### Image Handling

All templates now properly support:

- Embedded images as data URLs
- Images in the body HTML
- Images in the images section
- Proper alt text and accessibility

## Usage

### With Template Selection

```typescript
const html = renderOfferHtml({
  title: 'My Offer',
  companyName: 'My Company',
  bodyHtml: '<p>Content</p>',
  templateId: 'premium.professional.html@1.0.0', // Select template
  pricingRows: [...],
  images: [...],
  branding: {...}
}, translator);
```

### Without Template Selection (Unified Renderer)

```typescript
const html = renderOfferHtml({
  title: 'My Offer',
  companyName: 'My Company',
  bodyHtml: '<p>Content</p>',
  // No templateId - uses unified renderer
  pricingRows: [...],
  images: [...],
  branding: {...}
}, translator);
```

## Integration Points

### Share Page (`/offer/[token]`)

- Resolves template from offer inputs
- Passes templateId to renderer
- All 6 templates work correctly

### Preview API (`/api/offer-preview/render`)

- Accepts optional templateId parameter
- Uses template if provided
- Falls back to unified renderer if not

### AI Generate Route

- Stores templateId with offer
- Images are embedded in stored HTML
- Templates work when offers are displayed

## Testing

All templates have been verified to:

- ✅ Load correctly
- ✅ Render with proper styling
- ✅ Display images correctly
- ✅ Format pricing tables
- ✅ Handle all offer sections
- ✅ Work with branding colors
- ✅ Support responsive design
- ✅ Print correctly

## Migration Notes

- Old template system remains fully functional
- New unified renderer is used as fallback
- No breaking changes to existing functionality
- All 6 templates continue to work as before
