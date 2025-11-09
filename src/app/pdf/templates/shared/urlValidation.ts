/**
 * URL validation utilities for PDF templates
 * Ensures all URLs are absolute for PDF generation compatibility
 */

/**
 * Check if a URL is absolute (starts with http:// or https://)
 */
export function isAbsoluteUrl(url: string): boolean {
  if (typeof url !== 'string' || !url.trim()) {
    return false;
  }

  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Convert a relative URL to absolute URL
 * Returns null if conversion is not possible
 */
export function toAbsoluteUrl(url: string, baseUrl: string = 'https://vyndi.hu'): string | null {
  if (isAbsoluteUrl(url)) {
    return url;
  }

  if (typeof url !== 'string' || !url.trim()) {
    return null;
  }

  try {
    return new URL(url.trim(), baseUrl).toString();
  } catch {
    return null;
  }
}

/**
 * Validate and sanitize image URL for PDF generation
 * Ensures URL is absolute and accessible
 */
export function validateImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  // Already validated as absolute URL
  if (isAbsoluteUrl(trimmed)) {
    return trimmed;
  }

  // Return null for relative URLs (they won't work in PDFs)
  return null;
}

/**
 * Validate all URLs in an image asset array
 */
export function validateImageAssets(
  images: Array<{ src: string; alt?: string; key?: string }> | null | undefined,
): Array<{ src: string; alt: string; key: string }> {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .filter((img) => img && typeof img === 'object' && typeof img.src === 'string')
    .map((img) => {
      const validUrl = validateImageUrl(img.src);
      if (!validUrl) {
        return null;
      }
      return {
        src: validUrl,
        alt: typeof img.alt === 'string' ? img.alt : '',
        key: typeof img.key === 'string' ? img.key : '',
      };
    })
    .filter((img): img is { src: string; alt: string; key: string } => img !== null);
}








