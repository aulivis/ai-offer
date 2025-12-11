# Template System Architecture Review

## Current Flow

1. **Template Selection**: User selects template in Settings → stored in `profiles.offer_template`
2. **Offer Creation**:
   - User creates offer → `/api/ai-generate` called
   - AI generates body HTML (`ai_text`)
   - Template ID resolved from profile → stored in `inputs.templateId`
   - Only body HTML stored, not full template HTML
3. **Offer Rendering**:
   - When sharing → `buildOfferHtmlWithFallback` called
   - Takes stored `ai_text` and wraps in template
   - Template resolved from `inputs.templateId` or `profile.offer_template`

## Issues Identified

### 1. Template Not Explicitly Passed During Creation

**Location**: `web/src/app/(dashboard)/dashboard/offers/new/page.tsx:390-408`

The new offer page doesn't pass `templateId` to `/api/ai-generate`. It relies on profile template resolution, which works but isn't explicit.

**Recommendation**: Pass `templateId` explicitly from the UI if user can select template per-offer, or document that profile template is always used.

### 2. Two HTML Rendering Systems

**Location**:

- Legacy: `web/src/app/lib/offerDocument.ts` (uses CSS classes like `.offer-doc`)
- New: `web/src/app/pdf/templates/html/*.html` (uses Handlebars)

**Issue**: These systems might conflict or produce inconsistent output.

**Recommendation**:

- Migrate all templates to the new HTML template system
- Deprecate `offerBodyMarkup` function
- Ensure all rendering paths use `buildOfferHtml`

### 3. Template Rendering Happens Late

**Current**: Full template HTML only generated when sharing/viewing

**Recommendation**: Consider generating full template HTML at creation time for:

- Better preview consistency
- Faster sharing (no template resolution needed)
- Easier debugging

**Trade-off**: More storage, but better UX and consistency.

### 4. Preview vs Final Render

**Current**: Preview uses `/api/offer-preview/render` which correctly uses templates, but final offer rendering might differ.

**Recommendation**: Ensure preview and final render use identical code paths.

## Best Practices Assessment

### ✅ Good Practices

1. **Centralized Template Resolution**
   - `resolveOfferTemplate` in `web/src/lib/offers/templateResolution.ts`
   - Handles fallbacks properly
   - Respects plan tiers

2. **Template Versioning**
   - Supports `template@version` format
   - Allows template evolution

3. **Separation of Concerns**
   - AI generates content
   - Templates wrap content
   - Clear boundaries

4. **Template Selection in Settings**
   - User preference stored
   - Applied consistently

### ⚠️ Areas for Improvement

1. **Explicit Template Passing**
   - Make template selection explicit in offer creation flow
   - Consider per-offer template override

2. **Unified Rendering System**
   - Migrate from legacy `offerBodyMarkup` to new HTML templates
   - Single source of truth for rendering

3. **Template Rendering Timing**
   - Consider generating full HTML at creation
   - Or ensure consistent rendering at all stages

4. **Template Engine Robustness**
   - Fixed: HTML comments removal
   - Fixed: Nested conditionals
   - Fixed: Variable resolution
   - Consider: Using a proper Handlebars library instead of custom engine

## Recommended Improvements

### Priority 1: Ensure Consistency

1. **Unify Rendering Paths**

   ```typescript
   // All rendering should go through:
   buildOfferHtml({
     offer: { ...offerData, bodyHtml: aiText },
     rows: pricingRows,
     branding: brandingOptions,
     i18n: translator,
     templateId: resolvedTemplateId,
   });
   ```

2. **Explicit Template in Offer Creation**
   ```typescript
   // In new offer page, explicitly pass templateId
   const response = await fetchWithSupabaseAuth('/api/ai-generate', {
     body: JSON.stringify({
       // ... other fields
       templateId: selectedTemplateId || profileTemplateId,
     }),
   });
   ```

### Priority 2: Migration

1. **Deprecate Legacy System**
   - Mark `offerBodyMarkup` as deprecated
   - Migrate any remaining usages to `buildOfferHtml`
   - Remove legacy code after migration

2. **Template Engine Enhancement**
   - Consider using `handlebars` npm package for more robust template processing
   - Or improve custom engine with better error handling

### Priority 3: Optimization

1. **Template HTML Caching**
   - Cache rendered template HTML for faster sharing
   - Invalidate on template/offer updates

2. **Template Validation**
   - Validate template syntax at registration
   - Test templates with sample data

## Conclusion

The architecture is **fundamentally sound** with good separation of concerns and centralized template resolution. The main issues are:

1. **Consistency**: Ensure all rendering paths use the same system
2. **Explicitness**: Make template selection more explicit in the UI
3. **Unification**: Migrate from legacy to new template system

The template engine fixes we just implemented address the immediate rendering issues. The architectural improvements above would make the system more robust and maintainable long-term.
