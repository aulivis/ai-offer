/**
 * Font loading utilities for PDF templates
 * Ensures proper font fallbacks and preloading for better PDF rendering
 */

export const FONT_FALLBACKS = {
  sans: "'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, 'Liberation Sans', sans-serif",
  mono: "'Space Mono', 'Courier New', 'Courier', monospace",
  display: "'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
} as const;

/**
 * Generate font preload links for critical fonts
 * Note: Google Fonts loading is disabled for PDF generation to avoid network errors.
 * System fonts are used via fallbacks defined in FONT_FALLBACKS.
 */
export function generateFontPreloads(): string {
  // Return empty string - we rely on system fonts via CSS fallbacks
  // This prevents ERR_NAME_NOT_RESOLVED errors in PDF generation environments
  return '';
}

/**
 * Standardized line heights for better readability
 */
export const LINE_HEIGHTS = {
  tight: '1.2',
  normal: '1.5',
  relaxed: '1.65',
  loose: '1.8',
} as const;

/**
 * Standardized font sizes for consistent typography
 */
export const FONT_SIZES = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '0.95rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
} as const;

