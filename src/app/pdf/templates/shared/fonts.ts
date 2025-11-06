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
 */
export function generateFontPreloads(): string {
  return `
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap" as="style" />
    <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  `;
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

