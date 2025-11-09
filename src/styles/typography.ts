/**
 * Typography Scale Utility System
 *
 * Provides a consistent typography scale for headings, body text, and UI elements.
 * Based on a modular scale with consistent line heights and font weights.
 *
 * @module typography
 *
 * @example
 * ```tsx
 * import { TYPOGRAPHY_SCALE, getTypography } from '@/styles/typography';
 * import { Heading, H1, H2 } from '@/components/ui/Heading';
 *
 * // Use Heading component
 * <H1>Main Title</H1>
 * <H2>Section Title</H2>
 *
 * // Use typography values directly
 * const h1Style = getTypography('h1');
 * ```
 *
 * Usage:
 * - Use typography tokens in Tailwind classes: `text-2xl`, `text-base`, `font-semibold`
 * - Use typography values in inline styles: `style={{ fontSize: typography.h1.size }}`
 * - Use typography scale in CSS custom properties
 */

export const TYPOGRAPHY_SCALE = {
  /** Display text - Large hero headings */
  display: {
    size: '4rem', // 64px
    lineHeight: '1.1',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  /** H1 - Main page headings */
  h1: {
    size: '3rem', // 48px
    lineHeight: '1.2',
    fontWeight: '700',
    letterSpacing: '-0.01em',
  },
  /** H2 - Section headings */
  h2: {
    size: '2.25rem', // 36px
    lineHeight: '1.25',
    fontWeight: '600',
    letterSpacing: '-0.005em',
  },
  /** H3 - Subsection headings */
  h3: {
    size: '1.875rem', // 30px
    lineHeight: '1.3',
    fontWeight: '600',
    letterSpacing: '-0.0025em',
  },
  /** H4 - Minor headings */
  h4: {
    size: '1.5rem', // 24px
    lineHeight: '1.35',
    fontWeight: '600',
    letterSpacing: '0',
  },
  /** H5 - Small headings */
  h5: {
    size: '1.25rem', // 20px
    lineHeight: '1.4',
    fontWeight: '600',
    letterSpacing: '0',
  },
  /** H6 - Smallest headings */
  h6: {
    size: '1.125rem', // 18px
    lineHeight: '1.4',
    fontWeight: '600',
    letterSpacing: '0',
  },
  /** Body large - Emphasis text */
  bodyLarge: {
    size: '1.125rem', // 18px
    lineHeight: '1.6',
    fontWeight: '400',
    letterSpacing: '0',
  },
  /** Body - Default body text */
  body: {
    size: '1rem', // 16px
    lineHeight: '1.6',
    fontWeight: '400',
    letterSpacing: '0',
  },
  /** Body small - Secondary text */
  bodySmall: {
    size: '0.875rem', // 14px
    lineHeight: '1.5',
    fontWeight: '400',
    letterSpacing: '0',
  },
  /** Caption - Small labels and captions */
  caption: {
    size: '0.75rem', // 12px
    lineHeight: '1.4',
    fontWeight: '400',
    letterSpacing: '0.01em',
  },
  /** UI large - Large UI text (buttons, etc.) */
  uiLarge: {
    size: '1.125rem', // 18px
    lineHeight: '1.5',
    fontWeight: '600',
    letterSpacing: '0',
  },
  /** UI - Default UI text */
  ui: {
    size: '1rem', // 16px
    lineHeight: '1.5',
    fontWeight: '600',
    letterSpacing: '0',
  },
  /** UI small - Small UI text */
  uiSmall: {
    size: '0.875rem', // 14px
    lineHeight: '1.4',
    fontWeight: '600',
    letterSpacing: '0',
  },
} as const;

export type TypographyScale = keyof typeof TYPOGRAPHY_SCALE;

/**
 * Get typography value by key
 */
export function getTypography(key: TypographyScale) {
  return TYPOGRAPHY_SCALE[key];
}

/**
 * Typography scale as CSS custom properties
 * Can be injected into :root for use in CSS
 */
export const TYPOGRAPHY_CSS_VARS = Object.entries(TYPOGRAPHY_SCALE)
  .map(([key, value]) => {
    return `--typography-${key}-size: ${value.size};
  --typography-${key}-line-height: ${value.lineHeight};
  --typography-${key}-font-weight: ${value.fontWeight};
  --typography-${key}-letter-spacing: ${value.letterSpacing};`;
  })
  .join('\n  ');

/**
 * Font weight scale
 */
export const FONT_WEIGHTS = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/**
 * Line height scale
 */
export const LINE_HEIGHTS = {
  tight: '1.2',
  snug: '1.3',
  normal: '1.5',
  relaxed: '1.6',
  loose: '1.8',
} as const;

/**
 * Letter spacing scale
 */
export const LETTER_SPACING = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;
