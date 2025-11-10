/**
 * Fluid Typography Utilities
 *
 * Provides fluid typography using clamp() for responsive font sizes.
 * Font sizes scale smoothly between breakpoints without media queries.
 *
 * @module fluidTypography
 *
 * @example
 * ```tsx
 * import { fluidFontSize, getFluidTypography } from '@/styles/fluidTypography';
 *
 * // Use fluid font size
 * const fontSize = fluidFontSize(16, 24, 320, 1920); // Scales from 16px to 24px
 *
 * // Get fluid typography scale
 * const h1Fluid = getFluidTypography('h1');
 * ```
 */

/**
 * Calculate fluid font size using clamp()
 *
 * @param minSize - Minimum font size in pixels (mobile)
 * @param maxSize - Maximum font size in pixels (desktop)
 * @param minViewport - Minimum viewport width in pixels (default: 320)
 * @param maxViewport - Maximum viewport width in pixels (default: 1920)
 * @returns CSS clamp() value
 *
 * @example
 * ```tsx
 * // Scale from 16px on mobile to 24px on desktop
 * const fontSize = fluidFontSize(16, 24);
 * // Returns: 'clamp(1rem, 0.875rem + 0.5vw, 1.5rem)'
 * ```
 */
export function fluidFontSize(
  minSize: number,
  maxSize: number,
  minViewport: number = 320,
  maxViewport: number = 1920,
): string {
  // Convert pixels to rem (assuming 16px base)
  const minRem = minSize / 16;
  const maxRem = maxSize / 16;

  // Calculate viewport width range
  const viewportRange = maxViewport - minViewport;
  const sizeRange = maxRem - minRem;

  // Calculate preferred value (vw-based)
  // Formula: preferred = min + (max - min) * ((100vw - minViewport) / (maxViewport - minViewport))
  // Simplified: preferred = min + sizeRange * (100vw - minViewport) / viewportRange
  // Convert to vw: preferred = min + sizeRange * 100vw / viewportRange - sizeRange * minViewport / viewportRange
  const vwMultiplier = (sizeRange * 100) / viewportRange;
  const vwOffset = minRem - (sizeRange * minViewport) / viewportRange;

  return `clamp(${minRem}rem, ${vwOffset}rem + ${vwMultiplier}vw, ${maxRem}rem)`;
}

/**
 * Fluid typography scale with responsive font sizes
 * Uses clamp() for smooth scaling between mobile and desktop
 */
export const FLUID_TYPOGRAPHY_SCALE = {
  /** Display text - Large hero headings (48px mobile â†’ 64px desktop) */
  display: {
    size: fluidFontSize(48, 64),
    lineHeight: '1.1',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  /** H1 - Main page headings (32px mobile â†’ 48px desktop) */
  h1: {
    size: fluidFontSize(32, 48),
    lineHeight: '1.2',
    fontWeight: '700',
    letterSpacing: '-0.01em',
  },
  /** H2 - Section headings (24px mobile â†’ 36px desktop) */
  h2: {
    size: fluidFontSize(24, 36),
    lineHeight: '1.25',
    fontWeight: '600',
    letterSpacing: '-0.005em',
  },
  /** H3 - Subsection headings (20px mobile â†’ 30px desktop) */
  h3: {
    size: fluidFontSize(20, 30),
    lineHeight: '1.3',
    fontWeight: '600',
    letterSpacing: '-0.0025em',
  },
  /** H4 - Minor headings (18px mobile â†’ 24px desktop) */
  h4: {
    size: fluidFontSize(18, 24),
    lineHeight: '1.35',
    fontWeight: '600',
    letterSpacing: '0',
  },
  /** H5 - Small headings (16px mobile â†’ 20px desktop) */
  h5: {
    size: fluidFontSize(16, 20),
    lineHeight: '1.4',
    fontWeight: '600',
    letterSpacing: '0',
  },
  /** H6 - Smallest headings (14px mobile â†’ 18px desktop) */
  h6: {
    size: fluidFontSize(14, 18),
    lineHeight: '1.4',
    fontWeight: '600',
    letterSpacing: '0',
  },
  /** Body large - Emphasis text (16px mobile â†’ 18px desktop) */
  bodyLarge: {
    size: fluidFontSize(16, 18),
    lineHeight: '1.6',
    fontWeight: '400',
    letterSpacing: '0',
  },
  /** Body - Default body text (14px mobile â†’ 16px desktop) */
  body: {
    size: fluidFontSize(14, 16),
    lineHeight: '1.6',
    fontWeight: '400',
    letterSpacing: '0',
  },
  /** Body small - Secondary text (12px mobile â†’ 14px desktop) */
  bodySmall: {
    size: fluidFontSize(12, 14),
    lineHeight: '1.5',
    fontWeight: '400',
    letterSpacing: '0',
  },
  /** Caption - Small labels and captions (11px mobile â†’ 12px desktop) */
  caption: {
    size: fluidFontSize(11, 12),
    lineHeight: '1.4',
    fontWeight: '400',
    letterSpacing: '0.01em',
  },
  /** UI large - Large UI text (16px mobile â†’ 18px desktop) */
  uiLarge: {
    size: fluidFontSize(16, 18),
    lineHeight: '1.5',
    fontWeight: '600',
    letterSpacing: '0',
  },
  /** UI - Default UI text (14px mobile â†’ 16px desktop) */
  ui: {
    size: fluidFontSize(14, 16),
    lineHeight: '1.5',
    fontWeight: '600',
    letterSpacing: '0',
  },
  /** UI small - Small UI text (12px mobile â†’ 14px desktop) */
  uiSmall: {
    size: fluidFontSize(12, 14),
    lineHeight: '1.4',
    fontWeight: '600',
    letterSpacing: '0',
  },
} as const;

export type FluidTypographyScale = keyof typeof FLUID_TYPOGRAPHY_SCALE;

/**
 * Get fluid typography value by key
 */
export function getFluidTypography(key: FluidTypographyScale) {
  return FLUID_TYPOGRAPHY_SCALE[key];
}

/**
 * Fluid spacing scale using clamp()
 * Spacing that scales smoothly between breakpoints
 */
export const FLUID_SPACING_SCALE = {
  /** 4px mobile â†’ 4px desktop */
  xs: fluidFontSize(4, 4),
  /** 6px mobile â†’ 8px desktop */
  sm: fluidFontSize(6, 8),
  /** 10px mobile â†’ 12px desktop */
  'sm-md': fluidFontSize(10, 12),
  /** 12px mobile â†’ 16px desktop */
  md: fluidFontSize(12, 16),
  /** 16px mobile â†’ 24px desktop */
  lg: fluidFontSize(16, 24),
  /** 20px mobile â†’ 32px desktop */
  xl: fluidFontSize(20, 32),
  /** 24px mobile â†’ 44px desktop */
  '2xl': fluidFontSize(24, 44),
  /** 28px mobile â†’ 56px desktop */
  '3xl': fluidFontSize(28, 56),
  /** 32px mobile â†’ 64px desktop */
  '4xl': fluidFontSize(32, 64),
  /** 40px mobile â†’ 80px desktop */
  '5xl': fluidFontSize(40, 80),
} as const;

/**
 * Get fluid spacing value by key
 */
export function getFluidSpacing(key: keyof typeof FLUID_SPACING_SCALE): string {
  return FLUID_SPACING_SCALE[key];
}

/**
 * Fluid typography as CSS custom properties
 * Can be injected into :root for use in CSS
 */
export const FLUID_TYPOGRAPHY_CSS_VARS = Object.entries(FLUID_TYPOGRAPHY_SCALE)
  .map(([key, value]) => {
    return `--fluid-typography-${key}-size: ${value.size};
  --fluid-typography-${key}-line-height: ${value.lineHeight};
  --fluid-typography-${key}-font-weight: ${value.fontWeight};
  --fluid-typography-${key}-letter-spacing: ${value.letterSpacing};`;
  })
  .join('\n  ');