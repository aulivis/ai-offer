/**
 * Utilities for refreshing expired Supabase signed URLs in HTML content
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const BRAND_ASSETS_BUCKET = 'brand-assets';
const SIGNED_URL_TTL_SECONDS = 3600; // 1 hour

/**
 * Extracts storage path from a Supabase signed URL
 * @param signedUrl - Supabase signed URL
 * @returns Storage path (e.g., "userId/brand-logo.png") or null if extraction fails
 */
export function extractStoragePathFromSignedUrl(signedUrl: string): string | null {
  try {
    const url = new URL(signedUrl);

    // Supabase signed URLs typically have format:
    // https://{project}.supabase.co/storage/v1/object/sign/{bucket}/{path}?token=...
    const pathMatch = url.pathname.match(/\/object\/sign\/([^/]+)\/(.+)$/);
    if (pathMatch && pathMatch[2]) {
      // Decode URL encoding
      const path = decodeURIComponent(pathMatch[2]);
      return path;
    }

    // Try alternative format: /object/public/{bucket}/{path}
    const publicMatch = url.pathname.match(/\/object\/public\/([^/]+)\/(.+)$/);
    if (publicMatch && publicMatch[2]) {
      const path = decodeURIComponent(publicMatch[2]);
      return path;
    }

    return null;
  } catch (error) {
    logger.debug('Failed to extract storage path from signed URL', {
      error: error instanceof Error ? error.message : String(error),
      url: signedUrl.substring(0, 100),
    });
    return null;
  }
}

/**
 * Checks if a URL is a Supabase signed URL
 * @param url - URL to check
 * @returns True if it's a Supabase signed URL
 */
export function isSupabaseSignedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.includes('supabase.co') &&
      (parsed.pathname.includes('/object/sign/') || parsed.pathname.includes('/object/public/'))
    );
  } catch {
    return false;
  }
}

/**
 * Refreshes expired Supabase signed URLs in HTML content
 * Replaces signed URLs with fresh ones to prevent expiration issues
 *
 * @param html - HTML content that may contain expired signed URLs
 * @param supabase - Supabase client instance
 * @param bucket - Storage bucket name (default: 'brand-assets')
 * @returns HTML with refreshed signed URLs
 */
export async function refreshSignedUrlsInHtml(
  html: string,
  supabase: SupabaseClient,
  bucket: string = BRAND_ASSETS_BUCKET,
): Promise<string> {
  if (!html || typeof html !== 'string') {
    return html;
  }

  // Find all img tags with src attributes
  const imgTagRegex = /<img\b[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi;
  const matches = Array.from(html.matchAll(imgTagRegex));

  if (matches.length === 0) {
    return html;
  }

  let updatedHtml = html;
  const urlReplacements = new Map<string, string>();

  // Process each image URL
  for (const match of matches) {
    const oldUrl = match[1]!;

    // Skip if not a Supabase signed URL
    if (!isSupabaseSignedUrl(oldUrl)) {
      continue;
    }

    // Check if we've already processed this URL
    if (urlReplacements.has(oldUrl)) {
      const newUrl = urlReplacements.get(oldUrl)!;
      // Use a more specific replacement to avoid replacing URLs in other contexts
      updatedHtml = updatedHtml.replace(
        new RegExp(`src=["']${escapeRegex(oldUrl)}["']`, 'gi'),
        `src="${newUrl}"`,
      );
      continue;
    }

    // Extract storage path
    const storagePath = extractStoragePathFromSignedUrl(oldUrl);
    if (!storagePath) {
      logger.debug('Could not extract storage path from signed URL', {
        url: oldUrl.substring(0, 100),
      });
      continue;
    }

    // Generate fresh signed URL
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

      if (error || !data?.signedUrl) {
        logger.debug('Failed to generate fresh signed URL', {
          storagePath,
          error: error?.message,
        });
        continue;
      }

      const newUrl = data.signedUrl;
      urlReplacements.set(oldUrl, newUrl);

      // Replace the URL in the HTML using a more specific pattern
      // This ensures we only replace the src attribute, not other occurrences
      updatedHtml = updatedHtml.replace(
        new RegExp(`src=["']${escapeRegex(oldUrl)}["']`, 'gi'),
        `src="${newUrl}"`,
      );
    } catch (error) {
      logger.debug('Error refreshing signed URL', {
        storagePath,
        error: error instanceof Error ? error.message : String(error),
      });
      // Continue with other URLs even if one fails
    }
  }

  return updatedHtml;
}

/**
 * Escapes special regex characters in a string
 * @param str - String to escape
 * @returns Escaped string safe for use in regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
