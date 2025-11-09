#!/usr/bin/env ts-node

/**
 * Script to clear all documents from the chatbot_documents table
 *
 * Usage:
 *   npm run clear-chatbot-documents
 *   or
 *   ts-node scripts/clear-chatbot-documents.ts
 */

import { createClient } from '@supabase/supabase-js';
import { join } from 'path';

// Load environment variables
require('dotenv').config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY);
  process.exit(1);
}

// Type assertions after validation
const supabaseUrl: string = SUPABASE_URL;
const supabaseKey: string = SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log('🗑️  Clearing chatbot_documents table...');

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get count before deletion
  const { count: beforeCount, error: countError } = await supabase
    .from('chatbot_documents')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Failed to count documents:', countError);
    process.exit(1);
  }

  const documentCount = beforeCount ?? 0;
  console.log(`📊 Found ${documentCount} documents in the table`);

  if (documentCount === 0) {
    console.log('✅ Table is already empty. Nothing to delete.');
    return;
  }

  // Delete all documents
  // Use a condition that matches all rows (delete all)
  const { error } = await supabase
    .from('chatbot_documents')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that matches all rows)

  if (error) {
    console.error('❌ Failed to clear chatbot_documents table:', error);
    process.exit(1);
  }

  console.log(`✅ Successfully cleared ${documentCount} documents from chatbot_documents table`);
  console.log('💡 You can now ingest the updated knowledge base using:');
  console.log('   npm run ingest-chatbot-knowledge-base');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
