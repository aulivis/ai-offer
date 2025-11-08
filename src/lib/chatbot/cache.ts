/**
 * Response caching utilities for chatbot
 * 
 * Caches responses for similar queries to reduce API costs and improve latency.
 * Uses semantic similarity to match cached responses to new queries.
 */

import { createHash } from 'crypto';
import type { RetrievedDocument } from './retrieval';

interface CachedResponse {
  queryHash: string;
  response: string;
  documents: RetrievedDocument[];
  createdAt: Date;
  expiresAt: Date;
  hitCount: number;
}

// In-memory cache (for production, consider Redis)
const cache = new Map<string, CachedResponse>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 1000; // Maximum number of cached responses

/**
 * Generates a hash for a query based on its content and embedding.
 * 
 * @param query - User query
 * @param embedding - Query embedding vector (first 10 dimensions for hashing)
 * @returns Hash string
 */
export function getQueryHash(query: string, embedding: number[]): string {
  // Normalize query (lowercase, trim, remove extra spaces)
  const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Use first 10 dimensions of embedding for hash (for speed)
  const embeddingSlice = embedding.slice(0, 10).map(v => v.toFixed(2)).join(',');
  
  // Combine query and embedding slice
  const combined = normalizedQuery + '|' + embeddingSlice;
  
  // Generate SHA-256 hash
  return createHash('sha256').update(combined).digest('hex');
}

/**
 * Gets a cached response if available and not expired.
 * 
 * @param queryHash - Query hash
 * @returns Cached response or null
 */
export function getCachedResponse(queryHash: string): CachedResponse | null {
  const cached = cache.get(queryHash);
  if (!cached) {
    return null;
  }
  
  // Check if expired
  if (new Date() > cached.expiresAt) {
    cache.delete(queryHash);
    return null;
  }
  
  // Update hit count
  cached.hitCount = (cached.hitCount || 0) + 1;
  
  return cached;
}

/**
 * Stores a response in the cache.
 * 
 * @param queryHash - Query hash
 * @param response - Response text
 * @param documents - Retrieved documents
 */
export function setCachedResponse(
  queryHash: string,
  response: string,
  documents: RetrievedDocument[]
): void {
  // Clean up old cache entries if cache is full
  if (cache.size >= MAX_CACHE_SIZE) {
    cleanupCache();
  }
  
  cache.set(queryHash, {
    queryHash,
    response,
    documents,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + CACHE_TTL),
    hitCount: 0,
  });
}

/**
 * Cleans up old cache entries using LRU (Least Recently Used) strategy.
 */
function cleanupCache(): void {
  // Sort entries by hit count and creation date
  const entries = Array.from(cache.entries());
  entries.sort((a, b) => {
    // Prefer to keep entries with more hits
    const hitDiff = (b[1].hitCount || 0) - (a[1].hitCount || 0);
    if (hitDiff !== 0) return hitDiff;
    
    // If hits are equal, prefer newer entries
    return b[1].createdAt.getTime() - a[1].createdAt.getTime();
  });
  
  // Remove bottom 20% (least used)
  const removeCount = Math.floor(entries.length * 0.2);
  for (let i = entries.length - removeCount; i < entries.length; i++) {
    cache.delete(entries[i]![0]);
  }
}

/**
 * Clears all cache entries.
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Gets cache statistics.
 * 
 * @returns Cache statistics
 */
export function getCacheStats(): {
  size: number;
  hitRate: number;
  totalHits: number;
} {
  const entries = Array.from(cache.values());
  const totalHits = entries.reduce((sum, entry) => sum + (entry.hitCount || 0), 0);
  
  return {
    size: cache.size,
    hitRate: entries.length > 0 ? totalHits / entries.length : 0,
    totalHits,
  };
}

