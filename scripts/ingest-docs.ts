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

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

import { envServer } from '../src/env.server';
import { chunkMarkdown } from '../src/lib/chatbot/chunking';
import { generateEmbeddings, storeEmbeddings, createOpenAIClient } from '../src/lib/chatbot/embeddings';

// Initialize clients
const supabase = createClient(
  envServer.NEXT_PUBLIC_SUPABASE_URL,
  envServer.SUPABASE_SERVICE_ROLE_KEY,
);

const openai = createOpenAIClient();

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
    const embeddings = await generateEmbeddings(chunks, openai);
    console.log(`  → Generated ${embeddings.length} embeddings`);
    
    // Store in database
    console.log(`  → Storing in database...`);
    await storeEmbeddings(supabase, embeddings);
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
  const { error } = await supabase
    .from('chatbot_documents')
    .delete()
    .eq('source_path', sourcePath);
  
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

