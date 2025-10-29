const HEX_COLOR_PATTERN = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;

function expandShortHex(hex: string): string {
  if (hex.length !== 4) {
    return hex.toLowerCase();
  }

  const [r, g, b] = [hex[1]!, hex[2]!, hex[3]!];
  return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
}

export function normalizeBrandHex(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!HEX_COLOR_PATTERN.test(trimmed)) {
    return null;
  }

  if (trimmed.length === 4) {
    return expandShortHex(trimmed);
  }

  return `#${trimmed.slice(1).toLowerCase()}`;
}

export function sanitizeBrandLogoUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

const DEFAULT_MONOGRAM = 'AI';

export function deriveBrandMonogram(value: string | null | undefined): string {
  if (typeof value !== 'string') {
    return DEFAULT_MONOGRAM;
  }

  const tokens = value
    .trim()
    .split(/[\s,.;:/\\-]+/)
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    return DEFAULT_MONOGRAM;
  }

  const initials = tokens
    .slice(0, 2)
    .map((token) => token[0]!.toUpperCase())
    .join('');

  return initials || DEFAULT_MONOGRAM;
}

export const HEX_COLOR_REGEX = HEX_COLOR_PATTERN;
