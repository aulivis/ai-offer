/**
 * Color contrast utility functions for WCAG compliance
 *
 * Calculates contrast ratios and checks WCAG 2.1 compliance
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 * WCAG AAA requires 7:1 for normal text, 4.5:1 for large text
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance
 * Based on WCAG 2.1 formula: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 (no contrast) and 21 (maximum contrast)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return 1; // Invalid colors, assume no contrast
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA requirements
 */
export function meetsWCAGAA(color1: string, color2: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(color1, color2);
  // WCAG AA: 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt+ bold)
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA requirements
 */
export function meetsWCAGAAA(color1: string, color2: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(color1, color2);
  // WCAG AAA: 7:1 for normal text, 4.5:1 for large text
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Get contrast level description
 */
export function getContrastLevel(
  color1: string,
  color2: string,
  isLargeText = false,
): 'fail' | 'AA' | 'AAA' {
  if (meetsWCAGAAA(color1, color2, isLargeText)) {
    return 'AAA';
  }
  if (meetsWCAGAA(color1, color2, isLargeText)) {
    return 'AA';
  }
  return 'fail';
}

/**
 * Common color combinations to audit
 */
export type ColorPair = {
  foreground: string;
  background: string;
  name: string;
  isLargeText?: boolean;
};

/**
 * Audit color pairs for WCAG compliance
 */
export function auditColorPairs(pairs: ColorPair[]): Array<
  ColorPair & {
    contrastRatio: number;
    level: 'fail' | 'AA' | 'AAA';
    passesAA: boolean;
    passesAAA: boolean;
  }
> {
  return pairs.map((pair) => {
    const contrastRatio = getContrastRatio(pair.foreground, pair.background);
    const level = getContrastLevel(pair.foreground, pair.background, pair.isLargeText);
    const passesAA = meetsWCAGAA(pair.foreground, pair.background, pair.isLargeText);
    const passesAAA = meetsWCAGAAA(pair.foreground, pair.background, pair.isLargeText);

    return {
      ...pair,
      contrastRatio,
      level,
      passesAA,
      passesAAA,
    };
  });
}
