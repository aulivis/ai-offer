/**
 * Shared utilities for Supabase Storage bucket management
 *
 * This module provides reusable functions for common storage bucket operations
 * to reduce code duplication across storage-related API routes.
 */

import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';

export interface BucketConfig {
  id: string;
  public: boolean;
  fileSizeLimit: number;
  allowedMimeTypes: readonly string[];
}

export interface EnsureBucketOptions {
  bucketId: string;
  config: BucketConfig;
  cache?: {
    exists: boolean;
    timestamp: number;
  } | null;
  cacheTtlMs?: number;
}

const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Ensures a storage bucket exists with the specified configuration.
 * Uses caching to avoid repeated checks within the cache TTL.
 *
 * @param options - Bucket configuration and cache options
 * @returns Promise that resolves when bucket is ensured
 * @throws Error if bucket operations fail
 */
export async function ensureBucketExists(options: EnsureBucketOptions): Promise<void> {
  const { bucketId, config, cache = null, cacheTtlMs = DEFAULT_CACHE_TTL_MS } = options;

  // Check cache first
  const now = Date.now();
  if (cache && now - cache.timestamp < cacheTtlMs) {
    if (cache.exists) {
      // Cache says bucket exists, skip check
      return;
    }
    // If cache says bucket doesn't exist, still try to create it
    // (bucket might have been created by another instance)
  }

  const adminClient = supabaseServiceRole();
  const { data: bucket, error } = await adminClient.storage.getBucket(bucketId);

  if (error && !error.message?.toLowerCase().includes('not found')) {
    // Don't cache errors - retry next time
    throw new Error(`Failed to retrieve bucket configuration: ${error.message}`);
  }

  if (!bucket) {
    // Bucket doesn't exist, create it
    const { error: createError } = await adminClient.storage.createBucket(bucketId, {
      public: config.public,
      fileSizeLimit: String(config.fileSizeLimit),
      allowedMimeTypes: [...config.allowedMimeTypes],
    });

    if (createError) {
      // Don't cache creation errors
      throw new Error(`Failed to create bucket: ${createError.message}`);
    }

    // Cache successful creation
    if (cache) {
      cache.exists = true;
      cache.timestamp = now;
    }
    return;
  }

  // Bucket exists, verify configuration matches
  const allowedSet = new Set(bucket.allowed_mime_types ?? []);
  const needsUpdate =
    bucket.public !== config.public ||
    Number(bucket.file_size_limit ?? config.fileSizeLimit) !== config.fileSizeLimit ||
    config.allowedMimeTypes.some((type) => !allowedSet.has(type));

  if (needsUpdate) {
    const { error: updateError } = await adminClient.storage.updateBucket(bucketId, {
      public: config.public,
      fileSizeLimit: String(config.fileSizeLimit),
      allowedMimeTypes: [...config.allowedMimeTypes],
    });

    if (updateError) {
      throw new Error(`Failed to update bucket configuration: ${updateError.message}`);
    }
  }

  // Cache successful check
  if (cache) {
    cache.exists = true;
    cache.timestamp = now;
  }
}

/**
 * Creates a cache object for bucket existence checks.
 * This can be shared across requests within the same server instance.
 */
export function createBucketCache(): { exists: boolean; timestamp: number } | null {
  return null; // Return null to disable caching, or create a cache object
}
