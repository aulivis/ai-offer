/**
 * Query re-ranking utilities for improved retrieval quality
 *
 * Uses cross-encoder models to re-rank retrieved documents for better relevance.
 * Cross-encoders are slower but more accurate than bi-encoders for ranking.
 */

import type { RetrievedDocument } from './retrieval';

/**
 * Re-ranks documents using a simple scoring mechanism.
 *
 * For production, consider using a cross-encoder model like:
 * - @xenova/transformers with cross-encoder-ms-marco-MiniLM-L-6-v2
 * - OpenAI's embedding API with reranking
 * - Cohere's rerank API
 *
 * @param query - User query
 * @param documents - Retrieved documents to re-rank
 * @param topK - Number of top documents to return
 * @returns Re-ranked documents
 */
export async function rerankDocuments(
  query: string,
  documents: RetrievedDocument[],
  topK: number = 5,
): Promise<RetrievedDocument[]> {
  if (documents.length <= topK) {
    return documents;
  }

  // For now, use a simple scoring mechanism based on similarity and content overlap
  // In production, replace with a cross-encoder model
  const scoredDocs = documents.map((doc) => {
    // Combine similarity score with query-term overlap
    const queryTerms = query.toLowerCase().split(/\s+/);
    const contentLower = doc.content.toLowerCase();
    const termMatches = queryTerms.filter((term) => contentLower.includes(term)).length;
    const termScore = queryTerms.length > 0 ? termMatches / queryTerms.length : 0;

    // Weighted combination: 70% similarity, 30% term overlap
    const rerankScore = doc.similarity * 0.7 + termScore * 0.3;

    return {
      ...doc,
      rerankScore,
    };
  });

  // Sort by rerank score and return top K
  return scoredDocs.sort((a, b) => (b.rerankScore || 0) - (a.rerankScore || 0)).slice(0, topK);
}

/**
 * Advanced re-ranking using cross-encoder (requires @xenova/transformers).
 * Uncomment and use this for production-quality re-ranking.
 *
 * @example
 * ```typescript
 * import { pipeline, Pipeline } from '@xenova/transformers';
 *
 * let reranker: Pipeline | null = null;
 *
 * async function initializeReranker() {
 *   if (!reranker) {
 *     reranker = await pipeline(
 *       'text-classification',
 *       'Xenova/cross-encoder-ms-marco-MiniLM-L-6-v2'
 *     );
 *   }
 *   return reranker;
 * }
 *
 * export async function rerankDocumentsAdvanced(
 *   query: string,
 *   documents: RetrievedDocument[],
 *   topK: number = 5
 * ): Promise<RetrievedDocument[]> {
 *   if (documents.length <= topK) {
 *     return documents;
 *   }
 *
 *   const model = await initializeReranker();
 *
 *   const scoredDocs = await Promise.all(
 *     documents.map(async (doc) => {
 *       try {
 *         const result = await model(query, doc.content);
 *         const score = Array.isArray(result) ? result[0]?.score : result.score;
 *         return {
 *           ...doc,
 *           rerankScore: score || 0,
 *         };
 *       } catch (error) {
 *         console.warn('Reranking error:', error);
 *         return { ...doc, rerankScore: doc.similarity };
 *       }
 *     })
 *   );
 *
 *   return scoredDocs
 *     .sort((a, b) => (b.rerankScore || 0) - (a.rerankScore || 0))
 *     .slice(0, topK);
 * }
 * ```
 */
