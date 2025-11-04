import { TemplateTokens } from './types';

export function tokensToCssVars(tokens: TemplateTokens): string {
  const kv: Record<string, string> = {
    '--brand-primary': tokens.brand.primary,
    '--brand-secondary': tokens.brand.secondary,
    '--text-default': tokens.text.default,
    '--text-onPrimary': tokens.text.onPrimary,
    '--text-onSecondary': tokens.text.onSecondary,
    '--bg-canvas': tokens.bg.canvas,
    '--bg-section': tokens.bg.section,
    '--border-muted': tokens.border.muted,
  };
  // expose primary/secondary scale for utility CSS
  (['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const).forEach(
    (step) => {
      kv[`--primary-${step}`] = tokens.primary[step];
      kv[`--secondary-${step}`] = tokens.secondary[step];
    }
  );

  const lines = Object.entries(kv)
    .map(([k, v]) => `${k}:${v};`)
    .join('');
  return `:root{${lines}}`;
}
