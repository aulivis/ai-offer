import { describe, expect, it } from 'vitest';

import { buildTokens } from '../tokens';
import type { BrandInput } from '../types';

const defaultBrand: BrandInput = {
  name: 'Test Brand',
  primaryHex: '#336699',
  secondaryHex: '#993366',
};

function createBrand(overrides: Partial<BrandInput> = {}): BrandInput {
  return { ...defaultBrand, ...overrides };
}

const HEX_PATTERN = /^#?([0-9a-f]{6})$/i;

function normalizeHex(input: string) {
  const match = HEX_PATTERN.exec(input.trim());
  if (!match) {
    throw new Error('Invalid hex color');
  }
  return `#${match[1].toUpperCase()}`;
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex);
  const value = normalized.replace('#', '');
  const bigint = parseInt(value, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r, g, b].map((v) => {
    const channel = v / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(foreground: string, background: string) {
  const L1 = luminance(foreground);
  const L2 = luminance(background);
  const [max, min] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (max + 0.05) / (min + 0.05);
}

describe('buildTokens', () => {
  it('normalizes short and long hex values', () => {
    const tokens = buildTokens(
      createBrand({ primaryHex: 'abc', secondaryHex: '123456' }),
    );

    expect(tokens.primary['500']).toBe('#aabbcc');
    expect(tokens.secondary['500']).toBe('#123456');
  });

  it('throws when hex input is invalid', () => {
    expect(() =>
      buildTokens(createBrand({ primaryHex: 'not-a-color' })),
    ).toThrowError('Invalid hex color: not-a-color');
  });

  it('guarantees minimum contrast for onPrimary/onSecondary', () => {
    const tokens = buildTokens(
      createBrand({ primaryHex: '#ffffff', secondaryHex: '#000000' }),
    );

    const primaryContrast = contrastRatio(tokens.text.onPrimary, tokens.brand.primary);
    const secondaryContrast = contrastRatio(
      tokens.text.onSecondary,
      tokens.brand.secondary,
    );

    expect(primaryContrast).toBeGreaterThanOrEqual(4.5);
    expect(secondaryContrast).toBeGreaterThanOrEqual(4.5);
  });

  it('falls back to full black when needed to pass contrast', () => {
    const tokens = buildTokens(createBrand({ primaryHex: '#888888' }));

    expect(tokens.brand.primary).toBe('#787878');
    expect(tokens.text.onPrimary).toBe('#000000');
    expect(contrastRatio(tokens.text.onPrimary, tokens.brand.primary)).toBeGreaterThanOrEqual(4.5);
  });

  it('generates full scales for primary and secondary', () => {
    const tokens = buildTokens(defaultBrand);

    expect(Object.keys(tokens.primary)).toHaveLength(10);
    expect(Object.keys(tokens.secondary)).toHaveLength(10);
  });
});
