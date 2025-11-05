import type { SupabaseClient } from '@supabase/supabase-js';

const HEX_COLOR_PATTERN = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
const BRAND_ASSETS_BUCKET = 'brand-assets';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour for PDF generation and UI display

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

/**
 * Validates and sanitizes a brand logo storage path.
 * Path format: "{userId}/brand-logo.{extension}"
 */
export function sanitizeBrandLogoPath(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  // Validate path format: should match "{uuid}/brand-logo.{ext}"
  const pathPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/brand-logo\.(png|jpg|jpeg|svg)$/i;
  if (!pathPattern.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Validates and sanitizes a brand logo URL (for backward compatibility).
 * @deprecated Use sanitizeBrandLogoPath and generate signed URLs on-demand instead.
 */
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

/**
 * Generates a signed URL for a brand logo storage path.
 * This function should be called on-demand to avoid expiration issues.
 *
 * @param supabase - Supabase client instance
 * @param logoPath - Storage path (e.g., "{userId}/brand-logo.png")
 * @param ttlSeconds - Time to live in seconds (default: 1 hour)
 * @returns Signed URL or null if generation fails
 */
export async function getBrandLogoSignedUrl(
  supabase: SupabaseClient,
  logoPath: string | null | undefined,
  ttlSeconds: number = SIGNED_URL_TTL_SECONDS,
): Promise<string | null> {
  if (!logoPath) {
    return null;
  }

  const sanitizedPath = sanitizeBrandLogoPath(logoPath);
  if (!sanitizedPath) {
    // Fallback: try to handle legacy URLs
    const legacyUrl = sanitizeBrandLogoUrl(logoPath);
    return legacyUrl;
  }

  try {
    const { data, error } = await supabase.storage
      .from(BRAND_ASSETS_BUCKET)
      .createSignedUrl(sanitizedPath, ttlSeconds);

    if (error || !data?.signedUrl) {
      console.error('Failed to generate signed URL for logo:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error generating signed URL for logo:', error);
    return null;
  }
}

/**
 * Gets brand logo URL, preferring path-based signed URL generation.
 * Falls back to legacy URL if path is not available.
 *
 * @param supabase - Supabase client instance
 * @param logoPath - Storage path (preferred)
 * @param legacyUrl - Legacy signed URL (fallback)
 * @returns Signed URL or null
 */
export async function getBrandLogoUrl(
  supabase: SupabaseClient,
  logoPath: string | null | undefined,
  legacyUrl: string | null | undefined = null,
): Promise<string | null> {
  // Try path-based signed URL first
  if (logoPath) {
    const signedUrl = await getBrandLogoSignedUrl(supabase, logoPath);
    if (signedUrl) {
      return signedUrl;
    }
  }

  // Fallback to legacy URL (for backward compatibility during migration)
  if (legacyUrl) {
    const sanitized = sanitizeBrandLogoUrl(legacyUrl);
    if (sanitized) {
      return sanitized;
    }
  }

  return null;
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
