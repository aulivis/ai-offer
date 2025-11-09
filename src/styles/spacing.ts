/**
 * Spacing Scale Utility System
 *
 * Provides a consistent spacing scale based on 4px base unit (0.25rem)
 * This ensures visual consistency across the application.
 *
 * @module spacing
 *
 * @example
 * ```tsx
 * import { SPACING_SCALE, getSpacing, SPACING_PRESETS } from '@/styles/spacing';
 *
 * // Use spacing values
 * const padding = getSpacing('md'); // '1rem'
 * const gap = SPACING_SCALE.lg; // '1.5rem'
 *
 * // Use presets
 * const cardPadding = SPACING_PRESETS.cardPadding; // '1.5rem'
 * ```
 *
 * Usage:
 * - Use spacing tokens in Tailwind classes: `p-4`, `gap-6`, `mb-8`
 * - Use spacing values in inline styles: `style={{ padding: spacing.md }}`
 * - Use spacing scale in CSS custom properties
 */

export const SPACING_SCALE = {
  /** 4px (0.25rem) - Minimal spacing for tight layouts */
  xs: '0.25rem',
  /** 8px (0.5rem) - Small spacing for compact elements */
  sm: '0.5rem',
  /** 12px (0.75rem) - Small-medium spacing */
  'sm-md': '0.75rem',
  /** 16px (1rem) - Medium spacing (base unit) */
  md: '1rem',
  /** 24px (1.5rem) - Large spacing for sections */
  lg: '1.5rem',
  /** 32px (2rem) - Extra large spacing for major sections */
  xl: '2rem',
  /** 44px (2.75rem) - Touch target size (WCAG AAA) */
  '2xl': '2.75rem',
  /** 48px (3rem) - Extra extra large spacing */
  '3xl': '3rem',
  /** 64px (4rem) - Huge spacing for hero sections */
  '4xl': '4rem',
  /** 80px (5rem) - Maximum spacing for major dividers */
  '5xl': '5rem',
} as const;

export type SpacingScale = keyof typeof SPACING_SCALE;

/**
 * Get spacing value by key
 */
export function getSpacing(key: SpacingScale): string {
  return SPACING_SCALE[key];
}

/**
 * Spacing scale as CSS custom properties
 * Can be injected into :root for use in CSS
 */
export const SPACING_CSS_VARS = Object.entries(SPACING_SCALE)
  .map(([key, value]) => `--spacing-${key}: ${value};`)
  .join('\n  ');

/**
 * Tailwind-compatible spacing scale
 * Maps to Tailwind's spacing scale (0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24)
 *
 * Note: Tailwind uses rem units, so we align with Tailwind's default scale
 */
export const TAILWIND_SPACING = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
} as const;

/**
 * Common spacing combinations for consistent layouts
 */
export const SPACING_PRESETS = {
  /** Card padding: 1.5rem (24px) */
  cardPadding: SPACING_SCALE.lg,
  /** Section gap: 2rem (32px) */
  sectionGap: SPACING_SCALE.xl,
  /** Component gap: 1rem (16px) */
  componentGap: SPACING_SCALE.md,
  /** Tight gap: 0.5rem (8px) */
  tightGap: SPACING_SCALE.sm,
  /** Loose gap: 3rem (48px) */
  looseGap: SPACING_SCALE['3xl'],
  /** Touch target: 2.75rem (44px) - WCAG AAA */
  touchTarget: SPACING_SCALE['2xl'],
} as const;
