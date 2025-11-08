/**
 * Vector similarity search utilities for chatbot RAG
 * 
 * This module handles retrieving relevant document chunks based on
 * semantic similarity using vector search in Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { EmbeddingResult } from './embeddings';

type SupabaseChatbotClient = SupabaseClient;

export interface RetrievedDocument {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  sourcePath: string;
  chunkIndex: number;
  similarity: number;
}

/**
 * Retrieves relevant document chunks using vector similarity search.
 * 
 * @param supabase - Supabase client
 * @param queryEmbedding - Query embedding vector
 * @param limit - Maximum number of results to return (default: 5)
 * @param similarityThreshold - Minimum similarity score (0-1, default: 0.7)
 * @returns Array of retrieved documents with similarity scores
 */
export async function retrieveSimilarDocuments(
  supabase: SupabaseChatbotClient,
  queryEmbedding: number[],
  limit: number = 5,
  similarityThreshold: number = 0.7,
): Promise<RetrievedDocument[]> {
  // Try to use RPC function if available (requires creating the function in migration)
  // For now, use fallback method which works without RPC
  try {
    const { data, error } = await supabase.rpc('match_chatbot_documents', {
      query_embedding: queryEmbedding,
      match_threshold: similarityThreshold,
      match_count: limit,
    });
    
    if (!error && data) {
      return (data as any[]).map((doc: any) => ({
        id: doc.id,
        content: doc.content,
        metadata: doc.metadata ?? {},
        sourcePath: doc.source_path,
        chunkIndex: doc.chunk_index,
        similarity: doc.similarity ?? 0,
      }));
    }
  } catch (error) {
    // RPC function not available, use fallback
    console.warn('RPC function not available, using fallback query');
  }
  
  // Fallback: use manual similarity calculation
  return await retrieveSimilarDocumentsFallback(
    supabase,
    queryEmbedding,
    limit,
    similarityThreshold,
  );
}

/**
 * Fallback retrieval method using manual vector similarity calculation.
 * Used when the RPC function or vector index is not available.
 * 
 * @param supabase - Supabase client
 * @param queryEmbedding - Query embedding vector
 * @param limit - Maximum number of results
 * @param similarityThreshold - Minimum similarity score
 * @returns Array of retrieved documents
 */
async function retrieveSimilarDocumentsFallback(
  supabase: SupabaseChatbotClient,
  queryEmbedding: number[],
  limit: number,
  similarityThreshold: number,
): Promise<RetrievedDocument[]> {
  // Fetch all documents (this is inefficient but works as fallback)
  // In production, you should use the RPC function with vector index
  const { data, error } = await supabase
    .from('chatbot_documents')
    .select('id, content, metadata, source_path, chunk_index, embedding')
    .limit(1000); // Limit to avoid fetching too much
  
  if (error) {
    throw new Error(`Error retrieving documents: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    return [];
  }
  
  // Calculate cosine similarity for each document
  const documentsWithSimilarity = data
    .map((doc) => {
      // Parse embedding from string format
      const embedding = parseEmbedding(doc.embedding as unknown);
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      
      return {
        id: doc.id,
        content: doc.content,
        metadata: (doc.metadata as Record<string, unknown>) ?? {},
        sourcePath: doc.source_path,
        chunkIndex: doc.chunk_index,
        similarity,
      };
    })
    .filter((doc) => doc.similarity >= similarityThreshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
  
  return documentsWithSimilarity;
}

/**
 * Calculates cosine similarity between two vectors.
 * 
 * @param a - First vector
 * @param b - Second vector
 * @returns Cosine similarity (0-1)
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }
  
  return dotProduct / denominator;
}

/**
 * Parses embedding from various formats (string, array, etc.).
 * 
 * @param embedding - Embedding in unknown format
 * @returns Parsed embedding array
 */
function parseEmbedding(embedding: unknown): number[] {
  if (Array.isArray(embedding)) {
    return embedding;
  }
  
  if (typeof embedding === 'string') {
    // Try to parse as JSON array
    try {
      const parsed = JSON.parse(embedding);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Not JSON, try comma-separated or PostgreSQL array format
      // Remove brackets and parse
      const cleaned = embedding.replace(/[\[\]{}]/g, '');
      return cleaned.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
    }
  }
  
  // If it's an object with array-like properties, try to extract
  if (typeof embedding === 'object' && embedding !== null) {
    const arr = Object.values(embedding);
    if (arr.every((v) => typeof v === 'number')) {
      return arr as number[];
    }
  }
  
  throw new Error(`Unable to parse embedding: ${typeof embedding}`);
}

/**
 * Formats retrieved documents into context string for LLM.
 * Includes source citations with clickable links.
 * 
 * @param documents - Retrieved documents
 * @param includeMarkdownLinks - Whether to include markdown link format (default: true)
 * @returns Formatted context string
 */
export function formatContext(
  documents: RetrievedDocument[],
  includeMarkdownLinks: boolean = true
): string {
  if (documents.length === 0) {
    return 'No relevant documentation found.';
  }
  
  return documents
    .map((doc, index) => {
      const source = doc.sourcePath;
      const heading = doc.metadata.heading as string | undefined;
      
      // Create source link
      let sourceLink: string;
      if (includeMarkdownLinks && heading) {
        // Create anchor-friendly heading slug
        const anchor = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        sourceLink = `[${index + 1}] [${source}#${anchor}](${source}#${anchor})`;
      } else if (includeMarkdownLinks) {
        sourceLink = `[${index + 1}] [${source}](${source})`;
      } else {
        const section = heading ? ` (${heading})` : '';
        sourceLink = `[${index + 1}] Source: ${source}${section}`;
      }
      
      return `${sourceLink}\n${doc.content}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Formats sources as a separate citations list.
 * 
 * @param documents - Retrieved documents
 * @returns Formatted citations string
 */
export function formatSources(documents: RetrievedDocument[]): string {
  if (documents.length === 0) {
    return '';
  }
  
  return documents
    .map((doc, index) => {
      const source = doc.sourcePath;
      const heading = doc.metadata.heading as string | undefined;
      const section = heading ? ` - ${heading}` : '';
      
      return `${index + 1}. [${source}${section}](${source})`;
    })
    .join('\n');
}

