/**
 * Script to ingest the public knowledge base into the chatbot
 *
 * This script processes the public-knowledge-base.md file and ingests it
 * into the Supabase chatbot_documents table for RAG retrieval.
 *
 * Usage:
 *   npm run ingest-chatbot-knowledge-base
 *   or
 *   ts-node scripts/ingest-chatbot-knowledge-base.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import OpenAI from 'openai';
import { config } from 'dotenv';
import { chunkMarkdown } from '../src/lib/chatbot/chunking';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY);
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY environment variable');
  process.exit(1);
}

// Type assertions after validation
const supabaseUrl: string = SUPABASE_URL;
const supabaseKey: string = SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey: string = OPENAI_API_KEY;

const KNOWLEDGE_BASE_PATH = join(process.cwd(), 'docs', 'chatbot', 'public-knowledge-base.md');
const SOURCE_PATH = 'docs/chatbot/public-knowledge-base.md';

async function main() {
  console.log('🚀 Starting knowledge base ingestion...');
  console.log('📄 Reading knowledge base file:', KNOWLEDGE_BASE_PATH);

  // Read the knowledge base file
  let content: string;
  try {
    content = readFileSync(KNOWLEDGE_BASE_PATH, 'utf-8');
  } catch (error) {
    console.error('❌ Failed to read knowledge base file:', error);
    process.exit(1);
  }

  console.log('✅ Read knowledge base file:', content.length, 'characters');

  // Initialize clients
  const supabase = createClient(supabaseUrl, supabaseKey);
  const openai = new OpenAI({ apiKey: openaiApiKey });

  // Chunk the document
  console.log('📦 Chunking document...');
  const chunks = chunkMarkdown(content, SOURCE_PATH);
  console.log('✅ Created', chunks.length, 'chunks');

  // Delete existing documents with this source path
  console.log('🗑️  Deleting existing documents with source:', SOURCE_PATH);
  const { error: deleteError } = await supabase
    .from('chatbot_documents')
    .delete()
    .eq('source_path', SOURCE_PATH);

  if (deleteError) {
    console.error('❌ Failed to delete existing documents:', deleteError);
    process.exit(1);
  }
  console.log('✅ Deleted existing documents');

  // Generate embeddings and store documents
  console.log('🔮 Generating embeddings and storing documents...');
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      // Generate embedding using OpenAI (same as API)
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk.content,
      });
      const embedding = response.data[0]?.embedding ?? [];

      // Store in database
      const { error: insertError } = await supabase.from('chatbot_documents').insert({
        content: chunk.content,
        metadata: chunk.metadata,
        source_path: SOURCE_PATH,
        chunk_index: chunk.metadata.chunkIndex,
        embedding: embedding,
      });

      if (insertError) {
        console.error(`❌ Failed to insert chunk ${i + 1}:`, insertError);
        errorCount++;
      } else {
        successCount++;
        if ((i + 1) % 10 === 0) {
          console.log(`  ✅ Processed ${i + 1}/${chunks.length} chunks...`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing chunk ${i + 1}:`, error);
      errorCount++;
    }
  }

  console.log('\n📊 Ingestion complete!');
  console.log('  ✅ Success:', successCount);
  console.log('  ❌ Errors:', errorCount);
  console.log('  📄 Total chunks:', chunks.length);

  if (errorCount > 0) {
    console.warn('⚠️  Some chunks failed to ingest. Please check the errors above.');
    process.exit(1);
  }

  console.log('🎉 Knowledge base successfully ingested!');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
