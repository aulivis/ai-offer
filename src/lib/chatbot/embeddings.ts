/**
 * Embedding generation utilities for chatbot RAG
 * 
 * This module handles generating embeddings using OpenAI's embedding API
 * and managing them in Supabase.
 */

import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DocumentChunk } from './chunking';

import { envServer } from '@/env.server';

type SupabaseChatbotClient = SupabaseClient;

export interface EmbeddingResult {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  sourcePath: string;
  chunkIndex: number;
}

/**
 * Generates embeddings for document chunks using OpenAI.
 * 
 * @param chunks - Document chunks to generate embeddings for
 * @param openai - OpenAI client instance
 * @returns Array of embedding results
 */
export async function generateEmbeddings(
  chunks: DocumentChunk[],
  openai: OpenAI,
): Promise<Array<{ chunk: DocumentChunk; embedding: number[] }>> {
  const results: Array<{ chunk: DocumentChunk; embedding: number[] }> = [];
  
  // Process in batches to avoid rate limits
  const batchSize = 100;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch.map((chunk) => chunk.content),
      });
      
      // Map embeddings to chunks
      for (let j = 0; j < batch.length; j++) {
        results.push({
          chunk: batch[j],
          embedding: response.data[j]?.embedding ?? [],
        });
      }
      
      // Rate limiting: wait a bit between batches
      if (i + batchSize < chunks.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Error generating embeddings for batch ${i}-${i + batchSize}:`, error);
      throw error;
    }
  }
  
  return results;
}

/**
 * Stores embeddings in Supabase chatbot_documents table.
 * 
 * @param supabase - Supabase client with service role
 * @param embeddings - Embedding results to store
 */
export async function storeEmbeddings(
  supabase: SupabaseChatbotClient,
  embeddings: Array<{ chunk: DocumentChunk; embedding: number[] }>,
): Promise<void> {
  // Prepare records for insertion
  // Note: Supabase pgvector expects embeddings as arrays, not strings
  const records = embeddings.map(({ chunk, embedding }) => ({
    content: chunk.content,
    embedding, // Pass as array - Supabase will handle conversion
    metadata: {
      ...chunk.metadata,
      heading: chunk.metadata.heading,
    },
    source_path: chunk.metadata.sourcePath,
    chunk_index: chunk.metadata.chunkIndex,
  }));
  
  // Insert in batches to avoid payload size limits
  const batchSize = 50;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('chatbot_documents')
      .insert(batch);
    
    if (error) {
      console.error(`Error storing embeddings batch ${i}-${i + batchSize}:`, error);
      throw error;
    }
  }
}

/**
 * Generates embedding for a single query text.
 * 
 * @param query - Query text to generate embedding for
 * @param openai - OpenAI client instance
 * @returns Embedding vector
 */
export async function generateQueryEmbedding(
  query: string,
  openai: OpenAI,
): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  
  return response.data[0]?.embedding ?? [];
}

/**
 * Creates OpenAI client instance.
 * 
 * @returns OpenAI client
 */
export function createOpenAIClient(): OpenAI {
  if (!envServer.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  
  return new OpenAI({
    apiKey: envServer.OPENAI_API_KEY,
  });
}

