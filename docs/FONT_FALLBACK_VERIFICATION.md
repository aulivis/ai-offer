# Font Fallback Verification

This document explains how font fallbacks work in our PDF template system and how to verify they're functioning correctly.

## Font System Overview

Our template system uses a **system fonts with fallbacks** approach, which is recommended for PDF generation because:

1. **Reliability**: System fonts are always available, avoiding missing font issues
2. **Performance**: No need to download or embed fonts
3. **Compatibility**: Works across all PDF rendering engines
4. **File Size**: Smaller PDF files without embedded fonts

## Font Stack

Our default font stack is defined in `web/src/app/pdf/templates/shared/fonts.ts`:

```typescript
export const FONT_FALLBACKS = {
  sans: "'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, 'Liberation Sans', sans-serif",
  mono: "'Space Mono', 'Courier New', 'Courier', monospace",
  display: "'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
} as const;
```

### Font Fallback Chain

1. **Primary**: 'Work Sans' (if available)
2. **Fallback 1**: 'Segoe UI' (Windows)
3. **Fallback 2**: 'Helvetica Neue' (macOS/iOS)
4. **Fallback 3**: 'Arial' (Universal)
5. **Fallback 4**: 'Liberation Sans' (Linux)
6. **Generic**: sans-serif (browser default)

## How It Works

### CSS Implementation

Fonts are applied via CSS in `web/src/app/pdf/print.css.ts`:

```css
body {
  font-family: 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, 'Liberation Sans', sans-serif;
}
```

The browser/PDF engine will:
1. Try to use 'Work Sans' first
2. If not available, fall back to 'Segoe UI'
3. Continue down the chain until a font is found
4. Use the generic `sans-serif` as final fallback

### Font Preloading

**Current Implementation**: Font preloading is **disabled** for PDF generation to avoid network errors in headless environments.

```typescript
export function generateFontPreloads(): string {
  // Return empty string - we rely on system fonts via CSS fallbacks
  // This prevents ERR_NAME_NOT_RESOLVED errors in PDF generation environments
  return '';
}
```

This is the **correct approach** for PDF generation because:
- PDF engines in headless mode may not have network access
- System fonts are more reliable
- Fallback chain ensures fonts are always available

## Verification

### Manual Verification

1. **Check PDF Output**:
   - Generate a PDF
   - Open in a PDF viewer
   - Check that text renders correctly
   - Verify no missing font warnings

2. **Test on Different Systems**:
   - Windows: Should use 'Segoe UI' or 'Arial'
   - macOS: Should use 'Helvetica Neue' or 'Arial'
   - Linux: Should use 'Liberation Sans' or 'Arial'

3. **Check Font Rendering**:
   - Text should be clear and readable
   - No font substitution errors in console
   - Consistent rendering across pages

### Automated Verification

Run the font fallback tests:

```bash
npm test -- fontFallback
```

These tests verify:
- Font stack is correctly applied
- Fallback chain works
- No font loading errors
- Text renders correctly

### Visual Verification

Check that:
- ✅ Text is readable and clear
- ✅ Font sizes are consistent
- ✅ Line heights are appropriate
- ✅ No font substitution warnings
- ✅ Text doesn't overflow containers

## Common Issues

### Issue: Font Not Rendering

**Symptoms**: Text appears in default/system font

**Causes**:
1. Font name misspelled in CSS
2. Font not available on system
3. CSS not applied correctly

**Solution**:
1. Check font name spelling
2. Verify font fallback chain
3. Check CSS is included in template

### Issue: Font Loading Errors

**Symptoms**: Console errors about missing fonts

**Causes**:
1. Trying to load external fonts in headless mode
2. Font URL not accessible
3. Font format not supported

**Solution**:
1. Use system fonts with fallbacks (our current approach)
2. Don't use `@font-face` for external fonts
3. Rely on CSS font fallback chain

### Issue: Inconsistent Font Rendering

**Symptoms**: Fonts look different across systems

**Causes**:
1. Different system fonts on different platforms
2. Font metrics differ between fonts
3. Font rendering engine differences

**Solution**:
1. This is expected with system fonts
2. Use consistent font sizes and line heights
3. Test on target platforms
4. Consider embedding fonts if consistency is critical

## Best Practices

### 1. Always Use Font Fallbacks

```css
/* ✅ Good */
font-family: 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;

/* ❌ Bad */
font-family: 'Work Sans';
```

### 2. Test Font Rendering

- Test on different operating systems
- Verify fallback chain works
- Check for font substitution warnings

### 3. Use Consistent Font Sizes

```css
/* ✅ Good - Use relative units */
font-size: 11pt;
line-height: 1.6;

/* ⚠️ Avoid - Fixed pixel sizes may not scale well */
font-size: 12px;
```

### 4. Consider Font Embedding (Advanced)

If you need exact font consistency, you can embed fonts:

```css
@font-face {
  font-family: 'CustomFont';
  src: url('data:font/woff2;base64,...') format('woff2');
  font-weight: normal;
  font-style: normal;
}
```

**Note**: This increases PDF file size and requires font files to be available.

## Font Fallback Testing

### Test Cases

1. **Basic Rendering**: Verify text renders with fallback fonts
2. **Long Text**: Test with long paragraphs
3. **Special Characters**: Test with accented characters (é, ő, ü, etc.)
4. **Mixed Content**: Test with headings, body text, and code
5. **Print Output**: Verify fonts render correctly in PDF

### Test Script

```typescript
// Example test
describe('Font Fallback', () => {
  it('should render text with fallback fonts', async () => {
    const html = buildOfferHtml({...});
    const page = await browser.newPage();
    await page.setContent(html);
    
    const fontFamily = await page.evaluate(() => {
      const el = document.querySelector('body');
      return window.getComputedStyle(el!).fontFamily;
    });
    
    expect(fontFamily).toContain('Work Sans');
    expect(fontFamily).toContain('Segoe UI');
    expect(fontFamily).toContain('Arial');
  });
});
```

## Current Status

✅ **Font fallbacks are properly implemented**
✅ **System fonts used (reliable)**
✅ **Fallback chain is comprehensive**
✅ **No external font loading (prevents errors)**

## Recommendations

1. **Continue using system fonts**: Current approach is correct
2. **Monitor font rendering**: Check PDFs for font issues
3. **Test on target platforms**: Verify fonts work on user systems
4. **Consider font embedding**: Only if exact consistency is required

## Resources

- [Font Fallback Utilities](../src/app/pdf/templates/shared/fonts.ts)
- [Print CSS](../src/app/pdf/print.css.ts)
- [Template System Documentation](./templates.md)

