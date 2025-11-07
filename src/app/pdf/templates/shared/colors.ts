/**
 * Color system utilities for PDF templates
 * Ensures proper color handling for print and accessibility
 */

/**
 * Calculate relative luminance for WCAG contrast checking
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const v = val / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);
  
  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);
  
  const lum1 = getLuminance(r1, g1, b1);
  const lum2 = getLuminance(r2, g2, b2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
 */
export function meetsWCAGAA(foreground: string, background: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Convert hex color to grayscale for print optimization
 */
export function toGrayscale(hex: string): string {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  const grayHex = gray.toString(16).padStart(2, '0');
  return `#${grayHex}${grayHex}${grayHex}`;
}

/**
 * Ensure color is print-safe (has sufficient contrast in grayscale)
 */
export function ensurePrintSafe(foreground: string, background: string = '#ffffff'): string {
  const grayFg = toGrayscale(foreground);
  const grayBg = toGrayscale(background);
  
  if (!meetsWCAGAA(grayFg, grayBg)) {
    // Darken foreground if needed
    return '#000000';
  }
  
  return foreground;
}




