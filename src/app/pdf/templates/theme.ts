import { normalizeBrandHex, sanitizeBrandLogoUrl } from '@/lib/branding';
import type { Branding, ThemeTokens } from './types';

function contrastColor(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? '#0f172a' : '#ffffff';
}

export function createThemeTokens(baseTokens: ThemeTokens, branding?: Branding): ThemeTokens {
  const primary = normalizeBrandHex(branding?.primaryColor) ?? baseTokens.color.primary;
  const secondary = normalizeBrandHex(branding?.secondaryColor) ?? baseTokens.color.secondary;

  return {
    color: {
      ...baseTokens.color,
      primary,
      secondary,
    },
    spacing: { ...baseTokens.spacing },
    typography: { ...baseTokens.typography },
    radius: { ...baseTokens.radius },
  } satisfies ThemeTokens;
}

export function createThemeCssVariables(tokens: ThemeTokens): string {
  const primaryContrast = contrastColor(tokens.color.primary);
  
  // Ensure print-safe colors
  const printSafeText = ensurePrintSafeColor(tokens.color.text, tokens.color.bg);
  const printSafePrimary = ensurePrintSafeColor(tokens.color.primary, tokens.color.bg);

  const css = `
    .offer-doc {
      --brand-primary: ${tokens.color.primary};
      --brand-primary-contrast: ${primaryContrast};
      --brand-secondary: ${tokens.color.secondary};
      --brand-secondary-border: ${tokens.color.border};
      --brand-secondary-text: ${tokens.color.muted};
      --brand-muted: ${tokens.color.muted};
      --brand-text: ${tokens.color.text};
      --brand-bg: ${tokens.color.bg};
      --brand-border: ${tokens.color.border};
      --text: ${printSafeText};
      --muted: ${tokens.color.muted};
      --border: ${tokens.color.border};
      --bg: ${tokens.color.bg};
      --space-xs: ${tokens.spacing.xs};
      --space-sm: ${tokens.spacing.sm};
      --space-md: ${tokens.spacing.md};
      --space-lg: ${tokens.spacing.lg};
      --space-xl: ${tokens.spacing.xl};
      --font-body: ${tokens.typography.body};
      --font-h1: ${tokens.typography.h1};
      --font-h2: ${tokens.typography.h2};
      --font-h3: ${tokens.typography.h3};
      --font-table: ${tokens.typography.table};
      --radius-sm: ${tokens.radius.sm};
      --radius-md: ${tokens.radius.md};
      --radius-lg: ${tokens.radius.lg};
    }
    
    @media print {
      .offer-doc {
        --text: ${printSafeText};
        --brand-primary: ${printSafePrimary};
      }
    }
  `;

  return css.trim();
}

/**
 * Ensure color is print-safe (simplified version)
 */
function ensurePrintSafeColor(color: string, background: string = '#ffffff'): string {
  try {
    // Basic check - if color is too light, darken it
    let hex = color.replace('#', '');
    
    // Handle 3-character hex codes
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    if (hex.length !== 6) {
      return color; // Return original if invalid
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // If too light, return darker version
    if (brightness > 200) {
      return '#000000';
    }
    
    return color;
  } catch {
    return color; // Return original on error
  }
}

export function normalizeBranding(branding?: Branding): Branding | undefined {
  if (!branding) {
    return undefined;
  }

  const primaryColor = normalizeBrandHex(branding.primaryColor ?? undefined);
  const secondaryColor = normalizeBrandHex(branding.secondaryColor ?? undefined);
  const logoUrl = sanitizeBrandLogoUrl(branding.logoUrl ?? null);

  return {
    primaryColor: primaryColor ?? null,
    secondaryColor: secondaryColor ?? null,
    logoUrl,
  } satisfies Branding;
}
