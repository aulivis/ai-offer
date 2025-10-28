import type { Branding, ThemeTokens } from './types';

function normalizeBrandColor(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!/^#([0-9a-fA-F]{6})$/.test(trimmed)) {
    return null;
  }

  return `#${trimmed.slice(1).toLowerCase()}`;
}

function contrastColor(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? '#111827' : '#ffffff';
}

export function createThemeTokens(branding?: Branding): ThemeTokens {
  const primary = normalizeBrandColor(branding?.primaryColor) ?? '#0f172a';
  const secondary = normalizeBrandColor(branding?.secondaryColor) ?? '#f3f4f6';
  const contrast = contrastColor(primary);

  return {
    'color.primary': primary,
    'color.primary-contrast': contrast,
    'color.secondary': secondary,
    'color.secondary-border': '#d1d5db',
    'color.secondary-text': '#1f2937',
  } satisfies ThemeTokens;
}

export function normalizeBranding(branding?: Branding): Branding | undefined {
  if (!branding) {
    return undefined;
  }

  const primaryColor = normalizeBrandColor(branding.primaryColor ?? undefined);
  const secondaryColor = normalizeBrandColor(branding.secondaryColor ?? undefined);
  const logoUrl = typeof branding.logoUrl === 'string' ? branding.logoUrl.trim() : null;

  return {
    primaryColor: primaryColor ?? null,
    secondaryColor: secondaryColor ?? null,
    logoUrl: logoUrl && logoUrl.length > 0 ? logoUrl : null,
  } satisfies Branding;
}
