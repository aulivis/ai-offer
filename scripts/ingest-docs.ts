#!/usr/bin/env ts-node

/**
 * Document Ingestion Script
 *
 * This script processes markdown files from web/docs/ and ingests them
 * into Supabase for the chatbot RAG system.
 *
 * Usage:
 *   npm run ingest-docs
 *   or
 *   ts-node scripts/ingest-docs.ts
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

// Get environment variables directly (for ts-node compatibility)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Missing required environment variables:');
  if (!SUPABASE_URL) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  if (!OPENAI_API_KEY) console.error('  - OPENAI_API_KEY');
  console.error('\n💡 Make sure .env.local exists with these variables.');
  process.exit(1);
}

import { chunkMarkdown, type DocumentChunk } from '../src/lib/chatbot/chunking';

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Generates embeddings for document chunks using OpenAI.
 */
async function generateEmbeddings(
  chunks: DocumentChunk[],
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
          chunk: batch[j]!,
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
 */
async function storeEmbeddings(
  embeddings: Array<{ chunk: DocumentChunk; embedding: number[] }>,
): Promise<void> {
  // Prepare records for insertion
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

    const { error } = await supabase.from('chatbot_documents').insert(batch);

    if (error) {
      console.error(`Error storing embeddings batch ${i}-${i + batchSize}:`, error);
      throw error;
    }
  }
}

/**
 * Recursively finds all markdown files in a directory.
 */
function findMarkdownFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and other excluded directories
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          continue;
        }
        files.push(...findMarkdownFiles(fullPath, baseDir));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }

  return files;
}

/**
 * Gets relative path from base directory.
 */
function getRelativePath(fullPath: string, baseDir: string): string {
  return fullPath.replace(baseDir + '/', '').replace(/\\/g, '/');
}

/**
 * Processes a single markdown file.
 */
async function processFile(filePath: string, docsDir: string): Promise<void> {
  const relativePath = getRelativePath(filePath, docsDir);
  console.log(`Processing: ${relativePath}`);

  try {
    // Read file content
    const content = readFileSync(filePath, 'utf-8');

    // Chunk the document
    const chunks = chunkMarkdown(content, relativePath, 1000, 200);
    console.log(`  → Created ${chunks.length} chunks`);

    if (chunks.length === 0) {
      console.log(`  ⚠️  Skipping empty file`);
      return;
    }

    // Generate embeddings
    console.log(`  → Generating embeddings...`);
    const embeddings = await generateEmbeddings(chunks);
    console.log(`  → Generated ${embeddings.length} embeddings`);

    // Store in database
    console.log(`  → Storing in database...`);
    await storeEmbeddings(embeddings);
    console.log(`  ✅ Successfully ingested ${relativePath}`);
  } catch (error) {
    console.error(`  ❌ Error processing ${relativePath}:`, error);
    throw error;
  }
}

/**
 * Clears existing documents for a source file (for re-ingestion).
 */
async function clearExistingDocuments(sourcePath: string): Promise<void> {
  const { error } = await supabase.from('chatbot_documents').delete().eq('source_path', sourcePath);

  if (error) {
    console.warn(`Warning: Could not clear existing documents for ${sourcePath}:`, error);
  }
}

/**
 * Main ingestion function.
 */
async function ingestDocuments() {
  console.log('🚀 Starting document ingestion...\n');

  // Find docs directory (web/docs relative to script location)
  // __dirname might not work in ts-node, so use process.cwd() instead
  const docsDir = join(process.cwd(), 'docs');
  console.log(`📁 Docs directory: ${docsDir}\n`);

  // Find all markdown files
  const files = findMarkdownFiles(docsDir);
  console.log(`📄 Found ${files.length} markdown files\n`);

  if (files.length === 0) {
    console.log('⚠️  No markdown files found. Exiting.');
    return;
  }

  // Process each file
  for (const file of files) {
    const relativePath = getRelativePath(file, docsDir);

    // Clear existing documents for this file (allows re-ingestion)
    await clearExistingDocuments(relativePath);

    // Process file
    await processFile(file, docsDir);
    console.log(''); // Empty line for readability
  }

  console.log('✅ Document ingestion complete!');
  console.log(`\n💡 Tip: Run the following SQL to rebuild the vector index:`);
  console.log(`   SELECT rebuild_chatbot_documents_vector_index();`);
}

// Run if called directly
if (require.main === module) {
  ingestDocuments().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
