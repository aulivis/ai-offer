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

export function createThemeTokens(baseTokens: ThemeTokens, branding?: Branding): ThemeTokens {
  const primary = normalizeBrandColor(branding?.primaryColor) ?? baseTokens.color.primary;
  const secondary = normalizeBrandColor(branding?.secondaryColor) ?? baseTokens.color.secondary;

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
  `;

  return css.trim();
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
