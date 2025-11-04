import { BrandInput, TemplateTokens, TokenScale } from './types';

// naive tint/shade derivation helper
function clamp(n: number, min = 0, max = 255) {
  return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex: string) {
  const m = hex.replace('#', '');
  const bigint = parseInt(m, 16);
  if (m.length === 3) {
    const r = parseInt(m[0] + m[0], 16);
    const g = parseInt(m[1] + m[1], 16);
    const b = parseInt(m[2] + m[2], 16);
    return { r, g, b };
  }
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    '#' +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

function mix({ r, g, b }: { r: number; g: number; b: number }, p: number) {
  // p in [-1..1]
  const base = p >= 0 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  const t = Math.abs(p);
  const rr = clamp(Math.round(r * (1 - t) + base.r * t));
  const gg = clamp(Math.round(g * (1 - t) + base.g * t));
  const bb = clamp(Math.round(b * (1 - t) + base.b * t));
  return { r: rr, g: gg, b: bb };
}

function buildScale(hex: string): TokenScale {
  const rgb = hexToRgb(hex);
  return {
    '50': rgbToHex(...(Object.values(mix(rgb, +0.85)) as [number, number, number])),
    '100': rgbToHex(...(Object.values(mix(rgb, +0.72)) as [number, number, number])),
    '200': rgbToHex(...(Object.values(mix(rgb, +0.55)) as [number, number, number])),
    '300': rgbToHex(...(Object.values(mix(rgb, +0.35)) as [number, number, number])),
    '400': rgbToHex(...(Object.values(mix(rgb, +0.18)) as [number, number, number])),
    '500': rgbToHex(...(Object.values(rgb) as [number, number, number])),
    '600': rgbToHex(...(Object.values(mix(rgb, -0.12)) as [number, number, number])),
    '700': rgbToHex(...(Object.values(mix(rgb, -0.24)) as [number, number, number])),
    '800': rgbToHex(...(Object.values(mix(rgb, -0.36)) as [number, number, number])),
    '900': rgbToHex(...(Object.values(mix(rgb, -0.5)) as [number, number, number])),
  };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const sr = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sr[0] + 0.7152 * sr[1] + 0.0722 * sr[2];
}

function contrastRatio(fg: string, bg: string) {
  const L1 = luminance(fg);
  const L2 = luminance(bg);
  const [max, min] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (max + 0.05) / (min + 0.05);
}

function pickTextOn(bg: string) {
  // choose black or white for minimal good contrast
  const black = '#111111';
  const white = '#FFFFFF';
  return contrastRatio(black, bg) >= contrastRatio(white, bg) ? black : white;
}

export function buildTokens(brand: BrandInput): TemplateTokens {
  const primary = buildScale(brand.primaryHex);
  const secondary = buildScale(brand.secondaryHex);
  const brandPrimary = primary['600'];
  const brandSecondary = secondary['600'];

  return {
    brand: { primary: brandPrimary, secondary: brandSecondary },
    primary,
    secondary,
    text: {
      default: '#111111',
      onPrimary: pickTextOn(brandPrimary),
      onSecondary: pickTextOn(brandSecondary),
    },
    bg: {
      canvas: '#FFFFFF',
      section: primary['50'],
    },
    border: { muted: '#E6E6E6' },
    font: { family: 'Inter', weight: { regular: 400, medium: 500, bold: 700 } },
  };
}
