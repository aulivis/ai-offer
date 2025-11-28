/**
 * AI Response Cache
 *
 * Provides database-backed caching for AI-generated responses to reduce API costs
 * and improve latency for identical requests.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { createLogger } from '@/lib/logger';

export interface AiCacheConfig {
  ttlSeconds: number; // Time-to-live in seconds (default: 1 hour)
  maxCacheAgeSeconds?: number; // Maximum age before forcing refresh (optional)
}

export const DEFAULT_CACHE_CONFIG: AiCacheConfig = {
  ttlSeconds: 3600, // 1 hour
};

export interface CachedAiResponse {
  id: string;
  responseHtml: string;
  responseBlocks?: unknown;
  cachedAt: string;
  expiresAt: string;
  tokenCount?: number;
}

/**
 * Creates a hash of the request payload for cache key
 */
export function hashAiRequest(payload: unknown): string {
  const str = JSON.stringify(payload);
  return createHash('sha256').update(str).digest('hex');
}

/**
 * Creates a hash of the prompt content for tracking
 */
export function hashPrompt(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex');
}

/**
 * Gets a cached AI response if available and not expired
 */
export async function getCachedAiResponse(
  supabase: SupabaseClient,
  userId: string,
  requestHash: string,
  log?: ReturnType<typeof createLogger>,
): Promise<CachedAiResponse | null> {
  try {
    const { data, error } = await supabase
      .from('ai_response_cache')
      .select('id, response_html, response_blocks, cached_at, expires_at, token_count')
      .eq('request_hash', requestHash)
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('cached_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      log?.warn('Failed to get cached AI response', {
        error: error.message,
        requestHash,
        userId,
      });
      return null;
    }

    if (!data) {
      return null;
    }

    // Increment access count asynchronously (don't wait)
    void (async () => {
      try {
        await supabase.rpc('increment_cache_access', { cache_id: data.id });
      } catch (err) {
        log?.warn('Failed to increment cache access count', {
          error: err instanceof Error ? err : String(err),
          cacheId: data.id,
        });
      }
    })();

    log?.info('Cache hit for AI response', {
      requestHash,
      userId,
      cachedAt: data.cached_at,
    });

    return {
      id: data.id,
      responseHtml: data.response_html,
      responseBlocks: data.response_blocks || undefined,
      cachedAt: data.cached_at,
      expiresAt: data.expires_at,
      ...(typeof data.token_count === 'number' && { tokenCount: data.token_count }),
    };
  } catch (error) {
    log?.warn('Error getting cached AI response', {
      error: error instanceof Error ? error.message : String(error),
      requestHash,
      userId,
    });
    return null;
  }
}

/**
 * Stores an AI response in the cache
 */
export async function storeAiResponse(
  supabase: SupabaseClient,
  userId: string,
  requestHash: string,
  promptHash: string,
  responseHtml: string,
  config: AiCacheConfig = DEFAULT_CACHE_CONFIG,
  options?: {
    responseBlocks?: unknown;
    tokenCount?: number;
    model?: string;
  },
  log?: ReturnType<typeof createLogger>,
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + config.ttlSeconds);

    const { error } = await supabase.from('ai_response_cache').insert({
      request_hash: requestHash,
      user_id: userId,
      prompt_hash: promptHash,
      response_html: responseHtml,
      response_blocks: options?.responseBlocks || null,
      model: options?.model || 'gpt-4o-mini',
      token_count: options?.tokenCount || null,
      expires_at: expiresAt.toISOString(),
      access_count: 0,
    });

    if (error) {
      // If it's a unique constraint violation, that's okay - cache already exists
      if (error.code === '23505') {
        log?.info('AI response already cached', { requestHash, userId });
        return;
      }

      log?.warn('Failed to store AI response in cache', {
        error: error.message,
        requestHash,
        userId,
      });
    } else {
      log?.info('Stored AI response in cache', {
        requestHash,
        userId,
        expiresAt: expiresAt.toISOString(),
      });
    }
  } catch (error) {
    log?.warn('Error storing AI response in cache', {
      error: error instanceof Error ? error.message : String(error),
      requestHash,
      userId,
    });
    // Don't throw - cache failures shouldn't break the request
  }
}

/**
 * Invalidates cached responses for a user (useful when user updates preferences)
 */
export async function invalidateUserCache(
  supabase: SupabaseClient,
  userId: string,
  log?: ReturnType<typeof createLogger>,
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('ai_response_cache')
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (error) {
      log?.warn('Failed to invalidate user AI cache', {
        error: error.message,
        userId,
      });
      return 0;
    }

    const deletedCount = data?.length || 0;
    log?.info('Invalidated user AI cache', { userId, deletedCount });
    return deletedCount;
  } catch (error) {
    log?.warn('Error invalidating user AI cache', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    return 0;
  }
}

/**
 * Cleans up expired cache entries (should be called periodically via cron)
 */
export async function cleanupExpiredCache(
  supabase: SupabaseClient,
  log?: ReturnType<typeof createLogger>,
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_ai_cache');

    if (error) {
      log?.warn('Failed to cleanup expired AI cache', {
        error: error.message,
      });
      return 0;
    }

    const deletedCount = typeof data === 'number' ? data : 0;
    log?.info('Cleaned up expired AI cache entries', { deletedCount });
    return deletedCount;
  } catch (error) {
    log?.warn('Error cleaning up expired AI cache', {
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}
